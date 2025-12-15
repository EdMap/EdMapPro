import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft,
  GitBranch, 
  GitPullRequest,
  CheckCircle2, 
  Clock, 
  Target,
  Users,
  AlertCircle,
  ChevronRight,
  Code,
  Bug,
  Star,
  Wrench,
  Send,
  MessageSquare,
  Trophy,
  Play
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspacePhase } from "@/hooks/use-sprint-workflow";
import type { SprintTicket, GitTicketState } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { getSprintExecutionAdapter } from "@shared/adapters";
import type { Role, Level } from "@shared/adapters";

type TicketStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
type TicketType = 'bug' | 'feature' | 'improvement';

interface ExecutionModuleProps {
  workspaceId: number;
  sprintId: number;
  userId: number;
  journeyId?: number;
  companyName: string;
  role: string;
  level?: string;
  sprintGoal?: string;
  onComplete: () => void;
  onBack?: () => void;
  onStartTicketWork?: (ticketId: number) => void;
  onShowStandup?: () => void;
}

function getTypeIcon(type: TicketType) {
  switch (type) {
    case 'bug': return Bug;
    case 'feature': return Star;
    case 'improvement': return Wrench;
    default: return Code;
  }
}

function getTypeColor(type: TicketType) {
  switch (type) {
    case 'bug': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
    case 'feature': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    case 'improvement': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
    default: return 'bg-gray-100 text-gray-700';
  }
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

function TicketCard({ 
  ticket, 
  onSelect,
  onMove
}: { 
  ticket: SprintTicket;
  onSelect: (ticket: SprintTicket) => void;
  onMove: (ticketId: number, newStatus: TicketStatus) => void;
}) {
  const Icon = getTypeIcon(ticket.type as TicketType);
  const gitState = parseGitState(ticket.gitState);
  
  const priorityColors = {
    high: 'bg-red-500',
    medium: 'bg-amber-500',
    low: 'bg-gray-400',
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('ticketId', String(ticket.id));
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onSelect(ticket)}
      draggable
      onDragStart={handleDragStart}
      data-testid={`card-ticket-${ticket.ticketKey}`}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="outline" className="text-xs font-mono">
            {ticket.ticketKey}
          </Badge>
          <div 
            className={`h-2 w-2 rounded-full ${priorityColors[ticket.priority as keyof typeof priorityColors] || priorityColors.medium}`}
            title={`Priority: ${ticket.priority}`}
          />
        </div>
        
        <p className="text-sm font-medium line-clamp-2">{ticket.title}</p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {ticket.storyPoints} pts
            </Badge>
            <Badge className={cn("text-xs", getTypeColor(ticket.type as TicketType))} variant="secondary">
              <Icon className="h-3 w-3 mr-1" />
              {ticket.type}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            {gitState.branchName && (
              <GitBranch className="h-3 w-3 text-blue-500" />
            )}
            {gitState.prCreated && (
              <GitPullRequest className="h-3 w-3 text-purple-500" />
            )}
            {gitState.isMerged && (
              <CheckCircle2 className="h-3 w-3 text-green-500" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function KanbanColumn({ 
  title, 
  status, 
  tickets,
  onSelectTicket,
  onDropTicket,
}: {
  title: string;
  status: TicketStatus;
  tickets: SprintTicket[];
  onSelectTicket: (ticket: SprintTicket) => void;
  onDropTicket: (ticketId: number, newStatus: TicketStatus) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const ticketId = e.dataTransfer.getData('ticketId');
    if (ticketId) {
      onDropTicket(parseInt(ticketId), status);
    }
  };

  const statusColors = {
    todo: 'border-t-gray-400',
    in_progress: 'border-t-blue-500',
    in_review: 'border-t-amber-500',
    done: 'border-t-green-500',
  };

  return (
    <div 
      className={cn(
        "flex flex-col bg-muted/30 rounded-lg overflow-hidden border-t-4",
        statusColors[status],
        isDragOver && "ring-2 ring-blue-400"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid={`column-${status}`}
    >
      <div className="p-3 bg-background border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{title}</h3>
          <Badge variant="secondary" className="text-xs">
            {tickets.length}
          </Badge>
        </div>
      </div>
      
      <div className="flex-1 p-2 space-y-2 min-h-[200px] overflow-y-auto">
        {tickets.map(ticket => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            onSelect={onSelectTicket}
            onMove={onDropTicket}
          />
        ))}
        
        {tickets.length === 0 && (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground p-4">
            No tickets
          </div>
        )}
      </div>
    </div>
  );
}

function TicketDetailDialog({ 
  ticket, 
  open,
  onClose,
  onStartWork,
  showGitTerminal,
}: { 
  ticket: SprintTicket;
  open: boolean;
  onClose: () => void;
  onStartWork: (ticket: SprintTicket) => void;
  showGitTerminal: boolean;
}) {
  const Icon = getTypeIcon(ticket.type as TicketType);
  const gitState = parseGitState(ticket.gitState);
  const [teamMessage, setTeamMessage] = useState('');
  const [messages, setMessages] = useState<{from: string; text: string; isUser?: boolean}[]>([
    { from: 'Sarah', text: "Let me know if you need any help with this ticket!" }
  ]);

  const handleSendMessage = () => {
    if (!teamMessage.trim()) return;
    setMessages([...messages, { from: 'You', text: teamMessage, isUser: true }]);
    setTeamMessage('');
    
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        from: 'Marcus', 
        text: "Good question! Check the existing codebase patterns in src/utils for reference. I can pair with you if needed." 
      }]);
    }, 1000);
  };

  const acceptanceCriteria = Array.isArray(ticket.acceptanceCriteria) 
    ? ticket.acceptanceCriteria 
    : [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="font-mono">{ticket.ticketKey}</Badge>
            <Badge className={getTypeColor(ticket.type as TicketType)} variant="secondary">
              <Icon className="h-3 w-3 mr-1" />
              {ticket.type}
            </Badge>
          </div>
          <DialogTitle>{ticket.title}</DialogTitle>
          <DialogDescription>{ticket.description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-lg font-bold">{ticket.storyPoints}</div>
              <div className="text-xs text-muted-foreground">Points</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-lg font-bold capitalize">{ticket.priority}</div>
              <div className="text-xs text-muted-foreground">Priority</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-lg font-bold capitalize">{ticket.status?.replace('_', ' ')}</div>
              <div className="text-xs text-muted-foreground">Status</div>
            </div>
          </div>

          {acceptanceCriteria.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Acceptance Criteria
                </h4>
                <ul className="space-y-1">
                  {acceptanceCriteria.map((criterion, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <div className="h-4 w-4 rounded border border-muted-foreground/30 mt-0.5 flex-shrink-0" />
                      {String(criterion)}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
          
          <Separator />
          
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Git Workflow Progress
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <div className="flex items-center gap-2">
                  {gitState.branchName ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span className={gitState.branchName ? '' : 'text-muted-foreground'}>
                    Create feature branch
                  </span>
                </div>
                {gitState.branchName && (
                  <code className="text-xs bg-muted px-2 py-1 rounded">{gitState.branchName}</code>
                )}
              </div>
              
              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <div className="flex items-center gap-2">
                  {gitState.commits.length > 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span className={gitState.commits.length > 0 ? '' : 'text-muted-foreground'}>
                    Commit changes
                  </span>
                </div>
                {gitState.commits.length > 0 && (
                  <span className="text-xs text-muted-foreground">{gitState.commits.length} commit(s)</span>
                )}
              </div>
              
              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <div className="flex items-center gap-2">
                  {gitState.isPushed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span className={gitState.isPushed ? '' : 'text-muted-foreground'}>
                    Push to remote
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <div className="flex items-center gap-2">
                  {gitState.prCreated ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span className={gitState.prCreated ? '' : 'text-muted-foreground'}>
                    Open pull request
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <div className="flex items-center gap-2">
                  {gitState.isMerged ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span className={gitState.isMerged ? '' : 'text-muted-foreground'}>
                    Merge to main
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Team Chat
            </h4>
            <div className="border rounded-lg">
              <div className="max-h-40 overflow-y-auto p-3 space-y-2">
                {messages.map((msg, i) => (
                  <div key={i} className={cn(
                    "text-sm p-2 rounded",
                    msg.isUser ? "bg-blue-100 dark:bg-blue-900 ml-8" : "bg-muted/50 mr-8"
                  )}>
                    <span className="font-medium">{msg.from}: </span>
                    {msg.text}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 p-2 border-t">
                <Textarea 
                  value={teamMessage}
                  onChange={(e) => setTeamMessage(e.target.value)}
                  placeholder="Ask your team for help..."
                  className="min-h-[40px] resize-none"
                  rows={1}
                />
                <Button size="sm" onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            {ticket.status === 'todo' && showGitTerminal && (
              <Button onClick={() => onStartWork(ticket)} data-testid="button-start-working">
                <Play className="h-4 w-4 mr-2" />
                Start Working
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
            {ticket.status === 'in_progress' && showGitTerminal && (
              <Button onClick={() => onStartWork(ticket)} data-testid="button-continue-working">
                <Code className="h-4 w-4 mr-2" />
                Continue Working
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ExecutionModule({ 
  workspaceId, 
  sprintId,
  userId, 
  journeyId,
  companyName, 
  role,
  level = 'intern',
  sprintGoal = "Complete sprint deliverables",
  onComplete,
  onBack,
  onStartTicketWork,
  onShowStandup,
}: ExecutionModuleProps) {
  const { toast } = useToast();
  const [selectedTicket, setSelectedTicket] = useState<SprintTicket | null>(null);
  const [sprintDay, setSprintDay] = useState(1);

  const { data: sprintData } = useQuery<{ sprint: { sprintNumber: number } }>({
    queryKey: [`/api/sprints/${sprintId}`],
    enabled: !!sprintId,
  });
  
  const sprintNumber = sprintData?.sprint?.sprintNumber ?? 1;

  const adapter = useMemo(() => {
    return getSprintExecutionAdapter(role as Role, level as Level, { sprintNumber });
  }, [role, level, sprintNumber]);

  const { data: tickets = [], isLoading, error } = useQuery<SprintTicket[]>({
    queryKey: ['/api/sprints', sprintId, 'tickets'],
    enabled: !!sprintId,
  });

  const ticketsByStatus = useMemo(() => ({
    todo: tickets.filter(t => t.status === 'todo'),
    in_progress: tickets.filter(t => t.status === 'in_progress'),
    in_review: tickets.filter(t => t.status === 'in_review'),
    done: tickets.filter(t => t.status === 'done'),
  }), [tickets]);

  const totalPoints = tickets.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const completedPoints = ticketsByStatus.done.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const progressPercent = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

  const allDone = tickets.length > 0 && tickets.every(t => t.status === 'done');
  const nearComplete = tickets.length > 0 && ticketsByStatus.done.length === tickets.length - 1;
  
  const sprintConfig = adapter.sprintCompletion;
  const progressMessage = allDone 
    ? sprintConfig.progressMessages.allDone 
    : nearComplete 
      ? sprintConfig.progressMessages.nearComplete 
      : sprintConfig.progressMessages.inProgress;

  const moveTicket = useMutation({
    mutationFn: async ({ ticketId, newStatus }: { ticketId: number; newStatus: TicketStatus }) => {
      return apiRequest('PATCH', `/api/tickets/${ticketId}/move`, { newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sprints', sprintId, 'tickets'] });
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to move ticket";
      const gate = error?.gate;
      
      if (gate === 'branch_required') {
        toast({
          title: "Branch Required",
          description: "Create a branch first before starting work on this ticket.",
          variant: "destructive"
        });
      } else if (gate === 'pr_required') {
        toast({
          title: "PR Required", 
          description: "Submit a pull request before moving to review.",
          variant: "destructive"
        });
      } else if (gate === 'merge_required') {
        toast({
          title: "Merge Required",
          description: "Merge your PR before marking as done.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: message,
          variant: "destructive"
        });
      }
    }
  });

  const completePhase = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/workspaces/${workspaceId}/advance`, {
        payload: {
          completedItems: tickets.map(t => t.ticketKey),
          totalPoints,
          completedPoints
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces', workspaceId, 'state'] });
      onComplete();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete execution phase. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleMoveTicket = (ticketId: number, newStatus: TicketStatus) => {
    moveTicket.mutate({ ticketId, newStatus });
  };

  const handleStartWork = (ticket: SprintTicket) => {
    setSelectedTicket(null);
    if (onStartTicketWork) {
      onStartTicketWork(ticket.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="execution-module-loading">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Failed to load tickets</h3>
        <p className="text-muted-foreground mb-4">There was an error loading the sprint tickets.</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/sprints', sprintId, 'tickets'] })}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="execution-module">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sprint Execution</h2>
          <p className="text-gray-500 dark:text-gray-400">{sprintGoal}</p>
        </div>
        <div className="flex items-center gap-2">
          {onShowStandup && (
            <Button variant="default" onClick={onShowStandup} data-testid="button-daily-standup">
              <Users className="h-4 w-4 mr-2" />
              Daily Standup
            </Button>
          )}
          {onBack && (
            <Button variant="outline" onClick={onBack} data-testid="button-back-to-dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sprint Day</p>
              <p className="text-xl font-semibold">{sprintDay}/10</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center">
              <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="text-xl font-semibold">{progressPercent}%</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center">
              <Users className="h-5 w-5 text-amber-600 dark:text-amber-300" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">In Review</p>
              <p className="text-xl font-semibold">{ticketsByStatus.in_review.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-xl font-semibold">{completedPoints}/{totalPoints} pts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KanbanColumn
          title="To Do"
          status="todo"
          tickets={ticketsByStatus.todo}
          onSelectTicket={setSelectedTicket}
          onDropTicket={handleMoveTicket}
        />
        <KanbanColumn
          title="In Progress"
          status="in_progress"
          tickets={ticketsByStatus.in_progress}
          onSelectTicket={setSelectedTicket}
          onDropTicket={handleMoveTicket}
        />
        <KanbanColumn
          title="In Review"
          status="in_review"
          tickets={ticketsByStatus.in_review}
          onSelectTicket={setSelectedTicket}
          onDropTicket={handleMoveTicket}
        />
        <KanbanColumn
          title="Done"
          status="done"
          tickets={ticketsByStatus.done}
          onSelectTicket={setSelectedTicket}
          onDropTicket={handleMoveTicket}
        />
      </div>

      {sprintConfig.showProgressBar && !allDone && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {progressMessage}
                  </p>
                  <span className="text-sm text-muted-foreground">
                    {ticketsByStatus.done.length}/{tickets.length} tickets
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {allDone && sprintConfig.showCompletionBanner && (
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800 dark:text-green-200">
                    {sprintConfig.progressMessages.allDone}
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {sprintConfig.showTeamMessage && sprintConfig.teamMessage}
                  </p>
                  <p className="text-xs text-green-500 dark:text-green-500 mt-1">
                    {sprintConfig.completionCTA.description}
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => completePhase.mutate()}
                disabled={completePhase.isPending}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-complete-sprint"
              >
                {completePhase.isPending ? 'Completing...' : sprintConfig.completionCTA.label}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedTicket && (
        <TicketDetailDialog
          ticket={selectedTicket}
          open={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onStartWork={handleStartWork}
          showGitTerminal={adapter.uiControls.showGitTerminal}
        />
      )}
    </div>
  );
}
