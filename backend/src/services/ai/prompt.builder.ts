import { RegenerationVariant } from './types';

export class PromptBuilder {
  static buildSystemInstruction(): string {
    return `You are VedaAI, an expert school and university professor specializing in designing assessment papers.
Your task is to generate a highly polished, professional assessment paper based on the provided settings and reference material.

CRITICAL REQUIREMENT:
You must output a single, valid JSON object that strictly adheres to the schema below.
DO NOT include any conversational preambles, markdown formatting, or explanations in your response. Just the raw JSON content matching the structure.

Output JSON structure:
{
  "sections": [
    {
      "title": "Section A: Multiple Choice Questions",
      "instruction": "Answer all questions. Each question carries 2 marks.",
      "questions": [
        {
          "text": "What is the capital of France?",
          "type": "MCQ",
          "options": ["Paris", "London", "Berlin", "Madrid"],
          "correctAnswer": "Paris",
          "difficulty": "Easy",
          "marks": 2
        }
      ]
    }
  ]
}

Guidelines for questions:
- Group questions into logical sections (e.g. Section A: Multiple Choice Questions, Section B: Short Answers).
- For multiple choice questions, set "type" to "MCQ" and provide exactly 4 choices in the "options" array. Also include the "correctAnswer".
- For other types of questions, set "type" to "Short Answer", "Long Answer", or "Fill in the blanks" and omit the "options" and "correctAnswer" arrays.
- The total sum of marks across all generated questions MUST EXACTLY match the requested total marks.
- The total number of questions generated MUST EXACTLY match the requested total questions.
- The difficulty of questions should align with the requested settings.
- The difficulty field for each question MUST be exactly one of: "Easy", "Medium", or "Hard".`;
  }

  static buildUserPrompt(params: {
    title: string;
    questionTypes: string[];
    totalQuestions: number;
    marks: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    instructions?: string;
    referenceText?: string;
    syllabusSummary?: { course: string; topics: string[] };
    variant?: RegenerationVariant;
  }): string {
    const {
      title,
      questionTypes,
      totalQuestions,
      marks,
      difficulty,
      instructions,
      referenceText,
      syllabusSummary,
      variant = 'default',
    } = params;

    let variantInstructions = '';
    if (variant === 'easier') {
      variantInstructions = `- VARIANT MODIFIER: Make this assessment paper noticeably EASIER than a standard ${difficulty} difficulty paper. Adjust marks and questions accordingly.`;
    } else if (variant === 'harder') {
      variantInstructions = `- VARIANT MODIFIER: Make this assessment paper noticeably MORE CHALLENGING than a standard ${difficulty} difficulty paper. Include deep conceptual questions.`;
    } else if (variant === 'mcq_only') {
      variantInstructions = `- VARIANT MODIFIER: Format ALL questions across ALL sections as Multiple Choice Questions (MCQ). Each question must have the type "MCQ" and include exactly 4 choices in the "options" array.`;
    }

    let syllabusContent = '';
    if (syllabusSummary && syllabusSummary.topics.length > 0) {
      syllabusContent = `EXTRACTED SYLLABUS SUMMARY:
Course Name: ${syllabusSummary.course}
Topics / Units / Concepts to cover:
${syllabusSummary.topics.map((t, idx) => `- ${t}`).join('\n')}

CRITICAL SYLLABUS ADHERENCE RULES:
1. You MUST generate questions that are derived STRICTLY and EXCLUSIVELY from the EXTRACTED SYLLABUS SUMMARY topics listed above.
2. NEVER invent unrelated technical concepts, historical figures, facts, or terms not explicitly mentioned in the syllabus summary.
3. NEVER use placeholder terminology or generic system/performance/architecture questions (e.g. do NOT use general IT terms like "primary controller", "modular architecture", "performance optimization" unless they are explicitly present in the syllabus topics).
4. Every single question generated MUST map directly to a syllabus topic/concept.
5. If a question cannot be directly traced to the syllabus content, DO NOT generate it.
6. Cover the listed topics/units evenly. Avoid focusing the entire paper on a single repeated topic.
7. Avoid any duplication or semantic repetition of questions or options.`;
    } else if (referenceText) {
      syllabusContent = `REFERENCE STUDY MATERIAL (SYLLABUS EXCERPTS):
---
${referenceText}
---

CRITICAL SYLLABUS ADHERENCE RULES:
1. You MUST generate questions that are derived STRICTLY and EXCLUSIVELY from the REFERENCE STUDY MATERIAL provided above.
2. DO NOT use pre-trained general knowledge, external sources, or assumptions to introduce topics, concepts, historical figures, facts, or technical terms not explicitly mentioned in the reference study material.
3. If a topic is not present in the provided reference study material, you MUST NOT generate questions about it, even if the assignment title or instructions hint at it. Skip any unsupported topics and ensure proportional topic coverage of ONLY the concepts that actually exist within the reference study material.
4. Forbid any hallucination of external curriculum or general knowledge.
5. If a question cannot be directly traced to the syllabus content, DO NOT generate it.`;
    } else {
      syllabusContent = 'Generate standard curriculum questions since no reference study material was uploaded.';
    }

    return `Generate an assessment paper based on the following specifications:

Title: ${title}
Target Difficulty: ${difficulty}
Total Questions Needed: ${totalQuestions}
Total Marks: ${marks}
Question Formats Allowed: ${questionTypes.join(', ')}
${questionTypes.length === 1 && questionTypes[0] === 'MCQ' ? 'CRITICAL: You MUST make EVERY single question a Multiple Choice Question with type "MCQ" and exactly 4 options in the "options" array. Do not use any other question type.' : ''}
${instructions ? `Additional Rules: ${instructions}` : ''}
${variantInstructions}

IMPORTANT:
You MUST generate EXACTLY ${totalQuestions} questions.
Do NOT generate more or fewer questions.
The final output MUST contain exactly ${marks} marks total.

${syllabusContent}

Ensure that the sum of 'marks' for all questions equals exactly ${marks}, and the count of questions is exactly ${totalQuestions}.
`;
  }
}
