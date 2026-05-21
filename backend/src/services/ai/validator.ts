import { PaperZodSchema, IPaperInput } from './types';
import logger from '../../config/logger';

export class AIResponseValidator {
  static validate(data: any): IPaperInput {
    const result = PaperZodSchema.safeParse(data);

    if (result.success) {
      return result.data;
    }

    // Format errors into a detailed, readable list for logging and retry loops
    const errorDetails = result.error.errors
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join('\n');

    logger.error(`Generated paper failed Zod validation schema:\n${errorDetails}`);
    throw new Error(errorDetails);
  }
}
