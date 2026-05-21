import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAssignmentStore } from '../store/useAssignmentStore';
import { useUIStore } from '../store/useUIStore';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4001';

export const useSocket = (activeAssignmentId?: string) => {
  const socketRef = useRef<Socket | null>(null);
  const updateAssignmentProgress = useAssignmentStore((state) => state.updateAssignmentProgress);
  const fetchAssignmentById = useAssignmentStore((state) => state.fetchAssignmentById);
  const fetchAssignments = useAssignmentStore((state) => state.fetchAssignments);
  const addToast = useUIStore((state) => state.addToast);

  useEffect(() => {
    // 1. Establish socket connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`Websocket connected with ID: ${socket.id}`);
      
      // If we are on a detail page, join the assignment room immediately
      if (activeAssignmentId) {
        socket.emit('join-assignment', activeAssignmentId);
      }
    });

    // 2. Listen for granular progress/status updates from the BullMQ worker
    socket.on('status', (data: { status: any; progress: number; message: string }) => {
      if (activeAssignmentId) {
        console.log(`Socket status update for ${activeAssignmentId}:`, data);
        updateAssignmentProgress(activeAssignmentId, data);
        
        // Ifcompleted, fetch full assignment payload to refresh output rendering
        if (data.status === 'completed') {
          fetchAssignmentById(activeAssignmentId);
          addToast('AI Generation Complete!', 'success');
        } else if (data.status === 'failed') {
          fetchAssignmentById(activeAssignmentId);
          addToast(`AI Generation Failed: ${data.message}`, 'error');
        }
      }
    });

    // 3. Listen for global updates (e.g. dashboard card additions/status modifications)
    socket.on('assignment:update', (data: { assignmentId: string; status: any; progress: number; message: string }) => {
      console.log('Global assignment update received:', data);
      
      // Update store state
      updateAssignmentProgress(data.assignmentId, data);

      if (data.status === 'completed') {
        addToast(`Paper "${data.assignmentId.substring(0, 8)}" generation complete!`, 'success');
        fetchAssignments(); // reload list
      } else if (data.status === 'failed') {
        addToast(`Paper generation failed: ${data.message}`, 'error');
        fetchAssignments();
      }
    });

    socket.on('disconnect', () => {
      console.log('Websocket disconnected');
    });

    socket.on('connect_error', (err) => {
      console.error('Websocket connection error:', err);
    });

    // Clean up
    return () => {
      socket.disconnect();
    };
  }, [activeAssignmentId, updateAssignmentProgress, fetchAssignmentById, fetchAssignments, addToast]);

  return socketRef.current;
};
