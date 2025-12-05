import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  GitPullRequest,
  CheckCircle2,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
  FileCode,
  GitMerge,
  Clock,
  Check,
  X,
  RefreshCw,
  Lightbulb,
  Code,
  Eye,
  MessageCircle,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { 
  PRReviewConfig, 
  ReviewerPersona, 
  PRReviewUIConfig,
  PRReviewModifiers,
  ReviewThread as AdapterReviewThread,
  ReviewThreadComment,
} from "@shared/adapters/execution/types";

interface PRReviewPanelProps {
  prReviewConfig: PRReviewConfig;
  ticketKey: string;
  ticketTitle: string;
  branchName: string;
  commits: { hash: string; message: string; timestamp: string }[];
  onThreadResolve: (threadId: string) => void;
  onCommentSubmit: (threadId: string, content: string) => void;
  onRequestReReview: () => void;
  onMerge: () => void;
}

interface SimulatedThread {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: string;
  reviewerColor: string;
  filename?: string;
  lineNumber?: number;
  codeSnippet?: string;
  comments: SimulatedComment[];
  status: 'open' | 'resolved' | 'dismissed';
  severity: 'minor' | 'major' | 'blocking';
  createdAt: string;
}

interface SimulatedComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  type: 'suggestion' | 'question' | 'approval' | 'request_changes' | 'comment';
  isUser: boolean;
  createdAt: string;
  exampleResponse?: string;
}

const REVIEWER_COLORS: Record<string, string> = {
  marcus: 'bg-amber-500',
  sarah: 'bg-purple-500',
  alex: 'bg-teal-500',
  priya: 'bg-indigo-500',
  default: 'bg-blue-500',
};

function getReviewerColor(reviewerId: string): string {
  return REVIEWER_COLORS[reviewerId.toLowerCase()] || REVIEWER_COLORS.default;
}

function getSeverityBadge(severity: 'minor' | 'major' | 'blocking') {
  switch (severity) {
    case 'blocking':
      return <Badge variant="destructive" className="text-xs"><AlertCircle className="h-3 w-3 mr-1" />Blocking</Badge>;
    case 'major':
      return <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"><AlertTriangle className="h-3 w-3 mr-1" />Major</Badge>;
    case 'minor':
      return <Badge variant="outline" className="text-xs"><MessageCircle className="h-3 w-3 mr-1" />Minor</Badge>;
  }
}

function generateInitialThreads(
  config: PRReviewConfig,
  ticketKey: string
): SimulatedThread[] {
  const threads: SimulatedThread[] = [];
  const { reviewers, minCommentsPerPR, maxCommentsPerPR, levelModifiers } = config;
  
  const commentCount = Math.floor(
    Math.random() * (maxCommentsPerPR - minCommentsPerPR + 1) + minCommentsPerPR
  );
  
  const severityDist = levelModifiers.severityDistribution;
  
  const feedbackTemplates = {
    educational: {
      minor: [
        "Consider using a more descriptive variable name here. Good naming helps future maintainers understand the code quickly. For example, instead of `data`, try `userTransactionData`.",
        "This could be refactored using array destructuring for cleaner syntax. Here's how: `const [first, ...rest] = items;`",
      ],
      major: [
        "I noticed this function has multiple responsibilities. In practice, we follow the Single Responsibility Principle. Would you consider extracting the validation logic into a separate function?",
        "This approach works, but there's a potential performance issue with re-rendering. Let me explain: when state changes here, the entire component tree re-renders. Consider using useMemo or useCallback.",
      ],
      blocking: [
        "This implementation has a security vulnerability - user input isn't being sanitized before use. This is critical to fix before we can merge. Here's what to do: use the `sanitize` utility from our shared utils.",
        "The error handling here could cause the app to crash in production. All async operations need try/catch blocks. I can walk you through the pattern we use.",
      ],
    },
    collaborative: {
      minor: [
        "What do you think about adding a brief comment here explaining the business logic?",
        "Nice work! One small suggestion - we could make this slightly more readable with optional chaining.",
      ],
      major: [
        "I see what you're going for here. Have you considered the edge case where the array is empty? Let's discuss the best approach.",
        "Good implementation! One thing I'd suggest is adding error boundaries. Want me to show you how we typically handle this?",
      ],
      blocking: [
        "We need to address the null check before this goes to main. Happy to pair on this if helpful!",
        "This could cause issues in production - let's sync up quickly to talk through the fix.",
      ],
    },
    direct: {
      minor: [
        "Add a type annotation here.",
        "Consider using `const` instead of `let` since this value isn't reassigned.",
      ],
      major: [
        "Extract this into a separate utility function.",
        "Add error handling for the API call.",
      ],
      blocking: [
        "Must validate input before processing. Security issue.",
        "Missing null check. Will crash in production.",
      ],
    },
    peer: {
      minor: [
        "Nit: spacing inconsistency.",
        "Optional: could simplify with a ternary.",
      ],
      major: [
        "Should we discuss the trade-offs of this approach?",
        "Interesting choice here - what was your reasoning for avoiding the hook pattern?",
      ],
      blocking: [
        "Need to address the race condition here.",
        "This breaks the existing API contract.",
      ],
    },
  };
  
  const templates = feedbackTemplates[levelModifiers.feedbackTone];
  
  const files = [
    { name: 'src/utils/dateUtils.ts', lines: [12, 45, 67, 89] },
    { name: 'src/components/TransactionList.tsx', lines: [23, 56, 112] },
    { name: 'src/hooks/useTransaction.ts', lines: [8, 34, 78] },
  ];
  
  for (let i = 0; i < commentCount; i++) {
    const rand = Math.random();
    let severity: 'minor' | 'major' | 'blocking';
    if (rand < severityDist.blocking) {
      severity = 'blocking';
    } else if (rand < severityDist.blocking + severityDist.major) {
      severity = 'major';
    } else {
      severity = 'minor';
    }
    
    const reviewer = reviewers[i % reviewers.length];
    const file = files[i % files.length];
    const templateList = templates[severity];
    const content = templateList[i % templateList.length];
    
    const exampleResponses: Record<string, string> = {
      educational: "Thanks for the explanation! I've updated the code to follow the pattern you suggested. Could you take another look?",
      collaborative: "Great suggestion! I've made those changes. Let me know if this looks better.",
      direct: "Fixed.",
      peer: "Good catch - addressed in the latest commit.",
    };
    
    threads.push({
      id: `thread-${i + 1}`,
      reviewerId: reviewer.name.toLowerCase(),
      reviewerName: reviewer.name,
      reviewerRole: reviewer.role,
      reviewerColor: getReviewerColor(reviewer.name),
      filename: file.name,
      lineNumber: file.lines[i % file.lines.length],
      codeSnippet: `// Line ${file.lines[i % file.lines.length]} of ${file.name}`,
      comments: [{
        id: `comment-${i + 1}-1`,
        authorId: reviewer.name.toLowerCase(),
        authorName: reviewer.name,
        authorRole: reviewer.role,
        content,
        type: severity === 'blocking' ? 'request_changes' : 'suggestion',
        isUser: false,
        createdAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        exampleResponse: levelModifiers.showExampleResponses 
          ? exampleResponses[levelModifiers.feedbackTone] 
          : undefined,
      }],
      status: 'open',
      severity,
      createdAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    });
  }
  
  return threads;
}

export function PRReviewPanel({
  prReviewConfig,
  ticketKey,
  ticketTitle,
  branchName,
  commits,
  onThreadResolve,
  onCommentSubmit,
  onRequestReReview,
  onMerge,
}: PRReviewPanelProps) {
  const { uiConfig, levelModifiers, reviewers } = prReviewConfig;
  
  const [threads, setThreads] = useState<SimulatedThread[]>(() => 
    generateInitialThreads(prReviewConfig, ticketKey)
  );
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(() => {
    if (uiConfig.expandThreadsByDefault) {
      return new Set(threads.map(t => t.id));
    }
    return new Set();
  });
  const [showFileTree, setShowFileTree] = useState(uiConfig.showFileTree);
  const [reviewPhase, setReviewPhase] = useState<'in_review' | 'changes_requested' | 'approved'>('changes_requested');
  
  const unresolvedCount = useMemo(() => 
    threads.filter(t => t.status === 'open').length, 
    [threads]
  );
  
  const blockingCount = useMemo(() => 
    threads.filter(t => t.status === 'open' && t.severity === 'blocking').length, 
    [threads]
  );
  
  const canMerge = useMemo(() => {
    if (prReviewConfig.requireAllResolved && unresolvedCount > 0) return false;
    if (blockingCount > 0) return false;
    return reviewPhase === 'approved';
  }, [prReviewConfig.requireAllResolved, unresolvedCount, blockingCount, reviewPhase]);
  
  const fileGroups = useMemo(() => {
    const groups: Record<string, SimulatedThread[]> = {};
    threads.forEach(thread => {
      const key = thread.filename || 'General';
      if (!groups[key]) groups[key] = [];
      groups[key].push(thread);
    });
    return groups;
  }, [threads]);
  
  const handleReply = useCallback((threadId: string) => {
    const content = replyInputs[threadId]?.trim();
    if (!content) return;
    
    setThreads(prev => prev.map(thread => {
      if (thread.id !== threadId) return thread;
      
      const newComment: SimulatedComment = {
        id: `comment-${thread.id}-${thread.comments.length + 1}`,
        authorId: 'user',
        authorName: 'You',
        authorRole: 'Developer',
        content,
        type: 'comment',
        isUser: true,
        createdAt: new Date().toISOString(),
      };
      
      let newStatus = thread.status;
      if (levelModifiers.autoResolveMinorOnResponse && thread.severity === 'minor') {
        newStatus = 'resolved';
      }
      
      return {
        ...thread,
        comments: [...thread.comments, newComment],
        status: newStatus,
      };
    }));
    
    setReplyInputs(prev => ({ ...prev, [threadId]: '' }));
    onCommentSubmit(threadId, content);
  }, [replyInputs, levelModifiers.autoResolveMinorOnResponse, onCommentSubmit]);
  
  const handleResolve = useCallback((threadId: string) => {
    setThreads(prev => prev.map(thread => 
      thread.id === threadId 
        ? { ...thread, status: 'resolved' as const }
        : thread
    ));
    onThreadResolve(threadId);
  }, [onThreadResolve]);
  
  const toggleThread = useCallback((threadId: string) => {
    setExpandedThreads(prev => {
      const next = new Set(prev);
      if (next.has(threadId)) {
        next.delete(threadId);
      } else {
        next.add(threadId);
      }
      return next;
    });
  }, []);
  
  const handleRequestReReview = useCallback(() => {
    setReviewPhase('in_review');
    onRequestReReview();
    
    setTimeout(() => {
      const hasBlockingOpen = threads.some(t => t.status === 'open' && t.severity === 'blocking');
      if (!hasBlockingOpen) {
        setReviewPhase('approved');
      } else {
        setReviewPhase('changes_requested');
      }
    }, 2000);
  }, [threads, onRequestReReview]);
  
  const getGuidanceMessage = () => {
    switch (levelModifiers.feedbackTone) {
      case 'educational':
        return {
          title: 'Getting Started with Code Review',
          message: "Your teammates have reviewed your code and left feedback. Read through each comment, make any necessary changes, and reply to let them know you've addressed their feedback.",
        };
      case 'collaborative':
        return {
          title: 'Team Feedback',
          message: 'Your team has some suggestions to discuss. Review their comments and collaborate on the best approach.',
        };
      case 'direct':
        return {
          title: 'Review Comments',
          message: 'Address the following review comments before merging.',
        };
      case 'peer':
        return {
          title: 'Peer Review',
          message: 'Your peers have shared their perspectives. Review and respond as needed.',
        };
      default:
        return {
          title: 'Code Review',
          message: 'Review and address the comments below.',
        };
    }
  };
  
  const renderConversationFirstLayout = () => {
    const guidance = getGuidanceMessage();
    
    return (
    <div className="space-y-4">
      {levelModifiers.feedbackTone === 'educational' && (
        <div 
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
          role="region"
          aria-label="Getting started guidance"
        >
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium text-blue-700 dark:text-blue-300">{guidance.title}</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {guidance.message}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <ScrollArea className="h-[500px]">
        <div className="space-y-4 pr-4">
          {threads.map(thread => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              isExpanded={expandedThreads.has(thread.id)}
              onToggle={() => toggleThread(thread.id)}
              onReply={handleReply}
              onResolve={handleResolve}
              replyValue={replyInputs[thread.id] || ''}
              onReplyChange={(value) => setReplyInputs(prev => ({ ...prev, [thread.id]: value }))}
              uiConfig={uiConfig}
              levelModifiers={levelModifiers}
              showExampleResponse={levelModifiers.showExampleResponses}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
    );
  };
  
  const renderSplitDiffLayout = () => (
    <div className="flex gap-4 h-[600px]">
      {showFileTree && (
        <div className="w-64 border-r pr-4">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <FileCode className="h-4 w-4" />
            Changed Files
          </h4>
          <div className="space-y-1">
            {Object.entries(fileGroups).map(([filename, fileThreads]) => (
              <div
                key={filename}
                className="flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer text-sm"
              >
                <span className="truncate">{filename}</span>
                {fileThreads.some(t => t.status === 'open') && (
                  <Badge variant="secondary" className="text-xs">
                    {fileThreads.filter(t => t.status === 'open').length}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <ScrollArea className="flex-1">
        <div className="space-y-4 pr-4">
          {Object.entries(fileGroups).map(([filename, fileThreads]) => (
            <div key={filename} className="space-y-3">
              <div className="flex items-center gap-2 sticky top-0 bg-background py-2">
                <FileCode className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm">{filename}</span>
                <Badge variant="outline" className="text-xs ml-auto">
                  {fileThreads.length} comment{fileThreads.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              {fileThreads.map(thread => (
                <ThreadCard
                  key={thread.id}
                  thread={thread}
                  isExpanded={expandedThreads.has(thread.id)}
                  onToggle={() => toggleThread(thread.id)}
                  onReply={handleReply}
                  onResolve={handleResolve}
                  replyValue={replyInputs[thread.id] || ''}
                  onReplyChange={(value) => setReplyInputs(prev => ({ ...prev, [thread.id]: value }))}
                  uiConfig={uiConfig}
                  levelModifiers={levelModifiers}
                  showExampleResponse={levelModifiers.showExampleResponses}
                  showCodeSnippet={uiConfig.inlineComments}
                />
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
  
  const renderUnifiedLayout = () => (
    <ScrollArea className="h-[600px]">
      <div className="space-y-3 pr-4">
        {threads.map(thread => (
          <ThreadCard
            key={thread.id}
            thread={thread}
            isExpanded={expandedThreads.has(thread.id)}
            onToggle={() => toggleThread(thread.id)}
            onReply={handleReply}
            onResolve={handleResolve}
            replyValue={replyInputs[thread.id] || ''}
            onReplyChange={(value) => setReplyInputs(prev => ({ ...prev, [thread.id]: value }))}
            uiConfig={uiConfig}
            levelModifiers={levelModifiers}
            showExampleResponse={levelModifiers.showExampleResponses}
            compact
          />
        ))}
      </div>
    </ScrollArea>
  );
  
  const resolvedCount = threads.length - unresolvedCount;
  const progressPercent = threads.length > 0 ? Math.round((resolvedCount / threads.length) * 100) : 0;
  
  const renderReviewChecklist = () => {
    if (!uiConfig.showReviewChecklist) return null;
    
    const checklistItems = [
      { id: 'read', label: 'Read all review comments', done: true },
      { id: 'address', label: 'Address blocking issues', done: blockingCount === 0 },
      { id: 'respond', label: 'Respond to feedback', done: threads.every(t => t.status === 'resolved' || t.comments.some(c => c.isUser)) },
      { id: 'resolve', label: 'Resolve all threads', done: unresolvedCount === 0 },
    ];
    
    return (
      <div className="bg-muted/30 rounded-lg p-4 mb-4" role="region" aria-label="Review progress checklist">
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          Review Checklist
        </h4>
        <div className="space-y-2">
          {checklistItems.map(item => (
            <div key={item.id} className="flex items-center gap-2 text-sm">
              {item.done ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden="true" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" aria-hidden="true" />
              )}
              <span className={cn(item.done && "text-muted-foreground line-through")}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <Card className="border-green-200 dark:border-green-800" data-testid="pr-review-panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <GitPullRequest className="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-lg">Pull Request Review</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {ticketKey}: {ticketTitle}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium" aria-live="polite">
                {resolvedCount} of {threads.length} resolved
              </div>
              <div className="w-24 h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                  role="progressbar"
                  aria-valuenow={progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${progressPercent}% of threads resolved`}
                />
              </div>
            </div>
            
            {reviewPhase === 'in_review' && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                <Clock className="h-3 w-3 mr-1" aria-hidden="true" />
                In Review
              </Badge>
            )}
            {reviewPhase === 'changes_requested' && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                <RefreshCw className="h-3 w-3 mr-1" aria-hidden="true" />
                Changes Requested
              </Badge>
            )}
            {reviewPhase === 'approved' && (
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                <Check className="h-3 w-3 mr-1" aria-hidden="true" />
                Approved
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            {threads.length} comment{threads.length !== 1 ? 's' : ''}
          </span>
          {unresolvedCount > 0 && (
            <span className={cn(
              "flex items-center gap-1.5",
              uiConfig.highlightUnresolved && "text-amber-600 dark:text-amber-400 font-medium"
            )}>
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              {unresolvedCount} unresolved
            </span>
          )}
          {blockingCount > 0 && (
            <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-medium">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              {blockingCount} blocking
            </span>
          )}
          <span className="flex items-center gap-1.5 ml-auto">
            <Eye className="h-4 w-4" aria-hidden="true" />
            Reviewers: {reviewers.map(r => r.name).join(', ')}
          </span>
        </div>
      </CardHeader>
      
      <Separator />
      
      <CardContent className="pt-4">
        {renderReviewChecklist()}
        
        {uiConfig.layoutMode === 'conversation-first' && renderConversationFirstLayout()}
        {uiConfig.layoutMode === 'split-diff' && renderSplitDiffLayout()}
        {uiConfig.layoutMode === 'unified' && renderUnifiedLayout()}
        
        <div 
          className="mt-6 pt-4 border-t bg-muted/20 -mx-6 -mb-6 px-6 py-4 rounded-b-lg"
          role="region"
          aria-label="Review actions"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              {blockingCount > 0 ? (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                  <span className="font-medium">{blockingCount} blocking issue{blockingCount !== 1 ? 's' : ''} must be resolved before merge</span>
                </div>
              ) : unresolvedCount > 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {levelModifiers.requireExplicitApprovalRequest 
                      ? `Resolve ${unresolvedCount} remaining comment${unresolvedCount !== 1 ? 's' : ''} and request re-review`
                      : `Address ${unresolvedCount} remaining comment${unresolvedCount !== 1 ? 's' : ''} to proceed`}
                  </span>
                </div>
              ) : reviewPhase === 'approved' ? (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  <span className="font-medium">All checks passed - ready to merge!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  <span>All feedback addressed - request re-review to proceed</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {reviewPhase !== 'approved' && unresolvedCount === 0 && (
                <Button 
                  variant="outline" 
                  onClick={handleRequestReReview}
                  disabled={reviewPhase === 'in_review'}
                  aria-label="Request reviewers to re-review your changes"
                  data-testid="button-request-re-review"
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", reviewPhase === 'in_review' && "animate-spin")} aria-hidden="true" />
                  {reviewPhase === 'in_review' ? 'Reviewing...' : 'Request Re-review'}
                </Button>
              )}
              
              <Button 
                onClick={onMerge}
                disabled={!canMerge}
                className={cn(
                  "min-w-[120px] transition-colors",
                  canMerge 
                    ? "bg-green-600 hover:bg-green-700 text-white" 
                    : "bg-muted text-muted-foreground"
                )}
                aria-label={canMerge ? "Merge pull request into main branch" : "Cannot merge - resolve all issues first"}
                data-testid="button-merge-pr"
              >
                <GitMerge className="h-4 w-4 mr-2" aria-hidden="true" />
                Merge PR
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ThreadCardProps {
  thread: SimulatedThread;
  isExpanded: boolean;
  onToggle: () => void;
  onReply: (threadId: string) => void;
  onResolve: (threadId: string) => void;
  replyValue: string;
  onReplyChange: (value: string) => void;
  uiConfig: PRReviewUIConfig;
  levelModifiers: PRReviewModifiers;
  showExampleResponse?: boolean;
  showCodeSnippet?: boolean;
  compact?: boolean;
}

function ThreadCard({
  thread,
  isExpanded,
  onToggle,
  onReply,
  onResolve,
  replyValue,
  onReplyChange,
  uiConfig,
  levelModifiers,
  showExampleResponse,
  showCodeSnippet = true,
  compact = false,
}: ThreadCardProps) {
  const isResolved = thread.status === 'resolved';
  
  return (
    <div 
      className={cn(
        "border rounded-lg overflow-hidden transition-colors",
        isResolved && "opacity-60 bg-muted/30",
        !isResolved && thread.severity === 'blocking' && uiConfig.highlightUnresolved && "border-red-300 dark:border-red-700",
        !isResolved && thread.severity === 'major' && uiConfig.highlightUnresolved && "border-amber-300 dark:border-amber-700"
      )}
      data-testid={`thread-${thread.id}`}
    >
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger className="w-full">
          <div className={cn(
            "flex items-center gap-3 p-3 hover:bg-muted/50",
            compact && "p-2"
          )}>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            
            <Avatar className={cn("h-7 w-7", compact && "h-6 w-6")}>
              <AvatarFallback className={cn("text-white text-xs", thread.reviewerColor)}>
                {thread.reviewerName[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{thread.reviewerName}</span>
                <span className="text-xs text-muted-foreground">{thread.reviewerRole}</span>
              </div>
              {thread.filename && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Code className="h-3 w-3" />
                  <span className="font-mono">{thread.filename}:{thread.lineNumber}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {getSeverityBadge(thread.severity)}
              {isResolved ? (
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs">
                  <Check className="h-3 w-3 mr-1" />
                  Resolved
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">Open</Badge>
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="border-t">
            {showCodeSnippet && thread.codeSnippet && (
              <div className="bg-gray-900 text-gray-300 p-3 font-mono text-xs overflow-x-auto">
                <div className="text-gray-500 mb-1">Line {thread.lineNumber}</div>
                <pre>{thread.codeSnippet}</pre>
              </div>
            )}
            
            <div className="p-3 space-y-3">
              {thread.comments.map((comment, idx) => (
                <div 
                  key={comment.id}
                  className={cn(
                    "flex gap-3",
                    comment.isUser && "justify-end"
                  )}
                >
                  {!comment.isUser && (
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className={cn("text-white text-xs", thread.reviewerColor)}>
                        {comment.authorName[0]}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={cn(
                    "flex-1 max-w-[85%]",
                    comment.isUser && "flex flex-col items-end"
                  )}>
                    <div className={cn(
                      "rounded-lg p-3",
                      comment.isUser 
                        ? "bg-blue-500 text-white" 
                        : "bg-muted"
                    )}>
                      {!comment.isUser && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">{comment.authorName}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                    </div>
                    
                    {showExampleResponse && comment.exampleResponse && !comment.isUser && idx === 0 && thread.status === 'open' && (
                      <div 
                        className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                        role="note"
                        aria-label="Suggested response example"
                      >
                        <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 mb-1.5">
                          <Lightbulb className="h-3.5 w-3.5" />
                          Suggested response
                        </div>
                        <p className="text-sm text-blue-600 dark:text-blue-400 leading-relaxed">"{comment.exampleResponse}"</p>
                      </div>
                    )}
                  </div>
                  
                  {comment.isUser && (
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-blue-500 text-white text-xs">Y</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              
              {!isResolved && (
                <div className="space-y-3 mt-4 pt-4 border-t border-dashed">
                  <Textarea
                    value={replyValue}
                    onChange={(e) => onReplyChange(e.target.value)}
                    placeholder="Write your response to this feedback..."
                    className="min-h-[80px] text-sm resize-none"
                    aria-label="Reply to review comment"
                    data-testid={`input-reply-${thread.id}`}
                  />
                  
                  <div className="flex items-center justify-between gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onResolve(thread.id)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Mark this thread as resolved without replying"
                      data-testid={`button-resolve-${thread.id}`}
                    >
                      <Check className="h-4 w-4 mr-1.5" />
                      Mark Resolved
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={() => onReply(thread.id)}
                      disabled={!replyValue.trim()}
                      className="min-w-[100px]"
                      aria-label="Submit reply to reviewer"
                      data-testid={`button-reply-${thread.id}`}
                    >
                      <Send className="h-4 w-4 mr-1.5" />
                      Reply
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
