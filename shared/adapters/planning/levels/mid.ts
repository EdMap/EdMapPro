/**
 * Mid-Level Planning Overlay
 * 
 * Low scaffolding, moderate complexity, some pushback scenarios.
 * AI expects confident participation and technical leadership.
 */

import type { LevelPlanningOverlay } from '../types';

export const midLevelOverlay: LevelPlanningOverlay = {
  level: 'mid',
  displayName: 'Mid-Level',
  scaffoldingLevel: 'low',
  
  promptModifiers: {
    guidanceLevel: `This is a mid-level professional with solid experience.
Expect them to participate confidently and contribute to discussions.
Present moderately complex scenarios with some ambiguity.
Encourage them to mentor others and share their expertise.`,
    
    toneAdjustment: `Be professional and collaborative.
Expect substantive contributions and clear communication.
Provide gentle pushback on assumptions when appropriate.`
  },
  
  uiOverrides: {
    showLearningObjectives: false,
    showKnowledgeCheck: false,
    requireDiscussionBeforeNext: false,
    canSkipPhases: true,
    showMeetingTimer: true
  },
  
  difficultyOverrides: {
    ticketComplexity: 'medium',
    ambiguityLevel: 0.5,
    conflictScenarios: true,
    aiPushbackIntensity: 'moderate',
    estimationAccuracy: 'independent'
  },
  
  evaluationOverrides: {
    passingThreshold: 70,
    requiredInteractions: 3
  }
};
