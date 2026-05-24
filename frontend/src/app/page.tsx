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
  MoreVertical,
  SlidersHorizontal,
  Plus,
  Search,
} from 'lucide-react';

export default function Dashboard() {
  const { assignments, loading, fetchAssignments, deleteAssignment, regenerateAssignment, cancelAssignment, progressUpdates } =
    useAssignmentStore();
  const addToast = useUIStore((state) => state.addToast);

  const [searchTerm] = useState('');
  const [statusFilter] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

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

  // Close card menu on click outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMenuId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, []);

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
      {/* Subheader page title */}
      <div className="mb-6 mt-2 text-left">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#34c759] flex-shrink-0" />
          <h2 className="text-[19px] font-bold text-[#181818] tracking-tight">Assignments</h2>
        </div>
        <p className="text-gray-500 text-xs mt-1 pl-[18px]">Manage and create assignments for your classes.</p>
      </div>

      {/* Filter and Search Bar Capsule */}
      <div className="bg-white rounded-full border border-[#eaeaea] h-[48px] px-6 flex items-center justify-between shadow-sm mb-6 no-print">
        <span className="text-xs font-bold text-gray-500 flex items-center gap-2 cursor-pointer hover:text-gray-900">
          <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
          Filter By
        </span>
        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Assignment"
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-[#eaeaea] rounded-full text-xs placeholder-gray-400 focus:outline-none focus:border-[#ed6c37]"
          />
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
        // Empty State Panel (Figma Screenshot 1)
        <div className="flex-1 flex flex-col items-center justify-center py-14 px-8 text-center max-w-2xl mx-auto my-auto w-full">
          {/* Custom Pixel-Perfect Figma SVG Illustration */}
          <svg viewBox="0 0 400 280" className="w-64 h-48 mb-6" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Soft grey background circle */}
            <circle cx="200" cy="140" r="90" fill="#f0f0f2" />
            
            {/* Squiggle top left */}
            <path d="M125 110 C125 75, 165 75, 140 100 C120 120, 110 115, 145 80" stroke="#18181b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* Sparkle bottom left */}
            <path d="M135 190 Q135 198 127 198 Q135 198 135 206 Q135 198 143 198 Q135 198 135 190 Z" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

            {/* Blue dot right */}
            <circle cx="280" cy="165" r="4" fill="#2563eb" />
            
            {/* Small grey header card top right */}
            <rect x="240" y="75" width="50" height="32" rx="6" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
            <circle cx="250" cy="91" r="3.5" fill="#cbd5e1" />
            <rect x="260" y="87" width="22" height="8" rx="4" fill="#cbd5e1" />
            
            {/* White document card in background */}
            <rect x="155" y="85" width="90" height="120" rx="12" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
            {/* Card content lines */}
            <line x1="167" y1="105" x2="200" y2="105" stroke="#18181b" strokeWidth="6" strokeLinecap="round" />
            <line x1="167" y1="123" x2="225" y2="123" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
            <line x1="167" y1="141" x2="225" y2="141" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
            <line x1="167" y1="159" x2="200" y2="159" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
            <line x1="167" y1="177" x2="220" y2="177" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />

            {/* Magnifying glass overlay */}
            {/* Glass Handle */}
            <line x1="232" y1="172" x2="267" y2="207" stroke="#c0c0e0" strokeWidth="11" strokeLinecap="round" />
            <line x1="232" y1="172" x2="267" y2="207" stroke="#d5d5ed" strokeWidth="7" strokeLinecap="round" />
            {/* Glass Ring */}
            <circle cx="205" cy="145" r="36" fill="#e8e8f8" fillOpacity="0.4" stroke="#c0c0e0" strokeWidth="6" />
            
            {/* Red X mark inside lens */}
            <line x1="193" y1="133" x2="217" y2="157" stroke="#ef4444" strokeWidth="7" strokeLinecap="round" />
            <line x1="217" y1="133" x2="193" y2="157" stroke="#ef4444" strokeWidth="7" strokeLinecap="round" />
          </svg>
          <h3 className="text-xl font-bold text-[#181818] tracking-tight">No assignments yet</h3>
          <p className="text-gray-500 text-xs max-w-md mt-2 mb-8 leading-relaxed">
            Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.
          </p>
          <Link
            href="/create"
            className="flex items-center justify-center bg-[#181818] hover:bg-black text-white px-7 py-3.5 rounded-full font-bold text-xs transition-colors shadow-lg cursor-pointer"
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
              
              if (isFinished) {
                return (
                  <div
                    key={assignment._id}
                    className="bg-white border border-[#eaeaea] rounded-[24px] p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative min-h-[140px]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="font-bold text-base text-[#181818] tracking-tight truncate-2-lines text-left">
                        {assignment.title}
                      </h4>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === assignment._id ? null : assignment._id);
                          }}
                          className="text-gray-400 hover:text-gray-700 p-1 rounded-full cursor-pointer focus:outline-none"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {activeMenuId === assignment._id && (
                          <div className="absolute right-0 mt-1 bg-white border border-[#eaeaea] rounded-xl shadow-lg py-1.5 w-36 z-20 text-left">
                            <Link
                              href={`/assignments/${assignment._id}`}
                              className="block px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={() => setActiveMenuId(null)}
                            >
                              View Assignment
                            </Link>
                            <button
                              type="button"
                              onClick={(e) => {
                                handleDelete(assignment._id, e);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
                      <span>Assigned on : {formatDate(assignment.createdAt)}</span>
                      <span>Due : {formatDate(assignment.dueDate)}</span>
                    </div>
                  </div>
                );
              }

              if (isGenerating) {
                return (
                  <div
                    key={assignment._id}
                    className="bg-white border border-[#eaeaea] rounded-[24px] p-6 flex flex-col justify-between relative min-h-[140px]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="font-bold text-base text-[#181818] tracking-tight truncate-2-lines text-left">
                        {assignment.title}
                      </h4>
                      <div className="text-[11px] font-bold text-[#ed6c37] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 flex items-center gap-1.5 shrink-0">
                        <svg className="animate-spin h-3 w-3 text-[#ed6c37]" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Generating...</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-[#ed6c37] h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${progressUpdates[assignment._id]?.progress || 0}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold">
                        <span>Assigned on : {formatDate(assignment.createdAt)}</span>
                        <button
                          type="button"
                          onClick={(e) => handleCancel(assignment._id, e)}
                          className="text-rose-600 hover:underline cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              // Failed/Cancelled state card
              return (
                <div
                  key={assignment._id}
                  className="bg-white border border-[#eaeaea] rounded-[24px] p-6 flex flex-col justify-between relative min-h-[140px]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="font-bold text-base text-[#181818] tracking-tight truncate-2-lines text-left">
                      {assignment.title}
                    </h4>
                    <div className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 shrink-0">
                      Failed
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
                    <button
                      type="button"
                      onClick={(e) => handleRetry(assignment._id, e)}
                      className="text-[#ed6c37] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCw className="w-3 h-3" /> Retry
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(assignment._id, e)}
                      className="text-red-500 hover:underline cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Floating Dark Action Button (Screenshot 3) */}
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-30 no-print">
            <Link
              href="/create"
              className="flex items-center gap-1.5 bg-[#181818] hover:bg-black text-white px-7 py-3.5 rounded-full font-bold text-xs transition-all shadow-xl hover:-translate-y-0.5 duration-150"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Create Assignment</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
