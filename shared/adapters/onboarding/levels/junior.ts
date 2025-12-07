/**
 * Junior Level Onboarding Overlay
 * 
 * Moderate scaffolding - junior receives hints but less hand-holding.
 * Some guidance on errors, but expected to try before asking for help.
 */

import type { LevelOnboardingOverlay, CodebaseMission } from '../types';

const juniorCodebaseMissions: CodebaseMission[] = [
  {
    id: 'readme',
    label: 'Review the README for project context',
    targetFile: 'README.md',
    hint: 'Pay attention to setup instructions and architecture notes',
    required: true
  },
  {
    id: 'package-json',
    label: 'Examine package.json scripts and dependencies',
    targetFile: 'package.json',
    hint: 'Note the dev, build, and test commands',
    required: true
  },
  {
    id: 'entry-point',
    label: 'Trace the application entry point',
    targetFile: 'src/main.tsx',
    required: true
  },
  {
    id: 'schema',
    label: 'Study the database schema and relationships',
    targetFile: 'shared/schema.ts',
    hint: 'Look for table relationships and foreign keys',
    required: true
  },
  {
    id: 'routes',
    label: 'Map out the API route structure',
    targetFile: 'server/routes.ts',
    required: true
  },
  {
    id: 'components',
    label: 'Explore the component hierarchy',
    targetFile: 'client/src/components',
    required: false
  },
  {
    id: 'adapters',
    label: 'Discover the adapter pattern used in the project',
    targetFile: 'shared/adapters',
    hint: 'Adapters customize behavior based on role and level',
    required: false
  },
  {
    id: 'hooks',
    label: 'Find custom React hooks',
    targetFile: 'client/src/hooks',
    required: false
  }
];

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
  ],
  
  codebaseExplorationOverrides: {
    skippable: false,
    estimatedMinutes: 15,
    missions: juniorCodebaseMissions,
    reflectionPrompt: 'What patterns did you notice in the codebase? Any areas you want to understand better?',
    reflectionMinLength: 40,
    hintVisibility: 'hover'
  }
};
