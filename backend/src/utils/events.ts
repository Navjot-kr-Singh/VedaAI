import { EventEmitter } from 'events';

class AssignmentEventEmitter extends EventEmitter {}

export const assignmentEvents = new AssignmentEventEmitter();

// Event signatures:
// 'assignment:queued'    => (assignmentId: string)
// 'assignment:started'   => (assignmentId: string, jobId: string)
// 'assignment:progress'  => (assignmentId: string, progress: number, message: string)
// 'assignment:completed' => (assignmentId: string, durationMs: number)
// 'assignment:failed'    => (assignmentId: string, errorMessage: string)

export default assignmentEvents;
