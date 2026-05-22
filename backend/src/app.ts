import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import assignmentRoutes from './routes/assignment.routes';
import logger from './config/logger';

const app = express();

// Configure CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Http Request Logger Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.http(`${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ success: true, status: 'healthy', timestamp: new Date() });
});

// REST API routes
app.use('/api/assignments', assignmentRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Unhandled Express Error: ${err.message || err}`);
  
  if (err.name === 'MulterError' || err.code === 'LIMIT_FILE_SIZE') {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'File size limit exceeded. Max size allowed is 10MB.'
      : `File upload error: ${err.message}`;
    res.status(400).json({ success: false, message });
    return;
  }

  if (err.message && (err.message.includes('Only PDF and TXT') || err.message.includes('allowed'))) {
    res.status(400).json({ success: false, message: err.message });
    return;
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

export default app;
