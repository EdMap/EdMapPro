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
    autoAdvancePhases: true,
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

{{backlogSummary}}

Based on stakeholder feedback and support tickets, I'd recommend we start with the high-priority items. {{bugsSummary}} should be addressed first since they're impacting users directly.`
      },
      {
        personaId: 'marcus',
        personaName: 'Marcus',
        personaRole: 'Senior Developer',
        phase: 'context',
        message: `That makes sense. Looking at the bugs, those are good candidates for quick wins. The features like {{featuresSummary}} will need more discussion on scope.

Let me think about the technical approach - do we have any blockers or dependencies I should know about?`
      },
      {
        personaId: 'priya',
        personaName: 'Priya',
        personaRole: 'Product Manager',
        phase: 'context',
        message: `Good question. No major blockers right now. Given our velocity, I think we can realistically fit the high-priority bugs and at least one feature work item.

We should prioritize based on user impact and effort.`
      },
      {
        personaId: 'alex',
        personaName: 'Alex',
        personaRole: 'QA Engineer',
        phase: 'context',
        message: `I agree with that approach. I'll start writing test cases for the bugs while development is in progress. That way we can validate fixes quickly.

The lower priority items can wait for the next sprint if needed.`
      },
      {
        personaId: 'priya',
        personaName: 'Priya',
        personaRole: 'Product Manager',
        phase: 'context',
        message: `Great input, team. Let's keep that prioritization in mind as we move forward.

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
            message: `Alright team, let's dive into the backlog! Take a look at the items on the right panel and let's discuss what makes sense for this sprint.`
          },
          {
            personaId: 'marcus',
            personaName: 'Marcus',
            personaRole: 'Senior Developer',
            phase: 'discussion',
            message: `Looking at the top items, I think the bugs should take priority - they're impacting users directly. The features can follow once we've stabilized things.`
          },
          {
            personaId: 'alex',
            personaName: 'Alex',
            personaRole: 'QA Engineer',
            phase: 'discussion',
            message: `Agreed. Let's select the high-priority items first. They look like reasonable scope and I can start writing test cases while development is in progress.`
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
            message: `Great discussion everyone! Now let's finalize our sprint commitment based on what we've selected.`
          },
          {
            personaId: 'marcus',
            personaName: 'Marcus',
            personaRole: 'Senior Developer',
            phase: 'commitment',
            message: `Looking at the selected items, this feels like a solid scope for the sprint. We should be able to deliver quality work without overcommitting.`
          },
          {
            personaId: 'priya',
            personaName: 'Priya',
            personaRole: 'Product Manager',
            phase: 'commitment',
            message: `Agreed. I'll formulate our sprint goal based on the items we've committed to.

{{userName}}, does everything look good? Any questions before we kick off the sprint?`,
            requiresUserResponse: true
          }
        ]
      }
    ],
    selectionGuidance: {
      mode: 'prompted',
      confirmationPrompt: `Great discussion team! Now let's select the items we want to commit to for this sprint.

{{userName}}, take a look at the backlog panel on the right and select the items the team discussed. Click on items to add them to the sprint, then click Continue when ready.`,
      visualCueCopy: 'Select items for sprint',
      backlogPanelHighlight: true,
      nextStepHint: 'Select backlog items, then click Continue when ready'
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
