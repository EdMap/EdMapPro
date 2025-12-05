/**
 * Onboarding Adapter Factory
 * 
 * Merges role adapters with level overlays to create complete
 * OnboardingAdapter configurations for each role/level combination.
 */

import type { Role, Level } from '../index';
import type { 
  OnboardingAdapter, 
  RoleOnboardingAdapter, 
  LevelOnboardingOverlay,
  OnboardingUIControls,
  OnboardingDifficulty,
  OnboardingEvaluation,
  EnvironmentSetupConfig,
  EnvironmentSetupStep,
  TerminalHint,
  CommandValidationResult
} from './types';

import { developerOnboardingAdapter, qaOnboardingAdapter, devopsOnboardingAdapter, dataScienceOnboardingAdapter } from './roles/developer';
import { pmOnboardingAdapter } from './roles/pm';
import { internLevelOverlay } from './levels/intern';
import { juniorLevelOverlay } from './levels/junior';
import { midLevelOverlay } from './levels/mid';
import { seniorLevelOverlay } from './levels/senior';

export * from './types';

const roleAdapters: Record<Role, RoleOnboardingAdapter> = {
  developer: developerOnboardingAdapter,
  pm: pmOnboardingAdapter,
  qa: qaOnboardingAdapter,
  devops: devopsOnboardingAdapter,
  data_science: dataScienceOnboardingAdapter
};

const levelOverlays: Record<Level, LevelOnboardingOverlay> = {
  intern: internLevelOverlay,
  junior: juniorLevelOverlay,
  mid: midLevelOverlay,
  senior: seniorLevelOverlay
};

const defaultUIControls: OnboardingUIControls = {
  showHintsPanel: true,
  showProgressIndicator: true,
  allowSkipSteps: false,
  showCommandHistory: true,
  terminalHeight: 'standard',
  hintVisibility: 'on-error'
};

const defaultDifficulty: OnboardingDifficulty = {
  hintDetailLevel: 'partial',
  commandValidationStrictness: 'moderate',
  errorRecoveryGuidance: true,
  maxRetries: 5,
  showExampleCommands: false
};

const defaultEvaluation: OnboardingEvaluation = {
  rubricWeights: {
    commandAccuracy: 0.40,
    completionSpeed: 0.15,
    independentProgress: 0.30,
    errorRecovery: 0.15
  },
  passingThreshold: 60,
  requiredStepsComplete: 4
};

function mergeUIControls(
  roleControls: Partial<OnboardingUIControls>,
  levelOverrides: Partial<OnboardingUIControls>
): OnboardingUIControls {
  return {
    ...defaultUIControls,
    ...roleControls,
    ...levelOverrides
  };
}

function mergeDifficulty(
  roleDifficulty: Partial<OnboardingDifficulty>,
  levelOverrides: Partial<OnboardingDifficulty>
): OnboardingDifficulty {
  return {
    ...defaultDifficulty,
    ...roleDifficulty,
    ...levelOverrides
  };
}

function mergeEvaluation(
  roleEval: Partial<OnboardingEvaluation>,
  levelOverrides: Partial<OnboardingEvaluation>
): OnboardingEvaluation {
  const mergedWeights = {
    ...defaultEvaluation.rubricWeights,
    ...(roleEval.rubricWeights || {})
  };
  
  return {
    rubricWeights: mergedWeights,
    passingThreshold: levelOverrides.passingThreshold ?? roleEval.passingThreshold ?? defaultEvaluation.passingThreshold,
    requiredStepsComplete: levelOverrides.requiredStepsComplete ?? roleEval.requiredStepsComplete ?? defaultEvaluation.requiredStepsComplete
  };
}

function buildEnvironmentSetup(
  roleAdapter: RoleOnboardingAdapter,
  levelOverlay: LevelOnboardingOverlay
): EnvironmentSetupConfig {
  const hints = levelOverlay.terminalHintOverrides && levelOverlay.terminalHintOverrides.length > 0
    ? levelOverlay.terminalHintOverrides
    : roleAdapter.environmentSetup.terminalHints;
  
  return {
    project: roleAdapter.environmentSetup.project,
    steps: roleAdapter.environmentSetup.baseSteps,
    terminalHints: hints,
    completionMessage: roleAdapter.environmentSetup.completionMessage
  };
}

export function getOnboardingAdapter(role: Role, level: Level): OnboardingAdapter {
  const roleAdapter = roleAdapters[role] || roleAdapters.developer;
  const levelOverlay = levelOverlays[level] || levelOverlays.intern;
  
  return {
    metadata: {
      role,
      level,
      displayName: `${levelOverlay.displayName} ${roleAdapter.displayName}`,
      description: roleAdapter.description,
      competencies: roleAdapter.competencies
    },
    environmentSetup: buildEnvironmentSetup(roleAdapter, levelOverlay),
    uiControls: mergeUIControls(roleAdapter.uiControls, levelOverlay.uiOverrides),
    difficulty: mergeDifficulty(roleAdapter.difficulty, levelOverlay.difficultyOverrides),
    evaluation: mergeEvaluation(roleAdapter.evaluation, levelOverlay.evaluationOverrides),
    learningObjectives: roleAdapter.learningObjectives
  };
}

export function getRoleAdapter(role: Role): RoleOnboardingAdapter {
  return roleAdapters[role] || roleAdapters.developer;
}

export function getLevelOverlay(level: Level): LevelOnboardingOverlay {
  return levelOverlays[level] || levelOverlays.intern;
}

/**
 * Validate a command against the expected step patterns
 */
export function validateCommand(
  command: string,
  step: EnvironmentSetupStep,
  difficulty: OnboardingDifficulty
): CommandValidationResult {
  const trimmedCommand = command.trim();
  
  if (!trimmedCommand) {
    return {
      isValid: false,
      output: '',
      hint: 'Please enter a command',
      nextStepUnlocked: false
    };
  }
  
  for (const pattern of step.validPatterns) {
    if (pattern.test(trimmedCommand)) {
      return {
        isValid: true,
        matchedPattern: pattern.source,
        output: step.successOutput,
        nextStepUnlocked: true
      };
    }
  }
  
  const hint = difficulty.errorRecoveryGuidance ? step.failureHint : undefined;
  
  return {
    isValid: false,
    output: `Command not recognized for this step.`,
    hint,
    nextStepUnlocked: false
  };
}

/**
 * Get hints for the current step based on difficulty level
 */
export function getStepHints(
  step: EnvironmentSetupStep,
  terminalHints: TerminalHint[],
  difficulty: OnboardingDifficulty
): TerminalHint[] {
  if (difficulty.hintDetailLevel === 'none') {
    return [];
  }
  
  const relevantHints = terminalHints.filter(hint => {
    const commandLower = hint.command.toLowerCase();
    const stepIdLower = step.id.toLowerCase();
    return commandLower.includes(stepIdLower) || stepIdLower.includes(commandLower.split(' ')[1] || '');
  });
  
  if (relevantHints.length === 0) {
    return terminalHints.slice(0, 2);
  }
  
  if (difficulty.hintDetailLevel === 'full') {
    return relevantHints;
  }
  
  if (difficulty.hintDetailLevel === 'partial') {
    return relevantHints.map(h => ({ command: h.command, description: h.description }));
  }
  
  return relevantHints.map(h => ({ command: h.command, description: '' }));
}
