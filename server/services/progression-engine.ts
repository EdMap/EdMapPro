import { storage } from "../storage";
import type {
  UserJourney,
  JourneyArc,
  Sprint,
  SprintActivity,
  CompetencyLedger,
  CompetencySnapshot,
  ReadinessScore,
  MasteryBand,
  DifficultyBand,
  ProgressionRequirements,
  SprintTier,
  TierStatus,
  TierAdvancementDecision,
  PlanningSessionAssessment,
} from "@shared/schema";
import { getRoleRubricWeights } from "@shared/adapters/planning/tiers";

interface CompetencyDeltaInput {
  userId: number;
  journeyId: number;
  competencySlug: string;
  source: 'workspace' | 'interview';
  evidenceType: string;
  evidenceData?: Record<string, unknown>;
  score?: number;
  activityId?: number;
}

interface DeltaResult {
  competencySlug: string;
  previousBand: MasteryBand;
  newBand: MasteryBand;
  bandChanged: boolean;
  previousConfidence: number;
  newConfidence: number;
  evidenceCount: number;
}

interface ExitEligibility {
  canExit: boolean;
  reasons: {
    minSprintsMet: boolean;
    readinessThresholdMet: boolean;
    maxSprintsReached: boolean;
    userCanChoose: boolean;
  };
  recommendation: 'continue' | 'ready' | 'suggest_exit';
  message: string;
}

interface SprintCompletionResult {
  arc: JourneyArc;
  sprint: Sprint;
  snapshot: CompetencySnapshot;
  exitEligibility: ExitEligibility;
  nextAction: 'start_new_sprint' | 'proceed_to_graduation' | 'continue_sprint';
}

class ProgressionEngine {
  private readonly BAND_WEIGHTS: Record<MasteryBand, number> = {
    'explorer': 1,
    'contributor': 2,
    'junior_ready': 3
  };

  private readonly DIFFICULTY_MULTIPLIERS: Record<DifficultyBand, number> = {
    'guided': 0.8,
    'supported': 1.0,
    'independent': 1.2,
    'expert': 1.4
  };

  async calculateDelta(input: CompetencyDeltaInput): Promise<DeltaResult> {
    const competency = await storage.getCompetency(input.competencySlug);
    if (!competency) {
      throw new Error(`Competency not found: ${input.competencySlug}`);
    }

    let ledgerEntry = await storage.getUserCompetencyEntry(input.userId, competency.id);

    if (!ledgerEntry) {
      ledgerEntry = await storage.createCompetencyEntry({
        userId: input.userId,
        competencyId: competency.id,
        currentBand: 'explorer',
        evidenceCount: 0,
        confidence: 0,
        history: []
      });
    }

    const previousBand = ledgerEntry.currentBand as MasteryBand;
    const previousConfidence = ledgerEntry.confidence;
    const previousEvidenceCount = ledgerEntry.evidenceCount;

    const journey = await storage.getJourney(input.journeyId);
    const currentArc = journey?.currentArcId 
      ? await storage.getJourneyArc(journey.currentArcId)
      : null;
    
    const difficultyBand = (currentArc?.difficultyBand as DifficultyBand) || 'guided';
    const difficultyMultiplier = this.DIFFICULTY_MULTIPLIERS[difficultyBand];

    const baseConfidenceGain = input.score 
      ? Math.round((input.score / 100) * 10 * difficultyMultiplier)
      : Math.round(5 * difficultyMultiplier);
    
    let newConfidence = Math.min(100, previousConfidence + baseConfidenceGain);
    let newBand: MasteryBand = previousBand;

    if (previousBand === 'explorer' && newConfidence >= 40) {
      newBand = 'contributor';
      newConfidence = Math.max(0, newConfidence - 40);
    } else if (previousBand === 'contributor' && newConfidence >= 70) {
      newBand = 'junior_ready';
      newConfidence = Math.max(0, newConfidence - 70);
    }

    const historyEntry = {
      timestamp: new Date().toISOString(),
      journeyId: input.journeyId,
      activityId: input.activityId,
      source: input.source,
      evidenceType: input.evidenceType,
      score: input.score,
      confidenceGain: baseConfidenceGain,
      bandBefore: previousBand,
      bandAfter: newBand
    };

    const currentHistory = ledgerEntry.history as unknown[];
    await storage.updateCompetencyEntry(ledgerEntry.id, {
      currentBand: newBand,
      confidence: newConfidence,
      evidenceCount: previousEvidenceCount + 1,
      lastEvidenceAt: new Date(),
      history: [...currentHistory, historyEntry]
    });

    return {
      competencySlug: input.competencySlug,
      previousBand,
      newBand,
      bandChanged: previousBand !== newBand,
      previousConfidence,
      newConfidence,
      evidenceCount: previousEvidenceCount + 1
    };
  }

  async calculateMultipleDeltas(
    userId: number,
    journeyId: number,
    competencySlugs: string[],
    source: 'workspace' | 'interview',
    evidenceType: string,
    score?: number,
    activityId?: number
  ): Promise<DeltaResult[]> {
    const results: DeltaResult[] = [];

    for (const slug of competencySlugs) {
      try {
        const result = await this.calculateDelta({
          userId,
          journeyId,
          competencySlug: slug,
          source,
          evidenceType,
          score,
          activityId
        });
        results.push(result);
      } catch (error) {
        console.error(`Failed to calculate delta for ${slug}:`, error);
      }
    }

    return results;
  }

  async calculateReadinessScore(userId: number): Promise<ReadinessScore> {
    return await storage.getUserReadiness(userId);
  }

  async checkExitEligibility(journeyId: number): Promise<ExitEligibility> {
    const journey = await storage.getJourney(journeyId);
    if (!journey) {
      throw new Error(`Journey not found: ${journeyId}`);
    }

    const progressionPath = await storage.getProgressionPathById(journey.progressionPathId);
    if (!progressionPath) {
      throw new Error(`Progression path not found: ${journey.progressionPathId}`);
    }

    const requirements = progressionPath.requirements as ProgressionRequirements;
    const minSprints = requirements.minSprints || 2;
    const maxSprints = requirements.maxSprints || 8;
    const readinessThreshold = requirements.readinessThreshold || 85;

    const readiness = await storage.getUserReadiness(journey.userId);
    const currentReadiness = readiness.overallScore;

    const minSprintsMet = journey.completedSprints >= minSprints;
    const readinessThresholdMet = currentReadiness >= readinessThreshold;
    const maxSprintsReached = journey.completedSprints >= maxSprints;
    const userCanChoose = minSprintsMet;

    const canExit = minSprintsMet && (readinessThresholdMet || maxSprintsReached);

    let recommendation: 'continue' | 'ready' | 'suggest_exit';
    let message: string;

    if (maxSprintsReached) {
      recommendation = 'suggest_exit';
      message = `You've completed ${journey.completedSprints} sprints - time to graduate and showcase your skills!`;
    } else if (readinessThresholdMet && minSprintsMet) {
      recommendation = 'ready';
      message = `Congratulations! You've reached ${currentReadiness}% readiness. You're ready to graduate!`;
    } else if (minSprintsMet) {
      recommendation = 'continue';
      message = `You're at ${currentReadiness}% readiness. Continue to reach ${readinessThreshold}%, or graduate now if you feel ready.`;
    } else {
      recommendation = 'continue';
      message = `Complete ${minSprints - journey.completedSprints} more sprint(s) before graduation becomes available.`;
    }

    return {
      canExit,
      reasons: {
        minSprintsMet,
        readinessThresholdMet,
        maxSprintsReached,
        userCanChoose
      },
      recommendation,
      message
    };
  }

  async completeActivity(
    journeyId: number,
    activityId: number,
    userResponse: unknown,
    evaluation: { score?: number; feedback?: string; competencies?: string[] }
  ): Promise<{ activity: SprintActivity; deltas: DeltaResult[] }> {
    const activity = await storage.getSprintActivity(activityId);
    if (!activity) {
      throw new Error(`Activity not found: ${activityId}`);
    }

    const journey = await storage.getJourney(journeyId);
    if (!journey) {
      throw new Error(`Journey not found: ${journeyId}`);
    }

    const updatedActivity = await storage.updateSprintActivity(activityId, {
      status: 'completed',
      userResponse,
      evaluation,
      completedAt: new Date()
    });

    let deltas: DeltaResult[] = [];
    const competencies = evaluation.competencies || activity.competencyTags || [];
    
    if (competencies.length > 0) {
      deltas = await this.calculateMultipleDeltas(
        journey.userId,
        journeyId,
        competencies,
        'workspace',
        activity.activityType,
        evaluation.score,
        activityId
      );
    }

    await storage.updateJourney(journeyId, { lastActivityAt: new Date() });

    const readiness = await this.calculateReadinessScore(journey.userId);
    await storage.updateJourney(journeyId, { readinessScore: readiness.overallScore });

    return { activity: updatedActivity!, deltas };
  }

  async completeSprint(journeyId: number): Promise<SprintCompletionResult> {
    const journey = await storage.getJourney(journeyId);
    if (!journey) {
      throw new Error(`Journey not found: ${journeyId}`);
    }

    const currentArc = await storage.getCurrentArc(journeyId);
    if (!currentArc) {
      throw new Error('No active arc found');
    }

    const sprint = await storage.getSprintByArc(currentArc.id);
    if (!sprint) {
      throw new Error('No sprint found for current arc');
    }

    await storage.updateJourneyArc(currentArc.id, {
      status: 'completed',
      completedAt: new Date()
    });

    // Only increment completedSprints here, NOT currentSprintNumber
    // currentSprintNumber is updated in startNewSprint when the next sprint is created
    // This fixes the off-by-one bug where sprint numbers were double-incremented
    const newCompletedSprints = journey.completedSprints + 1;
    await storage.updateJourney(journeyId, {
      completedSprints: newCompletedSprints
    });

    const readiness = await this.calculateReadinessScore(journey.userId);
    const snapshot = await storage.createCompetencySnapshot({
      userId: journey.userId,
      journeyId,
      arcId: currentArc.id,
      sprintId: sprint.id,
      snapshotType: 'sprint_end',
      readinessScore: readiness.overallScore,
      competencyScores: readiness.competencyBreakdown.reduce((acc, c) => {
        acc[c.slug] = { band: c.band, confidence: c.confidence, score: c.evidenceCount };
        return acc;
      }, {} as Record<string, { band: string; confidence: number; score: number }>),
      strengths: readiness.strengths,
      gaps: readiness.gaps
    });

    await storage.updateJourney(journeyId, { readinessScore: readiness.overallScore });

    const exitEligibility = await this.checkExitEligibility(journeyId);

    let nextAction: 'start_new_sprint' | 'proceed_to_graduation' | 'continue_sprint';
    if (exitEligibility.reasons.maxSprintsReached) {
      nextAction = 'proceed_to_graduation';
    } else if (exitEligibility.recommendation === 'ready') {
      nextAction = 'proceed_to_graduation';
    } else {
      nextAction = 'start_new_sprint';
    }

    return {
      arc: currentArc,
      sprint,
      snapshot,
      exitEligibility,
      nextAction
    };
  }

  async getDifficultyForSprint(
    progressionPathId: number,
    sprintNumber: number
  ): Promise<DifficultyBand> {
    const progressionPath = await storage.getProgressionPathById(progressionPathId);
    if (!progressionPath) {
      return 'guided';
    }

    const progression = progressionPath.difficultyProgression as {
      sprints?: { number: number; band: DifficultyBand }[];
      default?: DifficultyBand;
    };

    if (progression.sprints) {
      const match = progression.sprints.find(s => s.number === sprintNumber);
      if (match) return match.band;

      const sorted = progression.sprints.sort((a, b) => a.number - b.number);
      for (let i = sorted.length - 1; i >= 0; i--) {
        if (sorted[i].number <= sprintNumber) {
          return sorted[i].band;
        }
      }
    }

    return progression.default || 'guided';
  }

  async getProgressionSummary(journeyId: number): Promise<{
    journey: UserJourney;
    readiness: ReadinessScore;
    exitEligibility: ExitEligibility;
    snapshots: CompetencySnapshot[];
    arcs: JourneyArc[];
  }> {
    const journey = await storage.getJourney(journeyId);
    if (!journey) {
      throw new Error(`Journey not found: ${journeyId}`);
    }

    const readiness = await this.calculateReadinessScore(journey.userId);
    const exitEligibility = await this.checkExitEligibility(journeyId);
    const snapshots = await storage.getCompetencySnapshots(journeyId);
    const arcs = await storage.getJourneyArcs(journeyId);

    return {
      journey,
      readiness,
      exitEligibility,
      snapshots,
      arcs
    };
  }

  async startNewSprint(journeyId: number): Promise<{
    sprint: Sprint;
    arc: JourneyArc;
    generatedBacklog: {
      tickets: Array<{
        templateId: string;
        type: string;
        day: number;
        generatedTicket: {
          title: string;
          description: string;
          acceptanceCriteria: string[];
          difficulty: string;
        };
      }>;
      softSkillEvents: Array<{
        templateId: string;
        day: number;
        trigger: string;
        generatedScenario: {
          setup: string;
          message: string;
          sender: string;
          senderRole: string;
        };
      }>;
      theme: { id: string; name: string; description: string };
    };
  }> {
    const { sprintGenerator } = await import("./sprint-generator");
    
    const journey = await storage.getJourney(journeyId);
    if (!journey) {
      throw new Error(`Journey not found: ${journeyId}`);
    }

    if (!journey.progressionPathId) {
      throw new Error(`Journey ${journeyId} has no progression path configured`);
    }

    const previousSprints = await storage.getSprintsByJourney(journeyId);
    
    let readiness;
    try {
      readiness = await this.calculateReadinessScore(journey.userId);
    } catch (error) {
      console.warn(`Failed to calculate readiness for journey ${journeyId}, using empty gaps:`, error);
      readiness = { gaps: [] as string[], strengths: [], overallScore: 0, competencyBreakdown: [] };
    }
    
    const newSprintNumber = (journey.currentSprintNumber || 0) + 1;
    const difficultyBand = await this.getDifficultyForSprint(
      journey.progressionPathId,
      newSprintNumber
    );

    const generatedBacklog = await sprintGenerator.generateSprint({
      journeyId,
      sprintNumber: newSprintNumber,
      difficultyBand,
      previousSprints: previousSprints as any[],
      userCompetencyGaps: readiness.gaps,
      avoidThemes: [],
      avoidTemplates: []
    });

    const arcs = await storage.getJourneyArcs(journeyId);
    const newArcOrder = arcs.length + 1;

    const arc = await storage.createJourneyArc({
      journeyId,
      name: `Sprint ${newSprintNumber}`,
      arcType: 'sprint',
      arcOrder: newArcOrder,
      status: 'active',
      difficultyBand,
      durationDays: 5,
      arcData: {
        theme: generatedBacklog.theme,
        ceremonies: generatedBacklog.ceremonies
      }
    });

    const sprint = await storage.createSprint({
      arcId: arc.id,
      sprintNumber: newSprintNumber,
      goal: `Complete ${generatedBacklog.theme.name} sprint objectives`,
      theme: generatedBacklog.theme.name,
      backlog: generatedBacklog.tickets,
      userTickets: generatedBacklog.tickets.filter((t: any) => t.type === 'bug' || t.type === 'feature'),
      teamTickets: [],
      ceremonies: generatedBacklog.ceremonies,
      generationMetadata: {
        themeId: generatedBacklog.theme.id,
        usedTemplateIds: [
          ...generatedBacklog.tickets.map((t: any) => t.templateId),
          ...generatedBacklog.softSkillEvents.map((e: any) => e.templateId)
        ],
        difficultyBand,
        generatedAt: new Date().toISOString()
      }
    });

    await storage.updateJourney(journeyId, {
      currentArcId: arc.id,
      currentSprintNumber: newSprintNumber
    });

    return {
      sprint,
      arc,
      generatedBacklog
    };
  }

  /**
   * Compute next tier based on assessment history
   * Requires 2 consecutive sessions scoring ≥70 to advance
   */
  async computeNextTier(
    journeyId: number,
    role: string,
    currentTier: SprintTier
  ): Promise<{ nextTier: SprintTier; tierStatus: TierStatus; decision: TierAdvancementDecision }> {
    const { getNextTier } = await import("@shared/adapters/planning/tiers");
    
    // Get recent assessments for this journey at this tier
    const assessments = await storage.getPlanningAssessmentsByJourney(journeyId, currentTier);
    
    // Need at least 2 assessments to consider advancement
    if (assessments.length < 2) {
      return {
        nextTier: currentTier,
        tierStatus: assessments.length === 0 ? 'first_attempt' : 'practicing',
        decision: 'pending'
      };
    }
    
    // Check last 2 consecutive sessions
    const lastTwo = assessments.slice(-2);
    const bothPassed = lastTwo.every(a => a.tierReadinessScore >= 70);
    
    if (bothPassed) {
      const nextTier = getNextTier(currentTier);
      if (nextTier) {
        return {
          nextTier,
          tierStatus: 'first_attempt',
          decision: 'advance'
        };
      } else {
        // Already at highest tier
        return {
          nextTier: currentTier,
          tierStatus: 'mastered',
          decision: 'advance'
        };
      }
    }
    
    return {
      nextTier: currentTier,
      tierStatus: 'practicing',
      decision: 'practice_more'
    };
  }

  /**
   * Archive old planning sessions when starting a new sprint
   * This prevents orphaned sessions and keeps the database clean
   */
  async archiveOldPlanningSessions(workspaceId: number): Promise<number> {
    return await storage.archivePlanningSessions(workspaceId);
  }

  /**
   * Record a planning session assessment for tier progression tracking
   */
  async recordPlanningAssessment(
    sessionId: number,
    sprintId: number,
    journeyId: number,
    tier: SprintTier,
    score: number,
    rubricBreakdown: Record<string, number>,
    practiceObjectives?: string[]
  ): Promise<PlanningSessionAssessment> {
    const decision = score >= 70 ? 'pending' : 'practice_more';
    
    return await storage.createPlanningAssessment({
      sessionId,
      sprintId,
      journeyId,
      tier,
      tierReadinessScore: score,
      rubricBreakdown,
      advancementDecision: decision,
      practiceObjectives
    });
  }
}

export const progressionEngine = new ProgressionEngine();
