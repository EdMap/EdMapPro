import { ChatGroq } from "@langchain/groq";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

const model = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
  apiKey: process.env.GROQ_API_KEY,
});

const evaluatorModel = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0.3,
  apiKey: process.env.GROQ_API_KEY,
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
  lastAnswer?: string;
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
You are Sarah, a friendly and experienced hiring manager conducting a {interviewType} interview for a {targetRole} position.
Your personality: Warm, encouraging, genuinely curious about the candidate. You make people feel comfortable while still being professional.

Interview Progress:
- This is question {questionIndex} of {totalQuestions}
- Topics already covered: {previousQuestions}
- Candidate's last answer: {lastAnswer}

IMPORTANT STYLE GUIDELINES:
1. Sound like a real person having a conversation, not a robot reading from a script
2. Use natural transitions and acknowledgments when moving between questions
3. Reference their previous answer briefly if relevant (e.g., "That's interesting that you mentioned X...")
4. Vary your phrasing - don't always start questions the same way
5. Be warm but professional

For question 1: Start with a genuine welcome and an easy icebreaker. Example: "Hi! Thanks for taking the time to chat with me today. Before we dive into the details, I'd love to hear a bit about your background - what drew you to {targetRole}?"

For middle questions: Naturally transition from the previous topic. Use phrases like:
- "That's a great point about... Speaking of which, I'm curious..."
- "I appreciate you sharing that. Let me ask you about a different scenario..."
- "Interesting! Building on that idea, how would you handle..."

For the last question: Wrap up conversationally. Example: "We're coming up on the end here, and I have one last question for you..."

Generate your next conversational question now. Include a brief natural transition if this isn't the first question.
Respond with ONLY the interviewer's words (the question with any natural lead-in), nothing else.
`);

const evaluatorPrompt = PromptTemplate.fromTemplate(`
You are evaluating a candidate's interview response as a supportive coach who wants them to succeed.

Interview Context:
- Type: {interviewType}
- Role: {targetRole}
- Difficulty: {difficulty}

Question Asked:
{question}

Candidate's Answer:
{answer}

Provide encouraging, constructive feedback as JSON:
{{
  "score": <number 1-10>,
  "feedback": "<conversational feedback that sounds like a mentor giving advice, not a report card. Start with something positive, then offer constructive suggestions. Keep it warm and encouraging.>",
  "strengths": ["<specific thing they did well, phrased positively>", "<another strength>"],
  "improvements": ["<gentle suggestion phrased as 'You might also consider...' or 'Next time, try...'>", "<another helpful tip>"]
}}

Scoring Guide:
- 9-10: Exceptional - would impress any interviewer
- 7-8: Strong - solid answer with good examples
- 5-6: Good foundation - room to add more depth
- 3-4: Getting there - needs more specific examples
- 1-2: Early stage - let's work on the fundamentals

IMPORTANT: Write feedback like you're coaching a friend, not grading a paper. Be specific and actionable.
Example good feedback: "I really liked how you structured your answer around that project example! To make it even stronger, you could mention the specific metrics or outcomes - numbers really help paint the picture for interviewers."

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
    const lastAnswer = context.previousAnswers.length > 0 
      ? context.previousAnswers[context.previousAnswers.length - 1]
      : "This is the first question";
    
    const result = await this.chain.invoke({
      interviewType: context.config.interviewType,
      targetRole: context.config.targetRole,
      difficulty: context.config.difficulty,
      questionIndex: context.questionIndex + 1,
      totalQuestions: context.config.totalQuestions,
      previousQuestions: context.previousQuestions.length > 0 
        ? context.previousQuestions.join("\n- ") 
        : "None yet - this is the first question",
      lastAnswer: lastAnswer,
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
