/**
 * PM Role Onboarding Adapter
 * 
 * For Product Managers, there's no git terminal setup. Instead, they focus on
 * reviewing product documentation: PRDs, roadmaps, user research, and team processes.
 */

import type { RoleOnboardingAdapter } from '../types';

export const pmOnboardingAdapter: RoleOnboardingAdapter = {
  role: 'pm',
  displayName: 'Product Manager',
  description: 'Review product documentation and understand team processes',
  competencies: [
    'product-understanding',
    'stakeholder-communication',
    'requirements-analysis',
    'roadmap-literacy',
    'user-empathy'
  ],
  requiresGitTerminal: false,
  
  environmentSetup: {
    project: {
      name: 'merchant-dashboard',
      org: 'novapay',
      repoUrl: 'github.com/novapay/merchant-dashboard',
      description: 'NovaPay Merchant Dashboard - A React-based dashboard for payment management'
    },
    baseSteps: [],
    terminalHints: [],
    completionMessage: {
      title: 'Documentation Review Complete!',
      description: 'You\'re now familiar with the product and ready to participate in planning.'
    }
  },
  
  uiControls: {
    showHintsPanel: false,
    showProgressIndicator: true,
    showCommandHistory: false,
    terminalHeight: 'compact'
  },
  
  difficulty: {
    errorRecoveryGuidance: true,
    hintDetailLevel: 'full'
  },
  
  evaluation: {
    rubricWeights: {
      commandAccuracy: 0,
      completionSpeed: 0.20,
      independentProgress: 0.40,
      errorRecovery: 0.40
    }
  },
  
  learningObjectives: [
    {
      step: 'documents',
      objectives: [
        'Understand the product vision and roadmap',
        'Review the PRD for current features',
        'Learn team norms and communication expectations',
        'Identify key stakeholders and their needs'
      ],
      tips: [
        'Focus on the user personas and their pain points',
        'Understand the product metrics being tracked',
        'Note the team\'s sprint and planning processes'
      ]
    },
    {
      step: 'environment',
      objectives: [
        'Review product documentation structure',
        'Understand how specs are organized',
        'Familiarize yourself with the roadmap'
      ],
      tips: [
        'You don\'t need technical environment setup',
        'Focus on understanding product context',
        'Know where to find key documents'
      ]
    },
    {
      step: 'comprehension',
      objectives: [
        'Demonstrate understanding of the product',
        'Clarify team expectations for your role',
        'Feel ready to participate in planning'
      ],
      tips: [
        'Ask about prioritization criteria',
        'Understand the team\'s velocity',
        'Know the release process'
      ]
    }
  ]
};
