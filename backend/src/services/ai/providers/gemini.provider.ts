import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAIProvider, NonRetryableError } from '../types';
import logger from '../../../config/logger';

// Safely require generative-ai package.json to get the version
let sdkVersion = 'unknown';
try {
  sdkVersion = require('@google/generative-ai/package.json').version;
} catch (e) {
  // Fallback if require fails
}

export class GeminiProvider implements IAIProvider {
  name = 'Gemini';
  private client: GoogleGenerativeAI | null = null;
  private discoveredModels: string[] = [];

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.startsWith('gemini-placeholder') || apiKey === 'YOUR_GEMINI_API_KEY' || apiKey === 'sk-proj-placeholder') {
      logger.warn('Gemini API Key is missing or default placeholder. AI Provider will run in demo/mock mode.');
      this.client = null;
    } else {
      this.client = new GoogleGenerativeAI(apiKey);
      // Run dynamic model discovery in the background
      this.discoverModels().catch(() => {});
    }
  }

  private async discoverModels(): Promise<string[]> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !this.client) return [];
    try {
      // Fetch models dynamically from API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (response.ok) {
        const data = await response.json();
        const models = (data.models || []).map((m: any) => m.name.replace('models/', ''));
        logger.info(`[Gemini Startup] Discovered available models: ${models.join(', ')}`);
        this.discoveredModels = models;
        return models;
      } else {
        logger.warn(`Failed to discover models: API returned status ${response.status}`);
      }
    } catch (err: any) {
      logger.warn(`Could not fetch available models dynamically: ${err.message || err}`);
    }
    return [];
  }

  async generateQuestions(prompt: string, systemInstruction?: string): Promise<string> {
    if (!this.client) {
      logger.info('Demo Mode: Simulating AI Response generation.');
      return this.getMockResponse();
    }

    // Filter discovered models for compatible text generation/flash models
    const dynamicCompatible = this.discoveredModels.filter(
      (m) => m.includes('flash') && !m.includes('image') && !m.includes('audio')
    );

    const FALLBACK_CANDIDATES = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-flash-latest',
      'gemini-pro-latest'
    ];

    // Priority: Primary model 'gemini-2.5-flash', then dynamically discovered flash models, then other fallback candidates
    const MODEL_CANDIDATES = Array.from(new Set([
      'gemini-2.5-flash',
      ...dynamicCompatible,
      ...FALLBACK_CANDIDATES
    ]));

    let lastError: any = null;

    for (const modelName of MODEL_CANDIDATES) {
      logger.info(`Attempting generation with Gemini model: ${modelName} | SDK Version: ${sdkVersion}`);
      console.log(`Using Gemini model: ${modelName} | SDK Version: ${sdkVersion}`);

      try {
        const model = this.client.getGenerativeModel({
          model: modelName,
          systemInstruction: systemInstruction,
          generationConfig: {
            responseMimeType: 'application/json',
          },
        });

        const response = await model.generateContent(prompt);
        const text = response.response.text();
        return text;
      } catch (error: any) {
        lastError = error;
        logger.warn(`[Model Fallback Debug] Model ${modelName} failed: ${error.message || error}`);
        console.error(`[Model Fallback Debug] Model ${modelName} generation error:`, error);

        const errMsg = (error.message || '').toLowerCase();
        const status = error.status || error.statusCode || error.statusText || '';

        const is404 = errMsg.includes('404') || errMsg.includes('not found') || String(status).includes('404');
        
        if (is404) {
          logger.warn(`Model ${modelName} not found (404). Trying next candidate...`);
          continue;
        }

        // Check for other fatal error types
        const isQuota = errMsg.includes('quota') || errMsg.includes('429') || errMsg.includes('resource_exhausted') || errMsg.includes('resource exhausted') || String(status).includes('429');
        const isKeyInvalid = errMsg.includes('api_key_invalid') || errMsg.includes('api key not valid') || errMsg.includes('api key is invalid') || errMsg.includes('invalid api key') || errMsg.includes('invalid key') || String(status).includes('400');
        const isPermission = errMsg.includes('permission') || errMsg.includes('403') || errMsg.includes('permission_denied') || errMsg.includes('permission denied') || String(status).includes('403');

        if (isQuota || isKeyInvalid || isPermission) {
          logger.error(`Fatal, non-transient Gemini API error detected: ${error.message || error}. Aborting retries.`);
          throw new NonRetryableError(`Fatal Gemini Error: ${error.message || error}`);
        }

        // For other errors (like JSON parsing issues or connection drop), throw so it can bubble up to service retry loop
        throw error;
      }
    }

    // If we exhausted all candidates and all failed with 404
    logger.error('All Gemini model candidates exhausted and failed with 404 errors.');
    throw new NonRetryableError(`Fatal Gemini Error: All model candidates failed with 404. Last error: ${lastError?.message || lastError}`);
  }

  private getMockResponse(): string {
    return JSON.stringify({
      sections: [
        {
          title: "Section A: Multiple Choice Questions",
          instruction: "Answer all the questions. Each question carries 2 marks.",
          questions: [
            {
              text: "Which of the following is a key feature of Node.js?",
              type: "MCQ",
              options: ["Synchronous execution", "Event-driven, non-blocking I/O", "Multi-threaded design", "Heavy CPU rendering"],
              correctAnswer: "Event-driven, non-blocking I/O",
              difficulty: "Easy",
              marks: 2
            },
            {
              text: "Explain the main differences between SQL and NoSQL databases.",
              type: "Short Answer",
              difficulty: "Medium",
              marks: 5
            }
          ]
        },
        {
          title: "Section B: Short Answer Questions",
          instruction: "Attempt any two questions.",
          questions: [
            {
              text: "Describe the event loop in Node.js.",
              type: "Short Answer",
              difficulty: "Medium",
              marks: 5
            },
            {
              text: "What is the purpose of Redis in a distributed queue system like BullMQ?",
              type: "Long Answer",
              difficulty: "Hard",
              marks: 8
            }
          ]
        }
      ]
    }, null, 2);
  }
}
