/**
 * Senior Level Standup Overlay
 * 
 * Minimal scaffolding with direct prompts.
 * Peer-level or mentoring interaction.
 */

import type { LevelStandupOverlay } from '../types';

export const seniorStandupOverlay: LevelStandupOverlay = {
  level: 'senior',
  displayName: 'Senior',
  scaffoldingLevel: 'none',
  
  questions: [
    {
      id: 'yesterday',
      label: 'Yesterday',
      placeholder: "Progress update",
      required: true,
      minLength: 5,
    },
    {
      id: 'today',
      label: 'Today',
      placeholder: "Focus areas",
      required: true,
      minLength: 5,
    },
    {
      id: 'blockers',
      label: 'Blockers / Dependencies',
      placeholder: "Cross-team dependencies or escalations needed",
      required: false,
    },
  ],
  
  promptModifiers: {
    guidanceLevel: `This is a senior professional. Be concise and strategic.
Focus on cross-team coordination and unblocking others.
Expect them to identify risks and propose solutions.`,
    
    toneAdjustment: `Be direct and efficient.
Focus on strategic alignment and team coordination.
May ask for their input on others' blockers.`,
  },
  
  uiConfig: {
    showExamples: false,
    showProgressIndicator: false,
    showTeamContext: false,
    enableVoiceInput: true,
  },
  
  feedbackConfig: {
    minResponses: 1,
    maxResponses: 1,
    feedbackTone: 'direct',
    includeActionItems: false,
    includeFollowUpQuestions: false,
  },
};
