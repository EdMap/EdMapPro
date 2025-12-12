/**
 * Sprint Planning Adapter Types
 * 
 * Defines the interface for role-aware, level-adjusted sprint planning experiences.
 * Adapters control prompts, UI behavior, difficulty, and evaluation for each role/level combination.
 * 
 * Three-layer configuration:
 * 1. Role Base - Engagement areas, competency rubric (Dev: estimation, PM: goals)
 * 2. Level Overlay - Guidance intensity, scaffolding (Intern: heavy, Senior: none)
 * 3. Tier Overlay - Ownership level, talk ratio (Observer → Co-Facilitator → Leader)
 */

import type { Role, Level } from '../index';

export type PlanningPhase = 'context' | 'discussion' | 'commitment';

/**
 * Sprint Tiers - Adaptive progression based on demonstrated competency
 * Users earn advancement, not receive it automatically
 */
export type SprintTier = 'observer' | 'co_facilitator' | 'emerging_leader';
export type TierStatus = 'first_attempt' | 'practicing' | 'mastered';
export type TierAdvancementDecision = 'advance' | 'practice_more' | 'pending';

/**
 * Role-specific rubric weights for tier advancement
 * Each role has different competency signals to track
 */
export interface RoleRubricWeights {
  role: Role;
  weights: Record<string, number>;
  tierThreshold: number;
  consecutiveSessionsRequired: number;
}

export const DEVELOPER_RUBRIC: RoleRubricWeights = {
  role: 'developer',
  weights: {
    estimationAccuracy: 0.35,
    technicalTradeoffs: 0.25,
    collaboration: 0.20,
    understanding: 0.20
  },
  tierThreshold: 70,
  consecutiveSessionsRequired: 2
};

export const PM_RUBRIC: RoleRubricWeights = {
  role: 'pm',
  weights: {
    goalClarity: 0.30,
    prioritization: 0.30,
    stakeholderBalance: 0.20,
    scopeRealism: 0.20
  },
  tierThreshold: 70,
  consecutiveSessionsRequired: 2
};

export const QA_RUBRIC: RoleRubricWeights = {
  role: 'qa',
  weights: {
    testCoverage: 0.30,
    acceptanceCriteria: 0.25,
    riskIdentification: 0.25,
    edgeCases: 0.20
  },
  tierThreshold: 70,
  consecutiveSessionsRequired: 2
};

export function getRoleRubricWeights(role: Role): RoleRubricWeights {
  switch (role) {
    case 'pm': return PM_RUBRIC;
    case 'qa': return QA_RUBRIC;
    case 'developer':
    case 'devops':
    case 'data_science':
    default: return DEVELOPER_RUBRIC;
  }
}

/**
 * Planning session assessment for tier advancement decisions
 */
export interface PlanningSessionAssessment {
  sprintId: number;
  sessionId: number;
  tier: SprintTier;
  tierReadinessScore: number;
  rubricBreakdown: Record<string, number>;
  advancementDecision: TierAdvancementDecision;
  practiceObjectives?: string[];
  assessedAt: Date;
}

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
    tier?: SprintTier;
    tierStatus?: TierStatus;
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
  commitmentGuidance: CommitmentGuidance;
  tierMessaging?: TierAdvancementMessaging;
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
  commitmentGuidance: CommitmentGuidance;
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

export interface PreMeetingBriefing {
  enabled: boolean;
  title: string;
  subtitle: string;
  agenda: string[];
  attendees: { name: string; role: string; avatarSeed: string }[];
  contextNote?: string;
  joinButtonText: string;
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

export interface CommitmentGuidance {
  mode: 'autoSet' | 'userDefined';
  suggestedGoal?: string;
}

export interface LevelEngagement {
  mode: EngagementMode;
  autoStartConversation: boolean;
  autoAdvancePhases: boolean;
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
  commitmentGuidance?: CommitmentGuidance;
  preMeetingBriefing?: PreMeetingBriefing;
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

/**
 * Tier Planning Overlay - Applied on top of Role + Level
 * Controls ownership level based on demonstrated competency
 */
export interface TierPlanningOverlay {
  tier: SprintTier;
  displayName: string;
  description: string;
  engagementOverrides: Partial<LevelEngagement>;
  uiOverrides: Partial<PlanningUIControls>;
  promptModifiers: {
    ownershipLevel: string;
    responseExpectation: string;
  };
  advanceMessage: string;
  practiceMessage: string;
}

/**
 * Tier advancement UX messaging
 */
export interface TierAdvancementMessaging {
  advanceTitle: string;
  advanceDescription: string;
  practiceTitle: string;
  practiceDescription: string;
  practiceObjectivesIntro: string;
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
