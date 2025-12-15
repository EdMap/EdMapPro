/**
 * Sprint Tier Overlays
 * 
 * Applied on top of Role + Level configuration to control ownership level
 * based on demonstrated competency. Users earn advancement through performance.
 */

import type { TierPlanningOverlay, SprintTier, TierAdvancementMessaging } from '../types';

export const observerTierOverlay: TierPlanningOverlay = {
  tier: 'observer',
  displayName: 'Observer',
  description: 'Watch and learn how the team plans sprints',
  engagementOverrides: {
    mode: 'shadow',
    autoStartConversation: true,
    teamTalkRatio: 0.8,
    phaseEngagement: {
      context: 'observe',
      discussion: 'observe',
      commitment: 'observe'
    }
  },
  uiOverrides: {
    showPriorityEditor: false,
    showEstimationSliders: false,
    canSkipPhases: false
  },
  promptModifiers: {
    ownershipLevel: 'The user is observing this planning session. They are learning how planning works. Keep them engaged by occasionally asking if they have questions, but do not expect them to lead any discussions.',
    responseExpectation: 'User responses should be acknowledged warmly. Focus on explaining concepts and welcoming questions.'
  },
  advanceMessage: "You've been promoted! Your team noticed your engagement during planning. Next sprint, you'll help with estimation and discussion.",
  practiceMessage: "You're building mastery! Keep observing and asking questions. We'll check your understanding again next sprint."
};

export const coFacilitatorTierOverlay: TierPlanningOverlay = {
  tier: 'co_facilitator',
  displayName: 'Co-Facilitator',
  description: 'Participate actively in planning with team guidance',
  engagementOverrides: {
    mode: 'guided',
    autoStartConversation: false,
    teamTalkRatio: 0.6,
    phaseEngagement: {
      context: 'respond',
      discussion: 'respond',
      commitment: 'observe'
    }
  },
  uiOverrides: {
    showPriorityEditor: false,
    showEstimationSliders: true,
    canSkipPhases: false
  },
  promptModifiers: {
    ownershipLevel: 'The user is a co-facilitator in this planning session. They should actively participate in estimation and discussion. Guide them when needed but let them contribute meaningfully.',
    responseExpectation: 'User should contribute to estimation discussions and share opinions. Provide feedback on their contributions and gently correct if needed.'
  },
  advanceMessage: "Excellent work! You've demonstrated strong planning skills. Next sprint, you'll take the lead on discussions and commitment.",
  practiceMessage: "You're making progress! Keep practicing estimation and discussion skills. Focus on these areas: "
};

export const emergingLeaderTierOverlay: TierPlanningOverlay = {
  tier: 'emerging_leader',
  displayName: 'Emerging Leader',
  description: 'Lead planning with team backup available',
  engagementOverrides: {
    mode: 'active',
    autoStartConversation: false,
    teamTalkRatio: 0.4,
    phaseEngagement: {
      context: 'lead',
      discussion: 'lead',
      commitment: 'lead'
    }
  },
  uiOverrides: {
    showPriorityEditor: true,
    showEstimationSliders: true,
    canSkipPhases: true
  },
  promptModifiers: {
    ownershipLevel: 'The user is leading this planning session. They should drive the discussion, estimation, and commitment. Provide support only when asked or if they seem stuck.',
    responseExpectation: 'User should lead discussions and make decisions. Team provides input when asked. Treat user as a peer.'
  },
  advanceMessage: "You've mastered sprint planning! You're ready for more advanced challenges.",
  practiceMessage: "You're doing well as a leader! Continue refining your facilitation skills. Focus on: "
};

const tierOverlays: Record<SprintTier, TierPlanningOverlay> = {
  observer: observerTierOverlay,
  co_facilitator: coFacilitatorTierOverlay,
  emerging_leader: emergingLeaderTierOverlay
};

export function getTierOverlay(tier: SprintTier): TierPlanningOverlay {
  return tierOverlays[tier] || tierOverlays.observer;
}

export function getNextTier(currentTier: SprintTier): SprintTier | null {
  switch (currentTier) {
    case 'observer': return 'co_facilitator';
    case 'co_facilitator': return 'emerging_leader';
    case 'emerging_leader': return null;
    default: return null;
  }
}

export function getTierAdvancementMessaging(): TierAdvancementMessaging {
  return {
    advanceTitle: "You've Been Promoted!",
    advanceDescription: "Your team noticed your contributions during planning sessions. You'll take on more responsibility this sprint.",
    practiceTitle: "Building Mastery",
    practiceDescription: "You're developing your planning skills. This sprint includes focused practice opportunities.",
    practiceObjectivesIntro: "Focus areas for this sprint:"
  };
}

export { tierOverlays };

/**
 * Tier-specific rubric weights for tier advancement scoring
 * Each role has different priorities for what makes a good planning participant
 * Note: Different from RoleRubricWeights in types.ts which defines role config
 */
export interface TierRubricScores {
  participation: number;      // Active engagement in discussion
  estimation: number;         // Accuracy and contribution to estimation
  prioritization: number;     // Understanding of priority decisions
  goalFormulation: number;    // Contribution to sprint goal
  technicalClarity: number;   // Clear communication of technical concerns
  testCoverage: number;       // QA-specific: coverage of test scenarios
}

const developerTierRubric: TierRubricScores = {
  participation: 0.20,
  estimation: 0.35,           // Developers focus on estimation accuracy
  prioritization: 0.15,
  goalFormulation: 0.10,
  technicalClarity: 0.20,
  testCoverage: 0.00
};

const pmTierRubric: TierRubricScores = {
  participation: 0.15,
  estimation: 0.10,
  prioritization: 0.30,       // PMs focus on prioritization
  goalFormulation: 0.35,      // and goal formulation
  technicalClarity: 0.10,
  testCoverage: 0.00
};

const qaTierRubric: TierRubricScores = {
  participation: 0.20,
  estimation: 0.15,
  prioritization: 0.15,
  goalFormulation: 0.10,
  technicalClarity: 0.10,
  testCoverage: 0.30          // QA focuses on test coverage questions
};

const tierRubricByRole: Record<string, TierRubricScores> = {
  developer: developerTierRubric,
  pm: pmTierRubric,
  qa: qaTierRubric
};

export function getTierRubricScores(role: string): TierRubricScores {
  return tierRubricByRole[role] || developerTierRubric;
}

/**
 * Calculate tier readiness score based on role-weighted rubric
 */
export function calculateTierReadinessScore(
  role: string,
  scores: Partial<TierRubricScores>
): number {
  const weights = getTierRubricScores(role);
  let totalScore = 0;
  let totalWeight = 0;
  
  for (const [key, weight] of Object.entries(weights)) {
    const score = scores[key as keyof TierRubricScores] ?? 0;
    totalScore += score * weight;
    totalWeight += weight;
  }
  
  return totalWeight > 0 ? Math.round(totalScore / totalWeight * 100) : 0;
}
