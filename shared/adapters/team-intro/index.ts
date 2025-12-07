/**
 * Team Introduction Adapter
 * 
 * Provides role-aware, level-adjusted prompts for team member 1:1 conversations
 * during onboarding. Each team member delivers unique onboarding value while
 * adapting to the user's experience level.
 */

import type { Role, Level } from '../index';
import type { TeamMemberPersona, TeamIntroLevelOverlay, OnboardingTopic } from './types';
import { marcusPersona } from './personas/marcus';
import { priyaPersona } from './personas/priya';
import { alexPersona } from './personas/alex';
import { getLevelOverlay } from './levels';

export * from './types';
export { getLevelOverlay } from './levels';

const PERSONAS: Record<string, TeamMemberPersona> = {
  'Marcus': marcusPersona,
  'Priya': priyaPersona,
  'Alex': alexPersona
};

function normalizeRole(role: string): Role {
  const r = role.toLowerCase();
  if (r.includes('pm') || r.includes('product')) return 'pm';
  if (r.includes('qa') || r.includes('quality')) return 'qa';
  if (r.includes('devops') || r.includes('ops')) return 'devops';
  if (r.includes('data')) return 'data_science';
  return 'developer';
}

function getTopicsForRole(persona: TeamMemberPersona, userRole: Role): OnboardingTopic[] {
  switch (userRole) {
    case 'developer':
      return persona.onboardingTopics.forDeveloper;
    case 'pm':
      return persona.onboardingTopics.forPM;
    case 'qa':
      return persona.onboardingTopics.forQA;
    case 'devops':
      return persona.onboardingTopics.forDevOps;
    default:
      return persona.onboardingTopics.default;
  }
}

export interface TeamIntroPromptConfig {
  persona: TeamMemberPersona;
  levelOverlay: TeamIntroLevelOverlay;
  userRole: Role;
  topics: OnboardingTopic[];
}

export function getTeamIntroConfig(
  memberName: string,
  userRole: string,
  userLevel: string
): TeamIntroPromptConfig {
  const persona = PERSONAS[memberName] || marcusPersona;
  const normalizedRole = normalizeRole(userRole);
  const levelOverlay = getLevelOverlay(userLevel);
  const topics = getTopicsForRole(persona, normalizedRole);
  
  return {
    persona,
    levelOverlay,
    userRole: normalizedRole,
    topics
  };
}

export function buildTeamIntroSystemPrompt(config: TeamIntroPromptConfig): string {
  const { persona, levelOverlay, userRole, topics } = config;
  const requiredTopics = topics.filter(t => t.required);
  const style = levelOverlay.conversationStyle;
  const tone = levelOverlay.toneAdjustments;
  
  let toneGuidance = '';
  if (tone.useSimplifiedLanguage) {
    toneGuidance += 'Use simple, clear language without jargon. ';
  }
  if (tone.offerEncouragement) {
    toneGuidance += 'Be encouraging and welcoming. ';
  }
  if (tone.treatAsPeer) {
    toneGuidance += 'Treat them as a peer with experience. ';
  }
  if (!tone.assumePriorKnowledge) {
    toneGuidance += 'Don\'t assume they know industry-standard practices. ';
  }
  
  const topicList = requiredTopics.map(t => `- ${t.topic}: ${t.description}`).join('\n');
  
  return `You are ${persona.name}, a ${persona.personality} ${persona.role} at NovaPay.

YOUR EXPERTISE: ${persona.expertise.join(', ')}
YOUR COMMUNICATION STYLE: ${persona.communicationStyle}

THE USER: A new ${userRole} at the ${levelOverlay.displayName} level joining the team.

YOUR ROLE-SPECIFIC PERSPECTIVE:
${persona.roleSpecificInsights}

ONBOARDING TOPICS YOU SHOULD SHARE (based on their role as ${userRole}):
${topicList}

CONVERSATION STYLE FOR ${levelOverlay.displayName.toUpperCase()} LEVEL:
- Tone: ${style.tone}
- Depth: ${style.depth}
- Be ${style.proactivity === 'high' ? 'proactive in offering information' : style.proactivity === 'medium' ? 'balanced between answering and offering' : 'responsive to their questions'}
${toneGuidance}

PERSONAL TOUCHES (use naturally, don't force):
${persona.personalTouchPoints.map(p => `- ${p}`).join('\n')}

IMPORTANT BEHAVIORS:
1. Share genuine onboarding value from your ${persona.role} perspective
2. Connect your expertise to their role as a ${userRole}
3. Be conversational but purposeful - this is their introduction to the team
4. ${style.followUpOnBriefResponses ? 'If they give brief responses, offer options or ask targeted follow-ups' : 'Respect their communication style if they\'re brief'}`;
}

export function buildConversationGuidance(
  config: TeamIntroPromptConfig,
  isClosing: boolean,
  topicsCovered: string[],
  userMessageLength: number
): string {
  const { persona, levelOverlay, topics } = config;
  const checklist = levelOverlay.closingChecklist;
  const briefStrategy = levelOverlay.briefResponseStrategy;
  const requiredTopics = topics.filter(t => t.required);
  const uncoveredRequired = requiredTopics.filter(t => !topicsCovered.includes(t.id));
  
  let guidance = '';
  
  if (userMessageLength < 20 && briefStrategy.proactivelyShareInfo) {
    guidance += `\nThe user gave a brief response. ${briefStrategy.offerOptions ? 'Offer them specific options like: "' + briefStrategy.optionPrompts[0] + '"' : ''} ${briefStrategy.askTargetedFollowUp ? 'Ask a targeted follow-up question.' : ''} ${briefStrategy.proactivelyShareInfo ? 'Proactively share something useful from your perspective.' : ''}`;
  }
  
  if (isClosing) {
    const topicsMet = topicsCovered.length >= checklist.mustShareTopics;
    
    if (!topicsMet && uncoveredRequired.length > 0) {
      guidance += `\nBefore wrapping up, briefly mention: ${uncoveredRequired[0].topic}.`;
    }
    
    guidance += `\nCLOSING CHECKLIST:`;
    if (checklist.provideContactMethod) {
      guidance += `\n- Mention how they can reach you`;
    }
    if (checklist.offerNextSteps) {
      guidance += `\n- Suggest a concrete next step or offer`;
    }
    if (checklist.summarizeKeyPoints) {
      guidance += `\n- Briefly recap key points you covered`;
    }
    
    guidance += `\n\nUse one of your natural closing phrases: "${persona.closingPhrases[0]}"`;
    guidance += `\n\nKeep your closing response brief (2-3 sentences max).`;
  }
  
  return guidance;
}

export function getPersona(memberName: string): TeamMemberPersona | undefined {
  return PERSONAS[memberName];
}

export function getAllPersonas(): TeamMemberPersona[] {
  return Object.values(PERSONAS);
}
