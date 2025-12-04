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
    autoStartMessage: `Good morning everyone! Thanks for joining our sprint planning. I see we have a new team member with us today - welcome! 

Don't worry about jumping in right away - feel free to observe how we run these meetings first. I'll check in with you as we go, and please raise your hand anytime if you have questions.

Alright team, let me walk through our priorities for this sprint...`
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
