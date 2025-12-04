/**
 * Product Manager Role Planning Adapter
 * 
 * For PMs, the user leads/facilitates the planning session.
 * AI dev team responds with concerns, questions, and estimates.
 * Focus is on communication, prioritization defense, and team alignment.
 */

import type { RolePlanningAdapter } from '../types';

export const pmPlanningAdapter: RolePlanningAdapter = {
  role: 'pm',
  displayName: 'Product Manager',
  description: 'Lead sprint planning, present priorities to the team, and facilitate scope agreement',
  competencies: [
    'sprint-facilitation',
    'priority-communication',
    'stakeholder-management',
    'scope-negotiation',
    'team-alignment'
  ],
  
  prompts: {
    baseSystemPrompt: `You are participating in a sprint planning meeting as a development team member.
The user is the Product Manager who is leading this planning session.
Your role is to respond realistically as developers would - asking clarifying questions, 
raising concerns about scope/complexity, and providing estimation input.`,
    
    contextPhasePrompt: `The PM is presenting the sprint priorities. As a team member:
- Ask clarifying questions about requirements or user impact
- Seek to understand the business reasoning
- Express initial reactions to the proposed priorities

Respond naturally as a developer receiving this information.
Keep responses to 2-3 sentences.`,
    
    discussionPhasePrompt: `Engage in discussion with the PM about the proposed items:
- Raise technical concerns or complexity issues
- Ask about dependencies and blockers
- Provide estimation input (story points)
- Negotiate scope if items seem too ambitious

Be professional but realistic - push back gently when scope seems unrealistic.
Different team members should have different perspectives.`,
    
    commitmentPhasePrompt: `The PM is wrapping up planning. As the team:
- Confirm understanding of the sprint goal
- Express commitment (or concerns) about the scope
- Ask any final clarifying questions
- Acknowledge readiness to begin the sprint

Be supportive but ensure the commitment is realistic.`,
    
    personas: [
      {
        name: 'Marcus',
        role: 'Senior Developer',
        personality: 'Detail-oriented, often raises technical concerns, but supportive',
        avatarSeed: 'marcus-senior-dev',
        color: 'bg-green-500'
      },
      {
        name: 'Sarah',
        role: 'Tech Lead',
        personality: 'Big-picture thinker, balances technical and business needs',
        avatarSeed: 'sarah-tech-lead',
        color: 'bg-blue-500'
      },
      {
        name: 'Alex',
        role: 'QA Engineer',
        personality: 'Quality-focused, asks about test coverage and edge cases',
        avatarSeed: 'alex-qa-engineer',
        color: 'bg-orange-500'
      }
    ],
    facilitator: 'user'
  },
  
  uiControls: {
    showPriorityEditor: true,
    showEstimationSliders: false,
    showCapacityIndicator: true,
    showMeetingTimer: true
  },
  
  difficulty: {
    estimationAccuracy: 'independent'
  },
  
  evaluation: {
    rubricWeights: {
      participation: 0.15,
      understanding: 0.15,
      collaboration: 0.25,
      goalClarity: 0.25,
      scopeRealism: 0.20
    }
  },
  
  learningObjectives: [
    {
      phase: 'context',
      objectives: [
        'Clearly communicate sprint priorities',
        'Explain business context and user value',
        'Set the tone for a productive discussion'
      ],
      tips: [
        'Start with the "why" before the "what"',
        'Be prepared to answer questions about priorities',
        'Keep the opening concise but informative'
      ]
    },
    {
      phase: 'discussion',
      objectives: [
        'Facilitate healthy team debate',
        'Address technical concerns constructively',
        'Guide toward realistic scope'
      ],
      tips: [
        'Listen to technical concerns seriously',
        'Be willing to adjust scope if needed',
        'Keep the discussion focused and productive'
      ]
    },
    {
      phase: 'commitment',
      objectives: [
        'Articulate a clear sprint goal',
        'Ensure team alignment and buy-in',
        'Confirm realistic commitment'
      ],
      tips: [
        'The sprint goal should be outcome-focused',
        'Make sure everyone is on the same page',
        'Leave room for questions before committing'
      ]
    }
  ]
};
