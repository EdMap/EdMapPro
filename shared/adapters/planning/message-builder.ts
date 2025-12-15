/**
 * Dynamic Phase Transition Message Builder
 * 
 * Generates context-aware planning messages based on actual sprint backlog items.
 * Replaces placeholder tokens in templates with real backlog data.
 */

import type { AutoStartStep, BacklogItem, PlanningPhase } from './types';

export interface BacklogSummary {
  totalItems: number;
  bugs: BacklogItem[];
  features: BacklogItem[];
  improvements: BacklogItem[];
  highPriority: BacklogItem[];
  topItemsDescription: string;
  bugsSummary: string;
  featuresSummary: string;
}

export interface InterpolationContext {
  userName?: string;
  userRole?: string;
  sprintNumber?: number;
}

/**
 * Summarize backlog items into a structured format for message generation
 */
export function summarizeBacklog(items: BacklogItem[]): BacklogSummary {
  const bugs = items.filter(i => i.type === 'bug');
  const features = items.filter(i => i.type === 'feature');
  const improvements = items.filter(i => i.type === 'improvement');
  const highPriority = items.filter(i => i.priority === 'high');

  // Create readable descriptions
  const topItems = items.slice(0, 3);
  const topItemsDescription = topItems.length > 0
    ? topItems.map(i => `- ${i.title}`).join('\n')
    : '- No items in backlog';

  const bugsSummary = bugs.length > 0
    ? bugs.slice(0, 2).map(b => b.title).join(' and ')
    : 'no bugs';

  const featuresSummary = features.length > 0
    ? features.slice(0, 2).map(f => f.title).join(' and ')
    : 'no new features';

  return {
    totalItems: items.length,
    bugs,
    features,
    improvements,
    highPriority,
    topItemsDescription,
    bugsSummary,
    featuresSummary
  };
}

/**
 * Replace placeholder tokens in a message with actual backlog data
 */
export function interpolateMessage(
  message: string,
  summary: BacklogSummary,
  userName: string = 'team member',
  userRole: string = 'Developer'
): string {
  return message
    .replace(/\{\{userName\}\}/g, userName)
    .replace(/\{\{userRole\}\}/g, userRole)
    .replace(/\{\{backlogSummary\}\}/g, summary.topItemsDescription)
    .replace(/\{\{bugsSummary\}\}/g, summary.bugsSummary)
    .replace(/\{\{featuresSummary\}\}/g, summary.featuresSummary)
    .replace(/\{\{totalItems\}\}/g, summary.totalItems.toString())
    .replace(/\{\{bugCount\}\}/g, summary.bugs.length.toString())
    .replace(/\{\{featureCount\}\}/g, summary.features.length.toString());
}

/**
 * Build phase transition messages with dynamic backlog content
 */
export function buildPhaseTransitionMessages(
  templateSteps: AutoStartStep[],
  backlogItems: BacklogItem[],
  userName: string = 'team member',
  userRole: string = 'Developer'
): AutoStartStep[] {
  const summary = summarizeBacklog(backlogItems);

  return templateSteps.map(step => ({
    ...step,
    message: interpolateMessage(step.message, summary, userName, userRole)
  }));
}

/**
 * Build auto-start sequence messages with dynamic backlog content
 */
export function buildAutoStartMessages(
  templateSteps: AutoStartStep[],
  backlogItems: BacklogItem[],
  userName: string = 'team member',
  userRole: string = 'Developer'
): AutoStartStep[] {
  return buildPhaseTransitionMessages(templateSteps, backlogItems, userName, userRole);
}

/**
 * Get phase transition steps for a specific phase from the engagement config
 */
export function getPhaseTransitionSteps(
  phaseTransitionSequences: Array<{ phase: PlanningPhase; steps: AutoStartStep[] }> | undefined,
  phase: PlanningPhase
): AutoStartStep[] {
  if (!phaseTransitionSequences) return [];
  const sequence = phaseTransitionSequences.find(s => s.phase === phase);
  return sequence?.steps || [];
}
