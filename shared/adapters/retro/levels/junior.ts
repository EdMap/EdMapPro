/**
 * Junior Level Retrospective Overlay
 * 
 * Moderate facilitation, prompted structure, constructive feedback.
 * Building retrospective skills with supportive guidance.
 */

import type { LevelRetroOverlay } from '../types';

export const juniorRetroOverlay: LevelRetroOverlay = {
  level: 'junior',
  displayName: 'Junior',
  scaffoldingLevel: 'medium',
  
  facilitationModifiers: {
    styleOverride: 'prompted',
    promptingFrequency: 'medium',
    showFacilitatorOverride: true,
    autoSuggestOverride: true,
    maxGuidedQuestions: 4,
  },
  
  uiOverrides: {
    showSprintContext: true,
    showProgressBar: true,
    showCategoryLabels: true,
    showVoteCounts: true,
    showCardAuthors: true,
    expandCardsDefault: true,
    animateTransitions: true,
    celebrationAnimation: true,
    cardStyle: 'detailed',
    layoutMode: 'two_column',
  },
  
  actionItemOverrides: {
    requireOwner: true,
    suggestFromTopVoted: true,
    maxActionItems: 4,
    showPreviousActions: true,
  },
  
  evaluationOverrides: {
    passingThreshold: 65,
    showFeedback: true,
  },
  
  starterCardCount: 2,
  
  additionalTips: [
    'Look for patterns across multiple sprints',
    'Connect improvements to specific events',
    'Be constructive - suggest solutions, not just problems',
    'Volunteer to own action items when you can',
    'Follow up on last sprint\'s action items',
  ],
};
