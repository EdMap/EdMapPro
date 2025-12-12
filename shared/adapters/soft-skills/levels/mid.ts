/**
 * Mid Level Soft Skill Overlay
 * 
 * Low scaffolding with collapsed suggestions,
 * direct feedback tone, and moderate-strict evaluation.
 */

import type { LevelSoftSkillOverlay } from '../types';

export const midSoftSkillOverlay: LevelSoftSkillOverlay = {
  level: 'mid',
  displayName: 'Mid-Level',
  scaffoldingLevel: 'low',
  
  suggestionModifiers: {
    visibility: 'collapsed',
    showRecommendedLabel: false,
  },
  
  evaluationModifiers: {
    strictness: 'moderate',
    llmThresholdAdjustment: 0.05,
  },
  
  feedbackModifiers: {
    tone: 'direct',
    maxFeedbackLength: 'moderate',
    showScore: false,
  },
  
  uiOverrides: {
    showScenarioContext: true,
    showCompetencyTags: false,
    showTimerHint: false,
    inputPlaceholder: 'Type your response...',
  },
};
