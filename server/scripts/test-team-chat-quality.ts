/**
 * Team Chat Quality Test Script
 * 
 * Simulates a new team member chatting with AI teammates during onboarding.
 * Tests conversation flow, naturalness, onboarding value, and social connection.
 */

import { WorkspaceOrchestrator, WorkspaceContext, TeamMember, ChannelMessage } from '../services/workspace-orchestrator';
import { ChatGroq } from '@langchain/groq';

interface ConversationTurn {
  speaker: 'teammate' | 'user';
  speakerName: string;
  message: string;
  responseType?: ResponseType;
}

interface QualityEvaluation {
  naturalness: { score: number; reasoning: string };
  onboardingValue: { score: number; reasoning: string };
  socialConnection: { score: number; reasoning: string };
  brevity: { score: number; reasoning: string };
  overallScore: number;
  summary: string;
  improvements: string[];
}

interface TeamMemberResult {
  memberName: string;
  memberRole: string;
  turnCount: number;
  conversation: ConversationTurn[];
  evaluation: QualityEvaluation;
}

interface TestResult {
  iteration: number;
  userLevel: string;
  userRole: string;
  teamResults: TeamMemberResult[];
  crossMemberAnalysis: {
    uniquenessScore: number;
    scripted: boolean;
    reasoning: string;
  };
}

type ResponseType = 'greeting' | 'question' | 'brief' | 'curious' | 'wrapping_up';

function getRandomResponseType(turnNumber: number, maxTurns: number): ResponseType {
  if (turnNumber === 0) return 'greeting';
  if (turnNumber >= maxTurns - 1) return 'wrapping_up';
  
  const rand = Math.random();
  if (rand < 0.35) return 'question';     // 35% ask questions
  if (rand < 0.60) return 'curious';      // 25% show curiosity
  return 'brief';                         // 40% brief responses
}

const NEW_HIRE_BACKGROUND = `
First day as a software developer intern at NovaPay, a fintech startup.
Background: Recent CS graduate, familiar with React and Node.js.
Personality: Eager to learn, slightly nervous, wants to make a good impression.
`;

class SimulatedNewHire {
  private model: ChatGroq;
  private profile: {
    name: string;
    level: string;
    role: string;
  };

  constructor(name: string, level: string, role: string) {
    this.profile = { name, level, role };
    this.model = new ChatGroq({
      model: "llama-3.1-8b-instant",
      temperature: 0.8,
    });
  }

  async respond(
    teammateMessage: string,
    teammateName: string,
    conversationHistory: ConversationTurn[],
    responseType: ResponseType
  ): Promise<string> {
    const historyText = conversationHistory.slice(-4)
      .map(turn => `${turn.speakerName}: ${turn.message}`)
      .join('\n');

    const responseInstructions = {
      'greeting': `Say hi naturally. Keep it SHORT (1 sentence).
        Example: "Hey! Nice to meet you, I'm excited to be here!"`,
      
      'question': `Ask a RELEVANT question about the team, work, or their role.
        1 sentence. Be genuinely curious.
        Examples: "What's your favorite part about working here?" or "How does the team usually collaborate?"`,
      
      'brief': `Give a SHORT acknowledgment or reaction.
        1 sentence max. Natural and casual.
        Examples: "Oh nice, that sounds interesting!" or "Got it, thanks!"`,
      
      'curious': `Show interest and ask for more details.
        1-2 sentences. Be engaged but not overwhelming.
        Example: "That's really helpful! How did you get started in that area?"`,
      
      'wrapping_up': `Thank them and wrap up the conversation naturally.
        1-2 sentences. Be appreciative but not excessive.
        Example: "Thanks so much for chatting! I'll definitely reach out if I have more questions."`,
    };

    const prompt = `You are ${this.profile.name}, a new ${this.profile.level} ${this.profile.role} on your first day.

YOUR BACKGROUND:
${NEW_HIRE_BACKGROUND}

CONVERSATION WITH ${teammateName}:
${historyText}

${teammateName}'s LATEST MESSAGE:
${teammateMessage}

RESPONSE INSTRUCTION (${responseType.toUpperCase()}):
${responseInstructions[responseType]}

Be natural, authentic, and don't try too hard. This is a casual work chat.
YOUR RESPONSE (just the response, no prefix):`;

    const response = await this.model.invoke(prompt);
    return response.content.toString().trim();
  }
}

class ChatQualityEvaluator {
  private model: ChatGroq;

  constructor() {
    this.model = new ChatGroq({
      model: "llama-3.1-8b-instant",
      temperature: 0.2,
    });
  }

  async evaluateSingleConversation(
    conversation: ConversationTurn[],
    teammateName: string,
    teammateRole: string
  ): Promise<QualityEvaluation> {
    const conversationText = conversation
      .map(turn => {
        const typeLabel = turn.responseType ? ` [${turn.responseType}]` : '';
        return `[${turn.speakerName}${typeLabel}]: ${turn.message}`;
      })
      .join('\n\n');

    const prompt = `You are an expert at evaluating workplace chat quality. Analyze this onboarding conversation between a new hire and ${teammateName} (${teammateRole}).

CONVERSATION:
${conversationText}

Evaluate the TEAMMATE's (${teammateName}) performance:

1. NATURALNESS (1-10): 
   - Does it feel like a real person chatting?
   - Is it conversational or does it feel scripted/robotic?
   - Are there natural acknowledgments and transitions?

2. ONBOARDING VALUE (1-10):
   - Did they share useful information about the team/work?
   - Did they help the new hire feel oriented?
   - Was the info relevant to their role (${teammateRole})?

3. SOCIAL CONNECTION (1-10):
   - Did they make the new hire feel welcome?
   - Was there warmth and personality?
   - Did it feel like meeting a real colleague?

4. BREVITY (1-10):
   - Were responses appropriately concise for chat?
   - Was there rambling or over-explaining?
   - Did the conversation flow at a natural pace?

Provide 2-3 specific improvements.

Respond in JSON:
{
  "naturalness": {"score": <1-10>, "reasoning": "<explanation>"},
  "onboardingValue": {"score": <1-10>, "reasoning": "<explanation>"},
  "socialConnection": {"score": <1-10>, "reasoning": "<explanation>"},
  "brevity": {"score": <1-10>, "reasoning": "<explanation>"},
  "overallScore": <weighted average>,
  "summary": "<overall assessment>",
  "improvements": ["<improvement 1>", "<improvement 2>", ...]
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
        naturalness: { score: 0, reasoning: 'Parse error' },
        onboardingValue: { score: 0, reasoning: 'Parse error' },
        socialConnection: { score: 0, reasoning: 'Parse error' },
        brevity: { score: 0, reasoning: 'Parse error' },
        overallScore: 0,
        summary: 'Failed to parse',
        improvements: []
      };
    }
  }

  async evaluateCrossMemberUniqueness(
    allConversations: TeamMemberResult[]
  ): Promise<{ uniquenessScore: number; scripted: boolean; reasoning: string }> {
    const summaries = allConversations.map(r => ({
      name: r.memberName,
      role: r.memberRole,
      messages: r.conversation
        .filter(t => t.speaker === 'teammate')
        .map(t => t.message)
    }));

    const prompt = `Analyze these 3 different teammates' conversations with a new hire. Check if they feel unique or if they give similar "scripted" responses.

${summaries.map(s => `
=== ${s.name} (${s.role}) ===
${s.messages.map((m, i) => `${i + 1}. ${m}`).join('\n')}
`).join('\n')}

Evaluate:
1. Do they have DISTINCT personalities and communication styles?
2. Do they share DIFFERENT types of information based on their roles?
3. Are there any suspiciously SIMILAR phrases or structures?
4. Does each teammate bring UNIQUE value to onboarding?

Score 1-10 where:
- 10 = Each teammate feels completely distinct and authentic
- 5 = Some overlap but generally different
- 1 = Very scripted, interchangeable responses

Respond in JSON:
{
  "uniquenessScore": <1-10>,
  "scripted": <true/false>,
  "reasoning": "<explanation of similarities/differences>"
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
      return { uniquenessScore: 0, scripted: true, reasoning: 'Parse error' };
    }
  }
}

async function runSingleTeamChat(
  orchestrator: WorkspaceOrchestrator,
  member: TeamMember,
  context: WorkspaceContext,
  newHire: SimulatedNewHire,
  sessionId: string
): Promise<TeamMemberResult> {
  console.log(`\n  --- Chatting with ${member.name} (${member.role}) ---`);
  
  const conversation: ConversationTurn[] = [];
  const conversationHistory: ChannelMessage[] = [];
  const maxTurns = 4 + Math.floor(Math.random() * 2); // 4-5 turns per teammate
  
  // Start with user greeting
  let userMessage = "Hey! I'm the new developer starting today. Nice to meet you!";
  console.log(`  [USER]: ${userMessage}`);
  conversation.push({
    speaker: 'user',
    speakerName: 'New Hire',
    message: userMessage,
    responseType: 'greeting'
  });
  
  for (let turn = 0; turn < maxTurns; turn++) {
    // Get teammate response
    const response = await orchestrator.generateTeamMemberResponse(
      member,
      context,
      userMessage,
      'chat',
      conversationHistory
    );
    
    if (!response || !response.content) {
      console.log(`  [${member.name}]: (no response)`);
      break;
    }
    
    const teammateMessage = response.content;
    console.log(`  [${member.name}]: ${teammateMessage}`);
    conversation.push({
      speaker: 'teammate',
      speakerName: member.name,
      message: teammateMessage
    });
    
    // Add to history for context
    conversationHistory.push({
      sender: member.name,
      senderRole: member.role,
      content: teammateMessage,
      timestamp: new Date()
    });
    
    // Check if this is the last turn
    if (turn >= maxTurns - 1) break;
    
    // Generate user response
    const responseType = getRandomResponseType(turn + 1, maxTurns);
    userMessage = await newHire.respond(
      teammateMessage,
      member.name,
      conversation,
      responseType
    );
    
    console.log(`  [USER] (${responseType}): ${userMessage}`);
    conversation.push({
      speaker: 'user',
      speakerName: 'New Hire',
      message: userMessage,
      responseType
    });
    
    // Add user message to history
    conversationHistory.push({
      sender: 'User',
      senderRole: 'New Hire',
      content: userMessage,
      timestamp: new Date()
    });
  }
  
  // Evaluate this conversation
  const evaluator = new ChatQualityEvaluator();
  const evaluation = await evaluator.evaluateSingleConversation(
    conversation,
    member.name,
    member.role
  );
  
  console.log(`  Scores: Natural=${evaluation.naturalness.score} | Value=${evaluation.onboardingValue.score} | Social=${evaluation.socialConnection.score} | Brief=${evaluation.brevity.score}`);
  
  return {
    memberName: member.name,
    memberRole: member.role,
    turnCount: conversation.filter(t => t.speaker === 'teammate').length,
    conversation,
    evaluation
  };
}

async function runFullTest(iteration: number, userLevel: string, userRole: string): Promise<TestResult> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`ITERATION ${iteration} | Level: ${userLevel} | Role: ${userRole}`);
  console.log('='.repeat(80));
  
  const orchestrator = new WorkspaceOrchestrator();
  const sessionId = `test-session-${Date.now()}`;
  
  const context: WorkspaceContext = {
    projectName: "NovaPay Merchant Dashboard",
    projectDescription: "Payment processing dashboard for merchants to manage transactions, view analytics, and handle refunds",
    currentSprint: "Sprint 23 - Mobile Responsive Redesign",
    teamMembers: [],
    userRole,
    userLevel,
    phase: 'onboarding',
    currentDay: 1,
    dayActivities: ['Meet the team', 'Set up development environment', 'Explore codebase']
  };
  
  const teamMembers: TeamMember[] = [
    {
      name: 'Marcus',
      role: 'Tech Lead',
      personality: 'experienced and helpful',
      expertise: ['system architecture', 'code reviews', 'React', 'Node.js'],
      availability: 'usually'
    },
    {
      name: 'Priya',
      role: 'Product Manager',
      personality: 'organized and communicative',
      expertise: ['product strategy', 'stakeholder management', 'user research'],
      availability: 'usually'
    },
    {
      name: 'Alex',
      role: 'QA Engineer',
      personality: 'detail-oriented and thorough',
      expertise: ['test automation', 'quality processes', 'bug tracking'],
      availability: 'usually'
    }
  ];
  
  const newHire = new SimulatedNewHire('Jamie', userLevel, userRole);
  const teamResults: TeamMemberResult[] = [];
  
  // Chat with each team member
  for (const member of teamMembers) {
    try {
      const result = await runSingleTeamChat(
        orchestrator,
        member,
        context,
        newHire,
        sessionId
      );
      teamResults.push(result);
      
      // Brief pause between conversations
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      console.error(`  Error chatting with ${member.name}:`, error.message);
    }
  }
  
  // Cross-member uniqueness analysis
  const evaluator = new ChatQualityEvaluator();
  const crossMemberAnalysis = await evaluator.evaluateCrossMemberUniqueness(teamResults);
  
  console.log(`\n  Cross-Member Uniqueness: ${crossMemberAnalysis.uniquenessScore}/10 | Scripted: ${crossMemberAnalysis.scripted}`);
  
  return {
    iteration,
    userLevel,
    userRole,
    teamResults,
    crossMemberAnalysis
  };
}

async function runAllTests() {
  console.log('\n' + '█'.repeat(80));
  console.log('TEAM CHAT QUALITY TEST');
  console.log('Testing onboarding conversations with AI teammates');
  console.log('█'.repeat(80));
  
  const testConfigs = [
    { level: 'intern', role: 'developer' },
    { level: 'senior', role: 'developer' },
  ];
  
  const results: TestResult[] = [];
  
  for (let i = 0; i < testConfigs.length; i++) {
    const config = testConfigs[i];
    try {
      const result = await runFullTest(i + 1, config.level, config.role);
      results.push(result);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: any) {
      console.error(`\nTest ${i + 1} failed:`, error.message);
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
    console.log('No successful tests');
    return;
  }
  
  // Per-teammate averages
  console.log('\nPER-TEAMMATE AVERAGES:');
  const teammateNames = ['Marcus', 'Priya', 'Alex'];
  
  for (const name of teammateNames) {
    const teammateResults = results
      .flatMap(r => r.teamResults)
      .filter(tr => tr.memberName === name);
    
    if (teammateResults.length === 0) continue;
    
    const avgNatural = teammateResults.reduce((s, r) => s + r.evaluation.naturalness.score, 0) / teammateResults.length;
    const avgValue = teammateResults.reduce((s, r) => s + r.evaluation.onboardingValue.score, 0) / teammateResults.length;
    const avgSocial = teammateResults.reduce((s, r) => s + r.evaluation.socialConnection.score, 0) / teammateResults.length;
    const avgBrief = teammateResults.reduce((s, r) => s + r.evaluation.brevity.score, 0) / teammateResults.length;
    
    console.log(`  ${name}: Natural=${avgNatural.toFixed(1)} | Value=${avgValue.toFixed(1)} | Social=${avgSocial.toFixed(1)} | Brief=${avgBrief.toFixed(1)}`);
  }
  
  // Cross-member uniqueness
  const avgUniqueness = results.reduce((s, r) => s + r.crossMemberAnalysis.uniquenessScore, 0) / results.length;
  const scriptedCount = results.filter(r => r.crossMemberAnalysis.scripted).length;
  
  console.log(`\nCROSS-MEMBER UNIQUENESS: ${avgUniqueness.toFixed(1)}/10`);
  console.log(`Scripted feel detected: ${scriptedCount}/${results.length} tests`);
  
  // Level comparison
  console.log('\nLEVEL COMPARISON:');
  results.forEach(r => {
    const avgOverall = r.teamResults.reduce((s, tr) => s + tr.evaluation.overallScore, 0) / r.teamResults.length;
    console.log(`  ${r.userLevel} ${r.userRole}: Overall=${avgOverall.toFixed(1)}/10 | Uniqueness=${r.crossMemberAnalysis.uniquenessScore}/10`);
  });
  
  // Improvements
  console.log('\nTOP IMPROVEMENTS:');
  const allImprovements = results
    .flatMap(r => r.teamResults)
    .flatMap(tr => tr.evaluation.improvements);
  
  const uniqueImprovements = Array.from(new Set(allImprovements)).slice(0, 5);
  uniqueImprovements.forEach((imp, i) => {
    console.log(`  ${i + 1}. ${imp}`);
  });
  
  // Uniqueness reasoning
  console.log('\nUNIQUENESS ANALYSIS:');
  results.forEach(r => {
    console.log(`  [${r.userLevel}]: ${r.crossMemberAnalysis.reasoning}`);
  });
  
  console.log('\n' + '█'.repeat(80));
  console.log('TEST COMPLETE');
  console.log('█'.repeat(80));
}

runAllTests()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
