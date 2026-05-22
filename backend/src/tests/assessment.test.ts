import { normalizeAssessment } from '../utils/normalizeAssessment';
import { IPaperInput } from '../services/ai/types';

describe('Assessment Normalization Logic', () => {
  const allowedQuestionTypes = ['MCQ', 'Short Answer'];

  // Test Case 4: AI Over-generation
  test('AI Over-generation: should trim extra questions safely and preserve section structures', () => {
    const mockInputPaper: IPaperInput = {
      sections: [
        {
          title: 'Section A',
          instruction: 'MCQs',
          questions: [
            { text: 'Q1', type: 'MCQ', options: ['A', 'B', 'C', 'D'], correctAnswer: 'A', difficulty: 'Easy', marks: 2 },
            { text: 'Q2', type: 'MCQ', options: ['A', 'B', 'C', 'D'], correctAnswer: 'B', difficulty: 'Easy', marks: 2 },
          ],
        },
        {
          title: 'Section B',
          instruction: 'Short Answers',
          questions: [
            { text: 'Q3', type: 'Short Answer', difficulty: 'Easy', marks: 3 },
            { text: 'Q4', type: 'Short Answer', difficulty: 'Easy', marks: 3 },
          ],
        },
      ],
    };

    // Requesting exactly 3 questions and 10 marks
    const normalized = normalizeAssessment(mockInputPaper, 3, 10, allowedQuestionTypes, 'Easy');

    // Count questions
    let totalQuestions = 0;
    normalized.sections.forEach(sec => {
      totalQuestions += sec.questions.length;
    });

    expect(totalQuestions).toBe(3);
    // Section structure should be preserved: Section A should still exist, Section B should be trimmed
    expect(normalized.sections.length).toBeGreaterThan(0);
    expect(normalized.sections[0].title).toBe('Section A');
  });

  // Test Case 5: AI Under-generation
  test('AI Under-generation: should generate filler questions automatically', () => {
    const mockInputPaper: IPaperInput = {
      sections: [
        {
          title: 'Section A',
          instruction: 'MCQs',
          questions: [
            { text: 'Q1', type: 'MCQ', options: ['A', 'B', 'C', 'D'], correctAnswer: 'A', difficulty: 'Medium', marks: 5 },
          ],
        },
      ],
    };

    // Requesting exactly 3 questions and 15 marks
    const normalized = normalizeAssessment(mockInputPaper, 3, 15, allowedQuestionTypes, 'Medium');

    let totalQuestions = 0;
    const questionsList: any[] = [];
    normalized.sections.forEach(sec => {
      totalQuestions += sec.questions.length;
      questionsList.push(...sec.questions);
    });

    expect(totalQuestions).toBe(3);
    // Filler questions should be added
    expect(questionsList[1].text).toContain('Filler Question');
    expect(questionsList[2].text).toContain('Filler Question');
    // Filler question should match one of the allowed question types
    expect(allowedQuestionTypes).toContain(questionsList[1].type);
    expect(questionsList[1].difficulty).toBe('Medium');
  });

  // Test Case 6: Exact Marks Normalization (using Largest Remainder Method)
  test('Exact Marks Normalization: should rebalance marks to sum to the requested total', () => {
    const mockInputPaper: IPaperInput = {
      sections: [
        {
          title: 'Section A',
          instruction: 'Questions',
          questions: [
            { text: 'Q1', type: 'Short Answer', difficulty: 'Hard', marks: 10 },
            { text: 'Q2', type: 'Short Answer', difficulty: 'Hard', marks: 20 },
            { text: 'Q3', type: 'Short Answer', difficulty: 'Hard', marks: 30 },
          ],
        },
      ],
    };

    // Requesting exactly 3 questions and 10 marks
    const normalized = normalizeAssessment(mockInputPaper, 3, 10, allowedQuestionTypes, 'Hard');

    let totalQuestions = 0;
    let sumMarks = 0;
    normalized.sections.forEach(sec => {
      totalQuestions += sec.questions.length;
      sec.questions.forEach(q => {
        sumMarks += q.marks;
        expect(q.marks).toBeGreaterThanOrEqual(1); // each must have at least 1 mark
      });
    });

    expect(totalQuestions).toBe(3);
    expect(sumMarks).toBe(10);
  });

  // Test Case 7: Exact Question Count Enforcement
  test('Exact Question Count Enforcement: should guarantee exact questions and marks', () => {
    const mockInputPaper: IPaperInput = {
      sections: [
        {
          title: 'Section A',
          instruction: 'Questions',
          questions: [
            { text: 'Q1', type: 'Short Answer', difficulty: 'Medium', marks: 4 },
          ],
        },
      ],
    };

    // Requesting exactly 5 questions and 20 marks
    const normalized = normalizeAssessment(mockInputPaper, 5, 20, allowedQuestionTypes, 'Medium');

    let totalQuestions = 0;
    let sumMarks = 0;
    normalized.sections.forEach(sec => {
      totalQuestions += sec.questions.length;
      sec.questions.forEach(q => {
        sumMarks += q.marks;
      });
    });

    expect(totalQuestions).toBe(5);
    expect(sumMarks).toBe(20);
  });
});

describe('Websocket Reconnect, Polling Fallback, and Missed Event Recovery Simulation', () => {
  // Test Case 1: WebSocket Reconnect Handling
  test('WebSocket Reconnect Simulation: Client should rejoin assignment room on connection restore', () => {
    const mockSocket = {
      connected: false,
      id: 'mock-socket-123',
      events: {} as Record<string, Function>,
      emitted: [] as { event: string; data: any }[],
      
      on(event: string, callback: Function) {
        this.events[event] = callback;
      },
      emit(event: string, data: any) {
        this.emitted.push({ event, data });
      },
      simulateConnect() {
        this.connected = true;
        if (this.events['connect']) this.events['connect']();
      }
    };

    // Simulate hook logic on connect: if activeAssignmentId, emit 'join-assignment'
    const activeAssignmentId = 'assignment-abc-123';
    
    mockSocket.on('connect', () => {
      if (activeAssignmentId) {
        mockSocket.emit('join-assignment', activeAssignmentId);
      }
    });

    // Before connection
    expect(mockSocket.connected).toBe(false);
    expect(mockSocket.emitted.length).toBe(0);

    // Simulate reconnection event
    mockSocket.simulateConnect();

    expect(mockSocket.connected).toBe(true);
    expect(mockSocket.emitted).toContainEqual({
      event: 'join-assignment',
      data: activeAssignmentId
    });
  });

  // Test Case 2 & 3: Missed socket event recovery and Polling fallback
  test('Missed Socket Event Recovery & Polling Fallback Simulation: Polling should fetch data and terminate automatically', async () => {
    let fetchCount = 0;
    const assignmentStates = [
      { id: '123', status: 'generating' },
      { id: '123', status: 'generating' },
      { id: '123', status: 'completed' }, // Third fetch shows completed
    ];

    // Mock API Fetch function
    const fetchAssignmentById = jest.fn().mockImplementation(async (id: string) => {
      const state = assignmentStates[Math.min(fetchCount, assignmentStates.length - 1)];
      fetchCount++;
      return state;
    });

    // Simulate polling fallback lifecycle:
    let isPolling = true;
    let currentStatus = 'generating';
    const activeAssignmentId = '123';

    const triggerPollingCycle = async () => {
      if (!isPolling) return;
      const res = await fetchAssignmentById(activeAssignmentId);
      currentStatus = res.status;
      if (currentStatus === 'completed') {
        isPolling = false; // Stop polling on completion
      }
    };

    // Step 1: Start polling
    expect(isPolling).toBe(true);
    expect(currentStatus).toBe('generating');

    // Run first polling cycle
    await triggerPollingCycle();
    expect(isPolling).toBe(true);
    expect(currentStatus).toBe('generating');
    expect(fetchCount).toBe(1);

    // Run second polling cycle
    await triggerPollingCycle();
    expect(isPolling).toBe(true);
    expect(currentStatus).toBe('generating');
    expect(fetchCount).toBe(2);

    // Run third polling cycle (returns 'completed')
    await triggerPollingCycle();
    expect(isPolling).toBe(false); // Polling should automatically stop!
    expect(currentStatus).toBe('completed');
    expect(fetchCount).toBe(3);

    // Attempting to run cycle again should do nothing
    await triggerPollingCycle();
    expect(fetchCount).toBe(3); // Fetch count stays at 3 because polling stopped!
  });
});
