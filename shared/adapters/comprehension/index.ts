/**
 * Comprehension Chat Adapter
 * 
 * Provides role-aware, level-adjusted prompts for documentation comprehension
 * checks with Sarah (Tech Lead). Verifies the intern understood the docs and
 * guides them to the next onboarding step.
 */

import type { Role } from '../index';
import type { ComprehensionPersona, ComprehensionLevelOverlay, ComprehensionTopic, ComprehensionConfig, ComprehensionState } from './types';
import { sarahPersona } from './sarah';
import { getComprehensionLevelOverlay } from './levels';

export * from './types';
export { getComprehensionLevelOverlay } from './levels';
export { sarahPersona } from './sarah';

function normalizeRole(role: string): Role {
  const r = role.toLowerCase();
  if (r.includes('pm') || r.includes('product')) return 'pm';
  if (r.includes('qa') || r.includes('quality')) return 'qa';
  if (r.includes('devops') || r.includes('ops')) return 'devops';
  if (r.includes('data')) return 'data_science';
  return 'developer';
}

function getTopicsForRole(persona: ComprehensionPersona, userRole: Role): ComprehensionTopic[] {
  switch (userRole) {
    case 'developer':
      return persona.comprehensionTopics.forDeveloper;
    case 'pm':
      return persona.comprehensionTopics.forPM;
    case 'qa':
      return persona.comprehensionTopics.forQA;
    case 'devops':
      return persona.comprehensionTopics.forDevOps;
    default:
      return persona.comprehensionTopics.default;
  }
}

export function getComprehensionConfig(
  userRole: string,
  userLevel: string
): ComprehensionConfig {
  const normalizedRole = normalizeRole(userRole);
  const levelOverlay = getComprehensionLevelOverlay(userLevel);
  const topics = getTopicsForRole(sarahPersona, normalizedRole);
  
  return {
    persona: sarahPersona,
    levelOverlay,
    userRole: normalizedRole,
    topics
  };
}

export function buildComprehensionSystemPrompt(
  config: ComprehensionConfig,
  companyName: string
): string {
  const { persona, levelOverlay, userRole, topics } = config;
  const style = levelOverlay.conversationStyle;
  const expectations = levelOverlay.understandingExpectations;
  const tone = levelOverlay.toneAdjustments;
  
  let toneGuidance = '';
  if (tone.beExtraEncouraging) {
    toneGuidance += 'Be extra encouraging - celebrate their observations and make them feel confident. ';
  }
  if (tone.offerMoreGuidance) {
    toneGuidance += 'Proactively offer guidance and explanations. ';
  }
  if (tone.assumePriorKnowledge) {
    toneGuidance += 'You can assume they have industry experience. ';
  }
  
  const topicList = topics.map(t => `- ${t.topic}: ${t.description}`).join('\n');
  const encouragingPhrase = persona.encouragingPhrases[Math.floor(Math.random() * persona.encouragingPhrases.length)];
  
  return `You are ${persona.name}, a ${persona.personality} ${persona.role} at ${companyName}.

YOUR EXPERTISE: ${persona.expertise.join(', ')}
YOUR COMMUNICATION STYLE: ${persona.communicationStyle}

THE USER: A new ${userRole} at the ${levelOverlay.displayName} level who just read the documentation.

YOUR ROLE-SPECIFIC CONTEXT:
${persona.roleSpecificContext}

COMPREHENSION TOPICS TO COVER (based on their role as ${userRole}):
${topicList}

CONVERSATION STYLE FOR ${levelOverlay.displayName.toUpperCase()} LEVEL:
- Tone: ${style.tone}
- Depth: ${style.depth}
- Be ${style.proactivity === 'high' ? 'proactive in offering context and encouragement' : style.proactivity === 'medium' ? 'balanced between listening and guiding' : 'responsive to their lead'}
${toneGuidance}

UNDERSTANDING EXPECTATIONS:
- Detail level expected: ${expectations.detailLevel}
- ${expectations.allowPartialUnderstanding ? 'Partial understanding is okay - fill in gaps gently' : 'Encourage complete understanding before moving on'}
- ${expectations.encourageQuestions ? 'Actively encourage questions - remind them no question is too basic' : 'Answer questions as they come'}

ENCOURAGING PHRASES (use naturally):
${persona.encouragingPhrases.map(p => `- "${p}"`).join('\n')}

TRANSITION TO NEXT STEPS (when ready to close):
${persona.transitionToNextSteps.map(t => `- "${t}"`).join('\n')}

WARM CLOSINGS:
${persona.warmClosings.map(c => `- "${c}"`).join('\n')}

CRITICAL CHAT ETIQUETTE:
- Keep responses SHORT: 2-3 sentences max
- This is a casual check-in, NOT an exam
- ALWAYS acknowledge what they shared specifically before asking more
- Be warm and make them feel comfortable
- Don't overwhelm with too many questions at once`;
}

export function buildComprehensionGuidance(
  config: ComprehensionConfig,
  state: ComprehensionState,
  turnCount: number,
  isFirstResponse: boolean
): string {
  const { persona, levelOverlay } = config;
  const criteria = levelOverlay.closingCriteria;
  
  const minTurnsMet = turnCount >= criteria.minUserMessages;
  const maxTurnsReached = turnCount >= criteria.maxTurns;
  const understandingMet = !criteria.requireUnderstandingDemo || state.userShowedUnderstanding;
  
  const shouldClose = maxTurnsReached || (minTurnsMet && understandingMet && state.sarahOfferedNextSteps);
  const shouldOfferNextSteps = minTurnsMet && understandingMet && !state.sarahOfferedNextSteps;
  
  let guidance = '';
  
  if (shouldClose) {
    guidance = `
WRAP UP THE CONVERSATION:
Use one of your warm closings and keep it brief.
They're ready to move on - express confidence in them!`;
  } else if (shouldOfferNextSteps) {
    guidance = `
TIME TO TRANSITION TO NEXT STEPS:
Acknowledge what they shared, then mention tomorrow's dev environment setup and their first ticket.
Use one of your transition phrases, but make it natural.
Keep it to 2 sentences.`;
  } else if (isFirstResponse) {
    guidance = `
THIS IS YOUR FIRST REPLY:
1. Warmly acknowledge what they shared about the docs (be specific!)
2. Show genuine appreciation for their effort
3. Ask if they have questions OR invite them to share more
Keep it to 2-3 sentences.`;
  } else if (!state.userShowedUnderstanding) {
    guidance = `
ENCOURAGE MORE SHARING:
They haven't shared much yet. Gently prompt them:
- Ask what stood out to them
- Ask about specific sections
- Make it easy to share by offering options
Keep it warm and low-pressure.`;
  } else if (state.userAskedQuestions && !state.sarahAnsweredQuestions) {
    guidance = `
ANSWER THEIR QUESTION:
Give a helpful, concise answer.
After answering, check if they have more questions.`;
  } else {
    guidance = `
CONTINUE THE CONVERSATION:
Acknowledge what they shared specifically.
You can ask a follow-up OR share something interesting about the codebase.
Keep it natural and brief.`;
  }
  
  return guidance;
}

export function analyzeComprehensionState(
  conversationHistory: Array<{ sender: string; message: string }>,
  currentMessage: string
): ComprehensionState {
  const allMessages = conversationHistory.map(m => m.message.toLowerCase()).join(' ');
  const lastUserMessage = currentMessage.toLowerCase();
  
  const understandingIndicators = [
    'the product', 'dashboard', 'merchants', 'payments', 'react', 'frontend',
    'backend', 'database', 'component', 'feature', 'user', 'analytics',
    'i noticed', 'i saw', 'it looks like', 'so basically', 'i understand'
  ];
  
  const questionIndicators = ['?', 'how does', 'what is', 'why do', 'can you explain', 'curious about'];
  
  const nextStepIndicators = [
    'tomorrow', 'dev environment', 'first ticket', 'set up', 'get started',
    'ready to', 'move on', 'next step'
  ];
  
  const userShowedUnderstanding = understandingIndicators.some(ind => 
    allMessages.includes(ind) || lastUserMessage.includes(ind)
  );
  
  const userAskedQuestions = questionIndicators.some(ind =>
    lastUserMessage.includes(ind)
  );
  
  const sarahOfferedNextSteps = conversationHistory.some(m => 
    m.sender !== 'You' && nextStepIndicators.some(ind => m.message.toLowerCase().includes(ind))
  );
  
  return {
    userShowedUnderstanding,
    userAskedQuestions,
    sarahAnsweredQuestions: false,
    sarahOfferedNextSteps
  };
}
