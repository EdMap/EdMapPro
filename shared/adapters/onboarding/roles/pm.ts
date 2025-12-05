/**
 * PM Role Onboarding Adapter
 * 
 * For Product Managers, environment setup is lighter - they don't need full dev setup.
 * Focus is on understanding the repo structure and running the app to see the product.
 */

import type { RoleOnboardingAdapter, EnvironmentSetupStep } from '../types';

const pmEnvironmentSteps: EnvironmentSetupStep[] = [
  {
    id: 'clone',
    order: 1,
    instruction: 'Clone the repository to view the codebase',
    hint: 'Use git clone with the repository URL',
    validPatterns: [
      /^git\s+clone\s+(https?:\/\/)?github\.com\/novapay\/merchant-dashboard(\.git)?$/i,
      /^git\s+clone\s+git@github\.com:novapay\/merchant-dashboard(\.git)?$/i,
      /^git\s+clone\s+.*novapay\/merchant-dashboard.*$/i
    ],
    successOutput: `Cloning into 'merchant-dashboard'...
remote: Enumerating objects: 1247, done.
remote: Counting objects: 100% (1247/1247), done.
remote: Compressing objects: 100% (892/892), done.
Receiving objects: 100% (1247/1247), 2.34 MiB | 12.5 MiB/s, done.
Resolving deltas: 100% (623/623), done.`,
    failureHint: 'Make sure to include the full repository path',
    competency: 'repository-literacy'
  },
  {
    id: 'cd',
    order: 2,
    instruction: 'Navigate into the project directory',
    hint: 'Use the cd command',
    validPatterns: [
      /^cd\s+merchant-dashboard$/i,
      /^cd\s+\.\/merchant-dashboard$/i
    ],
    successOutput: '',
    failureHint: 'The directory name is merchant-dashboard',
    competency: 'terminal-navigation'
  }
];

export const pmOnboardingAdapter: RoleOnboardingAdapter = {
  role: 'pm',
  displayName: 'Product Manager',
  description: 'Get oriented with the repository and understand the product structure',
  competencies: [
    'repository-literacy',
    'terminal-navigation',
    'product-understanding',
    'stakeholder-communication'
  ],
  
  environmentSetup: {
    project: {
      name: 'merchant-dashboard',
      org: 'novapay',
      repoUrl: 'github.com/novapay/merchant-dashboard',
      description: 'NovaPay Merchant Dashboard - A React-based dashboard for payment management'
    },
    baseSteps: pmEnvironmentSteps,
    terminalHints: [
      { command: 'git clone', description: 'Download a repository from GitHub' },
      { command: 'cd', description: 'Change directory' }
    ],
    completionMessage: {
      title: 'Repository Access Ready!',
      description: 'You can now explore the codebase and understand the product structure.'
    }
  },
  
  uiControls: {
    showHintsPanel: true,
    showProgressIndicator: true,
    showCommandHistory: true,
    terminalHeight: 'compact'
  },
  
  difficulty: {
    errorRecoveryGuidance: true,
    hintDetailLevel: 'full'
  },
  
  evaluation: {
    rubricWeights: {
      commandAccuracy: 0.50,
      completionSpeed: 0.10,
      independentProgress: 0.30,
      errorRecovery: 0.10
    }
  },
  
  learningObjectives: [
    {
      step: 'documents',
      objectives: [
        'Understand the product vision and roadmap',
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
        'Access the repository',
        'Navigate the project structure',
        'Understand how code is organized'
      ],
      tips: [
        'You don\'t need to understand every file',
        'Focus on the overall structure',
        'Know where to find documentation'
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
