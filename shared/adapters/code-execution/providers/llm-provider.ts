/**
 * LLM Execution Provider
 * 
 * Uses AI (Groq/OpenAI) to simulate code execution by analyzing code
 * and predicting test results. Provides educational feedback.
 * 
 * This is the default provider for edmap. Future providers can implement
 * the ExecutionProvider interface for real sandboxed execution.
 */

import type {
  ExecutionProvider,
  ExecutionRequest,
  ExecutionResponse,
  TestResult,
  ExecutionFeedback,
  StaticError,
} from '../types';

export const LLM_PROVIDER_CONFIG = {
  id: 'llm-simulation' as const,
  name: 'LLM Code Simulation',
  description: 'AI-powered code analysis that simulates execution and provides educational feedback',
  estimatedLatencyMs: 2000,
  costPerExecution: 0.001,
};

export function buildAnalysisPrompt(request: ExecutionRequest): string {
  const filesFormatted = Object.entries(request.files)
    .map(([filename, content]) => `### ${filename}\n\`\`\`${request.language}\n${content}\n\`\`\``)
    .join('\n\n');
  
  const testCasesFormatted = request.testCases
    .filter(tc => !tc.hidden)
    .map(tc => `- **${tc.name}**: ${tc.description}\n  Assertions: ${tc.assertions.join(', ')}`)
    .join('\n');
  
  const levelGuidance: Record<string, string> = {
    intern: 'Be very encouraging and educational. Explain concepts in detail. Provide specific line-by-line guidance.',
    junior: 'Be supportive and constructive. Explain why things work or fail. Offer hints without giving solutions.',
    mid: 'Be direct and professional. Focus on code quality and best practices. Minimal hand-holding.',
    senior: 'Be concise and peer-like. Focus on edge cases and performance. Skip obvious explanations.',
  };
  
  return `You are a code execution simulator for an educational B2B onboarding platform called edmap.

## Context
- **User Level**: ${request.userLevel} (${levelGuidance[request.userLevel] || levelGuidance.junior})
- **User Role**: ${request.userRole}
- **Language**: ${request.language}
- **Ticket ID**: ${request.ticketId}

## User's Code
${filesFormatted}

## Test Cases to Simulate
${testCasesFormatted || 'No visible test cases - analyze code correctness based on general best practices.'}

## Instructions
1. Analyze the code for correctness, considering the ${request.language} language semantics
2. For each test case, predict whether it would PASS or FAIL based on the code logic
3. If a test fails, explain specifically WHY with line references
4. Consider edge cases: null/undefined values, empty inputs, boundary conditions
5. Provide educational feedback appropriate for a ${request.userLevel} level developer
6. Be accurate but encouraging - learning is the goal

## Output Format (JSON)
Respond with ONLY valid JSON, no markdown code blocks:
{
  "testResults": [
    {
      "testId": "test-1",
      "testName": "test name here",
      "passed": true or false,
      "explanation": "Why this test passes or fails, with specific line references",
      "actualOutput": "predicted actual output",
      "expectedOutput": "expected output from test",
      "lineReferences": [3, 5]
    }
  ],
  "overallPass": true or false,
  "executionTrace": "Step-by-step trace of code execution (only for intern/junior levels)",
  "feedback": {
    "summary": "Overall assessment in 1-2 sentences",
    "improvements": ["Specific improvement suggestion 1", "Suggestion 2"],
    "mentorComment": "Encouraging mentor-style comment appropriate for ${request.userLevel} level",
    "encouragement": "Brief motivational message"
  },
  "staticIssues": [
    {
      "type": "syntax or type or lint",
      "message": "Issue description",
      "file": "filename",
      "line": 5,
      "severity": "error or warning or info"
    }
  ]
}`;
}

export interface LLMAnalysisResult {
  testResults: Array<{
    testId: string;
    testName: string;
    passed: boolean;
    explanation: string;
    actualOutput?: string;
    expectedOutput?: string;
    lineReferences?: number[];
  }>;
  overallPass: boolean;
  executionTrace?: string;
  feedback: {
    summary: string;
    improvements: string[];
    mentorComment?: string;
    encouragement?: string;
  };
  staticIssues?: Array<{
    type: 'syntax' | 'type' | 'lint';
    message: string;
    file: string;
    line: number;
    severity: 'error' | 'warning' | 'info';
  }>;
}

export function parseAnalysisResponse(responseText: string): LLMAnalysisResult {
  try {
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    
    const parsed = JSON.parse(jsonText);
    
    return {
      testResults: parsed.testResults || [],
      overallPass: parsed.overallPass ?? false,
      executionTrace: parsed.executionTrace,
      feedback: parsed.feedback || {
        summary: 'Analysis complete.',
        improvements: [],
      },
      staticIssues: parsed.staticIssues || [],
    };
  } catch (error) {
    return {
      testResults: [],
      overallPass: false,
      feedback: {
        summary: 'Unable to analyze code. Please try again.',
        improvements: ['Ensure your code is syntactically correct'],
        mentorComment: 'There was an issue analyzing your code. Check for syntax errors and try again.',
      },
      staticIssues: [],
    };
  }
}

export function transformToExecutionResponse(
  request: ExecutionRequest,
  analysis: LLMAnalysisResult,
  startTime: number
): ExecutionResponse {
  const testResults: TestResult[] = analysis.testResults.map(tr => ({
    testId: tr.testId,
    testName: tr.testName,
    passed: tr.passed,
    explanation: tr.explanation,
    actualOutput: tr.actualOutput,
    expectedOutput: tr.expectedOutput,
    lineReferences: tr.lineReferences,
  }));
  
  const staticErrors: StaticError[] = (analysis.staticIssues || [])
    .filter(issue => issue.severity === 'error')
    .map(issue => ({
      type: issue.type,
      message: issue.message,
      file: issue.file,
      line: issue.line,
      severity: issue.severity,
    }));
  
  const warnings: StaticError[] = (analysis.staticIssues || [])
    .filter(issue => issue.severity !== 'error')
    .map(issue => ({
      type: issue.type,
      message: issue.message,
      file: issue.file,
      line: issue.line,
      severity: issue.severity,
    }));
  
  const feedback: ExecutionFeedback = {
    summary: analysis.feedback.summary,
    improvements: analysis.feedback.improvements,
    mentorComment: analysis.feedback.mentorComment,
    encouragement: analysis.feedback.encouragement,
  };
  
  return {
    providerId: 'llm-simulation',
    staticAnalysis: {
      errors: staticErrors,
      warnings: warnings,
      passesTypeCheck: staticErrors.length === 0,
    },
    testResults,
    overallPass: analysis.overallPass,
    executionTrace: analysis.executionTrace,
    feedback,
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - startTime,
  };
}

export function createMockExecutionResponse(
  request: ExecutionRequest,
  startTime: number = Date.now()
): ExecutionResponse {
  const testResults: TestResult[] = request.testCases.map((tc, index) => ({
    testId: tc.id,
    testName: tc.name,
    passed: index === 0,
    explanation: index === 0 
      ? 'This test passes because the implementation correctly handles the basic case.'
      : 'This test fails. Check your implementation against the acceptance criteria.',
    lineReferences: [3, 5],
  }));
  
  return {
    providerId: 'llm-simulation',
    staticAnalysis: {
      errors: [],
      warnings: [],
      passesTypeCheck: true,
    },
    testResults,
    overallPass: testResults.every(t => t.passed),
    feedback: {
      summary: 'Code analyzed. See individual test results for details.',
      improvements: ['Consider adding null checks', 'Add error handling for edge cases'],
      mentorComment: 'Good progress! Keep working on making all tests pass.',
    },
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - startTime,
  };
}
