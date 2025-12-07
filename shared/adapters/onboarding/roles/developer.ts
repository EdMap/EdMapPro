/**
 * Developer Role Onboarding Adapter
 * 
 * For developers (including QA, DevOps, Data Science), the onboarding includes
 * full git environment setup: clone, install, run, and verify.
 */

import type { RoleOnboardingAdapter, EnvironmentSetupStep, CodebaseMission } from '../types';

const developerCodebaseMissions: CodebaseMission[] = [
  {
    id: 'readme',
    label: 'Find and read the README.md',
    targetFile: 'README.md',
    hint: 'Look in the root of the repository',
    required: true
  },
  {
    id: 'package-json',
    label: 'Locate package.json and identify the dev script',
    targetFile: 'package.json',
    hint: 'Check the "scripts" section',
    required: true
  },
  {
    id: 'entry-point',
    label: 'Find the main entry point of the application',
    targetFile: 'src/main.tsx',
    hint: 'Common locations: src/index.ts, src/main.tsx, or app.ts',
    required: true
  },
  {
    id: 'schema',
    label: 'Explore the database schema or data models',
    targetFile: 'shared/schema.ts',
    hint: 'Look for files named schema, models, or types',
    required: true
  },
  {
    id: 'routes',
    label: 'Identify where API routes are defined',
    targetFile: 'server/routes.ts',
    hint: 'Backend routes are usually in a routes or api folder',
    required: false
  },
  {
    id: 'components',
    label: 'Browse the UI components structure',
    targetFile: 'client/src/components',
    hint: 'Frontend components are typically in a components folder',
    required: false
  }
];

const developerEnvironmentSteps: EnvironmentSetupStep[] = [
  {
    id: 'clone',
    order: 1,
    instruction: 'Clone the repository to your local machine',
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
    failureHint: 'Make sure to include the full repository path: github.com/novapay/merchant-dashboard',
    competency: 'repository-literacy'
  },
  {
    id: 'cd',
    order: 2,
    instruction: 'Navigate into the project directory',
    hint: 'Use the cd command to change directory',
    validPatterns: [
      /^cd\s+merchant-dashboard$/i,
      /^cd\s+\.\/merchant-dashboard$/i
    ],
    successOutput: '',
    failureHint: 'The directory name is merchant-dashboard',
    competency: 'terminal-navigation'
  },
  {
    id: 'install',
    order: 3,
    instruction: 'Install the project dependencies',
    hint: 'This project uses npm as its package manager',
    validPatterns: [
      /^npm\s+install$/i,
      /^npm\s+i$/i
    ],
    successOutput: `added 1423 packages in 8.2s

247 packages are looking for funding
  run \`npm fund\` for details`,
    failureHint: 'Try: npm install',
    competency: 'dependency-management'
  },
  {
    id: 'run',
    order: 4,
    instruction: 'Start the development server',
    hint: 'Check the package.json for available scripts',
    validPatterns: [
      /^npm\s+run\s+dev$/i,
      /^npm\s+start$/i
    ],
    successOutput: `> merchant-dashboard@1.0.0 dev
> vite

  VITE v5.0.0  ready in 342ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose`,
    failureHint: 'Common commands are: npm run dev or npm start',
    competency: 'local-runtime-mastery'
  }
];

export const developerOnboardingAdapter: RoleOnboardingAdapter = {
  role: 'developer',
  displayName: 'Developer',
  description: 'Set up your development environment and get familiar with the codebase',
  competencies: [
    'repository-literacy',
    'terminal-navigation',
    'dependency-management',
    'local-runtime-mastery',
    'git-fundamentals',
    'codebase-navigation'
  ],
  requiresGitTerminal: true,
  
  environmentSetup: {
    project: {
      name: 'merchant-dashboard',
      org: 'novapay',
      repoUrl: 'github.com/novapay/merchant-dashboard',
      description: 'NovaPay Merchant Dashboard - A React-based dashboard for payment management'
    },
    baseSteps: developerEnvironmentSteps,
    terminalHints: [
      { command: 'git clone', description: 'Download a repository from GitHub' },
      { command: 'cd', description: 'Change directory' },
      { command: 'npm install', description: 'Install project dependencies' },
      { command: 'npm run dev', description: 'Start the development server' }
    ],
    completionMessage: {
      title: 'Environment Ready!',
      description: 'Your development environment is set up. You can now start working on tickets.'
    }
  },
  
  codebaseExploration: {
    enabled: true,
    skippable: false,
    estimatedMinutes: 15,
    header: {
      title: 'Explore the Codebase',
      subtitle: 'Before you meet the team, take a few minutes to orient yourself in the repository'
    },
    missions: developerCodebaseMissions,
    highlightedFiles: [
      'README.md',
      'package.json',
      'src/main.tsx',
      'shared/schema.ts',
      'server/routes.ts'
    ],
    reflectionPrompt: 'What did you notice about the project structure? Any questions or observations?',
    reflectionMinLength: 50
  },
  
  uiControls: {
    showHintsPanel: true,
    showProgressIndicator: true,
    showCommandHistory: true,
    terminalHeight: 'standard'
  },
  
  difficulty: {
    errorRecoveryGuidance: true
  },
  
  evaluation: {
    rubricWeights: {
      commandAccuracy: 0.40,
      completionSpeed: 0.15,
      independentProgress: 0.30,
      errorRecovery: 0.15
    }
  },
  
  learningObjectives: [
    {
      step: 'documents',
      objectives: [
        'Understand the product and its users',
        'Learn team norms and communication expectations',
        'Familiarize yourself with the tech stack'
      ],
      tips: [
        'Take notes on key product features',
        'Note the team\'s preferred communication channels',
        'Identify technologies you\'re less familiar with'
      ]
    },
    {
      step: 'environment',
      objectives: [
        'Clone the repository successfully',
        'Install dependencies without errors',
        'Run the application locally',
        'Verify the app is working'
      ],
      tips: [
        'Read error messages carefully',
        'Check your Node.js version if npm install fails',
        'Make sure no other process is using the port'
      ]
    },
    {
      step: 'codebase',
      objectives: [
        'Navigate the project directory structure',
        'Identify key files: README, package.json, entry points',
        'Understand the data model and schema',
        'Locate where API routes are defined'
      ],
      tips: [
        'Start with README.md for project overview',
        'Check package.json scripts to see how to run things',
        'Look for patterns in how folders are organized',
        'Note which technologies and libraries are used'
      ]
    },
    {
      step: 'comprehension',
      objectives: [
        'Demonstrate understanding of the project',
        'Ask clarifying questions about your role',
        'Feel ready to start your first task'
      ],
      tips: [
        'Don\'t be afraid to ask questions',
        'Confirm your understanding of priorities',
        'Know who to reach out to for help'
      ]
    }
  ]
};

export const qaOnboardingAdapter: RoleOnboardingAdapter = {
  ...developerOnboardingAdapter,
  role: 'qa',
  displayName: 'QA Engineer',
  description: 'Set up your testing environment and understand the quality processes',
  competencies: [
    'repository-literacy',
    'terminal-navigation',
    'dependency-management',
    'local-runtime-mastery',
    'codebase-navigation',
    'testing-environment-setup'
  ],
  requiresGitTerminal: true
};

export const devopsOnboardingAdapter: RoleOnboardingAdapter = {
  ...developerOnboardingAdapter,
  role: 'devops',
  displayName: 'DevOps Engineer',
  description: 'Set up your development environment and understand the deployment pipeline',
  competencies: [
    'repository-literacy',
    'terminal-navigation',
    'dependency-management',
    'local-runtime-mastery',
    'codebase-navigation',
    'infrastructure-awareness'
  ],
  requiresGitTerminal: true
};

export const dataScienceOnboardingAdapter: RoleOnboardingAdapter = {
  ...developerOnboardingAdapter,
  role: 'data_science',
  displayName: 'Data Scientist',
  description: 'Set up your development environment and understand the data pipelines',
  competencies: [
    'repository-literacy',
    'terminal-navigation',
    'dependency-management',
    'local-runtime-mastery',
    'codebase-navigation',
    'data-environment-setup'
  ],
  requiresGitTerminal: true
};
