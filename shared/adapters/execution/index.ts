/**
 * Sprint Execution Adapter Factory
 * 
 * Provides role-aware, level-adjusted execution adapters by merging
 * role-specific behavior with level-specific scaffolding.
 */

import type { Role, Level } from '../index';
import type { 
  SprintExecutionAdapter, 
  RoleExecutionAdapter, 
  LevelExecutionOverlay,
  ExecutionUIControls,
  ExecutionDifficulty,
  ExecutionEvaluation,
  PRReviewConfig,
  PRReviewUIConfig,
  PRReviewPrompts,
  ReviewerPersona,
  RolePRReviewConfig,
  PRReviewModifiers,
  CodeWorkConfig,
  CodeWorkMode,
} from './types';

import { 
  developerExecutionAdapter, 
  qaExecutionAdapter, 
  devopsExecutionAdapter, 
  dataScienceExecutionAdapter 
} from './roles/developer';
import { pmExecutionAdapter } from './roles/pm';

import { internExecutionOverlay } from './levels/intern';
import { juniorExecutionOverlay } from './levels/junior';
import { midExecutionOverlay } from './levels/mid';
import { seniorExecutionOverlay } from './levels/senior';

const roleAdapters: Record<Role, RoleExecutionAdapter> = {
  developer: developerExecutionAdapter,
  pm: pmExecutionAdapter,
  qa: qaExecutionAdapter,
  devops: devopsExecutionAdapter,
  data_science: dataScienceExecutionAdapter,
};

const levelOverlays: Record<Level, LevelExecutionOverlay> = {
  intern: internExecutionOverlay,
  junior: juniorExecutionOverlay,
  mid: midExecutionOverlay,
  senior: seniorExecutionOverlay,
};

function mergeUIControls(
  roleControls: Partial<ExecutionUIControls>,
  levelOverrides: Partial<ExecutionUIControls>
): ExecutionUIControls {
  const defaultLayout = {
    mode: 'two-column' as const,
    sidebarPosition: 'right' as const,
    sidebarWidth: 'medium' as const,
    codeWorkPosition: 'above-terminal' as const,
    terminalHeight: 'medium' as const,
    chatPosition: 'sidebar' as const,
    collapsiblePanels: true,
    animateTransitions: true,
    mobileBreakpoint: 'lg' as const,
  };

  const defaults: ExecutionUIControls = {
    showGitTerminal: true,
    showTeamChat: true,
    showAcceptanceCriteria: true,
    showWorkflowProgress: true,
    showBurndownChart: false,
    showCompetencyBadges: false,
    showMentorHints: true,
    terminalHintsVisibility: 'on-error',
    allowShortcutButtons: false,
    splitPanelLayout: 'terminal-right',
    layout: defaultLayout,
  };
  
  const mergedLayout = {
    ...defaultLayout,
    ...roleControls.layout,
    ...levelOverrides.layout,
  };

  return {
    ...defaults,
    ...roleControls,
    ...levelOverrides,
    layout: mergedLayout,
  };
}

function mergeDifficulty(
  roleDifficulty: Partial<ExecutionDifficulty>,
  levelOverrides: Partial<ExecutionDifficulty>
): ExecutionDifficulty {
  const defaults: ExecutionDifficulty = {
    gitCommandStrictness: 'moderate',
    hintDetailLevel: 'partial',
    prReviewIntensity: 'moderate',
    interruptionComplexity: 'simple',
    stretchTasksEnabled: false,
    timeBoxedDays: true,
  };
  
  return {
    ...defaults,
    ...roleDifficulty,
    ...levelOverrides,
  };
}

function mergeEvaluation(
  roleEvaluation: Partial<ExecutionEvaluation>,
  levelOverrides: Partial<ExecutionEvaluation>
): ExecutionEvaluation {
  const defaults: ExecutionEvaluation = {
    rubricWeights: {
      gitMastery: 0.20,
      deliveryReliability: 0.25,
      communicationQuality: 0.20,
      collaborationSkill: 0.15,
      codeReviewResponse: 0.20,
    },
    passingThreshold: 70,
    requiredTicketsComplete: 2,
    requiredPRsReviewed: 2,
  };
  
  return {
    rubricWeights: {
      ...defaults.rubricWeights,
      ...roleEvaluation.rubricWeights,
    },
    passingThreshold: levelOverrides.passingThreshold ?? roleEvaluation.passingThreshold ?? defaults.passingThreshold,
    requiredTicketsComplete: levelOverrides.requiredTicketsComplete ?? roleEvaluation.requiredTicketsComplete ?? defaults.requiredTicketsComplete,
    requiredPRsReviewed: levelOverrides.requiredPRsReviewed ?? roleEvaluation.requiredPRsReviewed ?? defaults.requiredPRsReviewed,
  };
}

function mergeCodeWorkConfig(
  roleConfig: RoleExecutionAdapter['codeWorkConfig'],
  levelModifiers: LevelExecutionOverlay['codeWorkModifiers']
): CodeWorkConfig {
  const mode: CodeWorkMode = levelModifiers.modeOverride ?? roleConfig.baseMode;
  
  return {
    enabled: roleConfig.enabled,
    mode,
    requireCompletionBeforeStage: roleConfig.requireCompletionBeforeStage,
    showDiffView: levelModifiers.showDiffView,
    showRunTests: levelModifiers.showRunTests,
    steps: roleConfig.steps,
    mentorHints: levelModifiers.mentorGuidance === 'none' ? [] : roleConfig.mentorHints,
    completionMessage: roleConfig.completionMessage,
  };
}

function mergePRReviewConfig(
  roleConfig: RolePRReviewConfig,
  levelComments: LevelExecutionOverlay['prReviewComments'],
  levelModifiers: PRReviewModifiers
): PRReviewConfig {
  const defaultUIConfig: PRReviewUIConfig = {
    layoutMode: 'split-diff',
    showDiffViewer: true,
    showFileTree: true,
    showTimeline: true,
    showReviewChecklist: false,
    inlineComments: true,
    expandThreadsByDefault: true,
    highlightUnresolved: true,
    showRevisionHistory: false,
    showReturnToCode: true,
    showReviewBanner: true,
    showProgressIndicator: true,
    enableMarkAddressed: true,
  };

  const mergedUIConfig: PRReviewUIConfig = {
    ...defaultUIConfig,
    ...roleConfig.baseUIConfig,
    ...levelModifiers.uiOverrides,
  };

  const systemPrompt = `${roleConfig.basePrompts.baseSystemPrompt}
Feedback tone: ${levelModifiers.feedbackTone}
${levelModifiers.showExampleResponses ? 'Include example responses to help the developer understand how to address feedback.' : ''}`;

  const mergedPrompts: PRReviewPrompts = {
    systemPrompt,
    initialReviewPrompt: roleConfig.basePrompts.initialReviewPrompt,
    followUpPrompt: roleConfig.basePrompts.followUpPrompt,
    approvalCriteria: roleConfig.basePrompts.approvalCriteria,
    commonIssuesHint: roleConfig.basePrompts.commonIssuesHint,
  };

  const reviewers: ReviewerPersona[] = roleConfig.baseReviewers.map(baseReviewer => ({
    ...baseReviewer,
    typicalCommentCount: Math.max(1, Math.round(
      (roleConfig.minCommentsPerPR + roleConfig.maxCommentsPerPR) / 2 * levelModifiers.commentCountMultiplier
    )),
  }));

  const minComments = Math.max(1, Math.round(roleConfig.minCommentsPerPR * levelModifiers.commentCountMultiplier));
  const maxComments = Math.max(minComments, Math.round(roleConfig.maxCommentsPerPR * levelModifiers.commentCountMultiplier));

  return {
    enabled: roleConfig.enabled,
    minCommentsPerPR: minComments,
    maxCommentsPerPR: maxComments,
    commentTypes: levelComments,
    requireAllResolved: roleConfig.requireAllResolved,
    autoApproveThreshold: roleConfig.autoApproveThreshold,
    maxRevisionCycles: roleConfig.maxRevisionCycles,
    reviewers,
    uiConfig: mergedUIConfig,
    prompts: mergedPrompts,
    levelModifiers,
    knowledgeBase: roleConfig.knowledgeBase,
  };
}

export function getSprintExecutionAdapter(role: Role, level: Level): SprintExecutionAdapter {
  const roleAdapter = roleAdapters[role] || roleAdapters.developer;
  const levelOverlay = levelOverlays[level] || levelOverlays.intern;
  
  const feedbackPrompt = `${roleAdapter.standupConfig.baseFeedbackPrompt}
Tone: ${levelOverlay.standupModifiers.feedbackTone}
${levelOverlay.standupModifiers.showExamples ? 'Include brief examples when helpful.' : ''}`;

  return {
    metadata: {
      role: roleAdapter.role,
      level: levelOverlay.level,
      displayName: `${levelOverlay.displayName} ${roleAdapter.displayName}`,
      description: roleAdapter.description,
      competencies: roleAdapter.competencies,
    },
    
    gitWorkflow: roleAdapter.gitWorkflow,
    
    standupConfig: {
      ...roleAdapter.standupConfig,
      feedbackPrompt,
      feedbackEnabled: levelOverlay.standupModifiers.provideFeedback,
    },
    
    ticketWorkConfig: roleAdapter.ticketWorkConfig,
    
    codeWorkConfig: mergeCodeWorkConfig(roleAdapter.codeWorkConfig, levelOverlay.codeWorkModifiers),
    
    aiInteractions: {
      ...roleAdapter.aiInteractions,
      responsePersonality: levelOverlay.scaffoldingLevel === 'high' 
        ? 'supportive' 
        : levelOverlay.scaffoldingLevel === 'none' 
          ? 'challenging' 
          : 'realistic',
    },
    
    prReviewConfig: mergePRReviewConfig(
      roleAdapter.prReviewConfig,
      levelOverlay.prReviewComments,
      levelOverlay.prReviewModifiers
    ),
    
    uiControls: mergeUIControls(roleAdapter.uiControls, levelOverlay.uiOverrides),
    difficulty: mergeDifficulty(roleAdapter.difficulty, levelOverlay.difficultyOverrides),
    evaluation: mergeEvaluation(roleAdapter.evaluation, levelOverlay.evaluationOverrides),
    engagement: levelOverlay.engagement,
    learningObjectives: roleAdapter.learningObjectives,
  };
}

export * from './types';
