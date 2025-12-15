/**
 * Sprint Execution Adapter Types
 * 
 * Defines the interface for role-aware, level-adjusted sprint execution experiences.
 * Adapters control git workflow, daily standups, ticket work, AI interactions, and evaluation.
 */

import type { Role, Level } from '../index';

export type ExecutionPhase = 'standup' | 'work' | 'review';
export type TicketStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type GitWorkflowStep = 'branch' | 'add' | 'commit' | 'push' | 'pr' | 'review' | 'merge';

export interface AIPersona {
  id: string;
  name: string;
  role: string;
  personality: string;
  avatarSeed: string;
  color: string;
}

export interface GitCommand {
  id: GitWorkflowStep;
  order: number;
  instruction: string;
  hint: string;
  validPatterns: RegExp[];
  successOutput: string | ((ticketId: string) => string);
  failureHint: string;
  competency: string;
  requiresPreviousStep?: GitWorkflowStep;
}

export interface GitWorkflowConfig {
  commands: GitCommand[];
  branchNamingPattern: string;
  commitMessageGuidelines: string[];
  prTemplateHint: string;
}

export interface StandupQuestion {
  id: string;
  question: string;
  placeholder: string;
  required: boolean;
  minLength?: number;
  exampleResponse?: string;
}

export interface StandupConfig {
  isUserFacilitator: boolean;
  questions: StandupQuestion[];
  aiResponseDelay: number;
  feedbackEnabled: boolean;
  feedbackPrompt: string;
}

export interface TicketWorkConfig {
  showAcceptanceCriteria: boolean;
  showCodeSnippets: boolean;
  allowParallelTickets: boolean;
  maxInProgress: number;
  requireGitWorkflow: boolean;
  autoMoveOnBranchCreate: boolean;
}

export type CodeWorkMode = 'guided-diff' | 'checklist' | 'freeform' | 'skip';

export interface CodeSnippet {
  filename: string;
  language: string;
  buggyCode: string;
  fixedCode: string;
  highlightLines?: number[];
  explanation?: string;
}

export interface CodeWorkStep {
  id: string;
  label: string;
  description: string;
  required: boolean;
}

export interface CodeWorkConfig {
  enabled: boolean;
  mode: CodeWorkMode;
  requireCompletionBeforeStage: boolean;
  showDiffView: boolean;
  showRunTests: boolean;
  steps: CodeWorkStep[];
  mentorHints: string[];
  completionMessage: string;
}

export interface AIInteractionConfig {
  personas: AIPersona[];
  standupFacilitator: string;
  prReviewers: string[];
  helpResponders: string[];
  interruptionFrequency: 'none' | 'low' | 'medium' | 'high';
  responsePersonality: 'supportive' | 'realistic' | 'challenging';
}

export interface PRReviewComment {
  type: 'suggestion' | 'question' | 'approval' | 'request_changes';
  severity: 'minor' | 'major' | 'blocking';
  message: string;
  requiresResponse: boolean;
}

export type ReviewPhase = 'awaiting_review' | 'in_review' | 'changes_requested' | 'approved' | 'merged';

export interface ReviewerResponsePatterns {
  clarification: string[];
  question: string[];
  willFix: string[];
  acknowledgment: string[];
  approval: string[];
}

export interface ConceptExplanation {
  concept: string;
  aliases: string[];
  explanation: string;
  codeExample?: string;
  qaAngle?: string;
}

export interface PRReviewKnowledgeBase {
  concepts: ConceptExplanation[];
}

export interface ReviewerPromptConfig {
  systemPrompt: string;
  reviewPrompt: string;
  focusInstructions: string[];
  severityGuidelines: {
    blocking: string;
    major: string;
    minor: string;
  };
}

export interface ReviewerPersona extends AIPersona {
  expertise: string[];
  reviewStyle: 'thorough' | 'balanced' | 'quick';
  focusAreas: string[];
  typicalCommentCount: number;
  responsePatterns?: ReviewerResponsePatterns;
  promptConfig?: ReviewerPromptConfig;
}

export interface ReviewThreadComment {
  id: string;
  reviewerId: string;
  content: string;
  type: PRReviewComment['type'];
  severity: PRReviewComment['severity'];
  createdAt: string;
  isResolved: boolean;
  requiresResponse: boolean;
  userResponse?: string;
  userRespondedAt?: string;
}

export interface ReviewThread {
  id: string;
  prId: string;
  filename?: string;
  lineNumber?: number;
  codeSnippet?: string;
  comments: ReviewThreadComment[];
  status: 'open' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
}

export interface RevisionCycle {
  cycleNumber: number;
  requestedAt: string;
  completedAt?: string;
  changesRequested: string[];
  changesAddressed: string[];
  newCommitHash?: string;
}

export type PRReviewLayoutMode = 'split-diff' | 'unified' | 'conversation-first';

export interface PRReviewUIConfig {
  layoutMode: PRReviewLayoutMode;
  showDiffViewer: boolean;
  showFileTree: boolean;
  showTimeline: boolean;
  showReviewChecklist: boolean;
  inlineComments: boolean;
  expandThreadsByDefault: boolean;
  highlightUnresolved: boolean;
  showRevisionHistory: boolean;
  // Rework flow UI config
  showReturnToCode: boolean;
  showReviewBanner: boolean;
  showProgressIndicator: boolean;
  enableMarkAddressed: boolean;
}

// PR Review state for tracking review→rework→re-review cycle
export type PRReviewStatus = 'pending_review' | 'changes_requested' | 'approved' | 'merged';

export interface PRReviewState {
  status: PRReviewStatus;
  currentCycle: number;
  threads: ReviewThreadState[];
  lastTestsPassed: boolean;
  lastTestsRunAt?: string;
  canRequestReReview: boolean;
  canMerge: boolean;
}

export interface ReviewThreadState {
  threadId: string;
  severity: 'minor' | 'major' | 'blocking';
  status: 'open' | 'addressed' | 'resolved' | 'dismissed';
  filename?: string;
  lineNumber?: number;
  userAddressedAt?: string;
  reviewerResolvedAt?: string;
}

export interface ReworkGuidance {
  returnToCodeMessage: string;
  addressedHint: string;
  reReviewHint: string;
  testRequirementMessage: string;
}

export interface PRReviewPrompts {
  systemPrompt: string;
  initialReviewPrompt: string;
  followUpPrompt: string;
  reReviewPrompt: string;
  approvalCriteria: string[];
  commonIssuesHint: string[];
}

export interface ReReviewVerificationConfig {
  requireUserResponse: boolean;
  requireTestsPass: boolean;
  strictCodeVerification: boolean;
  verificationPrompt: string;
}

export interface PRReviewConfig {
  enabled: boolean;
  minCommentsPerPR: number;
  maxCommentsPerPR: number;
  commentTypes: PRReviewComment[];
  requireAllResolved: boolean;
  autoApproveThreshold: number;
  maxRevisionCycles: number;
  reviewers: ReviewerPersona[];
  uiConfig: PRReviewUIConfig;
  prompts: PRReviewPrompts;
  levelModifiers: PRReviewModifiers;
  knowledgeBase?: PRReviewKnowledgeBase;
  reReviewConfig: ReReviewVerificationConfig;
}

export interface RolePRReviewConfig {
  enabled: boolean;
  minCommentsPerPR: number;
  maxCommentsPerPR: number;
  requireAllResolved: boolean;
  autoApproveThreshold: number;
  maxRevisionCycles: number;
  baseReviewers: Omit<ReviewerPersona, 'typicalCommentCount'>[];
  baseUIConfig: Partial<PRReviewUIConfig>;
  basePrompts: Omit<PRReviewPrompts, 'systemPrompt'> & {
    baseSystemPrompt: string;
  };
  knowledgeBase?: PRReviewKnowledgeBase;
}

export type MinorResponseBehavior = 'auto-resolve' | 'intelligent-follow-up' | 'manual';

export interface PRReviewModifiers {
  commentCountMultiplier: number;
  severityDistribution: {
    minor: number;
    major: number;
    blocking: number;
  };
  feedbackTone: 'educational' | 'collaborative' | 'direct' | 'peer';
  showExampleResponses: boolean;
  autoResolveMinorOnResponse: boolean;
  minorResponseBehavior: MinorResponseBehavior;
  requireExplicitApprovalRequest: boolean;
  uiOverrides: Partial<PRReviewUIConfig>;
  llmReviewConfig: LLMReviewLevelConfig;
}

export interface LLMReviewLevelConfig {
  explanationDepth: 'detailed' | 'moderate' | 'concise';
  includeCodeExamples: boolean;
  includeWhyExplanations: boolean;
  assumeKnowledgeLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  toneModifier: string;
  maxCommentsPerReviewer: number;
}

export type LayoutMode = 'two-column' | 'stacked' | 'focus-code' | 'focus-terminal';
export type PanelPosition = 'left' | 'right' | 'top' | 'bottom';

export interface LayoutConfig {
  mode: LayoutMode;
  sidebarPosition: PanelPosition;
  sidebarWidth: 'narrow' | 'medium' | 'wide';
  codeWorkPosition: 'above-terminal' | 'below-terminal' | 'separate-panel';
  terminalHeight: 'compact' | 'medium' | 'expanded';
  chatPosition: 'sidebar' | 'main-bottom' | 'floating';
  collapsiblePanels: boolean;
  animateTransitions: boolean;
  mobileBreakpoint: 'sm' | 'md' | 'lg';
}

export interface ReviewPhaseLayout {
  showGitTerminal: boolean;
  showTeamChat: boolean;
  showQuickActions: boolean;
  panelWidth: 'full' | 'wide' | 'standard';
  terminalCollapsible: boolean;
}

export interface TicketCompletionConfig {
  showCelebration: boolean;
  celebrationStyle: 'confetti' | 'simple' | 'minimal';
  showProgressRecap: boolean;
  showLearningHighlights: boolean;
  autoRedirectDelay: number | null;
  nextActionOptions: {
    primary: 'back-to-board' | 'next-ticket' | 'start-retro';
    secondary?: 'review-code' | 'view-diff' | 'skip';
  };
  celebrationMessages: {
    title: string;
    subtitle: string;
    encouragement: string;
  };
}

// Context passed to dynamic message functions
export interface SprintContext {
  sprintNumber: number;
  isFirstSprint: boolean;
}

// Messages can be static strings or functions that receive sprint context
export type DynamicMessage = string | ((ctx: SprintContext) => string);

export interface DynamicCelebrationMessages {
  title?: DynamicMessage;
  subtitle?: DynamicMessage;
  encouragement?: DynamicMessage;
}

export interface TicketCompletionModifiers {
  celebrationStyleOverride?: 'confetti' | 'simple' | 'minimal';
  showProgressRecapOverride?: boolean;
  showLearningHighlightsOverride?: boolean;
  messagesOverride?: DynamicCelebrationMessages;
}

export interface SprintCompletionConfig {
  showProgressBar: boolean;
  showCompletionBanner: boolean;
  bannerPosition: 'top' | 'inline' | 'modal';
  progressMessages: {
    inProgress: string;
    nearComplete: string;
    allDone: string;
  };
  completionCTA: {
    label: string;
    description: string;
    nextPhase: 'review' | 'retro';
  };
  celebrationStyle: 'confetti' | 'simple' | 'minimal';
  showTeamMessage: boolean;
  teamMessage: string;
}

export interface DynamicProgressMessages {
  inProgress?: DynamicMessage;
  nearComplete?: DynamicMessage;
  allDone?: DynamicMessage;
}

export interface SprintCompletionModifiers {
  progressMessagesOverride?: DynamicProgressMessages;
  completionCTAOverride?: Partial<SprintCompletionConfig['completionCTA']>;
  celebrationStyleOverride?: SprintCompletionConfig['celebrationStyle'];
  teamMessageOverride?: DynamicMessage;
}

export interface ExecutionUIControls {
  showGitTerminal: boolean;
  showTeamChat: boolean;
  showAcceptanceCriteria: boolean;
  showWorkflowProgress: boolean;
  showBurndownChart: boolean;
  showCompetencyBadges: boolean;
  showMentorHints: boolean;
  terminalHintsVisibility: 'always' | 'on-error' | 'on-request' | 'never';
  allowShortcutButtons: boolean;
  splitPanelLayout: 'terminal-right' | 'terminal-bottom' | 'terminal-left';
  layout: LayoutConfig;
  reviewPhaseLayout?: ReviewPhaseLayout;
}

export interface ExecutionDifficulty {
  gitCommandStrictness: 'lenient' | 'moderate' | 'strict';
  hintDetailLevel: 'full' | 'partial' | 'minimal' | 'none';
  prReviewIntensity: 'gentle' | 'moderate' | 'thorough';
  interruptionComplexity: 'simple' | 'moderate' | 'complex';
  stretchTasksEnabled: boolean;
  timeBoxedDays: boolean;
}

export interface ExecutionEvaluation {
  rubricWeights: {
    gitMastery: number;
    deliveryReliability: number;
    communicationQuality: number;
    collaborationSkill: number;
    codeReviewResponse: number;
  };
  passingThreshold: number;
  requiredTicketsComplete: number;
  requiredPRsReviewed: number;
}

export interface ExecutionLearningObjectives {
  phase: ExecutionPhase;
  objectives: string[];
  tips: string[];
}

export type EngagementMode = 'shadow' | 'guided' | 'active' | 'autonomous';

export interface LevelEngagement {
  mode: EngagementMode;
  teamTalkRatio: number;
  standupGuidance: 'scripted' | 'prompted' | 'freeform';
  gitGuidance: 'step-by-step' | 'milestone' | 'independent';
  prReviewGuidance: 'walkthrough' | 'hints' | 'independent';
}

export interface SprintExecutionAdapter {
  metadata: {
    role: Role;
    level: Level;
    displayName: string;
    description: string;
    competencies: string[];
  };
  
  gitWorkflow: GitWorkflowConfig;
  standupConfig: StandupConfig;
  ticketWorkConfig: TicketWorkConfig;
  codeWorkConfig: CodeWorkConfig;
  aiInteractions: AIInteractionConfig;
  prReviewConfig: PRReviewConfig;
  ticketCompletion: TicketCompletionConfig;
  sprintCompletion: SprintCompletionConfig;
  
  uiControls: ExecutionUIControls;
  difficulty: ExecutionDifficulty;
  evaluation: ExecutionEvaluation;
  engagement: LevelEngagement;
  learningObjectives: ExecutionLearningObjectives[];
}

export interface RoleExecutionAdapter {
  role: Role;
  displayName: string;
  description: string;
  competencies: string[];
  
  gitWorkflow: GitWorkflowConfig;
  standupConfig: Omit<StandupConfig, 'feedbackPrompt'> & {
    baseFeedbackPrompt: string;
  };
  ticketWorkConfig: TicketWorkConfig;
  codeWorkConfig: Omit<CodeWorkConfig, 'mode'> & {
    baseMode: CodeWorkMode;
  };
  aiInteractions: Omit<AIInteractionConfig, 'responsePersonality'>;
  prReviewConfig: RolePRReviewConfig;
  ticketCompletionConfig: TicketCompletionConfig;
  sprintCompletionConfig: SprintCompletionConfig;
  
  uiControls: Partial<ExecutionUIControls>;
  difficulty: Partial<ExecutionDifficulty>;
  evaluation: Partial<ExecutionEvaluation>;
  learningObjectives: ExecutionLearningObjectives[];
}

export interface LevelExecutionOverlay {
  level: Level;
  displayName: string;
  scaffoldingLevel: 'high' | 'medium' | 'low' | 'none';
  
  engagement: LevelEngagement;
  prReviewComments: PRReviewComment[];
  prReviewModifiers: PRReviewModifiers;
  
  uiOverrides: Partial<ExecutionUIControls>;
  difficultyOverrides: Partial<ExecutionDifficulty>;
  evaluationOverrides: Partial<ExecutionEvaluation>;
  
  standupModifiers: {
    showExamples: boolean;
    provideFeedback: boolean;
    feedbackTone: 'encouraging' | 'constructive' | 'direct';
  };
  
  gitModifiers: {
    showCommandHints: boolean;
    showNextStepPrompt: boolean;
    allowButtonShortcuts: boolean;
  };
  
  codeWorkModifiers: {
    modeOverride?: CodeWorkMode;
    showDiffView: boolean;
    showRunTests: boolean;
    autoCompleteSteps: boolean;
    mentorGuidance: 'heavy' | 'moderate' | 'light' | 'none';
  };
  
  ticketCompletionModifiers: TicketCompletionModifiers;
  sprintCompletionModifiers: SprintCompletionModifiers;
}

export interface TicketWorkProgress {
  ticketId: string;
  status: TicketStatus;
  gitProgress: {
    branchCreated: boolean;
    branchName?: string;
    changesStaged: boolean;
    committed: boolean;
    commitMessage?: string;
    pushed: boolean;
    prOpened: boolean;
    prNumber?: string;
    reviewReceived: boolean;
    reviewAddressed: boolean;
    merged: boolean;
  };
  commandHistory: CommandHistoryEntry[];
  startedAt?: string;
  completedAt?: string;
}

export interface CommandHistoryEntry {
  command: string;
  output: string;
  isSuccess: boolean;
  stepId: GitWorkflowStep;
  timestamp: string;
}

export interface DailyStandupEntry {
  day: number;
  yesterday: string;
  today: string;
  blockers: string;
  aiFeedback?: string;
  submittedAt: string;
}

export interface ExecutionSessionState {
  workspaceId: number;
  sprintId: number;
  currentDay: number;
  totalDays: number;
  
  standupComplete: boolean;
  standupEntries: DailyStandupEntry[];
  
  activeTicketId?: string;
  ticketProgress: Record<string, TicketWorkProgress>;
  
  completedPoints: number;
  totalPoints: number;
  
  competencyScores: Record<string, number>;
}
