import { GeminiProvider } from './ai/providers/gemini.provider';
import logger from '../config/logger';

export class ChunkingService {
  private provider = new GeminiProvider();
  private chunkSize = 3000;
  private overlap = 300;

  async processText(text: string): Promise<string> {
    if (!text || text.trim().length === 0) {
      return '';
    }

    const charCount = text.length;
    logger.info(`Processing uploaded text. Total characters: ${charCount}`);

    // If the text is small, no need to chunk
    if (charCount <= 4000) {
      logger.info('Text size is within threshold. Using original text without chunking.');
      return text;
    }

    logger.info('Text exceeds threshold. Initiating chunking and summarization...');
    const chunks = this.createChunks(text);
    logger.info(`Created ${chunks.length} chunks of text.`);

    const summaries: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      logger.info(`Summarizing chunk ${i + 1}/${chunks.length}...`);
      try {
        const summary = await this.summarizeChunk(chunks[i]);
        summaries.push(`[Part ${i + 1} Summary]: ${summary}`);
      } catch (err) {
        logger.error(`Failed to summarize chunk ${i + 1}: ${err}`);
        summaries.push(`[Part ${i + 1} Summary]: (Unable to summarize due to error)`);
      }
    }

    logger.info('Summarization complete. Joining summaries.');
    return summaries.join('\n\n');
  }

  private createChunks(text: string): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = start + this.chunkSize;
      const chunk = text.substring(start, end);
      chunks.push(chunk);
      start += this.chunkSize - this.overlap;
    }

    return chunks;
  }

  private async summarizeChunk(chunk: string): Promise<string> {
    const systemInstruction = 'You are a teaching assistant helper. Summarize the key teaching topics, definitions, formulas, and vocabulary in this text into 2-3 dense sentences. Be extremely concise.';
    const userPrompt = `Summarize this text: \n\n${chunk}`;

    try {
      const result = await this.provider.generateQuestions(userPrompt, systemInstruction);
      return result.trim();
    } catch (err) {
      logger.error(`Error in summarizeChunk: ${err}`);
      throw err;
    }
  }
}

export const chunkingService = new ChunkingService();
export default chunkingService;
