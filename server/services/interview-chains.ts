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
  companyName?: string;
  companyDescription?: string;
  jobTitle?: string;
  jobRequirements?: string;
  candidateCv?: string;
  interviewerName?: string;
}

export interface QuestionContext {
  config: InterviewConfig;
  questionIndex: number;
  previousQuestions: string[];
  previousAnswers: string[];
  previousScores: number[];
  lastAnswer?: string;
  activeProject?: string | null;
}

export interface EvaluationResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  projectMentioned?: string | null;
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

const introductionPrompt = PromptTemplate.fromTemplate(`
You are {interviewerName}, a friendly {interviewerRole} at {companyName}.

You're about to start a {interviewType} interview with a candidate for the {jobTitle} position.

COMPANY INFO:
{companyDescription}

JOB REQUIREMENTS:
{jobRequirements}

CANDIDATE'S CV (USE EXACT FACTS - DO NOT INVENT):
{candidateCv}

Generate a warm, professional introduction that:
1. Greets the candidate warmly and thanks them for their time
2. Introduces yourself (your name and role at the company)
3. Briefly describes what {companyName} does (1-2 sentences)
4. Explains what this {interviewType} interview will cover
5. Mentions something specific from their CV to show you've reviewed it (if CV available)
6. Sets a comfortable tone for the conversation

Keep it natural and conversational - about 4-6 sentences total. End with a transitional phrase like "So, to get started..." but DON'T ask a question yet.
`);

const hrScreeningQuestionPrompt = PromptTemplate.fromTemplate(`
You are {interviewerName}, a genuinely interested HR recruiter at {companyName}.

YOUR OBJECTIVE: Explore whether this candidate is a good fit for the {jobTitle} role. You're curious about their background and want to understand:
- What drives them professionally
- How their experience maps to this role
- Whether they'd thrive in your company culture

COMPANY: {companyName}
JOB TITLE: {jobTitle}
ROLE TYPE: {targetRole}

CANDIDATE'S CV (USE ONLY FACTS FROM THIS - DO NOT INVENT DETAILS):
{candidateCv}

JOB REQUIREMENTS:
{jobRequirements}

Interview Progress:
- Question {questionIndex} of {totalQuestions}
- Topics covered: {previousQuestions}
- Last answer: {lastAnswer}

USING THE CV - CRITICAL:
You MUST reference specific details from their CV in your questions. ONLY use facts that appear in the CV above. NEVER invent or assume details not explicitly stated.
- Their exact years of experience as stated
- Actual companies/roles they've held (use exact names from CV)
- Their real educational background (exact universities, degrees)
- Skills or certifications they actually listed

ANTI-HALLUCINATION RULE:
If the CV says "PhD from Maastricht University" - say exactly that, NOT "PhD from [some other university]".
If the CV says "7+ years experience" - say "7 years", NOT "8 years".
Only mention companies, universities, and roles that are EXPLICITLY written in the CV.

HR SCREENING TOPICS (rotate through these):
1. Motivation: Why this role? Why {companyName}?
2. Career Story: How does this role fit their trajectory?
3. CV Deep-Dive (high-level): "I see you spent X years at Y - what was that experience like?"
4. Culture Fit: Work style, team preferences, values
5. Logistics: Availability, location, expectations

WHAT NOT TO DO:
- Don't ask generic questions that ignore their CV
- Don't ask technical/coding questions (that's for technical interviews)
- Don't be robotic or interrogative
- NEVER repeat a question already covered

FOR QUESTION 1: Reference something from their CV and ask about their interest. Example: "I see you have a background in X - what drew you to apply for this {targetRole} role at {companyName}?"

FOR QUESTIONS 2+: Start with a connector ("And," / "So," / "Now,") then ask about something NEW, ideally referencing their CV.

Output ONLY the question. Be warm and curious.
`);

const technicalQuestionPrompt = PromptTemplate.fromTemplate(`
You are {interviewerName}, a {interviewerRole} at {companyName} conducting a {interviewType} interview for a {targetRole} position.

COMPANY: {companyName}
JOB TITLE: {jobTitle}

CANDIDATE'S CV (USE EXACT FACTS - DO NOT INVENT):
{candidateCv}

JOB REQUIREMENTS:
{jobRequirements}

Interview Progress:
- Question {questionIndex} of {totalQuestions}
- Topics covered: {previousQuestions}
- Last answer: {lastAnswer}
- Project/example they mentioned: {activeProject}

INTERVIEW TYPE FOCUS:
{interviewTypeFocus}

CRITICAL RULES:

1. NEVER PARROT what the candidate said. Don't say "That's interesting that you mentioned X" or "I love how you described Y".

2. TIE QUESTIONS TO JOB REQUIREMENTS: Reference specific skills or experiences mentioned in the job requirements.

3. PERSONALIZE WITH CV: Reference ONLY facts that appear in the CV. Use exact company names, university names, and years as written. NEVER invent or assume details.

4. DRILL DOWN ON THEIR PROJECT when relevant. Ask about specific challenges, decisions, metrics, or outcomes from the project they mentioned ({activeProject}).

5. PIVOT after 2-3 questions on the same topic. Ask about something new.

6. NEVER REPEAT A QUESTION that was already asked (check "Topics covered" above). Each question must explore a DIFFERENT aspect or topic.

FOR QUESTION 1:
Reference something specific from their CV or the job requirements. DO NOT introduce yourself.

FOR QUESTIONS 2+: You MUST start with one of these connectors: "And," / "So," / "Now," / "Also," / "On that note,"
Then either drill into their project or pivot to a new topic.

Example format for questions 2+: "So, [question]?" or "And, [question]?"
`);

const questionGeneratorPrompt = PromptTemplate.fromTemplate(`
You are Sarah, a friendly hiring manager conducting a {interviewType} interview for a {targetRole} position.

Interview Progress:
- Question {questionIndex} of {totalQuestions}
- Topics covered: {previousQuestions}
- Last answer: {lastAnswer}
- Project/example they mentioned: {activeProject}

CRITICAL RULES:

1. NEVER PARROT what the candidate said. Don't say "That's interesting that you mentioned X" or "I love how you described Y".

2. DRILL DOWN ON THEIR PROJECT when relevant. Ask about specific challenges, decisions, metrics, or outcomes from the project they mentioned ({activeProject}).

3. PIVOT after 2-3 questions on the same topic. Ask about something new.

4. NEVER REPEAT A QUESTION that was already asked (check "Topics covered" above). Each question must explore a DIFFERENT aspect or topic.

FOR QUESTION 1 ONLY - THE OPENING:
Don't use generic "tell me about yourself" - that's boring and scripted.

Instead, create a warm, role-specific opener. Examples by role:
- Software Developer: "Hey! Thanks for chatting with me today. I saw you're interested in our dev role - what's the most interesting technical problem you've tackled recently?"
- Product Manager: "Hi there! Great to meet you. I'm curious - what's a product decision you've made recently that you're really proud of?"
- Designer: "Hey! So glad you're here. I'd love to hear about a design challenge you've worked through lately - what made it tricky?"
- QA Engineer: "Hi! Thanks for joining. Tell me about a bug or quality issue you caught that could have been a real problem - how'd you find it?"
- DevOps: "Hey there! I'm excited to chat. What's your current infrastructure setup like, and where have you been focusing your energy lately?"

The opener should:
- Feel like a real person greeting them (casual "Hey!" or "Hi there!")
- Reference their specific role
- Ask about something concrete and recent, not vague background
- Be genuinely curious, not interrogative

FOR QUESTIONS 2+: You MUST start with one of these connectors: "And," / "So," / "Now," / "Also,"
Then either drill into their project or pivot to a new topic.

Generate the question now. Example format: "So, [question]?" or "And, [question]?"
`);

const evaluatorPrompt = PromptTemplate.fromTemplate(`
You are evaluating a candidate's interview response as a supportive coach.

Context: {interviewType} interview for {targetRole} ({difficulty} level)

Question: {question}

Answer: {answer}

Provide feedback as JSON:
{{
  "score": <1-10>,
  "feedback": "<brief, encouraging feedback. Start positive, then 1 actionable tip. 2-3 sentences max.>",
  "strengths": ["<specific strength>", "<another if applicable>"],
  "improvements": ["<one concrete tip>"],
  "projectMentioned": "<if they mentioned a specific project, product, or initiative by name, extract it here. Otherwise null>"
}}

Scoring: 9-10 exceptional, 7-8 strong, 5-6 solid, 3-4 developing, 1-2 needs work

Keep feedback concise and actionable. No fluff.
Respond with ONLY valid JSON.
`);

const reflectionPrompt = PromptTemplate.fromTemplate(`
You're an engaged HR interviewer. Generate a brief acknowledgment after the candidate's answer.

CANDIDATE'S ANSWER:
{candidateAnswer}

PREVIOUS ACKNOWLEDGMENT (don't repeat):
{previousReflection}

YOUR TASK:
Generate a 1-2 sentence acknowledgment that shows you listened and are genuinely interested.

GUIDELINES:
- For SHORT answers (1-2 sentences): Use a brief acknowledgment like "Got it." or "Okay, thanks."
- For DETAILED answers (background, experience, multiple points): Reference something SPECIFIC they said. Show you're engaged.

EXAMPLES FOR DETAILED ANSWERS:
- "That's quite a diverse background - bridging psychology with data science is interesting."
- "Seven years is solid experience. I can see how that systems thinking approach would be valuable."
- "Thanks for sharing that. The cross-functional experience sounds really relevant."

EXAMPLES FOR SHORT ANSWERS:
- "Got it."
- "Okay, thanks."
- "Makes sense."

RULES:
1. Keep it to 1-2 sentences MAX
2. Don't ask a follow-up question here (that comes next)
3. Don't be overly effusive or fake - be genuine
4. Reference something specific if they gave a detailed answer

Output ONLY the acknowledgment. Nothing else.
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

export class IntroductionChain {
  private chain: RunnableSequence;

  constructor() {
    this.chain = RunnableSequence.from([
      introductionPrompt,
      model,
      new StringOutputParser(),
    ]);
  }

  async generate(config: InterviewConfig): Promise<string> {
    const interviewerRole = this.getInterviewerRole(config.interviewType);
    
    const result = await this.chain.invoke({
      interviewerName: config.interviewerName || this.getDefaultInterviewerName(config.interviewType),
      interviewerRole,
      companyName: config.companyName || "the company",
      companyDescription: config.companyDescription || "A growing technology company",
      jobTitle: config.jobTitle || `${config.targetRole} position`,
      jobRequirements: config.jobRequirements || "Standard requirements for this role",
      candidateCv: config.candidateCv || "CV not provided",
      interviewType: config.interviewType,
    });
    return result.trim();
  }

  private getInterviewerRole(interviewType: string): string {
    switch (interviewType) {
      case "behavioral":
      case "recruiter_call":
        return "HR Recruiter";
      case "technical":
        return "Senior Engineer";
      case "system-design":
        return "Engineering Manager";
      case "case-study":
        return "Product Leader";
      default:
        return "Hiring Manager";
    }
  }

  private getDefaultInterviewerName(interviewType: string): string {
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

export class ReflectionChain {
  private chain: RunnableSequence;

  constructor() {
    this.chain = RunnableSequence.from([
      reflectionPrompt,
      model,
      new StringOutputParser(),
    ]);
  }

  async generate(candidateAnswer: string, previousReflection: string): Promise<string> {
    const result = await this.chain.invoke({
      candidateAnswer,
      previousReflection,
    });
    
    return result.trim();
  }
}

export class QuestionGeneratorChain {
  private defaultChain: RunnableSequence;
  private hrChain: RunnableSequence;
  private technicalChain: RunnableSequence;

  constructor() {
    this.defaultChain = RunnableSequence.from([
      questionGeneratorPrompt,
      model,
      new StringOutputParser(),
    ]);
    this.hrChain = RunnableSequence.from([
      hrScreeningQuestionPrompt,
      model,
      new StringOutputParser(),
    ]);
    this.technicalChain = RunnableSequence.from([
      technicalQuestionPrompt,
      model,
      new StringOutputParser(),
    ]);
  }

  async generate(context: QuestionContext): Promise<string> {
    const lastAnswer = context.previousAnswers.length > 0 
      ? context.previousAnswers[context.previousAnswers.length - 1]
      : "This is the first question";

    const config = context.config;
    const hasJobContext = config.companyName || config.jobRequirements || config.candidateCv;
    
    // Use appropriate chain based on interview type and available context
    if (hasJobContext) {
      if (config.interviewType === "behavioral" || config.interviewType === "recruiter_call") {
        // HR Screening - use HR-specific prompt
        return this.generateHrQuestion(context, lastAnswer);
      } else {
        // Technical/Case Study - use technical prompt
        return this.generateTechnicalQuestion(context, lastAnswer);
      }
    }
    
    // Fallback to default prompt for practice mode without job context
    const result = await this.defaultChain.invoke({
      interviewType: config.interviewType,
      targetRole: config.targetRole,
      difficulty: config.difficulty,
      questionIndex: context.questionIndex + 1,
      totalQuestions: config.totalQuestions,
      previousQuestions: context.previousQuestions.length > 0 
        ? context.previousQuestions.join("\n- ") 
        : "None yet - this is the first question",
      lastAnswer: lastAnswer,
      activeProject: context.activeProject || "No specific project mentioned yet",
    });
    return result.trim();
  }

  private async generateHrQuestion(context: QuestionContext, lastAnswer: string): Promise<string> {
    const config = context.config;
    const result = await this.hrChain.invoke({
      interviewerName: config.interviewerName || "Sarah",
      companyName: config.companyName || "the company",
      jobTitle: config.jobTitle || `${config.targetRole} position`,
      targetRole: config.targetRole,
      candidateCv: config.candidateCv || "CV not provided",
      jobRequirements: config.jobRequirements || "Standard requirements for this role",
      questionIndex: context.questionIndex + 1,
      totalQuestions: config.totalQuestions,
      previousQuestions: context.previousQuestions.length > 0 
        ? context.previousQuestions.join("\n- ") 
        : "None yet - this is the first question",
      lastAnswer: lastAnswer,
    });
    return result.trim();
  }

  private async generateTechnicalQuestion(context: QuestionContext, lastAnswer: string): Promise<string> {
    const config = context.config;
    const interviewTypeFocus = this.getInterviewTypeFocus(config.interviewType);
    
    const result = await this.technicalChain.invoke({
      interviewerName: config.interviewerName || this.getInterviewerName(config.interviewType),
      interviewerRole: this.getInterviewerRole(config.interviewType),
      companyName: config.companyName || "the company",
      jobTitle: config.jobTitle || `${config.targetRole} position`,
      targetRole: config.targetRole,
      candidateCv: config.candidateCv || "CV not provided",
      jobRequirements: config.jobRequirements || "Standard requirements for this role",
      interviewType: config.interviewType,
      interviewTypeFocus,
      questionIndex: context.questionIndex + 1,
      totalQuestions: config.totalQuestions,
      previousQuestions: context.previousQuestions.length > 0 
        ? context.previousQuestions.join("\n- ") 
        : "None yet - this is the first question",
      lastAnswer: lastAnswer,
      activeProject: context.activeProject || "No specific project mentioned yet",
    });
    return result.trim();
  }

  private getInterviewTypeFocus(interviewType: string): string {
    switch (interviewType) {
      case "technical":
        return "Focus on technical skills, coding practices, problem-solving approach, and hands-on experience with relevant technologies.";
      case "system-design":
        return "Focus on architecture decisions, scalability thinking, trade-off analysis, and system design experience.";
      case "case-study":
        return "Focus on analytical thinking, business acumen, structured problem-solving, and communication of complex ideas.";
      default:
        return "Focus on relevant skills and experience for the role.";
    }
  }

  private getInterviewerName(interviewType: string): string {
    switch (interviewType) {
      case "technical": return "Michael";
      case "system-design": return "David";
      case "case-study": return "Jennifer";
      default: return "Alex";
    }
  }

  private getInterviewerRole(interviewType: string): string {
    switch (interviewType) {
      case "technical": return "Senior Engineer";
      case "system-design": return "Engineering Manager";
      case "case-study": return "Product Leader";
      default: return "Hiring Manager";
    }
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
