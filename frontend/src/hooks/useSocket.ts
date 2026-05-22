import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAssignmentStore } from '../store/useAssignmentStore';
import { useUIStore } from '../store/useUIStore';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4001';

// Shared socket singleton instance to survive component remounts and React StrictMode
let sharedSocket: Socket | null = null;
let activeHookCount = 0;

const getSharedSocket = () => {
  if (!sharedSocket) {
    console.log('[Websocket] Creating new shared socket connection instance');
    sharedSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
    });
  }
  return sharedSocket;
};

export const useSocket = (activeAssignmentId?: string) => {
  const socketRef = useRef<Socket | null>(null);
  const updateAssignmentProgress = useAssignmentStore((state) => state.updateAssignmentProgress);
  const fetchAssignmentById = useAssignmentStore((state) => state.fetchAssignmentById);
  const fetchAssignments = useAssignmentStore((state) => state.fetchAssignments);
  const addToast = useUIStore((state) => state.addToast);

  // Reactively select the assignment status from the Zustand store
  const assignmentStatus = useAssignmentStore((state) => {
    if (!activeAssignmentId) return null;
    const current = state.currentAssignment;
    if (current && current._id === activeAssignmentId) return current.status;
    const found = state.assignments.find((a) => a._id === activeAssignmentId);
    return found ? found.status : null;
  });

  // 1. WebSocket Event Listeners
  useEffect(() => {
    const socket = getSharedSocket();
    socketRef.current = socket;
    activeHookCount++;
    console.log(`[Websocket] Hook mounted. Active hook count: ${activeHookCount}`);

    const joinRoom = () => {
      if (activeAssignmentId) {
        console.log(`[Websocket] Subscribing/Joining room for assignment: ${activeAssignmentId}`);
        socket.emit('join-assignment', activeAssignmentId);
      }
    };

    // If socket is already connected, join the room immediately
    if (socket.connected) {
      joinRoom();
    }

    const onConnect = () => {
      console.log(`[Websocket] Connected with ID: ${socket.id}`);
      joinRoom();
    };

    const onDisconnect = () => {
      console.log('[Websocket] Disconnected');
    };

    const onConnectError = (err: any) => {
      console.error('[Websocket] Connection error:', err);
    };

    const onStatus = (data: { status: any; progress: number; message: string }) => {
      console.log(`[Websocket] Received "status" event:`, data);
      if (activeAssignmentId) {
        updateAssignmentProgress(activeAssignmentId, data);
        
        if (data.status === 'completed') {
          console.log(`[Websocket] Generation completed for ${activeAssignmentId}. Re-fetching details...`);
          fetchAssignmentById(activeAssignmentId);
          addToast('AI Generation Complete!', 'success');
        } else if (data.status === 'failed') {
          console.log(`[Websocket] Generation failed for ${activeAssignmentId}. Re-fetching details...`);
          fetchAssignmentById(activeAssignmentId);
          addToast(`AI Generation Failed: ${data.message}`, 'error');
        }
      }
    };

    const onAssignmentUpdate = (data: { assignmentId: string; status: any; progress: number; message: string }) => {
      console.log('[Websocket] Received "assignment:update" event:', data);
      updateAssignmentProgress(data.assignmentId, data);

      if (data.status === 'completed') {
        addToast(`Paper "${data.assignmentId.substring(0, 8)}" generation complete!`, 'success');
        fetchAssignments();
      } else if (data.status === 'failed') {
        addToast(`Paper generation failed: ${data.message}`, 'error');
        fetchAssignments();
      }
    };

    // Register listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('status', onStatus);
    socket.on('assignment:update', onAssignmentUpdate);

    // Clean up listeners and disconnect if no hooks are active
    return () => {
      console.log('[Websocket] Cleaning up event listeners for this hook instance');
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('status', onStatus);
      socket.off('assignment:update', onAssignmentUpdate);

      activeHookCount--;
      if (activeHookCount <= 0 && sharedSocket) {
        console.log('[Websocket] No active hooks. Disconnecting shared socket connection.');
        sharedSocket.disconnect();
        sharedSocket = null;
      }
    };
  }, [activeAssignmentId, updateAssignmentProgress, fetchAssignmentById, fetchAssignments, addToast]);

  // 2. Polling Fallback Mechanism
  useEffect(() => {
    if (!activeAssignmentId) return;

    const isGenerating = ['queued', 'processing', 'generating'].includes(assignmentStatus || '');
    if (!isGenerating) {
      console.log(`[Polling Fallback] Assignment ${activeAssignmentId} status is "${assignmentStatus}". Polling not active.`);
      return;
    }

    console.log(`[Polling Fallback] Starting 3s polling for assignment ${activeAssignmentId}`);

    const interval = setInterval(async () => {
      console.log(`[Polling Fallback] Polling fallback triggered for assignment ${activeAssignmentId}...`);
      const assignment = await fetchAssignmentById(activeAssignmentId);
      if (assignment) {
        console.log(`[Polling Fallback] Assignment cache updated: status is "${assignment.status}"`);
      }
    }, 3000);

    return () => {
      console.log(`[Polling Fallback] Stopping polling interval for assignment ${activeAssignmentId}`);
      clearInterval(interval);
    };
  }, [activeAssignmentId, assignmentStatus, fetchAssignmentById]);

  return socketRef.current;
};
