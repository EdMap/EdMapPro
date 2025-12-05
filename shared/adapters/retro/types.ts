/**
 * Sprint Retrospective Adapter Types
 * 
 * Defines the interface for role-aware, level-adjusted retrospective experiences.
 * Adapters control facilitation style, prompts, card suggestions, and UI.
 */

import type { Role, Level } from '../index';
import type { AIPersona } from '../execution/types';

export type RetroStep = 'context' | 'reflection' | 'action_items' | 'summary';

export type CardCategory = 'went_well' | 'to_improve' | 'action_item';

export type FacilitationStyle = 'guided' | 'prompted' | 'collaborative' | 'self_directed';

export interface FacilitatorPersona extends AIPersona {
  facilitationStyle: FacilitationStyle;
  focusAreas: string[];
  promptingFrequency: 'high' | 'medium' | 'low' | 'none';
}

export interface RetroCard {
  id: string;
  type: CardCategory;
  text: string;
  votes: number;
  authorId?: string;
  relatedTicketId?: string;
  category?: string;
  isAISuggested?: boolean;
}

export interface CardPrompt {
  category: CardCategory;
  prompt: string;
  hint?: string;
  exampleResponse?: string;
}

export interface SprintContextItem {
  type: 'ticket' | 'pr_review' | 'blocker' | 'feedback' | 'achievement';
  title: string;
  description: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  relatedId?: string;
}

export interface RetroPrompts {
  systemPrompt: string;
  contextIntroPrompt: string;
  reflectionPrompt: string;
  actionItemsPrompt: string;
  summaryPrompt: string;
  cardSuggestionPrompt: string;
  facilitatorPersonality: string;
}

export interface FacilitationConfig {
  facilitator: FacilitatorPersona;
  showFacilitatorMessages: boolean;
  autoSuggestCards: boolean;
  suggestFromSprintData: boolean;
  guidedQuestions: CardPrompt[];
  maxCardsPerCategory: number;
  votingEnabled: boolean;
  anonymousCards: boolean;
}

export interface RetroUIConfig {
  showSprintContext: boolean;
  showProgressBar: boolean;
  showCategoryLabels: boolean;
  showVoteCounts: boolean;
  showCardAuthors: boolean;
  expandCardsDefault: boolean;
  animateTransitions: boolean;
  celebrationAnimation: boolean;
  cardStyle: 'compact' | 'detailed' | 'sticky_note';
  layoutMode: 'two_column' | 'three_column' | 'board';
}

export interface ActionItemConfig {
  requireOwner: boolean;
  suggestFromTopVoted: boolean;
  maxActionItems: number;
  showPreviousActions: boolean;
  categories: string[];
}

export interface RetroEvaluation {
  criteria: {
    reflectionDepth: number;
    actionableItems: number;
    participation: number;
    positiveBalance: number;
  };
  passingThreshold: number;
  showFeedback: boolean;
}

export interface SprintRetroConfig {
  metadata: {
    role: Role;
    level: Level;
    displayName: string;
    description: string;
  };
  
  facilitationConfig: FacilitationConfig;
  prompts: RetroPrompts;
  uiConfig: RetroUIConfig;
  actionItemConfig: ActionItemConfig;
  evaluation: RetroEvaluation;
  
  starterCards: RetroCard[];
  learningObjectives: string[];
  tips: string[];
}

export interface RoleRetroConfig {
  role: Role;
  displayName: string;
  description: string;
  
  baseFacilitationConfig: Omit<FacilitationConfig, 'facilitator'> & {
    baseFacilitator: Omit<FacilitatorPersona, 'promptingFrequency'>;
  };
  basePrompts: Omit<RetroPrompts, 'systemPrompt'> & {
    baseSystemPrompt: string;
  };
  baseUIConfig: Partial<RetroUIConfig>;
  baseActionItemConfig: Partial<ActionItemConfig>;
  baseEvaluation: Partial<RetroEvaluation>;
  
  focusCategories: string[];
  learningObjectives: string[];
}

export interface LevelRetroOverlay {
  level: Level;
  displayName: string;
  scaffoldingLevel: 'high' | 'medium' | 'low' | 'none';
  
  facilitationModifiers: {
    styleOverride?: FacilitationStyle;
    promptingFrequency: 'high' | 'medium' | 'low' | 'none';
    showFacilitatorOverride?: boolean;
    autoSuggestOverride?: boolean;
    maxGuidedQuestions: number;
  };
  
  uiOverrides: Partial<RetroUIConfig>;
  actionItemOverrides: Partial<ActionItemConfig>;
  evaluationOverrides: Partial<RetroEvaluation>;
  
  starterCardCount: number;
  additionalTips: string[];
}

export interface SprintContextData {
  sprintId: number;
  sprintGoal: string;
  completedTickets: {
    id: string;
    key: string;
    title: string;
    type: string;
    points: number;
  }[];
  blockers: {
    ticketKey: string;
    description: string;
    resolvedBy?: string;
  }[];
  prReviewCycles: {
    prId: string;
    revisionCount: number;
    mainFeedback?: string;
  }[];
  stakeholderFeedback: {
    stakeholder: string;
    sentiment: 'positive' | 'neutral' | 'suggestion' | 'concern';
    summary: string;
  }[];
  metrics: {
    plannedPoints: number;
    completedPoints: number;
    velocity: number;
  };
}

export interface RetroState {
  workspaceId: number;
  sprintId: number;
  
  currentStep: RetroStep;
  
  cards: RetroCard[];
  actionItems: {
    id: string;
    text: string;
    owner: string;
    category?: string;
    priority?: 'high' | 'medium' | 'low';
  }[];
  
  facilitatorMessages: {
    id: string;
    message: string;
    timestamp: string;
  }[];
  
  sprintContext?: SprintContextData;
  
  startedAt: string;
  completedAt?: string;
}
