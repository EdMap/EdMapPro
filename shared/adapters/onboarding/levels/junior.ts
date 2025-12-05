/**
 * Junior Level Onboarding Overlay
 * 
 * Moderate scaffolding - junior receives hints but less hand-holding.
 * Some guidance on errors, but expected to try before asking for help.
 */

import type { LevelOnboardingOverlay } from '../types';

export const juniorLevelOverlay: LevelOnboardingOverlay = {
  level: 'junior',
  displayName: 'Junior',
  scaffoldingLevel: 'medium',
  
  stepModifiers: {
    additionalHints: true,
    simplifiedInstructions: false,
    showExamples: false
  },
  
  uiOverrides: {
    showHintsPanel: true,
    showProgressIndicator: true,
    allowSkipSteps: false,
    showCommandHistory: true,
    terminalHeight: 'standard',
    hintVisibility: 'on-error'
  },
  
  difficultyOverrides: {
    hintDetailLevel: 'partial',
    commandValidationStrictness: 'moderate',
    errorRecoveryGuidance: true,
    maxRetries: 5,
    showExampleCommands: false
  },
  
  evaluationOverrides: {
    passingThreshold: 60,
    requiredStepsComplete: 4
  },
  
  terminalHintOverrides: [
    { 
      command: 'git clone', 
      description: 'Clone a repository from GitHub'
    },
    { 
      command: 'cd', 
      description: 'Change directory'
    },
    { 
      command: 'npm install', 
      description: 'Install dependencies'
    },
    { 
      command: 'npm run dev', 
      description: 'Start dev server'
    }
  ]
};
