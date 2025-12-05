/**
 * Product Manager Role Sprint Review Adapter
 * 
 * Focuses on product outcomes: features shipped, metrics impact, user feedback.
 * Stakeholders include executives, engineering leads, and customer success.
 */

import type { RoleReviewConfig } from '../types';

export const pmReviewConfig: RoleReviewConfig = {
  role: 'pm',
  displayName: 'Product Manager',
  description: 'Product-focused sprint review emphasizing outcomes, metrics, and stakeholder alignment',
  
  baseDemoConfig: {
    format: 'prompted',
    showScript: true,
    showTimer: true,
    allowSkip: false,
    allowNotes: true,
    timePerTicket: 240,
    transitionPrompts: [
      "Thanks for that overview. Let's look at the next initiative.",
      "Great progress. What else shipped this sprint?",
      "Good update. Moving to the next item...",
    ],
    baseScriptSteps: [
      {
        instruction: 'Present the user problem or opportunity',
        hint: 'Explain the why behind this work - what user need were we addressing?',
        timeEstimate: 45,
        required: true,
      },
      {
        instruction: 'Show the solution and key features',
        hint: 'Demo the shipped feature from a user perspective',
        timeEstimate: 60,
        required: true,
      },
      {
        instruction: 'Share metrics and early results',
        hint: 'Discuss any data, user feedback, or adoption metrics',
        timeEstimate: 45,
        required: true,
      },
      {
        instruction: 'Outline next steps and iterations',
        hint: 'What\'s the plan for future improvements based on learnings?',
        timeEstimate: 30,
        required: false,
      },
    ],
  },
  
  baseFeedbackConfig: {
    minFeedbackPerStakeholder: 1,
    maxFeedbackPerStakeholder: 2,
    sentimentDistribution: {
      positive: 0.4,
      neutral: 0.2,
      suggestion: 0.3,
      concern: 0.1,
    },
    requireAcknowledgement: true,
    allowResponses: true,
    showSentimentIcons: true,
    baseStakeholders: [
      {
        id: 'vp-product',
        name: 'Alexandra Kim',
        role: 'VP of Product',
        personality: 'Strategic thinker, focused on roadmap alignment and business outcomes',
        avatarSeed: 'alexandra-kim',
        color: '#7C3AED',
        expertise: ['product strategy', 'market positioning', 'roadmap planning', 'stakeholder management'],
        feedbackStyle: 'direct',
        focusAreas: ['strategic alignment', 'market fit', 'prioritization'],
      },
      {
        id: 'eng-director',
        name: 'Michael Foster',
        role: 'Director of Engineering',
        personality: 'Technical but business-minded, cares about feasibility and team capacity',
        avatarSeed: 'michael-foster',
        color: '#059669',
        expertise: ['technical feasibility', 'resource planning', 'engineering culture', 'delivery'],
        feedbackStyle: 'constructive',
        focusAreas: ['scope management', 'technical debt', 'team velocity'],
      },
      {
        id: 'customer-success',
        name: 'Rachel Green',
        role: 'Customer Success Manager',
        personality: 'Customer advocate, brings real user feedback and pain points',
        avatarSeed: 'rachel-green',
        color: '#DC2626',
        expertise: ['customer feedback', 'user adoption', 'support trends', 'churn analysis'],
        feedbackStyle: 'encouraging',
        focusAreas: ['user adoption', 'customer feedback', 'support impact'],
      },
      {
        id: 'design-lead',
        name: 'James Wilson',
        role: 'Design Lead',
        personality: 'User-centric, focused on experience quality and design consistency',
        avatarSeed: 'james-wilson',
        color: '#F59E0B',
        expertise: ['user experience', 'design systems', 'usability', 'accessibility'],
        feedbackStyle: 'constructive',
        focusAreas: ['user experience', 'design quality', 'accessibility'],
      },
    ],
  },
  
  basePrompts: {
    baseSystemPrompt: `You are a stakeholder in a sprint review meeting led by a Product Manager.
You're providing feedback on product initiatives and features shipped during the sprint.
Be professional and strategic. Focus on business outcomes, user impact, and roadmap alignment.`,
    
    demoIntroPrompt: `Welcome to our sprint review! Today we'll be reviewing the product initiatives completed this sprint.
We'll discuss the user problems addressed, solutions shipped, and early results.
Your feedback on strategic alignment and next steps is valuable.`,
    
    feedbackGenerationPrompt: `Generate realistic stakeholder feedback for the completed product work.
Consider:
- Strategic alignment with product roadmap
- User impact and adoption potential
- Quality of execution and user experience
- Data and metrics to support decisions
- Opportunities for iteration

Provide feedback from a business and product perspective.`,
    
    summaryPrompt: `Summarize the sprint review, highlighting:
- Key product outcomes
- User impact and metrics
- Strategic alignment
- Decisions and next steps`,
    
    stakeholderPersonalities: {
      'vp-product': 'Focus on strategic alignment and business outcomes. Push for clarity on roadmap impact.',
      'eng-director': 'Focus on execution quality and feasibility. Balance ambition with capacity.',
      'customer-success': 'Advocate for users. Share real customer feedback and adoption concerns.',
      'design-lead': 'Focus on user experience quality. Push for consistency and accessibility.',
    },
  },
  
  baseUIConfig: {
    showProgressBar: true,
    showTicketDetails: true,
    showPointsSummary: false,
    showSprintGoal: true,
    expandFeedbackByDefault: true,
    animateTransitions: true,
    cardStyle: 'presentation',
  },
  
  baseEvaluation: {
    criteria: {
      demoCoverage: 0.25,
      communicationClarity: 0.35,
      stakeholderEngagement: 0.25,
      feedbackReceptiveness: 0.15,
    },
    passingThreshold: 70,
    feedbackOnPerformance: true,
  },
  
  learningObjectives: [
    'Present product outcomes to executive stakeholders',
    'Connect features to user problems and business value',
    'Use data and metrics to support product decisions',
    'Gather and synthesize stakeholder feedback',
    'Align sprint work with strategic roadmap',
  ],
};
