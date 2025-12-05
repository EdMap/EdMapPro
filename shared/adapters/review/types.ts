/**
 * Sprint Review Adapter Types
 * 
 * Defines the interface for role-aware, level-adjusted sprint review experiences.
 * Adapters control demo format, stakeholder feedback, evaluation criteria, and UI.
 */

import type { Role, Level } from '../index';
import type { AIPersona } from '../execution/types';

export type ReviewStep = 'demo' | 'feedback' | 'summary';

export interface StakeholderPersona extends AIPersona {
  expertise: string[];
  feedbackStyle: 'encouraging' | 'constructive' | 'direct' | 'challenging';
  focusAreas: string[];
  typicalFeedbackCount: number;
}

export interface StakeholderFeedback {
  stakeholderId: string;
  content: string;
  sentiment: 'positive' | 'neutral' | 'suggestion' | 'concern';
  category: 'praise' | 'improvement' | 'question' | 'next_steps';
  requiresResponse: boolean;
  relatedTicketId?: string;
}

export interface DemoScript {
  stepNumber: number;
  instruction: string;
  hint?: string;
  timeEstimate?: number;
  required: boolean;
}

export interface DemoConfig {
  format: 'guided' | 'prompted' | 'freeform';
  showScript: boolean;
  showTimer: boolean;
  allowSkip: boolean;
  allowNotes: boolean;
  scriptSteps: DemoScript[];
  timePerTicket: number;
  transitionPrompts: string[];
}

export interface FeedbackConfig {
  stakeholders: StakeholderPersona[];
  minFeedbackPerStakeholder: number;
  maxFeedbackPerStakeholder: number;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    suggestion: number;
    concern: number;
  };
  requireAcknowledgement: boolean;
  allowResponses: boolean;
  showSentimentIcons: boolean;
}

export interface ReviewPrompts {
  systemPrompt: string;
  demoIntroPrompt: string;
  feedbackGenerationPrompt: string;
  summaryPrompt: string;
  stakeholderPersonalities: Record<string, string>;
}

export interface ReviewUIConfig {
  showProgressBar: boolean;
  showTicketDetails: boolean;
  showPointsSummary: boolean;
  showSprintGoal: boolean;
  expandFeedbackByDefault: boolean;
  animateTransitions: boolean;
  cardStyle: 'compact' | 'detailed' | 'presentation';
}

export interface ReviewEvaluation {
  criteria: {
    demoCoverage: number;
    communicationClarity: number;
    stakeholderEngagement: number;
    feedbackReceptiveness: number;
  };
  passingThreshold: number;
  feedbackOnPerformance: boolean;
}

export interface SprintReviewConfig {
  metadata: {
    role: Role;
    level: Level;
    displayName: string;
    description: string;
  };
  
  demoConfig: DemoConfig;
  feedbackConfig: FeedbackConfig;
  prompts: ReviewPrompts;
  uiConfig: ReviewUIConfig;
  evaluation: ReviewEvaluation;
  
  learningObjectives: string[];
  tips: string[];
}

export interface RoleReviewConfig {
  role: Role;
  displayName: string;
  description: string;
  
  baseDemoConfig: Omit<DemoConfig, 'scriptSteps'> & {
    baseScriptSteps: Omit<DemoScript, 'stepNumber'>[];
  };
  baseFeedbackConfig: Omit<FeedbackConfig, 'stakeholders'> & {
    baseStakeholders: Omit<StakeholderPersona, 'typicalFeedbackCount'>[];
  };
  basePrompts: Omit<ReviewPrompts, 'systemPrompt'> & {
    baseSystemPrompt: string;
  };
  baseUIConfig: Partial<ReviewUIConfig>;
  baseEvaluation: Partial<ReviewEvaluation>;
  
  learningObjectives: string[];
}

export interface LevelReviewOverlay {
  level: Level;
  displayName: string;
  scaffoldingLevel: 'high' | 'medium' | 'low' | 'none';
  
  demoModifiers: {
    formatOverride?: DemoConfig['format'];
    showScriptOverride?: boolean;
    showTimerOverride?: boolean;
    allowSkipOverride?: boolean;
    additionalHints: boolean;
    timeMultiplier: number;
  };
  
  feedbackModifiers: {
    feedbackCountMultiplier: number;
    sentimentDistributionOverride?: FeedbackConfig['sentimentDistribution'];
    feedbackTone: 'encouraging' | 'constructive' | 'direct' | 'challenging';
    showExampleResponses: boolean;
    autoAcknowledgePositive: boolean;
  };
  
  uiOverrides: Partial<ReviewUIConfig>;
  evaluationOverrides: Partial<ReviewEvaluation>;
  
  additionalTips: string[];
}

export interface CompletedTicketSummary {
  id: string;
  key: string;
  title: string;
  type: 'bug' | 'feature' | 'improvement' | 'task';
  points: number;
  completedAt: string;
  prMerged: boolean;
  reviewCycles: number;
}

export interface SprintReviewState {
  workspaceId: number;
  sprintId: number;
  
  currentStep: ReviewStep;
  currentDemoIndex: number;
  currentFeedbackIndex: number;
  
  completedTickets: CompletedTicketSummary[];
  sprintGoal: string;
  totalPoints: number;
  
  demoNotes: Record<string, string>;
  feedbackReceived: StakeholderFeedback[];
  feedbackAcknowledged: Set<number>;
  
  startedAt: string;
  completedAt?: string;
}
