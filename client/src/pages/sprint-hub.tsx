import { useState, useMemo } from "react";
import { useParams, Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft,
  GitBranch, 
  GitPullRequest,
  CheckCircle2, 
  Clock, 
  Target,
  Users,
  Play,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Trophy,
} from "lucide-react";
import { 
  useSprintOverview, 
  useKanbanState,
  useMoveTicket,
  useJourneyDashboard,
  useJourneyWorkspace,
  useAdvanceWorkspacePhase,
  type TicketStatus,
} from "@/hooks/use-sprint-workflow";
import type { SprintTicket } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { getSprintExecutionAdapter } from "@shared/adapters/execution";
import type { Role, Level } from "@shared/adapters";

type TicketGitState = {
  branchCreated?: boolean;
  branchName?: string;
  hasPR?: boolean;
  prTitle?: string;
  merged?: boolean;
};

function TicketCard({ 
  ticket, 
  sprintId,
  onSelect 
}: { 
  ticket: SprintTicket;
  sprintId: number;
  onSelect: (ticket: SprintTicket) => void;
}) {
  const gitState = ticket.gitState as TicketGitState | null;
  
  const priorityColors = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-blue-500',
    low: 'bg-gray-400',
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onSelect(ticket)}
      data-testid={`card-ticket-${ticket.id}`}
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
              {ticket.storyPoints || 0} pts
            </Badge>
            <Badge variant="outline" className="capitalize text-xs">
              {ticket.type}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            {gitState?.branchCreated && (
              <GitBranch className="h-3 w-3 text-blue-500" />
            )}
            {gitState?.hasPR && (
              <GitPullRequest className="h-3 w-3 text-purple-500" />
            )}
            {gitState?.merged && (
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
  sprintId,
  count,
  onSelectTicket,
  onDropTicket,
}: {
  title: string;
  status: TicketStatus;
  tickets: SprintTicket[];
  sprintId: number;
  count: number;
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
    const ticketId = parseInt(e.dataTransfer.getData('ticketId'));
    if (!isNaN(ticketId)) {
      onDropTicket(ticketId, status);
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
      className={`flex flex-col bg-muted/30 rounded-lg overflow-hidden border-t-4 ${statusColors[status]} ${
        isDragOver ? 'ring-2 ring-blue-400' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid={`column-${status}`}
    >
      <div className="p-3 bg-background border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{title}</h3>
          <Badge variant="secondary" className="text-xs">
            {count}
          </Badge>
        </div>
      </div>
      
      <div className="flex-1 p-2 space-y-2 min-h-[200px] overflow-y-auto">
        {tickets.map(ticket => (
          <div
            key={ticket.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('ticketId', ticket.id.toString());
            }}
          >
            <TicketCard
              ticket={ticket}
              sprintId={sprintId}
              onSelect={onSelectTicket}
            />
          </div>
        ))}
        
        {tickets.length === 0 && (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            No tickets
          </div>
        )}
      </div>
    </div>
  );
}

function TicketDetailPanel({ 
  ticket, 
  sprintId,
  onClose 
}: { 
  ticket: SprintTicket;
  sprintId: number;
  onClose: () => void;
}) {
  const params = useParams<{ journeyId: string }>();
  const journeyId = params.journeyId;
  const gitState = ticket.gitState as TicketGitState | null;
  
  return (
    <Card className="sticky top-4" data-testid="panel-ticket-detail">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <Badge variant="outline" className="mb-2 font-mono">
              {ticket.ticketKey}
            </Badge>
            <CardTitle className="text-lg">{ticket.title}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {ticket.description}
        </p>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Status</p>
            <Badge className="mt-1 capitalize">{ticket.status.replace('_', ' ')}</Badge>
          </div>
          <div>
            <p className="text-muted-foreground">Type</p>
            <Badge variant="outline" className="mt-1 capitalize">{ticket.type}</Badge>
          </div>
          <div>
            <p className="text-muted-foreground">Priority</p>
            <Badge variant="secondary" className="mt-1 capitalize">{ticket.priority}</Badge>
          </div>
          <div>
            <p className="text-muted-foreground">Story Points</p>
            <Badge variant="secondary" className="mt-1">{ticket.storyPoints || 0}</Badge>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Git Workflow
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              {gitState?.branchCreated ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={gitState?.branchCreated ? '' : 'text-muted-foreground'}>
                Branch created
              </span>
            </div>
            <div className="flex items-center gap-2">
              {gitState?.hasPR ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={gitState?.hasPR ? '' : 'text-muted-foreground'}>
                Pull request submitted
              </span>
            </div>
            <div className="flex items-center gap-2">
              {gitState?.merged ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={gitState?.merged ? '' : 'text-muted-foreground'}>
                Merged to main
              </span>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <Link href={`/journey/${journeyId}/sprint/${sprintId}/ticket/${ticket.id}`}>
          <Button className="w-full gap-2" data-testid="button-work-on-ticket">
            <Play className="h-4 w-4" />
            Work on Ticket
            <ChevronRight className="h-4 w-4 ml-auto" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function SprintHub() {
  const params = useParams<{ journeyId: string; sprintId: string }>();
  const journeyId = params.journeyId ? parseInt(params.journeyId) : null;
  const sprintId = params.sprintId ? parseInt(params.sprintId) : null;
  
  const [selectedTicket, setSelectedTicket] = useState<SprintTicket | null>(null);
  
  const [, navigate] = useLocation();
  const { data: overview, isLoading } = useSprintOverview(sprintId);
  const { data: journeyDashboard } = useJourneyDashboard(journeyId);
  const { data: workspace } = useJourneyWorkspace(journeyId);
  const { ticketsByStatus } = useKanbanState(sprintId);
  const moveTicket = useMoveTicket();
  const advancePhase = useAdvanceWorkspacePhase();
  const { toast } = useToast();
  
  const adapter = useMemo(() => {
    const role = (journeyDashboard?.journey?.journeyMetadata as any)?.role || 'developer';
    const level = (journeyDashboard?.journey?.journeyMetadata as any)?.entryLevel || 'intern';
    return getSprintExecutionAdapter(role as Role, level as Level);
  }, [journeyDashboard]);

  const handleMoveTicket = (ticketId: number, newStatus: TicketStatus) => {
    moveTicket.mutate(
      { ticketId, newStatus, sprintId: sprintId || undefined },
      {
        onError: (error) => {
          toast({
            title: "Cannot move ticket",
            description: error.message,
            variant: "destructive",
          });
        },
        onSuccess: () => {
          if (selectedTicket?.id === ticketId) {
            setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
          }
        }
      }
    );
  };

  const handleProceedToReview = () => {
    if (!workspace?.id) return;
    
    advancePhase.mutate(
      { workspaceId: workspace.id },
      {
        onSuccess: () => {
          navigate(`/workspace/${workspace.id}/review`);
        },
        onError: (error) => {
          toast({
            title: "Cannot proceed to review",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    );
  };

  if (isLoading || !overview) {
    return (
      <div className="container max-w-7xl mx-auto p-6 space-y-6" data-testid="sprint-hub-loading">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const { sprint, currentDay, ticketStats, upcomingCeremonies } = overview;
  const totalPoints = sprint.storyPointsTarget;
  const completedPoints = overview.tickets
    .filter(t => t.status === 'done')
    .reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const progressPercent = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
  
  const allDone = overview.tickets.length > 0 && overview.tickets.every(t => t.status === 'done');
  const nearComplete = overview.tickets.length > 0 && ticketsByStatus.done.length === overview.tickets.length - 1;
  
  const sprintConfig = adapter.sprintCompletion;
  const progressMessage = allDone 
    ? sprintConfig.progressMessages.allDone 
    : nearComplete 
      ? sprintConfig.progressMessages.nearComplete 
      : sprintConfig.progressMessages.inProgress;

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6" data-testid="sprint-hub">
      <div className="flex items-center gap-4">
        <Link href={`/journey/${journeyId}`}>
          <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-sprint-title">
            {sprint.theme}
          </h1>
          <p className="text-muted-foreground">{sprint.goal}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Sprint Day</p>
            <p className="text-2xl font-bold" data-testid="text-sprint-day">{currentDay}/10</p>
          </div>
          <Separator orientation="vertical" className="h-10" />
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Story Points</p>
            <p className="text-2xl font-bold" data-testid="text-story-points">
              {completedPoints}/{totalPoints}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Target className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="text-xl font-semibold">{progressPercent}%</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-xl font-semibold">{ticketStats.inProgress}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
              <GitPullRequest className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">In Review</p>
              <p className="text-xl font-semibold">{ticketStats.inReview}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Done</p>
              <p className="text-xl font-semibold">{ticketStats.done}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {allDone && (
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
                  {sprintConfig.showTeamMessage && sprintConfig.teamMessage && (
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {sprintConfig.teamMessage}
                    </p>
                  )}
                  <p className="text-xs text-green-500 dark:text-green-500 mt-1">
                    {sprintConfig.completionCTA.description}
                  </p>
                </div>
              </div>
              <Button 
                className="bg-green-600 hover:bg-green-700 gap-2"
                data-testid="button-complete-sprint"
                disabled={!workspace?.id || advancePhase.isPending}
                onClick={handleProceedToReview}
              >
                {advancePhase.isPending ? 'Preparing...' : sprintConfig.completionCTA.label}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!allDone && nearComplete && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Target className="h-5 w-5 text-amber-600" />
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                {sprintConfig.progressMessages.nearComplete}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!allDone && upcomingCeremonies.length > 0 && upcomingCeremonies[0].ceremonyType === 'standup' && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Daily Standup</p>
                  <p className="text-sm text-muted-foreground">
                    Share your progress with the team
                  </p>
                </div>
              </div>
              <Link href={`/workspace/${workspace?.id}/standup?journeyId=${journeyId}`}>
                <Button className="gap-2" data-testid="button-start-ceremony">
                  <Play className="h-4 w-4" />
                  Start
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-6">
        <div className={`flex-1 grid grid-cols-4 gap-4 ${selectedTicket ? 'lg:w-2/3' : 'w-full'}`}>
          <KanbanColumn
            title="To Do"
            status="todo"
            tickets={ticketsByStatus.todo}
            sprintId={sprintId || 0}
            count={ticketStats.todo}
            onSelectTicket={setSelectedTicket}
            onDropTicket={handleMoveTicket}
          />
          <KanbanColumn
            title="In Progress"
            status="in_progress"
            tickets={ticketsByStatus.in_progress}
            sprintId={sprintId || 0}
            count={ticketStats.inProgress}
            onSelectTicket={setSelectedTicket}
            onDropTicket={handleMoveTicket}
          />
          <KanbanColumn
            title="In Review"
            status="in_review"
            tickets={ticketsByStatus.in_review}
            sprintId={sprintId || 0}
            count={ticketStats.inReview}
            onSelectTicket={setSelectedTicket}
            onDropTicket={handleMoveTicket}
          />
          <KanbanColumn
            title="Done"
            status="done"
            tickets={ticketsByStatus.done}
            sprintId={sprintId || 0}
            count={ticketStats.done}
            onSelectTicket={setSelectedTicket}
            onDropTicket={handleMoveTicket}
          />
        </div>
        
        {selectedTicket && (
          <div className="w-80 shrink-0">
            <TicketDetailPanel
              ticket={selectedTicket}
              sprintId={sprintId || 0}
              onClose={() => setSelectedTicket(null)}
            />
          </div>
        )}
      </div>

      <Progress value={currentDay * 10} className="h-2" />
      <p className="text-xs text-muted-foreground text-center">
        Day {currentDay} of 10 - {10 - currentDay} days remaining in sprint
      </p>
    </div>
  );
}
