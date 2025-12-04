/**
 * Sprint Planning Adapter Factory
 * 
 * Merges role adapters with level overlays to create complete
 * SprintPlanningAdapter configurations for each role/level combination.
 */

import type { Role, Level } from '../index';
import type { 
  SprintPlanningAdapter, 
  RolePlanningAdapter, 
  LevelPlanningOverlay,
  PlanningUIControls,
  PlanningDifficulty,
  PlanningEvaluation,
  PlanningPrompts
} from './types';

import { developerPlanningAdapter, qaPlanningAdapter, devopsPlanningAdapter, dataSciencePlanningAdapter } from './roles/developer';
import { pmPlanningAdapter } from './roles/pm';
import { internLevelOverlay } from './levels/intern';
import { juniorLevelOverlay } from './levels/junior';
import { midLevelOverlay } from './levels/mid';
import { seniorLevelOverlay } from './levels/senior';

export * from './types';

const roleAdapters: Record<Role, RolePlanningAdapter> = {
  developer: developerPlanningAdapter,
  pm: pmPlanningAdapter,
  qa: qaPlanningAdapter,
  devops: devopsPlanningAdapter,
  data_science: dataSciencePlanningAdapter
};

const levelOverlays: Record<Level, LevelPlanningOverlay> = {
  intern: internLevelOverlay,
  junior: juniorLevelOverlay,
  mid: midLevelOverlay,
  senior: seniorLevelOverlay
};

const defaultUIControls: PlanningUIControls = {
  showPriorityEditor: false,
  showEstimationSliders: false,
  requireDiscussionBeforeNext: true,
  showLearningObjectives: false,
  showKnowledgeCheck: false,
  canSkipPhases: false,
  showMeetingTimer: true,
  showCapacityIndicator: true
};

const defaultDifficulty: PlanningDifficulty = {
  ticketComplexity: 'medium',
  ambiguityLevel: 0.3,
  conflictScenarios: false,
  aiPushbackIntensity: 'gentle',
  estimationAccuracy: 'assisted'
};

const defaultEvaluation: PlanningEvaluation = {
  rubricWeights: {
    participation: 0.20,
    understanding: 0.25,
    collaboration: 0.20,
    goalClarity: 0.20,
    scopeRealism: 0.15
  },
  passingThreshold: 60,
  requiredInteractions: 3
};

function buildSystemPrompt(
  roleAdapter: RolePlanningAdapter,
  levelOverlay: LevelPlanningOverlay
): string {
  return `${roleAdapter.prompts.baseSystemPrompt}

${levelOverlay.promptModifiers.guidanceLevel}

${levelOverlay.promptModifiers.toneAdjustment}`;
}

function mergeUIControls(
  roleControls: Partial<PlanningUIControls>,
  levelOverrides: Partial<PlanningUIControls>
): PlanningUIControls {
  return {
    ...defaultUIControls,
    ...roleControls,
    ...levelOverrides
  };
}

function mergeDifficulty(
  roleDifficulty: Partial<PlanningDifficulty>,
  levelOverrides: Partial<PlanningDifficulty>
): PlanningDifficulty {
  return {
    ...defaultDifficulty,
    ...roleDifficulty,
    ...levelOverrides
  };
}

function mergeEvaluation(
  roleEval: Partial<PlanningEvaluation>,
  levelOverrides: Partial<PlanningEvaluation>
): PlanningEvaluation {
  const mergedWeights = {
    ...defaultEvaluation.rubricWeights,
    ...(roleEval.rubricWeights || {})
  };
  
  return {
    rubricWeights: mergedWeights,
    passingThreshold: levelOverrides.passingThreshold ?? roleEval.passingThreshold ?? defaultEvaluation.passingThreshold,
    requiredInteractions: levelOverrides.requiredInteractions ?? roleEval.requiredInteractions ?? defaultEvaluation.requiredInteractions
  };
}

export function getSprintPlanningAdapter(role: Role, level: Level): SprintPlanningAdapter {
  const roleAdapter = roleAdapters[role] || roleAdapters.developer;
  const levelOverlay = levelOverlays[level] || levelOverlays.intern;
  
  const prompts: PlanningPrompts = {
    systemPrompt: buildSystemPrompt(roleAdapter, levelOverlay),
    contextPhasePrompt: roleAdapter.prompts.contextPhasePrompt,
    discussionPhasePrompt: roleAdapter.prompts.discussionPhasePrompt,
    commitmentPhasePrompt: roleAdapter.prompts.commitmentPhasePrompt,
    personas: roleAdapter.prompts.personas,
    facilitator: roleAdapter.prompts.facilitator
  };
  
  return {
    metadata: {
      role,
      level,
      displayName: `${levelOverlay.displayName} ${roleAdapter.displayName}`,
      description: roleAdapter.description,
      competencies: roleAdapter.competencies
    },
    prompts,
    uiControls: mergeUIControls(roleAdapter.uiControls, levelOverlay.uiOverrides),
    difficulty: mergeDifficulty(roleAdapter.difficulty, levelOverlay.difficultyOverrides),
    evaluation: mergeEvaluation(roleAdapter.evaluation, levelOverlay.evaluationOverrides),
    learningObjectives: roleAdapter.learningObjectives
  };
}

export function getAvailableRoles(): Role[] {
  return Object.keys(roleAdapters) as Role[];
}

export function getAvailableLevels(): Level[] {
  return Object.keys(levelOverlays) as Level[];
}

export function getRoleAdapter(role: Role): RolePlanningAdapter {
  return roleAdapters[role] || roleAdapters.developer;
}

export function getLevelOverlay(level: Level): LevelPlanningOverlay {
  return levelOverlays[level] || levelOverlays.intern;
}
