/**
 * Team Interview Quality Test Script
 * 
 * Simulates a candidate going through a team interview with multiple personas
 * (Marcus - Engineering Manager, Sarah - Tech Lead) and evaluates:
 * - Persona handoffs and attribution
 * - Sequential message flow
 * - Interview closing/wrap-up
 * - Overall conversation quality
 */

import { InterviewOrchestrator } from '../services/interview-orchestrator';
import { ChatGroq } from '@langchain/groq';
import { storage } from '../storage';

interface ConversationTurn {
  speaker: 'interviewer' | 'candidate';
  message: string;
  questionNumber?: number;
  responseType?: 'complete' | 'vague' | 'partial' | 'asks_question' | 'offers_elaboration';
  personaId?: string;
  personaName?: string;
}

interface TeamInterviewEvaluation {
  personaConsistency: { score: number; reasoning: string };
  handoffs: { score: number; reasoning: string };
  closingFlow: { score: number; reasoning: string };
  naturalness: { score: number; reasoning: string };
  overallScore: number;
  summary: string;
  improvements: string[];
  closingAnalysis: {
    hadClosing: boolean;
    closingPersona?: string;
    closingQuality: string;
  };
}

interface IterationResult {
  iteration: number;
  questionCount: number;
  conversation: ConversationTurn[];
  evaluation: TeamInterviewEvaluation;
  personaBreakdown: Record<string, number>;
}

type ResponseType = 'complete' | 'vague' | 'partial' | 'asks_question' | 'offers_elaboration';

function getRandomResponseType(): ResponseType {
  const rand = Math.random();
  if (rand < 0.5) return 'complete';           // 50% complete answers (interns should be more eager)
  if (rand < 0.65) return 'partial';           // 15% partial answers
  if (rand < 0.8) return 'vague';              // 15% vague answers
  if (rand < 0.9) return 'offers_elaboration'; // 10% offers to elaborate
  return 'asks_question';                       // 10% asks a question back
}

// Intern-level CV for 42 London student
const ARSEN_CV = `
ARSEN TADEVOSYAN
42 London Student | Aspiring Software Engineer

HIGHLIGHTS:
• Currently completing 42 London's intensive programming curriculum
• Strong foundation in C, algorithms, and Unix systems
• Self-taught web development (JavaScript, React basics)
• Collaborative project experience through 42's peer-learning model
• Quick learner with growth mindset

EDUCATION:
42 London (2024-Present)
- Completed Common Core projects including Libft, ft_printf, get_next_line
- Working on minishell and philosophers projects
- Active participant in peer-to-peer code reviews

PROJECTS:
minishell (In Progress)
- Building a bash-like shell in C
- Implementing command parsing, pipes, redirections
- Learning process management and signal handling

ft_printf (Completed)
- Recreated printf function from scratch
- Learned variadic functions and format specifiers

Personal Website (Self-taught)
- Built portfolio site using React and Tailwind CSS
- Deployed on Vercel

SKILLS:
- Languages: C, JavaScript, HTML/CSS, Python (basics)
- Tools: Git, Make, VS Code, Terminal
- Concepts: Algorithms, Data Structures, Memory Management

INTERESTS:
- Open source contribution (exploring first contributions)
- Game development (Unity tutorials)
- Tech podcasts and documentation reading
`;

class SimulatedInternCandidate {
  private model: ChatGroq;
  private profile: { name: string; cv: string };

  constructor(name: string, cv: string) {
    this.profile = { name, cv };
    this.model = new ChatGroq({
      model: "llama-3.1-8b-instant",
      temperature: 0.8,
    });
  }

  async respond(
    interviewerMessage: string, 
    conversationHistory: ConversationTurn[],
    responseType: ResponseType,
    personaName?: string
  ): Promise<string> {
    const historyText = conversationHistory.slice(-6)
      .map(turn => {
        const speaker = turn.speaker === 'interviewer' 
          ? (turn.personaName || 'Interviewer') 
          : 'You';
        return `${speaker}: ${turn.message}`;
      })
      .join('\n');

    const responseInstructions = {
      'complete': `Give a COMPLETE answer showing enthusiasm and willingness to learn.
        Keep it SHORT: 2-3 sentences. Be genuine about being early in your career.
        Example: "At 42, I learned to debug by adding print statements first, then using gdb. I ask peers for help after about 30 minutes of being stuck."`,
      
      'vague': `Give a VAGUE, short answer. Show uncertainty typical of a junior.
        ONE sentence only. Be honest about limited experience.
        Example: "I've worked on a few projects with other students." or "I'm still learning that."`,
      
      'partial': `Give a PARTIAL answer - address part but miss something.
        1-2 sentences. Show you're learning but haven't mastered everything.
        Example: "I use git for version control." (missing workflow details)`,
      
      'asks_question': `Ask a CLARIFYING QUESTION showing genuine curiosity.
        1-2 sentences. Show you want to understand the question better.
        Example: "Could you give me an example of what you mean by that?"`,
      
      'offers_elaboration': `Give a brief answer then OFFER TO ELABORATE more.
        2 sentences. Show eagerness to share more about your learning.
        Example: "I worked on that in my minishell project. Would you like me to explain how I approached it?"`,
    };

    const prompt = `You are ${this.profile.name}, an intern candidate interviewing for a software engineering internship.
You are a 42 London student, which means you're self-taught through peer learning (no teachers, no lectures).

YOUR CV/BACKGROUND:
${this.profile.cv}

CONVERSATION SO FAR:
${historyText}

${personaName ? `NOTE: ${personaName} just asked this question.` : ''}

INTERVIEWER'S LATEST MESSAGE:
${interviewerMessage}

RESPONSE INSTRUCTION (${responseType.toUpperCase()}):
${responseInstructions[responseType]}

Key traits to show:
- Enthusiasm for learning
- Honesty about what you don't know yet
- Collaborative mindset from 42's peer learning
- Problem-solving approach

Respond naturally as this candidate would.
YOUR RESPONSE (just the response, no prefix):`;

    const response = await this.model.invoke(prompt);
    return response.content.toString().trim();
  }
}

class TeamInterviewEvaluator {
  private model: ChatGroq;

  constructor() {
    this.model = new ChatGroq({
      model: "llama-3.1-8b-instant",
      temperature: 0.2,
    });
  }

  async evaluate(
    conversation: ConversationTurn[],
    personaBreakdown: Record<string, number>
  ): Promise<TeamInterviewEvaluation> {
    const conversationText = conversation
      .map(turn => {
        const typeLabel = turn.responseType ? ` [${turn.responseType}]` : '';
        const personaLabel = turn.personaName ? ` (${turn.personaName})` : '';
        return `[${turn.speaker.toUpperCase()}${personaLabel}${turn.questionNumber ? ` Q${turn.questionNumber}` : ''}${typeLabel}]: ${turn.message}`;
      })
      .join('\n\n');

    const lastInterviewerMessages = conversation
      .filter(t => t.speaker === 'interviewer')
      .slice(-3);
    
    const hadClosing = lastInterviewerMessages.some(m => 
      m.message.toLowerCase().includes('thank you') ||
      m.message.toLowerCase().includes('appreciate') ||
      m.message.toLowerCase().includes('next steps') ||
      m.message.toLowerCase().includes('questions for us')
    );

    const prompt = `You are an expert at evaluating team interview quality. This is a team interview for an Intern Software Engineer position with TWO interviewers:
- Marcus: Engineering Manager (friendly, focuses on collaboration and growth)
- Sarah: Tech Lead (technical, asks about problem-solving approach)

Persona breakdown: ${JSON.stringify(personaBreakdown)}

CONVERSATION:
${conversationText}

Evaluate the INTERVIEWERS' performance:

1. PERSONA_CONSISTENCY (1-10): 
   - Did Marcus and Sarah maintain distinct personalities?
   - Did their questions match their roles (Sarah = technical, Marcus = behavioral)?
   - Were messages attributed to the correct persona?

2. HANDOFFS (1-10):
   - Were transitions between Marcus and Sarah natural?
   - Did they build on each other's questions?
   - Any awkward persona switches?

3. CLOSING_FLOW (1-10):
   - Did the interview have a proper closing?
   - Was there opportunity for candidate questions?
   - Did both personas participate in closing (or was it natural for one to lead)?

4. NATURALNESS (1-10):
   - Did it feel like a real team interview?
   - Was the pace appropriate for an intern?
   - Were questions calibrated for intern level (not too advanced)?

Also analyze the closing specifically and provide 3-5 improvements.

Respond in JSON:
{
  "personaConsistency": {"score": <1-10>, "reasoning": "<explanation>"},
  "handoffs": {"score": <1-10>, "reasoning": "<explanation>"},
  "closingFlow": {"score": <1-10>, "reasoning": "<explanation>"},
  "naturalness": {"score": <1-10>, "reasoning": "<explanation>"},
  "overallScore": <weighted average>,
  "summary": "<overall assessment>",
  "improvements": ["<improvement 1>", "<improvement 2>", ...],
  "closingAnalysis": {
    "hadClosing": ${hadClosing},
    "closingPersona": "<which persona led the closing, if any>",
    "closingQuality": "<brief assessment of how the interview ended>"
  }
}`;

    const response = await this.model.invoke(prompt);
    let content = response.content.toString().trim();
    
    if (content.startsWith('```json')) content = content.slice(7);
    else if (content.startsWith('```')) content = content.slice(3);
    if (content.endsWith('```')) content = content.slice(0, -3);
    
    try {
      return JSON.parse(content.trim());
    } catch (e) {
      console.error('Parse error:', content);
      return {
        personaConsistency: { score: 0, reasoning: 'Parse error' },
        handoffs: { score: 0, reasoning: 'Parse error' },
        closingFlow: { score: 0, reasoning: 'Parse error' },
        naturalness: { score: 0, reasoning: 'Parse error' },
        overallScore: 0,
        summary: 'Failed to parse',
        improvements: [],
        closingAnalysis: { hadClosing: false, closingQuality: 'Unknown' }
      };
    }
  }
}

async function runTeamInterview(iteration: number): Promise<IterationResult> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TEAM INTERVIEW - ITERATION ${iteration}`);
  console.log('='.repeat(80));
  
  const orchestrator = new InterviewOrchestrator();
  
  const jobContext = {
    companyName: "NovaPay",
    companyDescription: "A fintech startup building modern payment solutions for small businesses.",
    jobTitle: "Software Engineering Intern",
    jobRequirements: `
      - Currently enrolled in or recently completed a coding bootcamp or CS program
      - Basic proficiency in at least one programming language
      - Familiarity with version control (Git)
      - Eagerness to learn and collaborate
      - Strong communication skills
    `,
    candidateCv: ARSEN_CV,
    experienceLevel: 'intern' as const
  };
  
  const candidate = new SimulatedInternCandidate("Arsen", ARSEN_CV);
  const conversation: ConversationTurn[] = [];
  const personaBreakdown: Record<string, number> = {};
  let questionCount = 0;
  
  // Start team interview
  console.log('\n[Starting team interview with Marcus and Sarah...]\n');
  
  const { session, greeting, isPreludeMode, teamPersonas, activePersonaId } = await orchestrator.startInterview(
    1, "team", "Software Engineer", "intern", 8, jobContext, "Arsen"
  );
  
  // Track initial persona
  const initialPersona = teamPersonas?.find((p: any) => p.id === activePersonaId);
  if (initialPersona) {
    personaBreakdown[initialPersona.name] = (personaBreakdown[initialPersona.name] || 0) + 1;
  }
  
  console.log(`[${initialPersona?.name || 'INTERVIEWER'} - Greeting]: ${greeting}`);
  conversation.push({ 
    speaker: 'interviewer', 
    message: greeting || '',
    personaId: activePersonaId,
    personaName: initialPersona?.name
  });
  
  // Handle prelude (greetings) with complete responses
  let candidateResponse = await candidate.respond(greeting || '', conversation, 'complete', initialPersona?.name);
  console.log(`[CANDIDATE]: ${candidateResponse}\n`);
  conversation.push({ speaker: 'candidate', message: candidateResponse, responseType: 'complete' });
  
  if (isPreludeMode) {
    // Handle prelude exchanges
    let preludeResult: any = await orchestrator.handlePreludeResponse(session.id, candidateResponse);
    let currentPersonaName = initialPersona?.name;
    
    while (preludeResult.preludeMessage && !preludeResult.firstQuestion) {
      // Track persona changes in prelude
      if (preludeResult.activePersona) {
        currentPersonaName = preludeResult.activePersona.name;
        if (currentPersonaName) {
          personaBreakdown[currentPersonaName] = (personaBreakdown[currentPersonaName] || 0) + 1;
        }
      }
      
      console.log(`[${currentPersonaName} - Prelude]: ${preludeResult.preludeMessage}`);
      conversation.push({ 
        speaker: 'interviewer', 
        message: preludeResult.preludeMessage,
        personaId: preludeResult.activePersona?.id,
        personaName: currentPersonaName
      });
      
      candidateResponse = await candidate.respond(preludeResult.preludeMessage, conversation, 'complete', currentPersonaName);
      console.log(`[CANDIDATE]: ${candidateResponse}\n`);
      conversation.push({ speaker: 'candidate', message: candidateResponse, responseType: 'complete' });
      
      preludeResult = await orchestrator.handlePreludeResponse(session.id, candidateResponse);
    }
    
    // First question
    if (preludeResult.firstQuestion) {
      questionCount++;
      const questionPersonaName = preludeResult.activePersona?.name || currentPersonaName;
      if (questionPersonaName) {
        personaBreakdown[questionPersonaName] = (personaBreakdown[questionPersonaName] || 0) + 1;
      }
      
      console.log(`[${questionPersonaName} - Q${questionCount}]: ${preludeResult.firstQuestion.questionText}`);
      conversation.push({ 
        speaker: 'interviewer', 
        message: preludeResult.firstQuestion.questionText,
        questionNumber: questionCount,
        personaId: preludeResult.activePersona?.id,
        personaName: questionPersonaName
      });
    }
  }
  
  // Main interview loop
  const maxQuestions = 15; // Safety limit
  
  while (questionCount < maxQuestions) {
    const currentSession = await storage.getInterviewSession(session.id);
    if (!currentSession || currentSession.status === 'completed') break;
    
    const questions = await storage.getInterviewQuestions(session.id);
    const currentQuestion = questions[questions.length - 1];
    if (!currentQuestion) break;
    
    // Get persona name for context
    const lastInterviewerTurn = conversation.filter(t => t.speaker === 'interviewer').slice(-1)[0];
    const currentPersonaName = lastInterviewerTurn?.personaName;
    
    // Varied response type
    const responseType = getRandomResponseType();
    candidateResponse = await candidate.respond(currentQuestion.questionText, conversation, responseType, currentPersonaName);
    console.log(`[CANDIDATE] (${responseType}): ${candidateResponse}\n`);
    conversation.push({ speaker: 'candidate', message: candidateResponse, responseType });
    
    const result: any = await orchestrator.submitAnswer(session.id, currentQuestion.id, candidateResponse);
    
    // Check for closing
    if (result.finalReport) {
      if (result.closure) {
        console.log(`\n[CLOSING]: ${result.closure}`);
        conversation.push({ 
          speaker: 'interviewer', 
          message: result.closure,
          personaName: result.activePersona?.name || 'Team'
        });
      }
      console.log('\n[Interview completed - Final report generated]');
      break;
    }
    
    // Handle next question with persona tracking
    if (result.nextQuestion) {
      questionCount++;
      const personaName = result.activePersona?.name;
      if (personaName) {
        personaBreakdown[personaName] = (personaBreakdown[personaName] || 0) + 1;
      }
      
      let response = '';
      if (result.reflection) response += result.reflection + ' ';
      response += result.nextQuestion.questionText;
      
      console.log(`[${personaName || 'INTERVIEWER'} - Q${questionCount}]: ${response}`);
      conversation.push({ 
        speaker: 'interviewer', 
        message: response,
        questionNumber: questionCount,
        personaId: result.activePersona?.id,
        personaName
      });
      
      // Handle addressed persona response (when one persona mentions another)
      if (result.addressedPersonaResponse) {
        const addressedName = result.addressedPersonaResponse.personaName;
        personaBreakdown[addressedName] = (personaBreakdown[addressedName] || 0) + 1;
        
        console.log(`[${addressedName} - Follow-up]: ${result.addressedPersonaResponse.content}`);
        conversation.push({
          speaker: 'interviewer',
          message: result.addressedPersonaResponse.content,
          personaId: result.addressedPersonaResponse.personaId,
          personaName: addressedName
        });
      }
    }
  }
  
  // Evaluate
  console.log('\n[Evaluating interview quality...]\n');
  const evaluator = new TeamInterviewEvaluator();
  const evaluation = await evaluator.evaluate(conversation, personaBreakdown);
  
  console.log(`\n--- Iteration ${iteration} Scores ---`);
  console.log(`Persona Consistency: ${evaluation.personaConsistency.score}/10`);
  console.log(`Handoffs: ${evaluation.handoffs.score}/10`);
  console.log(`Closing Flow: ${evaluation.closingFlow.score}/10`);
  console.log(`Naturalness: ${evaluation.naturalness.score}/10`);
  console.log(`Overall: ${evaluation.overallScore}/10`);
  console.log(`\nPersona Breakdown:`, personaBreakdown);
  console.log(`\nClosing Analysis:`, JSON.stringify(evaluation.closingAnalysis, null, 2));
  
  return { iteration, questionCount, conversation, evaluation, personaBreakdown };
}

async function runAllIterations(iterations: number = 1) {
  console.log('\n' + '█'.repeat(80));
  console.log('TEAM INTERVIEW QUALITY TEST');
  console.log('Candidate: Arsen Tadevosyan (42 London Student)');
  console.log('Position: Software Engineering Intern at NovaPay');
  console.log('Interviewers: Marcus (Engineering Manager) & Sarah (Tech Lead)');
  console.log('█'.repeat(80));
  
  const results: IterationResult[] = [];
  
  for (let i = 1; i <= iterations; i++) {
    try {
      const result = await runTeamInterview(i);
      results.push(result);
      
      if (i < iterations) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error: any) {
      console.error(`\nIteration ${i} failed:`, error.message);
      console.error(error.stack);
      if (error.message?.includes('Rate limit')) {
        console.log('Rate limit hit - stopping test');
        break;
      }
    }
  }
  
  // Aggregate results
  console.log('\n' + '█'.repeat(80));
  console.log('AGGREGATE RESULTS');
  console.log('█'.repeat(80));
  
  if (results.length === 0) {
    console.log('No successful iterations');
    return;
  }
  
  const avgPersona = results.reduce((sum, r) => sum + r.evaluation.personaConsistency.score, 0) / results.length;
  const avgHandoffs = results.reduce((sum, r) => sum + r.evaluation.handoffs.score, 0) / results.length;
  const avgClosing = results.reduce((sum, r) => sum + r.evaluation.closingFlow.score, 0) / results.length;
  const avgNatural = results.reduce((sum, r) => sum + r.evaluation.naturalness.score, 0) / results.length;
  const avgOverall = results.reduce((sum, r) => sum + r.evaluation.overallScore, 0) / results.length;
  
  console.log(`\nAVERAGE SCORES (${results.length} iterations):`);
  console.log(`  Persona Consistency: ${avgPersona.toFixed(1)}/10`);
  console.log(`  Handoffs:           ${avgHandoffs.toFixed(1)}/10`);
  console.log(`  Closing Flow:       ${avgClosing.toFixed(1)}/10`);
  console.log(`  Naturalness:        ${avgNatural.toFixed(1)}/10`);
  console.log(`  Overall:            ${avgOverall.toFixed(1)}/10`);
  
  // Closing analysis summary
  console.log('\nCLOSING ANALYSIS:');
  results.forEach((r, i) => {
    const ca = r.evaluation.closingAnalysis;
    console.log(`  [${i + 1}] Had closing: ${ca.hadClosing ? 'Yes' : 'No'} | Lead: ${ca.closingPersona || 'N/A'} | Quality: ${ca.closingQuality}`);
  });
  
  // Persona distribution
  console.log('\nPERSONA DISTRIBUTION:');
  results.forEach((r, i) => {
    console.log(`  [${i + 1}]`, r.personaBreakdown);
  });
  
  console.log('\nIMPROVEMENTS SUGGESTED:');
  results.forEach((r, i) => {
    console.log(`\n  Iteration ${i + 1}:`);
    r.evaluation.improvements.forEach((imp, j) => {
      console.log(`    ${j + 1}. ${imp}`);
    });
  });
  
  console.log('\nSUMMARIES:');
  results.forEach((r, i) => {
    console.log(`  [${i + 1}] ${r.evaluation.summary}`);
  });
  
  console.log('\n' + '█'.repeat(80));
  console.log('TEST COMPLETE');
  console.log('█'.repeat(80));
}

// Run with 1 iteration by default
const iterations = parseInt(process.argv[2] || '1', 10);
runAllIterations(iterations)
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
