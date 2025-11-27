import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

const model = new ChatOpenAI({
  modelName: "gpt-4o",
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

const evaluatorModel = new ChatOpenAI({
  modelName: "gpt-4o",
  temperature: 0.3,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

export interface InterviewConfig {
  interviewType: string;
  targetRole: string;
  difficulty: string;
  totalQuestions: number;
}

export interface QuestionContext {
  config: InterviewConfig;
  questionIndex: number;
  previousQuestions: string[];
  previousAnswers: string[];
  previousScores: number[];
}

export interface EvaluationResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface FollowUpDecision {
  action: "next_question" | "follow_up" | "adjust_difficulty" | "end_interview";
  reason: string;
  difficultyAdjustment?: "easier" | "harder" | "same";
}

export interface FinalReport {
  overallScore: number;
  communicationScore: number;
  technicalScore: number;
  problemSolvingScore: number;
  cultureFitScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  hiringDecision: string;
}

const questionGeneratorPrompt = PromptTemplate.fromTemplate(`
You are an expert interviewer conducting a {interviewType} interview for a {targetRole} position.
Difficulty level: {difficulty}

Interview Progress:
- Question {questionIndex} of {totalQuestions}
- Previous questions asked: {previousQuestions}

Generate the next interview question. Consider:
1. Don't repeat topics already covered
2. Match the difficulty level appropriately
3. For behavioral: Use STAR method prompts
4. For technical: Focus on practical scenarios
5. Build complexity as the interview progresses

If this is question 1, start with an icebreaker or introduction question.
If this is the last question, make it a closing/wrap-up question.

Respond with ONLY the interview question, nothing else.
`);

const evaluatorPrompt = PromptTemplate.fromTemplate(`
You are an expert interview evaluator assessing a candidate's response.

Interview Type: {interviewType}
Target Role: {targetRole}
Difficulty: {difficulty}

Question Asked:
{question}

Candidate's Answer:
{answer}

Evaluate the response and provide a JSON response with this exact structure:
{{
  "score": <number 1-10>,
  "feedback": "<constructive feedback>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<area to improve 1>", "<area to improve 2>"]
}}

Scoring Guide:
- 9-10: Exceptional, exceeds expectations
- 7-8: Strong, meets expectations well
- 5-6: Adequate, meets basic expectations
- 3-4: Below expectations, needs improvement
- 1-2: Poor, significant gaps

Respond with ONLY valid JSON, no other text.
`);

const followUpPrompt = PromptTemplate.fromTemplate(`
You are an interview flow manager deciding the next step.

Current Progress:
- Question {questionIndex} of {totalQuestions}
- Latest score: {latestScore}/10
- Average score so far: {averageScore}/10
- Difficulty: {difficulty}

Previous Scores: {previousScores}

Decide what to do next and respond with JSON:
{{
  "action": "<next_question | follow_up | adjust_difficulty | end_interview>",
  "reason": "<brief explanation>",
  "difficultyAdjustment": "<easier | harder | same>"
}}

Guidelines:
- If score < 4: Consider a follow-up or easier question
- If score > 8: Consider a harder question
- If this is the last question: action should be "end_interview"
- Balance challenge with candidate experience

Respond with ONLY valid JSON.
`);

const scoringPrompt = PromptTemplate.fromTemplate(`
You are a senior hiring manager generating a final interview report.

Interview Summary:
- Type: {interviewType}
- Role: {targetRole}
- Difficulty: {difficulty}
- Total Questions: {totalQuestions}

Questions and Evaluations:
{questionsAndAnswers}

Individual Scores: {scores}
Average Score: {averageScore}

Generate a comprehensive final report as JSON:
{{
  "overallScore": <0-100>,
  "communicationScore": <0-100>,
  "technicalScore": <0-100 or null if not applicable>,
  "problemSolvingScore": <0-100>,
  "cultureFitScore": <0-100>,
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<key strength 1>", "<key strength 2>", "<key strength 3>"],
  "improvements": ["<improvement area 1>", "<improvement area 2>"],
  "recommendations": ["<specific recommendation 1>", "<specific recommendation 2>"],
  "hiringDecision": "<strong_yes | yes | maybe | no | strong_no>"
}}

Be fair, constructive, and specific in your assessment.
Respond with ONLY valid JSON.
`);

export class QuestionGeneratorChain {
  private chain: RunnableSequence;

  constructor() {
    this.chain = RunnableSequence.from([
      questionGeneratorPrompt,
      model,
      new StringOutputParser(),
    ]);
  }

  async generate(context: QuestionContext): Promise<string> {
    const result = await this.chain.invoke({
      interviewType: context.config.interviewType,
      targetRole: context.config.targetRole,
      difficulty: context.config.difficulty,
      questionIndex: context.questionIndex + 1,
      totalQuestions: context.config.totalQuestions,
      previousQuestions: context.previousQuestions.length > 0 
        ? context.previousQuestions.join("\n- ") 
        : "None yet",
    });
    return result.trim();
  }
}

export class EvaluatorChain {
  private chain: RunnableSequence;

  constructor() {
    this.chain = RunnableSequence.from([
      evaluatorPrompt,
      evaluatorModel,
      new StringOutputParser(),
    ]);
  }

  async evaluate(
    config: InterviewConfig,
    question: string,
    answer: string
  ): Promise<EvaluationResult> {
    const result = await this.chain.invoke({
      interviewType: config.interviewType,
      targetRole: config.targetRole,
      difficulty: config.difficulty,
      question,
      answer,
    });

    try {
      return JSON.parse(result);
    } catch (error) {
      console.error("Failed to parse evaluation result:", result);
      return {
        score: 5,
        feedback: "Unable to fully evaluate the response.",
        strengths: [],
        improvements: ["Please provide more detail in your response."],
      };
    }
  }
}

export class FollowUpChain {
  private chain: RunnableSequence;

  constructor() {
    this.chain = RunnableSequence.from([
      followUpPrompt,
      model,
      new StringOutputParser(),
    ]);
  }

  async decide(
    config: InterviewConfig,
    questionIndex: number,
    latestScore: number,
    previousScores: number[]
  ): Promise<FollowUpDecision> {
    const averageScore = previousScores.length > 0
      ? previousScores.reduce((a, b) => a + b, 0) / previousScores.length
      : latestScore;

    const result = await this.chain.invoke({
      questionIndex: questionIndex + 1,
      totalQuestions: config.totalQuestions,
      latestScore,
      averageScore: averageScore.toFixed(1),
      difficulty: config.difficulty,
      previousScores: previousScores.join(", ") || "None",
    });

    try {
      return JSON.parse(result);
    } catch (error) {
      console.error("Failed to parse follow-up decision:", result);
      return {
        action: questionIndex >= config.totalQuestions - 1 ? "end_interview" : "next_question",
        reason: "Proceeding to next step",
        difficultyAdjustment: "same",
      };
    }
  }
}

export class ScoringChain {
  private chain: RunnableSequence;

  constructor() {
    this.chain = RunnableSequence.from([
      scoringPrompt,
      evaluatorModel,
      new StringOutputParser(),
    ]);
  }

  async generateReport(
    config: InterviewConfig,
    questionsAndAnswers: Array<{ question: string; answer: string; score: number; feedback: string }>,
    scores: number[]
  ): Promise<FinalReport> {
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    const formattedQA = questionsAndAnswers.map((qa, i) => 
      `Q${i + 1}: ${qa.question}\nA: ${qa.answer}\nScore: ${qa.score}/10\nFeedback: ${qa.feedback}`
    ).join("\n\n");

    const result = await this.chain.invoke({
      interviewType: config.interviewType,
      targetRole: config.targetRole,
      difficulty: config.difficulty,
      totalQuestions: config.totalQuestions,
      questionsAndAnswers: formattedQA,
      scores: scores.join(", "),
      averageScore: averageScore.toFixed(1),
    });

    try {
      return JSON.parse(result);
    } catch (error) {
      console.error("Failed to parse final report:", result);
      const scaledScore = Math.round(averageScore * 10);
      return {
        overallScore: scaledScore,
        communicationScore: scaledScore,
        technicalScore: scaledScore,
        problemSolvingScore: scaledScore,
        cultureFitScore: scaledScore,
        summary: "Interview completed. Please review individual question feedback for details.",
        strengths: ["Completed the interview"],
        improvements: ["Review individual feedback"],
        recommendations: ["Consider practicing with more mock interviews"],
        hiringDecision: scaledScore >= 70 ? "yes" : scaledScore >= 50 ? "maybe" : "no",
      };
    }
  }
}
