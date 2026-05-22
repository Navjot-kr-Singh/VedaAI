'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAssignmentStore, IAssignment } from '../store/useAssignmentStore';
import { useUIStore } from '../store/useUIStore';
import {
  Calendar,
  Award,
  Trash2,
  CheckCircle,
  FileText,
  AlertTriangle,
  RotateCw,
  Clock,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export default function Dashboard() {
  const { assignments, loading, fetchAssignments, deleteAssignment, regenerateAssignment, cancelAssignment, progressUpdates } =
    useAssignmentStore();
  const addToast = useUIStore((state) => state.addToast);

  // Default parameters for backend query
  const [searchTerm] = useState('');
  const [statusFilter] = useState('');

  // Fetch list of assignments
  useEffect(() => {
    fetchAssignments(searchTerm, statusFilter);
  }, [searchTerm, statusFilter, fetchAssignments]);

  // Dashboard polling fallback for active generations
  useEffect(() => {
    const hasGenerating = assignments.some((a) =>
      ['queued', 'processing', 'generating'].includes(a.status)
    );

    if (!hasGenerating) return;

    const interval = setInterval(() => {
      fetchAssignments(searchTerm, statusFilter);
    }, 4000);

    return () => {
      clearInterval(interval);
    };
  }, [assignments, searchTerm, statusFilter, fetchAssignments]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this assessment paper?')) {
      await deleteAssignment(id);
    }
  };

  const handleRetry = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await regenerateAssignment(id, 'default');
  };

  const handleCancel = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to cancel the AI generation for this assessment?')) {
      await cancelAssignment(id);
    }
  };

  // Format date helper: DD-MM-YYYY
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  // Status Badge Helper for light mode
  const renderStatusBadge = (assignment: IAssignment) => {
    const liveProgress = progressUpdates[assignment._id];
    const status = liveProgress?.status || assignment.status;
    const progressPercent = liveProgress?.progress || (status === 'completed' ? 100 : 0);

    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            Failed
          </span>
        );
      case 'processing':
      case 'generating':
        return (
          <span className="flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-[#ed6c37] border border-orange-200">
            <svg className="animate-spin h-3 w-3 text-[#ed6c37]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>{status === 'generating' ? 'Generating' : 'Reading File'} ({progressPercent}%)</span>
          </span>
        );
      case 'queued':
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            Queued
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col relative pb-24 px-1 lg:px-4">
      {/* Title */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#181818] tracking-tight">Assignments</h2>
          <p className="text-gray-500 text-xs mt-0.5">Manage and view your question papers</p>
        </div>
      </div>

      {loading ? (
        // Grid Loading Skeleton Screen
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-[#eaeaea] p-6 rounded-2xl space-y-4 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-2/3" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
              <div className="border-t border-[#eaeaea] pt-4 flex justify-between">
                <div className="h-4 bg-gray-100 rounded w-16" />
                <div className="h-4 bg-gray-100 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        // Empty State Panel (Screenshot 1/2)
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-8 text-center bg-white border border-[#eaeaea] rounded-2xl shadow-sm max-w-2xl mx-auto my-auto w-full">
          <div className="p-4 rounded-full bg-[#fae0d6] text-[#ed6c37] mb-5 border border-orange-100">
            <BookOpen className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-bold text-[#181818]">No assignments yet</h3>
          <p className="text-gray-500 text-xs max-w-md mt-2 mb-8 leading-relaxed">
            Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.
          </p>
          <Link
            href="/create"
            className="flex items-center gap-2 bg-[#ed6c37] hover:bg-orange-600 text-white px-5 py-3 rounded-xl font-bold text-xs transition-colors shadow-md shadow-orange-500/10"
          >
            + Create Your First Assignment
          </Link>
        </div>
      ) : (
        // Filled Grid List (Screenshot 3/5)
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {assignments.map((assignment) => {
              const isFinished = assignment.status === 'completed';
              const isFailed = assignment.status === 'failed' || assignment.status === 'cancelled';
              const isGenerating = ['queued', 'processing', 'generating'].includes(assignment.status);
              
              return (
                <div
                  key={assignment._id}
                  className="bg-white border border-[#eaeaea] rounded-2xl p-6 flex flex-col justify-between hover:border-[#ed6c37] transition-all duration-200 relative group shadow-sm"
                >
                  <div className="space-y-4">
                    {/* Header: Title */}
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="font-bold text-sm text-[#181818] leading-snug truncate-2-lines">
                        {assignment.title}
                      </h4>
                    </div>

                    {/* Metadata lines */}
                    <div className="space-y-1.5 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>Assigned on : {formatDate(assignment.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>Due: {formatDate(assignment.dueDate)}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-1 font-semibold text-gray-700">
                        <Award className="w-3.5 h-3.5 text-gray-400" />
                        <span>{assignment.marks} Marks • {assignment.totalQuestions} Questions • {assignment.difficulty}</span>
                      </div>
                    </div>

                    {/* Failed Error Message panel */}
                    {isFailed && assignment.errorMessage && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-[11px] text-rose-700 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-500 mt-0.5" />
                        <span>{assignment.errorMessage}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[#eaeaea] mt-5 pt-4 flex flex-col gap-3">
                    {/* Status indicator row */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 font-medium">Status</span>
                      {renderStatusBadge(assignment)}
                    </div>

                    {/* Action buttons/links */}
                    {isFinished ? (
                      <div className="flex items-center justify-between gap-4 mt-1 pt-1">
                        <Link
                          href={`/assignments/${assignment._id}`}
                          className="text-xs font-bold text-[#ed6c37] hover:underline"
                        >
                          View Assignment
                        </Link>
                        <button
                          onClick={(e) => handleDelete(assignment._id, e)}
                          className="text-xs font-semibold text-gray-400 hover:text-red-500 hover:underline flex items-center gap-1 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    ) : isFailed ? (
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => handleRetry(assignment._id, e)}
                          className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 border border-[#eaeaea] text-gray-700 py-2.5 rounded-xl text-xs font-bold transition-colors"
                        >
                          <RotateCw className="w-4 h-4" />
                          Retry Generation
                        </button>
                        <button
                          onClick={(e) => handleDelete(assignment._id, e)}
                          className="px-3 border border-[#eaeaea] text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : isGenerating ? (
                      <button
                        onClick={(e) => handleCancel(assignment._id, e)}
                        className="w-full flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 py-2 rounded-xl text-xs font-bold transition-colors"
                      >
                        Cancel Generation
                      </button>
                    ) : (
                      <div className="w-full flex items-center justify-center gap-2 bg-gray-50 text-gray-400 py-2 rounded-xl text-xs font-medium border border-transparent">
                        <span>Queued...</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Floating Dark Action Button (Screenshot 3) */}
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-30 no-print">
            <Link
              href="/create"
              className="flex items-center gap-2.5 bg-[#181818] hover:bg-black text-white px-7 py-4 rounded-full font-bold text-sm transition-all shadow-xl hover:-translate-y-0.5 duration-150"
            >
              <Sparkles className="w-4.5 h-4.5 text-white fill-white" />
              <span>+ Create Assignment</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
