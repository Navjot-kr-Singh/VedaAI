import { create } from 'zustand';
import api from '../utils/api';
import { useUIStore } from './useUIStore';

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

export interface IAssignment {
  _id: string;
  title: string;
  dueDate: string;
  instructions?: string;
  questionTypes: string[];
  totalQuestions: number;
  marks: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'queued' | 'processing' | 'generating' | 'completed' | 'failed';
  errorMessage?: string;
  generatedPaper?: {
    sections: ISection[];
  };
  jobId?: string;
  startedAt?: string;
  completedAt?: string;
  processingDurationMs?: number;
  createdAt: string;
}

export interface IGenerationProgress {
  status: IAssignment['status'];
  progress: number;
  message: string;
}

interface AssignmentState {
  assignments: IAssignment[];
  currentAssignment: IAssignment | null;
  loading: boolean;
  creating: boolean;
  error: string | null;
  progressUpdates: Record<string, IGenerationProgress>;
  fetchAssignments: (search?: string, status?: string) => Promise<void>;
  fetchAssignmentById: (id: string) => Promise<IAssignment | null>;
  createAssignment: (formData: FormData) => Promise<IAssignment | null>;
  regenerateAssignment: (id: string, variant?: string) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  updateAssignmentProgress: (assignmentId: string, update: IGenerationProgress) => void;
  clearCurrentAssignment: () => void;
}

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  assignments: [],
  currentAssignment: null,
  loading: false,
  creating: false,
  error: null,
  progressUpdates: {},

  fetchAssignments: async (search, status) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/assignments', {
        params: { search, status },
      });
      set({ assignments: response.data.data, loading: false });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error fetching assignments';
      set({ error: msg, loading: false });
      useUIStore.getState().addToast(msg, 'error');
    }
  },

  fetchAssignmentById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/assignments/${id}`);
      const assignment = response.data.data;
      set({ currentAssignment: assignment, loading: false });
      return assignment;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error fetching assignment details';
      set({ error: msg, loading: false });
      useUIStore.getState().addToast(msg, 'error');
      return null;
    }
  },

  createAssignment: async (formData) => {
    set({ creating: true, error: null });

    // Extract form variables for Optimistic UI insertion
    const title = formData.get('title') as string;
    const dueDate = formData.get('dueDate') as string;
    const difficulty = formData.get('difficulty') as IAssignment['difficulty'];
    const totalQuestions = Number(formData.get('totalQuestions') || 1);
    const marks = Number(formData.get('marks') || 10);
    const instructions = formData.get('instructions') as string;
    
    let questionTypes: string[] = [];
    try {
      questionTypes = JSON.parse(formData.get('questionTypes') as string);
    } catch {
      questionTypes = [formData.get('questionTypes') as string];
    }

    // Create a temporary ID and mock assignment
    const tempId = `temp-${Date.now()}`;
    const optimisticAssignment: IAssignment = {
      _id: tempId,
      title,
      dueDate,
      difficulty,
      totalQuestions,
      marks,
      instructions,
      questionTypes,
      status: 'queued',
      createdAt: new Date().toISOString(),
    };

    // Insert optimistically at the top of the assignments list
    set((state) => ({
      assignments: [optimisticAssignment, ...state.assignments],
    }));

    useUIStore.getState().addToast('Creating assignment. AI generating questions...', 'info');

    try {
      const response = await api.post('/assignments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const realAssignment = response.data.data;

      // Replace optimistic assignment with the real one returned by Express
      set((state) => ({
        assignments: state.assignments.map((a) => (a._id === tempId ? realAssignment : a)),
        creating: false,
      }));

      useUIStore.getState().addToast('Assignment queued for AI generation!', 'success');
      return realAssignment;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error creating assignment';
      
      // Remove the optimistic assignment on failure
      set((state) => ({
        assignments: state.assignments.filter((a) => a._id !== tempId),
        error: msg,
        creating: false,
      }));

      useUIStore.getState().addToast(msg, 'error');
      return null;
    }
  },

  regenerateAssignment: async (id, variant = 'default') => {
    useUIStore.getState().addToast(`Enqueuing AI regeneration (${variant})...`, 'info');
    
    // Update local card status to queued optimistically
    set((state) => ({
      assignments: state.assignments.map((a) =>
        a._id === id ? { ...a, status: 'queued', errorMessage: undefined } : a
      ),
      currentAssignment:
        state.currentAssignment?._id === id
          ? { ...state.currentAssignment, status: 'queued', errorMessage: undefined }
          : state.currentAssignment,
    }));

    try {
      const response = await api.post(`/assignments/${id}/regenerate`, null, {
        params: { variant },
      });
      
      const updated = response.data.data;
      set((state) => ({
        assignments: state.assignments.map((a) => (a._id === id ? updated : a)),
        currentAssignment: state.currentAssignment?._id === id ? updated : state.currentAssignment,
      }));

      useUIStore.getState().addToast('Assessment enqueued for regeneration!', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error regenerating assignment';
      useUIStore.getState().addToast(msg, 'error');
    }
  },

  deleteAssignment: async (id) => {
    const previousAssignments = get().assignments;
    
    // Optimistic UI deletion
    set((state) => ({
      assignments: state.assignments.filter((a) => a._id !== id),
      currentAssignment: state.currentAssignment?._id === id ? null : state.currentAssignment,
    }));

    try {
      await api.delete(`/assignments/${id}`);
      useUIStore.getState().addToast('Assignment deleted successfully', 'success');
    } catch (err: any) {
      // Revert on failure
      set({ assignments: previousAssignments });
      const msg = err.response?.data?.message || 'Error deleting assignment';
      useUIStore.getState().addToast(msg, 'error');
    }
  },

  updateAssignmentProgress: (assignmentId, update) => {
    set((state) => {
      // Update individual progress tracking dictionary
      const updatedProgress = {
        ...state.progressUpdates,
        [assignmentId]: update,
      };

      // Also update the status inside the assignments list
      const updatedAssignments = state.assignments.map((a) =>
        a._id === assignmentId ? { ...a, status: update.status } : a
      );

      // And update the currentAssignment if it's currently open
      let updatedCurrent = state.currentAssignment;
      if (updatedCurrent && updatedCurrent._id === assignmentId) {
        updatedCurrent = { ...updatedCurrent, status: update.status };
      }

      return {
        progressUpdates: updatedProgress,
        assignments: updatedAssignments,
        currentAssignment: updatedCurrent,
      };
    });
  },

  clearCurrentAssignment: () => set({ currentAssignment: null }),
}));
