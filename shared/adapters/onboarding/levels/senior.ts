/**
 * Senior Level Onboarding Overlay
 * 
 * No scaffolding - senior engineer is expected to handle environment setup
 * independently. May include additional troubleshooting scenarios.
 * Minimal UI guidance, strict validation.
 */

import type { LevelOnboardingOverlay, CodebaseMission } from '../types';

const seniorCodebaseMissions: CodebaseMission[] = [
  {
    id: 'architecture',
    label: 'Review overall architecture',
    required: true
  },
  {
    id: 'schema',
    label: 'Understand the data model',
    targetFile: 'shared/schema.ts',
    required: false
  }
];

export const seniorLevelOverlay: LevelOnboardingOverlay = {
  level: 'senior',
  displayName: 'Senior',
  scaffoldingLevel: 'none',
  
  stepModifiers: {
    additionalHints: false,
    simplifiedInstructions: false,
    showExamples: false
  },
  
  uiOverrides: {
    showHintsPanel: false,
    showProgressIndicator: false,
    allowSkipSteps: true,
    showCommandHistory: true,
    terminalHeight: 'expanded',
    hintVisibility: 'on-request'
  },
  
  difficultyOverrides: {
    hintDetailLevel: 'none',
    commandValidationStrictness: 'strict',
    errorRecoveryGuidance: false,
    maxRetries: 2,
    showExampleCommands: false
  },
  
  evaluationOverrides: {
    passingThreshold: 80,
    requiredStepsComplete: 4
  },
  
  terminalHintOverrides: [],
  
  codebaseExplorationOverrides: {
    skippable: true,
    estimatedMinutes: 5,
    missions: seniorCodebaseMissions,
    reflectionPrompt: 'Any quick notes or observations?',
    reflectionMinLength: 0,
    hintVisibility: 'hidden'
  }
};
