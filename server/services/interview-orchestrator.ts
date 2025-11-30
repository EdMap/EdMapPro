import {
  QuestionGeneratorChain,
  EvaluatorChain,
  FollowUpChain,
  ScoringChain,
  IntroductionChain,
  ReflectionChain,
  ClosureChain,
  WrapupChain,
  GreetingChain,
  IntroExchangeChain,
  SelfIntroChain,
  PreparationPlannerChain,
  TriageChain,
  UnifiedInterviewTurnChain,
  UnifiedTurnInput,
  UnifiedTurnOutput,
  InterviewConfig,
  QuestionContext,
  EvaluationResult,
  FollowUpDecision,
  FinalReport,
  InterviewStage,
  InterviewPlan,
  PlannedQuestion,
  TriageDecision,
  StageRuntimeSettings,
  getInterviewStage,
  getPreludeStage,
  shouldGenerateReflection,
  getStageSettings,
} from "./interview-chains";

const USE_UNIFIED_CHAIN = true;
import { storage } from "../storage";
import type { InterviewSession, InterviewQuestion } from "@shared/schema";
import { responseClassifier, CandidateIntent, ClassificationResult } from "./response-classifier";
import { responseHandler } from "./response-handler";
import { 
  evaluateCompletion, 
  CompletionDecisionResult, 
  CompletionAction,
  generatePacingNotice,
  getWrapUpMessage,
  getStageRuntimeConfig,
  StageRuntimeConfig
} from "./completion-decision";
import { 
  TeamInterviewTurnChain, 
  TeamInterviewGreetingChain,
  getTeamInterviewSettings,
  getLevelExpectationsText,
} from "./team-interview-chain";
import { 
  selectQuestionsForInterview,
  TeamInterviewQuestion,
} from "./team-interview-questions";
import { 
  ExperienceLevel,
  TeamInterviewSettings,
  TEAM_INTERVIEW_PRESETS,
} from "@shared/schema";

export interface JobContext {
  companyName?: string;
  companyDescription?: string;
  jobTitle?: string;
  jobRequirements?: string;
  candidateCv?: string;
}

// Assessment criteria for dynamic interview completion
export type AssessmentCriterion = 
  | 'background'      // Professional background & roles
  | 'skills'          // Core competencies vs. role requirements
  | 'behavioral'      // Behavioral & collaboration examples
  | 'motivation'      // Motivation & career goals
  | 'culture_fit'     // Cultural/team fit
  | 'logistics';      // Availability, salary, visa status

interface CoverageScore {
  score: number;        // 0-1 coverage level
  notes: string[];      // Key points gathered
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

// Thresholds for determining interview sufficiency
const SUFFICIENCY_CONFIG = {
  maxQuestions: 15,              // Hard limit
  timeWarningThreshold: 0.75,    // Warn at 75% of max questions
  criticalThreshold: 0.6,        // Minimum coverage for critical areas
  overallThreshold: 0.7,         // Overall sufficiency threshold
  criticalAreas: ['background', 'skills', 'motivation'] as AssessmentCriterion[],
};

// Session telemetry for dynamic interview flow
interface SessionTelemetry {
  startedAt: number;            // Unix timestamp when interview started
  firstQuestionAt?: number;     // Unix timestamp when first core question was asked
  followUpsUsed: number;        // Number of follow-up questions asked
  lowScoreStreak: number;       // Consecutive answers with score < 4
  highScoreStreak: number;      // Consecutive answers with score >= 8
  avgConfidence: number;        // Running average of evaluator confidence
}

interface ConversationMemory {
  questions: string[];
  answers: string[];
  scores: number[];
  evaluations: EvaluationResult[];
  activeProject: string | null;
  projectMentionCount: number;
  jobContext?: JobContext;
  lastReflection: string;
  currentStage: InterviewStage;
  preludeStep: number; // 0 = greeting, 1 = intro exchange, 2 = self-intro, 3+ = questions
  preludeResponses: string[]; // Store candidate's prelude responses
  candidateName?: string;
  candidateWentFirst?: boolean; // Track if candidate introduced themselves first
  awaitingCandidateIntro?: boolean; // Waiting for candidate to share their intro
  lastQuestionAsked?: string; // Track the last question for response classification
  lastCandidateIntent?: CandidateIntent; // Last classified intent
  // Dynamic interview completion tracking
  coverage: CoverageTracker;
  totalQuestionsAsked: number;
  timeWarningGiven: boolean;
  // Pre-planned interview structure
  interviewPlan?: InterviewPlan;
  currentQuestionId?: string; // ID of the question currently being asked
  pendingFollowUp?: string; // Follow-up question to ask if response was partial/vague
  pendingCandidateQuestion?: string; // Question the candidate asked that needs answering
  // Session telemetry for dynamic completion
  telemetry: SessionTelemetry;
  // Track question repeats to prevent infinite loops (max 2 repeats before moving on)
  currentQuestionRepeatCount: number;
  // Track consecutive minimal/negative responses to force topic change
  consecutiveMinimalResponses: number;
  // Flag to force switching to a completely different topic after repeated refusals
  forceTopicSwitch?: boolean;
  // Track consecutive follow-ups on the same criterion to prevent repetitive questioning
  consecutiveCriterionProbes: {
    criterion: AssessmentCriterion | null;
    count: number;
  };
  // Unified chain: conversation history for context
  conversationHistory: Array<{ role: 'interviewer' | 'candidate'; content: string; personaId?: string }>;
  // Team interview specific fields
  isTeamInterview?: boolean;
  teamSettings?: import('@shared/schema').TeamInterviewSettings;
  activePersonaId?: string;
  personaQuestionCounts?: Record<string, number>;
  teamQuestionBacklog?: import('./team-interview-questions').TeamInterviewQuestion[];
  // Two-phase wrap-up: Wait for candidate response to "any questions?" before finalizing
  pendingWrapUp?: {
    wrapUpReason: string;
    timestamp: number;
    closurePromptAsked: boolean; // True if we asked "any questions?"
  };
}

export class InterviewOrchestrator {
  private questionGenerator: QuestionGeneratorChain;
  private evaluator: EvaluatorChain;
  private followUp: FollowUpChain;
  private scoring: ScoringChain;
  private introduction: IntroductionChain;
  private reflection: ReflectionChain;
  private closure: ClosureChain;
  private wrapup: WrapupChain;
  private greeting: GreetingChain;
  private introExchange: IntroExchangeChain;
  private selfIntro: SelfIntroChain;
  private preparationPlanner: PreparationPlannerChain;
  private triage: TriageChain;
  private unifiedTurn: UnifiedInterviewTurnChain;
  private teamTurn: TeamInterviewTurnChain;
  private teamGreeting: TeamInterviewGreetingChain;
  private memory: Map<number, ConversationMemory>;

  constructor() {
    this.questionGenerator = new QuestionGeneratorChain();
    this.evaluator = new EvaluatorChain();
    this.followUp = new FollowUpChain();
    this.scoring = new ScoringChain();
    this.introduction = new IntroductionChain();
    this.reflection = new ReflectionChain();
    this.closure = new ClosureChain();
    this.wrapup = new WrapupChain();
    this.greeting = new GreetingChain();
    this.introExchange = new IntroExchangeChain();
    this.selfIntro = new SelfIntroChain();
    this.preparationPlanner = new PreparationPlannerChain();
    this.triage = new TriageChain();
    this.unifiedTurn = new UnifiedInterviewTurnChain();
    this.teamTurn = new TeamInterviewTurnChain();
    this.teamGreeting = new TeamInterviewGreetingChain();
    this.memory = new Map();
  }

  private initializeCoverage(): CoverageTracker {
    const emptyCoverage = (): CoverageScore => ({
      score: 0,
      notes: [],
      questionsAsked: 0,
    });
    return {
      background: emptyCoverage(),
      skills: emptyCoverage(),
      behavioral: emptyCoverage(),
      motivation: emptyCoverage(),
      culture_fit: emptyCoverage(),
      logistics: emptyCoverage(),
    };
  }

  private initializeTelemetry(): SessionTelemetry {
    return {
      startedAt: Date.now(),
      followUpsUsed: 0,
      lowScoreStreak: 0,
      highScoreStreak: 0,
      avgConfidence: 0,
    };
  }

  private getMemory(sessionId: number): ConversationMemory {
    if (!this.memory.has(sessionId)) {
      this.memory.set(sessionId, {
        questions: [],
        answers: [],
        scores: [],
        evaluations: [],
        activeProject: null,
        projectMentionCount: 0,
        lastReflection: "None yet",
        currentStage: "greeting",
        preludeStep: 0,
        coverage: this.initializeCoverage(),
        totalQuestionsAsked: 0,
        timeWarningGiven: false,
        preludeResponses: [],
        telemetry: this.initializeTelemetry(),
        currentQuestionRepeatCount: 0,
        consecutiveMinimalResponses: 0,
        consecutiveCriterionProbes: { criterion: null, count: 0 },
        conversationHistory: [],
      });
    }
    return this.memory.get(sessionId)!;
  }

  private getConfig(session: InterviewSession, jobContext?: JobContext): InterviewConfig {
    return {
      interviewType: session.interviewType,
      targetRole: session.targetRole,
      difficulty: session.difficulty,
      totalQuestions: session.totalQuestions,
      companyName: jobContext?.companyName,
      companyDescription: jobContext?.companyDescription,
      jobTitle: jobContext?.jobTitle,
      jobRequirements: jobContext?.jobRequirements,
      candidateCv: jobContext?.candidateCv,
      stageSettings: getStageSettings(session.interviewType),
    };
  }

  private mapDifficultyToLevel(difficulty: string): ExperienceLevel {
    const mapping: Record<string, ExperienceLevel> = {
      'easy': 'intern',
      'intern': 'intern',
      'junior': 'junior',
      'medium': 'junior',
      'mid': 'mid',
      'senior': 'senior',
      'hard': 'senior',
      'lead': 'lead',
      'expert': 'lead',
    };
    return mapping[difficulty.toLowerCase()] || 'junior';
  }

  /**
   * Classify which assessment criteria a question/answer pair covers
   */
  private classifyQuestionCriteria(question: string, answer: string): AssessmentCriterion[] {
    const criteria: AssessmentCriterion[] = [];
    const lowerQ = question.toLowerCase();
    const lowerA = answer.toLowerCase();
    const combined = lowerQ + ' ' + lowerA;

    // Background: experience, roles, career history
    if (/background|experience|career|role|position|previous|worked at|company|years/i.test(combined)) {
      criteria.push('background');
    }

    // Skills: technical abilities, competencies, tools
    if (/skill|technical|technology|tool|framework|proficient|expert|knowledge|ability|capable/i.test(combined)) {
      criteria.push('skills');
    }

    // Behavioral: teamwork, challenges, examples, situations
    if (/team|collaborate|challenge|difficult|situation|example|time when|how did you|conflict|problem/i.test(combined)) {
      criteria.push('behavioral');
    }

    // Motivation: why this role/company, goals, interests
    if (/why|interest|motivat|goal|passion|excit|drawn|appeal|looking for/i.test(combined)) {
      criteria.push('motivation');
    }

    // Culture fit: values, work style, team dynamics
    if (/culture|value|work style|environment|prefer|ideal|team dynamic|diversity|remote|office/i.test(combined)) {
      criteria.push('culture_fit');
    }

    // Logistics: availability, salary, visa, location
    if (/availab|start|notice|salary|compensation|expect|visa|relocat|location|timeline/i.test(combined)) {
      criteria.push('logistics');
    }

    // If no specific criteria detected, default to background (general info)
    return criteria.length > 0 ? criteria : ['background'];
  }

  /**
   * Calculate coverage delta based on answer quality
   */
  private calculateCoverageDelta(answer: string, score: number): number {
    const wordCount = answer.split(/\s+/).length;
    
    // Base delta from score (0-10 → 0-0.3)
    const scoreDelta = (score / 10) * 0.3;
    
    // Length bonus (longer, more detailed answers contribute more)
    const lengthBonus = Math.min(wordCount / 100, 0.2); // Max 0.2 bonus for 100+ words
    
    // Combine for total delta (max ~0.5 per answer)
    return Math.min(scoreDelta + lengthBonus, 0.5);
  }

  /**
   * Update coverage scores based on a question/answer pair
   */
  private updateCoverage(
    memory: ConversationMemory,
    question: string,
    answer: string,
    score: number
  ): void {
    const criteria = this.classifyQuestionCriteria(question, answer);
    const delta = this.calculateCoverageDelta(answer, score);
    
    for (const criterion of criteria) {
      const coverage = memory.coverage[criterion];
      // Update score with diminishing returns (cap at 1.0)
      coverage.score = Math.min(coverage.score + delta / criteria.length, 1.0);
      coverage.questionsAsked++;
      
      // Extract a brief note about what was covered
      const firstSentence = answer.split(/[.!?]/)[0].trim();
      if (firstSentence.length > 10 && firstSentence.length < 200) {
        coverage.notes.push(firstSentence);
      }
    }
  }

  /**
   * Calculate overall interview sufficiency
   */
  private calculateSufficiency(memory: ConversationMemory): {
    overall: number;
    criticalMet: boolean;
    gaps: AssessmentCriterion[];
    prioritizedGaps: AssessmentCriterion[];
  } {
    const coverage = memory.coverage;
    
    // Calculate overall average
    const scores = Object.values(coverage).map(c => c.score);
    const overall = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    // Check critical areas
    const criticalMet = SUFFICIENCY_CONFIG.criticalAreas.every(
      area => coverage[area].score >= SUFFICIENCY_CONFIG.criticalThreshold
    );
    
    // Find gaps (areas below threshold)
    const gaps: AssessmentCriterion[] = [];
    const allCriteria: AssessmentCriterion[] = ['background', 'skills', 'behavioral', 'motivation', 'culture_fit', 'logistics'];
    
    for (const criterion of allCriteria) {
      if (coverage[criterion].score < SUFFICIENCY_CONFIG.criticalThreshold) {
        gaps.push(criterion);
      }
    }
    
    // Prioritize gaps: critical areas first, then by lowest score
    const prioritizedGaps = [...gaps].sort((a, b) => {
      const aIsCritical = SUFFICIENCY_CONFIG.criticalAreas.includes(a);
      const bIsCritical = SUFFICIENCY_CONFIG.criticalAreas.includes(b);
      if (aIsCritical !== bIsCritical) return aIsCritical ? -1 : 1;
      return coverage[a].score - coverage[b].score;
    });
    
    return { overall, criticalMet, gaps, prioritizedGaps };
  }

  /**
   * Determine if the interview should wrap up based on coverage sufficiency
   * Now uses the CompletionDecision engine for dynamic, time-based decisions
   */
  private shouldWrapUp(memory: ConversationMemory, config?: InterviewConfig): {
    shouldEnd: boolean;
    reason: 'sufficient' | 'max_reached' | 'time_pressure' | 'continue';
    message?: string;
    pacing?: CompletionDecisionResult['pacing'];
    prioritizedTopic?: AssessmentCriterion;
  } {
    // Get stage settings from config or use defaults
    const stageSettings = config?.stageSettings || getStageSettings('hr_screening');
    
    // Calculate average score
    const avgScore = memory.scores.length > 0 
      ? memory.scores.reduce((a, b) => a + b, 0) / memory.scores.length 
      : 5;
    
    // Count pending questions in backlog
    const pendingBacklogCount = memory.interviewPlan?.questions
      .filter(q => q.status === 'pending').length || 0;
    
    // Use the completion decision engine
    const decision = evaluateCompletion({
      coverage: memory.coverage,
      telemetry: memory.telemetry,
      questionsAsked: memory.totalQuestionsAsked,
      stageSettings,
      pendingBacklogCount,
      avgScore
    });
    
    // Map the new decision format to the existing return type
    if (decision.action.type === 'wrap_up') {
      const reasonMap: Record<string, 'sufficient' | 'max_reached' | 'time_pressure'> = {
        'sufficient_coverage': 'sufficient',
        'high_confidence_positive': 'sufficient',
        'high_confidence_negative': 'sufficient',
        'time_limit': 'time_pressure',
        'max_questions': 'max_reached',
        'candidate_fatigue': 'max_reached'
      };
      
      return {
        shouldEnd: true,
        reason: reasonMap[decision.action.reason] || 'sufficient',
        message: decision.action.message || getWrapUpMessage(decision.action.reason),
        pacing: decision.pacing
      };
    }
    
    if (decision.action.type === 'prioritize') {
      // Time pressure with topic prioritization
      if (!memory.timeWarningGiven) {
        memory.timeWarningGiven = true;
      }
      return {
        shouldEnd: false,
        reason: 'time_pressure',
        message: decision.action.reason,
        pacing: decision.pacing,
        prioritizedTopic: decision.action.topic
      };
    }
    
    // Continue normally
    return { 
      shouldEnd: false, 
      reason: 'continue',
      pacing: decision.pacing
    };
  }
  
  /**
   * Update telemetry after each answer is scored
   */
  private updateTelemetry(memory: ConversationMemory, score: number): void {
    const { telemetry } = memory;
    
    // Update score streaks
    if (score < 4) {
      telemetry.lowScoreStreak++;
      telemetry.highScoreStreak = 0;
    } else if (score >= 8) {
      telemetry.highScoreStreak++;
      telemetry.lowScoreStreak = 0;
    } else {
      // Reset streaks for mid-range scores
      telemetry.lowScoreStreak = 0;
      telemetry.highScoreStreak = 0;
    }
    
    // Track first question time
    if (!telemetry.firstQuestionAt && memory.totalQuestionsAsked === 1) {
      telemetry.firstQuestionAt = Date.now();
    }
  }
  
  /**
   * Calculate pacing info for frontend display
   */
  private getPacingInfo(memory: ConversationMemory, config: StageRuntimeConfig): {
    elapsedMinutes: number;
    progressPercent: number;
    status: 'starting' | 'on_track' | 'mid_interview' | 'wrapping_soon' | 'overtime';
  } {
    const { telemetry } = memory;
    const elapsedMs = Date.now() - telemetry.startedAt;
    const elapsedMinutes = Math.floor(elapsedMs / 60000);
    
    const { minTimeMinutes, maxTimeMinutes } = config;
    const targetTime = (minTimeMinutes + maxTimeMinutes) / 2;
    
    // Calculate progress as percentage of target time
    const progressPercent = Math.min(100, Math.round((elapsedMinutes / targetTime) * 100));
    
    // Determine status based on time
    let status: 'starting' | 'on_track' | 'mid_interview' | 'wrapping_soon' | 'overtime';
    if (elapsedMinutes < 3) {
      status = 'starting';
    } else if (elapsedMinutes < minTimeMinutes * 0.5) {
      status = 'on_track';
    } else if (elapsedMinutes < minTimeMinutes * 0.85) {
      status = 'mid_interview';
    } else if (elapsedMinutes < maxTimeMinutes) {
      status = 'wrapping_soon';
    } else {
      status = 'overtime';
    }
    
    return { elapsedMinutes, progressPercent, status };
  }

  /**
   * Get the next question topic based on coverage gaps
   */
  private getPrioritizedTopic(memory: ConversationMemory): AssessmentCriterion | null {
    const sufficiency = this.calculateSufficiency(memory);
    return sufficiency.prioritizedGaps[0] || null;
  }

  /**
   * Get the next pending question from the interview plan
   */
  private getNextPlannedQuestion(memory: ConversationMemory): PlannedQuestion | null {
    if (!memory.interviewPlan) return null;
    
    // Sort by priority and get first pending question
    const pendingQuestions = memory.interviewPlan.questions
      .filter(q => q.status === 'pending')
      .sort((a, b) => a.priority - b.priority);
    
    return pendingQuestions[0] || null;
  }

  /**
   * Get all remaining questions that haven't been asked or covered
   */
  private getRemainingQuestions(memory: ConversationMemory): PlannedQuestion[] {
    if (!memory.interviewPlan) return [];
    return memory.interviewPlan.questions.filter(q => q.status === 'pending');
  }

  /**
   * Mark a question as asked
   */
  private markQuestionAsked(memory: ConversationMemory, questionId: string): void {
    if (!memory.interviewPlan) return;
    const question = memory.interviewPlan.questions.find(q => q.id === questionId);
    if (question) {
      question.status = 'asked';
    }
    memory.currentQuestionId = questionId;
  }

  /**
   * Mark questions as proactively covered by the candidate
   */
  private markQuestionsAsCovered(memory: ConversationMemory, questionIds: string[]): void {
    if (!memory.interviewPlan) return;
    for (const id of questionIds) {
      const question = memory.interviewPlan.questions.find(q => q.id === id);
      if (question) {
        question.status = 'covered_proactively';
      }
    }
  }

  /**
   * Generate a natural acknowledgment when candidate covers planned questions
   */
  private generateProactiveCoverageAck(coveredQuestions: PlannedQuestion[]): string {
    const acks = [
      "That's great - you actually touched on something I was planning to ask about.",
      "Perfect, that answers what I was going to ask next.",
      "You're ahead of me - I was curious about that exact thing.",
      "Excellent, you've covered what was next on my list.",
      "That's helpful - you've addressed what I wanted to explore.",
    ];
    return acks[Math.floor(Math.random() * acks.length)];
  }

  async startInterview(
    userId: number,
    interviewType: string,
    targetRole: string,
    difficulty: string = "medium",
    totalQuestions: number = 5,
    jobContext?: JobContext,
    candidateName?: string,
    mode: 'practice' | 'journey' = 'practice',
    applicationStageId?: number
  ): Promise<{ 
    session: InterviewSession; 
    firstQuestion?: InterviewQuestion; 
    greeting?: string;
    introduction?: string;
    isPreludeMode?: boolean;
    isTeamInterview?: boolean;
    teamPersonas?: Array<{ id: string; name: string; role: string; displayRole: string }>;
    activePersonaId?: string;
  }> {
    const session = await storage.createInterviewSession({
      userId,
      interviewType,
      targetRole,
      difficulty,
      totalQuestions,
      status: "in_progress",
      currentQuestionIndex: 0,
      mode,
      applicationStageId: applicationStageId || null,
    });

    const config = this.getConfig(session, jobContext);
    const memory = this.getMemory(session.id);
    
    // Store job context in memory for use in subsequent questions
    if (jobContext) {
      memory.jobContext = jobContext;
    }
    
    // Store candidate name for personalized greeting
    if (candidateName) {
      memory.candidateName = candidateName;
    }

    // Check if this is a team interview (both 'team' and 'panel' use multi-persona interviews)
    // Note: panel is treated as an alias for team interviews - they share the same persona configuration
    const isTeamInterview = interviewType === "team" || interviewType === "panel";
    
    if (isTeamInterview && jobContext?.companyName && candidateName) {
      // Get seniority from difficulty (maps to experience level)
      const experienceLevel = this.mapDifficultyToLevel(difficulty);
      const teamSettings = getTeamInterviewSettings(experienceLevel);
      
      console.log('[Team Interview] Starting with settings:', {
        experienceLevel,
        personas: teamSettings.personas.map(p => p.name),
        maxQuestions: teamSettings.maxQuestions,
      });
      
      // Initialize team interview memory
      memory.isTeamInterview = true;
      memory.teamSettings = teamSettings;
      memory.activePersonaId = teamSettings.personas[0].id;
      memory.personaQuestionCounts = {};
      teamSettings.personas.forEach(p => {
        memory.personaQuestionCounts![p.id] = 0;
      });
      
      // Select level-appropriate questions
      memory.teamQuestionBacklog = selectQuestionsForInterview(
        experienceLevel,
        teamSettings.questionWeights,
        teamSettings.maxQuestions
      );
      
      console.log('[Team Interview] Question backlog:', {
        total: memory.teamQuestionBacklog.length,
        byCategory: {
          learning: memory.teamQuestionBacklog.filter(q => q.category === 'learning').length,
          collaboration: memory.teamQuestionBacklog.filter(q => q.category === 'collaboration').length,
          technical: memory.teamQuestionBacklog.filter(q => q.category === 'technical').length,
          curiosity: memory.teamQuestionBacklog.filter(q => q.category === 'curiosity').length,
        },
      });
      
      // Generate team greeting
      const { greeting: greetingText, activePersonaId } = await this.teamGreeting.generateGreeting(
        teamSettings,
        jobContext.companyName,
        jobContext.companyDescription || '',
        jobContext.jobTitle || targetRole,
        candidateName
      );
      
      memory.activePersonaId = activePersonaId;
      memory.currentStage = "greeting";
      memory.preludeStep = 0;
      
      // Track greeting in conversation history with persona info
      memory.conversationHistory.push({
        role: 'interviewer',
        content: greetingText,
        personaId: activePersonaId,
      });
      
      return {
        session,
        greeting: greetingText,
        isPreludeMode: true,
        // Include team interview info for frontend
        isTeamInterview: true,
        teamPersonas: teamSettings.personas.map(p => ({
          id: p.id,
          name: p.name,
          role: p.role,
          displayRole: p.displayRole,
        })),
        activePersonaId,
      };
    }
    
    // For HR/behavioral interviews with job context, use conversational prelude
    const usePrelude = jobContext?.companyName && 
      (interviewType === "behavioral" || interviewType === "recruiter_call");
    
    if (usePrelude && candidateName) {
      // PREPARATION PHASE: Generate interview plan before starting
      // This happens "behind the scenes" - the HR reviews CV and job before the call
      console.log('[Interview Prep] Generating interview plan for', candidateName);
      const plan = await this.preparationPlanner.generatePlan(config);
      memory.interviewPlan = plan;
      console.log('[Interview Prep] Plan ready:', {
        strengths: plan.candidateStrengths.length,
        concerns: plan.potentialConcerns.length,
        questions: plan.questions.length,
      });
      
      // Start with greeting phase - don't generate questions yet
      const greetingText = await this.greeting.generate(config, candidateName);
      memory.currentStage = "greeting";
      memory.preludeStep = 0;
      
      // Track interviewer's greeting in conversation history (for unified chain)
      memory.conversationHistory.push({
        role: 'interviewer',
        content: greetingText,
      });
      
      return { 
        session, 
        greeting: greetingText,
        isPreludeMode: true 
      };
    }

    // Fallback to old flow for practice mode or technical interviews
    let introduction: string | undefined;
    if (jobContext?.companyName) {
      introduction = await this.introduction.generate(config);
    }

    const questionText = await this.questionGenerator.generate({
      config,
      questionIndex: 0,
      previousQuestions: memory.questions,
      previousAnswers: memory.answers,
      previousScores: memory.scores,
    });

    memory.questions.push(questionText);
    memory.currentStage = "opening";
    memory.preludeStep = 3; // Skip prelude

    const question = await storage.createInterviewQuestion({
      sessionId: session.id,
      questionIndex: 0,
      questionText,
      questionType: "opening",
      expectedCriteria: this.getExpectedCriteria(config, 0),
    });

    return { session, firstQuestion: question, introduction, isPreludeMode: false };
  }

  /**
   * Classify candidate's response to intro exchange proposal
   * Returns: 'interviewer_first' | 'candidate_first' | 'skip_intros' | 'unclear'
   */
  private classifyIntroResponse(response: string): 'interviewer_first' | 'candidate_first' | 'skip_intros' | 'unclear' {
    const lower = response.toLowerCase();
    
    // Candidate wants to go first
    const candidateFirstPatterns = [
      /i('d| would) (like to|prefer to|want to) (go |start )?first/i,
      /let me (go |start )?first/i,
      /can i (go |start )?first/i,
      /i('ll| will) (go |start )?first/i,
      /me first/i,
      /i start/i,
      /i'd rather start/i,
    ];
    
    for (const pattern of candidateFirstPatterns) {
      if (pattern.test(response)) {
        return 'candidate_first';
      }
    }
    
    // Candidate wants to skip intros
    const skipPatterns = [
      /skip (the )?intro/i,
      /no (need for )?intro/i,
      /let's (just )?get (right )?(to|into)/i,
      /skip (to|ahead)/i,
      /don't need intro/i,
    ];
    
    for (const pattern of skipPatterns) {
      if (pattern.test(response)) {
        return 'skip_intros';
      }
    }
    
    // Default: agrees to let interviewer go first (or unclear = default to interviewer first)
    // Common agreement patterns
    const agreePatterns = [
      /sure|okay|yes|sounds good|go ahead|please/i,
      /that works|that's fine|perfect|great/i,
    ];
    
    for (const pattern of agreePatterns) {
      if (pattern.test(response)) {
        return 'interviewer_first';
      }
    }
    
    // If unclear, default to interviewer first
    return 'interviewer_first';
  }

  /**
   * Check if the candidate's response is a conversational question (like "how're you?")
   * that should be responded to before continuing with the interview
   */
  private isConversationalQuestion(response: string): boolean {
    const lower = response.toLowerCase();
    
    // Patterns for conversational questions directed at the interviewer
    const conversationalPatterns = [
      /how('re| are) you/i,
      /how about you/i,
      /and you\??/i,
      /what about you/i,
      /how's (it going|your day|things)/i,
      /before (that|we (start|begin|dive))/i,
    ];
    
    for (const pattern of conversationalPatterns) {
      if (pattern.test(response)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if the candidate's response is a substantive answer about their background
   * (not just "okay", "sure", or a brief acknowledgment)
   */
  private isSubstantiveBackgroundAnswer(response: string): boolean {
    const lower = response.toLowerCase().trim();
    const wordCount = response.split(/\s+/).length;
    
    // Too short to be a real answer
    if (wordCount < 10) {
      return false;
    }
    
    // Check for background-related keywords that indicate they're actually answering
    const backgroundKeywords = [
      /i('m| am) (a |an |the |currently )/i,
      /i (work|worked|have been|was|am) (at|in|as|for)/i,
      /my (background|experience|role|job|career|work)/i,
      /(years?|months?) (of )?(experience|in)/i,
      /senior|junior|lead|manager|director|engineer|developer|scientist|analyst/i,
      /team|company|organization|department/i,
      /currently|previously|before|after/i,
    ];
    
    for (const pattern of backgroundKeywords) {
      if (pattern.test(response)) {
        return true;
      }
    }
    
    // If it's reasonably long (20+ words), assume it's substantive
    if (wordCount >= 20) {
      return true;
    }
    
    return false;
  }

  /**
   * Generate a warm, friendly response to conversational questions
   */
  private generateWarmResponse(response: string): string {
    const lower = response.toLowerCase();
    
    // Respond to "how are you" type questions
    if (/how('re| are) you/i.test(lower) || /how about you/i.test(lower) || /and you\??/i.test(lower)) {
      const responses = [
        "I'm doing great, thanks for asking! It's always nice when candidates take a moment to connect.",
        "I'm doing well, thank you! I appreciate you asking.",
        "Doing well, thanks! It's great to meet candidates who are personable.",
      ];
      return responses[Math.floor(Math.random() * responses.length)] + " Now, to get us started, could you tell me a bit about your background?";
    }
    
    // Respond to "before that" type interjections
    if (/before (that|we)/i.test(lower)) {
      return "Of course, happy to chat! I'm doing well, thanks for asking. Now, to get us started, could you tell me a bit about your background?";
    }
    
    // Default warm response
    return "I appreciate that! I'm doing well. Now, let's get started with the interview - could you tell me a bit about your background?";
  }

  /**
   * Generate a warm response that also includes the role overview
   * Used when candidate asks a conversational question during the intro exchange
   */
  private async generateWarmResponseWithIntro(response: string, config: InterviewConfig): Promise<string> {
    const lower = response.toLowerCase();
    
    // Get the role overview
    const roleOverview = await this.selfIntro.generate(config);
    
    // Generate appropriate warm prefix based on their question
    let warmPrefix: string;
    
    if (/how('re| are) you/i.test(lower) || /how about you/i.test(lower) || /and you\??/i.test(lower)) {
      const responses = [
        "I'm doing great, thanks for asking!",
        "I'm doing well, thank you for asking!",
        "Doing well, thanks! I appreciate you asking.",
      ];
      warmPrefix = responses[Math.floor(Math.random() * responses.length)];
    } else if (/before (that|we)/i.test(lower)) {
      warmPrefix = "Of course! I'm doing well, thanks for asking.";
    } else {
      warmPrefix = "I appreciate you asking! I'm doing well.";
    }
    
    return `${warmPrefix} ${roleOverview}`;
  }

  /**
   * Handle candidate responses during the conversational prelude phase
   * Returns the interviewer's next prelude message, or the first question when prelude is complete
   */
  async handlePreludeResponse(
    sessionId: number,
    candidateResponse: string
  ): Promise<{
    preludeMessage?: string;
    firstQuestion?: InterviewQuestion;
    preludeComplete: boolean;
    activePersonaId?: string;
    isTeamInterview?: boolean;
  }> {
    const session = await storage.getInterviewSession(sessionId);
    if (!session) {
      throw new Error("Interview session not found");
    }

    const memory = this.getMemory(sessionId);
    const config = this.getConfig(session, memory.jobContext);

    // Store the candidate's response
    memory.preludeResponses.push(candidateResponse);
    
    // Track candidate's response in conversation history (for unified chain)
    memory.conversationHistory.push({
      role: 'candidate',
      content: candidateResponse,
    });

    // Advance prelude step
    memory.preludeStep++;

    if (memory.preludeStep === 1) {
      // Step 1: After greeting, propose introductions
      const introExchangeText = await this.introExchange.generate(config, candidateResponse);
      memory.currentStage = "intro_exchange";
      
      // Track interviewer's response in conversation history
      memory.conversationHistory.push({
        role: 'interviewer',
        content: introExchangeText,
      });
      
      return { 
        preludeMessage: introExchangeText, 
        preludeComplete: false,
        activePersonaId: memory.activePersonaId,
        isTeamInterview: memory.isTeamInterview,
      };
    }

    if (memory.preludeStep === 2) {
      // Check if we're waiting for candidate to share their intro (they went first)
      if (memory.awaitingCandidateIntro) {
        // Candidate just shared their intro - now give role overview
        memory.awaitingCandidateIntro = false;
        memory.candidateWentFirst = true;
        
        // Acknowledge their intro and give role overview
        const selfIntroText = await this.selfIntro.generate(config);
        const ackAndIntro = `Thanks for sharing that! ${selfIntroText}`;
        
        // Track interviewer's response in conversation history
        memory.conversationHistory.push({
          role: 'interviewer',
          content: ackAndIntro,
        });
        
        return { 
          preludeMessage: ackAndIntro, 
          preludeComplete: false,
          activePersonaId: memory.activePersonaId,
          isTeamInterview: memory.isTeamInterview,
        };
      }
      
      // Check if the candidate is asking a conversational question alongside their response
      // e.g., "Sure. But before that, how are you?"
      const hasConversationalQuestion = this.isConversationalQuestion(candidateResponse);
      
      if (hasConversationalQuestion) {
        // Answer their question and then proceed with role overview
        const warmResponse = await this.generateWarmResponseWithIntro(candidateResponse, config);
        // Don't decrement - we're answering and proceeding to role overview in one message
        
        // Track interviewer's response in conversation history
        memory.conversationHistory.push({
          role: 'interviewer',
          content: warmResponse,
        });
        
        return { 
          preludeMessage: warmResponse, 
          preludeComplete: false,
          activePersonaId: memory.activePersonaId,
          isTeamInterview: memory.isTeamInterview,
        };
      }
      
      // Step 2: Parse candidate's response to intro exchange proposal
      const introPreference = this.classifyIntroResponse(candidateResponse);
      
      if (introPreference === 'candidate_first') {
        // Candidate wants to go first - acknowledge and wait for their intro
        const ackMessage = "Of course, please go ahead! I'd love to hear about you first.";
        memory.awaitingCandidateIntro = true;
        memory.preludeStep = 1; // Stay at step 1 so next increment brings us back to step 2
        
        // Track interviewer's response in conversation history
        memory.conversationHistory.push({
          role: 'interviewer',
          content: ackMessage,
        });
        
        return { 
          preludeMessage: ackMessage, 
          preludeComplete: false,
          activePersonaId: memory.activePersonaId,
          isTeamInterview: memory.isTeamInterview,
        };
      }
      
      if (introPreference === 'skip_intros') {
        // Skip straight to questions - mark prelude complete
        memory.currentStage = "opening";
        memory.preludeStep = 3; // Mark prelude as complete for isInPreludeMode check
        
        const questionText = await this.questionGenerator.generate({
          config,
          questionIndex: 0,
          previousQuestions: memory.questions,
          previousAnswers: memory.answers,
          previousScores: memory.scores,
        });

        memory.questions.push(questionText);

        const question = await storage.createInterviewQuestion({
          sessionId: session.id,
          questionIndex: 0,
          questionText,
          questionType: "opening",
          expectedCriteria: this.getExpectedCriteria(config, 0),
        });

        return { 
          firstQuestion: question, 
          preludeComplete: true,
          activePersonaId: memory.activePersonaId,
          isTeamInterview: memory.isTeamInterview,
        };
      }
      
      // Default: interviewer goes first with role overview
      const selfIntroText = await this.selfIntro.generate(config);
      
      // Track interviewer's response in conversation history
      memory.conversationHistory.push({
        role: 'interviewer',
        content: selfIntroText,
      });
      
      return { 
        preludeMessage: selfIntroText, 
        preludeComplete: false,
        activePersonaId: memory.activePersonaId,
        isTeamInterview: memory.isTeamInterview,
      };
    }

    if (memory.preludeStep >= 3) {
      // Step 3+: Check if the candidate is asking a conversational question
      // before proceeding to the first real interview question
      const isConversationalQuestion = this.isConversationalQuestion(candidateResponse);
      
      if (isConversationalQuestion) {
        // Respond warmly to conversational questions like "how're you?"
        const warmResponse = this.generateWarmResponse(candidateResponse);
        memory.preludeStep--; // Stay at current step to ask question after responding
        return { 
          preludeMessage: warmResponse, 
          preludeComplete: false,
          activePersonaId: memory.activePersonaId,
          isTeamInterview: memory.isTeamInterview,
        };
      }
      
      // The self-intro ALWAYS ends with "could you tell me a bit about your background?"
      // So we ALWAYS treat the candidate's response as an answer to that question
      // This prevents the interviewer from repeating the same question
      memory.currentStage = "core";
      
      // IMPORTANT: Mark any "background" criterion questions in the interview plan as "asked"
      // since the self-intro already covers this topic
      if (memory.interviewPlan) {
        const backgroundQuestions = memory.interviewPlan.questions.filter(
          q => q.criterion === 'background' && q.status === 'pending'
        );
        for (const q of backgroundQuestions) {
          q.status = 'asked';
          console.log('[Prelude] Marked planned background question as asked:', q.id);
        }
      }
      
      // Store the background question and their answer
      const backgroundQuestion = "Could you tell me a bit about your background?";
      memory.questions.push(backgroundQuestion);
      memory.answers.push(candidateResponse);
      
      // Create the first question record with their answer
      const question = await storage.createInterviewQuestion({
        sessionId: session.id,
        questionIndex: 0,
        questionText: backgroundQuestion,
        questionType: "opening",
        expectedCriteria: this.getExpectedCriteria(config, 0),
        candidateAnswer: candidateResponse,
        answeredAt: new Date(),
      });
      
      // Evaluate their background answer
      const evaluation = await this.evaluator.evaluate(
        config,
        backgroundQuestion,
        candidateResponse
      );
      
      memory.scores.push(evaluation.score);
      memory.evaluations.push(evaluation);
      
      // Update coverage tracking for background criterion
      this.updateCoverage(memory, backgroundQuestion, candidateResponse, evaluation.score);
      memory.totalQuestionsAsked++;
      
      // Update the question with evaluation
      await storage.updateInterviewQuestion(question.id, {
        score: evaluation.score,
        feedback: evaluation.feedback,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
      });
      
      // Update session to move to next question
      await storage.updateInterviewSession(session.id, {
        currentQuestionIndex: 1,
      });
      
      // Check if the answer was brief - if so, ask a follow-up for more details
      // rather than jumping to a completely new topic
      const wordCount = candidateResponse.split(/\s+/).length;
      const isBriefAnswer = wordCount < 10;
      
      if (isBriefAnswer) {
        // Generate a natural follow-up to get more details about their background
        const followUpQuestion = "Thanks for sharing that! Could you tell me a bit more about your current role and what you've been working on?";
        
        memory.questions.push(followUpQuestion);
        
        const followUpQuestionRecord = await storage.createInterviewQuestion({
          sessionId: session.id,
          questionIndex: 1,
          questionText: followUpQuestion,
          questionType: "core",
          expectedCriteria: this.getExpectedCriteria(config, 1),
        });
        
        return { 
          firstQuestion: followUpQuestionRecord, 
          preludeComplete: true,
          activePersonaId: memory.activePersonaId,
          isTeamInterview: memory.isTeamInterview,
        };
      }
      
      // Substantive answer - generate a reflection and move to next topic
      const reflectionText = await this.reflection.generate(candidateResponse, memory.lastReflection, "Sarah");
      memory.lastReflection = reflectionText;
      
      // Generate the second question (since first was already answered well)
      const nextQuestionText = await this.questionGenerator.generate({
        config,
        questionIndex: 1,
        previousQuestions: memory.questions,
        previousAnswers: memory.answers,
        previousScores: memory.scores,
      });
      
      memory.questions.push(nextQuestionText);
      
      const nextQuestion = await storage.createInterviewQuestion({
        sessionId: session.id,
        questionIndex: 1,
        questionText: nextQuestionText,
        questionType: "core",
        expectedCriteria: this.getExpectedCriteria(config, 1),
      });
      
      return { 
        firstQuestion: nextQuestion, 
        preludeComplete: true,
        activePersonaId: memory.activePersonaId,
        isTeamInterview: memory.isTeamInterview,
      };
    }

    // Should not reach here
    return { 
      preludeComplete: false,
      activePersonaId: memory.activePersonaId,
      isTeamInterview: memory.isTeamInterview,
    };
  }

  /**
   * Check if a session is currently in prelude mode
   */
  isInPreludeMode(sessionId: number): boolean {
    const memory = this.memory.get(sessionId);
    return memory ? memory.preludeStep < 3 : false;
  }

  /**
   * Get current prelude step for a session
   */
  getPreludeStep(sessionId: number): number {
    const memory = this.memory.get(sessionId);
    return memory ? memory.preludeStep : 0;
  }

  async submitAnswer(
    sessionId: number,
    questionId: number,
    answer: string
  ): Promise<{
    evaluation?: EvaluationResult;
    decision?: FollowUpDecision;
    nextQuestion?: InterviewQuestion;
    reflection?: string;
    finalReport?: FinalReport;
    closure?: string;
    // New fields for responsive handling
    interimResponse?: string; // Response when not proceeding with evaluation
    questionRepeated?: boolean; // Whether the same question should be re-asked
    candidateIntent?: CandidateIntent;
    currentQuestionText?: string; // The question that's still pending (for interim responses)
    candidateQuestionAnswer?: string; // Answer to a question the candidate asked (for mixed content)
    // Pacing info for frontend
    pacing?: {
      elapsedMinutes: number;
      progressPercent: number;
      status: 'starting' | 'on_track' | 'mid_interview' | 'wrapping_soon' | 'overtime';
    };
  }> {
    const session = await storage.getInterviewSession(sessionId);
    if (!session) {
      throw new Error("Interview session not found");
    }

    const question = await storage.getInterviewQuestion(questionId);
    if (!question) {
      throw new Error("Question not found");
    }

    const memory = this.getMemory(sessionId);
    const config = this.getConfig(session, memory.jobContext);
    
    // Store the last question for classification context
    memory.lastQuestionAsked = question.questionText;
    
    // Classify the candidate's response (synchronous - heuristics only, no LLM call)
    const classification = responseClassifier.classify(
      answer,
      question.questionText,
      config.jobTitle || config.targetRole
    );
    
    memory.lastCandidateIntent = classification.intent;
    
    // Track any candidate question for later answering
    let candidateQuestionAnswer: string | undefined;
    
    // Handle non-answer intents (pure questions, confusion, comments, etc.)
    if (classification.intent !== 'substantive_answer') {
      const handlerResult = await responseHandler.handleResponse(
        classification,
        question.questionText,
        {
          interviewerName: this.getInterviewerName(session.interviewType),
          companyName: config.companyName,
          companyDescription: config.companyDescription,
          jobTitle: config.jobTitle,
          jobRequirements: config.jobRequirements
        }
      );
      
      // If we shouldn't proceed with evaluation, return the interim response
      if (!handlerResult.shouldProceedWithEvaluation) {
        // Track question repeats to prevent infinite loops
        if (handlerResult.questionRepeated) {
          memory.currentQuestionRepeatCount++;
          
          // After 2 repeats, force move to the next question
          const MAX_QUESTION_REPEATS = 2;
          if (memory.currentQuestionRepeatCount >= MAX_QUESTION_REPEATS) {
            // Reset repeat counter and proceed with low-score evaluation
            memory.currentQuestionRepeatCount = 0;
            
            // Treat repeated refusals as a minimal answer and proceed
            // The evaluation will score this appropriately low
            // Don't return here - fall through to normal evaluation flow
          } else {
            // Return the interim response along with the current question
            // so the frontend knows what question is still pending
            return {
              interimResponse: handlerResult.response,
              questionRepeated: handlerResult.questionRepeated,
              candidateIntent: classification.intent,
              // Include the current question so the frontend can track state
              currentQuestionText: question.questionText
            };
          }
        } else {
          // Non-repeated interim (like clarification) - return as normal
          return {
            interimResponse: handlerResult.response,
            questionRepeated: handlerResult.questionRepeated,
            candidateIntent: classification.intent,
            currentQuestionText: question.questionText
          };
        }
      }
    } else if (classification.candidateQuestion) {
      // Mixed content: substantive answer WITH a question
      // Generate an inline answer to include with the reflection
      const handlerResult = await responseHandler.handleResponse(
        { ...classification, intent: 'question_for_recruiter' }, // Force question handling
        question.questionText,
        {
          interviewerName: this.getInterviewerName(session.interviewType),
          companyName: config.companyName,
          companyDescription: config.companyDescription,
          jobTitle: config.jobTitle,
          jobRequirements: config.jobRequirements
        }
      );
      // Don't include elaboration offer acknowledgments in mixed content
      // The triage chain will handle whether we need more info
      if (!handlerResult.isElaborationOffer) {
        candidateQuestionAnswer = handlerResult.response;
      }
    }

    // =========================================================================
    // TEAM INTERVIEW PATH: Multi-persona interview with level calibration
    // =========================================================================
    if (memory.isTeamInterview && memory.teamSettings && memory.teamQuestionBacklog) {
      console.log('[Telemetry] Chain activation:', {
        chainType: 'team_interview',
        experienceLevel: memory.teamSettings.experienceLevel,
        activePersona: memory.activePersonaId,
        mode: session.mode,
        sessionId,
        questionsAsked: memory.totalQuestionsAsked,
        reason: 'Team interview mode with multi-persona flow',
      });
      return this.processAnswerTeam(sessionId, questionId, answer, session, question);
    }

    // =========================================================================
    // UNIFIED CHAIN PATH: Single LLM call per turn (feature flagged)
    // =========================================================================
    if (USE_UNIFIED_CHAIN && memory.interviewPlan) {
      console.log('[Telemetry] Chain activation:', {
        chainType: 'unified',
        featureFlag: USE_UNIFIED_CHAIN,
        hasInterviewPlan: !!memory.interviewPlan,
        mode: session.mode,
        sessionId,
        questionIndex: session.currentQuestionIndex,
        questionsAsked: memory.totalQuestionsAsked,
        reason: 'Journey mode with interview plan - using single LLM call per turn',
      });
      return this.processAnswerUnified(sessionId, questionId, answer, session, question);
    }
    
    // Log when legacy chain is used and why
    console.log('[Telemetry] Chain activation:', {
      chainType: 'legacy',
      featureFlag: USE_UNIFIED_CHAIN,
      hasInterviewPlan: !!memory.interviewPlan,
      mode: session.mode,
      sessionId,
      reason: !USE_UNIFIED_CHAIN 
        ? 'Feature flag disabled' 
        : 'No interview plan (practice mode or technical interview)',
    });

    // =========================================================================
    // LEGACY PATH: Multi-chain fragmented approach (kept for fallback)
    // =========================================================================
    
    // Use sanitized text for evaluation (protects against injection)
    const sanitizedAnswer = classification.sanitizedText;

    const evaluation = await this.evaluator.evaluate(
      config,
      question.questionText,
      sanitizedAnswer
    );

    memory.answers.push(answer);
    memory.scores.push(evaluation.score);
    memory.evaluations.push(evaluation);
    memory.totalQuestionsAsked++;
    
    // Update coverage tracking for dynamic completion
    this.updateCoverage(memory, question.questionText, sanitizedAnswer, evaluation.score);
    
    // Update telemetry for dynamic interview flow
    this.updateTelemetry(memory, evaluation.score);
    
    if (evaluation.projectMentioned) {
      if (evaluation.projectMentioned !== memory.activeProject) {
        memory.activeProject = evaluation.projectMentioned;
        memory.projectMentionCount = 1;
      } else {
        memory.projectMentionCount++;
      }
    }

    await storage.updateInterviewQuestion(questionId, {
      candidateAnswer: answer,
      score: evaluation.score,
      feedback: evaluation.feedback,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      answeredAt: new Date(),
    });

    const decision = await this.followUp.decide(
      config,
      session.currentQuestionIndex,
      evaluation.score,
      memory.scores
    );

    // Check dynamic interview completion based on coverage sufficiency
    const wrapUpCheck = this.shouldWrapUp(memory, config);
    
    // Determine stages: what stage was the question we just answered, and what's next
    const answeredQuestionStage = getInterviewStage(session.currentQuestionIndex, config.totalQuestions);
    memory.currentStage = answeredQuestionStage;
    
    // Use dynamic sufficiency check instead of fixed question count
    const shouldEndInterview = wrapUpCheck.shouldEnd || decision.action === "end_interview";
    
    if (shouldEndInterview) {
      // Calculate backlog metrics for legacy path (may not have interview plan)
      const pendingQuestionsLegacy = memory.interviewPlan?.questions.filter(q => q.status === 'pending').length || 0;
      const coveredQuestionsLegacy = memory.interviewPlan?.questions.filter(q => q.status === 'covered_proactively').length || 0;
      const askedQuestionsLegacy = memory.interviewPlan?.questions.filter(q => q.status === 'asked').length || 0;
      
      // Log wrap-up telemetry for legacy path
      console.log('[Telemetry] Wrap-up triggered:', {
        sessionId,
        trigger: 'legacy_chain_decision',
        reason: wrapUpCheck.reason,
        questionsAsked: memory.totalQuestionsAsked,
        finalCoverage: {
          overall: Math.round(
            (memory.coverage.background.score + memory.coverage.skills.score + 
             memory.coverage.behavioral.score + memory.coverage.motivation.score +
             memory.coverage.culture_fit.score + memory.coverage.logistics.score) / 6 * 100
          ) / 100,
          background: Math.round(memory.coverage.background.score * 100) / 100,
          skills: Math.round(memory.coverage.skills.score * 100) / 100,
          behavioral: Math.round(memory.coverage.behavioral.score * 100) / 100,
          motivation: Math.round(memory.coverage.motivation.score * 100) / 100,
          culture_fit: Math.round(memory.coverage.culture_fit.score * 100) / 100,
          logistics: Math.round(memory.coverage.logistics.score * 100) / 100,
        },
        backlogStatus: {
          pending: pendingQuestionsLegacy,
          asked: askedQuestionsLegacy,
          coveredProactively: coveredQuestionsLegacy,
          total: memory.interviewPlan?.questions.length || 0,
          hasInterviewPlan: !!memory.interviewPlan,
        },
        avgScore: memory.scores.length > 0 
          ? Math.round((memory.scores.reduce((a, b) => a + b, 0) / memory.scores.length) * 10) / 10
          : 0,
        sessionDurationMs: Date.now() - memory.telemetry.startedAt,
      });
      
      // Check if the candidate asked a question (e.g., when wrapup asked "do you have questions?")
      // We should answer their question before closing
      let closingQuestionAnswer: string | undefined;
      
      const closingClassification = responseClassifier.classify(
        answer,
        question.questionText,
        config.jobTitle || config.targetRole
      );
      
      // If the candidate asked a question in their final response, answer it first
      if (closingClassification.candidateQuestion || closingClassification.intent === 'question_for_recruiter') {
        const handlerResult = await responseHandler.handleResponse(
          { ...closingClassification, intent: 'question_for_recruiter' },
          question.questionText,
          {
            interviewerName: this.getInterviewerName(session.interviewType),
            companyName: config.companyName,
            companyDescription: config.companyDescription,
            jobTitle: config.jobTitle,
            jobRequirements: config.jobRequirements
          }
        );
        closingQuestionAnswer = handlerResult.response;
      }
      
      // Generate closure message before ending (use candidate's actual name)
      const closureMessage = await this.closure.generate(config, memory.candidateName);
      
      const finalReport = await this.generateFinalReport(sessionId);
      
      await storage.updateInterviewSession(sessionId, {
        status: "completed",
        overallScore: finalReport.overallScore,
        completedAt: new Date(),
      });

      this.memory.delete(sessionId);

      // Include the answer to any candidate question before the closure
      const fullClosure = closingQuestionAnswer 
        ? `${closingQuestionAnswer}\n\n${closureMessage}`
        : closureMessage;

      return { evaluation, decision, finalReport, closure: fullClosure, candidateQuestionAnswer };
    }

    const nextQuestionIndex = session.currentQuestionIndex + 1;
    
    await storage.updateInterviewSession(sessionId, {
      currentQuestionIndex: nextQuestionIndex,
    });

    const shouldClearProject = memory.projectMentionCount >= 3;
    if (shouldClearProject) {
      memory.activeProject = null;
      memory.projectMentionCount = 0;
    }
    
    // Track consecutive minimal/negative responses to prevent infinite probing
    const MAX_CONSECUTIVE_MINIMAL = 2;
    const isMinimalResponse = classification.intent === 'minimal_response';
    
    if (isMinimalResponse) {
      memory.consecutiveMinimalResponses++;
      console.log(`[Interview] Minimal response detected (${memory.consecutiveMinimalResponses}/${MAX_CONSECUTIVE_MINIMAL})`);
    } else {
      // Reset counter on substantive response
      memory.consecutiveMinimalResponses = 0;
    }
    
    // Force skip follow-ups after too many minimal responses
    const shouldForceNewTopic = memory.consecutiveMinimalResponses >= MAX_CONSECUTIVE_MINIMAL;
    if (shouldForceNewTopic) {
      console.log('[Interview] Forcing new topic after consecutive minimal responses');
      memory.pendingFollowUp = undefined; // Clear any pending follow-up
      memory.consecutiveMinimalResponses = 0; // Reset counter
      
      // Track that we need to switch to a completely different topic
      // Avoid asking for "examples" or "details" about the same area
      memory.forceTopicSwitch = true;
    }
    
    // Use triage chain to evaluate response and decide next action
    let triageDecision: TriageDecision | null = null;
    let proactiveCoverageAck = '';
    
    if (memory.interviewPlan) {
      const remainingQuestions = this.getRemainingQuestions(memory);
      triageDecision = await this.triage.evaluate(
        question.questionText,
        sanitizedAnswer,
        remainingQuestions
      );
      
      // Handle proactive coverage - mark questions as covered
      if (triageDecision.outcome === 'proactive_coverage' && triageDecision.coveredQuestionIds) {
        this.markQuestionsAsCovered(memory, triageDecision.coveredQuestionIds);
        const coveredQuestions = memory.interviewPlan.questions
          .filter(q => triageDecision!.coveredQuestionIds?.includes(q.id));
        proactiveCoverageAck = triageDecision.acknowledgment || 
          this.generateProactiveCoverageAck(coveredQuestions);
      }
      
      // If pending follow-up needed, store it (unless forced to skip due to consecutive minimal responses)
      if ((triageDecision.outcome === 'partial' || triageDecision.outcome === 'vague') && 
          triageDecision.followUpPrompt && !shouldForceNewTopic) {
        memory.pendingFollowUp = triageDecision.followUpPrompt;
      }
      
      // Handle candidate asking a question - we need to answer it first
      if (triageDecision.outcome === 'has_question' && triageDecision.candidateQuestion) {
        memory.pendingCandidateQuestion = triageDecision.candidateQuestion;
      }
    }
    
    // Adaptive reflection: skip for wrapup answers, only ~40% for core with longer answers
    let reflectionText: string | undefined;
    if (answeredQuestionStage === "core" && shouldGenerateReflection(answer, answeredQuestionStage)) {
      const interviewerName = this.getInterviewerName(session.interviewType);
      reflectionText = await this.reflection.generate(answer, memory.lastReflection, interviewerName);
      memory.lastReflection = reflectionText;
    }
    
    // Add proactive coverage acknowledgment to reflection if applicable
    if (proactiveCoverageAck) {
      reflectionText = reflectionText 
        ? `${reflectionText} ${proactiveCoverageAck}`
        : proactiveCoverageAck;
    }
    
    // Add time pressure messaging if we're running short
    let timePressurePrefix = '';
    if (wrapUpCheck.reason === 'time_pressure' && wrapUpCheck.message) {
      timePressurePrefix = wrapUpCheck.message + ' ';
    }
    
    // Handle candidate's question if they asked one
    let candidateQuestionAnswerPrefix = '';
    let responseAlreadyContainsQuestion = false;
    let isElaborationOffer = false;
    
    if (memory.pendingCandidateQuestion && triageDecision?.outcome === 'has_question') {
      // Generate answer to the candidate's question using response handler
      const answerResult = await responseHandler.handleResponse(
        { 
          intent: 'question_for_recruiter', 
          candidateQuestion: memory.pendingCandidateQuestion,
          confidence: 0.9,
          sanitizedText: sanitizedAnswer,
          injectionDetected: false,
        },
        question.questionText,
        {
          interviewerName: this.getInterviewerName(session.interviewType),
          companyName: config.companyName || memory.jobContext?.companyName,
          companyDescription: config.companyDescription || memory.jobContext?.companyDescription,
          jobTitle: config.targetRole || config.jobTitle || memory.jobContext?.jobTitle,
          jobRequirements: config.jobRequirements || memory.jobContext?.jobRequirements,
        }
      );
      if (answerResult.response) {
        candidateQuestionAnswerPrefix = answerResult.response + ' ';
        
        // Check if this is an elaboration offer - if so, use the response alone
        isElaborationOffer = answerResult.isElaborationOffer || false;
        
        // Also check if response ends with ? (fallback for normal questions with redirect)
        const trimmedResponse = answerResult.response.trim();
        responseAlreadyContainsQuestion = trimmedResponse.endsWith('?');
      }
      memory.pendingCandidateQuestion = undefined; // Clear after handling
    }
    
    // Generate next question based on triage decision and interview plan
    let nextQuestionText: string;
    let pendingPlannedQuestion: PlannedQuestion | null = null;
    
    // Check if we should do a final wrapup (approaching max questions with good coverage)
    const sufficiency = this.calculateSufficiency(memory);
    const isNearingEnd = memory.totalQuestionsAsked >= SUFFICIENCY_CONFIG.maxQuestions - 2;
    const shouldDoWrapup = isNearingEnd || (sufficiency.overall >= 0.65 && sufficiency.criticalMet);
    
    // If forceTopicSwitch is set, we need to pick a completely different topic
    // Skip background/skills questions and move to motivation, culture_fit, or logistics
    let forcedTopic: AssessmentCriterion | undefined;
    if (memory.forceTopicSwitch) {
      console.log('[Interview] Force topic switch - avoiding example/detail questions');
      // Pick a topic that hasn't been heavily covered yet
      const softTopics: AssessmentCriterion[] = ['motivation', 'culture_fit', 'logistics'];
      forcedTopic = softTopics.find(t => memory.coverage[t].score < 0.5) || 'motivation';
      memory.forceTopicSwitch = false; // Reset the flag
    }
    
    if (shouldDoWrapup && !sufficiency.gaps.includes('logistics')) {
      // We have good coverage - do a natural wrapup
      nextQuestionText = await this.wrapup.generate(config);
    } else if (memory.pendingFollowUp && triageDecision?.action === 'follow_up' && !forcedTopic) {
      // Use the follow-up question for partial/vague answers (unless forcing topic switch)
      nextQuestionText = memory.pendingFollowUp;
      memory.pendingFollowUp = undefined; // Clear after use
      memory.telemetry.followUpsUsed++; // Track follow-up usage for telemetry
    } else if (memory.interviewPlan && !forcedTopic) {
      // Use the next planned question from the backlog (unless forcing topic switch)
      pendingPlannedQuestion = this.getNextPlannedQuestion(memory);
      if (pendingPlannedQuestion) {
        nextQuestionText = pendingPlannedQuestion.question;
        // Note: We'll mark this as asked ONLY after we confirm we're using it (see below)
      } else {
        // Fallback to dynamic generation if no more planned questions
        const prioritizedTopic = this.getPrioritizedTopic(memory);
        nextQuestionText = await this.questionGenerator.generate({
          config,
          questionIndex: nextQuestionIndex,
          previousQuestions: memory.questions,
          previousAnswers: memory.answers,
          previousScores: memory.scores,
          activeProject: memory.activeProject,
          prioritizedTopic: prioritizedTopic || undefined,
        });
      }
    } else {
      // Fallback: Generate a focused question based on coverage gaps or forced topic
      const prioritizedTopic = forcedTopic || this.getPrioritizedTopic(memory);
      nextQuestionText = await this.questionGenerator.generate({
        config: {
          ...config,
          difficulty: decision.difficultyAdjustment === "easier" 
            ? this.adjustDifficulty(config.difficulty, -1)
            : decision.difficultyAdjustment === "harder"
            ? this.adjustDifficulty(config.difficulty, 1)
            : config.difficulty,
        },
        questionIndex: nextQuestionIndex,
        previousQuestions: memory.questions,
        previousAnswers: memory.answers,
        previousScores: memory.scores,
        activeProject: memory.activeProject,
        prioritizedTopic: prioritizedTopic || undefined,
      });
    }
    
    // Prepend time pressure message if applicable
    if (timePressurePrefix) {
      nextQuestionText = timePressurePrefix + nextQuestionText;
    }
    
    // Track whether we actually used the planned question
    let usedPlannedQuestion = true;
    
    // Handle candidate's question answer:
    // - If it's an elaboration offer, use just the response (let them elaborate first)
    // - If response ends with ?, use just the response (it already prompts them)
    // - Otherwise, prepend the answer to the next planned question
    if (candidateQuestionAnswerPrefix) {
      if (isElaborationOffer) {
        // Candidate offered to elaborate - just acknowledge and let them continue
        // Don't add another question, keep the planned question for after they elaborate
        nextQuestionText = candidateQuestionAnswerPrefix.trim();
        usedPlannedQuestion = false; // Keep the planned question pending
      } else if (responseAlreadyContainsQuestion) {
        // Our response already ends with a question - use it as-is without appending another
        // This avoids redundant double-questions like "Could you walk me through it? Also, can you give an example?"
        nextQuestionText = candidateQuestionAnswerPrefix.trim();
        usedPlannedQuestion = false; // Keep the planned question pending
      } else {
        // Our response is a statement - prepend it to the planned question
        nextQuestionText = candidateQuestionAnswerPrefix + nextQuestionText;
      }
    }
    
    // Mark the planned question as asked ONLY if we actually used it
    if (usedPlannedQuestion && pendingPlannedQuestion) {
      this.markQuestionAsked(memory, pendingPlannedQuestion.id);
    }

    memory.questions.push(nextQuestionText);
    
    // Reset repeat counter when moving to a new question
    memory.currentQuestionRepeatCount = 0;

    const nextQuestion = await storage.createInterviewQuestion({
      sessionId,
      questionIndex: nextQuestionIndex,
      questionText: nextQuestionText,
      questionType: this.getQuestionType(nextQuestionIndex, config.totalQuestions, decision),
      expectedCriteria: this.getExpectedCriteria(config, nextQuestionIndex),
    });

    // Calculate pacing info for frontend
    const stageConfig = getStageRuntimeConfig(config.interviewType as 'hr' | 'technical' | 'final');
    const pacing = this.getPacingInfo(memory, stageConfig);
    
    return { evaluation, decision, nextQuestion, reflection: reflectionText, candidateQuestionAnswer, pacing };
  }

  async generateFinalReport(sessionId: number): Promise<FinalReport> {
    const session = await storage.getInterviewSession(sessionId);
    if (!session) {
      throw new Error("Interview session not found");
    }

    const questions = await storage.getInterviewQuestions(sessionId);
    const memory = this.memory.get(sessionId);
    const config = this.getConfig(session, memory?.jobContext);

    const questionsAndAnswers = questions
      .filter(q => q.candidateAnswer)
      .map(q => ({
        question: q.questionText,
        answer: q.candidateAnswer!,
        score: q.score || 5,
        feedback: q.feedback || "",
      }));

    const scores = questionsAndAnswers.map(qa => qa.score);

    const report = await this.scoring.generateReport(config, questionsAndAnswers, scores);

    await storage.createInterviewFeedback({
      sessionId,
      overallScore: report.overallScore,
      communicationScore: report.communicationScore,
      technicalScore: report.technicalScore,
      problemSolvingScore: report.problemSolvingScore,
      cultureFitScore: report.cultureFitScore,
      summary: report.summary,
      strengths: report.strengths,
      improvements: report.improvements,
      recommendations: report.recommendations,
      hiringDecision: report.hiringDecision,
    });

    return report;
  }

  async getInterviewStatus(sessionId: number) {
    const session = await storage.getInterviewSession(sessionId);
    if (!session) {
      throw new Error("Interview session not found");
    }

    const questions = await storage.getInterviewQuestions(sessionId);
    const feedback = await storage.getInterviewFeedback(sessionId);

    return {
      session,
      questions,
      feedback,
      progress: {
        current: session.currentQuestionIndex + 1,
        total: session.totalQuestions,
        percentage: Math.round(((session.currentQuestionIndex + 1) / session.totalQuestions) * 100),
      },
    };
  }

  private getExpectedCriteria(config: InterviewConfig, questionIndex: number): object {
    const baseCriteria = {
      clarity: "Response should be clear and well-structured",
      relevance: "Response should directly address the question",
      depth: "Response should demonstrate appropriate depth of knowledge",
    };

    if (config.interviewType === "behavioral") {
      return {
        ...baseCriteria,
        starMethod: "Response should follow STAR format (Situation, Task, Action, Result)",
        specificity: "Response should include specific examples",
      };
    }

    if (config.interviewType === "technical") {
      return {
        ...baseCriteria,
        technicalAccuracy: "Response should be technically accurate",
        problemSolving: "Response should demonstrate problem-solving approach",
      };
    }

    return baseCriteria;
  }

  private getQuestionType(
    index: number, 
    total: number, 
    decision: FollowUpDecision
  ): string {
    if (decision.action === "follow_up") return "follow-up";
    if (index === 0) return "opening";
    if (index === total - 1) return "closing";
    return "main";
  }

  private adjustDifficulty(current: string, delta: number): string {
    const levels = ["easy", "medium", "hard"];
    const currentIndex = levels.indexOf(current);
    const newIndex = Math.max(0, Math.min(levels.length - 1, currentIndex + delta));
    return levels[newIndex];
  }

  private getInterviewerName(interviewType: string): string {
    switch (interviewType) {
      case "behavioral":
      case "recruiter_call":
        return "Sarah";
      case "technical":
        return "Michael";
      case "system-design":
        return "David";
      case "case-study":
        return "Jennifer";
      default:
        return "Alex";
    }
  }

  private getInterviewerRole(interviewType: string): string {
    switch (interviewType) {
      case "behavioral":
      case "recruiter_call":
        return "HR Recruiter";
      case "technical":
        return "Engineering Manager";
      case "system-design":
        return "Senior Architect";
      case "case-study":
        return "Business Analyst";
      default:
        return "Hiring Manager";
    }
  }

  /**
   * Process a conversation turn using the unified chain (single LLM call per turn).
   * This replaces the fragmented multi-chain approach with a more natural flow.
   */
  private async processAnswerUnified(
    sessionId: number,
    questionId: number,
    answer: string,
    session: InterviewSession,
    question: InterviewQuestion
  ): Promise<{
    evaluation?: EvaluationResult;
    decision?: FollowUpDecision;
    nextQuestion?: InterviewQuestion;
    reflection?: string;
    finalReport?: FinalReport;
    closure?: string;
    pacing?: {
      elapsedMinutes: number;
      progressPercent: number;
      status: 'starting' | 'on_track' | 'mid_interview' | 'wrapping_soon' | 'overtime';
    };
  }> {
    const memory = this.getMemory(sessionId);
    const config = this.getConfig(session, memory.jobContext);
    const interviewerName = this.getInterviewerName(session.interviewType);
    const interviewerRole = this.getInterviewerRole(session.interviewType);

    // =========================================================================
    // TWO-PHASE WRAP-UP: Check if we're waiting for candidate's response to "any questions?"
    // =========================================================================
    if (memory.pendingWrapUp) {
      console.log('[Unified Chain] Completing pending wrap-up after candidate response');
      
      // Add candidate's answer to conversation history
      memory.conversationHistory.push({
        role: 'candidate',
        content: answer,
      });
      
      // Save candidate's response to the closing question (no score - not an evaluation question)
      await storage.updateInterviewQuestion(questionId, {
        candidateAnswer: answer,
        feedback: 'Closing question response - not scored',
        answeredAt: new Date(),
      });
      
      // Generate a brief closure message (thanking them, next steps)
      const closureMessage = await this.closure.generate(config, memory.candidateName);
      
      // Add closure to conversation history for completeness
      memory.conversationHistory.push({
        role: 'interviewer',
        content: closureMessage,
      });
      
      // Clear the pending wrap-up flag before generating report
      const wrapUpReason = memory.pendingWrapUp.wrapUpReason;
      memory.pendingWrapUp = undefined;
      
      // Generate final report (uses only actual scored questions from memory.scores)
      const finalReport = await this.generateFinalReport(sessionId);
      
      console.log('[Telemetry] Wrap-up completed:', {
        sessionId,
        trigger: 'pending_wrap_up_resolved',
        reason: wrapUpReason,
        questionsAsked: memory.totalQuestionsAsked,
        avgScore: memory.scores.length > 0 
          ? Math.round((memory.scores.reduce((a, b) => a + b, 0) / memory.scores.length) * 10) / 10
          : 0,
        sessionDurationMs: Date.now() - memory.telemetry.startedAt,
      });
      
      await storage.updateInterviewSession(sessionId, {
        status: "completed",
        overallScore: finalReport.overallScore,
        completedAt: new Date(),
      });

      this.memory.delete(sessionId);

      return {
        finalReport,
        closure: closureMessage,
      };
    }

    // Add candidate's answer to conversation history
    memory.conversationHistory.push({
      role: 'candidate',
      content: answer,
    });

    // Capture coverage BEFORE this turn for telemetry
    const coverageBefore = {
      background: memory.coverage.background.score,
      skills: memory.coverage.skills.score,
      behavioral: memory.coverage.behavioral.score,
      motivation: memory.coverage.motivation.score,
      culture_fit: memory.coverage.culture_fit.score,
      logistics: memory.coverage.logistics.score,
    };
    
    // Calculate overall coverage before
    const overallBefore = Object.values(coverageBefore).reduce((a, b) => a + b, 0) / 6;

    // Build coverage status for the unified chain
    const coverageStatus = coverageBefore;

    // Call the unified chain with criterion probe tracking
    const turnResult = await this.unifiedTurn.processTurn({
      interviewerName,
      interviewerRole,
      companyName: config.companyName || 'the company',
      companyDescription: config.companyDescription || '',
      jobTitle: config.jobTitle || config.targetRole,
      jobRequirements: config.jobRequirements || '',
      candidateName: memory.candidateName || 'Candidate',
      conversationHistory: memory.conversationHistory,
      questionBacklog: memory.interviewPlan?.questions || [],
      coverageStatus,
      questionsAskedCount: memory.totalQuestionsAsked,
      maxQuestions: config.stageSettings?.maxQuestions || 12,
      lastQuestionId: memory.currentQuestionId,
      consecutiveCriterionProbes: memory.consecutiveCriterionProbes,
    });

    console.log('[Unified Chain] Turn result:', {
      actionType: turnResult.actionType,
      questionId: turnResult.questionId,
      score: turnResult.evaluation.score,
      criterion: turnResult.evaluation.criterionCovered,
    });

    // Update memory with evaluation
    const evaluation: EvaluationResult = {
      score: turnResult.evaluation.score,
      feedback: `Score: ${turnResult.evaluation.score}/10`,
      strengths: turnResult.evaluation.strengths,
      improvements: turnResult.evaluation.areasToImprove,
      projectMentioned: null,
    };

    memory.answers.push(answer);
    memory.scores.push(evaluation.score);
    memory.evaluations.push(evaluation);
    memory.totalQuestionsAsked++;

    // Update coverage from unified chain's evaluation
    const criterion = turnResult.evaluation.criterionCovered;
    if (memory.coverage[criterion]) {
      memory.coverage[criterion].score = Math.min(1, 
        memory.coverage[criterion].score + turnResult.evaluation.coverageContribution
      );
      memory.coverage[criterion].questionsAsked++;
    }
    
    // Track consecutive criterion probes to prevent repetitive questioning
    if (criterion === memory.consecutiveCriterionProbes.criterion) {
      memory.consecutiveCriterionProbes.count++;
    } else {
      // Different criterion - reset counter
      memory.consecutiveCriterionProbes = { criterion, count: 1 };
    }
    
    console.log('[Topic Rotation] Criterion probe tracking:', {
      criterion,
      consecutiveCount: memory.consecutiveCriterionProbes.count,
    });
    
    // Capture coverage AFTER this turn for telemetry
    const coverageAfter = {
      background: memory.coverage.background.score,
      skills: memory.coverage.skills.score,
      behavioral: memory.coverage.behavioral.score,
      motivation: memory.coverage.motivation.score,
      culture_fit: memory.coverage.culture_fit.score,
      logistics: memory.coverage.logistics.score,
    };
    const overallAfter = Object.values(coverageAfter).reduce((a, b) => a + b, 0) / 6;
    
    // Log coverage telemetry with deltas
    console.log('[Telemetry] Coverage update:', {
      sessionId,
      turn: memory.totalQuestionsAsked,
      criterionUpdated: criterion,
      contributionAdded: turnResult.evaluation.coverageContribution,
      before: {
        overall: Math.round(overallBefore * 100) / 100,
        ...Object.fromEntries(
          Object.entries(coverageBefore).map(([k, v]) => [k, Math.round(v * 100) / 100])
        ),
      },
      after: {
        overall: Math.round(overallAfter * 100) / 100,
        ...Object.fromEntries(
          Object.entries(coverageAfter).map(([k, v]) => [k, Math.round(v * 100) / 100])
        ),
      },
      delta: {
        overall: Math.round((overallAfter - overallBefore) * 100) / 100,
        [criterion]: Math.round(turnResult.evaluation.coverageContribution * 100) / 100,
      },
    });

    // Mark covered questions from backlog
    if (turnResult.coveredQuestionIds.length > 0 && memory.interviewPlan) {
      for (const id of turnResult.coveredQuestionIds) {
        const q = memory.interviewPlan.questions.find(q => q.id === id);
        if (q) q.status = 'covered_proactively';
      }
    }

    // Mark the question as asked if applicable
    if (turnResult.questionId && memory.interviewPlan) {
      const q = memory.interviewPlan.questions.find(q => q.id === turnResult.questionId);
      if (q) {
        q.status = 'asked';
        memory.currentQuestionId = turnResult.questionId;
      }
    }

    // Update telemetry
    this.updateTelemetry(memory, evaluation.score);

    // Add interviewer's response to conversation history
    memory.conversationHistory.push({
      role: 'interviewer',
      content: turnResult.response,
    });

    // Save evaluation to database
    await storage.updateInterviewQuestion(questionId, {
      candidateAnswer: answer,
      score: evaluation.score,
      feedback: evaluation.feedback,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      answeredAt: new Date(),
    });

    // Handle wrap-up
    if (turnResult.actionType === 'wrap_up') {
      // Log wrap-up telemetry
      const pendingQuestions = memory.interviewPlan?.questions.filter(q => q.status === 'pending').length || 0;
      const coveredQuestions = memory.interviewPlan?.questions.filter(q => q.status === 'covered_proactively').length || 0;
      const askedQuestions = memory.interviewPlan?.questions.filter(q => q.status === 'asked').length || 0;
      
      console.log('[Telemetry] Wrap-up triggered:', {
        sessionId,
        trigger: 'unified_chain_decision',
        questionsAsked: memory.totalQuestionsAsked,
        finalCoverage: {
          overall: Math.round(overallAfter * 100) / 100,
          background: Math.round(coverageAfter.background * 100) / 100,
          skills: Math.round(coverageAfter.skills * 100) / 100,
          behavioral: Math.round(coverageAfter.behavioral * 100) / 100,
          motivation: Math.round(coverageAfter.motivation * 100) / 100,
          culture_fit: Math.round(coverageAfter.culture_fit * 100) / 100,
          logistics: Math.round(coverageAfter.logistics * 100) / 100,
        },
        backlogStatus: {
          pending: pendingQuestions,
          asked: askedQuestions,
          coveredProactively: coveredQuestions,
          total: memory.interviewPlan?.questions.length || 0,
        },
        avgScore: memory.scores.length > 0 
          ? Math.round((memory.scores.reduce((a, b) => a + b, 0) / memory.scores.length) * 10) / 10
          : 0,
        sessionDurationMs: Date.now() - memory.telemetry.startedAt,
      });
      
      // TWO-PHASE WRAP-UP: Always defer if wrapUpReason indicates a conversational close
      // The chain sets wrapUpReason when it decides to wrap up - trust that signal
      const shouldDeferWrapUp = !!turnResult.wrapUpReason;
      
      if (shouldDeferWrapUp) {
        console.log('[Unified Chain] Deferring wrap-up - waiting for candidate response', {
          wrapUpReason: turnResult.wrapUpReason,
          hasQuestion: turnResult.response.includes('?'),
        });
        
        // Set pending wrap-up state
        memory.pendingWrapUp = {
          wrapUpReason: turnResult.wrapUpReason || 'sufficient_coverage',
          timestamp: Date.now(),
          closurePromptAsked: true,
        };
        
        // Continue the interview to get the candidate's response to "any questions?"
        const nextQuestionIndex = session.currentQuestionIndex + 1;
        
        await storage.updateInterviewSession(sessionId, {
          currentQuestionIndex: nextQuestionIndex,
        });
        
        // Create the wrap-up prompt as a closing question (not core)
        const nextQuestion = await storage.createInterviewQuestion({
          sessionId: session.id,
          questionIndex: nextQuestionIndex,
          questionText: turnResult.response,
          questionType: 'closing', // Distinct from core questions
          expectedCriteria: {},
        });
        
        // Don't increment totalQuestionsAsked for closing prompts - they're not evaluation questions
        memory.questions.push(turnResult.response);
        memory.currentStage = 'wrapup';
        
        // Calculate pacing info for frontend (show wrapping_soon status)
        const stageConfig = getStageRuntimeConfig(config.interviewType as 'hr' | 'technical' | 'final');
        const pacing = this.getPacingInfo(memory, stageConfig);
        // Override status to indicate wrap-up phase
        pacing.status = 'wrapping_soon';
        
        return {
          evaluation,
          nextQuestion,
          decision: {
            action: 'next_question',
            reason: 'Wrap-up question - waiting for candidate response',
          },
          pacing,
        };
      }
      
      // Direct closure (no question in response) - finalize immediately
      const finalReport = await this.generateFinalReport(sessionId);

      await storage.updateInterviewSession(sessionId, {
        status: "completed",
        overallScore: finalReport.overallScore,
        completedAt: new Date(),
      });

      this.memory.delete(sessionId);

      return {
        evaluation,
        finalReport,
        closure: turnResult.response,
      };
    }

    // Continue with next question
    const nextQuestionIndex = session.currentQuestionIndex + 1;

    await storage.updateInterviewSession(sessionId, {
      currentQuestionIndex: nextQuestionIndex,
    });

    // Create next question record
    const nextQuestion = await storage.createInterviewQuestion({
      sessionId: session.id,
      questionIndex: nextQuestionIndex,
      questionText: turnResult.response,
      questionType: turnResult.actionType === 'follow_up' ? 'follow_up' : 'core',
      expectedCriteria: this.getExpectedCriteria(config, nextQuestionIndex),
    });

    memory.questions.push(turnResult.response);
    memory.currentStage = 'core';

    // Calculate pacing info for frontend
    const stageConfig = getStageRuntimeConfig(config.interviewType as 'hr' | 'technical' | 'final');
    const pacing = this.getPacingInfo(memory, stageConfig);

    return {
      evaluation,
      nextQuestion,
      decision: {
        action: turnResult.actionType === 'follow_up' ? 'follow_up' : 'next_question',
        reason: 'Unified chain decision',
      },
      pacing,
    };
  }

  /**
   * Process a conversation turn for team interviews with multi-persona support
   * and level-calibrated evaluation.
   */
  private async processAnswerTeam(
    sessionId: number,
    questionId: number,
    answer: string,
    session: InterviewSession,
    question: InterviewQuestion
  ): Promise<{
    evaluation?: EvaluationResult;
    decision?: FollowUpDecision;
    nextQuestion?: InterviewQuestion;
    reflection?: string;
    finalReport?: FinalReport;
    closure?: string;
    pacing?: {
      elapsedMinutes: number;
      progressPercent: number;
      status: 'starting' | 'on_track' | 'mid_interview' | 'wrapping_soon' | 'overtime';
    };
    activePersona?: { id: string; name: string; role: string; displayRole: string };
    teamPersonas?: Array<{ id: string; name: string; role: string; displayRole: string }>;
  }> {
    const memory = this.getMemory(sessionId);
    const config = this.getConfig(session, memory.jobContext);
    const settings = memory.teamSettings!;
    const activePersona = settings.personas.find(p => p.id === memory.activePersonaId) || settings.personas[0];

    // Add candidate's answer to conversation history
    memory.conversationHistory.push({
      role: 'candidate',
      content: answer,
    });

    // Build coverage status for team interview criteria
    const coverageStatus: Record<string, number> = {
      learning_mindset: memory.coverage.behavioral.score,
      collaboration: memory.coverage.culture_fit.score,
      problem_solving: memory.coverage.skills.score,
      technical_foundations: memory.coverage.background.score,
    };

    // Call the team interview chain
    const turnResult = await this.teamTurn.processTurn({
      activePersona,
      allPersonas: settings.personas,
      experienceLevel: settings.experienceLevel,
      companyName: config.companyName || 'the company',
      companyDescription: config.companyDescription || '',
      jobTitle: config.jobTitle || config.targetRole,
      candidateName: memory.candidateName || 'Candidate',
      conversationHistory: memory.conversationHistory,
      questionBacklog: memory.teamQuestionBacklog || [],
      coverageStatus,
      questionsAskedCount: memory.totalQuestionsAsked,
      maxQuestions: settings.maxQuestions,
      currentQuestionId: memory.currentQuestionId,
      levelExpectations: getLevelExpectationsText(settings),
    });

    console.log('[Team Interview] Turn result:', {
      activePersona: activePersona.name,
      actionType: turnResult.actionType,
      nextPersona: turnResult.nextPersonaId,
      score: turnResult.evaluation.score,
      criterion: turnResult.evaluation.criterionCovered,
    });

    // Update memory with evaluation
    const evaluation: EvaluationResult = {
      score: turnResult.evaluation.score,
      feedback: `Score: ${turnResult.evaluation.score}/10 (${settings.experienceLevel} level)`,
      strengths: turnResult.evaluation.strengths,
      improvements: turnResult.evaluation.areasToImprove,
      projectMentioned: null,
    };

    memory.answers.push(answer);
    memory.scores.push(evaluation.score);
    memory.evaluations.push(evaluation);
    memory.totalQuestionsAsked++;
    memory.personaQuestionCounts![activePersona.id] = (memory.personaQuestionCounts![activePersona.id] || 0) + 1;

    // Map team interview criteria to coverage tracker
    const criterionMapping: Record<string, keyof CoverageTracker> = {
      'learning_mindset': 'behavioral',
      'collaboration': 'culture_fit',
      'problem_solving': 'skills',
      'technical_foundations': 'background',
    };
    const mappedCriterion = criterionMapping[turnResult.evaluation.criterionCovered] || 'behavioral';
    if (memory.coverage[mappedCriterion]) {
      memory.coverage[mappedCriterion].score = Math.min(1,
        memory.coverage[mappedCriterion].score + turnResult.evaluation.coverageContribution
      );
      memory.coverage[mappedCriterion].questionsAsked++;
    }

    // Handle persona handoff
    if (turnResult.actionType === 'hand_off' && turnResult.nextPersonaId) {
      memory.activePersonaId = turnResult.nextPersonaId;
      const nextPersona = settings.personas.find(p => p.id === turnResult.nextPersonaId);
      console.log('[Team Interview] Handoff to:', nextPersona?.name);
    }

    // Update telemetry
    this.updateTelemetry(memory, evaluation.score);

    // Add interviewer's response to conversation history with persona info
    memory.conversationHistory.push({
      role: 'interviewer',
      content: turnResult.response,
      personaId: turnResult.actionType === 'hand_off' ? turnResult.nextPersonaId : activePersona.id,
    });

    // Save evaluation to database
    await storage.updateInterviewQuestion(questionId, {
      candidateAnswer: answer,
      score: evaluation.score,
      feedback: evaluation.feedback,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      answeredAt: new Date(),
    });

    // Handle wrap-up
    if (turnResult.actionType === 'wrap_up') {
      console.log('[Team Interview] Wrap-up triggered:', {
        sessionId,
        experienceLevel: settings.experienceLevel,
        questionsAsked: memory.totalQuestionsAsked,
        personaBreakdown: memory.personaQuestionCounts,
        avgScore: memory.scores.length > 0
          ? Math.round((memory.scores.reduce((a, b) => a + b, 0) / memory.scores.length) * 10) / 10
          : 0,
        reason: turnResult.wrapUpReason,
      });

      const finalReport = await this.generateFinalReport(sessionId);

      await storage.updateInterviewSession(sessionId, {
        status: "completed",
        overallScore: finalReport.overallScore,
        completedAt: new Date(),
      });

      this.memory.delete(sessionId);

      return {
        evaluation,
        finalReport,
        closure: turnResult.response,
      };
    }

    // Continue with next question
    const nextQuestionIndex = session.currentQuestionIndex + 1;

    await storage.updateInterviewSession(sessionId, {
      currentQuestionIndex: nextQuestionIndex,
    });

    // Create next question record
    const nextQuestion = await storage.createInterviewQuestion({
      sessionId: session.id,
      questionIndex: nextQuestionIndex,
      questionText: turnResult.response,
      questionType: turnResult.actionType === 'follow_up' ? 'follow_up' : 'core',
      expectedCriteria: this.getExpectedCriteria(config, nextQuestionIndex),
    });

    memory.questions.push(turnResult.response);
    memory.currentStage = 'core';

    // Calculate pacing info for frontend
    const stageConfig = getStageRuntimeConfig('hr'); // Team interviews use HR pacing
    const pacing = this.getPacingInfo(memory, stageConfig);

    return {
      evaluation,
      nextQuestion,
      decision: {
        action: turnResult.actionType === 'follow_up' ? 'follow_up' : 'next_question',
        reason: `Team interview - ${activePersona.name}`,
      },
      pacing,
      // Include persona info for team interview UI
      activePersona: {
        id: activePersona.id,
        name: activePersona.name,
        role: activePersona.role,
        displayRole: activePersona.displayRole,
      },
      teamPersonas: settings.personas.map(p => ({
        id: p.id,
        name: p.name,
        role: p.role,
        displayRole: p.displayRole,
      })),
    };
  }
}

export const interviewOrchestrator = new InterviewOrchestrator();
