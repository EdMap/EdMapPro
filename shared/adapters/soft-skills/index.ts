/**
 * Soft Skill Event Adapter Factory
 * 
 * Provides role-aware, level-adjusted soft skill event adapters by merging
 * role-specific behavior with level-specific scaffolding.
 */

import type { Role, Level } from '../index';
import type {
  SoftSkillEventAdapter,
  RoleSoftSkillAdapter,
  LevelSoftSkillOverlay,
  SuggestionConfig,
  EvaluationConfig,
  FeedbackConfig,
  SoftSkillUIConfig,
  SoftSkillPromptConfig,
} from './types';

import {
  developerSoftSkillAdapter,
  qaSoftSkillAdapter,
  devopsSoftSkillAdapter,
  dataScienceSoftSkillAdapter,
} from './roles/developer';
import { pmSoftSkillAdapter } from './roles/pm';

import { internSoftSkillOverlay } from './levels/intern';
import { juniorSoftSkillOverlay } from './levels/junior';
import { midSoftSkillOverlay } from './levels/mid';
import { seniorSoftSkillOverlay } from './levels/senior';

const roleAdapters: Record<Role, RoleSoftSkillAdapter> = {
  developer: developerSoftSkillAdapter,
  pm: pmSoftSkillAdapter,
  qa: qaSoftSkillAdapter,
  devops: devopsSoftSkillAdapter,
  data_science: dataScienceSoftSkillAdapter,
};

const levelOverlays: Record<Level, LevelSoftSkillOverlay> = {
  intern: internSoftSkillOverlay,
  junior: juniorSoftSkillOverlay,
  mid: midSoftSkillOverlay,
  senior: seniorSoftSkillOverlay,
};

function mergeSuggestionConfig(
  roleConfig: RoleSoftSkillAdapter['baseSuggestionConfig'],
  levelModifiers: LevelSoftSkillOverlay['suggestionModifiers']
): SuggestionConfig {
  return {
    ...roleConfig,
    visibility: levelModifiers.visibility,
    showRecommendedLabel: levelModifiers.showRecommendedLabel,
  };
}

function mergeEvaluationConfig(
  roleConfig: RoleSoftSkillAdapter['baseEvaluationConfig'],
  levelModifiers: LevelSoftSkillOverlay['evaluationModifiers']
): EvaluationConfig {
  return {
    ...roleConfig,
    strictness: levelModifiers.strictness,
    llmThreshold: Math.min(1, Math.max(0, roleConfig.llmThreshold + levelModifiers.llmThresholdAdjustment)),
  };
}

function mergeFeedbackConfig(
  roleConfig: RoleSoftSkillAdapter['baseFeedbackConfig'],
  levelModifiers: LevelSoftSkillOverlay['feedbackModifiers']
): FeedbackConfig {
  return {
    ...roleConfig,
    tone: levelModifiers.tone,
    maxFeedbackLength: levelModifiers.maxFeedbackLength,
    showScore: levelModifiers.showScore,
  };
}

function mergeUIConfig(
  roleConfig: Partial<SoftSkillUIConfig>,
  levelOverrides: Partial<SoftSkillUIConfig>
): SoftSkillUIConfig {
  const defaults: SoftSkillUIConfig = {
    modalSize: 'standard',
    showScenarioContext: true,
    showCompetencyTags: true,
    showTimerHint: false,
    animateTransitions: true,
    inputPlaceholder: 'Type your response...',
  };

  return {
    ...defaults,
    ...roleConfig,
    ...levelOverrides,
  };
}

function mergePromptConfig(
  roleConfig: RoleSoftSkillAdapter['basePromptConfig'],
  feedbackTone: FeedbackConfig['tone']
): SoftSkillPromptConfig {
  const toneInstructions: Record<FeedbackConfig['tone'], string> = {
    encouraging: 'Be warm and encouraging. Focus on what they did well before mentioning areas for growth.',
    constructive: 'Be constructive and supportive. Balance strengths with specific, actionable growth areas.',
    direct: 'Be direct and professional. Get to the point with clear feedback.',
    peer: 'Provide peer-level feedback. Assume they understand professional norms.',
  };

  return {
    systemPrompt: roleConfig.systemPrompt,
    evaluationPrompt: roleConfig.evaluationPrompt,
    followUpPrompt: roleConfig.followUpPrompt,
    feedbackPrompt: `${roleConfig.baseFeedbackPrompt}\n\nTone: ${toneInstructions[feedbackTone]}`,
  };
}

export function getSoftSkillEventAdapter(role: Role, level: Level): SoftSkillEventAdapter {
  const roleAdapter = roleAdapters[role] || roleAdapters.developer;
  const levelOverlay = levelOverlays[level] || levelOverlays.intern;

  const feedbackConfig = mergeFeedbackConfig(roleAdapter.baseFeedbackConfig, levelOverlay.feedbackModifiers);

  return {
    metadata: {
      role: roleAdapter.role,
      level: levelOverlay.level,
      displayName: `${levelOverlay.displayName} ${roleAdapter.displayName}`,
      description: roleAdapter.description,
    },

    suggestionConfig: mergeSuggestionConfig(roleAdapter.baseSuggestionConfig, levelOverlay.suggestionModifiers),
    evaluationConfig: mergeEvaluationConfig(roleAdapter.baseEvaluationConfig, levelOverlay.evaluationModifiers),
    feedbackConfig,
    followUpConfig: roleAdapter.baseFollowUpConfig,
    uiConfig: mergeUIConfig(roleAdapter.baseUIConfig, levelOverlay.uiOverrides),
    promptConfig: mergePromptConfig(roleAdapter.basePromptConfig, feedbackConfig.tone),
    rubricWeights: roleAdapter.rubricWeights,
  };
}

export function buildSoftSkillEventActivityData(
  templateId: string,
  eventId: string,
  day: number,
  trigger: string,
  scenario: {
    setup: string;
    message: string;
    sender: string;
    senderRole: string;
  },
  responseOptions: {
    id: string;
    label: string;
    description: string;
    isRecommended: boolean;
    evaluationNotes: string;
  }[],
  evaluationCriteria: {
    dimension: string;
    question: string;
    weight: number;
  }[],
  followUpTemplates: {
    condition: string;
    message: string;
  }[],
  role: Role,
  level: Level
): import('./types').SoftSkillEventActivityData {
  const adapter = getSoftSkillEventAdapter(role, level);

  return {
    templateId,
    eventId,
    day,
    trigger,
    scenario,
    responseOptions,
    evaluationCriteria,
    followUpTemplates,
    adapterConfig: {
      role,
      level,
      suggestionVisibility: adapter.suggestionConfig.visibility,
      evaluationStrictness: adapter.evaluationConfig.strictness,
      feedbackTone: adapter.feedbackConfig.tone,
    },
  };
}

export * from './types';
