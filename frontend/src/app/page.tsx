'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAssignmentStore, IAssignment } from '../store/useAssignmentStore';
import { useUIStore } from '../store/useUIStore';
import {
  Search,
  Filter,
  Calendar,
  Award,
  BookOpen,
  ArrowRight,
  Download,
  AlertTriangle,
  RotateCw,
  Trash2,
  CheckCircle,
  FileText,
  FilePlus2,
  Clock,
} from 'lucide-react';

export default function Dashboard() {
  const { assignments, loading, fetchAssignments, deleteAssignment, regenerateAssignment, progressUpdates } =
    useAssignmentStore();
  const addToast = useUIStore((state) => state.addToast);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch list of assignments on filter/search change
  useEffect(() => {
    fetchAssignments(searchTerm, statusFilter);
  }, [searchTerm, statusFilter, fetchAssignments]);

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

  // Status Badge Helper
  const renderStatusBadge = (assignment: IAssignment) => {
    const liveProgress = progressUpdates[assignment._id];
    const status = liveProgress?.status || assignment.status;
    const progressPercent = liveProgress?.progress || (status === 'completed' ? 100 : 0);
    const message = liveProgress?.message || '';

    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            Failed
          </span>
        );
      case 'processing':
      case 'generating':
        return (
          <span className="flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <svg className="animate-spin h-3 w-3 text-violet-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>{status === 'generating' ? 'Generating' : 'Reading File'} ({progressPercent}%)</span>
          </span>
        );
      case 'queued':
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            Queued
          </span>
        );
    }
  };

  // Statistics counters
  const totalCount = assignments.length;
  const completedCount = assignments.filter((a) => a.status === 'completed').length;
  const failedCount = assignments.filter((a) => a.status === 'failed').length;
  const generatingCount = assignments.filter((a) => ['queued', 'processing', 'generating'].includes(a.status)).length;

  return (
    <div className="space-y-8 flex-1 flex flex-col">
      {/* Header and Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            Assessment Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Create, manage and distribute AI-crafted school and university test papers.
          </p>
        </div>
        <Link
          href="/create"
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-violet-500/15"
        >
          <FilePlus2 className="w-4 h-4" />
          Create Assessment
        </Link>
      </div>

      {/* Stats Counter Panels */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Papers', value: totalCount, icon: FileText, color: 'text-gray-300' },
          { label: 'Completed', value: completedCount, icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'In Progress', value: generatingCount, icon: RotateCw, color: 'text-violet-400', spin: generatingCount > 0 },
          { label: 'Failed Tasks', value: failedCount, icon: AlertTriangle, color: 'text-rose-400' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="glass-card p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-2xl font-bold mt-1 text-white">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                <Icon className={`w-5 h-5 ${stat.spin ? 'animate-spin' : ''}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-white/5 pb-6">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-gray-500 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Search papers by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#121216] border border-white/5 rounded-xl text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Filter className="w-4 h-4 text-gray-500 absolute left-4 top-3.5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-48 pl-11 pr-8 py-3 bg-[#121216] border border-white/5 rounded-xl text-sm text-gray-400 focus:outline-none focus:border-violet-500/50 appearance-none transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="generating">Generating</option>
              <option value="queued">Queued</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid Content List */}
      {loading ? (
        // 6-Card Loading Skeleton Screen
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card p-6 rounded-2xl space-y-4 animate-pulse">
              <div className="h-4 bg-white/5 rounded w-2/3" />
              <div className="h-3 bg-white/5 rounded w-1/3" />
              <div className="border-t border-white/5 pt-4 flex justify-between">
                <div className="h-6 bg-white/5 rounded w-20" />
                <div className="h-6 bg-white/5 rounded w-24" />
              </div>
              <div className="flex gap-2">
                <div className="h-10 bg-white/5 rounded flex-1" />
                <div className="h-10 bg-white/5 rounded w-12" />
              </div>
            </div>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        // Empty State Panel
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center glass-card rounded-2xl p-10 border-dashed border-white/10">
          <div className="p-4 rounded-full bg-violet-600/10 text-violet-400 mb-4 border border-violet-500/10">
            <BookOpen className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-bold text-white">No assessments created</h3>
          <p className="text-gray-400 text-sm max-w-sm mt-2 mb-6">
            Generate customized, print-ready question papers using our structured AI services. Upload text or PDF files.
          </p>
          <Link
            href="/create"
            className="flex items-center gap-2 bg-white text-black hover:bg-gray-100 px-5 py-3 rounded-xl font-semibold text-sm transition-colors"
          >
            Create Your First Paper
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        // Filled Grid list
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment) => {
            const isFinished = assignment.status === 'completed';
            const isFailed = assignment.status === 'failed';
            const isGenerating = ['queued', 'processing', 'generating'].includes(assignment.status);
            
            return (
              <div key={assignment._id} className="glass-card rounded-2xl p-6 flex flex-col justify-between relative group">
                <div className="space-y-4">
                  {/* Card Title & Delete button */}
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="font-bold text-gray-200 group-hover:text-violet-400 transition-colors line-clamp-2">
                      {assignment.title}
                    </h4>
                    <button
                      onClick={(e) => handleDelete(assignment._id, e)}
                      className="text-gray-600 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all flex-shrink-0"
                      title="Delete Assignment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Core parameters display */}
                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-500" />
                      <span>{new Date(assignment.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <Award className="w-3.5 h-3.5 text-gray-500" />
                      <span>{assignment.marks} Marks</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-gray-500" />
                      <span>{assignment.totalQuestions} Questions</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        assignment.difficulty === 'Easy'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : assignment.difficulty === 'Medium'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {assignment.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Failed error panel */}
                  {isFailed && assignment.errorMessage && (
                    <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/10 text-xs text-rose-300/80 flex items-start gap-2 max-h-20 overflow-y-auto">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
                      <span>{assignment.errorMessage}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/5 mt-6 pt-4 flex flex-col gap-3">
                  {/* Status badge representation */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">Status</span>
                    {renderStatusBadge(assignment)}
                  </div>

                  {/* Actions buttons */}
                  {isFinished ? (
                    <div className="flex gap-2">
                      <Link
                        href={`/assignments/${assignment._id}`}
                        className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
                      >
                        View Paper
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <a
                        href={`http://localhost:4001/api/assignments/${assignment._id}/pdf`}
                        download
                        className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl border border-white/5 transition-all"
                        title="Download PDF"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="w-4.5 h-4.5" />
                      </a>
                    </div>
                  ) : isFailed ? (
                    <button
                      onClick={(e) => handleRetry(assignment._id, e)}
                      className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    >
                      <RotateCw className="w-4 h-4" />
                      Retry Generation
                    </button>
                  ) : (
                    // Spinner for generating status
                    <div className="w-full flex items-center justify-center gap-2 bg-white/5 text-gray-500 py-2.5 rounded-xl text-sm font-medium border border-transparent">
                      <span className="text-xs">Generating layout...</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
