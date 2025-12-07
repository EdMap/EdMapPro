/**
 * Intern Level Onboarding Overlay
 * 
 * High scaffolding - intern receives detailed hints, examples shown,
 * and generous error recovery guidance. Commands must still be typed manually.
 */

import type { LevelOnboardingOverlay, CodebaseMission } from '../types';

const internCodebaseMissions: CodebaseMission[] = [
  {
    id: 'readme',
    label: 'Find and read the README.md file',
    targetFile: 'README.md',
    hint: 'This is always in the root folder - it explains what the project is about',
    required: true
  },
  {
    id: 'package-json',
    label: 'Open package.json and find the "scripts" section',
    targetFile: 'package.json',
    hint: 'Look for "scripts" - this tells you how to run the project',
    required: true
  },
  {
    id: 'entry-point',
    label: 'Find where the app starts (main.tsx or index.tsx)',
    targetFile: 'src/main.tsx',
    hint: 'Usually in the src folder - look for main.tsx or index.tsx',
    required: true
  },
  {
    id: 'schema',
    label: 'Look at the database schema to see what data is stored',
    targetFile: 'shared/schema.ts',
    hint: 'Schema files define your database tables and their columns',
    required: true
  },
  {
    id: 'routes',
    label: 'Find where API endpoints are created',
    targetFile: 'server/routes.ts',
    hint: 'Look in the server folder for routes.ts or similar',
    required: true
  },
  {
    id: 'components',
    label: 'Browse the components folder to see UI pieces',
    targetFile: 'client/src/components',
    hint: 'Components are reusable UI building blocks',
    required: true
  }
];

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
  ],
  
  codebaseExplorationOverrides: {
    skippable: false,
    estimatedMinutes: 20,
    missions: internCodebaseMissions,
    reflectionPrompt: 'What did you find interesting about the codebase? What parts are you curious to learn more about?',
    reflectionMinLength: 30,
    hintVisibility: 'always'
  }
};
