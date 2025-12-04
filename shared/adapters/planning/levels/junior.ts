/**
 * Junior Level Planning Overlay
 * 
 * Moderate scaffolding, some autonomy, optional knowledge checks.
 * AI provides guidance when asked but expects more independence.
 */

import type { LevelPlanningOverlay } from '../types';

export const juniorLevelOverlay: LevelPlanningOverlay = {
  level: 'junior',
  displayName: 'Junior',
  scaffoldingLevel: 'medium',
  
  promptModifiers: {
    guidanceLevel: `This is a junior developer with some experience.
They understand basic sprint concepts but may need occasional clarification.
Provide context when relevant but don't over-explain fundamentals.
Encourage them to contribute their perspective on estimation.`,
    
    toneAdjustment: `Be collegial and treat them as a developing professional.
Expect reasonable contributions while still being supportive.
Acknowledge good insights and gently correct misunderstandings.`
  },
  
  uiOverrides: {
    showLearningObjectives: true,
    showKnowledgeCheck: false,
    requireDiscussionBeforeNext: true,
    canSkipPhases: false,
    showMeetingTimer: true
  },
  
  difficultyOverrides: {
    ticketComplexity: 'medium',
    ambiguityLevel: 0.4,
    conflictScenarios: false,
    aiPushbackIntensity: 'gentle',
    estimationAccuracy: 'assisted'
  },
  
  evaluationOverrides: {
    passingThreshold: 60,
    requiredInteractions: 3
  }
};
