/**
 * Mid-Level Standup Overlay
 * 
 * Low scaffolding with concise prompts.
 * Peer-level interaction expecting clear, professional updates.
 */

import type { LevelStandupOverlay } from '../types';

export const midStandupOverlay: LevelStandupOverlay = {
  level: 'mid',
  displayName: 'Mid-Level',
  scaffoldingLevel: 'low',
  
  questions: [
    {
      id: 'yesterday',
      label: 'Yesterday',
      placeholder: "What did you accomplish?",
      required: true,
      minLength: 10,
    },
    {
      id: 'today',
      label: 'Today',
      placeholder: "What are you working on?",
      required: true,
      minLength: 10,
    },
    {
      id: 'blockers',
      label: 'Blockers',
      placeholder: "Any impediments or dependencies?",
      required: false,
    },
  ],
  
  promptModifiers: {
    guidanceLevel: `This is a mid-level professional. Keep responses concise and peer-level.
Focus on coordination and unblocking rather than teaching.
Challenge their assumptions when appropriate.`,
    
    toneAdjustment: `Be direct and professional.
Acknowledge updates briefly and focus on coordination.
Probe for dependencies that might affect the team.`,
  },
  
  uiConfig: {
    showExamples: false,
    showProgressIndicator: true,
    showTeamContext: false,
    enableVoiceInput: true,
  },
  
  feedbackConfig: {
    minResponses: 1,
    maxResponses: 2,
    feedbackTone: 'balanced',
    includeActionItems: false,
    includeFollowUpQuestions: true,
  },
};
