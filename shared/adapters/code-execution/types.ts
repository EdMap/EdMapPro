/**
 * Code Execution Adapter Types
 * 
 * Defines the interface for role-aware, level-adjusted code execution experiences.
 * Designed with an ExecutionProvider interface for future extensibility -
 * allowing swap between LLM simulation and real code execution.
 */

import type { Role, Level } from '../index';

// ============================================================================
// Editor Configuration
// ============================================================================

export type EditorLanguage = 'typescript' | 'javascript' | 'python' | 'cpp';
export type EditorTheme = 'vs-dark' | 'vs-light' | 'edmap-dark';

export interface EditorConfig {
  enabled: boolean;
  language: EditorLanguage;
  theme: EditorTheme;
  fontSize: number;
  minimap: boolean;
  lineNumbers: boolean;
  wordWrap: 'on' | 'off';
  tabSize: number;
  readOnly: boolean;
}

export interface FileConfig {
  readOnlyFiles: string[];
  hiddenFiles: string[];
  starterFiles: Record<string, string>;
  solutionFiles?: Record<string, string>;
}

// ============================================================================
// Test Case & Execution Types
// ============================================================================

export interface TestCase {
  id: string;
  name: string;
  description: string;
  input?: string;
  expectedOutput?: string;
  assertions: string[];
  hidden: boolean;
}

export interface StaticError {
  type: 'syntax' | 'type' | 'lint';
  message: string;
  file: string;
  line: number;
  column?: number;
  severity: 'error' | 'warning' | 'info';
  ruleId?: string;
}

export interface TestResult {
  testId: string;
  testName: string;
  passed: boolean;
  expectedOutput?: string;
  actualOutput?: string;
  explanation: string;
  lineReferences?: number[];
  executionTimeMs?: number;
}

export interface ExecutionFeedback {
  summary: string;
  improvements: string[];
  mentorComment?: string;
  encouragement?: string;
}

// ============================================================================
// Execution Provider Interface (for future extensibility)
// ============================================================================

export type ExecutionProviderType = 'llm-simulation' | 'real-execution' | 'hybrid';

export interface ExecutionRequest {
  ticketId: string;
  files: Record<string, string>;
  testCases: TestCase[];
  language: EditorLanguage;
  userLevel: Level;
  userRole: Role;
}

export interface ExecutionResponse {
  providerId: ExecutionProviderType;
  staticAnalysis: {
    errors: StaticError[];
    warnings: StaticError[];
    passesTypeCheck: boolean;
  };
  testResults: TestResult[];
  overallPass: boolean;
  executionTrace?: string;
  feedback: ExecutionFeedback;
  timestamp: string;
  latencyMs: number;
}

/**
 * ExecutionProvider interface - implement this to add new execution backends
 * 
 * Current implementations:
 * - LLMExecutionProvider: Uses AI to simulate code execution
 * 
 * Future implementations:
 * - SandboxExecutionProvider: Real container-based execution
 * - HybridExecutionProvider: LLM for instant feedback, real for verification
 */
export interface ExecutionProvider {
  id: ExecutionProviderType;
  name: string;
  description: string;
  
  execute(request: ExecutionRequest): Promise<ExecutionResponse>;
  
  isAvailable(): Promise<boolean>;
  
  getEstimatedLatencyMs(): number;
  getCostPerExecution(): number;
}

// ============================================================================
// Level-based Scaffolding Configuration
// ============================================================================

export type StarterCodeAmount = 'full' | 'partial' | 'stubs' | 'empty';
export type TestVisibility = 'all' | 'names' | 'hidden';
export type HintLevel = 'always' | 'on-error' | 'on-request' | 'never';
export type FeedbackDetail = 'verbose' | 'standard' | 'minimal';

export interface ScaffoldingConfig {
  starterCodeAmount: StarterCodeAmount;
  testVisibility: TestVisibility;
  showInlineHints: boolean;
  hintLevel: HintLevel;
  autoSuggestFixes: boolean;
  allowRunWithErrors: boolean;
  feedbackDetail: FeedbackDetail;
  showExecutionTrace: boolean;
  showMentorTips: boolean;
}

// ============================================================================
// Execution Settings
// ============================================================================

export interface ExecutionSettings {
  autoRunOnSave: boolean;
  debounceMs: number;
  maxExecutionsPerMinute: number;
  timeoutMs: number;
  showStaticAnalysis: boolean;
  showTestResults: boolean;
}

// ============================================================================
// UI Configuration
// ============================================================================

export type EditorLayoutMode = 'side-by-side' | 'stacked' | 'tabbed' | 'focus-editor';

export interface EditorUIConfig {
  layoutMode: EditorLayoutMode;
  showFileTree: boolean;
  showTestPanel: boolean;
  showOutputPanel: boolean;
  showHintPanel: boolean;
  panelSizes: {
    editor: number;
    tests: number;
    output: number;
  };
  showToolbar: boolean;
  toolbarActions: ('run' | 'format' | 'reset' | 'hint' | 'submit')[];
}

// ============================================================================
// Complete Adapter Interface
// ============================================================================

export interface CodeExecutionAdapter {
  metadata: {
    role: Role;
    level: Level;
    displayName: string;
    description: string;
    providerType: ExecutionProviderType;
  };
  
  editor: EditorConfig;
  files: FileConfig;
  scaffolding: ScaffoldingConfig;
  execution: ExecutionSettings;
  ui: EditorUIConfig;
  
  testCases: TestCase[];
  hints: string[];
  acceptanceCriteria: string[];
}

// ============================================================================
// Role Base Config (before level overlay)
// ============================================================================

export interface RoleCodeExecutionConfig {
  role: Role;
  displayName: string;
  description: string;
  
  editor: Omit<EditorConfig, 'readOnly'> & {
    baseReadOnly: boolean;
  };
  
  execution: ExecutionSettings;
  
  ui: Partial<EditorUIConfig>;
  
  providerPreference: ExecutionProviderType[];
}

// ============================================================================
// Level Overlay (applied on top of role config)
// ============================================================================

export interface LevelCodeExecutionOverlay {
  level: Level;
  displayName: string;
  
  scaffolding: ScaffoldingConfig;
  
  editorOverrides: Partial<EditorConfig>;
  executionOverrides: Partial<ExecutionSettings>;
  uiOverrides: Partial<EditorUIConfig>;
  
  starterCodeTransform?: (originalCode: string) => string;
  testCaseFilter?: (testCases: TestCase[]) => TestCase[];
}

// ============================================================================
// Code Challenge (extends backlog catalogue entry)
// ============================================================================

export interface CodeChallenge {
  language: EditorLanguage;
  starterFiles: Record<string, string>;
  solutionFiles?: Record<string, string>;
  testCases: TestCase[];
  hints: string[];
  acceptanceCriteria: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  concepts: string[];
}

// ============================================================================
// Session State (for tracking user progress)
// ============================================================================

export interface CodeExecutionSessionState {
  ticketId: string;
  workspaceId: number;
  
  currentFiles: Record<string, string>;
  originalFiles: Record<string, string>;
  
  executionHistory: ExecutionResponse[];
  latestExecution?: ExecutionResponse;
  
  hintsUsed: number;
  executionCount: number;
  
  startedAt: string;
  lastSavedAt?: string;
  submittedAt?: string;
  
  status: 'in-progress' | 'submitted' | 'approved' | 'needs-revision';
}
