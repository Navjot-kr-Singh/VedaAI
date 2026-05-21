import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import logger from '../config/logger';

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.').replace(/^(body|query|params)\./, ''),
          message: err.message,
        }));
        
        logger.warn(`Request validation failed on ${req.method} ${req.originalUrl}: ${JSON.stringify(formattedErrors)}`);
        
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: formattedErrors,
        });
        return;
      }
      
      logger.error(`Unexpected validation middleware error: ${error}`);
      res.status(500).json({ success: false, message: 'Internal server validation error' });
    }
  };
};
