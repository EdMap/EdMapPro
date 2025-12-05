/**
 * Sprint Planning Adapter Types
 * 
 * Defines the interface for role-aware, level-adjusted sprint planning experiences.
 * Adapters control prompts, UI behavior, difficulty, and evaluation for each role/level combination.
 */

import type { Role, Level } from '../index';

export type PlanningPhase = 'context' | 'discussion' | 'commitment';

export interface AIPersona {
  name: string;
  role: string;
  personality: string;
  avatarSeed: string;
  color: string;
}

export interface PlanningPrompts {
  systemPrompt: string;
  contextPhasePrompt: string;
  discussionPhasePrompt: string;
  commitmentPhasePrompt: string;
  personas: AIPersona[];
  facilitator: 'user' | 'ai';
}

export interface PlanningUIControls {
  showPriorityEditor: boolean;
  showEstimationSliders: boolean;
  requireDiscussionBeforeNext: boolean;
  showLearningObjectives: boolean;
  showKnowledgeCheck: boolean;
  canSkipPhases: boolean;
  showMeetingTimer: boolean;
  showCapacityIndicator: boolean;
}

export interface PlanningDifficulty {
  ticketComplexity: 'low' | 'medium' | 'high';
  ambiguityLevel: number;
  conflictScenarios: boolean;
  aiPushbackIntensity: 'none' | 'gentle' | 'moderate' | 'strong';
  estimationAccuracy: 'guided' | 'assisted' | 'independent';
}

export interface PlanningEvaluation {
  rubricWeights: {
    participation: number;
    understanding: number;
    collaboration: number;
    goalClarity: number;
    scopeRealism: number;
  };
  passingThreshold: number;
  requiredInteractions: number;
}

export interface PlanningLearningObjectives {
  phase: PlanningPhase;
  objectives: string[];
  tips: string[];
}

export interface SprintPlanningAdapter {
  metadata: {
    role: Role;
    level: Level;
    displayName: string;
    description: string;
    competencies: string[];
  };
  
  prompts: PlanningPrompts;
  uiControls: PlanningUIControls;
  difficulty: PlanningDifficulty;
  evaluation: PlanningEvaluation;
  engagement: LevelEngagement;
  learningObjectives: PlanningLearningObjectives[];
}

export interface RolePlanningAdapter {
  role: Role;
  displayName: string;
  description: string;
  competencies: string[];
  prompts: Omit<PlanningPrompts, 'systemPrompt'> & {
    baseSystemPrompt: string;
  };
  uiControls: Partial<PlanningUIControls>;
  difficulty: Partial<PlanningDifficulty>;
  evaluation: Partial<PlanningEvaluation>;
  learningObjectives: PlanningLearningObjectives[];
}

export type EngagementMode = 'shadow' | 'guided' | 'active' | 'facilitator';
export type PhaseEngagement = 'observe' | 'respond' | 'lead';

export interface AutoStartStep {
  personaId: 'priya' | 'marcus' | 'alex';
  personaName: string;
  personaRole: string;
  message: string;
  phase: PlanningPhase;
  requiresUserResponse?: boolean;
}

export interface MessageStaggerConfig {
  enabled: boolean;
  baseDelayMs: number;
  perCharacterDelayMs: number;
  maxDelayMs: number;
}

export interface PhaseTransitionSequence {
  phase: PlanningPhase;
  steps: AutoStartStep[];
}

export type SelectionGuidanceMode = 'autoAssign' | 'prompted' | 'selfManaged';

export interface SelectionGuidance {
  mode: SelectionGuidanceMode;
  suggestedItemIds?: string[];
  confirmationPrompt?: string;
  visualCueCopy?: string;
  backlogPanelHighlight?: boolean;
  nextStepHint?: string;
}

export interface LevelEngagement {
  mode: EngagementMode;
  autoStartConversation: boolean;
  teamTalkRatio: number;
  phaseEngagement: {
    context: PhaseEngagement;
    discussion: PhaseEngagement;
    commitment: PhaseEngagement;
  };
  promptSuggestions?: {
    context: string[];
    discussion: string[];
    commitment: string[];
  };
  autoStartMessage: string;
  autoStartSequence?: AutoStartStep[];
  phaseTransitionSequences?: PhaseTransitionSequence[];
  messageStagger?: MessageStaggerConfig;
  selectionGuidance?: SelectionGuidance;
}

export interface LevelPlanningOverlay {
  level: Level;
  displayName: string;
  scaffoldingLevel: 'high' | 'medium' | 'low' | 'none';
  promptModifiers: {
    guidanceLevel: string;
    toneAdjustment: string;
  };
  engagement: LevelEngagement;
  uiOverrides: Partial<PlanningUIControls>;
  difficultyOverrides: Partial<PlanningDifficulty>;
  evaluationOverrides: Partial<PlanningEvaluation>;
}

export interface PlanningSessionContext {
  workspaceId: number;
  sprintId?: number;
  role: Role;
  level: Level;
  companyName: string;
  backlogItems: BacklogItem[];
  capacity: number;
}

export interface BacklogItem {
  id: string;
  title: string;
  description: string;
  type: 'bug' | 'feature' | 'improvement';
  priority: 'high' | 'medium' | 'low';
  points: number;
  selected?: boolean;
}

export interface PlanningMessage {
  id: string;
  sender: string;
  senderRole: string;
  message: string;
  phase: PlanningPhase;
  timestamp: Date;
  isUser: boolean;
}

export interface PlanningSessionState {
  currentPhase: PlanningPhase;
  phaseCompletions: Record<PlanningPhase, boolean>;
  selectedItems: string[];
  capacityUsed: number;
  goalStatement: string;
  commitmentSummary: string;
  messages: PlanningMessage[];
  knowledgeCheckPassed: boolean;
}
