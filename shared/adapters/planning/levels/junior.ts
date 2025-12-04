/**
 * Junior Level Planning Overlay
 * 
 * Guided participation mode - junior prompted to contribute at specific points.
 * PM kicks off, team discusses, but junior is directly asked for input.
 * Moderate scaffolding with coaching nudges and suggested talking points.
 */

import type { LevelPlanningOverlay } from '../types';

export const juniorLevelOverlay: LevelPlanningOverlay = {
  level: 'junior',
  displayName: 'Junior',
  scaffoldingLevel: 'medium',
  
  promptModifiers: {
    guidanceLevel: `This is a junior developer who should be ACTIVELY PARTICIPATING.
After discussing key points with the team, directly ask the junior for their input.
Prompt them with specific questions: "What do you think about this estimate?" or "Any concerns from your perspective?"
Guide their contributions but expect them to engage with the discussion.`,
    
    toneAdjustment: `Be collegial and treat them as a developing professional.
When they contribute, build on their ideas and acknowledge good insights.
Gently correct misunderstandings as teaching moments.
Create opportunities for them to practice contributing in a safe environment.`
  },
  
  engagement: {
    mode: 'guided',
    autoStartConversation: true,
    teamTalkRatio: 0.65,
    phaseEngagement: {
      context: 'respond',
      discussion: 'respond',
      commitment: 'respond'
    },
    promptSuggestions: {
      context: [
        "I think I understand - this is about...",
        "Quick question about the priority",
        "How does this connect to what we did last sprint?"
      ],
      discussion: [
        "I think that might take longer because...",
        "Could we break that into smaller pieces?",
        "What about testing time?"
      ],
      commitment: [
        "I feel good about this scope",
        "I'm a bit concerned about...",
        "Can I take ownership of one of these?"
      ]
    },
    autoStartMessage: `Morning team! Let's dive into our sprint planning. 

We've got some interesting work lined up, and I'm excited to hear everyone's thoughts - especially as we think through estimates and priorities together.

Let me share what's on our plate for this sprint...`
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
