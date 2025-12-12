/**
 * Soft Skill Event Adapter Types
 * 
 * Defines the interface for role-aware, level-adjusted soft skill event experiences.
 * Adapters control suggestion visibility, evaluation strictness, feedback tone, and UI.
 */

import type { Role, Level } from '../index';

export type SoftSkillEventStatus = 'pending' | 'triggered' | 'in_progress' | 'completed' | 'skipped';
export type EvaluationMethod = 'rubric_mapping' | 'llm_scoring';
export type SuggestionVisibility = 'always' | 'collapsed' | 'hidden';
export type FeedbackTone = 'encouraging' | 'constructive' | 'direct' | 'peer';

export interface SuggestionConfig {
  visibility: SuggestionVisibility;
  showRecommendedLabel: boolean;
  maxSuggestionsShown: number;
  allowExpand: boolean;
  insertBehavior: 'replace' | 'append';
}

export interface EvaluationConfig {
  strictness: 'lenient' | 'moderate' | 'strict';
  llmThreshold: number;
  editTolerance: number;
  requiresLLMForEdited: boolean;
  rubricPassingScore: number;
}

export interface FeedbackConfig {
  tone: FeedbackTone;
  showStrengths: boolean;
  showGrowthAreas: boolean;
  showSuggestedPhrasing: boolean;
  showScore: boolean;
  maxFeedbackLength: 'brief' | 'moderate' | 'detailed';
}

export interface FollowUpConfig {
  enabled: boolean;
  autoRespond: boolean;
  respondDelay: number;
  personaMatching: boolean;
}

export interface SoftSkillUIConfig {
  modalSize: 'compact' | 'standard' | 'large';
  showScenarioContext: boolean;
  showCompetencyTags: boolean;
  showTimerHint: boolean;
  animateTransitions: boolean;
  inputPlaceholder: string;
}

export interface SoftSkillPromptConfig {
  systemPrompt: string;
  evaluationPrompt: string;
  followUpPrompt: string;
  feedbackPrompt: string;
}

export interface SoftSkillEventAdapter {
  metadata: {
    role: Role;
    level: Level;
    displayName: string;
    description: string;
  };
  
  suggestionConfig: SuggestionConfig;
  evaluationConfig: EvaluationConfig;
  feedbackConfig: FeedbackConfig;
  followUpConfig: FollowUpConfig;
  uiConfig: SoftSkillUIConfig;
  promptConfig: SoftSkillPromptConfig;
  
  rubricWeights: {
    communication: number;
    problemSolving: number;
    assertiveness: number;
    collaboration: number;
  };
}

export interface RoleSoftSkillAdapter {
  role: Role;
  displayName: string;
  description: string;
  
  baseSuggestionConfig: Omit<SuggestionConfig, 'visibility'>;
  baseEvaluationConfig: Omit<EvaluationConfig, 'strictness'>;
  baseFeedbackConfig: Omit<FeedbackConfig, 'tone' | 'maxFeedbackLength'> & {
    maxFeedbackLength: FeedbackConfig['maxFeedbackLength'];
  };
  baseFollowUpConfig: FollowUpConfig;
  baseUIConfig: Partial<SoftSkillUIConfig>;
  basePromptConfig: Omit<SoftSkillPromptConfig, 'feedbackPrompt'> & {
    baseFeedbackPrompt: string;
  };
  
  rubricWeights: SoftSkillEventAdapter['rubricWeights'];
}

export interface LevelSoftSkillOverlay {
  level: Level;
  displayName: string;
  scaffoldingLevel: 'high' | 'medium' | 'low' | 'none';
  
  suggestionModifiers: {
    visibility: SuggestionVisibility;
    showRecommendedLabel: boolean;
  };
  
  evaluationModifiers: {
    strictness: EvaluationConfig['strictness'];
    llmThresholdAdjustment: number;
  };
  
  feedbackModifiers: {
    tone: FeedbackTone;
    maxFeedbackLength: FeedbackConfig['maxFeedbackLength'];
    showScore: boolean;
  };
  
  uiOverrides: Partial<SoftSkillUIConfig>;
}

export interface SoftSkillEventActivityData {
  templateId: string;
  eventId: string;
  day: number;
  trigger: string;
  scenario: {
    setup: string;
    message: string;
    sender: string;
    senderRole: string;
  };
  responseOptions: {
    id: string;
    label: string;
    description: string;
    isRecommended: boolean;
    evaluationNotes: string;
  }[];
  evaluationCriteria: {
    dimension: string;
    question: string;
    weight: number;
  }[];
  followUpTemplates: {
    condition: string;
    message: string;
  }[];
  adapterConfig: {
    role: Role;
    level: Level;
    suggestionVisibility: SuggestionVisibility;
    evaluationStrictness: EvaluationConfig['strictness'];
    feedbackTone: FeedbackTone;
  };
}

export interface SoftSkillEventUserResponse {
  text: string;
  suggestionId: string | null;
  wasEdited: boolean;
  originalSuggestionText: string | null;
  respondedAt: string;
  timeToRespond: number;
}

export interface SoftSkillEventEvaluation {
  method: EvaluationMethod;
  scores: {
    communication: number;
    problemSolving: number;
    assertiveness: number;
    collaboration: number;
  };
  weightedScore: number;
  closestSuggestionId: string | null;
  feedback: {
    summary: string;
    strengths: string[];
    growthAreas: string[];
    suggestedPhrasing?: string;
  };
  competencyDeltas: Record<string, number>;
  evaluatedAt: string;
}

export interface SoftSkillEventState {
  eventId: string;
  status: SoftSkillEventStatus;
  triggeredAt?: string;
  completedAt?: string;
  userResponse?: SoftSkillEventUserResponse;
  evaluation?: SoftSkillEventEvaluation;
  followUpMessages: {
    sender: string;
    message: string;
    sentAt: string;
  }[];
}
