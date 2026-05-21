import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';
import { RegenerationVariant } from '../services/ai/types';
import logger from '../config/logger';

export const assessmentQueue = new Queue('assessment-generation', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true, // Keep clean
    removeOnFail: false, // Save failed jobs for dashboard analysis
  },
});

export const addGenerationJob = async (assignmentId: string, variant: RegenerationVariant = 'default') => {
  try {
    const job = await assessmentQueue.add(
      `generate-${assignmentId}`,
      { assignmentId, variant },
      { jobId: `${assignmentId}-${variant}-${Date.now()}` }
    );
    logger.info(`Queued assessment job ${job.id} for Assignment: ${assignmentId} with variant: ${variant}`);
    return job;
  } catch (error) {
    logger.error(`Failed to enqueue job for Assignment ${assignmentId}: ${error}`);
    throw error;
  }
};
