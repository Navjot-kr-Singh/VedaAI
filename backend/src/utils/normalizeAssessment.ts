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
 * 1. Flattens all questions across all sections.
 * 2. If count > requested, trims extra questions.
 * 3. If count < requested, generates filler questions using allowed types.
 * 4. Rebalances marks using the Largest Remainder Method.
 * 5. Reconstructs sections matching original layout.
 */
export function normalizeAssessment(
  paper: IPaperInput,
  requestedTotalQuestions: number,
  requestedTotalMarks: number,
  allowedQuestionTypes: string[],
  difficulty: 'Easy' | 'Medium' | 'Hard'
): IPaperInput {
  logger.info(`[Normalization] Normalizing paper to exact questions: ${requestedTotalQuestions}, marks: ${requestedTotalMarks}`);

  // 1. Flatten all questions with original section info
  interface FlatQuestion {
    question: IQuestionInput;
    originalSectionIndex: number;
    sectionTitle: string;
    sectionInstruction: string;
  }

  let flatQuestions: FlatQuestion[] = [];
  paper.sections.forEach((section, sectionIdx) => {
    section.questions.forEach((q) => {
      flatQuestions.push({
        question: { ...q }, // deep-ish copy
        originalSectionIndex: sectionIdx,
        sectionTitle: section.title,
        sectionInstruction: section.instruction,
      });
    });
  });

  const originalSectionsCount = paper.sections.length;

  // 2. Adjust Question Count
  if (flatQuestions.length > requestedTotalQuestions) {
    logger.info(`[Normalization] Trimming questions from ${flatQuestions.length} to ${requestedTotalQuestions}`);
    flatQuestions = flatQuestions.slice(0, requestedTotalQuestions);
  } else if (flatQuestions.length < requestedTotalQuestions) {
    logger.info(`[Normalization] Generating ${requestedTotalQuestions - flatQuestions.length} filler questions`);
    const lastSection = paper.sections[originalSectionsCount - 1] || {
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
        sectionTitle: lastSection.title,
        sectionInstruction: lastSection.instruction,
      });
    }
  }

  // 3. Rebalance Marks (Largest Remainder Method)
  const N = flatQuestions.length;
  if (N > 0) {
    // Each question must carry at least 1 mark
    const assignedMarks = new Array(N).fill(1);
    let remainingMarks = requestedTotalMarks - N;

    if (remainingMarks > 0) {
      const originalMarks = flatQuestions.map((fq) => fq.question.marks || 1);
      const sumOriginalMarks = originalMarks.reduce((sum, m) => sum + m, 0);

      // Compute initial proportional allocation
      const fractionalParts = originalMarks.map((m, idx) => {
        const prop = (m / sumOriginalMarks) * remainingMarks;
        const floor = Math.floor(prop);
        assignedMarks[idx] += floor;
        return {
          idx,
          frac: prop - floor,
        };
      });

      const currentSum = assignedMarks.reduce((sum, m) => sum + m, 0);
      const diff = requestedTotalMarks - currentSum;

      if (diff > 0) {
        // Distribute remainder to those with largest fractional parts
        fractionalParts.sort((a, b) => b.frac - a.frac);
        for (let i = 0; i < diff; i++) {
          const targetIdx = fractionalParts[i % N].idx;
          assignedMarks[targetIdx] += 1;
        }
      }
    } else if (remainingMarks < 0) {
      // requestedTotalMarks < N. Since marks must be positive integers, we set each to 1.
      logger.warn(`[Normalization] Target marks (${requestedTotalMarks}) is less than total questions (${N}). Setting all question marks to 1.`);
    }

    // Apply the normalized marks
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
