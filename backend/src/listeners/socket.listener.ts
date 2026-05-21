import assignmentEvents from '../utils/events';
import { socketGateway } from '../sockets/socket.gateway';

export const initSocketListener = () => {
  assignmentEvents.on('assignment:queued', (assignmentId: string) => {
    socketGateway.emitToAssignment(assignmentId, 'status', {
      status: 'queued',
      progress: 0,
      message: 'Queued in generation pool',
    });
  });

  assignmentEvents.on('assignment:started', (assignmentId: string) => {
    socketGateway.emitToAssignment(assignmentId, 'status', {
      status: 'processing',
      progress: 10,
      message: 'Reading reference material',
    });
  });

  assignmentEvents.on('assignment:progress', (assignmentId: string, progress: number, message: string) => {
    socketGateway.emitToAssignment(assignmentId, 'status', {
      status: progress >= 40 ? 'generating' : 'processing',
      progress,
      message,
    });
  });

  assignmentEvents.on('assignment:completed', (assignmentId: string, durationMs: number) => {
    socketGateway.emitToAssignment(assignmentId, 'status', {
      status: 'completed',
      progress: 100,
      message: 'Assessment paper generated successfully!',
      durationMs,
    });
  });

  assignmentEvents.on('assignment:failed', (assignmentId: string, errorMessage: string) => {
    socketGateway.emitToAssignment(assignmentId, 'status', {
      status: 'failed',
      progress: 100,
      message: errorMessage,
    });
  });
};
