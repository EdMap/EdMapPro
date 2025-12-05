/**
 * Junior Level Sprint Review Overlay
 * 
 * Moderate guidance, prompted structure, constructive feedback.
 * Focus on developing presentation skills with supportive feedback.
 */

import type { LevelReviewOverlay } from '../types';

export const juniorReviewOverlay: LevelReviewOverlay = {
  level: 'junior',
  displayName: 'Junior',
  scaffoldingLevel: 'medium',
  
  demoModifiers: {
    formatOverride: 'prompted',
    showScriptOverride: true,
    showTimerOverride: false,
    allowSkipOverride: false,
    additionalHints: true,
    timeMultiplier: 1.25,
  },
  
  feedbackModifiers: {
    feedbackCountMultiplier: 0.75,
    sentimentDistributionOverride: {
      positive: 0.5,
      neutral: 0.2,
      suggestion: 0.25,
      concern: 0.05,
    },
    feedbackTone: 'constructive',
    showExampleResponses: true,
    autoAcknowledgePositive: false,
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
    passingThreshold: 65,
    feedbackOnPerformance: true,
  },
  
  additionalTips: [
    'Structure your demo: problem, solution, result',
    'Anticipate questions stakeholders might ask',
    'Connect your work to the sprint goal',
    'Be prepared to discuss trade-offs you made',
    'Thank stakeholders for specific feedback',
  ],
};
