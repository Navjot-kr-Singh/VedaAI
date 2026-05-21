import assignmentEvents from '../utils/events';
import logger from '../config/logger';

export const initLoggerListener = () => {
  assignmentEvents.on('assignment:queued', (assignmentId: string) => {
    logger.info(`Event [assignment:queued] - Assignment ID: ${assignmentId}`);
  });

  assignmentEvents.on('assignment:started', (assignmentId: string, jobId: string) => {
    logger.info(`Event [assignment:started] - Assignment ID: ${assignmentId}, Job ID: ${jobId}`);
  });

  assignmentEvents.on('assignment:progress', (assignmentId: string, progress: number, message: string) => {
    logger.debug(`Event [assignment:progress] - Assignment ID: ${assignmentId}, Progress: ${progress}%, Msg: ${message}`);
  });

  assignmentEvents.on('assignment:completed', (assignmentId: string, durationMs: number) => {
    logger.info(`Event [assignment:completed] - Assignment ID: ${assignmentId}, Completed in ${durationMs}ms`);
  });

  assignmentEvents.on('assignment:failed', (assignmentId: string, errorMessage: string) => {
    logger.error(`Event [assignment:failed] - Assignment ID: ${assignmentId}, Error: ${errorMessage}`);
  });
};
