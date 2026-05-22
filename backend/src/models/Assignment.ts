import { Schema, model, Document } from 'mongoose';

export interface IQuestion {
  text: string;
  type: 'MCQ' | 'Short Answer' | 'Long Answer' | 'Fill in the blanks';
  options?: string[];
  correctAnswer?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  marks: number;
}

export interface ISection {
  title: string;
  instruction: string;
  questions: IQuestion[];
}

export interface IAssignmentDocument extends Document {
  title: string;
  dueDate: Date;
  instructions?: string;
  questionTypes: string[];
  totalQuestions: number;
  marks: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  uploadedFile?: {
    filename: string;
    path: string;
    mimetype: string;
    parsedText?: string;
  };
  generatedPaper?: {
    sections: ISection[];
  };
  status: 'queued' | 'processing' | 'generating' | 'completed' | 'failed' | 'cancelled';
  jobId?: string;
  startedAt?: Date;
  completedAt?: Date;
  processingDurationMs?: number;
  errorMessage?: string;
  createdAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  text: { type: String, required: true },
  type: { type: String, enum: ['MCQ', 'Short Answer', 'Long Answer', 'Fill in the blanks'], required: true, default: 'Short Answer' },
  options: [{ type: String }],
  correctAnswer: { type: String },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  marks: { type: Number, required: true },
});

const SectionSchema = new Schema<ISection>({
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  questions: [QuestionSchema],
});

const AssignmentSchema = new Schema<IAssignmentDocument>(
  {
    title: { type: String, required: true, trim: true },
    dueDate: { type: Date, required: true },
    instructions: { type: String, trim: true },
    questionTypes: [{ type: String, required: true }],
    totalQuestions: { type: Number, required: true, min: 1 },
    marks: { type: Number, required: true, min: 1 },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    uploadedFile: {
      filename: { type: String },
      path: { type: String },
      mimetype: { type: String },
      parsedText: { type: String },
    },
    generatedPaper: {
      sections: [SectionSchema],
    },
    status: {
      type: String,
      enum: ['queued', 'processing', 'generating', 'completed', 'failed', 'cancelled'],
      default: 'queued',
      required: true,
    },
    jobId: { type: String },
    startedAt: { type: Date },
    completedAt: { type: Date },
    processingDurationMs: { type: Number },
    errorMessage: { type: String },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
  }
);

// Add search and filter index on title, status, and createdAt
AssignmentSchema.index({ title: 'text' });
AssignmentSchema.index({ status: 1 });
AssignmentSchema.index({ createdAt: -1 });

export const Assignment = model<IAssignmentDocument>('Assignment', AssignmentSchema);
