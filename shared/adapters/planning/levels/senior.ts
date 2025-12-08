/**
 * Senior Level Planning Overlay
 * 
 * Facilitator mode - senior can take over parts of the meeting.
 * PM may hand off facilitation, strategic questioning expected.
 * Complex scenarios with competing priorities and strong pushback.
 */

import type { LevelPlanningOverlay } from '../types';

export const seniorLevelOverlay: LevelPlanningOverlay = {
  level: 'senior',
  displayName: 'Senior',
  scaffoldingLevel: 'none',
  
  promptModifiers: {
    guidanceLevel: `This is a senior professional who should FACILITATE the discussion.
Priya may hand off parts of the meeting to them. They should challenge assumptions.
Present complex scenarios with trade-offs and competing priorities.
Team members look to them for technical guidance and decision-making.`,
    
    toneAdjustment: `Be direct and strategic. Treat them as a peer leader.
Challenge their thinking with "What assumptions are we making here?"
Expect them to push back on unrealistic scope and unclear goals.
They should mentor the team through the planning process.`
  },
  
  engagement: {
    mode: 'facilitator',
    autoStartConversation: true,
    teamTalkRatio: 0.30,
    phaseEngagement: {
      context: 'lead',
      discussion: 'lead',
      commitment: 'lead'
    },
    autoStartMessage: `Alright, let's kick off planning. I've got the priority list from stakeholders - we need to make some tough calls this sprint.

Before I go through the items, any context from last sprint we should factor in?`,
    messageStagger: {
      enabled: true,
      baseDelayMs: 1600,
      perCharacterDelayMs: 16,
      maxDelayMs: 6000
    },
    preMeetingBriefing: {
      enabled: false,
      title: 'Sprint Planning',
      subtitle: 'Facilitate the planning session',
      agenda: [],
      attendees: [],
      joinButtonText: 'Begin'
    }
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
