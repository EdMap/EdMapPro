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
  ArrowLeft,
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
  ticketType?: 'bug' | 'feature' | 'improvement' | 'task';
  ticketDescription?: string;
  branchName: string;
  commits: { hash: string; message: string; timestamp: string }[];
  onThreadResolve: (threadId: string) => void;
  onCommentSubmit: (threadId: string, content: string) => void;
  onRequestReReview: () => void;
  onMerge: () => void;
  onReturnToCode?: () => void;
  reviewState?: {
    status: 'pending_review' | 'changes_requested' | 'approved' | 'merged';
    lastTestsPassed: boolean;
    addressedCount: number;
    totalBlockingCount: number;
  };
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
  issueContext?: string;
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

interface TicketContext {
  key: string;
  title: string;
  type?: 'bug' | 'feature' | 'improvement' | 'task';
  description?: string;
}

function extractIssueKeywords(ticket: TicketContext): string[] {
  const text = `${ticket.title} ${ticket.description || ''}`.toLowerCase();
  const keywords: string[] = [];
  
  if (text.includes('null') || text.includes('undefined') || text.includes('crash')) {
    keywords.push('null-check');
  }
  if (text.includes('timezone') || text.includes('date') || text.includes('time')) {
    keywords.push('datetime');
  }
  if (text.includes('loading') || text.includes('skeleton') || text.includes('spinner')) {
    keywords.push('loading-state');
  }
  if (text.includes('notification') || text.includes('alert') || text.includes('toast')) {
    keywords.push('notifications');
  }
  if (text.includes('payment') || text.includes('stripe') || text.includes('checkout')) {
    keywords.push('payment');
  }
  if (text.includes('validation') || text.includes('input') || text.includes('form')) {
    keywords.push('validation');
  }
  if (text.includes('error') || text.includes('exception') || text.includes('handling')) {
    keywords.push('error-handling');
  }
  
  return keywords.length > 0 ? keywords : ['general'];
}

function generateInitialThreads(
  config: PRReviewConfig,
  ticket: TicketContext
): SimulatedThread[] {
  const threads: SimulatedThread[] = [];
  const { reviewers, minCommentsPerPR, maxCommentsPerPR, levelModifiers } = config;
  
  const commentCount = Math.floor(
    Math.random() * (maxCommentsPerPR - minCommentsPerPR + 1) + minCommentsPerPR
  );
  
  const severityDist = levelModifiers.severityDistribution;
  const issueKeywords = extractIssueKeywords(ticket);
  const primaryIssue = issueKeywords[0];
  
  const ticketAwareFeedback: Record<string, Record<string, { minor: string[]; major: string[]; blocking: string[]; context: string }>> = {
    'null-check': {
      educational: {
        minor: [
          `Good fix for the null check! One small thing - consider using optional chaining (\`?.\`) here for cleaner syntax.`,
          `Nice work handling the edge case. For consistency, we usually add an early return when the value is nullish.`,
        ],
        major: [
          `The null check looks good, but I'd suggest also validating the nested properties. What if \`customer.email\` is null?`,
          `This addresses the crash, but we should also add proper error messages for users when data is missing.`,
        ],
        blocking: [
          `The null check is incomplete - you're checking \`cart\` but not \`cart.items\`. This will still crash with an empty cart.`,
          `Critical: The payment flow can still fail if \`customer.stripeId\` is undefined. Let's add that check too.`,
        ],
        context: 'null check implementation',
      },
      collaborative: {
        minor: [`Nice null check! What do you think about also logging when we hit this case for debugging?`],
        major: [`Good fix! Should we also add unit tests for the edge cases we're handling?`],
        blocking: [`We need to handle the empty array case too - let's sync on this.`],
        context: 'null check implementation',
      },
      direct: {
        minor: [`Add \`??\` default value here.`],
        major: [`Also check nested properties for null.`],
        blocking: [`Incomplete null check - add cart.items validation.`],
        context: 'null check implementation',
      },
      peer: {
        minor: [`Nit: prefer \`??\` over \`|| ''\` for nullish coalescing.`],
        major: [`Should this throw a specific error type for better handling upstream?`],
        blocking: [`Missing check for empty items array.`],
        context: 'null check implementation',
      },
    },
    'datetime': {
      educational: {
        minor: [
          `The timezone fix looks great! Small suggestion: consider using a constant for the default timezone fallback.`,
          `Nice use of Intl.DateTimeFormat! For future reference, you can also use \`timeZoneName: 'short'\` to show the timezone in the output.`,
        ],
        major: [
          `The timezone handling works, but we should also update the \`formatTimestamp\` function to be consistent. Currently it still uses UTC.`,
          `Good fix! Let's also add tests with different timezone values to ensure this works globally.`,
        ],
        blocking: [
          `The timezone parameter isn't being used consistently - some calls still hardcode UTC.`,
          `This will break for users in timezones with half-hour offsets (like India). We need to handle those cases.`,
        ],
        context: 'timezone display fix',
      },
      collaborative: {
        minor: [`Good timezone fix! Should we add a helper for common date formats?`],
        major: [`The formatting looks good. Want to pair on adding timezone preference to user settings?`],
        blocking: [`Some date functions still use the old UTC approach - let's fix those together.`],
        context: 'timezone display fix',
      },
      direct: {
        minor: [`Extract timezone fallback to constant.`],
        major: [`Update formatTimestamp to match.`],
        blocking: [`Inconsistent timezone usage across functions.`],
        context: 'timezone display fix',
      },
      peer: {
        minor: [`Consider adding timezone to the output for clarity.`],
        major: [`Should we centralize timezone handling in a utility?`],
        blocking: [`Half-hour timezone offsets not handled.`],
        context: 'timezone display fix',
      },
    },
    'loading-state': {
      educational: {
        minor: [
          `Nice skeleton loader! Consider matching the exact dimensions of the real content for a smoother transition.`,
          `Good UX improvement! One thing - we could animate the skeleton with a shimmer effect for better feedback.`,
        ],
        major: [
          `The loading state works, but we should also handle the error state. What happens if the fetch fails?`,
          `Great skeleton! Let's also add an aria-busy attribute for accessibility.`,
        ],
        blocking: [
          `The skeleton count should match the expected number of items, not be hardcoded to 5.`,
          `This causes a layout shift when content loads. The skeleton dimensions need to match the actual content.`,
        ],
        context: 'loading state implementation',
      },
      collaborative: {
        minor: [`Nice loading state! What do you think about adding a shimmer animation?`],
        major: [`Good work! Should we create a reusable skeleton component for consistency?`],
        blocking: [`The hardcoded count causes mismatched expectations - let's discuss.`],
        context: 'loading state implementation',
      },
      direct: {
        minor: [`Match skeleton dimensions to content.`],
        major: [`Add error state handling.`],
        blocking: [`Skeleton count should be dynamic.`],
        context: 'loading state implementation',
      },
      peer: {
        minor: [`Optional: add shimmer animation.`],
        major: [`Consider extracting to reusable component.`],
        blocking: [`Layout shift when content loads.`],
        context: 'loading state implementation',
      },
    },
    'notifications': {
      educational: {
        minor: [
          `Nice notification implementation! Consider adding an aria-live region for accessibility.`,
          `Good work! The notification styling looks clean. Consider adding animation for smoother UX.`,
        ],
        major: [
          `The notification system works, but we should also handle edge cases like rapid-fire notifications.`,
          `Good implementation! Let's also add a way to dismiss notifications.`,
        ],
        blocking: [
          `The notification logic needs proper state management to prevent duplicates.`,
          `Critical: Notifications aren't clearing properly - this will cause memory leaks.`,
        ],
        context: 'notification implementation',
      },
      collaborative: {
        minor: [`Nice notification! Should we add sound for important ones?`],
        major: [`Good work! Want to pair on adding notification persistence?`],
        blocking: [`The notification queue needs work - let's sync.`],
        context: 'notification implementation',
      },
      direct: {
        minor: [`Add aria-live for accessibility.`],
        major: [`Handle notification queue.`],
        blocking: [`Fix notification state management.`],
        context: 'notification implementation',
      },
      peer: {
        minor: [`Consider adding animation.`],
        major: [`Should we debounce notifications?`],
        blocking: [`Memory leak in notification handling.`],
        context: 'notification implementation',
      },
    },
    'payment': {
      educational: {
        minor: [
          `Good payment handling! Consider adding currency formatting for better UX.`,
          `Nice work! The payment flow looks clean. Small suggestion: log payment attempts for debugging.`,
        ],
        major: [
          `The payment logic works, but we should add retry logic for failed transactions.`,
          `Good implementation! Let's also add receipt generation after successful payments.`,
        ],
        blocking: [
          `Critical: The payment amount isn't being validated before processing.`,
          `The payment error handling is incomplete - users won't know what went wrong.`,
        ],
        context: 'payment flow implementation',
      },
      collaborative: {
        minor: [`Nice payment UI! Should we add a loading state during processing?`],
        major: [`Good work! Want to add webhook handling together?`],
        blocking: [`Payment validation needs work - let's sync.`],
        context: 'payment flow implementation',
      },
      direct: {
        minor: [`Add currency formatting.`],
        major: [`Add retry logic.`],
        blocking: [`Validate payment amount.`],
        context: 'payment flow implementation',
      },
      peer: {
        minor: [`Consider adding payment logging.`],
        major: [`Should we add refund handling?`],
        blocking: [`Payment error handling incomplete.`],
        context: 'payment flow implementation',
      },
    },
    'validation': {
      educational: {
        minor: [
          `Good validation! Consider using a validation library for consistency.`,
          `Nice work! The validation messages are clear. Small suggestion: highlight invalid fields.`,
        ],
        major: [
          `The validation works, but we should also validate on blur for better UX.`,
          `Good implementation! Let's also add server-side validation to match.`,
        ],
        blocking: [
          `Critical: The validation can be bypassed - we need server-side checks.`,
          `The form submits even with invalid data - this needs fixing.`,
        ],
        context: 'form validation implementation',
      },
      collaborative: {
        minor: [`Nice validation! Should we add real-time feedback?`],
        major: [`Good work! Want to create reusable validation rules?`],
        blocking: [`Validation bypass issue - let's sync.`],
        context: 'form validation implementation',
      },
      direct: {
        minor: [`Highlight invalid fields.`],
        major: [`Add server-side validation.`],
        blocking: [`Fix validation bypass.`],
        context: 'form validation implementation',
      },
      peer: {
        minor: [`Consider using Zod for validation.`],
        major: [`Should we centralize validation rules?`],
        blocking: [`Form submits with invalid data.`],
        context: 'form validation implementation',
      },
    },
    'error-handling': {
      educational: {
        minor: [
          `Good error handling! Consider adding more specific error messages for users.`,
          `Nice work! The try/catch is clean. Small suggestion: log errors for debugging.`,
        ],
        major: [
          `The error handling works, but we should also add error boundaries for React components.`,
          `Good implementation! Let's also add a fallback UI for error states.`,
        ],
        blocking: [
          `Critical: Errors are being silently swallowed - we need proper logging.`,
          `The error recovery logic is incomplete - users get stuck in error states.`,
        ],
        context: 'error handling implementation',
      },
      collaborative: {
        minor: [`Nice error handling! Should we add error tracking?`],
        major: [`Good work! Want to add error boundary together?`],
        blocking: [`Silent error swallowing - let's sync.`],
        context: 'error handling implementation',
      },
      direct: {
        minor: [`Add error logging.`],
        major: [`Add error boundaries.`],
        blocking: [`Don't swallow errors.`],
        context: 'error handling implementation',
      },
      peer: {
        minor: [`Consider Sentry for tracking.`],
        major: [`Should we add retry logic?`],
        blocking: [`Error recovery incomplete.`],
        context: 'error handling implementation',
      },
    },
    'general': {
      educational: {
        minor: [
          `Good implementation! Consider adding a brief comment explaining the business logic here.`,
          `This works well. For maintainability, we could extract this into a separate utility function.`,
        ],
        major: [
          `The logic looks correct, but I'd suggest adding error boundaries for robustness.`,
          `Nice work! One thing - we should add input validation before processing.`,
        ],
        blocking: [
          `This implementation needs proper error handling before we can merge.`,
          `The edge cases aren't covered - this could crash in production.`,
        ],
        context: 'code implementation',
      },
      collaborative: {
        minor: [`Nice implementation! What do you think about adding a comment for the next developer?`],
        major: [`Good work! Should we add some unit tests for this?`],
        blocking: [`Let's sync on error handling before merging.`],
        context: 'code implementation',
      },
      direct: {
        minor: [`Add a descriptive comment.`],
        major: [`Add error handling.`],
        blocking: [`Edge cases not covered.`],
        context: 'code implementation',
      },
      peer: {
        minor: [`Optional: could simplify with a helper.`],
        major: [`Should we discuss the trade-offs here?`],
        blocking: [`Need tests before merge.`],
        context: 'code implementation',
      },
    },
  };
  
  const issueTemplates = ticketAwareFeedback[primaryIssue] || ticketAwareFeedback['general'];
  const templates = issueTemplates[levelModifiers.feedbackTone];
  const issueContext = templates.context;
  
  const files = [
    { name: 'src/utils/dateUtils.ts', lines: [12, 45, 67, 89] },
    { name: 'src/components/TransactionList.tsx', lines: [23, 56, 112] },
    { name: 'src/hooks/useTransaction.ts', lines: [8, 34, 78] },
  ];
  
  // Ensure at least one comment from each reviewer
  const actualCommentCount = Math.max(commentCount, reviewers.length);
  
  for (let i = 0; i < actualCommentCount; i++) {
    const rand = Math.random();
    let severity: 'minor' | 'major' | 'blocking';
    if (rand < severityDist.blocking) {
      severity = 'blocking';
    } else if (rand < severityDist.blocking + severityDist.major) {
      severity = 'major';
    } else {
      severity = 'minor';
    }
    
    // First loop through all reviewers, then randomize for extras
    const reviewer = i < reviewers.length 
      ? reviewers[i] 
      : reviewers[Math.floor(Math.random() * reviewers.length)];
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
      issueContext,
    });
  }
  
  return threads;
}

export function PRReviewPanel({
  prReviewConfig,
  ticketKey,
  ticketTitle,
  ticketType,
  ticketDescription,
  branchName,
  commits,
  onThreadResolve,
  onCommentSubmit,
  onRequestReReview,
  onMerge,
  onReturnToCode,
  reviewState,
}: PRReviewPanelProps) {
  const { uiConfig, levelModifiers, reviewers } = prReviewConfig;
  
  const ticketContext: TicketContext = {
    key: ticketKey,
    title: ticketTitle,
    type: ticketType,
    description: ticketDescription,
  };
  
  const [threads, setThreads] = useState<SimulatedThread[]>(() => 
    generateInitialThreads(prReviewConfig, ticketContext)
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
  
  const testsAreBlocking = reviewState?.lastTestsPassed === false;
  
  const canMerge = useMemo(() => {
    if (prReviewConfig.requireAllResolved && unresolvedCount > 0) return false;
    if (blockingCount > 0) return false;
    if (testsAreBlocking) return false;
    return reviewPhase === 'approved';
  }, [prReviewConfig.requireAllResolved, unresolvedCount, blockingCount, reviewPhase, testsAreBlocking]);
  
  const canRequestReReview = useMemo(() => {
    if (reviewPhase === 'in_review' || reviewPhase === 'approved') return false;
    if (blockingCount > 0) return false;
    if (testsAreBlocking) return false;
    return true;
  }, [reviewPhase, blockingCount, testsAreBlocking]);
  
  const fileGroups = useMemo(() => {
    const groups: Record<string, SimulatedThread[]> = {};
    threads.forEach(thread => {
      const key = thread.filename || 'General';
      if (!groups[key]) groups[key] = [];
      groups[key].push(thread);
    });
    return groups;
  }, [threads]);
  
  const [awaitingResponse, setAwaitingResponse] = useState<Set<string>>(new Set());
  
  const getReviewerFollowUpMessage = useCallback((thread: SimulatedThread, userMessage: string): string => {
    const issueContext = thread.issueContext || 'code implementation';
    
    const contextAwareFollowUps: Record<string, Record<string, { minor: string[]; major: string[]; blocking: string[] }>> = {
      'null check implementation': {
        educational: {
          minor: [
            `Nice handling of the null case! Your defensive coding is improving. 👍`,
            `Good null check! You're thinking about edge cases like a pro.`,
          ],
          major: [
            `The null handling looks solid now. Good job covering the edge cases!`,
            `Much better! The null checks are comprehensive now.`,
          ],
          blocking: [
            `Excellent - the null check is now complete. This will prevent the crash we were worried about.`,
            `The null validation is solid. Good catch on the nested properties too!`,
          ],
        },
        collaborative: {
          minor: [`Good null check! Looks solid.`],
          major: [`The null handling is comprehensive now. Nice work!`],
          blocking: [`This covers all the edge cases. Great fix!`],
        },
        direct: {
          minor: [`Null check looks good.`],
          major: [`Null handling approved.`],
          blocking: [`Edge cases covered. Approved.`],
        },
        peer: {
          minor: [`Good defensive coding.`],
          major: [`Null cases handled properly.`],
          blocking: [`This resolves the crash risk.`],
        },
      },
      'timezone display fix': {
        educational: {
          minor: [
            `Great timezone handling! The Intl.DateTimeFormat approach is spot on. 👍`,
            `Nice work! The timezone fix looks clean and consistent now.`,
          ],
          major: [
            `The timezone logic is correct now. Users will see their local times properly!`,
            `Good fix! The datetime handling is consistent across the codebase.`,
          ],
          blocking: [
            `Excellent - the timezone handling is now correct. This will fix the display issues users were seeing.`,
            `The datetime fix is solid. Good job making it consistent!`,
          ],
        },
        collaborative: {
          minor: [`Good timezone fix! The formatting looks right.`],
          major: [`The timezone handling is consistent now. Nice work!`],
          blocking: [`This fixes the UTC display issue. Great job!`],
        },
        direct: {
          minor: [`Timezone formatting looks correct.`],
          major: [`Datetime handling approved.`],
          blocking: [`Timezone fix verified.`],
        },
        peer: {
          minor: [`Good use of Intl.DateTimeFormat.`],
          major: [`Timezone logic looks solid.`],
          blocking: [`This resolves the display issues.`],
        },
      },
      'loading state implementation': {
        educational: {
          minor: [
            `Nice skeleton loader! The UX will be much smoother now. 👍`,
            `Good loading state! Users will have better feedback during fetches.`,
          ],
          major: [
            `The loading state implementation is solid. Great UX improvement!`,
            `Much better! The skeleton matches the content layout nicely.`,
          ],
          blocking: [
            `Excellent - the loading state is properly implemented. No more blank screens!`,
            `The skeleton loader is well done. Good attention to layout matching!`,
          ],
        },
        collaborative: {
          minor: [`Nice loading state! Looks smooth.`],
          major: [`The skeleton implementation is clean. Nice work!`],
          blocking: [`This improves the UX significantly. Great job!`],
        },
        direct: {
          minor: [`Loading state looks good.`],
          major: [`Skeleton implementation approved.`],
          blocking: [`UX improvement verified.`],
        },
        peer: {
          minor: [`Good skeleton implementation.`],
          major: [`Loading feedback is solid.`],
          blocking: [`This resolves the blank screen issue.`],
        },
      },
      'notification implementation': {
        educational: {
          minor: [
            `Nice notification handling! The UX is much cleaner now. 👍`,
            `Good work! The notification system looks well-structured.`,
          ],
          major: [
            `The notification logic is solid now. Good job with the state management!`,
            `Much better! The notification queue is properly handled.`,
          ],
          blocking: [
            `Excellent - the notification system is properly implemented now!`,
            `The notification handling is solid. No more memory leaks!`,
          ],
        },
        collaborative: {
          minor: [`Nice notification fix! Looks good.`],
          major: [`The notification system is clean now. Nice work!`],
          blocking: [`This fixes the notification issues. Great job!`],
        },
        direct: {
          minor: [`Notification handling looks good.`],
          major: [`Notification system approved.`],
          blocking: [`Notification fix verified.`],
        },
        peer: {
          minor: [`Good notification implementation.`],
          major: [`Notification state is solid.`],
          blocking: [`This resolves the notification issues.`],
        },
      },
      'payment flow implementation': {
        educational: {
          minor: [
            `Nice payment handling! The flow is much cleaner now. 👍`,
            `Good work! The payment validation looks solid.`,
          ],
          major: [
            `The payment logic is correct now. Good job with the error handling!`,
            `Much better! The payment flow is robust now.`,
          ],
          blocking: [
            `Excellent - the payment validation is properly implemented now!`,
            `The payment handling is solid. This will prevent failed transactions!`,
          ],
        },
        collaborative: {
          minor: [`Nice payment fix! Looks good.`],
          major: [`The payment flow is clean now. Nice work!`],
          blocking: [`This fixes the payment issues. Great job!`],
        },
        direct: {
          minor: [`Payment handling looks good.`],
          major: [`Payment flow approved.`],
          blocking: [`Payment fix verified.`],
        },
        peer: {
          minor: [`Good payment implementation.`],
          major: [`Payment validation is solid.`],
          blocking: [`This resolves the payment issues.`],
        },
      },
      'form validation implementation': {
        educational: {
          minor: [
            `Nice validation! The form feedback is much clearer now. 👍`,
            `Good work! The validation rules are well-structured.`,
          ],
          major: [
            `The validation logic is solid now. Good job with the error messages!`,
            `Much better! The form validation is comprehensive now.`,
          ],
          blocking: [
            `Excellent - the validation is properly implemented now!`,
            `The form validation is solid. No more bypassing!`,
          ],
        },
        collaborative: {
          minor: [`Nice validation fix! Looks good.`],
          major: [`The validation is clean now. Nice work!`],
          blocking: [`This fixes the validation issues. Great job!`],
        },
        direct: {
          minor: [`Validation looks good.`],
          major: [`Validation approved.`],
          blocking: [`Validation fix verified.`],
        },
        peer: {
          minor: [`Good validation implementation.`],
          major: [`Validation rules are solid.`],
          blocking: [`This resolves the validation issues.`],
        },
      },
      'error handling implementation': {
        educational: {
          minor: [
            `Nice error handling! The recovery flow is much cleaner now. 👍`,
            `Good work! The try/catch patterns are well-structured.`,
          ],
          major: [
            `The error handling is solid now. Good job with the user feedback!`,
            `Much better! The error recovery is comprehensive now.`,
          ],
          blocking: [
            `Excellent - the error handling is properly implemented now!`,
            `The error recovery is solid. No more silent failures!`,
          ],
        },
        collaborative: {
          minor: [`Nice error handling fix! Looks good.`],
          major: [`The error handling is clean now. Nice work!`],
          blocking: [`This fixes the error issues. Great job!`],
        },
        direct: {
          minor: [`Error handling looks good.`],
          major: [`Error handling approved.`],
          blocking: [`Error fix verified.`],
        },
        peer: {
          minor: [`Good error handling.`],
          major: [`Error recovery is solid.`],
          blocking: [`This resolves the error issues.`],
        },
      },
      'code implementation': {
        educational: {
          minor: [
            `Great job applying that pattern! Your code looks much cleaner now. 👍`,
            `Perfect! That's exactly what I was suggesting. You're picking up these patterns quickly!`,
          ],
          major: [
            `Thanks for making those changes! I can see you've understood the principle. This looks much better now.`,
            `Good improvement! The structure is cleaner now.`,
          ],
          blocking: [
            `I've reviewed your fix - the concern is now addressed. Nice work!`,
            `The implementation looks solid now. Good job!`,
          ],
        },
        collaborative: {
          minor: [`Looks good to me! Thanks for the quick update.`],
          major: [`This is much better! I like the approach you took.`],
          blocking: [`Thanks for addressing this thoroughly. The fix looks correct.`],
        },
        direct: {
          minor: [`LGTM.`],
          major: [`Looks good now.`],
          blocking: [`Issue resolved.`],
        },
        peer: {
          minor: [`Nice change. Agreed.`],
          major: [`Good call on that approach.`],
          blocking: [`Good fix. This addresses my concern.`],
        },
      },
    };
    
    const contextMessages = contextAwareFollowUps[issueContext] || contextAwareFollowUps['code implementation'];
    const toneMessages = contextMessages[levelModifiers.feedbackTone];
    const severityMessages = toneMessages[thread.severity];
    return severityMessages[Math.floor(Math.random() * severityMessages.length)];
  }, [levelModifiers.feedbackTone]);
  
  const handleReply = useCallback((threadId: string) => {
    const content = replyInputs[threadId]?.trim();
    if (!content) return;
    
    const thread = threads.find(t => t.id === threadId);
    if (!thread || thread.status === 'resolved') return;
    
    const userComment: SimulatedComment = {
      id: `comment-${thread.id}-${thread.comments.length + 1}`,
      authorId: 'user',
      authorName: 'You',
      authorRole: 'Developer',
      content,
      type: 'comment',
      isUser: true,
      createdAt: new Date().toISOString(),
    };
    
    const shouldAutoResolve = levelModifiers.autoResolveMinorOnResponse && thread.severity === 'minor';
    
    if (shouldAutoResolve) {
      setThreads(prev => prev.map(t => {
        if (t.id !== threadId) return t;
        return {
          ...t,
          comments: [...t.comments, userComment],
          status: 'resolved' as const,
        };
      }));
      setReplyInputs(prev => ({ ...prev, [threadId]: '' }));
      setAwaitingResponse(prev => {
        const next = new Set(prev);
        next.delete(threadId);
        return next;
      });
      onCommentSubmit(threadId, content);
      onThreadResolve(threadId);
      return;
    }
    
    setThreads(prev => prev.map(t => {
      if (t.id !== threadId) return t;
      return {
        ...t,
        comments: [...t.comments, userComment],
      };
    }));
    
    setReplyInputs(prev => ({ ...prev, [threadId]: '' }));
    setAwaitingResponse(prev => {
      const next = new Set(prev);
      next.add(threadId);
      return next;
    });
    onCommentSubmit(threadId, content);
    
    const responseDelay = levelModifiers.feedbackTone === 'direct' ? 1000 : 
                          levelModifiers.feedbackTone === 'peer' ? 1500 : 2000;
    
    const replyTimestamp = Date.now();
    
    setTimeout(() => {
      setAwaitingResponse(currentAwaiting => {
        if (!currentAwaiting.has(threadId)) {
          return currentAwaiting;
        }
        
        setThreads(prev => {
          const currentThread = prev.find(t => t.id === threadId);
          if (!currentThread || currentThread.status === 'resolved') {
            return prev;
          }
          
          const reviewerResponse = getReviewerFollowUpMessage(currentThread, content);
          
          const reviewerComment: SimulatedComment = {
            id: `comment-${threadId}-reviewer-${replyTimestamp}`,
            authorId: currentThread.reviewerId,
            authorName: currentThread.reviewerName,
            authorRole: currentThread.reviewerRole,
            content: reviewerResponse,
            type: 'approval',
            isUser: false,
            createdAt: new Date().toISOString(),
          };
          
          return prev.map(t => {
            if (t.id !== threadId) return t;
            return {
              ...t,
              comments: [...t.comments, reviewerComment],
            };
          });
        });
        
        const next = new Set(currentAwaiting);
        next.delete(threadId);
        return next;
      });
    }, responseDelay);
  }, [replyInputs, threads, levelModifiers.autoResolveMinorOnResponse, levelModifiers.feedbackTone, onCommentSubmit, onThreadResolve, getReviewerFollowUpMessage]);
  
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
              isAwaitingResponse={awaitingResponse.has(thread.id)}
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
                  isAwaitingResponse={awaitingResponse.has(thread.id)}
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
            isAwaitingResponse={awaitingResponse.has(thread.id)}
          />
        ))}
      </div>
    </ScrollArea>
  );
  
  const resolvedCount = threads.length - unresolvedCount;
  const progressPercent = threads.length > 0 ? Math.round((resolvedCount / threads.length) * 100) : 0;
  
  const addressedThreadsCount = useMemo(() => 
    threads.filter(t => t.status === 'resolved' || t.comments.some(c => c.isUser)).length,
    [threads]
  );
  
  const canRequestReReviewNow = useMemo(() => {
    const hasUnaddressedBlocking = threads.some(
      t => t.status === 'open' && t.severity === 'blocking' && !t.comments.some(c => c.isUser)
    );
    return !hasUnaddressedBlocking && reviewPhase === 'changes_requested';
  }, [threads, reviewPhase]);
  
  const renderChangesRequestedBanner = () => {
    if (reviewPhase !== 'changes_requested' || !uiConfig.showReviewBanner) return null;
    
    return (
      <div 
        className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4"
        role="alert"
        aria-label="Changes requested - action required"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium text-amber-700 dark:text-amber-300">
                Changes Requested
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {blockingCount > 0 
                  ? `${blockingCount} blocking issue${blockingCount !== 1 ? 's' : ''} need${blockingCount === 1 ? 's' : ''} to be fixed in your code.`
                  : `Review the feedback below and address the comments.`
                }
              </p>
              {uiConfig.showProgressIndicator && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-0.5">
                    {threads.map((t, i) => (
                      <div 
                        key={i}
                        className={cn(
                          "w-2 h-2 rounded-full",
                          t.status === 'resolved' 
                            ? "bg-green-500" 
                            : t.comments.some(c => c.isUser)
                              ? "bg-blue-500"
                              : t.severity === 'blocking'
                                ? "bg-red-500"
                                : "bg-amber-500"
                        )}
                        title={t.status === 'resolved' ? 'Resolved' : t.comments.some(c => c.isUser) ? 'Addressed' : 'Open'}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {addressedThreadsCount}/{threads.length} addressed
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {uiConfig.showReturnToCode && onReturnToCode && blockingCount > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={onReturnToCode}
              className="bg-amber-600 hover:bg-amber-700 text-white flex-shrink-0"
              data-testid="button-return-to-code"
            >
              <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
              Return to Code
            </Button>
          )}
        </div>
      </div>
    );
  };
  
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
        {renderChangesRequestedBanner()}
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
              ) : testsAreBlocking ? (
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  <span className="font-medium">Tests must pass before requesting re-review</span>
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
              {reviewPhase !== 'approved' && (
                <Button 
                  variant="outline" 
                  onClick={handleRequestReReview}
                  disabled={!canRequestReReview || reviewPhase === 'in_review'}
                  aria-label={canRequestReReview ? "Request reviewers to re-review your changes" : "Cannot request re-review - resolve blocking issues and pass tests first"}
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
  isAwaitingResponse?: boolean;
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
  isAwaitingResponse = false,
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
              ) : isAwaitingResponse ? (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs animate-pulse">
                  <Clock className="h-3 w-3 mr-1" />
                  Awaiting response
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
