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

export interface PRReviewConfig {
  enabled: boolean;
  minCommentsPerPR: number;
  maxCommentsPerPR: number;
  commentTypes: PRReviewComment[];
  requireAllResolved: boolean;
  autoApproveThreshold: number;
}

export interface ExecutionUIControls {
  showGitTerminal: boolean;
  showTeamChat: boolean;
  showAcceptanceCriteria: boolean;
  showWorkflowProgress: boolean;
  showBurndownChart: boolean;
  showCompetencyBadges: boolean;
  terminalHintsVisibility: 'always' | 'on-error' | 'on-request' | 'never';
  allowShortcutButtons: boolean;
  splitPanelLayout: 'terminal-right' | 'terminal-bottom' | 'terminal-left';
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
  aiInteractions: AIInteractionConfig;
  prReviewConfig: PRReviewConfig;
  
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
  aiInteractions: Omit<AIInteractionConfig, 'responsePersonality'>;
  prReviewConfig: Omit<PRReviewConfig, 'commentTypes'>;
  
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
