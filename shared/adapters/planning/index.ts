/**
 * Sprint Planning Adapter Factory
 * 
 * Merges role adapters with level overlays and tier overlays to create complete
 * SprintPlanningAdapter configurations.
 * 
 * Three-layer configuration:
 * 1. Role Base - Engagement areas, competency rubric
 * 2. Level Overlay - Guidance intensity, scaffolding  
 * 3. Tier Overlay - Ownership level (adaptive, earned through competency)
 */

import type { Role, Level } from '../index';
import type { 
  SprintPlanningAdapter, 
  RolePlanningAdapter, 
  LevelPlanningOverlay,
  LevelEngagement,
  PlanningUIControls,
  PlanningDifficulty,
  PlanningEvaluation,
  PlanningPrompts,
  SprintTier,
  TierStatus,
  TierPlanningOverlay
} from './types';

import { developerPlanningAdapter, qaPlanningAdapter, devopsPlanningAdapter, dataSciencePlanningAdapter } from './roles/developer';
import { pmPlanningAdapter } from './roles/pm';
import { internLevelOverlay } from './levels/intern';
import { juniorLevelOverlay } from './levels/junior';
import { midLevelOverlay } from './levels/mid';
import { seniorLevelOverlay } from './levels/senior';
import { getTierOverlay, getTierAdvancementMessaging } from './tiers';

export * from './types';
export * from './tiers';
export * from './message-builder';

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

const defaultEngagement: LevelEngagement = {
  mode: 'guided',
  autoStartConversation: true,
  autoAdvancePhases: false,
  teamTalkRatio: 0.5,
  phaseEngagement: {
    context: 'respond',
    discussion: 'respond',
    commitment: 'respond'
  },
  autoStartMessage: 'Good morning team! Let\'s get started with our sprint planning.'
};

function buildSystemPrompt(
  roleAdapter: RolePlanningAdapter,
  levelOverlay: LevelPlanningOverlay,
  tierOverlay?: TierPlanningOverlay
): string {
  let prompt = `${roleAdapter.prompts.baseSystemPrompt}

${levelOverlay.promptModifiers.guidanceLevel}

${levelOverlay.promptModifiers.toneAdjustment}`;

  if (tierOverlay) {
    prompt += `

${tierOverlay.promptModifiers.ownershipLevel}

${tierOverlay.promptModifiers.responseExpectation}`;
  }

  return prompt;
}

function mergeUIControls(
  roleControls: Partial<PlanningUIControls>,
  levelOverrides: Partial<PlanningUIControls>,
  tierOverrides?: Partial<PlanningUIControls>
): PlanningUIControls {
  return {
    ...defaultUIControls,
    ...roleControls,
    ...levelOverrides,
    ...(tierOverrides || {})
  };
}

function mergeEngagement(
  levelEngagement: LevelEngagement,
  tierOverrides?: Partial<LevelEngagement>
): LevelEngagement {
  if (!tierOverrides) return levelEngagement;
  
  return {
    ...levelEngagement,
    ...tierOverrides,
    phaseEngagement: {
      ...levelEngagement.phaseEngagement,
      ...(tierOverrides.phaseEngagement || {})
    }
  };
}

/**
 * Apply sprint context to engagement messages
 * For Sprint 1: Welcome as new team member
 * For Sprint 2+: Acknowledge as returning team member
 */
function applySprintContext(
  engagement: LevelEngagement,
  sprintNumber: number,
  userName: string = 'team member',
  userRole: string = 'Developer'
): LevelEngagement {
  if (sprintNumber <= 1) {
    return engagement;
  }
  
  const returningWelcome = `Good morning everyone! Thanks for joining our Sprint ${sprintNumber} planning. Great to see the team back together.

Let's dive into what we have for this sprint.`;

  const returningAutoStartMessage = returningWelcome;
  
  const modifiedAutoStartSequence = engagement.autoStartSequence?.map((step, index) => {
    if (index === 0 && step.personaId === 'priya') {
      return {
        ...step,
        message: returningWelcome
      };
    }
    return step;
  });

  const modifiedPreMeetingBriefing = engagement.preMeetingBriefing ? {
    ...engagement.preMeetingBriefing,
    subtitle: `Sprint ${sprintNumber} planning session`,
    contextNote: `This is Sprint ${sprintNumber}. You know the team and the process. Let's focus on the new backlog items.`
  } : undefined;

  return {
    ...engagement,
    autoStartMessage: returningAutoStartMessage,
    autoStartSequence: modifiedAutoStartSequence,
    preMeetingBriefing: modifiedPreMeetingBriefing
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

/**
 * Configuration options for the planning adapter
 */
export interface PlanningAdapterOptions {
  tier?: SprintTier;
  tierStatus?: TierStatus;
  sprintNumber?: number;
  userName?: string;
  userRole?: string;
}

/**
 * Get a sprint planning adapter with optional tier overlay
 * 
 * Three-layer merge: Role Base → Level Overlay → Tier Overlay
 */
export function getSprintPlanningAdapter(
  role: Role, 
  level: Level,
  options?: PlanningAdapterOptions
): SprintPlanningAdapter {
  const roleAdapter = roleAdapters[role] || roleAdapters.developer;
  const levelOverlay = levelOverlays[level] || levelOverlays.intern;
  const tierOverlay = options?.tier ? getTierOverlay(options.tier) : undefined;
  
  const prompts: PlanningPrompts = {
    systemPrompt: buildSystemPrompt(roleAdapter, levelOverlay, tierOverlay),
    contextPhasePrompt: roleAdapter.prompts.contextPhasePrompt,
    discussionPhasePrompt: roleAdapter.prompts.discussionPhasePrompt,
    commitmentPhasePrompt: roleAdapter.prompts.commitmentPhasePrompt,
    personas: roleAdapter.prompts.personas,
    facilitator: roleAdapter.prompts.facilitator
  };
  
  const baseEngagement: LevelEngagement = levelOverlay.engagement || defaultEngagement;
  let engagement = mergeEngagement(baseEngagement, tierOverlay?.engagementOverrides);
  
  if (options?.sprintNumber) {
    engagement = applySprintContext(
      engagement, 
      options.sprintNumber, 
      options.userName, 
      options.userRole
    );
  }
  
  return {
    metadata: {
      role,
      level,
      tier: options?.tier,
      tierStatus: options?.tierStatus,
      displayName: `${levelOverlay.displayName} ${roleAdapter.displayName}`,
      description: roleAdapter.description,
      competencies: roleAdapter.competencies
    },
    prompts,
    uiControls: mergeUIControls(
      roleAdapter.uiControls, 
      levelOverlay.uiOverrides,
      tierOverlay?.uiOverrides
    ),
    difficulty: mergeDifficulty(roleAdapter.difficulty, levelOverlay.difficultyOverrides),
    evaluation: mergeEvaluation(roleAdapter.evaluation, levelOverlay.evaluationOverrides),
    engagement,
    learningObjectives: roleAdapter.learningObjectives,
    commitmentGuidance: roleAdapter.commitmentGuidance,
    tierMessaging: options?.tier ? getTierAdvancementMessaging() : undefined
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
