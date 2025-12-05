/**
 * Intern Level Execution Overlay
 * 
 * Heavy guidance, step-by-step instructions, supportive feedback.
 * AI team does most of the talking, user shadows and learns.
 */

import type { LevelExecutionOverlay } from '../types';

export const internExecutionOverlay: LevelExecutionOverlay = {
  level: 'intern',
  displayName: 'Intern',
  scaffoldingLevel: 'high',
  
  engagement: {
    mode: 'shadow',
    teamTalkRatio: 0.85,
    standupGuidance: 'scripted',
    gitGuidance: 'step-by-step',
    prReviewGuidance: 'walkthrough',
  },
  
  prReviewComments: [
    {
      type: 'suggestion',
      severity: 'minor',
      message: 'Nice work! Consider adding a comment here to explain the timezone conversion logic for future developers.',
      requiresResponse: false,
    },
    {
      type: 'question',
      severity: 'minor',
      message: 'I see you used Date.toLocaleString() - have you considered what happens if the user hasn\'t set a timezone preference yet?',
      requiresResponse: true,
    },
    {
      type: 'approval',
      severity: 'minor',
      message: 'LGTM! Great first PR. The code is clean and well-structured. Let\'s merge this once you\'ve addressed the minor suggestions above.',
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
    terminalHintsVisibility: 'always',
    allowShortcutButtons: true,
  },
  
  difficultyOverrides: {
    gitCommandStrictness: 'lenient',
    hintDetailLevel: 'full',
    prReviewIntensity: 'gentle',
    interruptionComplexity: 'simple',
    stretchTasksEnabled: false,
    timeBoxedDays: false,
  },
  
  evaluationOverrides: {
    passingThreshold: 60,
    requiredTicketsComplete: 1,
    requiredPRsReviewed: 1,
  },
  
  standupModifiers: {
    showExamples: true,
    provideFeedback: true,
    feedbackTone: 'encouraging',
  },
  
  gitModifiers: {
    showCommandHints: true,
    showNextStepPrompt: true,
    allowButtonShortcuts: true,
  },
};
