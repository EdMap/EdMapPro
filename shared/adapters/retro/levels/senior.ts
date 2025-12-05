/**
 * Senior Level Retrospective Overlay
 * 
 * Self-directed, peer facilitation, challenging discussions.
 * Focus on strategic improvements and team leadership.
 */

import type { LevelRetroOverlay } from '../types';

export const seniorRetroOverlay: LevelRetroOverlay = {
  level: 'senior',
  displayName: 'Senior',
  scaffoldingLevel: 'none',
  
  facilitationModifiers: {
    styleOverride: 'self_directed',
    promptingFrequency: 'none',
    showFacilitatorOverride: false,
    autoSuggestOverride: false,
    maxGuidedQuestions: 0,
  },
  
  uiOverrides: {
    showSprintContext: true,
    showProgressBar: false,
    showCategoryLabels: true,
    showVoteCounts: true,
    showCardAuthors: true,
    expandCardsDefault: false,
    animateTransitions: false,
    celebrationAnimation: false,
    cardStyle: 'compact',
    layoutMode: 'three_column',
  },
  
  actionItemOverrides: {
    requireOwner: true,
    suggestFromTopVoted: false,
    maxActionItems: 7,
    showPreviousActions: true,
  },
  
  evaluationOverrides: {
    passingThreshold: 80,
    showFeedback: true,
  },
  
  starterCardCount: 0,
  
  additionalTips: [
    'Facilitate the retro for others when appropriate',
    'Connect team improvements to org-level goals',
    'Address difficult topics constructively',
    'Model vulnerability by sharing your own learnings',
    'Drive accountability on action items',
  ],
};
