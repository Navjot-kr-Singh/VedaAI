import { z } from 'zod';

export interface IAIProvider {
  name: string;
  generateQuestions(prompt: string, systemInstruction?: string): Promise<string>;
}

export type RegenerationVariant = 'default' | 'easier' | 'harder' | 'mcq_only';

const BaseQuestionSchema = z.object({
  text: z.string().min(3, 'Question text must be at least 3 characters long'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  marks: z.number().positive('Marks must be a positive number'),
});

const MCQSchema = BaseQuestionSchema.extend({
  type: z.literal('MCQ'),
  options: z.array(z.string()).length(4, 'MCQs must have exactly 4 options'),
  correctAnswer: z.string().min(1, 'Correct answer is required'),
});

const OtherQuestionSchema = BaseQuestionSchema.extend({
  type: z.enum(['Short Answer', 'Long Answer', 'Fill in the blanks']),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().optional(),
});

export const QuestionZodSchema = z.discriminatedUnion('type', [
  MCQSchema,
  OtherQuestionSchema,
]);

export const SectionZodSchema = z.object({
  title: z.string().min(1, 'Section title is required'),
  instruction: z.string().min(1, 'Section instruction is required'),
  questions: z.array(QuestionZodSchema).min(1, 'Each section must have at least one question'),
});

export const PaperZodSchema = z.object({
  sections: z.array(SectionZodSchema).min(1, 'The paper must have at least one section'),
});

export type IQuestionInput = z.infer<typeof QuestionZodSchema>;
export type ISectionInput = z.infer<typeof SectionZodSchema>;
export type IPaperInput = z.infer<typeof PaperZodSchema>;

export class NonRetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NonRetryableError';
  }
}
