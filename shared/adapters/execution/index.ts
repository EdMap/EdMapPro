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
  PRReviewComment,
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
    
    prReviewConfig: {
      ...roleAdapter.prReviewConfig,
      commentTypes: levelOverlay.prReviewComments,
    },
    
    uiControls: mergeUIControls(roleAdapter.uiControls, levelOverlay.uiOverrides),
    difficulty: mergeDifficulty(roleAdapter.difficulty, levelOverlay.difficultyOverrides),
    evaluation: mergeEvaluation(roleAdapter.evaluation, levelOverlay.evaluationOverrides),
    engagement: levelOverlay.engagement,
    learningObjectives: roleAdapter.learningObjectives,
  };
}

export * from './types';
