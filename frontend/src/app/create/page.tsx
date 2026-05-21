'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAssignmentStore } from '../../store/useAssignmentStore';
import { useUIStore } from '../../store/useUIStore';
import {
  UploadCloud,
  FileText,
  X,
  Sparkles,
  Info,
  Calendar,
  Layers,
  ArrowLeft,
  GraduationCap,
} from 'lucide-react';
import Link from 'next/link';

// Validation Schema
const CreateAssignmentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long').trim(),
  dueDate: z.string().min(1, 'Due date is required'),
  questionTypes: z.array(z.string()).min(1, 'Select at least one question format'),
  totalQuestions: z.number().int().positive('Must be a positive integer').min(1, 'Min 1 question required'),
  marks: z.number().int().positive('Must be a positive integer').min(1, 'Min 1 mark required'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  instructions: z.string().optional().default(''),
});

type FormData = z.infer<typeof CreateAssignmentSchema>;

const FORMAT_OPTIONS = [
  { value: 'MCQ', label: 'Multiple Choice (MCQ)' },
  { value: 'Short Answer', label: 'Short Answer' },
  { value: 'Long Answer', label: 'Long Answer' },
  { value: 'Fill in the blanks', label: 'Fill in the Blanks' },
];

export default function CreateAssignment() {
  const router = useRouter();
  const createAssignment = useAssignmentStore((state) => state.createAssignment);
  const addToast = useUIStore((state) => state.addToast);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(CreateAssignmentSchema),
    defaultValues: {
      title: '',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days in future
      questionTypes: ['MCQ'],
      totalQuestions: 10,
      marks: 30,
      difficulty: 'Medium',
      instructions: '',
    },
  });

  const selectedQuestionTypes = watch('questionTypes') || [];

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const isPDF = file.type === 'application/pdf';
    const isTXT = file.type === 'text/plain' || file.name.endsWith('.txt');

    if (!isPDF && !isTXT) {
      addToast('Invalid file format. Please upload PDF or TXT only.', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      addToast('File too large. Maximum size allowed is 10MB.', 'error');
      return;
    }

    setUploadedFile(file);
    simulateUpload();
  };

  const simulateUpload = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null || prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 25;
      });
    }, 150);
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCheckboxChange = (value: string, checked: boolean) => {
    if (checked) {
      setValue('questionTypes', [...selectedQuestionTypes, value]);
    } else {
      setValue(
        'questionTypes',
        selectedQuestionTypes.filter((t) => t !== value)
      );
    }
  };

  const onSubmit = async (data: FormData) => {
    const form = new FormData();
    form.append('title', data.title);
    form.append('dueDate', data.dueDate);
    form.append('difficulty', data.difficulty);
    form.append('totalQuestions', String(data.totalQuestions));
    form.append('marks', String(data.marks));
    form.append('instructions', data.instructions);
    form.append('questionTypes', JSON.stringify(data.questionTypes));

    if (uploadedFile) {
      form.append('file', uploadedFile);
    }

    // Trigger store creator (will optimistic add)
    const result = await createAssignment(form);
    if (result) {
      // Redirect to Dashboard where progress streams live
      router.push('/');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back navigation */}
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="flex items-center gap-3">
        <div className="p-3 bg-violet-600/10 text-violet-400 rounded-2xl border border-violet-500/10">
          <GraduationCap className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            Create New Assessment
          </h1>
          <p className="text-gray-400 text-sm mt-1">Configure criteria and upload study documents for AI generation.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl p-6 lg:p-8 space-y-6">
            {/* Title field */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-semibold text-gray-300">
                Assignment Title
              </label>
              <input
                id="title"
                type="text"
                placeholder="e.g. Operating Systems midterm examination"
                {...register('title')}
                className={`w-full px-4 py-3 bg-[#121216] border rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none transition-colors ${
                  errors.title ? 'border-rose-500/50 focus:border-rose-500' : 'border-white/5 focus:border-violet-500/50'
                }`}
              />
              {errors.title && <p className="text-rose-400 text-xs mt-1">{errors.title.message}</p>}
            </div>

            {/* Questions types checkboxes */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-300">Question Types Allowed</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FORMAT_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 px-4 py-3.5 border rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedQuestionTypes.includes(opt.value)
                        ? 'bg-violet-600/10 border-violet-500/40 text-white'
                        : 'bg-[#121216] border-white/5 text-gray-400 hover:border-white/10 hover:text-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      value={opt.value}
                      checked={selectedQuestionTypes.includes(opt.value)}
                      onChange={(e) => handleCheckboxChange(opt.value, e.target.checked)}
                      className="accent-violet-500 w-4.5 h-4.5"
                    />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </label>
                ))}
              </div>
              {errors.questionTypes && <p className="text-rose-400 text-xs mt-1">{errors.questionTypes.message}</p>}
            </div>

            {/* Difficulty + DueDate layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-gray-500" />
                  Target Difficulty
                </label>
                <select
                  {...register('difficulty')}
                  className="w-full px-4 py-3 bg-[#121216] border border-white/5 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-violet-500/50 appearance-none cursor-pointer"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  Due Date
                </label>
                <input
                  type="date"
                  {...register('dueDate')}
                  className="w-full px-4 py-3 bg-[#121216] border border-white/5 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-violet-500/50 cursor-pointer"
                />
                {errors.dueDate && <p className="text-rose-400 text-xs mt-1">{errors.dueDate.message}</p>}
              </div>
            </div>

            {/* Questions count and marks layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300">Total Questions count</label>
                <input
                  type="number"
                  placeholder="e.g. 10"
                  {...register('totalQuestions', { valueAsNumber: true })}
                  className={`w-full px-4 py-3 bg-[#121216] border rounded-xl text-sm text-gray-300 focus:outline-none ${
                    errors.totalQuestions ? 'border-rose-500/50' : 'border-white/5 focus:border-violet-500/50'
                  }`}
                />
                {errors.totalQuestions && <p className="text-rose-400 text-xs mt-1">{errors.totalQuestions.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300">Total Marks</label>
                <input
                  type="number"
                  placeholder="e.g. 50"
                  {...register('marks', { valueAsNumber: true })}
                  className={`w-full px-4 py-3 bg-[#121216] border rounded-xl text-sm text-gray-300 focus:outline-none ${
                    errors.marks ? 'border-rose-500/50' : 'border-white/5 focus:border-violet-500/50'
                  }`}
                />
                {errors.marks && <p className="text-rose-400 text-xs mt-1">{errors.marks.message}</p>}
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <label htmlFor="instructions" className="text-sm font-semibold text-gray-300">
                Additional Instructions (Optional)
              </label>
              <textarea
                id="instructions"
                rows={3}
                placeholder="Specify details, key chapters to focus on, question weights, etc."
                {...register('instructions')}
                className="w-full px-4 py-3 bg-[#121216] border border-white/5 rounded-xl text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right column uploads */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-6">
            <h3 className="font-bold text-gray-200 text-sm">Study References</h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              Upload study notes, books chapter outlines, or PDFs. VedaAI will reference these to construct questions.
            </p>

            {/* Drag & Drop File Container */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-violet-500 bg-violet-500/5'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.txt"
                className="hidden"
              />
              <UploadCloud className="w-10 h-10 text-violet-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-200">Drag & Drop file here</p>
              <p className="text-xs text-gray-500 mt-1">or click to browse local files</p>
              <p className="text-[10px] text-gray-600 mt-4">PDF, TXT up to 10MB</p>
            </div>

            {/* File display state */}
            {uploadedFile && (
              <div className="p-4 bg-[#121216] border border-white/5 rounded-2xl space-y-3">
                <div className="flex items-center gap-3 justify-between">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <FileText className="w-8 h-8 text-violet-400 flex-shrink-0" />
                    <div className="text-left overflow-hidden">
                      <p className="text-xs font-semibold text-gray-200 truncate">{uploadedFile.name}</p>
                      <p className="text-[10px] text-gray-500">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1 text-gray-500 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress Bar */}
                {uploadProgress !== null && (
                  <div className="space-y-1">
                    <div className="w-full bg-white/5 rounded-full h-1.5">
                      <div
                        className="bg-violet-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500">
                      <span>{uploadProgress === 100 ? 'File loaded' : 'Loading...'}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI Warning information */}
            <div className="p-4 bg-violet-950/20 border border-violet-500/10 rounded-2xl flex items-start gap-3">
              <Info className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-violet-300/80 leading-relaxed">
                VedaAI uses advanced structured parsing. Large documents will be processed using our semantic chunking engine.
              </p>
            </div>
          </div>

          {/* Submit action */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-violet-500/15"
          >
            <Sparkles className="w-4.5 h-4.5 fill-current" />
            Generate Assessment Paper
          </button>
        </div>
      </form>
    </div>
  );
}
