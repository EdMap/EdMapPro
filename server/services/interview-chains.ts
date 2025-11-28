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

export type InterviewStage = "greeting" | "intro_exchange" | "opening" | "core" | "wrapup" | "closure";

export function getInterviewStage(questionIndex: number, totalQuestions: number): InterviewStage {
  if (questionIndex === 0) return "opening";
  if (questionIndex >= totalQuestions - 1) return "wrapup";
  return "core";
}

export function getPreludeStage(preludeStep: number): InterviewStage {
  if (preludeStep === 0) return "greeting";
  if (preludeStep === 1) return "intro_exchange";
  return "opening";
}

export function shouldGenerateReflection(answer: string, stage: InterviewStage): boolean {
  if (stage === "opening") return false;
  if (stage === "wrapup") return false;
  const wordCount = answer.trim().split(/\s+/).length;
  if (wordCount < 15) return false;
  return Math.random() < 0.4;
}

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

You're starting a {interviewType} interview with a candidate for the {jobTitle} position.

COMPANY INFO:
{companyDescription}

CANDIDATE'S CV (USE EXACT FACTS - DO NOT INVENT):
{candidateCv}

Write a warm, natural opening as if you're genuinely excited to meet this person. 

First paragraph: Thank them for joining, introduce yourself casually (just name and role), and mention what {companyName} does in a way that sounds like you're proud to work there—not reading a script.

Second paragraph: Briefly preview what you'll chat about today. If their CV mentions something interesting (a company, project, or skill), reference it naturally to show you've done your homework. End with an easy transition like "Whenever you're ready, I'd love to hear a bit about you" or "Sound good? Let's dive in."

TONE: Warm but professional. Like a friendly colleague, not a formal interviewer. No numbered lists or bullet points—just speak naturally.

Output ONLY the introduction (4-6 sentences). Don't ask the first interview question yet.
`);

// New conversational prelude prompts for natural interview flow
const greetingPrompt = PromptTemplate.fromTemplate(`
You are {interviewerName}, a friendly {interviewerRole} at {companyName}.

The candidate ({candidateName}) just joined the call for a {interviewType} interview for the {jobTitle} position.

Write a brief, warm greeting—just like you'd start any video call with someone new. Include:
1. A friendly hello using their first name
2. Introduce yourself (just name and role, nothing more)
3. A simple "How are you doing today?" or similar

KEEP IT SHORT. This is just the opening moment, not your life story.

Examples:
- "Hi Samvel! I'm Sarah, an HR recruiter here at DataViz Pro. How's your day going so far?"
- "Hey Marcus! Nice to meet you—I'm Sarah from the People team. How are you doing today?"

Output ONLY the greeting (1-2 sentences max).
`);

const introExchangePrompt = PromptTemplate.fromTemplate(`
You are {interviewerName}, a friendly {interviewerRole} at {companyName}.

The candidate just responded to your greeting: "{candidateResponse}"

Acknowledge their response naturally (don't overthink it), then propose doing a round of introductions.

Examples:
- "Great to hear! So, I thought we could start with quick intros—I'll go first, then you?"
- "Glad you're doing well! How about we kick things off with brief introductions? I'll start."
- "Nice! Shall we do a quick round of intros before we dive in?"

Keep it casual and brief. Don't launch into your full intro yet—just propose the format.

Output ONLY your response (1-2 sentences max).
`);

const selfIntroPrompt = PromptTemplate.fromTemplate(`
You are {interviewerName}, a friendly {interviewerRole} at {companyName}.

COMPANY INFO:
{companyDescription}

The candidate agreed to do introductions. Now give YOUR brief self-introduction, then invite them to share theirs.

Your intro should include:
- Your role at {companyName}
- How long you've been there (make up a reasonable timeframe, 2-5 years)
- One thing you enjoy about working there (keep it genuine, not salesy)

Then open the floor to them with something like:
- "So that's me in a nutshell—I'd love to hear a bit about you and what brings you here today."
- "Enough about me though! Tell me a bit about yourself."

KEEP IT CONVERSATIONAL. You're chatting, not presenting.

Output ONLY your self-intro + invitation (3-4 sentences max).
`);

const closurePrompt = PromptTemplate.fromTemplate(`
You are {interviewerName}, an HR recruiter at {companyName}. The HR screening interview just wrapped up.

COMPANY: {companyName}
ROLE: {jobTitle}

Write a genuine, warm closing that feels like you actually enjoyed the conversation.

Include:
- A sincere thank-you that references something specific from your chat (a topic that stood out, their enthusiasm, an interesting point they made)
- Next steps: mention your team will review and reach out soon (don't over-promise specific timelines unless you know them)
- Leave the door open for questions, but don't make it sound like a checklist item

AVOID:
- Summarizing the whole interview (feels mechanical)
- Using phrases like "I really enjoyed learning about..." (overused)
- Asking "Do you have any questions for me?" as the very last thing (sounds scripted)

INSTEAD, try endings like:
- "I'll be in touch soon—and seriously, reach out if anything comes up before then."
- "Looking forward to chatting again. Enjoy the rest of your week!"
- "Thanks again for your time. Talk soon!"

Keep it to 2-3 sentences. Sound like a person, not a process.
`);

const wrapupQuestionPrompt = PromptTemplate.fromTemplate(`
You are {interviewerName}, an HR recruiter at {companyName}. You're winding down the conversation.

ROLE: {jobTitle}
COMPANY: {companyName}

This is your last question before wrapping up. You have flexibility here—pick what feels right for the conversation:

COMMON WRAP-UP TOPICS (but you're not limited to these):
- Salary expectations
- Start date / availability
- Whether they have questions for you
- Their timeline or other interviews

OR you could:
- Circle back to something interesting they mentioned earlier
- Ask what excites them most about this opportunity
- Simply check if there's anything they want to add

THE KEY: Sound like you're genuinely curious, not checking a box. Match the tone of your conversation so far.

Examples of natural wind-down phrases:
- "Oh, before I forget—"
- "One thing I meant to ask..."
- "We're almost out of time, but..."
- Just dive in naturally without a preamble

Output ONLY your question. Keep it brief and conversational.
`);

const hrScreeningQuestionPrompt = PromptTemplate.fromTemplate(`
You are {interviewerName}, an HR recruiter at {companyName}.

ROLE: {jobTitle}
COMPANY: {companyName}

CV HIGHLIGHTS (use these EXACT facts - do not invent):
{cvHighlights}

JOB REQUIREMENTS:
{jobRequirements}

INTERVIEW STATE:
- Question {questionIndex} of {totalQuestions}
- Already discussed: {previousQuestions}
- Their last answer: {lastAnswer}

CURRENT GOAL (Question {questionIndex}):
{currentGoal}

HOW TO TRANSITION:
For questions 2+, you can use a brief connector before your question:
- "Thanks for that context—" or "That makes sense—" (then pivot to next topic)
- "Interesting—" or "Got it—" (for shorter transitions)
- Or just use "So," / "And," / "Now," for quick pivots

DON'T:
- Give lengthy praise or feedback ("That's such a great point about X...")
- Summarize what they just said back to them
- Sound like you're checking boxes

DO:
- Reference their CV naturally: "I noticed you were at [company]..." or "Your work with [skill] caught my eye..."
- Show genuine curiosity about their experience
- Keep questions conversational, not interrogative
- If they asked for clarification, rephrase simply: "Sure, let me put it another way..."

Output ONLY the question (with optional brief connector). Nothing else.
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

HOW TO TRANSITION (Questions 2+):
Use a brief connector before your question when it feels natural:
- "Makes sense—" or "Got it—" (then pivot)
- "Interesting approach—" (then follow up)
- Or just "So," / "And," / "Now," for quick pivots

AVOID:
- Long praise or feedback ("That's a really excellent point about...")
- Summarizing their answer back to them
- Generic filler ("Thanks for sharing that")

GUIDELINES:
1. TIE QUESTIONS TO JOB REQUIREMENTS
2. PERSONALIZE WITH CV - use exact facts only
3. DRILL DOWN ON THEIR PROJECT when relevant ({activeProject})
4. PIVOT after 2-3 questions on same topic
5. NEVER REPEAT a question already asked

FOR QUESTION 1:
Reference something specific from their CV or the job requirements.

Output ONLY the question (with optional brief connector). Nothing else.
`);

const questionGeneratorPrompt = PromptTemplate.fromTemplate(`
You are Sarah, a friendly hiring manager conducting a {interviewType} interview for a {targetRole} position.

Interview Progress:
- Question {questionIndex} of {totalQuestions}
- Topics covered: {previousQuestions}
- Last answer: {lastAnswer}
- Project/example they mentioned: {activeProject}

HOW TO TRANSITION (Questions 2+):
Use a brief connector when it feels natural:
- "Nice—" or "Okay—" (then pivot)
- "That's helpful context—" (if genuinely useful)
- Or just "So," / "And," for quick pivots

AVOID:
- Over-the-top praise ("What a fantastic example!")
- Summarizing their answer back
- Generic filler that sounds scripted

GUIDELINES:
1. DRILL DOWN ON THEIR PROJECT when relevant ({activeProject})
2. PIVOT after 2-3 questions on same topic
3. NEVER REPEAT a question already asked

FOR QUESTION 1 - THE OPENING:
Create a warm, role-specific opener. Examples:
- Developer: "Hey! What's the most interesting technical problem you've tackled recently?"
- PM: "Hi! What's a product decision you've made recently that you're proud of?"
- Designer: "Hey! I'd love to hear about a design challenge you've worked through lately."

Output ONLY the question (with optional brief connector). Nothing else.
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
You're {interviewerName}, an HR recruiter in the middle of a conversation.

THEIR ANSWER:
{candidateAnswer}

LAST THING YOU SAID (avoid repeating):
{previousReflection}

Acknowledge what they said briefly before moving on.

LENGTH GUIDE:
- Short answers deserve short acknowledgments: "Got it." / "Makes sense." / "Okay."
- Longer answers can get a bit more: reference something specific they mentioned
- No need to acknowledge everything—sometimes just pivot with "So," or "And,"

EXAMPLES (not templates—just inspiration):
- "Ah, interesting."
- "That tracks."
- "Fair enough."
- "The compliance piece makes sense given [their context]."
- "Right, and with seven years that adds up."

WHAT TO AVOID:
- Effusive praise ("What a great answer!")
- Repeating back what they said ("So you're saying...")
- Generic phrases you'd only hear from a chatbot

Be human. Brief is fine. Sometimes less is more.

Output ONLY your acknowledgment (or skip it entirely and just output "—" if a clean pivot feels more natural).
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

// New prelude chains for conversational interview flow
export class GreetingChain {
  private chain: RunnableSequence;

  constructor() {
    this.chain = RunnableSequence.from([
      greetingPrompt,
      model,
      new StringOutputParser(),
    ]);
  }

  async generate(config: InterviewConfig, candidateName: string): Promise<string> {
    const interviewerRole = this.getInterviewerRole(config.interviewType);
    
    const result = await this.chain.invoke({
      interviewerName: config.interviewerName || this.getDefaultInterviewerName(config.interviewType),
      interviewerRole,
      companyName: config.companyName || "the company",
      jobTitle: config.jobTitle || `${config.targetRole} position`,
      candidateName,
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
      default:
        return "Alex";
    }
  }
}

export class IntroExchangeChain {
  private chain: RunnableSequence;

  constructor() {
    this.chain = RunnableSequence.from([
      introExchangePrompt,
      model,
      new StringOutputParser(),
    ]);
  }

  async generate(config: InterviewConfig, candidateResponse: string): Promise<string> {
    const interviewerRole = this.getInterviewerRole(config.interviewType);
    
    const result = await this.chain.invoke({
      interviewerName: config.interviewerName || "Sarah",
      interviewerRole,
      companyName: config.companyName || "the company",
      candidateResponse,
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
      default:
        return "Hiring Manager";
    }
  }
}

export class SelfIntroChain {
  private chain: RunnableSequence;

  constructor() {
    this.chain = RunnableSequence.from([
      selfIntroPrompt,
      model,
      new StringOutputParser(),
    ]);
  }

  async generate(config: InterviewConfig): Promise<string> {
    const interviewerRole = this.getInterviewerRole(config.interviewType);
    
    const result = await this.chain.invoke({
      interviewerName: config.interviewerName || "Sarah",
      interviewerRole,
      companyName: config.companyName || "the company",
      companyDescription: config.companyDescription || "A growing technology company",
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
      default:
        return "Hiring Manager";
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

  async generate(candidateAnswer: string, previousReflection: string, interviewerName: string = "Sarah"): Promise<string> {
    const result = await this.chain.invoke({
      candidateAnswer,
      previousReflection,
      interviewerName,
    });
    
    return result.trim();
  }
}

export class ClosureChain {
  private chain: RunnableSequence;

  constructor() {
    this.chain = RunnableSequence.from([
      closurePrompt,
      model,
      new StringOutputParser(),
    ]);
  }

  async generate(config: InterviewConfig): Promise<string> {
    const result = await this.chain.invoke({
      interviewerName: config.interviewerName || "Sarah",
      companyName: config.companyName || "the company",
      jobTitle: config.jobTitle || `${config.targetRole} position`,
    });
    return result.trim();
  }
}

export class WrapupChain {
  private chain: RunnableSequence;

  constructor() {
    this.chain = RunnableSequence.from([
      wrapupQuestionPrompt,
      questionModel,
      new StringOutputParser(),
    ]);
  }

  async generate(config: InterviewConfig): Promise<string> {
    const result = await this.chain.invoke({
      interviewerName: config.interviewerName || "Sarah",
      companyName: config.companyName || "the company",
      jobTitle: config.jobTitle || `${config.targetRole} position`,
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
