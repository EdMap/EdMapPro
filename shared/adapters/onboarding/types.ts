/**
 * Onboarding Adapter Types
 * 
 * Defines the interface for role-aware, level-adjusted onboarding experiences.
 * Adapters control the environment setup flow, git terminal guidance, and evaluation.
 */

import type { Role, Level } from '../index';

export type OnboardingStep = 'documents' | 'environment' | 'comprehension';

export interface EnvironmentSetupStep {
  id: string;
  order: number;
  instruction: string;
  hint: string;
  validPatterns: RegExp[];
  successOutput: string;
  failureHint: string;
  competency: string;
}

export interface ProjectContext {
  name: string;
  org: string;
  repoUrl: string;
  description: string;
}

export interface TerminalHint {
  command: string;
  description: string;
  example?: string;
}

export interface EnvironmentSetupConfig {
  project: ProjectContext;
  steps: EnvironmentSetupStep[];
  terminalHints: TerminalHint[];
  completionMessage: {
    title: string;
    description: string;
  };
}

export interface OnboardingUIControls {
  showHintsPanel: boolean;
  showProgressIndicator: boolean;
  allowSkipSteps: boolean;
  showCommandHistory: boolean;
  terminalHeight: 'compact' | 'standard' | 'expanded';
  hintVisibility: 'always' | 'on-error' | 'on-request';
}

export interface OnboardingDifficulty {
  hintDetailLevel: 'full' | 'partial' | 'minimal' | 'none';
  commandValidationStrictness: 'lenient' | 'moderate' | 'strict';
  errorRecoveryGuidance: boolean;
  maxRetries: number;
  showExampleCommands: boolean;
}

export interface OnboardingEvaluation {
  rubricWeights: {
    commandAccuracy: number;
    completionSpeed: number;
    independentProgress: number;
    errorRecovery: number;
  };
  passingThreshold: number;
  requiredStepsComplete: number;
}

export interface OnboardingLearningObjectives {
  step: OnboardingStep;
  objectives: string[];
  tips: string[];
}

export interface OnboardingAdapter {
  metadata: {
    role: Role;
    level: Level;
    displayName: string;
    description: string;
    competencies: string[];
  };
  
  environmentSetup: EnvironmentSetupConfig;
  uiControls: OnboardingUIControls;
  difficulty: OnboardingDifficulty;
  evaluation: OnboardingEvaluation;
  learningObjectives: OnboardingLearningObjectives[];
}

export interface RoleOnboardingAdapter {
  role: Role;
  displayName: string;
  description: string;
  competencies: string[];
  environmentSetup: Omit<EnvironmentSetupConfig, 'steps'> & {
    baseSteps: EnvironmentSetupStep[];
  };
  uiControls: Partial<OnboardingUIControls>;
  difficulty: Partial<OnboardingDifficulty>;
  evaluation: Partial<OnboardingEvaluation>;
  learningObjectives: OnboardingLearningObjectives[];
}

export interface LevelOnboardingOverlay {
  level: Level;
  displayName: string;
  scaffoldingLevel: 'high' | 'medium' | 'low' | 'none';
  stepModifiers: {
    additionalHints: boolean;
    simplifiedInstructions: boolean;
    showExamples: boolean;
  };
  uiOverrides: Partial<OnboardingUIControls>;
  difficultyOverrides: Partial<OnboardingDifficulty>;
  evaluationOverrides: Partial<OnboardingEvaluation>;
  terminalHintOverrides?: TerminalHint[];
}

export interface EnvironmentSetupProgress {
  currentStep: number;
  completedSteps: string[];
  commandHistory: CommandHistoryEntry[];
  stepAttempts: Record<string, number>;
  startedAt: string;
  completedAt?: string;
}

export interface CommandHistoryEntry {
  command: string;
  output: string;
  isSuccess: boolean;
  stepId: string;
  timestamp: string;
}

export interface CommandValidationResult {
  isValid: boolean;
  matchedPattern?: string;
  output: string;
  hint?: string;
  nextStepUnlocked: boolean;
}
