/**
 * Mid Level Execution Overlay
 * 
 * Light guidance, expects independence, direct feedback.
 * User drives work with occasional team input.
 */

import type { LevelExecutionOverlay } from '../types';

export const midExecutionOverlay: LevelExecutionOverlay = {
  level: 'mid',
  displayName: 'Mid-Level',
  scaffoldingLevel: 'low',
  
  engagement: {
    mode: 'active',
    teamTalkRatio: 0.50,
    standupGuidance: 'freeform',
    gitGuidance: 'milestone',
    prReviewGuidance: 'independent',
  },
  
  prReviewComments: [
    {
      type: 'request_changes',
      severity: 'major',
      message: 'The timezone conversion logic duplicates what we have in dateUtils. Please refactor to use the shared utility.',
      requiresResponse: true,
    },
    {
      type: 'question',
      severity: 'minor',
      message: 'Have you verified this works with DST transitions? We had a bug last year with the hour shift.',
      requiresResponse: true,
    },
    {
      type: 'suggestion',
      severity: 'minor',
      message: 'Nit: Consider using Intl.DateTimeFormat for better browser compatibility.',
      requiresResponse: false,
    },
    {
      type: 'request_changes',
      severity: 'blocking',
      message: 'This PR is missing unit tests. Please add test coverage for the new timezone logic.',
      requiresResponse: true,
    },
  ],
  
  prReviewModifiers: {
    commentCountMultiplier: 1.0,
    severityDistribution: {
      minor: 0.3,
      major: 0.5,
      blocking: 0.2,
    },
    feedbackTone: 'direct',
    showExampleResponses: false,
    autoResolveMinorOnResponse: false,
    minorResponseBehavior: 'manual',
    requireExplicitApprovalRequest: true,
    uiOverrides: {
      layoutMode: 'split-diff',
      showDiffViewer: true,
      showFileTree: true,
      showTimeline: false,
      showReviewChecklist: false,
      inlineComments: true,
      expandThreadsByDefault: false,
      highlightUnresolved: true,
      showRevisionHistory: true,
    },
    llmReviewConfig: {
      explanationDepth: 'concise',
      includeCodeExamples: false,
      includeWhyExplanations: false,
      assumeKnowledgeLevel: 'advanced',
      toneModifier: 'Be direct and professional. Assume they know the fundamentals. Focus on team standards and architectural concerns.',
      maxCommentsPerReviewer: 4,
    },
  },
  
  uiOverrides: {
    showGitTerminal: true,
    showTeamChat: true,
    showAcceptanceCriteria: true,
    showWorkflowProgress: true,
    showBurndownChart: true,
    showCompetencyBadges: false,
    showMentorHints: false,
    terminalHintsVisibility: 'on-request',
    allowShortcutButtons: false,
    layout: {
      mode: 'two-column',
      sidebarPosition: 'right',
      sidebarWidth: 'narrow',
      codeWorkPosition: 'above-terminal',
      terminalHeight: 'expanded',
      chatPosition: 'main-bottom',
      collapsiblePanels: true,
      animateTransitions: true,
      mobileBreakpoint: 'lg',
    },
    reviewPhaseLayout: {
      showGitTerminal: true,
      showTeamChat: false,
      showQuickActions: true,
      panelWidth: 'wide',
      terminalCollapsible: true,
    },
  },
  
  difficultyOverrides: {
    gitCommandStrictness: 'moderate',
    hintDetailLevel: 'minimal',
    prReviewIntensity: 'thorough',
    interruptionComplexity: 'moderate',
    stretchTasksEnabled: true,
    timeBoxedDays: true,
  },
  
  evaluationOverrides: {
    passingThreshold: 70,
    requiredTicketsComplete: 3,
    requiredPRsReviewed: 2,
  },
  
  standupModifiers: {
    showExamples: false,
    provideFeedback: true,
    feedbackTone: 'direct',
  },
  
  gitModifiers: {
    showCommandHints: false,
    showNextStepPrompt: false,
    allowButtonShortcuts: false,
  },
  
  codeWorkModifiers: {
    modeOverride: 'checklist',
    showDiffView: false,
    showRunTests: true,
    autoCompleteSteps: false,
    mentorGuidance: 'light',
  },
};
