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
  
  prReviewModifiers: {
    commentCountMultiplier: 0.5,
    severityDistribution: {
      minor: 0.7,
      major: 0.25,
      blocking: 0.05,
    },
    feedbackTone: 'educational',
    showExampleResponses: true,
    autoResolveMinorOnResponse: true,
    minorResponseBehavior: 'intelligent-follow-up',
    requireExplicitApprovalRequest: false,
    uiOverrides: {
      layoutMode: 'conversation-first',
      showDiffViewer: true,
      showFileTree: false,
      showTimeline: true,
      showReviewChecklist: true,
      inlineComments: false,
      expandThreadsByDefault: true,
      highlightUnresolved: true,
      showRevisionHistory: false,
    },
    llmReviewConfig: {
      explanationDepth: 'detailed',
      includeCodeExamples: true,
      includeWhyExplanations: true,
      assumeKnowledgeLevel: 'beginner',
      toneModifier: 'Be encouraging and patient. Explain concepts as if teaching someone new to professional development. Use simple language and provide context for why things matter.',
      maxCommentsPerReviewer: 2,
    },
  },
  
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
    layout: {
      mode: 'two-column',
      sidebarPosition: 'right',
      sidebarWidth: 'wide',
      codeWorkPosition: 'above-terminal',
      terminalHeight: 'compact',
      chatPosition: 'sidebar',
      collapsiblePanels: false,
      animateTransitions: true,
      mobileBreakpoint: 'md',
    },
    reviewPhaseLayout: {
      showGitTerminal: false,
      showTeamChat: false,
      showQuickActions: false,
      panelWidth: 'full',
      terminalCollapsible: true,
    },
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
  
  codeWorkModifiers: {
    modeOverride: 'guided-diff',
    showDiffView: true,
    showRunTests: true,
    autoCompleteSteps: false,
    mentorGuidance: 'heavy',
  },
  
  ticketCompletionModifiers: {
    celebrationStyleOverride: 'confetti',
    showProgressRecapOverride: true,
    showLearningHighlightsOverride: true,
    messagesOverride: {
      title: 'Amazing Work! PR Merged!',
      encouragement: 'You did it! You completed your first full development cycle - from creating a branch to getting your code merged. This is exactly how professional developers work every day!',
    },
  },
  
  sprintCompletionModifiers: {
    celebrationStyleOverride: 'confetti',
    progressMessagesOverride: {
      nearComplete: 'You\'re so close! Just one more ticket to go - you\'ve got this!',
      allDone: 'Incredible work! You completed all your sprint tickets! 🎉',
    },
    completionCTAOverride: {
      label: 'Present Your Work',
      description: 'Time to show off what you accomplished to your team!',
    },
    teamMessageOverride: 'Wow, you completed your first sprint! The team is impressed. Let\'s move to the Sprint Review where you\'ll present your work to stakeholders.',
  },
};
