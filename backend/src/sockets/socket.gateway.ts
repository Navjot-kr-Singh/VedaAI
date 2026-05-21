import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import logger from '../config/logger';

export class SocketGateway {
  private io: SocketIOServer | null = null;

  init(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.io.on('connection', (socket) => {
      logger.info(`Socket client connected: ${socket.id}`);

      // Allow client to join assignment-specific rooms for progress updates
      socket.on('join-assignment', (assignmentId: string) => {
        socket.join(assignmentId);
        logger.debug(`Socket ${socket.id} joined assignment room: ${assignmentId}`);
      });

      socket.on('disconnect', () => {
        logger.info(`Socket client disconnected: ${socket.id}`);
      });
    });
  }

  emitToAssignment(assignmentId: string, event: string, data: any) {
    if (this.io) {
      // Emit to the specific assignment room
      this.io.to(assignmentId).emit(event, data);
      
      // Also broadcast a global event to update the dashboard lists
      this.io.emit('assignment:update', { assignmentId, ...data });
    }
  }
}

export const socketGateway = new SocketGateway();
export default socketGateway;
