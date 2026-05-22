import logger from '../config/logger';

export class ChunkingService {
  private chunkSize = 1500;
  private overlap = 200;

  /**
   * Processes the syllabus text: cleans it, chunks it, and retrieves the most relevant chunks 
   * based on the assignment query. If the syllabus is small (<= 8000 chars), it uses the full cleaned text.
   */
  async processText(text: string, query?: string): Promise<string> {
    if (!text || text.trim().length === 0) {
      return '';
    }

    const cleanedText = this.cleanText(text);
    const charCount = cleanedText.length;
    logger.info(`[Syllabus Processing] Cleaned syllabus character count: ${charCount}`);

    // If the syllabus is small, pass the full text directly
    if (charCount <= 8000) {
      logger.info('[Syllabus Processing] Syllabus is small. Using full cleaned text.');
      return cleanedText;
    }

    logger.info('[Syllabus Processing] Syllabus exceeds threshold. Chunking and retrieving relevant sections...');
    const chunks = this.createChunks(cleanedText);
    const relevantChunks = this.retrieveRelevantChunks(chunks, query || '', 6);

    logger.info(`[Syllabus Processing] Retrieved ${relevantChunks.length} relevant chunks out of ${chunks.length}.`);
    
    // Combine chunks with clear metadata markers
    return relevantChunks.map((chunk, idx) => `[Syllabus Excerpt ${idx + 1}]:\n${chunk}`).join('\n\n');
  }

  /**
   * Cleans syllabus text by removing repeated page headers, page numbers, separators, 
   * garbage OCR artifacts, and normalizing spaces/newlines.
   */
  public cleanText(text: string): string {
    if (!text) return '';
    
    // 1. Normalize line endings
    let cleaned = text.replace(/\r\n/g, '\n');
    
    // 2. Remove typical page headers/footers/page numbers
    cleaned = cleaned.replace(/Page\s+\d+(\s+of\s+\d+)?/gi, '');
    cleaned = cleaned.replace(/Page\s+-\s+\d+\s+-/gi, '');
    cleaned = cleaned.replace(/Document\s+generated\s+on\s+.*$/gim, '');
    
    // 3. Remove separator lines (repeated dashes, stars, underscores)
    cleaned = cleaned.replace(/^[ \t]*[-*_]{3,}[ \t]*$/gm, '');

    // 4. Remove common garbage/non-printable/weird ASCII characters
    cleaned = cleaned.replace(/[^\x20-\x7E\n\t]/g, ' ');

    // 5. Normalize spacing (multiple spaces to single space, multiple newlines to max 2 newlines)
    cleaned = cleaned.replace(/[ \t]+/g, ' ');
    cleaned = cleaned.replace(/\n\s*\n\s*\n+/g, '\n\n');
    cleaned = cleaned.trim();
    
    return cleaned;
  }

  /**
   * Creates overlapping text chunks.
   */
  private createChunks(text: string): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = start + this.chunkSize;
      const chunk = text.substring(start, end);
      chunks.push(chunk.trim());
      start += this.chunkSize - this.overlap;
    }

    return chunks;
  }

  /**
   * Computes matching keyword frequency to retrieve only the top relevant chunks.
   * If no query is provided or no matches occur, falls back to the first few chunks.
   */
  private retrieveRelevantChunks(chunks: string[], query: string, limit: number = 6): string[] {
    if (!query || query.trim().length === 0) {
      return chunks.slice(0, limit);
    }

    // Stop words to filter out before keyword matching
    const stopWords = new Set([
      'the', 'and', 'for', 'with', 'a', 'an', 'of', 'to', 'in', 'on', 'at', 'by', 'from', 'is', 'are', 'was', 'were', 
      'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'question', 'questions', 'marks', 'exam', 
      'test', 'assessment', 'paper', 'generate', 'create', 'make', 'syllabus', 'topics', 'chapters'
    ]);

    // Tokenize query words
    const words = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));

    if (words.length === 0) {
      logger.debug('[Syllabus Processing] No query keywords left after filtering stop words. Using first chunks.');
      return chunks.slice(0, limit);
    }

    logger.info(`[Syllabus Processing] Query keywords for retrieval: ${words.join(', ')}`);

    // Score chunks
    const scoredChunks = chunks.map((chunk, index) => {
      const lowerChunk = chunk.toLowerCase();
      let score = 0;

      words.forEach(word => {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp('\\b' + escaped + '\\b', 'gi');
        const matches = lowerChunk.match(regex);
        if (matches) {
          score += matches.length;
        }
      });

      return { chunk, score, index };
    });

    // Check if any chunk scored > 0
    const hasMatches = scoredChunks.some(sc => sc.score > 0);
    
    // Sort: highest score first, preserve order on ties
    scoredChunks.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.index - b.index;
    });

    let filtered = scoredChunks;
    if (hasMatches) {
      filtered = scoredChunks.filter(sc => sc.score > 0);
    }

    // Retrieve the top K chunks
    const topChunks = filtered.slice(0, limit);
    
    // Sort chronologically/index-wise to preserve normal syllabus flow
    topChunks.sort((a, b) => a.index - b.index);

    return topChunks.map(tc => tc.chunk);
  }
}

export const chunkingService = new ChunkingService();
export default chunkingService;
