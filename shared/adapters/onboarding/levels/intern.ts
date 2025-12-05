/**
 * Intern Level Onboarding Overlay
 * 
 * High scaffolding - intern receives detailed hints, examples shown,
 * and generous error recovery guidance. Commands must still be typed manually.
 */

import type { LevelOnboardingOverlay } from '../types';

export const internLevelOverlay: LevelOnboardingOverlay = {
  level: 'intern',
  displayName: 'Intern',
  scaffoldingLevel: 'high',
  
  stepModifiers: {
    additionalHints: true,
    simplifiedInstructions: true,
    showExamples: true
  },
  
  uiOverrides: {
    showHintsPanel: true,
    showProgressIndicator: true,
    allowSkipSteps: false,
    showCommandHistory: true,
    terminalHeight: 'standard',
    hintVisibility: 'always'
  },
  
  difficultyOverrides: {
    hintDetailLevel: 'full',
    commandValidationStrictness: 'lenient',
    errorRecoveryGuidance: true,
    maxRetries: 10,
    showExampleCommands: true
  },
  
  evaluationOverrides: {
    passingThreshold: 50,
    requiredStepsComplete: 3
  },
  
  terminalHintOverrides: [
    { 
      command: 'git clone', 
      description: 'Downloads a copy of the repository to your computer',
      example: 'git clone https://github.com/novapay/merchant-dashboard'
    },
    { 
      command: 'cd', 
      description: 'Changes your current directory (folder)',
      example: 'cd merchant-dashboard'
    },
    { 
      command: 'npm install', 
      description: 'Downloads all the libraries the project needs',
      example: 'npm install'
    },
    { 
      command: 'npm run dev', 
      description: 'Starts the application in development mode',
      example: 'npm run dev'
    },
    {
      command: 'ls',
      description: 'Lists files in the current directory',
      example: 'ls -la'
    },
    {
      command: 'pwd',
      description: 'Shows your current directory path',
      example: 'pwd'
    }
  ]
};
