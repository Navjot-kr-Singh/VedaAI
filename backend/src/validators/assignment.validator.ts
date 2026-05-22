import { z } from 'zod';

export const CreateAssignmentSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }).min(3, 'Title must be at least 3 characters').trim(),
    dueDate: z.string({ required_error: 'Due date is required' }).refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }),
    questionTypes: z.array(z.string()).min(1, 'Select at least one question type'),
    totalQuestions: z.preprocess(
      (val) => Number(val),
      z.number({ required_error: 'Total questions is required' }).int().positive('Must be a positive integer')
    ),
    marks: z.preprocess(
      (val) => Number(val),
      z.number({ required_error: 'Total marks is required' }).positive('Must be a positive number')
    ),
    difficulty: z.enum(['Easy', 'Medium', 'Hard'], {
      required_error: 'Difficulty is required',
    }),
    instructions: z.string().optional().default(''),
  }),
});

export const RegenerateAssignmentQuerySchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Assignment ID is required'),
  }),
  query: z.object({
    variant: z.enum(['default', 'easier', 'harder', 'mcq_only']).optional().default('default'),
  }),
});

export const GetAssignmentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Assignment ID is required'),
  }),
});
