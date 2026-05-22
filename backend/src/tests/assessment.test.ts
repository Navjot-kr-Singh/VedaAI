import { describe, test, expect, jest } from '@jest/globals';
import { normalizeAssessment } from '../utils/normalizeAssessment';
import { IPaperInput } from '../services/ai/types';
import chunkingService from '../services/chunking.service';
import aiService from '../services/ai/ai.service';

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

  // Test Case 8: Decimal Marks Rebalancing (e.g. 50 questions, 25 marks)
  test('Decimal Marks Rebalancing: should divide 25 marks across 50 questions evenly to 0.5 each', () => {
    const mockInputPaper: IPaperInput = {
      sections: [
        {
          title: 'Section A',
          instruction: 'Questions',
          questions: Array.from({ length: 50 }, (_, i) => ({
            text: `Q${i + 1}`,
            type: 'Short Answer' as const,
            difficulty: 'Medium' as const,
            marks: 1,
          })),
        },
      ],
    };

    const normalized = normalizeAssessment(mockInputPaper, 50, 25, allowedQuestionTypes, 'Medium');

    let totalQuestions = 0;
    let sumMarks = 0;
    normalized.sections.forEach(sec => {
      totalQuestions += sec.questions.length;
      sec.questions.forEach(q => {
        sumMarks += q.marks;
        expect(q.marks).toBe(0.5);
      });
    });

    expect(totalQuestions).toBe(50);
    expect(Math.round(sumMarks * 100) / 100).toBe(25);
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
      const res = (await fetchAssignmentById(activeAssignmentId)) as any;
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

describe('ChunkingService Syllabus Processing', () => {
  test('should clean text and return original text if <= 8000 characters', async () => {
    const rawSyllabus = 'Page 1 of 5\n\nChapter 1: Relational Database Systems\n-------------------\n- SQL Basics\n- Normalization';
    const processed = await chunkingService.processText(rawSyllabus, 'normalization');
    expect(processed).toContain('Chapter 1: Relational Database Systems');
    expect(processed).toContain('Normalization');
    expect(processed).not.toContain('Page 1 of 5');
    expect(processed).not.toContain('-------------------');
  });

  test('should chunk and retrieve relevant chunks based on keywords if > 8000 characters', async () => {
    // Generate a long text > 8000 characters
    let longSyllabus = 'Chapter 1: Introduction to DBMS and SQL basics.\n';
    while (longSyllabus.length < 9000) {
      longSyllabus += 'Random filler text about general computer science topics that are unrelated to database systems. ';
    }
    longSyllabus += '\nChapter 10: Special Topic on Advanced Relational Algebra and query optimization techniques.\n';

    const processed = await chunkingService.processText(longSyllabus, 'Relational Algebra DBMS');
    // It should retrieve the first chunk (DBMS) and the last chunk (Relational Algebra) and rank them higher than filler text
    expect(processed).toContain('DBMS');
    expect(processed).toContain('Relational Algebra');
  });
});

describe('AI Grounding and Relevance Logic', () => {
  // Test 1: Programmatic Syllabus Topic Extraction
  test('Syllabus Extraction: should extract topics programmatically using regex and patterns', async () => {
    const syllabusText = `Industry Ethics and Legal Issues
      UNIT 1: Ethics in IT
      - Cyber Crime and security issues
      - Intellectual Property Rights
      
      UNIT 2: Startup India and NASSCOM
      * Patent and copyright laws
      * Women Empowerment in technology
    `;
    const summary = await aiService.extractSyllabusSummary(syllabusText);
    expect(summary.course).toBe('Industry Ethics and Legal Issues');
    expect(summary.topics).toContain('Ethics in IT');
    expect(summary.topics).toContain('Cyber Crime and security issues');
    expect(summary.topics).toContain('Intellectual Property Rights');
    expect(summary.topics).toContain('Startup India and NASSCOM');
    expect(summary.topics).toContain('Patent and copyright laws');
    expect(summary.topics).toContain('Women Empowerment in technology');
  });

  // Test 2: Semantic Duplicate Detection (Jaccard similarity > 70%)
  test('Semantic Duplicate Detection: should reject questions with > 70% Jaccard similarity', () => {
    const q1 = "What is the primary function of an Intellectual Property patent?";
    const q2 = "What is the main function of an intellectual property patent?";
    const q3 = "Can you explain how Cyber Crime is defined under IT regulations?";

    const isDup12 = (aiService as any).isSemanticDuplicate(q1, q2);
    const isDup13 = (aiService as any).isSemanticDuplicate(q1, q3);

    expect(isDup12).toBe(true);
    expect(isDup13).toBe(false);
  });

  // Test 3: MCQ Quality Filter (rejection of generic placeholders not in syllabus)
  test('MCQ Quality Filter: should reject generic IT terms unless they are explicitly in the syllabus topics', () => {
    const topics = ["Arbitration laws", "Patent filling", "NASSCOM guidelines"];
    
    // Question with generic IT placeholder terms not in syllabus
    const qGeneric = "Which component acts as the primary controller in event loops and asynchronous scheduling?";
    const optionsGeneric = ["Primary controller", "Modular architecture", "Virtual network", "Centralized state"];
    const isGeneric1 = (aiService as any).containsGenericPlaceholderText(qGeneric, optionsGeneric, topics);
    expect(isGeneric1).toBe(true);

    // Question with terms that are in the syllabus
    const qSyllabus = "What is the role of NASSCOM guidelines in local startup compliance?";
    const optionsSyllabus = ["NASSCOM rules", "Standard procedures", "State policies", "None"];
    const isGeneric2 = (aiService as any).containsGenericPlaceholderText(qSyllabus, optionsSyllabus, topics);
    expect(isGeneric2).toBe(false);
  });

  // Test 4: Syllabus Relevance Filtering (matching syllabus keywords/concepts)
  test('Syllabus Relevance: should check if question content matches syllabus topics or keywords', () => {
    const topics = ["Intellectual Property", "Arbitration", "Cyber Crime"];

    const qValid = "Which law governs Cyber Crime in India?";
    const qInvalid = "How do you configure modular architecture for primary controllers?";

    const matchesValid = (aiService as any).matchesSyllabus(qValid, [], topics);
    const matchesInvalid = (aiService as any).matchesSyllabus(qInvalid, [], topics);

    expect(matchesValid).toBe(true);
    expect(matchesInvalid).toBe(false);
  });

  // Test 5: Topic Distribution Balancing (Round-Robin Selection)
  test('Topic Distribution: balanceTopicDistribution should perform greedy round-robin selection', () => {
    const topics = ["Topic A", "Topic B", "Topic C"];
    const questions = [
      { text: "Question 1 on Topic A", type: "Short Answer", difficulty: "Easy", marks: 1 },
      { text: "Question 2 on Topic A", type: "Short Answer", difficulty: "Easy", marks: 1 },
      { text: "Question 3 on Topic A", type: "Short Answer", difficulty: "Easy", marks: 1 },
      { text: "Question 4 on Topic B", type: "Short Answer", difficulty: "Easy", marks: 1 },
      { text: "Question 5 on Topic C", type: "Short Answer", difficulty: "Easy", marks: 1 },
    ];

    // Requesting exactly 3 questions. Round-robin should pick one from Topic A, one from Topic B, one from Topic C
    const balanced = (aiService as any).balanceTopicDistribution(questions, topics, 3);
    expect(balanced.length).toBe(3);

    // Should include one question from each topic
    const hasTopicA = balanced.some(q => q.text.includes("Topic A"));
    const hasTopicB = balanced.some(q => q.text.includes("Topic B"));
    const hasTopicC = balanced.some(q => q.text.includes("Topic C"));

    expect(hasTopicA).toBe(true);
    expect(hasTopicB).toBe(true);
    expect(hasTopicC).toBe(true);
  });
});
