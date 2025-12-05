/**
 * Developer Role Sprint Review Adapter
 * 
 * Focuses on technical demos: code changes, PRs merged, bug fixes, features implemented.
 * Stakeholders include Engineering Manager, Tech Lead, QA Lead, and Product Owner.
 */

import type { RoleReviewConfig } from '../types';

export const developerReviewConfig: RoleReviewConfig = {
  role: 'developer',
  displayName: 'Software Developer',
  description: 'Technical sprint review focusing on code changes, bug fixes, and feature implementations',
  
  baseDemoConfig: {
    format: 'prompted',
    showScript: true,
    showTimer: false,
    allowSkip: false,
    allowNotes: true,
    timePerTicket: 180,
    transitionPrompts: [
      "Great, let's move on to the next item.",
      "Thanks for that walkthrough. What's next?",
      "Good demo. Moving on...",
    ],
    baseScriptSteps: [
      {
        instruction: 'Show the original issue or bug report',
        hint: 'Pull up the ticket description and acceptance criteria',
        timeEstimate: 30,
        required: true,
      },
      {
        instruction: 'Walk through your implementation approach',
        hint: 'Explain the key code changes and why you chose this approach',
        timeEstimate: 60,
        required: true,
      },
      {
        instruction: 'Demonstrate the working solution',
        hint: 'Show the feature or fix in action',
        timeEstimate: 60,
        required: true,
      },
      {
        instruction: 'Highlight edge cases and testing',
        hint: 'Mention any edge cases handled and tests written',
        timeEstimate: 30,
        required: false,
      },
    ],
  },
  
  baseFeedbackConfig: {
    minFeedbackPerStakeholder: 1,
    maxFeedbackPerStakeholder: 2,
    sentimentDistribution: {
      positive: 0.5,
      neutral: 0.2,
      suggestion: 0.25,
      concern: 0.05,
    },
    requireAcknowledgement: true,
    allowResponses: true,
    showSentimentIcons: true,
    baseStakeholders: [
      {
        id: 'eng-manager',
        name: 'David Chen',
        role: 'Engineering Manager',
        personality: 'Supportive but detail-oriented, focuses on code quality and team growth',
        avatarSeed: 'david-chen',
        color: '#4F46E5',
        expertise: ['architecture', 'code quality', 'team processes', 'technical debt'],
        feedbackStyle: 'constructive',
        focusAreas: ['code patterns', 'test coverage', 'maintainability'],
      },
      {
        id: 'tech-lead',
        name: 'Sarah Thompson',
        role: 'Tech Lead',
        personality: 'Technical and thorough, appreciates clean code and good documentation',
        avatarSeed: 'sarah-thompson',
        color: '#059669',
        expertise: ['system design', 'performance', 'best practices', 'mentoring'],
        feedbackStyle: 'direct',
        focusAreas: ['implementation details', 'edge cases', 'performance'],
      },
      {
        id: 'qa-lead',
        name: 'Marcus Rodriguez',
        role: 'QA Lead',
        personality: 'Quality-focused, looks for edge cases and potential issues',
        avatarSeed: 'marcus-rodriguez',
        color: '#DC2626',
        expertise: ['testing', 'quality assurance', 'bug prevention', 'user experience'],
        feedbackStyle: 'constructive',
        focusAreas: ['test coverage', 'regression', 'acceptance criteria'],
      },
      {
        id: 'product-owner',
        name: 'Jennifer Martinez',
        role: 'Product Owner',
        personality: 'User-focused, cares about business value and customer impact',
        avatarSeed: 'jennifer-martinez',
        color: '#7C3AED',
        expertise: ['product strategy', 'user needs', 'business value', 'roadmap'],
        feedbackStyle: 'encouraging',
        focusAreas: ['user impact', 'feature completeness', 'business value'],
      },
    ],
  },
  
  basePrompts: {
    baseSystemPrompt: `You are a stakeholder in a sprint review meeting for a software development team.
You're providing feedback on work completed by a developer during the sprint.
Be professional, constructive, and realistic. Your feedback should help the developer grow.`,
    
    demoIntroPrompt: `Welcome to our sprint review! Today we'll be demoing the work completed this sprint.
Each team member will walk through their completed tickets, showing the original issue and their solution.
Feel free to ask questions and provide feedback as we go.`,
    
    feedbackGenerationPrompt: `Generate realistic stakeholder feedback for the completed work.
Consider:
- The quality of the implementation
- Test coverage and edge cases
- Documentation and code clarity
- Impact on users and the product
- Areas for improvement in future sprints

Provide specific, actionable feedback that references the actual work done.`,
    
    summaryPrompt: `Summarize the sprint review, highlighting:
- Key accomplishments
- Feedback themes
- Action items for next sprint
- Team strengths demonstrated`,
    
    stakeholderPersonalities: {
      'eng-manager': 'Focus on code quality, patterns, and team processes. Be supportive but push for improvement.',
      'tech-lead': 'Focus on technical implementation, performance, and best practices. Be direct and specific.',
      'qa-lead': 'Focus on testing, edge cases, and quality. Point out potential issues constructively.',
      'product-owner': 'Focus on user value, feature completeness, and business impact. Be encouraging.',
    },
  },
  
  baseUIConfig: {
    showProgressBar: true,
    showTicketDetails: true,
    showPointsSummary: true,
    showSprintGoal: true,
    expandFeedbackByDefault: true,
    animateTransitions: true,
    cardStyle: 'detailed',
  },
  
  baseEvaluation: {
    criteria: {
      demoCoverage: 0.3,
      communicationClarity: 0.3,
      stakeholderEngagement: 0.2,
      feedbackReceptiveness: 0.2,
    },
    passingThreshold: 70,
    feedbackOnPerformance: true,
  },
  
  learningObjectives: [
    'Present technical work clearly to non-technical stakeholders',
    'Demonstrate completed features effectively',
    'Receive and acknowledge feedback professionally',
    'Connect technical work to business value',
    'Identify areas for improvement in future sprints',
  ],
};
