import logger from '../../config/logger';

export class AIResponseParser {
  static parse(rawText: string): any {
    let cleaned = rawText.trim();

    // 1. Remove markdown code fences if present (e.g. ```json ... ``` or ``` ...)
    if (cleaned.startsWith('```')) {
      const match = cleaned.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
      if (match && match[1]) {
        cleaned = match[1].trim();
      }
    }

    // 2. Direct JSON Parse Attempt
    try {
      return JSON.parse(cleaned);
    } catch (err) {
      logger.warn('Direct JSON parsing failed. Attempting regex boundary extraction...');
    }

    // 3. Fallback: Search for outer curly braces using regex
    try {
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const jsonCandidate = cleaned.substring(firstBrace, lastBrace + 1);
        return JSON.parse(jsonCandidate);
      }
    } catch (err) {
      logger.error('Regex boundary extraction failed to produce valid JSON.');
    }

    throw new Error('AI response could not be parsed into a valid JSON object.');
  }
}
