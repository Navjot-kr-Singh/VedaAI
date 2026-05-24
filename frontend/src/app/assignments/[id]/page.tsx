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
  CheckCircle,
} from 'lucide-react';

export default function AssignmentDetails() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const {
    currentAssignment,
    loading,
    fetchAssignmentById,
    regenerateAssignment,
    cancelAssignment,
    progressUpdates,
    clearCurrentAssignment,
  } = useAssignmentStore();

  const addToast = useUIStore((state) => state.addToast);
  const { organizationName, organizationLocation } = useUIStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const orgName = mounted ? organizationName : 'Delhi Public School';
  const orgLoc = mounted ? organizationLocation : 'Bokaro Steel City';

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

  const handleCancel = async () => {
    if (confirm('Are you sure you want to cancel the AI generation for this assessment?')) {
      await cancelAssignment(id);
    }
  };

  // Extract real-time WebSocket progress
  const liveProgress = progressUpdates[id];
  const status = liveProgress?.status || currentAssignment?.status;
  const progressPercent = liveProgress?.progress || (status === 'completed' ? 100 : 0);
  const progressMsg = liveProgress?.message || '';

  const isGenerating = ['queued', 'processing', 'generating'].includes(status || '');
  const isFailed = status === 'failed';
  const isCancelled = status === 'cancelled';
  const isFinished = status === 'completed';

  // Count questions and marks from actual generated paper
  let generatedQuestionCount = 0;
  let generatedTotalMarks = 0;
  if (currentAssignment?.generatedPaper?.sections) {
    for (const sec of currentAssignment.generatedPaper.sections) {
      generatedQuestionCount += sec.questions.length;
      for (const q of sec.questions) {
        generatedTotalMarks += q.marks;
      }
    }
  }
  generatedTotalMarks = Math.round(generatedTotalMarks * 100) / 100;

  // Helper to color difficulty badges in UI
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Easy':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Medium':
      case 'Moderate':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Hard':
      case 'Challenging':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getDifficultyTag = (diff: string) => {
    if (!diff) return 'Easy';
    const d = diff.toLowerCase();
    if (d === 'easy') return 'Easy';
    if (d === 'medium' || d === 'moderate') return 'Moderate';
    if (d === 'hard' || d === 'challenging') return 'Challenging';
    return diff;
  };

  const getSubjectAndClass = (title: string) => {
    const lower = title.toLowerCase();
    let subject = 'Science';
    let className = '8th';
    if (lower.includes('english')) {
      subject = 'English';
      className = '5th';
    } else if (lower.includes('electricity') || lower.includes('electroplating') || lower.includes('chemical effect')) {
      subject = 'Science';
      className = '8th';
    } else if (lower.includes('math') || lower.includes('algebra')) {
      subject = 'Mathematics';
      className = '7th';
    } else {
      subject = 'Science';
      className = '8th';
    }
    return { subject, className };
  };

  if (loading && !currentAssignment) {
    // Detailed paper loading skeleton screen
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-24" />
        <div className="glass-card p-10 rounded-2xl space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto" />
          <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto" />
          <div className="border-t border-gray-100 py-4 flex gap-4">
            <div className="h-4 bg-gray-200 rounded flex-1" />
            <div className="h-4 bg-gray-200 rounded flex-1" />
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-4 pt-6">
              <div className="h-5 bg-gray-200 rounded w-1/4" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="space-y-2 pl-4">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
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
        <h3 className="text-xl font-bold text-gray-900">Paper not found</h3>
        <p className="text-gray-500 text-sm">The assessment paper you are trying to view does not exist or has been deleted.</p>
        <Link href="/" className="inline-block bg-[#181818] hover:bg-black text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const { subject, className } = getSubjectAndClass(currentAssignment.title);

  return (
    <div className="max-w-5xl mx-auto bg-[#3a3a3a] rounded-[32px] p-6 lg:p-8 space-y-6 shadow-xl print:bg-transparent print:p-0 print:shadow-none print:rounded-none">
      {/* Dark prompt card (hidden on print) */}
      {isFinished && (
        <div className="bg-[#1e1e1e] p-6 rounded-[24px] space-y-4 no-print text-left">
          <p className="text-sm font-semibold leading-relaxed text-gray-200">
            Certainly, Lakshya! Here are customized Question Paper for your CBSE Grade {className} {subject} classes on the NCERT chapters:
          </p>
          <div>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'}/assignments/${currentAssignment._id}/pdf`}
              download
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-[#181818] px-6 py-3 rounded-full font-bold text-xs transition-colors shadow-md"
            >
              <FileText className="w-4 h-4 text-[#181818]" />
              <span>Download as PDF</span>
            </a>
          </div>
        </div>
      )}

      {/* Progress update dashboard (Streaming Websocket status screen) */}
      {isGenerating && (
        <div className="glass-card rounded-2xl p-8 lg:p-12 text-center space-y-8 no-print">
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            {/* Spinning gradient border */}
            <div className="absolute inset-0 rounded-full border-4 border-gray-100 border-t-[#ed6c37] border-r-[#fae0d6] animate-spin" />
            <Clock className="w-8 h-8 text-[#ed6c37]" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-xl font-bold text-gray-800">AI Generation in Progress</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              We are parsing reference texts, building structured prompts, and verifying JSON output schemas.
            </p>
          </div>

          {/* Granular progress step list */}
          <div className="max-w-md mx-auto space-y-4 text-left border border-[#eaeaea] rounded-2xl p-6 bg-gray-50">
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
                    finished ? 'bg-emerald-500' : active ? 'bg-[#ed6c37] animate-ping' : 'bg-gray-200'
                  }`} />
                  <span className={finished ? 'text-gray-500 font-semibold' : active ? 'text-[#ed6c37] font-bold' : 'text-gray-400'}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto space-y-4">
            <div className="space-y-2">
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-[#ed6c37] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 px-1">
                <span>{progressMsg || 'Processing...'}</span>
                <span>{progressPercent}%</span>
              </div>
            </div>

            <button
              onClick={handleCancel}
              className="flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors mx-auto"
            >
              Cancel Generation
            </button>
          </div>
        </div>
      )}

      {/* Cancelled Box */}
      {isCancelled && (
        <div className="glass-card rounded-2xl p-8 lg:p-12 text-center space-y-6 no-print border-amber-200 bg-amber-50/50">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-full w-16 h-16 mx-auto flex items-center justify-center border border-amber-200">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-800">Generation Cancelled</h3>
            <p className="text-xs text-amber-800 max-w-md mx-auto leading-relaxed">
              The AI question generation was cancelled by the user. You can retry generation at any time.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={() => handleRegenerate('default')}
              className="flex items-center gap-2 bg-[#181818] hover:bg-black text-white px-5 py-3 rounded-xl font-bold text-xs transition-colors"
            >
              <RotateCw className="w-4 h-4" />
              Retry Standard Generation
            </button>
            <button
              onClick={() => handleRegenerate('mcq_only')}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-5 py-3 rounded-xl font-bold text-xs border border-[#eaeaea] transition-colors"
            >
              <ListTodo className="w-4 h-4 text-blue-500" />
              Retry as MCQ Only
            </button>
          </div>
        </div>
      )}

      {/* Failure Box */}
      {isFailed && (
        <div className="glass-card rounded-2xl p-8 lg:p-12 text-center space-y-6 no-print border-rose-200 bg-rose-50/50">
          <div className="p-4 bg-rose-50 text-rose-600 rounded-full w-16 h-16 mx-auto flex items-center justify-center border border-rose-200">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-800">AI Question Generation Failed</h3>
            <p className="text-xs text-rose-800 max-w-md mx-auto leading-relaxed">
              {currentAssignment.errorMessage || 'The AI model failed to output structure conformant JSON or timed out.'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={() => handleRegenerate('default')}
              className="flex items-center gap-2 bg-[#181818] hover:bg-black text-white px-5 py-3 rounded-xl font-bold text-xs transition-colors"
            >
              <RotateCw className="w-4 h-4" />
              Retry Standard Generation
            </button>
            <button
              onClick={() => handleRegenerate('mcq_only')}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-5 py-3 rounded-xl font-bold text-xs border border-[#eaeaea] transition-colors"
            >
              <ListTodo className="w-4 h-4 text-blue-500" />
              Retry as MCQ Only
            </button>
          </div>
        </div>
      )}

      {/* Skeletons sheet beneath progress screens */}
      {isGenerating && (
        <div className="glass-card p-8 rounded-2xl opacity-40 pointer-events-none no-print">
          <div className="h-6 bg-gray-100 rounded w-1/3 mx-auto mb-6 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-1/2 mx-auto mb-10 animate-pulse" />
          <div className="space-y-4">
            <div className="h-4 bg-gray-100 rounded w-1/4 animate-pulse" />
            <div className="h-3 bg-gray-100 rounded w-full animate-pulse" />
            <div className="h-3 bg-gray-100 rounded w-5/6 animate-pulse" />
          </div>
        </div>
      )}

      {/* Printable Exam Paper Content */}
      {(isFinished || (isGenerating && currentAssignment.generatedPaper)) && (
        (() => {
          const { subject, className } = getSubjectAndClass(currentAssignment.title);
          const timeAllowed = currentAssignment.marks <= 20 ? '45 minutes' : currentAssignment.marks <= 50 ? '90 minutes' : '3 hours';
          let globalQNum = 0;
          const hasAnswers = currentAssignment.generatedPaper?.sections.some(sec => 
            sec.questions.some(q => q.correctAnswer)
          );

          return (
            <div className="print-container bg-white text-black p-8 lg:p-12 shadow-md rounded-[24px] border border-[#eaeaea] flex flex-col font-sans">
              {/* Header */}
              <div className="text-center pb-4">
                <h1 className="text-[24px] font-bold text-black tracking-tight mb-2">
                  {orgName}, {orgLoc}
                </h1>
                
                <div className="text-center font-bold text-[#181818] text-sm space-y-1 mt-3 mb-4">
                  <div>Subject: {subject}</div>
                  <div>Class: {className}</div>
                </div>

                <div className="flex justify-between items-center text-xs font-bold text-[#181818] mt-4 border-b border-black pb-4">
                  <div>Time Allowed: {timeAllowed}</div>
                  <div>Maximum Marks: {currentAssignment.marks}</div>
                </div>

                <p className="text-xs font-semibold text-gray-600 mt-4 text-left font-sans">
                  All questions are compulsory unless stated otherwise.
                </p>
              </div>

              {/* Student blanks sheet */}
              <div className="space-y-3 py-2 text-xs font-semibold text-gray-800 text-left">
                <div>Name: ________________________________________________________________</div>
                <div>Roll Number: ___________________________________________________________</div>
                <div>Class: {className} &nbsp;&nbsp;&nbsp;&nbsp; Section: ____________________________________________</div>
              </div>
              <div className="border-t border-black/20 my-4" />

              {/* Specific Instruction */}
              {currentAssignment.instructions && (
                <div className="py-4 border-b border-black/30 text-xs text-gray-600 leading-relaxed font-sans text-left">
                  <strong className="block text-xs font-bold text-gray-800 mb-1 font-sans">General Instructions:</strong>
                  {currentAssignment.instructions}
                </div>
              )}

              {/* Paper Sections */}
              <div className="flex-1 space-y-8 pt-8">
                {currentAssignment.generatedPaper?.sections.map((section, sIndex) => (
                  <div key={sIndex} className="print-section space-y-4">
                    {/* Section Header */}
                    <div className="text-center pb-2">
                      <h3 className="text-base font-bold text-center text-black mb-3 uppercase tracking-wider font-sans">
                        {section.title}
                      </h3>
                      <div className="text-xs text-left text-gray-800 font-sans whitespace-pre-line leading-relaxed space-y-1 mb-4">
                        {(section.instruction || '').split('\n').map((line, idx) => {
                          const isHeaderLine = idx === 0 && line.length < 50;
                          return (
                            <div key={idx} className={isHeaderLine ? "font-bold text-sm mb-1 text-black" : "italic text-gray-600"}>
                              {line}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Section Questions */}
                    <div className="space-y-4 pl-2">
                      {section.questions.map((q, qIndex) => {
                        globalQNum++;
                        return (
                          <div key={qIndex} className="print-question flex flex-col text-sm text-black leading-relaxed font-sans mb-4 text-left">
                            <div>
                              <span className="font-bold mr-2">{globalQNum}.</span>
                              <span>{q.text}</span>
                              <span className="font-bold ml-2">[{q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}]</span>
                            </div>
                            {q.type === 'MCQ' && q.options && q.options.length > 0 && (
                              <div className="mt-2.5 space-y-1.5 pl-6 font-sans">
                                {q.options.map((opt, optIndex) => (
                                  <div key={optIndex} className="text-sm text-gray-800 flex items-start gap-1">
                                    <span className="font-bold text-[#181818] min-w-[20px]">{String.fromCharCode(65 + optIndex)}.</span>
                                    <span>{opt}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* End of Question Paper line */}
              <div className="border-t border-black/20 mt-12 pt-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-widest no-print">
                *** End of Question Paper ***
              </div>
              <div className="hidden print:block border-t-2 border-black/80 mt-12 pt-4 text-center text-[10px] text-gray-500 font-sans font-semibold uppercase">
                *** End of Assessment Paper ***
              </div>

              {/* Answer Key section (Screenshot 10/13) */}
              {hasAnswers && (
                <div className="mt-12 pt-8 border-t-2 border-black print-section text-left">
                  <h3 className="text-base font-bold font-sans text-black mb-4">Answer Key:</h3>
                  <div className="space-y-4 pl-2">
                    {(() => {
                      let ansNumber = 0;
                      return currentAssignment.generatedPaper?.sections.flatMap((section) =>
                        section.questions.map((q, qIndex) => {
                          ansNumber++;
                          return (
                            <div key={ansNumber} className="text-sm font-sans text-black leading-relaxed flex items-start gap-2">
                              <span className="font-bold min-w-[20px]">{ansNumber}.</span>
                              <span className="flex-1">{q.correctAnswer || 'Answer explanation not provided.'}</span>
                            </div>
                          );
                        })
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          );
        })()
      )}
    </div>
  );
}
