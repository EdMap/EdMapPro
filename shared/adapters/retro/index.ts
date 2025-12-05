/**
 * Sprint Retrospective Adapter Factory
 * 
 * Provides dynamic configuration for retrospective ceremonies
 * based on user's role and level.
 */

import type { Role, Level } from '../index';
import type {
  SprintRetroConfig,
  RoleRetroConfig,
  LevelRetroOverlay,
  FacilitationConfig,
  RetroUIConfig,
  ActionItemConfig,
  RetroEvaluation,
  RetroPrompts,
  FacilitatorPersona,
  RetroCard,
} from './types';

import { developerRetroConfig } from './roles/developer';
import { pmRetroConfig } from './roles/pm';
import { internRetroOverlay } from './levels/intern';
import { juniorRetroOverlay } from './levels/junior';
import { midRetroOverlay } from './levels/mid';
import { seniorRetroOverlay } from './levels/senior';

const roleConfigs: Record<string, RoleRetroConfig> = {
  developer: developerRetroConfig,
  pm: pmRetroConfig,
};

const levelOverlays: Record<Level, LevelRetroOverlay> = {
  intern: internRetroOverlay,
  junior: juniorRetroOverlay,
  mid: midRetroOverlay,
  senior: seniorRetroOverlay,
};

function mergeFacilitationConfig(
  roleConfig: RoleRetroConfig['baseFacilitationConfig'],
  levelOverlay: LevelRetroOverlay
): FacilitationConfig {
  const facilitator: FacilitatorPersona = {
    ...roleConfig.baseFacilitator,
    promptingFrequency: levelOverlay.facilitationModifiers.promptingFrequency,
    facilitationStyle: levelOverlay.facilitationModifiers.styleOverride 
      ?? roleConfig.baseFacilitator.facilitationStyle,
  };

  const guidedQuestions = roleConfig.guidedQuestions.slice(
    0, 
    levelOverlay.facilitationModifiers.maxGuidedQuestions
  );

  return {
    facilitator,
    showFacilitatorMessages: levelOverlay.facilitationModifiers.showFacilitatorOverride 
      ?? roleConfig.showFacilitatorMessages,
    autoSuggestCards: levelOverlay.facilitationModifiers.autoSuggestOverride 
      ?? roleConfig.autoSuggestCards,
    suggestFromSprintData: roleConfig.suggestFromSprintData,
    guidedQuestions,
    maxCardsPerCategory: roleConfig.maxCardsPerCategory,
    votingEnabled: roleConfig.votingEnabled,
    anonymousCards: roleConfig.anonymousCards,
  };
}

function mergePrompts(
  roleConfig: RoleRetroConfig['basePrompts'],
  levelOverlay: LevelRetroOverlay
): RetroPrompts {
  const styleModifier = {
    guided: 'Be very supportive and guide step-by-step. Ask one question at a time and celebrate each response.',
    prompted: 'Provide helpful prompts but let them explore. Offer suggestions when they seem stuck.',
    collaborative: 'Facilitate discussion as an equal partner. Ask probing questions to deepen insights.',
    self_directed: 'Step back and let them lead. Only interject with strategic observations.',
  }[levelOverlay.facilitationModifiers.styleOverride ?? 'collaborative'];

  return {
    systemPrompt: `${roleConfig.baseSystemPrompt}\n\nFacilitation style: ${styleModifier}`,
    contextIntroPrompt: roleConfig.contextIntroPrompt,
    reflectionPrompt: roleConfig.reflectionPrompt,
    actionItemsPrompt: roleConfig.actionItemsPrompt,
    summaryPrompt: roleConfig.summaryPrompt,
    cardSuggestionPrompt: roleConfig.cardSuggestionPrompt,
    facilitatorPersonality: roleConfig.facilitatorPersonality,
  };
}

function mergeUIConfig(
  roleConfig: Partial<RetroUIConfig>,
  levelOverlay: LevelRetroOverlay
): RetroUIConfig {
  const defaults: RetroUIConfig = {
    showSprintContext: true,
    showProgressBar: true,
    showCategoryLabels: true,
    showVoteCounts: true,
    showCardAuthors: true,
    expandCardsDefault: true,
    animateTransitions: true,
    celebrationAnimation: true,
    cardStyle: 'detailed',
    layoutMode: 'two_column',
  };

  return {
    ...defaults,
    ...roleConfig,
    ...levelOverlay.uiOverrides,
  };
}

function mergeActionItemConfig(
  roleConfig: Partial<ActionItemConfig>,
  levelOverlay: LevelRetroOverlay
): ActionItemConfig {
  const defaults: ActionItemConfig = {
    requireOwner: true,
    suggestFromTopVoted: true,
    maxActionItems: 5,
    showPreviousActions: true,
    categories: ['Process', 'Technical', 'Communication'],
  };

  return {
    ...defaults,
    ...roleConfig,
    ...levelOverlay.actionItemOverrides,
  };
}

function mergeEvaluation(
  roleConfig: Partial<RetroEvaluation>,
  levelOverlay: LevelRetroOverlay
): RetroEvaluation {
  const defaults: RetroEvaluation = {
    criteria: {
      reflectionDepth: 0.3,
      actionableItems: 0.3,
      participation: 0.2,
      positiveBalance: 0.2,
    },
    passingThreshold: 70,
    showFeedback: true,
  };

  return {
    criteria: roleConfig.criteria ?? defaults.criteria,
    passingThreshold: levelOverlay.evaluationOverrides?.passingThreshold 
      ?? roleConfig.passingThreshold 
      ?? defaults.passingThreshold,
    showFeedback: levelOverlay.evaluationOverrides?.showFeedback 
      ?? roleConfig.showFeedback 
      ?? defaults.showFeedback,
  };
}

function generateStarterCards(
  roleConfig: RoleRetroConfig,
  levelOverlay: LevelRetroOverlay
): RetroCard[] {
  if (levelOverlay.starterCardCount === 0) return [];
  
  const starterCards: RetroCard[] = [];
  
  const wentWellExamples = [
    'Team collaboration was excellent - everyone helped when blocked',
    'Good estimation on tickets, delivered close to planned points',
    'Code reviews were constructive and timely',
  ];
  
  const toImproveExamples = [
    'Daily standups ran longer than expected',
    'Some requirements were unclear mid-sprint',
    'Testing could have started earlier',
  ];
  
  const count = Math.min(levelOverlay.starterCardCount, 3);
  
  for (let i = 0; i < count; i++) {
    if (wentWellExamples[i]) {
      starterCards.push({
        id: `starter-ww-${i}`,
        type: 'went_well',
        text: wentWellExamples[i],
        votes: Math.floor(Math.random() * 3) + 1,
        isAISuggested: true,
      });
    }
    if (toImproveExamples[i]) {
      starterCards.push({
        id: `starter-ti-${i}`,
        type: 'to_improve',
        text: toImproveExamples[i],
        votes: Math.floor(Math.random() * 2) + 1,
        isAISuggested: true,
      });
    }
  }
  
  return starterCards;
}

/**
 * Get the retrospective adapter configuration for a given role and level.
 * Merges role-specific base config with level-specific overlays.
 */
export function getRetroAdapter(
  role: Role,
  level: Level
): SprintRetroConfig {
  const roleAdapter = roleConfigs[role] || roleConfigs.developer;
  const levelOverlay = levelOverlays[level];

  const facilitationConfig = mergeFacilitationConfig(roleAdapter.baseFacilitationConfig, levelOverlay);
  const prompts = mergePrompts(roleAdapter.basePrompts, levelOverlay);
  const uiConfig = mergeUIConfig(roleAdapter.baseUIConfig, levelOverlay);
  const actionItemConfig = mergeActionItemConfig(roleAdapter.baseActionItemConfig, levelOverlay);
  const evaluation = mergeEvaluation(roleAdapter.baseEvaluation, levelOverlay);
  const starterCards = generateStarterCards(roleAdapter, levelOverlay);

  const tips = [
    ...roleAdapter.learningObjectives.slice(0, 2),
    ...levelOverlay.additionalTips.slice(0, 3),
  ];

  return {
    metadata: {
      role,
      level,
      displayName: `${levelOverlay.displayName} ${roleAdapter.displayName}`,
      description: roleAdapter.description,
    },
    facilitationConfig,
    prompts,
    uiConfig,
    actionItemConfig,
    evaluation,
    starterCards,
    learningObjectives: roleAdapter.learningObjectives,
    tips,
  };
}

export type {
  SprintRetroConfig,
  RoleRetroConfig,
  LevelRetroOverlay,
  FacilitationConfig,
  RetroUIConfig,
  ActionItemConfig,
  RetroEvaluation,
  RetroPrompts,
  FacilitatorPersona,
  RetroCard,
  CardCategory,
  CardPrompt,
  RetroStep,
  SprintContextData,
  SprintContextItem,
  RetroState,
  FacilitationStyle,
} from './types';
