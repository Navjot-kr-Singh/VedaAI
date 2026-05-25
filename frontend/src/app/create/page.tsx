'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  ChevronRight,
  ClipboardList,
  Mic,
  Plus,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

// Validation Schema
const CreateAssignmentSchema = z.object({
  title: z.string().min(1, 'Assignment Title is required').trim(),
  dueDate: z.string().min(1, 'Due date is required'),
  questionTypes: z.array(z.string()).min(1, 'Select at least one question format'),
  totalQuestions: z.number().int().positive('Must be a positive integer').min(1, 'Min 1 question required'),
  marks: z.number().positive('Must be a positive number').min(0.1, 'Min 0.1 marks required'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  instructions: z.string().optional().default(''),
});

type FormData = z.infer<typeof CreateAssignmentSchema>;

export default function CreateAssignment() {
  const router = useRouter();
  const createAssignment = useAssignmentStore((state) => state.createAssignment);
  const addToast = useUIStore((state) => state.addToast);

  const [step, setStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic table rows state
  const [tableRows, setTableRows] = useState([
    { key: 'MCQ', label: 'Multiple Choice Questions', active: true, count: 4, marks: 1 },
    { key: 'Short Answer', label: 'Short Questions', active: true, count: 3, marks: 2 },
    { key: 'Long Answer', label: 'Diagram/Graph-Based Questions', active: false, count: 5, marks: 5 },
    { key: 'Fill in the blanks', label: 'Numerical Problems', active: false, count: 5, marks: 5 },
  ]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(CreateAssignmentSchema),
    defaultValues: {
      title: '',
      dueDate: '',
      questionTypes: ['MCQ', 'Short Answer'],
      totalQuestions: 7,
      marks: 10,
      difficulty: 'Medium',
      instructions: '',
    },
  });

  // Calculate totals and update form values whenever table rows state changes
  useEffect(() => {
    const activeRows = tableRows.filter((r) => r.active);
    const activeKeys = activeRows.map((r) => r.key);
    const totalQuestions = activeRows.reduce((sum, r) => sum + r.count, 0);
    const totalMarks = activeRows.reduce((sum, r) => sum + r.count * r.marks, 0);

    setValue('questionTypes', activeKeys);
    setValue('totalQuestions', totalQuestions);
    setValue('marks', totalMarks);
  }, [tableRows, setValue]);

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
      validateAndSetFile(e.dataTransfer.files[0]);
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
    setFileError(null);
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

  const handleLabelChange = (index: number, newLabel: string) => {
    let key = newLabel;
    if (newLabel === 'Multiple Choice Questions') key = 'MCQ';
    else if (newLabel === 'Short Questions') key = 'Short Answer';
    else if (newLabel === 'Diagram/Graph-Based Questions') key = 'Long Answer';
    else if (newLabel === 'Numerical Problems') key = 'Fill in the blanks';

    setTableRows((prev) =>
      prev.map((row, idx) =>
        idx === index ? { ...row, label: newLabel, key: key } : row
      )
    );
  };

  const handleAddRow = () => {
    const inactiveIndex = tableRows.findIndex((r) => !r.active);
    if (inactiveIndex !== -1) {
      setTableRows((prev) =>
        prev.map((row, idx) => (idx === inactiveIndex ? { ...row, active: true } : row))
      );
    } else {
      setTableRows((prev) => [
        ...prev,
        {
          key: `Custom-${prev.length}`,
          label: 'Long Questions',
          active: true,
          count: 5,
          marks: 5,
        },
      ]);
    }
  };

  const handleRemoveRow = (index: number) => {
    setTableRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, active: false } : row))
    );
  };

  const updateRowValue = (index: number, field: 'count' | 'marks', value: number) => {
    setTableRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row))
    );
  };

  const onSubmit = async (data: FormData) => {
    if (!uploadedFile) {
      setFileError('Syllabus / Reference Study Material is required');
      addToast('Please upload a syllabus or study reference document.', 'error');
      return;
    }
    setFileError(null);

    const generatedTitle = data.title;

    const form = new FormData();
    form.append('title', generatedTitle);
    form.append('dueDate', data.dueDate);
    form.append('difficulty', data.difficulty);
    form.append('totalQuestions', String(data.totalQuestions));
    form.append('marks', String(data.marks));
    form.append('instructions', data.instructions || '');
    form.append('questionTypes', JSON.stringify(data.questionTypes));
    form.append('file', uploadedFile);

    const result = await createAssignment(form);
    if (result) {
      router.push('/');
    }
  };

  // Sync title value
  useEffect(() => {
    if (uploadedFile && !watch('title')) {
      setValue('title', uploadedFile.name.replace(/\.[^/.]+$/, ""));
    }
  }, [uploadedFile, setValue, watch]);

  const totalQuestionsSum = tableRows.filter((r) => r.active).reduce((sum, r) => sum + r.count, 0);
  const totalMarksSum = tableRows.filter((r) => r.active).reduce((sum, r) => sum + r.count * r.marks, 0);

  return (
    <div className="max-w-7xl mx-auto px-1 lg:px-4 pb-24">
      {/* Header Title Section below Navigation Bar */}
      <div className="mb-6 mt-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#34c759] flex-shrink-0" />
          <h2 className="text-[19px] font-bold text-[#181818] tracking-tight">Create Assignment</h2>
        </div>
        <p className="text-gray-500 text-xs mt-1 pl-4.5">Set up a new assignment for your students</p>
      </div>

      {/* Horizontal Stepper Progress Bar */}
      <div className="grid grid-cols-2 gap-4 mt-6 mb-8 w-full">
        <div className="h-[4px] rounded-full bg-[#181818] transition-all duration-300" />
        <div className="h-[4px] rounded-full bg-[#cbd5e1] transition-all duration-300" />
      </div>

      {/* Main Consolidated Card Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white border border-[#eaeaea] rounded-[24px] shadow-sm p-8 space-y-6"
      >
        <div>
          <h3 className="text-base font-bold text-[#181818]">Assignment Details</h3>
          <p className="text-xs text-gray-400 mt-1 mb-6">Basic information about your assignment</p>
        </div>

        {/* Optional Title input styled exactly like the other fields */}
        <div className="space-y-2">
          <label htmlFor="title" className="text-xs font-bold text-[#181818]">
            Assignment Title
          </label>
          <input
            id="title"
            type="text"
            placeholder="e.g. CBSE Science Electricity midterm exam"
            {...register('title')}
            className={`w-full px-5 py-3 bg-[#f4f4f4] border-none rounded-full text-xs text-[#181818] placeholder-gray-400 focus:outline-none transition-colors ${
              errors.title ? 'ring-1 ring-rose-500' : ''
            }`}
          />
          {errors.title && <p className="text-rose-600 text-[10px] font-semibold mt-1">{errors.title.message}</p>}
        </div>

        {/* Study References File Upload Box */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#181818] block">Study References</label>
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-[20px] p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-[#ed6c37] bg-orange-50/20'
                : 'border-[#e4e4e7] hover:border-gray-300 hover:bg-gray-50/30'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.txt"
              className="hidden"
            />
            <UploadCloud className="w-8 h-8 text-[#181818] mx-auto mb-3" strokeWidth={2.2} />
            <p className="text-xs font-bold text-[#181818]">Choose a file or drag & drop it here</p>
            <button
              type="button"
              className="mt-3 bg-[#f4f4f5] hover:bg-gray-200 text-[#181818] px-4 py-1.5 rounded-full font-bold text-[10px] transition-colors inline-block"
            >
              Browse Files
            </button>
            <p className="text-[10px] text-gray-400 mt-3.5 leading-relaxed">
              JPEG, PNG, upto 10MB
            </p>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 text-center">
            Upload images of your preferred document/image
          </p>

          {/* Upload Status Card */}
          {uploadedFile && (
            <div className="p-3 bg-gray-50 border border-[#eaeaea] rounded-xl space-y-2.5 mt-2 animate-fade-in">
              <div className="flex items-center gap-3 justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className="w-7 h-7 text-[#ed6c37] flex-shrink-0" />
                  <div className="text-left overflow-hidden">
                    <p className="text-xs font-bold text-[#181818] truncate">{uploadedFile.name}</p>
                    <p className="text-[10px] text-gray-500">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1 text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {uploadProgress !== null && (
                <div className="space-y-1">
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div
                      className="bg-[#ed6c37] h-1 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-gray-500 font-semibold">
                    <span>{uploadProgress === 100 ? 'Uploaded' : 'Uploading...'}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                </div>
              )}
            </div>
          )}
          {fileError && <p className="text-rose-600 text-[10px] font-semibold mt-1">{fileError}</p>}
        </div>

        {/* Due Date & Difficulty Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#181818] block">
              Due Date
            </label>
            <div className="relative">
              <input
                type="date"
                {...register('dueDate')}
                className="w-full px-5 py-3 bg-[#f4f4f4] border-none rounded-full text-xs text-[#181818] focus:outline-none placeholder-gray-400 appearance-none cursor-pointer"
              />
              <Calendar className="w-4 h-4 text-gray-400 absolute right-5 top-3.5 pointer-events-none" />
            </div>
            {errors.dueDate && <p className="text-rose-600 text-[10px] font-semibold mt-1">{errors.dueDate.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#181818] block">
              Target Difficulty
            </label>
            <div className="relative">
              <select
                {...register('difficulty')}
                className="w-full px-5 py-3 bg-[#f4f4f4] border-none rounded-full text-xs text-[#181818] focus:outline-none appearance-none cursor-pointer"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-5 top-3.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Question Type Section */}
        <div className="space-y-4 pt-2">
          <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            <span>Question Type</span>
            <div className="flex gap-[70px] mr-12">
              <span>No. of Questions</span>
              <span>Marks</span>
            </div>
          </div>

          <div className="space-y-3.5">
            {tableRows
              .map((row, idx) => {
                if (!row.active) return null;
                return (
                  <div key={row.key} className="flex items-center gap-3 animate-fade-in">
                    {/* Dropdown for question type selection */}
                    <div className="relative flex-1">
                      <select
                        value={row.label}
                        onChange={(e) => handleLabelChange(idx, e.target.value)}
                        className="w-full px-5 py-2.5 bg-[#f4f4f4] border-none rounded-full text-xs text-[#181818] focus:outline-none appearance-none cursor-pointer font-medium"
                      >
                        <option value="Multiple Choice Questions">Multiple Choice Questions</option>
                        <option value="Short Questions">Short Questions</option>
                        <option value="Diagram/Graph-Based Questions">Diagram/Graph-Based Questions</option>
                        <option value="Numerical Problems">Numerical Problems</option>
                        <option value="Long Questions">Long Questions</option>
                        <option value="True/False">True/False</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-5 top-3 pointer-events-none" />
                    </div>

                    {/* Delete icon */}
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
                    >
                      <X className="w-4 h-4 text-gray-400 hover:text-gray-900 cursor-pointer" />
                    </button>

                    {/* Questions counter capsule */}
                    <div className="flex items-center bg-[#f4f4f4] rounded-full px-3 py-1.5 gap-3.5 w-[85px] justify-between">
                      <button 
                        type="button"
                        onClick={() => updateRowValue(idx, 'count', Math.max(1, row.count - 1))}
                        className="text-gray-400 hover:text-gray-900 font-bold text-xs select-none focus:outline-none"
                      >
                        —
                      </button>
                      <span className="text-xs font-bold text-[#181818]">{row.count}</span>
                      <button 
                        type="button"
                        onClick={() => updateRowValue(idx, 'count', row.count + 1)}
                        className="text-gray-400 hover:text-gray-900 font-bold text-xs select-none focus:outline-none"
                      >
                        +
                      </button>
                    </div>

                    {/* Marks counter capsule */}
                    <div className="flex items-center bg-[#f4f4f4] rounded-full px-3 py-1.5 gap-3.5 w-[85px] justify-between">
                      <button 
                        type="button"
                        onClick={() => updateRowValue(idx, 'marks', Math.max(1, row.marks - 1))}
                        className="text-gray-400 hover:text-gray-900 font-bold text-xs select-none focus:outline-none"
                      >
                        —
                      </button>
                      <span className="text-xs font-bold text-[#181818]">{row.marks}</span>
                      <button 
                        type="button"
                        onClick={() => updateRowValue(idx, 'marks', row.marks + 1)}
                        className="text-gray-400 hover:text-gray-900 font-bold text-xs select-none focus:outline-none"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Add Question Type trigger */}
          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-2.5 text-xs font-bold text-[#181818] hover:underline mt-2.5 focus:outline-none"
          >
            <span className="w-5 h-5 rounded-full bg-[#181818] flex items-center justify-center text-white text-[11px] font-bold">
              +
            </span>
            <span>Add Question Type</span>
          </button>
          
          {errors.questionTypes && <p className="text-rose-600 text-[10px] font-semibold mt-1">{errors.questionTypes.message}</p>}
        </div>

        {/* Dynamic total counts banner */}
        <div className="text-right space-y-1 pt-2">
          <p className="text-[11px] text-gray-500 font-semibold">Total Questions : <span className="text-[#181818] font-bold">{totalQuestionsSum}</span></p>
          <p className="text-[11px] text-gray-500 font-semibold">Total Marks : <span className="text-[#181818] font-bold">{totalMarksSum}</span></p>
        </div>

        {/* Additional instructions block */}
        <div className="space-y-2 pt-2">
          <label htmlFor="instructions" className="text-xs font-bold text-[#181818] block">
            Additional Information (For better output)
          </label>
          <div className="relative">
            <textarea
              id="instructions"
              rows={3}
              placeholder="e.g. Generate a question paper for 3 hour exam duration..."
              {...register('instructions')}
              className="w-full px-5 py-4 bg-[#f4f4f4] border-none rounded-[20px] text-xs text-[#181818] placeholder-gray-400 focus:outline-none transition-colors resize-none pr-10"
            />
            <Mic className="w-4 h-4 text-gray-400 absolute right-4 bottom-4 cursor-pointer hover:text-gray-900 transition-colors" />
          </div>
        </div>
      </form>

      {/* Previous and Next Pill Buttons below the card */}
      <div className="flex items-center justify-between mt-6 w-full px-1 no-print">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-white border border-[#eaeaea] hover:bg-gray-50 rounded-full text-xs font-bold text-[#595959] transition-all shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#595959]" />
          <span>Previous</span>
        </Link>

        <button
          type="button"
          onClick={handleSubmit(onSubmit)}
          className="inline-flex items-center gap-1.5 px-7 py-3 bg-[#181818] hover:bg-black text-white rounded-full text-xs font-bold transition-all shadow-md cursor-pointer"
        >
          <span>Next</span>
          <ArrowRight className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    </div>
  );
}
