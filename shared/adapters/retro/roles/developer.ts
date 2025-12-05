/**
 * Developer Role Retrospective Adapter
 * 
 * Focuses on technical improvements: code quality, PR process, technical debt,
 * tooling, and development practices.
 */

import type { RoleRetroConfig, CardPrompt } from '../types';

const developerGuidedQuestions: CardPrompt[] = [
  {
    category: 'went_well',
    prompt: 'What technical decision or implementation are you most proud of?',
    hint: 'Think about code quality, architecture choices, or clever solutions',
    exampleResponse: 'The new caching layer reduced API response times by 40%',
  },
  {
    category: 'went_well',
    prompt: 'How did the team collaboration help you this sprint?',
    hint: 'Consider pair programming, code reviews, or knowledge sharing',
    exampleResponse: 'Quick PR reviews helped us ship features faster',
  },
  {
    category: 'to_improve',
    prompt: 'What slowed you down or caused frustration?',
    hint: 'Think about blockers, unclear requirements, or technical debt',
    exampleResponse: 'Flaky tests made CI unreliable and blocked merges',
  },
  {
    category: 'to_improve',
    prompt: 'What would you do differently next time?',
    hint: 'Consider process, communication, or technical approaches',
    exampleResponse: 'Start with a spike ticket before jumping into complex features',
  },
  {
    category: 'action_item',
    prompt: 'What concrete improvement can we commit to for next sprint?',
    hint: 'Make it specific and achievable within one sprint',
    exampleResponse: 'Add pre-commit hooks to catch linting issues before PR',
  },
];

export const developerRetroConfig: RoleRetroConfig = {
  role: 'developer',
  displayName: 'Software Developer',
  description: 'Technical retrospective focusing on code quality, development practices, and team collaboration',
  
  baseFacilitationConfig: {
    showFacilitatorMessages: true,
    autoSuggestCards: true,
    suggestFromSprintData: true,
    guidedQuestions: developerGuidedQuestions,
    maxCardsPerCategory: 10,
    votingEnabled: true,
    anonymousCards: false,
    baseFacilitator: {
      id: 'retro-facilitator',
      name: 'Alex',
      role: 'Scrum Master',
      personality: 'Encouraging and focused on continuous improvement. Asks thoughtful questions to dig deeper into issues.',
      avatarSeed: 'alex-facilitator',
      color: '#8B5CF6',
      facilitationStyle: 'collaborative',
      focusAreas: ['code quality', 'team dynamics', 'process efficiency', 'technical growth'],
    },
  },
  
  basePrompts: {
    baseSystemPrompt: `You are a Scrum Master facilitating a sprint retrospective for a software development team.
Your goal is to help the team reflect on their sprint, celebrate successes, and identify actionable improvements.
Focus on technical aspects: code quality, development practices, PR process, and team collaboration.
Be encouraging but push for specific, actionable insights.`,
    
    contextIntroPrompt: `Let's start by reviewing what happened this sprint. Here's a summary of your work:
- Completed tickets and their outcomes
- Any blockers you encountered
- PR review feedback patterns
- Stakeholder reactions

Take a moment to reflect on these before we begin.`,
    
    reflectionPrompt: `Now let's gather your thoughts. Think about:
- What technical decisions worked well?
- Where did you face challenges?
- How was the team collaboration?

Add cards to both columns - we want to celebrate wins AND identify improvements.`,
    
    actionItemsPrompt: `Based on the top-voted items, let's define concrete actions.
Good action items are:
- Specific and measurable
- Owned by someone
- Achievable within the next sprint`,
    
    summaryPrompt: `Great retrospective! Here's what we learned:
- Key wins to continue
- Improvements to focus on
- Action items committed

Carry these forward into your next sprint!`,
    
    cardSuggestionPrompt: `Based on the sprint data, here are some topics to consider:
- PR review cycles and feedback patterns
- Blockers and how they were resolved
- Completed work and what enabled success`,
    
    facilitatorPersonality: 'Supportive technical leader who values continuous improvement and team growth',
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
    categories: ['Process', 'Technical', 'Communication', 'Tools', 'Learning'],
  },
  
  baseEvaluation: {
    criteria: {
      reflectionDepth: 0.3,
      actionableItems: 0.3,
      participation: 0.2,
      positiveBalance: 0.2,
    },
    passingThreshold: 70,
    showFeedback: true,
  },
  
  focusCategories: ['Code Quality', 'PR Process', 'Technical Debt', 'Testing', 'Documentation', 'Tooling'],
  
  learningObjectives: [
    'Reflect constructively on technical decisions',
    'Identify patterns in code review feedback',
    'Create actionable improvement plans',
    'Balance celebration with critique',
    'Connect team practices to delivery outcomes',
  ],
};
