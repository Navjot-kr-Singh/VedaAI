'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAssignmentStore, IAssignment } from '../../../store/useAssignmentStore';
import { useUIStore } from '../../../store/useUIStore';
import { useSocket } from '../../../hooks/useSocket';
import {
  ArrowLeft,
  Download,
  Printer,
  Sparkles,
  AlertTriangle,
  RotateCw,
  Award,
  Layers,
  Calendar,
  FileText,
  Clock,
  TrendingDown,
  TrendingUp,
  ListTodo,
} from 'lucide-react';

export default function AssignmentDetails() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const {
    currentAssignment,
    loading,
    fetchAssignmentById,
    regenerateAssignment,
    progressUpdates,
    clearCurrentAssignment,
  } = useAssignmentStore();

  const addToast = useUIStore((state) => state.addToast);
  const [variantDropdownOpen, setVariantDropdownOpen] = useState(false);

  // Initialize socket room connection for this assignment id
  useSocket(id);

  useEffect(() => {
    fetchAssignmentById(id);
    return () => {
      clearCurrentAssignment();
    };
  }, [id, fetchAssignmentById, clearCurrentAssignment]);

  const handlePrint = () => {
    window.print();
  };

  const handleRegenerate = async (variant: string) => {
    setVariantDropdownOpen(false);
    await regenerateAssignment(id, variant);
  };

  // Extract real-time WebSocket progress
  const liveProgress = progressUpdates[id];
  const status = liveProgress?.status || currentAssignment?.status;
  const progressPercent = liveProgress?.progress || (status === 'completed' ? 100 : 0);
  const progressMsg = liveProgress?.message || '';

  const isGenerating = ['queued', 'processing', 'generating'].includes(status || '');
  const isFailed = status === 'failed';
  const isFinished = status === 'completed';

  // Helper to color difficulty badges in UI
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Easy':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Hard':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  if (loading && !currentAssignment) {
    // Detailed paper loading skeleton screen
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-4 bg-white/5 rounded w-24" />
        <div className="glass-card p-10 rounded-2xl space-y-8">
          <div className="h-8 bg-white/5 rounded w-1/2 mx-auto" />
          <div className="h-4 bg-white/5 rounded w-1/3 mx-auto" />
          <div className="border-t border-white/5 py-4 flex gap-4">
            <div className="h-4 bg-white/5 rounded flex-1" />
            <div className="h-4 bg-white/5 rounded flex-1" />
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-4 pt-6">
              <div className="h-5 bg-white/5 rounded w-1/4" />
              <div className="h-4 bg-white/5 rounded w-1/3" />
              <div className="space-y-2 pl-4">
                <div className="h-4 bg-white/5 rounded w-full" />
                <div className="h-4 bg-white/5 rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!currentAssignment) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-xl font-bold text-white">Paper not found</h3>
        <p className="text-gray-400 text-sm">The assessment paper you are trying to view does not exist or has been deleted.</p>
        <Link href="/" className="inline-block bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Panel (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4 no-print">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {isFinished && (
          <div className="flex items-center gap-3">
            {/* AI Regeneration Variants dropdown */}
            <div className="relative">
              <button
                onClick={() => setVariantDropdownOpen(!variantDropdownOpen)}
                className="flex items-center gap-2 bg-[#121216] border border-white/5 hover:border-violet-500/30 text-gray-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              >
                <Sparkles className="w-4 h-4 text-violet-400" />
                AI Variants
              </button>
              {variantDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#0e0e12] border border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-slide-in">
                  <button
                    onClick={() => handleRegenerate('default')}
                    className="w-full text-left px-4 py-2.5 text-xs text-gray-400 hover:bg-white/5 hover:text-white flex items-center gap-2"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    Regenerate Default
                  </button>
                  <button
                    onClick={() => handleRegenerate('easier')}
                    className="w-full text-left px-4 py-2.5 text-xs text-gray-400 hover:bg-white/5 hover:text-white flex items-center gap-2"
                  >
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                    Regenerate Easier Paper
                  </button>
                  <button
                    onClick={() => handleRegenerate('harder')}
                    className="w-full text-left px-4 py-2.5 text-xs text-gray-400 hover:bg-white/5 hover:text-white flex items-center gap-2"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                    Regenerate Harder Paper
                  </button>
                  <button
                    onClick={() => handleRegenerate('mcq_only')}
                    className="w-full text-left px-4 py-2.5 text-xs text-gray-400 hover:bg-white/5 hover:text-white flex items-center gap-2"
                  >
                    <ListTodo className="w-3.5 h-3.5 text-blue-400" />
                    Convert to MCQ Only
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-[#121216] border border-white/5 hover:border-white/10 text-gray-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>

            <a
              href={`http://localhost:4001/api/assignments/${currentAssignment._id}/pdf`}
              download
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-violet-500/15"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </a>
          </div>
        )}
      </div>

      {/* Progress update dashboard (Streaming Websocket status screen) */}
      {isGenerating && (
        <div className="glass-card rounded-2xl p-8 lg:p-12 text-center space-y-8 no-print">
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            {/* Spinning gradient border */}
            <div className="absolute inset-0 rounded-full border-4 border-white/5 border-t-violet-500 border-r-indigo-500 animate-spin" />
            <Clock className="w-8 h-8 text-violet-400" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-xl font-bold text-white">AI Generation in Progress</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              We are parsing reference texts, building structured prompts, and verifying JSON output schemas.
            </p>
          </div>

          {/* Granular progress step list */}
          <div className="max-w-md mx-auto space-y-4 text-left border border-white/5 rounded-2xl p-6 bg-[#0c0c0e]">
            {[
              { label: 'Reading reference study materials', start: 10, end: 35 },
              { label: 'Formulating structured questions via LLM', start: 40, end: 80 },
              { label: 'Validating response against Zod schemas', start: 85, end: 95 },
              { label: 'Formatting final printable assessment paper', start: 100, end: 100 },
            ].map((step, i) => {
              const active = progressPercent >= step.start && progressPercent <= step.end;
              const finished = progressPercent > step.end;
              return (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    finished ? 'bg-emerald-500' : active ? 'bg-violet-500 animate-ping' : 'bg-white/10'
                  }`} />
                  <span className={finished ? 'text-gray-400 font-medium' : active ? 'text-white font-bold' : 'text-gray-600'}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto space-y-2">
            <div className="w-full bg-white/5 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-violet-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 px-1">
              <span>{progressMsg || 'Processing...'}</span>
              <span>{progressPercent}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Failure Box */}
      {isFailed && (
        <div className="glass-card rounded-2xl p-8 lg:p-12 text-center space-y-6 no-print border-rose-500/20 bg-rose-950/5">
          <div className="p-4 bg-rose-500/10 text-rose-400 rounded-full w-16 h-16 mx-auto flex items-center justify-center border border-rose-500/15">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">AI Question Generation Failed</h3>
            <p className="text-sm text-rose-300/80 max-w-md mx-auto leading-relaxed">
              {currentAssignment.errorMessage || 'The AI model failed to output structure conformant JSON or timed out.'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={() => handleRegenerate('default')}
              className="flex items-center gap-2 bg-white text-black hover:bg-gray-100 px-5 py-3 rounded-xl font-semibold text-sm transition-colors"
            >
              <RotateCw className="w-4 h-4" />
              Retry Standard Generation
            </button>
            <button
              onClick={() => handleRegenerate('mcq_only')}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-5 py-3 rounded-xl font-semibold text-sm border border-white/5 transition-colors"
            >
              <ListTodo className="w-4 h-4" />
              Retry as MCQ Only
            </button>
          </div>
        </div>
      )}

      {/* Skeletons sheet beneath progress screens */}
      {isGenerating && (
        <div className="glass-card p-8 rounded-2xl opacity-20 pointer-events-none no-print">
          <div className="h-6 bg-white/10 rounded w-1/3 mx-auto mb-6" />
          <div className="h-4 bg-white/10 rounded w-1/2 mx-auto mb-10" />
          <div className="space-y-4">
            <div className="h-4 bg-white/10 rounded w-1/4" />
            <div className="h-3 bg-white/10 rounded w-full" />
            <div className="h-3 bg-white/10 rounded w-5/6" />
          </div>
        </div>
      )}

      {/* Printable Exam Paper Content */}
      {(isFinished || (isGenerating && currentAssignment.generatedPaper)) && (
        <div className="print-container bg-white text-black p-8 lg:p-12 shadow-2xl rounded-2xl border border-white/5 flex flex-col font-serif">
          {/* Header */}
          <div className="text-center space-y-2 border-b-2 border-black/80 pb-6">
            <h1 className="text-2xl font-bold font-serif text-black uppercase tracking-wide">
              {currentAssignment.title}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-sans text-gray-600 pt-1 font-semibold uppercase">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400 no-print" />
                Due: {new Date(currentAssignment.dueDate).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-gray-400 no-print" />
                Total Marks: {currentAssignment.marks}
              </span>
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-gray-400 no-print" />
                Difficulty: {currentAssignment.difficulty}
              </span>
            </div>
          </div>

          {/* Student blanks sheet */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-b border-black text-sm font-sans text-gray-700">
            <div>Student Name: <span className="inline-block w-40 border-b border-black/40" /></div>
            <div>Roll Number: <span className="inline-block w-32 border-b border-black/40" /></div>
            <div>Section/Class: <span className="inline-block w-24 border-b border-black/40" /></div>
          </div>

          {/* Specific Instruction */}
          {currentAssignment.instructions && (
            <div className="py-6 border-b border-black/40 text-xs italic text-gray-600 leading-relaxed font-sans">
              <strong className="block text-sm font-bold text-gray-800 not-italic mb-1 font-sans">General Instructions:</strong>
              {currentAssignment.instructions}
            </div>
          )}

          {/* Paper Sections */}
          <div className="flex-1 space-y-8 pt-8">
            {currentAssignment.generatedPaper?.sections.map((section, sIndex) => (
              <div key={sIndex} className="print-section space-y-4">
                {/* Section Header */}
                <div className="border-b border-black/10 pb-2">
                  <h3 className="text-base font-bold font-sans text-black flex items-center justify-between">
                    <span>{section.title}</span>
                  </h3>
                  <p className="text-xs italic text-gray-600 font-sans mt-0.5">
                    {section.instruction}
                  </p>
                </div>

                {/* Section Questions */}
                <div className="space-y-4 pl-2">
                  {section.questions.map((q, qIndex) => (
                    <div key={qIndex} className="print-question flex items-start gap-4 text-sm justify-between">
                      {/* Left: text */}
                      <div className="space-y-1.5 flex-1 pr-6 text-black leading-relaxed font-serif">
                        <div>
                          <span className="font-bold font-sans mr-2">{qIndex + 1}.</span>
                          <span>{q.text}</span>
                        </div>
                        {q.type === 'MCQ' && q.options && q.options.length > 0 && (
                          <div className="mt-3 space-y-1.5 pl-6 font-sans">
                            {q.options.map((opt, optIndex) => (
                              <div key={optIndex} className="flex gap-2 text-sm">
                                <span className="font-semibold">{String.fromCharCode(65 + optIndex)}.</span>
                                <span>{opt}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: metadata (badges & marks) */}
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0 font-sans text-xs">
                        <span className="font-bold text-black">[ {q.marks} Marks ]</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer print line */}
          <div className="border-t-2 border-black/80 mt-12 pt-4 text-center text-[10px] text-gray-500 font-sans font-semibold uppercase">
            *** End of Assessment Paper ***
          </div>
        </div>
      )}
    </div>
  );
}
