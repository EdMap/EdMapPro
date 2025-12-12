/**
 * Intern Level Soft Skill Overlay
 * 
 * High scaffolding with always-visible suggestions,
 * encouraging feedback tone, and lenient evaluation.
 */

import type { LevelSoftSkillOverlay } from '../types';

export const internSoftSkillOverlay: LevelSoftSkillOverlay = {
  level: 'intern',
  displayName: 'Intern',
  scaffoldingLevel: 'high',
  
  suggestionModifiers: {
    visibility: 'always',
    showRecommendedLabel: true,
  },
  
  evaluationModifiers: {
    strictness: 'lenient',
    llmThresholdAdjustment: -0.1,
  },
  
  feedbackModifiers: {
    tone: 'encouraging',
    maxFeedbackLength: 'detailed',
    showScore: false,
  },
  
  uiOverrides: {
    showScenarioContext: true,
    showCompetencyTags: true,
    showTimerHint: false,
    inputPlaceholder: 'Type your response here, or click a suggestion above to get started...',
  },
};
