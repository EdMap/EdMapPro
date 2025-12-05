/**
 * Developer Role Planning Adapter
 * 
 * For developers (including QA, DevOps, Data Science), the user participates
 * in planning led by the AI PM (Priya). Focus is on understanding priorities,
 * contributing to estimation, and committing to realistic scope.
 */

import type { RolePlanningAdapter, PlanningPhase } from '../types';

export const developerPlanningAdapter: RolePlanningAdapter = {
  role: 'developer',
  displayName: 'Developer',
  description: 'Participate in sprint planning led by the PM, contribute to estimation and scope discussions',
  competencies: [
    'sprint-planning-participation',
    'estimation',
    'scope-negotiation',
    'team-collaboration',
    'priority-understanding'
  ],
  
  prompts: {
    baseSystemPrompt: `You are a team member in a sprint planning meeting for a development team.
The user is a developer participating in the planning session.

CRITICAL RESPONSE RULES:
- You are responding as ONE specific persona only (you will be told which one)
- Write in first-person as that persona
- NEVER include other team members' dialogue in your response
- NEVER use stage directions like "(nods)", "(thinking)", or narrator descriptions
- NEVER prefix your message with your name or role - the UI already shows this
- Keep responses conversational and natural, 2-4 sentences max
- Only include what YOUR persona would say, not what others would say`,
    
    contextPhasePrompt: `Present the sprint priorities to the developer. Explain:
- What the top priority items are and WHY they matter (business context)
- Any dependencies or blockers to be aware of

Be conversational and welcoming. Invite questions about the priorities.
Keep your response to 2-4 sentences max. Respond only as yourself.`,
    
    discussionPhasePrompt: `Respond to the developer's input about the backlog items.
- Acknowledge their perspective on estimation or concerns
- Share YOUR technical perspective as this persona
- Address any questions about requirements or technical approach

Keep your response to 2-4 sentences. Only speak as yourself - other team members will respond separately.`,
    
    commitmentPhasePrompt: `Wrap up your part of the planning discussion:
- React to the agreed scope
- Confirm understanding of the sprint goal
- Share any final thoughts or concerns

Be encouraging. Keep your response to 2-4 sentences. Only speak as yourself.`,
    
    personas: [
      {
        name: 'Priya',
        role: 'Product Manager',
        personality: 'Energetic, clear communicator, always explains the "why"',
        avatarSeed: 'priya-product-mgr',
        color: 'bg-purple-500'
      },
      {
        name: 'Marcus',
        role: 'Senior Developer',
        personality: 'Detail-oriented, raises technical concerns, helpful',
        avatarSeed: 'marcus-senior-dev',
        color: 'bg-green-500'
      },
      {
        name: 'Alex',
        role: 'QA Engineer',
        personality: 'Thorough, asks about edge cases and test coverage',
        avatarSeed: 'alex-qa-engineer',
        color: 'bg-orange-500'
      }
    ],
    facilitator: 'ai'
  },
  
  uiControls: {
    showPriorityEditor: false,
    showEstimationSliders: true,
    showCapacityIndicator: true,
    showMeetingTimer: true
  },
  
  difficulty: {
    estimationAccuracy: 'assisted'
  },
  
  evaluation: {
    rubricWeights: {
      participation: 0.25,
      understanding: 0.30,
      collaboration: 0.20,
      goalClarity: 0.15,
      scopeRealism: 0.10
    }
  },
  
  learningObjectives: [
    {
      phase: 'context',
      objectives: [
        'Understand why certain items are prioritized',
        'Recognize the business context behind technical work'
      ],
      tips: [
        'Ask "why" questions to understand priorities',
        'Connect technical work to user/business value'
      ]
    },
    {
      phase: 'discussion',
      objectives: [
        'Contribute to effort estimation discussions',
        'Raise concerns about scope or complexity',
        'Collaborate with teammates on planning'
      ],
      tips: [
        'Share your perspective on effort honestly',
        'Mention any risks or dependencies you see',
        'Listen to senior team members\' input'
      ]
    },
    {
      phase: 'commitment',
      objectives: [
        'Understand the sprint goal',
        'Know what you\'re committing to',
        'Feel confident about the scope'
      ],
      tips: [
        'Make sure you understand what success looks like',
        'Don\'t commit to more than you can deliver',
        'Ask questions before committing, not after'
      ]
    }
  ],
  
  commitmentGuidance: {
    mode: 'autoSet',
    suggestedGoal: 'Improve payment reliability and fix user-facing timezone issues'
  }
};

export const qaPlanningAdapter: RolePlanningAdapter = {
  ...developerPlanningAdapter,
  role: 'qa',
  displayName: 'QA Engineer',
  description: 'Participate in sprint planning with focus on test planning and quality considerations',
  competencies: [
    'sprint-planning-participation',
    'test-estimation',
    'quality-advocacy',
    'risk-identification',
    'team-collaboration'
  ],
  learningObjectives: [
    {
      phase: 'context',
      objectives: [
        'Identify testing implications of prioritized items',
        'Understand acceptance criteria needs'
      ],
      tips: [
        'Think about how each item will be tested',
        'Consider edge cases and quality risks'
      ]
    },
    {
      phase: 'discussion',
      objectives: [
        'Raise quality and testing concerns',
        'Contribute test effort estimates',
        'Identify items needing clarification'
      ],
      tips: [
        'Ask about acceptance criteria upfront',
        'Factor in regression testing time',
        'Highlight items with high quality risk'
      ]
    },
    {
      phase: 'commitment',
      objectives: [
        'Understand the testing scope',
        'Commit to achievable test coverage',
        'Align with development timeline'
      ],
      tips: [
        'Ensure test time is included in estimates',
        'Know which items need the most testing focus',
        'Plan for test automation where appropriate'
      ]
    }
  ]
};

export const devopsPlanningAdapter: RolePlanningAdapter = {
  ...developerPlanningAdapter,
  role: 'devops',
  displayName: 'DevOps Engineer',
  description: 'Participate in sprint planning with focus on infrastructure and deployment needs',
  competencies: [
    'sprint-planning-participation',
    'infrastructure-planning',
    'deployment-awareness',
    'reliability-advocacy',
    'team-collaboration'
  ]
};

export const dataSciencePlanningAdapter: RolePlanningAdapter = {
  ...developerPlanningAdapter,
  role: 'data_science',
  displayName: 'Data Scientist',
  description: 'Participate in sprint planning with focus on data and analytics work',
  competencies: [
    'sprint-planning-participation',
    'experiment-planning',
    'data-requirements',
    'analysis-scoping',
    'team-collaboration'
  ]
};
