import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { Assignment } from '../models/Assignment';
import aiService from '../services/ai/ai.service';
import chunkingService from '../services/chunking.service';
import assignmentEvents from '../utils/events';
import logger from '../config/logger';

export const startAssessmentWorker = () => {
  const worker = new Worker(
    'assessment-generation',
    async (job: Job) => {
      const { assignmentId, variant } = job.data;
      const startTime = Date.now();

      logger.info(`Starting execution of job ${job.id} for Assignment: ${assignmentId}`);
      assignmentEvents.emit('assignment:started', assignmentId, job.id || '');

      // 1. Fetch assignment details
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        throw new Error(`Assignment not found: ${assignmentId}`);
      }

      // 2. Prepare Reference Material with optional Chunking
      let referenceText = '';
      if (assignment.uploadedFile?.parsedText) {
        assignmentEvents.emit('assignment:progress', assignmentId, 20, 'Compressing reference text');
        referenceText = await chunkingService.processText(assignment.uploadedFile.parsedText);
        assignmentEvents.emit('assignment:progress', assignmentId, 35, 'Reference material prepared');
      }

      // 3. Dispatch to AI orchestrator (includes sanitization, Zod checks, and 3x retries)
      assignmentEvents.emit('assignment:progress', assignmentId, 45, 'Synthesizing assessment questions');
      
      const generatedPaper = await aiService.generateAssessment({
        title: assignment.title,
        questionTypes: assignment.questionTypes,
        totalQuestions: assignment.totalQuestions,
        marks: assignment.marks,
        difficulty: assignment.difficulty,
        instructions: assignment.instructions,
        referenceText: referenceText || undefined,
        variant: variant,
      });

      // 4. Persistence
      assignmentEvents.emit('assignment:progress', assignmentId, 85, 'Formatting assessment details');
      
      assignment.generatedPaper = generatedPaper;
      assignment.status = 'completed';
      await assignment.save();

      const duration = Date.now() - startTime;
      assignmentEvents.emit('assignment:completed', assignmentId, duration);
      logger.info(`Successfully completed generation of Assignment: ${assignmentId} in ${duration}ms`);
      return { success: true, duration };
    },
    {
      connection: redisConnection,
      concurrency: 2, // Process up to 2 assessments in parallel
    }
  );

  worker.on('failed', async (job: Job | undefined, err: Error) => {
    if (job) {
      const { assignmentId } = job.data;
      logger.error(`Job ${job.id} failed: ${err.message}`);
      assignmentEvents.emit('assignment:failed', assignmentId, err.message);
      
      try {
        await Assignment.findByIdAndUpdate(assignmentId, {
          status: 'failed',
          errorMessage: err.message
        });
      } catch (dbErr: any) {
        logger.error(`Failed to update Assignment ${assignmentId} to failed status: ${dbErr.message}`);
      }
    }
  });

  worker.on('error', (err) => {
    logger.error(`BullMQ worker general error: ${err.message}`);
  });

  logger.info('BullMQ worker service initialized');
  return worker;
};
