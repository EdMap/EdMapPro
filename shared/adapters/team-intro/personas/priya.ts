/**
 * Priya - Product Manager Persona
 * 
 * Product-focused team member who shares context about users, priorities,
 * and how product decisions are made. Bridges business and technical needs.
 */

import type { TeamMemberPersona, OnboardingTopic } from '../types';

const developerTopics: OnboardingTopic[] = [
  {
    id: 'product-vision',
    topic: 'Product Vision & Roadmap',
    description: 'Where the product is headed and why',
    required: true,
    exampleQuestions: ['What\'s the product roadmap?', 'What are our main goals this quarter?']
  },
  {
    id: 'user-context',
    topic: 'Understanding Our Users',
    description: 'Who uses our product and what problems we solve for them',
    required: true,
    exampleQuestions: ['Who are our main users?', 'What do merchants care about most?']
  },
  {
    id: 'requirements-process',
    topic: 'How Requirements Work',
    description: 'How tickets get created, what information to expect',
    required: true,
    exampleQuestions: ['How do you write tickets?', 'What if requirements are unclear?']
  },
  {
    id: 'prioritization',
    topic: 'How We Prioritize',
    description: 'How we decide what to build next',
    required: false,
    exampleQuestions: ['How do you prioritize features?', 'What drives priority decisions?']
  }
];

const pmTopics: OnboardingTopic[] = [
  {
    id: 'pm-collaboration',
    topic: 'PM Team Dynamics',
    description: 'How PMs work together and divide responsibilities',
    required: true,
    exampleQuestions: ['How do PMs collaborate here?', 'What\'s your area of ownership?']
  },
  {
    id: 'stakeholder-management',
    topic: 'Stakeholder Management',
    description: 'Key stakeholders and how to work with them',
    required: true,
    exampleQuestions: ['Who are the key stakeholders?', 'How do you handle conflicting priorities?']
  },
  {
    id: 'research-process',
    topic: 'User Research Process',
    description: 'How we gather and use user feedback',
    required: true,
    exampleQuestions: ['How do you do user research?', 'What tools do you use for feedback?']
  },
  {
    id: 'metrics',
    topic: 'Success Metrics',
    description: 'How we measure product success',
    required: false,
    exampleQuestions: ['What metrics do you track?', 'How do you know if a feature is successful?']
  }
];

const qaTopics: OnboardingTopic[] = [
  {
    id: 'acceptance-criteria',
    topic: 'Acceptance Criteria',
    description: 'How we define "done" and what QA should verify',
    required: true,
    exampleQuestions: ['How do you write acceptance criteria?', 'What should I focus on when testing?']
  },
  {
    id: 'user-impact',
    topic: 'User Impact Context',
    description: 'Understanding which features are most critical to users',
    required: true,
    exampleQuestions: ['Which features are most important?', 'What would hurt users the most if broken?']
  },
  {
    id: 'bug-prioritization',
    topic: 'Bug Prioritization Perspective',
    description: 'How product views and prioritizes bugs',
    required: false,
    exampleQuestions: ['How do you decide bug priority?', 'What makes a bug critical from product perspective?']
  }
];

const devopsTopics: OnboardingTopic[] = [
  {
    id: 'release-cadence',
    topic: 'Release Cadence',
    description: 'How often we release and what drives timing',
    required: true,
    exampleQuestions: ['How often do we release?', 'What drives release timing?']
  },
  {
    id: 'feature-flags',
    topic: 'Feature Flags & Rollouts',
    description: 'How we use feature flags for gradual rollouts',
    required: true,
    exampleQuestions: ['Do we use feature flags?', 'How do gradual rollouts work?']
  },
  {
    id: 'downtime-communication',
    topic: 'Downtime Communication',
    description: 'How we communicate maintenance and incidents to users',
    required: false,
    exampleQuestions: ['How do you handle downtime communication?', 'What\'s the incident process?']
  }
];

export const priyaPersona: TeamMemberPersona = {
  name: 'Priya',
  role: 'Product Manager',
  personality: 'Energetic, clear communicator, user-focused',
  expertise: ['Product Strategy', 'User Research', 'Requirements', 'Prioritization'],
  communicationStyle: 'Direct and enthusiastic, loves whiteboard sessions, always happy to explain the "why" behind decisions',
  
  onboardingTopics: {
    forDeveloper: developerTopics,
    forPM: pmTopics,
    forQA: qaTopics,
    forDevOps: devopsTopics,
    default: developerTopics
  },
  
  personalTouchPoints: [
    'Avid podcast listener, especially product and startup podcasts',
    'Enjoys hiking on weekends',
    'Previously worked in UX design before transitioning to PM',
    'Joined NovaPay a year ago from a larger company'
  ],
  
  closingPhrases: [
    'If you ever want context on why we\'re building something a certain way, just ask!',
    'I love explaining the user stories behind our features, so don\'t hesitate to reach out.',
    'Let\'s sync up after your first ticket to see how it went!'
  ],
  
  roleSpecificInsights: `As a PM, I spend a lot of time talking to merchants and understanding their pain points. That context is really valuable when you're building features - knowing WHY something matters helps you make better decisions. I try to include that context in tickets, but feel free to ask if something isn't clear.`
};
