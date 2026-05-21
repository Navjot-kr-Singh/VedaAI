import http from 'http';
import dotenv from 'dotenv';

// Load env variables first
dotenv.config();

import app from './app';
import { connectDB } from './config/db';
import { socketGateway } from './sockets/socket.gateway';
import { initListeners } from './listeners';
import { startAssessmentWorker } from './workers/assessmentWorker';
import logger from './config/logger';

const PORT = process.env.PORT || 4001;

const bootstrap = async () => {
  try {
    // 1. Connect MongoDB
    await connectDB();

    // 2. Create HTTP Server
    const server = http.createServer(app);

    // 3. Initialize Socket Gateway
    socketGateway.init(server);
    logger.info('Socket.IO Gateway initialized');

    // 4. Initialize Event Listeners (DB, Log, Sockets)
    initListeners();
    logger.info('Event listeners initialized');

    // 5. Initialize BullMQ Workers
    startAssessmentWorker();

    // 6. Listen on PORT 4001
    server.listen(PORT, () => {
      logger.info(`VedaAI backend server successfully running on port ${PORT}`);
    });
  } catch (error) {
    logger.error(`Critical backend startup failure: ${error}`);
    process.exit(1);
  }
};

bootstrap();
