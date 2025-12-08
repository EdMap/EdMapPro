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
      baseDelayMs: 3000,
      perCharacterDelayMs: 30,
      maxDelayMs: 10000
    },
    preMeetingBriefing: {
      enabled: true,
      title: 'Sprint Planning Meeting',
      subtitle: 'Your first sprint planning session with the team',
      agenda: [
        'Review the product backlog and priorities',
        'Discuss scope and effort estimates',
        'Commit to a sprint goal together'
      ],
      attendees: [
        { name: 'Priya', role: 'Product Manager', avatarSeed: 'priya' },
        { name: 'Marcus', role: 'Senior Developer', avatarSeed: 'marcus' },
        { name: 'Alex', role: 'QA Engineer', avatarSeed: 'alex' }
      ],
      contextNote: "This is your first planning session. You'll mostly observe how the team discusses and prioritizes work. Feel free to ask questions!",
      joinButtonText: 'Join Planning Meeting'
    },
    phaseTransitionSequences: [
      {
        phase: 'discussion',
        steps: [
          {
            personaId: 'priya',
            personaName: 'Priya',
            personaRole: 'Product Manager',
            phase: 'discussion',
            message: `Alright team, let's dive into the backlog! Take a look at the items on the right panel.`
          },
          {
            personaId: 'marcus',
            personaName: 'Marcus',
            personaRole: 'Senior Developer',
            phase: 'discussion',
            message: `I see that timezone bug at the top - TICK-001. That's been causing customer complaints. Should probably prioritize that.`
          },
          {
            personaId: 'alex',
            personaName: 'Alex',
            personaRole: 'QA Engineer',
            phase: 'discussion',
            message: `Agreed on the timezone fix. And I'd suggest we look at TICK-004 too - that null check in the payment flow is a risk. Both are quick wins at 2-3 points each.`
          }
        ]
      },
      {
        phase: 'commitment',
        steps: [
          {
            personaId: 'priya',
            personaName: 'Priya',
            personaRole: 'Product Manager',
            phase: 'commitment',
            message: `Great discussion everyone! Now let's finalize our sprint commitment.`
          },
          {
            personaId: 'marcus',
            personaName: 'Marcus',
            personaRole: 'Senior Developer',
            phase: 'commitment',
            message: `We've got the timezone fix and payment null check - both are critical bugs affecting users.`
          },
          {
            personaId: 'priya',
            personaName: 'Priya',
            personaRole: 'Product Manager',
            phase: 'commitment',
            message: `Right. Our sprint goal will be: "Improve payment reliability and fix user-facing timezone issues."

{{userName}}, as a developer you'd typically help estimate and commit to the work, but the PM usually defines the goal. Does this goal make sense given what we've selected? Any questions before we start the sprint?`,
            requiresUserResponse: true
          }
        ]
      }
    ],
    selectionGuidance: {
      mode: 'autoAssign',
      suggestedItemIds: ['TICK-001', 'TICK-004'],
      confirmationPrompt: `Good thinking, team. I've selected TICK-001 and TICK-004 based on what Marcus and Alex recommended - you can see them highlighted in the backlog panel on the right.

{{userName}}, take a moment to review the selected items. Feel free to ask questions about them, or if everything looks good, click Continue to move forward.`,
      visualCueCopy: 'Items selected by team',
      backlogPanelHighlight: true,
      nextStepHint: 'Review selected items, then click Continue when ready'
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
