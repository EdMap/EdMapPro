/**
 * Senior Level Onboarding Overlay
 * 
 * No scaffolding - senior engineer is expected to handle environment setup
 * independently. May include additional troubleshooting scenarios.
 * Minimal UI guidance, strict validation.
 */

import type { LevelOnboardingOverlay } from '../types';

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
  
  terminalHintOverrides: []
};
