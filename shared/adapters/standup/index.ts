/**
 * Daily Standup Adapter
 * 
 * Provides role-aware, level-adjusted standup configurations.
 */

import type { Role, Level } from '../index';
import type { StandupAdapter, LevelStandupOverlay, StandupPromptConfig } from './types';
import { STANDUP_PERSONAS, getRespondingPersonas } from './personas';
import { internStandupOverlay } from './levels/intern';
import { juniorStandupOverlay } from './levels/junior';
import { midStandupOverlay } from './levels/mid';
import { seniorStandupOverlay } from './levels/senior';

const LEVEL_OVERLAYS: Record<Level, LevelStandupOverlay> = {
  intern: internStandupOverlay,
  junior: juniorStandupOverlay,
  mid: midStandupOverlay,
  senior: seniorStandupOverlay,
};

function buildStandupPrompts(role: Role, level: Level, overlay: LevelStandupOverlay): StandupPromptConfig {
  const facilitator = STANDUP_PERSONAS.sarah;
  const respondingPersonas = getRespondingPersonas('sarah');
  
  const systemPrompt = `You are simulating a daily standup meeting for a ${role} at the ${overlay.displayName} level.

FACILITATOR: ${facilitator.name} (${facilitator.role}) runs the standup.

RESPONDING TEAM MEMBERS:
${respondingPersonas.map(p => `- ${p.name} (${p.role})`).join('\n')}

${overlay.promptModifiers.guidanceLevel}

${overlay.promptModifiers.toneAdjustment}

RESPONSE FORMAT:
Generate 1-${overlay.feedbackConfig.maxResponses} team member responses based on the user's standup update.
Each response should be from a specific team member and be relevant to what they shared.
${overlay.feedbackConfig.includeActionItems ? 'Include actionable suggestions when appropriate.' : ''}
${overlay.feedbackConfig.includeFollowUpQuestions ? 'Ask follow-up questions to clarify blockers or plans.' : ''}

Keep responses concise (1-3 sentences each). The tone should be ${overlay.feedbackConfig.feedbackTone}.`;

  const feedbackGuidance = `Based on the user's standup update, generate realistic team feedback.

Consider:
- What they worked on yesterday (acknowledge progress)
- What they plan to do today (offer support if relevant)
- Any blockers mentioned (provide help or escalation paths)

The ${overlay.displayName} level expects ${overlay.feedbackConfig.feedbackTone} feedback with ${overlay.scaffoldingLevel} scaffolding.`;

  return {
    systemPrompt,
    feedbackGuidance,
    facilitator,
    respondingPersonas,
  };
}

export function getStandupAdapter(role: Role, level: Level): StandupAdapter {
  const overlay = LEVEL_OVERLAYS[level] || LEVEL_OVERLAYS.intern;
  const prompts = buildStandupPrompts(role, level, overlay);
  
  return {
    metadata: {
      role,
      level,
      displayName: `${overlay.displayName} ${role}`,
      description: `Daily standup configuration for ${overlay.displayName} level ${role}`,
    },
    prompts,
    questions: overlay.questions,
    uiConfig: overlay.uiConfig,
    feedbackConfig: overlay.feedbackConfig,
  };
}

export * from './types';
export * from './personas';
