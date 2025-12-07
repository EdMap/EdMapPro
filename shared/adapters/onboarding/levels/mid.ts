/**
 * Mid Level Onboarding Overlay
 * 
 * Low scaffolding - mid-level engineer is expected to know basic commands.
 * Hints available on request only. Some troubleshooting scenarios introduced.
 */

import type { LevelOnboardingOverlay, CodebaseMission } from '../types';

const midCodebaseMissions: CodebaseMission[] = [
  {
    id: 'readme',
    label: 'Review project documentation',
    targetFile: 'README.md',
    required: true
  },
  {
    id: 'architecture',
    label: 'Understand the overall architecture',
    required: true
  },
  {
    id: 'schema',
    label: 'Analyze the data model',
    targetFile: 'shared/schema.ts',
    required: true
  },
  {
    id: 'adapters',
    label: 'Study the adapter pattern implementation',
    targetFile: 'shared/adapters',
    required: false
  }
];

export const midLevelOverlay: LevelOnboardingOverlay = {
  level: 'mid',
  displayName: 'Mid-Level',
  scaffoldingLevel: 'low',
  
  stepModifiers: {
    additionalHints: false,
    simplifiedInstructions: false,
    showExamples: false
  },
  
  uiOverrides: {
    showHintsPanel: false,
    showProgressIndicator: true,
    allowSkipSteps: false,
    showCommandHistory: true,
    terminalHeight: 'standard',
    hintVisibility: 'on-request'
  },
  
  difficultyOverrides: {
    hintDetailLevel: 'minimal',
    commandValidationStrictness: 'strict',
    errorRecoveryGuidance: false,
    maxRetries: 3,
    showExampleCommands: false
  },
  
  evaluationOverrides: {
    passingThreshold: 70,
    requiredStepsComplete: 4
  },
  
  terminalHintOverrides: [
    { command: 'git clone', description: 'Clone repo' },
    { command: 'cd', description: 'Change dir' },
    { command: 'npm install', description: 'Install deps' },
    { command: 'npm run dev', description: 'Start server' }
  ],
  
  codebaseExplorationOverrides: {
    skippable: true,
    estimatedMinutes: 10,
    missions: midCodebaseMissions,
    reflectionPrompt: 'Any architectural observations or suggestions?',
    reflectionMinLength: 20,
    hintVisibility: 'hidden'
  }
};
