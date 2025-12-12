/**
 * Junior Level Soft Skill Overlay
 * 
 * Medium scaffolding with visible suggestions,
 * constructive feedback tone, and moderate evaluation.
 */

import type { LevelSoftSkillOverlay } from '../types';

export const juniorSoftSkillOverlay: LevelSoftSkillOverlay = {
  level: 'junior',
  displayName: 'Junior',
  scaffoldingLevel: 'medium',
  
  suggestionModifiers: {
    visibility: 'always',
    showRecommendedLabel: true,
  },
  
  evaluationModifiers: {
    strictness: 'moderate',
    llmThresholdAdjustment: 0,
  },
  
  feedbackModifiers: {
    tone: 'constructive',
    maxFeedbackLength: 'moderate',
    showScore: false,
  },
  
  uiOverrides: {
    showScenarioContext: true,
    showCompetencyTags: true,
    showTimerHint: false,
    inputPlaceholder: 'Type your response...',
  },
};
