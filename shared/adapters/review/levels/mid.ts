/**
 * Mid Level Sprint Review Overlay
 * 
 * Light guidance, self-directed demos, direct feedback.
 * Focus on professional presentation and stakeholder engagement.
 */

import type { LevelReviewOverlay } from '../types';

export const midReviewOverlay: LevelReviewOverlay = {
  level: 'mid',
  displayName: 'Mid-Level',
  scaffoldingLevel: 'low',
  
  demoModifiers: {
    formatOverride: 'prompted',
    showScriptOverride: false,
    showTimerOverride: true,
    allowSkipOverride: true,
    additionalHints: false,
    timeMultiplier: 1.0,
  },
  
  feedbackModifiers: {
    feedbackCountMultiplier: 1.0,
    sentimentDistributionOverride: {
      positive: 0.4,
      neutral: 0.2,
      suggestion: 0.3,
      concern: 0.1,
    },
    feedbackTone: 'direct',
    showExampleResponses: false,
    autoAcknowledgePositive: false,
  },
  
  uiOverrides: {
    showProgressBar: true,
    showTicketDetails: true,
    showPointsSummary: true,
    showSprintGoal: true,
    expandFeedbackByDefault: false,
    animateTransitions: true,
    cardStyle: 'compact',
  },
  
  evaluationOverrides: {
    passingThreshold: 70,
    feedbackOnPerformance: true,
  },
  
  additionalTips: [
    'Drive the conversation - you own your demo',
    'Proactively address potential concerns',
    'Link technical decisions to business outcomes',
    'Engage stakeholders with questions',
    'Summarize key takeaways at the end',
  ],
};
