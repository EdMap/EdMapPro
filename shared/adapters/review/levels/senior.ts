/**
 * Senior Level Sprint Review Overlay
 * 
 * Minimal guidance, freeform presentation, peer-level critique.
 * Focus on strategic communication and executive presence.
 */

import type { LevelReviewOverlay } from '../types';

export const seniorReviewOverlay: LevelReviewOverlay = {
  level: 'senior',
  displayName: 'Senior',
  scaffoldingLevel: 'none',
  
  demoModifiers: {
    formatOverride: 'freeform',
    showScriptOverride: false,
    showTimerOverride: true,
    allowSkipOverride: true,
    additionalHints: false,
    timeMultiplier: 0.8,
  },
  
  feedbackModifiers: {
    feedbackCountMultiplier: 1.25,
    sentimentDistributionOverride: {
      positive: 0.25,
      neutral: 0.25,
      suggestion: 0.35,
      concern: 0.15,
    },
    feedbackTone: 'challenging',
    showExampleResponses: false,
    autoAcknowledgePositive: false,
  },
  
  uiOverrides: {
    showProgressBar: false,
    showTicketDetails: false,
    showPointsSummary: false,
    showSprintGoal: true,
    expandFeedbackByDefault: false,
    animateTransitions: false,
    cardStyle: 'compact',
  },
  
  evaluationOverrides: {
    passingThreshold: 80,
    feedbackOnPerformance: true,
  },
  
  additionalTips: [
    'Lead the room - set the agenda and pace',
    'Frame work in terms of strategic impact',
    'Anticipate and address objections proactively',
    'Facilitate discussion among stakeholders',
    'Drive to decisions and action items',
  ],
};
