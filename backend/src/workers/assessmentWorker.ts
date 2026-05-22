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
      if (assignment.status === 'cancelled') {
        logger.info(`Aborting job ${job.id} for Assignment: ${assignmentId} at startup because it was cancelled.`);
        return { success: false, reason: 'cancelled' };
      }

      // 2. Prepare Reference Material with optional Chunking
      let referenceText = '';
      let syllabusSummary: { course: string; topics: string[] } | undefined = undefined;
      if (assignment.uploadedFile?.parsedText) {
        assignmentEvents.emit('assignment:progress', assignmentId, 20, 'Processing syllabus reference material');
        const query = `${assignment.title} ${assignment.instructions || ''}`;
        referenceText = await chunkingService.processText(assignment.uploadedFile.parsedText, query);
        
        try {
          assignmentEvents.emit('assignment:progress', assignmentId, 25, 'Extracting syllabus topics');
          syllabusSummary = await aiService.extractSyllabusSummary(assignment.uploadedFile.parsedText);
        } catch (err: any) {
          logger.warn(`[Worker] Syllabus summary extraction failed: ${err.message}`);
        }
        
        assignmentEvents.emit('assignment:progress', assignmentId, 35, 'Syllabus reference material prepared');
      }

      // Check cancellation state again
      const currentAssignment = await Assignment.findById(assignmentId);
      if (!currentAssignment || currentAssignment.status === 'cancelled') {
        logger.info(`Aborting job ${job.id} for Assignment: ${assignmentId} before AI synthesis because it was cancelled.`);
        return { success: false, reason: 'cancelled' };
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
        syllabusSummary: syllabusSummary,
      });

      // 4. Strict Validation
      let totalQuestions = 0;
      let totalMarks = 0;
      if (generatedPaper && generatedPaper.sections) {
        for (const sec of generatedPaper.sections) {
          totalQuestions += sec.questions.length;
          for (const q of sec.questions) {
            totalMarks += q.marks;
          }
        }
      }

      const roundedTotalMarks = Math.round(totalMarks * 100) / 100;
      const expectedMarks = Math.round(assignment.marks * 100) / 100;

      if (totalQuestions !== assignment.totalQuestions || roundedTotalMarks !== expectedMarks) {
        throw new Error(
          `Strict validation mismatch before saving to database: generated ${totalQuestions} questions and ${roundedTotalMarks} marks, expected ${assignment.totalQuestions} questions and ${expectedMarks} marks.`
        );
      }

      // Double check cancellation state to avoid race condition
      const checkAssignment = await Assignment.findById(assignmentId);
      if (!checkAssignment || checkAssignment.status === 'cancelled') {
        logger.info(`Aborting job ${job.id} for Assignment: ${assignmentId} before saving because it was cancelled.`);
        return { success: false, reason: 'cancelled' };
      }

      // 5. Persistence
      assignmentEvents.emit('assignment:progress', assignmentId, 85, 'Formatting assessment details');
      
      checkAssignment.generatedPaper = generatedPaper as any;
      checkAssignment.status = 'completed';
      await checkAssignment.save();

      // Invalidate Redis cache after completion
      try {
        await redisConnection.del(`assignment:${assignmentId}`);
        logger.info(`[Worker] Invalidated Redis cache for assignment ${assignmentId} after completion`);
      } catch (cacheErr) {
        logger.warn(`[Worker] Failed to invalidate Redis cache for assignment ${assignmentId}: ${cacheErr}`);
      }

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
      
      try {
        const assignment = await Assignment.findById(assignmentId);
        if (assignment && assignment.status === 'cancelled') {
          logger.info(`Job ${job.id} failed but assignment was cancelled. Keeping cancelled status.`);
          return;
        }

        assignmentEvents.emit('assignment:failed', assignmentId, err.message);
        
        await Assignment.findByIdAndUpdate(assignmentId, {
          status: 'failed',
          errorMessage: err.message
        });

        // Invalidate cache on failure
        await redisConnection.del(`assignment:${assignmentId}`);
        logger.info(`[Worker] Invalidated Redis cache for assignment ${assignmentId} after failure`);
      } catch (dbErr: any) {
        logger.error(`Failed to update Assignment ${assignmentId} to failed status or invalidate cache: ${dbErr.message}`);
      }
    }
  });

  worker.on('error', (err) => {
    logger.error(`BullMQ worker general error: ${err.message}`);
  });

  logger.info('BullMQ worker service initialized');
  return worker;
};
