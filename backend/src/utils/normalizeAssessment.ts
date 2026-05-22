import { IPaperInput, IQuestionInput, ISectionInput } from '../services/ai/types';
import logger from '../config/logger';

/**
 * Creates a default filler question matching the requested type and difficulty.
 */
function createFillerQuestion(
  index: number,
  type: 'MCQ' | 'Short Answer' | 'Long Answer' | 'Fill in the blanks',
  difficulty: 'Easy' | 'Medium' | 'Hard'
): IQuestionInput {
  if (type === 'MCQ') {
    return {
      text: `Identify the correct statement regarding computer system configurations (Filler Question ${index + 1}).`,
      type: 'MCQ',
      options: [
        'Option A: Primary configuration parameter',
        'Option B: Secondary configuration parameter',
        'Option C: Tertiary configuration parameter',
        'Option D: None of the above'
      ],
      correctAnswer: 'Option A: Primary configuration parameter',
      difficulty,
      marks: 1,
    };
  } else if (type === 'Fill in the blanks') {
    return {
      text: `Complete the following statement: The primary protocol used for web communication is ____________ (Filler Question ${index + 1}).`,
      type: 'Fill in the blanks',
      difficulty,
      marks: 1,
    };
  } else if (type === 'Long Answer') {
    return {
      text: `Explain in detail the concept of network protocols and their layered architecture (Filler Question ${index + 1}).`,
      type: 'Long Answer',
      difficulty,
      marks: 1,
    };
  } else {
    return {
      text: `Explain the main difference between hardware and software components (Filler Question ${index + 1}).`,
      type: 'Short Answer',
      difficulty,
      marks: 1,
    };
  }
}

/**
 * Normalizes a generated paper's question count and marks.
 * 
 * 1. Sanitizes and flattens all questions across all sections.
 * 2. If count > requested, trims extra questions.
 * 3. If count < requested, generates filler questions using allowed types.
 * 4. Rebalances marks using the Largest Remainder Method.
 * 5. Reconstructs sections matching original layout.
 */
export function normalizeAssessment(
  paper: any,
  requestedTotalQuestions: number,
  requestedTotalMarks: number,
  allowedQuestionTypes: string[],
  difficulty: 'Easy' | 'Medium' | 'Hard'
): IPaperInput {
  logger.info(`[Normalization] Normalizing paper to exact questions: ${requestedTotalQuestions}, marks: ${requestedTotalMarks}`);

  interface FlatQuestion {
    question: IQuestionInput;
    originalSectionIndex: number;
    sectionTitle: string;
    sectionInstruction: string;
  }

  let flatQuestions: FlatQuestion[] = [];

  // Defensive validation of incoming structure
  const rawSections = Array.isArray(paper?.sections) ? paper.sections : [];
  const sectionsToProcess = rawSections.length > 0 ? rawSections : [{
    title: 'Section A: General Questions',
    instruction: 'Answer all questions.',
    questions: Array.isArray(paper?.questions) ? paper.questions : [],
  }];

  sectionsToProcess.forEach((section: any, sectionIdx: number) => {
    const rawQuestions = Array.isArray(section?.questions) ? section.questions : [];
    rawQuestions.forEach((q: any) => {
      const questionType = typeof q?.type === 'string' && ['MCQ', 'Short Answer', 'Long Answer', 'Fill in the blanks'].includes(q.type)
        ? q.type
        : (allowedQuestionTypes[0] || 'Short Answer');

      const cleanedQ: any = {
        text: typeof q?.text === 'string' && q.text.trim().length >= 3 ? q.text : `Question details on topic (Question ${flatQuestions.length + 1})`,
        type: questionType,
        difficulty: typeof q?.difficulty === 'string' && ['Easy', 'Medium', 'Hard'].includes(q.difficulty) ? q.difficulty : difficulty,
        marks: typeof q?.marks === 'number' && q.marks > 0 ? q.marks : 1,
      };

      if (cleanedQ.type === 'MCQ') {
        let opts = Array.isArray(q?.options) ? q.options.filter((o: any) => typeof o === 'string' && o.trim() !== '') : [];
        if (opts.length !== 4) {
          if (opts.length > 4) {
            opts = opts.slice(0, 4);
          } else {
            const fillers = ['Option A', 'Option B', 'Option C', 'Option D'];
            while (opts.length < 4) {
              const filler = fillers[opts.length];
              if (!opts.includes(filler)) {
                opts.push(filler);
              } else {
                opts.push(`${filler} (Alt ${opts.length})`);
              }
            }
          }
        }
        cleanedQ.options = opts;
        let correct = typeof q?.correctAnswer === 'string' ? q.correctAnswer.trim() : '';
        if (!correct || !opts.includes(correct)) {
          correct = opts[0];
        }
        cleanedQ.correctAnswer = correct;
      } else {
        delete cleanedQ.options;
        delete cleanedQ.correctAnswer;
      }

      flatQuestions.push({
        question: cleanedQ as IQuestionInput,
        originalSectionIndex: sectionIdx,
        sectionTitle: typeof section?.title === 'string' && section.title.trim().length > 0 ? section.title : `Section ${sectionIdx + 1}`,
        sectionInstruction: typeof section?.instruction === 'string' && section.instruction.trim().length > 0 ? section.instruction : 'Answer the questions.',
      });
    });
  });

  const originalSectionsCount = sectionsToProcess.length;

  // 2. Adjust Question Count
  if (flatQuestions.length > requestedTotalQuestions) {
    logger.info(`[Normalization] Trimming questions from ${flatQuestions.length} to ${requestedTotalQuestions}`);
    flatQuestions = flatQuestions.slice(0, requestedTotalQuestions);
  } else if (flatQuestions.length < requestedTotalQuestions) {
    logger.info(`[Normalization] Generating ${requestedTotalQuestions - flatQuestions.length} filler questions`);
    const lastSection = sectionsToProcess[originalSectionsCount - 1] || {
      title: 'Section A: General Questions',
      instruction: 'Answer all questions.',
    };

    while (flatQuestions.length < requestedTotalQuestions) {
      const typeIndex = flatQuestions.length % allowedQuestionTypes.length;
      const type = (allowedQuestionTypes[typeIndex] || 'Short Answer') as any;
      const fillerQ = createFillerQuestion(flatQuestions.length, type, difficulty);

      flatQuestions.push({
        question: fillerQ,
        originalSectionIndex: originalSectionsCount - 1,
        sectionTitle: typeof lastSection?.title === 'string' ? lastSection.title : 'Section A: General Questions',
        sectionInstruction: typeof lastSection?.instruction === 'string' ? lastSection.instruction : 'Answer all questions.',
      });
    }
  }

  // 3. Rebalance Marks (Decimal-safe Scaling and Cents Adjustment Method)
  const N = flatQuestions.length;
  if (N > 0) {
    const originalMarks = flatQuestions.map((fq) => fq.question.marks || 1);
    const sumOriginalMarks = originalMarks.reduce((sum, m) => sum + m, 0) || N;

    // Scale proportionally
    const scale = requestedTotalMarks / sumOriginalMarks;
    const assignedMarks = originalMarks.map((m) => {
      const scaled = m * scale;
      // Round to 2 decimal places for clean marks, ensuring at least 0.01
      return Math.max(0.01, Math.round(scaled * 100) / 100);
    });

    // Calculate difference due to rounding
    let currentSum = assignedMarks.reduce((sum, m) => sum + m, 0);
    let diffCents = Math.round((requestedTotalMarks - currentSum) * 100);

    if (diffCents > 0) {
      // Distribute remaining cents
      for (let i = 0; i < diffCents; i++) {
        assignedMarks[i % N] = Math.round((assignedMarks[i % N] + 0.01) * 100) / 100;
      }
    } else if (diffCents < 0) {
      // Subtract cents, ensuring we don't go below 0.01
      let centsToRemove = Math.abs(diffCents);
      let attempts = 0;
      let i = 0;
      while (centsToRemove > 0 && attempts < N * 2) {
        const idx = i % N;
        if (assignedMarks[idx] > 0.01) {
          assignedMarks[idx] = Math.round((assignedMarks[idx] - 0.01) * 100) / 100;
          centsToRemove--;
        }
        i++;
        attempts++;
      }
    }

    flatQuestions.forEach((fq, idx) => {
      fq.question.marks = assignedMarks[idx];
    });
  }

  // 4. Reconstruct Sections
  const sectionMap = new Map<
    string,
    { title: string; instruction: string; originalIndex: number; questions: IQuestionInput[] }
  >();

  flatQuestions.forEach((fq) => {
    const key = `${fq.sectionTitle}|||${fq.sectionInstruction}`;
    if (!sectionMap.has(key)) {
      sectionMap.set(key, {
        title: fq.sectionTitle,
        instruction: fq.sectionInstruction,
        originalIndex: fq.originalSectionIndex,
        questions: [],
      });
    }
    sectionMap.get(key)!.questions.push(fq.question);
  });

  let reconstructedSections: ISectionInput[] = Array.from(sectionMap.values())
    .sort((a, b) => a.originalIndex - b.originalIndex)
    .map(({ title, instruction, questions }) => ({
      title,
      instruction,
      questions,
    }));

  if (reconstructedSections.length === 0) {
    reconstructedSections = [
      {
        title: 'Section A: General Questions',
        instruction: 'Answer all questions.',
        questions: flatQuestions.map((fq) => fq.question),
      },
    ];
  }

  return {
    sections: reconstructedSections,
  };
}
