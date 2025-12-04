/**
 * Senior Level Planning Overlay
 * 
 * Minimal scaffolding, high autonomy, complex scenarios.
 * AI provides realistic pushback and expects leadership.
 */

import type { LevelPlanningOverlay } from '../types';

export const seniorLevelOverlay: LevelPlanningOverlay = {
  level: 'senior',
  displayName: 'Senior',
  scaffoldingLevel: 'none',
  
  promptModifiers: {
    guidanceLevel: `This is a senior professional with extensive experience.
Expect them to lead or contribute substantially to planning.
Present complex scenarios with trade-offs and competing priorities.
Challenge their assumptions and push for clarity on commitments.`,
    
    toneAdjustment: `Be professional and direct. Treat them as a peer.
Push back on unrealistic scope or unclear goals.
Expect leadership in discussions and decision-making.`
  },
  
  uiOverrides: {
    showLearningObjectives: false,
    showKnowledgeCheck: false,
    requireDiscussionBeforeNext: false,
    canSkipPhases: true,
    showMeetingTimer: true
  },
  
  difficultyOverrides: {
    ticketComplexity: 'high',
    ambiguityLevel: 0.7,
    conflictScenarios: true,
    aiPushbackIntensity: 'strong',
    estimationAccuracy: 'independent'
  },
  
  evaluationOverrides: {
    passingThreshold: 75,
    requiredInteractions: 4
  }
};
