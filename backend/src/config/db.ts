import mongoose from 'mongoose';
import logger from './logger';

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vedaai';

  try {
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
  } catch (error) {
    logger.error(`Failed to connect to MongoDB: ${error}`);
    // If mongo is missing, we'll log it but don't exit in dev mode to allow fallback previews.
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};
