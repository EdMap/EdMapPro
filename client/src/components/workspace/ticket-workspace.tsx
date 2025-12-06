import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft,
  GitBranch,
  GitCommit,
  GitPullRequest,
  CheckCircle2,
  Terminal,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronRight,
  Clock,
  Target,
  AlertTriangle,
  ArrowUp,
  Copy,
  Lightbulb,
  Code,
  Bug,
  Star,
  Wrench,
  FileCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { getSprintExecutionAdapter } from "@shared/adapters";
import { getBacklogItemById } from "@shared/adapters/planning/backlog-catalogue";
import { getCodeExecutionAdapter, createCodeChallengeFromBacklog } from "@shared/adapters/code-execution";
import { CodeWorkPanel } from "./code-work-panel";
import { CodeEditorPanel } from "./code-editor";
import { PRReviewPanel } from "./pr-review-panel";
import type { Role, Level, GitCommand } from "@shared/adapters";
import type { ExecutionResponse } from "@shared/adapters/code-execution/types";
import type { SprintTicket, GitTicketState } from "@shared/schema";

interface TicketWorkspaceProps {
  ticketId: number;
  workspaceId: number;
  sprintId: number;
  role: string;
  level?: string;
  companyName: string;
  onBack: () => void;
}

interface TerminalLine {
  id: string;
  type: 'command' | 'output' | 'error' | 'hint' | 'success' | 'info';
  content: string;
  timestamp: Date;
}

interface ChatMessage {
  id: string;
  from: string;
  role: string;
  content: string;
  color: string;
  timestamp: Date;
  isUser?: boolean;
}

function parseGitState(gitState: unknown): GitTicketState {
  const defaultState: GitTicketState = {
    branchName: null,
    branchCreatedAt: null,
    codeWorkComplete: false,
    commits: [],
    isPushed: false,
    prCreated: false,
    prApproved: false,
    isMerged: false,
  };
  
  if (!gitState || typeof gitState !== 'object') return defaultState;
  return { ...defaultState, ...gitState as Partial<GitTicketState> };
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'bug': return Bug;
    case 'feature': return Star;
    case 'improvement': return Wrench;
    default: return Code;
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case 'bug': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
    case 'feature': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    case 'improvement': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
    default: return 'bg-gray-100 text-gray-700';
  }
}

const TEAM_PERSONAS = {
  marcus: { name: 'Marcus', role: 'Senior Developer', initials: 'MC', color: 'bg-amber-500' },
  priya: { name: 'Priya', role: 'Product Manager', initials: 'PK', color: 'bg-indigo-500' },
  alex: { name: 'Alex', role: 'QA Engineer', initials: 'AW', color: 'bg-teal-500' },
  sarah: { name: 'Sarah', role: 'Tech Lead', initials: 'ST', color: 'bg-purple-500' },
};

export function TicketWorkspace({
  ticketId,
  workspaceId,
  sprintId,
  role,
  level = 'intern',
  companyName,
  onBack,
}: TicketWorkspaceProps) {
  const { toast } = useToast();
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInputRef = useRef<HTMLInputElement>(null);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      from: 'Marcus',
      role: 'Senior Developer',
      content: "Hey! I see you're working on this ticket. Let me know if you need any help with the implementation.",
      color: 'bg-amber-500',
      timestamp: new Date(),
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);
  const [isAcceptanceOpen, setIsAcceptanceOpen] = useState(true);
  const [optimisticCodeWorkComplete, setOptimisticCodeWorkComplete] = useState<boolean | null>(null);
  const [isCodeWorkSaving, setIsCodeWorkSaving] = useState(false);
  const [useMonacoEditor, setUseMonacoEditor] = useState<boolean | null>(null);
  const [triggerExternalTests, setTriggerExternalTests] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<ExecutionResponse | null>(null);
  const [showCodeDuringReview, setShowCodeDuringReview] = useState(false);

  const adapter = useMemo(() => {
    return getSprintExecutionAdapter(role as Role, level as Level);
  }, [role, level]);

  const { data: ticket, isLoading, error } = useQuery<SprintTicket>({
    queryKey: [`/api/tickets/${ticketId}`],
    enabled: !!ticketId,
  });

  const gitState = useMemo(() => parseGitState(ticket?.gitState), [ticket?.gitState]);
  
  const isInReviewPhase = gitState.prCreated && !gitState.isMerged;

  const backlogItem = useMemo(() => {
    if (!ticket?.ticketKey) return undefined;
    return getBacklogItemById(ticket.ticketKey);
  }, [ticket?.ticketKey]);

  const codeWorkTemplate = backlogItem?.codeWork;
  
  const codeWorkComplete = optimisticCodeWorkComplete ?? (gitState.codeWorkComplete || false);

  const codeExecutionAdapter = useMemo(() => {
    if (!codeWorkTemplate) return null;
    
    const codeChallenge = createCodeChallengeFromBacklog(
      codeWorkTemplate,
      backlogItem?.acceptanceCriteria || []
    );
    
    return getCodeExecutionAdapter({
      role: role as Role,
      level: level as Level,
      codeChallenge,
    });
  }, [codeWorkTemplate, backlogItem?.acceptanceCriteria, role, level]);

  // Sync editor mode from adapter config (respects adapter architecture)
  useEffect(() => {
    if (codeExecutionAdapter && useMonacoEditor === null) {
      const defaultMode = codeExecutionAdapter.ui.defaultEditorMode;
      setUseMonacoEditor(defaultMode === 'full');
    }
  }, [codeExecutionAdapter, useMonacoEditor]);

  // Computed value with fallback for rendering
  const isFullEditorMode = useMonacoEditor ?? (codeExecutionAdapter?.ui.defaultEditorMode === 'full') ?? true;
  
  const reviewPhaseLayout = adapter.uiControls.reviewPhaseLayout || {
    showGitTerminal: true,
    showTeamChat: true,
    showQuickActions: true,
    panelWidth: 'standard',
    terminalCollapsible: false,
  };
  
  const shouldShowTerminal = !isFullEditorMode && (isInReviewPhase 
    ? reviewPhaseLayout.showGitTerminal 
    : adapter.uiControls.showGitTerminal);
  
  const shouldShowTeamChat = !isFullEditorMode && (isInReviewPhase 
    ? reviewPhaseLayout.showTeamChat 
    : adapter.uiControls.showTeamChat);
  
  const shouldShowQuickActions = isInReviewPhase 
    ? reviewPhaseLayout.showQuickActions 
    : adapter.uiControls.allowShortcutButtons;
  
  const reviewPanelWidthClass = isInReviewPhase 
    ? reviewPhaseLayout.panelWidth === 'full' 
      ? 'max-w-none' 
      : reviewPhaseLayout.panelWidth === 'wide' 
        ? 'max-w-4xl' 
        : 'max-w-3xl'
    : '';

  const updateTicket = useMutation({
    mutationFn: async (updates: Partial<SprintTicket>) => {
      return apiRequest('PATCH', `/api/tickets/${ticketId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/sprints', sprintId, 'tickets'] });
    },
  });

  const moveTicket = useMutation({
    mutationFn: async (newStatus: string) => {
      return apiRequest('PATCH', `/api/tickets/${ticketId}/move`, { newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/sprints', sprintId, 'tickets'] });
    },
    onError: (error: any) => {
      const gate = error?.gate;
      
      if (gate === 'branch_required') {
        addTerminalLine('error', "Error: Create a branch first before starting work");
      } else if (gate === 'pr_required') {
        addTerminalLine('error', "Error: Submit a pull request before moving to review");
      } else {
        addTerminalLine('error', `Error: ${error?.message || 'Failed to update ticket status'}`);
      }
    }
  });

  const addTerminalLine = useCallback((type: TerminalLine['type'], content: string) => {
    setTerminalLines(prev => [...prev, {
      id: crypto.randomUUID(),
      type,
      content,
      timestamp: new Date(),
    }]);
  }, []);

  const handleTestResult = useCallback(async (result: ExecutionResponse) => {
    setLastTestResult(result);
    
    const passed = result.testResults.filter(t => t.passed).length;
    const failed = result.testResults.filter(t => !t.passed).length;
    const total = result.testResults.length;
    
    if (result.overallPass) {
      let output = `\nPASS  All tests passed!\n\n`;
      result.testResults.forEach(test => {
        output += `  ✓ ${test.testName} (${test.executionTimeMs || Math.floor(Math.random() * 10 + 2)}ms)\n`;
      });
      output += `\nTest Suites: 1 passed, 1 total\n`;
      output += `Tests:       ${passed} passed, ${total} total\n`;
      output += `Time:        ${(result.latencyMs / 1000).toFixed(3)}s`;
      addTerminalLine('success', output);
      addTerminalLine('hint', 'All tests passing! Now stage your changes with: git add .');
      
      if (!gitState.codeWorkComplete) {
        setOptimisticCodeWorkComplete(true);
        try {
          const newGitState: GitTicketState = {
            ...gitState,
            codeWorkComplete: true,
          };
          await apiRequest('PATCH', `/api/tickets/${ticketId}`, { gitState: newGitState });
          queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
        } catch (err) {
          setOptimisticCodeWorkComplete(null);
        }
      }
    } else {
      let output = `\nFAIL  Some tests failed\n\n`;
      result.testResults.forEach(test => {
        if (test.passed) {
          output += `  ✓ ${test.testName} (${test.executionTimeMs || Math.floor(Math.random() * 10 + 2)}ms)\n`;
        } else {
          output += `  ✕ ${test.testName} (${test.executionTimeMs || Math.floor(Math.random() * 15 + 5)}ms)\n`;
          if (test.explanation) {
            output += `    ${test.explanation}\n`;
          }
        }
      });
      output += `\nTest Suites: 1 failed, 1 total\n`;
      output += `Tests:       ${failed} failed, ${passed} passed, ${total} total`;
      addTerminalLine('error', output);
      
      if (result.feedback?.summary) {
        addTerminalLine('hint', `AI Feedback: ${result.feedback.summary}`);
      }
    }
  }, [addTerminalLine, gitState, ticketId]);

  const getNextGitStep = useCallback((): GitCommand | null => {
    if (!adapter.gitWorkflow.commands.length) return null;
    
    for (const cmd of adapter.gitWorkflow.commands) {
      if (cmd.id === 'branch' && !gitState.branchName) return cmd;
      if (cmd.id === 'add' && gitState.branchName && gitState.commits.length === 0) return cmd;
      if (cmd.id === 'commit' && gitState.branchName && gitState.commits.length === 0) return cmd;
      if (cmd.id === 'push' && gitState.commits.length > 0 && !gitState.isPushed) return cmd;
      if (cmd.id === 'pr' && gitState.isPushed && !gitState.prCreated) return cmd;
    }
    return null;
  }, [adapter.gitWorkflow.commands, gitState]);

  const processGitCommand = useCallback((command: string) => {
    const cmd = command.trim().toLowerCase();
    
    if (cmd === 'help' || cmd === 'git help') {
      addTerminalLine('output', `Available commands:
  git checkout -b <branch>   Create and switch to new branch
  npm test                   Run tests to verify your fix
  git add .                  Stage all changes
  git commit -m "<msg>"      Commit staged changes
  git push -u origin <branch> Push branch to remote
  gh pr create               Create a pull request
  
  clear                      Clear terminal
  status                     Show current git state`);
      return;
    }
    
    if (cmd === 'clear') {
      setTerminalLines([]);
      return;
    }

    if (cmd === 'npm test' || cmd === 'npm run test' || cmd === 'yarn test') {
      if (!gitState.branchName) {
        addTerminalLine('error', "You need to create a feature branch first before running tests.");
        return;
      }
      
      addTerminalLine('output', '\n> Running tests...\n');
      
      if (isFullEditorMode && codeExecutionAdapter) {
        setTriggerExternalTests(true);
        addTerminalLine('info', 'Analyzing your code with AI...');
      } else {
        setTimeout(() => {
          if (!codeWorkComplete) {
            const defaultFailingOutput = `FAIL  src/utils/dateUtils.test.ts
  ✕ formatTransactionDate should use user timezone (12ms)
  ✕ formatTimestamp should respect locale settings (8ms)

Test Suites: 1 failed, 1 total
Tests:       2 failed, 0 passed, 2 total`;
            const failingOutput = codeWorkTemplate?.testOutput?.failing || defaultFailingOutput;
            addTerminalLine('error', failingOutput);
            addTerminalLine('hint', 'The tests are failing because the bug hasn\'t been fixed yet. Review and apply the fix in the Code Work panel above, then run npm test again.');
          } else {
            const defaultTestOutput = `PASS  src/utils/dateUtils.test.ts
  ✓ formatTransactionDate should use user timezone (5ms)
  ✓ formatTimestamp should respect locale settings (3ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Time:        0.842s`;
            const testOutput = codeWorkTemplate?.testOutput?.passing || defaultTestOutput;
            addTerminalLine('success', testOutput);
            addTerminalLine('hint', 'All tests passing! Now stage your changes with: git add .');
          }
        }, 1500);
      }
      return;
    }
    
    if (cmd === 'status' || cmd === 'git status') {
      const branchInfo = gitState.branchName 
        ? `On branch ${gitState.branchName}`
        : 'On branch main';
      const changesInfo = gitState.commits.length > 0
        ? `${gitState.commits.length} commit(s) ready to push`
        : 'No changes staged';
      const pushInfo = gitState.isPushed
        ? 'Branch is up to date with remote'
        : 'Branch has not been pushed';
      
      addTerminalLine('output', `${branchInfo}\n${changesInfo}\n${pushInfo}`);
      return;
    }

    const branchCommands = adapter.gitWorkflow.commands.find(c => c.id === 'branch');
    if (branchCommands && branchCommands.validPatterns.some(p => p.test(cmd))) {
      if (gitState.branchName) {
        addTerminalLine('error', `fatal: A branch named already exists.`);
        return;
      }
      
      const branchMatch = cmd.match(/git\s+checkout\s+-b\s+(\S+)/i) || cmd.match(/git\s+switch\s+-c\s+(\S+)/i);
      const branchName = branchMatch ? branchMatch[1] : `feature/${ticket?.ticketKey?.toLowerCase()}-fix`;
      
      // Use actual branch name from user's command in the success message
      addTerminalLine('success', `Switched to a new branch '${branchName}'`);
      
      const newGitState: GitTicketState = {
        ...gitState,
        branchName,
        branchCreatedAt: new Date().toISOString(),
      };
      
      updateTicket.mutate({ 
        gitState: newGitState,
        status: 'in_progress',
      });
      
      setTimeout(() => {
        addTerminalLine('hint', `Branch created. Next step: Make your code changes, then run 'git add .' to stage them.`);
      }, 500);
      return;
    }

    const addCommands = adapter.gitWorkflow.commands.find(c => c.id === 'add');
    if (addCommands && addCommands.validPatterns.some(p => p.test(cmd))) {
      if (!gitState.branchName) {
        addTerminalLine('error', "You need to create a feature branch first. Try: git checkout -b feature/tick-001-fix");
        return;
      }
      
      if (isCodeWorkSaving) {
        addTerminalLine('error', "Please wait while code work progress is being saved...");
        return;
      }
      
      if (isFullEditorMode && codeExecutionAdapter) {
        if (!lastTestResult) {
          addTerminalLine('error', "Run tests first before staging. Use: npm test");
          addTerminalLine('hint', "Tests verify your code is correct before you commit.");
          return;
        }
        if (!lastTestResult.overallPass) {
          addTerminalLine('error', "Tests are failing. Fix your code and run npm test again before staging.");
          return;
        }
      } else if (adapter.codeWorkConfig.enabled && 
          adapter.codeWorkConfig.requireCompletionBeforeStage && 
          codeWorkTemplate && 
          !codeWorkComplete) {
        addTerminalLine('error', "Complete the code work first before staging. Review and apply the fix in the Code Work panel.");
        addTerminalLine('hint', "Use the Code Work panel to understand the bug and apply the fix, then mark it complete.");
        return;
      }
      
      addTerminalLine('success', "Changes staged for commit.");
      
      setTimeout(() => {
        addTerminalLine('hint', `Files staged. Now commit your changes with: git commit -m "fix: description of changes"`);
      }, 300);
      return;
    }

    const commitCommands = adapter.gitWorkflow.commands.find(c => c.id === 'commit');
    if (commitCommands && commitCommands.validPatterns.some(p => p.test(cmd))) {
      if (!gitState.branchName) {
        addTerminalLine('error', "You need to create a feature branch first. Try: git checkout -b feature/tick-001-fix");
        return;
      }
      
      const msgMatch = cmd.match(/git\s+commit\s+-m\s+["']([^"']+)["']/i);
      const commitMsg = msgMatch ? msgMatch[1] : "Fix ticket implementation";
      
      const output = typeof commitCommands.successOutput === 'function'
        ? commitCommands.successOutput(ticket?.ticketKey || 'TICK-001')
        : commitCommands.successOutput;
      
      addTerminalLine('success', output);
      
      const newGitState: GitTicketState = {
        ...gitState,
        commits: [
          ...gitState.commits,
          {
            hash: Math.random().toString(36).substring(2, 9),
            message: commitMsg,
            timestamp: new Date().toISOString(),
          }
        ],
      };
      
      updateTicket.mutate({ gitState: newGitState });
      
      setTimeout(() => {
        addTerminalLine('hint', `Commit saved. Push your branch with: git push -u origin ${gitState.branchName}`);
      }, 500);
      return;
    }

    const pushCommands = adapter.gitWorkflow.commands.find(c => c.id === 'push');
    if (pushCommands && pushCommands.validPatterns.some(p => p.test(cmd))) {
      if (!gitState.branchName) {
        addTerminalLine('error', "You need to create a feature branch first.");
        return;
      }
      if (gitState.commits.length === 0) {
        addTerminalLine('error', "Nothing to push. Stage and commit your changes first.");
        return;
      }
      
      const output = typeof pushCommands.successOutput === 'function'
        ? pushCommands.successOutput(ticket?.ticketKey || 'TICK-001')
        : pushCommands.successOutput;
      
      const formattedOutput = output
        .replace(/\$\{ticketId\.toLowerCase\(\)\}/g, (ticket?.ticketKey || 'tick-001').toLowerCase())
        .replace(/\$\{branchName\}/g, gitState.branchName || 'feature-branch')
        .replace(/feature\/[a-z0-9-]+/gi, gitState.branchName || 'feature-branch');
      
      addTerminalLine('success', formattedOutput);
      
      const newGitState: GitTicketState = {
        ...gitState,
        isPushed: true,
      };
      
      updateTicket.mutate({ gitState: newGitState });
      
      setTimeout(() => {
        addTerminalLine('hint', `Branch pushed. Create a pull request with: gh pr create --title "Title" --body "Description"`);
      }, 500);
      return;
    }

    const prCommands = adapter.gitWorkflow.commands.find(c => c.id === 'pr');
    if (prCommands && prCommands.validPatterns.some(p => p.test(cmd))) {
      if (!gitState.isPushed) {
        addTerminalLine('error', "Push your branch first before creating a PR.");
        return;
      }
      if (gitState.prCreated) {
        addTerminalLine('output', "Pull request already exists.");
        return;
      }
      
      const output = typeof prCommands.successOutput === 'function'
        ? prCommands.successOutput(ticket?.ticketKey || 'TICK-001')
        : prCommands.successOutput;
      
      addTerminalLine('success', output);
      
      const newGitState: GitTicketState = {
        ...gitState,
        prCreated: true,
      };
      
      updateTicket.mutate({ 
        gitState: newGitState,
        status: 'in_review',
      });
      
      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          id: Date.now().toString(),
          from: 'Alex',
          role: 'QA Engineer',
          content: "I'll take a look at your PR now. Give me a few minutes to review the changes.",
          color: 'bg-teal-500',
          timestamp: new Date(),
        }]);
      }, 1000);
      return;
    }

    addTerminalLine('error', `Command not recognized: ${command}\nType 'help' for available commands.`);
  }, [adapter.gitWorkflow.commands, gitState, ticket?.ticketKey, addTerminalLine, updateTicket]);

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCommand.trim()) return;
    
    addTerminalLine('command', `$ ${currentCommand}`);
    setCommandHistory(prev => [...prev, currentCommand]);
    setHistoryIndex(-1);
    
    processGitCommand(currentCommand);
    setCurrentCommand('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex] || '');
      } else {
        setHistoryIndex(-1);
        setCurrentCommand('');
      }
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      from: 'You',
      role: 'Developer',
      content: chatInput,
      color: 'bg-blue-500',
      timestamp: new Date(),
      isUser: true,
    }]);
    
    setChatInput('');

    setTimeout(() => {
      const responses = [
        { from: 'Marcus', role: 'Senior Developer', content: "Good question! Let me think about that...", color: 'bg-amber-500' },
        { from: 'Sarah', role: 'Tech Lead', content: "I can help with that. Check the utils folder for similar patterns.", color: 'bg-purple-500' },
        { from: 'Priya', role: 'Product Manager', content: "Just checking in - how's progress on the ticket?", color: 'bg-indigo-500' },
      ];
      const response = responses[Math.floor(Math.random() * responses.length)];
      
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        ...response,
        timestamp: new Date(),
      }]);
    }, 1500);
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  useEffect(() => {
    if (ticket && terminalLines.length === 0) {
      addTerminalLine('output', `Welcome to ${companyName} Development Environment`);
      addTerminalLine('output', `Working on: ${ticket.ticketKey} - ${ticket.title}`);
      addTerminalLine('hint', `Type 'help' for available commands, or 'status' to see current state.`);
      
      const nextStep = getNextGitStep();
      if (nextStep) {
        setTimeout(() => {
          addTerminalLine('hint', `Next step: ${nextStep.instruction}`);
          if (adapter.uiControls.showMentorHints && nextStep.hint) {
            addTerminalLine('hint', `Hint: ${nextStep.hint}`);
          }
        }, 500);
      }
    }
  }, [ticket, terminalLines.length, companyName, addTerminalLine, getNextGitStep, adapter.uiControls.showMentorHints]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Failed to load ticket</h3>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  const Icon = getTypeIcon(ticket.type);
  const acceptanceCriteria = Array.isArray(ticket.acceptanceCriteria) ? ticket.acceptanceCriteria : [];
  const nextStep = getNextGitStep();

  const layoutConfig = adapter.uiControls.layout;
  const sidebarWidthClass = layoutConfig.sidebarWidth === 'narrow' ? 'w-72' : layoutConfig.sidebarWidth === 'wide' ? 'w-96' : 'w-80';

  return (
    <div className="h-screen flex flex-col bg-background" data-testid="ticket-workspace">
      <header className="border-b px-4 py-3 flex items-center justify-between bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} data-testid="button-back-to-board">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Board
          </Button>
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-2">
            <Badge variant="outline" className="font-mono">{ticket.ticketKey}</Badge>
            <Badge className={getTypeColor(ticket.type)} variant="secondary">
              <Icon className="h-3 w-3 mr-1" />
              {ticket.type}
            </Badge>
            <Badge variant="secondary" className="capitalize">{ticket.status?.replace('_', ' ')}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden sm:inline-flex">{ticket.storyPoints} pts</Badge>
          <Badge variant="outline" className="capitalize">{ticket.priority}</Badge>
        </div>
      </header>

      <div className={cn(
        "flex-1 flex overflow-hidden",
        layoutConfig.mode === 'two-column' && "flex-col lg:flex-row"
      )}>
        <aside className={cn(
          "overflow-y-auto bg-muted/20",
          sidebarWidthClass,
          "hidden lg:block",
          layoutConfig.sidebarPosition === 'left' ? "border-r order-first" : "border-l order-last"
        )}>
          <div className="p-4 space-y-4">
            <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded-lg">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Details
                </h3>
                {isDetailsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <h4 className="font-medium mb-2">{ticket.title}</h4>
                  <p className="text-sm text-muted-foreground">{ticket.description}</p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {acceptanceCriteria.length > 0 && (
              <Collapsible open={isAcceptanceOpen} onOpenChange={setIsAcceptanceOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded-lg">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Acceptance Criteria
                  </h3>
                  {isAcceptanceOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <ul className="space-y-2 p-3 bg-muted/30 rounded-lg">
                    {acceptanceCriteria.map((criterion, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <div className="h-4 w-4 rounded border border-muted-foreground/30 mt-0.5 flex-shrink-0" />
                        {String(criterion)}
                      </li>
                    ))}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            )}

            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2 p-2">
                <GitBranch className="h-4 w-4" />
                Git Progress
              </h3>
              <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  {gitState.branchName ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span className={gitState.branchName ? '' : 'text-muted-foreground'}>Create branch</span>
                </div>
                {adapter.codeWorkConfig.enabled && codeWorkTemplate && (
                  <div className="flex items-center gap-2 text-sm">
                    {codeWorkComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-amber-500" />
                    )}
                    <span className={codeWorkComplete ? '' : 'text-amber-600 dark:text-amber-400 font-medium'}>
                      Complete code work
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  {gitState.commits.length > 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span className={gitState.commits.length > 0 ? '' : 'text-muted-foreground'}>Commit changes</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {gitState.isPushed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span className={gitState.isPushed ? '' : 'text-muted-foreground'}>Push to remote</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {gitState.prCreated ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span className={gitState.prCreated ? '' : 'text-muted-foreground'}>Open PR</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {gitState.prApproved ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : gitState.prCreated && !gitState.isMerged ? (
                    <div className="h-4 w-4 rounded-full border-2 border-purple-500 animate-pulse" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span className={cn(
                    gitState.prApproved ? '' : 'text-muted-foreground',
                    gitState.prCreated && !gitState.prApproved && !gitState.isMerged && 'text-purple-600 dark:text-purple-400 font-medium'
                  )}>
                    {gitState.prCreated && !gitState.prApproved && !gitState.isMerged ? 'Review in progress' : 'PR Approved'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {gitState.isMerged ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span className={gitState.isMerged ? '' : 'text-muted-foreground'}>Merged</span>
                </div>
              </div>
            </div>

            {adapter.uiControls.showMentorHints && nextStep && (
              <Card className="bg-purple-50/50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-purple-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">Next Step</p>
                      <p className="text-sm text-muted-foreground">{nextStep.instruction}</p>
                      {nextStep.hint && (
                        <code className="text-xs bg-muted px-2 py-1 rounded mt-1 block">{nextStep.hint}</code>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {shouldShowQuickActions && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm p-2">Quick Actions</h3>
                {!gitState.branchName && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      const cmd = `git checkout -b feature/${ticket.ticketKey.toLowerCase()}-fix`;
                      addTerminalLine('command', `$ ${cmd}`);
                      processGitCommand(cmd);
                    }}
                    data-testid="button-quick-branch"
                  >
                    <GitBranch className="h-4 w-4 mr-2" />
                    Create Branch
                  </Button>
                )}
                {gitState.branchName && gitState.commits.length === 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        const cmd = `git add .`;
                        addTerminalLine('command', `$ ${cmd}`);
                        processGitCommand(cmd);
                      }}
                      data-testid="button-quick-add"
                    >
                      <ArrowUp className="h-4 w-4 mr-2" />
                      Stage Changes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        const cmd = `git commit -m "fix: ${ticket.title}"`;
                        addTerminalLine('command', `$ ${cmd}`);
                        processGitCommand(cmd);
                      }}
                      data-testid="button-quick-commit"
                    >
                      <GitCommit className="h-4 w-4 mr-2" />
                      Commit Changes
                    </Button>
                  </>
                )}
                {gitState.commits.length > 0 && !gitState.isPushed && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      const cmd = `git push -u origin ${gitState.branchName}`;
                      addTerminalLine('command', `$ ${cmd}`);
                      processGitCommand(cmd);
                    }}
                    data-testid="button-quick-push"
                  >
                    <ArrowUp className="h-4 w-4 mr-2" />
                    Push to Remote
                  </Button>
                )}
                {gitState.isPushed && !gitState.prCreated && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      const cmd = `gh pr create --title "Fix: ${ticket.title}" --body "Resolves ${ticket.ticketKey}"`;
                      addTerminalLine('command', `$ ${cmd}`);
                      processGitCommand(cmd);
                    }}
                    data-testid="button-quick-pr"
                  >
                    <GitPullRequest className="h-4 w-4 mr-2" />
                    Create Pull Request
                  </Button>
                )}
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col">
          {adapter.codeWorkConfig.enabled && codeWorkTemplate && !gitState.branchName && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Pre-branch terminal view - uses adapter's gitWorkflow for instructions */}
              <div className="flex-1 flex flex-col bg-gray-900">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
                  <div className="flex items-center gap-2 text-white">
                    <Terminal className="h-4 w-4" />
                    <span className="text-sm font-medium">Terminal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-amber-400 border-amber-400/50 text-xs">
                      Step 1: {adapter.gitWorkflow.commands.find(c => c.id === 'branch')?.instruction || 'Create branch'}
                    </Badge>
                  </div>
                </div>
                
                {/* Instruction banner from adapter */}
                <div className="px-4 py-3 bg-amber-900/30 border-b border-amber-700/50">
                  <p className="text-amber-200 text-sm">
                    {adapter.gitWorkflow.commands.find(c => c.id === 'branch')?.hint || 'Use git checkout -b with a descriptive branch name'}
                  </p>
                  <code className="text-green-400 text-sm font-mono mt-1 block">
                    git checkout -b feature/{ticket.ticketKey.toLowerCase()}-fix
                  </code>
                </div>
                
                <div 
                  ref={terminalRef}
                  className="flex-1 p-4 font-mono text-sm overflow-y-auto"
                  onClick={() => terminalInputRef.current?.focus()}
                >
                  {terminalLines.map((line) => (
                    <div
                      key={line.id}
                      className={cn(
                        "whitespace-pre-wrap mb-1",
                        line.type === 'command' && "text-green-400",
                        line.type === 'output' && "text-gray-300",
                        line.type === 'error' && "text-red-400",
                        line.type === 'hint' && "text-yellow-400",
                        line.type === 'success' && "text-green-300"
                      )}
                    >
                      {line.content}
                    </div>
                  ))}
                  <form onSubmit={handleTerminalSubmit} className="flex items-center mt-2">
                    <span className="text-green-400 mr-2">$</span>
                    <input
                      ref={terminalInputRef}
                      type="text"
                      value={currentCommand}
                      onChange={(e) => setCurrentCommand(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1 bg-transparent text-white outline-none"
                      placeholder="Type git checkout -b feature/..."
                      autoFocus
                      data-testid="input-terminal-prebranch"
                    />
                  </form>
                </div>
              </div>
            </div>
          )}
          
          {adapter.codeWorkConfig.enabled && codeWorkTemplate && gitState.branchName && 
           (!codeWorkComplete || (isFullEditorMode && !gitState.prCreated)) && (
            <div className={cn(
              "border-b",
              isFullEditorMode ? "flex-1 overflow-hidden" : "p-4 bg-amber-50/30 dark:bg-amber-950/10"
            )}>
              <div className="flex items-center justify-end gap-2 px-4 py-2 border-b bg-muted/20">
                <span className="text-xs text-muted-foreground mr-2">Editor Mode:</span>
                <Button
                  size="sm"
                  variant={!isFullEditorMode ? "secondary" : "ghost"}
                  className="h-7 text-xs"
                  onClick={() => setUseMonacoEditor(false)}
                  data-testid="button-simple-mode"
                >
                  Simple
                </Button>
                <Button
                  size="sm"
                  variant={isFullEditorMode ? "secondary" : "ghost"}
                  className="h-7 text-xs"
                  onClick={() => setUseMonacoEditor(true)}
                  data-testid="button-monaco-mode"
                >
                  Full Editor
                </Button>
              </div>
              
              {!isFullEditorMode ? (
                <div className="p-4">
                  <CodeWorkPanel
                    codeWorkConfig={adapter.codeWorkConfig}
                    codeWorkTemplate={codeWorkTemplate}
                    ticketTitle={ticket?.title || ''}
                    ticketType={ticket?.type || 'bug'}
                    onComplete={async () => {
                      setOptimisticCodeWorkComplete(true);
                      setIsCodeWorkSaving(true);
                      
                      try {
                        const newGitState: GitTicketState = {
                          ...gitState,
                          codeWorkComplete: true,
                        };
                        await apiRequest('PATCH', `/api/tickets/${ticketId}`, { gitState: newGitState });
                        queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
                        queryClient.invalidateQueries({ queryKey: ['/api/sprints', sprintId, 'tickets'] });
                        
                        addTerminalLine('success', 'Code work completed! Run "npm test" to verify your fix, then stage with: git add .');
                        toast({
                          title: "Code work complete",
                          description: "Run npm test to verify, then stage and commit your changes.",
                        });
                      } catch (err) {
                        setOptimisticCodeWorkComplete(null);
                        addTerminalLine('error', 'Failed to save code work progress. Please try again.');
                        toast({
                          title: "Error",
                          description: "Failed to save code work progress.",
                          variant: "destructive",
                        });
                      } finally {
                        setIsCodeWorkSaving(false);
                      }
                    }}
                    isComplete={codeWorkComplete}
                    isSaving={isCodeWorkSaving}
                  />
                </div>
              ) : codeExecutionAdapter && (
                <div className="flex-1 h-full min-h-[600px]">
                  <CodeEditorPanel
                    adapter={codeExecutionAdapter}
                    ticketId={ticket?.ticketKey || String(ticketId)}
                    terminalLines={terminalLines.map(line => ({
                      type: line.type === 'command' ? 'input' : line.type as 'output' | 'error' | 'success' | 'info',
                      content: line.content,
                      timestamp: line.timestamp,
                    }))}
                    onTerminalCommand={(cmd) => {
                      addTerminalLine('command', `$ ${cmd}`);
                      processGitCommand(cmd);
                    }}
                    chatMessages={chatMessages.map(msg => ({
                      id: msg.id,
                      sender: msg.from,
                      senderRole: msg.role,
                      content: msg.content,
                      timestamp: msg.timestamp,
                      isUser: msg.from === 'You',
                    }))}
                    onSendChat={(message) => {
                      setChatMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        from: 'You',
                        role: 'Developer',
                        content: message,
                        color: 'bg-blue-500',
                        timestamp: new Date(),
                      }]);
                    }}
                    onSubmit={async (files, result) => {
                      if (result.overallPass) {
                        setOptimisticCodeWorkComplete(true);
                        setIsCodeWorkSaving(true);
                        
                        try {
                          const newGitState: GitTicketState = {
                            ...gitState,
                            codeWorkComplete: true,
                          };
                          await apiRequest('PATCH', `/api/tickets/${ticketId}`, { gitState: newGitState });
                          queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
                          queryClient.invalidateQueries({ queryKey: ['/api/sprints', sprintId, 'tickets'] });
                          
                          addTerminalLine('success', 'All tests passed! Code submitted successfully.');
                          toast({
                            title: "Code submitted",
                            description: "All tests passed. Your code has been submitted.",
                          });
                        } catch (err) {
                          setOptimisticCodeWorkComplete(null);
                          addTerminalLine('error', 'Failed to save code work progress. Please try again.');
                        } finally {
                          setIsCodeWorkSaving(false);
                        }
                      }
                    }}
                    externalRunTests={triggerExternalTests}
                    onExternalRunTestsComplete={() => setTriggerExternalTests(false)}
                    onTestResult={handleTestResult}
                    hideSubmitButton={true}
                  />
                </div>
              )}
            </div>
          )}

          {showCodeDuringReview && gitState.prCreated && !gitState.isMerged && codeExecutionAdapter && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b bg-amber-100 dark:bg-amber-900/30">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Addressing Review Feedback
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCodeDuringReview(false)}
                  className="h-7 text-xs"
                  data-testid="button-back-to-pr"
                >
                  <ArrowLeft className="h-3 w-3 mr-1" />
                  Back to PR Review
                </Button>
              </div>
              <div className="flex-1 h-full min-h-[600px]">
                <CodeEditorPanel
                  adapter={codeExecutionAdapter}
                  ticketId={ticket?.ticketKey || String(ticketId)}
                  terminalLines={terminalLines.map(line => ({
                    type: line.type === 'command' ? 'input' : line.type as 'output' | 'error' | 'success' | 'info',
                    content: line.content,
                    timestamp: line.timestamp,
                  }))}
                  onTerminalCommand={(cmd) => {
                    addTerminalLine('command', `$ ${cmd}`);
                    processGitCommand(cmd);
                  }}
                  chatMessages={chatMessages.map(msg => ({
                    id: msg.id,
                    sender: msg.from,
                    senderRole: msg.role,
                    content: msg.content,
                    timestamp: msg.timestamp,
                    isUser: msg.from === 'You',
                  }))}
                  onSendChat={(message) => {
                    setChatMessages(prev => [...prev, {
                      id: Date.now().toString(),
                      from: 'You',
                      role: 'Developer',
                      content: message,
                      color: 'bg-blue-500',
                      timestamp: new Date(),
                    }]);
                  }}
                  onSubmit={async (files, result) => {
                    if (result.overallPass) {
                      addTerminalLine('success', 'Tests passed! You can now go back to PR review and request re-review.');
                      toast({
                        title: "Tests passed",
                        description: "Go back to PR review and request re-review from your team.",
                      });
                    }
                  }}
                  externalRunTests={triggerExternalTests}
                  onExternalRunTestsComplete={() => setTriggerExternalTests(false)}
                  onTestResult={handleTestResult}
                  hideSubmitButton={true}
                />
              </div>
            </div>
          )}

          {adapter.prReviewConfig.enabled && gitState.prCreated && !gitState.isMerged && !showCodeDuringReview && (
            <div className={cn(
              "p-4 bg-purple-50/30 dark:bg-purple-950/10",
              !shouldShowTerminal && !shouldShowTeamChat && "flex-1 overflow-auto",
              (shouldShowTerminal || shouldShowTeamChat) && "border-b",
              reviewPanelWidthClass
            )}>
              <PRReviewPanel
                prReviewConfig={adapter.prReviewConfig}
                ticketKey={ticket.ticketKey}
                ticketTitle={ticket.title}
                ticketType={ticket.type as 'bug' | 'feature' | 'improvement' | 'task' | undefined}
                ticketDescription={ticket.description}
                branchName={gitState.branchName || ''}
                commits={gitState.commits}
                onThreadResolve={(threadId) => {
                  addTerminalLine('output', `Thread ${threadId} marked as resolved`);
                }}
                onCommentSubmit={(threadId, content) => {
                  addTerminalLine('output', `Replied to review thread`);
                }}
                onRequestReReview={() => {
                  addTerminalLine('output', 'Re-review requested from reviewers...');
                  setChatMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    from: 'Alex',
                    role: 'QA Engineer',
                    content: "I'll take another look at your changes. Give me a moment.",
                    color: 'bg-teal-500',
                    timestamp: new Date(),
                  }]);
                }}
                onReturnToCode={() => {
                  setShowCodeDuringReview(true);
                  addTerminalLine('info', 'Returning to code editor to address review feedback...');
                }}
                onMerge={() => {
                  addTerminalLine('success', `
✓ Pull request merged successfully!
  Branch ${gitState.branchName} merged into main.
  
  Cleaning up...
  ✓ Deleted branch ${gitState.branchName}
  ✓ Updated local main branch
                  `);
                  
                  const newGitState: GitTicketState = {
                    ...gitState,
                    prApproved: true,
                    isMerged: true,
                  };
                  
                  updateTicket.mutate({ 
                    gitState: newGitState,
                    status: 'done',
                  });
                  
                  toast({
                    title: "PR Merged!",
                    description: "Your changes have been merged into main. Great work!",
                  });
                  
                  setChatMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    from: 'Sarah',
                    role: 'Tech Lead',
                    content: "Nice work! Your PR has been merged. This ticket is now complete. 🎉",
                    color: 'bg-purple-500',
                    timestamp: new Date(),
                  }]);
                }}
              />
            </div>
          )}

          {shouldShowTerminal && (
            <div className="flex-1 flex flex-col border-b">
              <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-900 text-white">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  <span className="text-sm font-medium">Terminal</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-white hover:text-white hover:bg-gray-800"
                  onClick={() => setTerminalLines([])}
                >
                  Clear
                </Button>
              </div>
              <div 
                ref={terminalRef}
                className="flex-1 bg-gray-900 p-4 font-mono text-sm overflow-y-auto min-h-[200px]"
                onClick={() => terminalInputRef.current?.focus()}
              >
                {terminalLines.map((line) => (
                  <div
                    key={line.id}
                    className={cn(
                      "whitespace-pre-wrap mb-1",
                      line.type === 'command' && "text-green-400",
                      line.type === 'output' && "text-gray-300",
                      line.type === 'error' && "text-red-400",
                      line.type === 'hint' && "text-yellow-400",
                      line.type === 'success' && "text-green-300"
                    )}
                  >
                    {line.content}
                  </div>
                ))}
                <form onSubmit={handleTerminalSubmit} className="flex items-center mt-2">
                  <span className="text-green-400 mr-2">$</span>
                  <input
                    ref={terminalInputRef}
                    type="text"
                    value={currentCommand}
                    onChange={(e) => setCurrentCommand(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent text-white outline-none"
                    placeholder="Type a command..."
                    autoFocus
                    data-testid="input-terminal"
                  />
                </form>
              </div>
            </div>
          )}

          {shouldShowTeamChat && (
            <div className="h-64 flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm font-medium">Team Chat</span>
                </div>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={cn("flex gap-2", msg.isUser && "justify-end")}>
                      {!msg.isUser && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={cn("text-white text-xs", msg.color)}>
                            {msg.from[0]}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={cn(
                        "p-2 rounded-lg max-w-[80%]",
                        msg.isUser ? "bg-blue-500 text-white" : "bg-muted"
                      )}>
                        {!msg.isUser && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">{msg.from}</span>
                            <Badge variant="outline" className="text-xs">{msg.role}</Badge>
                          </div>
                        )}
                        <p className="text-sm">{msg.content}</p>
                      </div>
                      {msg.isUser && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-500 text-white text-xs">Y</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <form onSubmit={handleChatSubmit} className="flex gap-2 p-2 border-t">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask your team for help..."
                  className="flex-1"
                  data-testid="input-chat"
                />
                <Button type="submit" size="sm" data-testid="button-send-chat">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
