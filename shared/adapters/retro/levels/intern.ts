/**
 * Intern Level Retrospective Overlay
 * 
 * Heavy facilitation, guided questions, encouraging tone.
 * Focus on learning the retrospective process and building confidence.
 */

import type { LevelRetroOverlay } from '../types';

export const internRetroOverlay: LevelRetroOverlay = {
  level: 'intern',
  displayName: 'Intern',
  scaffoldingLevel: 'high',
  
  facilitationModifiers: {
    styleOverride: 'guided',
    promptingFrequency: 'high',
    showFacilitatorOverride: true,
    autoSuggestOverride: true,
    maxGuidedQuestions: 5,
  },
  
  uiOverrides: {
    showSprintContext: true,
    showProgressBar: true,
    showCategoryLabels: true,
    showVoteCounts: true,
    showCardAuthors: false,
    expandCardsDefault: true,
    animateTransitions: true,
    celebrationAnimation: true,
    cardStyle: 'detailed',
    layoutMode: 'two_column',
  },
  
  actionItemOverrides: {
    requireOwner: false,
    suggestFromTopVoted: true,
    maxActionItems: 3,
    showPreviousActions: false,
  },
  
  evaluationOverrides: {
    passingThreshold: 60,
    showFeedback: true,
  },
  
  starterCardCount: 3,
  
  additionalTips: [
    'There are no wrong answers - share what you genuinely feel',
    'It\'s okay to add cards about small things, not just big issues',
    'Focus on facts and feelings, not blame',
    'Action items don\'t have to be huge - small improvements count!',
    'Celebrate your wins, even the small ones',
  ],
};
