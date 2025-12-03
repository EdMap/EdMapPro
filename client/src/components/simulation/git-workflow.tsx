import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  GitMerge,
  Terminal,
  Lightbulb,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  ChevronRight,
  Info,
  Loader2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  createInitialState,
  simulateGitCommand,
  parseGitCommand,
  getBranchNamingTips,
  getCommitMessageTips,
  suggestBranchName,
  suggestCommitMessage,
  type GitState,
  type GitCommandResult,
} from "@/lib/git-simulator";
import type { SprintTicket } from "@shared/schema";

interface GitWorkflowProps {
  ticket: SprintTicket;
  gitState: GitState;
  onStateChange: (newState: GitState) => void;
  onBranchCreate?: (branchName: string) => void;
  onCommit?: (message: string) => void;
  onPRCreate?: () => void;
  onMerge?: () => void;
  mode: 'journey' | 'practice';
}

interface CommandHistoryEntry {
  command: string;
  output: string;
  isError: boolean;
  timestamp: Date;
}

export default function GitWorkflow({
  ticket,
  gitState,
  onStateChange,
  onBranchCreate,
  onCommit,
  onPRCreate,
  onMerge,
  mode
}: GitWorkflowProps) {
  const [currentState, setCurrentState] = useState<GitState>(gitState);
  const [currentInput, setCurrentInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<CommandHistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showTips, setShowTips] = useState(true);
  const [isPRLoading, setIsPRLoading] = useState(false);
  const [isMergeLoading, setIsMergeLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [commandHistory]);

  const executeCommand = (commandInput: string) => {
    if (!commandInput.trim()) return;

    const parsed = parseGitCommand(commandInput);
    
    if (!parsed.command) {
      setCommandHistory(prev => [...prev, {
        command: commandInput,
        output: 'Error: Not a valid git command. Commands must start with "git".',
        isError: true,
        timestamp: new Date(),
      }]);
      setCurrentInput("");
      inputRef.current?.focus();
      return;
    }

    try {
      const result = simulateGitCommand(currentState, parsed.command, parsed.args);
      
      setCommandHistory(prev => [...prev, {
        command: commandInput,
        output: result.output,
        isError: !result.success,
        timestamp: new Date(),
      }]);

      if (result.success && result.stateChange) {
        const newState = { ...currentState, ...result.stateChange };
        setCurrentState(newState);
        onStateChange(newState);

        if (commandInput.startsWith('git checkout -b') || commandInput.startsWith('git switch -c')) {
          const branchMatch = commandInput.match(/(?:checkout -b|switch -c)\s+(\S+)/);
          if (branchMatch && onBranchCreate) {
            onBranchCreate(branchMatch[1]);
          }
        } else if (commandInput.startsWith('git commit')) {
          if (onCommit) {
            const messageMatch = commandInput.match(/-m\s+["'](.+?)["']/);
            onCommit(messageMatch ? messageMatch[1] : 'Commit');
          }
        }
      }
    } catch (error) {
      setCommandHistory(prev => [...prev, {
        command: commandInput,
        output: `Error: An unexpected error occurred while processing the command.`,
        isError: true,
        timestamp: new Date(),
      }]);
    }

    setCurrentInput("");
    setHistoryIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(currentInput);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const commands = commandHistory.map(h => h.command);
      if (historyIndex < commands.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCurrentInput(commands[commands.length - 1 - newIndex] || "");
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        const commands = commandHistory.map(h => h.command);
        setCurrentInput(commands[commands.length - 1 - newIndex] || "");
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentInput("");
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const suggestions = getAutocompleteSuggestions(currentInput);
      if (suggestions.length === 1) {
        setCurrentInput(suggestions[0]);
      }
    }
  };

  const getAutocompleteSuggestions = (input: string): string[] => {
    const commands = [
      'git status',
      'git add .',
      'git add',
      'git commit -m ""',
      'git checkout -b',
      'git checkout main',
      'git switch -c',
      'git switch main',
      'git push origin',
      'git pull origin main',
      'git branch',
      'git log --oneline',
      'git diff',
      'git stash',
      'git stash pop',
    ];

    if (!input) return [];
    return commands.filter(cmd => cmd.startsWith(input));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleCreatePR = async () => {
    setIsPRLoading(true);
    try {
      const prTitle = `${ticket.type === 'bug' ? 'Fix' : 'Feature'}: ${ticket.title}`;
      const newState: GitState = {
        ...currentState,
        remoteSyncStatus: 'synced',
      };
      setCurrentState(newState);
      onStateChange(newState);
      if (onPRCreate) onPRCreate();
      
      setCommandHistory(prev => [...prev, {
        command: `[PR Created: "${prTitle}"]`,
        output: `Pull request created successfully!\nTitle: ${prTitle}\nBranch: ${currentState.currentBranch} → main`,
        isError: false,
        timestamp: new Date(),
      }]);
    } finally {
      setIsPRLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleMergePR = async () => {
    setIsMergeLoading(true);
    try {
      const newState: GitState = {
        ...currentState,
        currentBranch: 'main',
        remoteSyncStatus: 'synced',
      };
      setCurrentState(newState);
      onStateChange(newState);
      if (onMerge) onMerge();
      
      setCommandHistory(prev => [...prev, {
        command: '[PR Merged]',
        output: `Pull request merged successfully!\nBranch ${currentState.currentBranch} merged into main.`,
        isError: false,
        timestamp: new Date(),
      }]);
    } finally {
      setIsMergeLoading(false);
      inputRef.current?.focus();
    }
  };

  const branchTips = getBranchNamingTips();
  const commitTips = getCommitMessageTips();

  const currentBranchCommits = currentState.branches.find(b => b.name === currentState.currentBranch)?.commits?.length ?? 0;
  const hasCommits = currentBranchCommits > 0;
  const isPushed = currentState.remoteSyncStatus === 'synced' && currentState.currentBranch !== 'main';
  
  const workflowStatus = {
    branch: currentState.currentBranch !== 'main',
    hasChanges: currentState.stagedFiles.length > 0 || currentState.modifiedFiles.length > 0,
    committed: hasCommits,
    pushed: isPushed,
    prReady: isPushed && commandHistory.some(h => h.command.includes('[PR Created')),
    merged: commandHistory.some(h => h.command.includes('[PR Merged]')),
  };

  const suggestedBranch = suggestBranchName(ticket.ticketKey, ticket.title, ticket.type);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Git Terminal
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTips(!showTips)}
              data-testid="button-toggle-tips"
            >
              <Lightbulb className={`h-4 w-4 ${showTips ? 'text-yellow-500' : 'text-gray-400'}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <GitBranch className="h-4 w-4 text-purple-500" />
              <span className="font-mono">{currentState.currentBranch}</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <WorkflowStatus status={workflowStatus} />
          </div>

          <div
            ref={scrollRef}
            className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm h-[300px] overflow-y-auto"
          >
            <div className="space-y-2">
              <div className="text-green-400">
                Welcome to the Git simulator. Type commands to practice your workflow.
              </div>
              <div className="text-gray-500">
                Working on: {ticket.ticketKey} - {ticket.title}
              </div>
              <Separator className="my-2 bg-gray-700" />
              
              {commandHistory.map((entry, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">$</span>
                    <span>{entry.command}</span>
                  </div>
                  <div className={entry.isError ? 'text-red-400' : 'text-gray-300 whitespace-pre-wrap'}>
                    {entry.output}
                  </div>
                </div>
              ))}
              
              <div className="flex items-center gap-2">
                <span className="text-blue-400">$</span>
                <Input
                  ref={inputRef}
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="bg-transparent border-none text-white focus-visible:ring-0 p-0 h-auto font-mono"
                  placeholder="Enter git command..."
                  autoFocus
                  data-testid="input-git-command"
                />
              </div>
            </div>
          </div>

          {showTips && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="py-3">
                <div className="space-y-3">
                  {!workflowStatus.branch && (
                    <TipCard
                      title="Create a Branch"
                      suggestion={`git checkout -b ${suggestedBranch}`}
                      explanation={branchTips.bestPractices[0] || "Use descriptive branch names that indicate the work being done."}
                      onCopy={() => copyToClipboard(`git checkout -b ${suggestedBranch}`)}
                    />
                  )}
                  
                  {workflowStatus.branch && !workflowStatus.committed && (
                    <TipCard
                      title="Stage and Commit"
                      suggestion={`git add . && git commit -m "fix(${ticket.ticketKey}): ${ticket.title.slice(0, 40)}"`}
                      explanation={commitTips.bestPractices[0] || "Use clear, descriptive commit messages that explain what changed."}
                      onCopy={() => copyToClipboard(`git add . && git commit -m "fix(${ticket.ticketKey}): ${ticket.title.slice(0, 40)}"`)}
                    />
                  )}

                  {workflowStatus.committed && !workflowStatus.pushed && (
                    <TipCard
                      title="Push Your Changes"
                      suggestion={`git push origin ${currentState.currentBranch}`}
                      explanation="Push your commits to the remote repository before creating a PR."
                      onCopy={() => copyToClipboard(`git push origin ${currentState.currentBranch}`)}
                    />
                  )}

                  {workflowStatus.pushed && !workflowStatus.prReady && (
                    <div className="flex items-start gap-2 p-2 bg-blue-100 rounded">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-800">Ready for PR!</p>
                        <p className="text-blue-600">
                          Click the "Create Pull Request" button to open a PR for review.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3" role="group" aria-label="Git actions">
        <Button
          variant="outline"
          onClick={handleCreatePR}
          disabled={!workflowStatus.pushed || workflowStatus.prReady || isPRLoading}
          data-testid="button-create-pr"
          aria-label="Create pull request"
        >
          {isPRLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <GitPullRequest className="h-4 w-4 mr-2" />
          )}
          Create Pull Request
        </Button>

        <Button
          variant="outline"
          onClick={handleMergePR}
          disabled={!workflowStatus.prReady || workflowStatus.merged || isMergeLoading}
          data-testid="button-merge-pr"
          aria-label="Merge pull request"
        >
          {isMergeLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <GitMerge className="h-4 w-4 mr-2" />
          )}
          Merge PR
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Git Workflow Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {Object.entries({
              'Branch': workflowStatus.branch,
              'Commit': workflowStatus.committed,
              'Push': workflowStatus.pushed,
              'PR': workflowStatus.prReady,
              'Merge': workflowStatus.merged,
            }).map(([label, completed], index, arr) => (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {completed ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-medium">{index + 1}</span>
                    )}
                  </div>
                  <span className={`text-xs mt-1 ${completed ? 'text-green-600' : 'text-gray-500'}`}>
                    {label}
                  </span>
                </div>
                {index < arr.length - 1 && (
                  <div className={`w-8 h-0.5 mx-2 ${completed ? 'bg-green-300' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface WorkflowStatusProps {
  status: {
    branch: boolean;
    hasChanges: boolean;
    committed: boolean;
    pushed: boolean;
    prReady: boolean;
    merged: boolean;
  };
}

function WorkflowStatus({ status }: WorkflowStatusProps) {
  const getStatusBadge = () => {
    if (status.merged) return { label: 'Merged', variant: 'default' as const, color: 'bg-purple-100 text-purple-700' };
    if (status.prReady) return { label: 'In Review', variant: 'default' as const, color: 'bg-blue-100 text-blue-700' };
    if (status.pushed) return { label: 'Ready for PR', variant: 'default' as const, color: 'bg-yellow-100 text-yellow-700' };
    if (status.committed) return { label: 'Changes Committed', variant: 'default' as const, color: 'bg-green-100 text-green-700' };
    if (status.hasChanges) return { label: 'Uncommitted Changes', variant: 'default' as const, color: 'bg-orange-100 text-orange-700' };
    if (status.branch) return { label: 'On Feature Branch', variant: 'default' as const, color: 'bg-gray-100 text-gray-700' };
    return { label: 'On Main', variant: 'outline' as const, color: '' };
  };

  const badge = getStatusBadge();
  return (
    <Badge className={badge.color || undefined} variant={badge.color ? 'default' : badge.variant}>
      {badge.label}
    </Badge>
  );
}

interface TipCardProps {
  title: string;
  suggestion: string;
  explanation: string;
  onCopy: () => void;
}

function TipCard({ title, suggestion, explanation, onCopy }: TipCardProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-yellow-800">{title}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCopy}
                className="h-6 px-2"
                data-testid={`button-copy-${title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy command</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <code className="block text-xs bg-yellow-100 p-2 rounded font-mono text-yellow-900">
        {suggestion}
      </code>
      <p className="text-xs text-yellow-700">{explanation}</p>
    </div>
  );
}
