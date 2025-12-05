/**
 * Junior Level Execution Overlay
 * 
 * Moderate guidance, prompts when stuck, constructive feedback.
 * User participates more actively with team support.
 */

import type { LevelExecutionOverlay } from '../types';

export const juniorExecutionOverlay: LevelExecutionOverlay = {
  level: 'junior',
  displayName: 'Junior',
  scaffoldingLevel: 'medium',
  
  engagement: {
    mode: 'guided',
    teamTalkRatio: 0.70,
    standupGuidance: 'prompted',
    gitGuidance: 'milestone',
    prReviewGuidance: 'hints',
  },
  
  prReviewComments: [
    {
      type: 'suggestion',
      severity: 'minor',
      message: 'Consider extracting this timezone logic into a utility function for reusability.',
      requiresResponse: false,
    },
    {
      type: 'request_changes',
      severity: 'major',
      message: 'This implementation doesn\'t handle the edge case where timezone is undefined. Please add a fallback to UTC.',
      requiresResponse: true,
    },
    {
      type: 'question',
      severity: 'minor',
      message: 'What happens if the date string is malformed? Should we add input validation?',
      requiresResponse: true,
    },
    {
      type: 'approval',
      severity: 'minor',
      message: 'Good improvements! Once you address the undefined timezone case, this is ready to merge.',
      requiresResponse: false,
    },
  ],
  
  uiOverrides: {
    showGitTerminal: true,
    showTeamChat: true,
    showAcceptanceCriteria: true,
    showWorkflowProgress: true,
    showBurndownChart: true,
    showCompetencyBadges: true,
    showMentorHints: true,
    terminalHintsVisibility: 'on-error',
    allowShortcutButtons: true,
  },
  
  difficultyOverrides: {
    gitCommandStrictness: 'moderate',
    hintDetailLevel: 'partial',
    prReviewIntensity: 'moderate',
    interruptionComplexity: 'simple',
    stretchTasksEnabled: false,
    timeBoxedDays: true,
  },
  
  evaluationOverrides: {
    passingThreshold: 65,
    requiredTicketsComplete: 2,
    requiredPRsReviewed: 2,
  },
  
  standupModifiers: {
    showExamples: true,
    provideFeedback: true,
    feedbackTone: 'constructive',
  },
  
  gitModifiers: {
    showCommandHints: true,
    showNextStepPrompt: true,
    allowButtonShortcuts: true,
  },
  
  codeWorkModifiers: {
    modeOverride: 'guided-diff',
    showDiffView: true,
    showRunTests: true,
    autoCompleteSteps: false,
    mentorGuidance: 'moderate',
  },
};
