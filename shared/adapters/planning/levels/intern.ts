/**
 * Intern Level Planning Overlay
 * 
 * Heavy scaffolding, guided experience, knowledge checks required.
 * AI provides maximum guidance and gentle nudges.
 */

import type { LevelPlanningOverlay } from '../types';

export const internLevelOverlay: LevelPlanningOverlay = {
  level: 'intern',
  displayName: 'Intern',
  scaffoldingLevel: 'high',
  
  promptModifiers: {
    guidanceLevel: `This is an intern's first sprint planning experience. 
Provide extra context and explanation. Be patient and encouraging.
Explain terminology that might be new (story points, sprint goal, capacity).
Check for understanding before moving to the next phase.`,
    
    toneAdjustment: `Be warm and welcoming. This might be overwhelming for a new intern.
Celebrate their participation and validate their questions.
Make them feel like a valued team member.`
  },
  
  uiOverrides: {
    showLearningObjectives: true,
    showKnowledgeCheck: true,
    requireDiscussionBeforeNext: true,
    canSkipPhases: false,
    showMeetingTimer: true
  },
  
  difficultyOverrides: {
    ticketComplexity: 'low',
    ambiguityLevel: 0.2,
    conflictScenarios: false,
    aiPushbackIntensity: 'none',
    estimationAccuracy: 'guided'
  },
  
  evaluationOverrides: {
    passingThreshold: 50,
    requiredInteractions: 2
  }
};
