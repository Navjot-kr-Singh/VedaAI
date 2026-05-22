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
} from 'lucide-react';
import Link from 'next/link';

// Validation Schema
const CreateAssignmentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long').trim(),
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
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days in future
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

  const toggleRowActive = (index: number) => {
    setTableRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, active: !row.active } : row))
    );
  };

  const updateRowValue = (index: number, field: 'count' | 'marks', value: number) => {
    setTableRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row))
    );
  };

  const handleNextStep = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Validate current step fields
    const isStep1Valid = await trigger(['title', 'dueDate', 'difficulty']);
    if (isStep1Valid) {
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  const onSubmit = async (data: FormData) => {
    if (step === 1) {
      // Prevent premature submission if triggered (e.g. via Enter key)
      handleNextStep();
      return;
    }

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

    const result = await createAssignment(form);
    if (result) {
      router.push('/');
    }
  };

  const totalQuestionsSum = tableRows.filter((r) => r.active).reduce((sum, r) => sum + r.count, 0);
  const totalMarksSum = tableRows.filter((r) => r.active).reduce((sum, r) => sum + r.count * r.marks, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-1 lg:px-4 pb-20">
      
      {/* Back button */}
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors no-print">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Dashboard
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Progress Stepper panel (Screenshot 6/8) */}
        <div className="space-y-4 lg:col-span-1 no-print">
          <div className="bg-white border border-[#eaeaea] rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-[#181818]">Create Assignment</h3>
            <p className="text-xs text-gray-500 leading-relaxed">Set up a new assignment for your students.</p>
            
            <div className="space-y-6 pt-2">
              {[
                { number: 1, label: 'Assignment Details', desc: 'Basic information about your assignment', active: step === 1 },
                { number: 2, label: 'Questions & Marking', desc: 'Configure types, marks and instruction details', active: step === 2 },
              ].map((s) => (
                <div key={s.number} className="flex gap-4 items-start">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border flex-shrink-0 transition-all ${
                    s.active
                      ? 'bg-[#fae0d6] border-[#ed6c37] text-[#ed6c37] shadow-sm'
                      : 'bg-white border-[#eaeaea] text-gray-400'
                  }`}>
                    {s.number}
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${s.active ? 'text-[#181818]' : 'text-gray-400'}`}>{s.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Form content card */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
              if (step === 1) {
                e.preventDefault();
                handleNextStep();
              }
            }
          }}
          className="lg:col-span-2 bg-white border border-[#eaeaea] rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between"
        >
          <div className="p-6 lg:p-8 space-y-6">
            
            {/* Step 1 Content: General configurations */}
            {step === 1 && (
              <div className="space-y-6 animate-slide-in">
                
                {/* Title */}
                <div className="space-y-2">
                  <label htmlFor="title" className="text-xs font-bold text-[#181818]">
                    Assignment Title
                  </label>
                  <input
                    id="title"
                    type="text"
                    placeholder="e.g. CBSE Science Electricity midterm exam"
                    {...register('title')}
                    className={`w-full px-4 py-3 bg-white border rounded-xl text-xs text-[#181818] placeholder-gray-400 focus:outline-none transition-colors ${
                      errors.title ? 'border-rose-500 focus:border-rose-500' : 'border-[#eaeaea]'
                    }`}
                  />
                  {errors.title && <p className="text-rose-600 text-[10px] font-semibold mt-1">{errors.title.message}</p>}
                </div>

                {/* File Upload Box */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#181818]">Study References</label>
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      dragActive
                        ? 'border-[#ed6c37] bg-orange-50/20'
                        : 'border-[#eaeaea] hover:border-gray-300 hover:bg-gray-50/30'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,.txt"
                      className="hidden"
                    />
                    <UploadCloud className="w-9 h-9 text-gray-400 mx-auto mb-3" />
                    <p className="text-xs font-bold text-[#181818]">Choose a file or drag & drop it here</p>
                    <button
                      type="button"
                      className="mt-2 text-[11px] font-bold text-[#ed6c37] hover:underline"
                    >
                      Browse Files
                    </button>
                    <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                      Upload images of your preferred document/image (PDF, TXT up to 10MB)
                    </p>
                  </div>

                  {/* Upload state card */}
                  {uploadedFile && (
                    <div className="p-3 bg-gray-50 border border-[#eaeaea] rounded-xl space-y-2.5 mt-2">
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
                </div>

                {/* Grid Inputs: Due Date + Difficulty */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#181818] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      Due Date
                    </label>
                    <input
                      type="date"
                      {...register('dueDate')}
                      className="w-full px-4 py-3 bg-white border border-[#eaeaea] rounded-xl text-xs text-[#181818] focus:outline-none"
                    />
                    {errors.dueDate && <p className="text-rose-600 text-[10px] font-semibold mt-1">{errors.dueDate.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#181818] flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-gray-400" />
                      Target Difficulty
                    </label>
                    <select
                      {...register('difficulty')}
                      className="w-full px-4 py-3 bg-white border border-[#eaeaea] rounded-xl text-xs text-[#181818] focus:outline-none"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

              </div>
            )}

            {/* Step 2 Content: Question Type Table Inputs & Instructions (Screenshot 7) */}
            {step === 2 && (
              <div className="space-y-6 animate-slide-in">
                
                {/* Question Types Table */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-[#181818]">Question Type Settings</label>
                  <div className="border border-[#eaeaea] rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-[#eaeaea] text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          <th className="px-4 py-3 w-10"></th>
                          <th className="px-4 py-3">Question Type</th>
                          <th className="px-4 py-3 w-32">No. of Questions</th>
                          <th className="px-4 py-3 w-28">Marks/Question</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eaeaea]">
                        {tableRows.map((row, idx) => (
                          <tr key={row.key} className={`text-xs ${row.active ? 'bg-white' : 'bg-gray-50/50 text-gray-400'}`}>
                            <td className="px-4 py-3.5 text-center">
                              <input
                                type="checkbox"
                                checked={row.active}
                                onChange={() => toggleRowActive(idx)}
                                className="accent-[#ed6c37] w-4 h-4 cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-3.5 font-semibold text-[#181818]">{row.label}</td>
                            <td className="px-4 py-3.5">
                              <input
                                type="number"
                                disabled={!row.active}
                                value={row.count}
                                onChange={(e) => updateRowValue(idx, 'count', Math.max(1, parseInt(e.target.value) || 0))}
                                className="w-20 px-2 py-1 bg-white border border-[#eaeaea] rounded-lg text-xs focus:outline-none disabled:opacity-50 text-center"
                              />
                            </td>
                            <td className="px-4 py-3.5">
                              <input
                                type="number"
                                step="any"
                                disabled={!row.active}
                                value={row.marks}
                                onChange={(e) => updateRowValue(idx, 'marks', Math.max(0.1, parseFloat(e.target.value) || 0))}
                                className="w-16 px-2 py-1 bg-white border border-[#eaeaea] rounded-lg text-xs focus:outline-none disabled:opacity-50 text-center"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {errors.questionTypes && <p className="text-rose-600 text-[10px] font-semibold mt-1">{errors.questionTypes.message}</p>}
                </div>

                {/* Additional instructions block */}
                <div className="space-y-2">
                  <label htmlFor="instructions" className="text-xs font-bold text-[#181818]">
                    Additional Information (For better output)
                  </label>
                  <textarea
                    id="instructions"
                    rows={3}
                    placeholder="e.g. Generate a question paper for 3 hour exam duration..."
                    {...register('instructions')}
                    className="w-full px-4 py-3 bg-white border border-[#eaeaea] rounded-xl text-xs text-[#181818] placeholder-gray-400 focus:outline-none transition-colors resize-none"
                  />
                </div>

                {/* Calculated statistics summary block */}
                <div className="bg-[#fae0d6]/30 border border-[#fae0d6] rounded-xl p-4 flex flex-wrap gap-x-8 gap-y-2 text-xs font-semibold text-[#ed6c37]">
                  <div>Total Questions: <span className="font-bold text-[#181818]">{totalQuestionsSum}</span></div>
                  <div>Total Marks: <span className="font-bold text-[#181818]">{totalMarksSum}</span></div>
                </div>

              </div>
            )}
          </div>

          {/* Card footer buttons */}
          <div className="bg-gray-50 border-t border-[#eaeaea] px-6 py-4 flex items-center justify-between no-print">
            {step === 2 ? (
              <button
                key="btn-step-prev"
                type="button"
                onClick={handlePrevStep}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#eaeaea] hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-600 transition-colors"
              >
                &lt; Previous
              </button>
            ) : (
              <div key="btn-step-prev-placeholder" />
            )}

            {step === 1 ? (
              <button
                key="btn-step-next"
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-1 px-5 py-2.5 bg-[#ed6c37] hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                key="btn-step-submit"
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#ed6c37] hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-500/10"
              >
                <Sparkles className="w-4 h-4 fill-white" />
                <span>Generate Assessment Paper</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
