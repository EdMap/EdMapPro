/**
 * CompletionDecision Engine
 * 
 * Determines when an interview should continue, prioritize specific topics,
 * or wrap up based on coverage, confidence, time, and telemetry data.
 */

import { 
  StageRuntimeSettings, 
  AssessmentCriterion 
} from "./interview-chains";

// Coverage tracking types (matching orchestrator)
interface CoverageScore {
  score: number;
  notes: string[];
  questionsAsked: number;
}

interface CoverageTracker {
  background: CoverageScore;
  skills: CoverageScore;
  behavioral: CoverageScore;
  motivation: CoverageScore;
  culture_fit: CoverageScore;
  logistics: CoverageScore;
}

// Session telemetry
interface SessionTelemetry {
  startedAt: number;
  firstQuestionAt?: number;
  followUpsUsed: number;
  lowScoreStreak: number;
  highScoreStreak: number;
  avgConfidence: number;
}

// Decision outcomes
export type CompletionAction = 
  | { type: 'continue' }
  | { type: 'prioritize'; topic: AssessmentCriterion; reason: string }
  | { type: 'wrap_up'; reason: WrapUpReason; message?: string };

export type WrapUpReason = 
  | 'sufficient_coverage'      // Enough info collected
  | 'time_limit'               // Approaching max duration
  | 'max_questions'            // Hit question limit
  | 'high_confidence_positive' // Clearly qualified candidate
  | 'high_confidence_negative' // Clearly unqualified candidate
  | 'candidate_fatigue';       // Too many low scores in a row

// Input for the decision engine
export interface CompletionDecisionInput {
  coverage: CoverageTracker;
  telemetry: SessionTelemetry;
  questionsAsked: number;
  stageSettings: StageRuntimeSettings;
  pendingBacklogCount: number; // Questions still pending in backlog
  avgScore: number;            // Average score across all answers
}

// Result includes pacing info for the frontend
export interface CompletionDecisionResult {
  action: CompletionAction;
  pacing: {
    elapsedMs: number;
    elapsedMinutes: number;
    progressPercent: number;  // 0-100 based on time
    status: 'starting' | 'on_track' | 'mid_interview' | 'wrapping_soon' | 'overtime';
    timeRemaining?: string;   // Human-readable time remaining
  };
  coverageSummary: {
    overall: number;
    critical: number;
    gaps: AssessmentCriterion[];
  };
}

/**
 * Analyzes interview state and returns a completion decision
 */
export function evaluateCompletion(input: CompletionDecisionInput): CompletionDecisionResult {
  const { coverage, telemetry, questionsAsked, stageSettings, pendingBacklogCount, avgScore } = input;
  
  // Calculate elapsed time
  const elapsedMs = Date.now() - telemetry.startedAt;
  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  
  // Calculate pacing
  const pacing = calculatePacing(elapsedMs, stageSettings);
  
  // Calculate coverage scores
  const coverageSummary = calculateCoverageSummary(coverage, stageSettings.criticalCriteria);
  
  // Decision logic
  const action = determineAction({
    coverage,
    coverageSummary,
    telemetry,
    questionsAsked,
    stageSettings,
    pendingBacklogCount,
    avgScore,
    elapsedMs,
    pacing
  });
  
  return {
    action,
    pacing,
    coverageSummary
  };
}

function calculatePacing(
  elapsedMs: number, 
  settings: StageRuntimeSettings
): CompletionDecisionResult['pacing'] {
  const { minDurationMs, maxDurationMs } = settings;
  const midPointMs = (minDurationMs + maxDurationMs) / 2;
  
  // Progress as percentage of max duration
  const progressPercent = Math.min(100, Math.round((elapsedMs / maxDurationMs) * 100));
  
  // Determine status
  let status: CompletionDecisionResult['pacing']['status'];
  if (elapsedMs < minDurationMs * 0.3) {
    status = 'starting';
  } else if (elapsedMs < minDurationMs) {
    status = 'on_track';
  } else if (elapsedMs < midPointMs) {
    status = 'mid_interview';
  } else if (elapsedMs < maxDurationMs * 0.9) {
    status = 'wrapping_soon';
  } else {
    status = 'overtime';
  }
  
  // Calculate remaining time
  const remainingMs = Math.max(0, maxDurationMs - elapsedMs);
  const remainingMinutes = Math.ceil(remainingMs / 60000);
  const timeRemaining = remainingMinutes > 0 ? `${remainingMinutes} min remaining` : 'Time up';
  
  return {
    elapsedMs,
    elapsedMinutes: Math.floor(elapsedMs / 60000),
    progressPercent,
    status,
    timeRemaining
  };
}

function calculateCoverageSummary(
  coverage: CoverageTracker,
  criticalCriteria: AssessmentCriterion[]
): CompletionDecisionResult['coverageSummary'] {
  const allCriteria: AssessmentCriterion[] = [
    'background', 'skills', 'behavioral', 'motivation', 'culture_fit', 'logistics'
  ];
  
  // Calculate overall coverage (weighted average)
  let totalScore = 0;
  let count = 0;
  for (const criterion of allCriteria) {
    totalScore += coverage[criterion].score;
    count++;
  }
  const overall = count > 0 ? totalScore / count : 0;
  
  // Calculate critical coverage
  let criticalTotal = 0;
  let criticalCount = 0;
  for (const criterion of criticalCriteria) {
    criticalTotal += coverage[criterion].score;
    criticalCount++;
  }
  const critical = criticalCount > 0 ? criticalTotal / criticalCount : 0;
  
  // Find gaps (criteria with score < 0.3)
  const gaps: AssessmentCriterion[] = [];
  for (const criterion of criticalCriteria) {
    if (coverage[criterion].score < 0.3) {
      gaps.push(criterion);
    }
  }
  
  return { overall, critical, gaps };
}

interface DecisionContext {
  coverage: CoverageTracker;
  coverageSummary: CompletionDecisionResult['coverageSummary'];
  telemetry: SessionTelemetry;
  questionsAsked: number;
  stageSettings: StageRuntimeSettings;
  pendingBacklogCount: number;
  avgScore: number;
  elapsedMs: number;
  pacing: CompletionDecisionResult['pacing'];
}

function determineAction(ctx: DecisionContext): CompletionAction {
  const { coverageSummary, telemetry, questionsAsked, stageSettings, avgScore, elapsedMs, pacing } = ctx;
  const { minQuestions, maxQuestions, sufficiencyThresholds } = stageSettings;
  
  // 1. Hard limit: Max questions reached
  if (questionsAsked >= maxQuestions) {
    return { 
      type: 'wrap_up', 
      reason: 'max_questions',
      message: "We've covered a lot of ground today"
    };
  }
  
  // 2. Time limit: Approaching or exceeding max duration
  if (pacing.status === 'overtime') {
    return { 
      type: 'wrap_up', 
      reason: 'time_limit',
      message: "We're running up against our time limit"
    };
  }
  
  // 3. Candidate fatigue: Too many consecutive low scores
  if (telemetry.lowScoreStreak >= 3 && questionsAsked >= minQuestions) {
    return { 
      type: 'wrap_up', 
      reason: 'candidate_fatigue',
      message: "I think I have a good sense of your background"
    };
  }
  
  // 4. High confidence negative: Low average and consistent pattern
  if (avgScore < 4 && questionsAsked >= minQuestions && telemetry.lowScoreStreak >= 2) {
    return { 
      type: 'wrap_up', 
      reason: 'high_confidence_negative',
      message: "I appreciate you taking the time to speak with me today"
    };
  }
  
  // 5. High confidence positive: Excellent performance
  if (avgScore >= 8 && telemetry.highScoreStreak >= 3 && questionsAsked >= minQuestions) {
    // Check if we have sufficient coverage too
    if (coverageSummary.overall >= sufficiencyThresholds.overall && 
        coverageSummary.critical >= sufficiencyThresholds.critical) {
      return { 
        type: 'wrap_up', 
        reason: 'high_confidence_positive',
        message: "I'm really impressed with what you've shared"
      };
    }
  }
  
  // 6. Sufficient coverage: Met all thresholds
  if (questionsAsked >= minQuestions &&
      coverageSummary.overall >= sufficiencyThresholds.overall &&
      coverageSummary.critical >= sufficiencyThresholds.critical) {
    return { 
      type: 'wrap_up', 
      reason: 'sufficient_coverage',
      message: "I have a great picture of your experience"
    };
  }
  
  // 7. Approaching time limit with gaps - prioritize critical topics
  if (pacing.status === 'wrapping_soon' && coverageSummary.gaps.length > 0) {
    const priorityTopic = coverageSummary.gaps[0];
    return { 
      type: 'prioritize', 
      topic: priorityTopic,
      reason: `Let's focus our remaining time on ${formatCriterion(priorityTopic)}`
    };
  }
  
  // 8. Default: Continue normally
  return { type: 'continue' };
}

function formatCriterion(criterion: AssessmentCriterion): string {
  const labels: Record<AssessmentCriterion, string> = {
    background: 'your background',
    skills: 'your technical skills',
    behavioral: 'how you work in teams',
    motivation: 'what motivates you',
    culture_fit: 'your work style',
    logistics: 'logistics like availability'
  };
  return labels[criterion] || criterion;
}

/**
 * Generate a natural pacing notice for the interviewer to say
 */
export function generatePacingNotice(
  pacing: CompletionDecisionResult['pacing'],
  gaps: AssessmentCriterion[]
): string | null {
  // Only generate notices when wrapping soon with gaps
  if (pacing.status !== 'wrapping_soon' || gaps.length === 0) {
    return null;
  }
  
  const topicLabel = formatCriterion(gaps[0]);
  return `Before we wrap up, I'd like to touch on ${topicLabel}.`;
}

/**
 * Get the wrap-up message for the closure chain
 */
export function getWrapUpMessage(reason: WrapUpReason): string {
  switch (reason) {
    case 'sufficient_coverage':
      return "I have a great picture of your experience and qualifications.";
    case 'time_limit':
      return "We're running up against our time, but I've learned a lot about you.";
    case 'max_questions':
      return "We've covered a lot of ground in our conversation.";
    case 'high_confidence_positive':
      return "I'm really impressed with everything you've shared.";
    case 'high_confidence_negative':
      return "I appreciate you taking the time to speak with me today.";
    case 'candidate_fatigue':
      return "I think I have a good understanding of your background now.";
    default:
      return "Thank you for the great conversation.";
  }
}

/**
 * Stage runtime configuration for frontend pacing display
 */
export interface StageRuntimeConfig {
  minTimeMinutes: number;
  maxTimeMinutes: number;
  targetTimeMinutes: number;
}

/**
 * Get stage runtime config from interview type for frontend pacing
 */
export function getStageRuntimeConfig(interviewType: 'hr' | 'technical' | 'final'): StageRuntimeConfig {
  switch (interviewType) {
    case 'hr':
      return { minTimeMinutes: 15, maxTimeMinutes: 30, targetTimeMinutes: 22 };
    case 'technical':
      return { minTimeMinutes: 35, maxTimeMinutes: 55, targetTimeMinutes: 45 };
    case 'final':
      return { minTimeMinutes: 25, maxTimeMinutes: 40, targetTimeMinutes: 32 };
    default:
      return { minTimeMinutes: 15, maxTimeMinutes: 30, targetTimeMinutes: 22 };
  }
}
