import { GeminiProvider } from './providers/gemini.provider';
import { PromptBuilder } from './prompt.builder';
import { AIResponseParser } from './parser';
import { AIResponseValidator } from './validator';
import { IPaperInput, RegenerationVariant, NonRetryableError } from './types';
import logger from '../../config/logger';

export class AIService {
  private provider = new GeminiProvider();

  async generateAssessment(params: {
    title: string;
    questionTypes: string[];
    totalQuestions: number;
    marks: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    instructions?: string;
    referenceText?: string;
    variant?: RegenerationVariant;
  }): Promise<IPaperInput> {
    const systemInstruction = PromptBuilder.buildSystemInstruction();
    let userPrompt = PromptBuilder.buildUserPrompt(params);

    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      attempt++;
      logger.info(`AI Generation Attempt ${attempt}/${maxRetries} using ${this.provider.name}...`);

      try {
        const rawResponse = await this.provider.generateQuestions(userPrompt, systemInstruction);
        const parsedData = AIResponseParser.parse(rawResponse);
        const validatedPaper = AIResponseValidator.validate(parsedData);

        // Success! Perform quick post-validation check to verify total questions count and marks sum
        let totalMarksGenerated = 0;
        let totalQuestionsGenerated = 0;
        for (const sec of validatedPaper.sections) {
          totalQuestionsGenerated += sec.questions.length;
          for (const q of sec.questions) {
            totalMarksGenerated += q.marks;
          }
        }

        logger.info(`AI Generation successful. Questions: ${totalQuestionsGenerated}/${params.totalQuestions}, Marks: ${totalMarksGenerated}/${params.marks}`);
        return validatedPaper;
      } catch (error: any) {
        logger.warn(`AI Generation Attempt ${attempt} failed: ${error.message || error}`);

        if (error instanceof NonRetryableError || error.name === 'NonRetryableError') {
          logger.error(`Critical non-retryable error: ${error.message || error}. Aborting execution.`);
          throw error;
        }

        if (attempt >= maxRetries) {
          logger.error('All AI Generation retries exhausted. Failing job.');
          throw new Error(`AI Generation failed after ${maxRetries} attempts. Last error: ${error.message}`);
        }

        // Adjust the prompt for the next attempt by supplying the error feedback
        userPrompt += `\n\n⚠️ IMPORTANT CORRECTION: Your previous response was invalid.
Error details: ${error.message || error}
Please correct the errors, enforce the JSON schema format, and regenerate. Do NOT include markdown blocks.`;
      }
    }

    throw new Error('AI Generation failed unexpectedly.');
  }
}

export const aiService = new AIService();
export default aiService;
