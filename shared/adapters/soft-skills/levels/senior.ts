/**
 * Senior Level Soft Skill Overlay
 * 
 * No scaffolding with hidden suggestions (expandable if needed),
 * peer-level feedback tone, and strict evaluation.
 */

import type { LevelSoftSkillOverlay } from '../types';

export const seniorSoftSkillOverlay: LevelSoftSkillOverlay = {
  level: 'senior',
  displayName: 'Senior',
  scaffoldingLevel: 'none',
  
  suggestionModifiers: {
    visibility: 'hidden',
    showRecommendedLabel: false,
  },
  
  evaluationModifiers: {
    strictness: 'strict',
    llmThresholdAdjustment: 0.1,
  },
  
  feedbackModifiers: {
    tone: 'peer',
    maxFeedbackLength: 'brief',
    showScore: true,
  },
  
  uiOverrides: {
    showScenarioContext: false,
    showCompetencyTags: false,
    showTimerHint: false,
    inputPlaceholder: 'Type your response...',
  },
};
