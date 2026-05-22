import { GeminiProvider } from './providers/gemini.provider';
import { PromptBuilder } from './prompt.builder';
import { AIResponseParser } from './parser';
import { AIResponseValidator } from './validator';
import { IPaperInput, RegenerationVariant, NonRetryableError } from './types';
import { normalizeAssessment } from '../../utils/normalizeAssessment';
import logger from '../../config/logger';

export class AIService {
  private provider = new GeminiProvider();

  generateMockAssessment(params: {
    title: string;
    questionTypes: string[];
    totalQuestions: number;
    marks: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
  }): IPaperInput {
    const titleKeywords = params.title
      .split(/\s+/)
      .map(w => w.replace(/[^a-zA-Z0-9]/g, ''))
      .filter(w => w.length > 2 && !['exam', 'test', 'quiz', 'class', 'grade', 'assessment', 'final', 'midterm', 'paper', 'questions', 'answers'].includes(w.toLowerCase()));
    const topicName = titleKeywords.length > 0 ? titleKeywords.join(' ') : params.title;

    const allowedTypes = params.questionTypes.length > 0 ? params.questionTypes : ['MCQ', 'Short Answer', 'Long Answer', 'Fill in the blanks'];

    const questions: any[] = [];
    for (let i = 0; i < params.totalQuestions; i++) {
      const type = allowedTypes[i % allowedTypes.length];
      const difficulty = params.difficulty;
      const marks = 1; // Normalization will rebalance marks to exact total

      if (type === 'MCQ') {
        const mcqTemplates = [
          {
            text: `Which of the following is a primary characteristic or core principle of ${topicName}?`,
            options: [
              `High-efficiency modular design suited for ${topicName}`,
              `Strict synchronous sequential execution limits`,
              `Legacy single-node dependency constraints`,
              `Ad-hoc unmanaged system execution loops`
            ],
            correctAnswer: `High-efficiency modular design suited for ${topicName}`
          },
          {
            text: `What is the main advantage of utilizing ${topicName} in modern professional environments?`,
            options: [
              `Increased execution latency and thread overhead`,
              `Optimized resource utilization and scalable operation`,
              `Manual memory allocation and complex pointer arithmetic`,
              `Complete deprecation of network security layers`
            ],
            correctAnswer: `Optimized resource utilization and scalable operation`
          },
          {
            text: `In the context of ${topicName}, what does the primary system controller manage?`,
            options: [
              `Synchronous filesystem lock states`,
              `Event loops and asynchronous scheduling actions`,
              `Pre-allocated static stack segments`,
              `External database query planning indexes`
            ],
            correctAnswer: `Event loops and asynchronous scheduling actions`
          },
          {
            text: `Which component plays the most critical role in optimizing performance within ${topicName}?`,
            options: [
              `The centralized state management store`,
              `The local browser cookies database`,
              `The background disk defragmentation service`,
              `The remote virtual network interface controller`
            ],
            correctAnswer: `The centralized state management store`
          }
        ];
        const template = mcqTemplates[i % mcqTemplates.length];
        questions.push({
          text: template.text,
          type: 'MCQ',
          options: template.options,
          correctAnswer: template.correctAnswer,
          difficulty,
          marks
        });
      } else if (type === 'Fill in the blanks') {
        const fillTemplates = [
          `The primary execution model of ${topicName} relies on ____________ configuration mechanisms to maintain state.`,
          `In ${topicName}, the ____________ layer is responsible for processing system transactions and handling data.`,
          `A key metric for evaluating the performance of ${topicName} is the total ____________ processed per second.`,
          `To ensure maximum scalability, ${topicName} employs a ____________ control layout architecture.`
        ];
        questions.push({
          text: fillTemplates[i % fillTemplates.length],
          type: 'Fill in the blanks',
          difficulty,
          marks
        });
      } else if (type === 'Long Answer') {
        const longTemplates = [
          `Discuss the architectural design of ${topicName} in detail. Compare it with alternative standards and analyze its pros and cons in large scale systems.`,
          `Provide a comprehensive case study explaining how ${topicName} can be successfully integrated into a real-world enterprise infrastructure.`,
          `Evaluate the security vulnerabilities associated with ${topicName} deployment, and outline a detailed mitigation plan.`,
          `Analyze the evolution of ${topicName} over the past decade, highlighting major milestones and future trends.`
        ];
        questions.push({
          text: longTemplates[i % longTemplates.length],
          type: 'Long Answer',
          difficulty,
          marks
        });
      } else {
        const shortTemplates = [
          `Explain the core concepts and historical background of ${topicName}.`,
          `Describe how ${topicName} handles resource optimization and synchronization.`,
          `What are the three most common use-cases for ${topicName} in commercial applications?`,
          `Summarize the key challenges engineers face when scaling a ${topicName} system.`
        ];
        questions.push({
          text: shortTemplates[i % shortTemplates.length],
          type: 'Short Answer',
          difficulty,
          marks
        });
      }
    }

    const questionsByType: { [key: string]: any[] } = {};
    questions.forEach(q => {
      if (!questionsByType[q.type]) {
        questionsByType[q.type] = [];
      }
      questionsByType[q.type].push(q);
    });

    const sections = Object.entries(questionsByType).map(([type, qs], idx) => {
      let sectionTitle = `Section ${String.fromCharCode(65 + idx)}: ${type} Questions`;
      let sectionInstruction = `Answer all the questions in this section.`;
      if (type === 'MCQ') {
        sectionInstruction = `Select the single best option for each question.`;
      } else if (type === 'Short Answer') {
        sectionInstruction = `Provide concise explanations in 2-3 sentences.`;
      } else if (type === 'Long Answer') {
        sectionInstruction = `Provide detailed, structured explanations.`;
      } else if (type === 'Fill in the blanks') {
        sectionInstruction = `Fill in the missing words in the statements.`;
      }
      return {
        title: sectionTitle,
        instruction: sectionInstruction,
        questions: qs
      };
    });

    const mockPaper = { sections };

    return normalizeAssessment(
      mockPaper,
      params.totalQuestions,
      params.marks,
      allowedTypes,
      params.difficulty
    );
  }

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
    if (this.provider.isDemoMode()) {
      logger.info('Demo Mode: Simulating dynamic AI generation with a brief delay.');
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return this.generateMockAssessment(params);
    }

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
        
        // Normalize BEFORE validating to ensure options and counts are fixed
        const normalizedPaper = normalizeAssessment(
          parsedData,
          params.totalQuestions,
          params.marks,
          params.questionTypes,
          params.difficulty
        );

        const validatedPaper = AIResponseValidator.validate(normalizedPaper);

        logger.info(`AI Generation successful. Questions: ${params.totalQuestions}, Marks: ${params.marks}`);
        return validatedPaper;
      } catch (error: any) {
        logger.warn(`AI Generation Attempt ${attempt} failed: ${error.message || error}`);

        // Graceful fallback to Mock mode if quota limits / 429 are hit
        const errMsg = (error.message || '').toLowerCase();
        const isQuota = errMsg.includes('quota') || errMsg.includes('429') || errMsg.includes('resource_exhausted') || errMsg.includes('resource exhausted') || error.message?.includes('RESOURCE_EXHAUSTED');
        if (isQuota) {
          logger.warn(`[AI Service] Quota limit exceeded / 429. Falling back automatically to dynamic Mock Generation Mode!`);
          return this.generateMockAssessment(params);
        }

        if (error instanceof NonRetryableError || error.name === 'NonRetryableError') {
          logger.error(`Critical non-retryable error: ${error.message || error}. Aborting execution.`);
          throw error;
        }

        if (attempt >= maxRetries) {
          logger.error('All AI Generation retries exhausted. Failing job.');
          throw new Error(`AI Generation failed after ${maxRetries} attempts. Last error: ${error.message}`);
        }

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
