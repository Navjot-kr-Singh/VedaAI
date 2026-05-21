import assignmentEvents from '../utils/events';
import { Assignment } from '../models/Assignment';
import logger from '../config/logger';

export const initDbListener = () => {
  assignmentEvents.on('assignment:queued', async (assignmentId: string) => {
    try {
      await Assignment.findByIdAndUpdate(assignmentId, {
        status: 'queued',
        errorMessage: null,
      });
    } catch (err) {
      logger.error(`DbListener error on queued: ${err}`);
    }
  });

  assignmentEvents.on('assignment:started', async (assignmentId: string, jobId: string) => {
    try {
      await Assignment.findByIdAndUpdate(assignmentId, {
        status: 'processing',
        jobId,
        startedAt: new Date(),
        errorMessage: null,
      });
    } catch (err) {
      logger.error(`DbListener error on started: ${err}`);
    }
  });

  assignmentEvents.on('assignment:progress', async (assignmentId: string, progress: number) => {
    try {
      // If progress is advanced, set status to generating questions
      if (progress >= 40) {
        await Assignment.findByIdAndUpdate(assignmentId, {
          status: 'generating',
        });
      }
    } catch (err) {
      logger.error(`DbListener error on progress: ${err}`);
    }
  });

  assignmentEvents.on('assignment:completed', async (assignmentId: string, durationMs: number) => {
    try {
      await Assignment.findByIdAndUpdate(assignmentId, {
        status: 'completed',
        completedAt: new Date(),
        processingDurationMs: durationMs,
        errorMessage: null,
      });
    } catch (err) {
      logger.error(`DbListener error on completed: ${err}`);
    }
  });

  assignmentEvents.on('assignment:failed', async (assignmentId: string, errorMessage: string) => {
    try {
      const assignment = await Assignment.findById(assignmentId);
      const start = assignment?.startedAt || assignment?.createdAt || new Date();
      const duration = Date.now() - start.getTime();

      await Assignment.findByIdAndUpdate(assignmentId, {
        status: 'failed',
        completedAt: new Date(),
        processingDurationMs: duration,
        errorMessage: errorMessage,
      });
    } catch (err) {
      logger.error(`DbListener error on failed: ${err}`);
    }
  });
};
