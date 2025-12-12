# Code Execution Architecture

> **Status**: ✅ Implemented - Monaco editor with LLM-simulated execution is live

## Overview

edmap uses **LLM-Simulated Code Execution** to provide instant, educational feedback on user-written code without the infrastructure costs and complexity of real sandboxed execution. The LLM analyzes code, predicts behavior, and simulates test results while providing rich explanatory feedback.

This approach aligns with edmap's core value proposition: users are learning through simulation, not being graded by a compiler.

---

## Architecture Decision

### Why LLM Simulation?

| Consideration | Real Execution | LLM Simulation |
|--------------|----------------|----------------|
| Infrastructure cost | $60-1,700/mo | ~$10-30/mo |
| Cold start latency | 2-40 seconds | None |
| Security concerns | Container hardening required | None (no execution) |
| Educational feedback | "Test failed" | "Here's why it failed..." |
| Fits simulation narrative | Partial | Perfect |
| Multi-language support | Complex per language | Prompt adjustment |

### Trade-offs Accepted

| Risk | Mitigation |
|------|------------|
| LLM hallucinations | Ticket complexity calibrated; future static analysis planned |
| Complex logic errors | Ticket complexity calibrated to LLM capabilities |
| User trust ("is this real?") | Position as "AI mentor review" within simulation |

> **Note**: Static analysis (ESLint, TypeScript type checking) is **planned but not yet implemented**. Currently LLM simulation handles all code analysis.

---

## System Architecture (Current Implementation)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                                    │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    TICKET WORKSPACE                              │    │
│  │  ┌─────────────────┐  ┌─────────────────────────────────────┐   │    │
│  │  │ Ticket Details  │  │  CODE EDITOR (Monaco)                │   │    │
│  │  │ - Description   │  │  ┌─────────────────────────────────┐ │   │    │
│  │  │ - Acceptance    │  │  │ // user writes code here        │ │   │    │
│  │  │   criteria      │  │  │ function getUser(id: string) {  │ │   │    │
│  │  │ - Test cases    │  │  │   ...                           │ │   │    │
│  │  │                 │  │  │ }                                │ │   │    │
│  │  │ TEAM CHAT       │  │  └─────────────────────────────────┘ │   │    │
│  │  │ Sarah: "Let me  │  │  ┌─────────────────────────────────┐ │   │    │
│  │  │ know if you     │  │  │ SIMULATED TEST OUTPUT           │ │   │    │
│  │  │ need help!"     │  │  │ ✓ 2 tests passed                │ │   │    │
│  │  │                 │  │  │ ✗ 1 test failed: edge case...   │ │   │    │
│  │  └─────────────────┘  │  └─────────────────────────────────┘ │   │    │
│  │                       └─────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       LLM SIMULATION PIPELINE ✅                         │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │               LLM CODE ANALYSIS (Groq)                           │    │
│  │                                                                   │    │
│  │  • Analyzes code for correctness                                 │    │
│  │  • Predicts test pass/fail for each test case                    │    │
│  │  • Explains why tests pass or fail                               │    │
│  │  • Provides educational feedback and suggestions                 │    │
│  │  • Returns mentor-style improvement tips                         │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              │                                           │
│                              ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │               FEEDBACK TO USER                                   │    │
│  │  • Simulated test results (~90% accurate)                        │    │
│  │  • Educational explanations of why code works/fails              │    │
│  │  • Level-appropriate hints and suggestions                       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       PR REVIEW INTEGRATION                              │
│                                                                          │
│  AI reviewers reference simulated execution results:                     │
│  • "The null check test is failing - line 42 returns undefined"         │
│  • "Great job! All 3 tests pass. Ready for merge."                      │
│  • "Edge case not handled - what if userId is empty string?"            │
└─────────────────────────────────────────────────────────────────────────┘
```

> **Future Enhancement**: Static analysis (ESLint, TypeScript) will be added as a second pipeline branch to catch real syntax/type errors with 100% accuracy.

---

## Integration with Adapter Architecture

### New Types (extend `shared/adapters/execution/types.ts`)

```typescript
/**
 * Code Editor Configuration
 * Controls the embedded Monaco editor behavior
 */
export type EditorLanguage = 'typescript' | 'javascript' | 'python' | 'cpp';

export interface CodeEditorConfig {
  enabled: boolean;
  language: EditorLanguage;
  theme: 'vs-dark' | 'vs-light' | 'edmap-dark';
  fontSize: number;
  minimap: boolean;
  lineNumbers: boolean;
  wordWrap: 'on' | 'off';
  tabSize: number;
  readOnlyFiles: string[];           // Files user cannot edit
  hiddenFiles: string[];             // Files not shown to user
  starterCode: Record<string, string>; // filename -> initial content
}

/**
 * Simulated Execution Configuration
 * Controls how the LLM analyzes and simulates code execution
 */
export interface SimulatedExecutionConfig {
  enabled: boolean;
  staticAnalysis: {
    enabled: boolean;
    lintRules: 'strict' | 'moderate' | 'lenient';
    typeChecking: boolean;
    showInlineErrors: boolean;
  };
  llmSimulation: {
    enabled: boolean;
    model: string;                    // e.g., 'llama-3.3-70b-versatile'
    maxTokens: number;
    temperature: number;
    simulateTestRunner: boolean;
    showExecutionTrace: boolean;
    provideFixes: boolean;
  };
  feedbackStyle: 'educational' | 'professional' | 'minimal';
  autoRunOnSave: boolean;
  debounceMs: number;
}

/**
 * Test Case Definition
 * Tickets include test cases for the LLM to simulate
 */
export interface TestCase {
  id: string;
  name: string;
  description: string;
  input?: string;
  expectedOutput?: string;
  assertions: string[];              // Human-readable assertions
  hidden: boolean;                   // Hidden tests not shown to user
}

/**
 * Extended Ticket Work Config
 * Adds code editing and execution simulation
 */
export interface ExtendedTicketWorkConfig extends TicketWorkConfig {
  codeEditor: CodeEditorConfig;
  execution: SimulatedExecutionConfig;
  testCases: TestCase[];
}
```

### Level-Based Editor Scaffolding

| Level | Editor Mode | Starter Code | Tests Visible | Hints | Auto-Fix |
|-------|-------------|--------------|---------------|-------|----------|
| **Intern** | 80% complete template | Heavy | All shown | Always | Suggested |
| **Junior** | Function stubs | Moderate | Names only | On error | On request |
| **Mid** | File structure only | Light | Hidden | On request | Disabled |
| **Senior** | Empty project | None | Write your own | Never | Disabled |

### Level Overlay Extensions

```typescript
// Extend LevelExecutionOverlay
export interface CodeEditorModifiers {
  starterCodeAmount: 'full' | 'partial' | 'stubs' | 'empty';
  showTestCases: 'all' | 'names' | 'hidden';
  showInlineHints: boolean;
  autoSuggestFixes: boolean;
  allowRunWithErrors: boolean;
  executionFeedbackDetail: 'verbose' | 'standard' | 'minimal';
}
```

---

## Component Architecture

### Implemented Components

```
client/src/components/workspace/
├── code-editor/
│   ├── code-editor-panel.tsx   # ✅ Main Monaco editor wrapper
│   ├── bottom-dock.tsx         # ✅ Test output and feedback panel
│   └── index.tsx               # ✅ Exports
├── code-work-panel.tsx         # ✅ Code work simulation
├── pr-review-panel.tsx         # ✅ PR review with threads
└── ticket-workspace.tsx        # ✅ Full ticket environment

server/services/
└── code-analysis.ts            # ✅ LLM code execution service

shared/adapters/code-execution/
├── index.ts                    # ✅ Factory function
├── types.ts                    # ✅ ExecutionProvider, CodeChallenge
├── roles/                      # ✅ Developer, PM configs
├── levels/                     # ✅ Intern → Senior scaffolding
└── providers/
    └── llm-provider.ts         # ✅ Groq-powered analysis
```

### Not Yet Implemented

```
client/src/components/workspace/
├── execution/                  # ⏳ Planned
│   ├── test-runner-panel.tsx   # Separate test output display
│   ├── execution-trace.tsx     # Step-by-step code trace
│   ├── static-analysis.tsx     # Real lint/type errors (ESLint)
│   └── combined-feedback.tsx   # Merged analysis results
```

> **Note**: Static analysis (ESLint, TypeScript) is planned but not yet implemented. Currently only LLM simulation is used.

### Data Flow (Current Implementation)

```
User Types Code in Monaco Editor
      │
      ▼
┌─────────────────┐
│  User clicks    │
│  "Run Tests"    │
└─────────────────┘
      │
      ▼
┌─────────────────────────────────────┐
│         LLM SIMULATION              │
│         (API call)                  │
│                                     │
│  POST /api/analyze-code             │
│  • Sends code + test cases          │
│  • Groq analyzes and predicts       │
│  • Returns simulated test results   │
└─────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────┐
│         FEEDBACK                    │
│                                     │
│  • Test pass/fail results           │
│  • Explanations of failures         │
│  • Educational tips                 │
│  • Mentor-style comments            │
└─────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────┐
│         UPDATE UI                   │
│                                     │
│  • Bottom dock shows results        │
│  • PR Review references execution   │
│  • Ticket status updated            │
└─────────────────────────────────────┘
```

### Planned Enhancement (Static Analysis)

```
User Types Code
      │
      ├──────────────────────────────┐
      ▼                              ▼
┌─────────────────┐        ┌─────────────────┐
│ Static Analysis │        │ LLM Simulation  │
│ (client-side)   │        │ (API call)      │
│ ⏳ PLANNED      │        │ ✅ IMPLEMENTED  │
│                 │        │                 │
│ • ESLint        │        │ POST /api/      │
│ • TypeScript    │        │   analyze-code  │
└─────────────────┘        └─────────────────┘
      │                              │
      └──────────────┬───────────────┘
                     ▼
           ┌─────────────────┐
           │ Combined Result │
           └─────────────────┘
```

---

## API Design

### Code Analysis Endpoint

```typescript
// POST /api/analyze-code
interface AnalyzeCodeRequest {
  ticketId: string;
  files: Record<string, string>;     // filename -> content
  testCases: TestCase[];
  userLevel: Level;
  language: EditorLanguage;
}

interface AnalyzeCodeResponse {
  staticAnalysis: {
    errors: StaticError[];
    warnings: StaticWarning[];
    passesTypeCheck: boolean;
  };
  simulatedExecution: {
    testResults: SimulatedTestResult[];
    overallPass: boolean;
    executionTrace?: string;
  };
  feedback: {
    summary: string;
    improvements: string[];
    mentorComment?: string;
  };
  timestamp: string;
}

interface SimulatedTestResult {
  testId: string;
  testName: string;
  passed: boolean;
  expectedOutput?: string;
  actualOutput?: string;           // LLM's prediction
  explanation: string;             // Why it passed/failed
  lineReferences?: number[];       // Relevant code lines
}
```

### LLM Prompt Structure

```typescript
const analyzeCodePrompt = (request: AnalyzeCodeRequest) => `
You are a code execution simulator for an educational platform.

## Context
- User Level: ${request.userLevel}
- Ticket: ${ticketDescription}
- Language: ${request.language}

## User's Code
${formatFiles(request.files)}

## Test Cases to Simulate
${formatTestCases(request.testCases)}

## Instructions
1. Analyze the code for correctness
2. For each test case, predict whether it would pass or fail
3. If a test fails, explain why with specific line references
4. Provide educational feedback appropriate for a ${request.userLevel}
5. Be encouraging but accurate

## Output Format (JSON)
{
  "testResults": [
    {
      "testId": "test-1",
      "testName": "should return null for empty id",
      "passed": false,
      "explanation": "Line 3 checks 'if (!id)' but empty string '' is falsy, so it returns null. However, the test expects this behavior, so this should pass.",
      "actualOutput": "null",
      "expectedOutput": "null"
    }
  ],
  "overallPass": true,
  "executionTrace": "Step 1: getUser('') called...",
  "feedback": {
    "summary": "Good defensive coding! 2/3 tests pass.",
    "improvements": ["Consider handling undefined separately from empty string"],
    "mentorComment": "Nice null check! Think about what happens with whitespace-only strings."
  }
}
`;
```

---

## Backlog Catalogue Extension

Each ticket in `backlog-catalogue.ts` will be extended with:

```typescript
interface BacklogItem {
  // ... existing fields ...
  
  codeChallenge?: {
    language: EditorLanguage;
    starterFiles: Record<string, string>;
    testCases: TestCase[];
    solutionFiles?: Record<string, string>;  // For validation
    hints: string[];
    acceptanceCriteria: string[];
  };
}

// Example ticket
{
  key: 'TICKET-NULL-CHECK',
  title: 'Fix null pointer exception in user service',
  type: 'bug',
  // ... other fields ...
  
  codeChallenge: {
    language: 'typescript',
    starterFiles: {
      'user-service.ts': `
export function getUser(id: string) {
  // BUG: Crashes when id is null or undefined
  return database.users[id].name;
}
`,
      'user-service.test.ts': `
import { getUser } from './user-service';

test('returns null for invalid id', () => {
  expect(getUser(null)).toBeNull();
});

test('returns user name for valid id', () => {
  expect(getUser('123')).toBe('John');
});
`
    },
    testCases: [
      {
        id: 'test-null',
        name: 'returns null for invalid id',
        assertions: ['getUser(null) should return null, not throw'],
        hidden: false
      },
      {
        id: 'test-valid',
        name: 'returns user name for valid id',
        assertions: ['getUser("123") should return "John"'],
        hidden: false
      }
    ],
    hints: [
      'Check if id exists before accessing database',
      'Consider using optional chaining (?.) or null check'
    ],
    acceptanceCriteria: [
      'No exceptions thrown for null/undefined input',
      'Valid IDs still return correct user name'
    ]
  }
}
```

---

## Language Support Roadmap

### Phase 1: TypeScript (MVP)
- Monaco with TypeScript language server
- ESLint + TypeScript compiler for static analysis
- Full LLM simulation support

### Phase 2: JavaScript
- Minimal changes (TypeScript superset)
- Adjust linting rules

### Phase 3: Python
- Monaco Python mode
- Ruff/Pylint for static analysis
- Adjust prompts for Python idioms

### Phase 4: C++
- Monaco C++ mode
- Clang-tidy for static analysis
- Additional prompt engineering for memory/pointer concepts

---

## Cost Projections

| MAU | API Calls/Month | Token Usage | Estimated Cost |
|-----|-----------------|-------------|----------------|
| 100 | ~3,000 | ~1.5M tokens | ~$3-5 |
| 1,000 | ~30,000 | ~15M tokens | ~$30-50 |
| 10,000 | ~300,000 | ~150M tokens | ~$300-500 |

*Based on: ~30 executions/user/month, ~500 tokens/request average*

---

## Future: Hybrid Execution

When enterprise customers require verified execution:

```
User Code
    │
    ├─→ LLM Simulation (instant feedback)
    │
    └─→ Real Execution (background verification)
              │
              ▼
         Reconciliation
         • Flag LLM errors
         • Improve prompts
         • Track accuracy
```

This allows gradual migration without breaking the user experience.

---

## Success Metrics

1. **Accuracy**: LLM predictions match expected behavior >90% of time
2. **Latency**: Feedback returned in <2 seconds
3. **Engagement**: Users complete more tickets with editor enabled
4. **Learning**: PR review comments reference code issues accurately
5. **Satisfaction**: Users report feeling "prepared" for real coding
