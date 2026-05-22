import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import { Assignment } from '../models/Assignment';
import { addGenerationJob, assessmentQueue } from '../queues/assessmentQueue';
import { pdfService } from '../services/pdf.service';
import { redisConnection } from '../config/redis';
import assignmentEvents from '../utils/events';
import logger from '../config/logger';

const CACHE_TTL = 3600; // 1 hour in seconds
const getCacheKey = (id: string) => `assignment:${id}`;

export class AssignmentController {
  // 1. Create assignment and queue AI job
  createAssignment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, dueDate, questionTypes, totalQuestions, marks, difficulty, instructions } = req.body;
      
      let parsedText = '';
      let fileMeta = undefined;

      if (req.file) {
        logger.info(`Extracting text from uploaded file: ${req.file.originalname} (${req.file.mimetype})`);
        try {
          if (req.file.mimetype === 'application/pdf') {
            const data = await pdfParse(req.file.buffer);
            parsedText = data.text;
          } else {
            parsedText = req.file.buffer.toString('utf-8');
          }
          
          const sanitizedFilename = req.file.originalname
            .replace(/[^a-zA-Z0-9.\-_]/g, '_')
            .replace(/\.\.+/g, '.');

          fileMeta = {
            filename: sanitizedFilename,
            path: 'memory_buffer', // stored in database parsedText
            mimetype: req.file.mimetype,
            parsedText: parsedText,
          };
          logger.info(`Text extraction successful. Total characters: ${parsedText.length}`);
        } catch (fileErr) {
          logger.error(`Failed to parse file upload: ${fileErr}`);
          res.status(400).json({ success: false, message: 'Failed to process uploaded file' });
          return;
        }
      }

      // Save as queued in MongoDB
      const assignment = new Assignment({
        title,
        dueDate: new Date(dueDate),
        questionTypes,
        totalQuestions: Number(totalQuestions),
        marks: Number(marks),
        difficulty,
        instructions,
        uploadedFile: fileMeta,
        status: 'queued',
      });

      await assignment.save();
      logger.info(`Saved Assignment schema: ${assignment._id}`);

      // Emit event
      assignmentEvents.emit('assignment:queued', assignment._id.toString());

      // Queue BullMQ job
      await addGenerationJob(assignment._id.toString(), 'default');

      res.status(201).json({
        success: true,
        message: 'Assignment created and enqueued for generation',
        data: assignment,
      });
    } catch (error: any) {
      logger.error(`Create assignment error: ${error.message || error}`);
      res.status(500).json({ success: false, message: 'Internal server error creating assignment' });
    }
  };

  // 2. Get list of assignments with search/filter
  getAssignments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { search, status } = req.query;
      const query: any = {};

      if (search) {
        query.$text = { $search: search as string };
      }

      if (status) {
        query.status = status as string;
      }

      const assignments = await Assignment.find(query)
        .select('-uploadedFile.parsedText') // Exclude heavy text payload for lists
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: assignments,
      });
    } catch (error: any) {
      logger.error(`Get assignments error: ${error.message || error}`);
      res.status(500).json({ success: false, message: 'Internal server error fetching assignments' });
    }
  };

  // 3. Get assignment by ID (uses Redis cache for completed papers)
  getAssignmentById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const cacheKey = getCacheKey(id);

      // Try reading from cache
      try {
        const cachedData = await redisConnection.get(cacheKey);
        if (cachedData) {
          logger.debug(`Redis cache hit for Assignment: ${id}`);
          res.status(200).json({
            success: true,
            data: JSON.parse(cachedData),
            cached: true,
          });
          return;
        }
      } catch (cacheErr) {
        logger.warn(`Redis cache get failed: ${cacheErr}`);
      }

      const assignment = await Assignment.findById(id);
      if (!assignment) {
        res.status(404).json({ success: false, message: 'Assignment not found' });
        return;
      }

      // If completed, save into Redis cache
      if (assignment.status === 'completed') {
        try {
          await redisConnection.setex(cacheKey, CACHE_TTL, JSON.stringify(assignment));
          logger.debug(`Cached Assignment: ${id} in Redis`);
        } catch (cacheErr) {
          logger.warn(`Redis cache set failed: ${cacheErr}`);
        }
      }

      res.status(200).json({
        success: true,
        data: assignment,
      });
    } catch (error: any) {
      logger.error(`Get assignment by ID error: ${error.message || error}`);
      res.status(500).json({ success: false, message: 'Internal server error fetching assignment details' });
    }
  };

  // 4. Delete assignment, clean up BullMQ queue, and invalidate cache
  deleteAssignment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const assignment = await Assignment.findByIdAndDelete(id);
      if (!assignment) {
        res.status(404).json({ success: false, message: 'Assignment not found' });
        return;
      }

      // Invalidate Redis cache
      try {
        await redisConnection.del(getCacheKey(id));
        logger.info(`Invalidated cache for Assignment: ${id}`);
      } catch (cacheErr) {
        logger.warn(`Redis cache invalidation failed: ${cacheErr}`);
      }

      // Scan and remove BullMQ jobs
      try {
        const statuses: ('active' | 'waiting' | 'delayed' | 'failed' | 'paused' | 'completed')[] = ['active', 'waiting', 'delayed', 'failed', 'paused'];
        const jobs = await assessmentQueue.getJobs(statuses);
        
        for (const job of jobs) {
          if (job.data?.assignmentId === id) {
            logger.info(`Removing job ${job.id} from queue for deleted Assignment: ${id}`);
            await job.remove();
          }
        }
      } catch (queueErr) {
        logger.error(`Failed to remove job from BullMQ queue during delete: ${queueErr}`);
      }

      res.status(200).json({
        success: true,
        message: 'Assignment deleted successfully',
      });
    } catch (error: any) {
      logger.error(`Delete assignment error: ${error.message || error}`);
      res.status(500).json({ success: false, message: 'Internal server error deleting assignment' });
    }
  };

  // 4b. Cancel assignment generation
  cancelAssignment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const assignment = await Assignment.findById(id);
      if (!assignment) {
        res.status(404).json({ success: false, message: 'Assignment not found' });
        return;
      }

      if (assignment.status === 'completed') {
        res.status(400).json({ success: false, message: 'Cannot cancel a completed assignment' });
        return;
      }

      // Update Mongo status to cancelled
      assignment.status = 'cancelled';
      assignment.errorMessage = undefined;
      await assignment.save();

      // Invalidate Redis cache
      try {
        await redisConnection.del(getCacheKey(id));
      } catch (cacheErr) {
        logger.warn(`Redis cache invalidation failed during cancel: ${cacheErr}`);
      }

      // Scan and remove BullMQ jobs
      try {
        const statuses: ('active' | 'waiting' | 'delayed' | 'failed' | 'paused' | 'completed')[] = ['active', 'waiting', 'delayed', 'failed', 'paused'];
        const jobs = await assessmentQueue.getJobs(statuses);
        
        for (const job of jobs) {
          if (job.data?.assignmentId === id) {
            logger.info(`Removing job ${job.id} from queue for Assignment: ${id}`);
            await job.remove();
          }
        }
      } catch (queueErr) {
        logger.error(`Failed to remove job from BullMQ queue: ${queueErr}`);
      }

      // Emit event
      assignmentEvents.emit('assignment:cancelled', id);

      res.status(200).json({
        success: true,
        message: 'Assignment generation cancelled successfully',
        data: assignment,
      });
    } catch (error: any) {
      logger.error(`Cancel assignment error: ${error.message || error}`);
      res.status(500).json({ success: false, message: 'Internal server error cancelling assignment' });
    }
  };

  // 5. Trigger AI regeneration with custom variant
  regenerateAssignment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { variant = 'default' } = req.query;

      const assignment = await Assignment.findById(id);
      if (!assignment) {
        res.status(404).json({ success: false, message: 'Assignment not found' });
        return;
      }

      // Update status to queued
      assignment.status = 'queued';
      assignment.errorMessage = undefined;
      await assignment.save();

      // Invalidate cache
      try {
        await redisConnection.del(getCacheKey(id));
      } catch (cacheErr) {
        logger.warn(`Redis cache invalidation failed: ${cacheErr}`);
      }

      // Emit event
      assignmentEvents.emit('assignment:queued', id);

      // Enqueue job with custom variant
      await addGenerationJob(id, variant as any);

      res.status(200).json({
        success: true,
        message: `Regeneration enqueued with variant: ${variant}`,
        data: assignment,
      });
    } catch (error: any) {
      logger.error(`Regenerate assignment error: ${error.message || error}`);
      res.status(500).json({ success: false, message: 'Internal server error queueing regeneration' });
    }
  };

  // 6. Generate and download PDF stream
  downloadPDF = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const assignment = await Assignment.findById(id);

      if (!assignment) {
        res.status(404).json({ success: false, message: 'Assignment not found' });
        return;
      }

      if (assignment.status !== 'completed' || !assignment.generatedPaper) {
        res.status(400).json({
          success: false,
          message: `Assessment is not generated yet. Current status: ${assignment.status}`,
        });
        return;
      }

      const pdfBuffer = await pdfService.generateAssessmentPDF(assignment);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="vedaai-assessment-${assignment.title.toLowerCase().replace(/\s+/g, '-')}.pdf"`
      );
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.send(pdfBuffer);
    } catch (error: any) {
      logger.error(`Download PDF error: ${error.message || error}`);
      res.status(500).json({ success: false, message: 'Internal server error generating PDF' });
    }
  };
}

export const assignmentController = new AssignmentController();
export default assignmentController;
