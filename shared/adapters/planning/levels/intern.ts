/**
 * Intern Level Planning Overlay
 * 
 * Shadow/Observer mode - intern primarily observes the team discussion.
 * PM kicks off meeting, team discusses naturally, intern asked for questions at the end.
 * Heavy scaffolding, guided experience, learning by watching experienced team members.
 */

import type { LevelPlanningOverlay } from '../types';

export const internLevelOverlay: LevelPlanningOverlay = {
  level: 'intern',
  displayName: 'Intern',
  scaffoldingLevel: 'high',
  
  promptModifiers: {
    guidanceLevel: `This is an intern's first sprint planning experience. They are primarily OBSERVING.
The team (Priya, Marcus, Alex) should have a natural discussion among themselves.
Explain concepts as the team discusses them naturally. The intern is learning by watching.
Only directly address the intern occasionally to check understanding or invite questions.
Toward the end of each phase, turn to the intern and ask if they have any questions.`,
    
    toneAdjustment: `Be warm and welcoming. Create a safe space for the intern to observe and learn.
When addressing the intern, be encouraging and patient.
Model good team collaboration so the intern sees healthy planning dynamics.
Celebrate when they do ask questions or share observations.`
  },
  
  engagement: {
    mode: 'shadow',
    autoStartConversation: true,
    teamTalkRatio: 0.85,
    phaseEngagement: {
      context: 'observe',
      discussion: 'observe',
      commitment: 'respond'
    },
    promptSuggestions: {
      context: [
        "I have a question about that",
        "Could you explain what that means?",
        "That makes sense, thanks"
      ],
      discussion: [
        "How do you estimate that?",
        "What happens if we can't finish everything?",
        "I'm following along"
      ],
      commitment: [
        "I understand the sprint goal",
        "I have a question before we commit",
        "This is helpful to see how planning works"
      ]
    },
    autoStartMessage: `Good morning everyone! Thanks for joining our sprint planning. Before we dive in, I want to welcome {{userName}} who's joining us as our new {{userRole}}. Great to have you on the team!

Feel free to observe how we run these meetings - I'll check in with you as we go. Let's get started by reviewing what's in our backlog.`,
    autoStartSequence: [
      {
        personaId: 'priya',
        personaName: 'Priya',
        personaRole: 'Product Manager',
        phase: 'context',
        message: `Good morning everyone! Thanks for joining our sprint planning. Before we dive in, I want to welcome {{userName}} who's joining us as our new {{userRole}}. Great to have you on the team!

Feel free to observe how we run these meetings - I'll check in with you as we go. Let's get started by reviewing what's in our backlog.`
      },
      {
        personaId: 'priya',
        personaName: 'Priya',
        personaRole: 'Product Manager',
        phase: 'context',
        message: `Alright, let me walk through everything we have in the backlog right now. Looking at our board, we've got:

- A timezone display bug affecting users in different regions
- The user notifications feature that's been requested
- A null check issue in the payment flow
- A request to add pagination to the user list
- Some technical debt items around test coverage

Based on stakeholder feedback and support tickets, I'd recommend we prioritize the timezone bug first - it's been escalated. The notifications feature is also high priority for user engagement.`
      },
      {
        personaId: 'marcus',
        personaName: 'Marcus',
        personaRole: 'Senior Developer',
        phase: 'context',
        message: `Makes sense on the timezone bug - I've seen similar issues before. Usually comes down to storing everything in UTC and converting on display. Should be a targeted fix.

Quick question on notifications - are we talking push notifications or just in-app? That would significantly change the scope.`
      },
      {
        personaId: 'priya',
        personaName: 'Priya',
        personaRole: 'Product Manager',
        phase: 'context',
        message: `Good question. For now, we're scoping it to in-app notifications only. Push notifications are on the roadmap for next quarter.

Given our velocity, I think we can realistically fit the timezone fix, the notifications feature, and maybe the payment bug. The pagination might need to wait unless we have extra capacity.`
      },
      {
        personaId: 'alex',
        personaName: 'Alex',
        personaRole: 'QA Engineer',
        phase: 'context',
        message: `I'd prioritize the payment bug over pagination if we have room. Failed payments directly impact revenue, and I was working in that area last sprint so the context is fresh.

The pagination can wait - it's more of a performance nice-to-have at this point.`
      },
      {
        personaId: 'priya',
        personaName: 'Priya',
        personaRole: 'Product Manager',
        phase: 'context',
        message: `Good point, Alex. Let's tentatively plan for timezone, notifications, and payment bug as our core scope.

{{userName}}, you've been listening to how we prioritize - any questions so far about the backlog or how we're deciding what to work on?`,
        requiresUserResponse: true
      }
    ],
    messageStagger: {
      enabled: true,
      baseDelayMs: 800,
      perCharacterDelayMs: 8,
      maxDelayMs: 3000
    }
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
