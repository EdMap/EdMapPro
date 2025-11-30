import { PromptTemplate } from "@langchain/core/prompts";
import { ChatGroq } from "@langchain/groq";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { 
  ExperienceLevel, 
  TeamInterviewPersona, 
  TeamInterviewSettings,
  TEAM_INTERVIEW_PRESETS 
} from '@shared/schema';
import { TeamInterviewQuestion, getQuestionsForLevel, selectQuestionsForInterview } from './team-interview-questions';

const MODEL_NAME = "llama-3.3-70b-versatile";

function stripMarkdownCodeBlocks(str: string): string {
  return str.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}

export interface TeamTurnInput {
  activePersona: TeamInterviewPersona;
  allPersonas: TeamInterviewPersona[];
  experienceLevel: ExperienceLevel;
  companyName: string;
  companyDescription: string;
  jobTitle: string;
  candidateName: string;
  conversationHistory: Array<{ role: 'interviewer' | 'candidate'; content: string; personaId?: string }>;
  questionBacklog: TeamInterviewQuestion[];
  coverageStatus: Record<string, number>;
  questionsAskedCount: number;
  maxQuestions: number;
  currentQuestionId?: string;
  levelExpectations: string;
}

export interface TeamTurnOutput {
  response: string;
  actionType: 'continue' | 'follow_up' | 'hand_off' | 'wrap_up' | 'answer_question';
  questionId?: string;
  nextPersonaId?: string;
  handOffIntro?: string;
  evaluation: {
    score: number;
    strengths: string[];
    areasToImprove: string[];
    criterionCovered: string;
    coverageContribution: number;
  };
  coveredQuestionIds: string[];
  candidateAskedQuestion: boolean;
  wrapUpReason?: string;
}

const teamTurnPrompt = PromptTemplate.fromTemplate(`
You are {personaName}, a {personaRole} at {companyName}, participating in a team interview.

YOUR PERSONA:
- Role: {personaRole}
- Tone: {personaTone} (be {toneGuidance})
- Focus areas: {focusAreas}
- Your intro style: "{introStyle}"

INTERVIEW CONTEXT:
- This is a TEAM INTERVIEW with multiple interviewers
- Experience level being hired: {experienceLevel}
- Company: {companyName} - {companyDescription}
- Job Title: {jobTitle}
- Candidate: {candidateName}
- Questions Asked: {questionsAskedCount}/{maxQuestions}

OTHER TEAM MEMBERS:
{otherPersonas}

LEVEL-APPROPRIATE EXPECTATIONS ({experienceLevel}):
{levelExpectations}

IMPORTANT: This is an {experienceLevel}-level position. Your questions and expectations should be calibrated accordingly:
{levelGuidance}

QUESTION BACKLOG (your focus areas highlighted):
{questionBacklog}

COVERAGE STATUS:
{coverageStatus}

CONVERSATION SO FAR:
{conversationHistory}

---

The candidate just responded. As {personaName}, you need to:
1. Evaluate their response (calibrated to {experienceLevel} level expectations)
2. Respond naturally in your persona's style and tone
3. Decide: continue questioning, follow up, hand off to a teammate, or wrap up

TEAM INTERVIEW DYNAMICS:
- Hand off to a teammate when their expertise would be better suited for a follow-up
- Natural hand-offs sound like: "That's helpful. {teammateFirstName}, did you want to jump in on [topic]?"
- Don't hand off too frequently - complete your line of questioning first
- Hand off primarily when switching between major topic areas (e.g., technical → collaboration)

PERSONA-SPECIFIC BEHAVIOR:
{personaBehavior}

EVALUATION CALIBRATION for {experienceLevel}:
- Score 8-10: Exceeds expectations for this level
- Score 6-7: Meets expectations for this level
- Score 4-5: Slightly below expectations
- Score 1-3: Significantly below expectations
Remember: An intern giving a solid learning-focused answer is an 8, not a 5.

WRAP-UP CRITERIA:
- Questions asked approaching max ({maxQuestions})
- All personas have had a chance to ask questions
- Key areas are sufficiently covered

OUTPUT FORMAT:
Return a JSON object with:
{{
  "response": "Your natural response as {personaName}",
  "actionType": "continue|follow_up|hand_off|wrap_up|answer_question",
  "questionId": "ID of question you're asking (if from backlog)",
  "nextPersonaId": "ID of teammate to hand off to (only if hand_off)",
  "handOffIntro": "Natural transition phrase (only if hand_off)",
  "evaluation": {{
    "score": 1-10,
    "strengths": ["strength1", "strength2"],
    "areasToImprove": ["area1"],
    "criterionCovered": "learning_mindset|collaboration|problem_solving|technical_foundations",
    "coverageContribution": 0.0-0.3
  }},
  "coveredQuestionIds": ["id1", "id2"],
  "candidateAskedQuestion": true/false,
  "wrapUpReason": "only if actionType is wrap_up"
}}

Output ONLY valid JSON.
`);

function getToneGuidance(tone: TeamInterviewPersona['tone']): string {
  switch (tone) {
    case 'supportive':
      return 'warm, encouraging, patient - remember they are early in their career';
    case 'collegial':
      return 'friendly, peer-to-peer, conversational';
    case 'challenging':
      return 'probing, direct, but fair - push for depth';
    case 'strategic':
      return 'big-picture focused, executive-level conversation';
    default:
      return 'professional and approachable';
  }
}

function getLevelGuidance(level: ExperienceLevel): string {
  switch (level) {
    case 'intern':
      return `- DO ask about: learning approach, asking for help, basic collaboration, curiosity
- DO NOT ask about: system design, leading teams, production incidents, years of experience
- Focus on POTENTIAL over current polish
- Simple, foundational questions only
- Celebrate honest answers about not knowing things`;
    case 'junior':
      return `- Ask about: practical skills, debugging basics, working in a team, receiving feedback
- Expect some gaps in experience - that's normal
- Look for growth mindset and willingness to learn`;
    case 'mid':
      return `- Ask about: independent work, code quality, mentoring juniors, technical decisions
- Expect solid fundamentals and some ownership experience
- Look for evidence of growing beyond individual contributor`;
    case 'senior':
      return `- Ask about: system design, technical leadership, mentoring, cross-team influence
- Expect deep technical expertise and leadership evidence
- Look for strategic thinking and organizational impact`;
    case 'lead':
      return `- Ask about: team building, technical vision, scaling systems and teams, executive alignment
- Expect organizational-level thinking and impact
- Look for evidence of building and scaling engineering culture`;
  }
}

function getPersonaBehavior(persona: TeamInterviewPersona, level: ExperienceLevel): string {
  if (level === 'intern') {
    switch (persona.role) {
      case 'peer_engineer':
        return `As a fellow engineer, be relatable and friendly:
- Share brief personal anecdotes about when you were new
- Ask about their learning journey, not their achievements
- Make them feel comfortable admitting what they don't know
- Example: "When I started, I spent hours stuck on a bug before asking for help. How do you handle that kind of situation?"`;
      case 'tech_lead':
        return `As the tech lead, be supportive and growth-oriented:
- Focus on their potential, not their current skill level
- Ask about curiosity and enthusiasm for learning
- Look for teachability and self-awareness
- Example: "What would you want to learn in your first month with us?"`;
      default:
        return 'Be encouraging and focus on potential over polish.';
    }
  }
  
  return `Engage at the ${level} level with appropriate depth and expectations.`;
}

export class TeamInterviewTurnChain {
  private chain: RunnableSequence;

  constructor() {
    this.chain = RunnableSequence.from([
      teamTurnPrompt,
      new ChatGroq({
        model: MODEL_NAME,
        temperature: 0.7,
        topP: 0.95,
        apiKey: process.env.GROQ_API_KEY,
      }),
      new StringOutputParser(),
    ]);
  }

  async processTurn(input: TeamTurnInput): Promise<TeamTurnOutput> {
    const formattedHistory = input.conversationHistory
      .slice(-10)
      .map(msg => {
        const speaker = msg.role === 'interviewer' 
          ? (msg.personaId ? input.allPersonas.find(p => p.id === msg.personaId)?.name || 'Interviewer' : input.activePersona.name)
          : input.candidateName;
        return `${speaker}: ${msg.content}`;
      })
      .join('\n');

    const formattedBacklog = input.questionBacklog
      .filter(q => !['asked', 'covered_proactively'].includes(q.id))
      .slice(0, 8)
      .map(q => {
        const isMyFocus = input.activePersona.focusAreas.includes(q.category) ? '★' : '';
        return `${isMyFocus}[${q.id}] (${q.category}) ${q.question}`;
      })
      .join('\n');

    const formattedCoverage = Object.entries(input.coverageStatus)
      .map(([key, value]) => `- ${key}: ${(value * 100).toFixed(0)}%`)
      .join('\n');

    const otherPersonas = input.allPersonas
      .filter(p => p.id !== input.activePersona.id)
      .map(p => `- ${p.name} (${p.displayRole}): focuses on ${p.focusAreas.join(', ')}`)
      .join('\n');

    const result = await this.chain.invoke({
      personaName: input.activePersona.name,
      personaRole: input.activePersona.displayRole,
      personaTone: input.activePersona.tone,
      toneGuidance: getToneGuidance(input.activePersona.tone),
      focusAreas: input.activePersona.focusAreas.join(', '),
      introStyle: input.activePersona.introStyle,
      experienceLevel: input.experienceLevel,
      companyName: input.companyName,
      companyDescription: input.companyDescription,
      jobTitle: input.jobTitle,
      candidateName: input.candidateName,
      questionsAskedCount: input.questionsAskedCount,
      maxQuestions: input.maxQuestions,
      otherPersonas: otherPersonas || 'No other interviewers',
      levelExpectations: input.levelExpectations,
      levelGuidance: getLevelGuidance(input.experienceLevel),
      questionBacklog: formattedBacklog || 'No remaining questions',
      coverageStatus: formattedCoverage,
      conversationHistory: formattedHistory,
      personaBehavior: getPersonaBehavior(input.activePersona, input.experienceLevel),
    });

    try {
      const cleanedResult = stripMarkdownCodeBlocks(result);
      const parsed = JSON.parse(cleanedResult);

      return {
        response: parsed.response || "That's interesting. Tell me more.",
        actionType: parsed.actionType || 'continue',
        questionId: parsed.questionId,
        nextPersonaId: parsed.nextPersonaId,
        handOffIntro: parsed.handOffIntro,
        evaluation: {
          score: parsed.evaluation?.score || 5,
          strengths: parsed.evaluation?.strengths || [],
          areasToImprove: parsed.evaluation?.areasToImprove || [],
          criterionCovered: parsed.evaluation?.criterionCovered || 'learning_mindset',
          coverageContribution: parsed.evaluation?.coverageContribution || 0.1,
        },
        coveredQuestionIds: parsed.coveredQuestionIds || [],
        candidateAskedQuestion: parsed.candidateAskedQuestion || false,
        wrapUpReason: parsed.wrapUpReason,
      };
    } catch (error) {
      console.error("Failed to parse team turn response:", result);
      return {
        response: "Thanks for sharing that. Let me ask you something else.",
        actionType: 'continue',
        evaluation: {
          score: 5,
          strengths: [],
          areasToImprove: [],
          criterionCovered: 'learning_mindset',
          coverageContribution: 0.1,
        },
        coveredQuestionIds: [],
        candidateAskedQuestion: false,
      };
    }
  }
}

export class TeamInterviewGreetingChain {
  private chain: RunnableSequence;

  constructor() {
    const greetingPrompt = PromptTemplate.fromTemplate(`
You are starting a team interview at {companyName}.

INTERVIEWERS:
{personasIntro}

CANDIDATE: {candidateName}
POSITION: {jobTitle} ({experienceLevel} level)

Generate a natural, warm opening where the primary interviewer ({primaryName}) welcomes the candidate and introduces the format. The tone should be {primaryTone}.

For an {experienceLevel}-level interview:
{levelContext}

Keep it concise (3-4 sentences). End by asking an easy opening question appropriate for the level.

Example structure:
"Hi [Candidate]! I'm [Primary], [role]. I'm joined by [Others]. We're excited to chat with you about [role]. [Easy opener]"

Output only the greeting text, no JSON.
`);

    this.chain = RunnableSequence.from([
      greetingPrompt,
      new ChatGroq({
        model: MODEL_NAME,
        temperature: 0.7,
        apiKey: process.env.GROQ_API_KEY,
      }),
      new StringOutputParser(),
    ]);
  }

  async generateGreeting(
    settings: TeamInterviewSettings,
    companyName: string,
    companyDescription: string,
    jobTitle: string,
    candidateName: string
  ): Promise<{ greeting: string; activePersonaId: string }> {
    const primaryPersona = settings.personas[0];
    
    const personasIntro = settings.personas
      .map((p, i) => `${i === 0 ? 'Primary: ' : ''}${p.name} - ${p.displayRole}`)
      .join('\n');

    const levelContext = settings.experienceLevel === 'intern'
      ? 'This is an intern interview - keep it friendly, low-pressure, and focus on making them comfortable. Ask about their learning journey or what interests them about tech.'
      : settings.experienceLevel === 'junior'
      ? 'This is a junior position - be approachable and ask about their recent projects or what they are learning.'
      : 'Engage at the appropriate seniority level.';

    const greeting = await this.chain.invoke({
      companyName,
      personasIntro,
      candidateName,
      jobTitle,
      experienceLevel: settings.experienceLevel,
      primaryName: primaryPersona.name,
      primaryTone: getToneGuidance(primaryPersona.tone),
      levelContext,
    });

    return {
      greeting: greeting.trim(),
      activePersonaId: primaryPersona.id,
    };
  }
}

export function getTeamInterviewSettings(seniority: string): TeamInterviewSettings {
  const level = (['intern', 'junior', 'mid', 'senior', 'lead'].includes(seniority) 
    ? seniority 
    : 'junior') as ExperienceLevel;
  
  return TEAM_INTERVIEW_PRESETS[level];
}

export function getLevelExpectationsText(settings: TeamInterviewSettings): string {
  if (settings.evaluationRubric.length === 0) return '';
  
  return settings.evaluationRubric
    .map(r => `${r.criterion}: ${r.levelExpectations[settings.experienceLevel]}`)
    .join('\n');
}
