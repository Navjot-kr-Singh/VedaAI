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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

export default app;
