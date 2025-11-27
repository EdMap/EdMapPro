import { ChatGroq } from "@langchain/groq";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

const model = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
  apiKey: process.env.GROQ_API_KEY,
});

const questionModel = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0.3,
  apiKey: process.env.GROQ_API_KEY,
});

const evaluatorModel = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0.3,
  apiKey: process.env.GROQ_API_KEY,
});

export function extractCvHighlights(cvText: string): string {
  if (!cvText || cvText.length < 50) {
    return "No CV provided";
  }
  
  const highlights: string[] = [];
  
  const experienceMatch = cvText.match(/(\d+)\+?\s*years?/i);
  if (experienceMatch) {
    highlights.push(`- Years of experience: ${experienceMatch[0]}`);
  }
  
  const companies = [
    { pattern: /rabobank/i, name: "Rabobank" },
    { pattern: /redkite/i, name: "RedKite" },
    { pattern: /unicef/i, name: "UNICEF" },
    { pattern: /unfpa|united nations population fund/i, name: "UNFPA" },
    { pattern: /world bank/i, name: "World Bank" },
    { pattern: /maastricht university/i, name: "Maastricht University" },
    { pattern: /tilburg university/i, name: "Tilburg University" },
    { pattern: /american university of armenia/i, name: "American University of Armenia" },
    { pattern: /yerevan state university/i, name: "Yerevan State University" },
  ];
  
  const foundCompanies: string[] = [];
  const foundEducation: string[] = [];
  
  for (const { pattern, name } of companies) {
    if (pattern.test(cvText)) {
      if (name.includes("University")) {
        foundEducation.push(name);
      } else {
        foundCompanies.push(name);
      }
    }
  }
  
  if (foundCompanies.length > 0) {
    highlights.push(`- Companies worked at: ${foundCompanies.join(", ")}`);
  }
  
  if (foundEducation.length > 0) {
    highlights.push(`- Education: ${foundEducation.join(", ")}`);
  }
  
  const rolePatterns = [
    /snr\.?\s*data\s*scientist/i,
    /senior\s*data\s*scientist/i,
    /lead\s*data\s*scientist/i,
    /data\s*scientist/i,
    /phd\s*candidate/i,
    /data\s*analy[sz]t/i,
    /program\s*manager/i,
  ];
  
  const foundRoles: string[] = [];
  for (const pattern of rolePatterns) {
    const match = cvText.match(pattern);
    if (match && !foundRoles.some(r => r.toLowerCase() === match[0].toLowerCase())) {
      foundRoles.push(match[0]);
    }
  }
  
  if (foundRoles.length > 0) {
    highlights.push(`- Roles held: ${foundRoles.slice(0, 3).join(", ")}`);
  }
  
  const phdMatch = cvText.match(/ph\.?d\.?|philosophy\s*doctor/i);
  const masterMatch = cvText.match(/m\.?s\.?c?\.?|master/i);
  if (phdMatch) {
    highlights.push(`- Highest degree: PhD`);
  } else if (masterMatch) {
    highlights.push(`- Highest degree: Master's`);
  }
  
  const skillPatterns = [
    /python/i, /r(?:\s|,|$)/i, /sql/i, /machine\s*learning/i, 
    /power\s*bi/i, /tableau/i, /spark|pyspark/i, /statistics/i
  ];
  const foundSkills: string[] = [];
  for (const pattern of skillPatterns) {
    if (pattern.test(cvText)) {
      const skill = cvText.match(pattern)?.[0].trim();
      if (skill && skill.length > 1) foundSkills.push(skill);
    }
  }
  if (foundSkills.length > 0) {
    highlights.push(`- Key skills: ${foundSkills.slice(0, 5).join(", ")}`);
  }
  
  return highlights.length > 0 
    ? highlights.join("\n") 
    : "CV provided but key details not extracted";
}

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
You are {interviewerName}, an HR recruiter at {companyName} having a conversation with a candidate.

ROLE: {jobTitle}
COMPANY: {companyName}

CV HIGHLIGHTS (use these EXACT facts - do not invent):
{cvHighlights}

FULL CV FOR REFERENCE:
{candidateCv}

JOB REQUIREMENTS:
{jobRequirements}

INTERVIEW STATE:
- Question {questionIndex} of {totalQuestions}
- Already discussed: {previousQuestions}
- Their last answer: {lastAnswer}

YOUR ASSESSMENT AGENDA:
Question 1: MOTIVATION - Why are they interested in this specific role?
Question 2: CAREER FIT - How does their background prepare them for this?
Question 3: SPECIFIC EXPERIENCE - Dig into one company/role from their CV
Question 4: WORKING STYLE - How do they like to work? Team dynamics?
Question 5: LOGISTICS - Availability, expectations, questions they have

CURRENT GOAL (Question {questionIndex}):
{currentGoal}

HOW TO ASK:
- Use a CV highlight naturally: "I see you're currently at [company from CV]..." or "Your PhD from [university] is interesting..."
- If they just gave a detailed answer, acknowledge it briefly then pivot: "That's helpful context. I'm curious about..."
- If they asked for clarification, rephrase the question more simply
- Be conversational, not interrogative

LAST ANSWER CONTEXT:
If their last answer was detailed, build on it naturally.
If their last answer was brief or unclear, try a different angle.
If they asked for clarification, simplify and be more specific.

Output ONLY your question. No preamble.
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
Generate a brief acknowledgment based on what they said.

SPECIAL CASES:
- If they asked for CLARIFICATION or said they don't understand: Say "No worries, I'll clarify." or "Sure, let me rephrase."
- For SHORT answers (1-2 sentences): "Got it." or "Okay, thanks."
- For DETAILED answers: Reference something SPECIFIC they said briefly.

EXAMPLES:
- Clarification request → "No worries, I'll clarify."
- Short answer → "Got it."
- Detailed background → "Seven years is solid. The systems thinking angle is interesting."

RULES:
1. Keep it BRIEF - 1 sentence, max 15 words
2. Don't ask questions here
3. Be genuine, not effusive

Output ONLY the acknowledgment.
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
      questionModel,
      new StringOutputParser(),
    ]);
    this.technicalChain = RunnableSequence.from([
      technicalQuestionPrompt,
      questionModel,
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
    const questionNum = context.questionIndex + 1;
    
    const cvHighlights = config.candidateCv 
      ? extractCvHighlights(config.candidateCv)
      : "No CV provided";
    
    const currentGoal = this.getHrQuestionGoal(questionNum);
    
    const result = await this.hrChain.invoke({
      interviewerName: config.interviewerName || "Sarah",
      companyName: config.companyName || "the company",
      jobTitle: config.jobTitle || `${config.targetRole} position`,
      targetRole: config.targetRole,
      cvHighlights: cvHighlights,
      candidateCv: config.candidateCv || "CV not provided",
      jobRequirements: config.jobRequirements || "Standard requirements for this role",
      questionIndex: questionNum,
      totalQuestions: config.totalQuestions,
      previousQuestions: context.previousQuestions.length > 0 
        ? context.previousQuestions.join("\n- ") 
        : "None yet - this is the first question",
      lastAnswer: lastAnswer,
      currentGoal: currentGoal,
    });
    return result.trim();
  }
  
  private getHrQuestionGoal(questionNum: number): string {
    switch (questionNum) {
      case 1:
        return "MOTIVATION: Understand why they're interested in this specific role and company. Reference their current situation from CV.";
      case 2:
        return "CAREER FIT: Explore how their background prepares them. Reference a specific role or experience from their CV.";
      case 3:
        return "DEEP DIVE: Ask about a specific company or project from their CV. Get concrete details about what they did.";
      case 4:
        return "WORKING STYLE: Understand how they prefer to work, collaborate, handle challenges.";
      case 5:
        return "WRAP UP: Availability, timeline, salary expectations, or any questions they have.";
      default:
        return "Continue exploring their fit for the role based on previous discussion.";
    }
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
