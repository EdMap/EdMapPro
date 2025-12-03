export type GitCommandType = 
  | 'clone' | 'init' | 'status' | 'add' | 'commit' | 'push' | 'pull' 
  | 'branch' | 'checkout' | 'merge' | 'log' | 'diff' | 'fetch' | 'stash';

export interface GitFile {
  path: string;
  status: 'untracked' | 'modified' | 'staged' | 'committed';
  content?: string;
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  timestamp: string;
  files: string[];
}

export interface GitBranch {
  name: string;
  isActive: boolean;
  commits: GitCommit[];
  upstreamBranch?: string;
}

export interface GitState {
  isInitialized: boolean;
  isCloned: boolean;
  repoUrl?: string;
  currentBranch: string;
  branches: GitBranch[];
  stagedFiles: GitFile[];
  modifiedFiles: GitFile[];
  untrackedFiles: GitFile[];
  remoteSyncStatus: 'synced' | 'ahead' | 'behind' | 'diverged';
  stash: GitFile[][];
}

export interface GitCommandResult {
  success: boolean;
  output: string;
  error?: string;
  stateChange?: Partial<GitState>;
  tip?: string;
}

export interface GitTip {
  command: string;
  title: string;
  description: string;
  example: string;
}

const GIT_TIPS: Record<GitCommandType, GitTip> = {
  clone: {
    command: 'git clone',
    title: 'Clone a repository',
    description: 'Creates a copy of a remote repository on your local machine.',
    example: 'git clone https://github.com/company/project.git',
  },
  init: {
    command: 'git init',
    title: 'Initialize a repository',
    description: 'Creates a new Git repository in the current directory.',
    example: 'git init',
  },
  status: {
    command: 'git status',
    title: 'Check repository status',
    description: 'Shows which files have been modified, staged, or are untracked.',
    example: 'git status',
  },
  add: {
    command: 'git add',
    title: 'Stage changes',
    description: 'Adds files to the staging area for the next commit.',
    example: 'git add src/feature.ts  # Stage specific file\ngit add .  # Stage all changes',
  },
  commit: {
    command: 'git commit',
    title: 'Commit changes',
    description: 'Records staged changes with a descriptive message.',
    example: 'git commit -m "Add user authentication feature"',
  },
  push: {
    command: 'git push',
    title: 'Push to remote',
    description: 'Uploads local commits to the remote repository.',
    example: 'git push origin feature/login',
  },
  pull: {
    command: 'git pull',
    title: 'Pull from remote',
    description: 'Downloads and merges changes from the remote repository.',
    example: 'git pull origin main',
  },
  branch: {
    command: 'git branch',
    title: 'Manage branches',
    description: 'Creates, lists, or deletes branches.',
    example: 'git branch feature/new-feature  # Create branch\ngit branch -d old-branch  # Delete branch',
  },
  checkout: {
    command: 'git checkout',
    title: 'Switch branches',
    description: 'Switches to a different branch or restores files.',
    example: 'git checkout -b feature/login  # Create and switch to new branch\ngit checkout main  # Switch to existing branch',
  },
  merge: {
    command: 'git merge',
    title: 'Merge branches',
    description: 'Combines changes from another branch into the current branch.',
    example: 'git merge feature/login  # Merge feature branch into current branch',
  },
  log: {
    command: 'git log',
    title: 'View commit history',
    description: 'Shows the commit history of the repository.',
    example: 'git log --oneline  # Compact view\ngit log -n 5  # Last 5 commits',
  },
  diff: {
    command: 'git diff',
    title: 'View changes',
    description: 'Shows differences between commits, branches, or working tree.',
    example: 'git diff  # Unstaged changes\ngit diff --staged  # Staged changes',
  },
  fetch: {
    command: 'git fetch',
    title: 'Fetch from remote',
    description: 'Downloads changes from remote without merging.',
    example: 'git fetch origin',
  },
  stash: {
    command: 'git stash',
    title: 'Stash changes',
    description: 'Temporarily stores uncommitted changes.',
    example: 'git stash  # Save changes\ngit stash pop  # Restore changes',
  },
};

const BRANCH_NAMING_TIPS = {
  patterns: [
    { prefix: 'feature/', description: 'For new features', example: 'feature/PROJ-123-user-login' },
    { prefix: 'bugfix/', description: 'For bug fixes', example: 'bugfix/PROJ-456-fix-null-error' },
    { prefix: 'hotfix/', description: 'For urgent production fixes', example: 'hotfix/PROJ-789-security-patch' },
    { prefix: 'refactor/', description: 'For code refactoring', example: 'refactor/PROJ-101-cleanup-utils' },
    { prefix: 'chore/', description: 'For maintenance tasks', example: 'chore/PROJ-202-update-deps' },
  ],
  bestPractices: [
    'Use lowercase letters and hyphens',
    'Include ticket ID when available',
    'Keep names short but descriptive',
    'Avoid special characters',
  ],
};

const COMMIT_MESSAGE_TIPS = {
  patterns: [
    { type: 'feat:', description: 'New feature', example: 'feat: add user authentication' },
    { type: 'fix:', description: 'Bug fix', example: 'fix: resolve null pointer in login' },
    { type: 'docs:', description: 'Documentation', example: 'docs: update README setup guide' },
    { type: 'style:', description: 'Formatting', example: 'style: format code with prettier' },
    { type: 'refactor:', description: 'Code refactoring', example: 'refactor: simplify auth middleware' },
    { type: 'test:', description: 'Adding tests', example: 'test: add unit tests for user service' },
    { type: 'chore:', description: 'Maintenance', example: 'chore: update dependencies' },
  ],
  bestPractices: [
    'Use imperative mood (add, not added)',
    'Keep subject line under 50 characters',
    'Separate subject from body with blank line',
    'Explain what and why, not how',
  ],
};

function generateShortHash(): string {
  return Math.random().toString(36).substring(2, 9);
}

function formatTimestamp(): string {
  return new Date().toISOString();
}

export function createInitialState(): GitState {
  return {
    isInitialized: false,
    isCloned: false,
    currentBranch: 'main',
    branches: [
      {
        name: 'main',
        isActive: true,
        commits: [],
      },
    ],
    stagedFiles: [],
    modifiedFiles: [],
    untrackedFiles: [],
    remoteSyncStatus: 'synced',
    stash: [],
  };
}

export function parseGitCommand(input: string): { command: GitCommandType | null; args: string[] } {
  const parts = input.trim().split(/\s+/);
  
  if (parts[0] !== 'git') {
    return { command: null, args: [] };
  }
  
  const command = parts[1] as GitCommandType;
  const args = parts.slice(2);
  
  return { command, args };
}

export function validateBranchName(name: string): { valid: boolean; message: string; suggestion?: string } {
  if (!name) {
    return { valid: false, message: 'Branch name cannot be empty' };
  }
  
  if (name.startsWith('-')) {
    return { valid: false, message: 'Branch name cannot start with a hyphen' };
  }
  
  if (name.includes('..')) {
    return { valid: false, message: 'Branch name cannot contain ".."' };
  }
  
  if (/[~^:?*\[\]\\@{}]/.test(name)) {
    return { valid: false, message: 'Branch name contains invalid characters' };
  }
  
  if (name.endsWith('.lock')) {
    return { valid: false, message: 'Branch name cannot end with .lock' };
  }
  
  const lowerName = name.toLowerCase();
  const hasValidPrefix = BRANCH_NAMING_TIPS.patterns.some(p => lowerName.startsWith(p.prefix));
  
  if (!hasValidPrefix && !['main', 'master', 'develop', 'staging'].includes(lowerName)) {
    const suggestion = `Consider using a prefix like "feature/${name}" or "bugfix/${name}"`;
    return { valid: true, message: 'Valid but could follow conventions better', suggestion };
  }
  
  return { valid: true, message: 'Valid branch name' };
}

export function validateCommitMessage(message: string): { valid: boolean; message: string; suggestion?: string } {
  if (!message || message.trim().length === 0) {
    return { valid: false, message: 'Commit message cannot be empty' };
  }
  
  if (message.length < 3) {
    return { valid: false, message: 'Commit message is too short' };
  }
  
  const hasConventionalPrefix = COMMIT_MESSAGE_TIPS.patterns.some(
    p => message.toLowerCase().startsWith(p.type)
  );
  
  if (!hasConventionalPrefix) {
    return { 
      valid: true, 
      message: 'Valid but could follow conventional commits',
      suggestion: 'Try: "feat: ' + message + '" for a new feature'
    };
  }
  
  if (message.length > 72) {
    return {
      valid: true,
      message: 'Consider keeping the first line under 72 characters',
      suggestion: 'Use a blank line and add details in the body'
    };
  }
  
  return { valid: true, message: 'Good commit message!' };
}

export function simulateGitCommand(
  state: GitState,
  command: GitCommandType,
  args: string[]
): GitCommandResult {
  switch (command) {
    case 'clone':
      return simulateClone(state, args);
    case 'init':
      return simulateInit(state);
    case 'status':
      return simulateStatus(state);
    case 'add':
      return simulateAdd(state, args);
    case 'commit':
      return simulateCommit(state, args);
    case 'push':
      return simulatePush(state, args);
    case 'pull':
      return simulatePull(state);
    case 'branch':
      return simulateBranch(state, args);
    case 'checkout':
      return simulateCheckout(state, args);
    case 'log':
      return simulateLog(state, args);
    case 'diff':
      return simulateDiff(state);
    case 'fetch':
      return simulateFetch(state);
    case 'stash':
      return simulateStash(state, args);
    default:
      return {
        success: false,
        output: '',
        error: `Unknown command: ${command}`,
      };
  }
}

function simulateClone(state: GitState, args: string[]): GitCommandResult {
  if (state.isCloned) {
    return {
      success: false,
      output: '',
      error: 'Repository already cloned',
    };
  }
  
  const repoUrl = args[0];
  if (!repoUrl) {
    return {
      success: false,
      output: '',
      error: 'Repository URL required',
      tip: GIT_TIPS.clone.example,
    };
  }
  
  return {
    success: true,
    output: `Cloning into '${repoUrl.split('/').pop()}'...\nremote: Enumerating objects: 156, done.\nremote: Counting objects: 100% (156/156), done.\nremote: Compressing objects: 100% (89/89), done.\nReceiving objects: 100% (156/156), 45.2 KiB | 1.2 MiB/s, done.\nResolving deltas: 100% (67/67), done.`,
    stateChange: {
      isCloned: true,
      isInitialized: true,
      repoUrl,
    },
    tip: 'Repository cloned! Use "git status" to see the current state.',
  };
}

function simulateInit(state: GitState): GitCommandResult {
  if (state.isInitialized) {
    return {
      success: false,
      output: '',
      error: 'Repository already initialized',
    };
  }
  
  return {
    success: true,
    output: 'Initialized empty Git repository in .git/',
    stateChange: {
      isInitialized: true,
    },
  };
}

function simulateStatus(state: GitState): GitCommandResult {
  const lines: string[] = [];
  lines.push(`On branch ${state.currentBranch}`);
  
  if (state.stagedFiles.length > 0) {
    lines.push('\nChanges to be committed:');
    lines.push('  (use "git restore --staged <file>..." to unstage)');
    state.stagedFiles.forEach(f => lines.push(`\t${f.status === 'staged' ? 'new file' : 'modified'}:   ${f.path}`));
  }
  
  if (state.modifiedFiles.length > 0) {
    lines.push('\nChanges not staged for commit:');
    lines.push('  (use "git add <file>..." to update what will be committed)');
    state.modifiedFiles.forEach(f => lines.push(`\tmodified:   ${f.path}`));
  }
  
  if (state.untrackedFiles.length > 0) {
    lines.push('\nUntracked files:');
    lines.push('  (use "git add <file>..." to include in what will be committed)');
    state.untrackedFiles.forEach(f => lines.push(`\t${f.path}`));
  }
  
  if (state.stagedFiles.length === 0 && state.modifiedFiles.length === 0 && state.untrackedFiles.length === 0) {
    lines.push('\nnothing to commit, working tree clean');
  }
  
  return {
    success: true,
    output: lines.join('\n'),
  };
}

function simulateAdd(state: GitState, args: string[]): GitCommandResult {
  if (args.length === 0) {
    return {
      success: false,
      output: '',
      error: 'Nothing specified, nothing added.',
      tip: GIT_TIPS.add.example,
    };
  }
  
  const addAll = args.includes('.') || args.includes('-A') || args.includes('--all');
  
  let stagedCount = 0;
  const newStaged: GitFile[] = [...state.stagedFiles];
  
  if (addAll) {
    state.modifiedFiles.forEach(f => {
      newStaged.push({ ...f, status: 'staged' });
      stagedCount++;
    });
    state.untrackedFiles.forEach(f => {
      newStaged.push({ ...f, status: 'staged' });
      stagedCount++;
    });
    
    return {
      success: true,
      output: stagedCount > 0 ? `Added ${stagedCount} file(s) to staging area` : 'Nothing to add',
      stateChange: {
        stagedFiles: newStaged,
        modifiedFiles: [],
        untrackedFiles: [],
      },
    };
  }
  
  return {
    success: true,
    output: 'Changes staged for commit',
    stateChange: {
      stagedFiles: newStaged,
    },
  };
}

function simulateCommit(state: GitState, args: string[]): GitCommandResult {
  if (state.stagedFiles.length === 0) {
    return {
      success: false,
      output: '',
      error: 'nothing to commit, working tree clean',
      tip: 'Use "git add <file>" to stage changes first',
    };
  }
  
  const messageIndex = args.indexOf('-m');
  let message = '';
  
  if (messageIndex !== -1 && args[messageIndex + 1]) {
    message = args[messageIndex + 1].replace(/^["']|["']$/g, '');
  } else {
    return {
      success: false,
      output: '',
      error: 'Aborting commit due to empty commit message.',
      tip: GIT_TIPS.commit.example,
    };
  }
  
  const validation = validateCommitMessage(message);
  const hash = generateShortHash();
  
  const commit: GitCommit = {
    hash,
    message,
    author: 'You <you@example.com>',
    timestamp: formatTimestamp(),
    files: state.stagedFiles.map(f => f.path),
  };
  
  const branch = state.branches.find(b => b.name === state.currentBranch);
  if (branch) {
    branch.commits.push(commit);
  }
  
  let output = `[${state.currentBranch} ${hash}] ${message}\n ${state.stagedFiles.length} file(s) changed`;
  
  return {
    success: true,
    output,
    stateChange: {
      stagedFiles: [],
      remoteSyncStatus: 'ahead',
    },
    tip: validation.suggestion,
  };
}

function simulatePush(state: GitState, args: string[]): GitCommandResult {
  if (state.remoteSyncStatus === 'synced') {
    return {
      success: true,
      output: 'Everything up-to-date',
    };
  }
  
  const remote = args[0] || 'origin';
  const branch = args[1] || state.currentBranch;
  
  return {
    success: true,
    output: `Enumerating objects: 5, done.\nCounting objects: 100% (5/5), done.\nDelta compression using up to 8 threads\nCompressing objects: 100% (3/3), done.\nWriting objects: 100% (3/3), 350 bytes | 350.00 KiB/s, done.\nTotal 3 (delta 2), reused 0 (delta 0)\nTo ${remote}/${branch}\n   abc1234..def5678  ${branch} -> ${branch}`,
    stateChange: {
      remoteSyncStatus: 'synced',
    },
  };
}

function simulatePull(state: GitState): GitCommandResult {
  return {
    success: true,
    output: 'Already up to date.',
    stateChange: {
      remoteSyncStatus: 'synced',
    },
  };
}

function simulateBranch(state: GitState, args: string[]): GitCommandResult {
  if (args.length === 0) {
    const output = state.branches
      .map(b => `${b.isActive ? '* ' : '  '}${b.name}`)
      .join('\n');
    return { success: true, output };
  }
  
  const branchName = args[0];
  
  if (args.includes('-d') || args.includes('-D')) {
    const toDelete = args.find(a => !a.startsWith('-'));
    if (!toDelete) {
      return { success: false, output: '', error: 'Branch name required' };
    }
    if (toDelete === state.currentBranch) {
      return { success: false, output: '', error: 'Cannot delete the currently checked out branch' };
    }
    return {
      success: true,
      output: `Deleted branch ${toDelete}`,
      stateChange: {
        branches: state.branches.filter(b => b.name !== toDelete),
      },
    };
  }
  
  const validation = validateBranchName(branchName);
  if (!validation.valid) {
    return { success: false, output: '', error: validation.message };
  }
  
  if (state.branches.some(b => b.name === branchName)) {
    return { success: false, output: '', error: `A branch named '${branchName}' already exists` };
  }
  
  const newBranch: GitBranch = {
    name: branchName,
    isActive: false,
    commits: [...(state.branches.find(b => b.isActive)?.commits || [])],
  };
  
  return {
    success: true,
    output: `Created branch '${branchName}'`,
    stateChange: {
      branches: [...state.branches, newBranch],
    },
    tip: validation.suggestion,
  };
}

function simulateCheckout(state: GitState, args: string[]): GitCommandResult {
  const createNew = args.includes('-b');
  let branchName = args.find(a => !a.startsWith('-'));
  
  if (!branchName) {
    return { success: false, output: '', error: 'Branch name required' };
  }
  
  if (createNew) {
    const validation = validateBranchName(branchName);
    if (!validation.valid) {
      return { success: false, output: '', error: validation.message };
    }
    
    if (state.branches.some(b => b.name === branchName)) {
      return { success: false, output: '', error: `A branch named '${branchName}' already exists` };
    }
    
    const newBranch: GitBranch = {
      name: branchName,
      isActive: true,
      commits: [...(state.branches.find(b => b.isActive)?.commits || [])],
    };
    
    return {
      success: true,
      output: `Switched to a new branch '${branchName}'`,
      stateChange: {
        currentBranch: branchName,
        branches: [
          ...state.branches.map(b => ({ ...b, isActive: false })),
          newBranch,
        ],
      },
      tip: validation.suggestion,
    };
  }
  
  const existingBranch = state.branches.find(b => b.name === branchName);
  if (!existingBranch) {
    return { success: false, output: '', error: `pathspec '${branchName}' did not match any file(s) known to git` };
  }
  
  return {
    success: true,
    output: `Switched to branch '${branchName}'`,
    stateChange: {
      currentBranch: branchName,
      branches: state.branches.map(b => ({ ...b, isActive: b.name === branchName })),
    },
  };
}

function simulateLog(state: GitState, args: string[]): GitCommandResult {
  const currentBranch = state.branches.find(b => b.isActive);
  if (!currentBranch || currentBranch.commits.length === 0) {
    return { success: true, output: 'No commits yet' };
  }
  
  const oneline = args.includes('--oneline');
  let limit = 10;
  const nIndex = args.indexOf('-n');
  if (nIndex !== -1 && args[nIndex + 1]) {
    limit = parseInt(args[nIndex + 1], 10);
  }
  
  const commits = currentBranch.commits.slice(-limit).reverse();
  
  if (oneline) {
    return {
      success: true,
      output: commits.map(c => `${c.hash} ${c.message}`).join('\n'),
    };
  }
  
  const lines = commits.map(c => [
    `commit ${c.hash}`,
    `Author: ${c.author}`,
    `Date:   ${c.timestamp}`,
    '',
    `    ${c.message}`,
    '',
  ].join('\n'));
  
  return { success: true, output: lines.join('\n') };
}

function simulateDiff(state: GitState): GitCommandResult {
  if (state.modifiedFiles.length === 0 && state.stagedFiles.length === 0) {
    return { success: true, output: '' };
  }
  
  return {
    success: true,
    output: 'diff --git a/file.ts b/file.ts\nindex abc1234..def5678 100644\n--- a/file.ts\n+++ b/file.ts\n@@ -1,5 +1,6 @@\n // Example diff output\n+// New line added',
  };
}

function simulateFetch(state: GitState): GitCommandResult {
  return {
    success: true,
    output: 'From origin\n   abc1234..def5678  main       -> origin/main',
  };
}

function simulateStash(state: GitState, args: string[]): GitCommandResult {
  if (args.includes('pop')) {
    if (state.stash.length === 0) {
      return { success: false, output: '', error: 'No stash entries found.' };
    }
    const restored = state.stash[state.stash.length - 1];
    return {
      success: true,
      output: `Dropped refs/stash@{0} (abc1234)`,
      stateChange: {
        modifiedFiles: restored,
        stash: state.stash.slice(0, -1),
      },
    };
  }
  
  if (args.includes('list')) {
    if (state.stash.length === 0) {
      return { success: true, output: '' };
    }
    return {
      success: true,
      output: state.stash.map((_, i) => `stash@{${i}}: WIP on ${state.currentBranch}`).join('\n'),
    };
  }
  
  if (state.modifiedFiles.length === 0 && state.stagedFiles.length === 0) {
    return { success: false, output: '', error: 'No local changes to save' };
  }
  
  return {
    success: true,
    output: `Saved working directory and index state WIP on ${state.currentBranch}`,
    stateChange: {
      stash: [...state.stash, [...state.modifiedFiles, ...state.stagedFiles]],
      modifiedFiles: [],
      stagedFiles: [],
    },
  };
}

export function getGitTip(command: GitCommandType): GitTip | null {
  return GIT_TIPS[command] || null;
}

export function getBranchNamingTips() {
  return BRANCH_NAMING_TIPS;
}

export function getCommitMessageTips() {
  return COMMIT_MESSAGE_TIPS;
}

export function suggestBranchName(ticketKey: string, ticketTitle: string, ticketType: string): string {
  const prefix = ticketType === 'bug' ? 'bugfix' : 'feature';
  const slug = ticketTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join('-');
  
  return `${prefix}/${ticketKey.toLowerCase()}-${slug}`;
}

export function suggestCommitMessage(ticketKey: string, changeDescription: string, ticketType: string): string {
  const prefix = ticketType === 'bug' ? 'fix' : 'feat';
  return `${prefix}(${ticketKey}): ${changeDescription}`;
}
