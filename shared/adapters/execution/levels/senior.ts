/**
 * Senior Level Execution Overlay
 * 
 * Minimal guidance, full autonomy, challenging scenarios.
 * User leads work with team as peers.
 */

import type { LevelExecutionOverlay } from '../types';

export const seniorExecutionOverlay: LevelExecutionOverlay = {
  level: 'senior',
  displayName: 'Senior',
  scaffoldingLevel: 'none',
  
  engagement: {
    mode: 'autonomous',
    teamTalkRatio: 0.30,
    standupGuidance: 'freeform',
    gitGuidance: 'independent',
    prReviewGuidance: 'independent',
  },
  
  prReviewComments: [
    {
      type: 'request_changes',
      severity: 'blocking',
      message: 'This approach won\'t scale for our international users. We need to support IANA timezone identifiers, not just UTC offsets. See RFC 5545 for the standard approach.',
      requiresResponse: true,
    },
    {
      type: 'question',
      severity: 'major',
      message: 'How does this interact with our caching layer? Cached timestamps would still be in UTC. Have you considered cache invalidation?',
      requiresResponse: true,
    },
    {
      type: 'request_changes',
      severity: 'major',
      message: 'The performance impact of calling toLocaleString on every render could be significant. Consider memoization or computing once on data fetch.',
      requiresResponse: true,
    },
    {
      type: 'suggestion',
      severity: 'minor',
      message: 'This would benefit from a design doc. Want to pair on documenting the timezone strategy for the team?',
      requiresResponse: false,
    },
  ],
  
  prReviewModifiers: {
    commentCountMultiplier: 1.5,
    severityDistribution: {
      minor: 0.2,
      major: 0.5,
      blocking: 0.3,
    },
    feedbackTone: 'peer',
    showExampleResponses: false,
    autoResolveMinorOnResponse: false,
    requireExplicitApprovalRequest: true,
    uiOverrides: {
      layoutMode: 'unified',
      showDiffViewer: true,
      showFileTree: true,
      showTimeline: false,
      showReviewChecklist: false,
      inlineComments: true,
      expandThreadsByDefault: false,
      highlightUnresolved: false,
      showRevisionHistory: true,
    },
  },
  
  uiOverrides: {
    showGitTerminal: true,
    showTeamChat: true,
    showAcceptanceCriteria: true,
    showWorkflowProgress: false,
    showBurndownChart: true,
    showCompetencyBadges: false,
    showMentorHints: false,
    terminalHintsVisibility: 'never',
    allowShortcutButtons: false,
    layout: {
      mode: 'focus-terminal',
      sidebarPosition: 'left',
      sidebarWidth: 'narrow',
      codeWorkPosition: 'above-terminal',
      terminalHeight: 'expanded',
      chatPosition: 'floating',
      collapsiblePanels: true,
      animateTransitions: false,
      mobileBreakpoint: 'lg',
    },
    reviewPhaseLayout: {
      showGitTerminal: true,
      showTeamChat: true,
      showQuickActions: true,
      panelWidth: 'standard',
      terminalCollapsible: true,
    },
  },
  
  difficultyOverrides: {
    gitCommandStrictness: 'strict',
    hintDetailLevel: 'none',
    prReviewIntensity: 'thorough',
    interruptionComplexity: 'complex',
    stretchTasksEnabled: true,
    timeBoxedDays: true,
  },
  
  evaluationOverrides: {
    passingThreshold: 80,
    requiredTicketsComplete: 4,
    requiredPRsReviewed: 3,
  },
  
  standupModifiers: {
    showExamples: false,
    provideFeedback: false,
    feedbackTone: 'direct',
  },
  
  gitModifiers: {
    showCommandHints: false,
    showNextStepPrompt: false,
    allowButtonShortcuts: false,
  },
  
  codeWorkModifiers: {
    modeOverride: 'freeform',
    showDiffView: false,
    showRunTests: false,
    autoCompleteSteps: true,
    mentorGuidance: 'none',
  },
};
