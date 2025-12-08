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
    autoStartMessage: `Morning team! Let's dive into our sprint planning. Good to have you here, {{userName}}.

We've got some interesting work lined up. Let me walk through the backlog and then get everyone's thoughts on priorities.`,
    autoStartSequence: [
      {
        personaId: 'priya',
        personaName: 'Priya',
        personaRole: 'Product Manager',
        phase: 'context',
        message: `Morning team! Let's dive into our sprint planning. Good to have you here, {{userName}}.

Looking at our backlog, we've got a timezone display bug that's been escalated, the user notifications feature product has been waiting for, a null check issue in payments, and a pagination request. I'm thinking timezone and notifications should be our focus this sprint.`
      },
      {
        personaId: 'marcus',
        personaName: 'Marcus',
        personaRole: 'Senior Developer',
        phase: 'context',
        message: `Makes sense. The timezone bug should be straightforward - probably a UTC conversion issue. Notifications is the bigger piece but we've done similar work before.`
      },
      {
        personaId: 'priya',
        personaName: 'Priya',
        personaRole: 'Product Manager',
        phase: 'context',
        message: `{{userName}}, before we dive into estimates, I'd love to hear your initial thoughts. Any questions about the priorities or concerns that stand out to you?`,
        requiresUserResponse: true
      }
    ],
    messageStagger: {
      enabled: true,
      baseDelayMs: 1200,
      perCharacterDelayMs: 12,
      maxDelayMs: 4000
    },
    preMeetingBriefing: {
      enabled: true,
      title: 'Sprint Planning Meeting',
      subtitle: 'Collaborate with the team on sprint scope',
      agenda: [
        'Review backlog priorities with Priya',
        'Discuss estimates and raise concerns',
        'Help define the sprint commitment'
      ],
      attendees: [
        { name: 'Priya', role: 'Product Manager', avatarSeed: 'priya' },
        { name: 'Marcus', role: 'Senior Developer', avatarSeed: 'marcus' },
        { name: 'Alex', role: 'QA Engineer', avatarSeed: 'alex' }
      ],
      contextNote: "You'll be asked to share your thoughts on priorities and estimates. Don't worry about having perfect answers - this is a learning experience!",
      joinButtonText: 'Join Planning'
    }
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
