/**
 * Intern Level Standup Overlay
 * 
 * High scaffolding with detailed examples and encouraging feedback.
 * Sarah facilitates and provides extra guidance.
 */

import type { LevelStandupOverlay } from '../types';

export const internStandupOverlay: LevelStandupOverlay = {
  level: 'intern',
  displayName: 'Intern',
  scaffoldingLevel: 'high',
  
  questions: [
    {
      id: 'yesterday',
      label: 'What did you work on yesterday?',
      placeholder: "Example: Yesterday I reviewed the TICKET-101 requirements and set up my feature branch. I also looked at the existing codebase to understand the patterns being used.",
      helpText: "Share what you accomplished, even small wins count! It's okay to mention learning activities.",
      required: true,
      minLength: 20,
    },
    {
      id: 'today',
      label: 'What are you planning to work on today?',
      placeholder: "Example: Today I plan to implement the main logic for TICKET-101 and write initial unit tests. If I have time, I'll start on the UI components.",
      helpText: "Be specific about your goals. It's okay if plans change - this helps the team know how to support you.",
      required: true,
      minLength: 20,
    },
    {
      id: 'blockers',
      label: 'Any blockers or questions?',
      placeholder: "Example: I'm not sure how to properly test the date formatting function. Could use guidance on the testing patterns we use.",
      helpText: "Don't hesitate to ask for help! Blockers can be technical issues, unclear requirements, or needing guidance.",
      required: false,
    },
  ],
  
  promptModifiers: {
    guidanceLevel: `This is an intern sharing their standup update. Be warm, encouraging, and supportive.
Acknowledge their progress enthusiastically - they're learning! 
If they mention blockers, offer concrete help and reassurance.
Use this as a teaching moment to model good standup practices.`,
    
    toneAdjustment: `Use encouraging language. Celebrate small wins.
If they seem stuck, proactively offer guidance without making them feel bad.
Model how to ask good questions and communicate progress clearly.`,
  },
  
  uiConfig: {
    showExamples: true,
    showProgressIndicator: true,
    showTeamContext: true,
    enableVoiceInput: false,
  },
  
  feedbackConfig: {
    minResponses: 2,
    maxResponses: 3,
    feedbackTone: 'encouraging',
    includeActionItems: true,
    includeFollowUpQuestions: false,
  },
};
