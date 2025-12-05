/**
 * Product Manager Role Retrospective Adapter
 * 
 * Focuses on product and process improvements: stakeholder communication,
 * requirement clarity, prioritization, and cross-functional collaboration.
 */

import type { RoleRetroConfig, CardPrompt } from '../types';

const pmGuidedQuestions: CardPrompt[] = [
  {
    category: 'went_well',
    prompt: 'What product outcome are you most proud of this sprint?',
    hint: 'Think about user impact, stakeholder satisfaction, or goals achieved',
    exampleResponse: 'Shipped the CSV export that our enterprise customers requested',
  },
  {
    category: 'went_well',
    prompt: 'How did cross-functional collaboration contribute to success?',
    hint: 'Consider design, engineering, QA, or stakeholder partnerships',
    exampleResponse: 'Early design review prevented major rework later',
  },
  {
    category: 'to_improve',
    prompt: 'What caused scope creep or unclear requirements?',
    hint: 'Think about gaps in user stories, changing priorities, or miscommunication',
    exampleResponse: 'Edge cases discovered late because we skipped user research',
  },
  {
    category: 'to_improve',
    prompt: 'What feedback from stakeholders surprised you?',
    hint: 'Consider sprint review reactions or ongoing conversations',
    exampleResponse: 'Marketing needed features we deprioritized',
  },
  {
    category: 'action_item',
    prompt: 'What process change would improve our next sprint?',
    hint: 'Focus on communication, planning, or decision-making',
    exampleResponse: 'Add a mid-sprint check-in with key stakeholders',
  },
];

export const pmRetroConfig: RoleRetroConfig = {
  role: 'pm',
  displayName: 'Product Manager',
  description: 'Product-focused retrospective emphasizing stakeholder alignment, requirement clarity, and delivery outcomes',
  
  baseFacilitationConfig: {
    showFacilitatorMessages: true,
    autoSuggestCards: true,
    suggestFromSprintData: true,
    guidedQuestions: pmGuidedQuestions,
    maxCardsPerCategory: 10,
    votingEnabled: true,
    anonymousCards: false,
    baseFacilitator: {
      id: 'retro-facilitator-pm',
      name: 'Jordan',
      role: 'Agile Coach',
      personality: 'Strategic thinker focused on outcomes and cross-functional alignment. Helps connect team actions to business results.',
      avatarSeed: 'jordan-facilitator',
      color: '#0891B2',
      facilitationStyle: 'collaborative',
      focusAreas: ['stakeholder alignment', 'requirement clarity', 'delivery outcomes', 'process efficiency'],
    },
  },
  
  basePrompts: {
    baseSystemPrompt: `You are an Agile Coach facilitating a sprint retrospective for a product team.
Your goal is to help the PM reflect on product outcomes, stakeholder relationships, and process improvements.
Focus on: requirement clarity, prioritization decisions, stakeholder communication, and delivery outcomes.
Be strategic and help connect team practices to business results.`,
    
    contextIntroPrompt: `Let's review your sprint from a product perspective:
- Features shipped and their business impact
- Stakeholder feedback received
- Any scope changes or priority shifts
- User metrics and outcomes

Reflect on what drove success and what challenged delivery.`,
    
    reflectionPrompt: `Now gather your thoughts on the product side:
- What product decisions worked well?
- Where did requirements or priorities cause confusion?
- How was stakeholder communication?

Add insights to both columns - celebrate wins AND surface improvements.`,
    
    actionItemsPrompt: `Based on top themes, let's define product process improvements.
Effective action items are:
- Specific to product/PM workflow
- Improve stakeholder or team communication
- Achievable before next sprint planning`,
    
    summaryPrompt: `Excellent retrospective! Key takeaways:
- Product wins to replicate
- Process improvements to implement
- Stakeholder actions committed

Apply these insights to your next sprint!`,
    
    cardSuggestionPrompt: `Consider these product-related topics:
- Stakeholder feedback themes
- Requirement clarity and scope changes
- Prioritization decisions and outcomes
- Cross-functional collaboration patterns`,
    
    facilitatorPersonality: 'Strategic coach who connects daily work to product outcomes and business value',
  },
  
  baseUIConfig: {
    showSprintContext: true,
    showProgressBar: true,
    showCategoryLabels: true,
    showVoteCounts: true,
    showCardAuthors: true,
    expandCardsDefault: true,
    animateTransitions: true,
    celebrationAnimation: true,
    cardStyle: 'detailed',
    layoutMode: 'two_column',
  },
  
  baseActionItemConfig: {
    requireOwner: true,
    suggestFromTopVoted: true,
    maxActionItems: 5,
    showPreviousActions: true,
    categories: ['Requirements', 'Stakeholders', 'Planning', 'Communication', 'Prioritization'],
  },
  
  baseEvaluation: {
    criteria: {
      reflectionDepth: 0.25,
      actionableItems: 0.35,
      participation: 0.15,
      positiveBalance: 0.25,
    },
    passingThreshold: 70,
    showFeedback: true,
  },
  
  focusCategories: ['Requirements', 'Stakeholder Mgmt', 'Prioritization', 'User Research', 'Communication', 'Roadmap'],
  
  learningObjectives: [
    'Reflect on product decisions and outcomes',
    'Analyze stakeholder feedback patterns',
    'Improve requirement clarity processes',
    'Balance stakeholder needs with team capacity',
    'Create actionable product process improvements',
  ],
};
