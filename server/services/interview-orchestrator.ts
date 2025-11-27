import {
  QuestionGeneratorChain,
  EvaluatorChain,
  FollowUpChain,
  ScoringChain,
  IntroductionChain,
  ReflectionChain,
  InterviewConfig,
  QuestionContext,
  EvaluationResult,
  FollowUpDecision,
  FinalReport,
} from "./interview-chains";
import { storage } from "../storage";
import type { InterviewSession, InterviewQuestion } from "@shared/schema";

export interface JobContext {
  companyName?: string;
  companyDescription?: string;
  jobTitle?: string;
  jobRequirements?: string;
  candidateCv?: string;
}

interface ConversationMemory {
  questions: string[];
  answers: string[];
  scores: number[];
  evaluations: EvaluationResult[];
  activeProject: string | null;
  projectMentionCount: number;
  jobContext?: JobContext;
}

export class InterviewOrchestrator {
  private questionGenerator: QuestionGeneratorChain;
  private evaluator: EvaluatorChain;
  private followUp: FollowUpChain;
  private scoring: ScoringChain;
  private introduction: IntroductionChain;
  private reflection: ReflectionChain;
  private memory: Map<number, ConversationMemory>;

  constructor() {
    this.questionGenerator = new QuestionGeneratorChain();
    this.evaluator = new EvaluatorChain();
    this.followUp = new FollowUpChain();
    this.scoring = new ScoringChain();
    this.introduction = new IntroductionChain();
    this.reflection = new ReflectionChain();
    this.memory = new Map();
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

  async startInterview(
    userId: number,
    interviewType: string,
    targetRole: string,
    difficulty: string = "medium",
    totalQuestions: number = 5,
    jobContext?: JobContext
  ): Promise<{ session: InterviewSession; firstQuestion: InterviewQuestion; introduction?: string }> {
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

    // Generate introduction if we have job context (Journey mode)
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

    const question = await storage.createInterviewQuestion({
      sessionId: session.id,
      questionIndex: 0,
      questionText,
      questionType: "opening",
      expectedCriteria: this.getExpectedCriteria(config, 0),
    });

    return { session, firstQuestion: question, introduction };
  }

  async submitAnswer(
    sessionId: number,
    questionId: number,
    answer: string
  ): Promise<{
    evaluation: EvaluationResult;
    decision: FollowUpDecision;
    nextQuestion?: InterviewQuestion;
    reflection?: string;
    finalReport?: FinalReport;
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

    const evaluation = await this.evaluator.evaluate(
      config,
      question.questionText,
      answer
    );

    memory.answers.push(answer);
    memory.scores.push(evaluation.score);
    memory.evaluations.push(evaluation);
    
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

    if (decision.action === "end_interview" || session.currentQuestionIndex >= config.totalQuestions - 1) {
      const finalReport = await this.generateFinalReport(sessionId);
      
      await storage.updateInterviewSession(sessionId, {
        status: "completed",
        overallScore: finalReport.overallScore,
        completedAt: new Date(),
      });

      this.memory.delete(sessionId);

      return { evaluation, decision, finalReport };
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
    
    // Generate a brief reflection/acknowledgment of the answer (non-parroting)
    const reflectionText = await this.reflection.generate(
      question.questionText,
      answer,
      evaluation.score
    );
    
    const nextQuestionText = await this.questionGenerator.generate({
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
    });

    memory.questions.push(nextQuestionText);

    const nextQuestion = await storage.createInterviewQuestion({
      sessionId,
      questionIndex: nextQuestionIndex,
      questionText: nextQuestionText,
      questionType: this.getQuestionType(nextQuestionIndex, config.totalQuestions, decision),
      expectedCriteria: this.getExpectedCriteria(config, nextQuestionIndex),
    });

    return { evaluation, decision, nextQuestion, reflection: reflectionText };
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
}

export const interviewOrchestrator = new InterviewOrchestrator();
