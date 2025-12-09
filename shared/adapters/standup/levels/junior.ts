/**
 * Junior Level Standup Overlay
 * 
 * Moderate scaffolding with helpful prompts.
 * More peer-level interaction with occasional guidance.
 */

import type { LevelStandupOverlay } from '../types';

export const juniorStandupOverlay: LevelStandupOverlay = {
  level: 'junior',
  displayName: 'Junior',
  scaffoldingLevel: 'medium',
  
  questions: [
    {
      id: 'yesterday',
      label: 'What did you accomplish yesterday?',
      placeholder: "Describe the progress you made on your tickets and any completed work.",
      helpText: "Include ticket IDs when possible to keep context clear for the team.",
      required: true,
      minLength: 15,
    },
    {
      id: 'today',
      label: "What's your plan for today?",
      placeholder: "What tickets or tasks will you focus on?",
      helpText: "Prioritize your most important work first.",
      required: true,
      minLength: 15,
    },
    {
      id: 'blockers',
      label: 'Any impediments?',
      placeholder: "Anything blocking your progress or where you need help?",
      required: false,
    },
  ],
  
  promptModifiers: {
    guidanceLevel: `This is a junior developer sharing their standup. Be supportive but treat them as a growing professional.
Acknowledge their progress and build on their ideas.
If blockers are mentioned, help them think through solutions rather than just providing answers.`,
    
    toneAdjustment: `Be collegial and encouraging. 
Gently suggest improvements to their approach when relevant.
Model good standup communication patterns.`,
  },
  
  uiConfig: {
    showExamples: false,
    showProgressIndicator: true,
    showTeamContext: true,
    enableVoiceInput: false,
  },
  
  feedbackConfig: {
    minResponses: 1,
    maxResponses: 2,
    feedbackTone: 'balanced',
    includeActionItems: true,
    includeFollowUpQuestions: true,
  },
};
