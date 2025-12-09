/**
 * Daily Standup Adapter Types
 * 
 * Defines the interface for role-aware, level-adjusted daily standup experiences.
 * Adapters control prompts, facilitator persona, feedback generation, and UI behavior.
 */

import type { Role, Level } from '../index';

export interface StandupPersona {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  avatarSeed: string;
}

export interface StandupQuestion {
  id: string;
  label: string;
  placeholder: string;
  helpText?: string;
  required: boolean;
  minLength?: number;
}

export interface StandupPromptConfig {
  systemPrompt: string;
  feedbackGuidance: string;
  facilitator: StandupPersona;
  respondingPersonas: StandupPersona[];
}

export interface StandupUIConfig {
  showExamples: boolean;
  showProgressIndicator: boolean;
  showTeamContext: boolean;
  enableVoiceInput: boolean;
}

export interface StandupFeedbackConfig {
  minResponses: number;
  maxResponses: number;
  feedbackTone: 'encouraging' | 'balanced' | 'direct';
  includeActionItems: boolean;
  includeFollowUpQuestions: boolean;
}

export interface LevelStandupOverlay {
  level: Level;
  displayName: string;
  scaffoldingLevel: 'high' | 'medium' | 'low' | 'none';
  questions: StandupQuestion[];
  promptModifiers: {
    guidanceLevel: string;
    toneAdjustment: string;
  };
  uiConfig: StandupUIConfig;
  feedbackConfig: StandupFeedbackConfig;
}

export interface StandupAdapter {
  metadata: {
    role: Role;
    level: Level;
    displayName: string;
    description: string;
  };
  prompts: StandupPromptConfig;
  questions: StandupQuestion[];
  uiConfig: StandupUIConfig;
  feedbackConfig: StandupFeedbackConfig;
}

export interface StandupSessionContext {
  workspaceId: number;
  sprintId: number;
  sprintDay: number;
  role: Role;
  level: Level;
  companyName: string;
  userName: string;
  ticketContext: {
    inProgress: string[];
    completed: string[];
    blocked: string[];
  };
}

export interface StandupSubmission {
  yesterday: string;
  today: string;
  blockers?: string;
}

export interface TeamFeedbackResponse {
  from: StandupPersona;
  message: string;
  type: 'acknowledgment' | 'suggestion' | 'followup' | 'encouragement';
}
