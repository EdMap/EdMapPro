/**
 * Developer Role Execution Adapter
 * 
 * For developers (including QA, DevOps, Data Science), execution focuses on
 * full git workflow, code implementation, and PR review response.
 */

import type { RoleExecutionAdapter, GitCommand } from '../types';

const developerGitCommands: GitCommand[] = [
  {
    id: 'branch',
    order: 1,
    instruction: 'Create a feature branch for this ticket',
    hint: 'Use git checkout -b with a descriptive branch name',
    validPatterns: [
      /^git\s+checkout\s+-b\s+\S+$/i,
      /^git\s+switch\s+-c\s+\S+$/i,
    ],
    successOutput: (ticketId: string) => `Switched to a new branch 'feature/${ticketId.toLowerCase()}-fix'`,
    failureHint: 'Try: git checkout -b feature/TICK-001-description',
    competency: 'git-branching',
  },
  {
    id: 'add',
    order: 2,
    instruction: 'Stage your changes for commit',
    hint: 'Use git add to stage files',
    validPatterns: [
      /^git\s+add\s+\.$/i,
      /^git\s+add\s+-A$/i,
      /^git\s+add\s+--all$/i,
      /^git\s+add\s+\S+/i,
    ],
    successOutput: '',
    failureHint: 'Try: git add . (to stage all changes)',
    competency: 'git-staging',
    requiresPreviousStep: 'branch',
  },
  {
    id: 'commit',
    order: 3,
    instruction: 'Commit your changes with a descriptive message',
    hint: 'Use conventional commit format: type(scope): description',
    validPatterns: [
      /^git\s+commit\s+-m\s+["']?.+["']?$/i,
    ],
    successOutput: (ticketId: string) => `[feature/${ticketId.toLowerCase()}-fix abc1234] Your commit message
 2 files changed, 45 insertions(+), 12 deletions(-)`,
    failureHint: 'Try: git commit -m "fix(timezone): convert timestamps to local timezone"',
    competency: 'git-commits',
    requiresPreviousStep: 'add',
  },
  {
    id: 'push',
    order: 4,
    instruction: 'Push your branch to the remote repository',
    hint: 'Push to origin with your branch name',
    validPatterns: [
      /^git\s+push\s+(-u\s+)?origin\s+\S+$/i,
      /^git\s+push\s+--set-upstream\s+origin\s+\S+$/i,
      /^git\s+push$/i,
    ],
    successOutput: (ticketId: string) => `Enumerating objects: 8, done.
Counting objects: 100% (8/8), done.
Delta compression using up to 8 threads
Compressing objects: 100% (4/4), done.
Writing objects: 100% (5/5), 1.23 KiB | 1.23 MiB/s, done.
Total 5 (delta 2), reused 0 (delta 0)
remote: Resolving deltas: 100% (2/2), completed with 2 local objects.
To github.com:novapay/merchant-dashboard.git
 * [new branch]      feature/${ticketId.toLowerCase()}-fix -> feature/${ticketId.toLowerCase()}-fix
Branch 'feature/${ticketId.toLowerCase()}-fix' set up to track remote branch 'feature/${ticketId.toLowerCase()}-fix' from 'origin'.`,
    failureHint: 'Try: git push -u origin feature/TICK-001-fix',
    competency: 'git-remote',
    requiresPreviousStep: 'commit',
  },
  {
    id: 'pr',
    order: 5,
    instruction: 'Create a pull request for code review',
    hint: 'Use GitHub CLI or the button to open a PR',
    validPatterns: [
      /^gh\s+pr\s+create/i,
      /^git\s+request-pull/i,
    ],
    successOutput: `Creating pull request for feature/tick-001-fix into main

? Title Fix timezone display in transaction history
? Body <Received>

https://github.com/novapay/merchant-dashboard/pull/142

Pull request created successfully!`,
    failureHint: 'Try: gh pr create --title "Fix timezone bug" --body "Description..."',
    competency: 'pull-requests',
    requiresPreviousStep: 'push',
  },
];

export const developerExecutionAdapter: RoleExecutionAdapter = {
  role: 'developer',
  displayName: 'Software Developer',
  description: 'Full implementation workflow with git commands, code changes, and PR reviews',
  competencies: [
    'git-branching',
    'git-staging', 
    'git-commits',
    'git-remote',
    'pull-requests',
    'code-review-response',
    'ticket-delivery',
  ],
  
  gitWorkflow: {
    commands: developerGitCommands,
    branchNamingPattern: 'feature|fix|bugfix|hotfix/TICKET-ID-short-description',
    commitMessageGuidelines: [
      'Use conventional commits: type(scope): description',
      'Types: feat, fix, docs, style, refactor, test, chore',
      'Keep subject line under 50 characters',
      'Use imperative mood: "Add feature" not "Added feature"',
    ],
    prTemplateHint: 'Include: What changed, Why, How to test, Screenshots if UI',
  },
  
  standupConfig: {
    isUserFacilitator: false,
    questions: [
      {
        id: 'yesterday',
        question: 'What did you work on yesterday?',
        placeholder: 'I worked on...',
        required: true,
        minLength: 20,
        exampleResponse: 'I started investigating the timezone bug in TICK-001 and identified the root cause in the date formatting utility.',
      },
      {
        id: 'today',
        question: 'What will you work on today?',
        placeholder: 'Today I plan to...',
        required: true,
        minLength: 20,
        exampleResponse: 'I will implement the fix for TICK-001 and write unit tests to cover the timezone edge cases.',
      },
      {
        id: 'blockers',
        question: 'Do you have any blockers?',
        placeholder: 'No blockers / I am blocked by...',
        required: true,
        minLength: 5,
        exampleResponse: 'No blockers. I might need a quick review from Marcus once the PR is ready.',
      },
    ],
    aiResponseDelay: 1500,
    feedbackEnabled: true,
    baseFeedbackPrompt: `You are a supportive PM providing brief feedback on a developer's standup update. 
Keep responses under 2 sentences. Focus on: clarity, specificity, and highlighting good communication.
If the update is vague, gently ask for more detail. If it's good, acknowledge briefly.`,
  },
  
  ticketWorkConfig: {
    showAcceptanceCriteria: true,
    showCodeSnippets: true,
    allowParallelTickets: false,
    maxInProgress: 1,
    requireGitWorkflow: true,
    autoMoveOnBranchCreate: true,
  },
  
  codeWorkConfig: {
    enabled: true,
    baseMode: 'guided-diff',
    requireCompletionBeforeStage: true,
    showDiffView: true,
    showRunTests: true,
    steps: [
      {
        id: 'understand',
        label: 'Understand the bug',
        description: 'Read the code and identify the issue',
        required: true,
      },
      {
        id: 'implement',
        label: 'Apply the fix',
        description: 'Make the necessary code changes',
        required: true,
      },
      {
        id: 'test',
        label: 'Test your changes',
        description: 'Verify the fix works correctly',
        required: true,
      },
    ],
    mentorHints: [
      'Take your time to understand the existing code before making changes.',
      'Think about edge cases that might be affected by your fix.',
      'Remember to test your changes before committing.',
    ],
    completionMessage: 'Great job! Your code changes are ready to be staged.',
  },
  
  aiInteractions: {
    personas: [
      {
        id: 'priya',
        name: 'Priya',
        role: 'Product Manager',
        personality: 'Organized, clear communicator, focuses on user value',
        avatarSeed: 'priya-pm',
        color: '#8B5CF6',
      },
      {
        id: 'marcus',
        name: 'Marcus',
        role: 'Senior Developer',
        personality: 'Technical mentor, patient, shares best practices',
        avatarSeed: 'marcus-dev',
        color: '#3B82F6',
      },
      {
        id: 'alex',
        name: 'Alex',
        role: 'QA Engineer',
        personality: 'Detail-oriented, focuses on edge cases and testing',
        avatarSeed: 'alex-qa',
        color: '#10B981',
      },
      {
        id: 'sarah',
        name: 'Sarah',
        role: 'Tech Lead',
        personality: 'Strategic thinker, handles escalations and architecture',
        avatarSeed: 'sarah-lead',
        color: '#F59E0B',
      },
    ],
    standupFacilitator: 'priya',
    prReviewers: ['marcus', 'alex'],
    helpResponders: ['marcus', 'sarah'],
    interruptionFrequency: 'low',
  },
  
  prReviewConfig: {
    enabled: true,
    minCommentsPerPR: 1,
    maxCommentsPerPR: 3,
    requireAllResolved: true,
    autoApproveThreshold: 0,
    maxRevisionCycles: 3,
    baseReviewers: [
      {
        id: 'marcus',
        name: 'Marcus',
        role: 'Senior Developer',
        personality: 'Thorough but supportive. Focuses on code quality and best practices.',
        avatarSeed: 'marcus-dev',
        color: '#3B82F6',
        expertise: ['architecture', 'code-patterns', 'performance'],
        reviewStyle: 'thorough',
        focusAreas: ['code structure', 'naming', 'maintainability'],
        promptConfig: {
          systemPrompt: `You are Marcus, a Senior Developer reviewing code on a professional software team.
Your focus areas: architecture, design patterns, code quality, maintainability, and performance.
You are thorough but supportive - you want to help developers grow.
Provide specific, actionable feedback with code examples when helpful.
Be educational and explain the "why" behind your suggestions.`,
          reviewPrompt: `Review this code from a Senior Developer perspective. Focus on:
- Code structure and organization
- Design patterns and best practices
- Naming conventions and readability
- Maintainability and technical debt
- Performance considerations
Provide constructive feedback that helps the developer improve.`,
          focusInstructions: [
            'Look for opportunities to improve code structure',
            'Identify patterns that could be more maintainable',
            'Suggest better naming when unclear',
            'Point out potential performance issues',
            'Recommend refactoring when code is hard to follow',
          ],
          severityGuidelines: {
            blocking: 'Critical issues that could cause bugs, security vulnerabilities, or break production',
            major: 'Significant improvements needed for maintainability, readability, or following team standards',
            minor: 'Nice-to-have suggestions, style preferences, or minor optimizations',
          },
        },
        responsePatterns: {
          clarification: [
            "Good question! Let me break this down - {context}. The key thing to focus on is the pattern here, not just the fix.",
            "Sure, happy to clarify. What I'm suggesting is {context}. This follows our team's standard approach for maintainability.",
            "Ah, I should have been clearer. The issue is about {context}. Think of it as future-proofing the code.",
          ],
          question: [
            "That's a great question to ask! {context}. Understanding the 'why' will help you spot similar patterns elsewhere.",
            "Good thinking! The reason is {context}. This is actually a common pattern you'll see across our codebase.",
            "I like that you're asking why. {context}. It's this kind of curiosity that makes code reviews valuable.",
          ],
          willFix: [
            "Sounds good! Take your time with it. Feel free to ping me if you run into any issues.",
            "Great, thanks! No rush - just request a re-review when you've pushed the changes.",
            "Perfect. I'll keep an eye out for the update. Let me know if you want to pair on it.",
          ],
          acknowledgment: [
            "Thanks for addressing this. You can resolve the thread when ready, or ping me if you need another look.",
            "Got it. Mark this as resolved when you're done, or let me know if you want me to take another look.",
            "Noted! Feel free to close this out or push an update for re-review.",
          ],
          approval: [
            "This looks great now. Nice work on the refactor!",
            "Much better! The code is cleaner and more maintainable. Good job.",
            "Excellent work. This is exactly what I was hoping for.",
          ],
        },
      },
      {
        id: 'alex',
        name: 'Alex',
        role: 'QA Engineer',
        personality: 'Detail-oriented. Catches edge cases and testing gaps.',
        avatarSeed: 'alex-qa',
        color: '#10B981',
        expertise: ['testing', 'edge-cases', 'error-handling'],
        reviewStyle: 'balanced',
        focusAreas: ['test coverage', 'error handling', 'validation'],
        promptConfig: {
          systemPrompt: `You are Alex, a QA Engineer reviewing code on a professional software team.
Your focus areas: testing, edge cases, error handling, input validation, and defensive coding.
You are detail-oriented and catch issues that could cause bugs in production.
Point out scenarios that might not be handled and suggest test cases.
Be helpful but firm about quality - you're the last line of defense before production.`,
          reviewPrompt: `Review this code from a QA perspective. Focus on:
- Edge cases that aren't handled
- Error handling and validation
- Potential runtime failures
- Missing test coverage
- Input validation and defensive coding
Identify issues that could cause bugs in production.`,
          focusInstructions: [
            'Look for unhandled edge cases (null, undefined, empty arrays)',
            'Check error handling - what happens when things fail?',
            'Identify missing input validation',
            'Point out scenarios that need test coverage',
            'Watch for potential runtime exceptions',
          ],
          severityGuidelines: {
            blocking: 'Issues that will definitely cause bugs, crashes, or security vulnerabilities in production',
            major: 'Missing error handling, unvalidated inputs, or untested edge cases that are likely to cause issues',
            minor: 'Additional test suggestions, defensive coding improvements, or nice-to-have validations',
          },
        },
        responsePatterns: {
          clarification: [
            "Sure! The edge case I'm worried about is {context}. We've seen this cause issues in production before.",
            "Let me explain - {context}. From a QA perspective, these are the scenarios that tend to slip through.",
            "Good catch asking. The concern is {context}. I'd want to see a test covering this specifically.",
          ],
          question: [
            "Good question! {context}. I've seen bugs like this in the wild, so it's worth handling explicitly.",
            "The reason is {context}. Our test suite should catch this, but defensive coding is always good.",
            "From a testing standpoint, {context}. Better to handle it now than debug it in prod.",
          ],
          willFix: [
            "Perfect, thanks! Make sure to add a test case for this scenario too if you can.",
            "Great! Consider adding an edge case test when you push the fix.",
            "Sounds good. A quick unit test for this would be awesome if time permits.",
          ],
          acknowledgment: [
            "Thanks! Resolve when ready. If you added test coverage, even better!",
            "Got it. Close this out when addressed - bonus points for test coverage.",
            "Noted. Mark resolved when done, and let me know if you want me to review the test approach.",
          ],
          approval: [
            "Looks solid! The edge cases are handled well now.",
            "Nice fix! This should prevent the issue from happening in prod.",
            "Good work. The error handling is much more robust now.",
          ],
        },
      },
    ],
    baseUIConfig: {
      layoutMode: 'split-diff',
      showDiffViewer: true,
      showFileTree: true,
      showTimeline: true,
      inlineComments: true,
      expandThreadsByDefault: true,
    },
    basePrompts: {
      baseSystemPrompt: `You are a code reviewer on a professional software team. Provide constructive feedback that helps developers improve while maintaining a collaborative tone.`,
      initialReviewPrompt: `Review this pull request. Consider: code quality, potential bugs, test coverage, and adherence to team standards. Provide specific, actionable feedback.`,
      followUpPrompt: `The developer has addressed your previous feedback. Review the changes and determine if the issues are resolved or if further improvements are needed.`,
      approvalCriteria: [
        'Code follows team style guidelines',
        'No obvious bugs or security issues',
        'Tests cover main functionality',
        'Commit message is clear',
      ],
      commonIssuesHint: [
        'Missing error handling',
        'Hardcoded values',
        'Missing tests for edge cases',
        'Unclear variable names',
      ],
    },
    knowledgeBase: {
      concepts: [
        {
          concept: 'optional chaining',
          aliases: ['?.', 'optional chaining operator', 'safe navigation'],
          explanation: 'Optional chaining (`?.`) lets you safely access nested properties without worrying about whether intermediate values are null or undefined. Instead of crashing, it returns undefined if any part of the chain is nullish.',
          codeExample: '// Instead of:\nif (user && user.address && user.address.city) { ... }\n\n// You can write:\nconst city = user?.address?.city;',
          qaAngle: 'This prevents runtime crashes when data is unexpectedly missing, which is common with API responses.',
        },
        {
          concept: 'null check',
          aliases: ['null guard', 'nullish check', 'defensive coding', 'null validation'],
          explanation: 'A null check verifies that a value exists before you use it. This prevents "Cannot read property of undefined" errors that crash your app.',
          codeExample: '// Early return pattern:\nfunction processUser(user) {\n  if (!user) return null;\n  return user.name.toUpperCase();\n}',
          qaAngle: 'Missing null checks are one of the most common sources of production bugs. Always validate before accessing nested properties.',
        },
        {
          concept: 'early return',
          aliases: ['guard clause', 'early exit', 'return early'],
          explanation: 'Early return is a pattern where you handle edge cases at the start of a function and return immediately, rather than nesting your main logic inside if-else blocks. It makes code more readable.',
          codeExample: '// Instead of deeply nested if-else:\nfunction process(data) {\n  if (!data) return null;\n  if (!data.items) return [];\n  \n  // Main logic here, not nested\n  return data.items.map(...);\n}',
        },
        {
          concept: 'destructuring',
          aliases: ['object destructuring', 'array destructuring', 'destructure'],
          explanation: 'Destructuring lets you extract values from objects or arrays into distinct variables in a concise way. It makes code cleaner and more readable.',
          codeExample: '// Object destructuring:\nconst { name, email } = user;\n\n// Array destructuring:\nconst [first, second] = items;\n\n// With defaults:\nconst { role = "user" } = config;',
        },
        {
          concept: 'async await',
          aliases: ['async/await', 'async function', 'await keyword'],
          explanation: 'Async/await is a way to write asynchronous code that looks synchronous. An async function returns a Promise, and await pauses execution until the Promise resolves.',
          codeExample: 'async function fetchUser(id) {\n  try {\n    const response = await fetch(`/api/users/${id}`);\n    const user = await response.json();\n    return user;\n  } catch (error) {\n    console.error("Failed to fetch user:", error);\n  }\n}',
          qaAngle: 'Always wrap await calls in try-catch for proper error handling.',
        },
        {
          concept: 'spread operator',
          aliases: ['...', 'spread syntax', 'object spread', 'array spread'],
          explanation: 'The spread operator (`...`) expands an array or object into individual elements. It is commonly used to copy arrays/objects or merge them together.',
          codeExample: '// Copy and add to array:\nconst newItems = [...items, newItem];\n\n// Merge objects:\nconst updated = { ...user, name: "New Name" };',
        },
        {
          concept: 'type coercion',
          aliases: ['type conversion', 'implicit conversion', 'truthy falsy'],
          explanation: 'Type coercion is when JavaScript automatically converts one type to another. This can cause bugs with == vs === comparisons. Always use strict equality (===) to avoid surprises.',
          codeExample: '// Problematic:\n"5" == 5  // true (coerced)\n\n// Safe:\n"5" === 5  // false (strict)\n\n// Explicit conversion:\nNumber("5") === 5  // true',
          qaAngle: 'Type coercion bugs are subtle and hard to catch. Strict equality prevents an entire class of bugs.',
        },
        {
          concept: 'error handling',
          aliases: ['try catch', 'exception handling', 'error boundary'],
          explanation: 'Error handling using try-catch allows you to gracefully handle exceptions without crashing the application. Always catch errors at appropriate boundaries and provide meaningful error messages.',
          codeExample: 'try {\n  const result = await riskyOperation();\n  return result;\n} catch (error) {\n  console.error("Operation failed:", error.message);\n  // Return fallback or rethrow\n  throw new Error(`Failed to complete: ${error.message}`);\n}',
          qaAngle: 'Unhandled errors crash the app. Proper error handling ensures graceful degradation.',
        },
      ],
    },
  },
  
  ticketCompletionConfig: {
    showCelebration: true,
    celebrationStyle: 'confetti',
    showProgressRecap: true,
    showLearningHighlights: true,
    autoRedirectDelay: null,
    nextActionOptions: {
      primary: 'back-to-board',
      secondary: 'review-code',
    },
    celebrationMessages: {
      title: 'PR Merged Successfully!',
      subtitle: 'Your code is now part of the main branch',
      encouragement: 'Great work completing this ticket! You followed the full development workflow from branch creation to merge.',
    },
  },
  
  sprintCompletionConfig: {
    showProgressBar: true,
    showCompletionBanner: true,
    bannerPosition: 'top',
    progressMessages: {
      inProgress: 'Sprint in progress - keep working through your tickets!',
      nearComplete: 'Almost there! Just one more ticket to go.',
      allDone: 'All tickets complete! Your sprint work is done.',
    },
    completionCTA: {
      label: 'Start Sprint Review',
      description: 'Present your completed work to stakeholders and get feedback.',
      nextPhase: 'review',
    },
    celebrationStyle: 'confetti',
    showTeamMessage: true,
    teamMessage: 'Great work completing all your sprint tickets! Time to showcase your accomplishments in the Sprint Review.',
  },
  
  uiControls: {
    showGitTerminal: true,
    showTeamChat: true,
    showAcceptanceCriteria: true,
    showWorkflowProgress: true,
    showMentorHints: true,
    splitPanelLayout: 'terminal-right',
    layout: {
      mode: 'two-column',
      sidebarPosition: 'right',
      sidebarWidth: 'medium',
      codeWorkPosition: 'above-terminal',
      terminalHeight: 'medium',
      chatPosition: 'sidebar',
      collapsiblePanels: true,
      animateTransitions: true,
      mobileBreakpoint: 'lg',
    },
  },
  
  difficulty: {
    gitCommandStrictness: 'moderate',
    prReviewIntensity: 'moderate',
  },
  
  evaluation: {
    rubricWeights: {
      gitMastery: 0.25,
      deliveryReliability: 0.25,
      communicationQuality: 0.15,
      collaborationSkill: 0.15,
      codeReviewResponse: 0.20,
    },
    passingThreshold: 70,
    requiredTicketsComplete: 2,
    requiredPRsReviewed: 2,
  },
  
  learningObjectives: [
    {
      phase: 'standup',
      objectives: [
        'Communicate progress clearly and concisely',
        'Identify and escalate blockers early',
        'Set realistic daily goals',
      ],
      tips: [
        'Be specific about what you accomplished, not just "worked on X"',
        'Mention ticket IDs so the team can track progress',
        'If blocked, explain what you need to get unblocked',
      ],
    },
    {
      phase: 'work',
      objectives: [
        'Follow git workflow best practices',
        'Write clear commit messages',
        'Create focused, reviewable pull requests',
      ],
      tips: [
        'Create a branch before making any changes',
        'Commit frequently with descriptive messages',
        'Keep PRs small and focused on one change',
      ],
    },
    {
      phase: 'review',
      objectives: [
        'Respond to code review feedback professionally',
        'Iterate based on suggestions',
        'Learn from senior developer feedback',
      ],
      tips: [
        'Thank reviewers for their feedback',
        'Ask clarifying questions if something is unclear',
        'Apply feedback and push updates promptly',
      ],
    },
  ],
};

export const qaExecutionAdapter: RoleExecutionAdapter = {
  ...developerExecutionAdapter,
  role: 'qa',
  displayName: 'QA Engineer',
  description: 'Testing-focused workflow with emphasis on test coverage and quality',
  competencies: [
    ...developerExecutionAdapter.competencies,
    'test-planning',
    'bug-reporting',
  ],
};

export const devopsExecutionAdapter: RoleExecutionAdapter = {
  ...developerExecutionAdapter,
  role: 'devops',
  displayName: 'DevOps Engineer',
  description: 'Infrastructure and deployment workflow with CI/CD focus',
  competencies: [
    ...developerExecutionAdapter.competencies,
    'ci-cd-pipelines',
    'infrastructure-as-code',
  ],
};

export const dataScienceExecutionAdapter: RoleExecutionAdapter = {
  ...developerExecutionAdapter,
  role: 'data_science',
  displayName: 'Data Scientist',
  description: 'Data analysis workflow with notebook and experiment tracking',
  competencies: [
    ...developerExecutionAdapter.competencies,
    'experiment-tracking',
    'data-documentation',
  ],
};
