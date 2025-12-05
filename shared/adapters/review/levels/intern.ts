/**
 * Intern Level Sprint Review Overlay
 * 
 * Heavy guidance, step-by-step demo script, encouraging feedback.
 * Focus on building confidence in presenting work to stakeholders.
 */

import type { LevelReviewOverlay } from '../types';

export const internReviewOverlay: LevelReviewOverlay = {
  level: 'intern',
  displayName: 'Intern',
  scaffoldingLevel: 'high',
  
  demoModifiers: {
    formatOverride: 'guided',
    showScriptOverride: true,
    showTimerOverride: false,
    allowSkipOverride: false,
    additionalHints: true,
    timeMultiplier: 1.5,
  },
  
  feedbackModifiers: {
    feedbackCountMultiplier: 0.5,
    sentimentDistributionOverride: {
      positive: 0.7,
      neutral: 0.15,
      suggestion: 0.15,
      concern: 0.0,
    },
    feedbackTone: 'encouraging',
    showExampleResponses: true,
    autoAcknowledgePositive: true,
  },
  
  uiOverrides: {
    showProgressBar: true,
    showTicketDetails: true,
    showPointsSummary: true,
    showSprintGoal: true,
    expandFeedbackByDefault: true,
    animateTransitions: true,
    cardStyle: 'detailed',
  },
  
  evaluationOverrides: {
    passingThreshold: 60,
    feedbackOnPerformance: true,
  },
  
  additionalTips: [
    'Take your time - it\'s okay to refer to your notes',
    'Focus on explaining what you did, not just showing it',
    'Don\'t worry about being perfect - this is practice!',
    'Ask questions if feedback is unclear',
    'Celebrate your wins, even the small ones',
  ],
};
