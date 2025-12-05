/**
 * Sprint Review Adapter Factory
 * 
 * Provides dynamic configuration for sprint review ceremonies
 * based on user's role and level.
 */

import type { Role, Level } from '../index';
import type {
  SprintReviewConfig,
  RoleReviewConfig,
  LevelReviewOverlay,
  DemoConfig,
  FeedbackConfig,
  ReviewUIConfig,
  ReviewEvaluation,
  ReviewPrompts,
  StakeholderPersona,
  DemoScript,
} from './types';

import { developerReviewConfig } from './roles/developer';
import { pmReviewConfig } from './roles/pm';
import { internReviewOverlay } from './levels/intern';
import { juniorReviewOverlay } from './levels/junior';
import { midReviewOverlay } from './levels/mid';
import { seniorReviewOverlay } from './levels/senior';

const roleConfigs: Record<string, RoleReviewConfig> = {
  developer: developerReviewConfig,
  pm: pmReviewConfig,
};

const levelOverlays: Record<Level, LevelReviewOverlay> = {
  intern: internReviewOverlay,
  junior: juniorReviewOverlay,
  mid: midReviewOverlay,
  senior: seniorReviewOverlay,
};

function mergeDemoConfig(
  roleConfig: RoleReviewConfig['baseDemoConfig'],
  levelOverlay: LevelReviewOverlay
): DemoConfig {
  const scriptSteps: DemoScript[] = roleConfig.baseScriptSteps.map((step, index) => ({
    ...step,
    stepNumber: index + 1,
    hint: levelOverlay.demoModifiers.additionalHints ? step.hint : undefined,
    timeEstimate: step.timeEstimate 
      ? Math.round(step.timeEstimate * levelOverlay.demoModifiers.timeMultiplier)
      : undefined,
  }));

  return {
    format: levelOverlay.demoModifiers.formatOverride ?? roleConfig.format,
    showScript: levelOverlay.demoModifiers.showScriptOverride ?? roleConfig.showScript,
    showTimer: levelOverlay.demoModifiers.showTimerOverride ?? roleConfig.showTimer,
    allowSkip: levelOverlay.demoModifiers.allowSkipOverride ?? roleConfig.allowSkip,
    allowNotes: roleConfig.allowNotes,
    scriptSteps,
    timePerTicket: Math.round(roleConfig.timePerTicket * levelOverlay.demoModifiers.timeMultiplier),
    transitionPrompts: roleConfig.transitionPrompts,
  };
}

function mergeFeedbackConfig(
  roleConfig: RoleReviewConfig['baseFeedbackConfig'],
  levelOverlay: LevelReviewOverlay
): FeedbackConfig {
  const stakeholders: StakeholderPersona[] = roleConfig.baseStakeholders.map(stakeholder => ({
    ...stakeholder,
    typicalFeedbackCount: Math.round(
      ((roleConfig.minFeedbackPerStakeholder + roleConfig.maxFeedbackPerStakeholder) / 2) *
      levelOverlay.feedbackModifiers.feedbackCountMultiplier
    ),
    feedbackStyle: levelOverlay.feedbackModifiers.feedbackTone,
  }));

  return {
    stakeholders,
    minFeedbackPerStakeholder: Math.max(1, Math.round(
      roleConfig.minFeedbackPerStakeholder * levelOverlay.feedbackModifiers.feedbackCountMultiplier
    )),
    maxFeedbackPerStakeholder: Math.round(
      roleConfig.maxFeedbackPerStakeholder * levelOverlay.feedbackModifiers.feedbackCountMultiplier
    ),
    sentimentDistribution: levelOverlay.feedbackModifiers.sentimentDistributionOverride 
      ?? roleConfig.sentimentDistribution,
    requireAcknowledgement: roleConfig.requireAcknowledgement,
    allowResponses: roleConfig.allowResponses,
    showSentimentIcons: roleConfig.showSentimentIcons,
  };
}

function mergePrompts(
  roleConfig: RoleReviewConfig['basePrompts'],
  levelOverlay: LevelReviewOverlay
): ReviewPrompts {
  const toneModifier = {
    encouraging: 'Be warm, supportive, and celebrate wins. Focus on positives first.',
    constructive: 'Be balanced - acknowledge good work while offering specific improvements.',
    direct: 'Be professional and to the point. Focus on facts and outcomes.',
    challenging: 'Push for excellence. Ask tough questions and expect detailed answers.',
  }[levelOverlay.feedbackModifiers.feedbackTone];

  return {
    systemPrompt: `${roleConfig.baseSystemPrompt}\n\nTone guidance: ${toneModifier}`,
    demoIntroPrompt: roleConfig.demoIntroPrompt,
    feedbackGenerationPrompt: roleConfig.feedbackGenerationPrompt,
    summaryPrompt: roleConfig.summaryPrompt,
    stakeholderPersonalities: roleConfig.stakeholderPersonalities,
  };
}

function mergeUIConfig(
  roleConfig: Partial<ReviewUIConfig>,
  levelOverlay: LevelReviewOverlay
): ReviewUIConfig {
  const defaults: ReviewUIConfig = {
    showProgressBar: true,
    showTicketDetails: true,
    showPointsSummary: true,
    showSprintGoal: true,
    expandFeedbackByDefault: true,
    animateTransitions: true,
    cardStyle: 'detailed',
  };

  return {
    ...defaults,
    ...roleConfig,
    ...levelOverlay.uiOverrides,
  };
}

function mergeEvaluation(
  roleConfig: Partial<ReviewEvaluation>,
  levelOverlay: LevelReviewOverlay
): ReviewEvaluation {
  const defaults: ReviewEvaluation = {
    criteria: {
      demoCoverage: 0.3,
      communicationClarity: 0.3,
      stakeholderEngagement: 0.2,
      feedbackReceptiveness: 0.2,
    },
    passingThreshold: 70,
    feedbackOnPerformance: true,
  };

  return {
    criteria: roleConfig.criteria ?? defaults.criteria,
    passingThreshold: levelOverlay.evaluationOverrides?.passingThreshold 
      ?? roleConfig.passingThreshold 
      ?? defaults.passingThreshold,
    feedbackOnPerformance: levelOverlay.evaluationOverrides?.feedbackOnPerformance 
      ?? roleConfig.feedbackOnPerformance 
      ?? defaults.feedbackOnPerformance,
  };
}

/**
 * Get the sprint review adapter configuration for a given role and level.
 * Merges role-specific base config with level-specific overlays.
 */
export function getSprintReviewAdapter(
  role: Role,
  level: Level
): SprintReviewConfig {
  const roleAdapter = roleConfigs[role] || roleConfigs.developer;
  const levelOverlay = levelOverlays[level];

  const demoConfig = mergeDemoConfig(roleAdapter.baseDemoConfig, levelOverlay);
  const feedbackConfig = mergeFeedbackConfig(roleAdapter.baseFeedbackConfig, levelOverlay);
  const prompts = mergePrompts(roleAdapter.basePrompts, levelOverlay);
  const uiConfig = mergeUIConfig(roleAdapter.baseUIConfig, levelOverlay);
  const evaluation = mergeEvaluation(roleAdapter.baseEvaluation, levelOverlay);

  const tips = [
    ...roleAdapter.learningObjectives.slice(0, 3),
    ...levelOverlay.additionalTips.slice(0, 3),
  ];

  return {
    metadata: {
      role,
      level,
      displayName: `${levelOverlay.displayName} ${roleAdapter.displayName}`,
      description: roleAdapter.description,
    },
    demoConfig,
    feedbackConfig,
    prompts,
    uiConfig,
    evaluation,
    learningObjectives: roleAdapter.learningObjectives,
    tips,
  };
}

export type {
  SprintReviewConfig,
  RoleReviewConfig,
  LevelReviewOverlay,
  DemoConfig,
  FeedbackConfig,
  ReviewUIConfig,
  ReviewEvaluation,
  ReviewPrompts,
  StakeholderPersona,
  StakeholderFeedback,
  DemoScript,
  ReviewStep,
  CompletedTicketSummary,
  SprintReviewState,
} from './types';
