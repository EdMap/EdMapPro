/**
 * Mid-Level Planning Overlay
 * 
 * Active contributor mode - expected to drive estimation and challenge trade-offs.
 * PM sets context briefly, then mid-level leads technical discussion.
 * Low scaffolding, peer-level interaction with some pushback.
 */

import type { LevelPlanningOverlay } from '../types';

export const midLevelOverlay: LevelPlanningOverlay = {
  level: 'mid',
  displayName: 'Mid-Level',
  scaffoldingLevel: 'low',
  
  promptModifiers: {
    guidanceLevel: `This is a mid-level professional who should DRIVE the technical discussion.
Priya sets context, then expects the mid-level to lead estimation and raise concerns.
Other team members (Marcus, Alex) respond to the mid-level's input.
Challenge their assumptions when appropriate - they should defend their estimates.`,
    
    toneAdjustment: `Be professional and peer-level. Keep explanations concise.
Push back when estimates seem off or scope unclear.
Expect them to proactively identify risks and dependencies.
Treat disagreements as collaborative problem-solving.`
  },
  
  engagement: {
    mode: 'active',
    autoStartConversation: true,
    teamTalkRatio: 0.45,
    phaseEngagement: {
      context: 'respond',
      discussion: 'lead',
      commitment: 'lead'
    },
    autoStartMessage: `Hey team, let's get into planning. I'll quickly share what's on the priority list from stakeholders, but I want us to dig into the details together.

Here's what we're looking at...`
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
