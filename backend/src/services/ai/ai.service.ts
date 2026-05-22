import { GeminiProvider } from './providers/gemini.provider';
import { PromptBuilder } from './prompt.builder';
import { AIResponseParser } from './parser';
import { AIResponseValidator } from './validator';
import { IPaperInput, RegenerationVariant, NonRetryableError } from './types';
import { normalizeAssessment } from '../../utils/normalizeAssessment';
import chunkingService from '../chunking.service';
import logger from '../../config/logger';

export class AIService {
  private provider = new GeminiProvider();

  /**
   * Extracts a syllabus summary containing course and topics/keywords.
   * Runs Gemini if available, otherwise falls back to a programmatic parser.
   */
  async extractSyllabusSummary(text: string): Promise<{ course: string; topics: string[] }> {
    if (!text || text.trim().length === 0) {
      return { course: '', topics: [] };
    }

    const cleaned = chunkingService.cleanText(text);

    if (this.provider.isDemoMode()) {
      logger.info('[Syllabus Extraction] Demo Mode: Extracting syllabus topics programmatically.');
      return this.extractSyllabusSummaryProgrammatically(cleaned);
    }

    const systemInstruction = "You are a professional syllabus analyzer. Your job is to extract the course name and key topics, units, concepts, keywords, and subtopics from the provided syllabus text. You must return a single, valid JSON object matching the requested schema. Do not include any explanation or markdown formatting.";
    
    const userPrompt = `Analyze the following syllabus / study material text and extract a structured summary.
You MUST output a single, valid JSON object matching this structure:
{
  "course": "Name of the course or subject",
  "topics": [
    "Topic or Concept 1",
    "Topic or Concept 2",
    "Topic or Concept 3",
    ...
  ]
}

Ensure you extract all main modules, units, chapters, and important keywords (at least 5-15 key topics/concepts).
Syllabus Text:
---
${cleaned.substring(0, 15000)}
---`;

    try {
      logger.info('[Syllabus Extraction] Requesting syllabus summary from Gemini...');
      const rawResponse = await this.provider.generateQuestions(userPrompt, systemInstruction);
      const cleanedJson = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedJson);
      
      const course = typeof parsed.course === 'string' ? parsed.course.trim() : '';
      const topics = Array.isArray(parsed.topics) 
        ? parsed.topics.map((t: any) => String(t).trim()).filter(t => t.length > 0)
        : [];
      
      if (topics.length > 0) {
        logger.info(`[Syllabus Extraction] Successfully extracted course: "${course}" with ${topics.length} topics via Gemini.`);
        logger.debug(`Extracted topics: ${JSON.stringify(topics)}`);
        return { course, topics };
      }
    } catch (err: any) {
      logger.warn(`[Syllabus Extraction] Gemini extraction failed: ${err.message || err}. Falling back to programmatic extraction.`);
    }

    return this.extractSyllabusSummaryProgrammatically(cleaned);
  }

  /**
   * Falls back to a regex-based in-memory parser to extract topics.
   */
  private extractSyllabusSummaryProgrammatically(text: string): { course: string; topics: string[] } {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let course = 'Course Syllabus';
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      if (line.length > 8 && line.length < 60 && !/^[0-9\-\*\•\.\s]+$/.test(line) && !line.toLowerCase().includes('syllabus')) {
        course = line;
        break;
      }
    }

    const topicsSet = new Set<string>();
    const unitRegex = /^(unit|chapter|module|section|topic)\s+\d+[:\-\s]*/i;

    for (const line of lines) {
      if (unitRegex.test(line)) {
        const cleaned = line.replace(unitRegex, '').trim();
        if (cleaned.length > 4 && cleaned.length < 80) {
          topicsSet.add(cleaned);
        }
        continue;
      }

      if (/^[\-\*\•]\s+/.test(line)) {
        const cleaned = line.replace(/^[\-\*\•]\s+/, '').trim();
        if (cleaned.length > 4 && cleaned.length < 60) {
          if (cleaned.includes(',') && cleaned.length < 40) {
            cleaned.split(',').map(s => s.trim()).filter(s => s.length > 4).forEach(s => topicsSet.add(s));
          } else {
            topicsSet.add(cleaned);
          }
        }
        continue;
      }

      if (/^\d+[\.\)\s]+\s*[A-Z]/.test(line)) {
        const cleaned = line.replace(/^\d+[\.\)\s]+/, '').trim();
        if (cleaned.length > 4 && cleaned.length < 60) {
          topicsSet.add(cleaned);
        }
        continue;
      }

      const words = line.split(/\s+/);
      const isTitleCased = words.every(w => w.length > 0 && w[0] === w[0].toUpperCase());
      if (isTitleCased && words.length >= 2 && words.length <= 6 && line.length < 50) {
        topicsSet.add(line);
      }
    }

    let topics = Array.from(topicsSet);

    if (topics.length === 0) {
      const sentences = text.split(/[\.\;\:\n]/);
      for (const s of sentences) {
        const cleaned = s.trim();
        if (cleaned.length > 5 && cleaned.length < 50 && /^[A-Z]/.test(cleaned)) {
          topics.push(cleaned);
        }
      }
    }

    topics = topics
      .map(t => t.replace(/[:\-\.\,\;]+$/, '').trim())
      .filter(t => t.length > 3 && t.length < 80 && !/^(page|module|unit|chapter)\s*\d+$/i.test(t));
    
    const uniqueTopics: string[] = [];
    const seen = new Set<string>();
    for (const t of topics) {
      const lower = t.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        uniqueTopics.push(t);
      }
    }

    logger.info(`[Syllabus Extraction] Programmatic extraction found ${uniqueTopics.length} topics.`);
    return {
      course,
      topics: uniqueTopics.slice(0, 20)
    };
  }

  private generateMockQuestionsForTopics(
    topics: string[],
    count: number,
    questionTypes: string[],
    difficulty: 'Easy' | 'Medium' | 'Hard'
  ): any[] {
    const allowedTypes = questionTypes.length > 0 ? questionTypes : ['MCQ', 'Short Answer', 'Long Answer', 'Fill in the blanks'];
    const questions: any[] = [];

    const mcqTemplates = [
      (topic: string) => ({
        text: `Which of the following is a primary characteristic or key standard associated with ${topic}?`,
        options: [
          `Proper implementation and validation of ${topic}`,
          `Outdated legacy infrastructure protocols`,
          `Basic physical level hardware interfaces`,
          `Unregulated and unmanaged workflow execution`
        ],
        correctAnswer: `Proper implementation and validation of ${topic}`
      }),
      (topic: string) => ({
        text: `In professional operations, what is the main benefit of implementing ${topic}?`,
        options: [
          `Optimized efficiency, risk reduction, and quality assurance of ${topic}`,
          `Increased operational latency and cost overheads`,
          `Manual resource allocation and thread blocking`,
          `Deprecating security controls and network firewalls`
        ],
        correctAnswer: `Optimized efficiency, risk reduction, and quality assurance of ${topic}`
      }),
      (topic: string) => ({
        text: `Which framework or guideline plays the most crucial role in managing ${topic}?`,
        options: [
          `The standard regulatory and compliance protocol for ${topic}`,
          `The local browser database cookie schema`,
          `The basic background storage fragmentation service`,
          `The remote cloud virtual network router`
        ],
        correctAnswer: `The standard regulatory and compliance protocol for ${topic}`
      })
    ];

    for (let i = 0; i < count; i++) {
      const topic = topics[i % topics.length] || 'Syllabus Topic';
      const type = allowedTypes[i % allowedTypes.length];
      const marks = 1;

      if (type === 'MCQ') {
        const templateFn = mcqTemplates[i % mcqTemplates.length];
        const qData = templateFn(topic);
        questions.push({
          text: qData.text,
          type: 'MCQ',
          options: qData.options,
          correctAnswer: qData.correctAnswer,
          difficulty,
          marks
        });
      } else if (type === 'Fill in the blanks') {
        questions.push({
          text: `The application of ____________ is critical to ensure standard compliance for ${topic}.`,
          type: 'Fill in the blanks',
          difficulty,
          marks
        });
      } else if (type === 'Long Answer') {
        questions.push({
          text: `Provide a detailed explanation of ${topic}. Discuss its key principles, implementation challenges, and how it is applied to ensure quality standards.`,
          type: 'Long Answer',
          difficulty,
          marks
        });
      } else {
        questions.push({
          text: `Explain the core concepts and primary objectives of ${topic}.`,
          type: 'Short Answer',
          difficulty,
          marks
        });
      }
    }

    return questions;
  }

  generateMockAssessment(params: {
    title: string;
    questionTypes: string[];
    totalQuestions: number;
    marks: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    syllabusSummary?: { course: string; topics: string[] };
  }): IPaperInput {
    const syllabus = params.syllabusSummary;
    if (syllabus && syllabus.topics.length > 0) {
      logger.info(`[Mock Generator] Generating ${params.totalQuestions} grounded mock questions for topics: ${syllabus.topics.join(', ')}`);
      const questions = this.generateMockQuestionsForTopics(
        syllabus.topics,
        params.totalQuestions,
        params.questionTypes,
        params.difficulty
      );
      
      const sections = [{
        title: "Section A: Course Assessment Questions",
        instruction: "Answer all the questions in this section.",
        questions
      }];

      return normalizeAssessment(
        { sections },
        params.totalQuestions,
        params.marks,
        params.questionTypes,
        params.difficulty
      );
    }

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
      const marks = 1;

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

  private matchesSyllabus(questionText: string, options: string[] | undefined, topics: string[]): boolean {
    const textToLower = questionText.toLowerCase();
    const optionsText = options ? options.join(' ').toLowerCase() : '';
    const combinedText = `${textToLower} ${optionsText}`;

    for (const topic of topics) {
      if (combinedText.includes(topic.toLowerCase())) {
        return true;
      }
    }

    const stopWords = new Set(['in', 'and', 'for', 'with', 'a', 'an', 'of', 'to', 'at', 'by', 'from', 'is', 'are', 'was', 'were', 'the', 'it', 'on', 'about', 'laws', 'issues', 'legal']);
    const topicKeywords = new Set<string>();
    topics.forEach(topic => {
      topic.toLowerCase().split(/[^a-z0-9]/).forEach(word => {
        if (word.length > 2 && !stopWords.has(word)) {
          topicKeywords.add(word);
        }
      });
    });

    const questionWords = combinedText.split(/[^a-z0-9]/);
    for (const word of questionWords) {
      if (topicKeywords.has(word)) {
        return true;
      }
    }

    return false;
  }

  private containsGenericPlaceholderText(questionText: string, options: string[] | undefined, topics: string[]): boolean {
    const genericTerms = [
      'primary controller', 'modular architecture', 'performance optimization', 
      'event loop', 'asynchronous scheduling', 'system execution loop', 
      'execution latency', 'centralized state management', 'browser cookies database', 
      'disk defragmentation', 'virtual network interface'
    ];
    
    const textToLower = questionText.toLowerCase();
    const optionsText = options ? options.join(' ').toLowerCase() : '';
    const combinedText = `${textToLower} ${optionsText}`;

    for (const term of genericTerms) {
      if (combinedText.includes(term)) {
        const termInSyllabus = topics.some(topic => topic.toLowerCase().includes(term));
        if (!termInSyllabus) {
          return true;
        }
      }
    }
    return false;
  }

  private getTokens(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2);
  }

  private isSemanticDuplicate(q1: string, q2: string): boolean {
    const tokens1 = new Set(this.getTokens(q1));
    const tokens2 = new Set(this.getTokens(q2));
    if (tokens1.size === 0 || tokens2.size === 0) return false;

    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);
    const jaccard = intersection.size / union.size;
    return jaccard > 0.70;
  }

  private getUnderrepresentedTopics(
    validQuestions: any[],
    topics: string[],
    limit: number
  ): string[] {
    if (topics.length === 0) return ['Syllabus Topic'];

    const counts: Record<string, number> = {};
    topics.forEach(t => { counts[t] = 0; });

    validQuestions.forEach(q => {
      const text = `${q.text} ${(q.options || []).join(' ')}`.toLowerCase();
      topics.forEach(t => {
        if (text.includes(t.toLowerCase())) {
          counts[t]++;
        }
      });
    });

    const sorted = Object.entries(counts)
      .sort((a, b) => a[1] - b[1])
      .map(entry => entry[0]);

    return sorted.slice(0, limit);
  }

  private balanceTopicDistribution(questions: any[], topics: string[], targetCount: number): any[] {
    if (topics.length === 0 || questions.length <= targetCount) {
      return questions.slice(0, targetCount);
    }

    const questionsWithTopic = questions.map(q => {
      const text = `${q.text} ${(q.options || []).join(' ')}`.toLowerCase();
      let bestTopicIdx = 0;
      let maxMatchLen = 0;

      topics.forEach((topic, idx) => {
        const lowerTopic = topic.toLowerCase();
        if (text.includes(lowerTopic) && lowerTopic.length > maxMatchLen) {
          bestTopicIdx = idx;
          maxMatchLen = lowerTopic.length;
        }
      });

      if (maxMatchLen === 0) {
        let maxOverlap = 0;
        const qWords = text.split(/[^a-z0-9]/);
        topics.forEach((topic, idx) => {
          const tWords = topic.toLowerCase().split(/[^a-z0-9]/).filter(w => w.length > 2);
          const overlap = tWords.filter(w => qWords.includes(w)).length;
          if (overlap > maxOverlap) {
            bestTopicIdx = idx;
            maxOverlap = overlap;
          }
        });
      }

      return { question: q, topic: topics[bestTopicIdx] };
    });

    const selected: any[] = [];
    const topicCounts: Record<string, number> = {};
    topics.forEach(t => { topicCounts[t] = 0; });

    const candidatesByTopic: Record<string, any[]> = {};
    topics.forEach(t => { candidatesByTopic[t] = []; });
    questionsWithTopic.forEach(item => {
      if (candidatesByTopic[item.topic]) {
        candidatesByTopic[item.topic].push(item.question);
      } else {
        candidatesByTopic[topics[0]].push(item.question);
      }
    });

    let added = true;
    while (selected.length < targetCount && added) {
      added = false;
      for (const topic of topics) {
        if (selected.length >= targetCount) break;
        const candidates = candidatesByTopic[topic];
        if (candidates && candidates.length > 0) {
          selected.push(candidates.shift());
          topicCounts[topic]++;
          added = true;
        }
      }
    }

    const remaining = Object.values(candidatesByTopic).flat();
    while (selected.length < targetCount && remaining.length > 0) {
      selected.push(remaining.shift());
    }

    logger.info(`[Topic Distribution] Balanced topic coverage counts: ${JSON.stringify(topicCounts)}`);
    return selected;
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
    syllabusSummary?: { course: string; topics: string[] };
  }): Promise<IPaperInput> {
    let syllabus = params.syllabusSummary;
    if (!syllabus && params.referenceText) {
      logger.info('[AI Service] No syllabusSummary provided but referenceText exists. Extracting on the fly.');
      syllabus = await this.extractSyllabusSummary(params.referenceText);
    }

    if (this.provider.isDemoMode()) {
      logger.info('Demo Mode: Simulating dynamic AI generation with a brief delay.');
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return this.generateMockAssessment({ ...params, syllabusSummary: syllabus });
    }

    let validQuestions: any[] = [];
    const seenStems = new Set<string>();

    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries && validQuestions.length < params.totalQuestions) {
      attempt++;
      logger.info(`AI Generation Attempt ${attempt}/${maxRetries} (Current Valid Questions: ${validQuestions.length}/${params.totalQuestions}) using ${this.provider.name}...`);

      try {
        let rawResponse = '';
        if (attempt === 1) {
          const systemInstruction = PromptBuilder.buildSystemInstruction();
          const userPrompt = PromptBuilder.buildUserPrompt({ ...params, syllabusSummary: syllabus });
          rawResponse = await this.provider.generateQuestions(userPrompt, systemInstruction);
        } else {
          const missingCount = params.totalQuestions - validQuestions.length;
          const underrepresented = this.getUnderrepresentedTopics(validQuestions, syllabus?.topics || [], 5);
          logger.info(`[Regeneration] Requesting ${missingCount} missing questions for topics: ${underrepresented.join(', ')}`);

          const systemInstruction = PromptBuilder.buildSystemInstruction();
          const existingList = validQuestions.map((q, idx) => `${idx + 1}. ${q.text}`).join('\n');
          const userPrompt = `You are generating additional questions to complete an assessment paper.
We already have the following valid questions in the paper:
${existingList}

We need you to generate exactly ${missingCount} MORE questions.
Target Difficulty: ${params.difficulty}
Question Formats Allowed: ${params.questionTypes.join(', ')}

CRITICAL RULES FOR REGENERATION:
1. The new questions MUST be derived strictly from the following underrepresented syllabus topics:
${underrepresented.map((t) => `- ${t}`).join('\n')}
2. DO NOT repeat, rephrase, or duplicate any of the existing questions listed above.
3. Every generated question must carry a placeholder mark of 1 (the final system will scale the marks).
4. Output a single, valid JSON object matching the standard schema with exactly ${missingCount} questions total.

JSON structure:
{
  "sections": [
    {
      "title": "Additional Questions",
      "instruction": "Answer the following questions.",
      "questions": [ ... ]
    }
  ]
}`;
          rawResponse = await this.provider.generateQuestions(userPrompt, systemInstruction);
        }

        const parsedData = AIResponseParser.parse(rawResponse);
        
        const newQuestions: any[] = [];
        if (parsedData && Array.isArray(parsedData.sections)) {
          parsedData.sections.forEach((sec: any) => {
            if (Array.isArray(sec?.questions)) {
              newQuestions.push(...sec.questions);
            }
          });
        }

        logger.info(`[Validation Pipeline] Parsing attempt ${attempt} generated ${newQuestions.length} raw questions.`);

        newQuestions.forEach((q: any) => {
          if (!q || typeof q.text !== 'string' || q.text.trim().length < 3) {
            return;
          }

          q.text = q.text.trim();
          q.type = q.type || 'Short Answer';
          q.difficulty = q.difficulty || params.difficulty;
          q.marks = typeof q.marks === 'number' ? q.marks : 1;

          const stem = q.text.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (seenStems.has(stem)) {
            logger.info(`[Duplicate Detector] Rejected duplicate question stem: "${q.text}"`);
            return;
          }

          let isSemanticDup = false;
          for (const existing of validQuestions) {
            if (this.isSemanticDuplicate(q.text, existing.text)) {
              isSemanticDup = true;
              break;
            }
          }
          if (isSemanticDup) {
            logger.info(`[Semantic Duplicate] Rejected question too similar to existing: "${q.text}"`);
            return;
          }

          if (q.type === 'MCQ') {
            if (!Array.isArray(q.options) || q.options.length !== 4) {
              logger.info(`[MCQ Validator] Rejected MCQ without exactly 4 options: "${q.text}"`);
              return;
            }
            const uniqueOpts = new Set(q.options.map((o: any) => String(o).trim().toLowerCase()));
            if (uniqueOpts.size < 4) {
              logger.info(`[MCQ Validator] Rejected MCQ with duplicate options: "${q.text}"`);
              return;
            }
            let correct = typeof q.correctAnswer === 'string' ? q.correctAnswer.trim() : '';
            if (!correct || !q.options.map((o: any) => String(o).trim()).includes(correct)) {
              logger.info(`[MCQ Validator] Rejected MCQ with invalid correctAnswer: "${correct}" not in options for "${q.text}"`);
              return;
            }
          }

          if (syllabus && this.containsGenericPlaceholderText(q.text, q.options, syllabus.topics)) {
            logger.info(`[Quality Filter] Rejected question with generic IT/architecture terms not in syllabus: "${q.text}"`);
            return;
          }

          if (syllabus && !this.matchesSyllabus(q.text, q.options, syllabus.topics)) {
            logger.info(`[Syllabus Relevance] Rejected question not matching syllabus keywords/concepts: "${q.text}"`);
            return;
          }

          validQuestions.push(q);
          seenStems.add(stem);
        });

        logger.info(`[Validation Pipeline] Total valid questions after attempt ${attempt}: ${validQuestions.length}/${params.totalQuestions}`);

      } catch (error: any) {
        logger.warn(`AI Generation Attempt ${attempt} failed: ${error.message || error}`);

        const errMsg = (error.message || '').toLowerCase();
        const isQuota = errMsg.includes('quota') || errMsg.includes('429') || errMsg.includes('resource_exhausted') || errMsg.includes('resource exhausted') || error.message?.includes('RESOURCE_EXHAUSTED');
        if (isQuota) {
          logger.warn(`[AI Service] Quota limit exceeded / 429 during attempt ${attempt}. Falling back automatically to dynamic Mock Generation Mode!`);
          return this.generateMockAssessment({ ...params, syllabusSummary: syllabus });
        }

        if (error instanceof NonRetryableError || error.name === 'NonRetryableError') {
          logger.error(`Critical non-retryable error: ${error.message || error}. Aborting execution.`);
          throw error;
        }

        if (attempt >= maxRetries && validQuestions.length === 0) {
          logger.error('All AI Generation retries exhausted. Failing job.');
          throw new Error(`AI Generation failed after ${maxRetries} attempts. Last error: ${error.message}`);
        }
      }
    }

    if (validQuestions.length < params.totalQuestions) {
      const missingCount = params.totalQuestions - validQuestions.length;
      logger.warn(`[AI Service] Under-generated valid questions. Generating ${missingCount} syllabus-grounded fallback questions to fulfill count.`);
      
      const fallbackTopics = syllabus?.topics && syllabus.topics.length > 0 
        ? this.getUnderrepresentedTopics(validQuestions, syllabus.topics, syllabus.topics.length)
        : [params.title];

      const fallbackQs = this.generateMockQuestionsForTopics(
        fallbackTopics,
        missingCount,
        params.questionTypes,
        params.difficulty
      );

      fallbackQs.forEach(q => {
        const stem = q.text.toLowerCase().replace(/[^a-z0-9]/g, '');
        validQuestions.push(q);
        seenStems.add(stem);
      });
    }

    if (validQuestions.length > params.totalQuestions) {
      logger.info(`[AI Service] Trimming/balancing questions count from ${validQuestions.length} to ${params.totalQuestions}`);
      validQuestions = this.balanceTopicDistribution(
        validQuestions,
        syllabus?.topics || [],
        params.totalQuestions
      );
    } else if (syllabus?.topics && syllabus.topics.length > 0) {
      validQuestions = this.balanceTopicDistribution(
        validQuestions,
        syllabus.topics,
        params.totalQuestions
      );
    }

    const mockPaper = {
      sections: [
        {
          title: "Section A: Course Assessment Questions",
          instruction: "Answer all the questions in this section.",
          questions: validQuestions
        }
      ]
    };

    const normalizedPaper = normalizeAssessment(
      mockPaper,
      params.totalQuestions,
      params.marks,
      params.questionTypes,
      params.difficulty
    );

    const validatedPaper = AIResponseValidator.validate(normalizedPaper);
    logger.info(`AI Generation successful. Questions: ${params.totalQuestions}, Marks: ${params.marks}`);
    return validatedPaper;
  }
}

export const aiService = new AIService();
export default aiService;
