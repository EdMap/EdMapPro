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
  InterviewConfig,
  QuestionContext,
  EvaluationResult,
  FollowUpDecision,
  FinalReport,
  InterviewStage,
  InterviewPlan,
  PlannedQuestion,
  TriageDecision,
  getInterviewStage,
  getPreludeStage,
  shouldGenerateReflection,
} from "./interview-chains";
import { storage } from "../storage";
import type { InterviewSession, InterviewQuestion } from "@shared/schema";
import { responseClassifier, CandidateIntent, ClassificationResult } from "./response-classifier";
import { responseHandler } from "./response-handler";

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
    };
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
   */
  private shouldWrapUp(memory: ConversationMemory): {
    shouldEnd: boolean;
    reason: 'sufficient' | 'max_reached' | 'time_pressure' | 'continue';
    message?: string;
  } {
    const sufficiency = this.calculateSufficiency(memory);
    const questionsAsked = memory.totalQuestionsAsked;
    
    // Check if we've hit the max question limit
    if (questionsAsked >= SUFFICIENCY_CONFIG.maxQuestions) {
      return {
        shouldEnd: true,
        reason: 'max_reached',
        message: sufficiency.gaps.length > 0
          ? `We've covered a lot of ground today. I still had a few topics I wanted to explore, but we're at our time limit.`
          : undefined
      };
    }
    
    // Check if we have sufficient coverage
    if (sufficiency.overall >= SUFFICIENCY_CONFIG.overallThreshold && sufficiency.criticalMet) {
      return {
        shouldEnd: true,
        reason: 'sufficient',
      };
    }
    
    // Check if we're approaching the limit with gaps remaining
    const timeRatio = questionsAsked / SUFFICIENCY_CONFIG.maxQuestions;
    if (timeRatio >= SUFFICIENCY_CONFIG.timeWarningThreshold && !memory.timeWarningGiven && sufficiency.gaps.length > 0) {
      memory.timeWarningGiven = true;
      return {
        shouldEnd: false,
        reason: 'time_pressure',
        message: `We're running a bit short on our scheduled time, but I still have a few key questions I'd like to cover.`
      };
    }
    
    return { shouldEnd: false, reason: 'continue' };
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
    candidateName?: string
  ): Promise<{ 
    session: InterviewSession; 
    firstQuestion?: InterviewQuestion; 
    greeting?: string;
    introduction?: string;
    isPreludeMode?: boolean;
  }> {
    const session = await storage.createInterviewSession({
      userId,
      interviewType,
      targetRole,
      difficulty,
      totalQuestions,
      status: "in_progress",
      currentQuestionIndex: 0,
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
  }> {
    const session = await storage.getInterviewSession(sessionId);
    if (!session) {
      throw new Error("Interview session not found");
    }

    const memory = this.getMemory(sessionId);
    const config = this.getConfig(session, memory.jobContext);

    // Store the candidate's response
    memory.preludeResponses.push(candidateResponse);

    // Advance prelude step
    memory.preludeStep++;

    if (memory.preludeStep === 1) {
      // Step 1: After greeting, propose introductions
      const introExchangeText = await this.introExchange.generate(config, candidateResponse);
      memory.currentStage = "intro_exchange";
      return { preludeMessage: introExchangeText, preludeComplete: false };
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
        return { preludeMessage: ackAndIntro, preludeComplete: false };
      }
      
      // Check if the candidate is asking a conversational question alongside their response
      // e.g., "Sure. But before that, how are you?"
      const hasConversationalQuestion = this.isConversationalQuestion(candidateResponse);
      
      if (hasConversationalQuestion) {
        // Answer their question and then proceed with role overview
        const warmResponse = await this.generateWarmResponseWithIntro(candidateResponse, config);
        // Don't decrement - we're answering and proceeding to role overview in one message
        return { preludeMessage: warmResponse, preludeComplete: false };
      }
      
      // Step 2: Parse candidate's response to intro exchange proposal
      const introPreference = this.classifyIntroResponse(candidateResponse);
      
      if (introPreference === 'candidate_first') {
        // Candidate wants to go first - acknowledge and wait for their intro
        const ackMessage = "Of course, please go ahead! I'd love to hear about you first.";
        memory.awaitingCandidateIntro = true;
        memory.preludeStep = 1; // Stay at step 1 so next increment brings us back to step 2
        return { preludeMessage: ackMessage, preludeComplete: false };
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

        return { firstQuestion: question, preludeComplete: true };
      }
      
      // Default: interviewer goes first with role overview
      const selfIntroText = await this.selfIntro.generate(config);
      return { preludeMessage: selfIntroText, preludeComplete: false };
    }

    if (memory.preludeStep >= 3) {
      // Step 3+: Check if the candidate is asking a conversational question
      // before proceeding to the first real interview question
      const isConversationalQuestion = this.isConversationalQuestion(candidateResponse);
      
      if (isConversationalQuestion) {
        // Respond warmly to conversational questions like "how're you?"
        const warmResponse = this.generateWarmResponse(candidateResponse);
        memory.preludeStep--; // Stay at current step to ask question after responding
        return { preludeMessage: warmResponse, preludeComplete: false };
      }
      
      // Check if the candidate already provided a substantive background response
      // The selfIntro ends with "could you tell me a bit about your background?"
      // so if they gave a real answer, we should acknowledge it and move forward
      const isSubstantiveBackgroundAnswer = this.isSubstantiveBackgroundAnswer(candidateResponse);
      
      if (isSubstantiveBackgroundAnswer) {
        // They already answered the background question - store it and move to next question
        memory.currentStage = "core";
        
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
        
        // Generate a reflection to acknowledge their answer
        const reflectionText = await this.reflection.generate(candidateResponse, memory.lastReflection, "Sarah");
        memory.lastReflection = reflectionText;
        
        // Generate the second question (since first was already answered)
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
          // Include reflection to acknowledge their answer
        };
      }
      
      // After intros are done, start the real interview
      memory.currentStage = "opening";
      
      // Generate the first real interview question
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

      return { firstQuestion: question, preludeComplete: true };
    }

    // Should not reach here
    return { preludeComplete: false };
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
      candidateQuestionAnswer = handlerResult.response;
    }
    
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
    const wrapUpCheck = this.shouldWrapUp(memory);
    
    // Determine stages: what stage was the question we just answered, and what's next
    const answeredQuestionStage = getInterviewStage(session.currentQuestionIndex, config.totalQuestions);
    memory.currentStage = answeredQuestionStage;
    
    // Use dynamic sufficiency check instead of fixed question count
    const shouldEndInterview = wrapUpCheck.shouldEnd || decision.action === "end_interview";
    
    if (shouldEndInterview) {
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
      
      // Generate closure message before ending
      const closureMessage = await this.closure.generate(config);
      
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
      
      // If pending follow-up needed, store it
      if ((triageDecision.outcome === 'partial' || triageDecision.outcome === 'vague') && 
          triageDecision.followUpPrompt) {
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
    
    if (shouldDoWrapup && !sufficiency.gaps.includes('logistics')) {
      // We have good coverage - do a natural wrapup
      nextQuestionText = await this.wrapup.generate(config);
    } else if (memory.pendingFollowUp && triageDecision?.action === 'follow_up') {
      // Use the follow-up question for partial/vague answers
      nextQuestionText = memory.pendingFollowUp;
      memory.pendingFollowUp = undefined; // Clear after use
    } else if (memory.interviewPlan) {
      // Use the next planned question from the backlog
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
      // Fallback: Generate a focused question based on coverage gaps
      const prioritizedTopic = this.getPrioritizedTopic(memory);
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

    const nextQuestion = await storage.createInterviewQuestion({
      sessionId,
      questionIndex: nextQuestionIndex,
      questionText: nextQuestionText,
      questionType: this.getQuestionType(nextQuestionIndex, config.totalQuestions, decision),
      expectedCriteria: this.getExpectedCriteria(config, nextQuestionIndex),
    });

    return { evaluation, decision, nextQuestion, reflection: reflectionText, candidateQuestionAnswer };
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
}

export const interviewOrchestrator = new InterviewOrchestrator();
