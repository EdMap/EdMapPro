/**
 * Mid Level Retrospective Overlay
 * 
 * Light facilitation, collaborative approach, direct feedback.
 * Focus on driving improvements and facilitating discussion.
 */

import type { LevelRetroOverlay } from '../types';

export const midRetroOverlay: LevelRetroOverlay = {
  level: 'mid',
  displayName: 'Mid-Level',
  scaffoldingLevel: 'low',
  
  facilitationModifiers: {
    styleOverride: 'collaborative',
    promptingFrequency: 'low',
    showFacilitatorOverride: true,
    autoSuggestOverride: false,
    maxGuidedQuestions: 2,
  },
  
  uiOverrides: {
    showSprintContext: true,
    showProgressBar: true,
    showCategoryLabels: true,
    showVoteCounts: true,
    showCardAuthors: true,
    expandCardsDefault: false,
    animateTransitions: true,
    celebrationAnimation: true,
    cardStyle: 'compact',
    layoutMode: 'two_column',
  },
  
  actionItemOverrides: {
    requireOwner: true,
    suggestFromTopVoted: false,
    maxActionItems: 5,
    showPreviousActions: true,
  },
  
  evaluationOverrides: {
    passingThreshold: 70,
    showFeedback: true,
  },
  
  starterCardCount: 1,
  
  additionalTips: [
    'Help facilitate discussion on others\' cards',
    'Look for systemic issues, not just symptoms',
    'Propose experiments, not just fixes',
    'Champion action items through to completion',
    'Mentor juniors in constructive feedback',
  ],
};
