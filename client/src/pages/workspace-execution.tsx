import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { ExecutionModule } from "@/components/workspace/execution-module";
import { DailyStandup } from "@/components/workspace/daily-standup";
import { TicketWorkspace } from "@/components/workspace/ticket-workspace";
import { PhaseGuard } from "@/components/workspace/phase-guard";
import { useWorkspaceState } from "@/hooks/use-sprint-workflow";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";
import type { SprintTicket } from "@shared/schema";

type ExecutionView = 'standup' | 'board' | 'ticket';

export default function WorkspaceExecution() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params.workspaceId ? parseInt(params.workspaceId) : null;
  const [, navigate] = useLocation();
  const [currentView, setCurrentView] = useState<ExecutionView>('board');
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [sprintDay, setSprintDay] = useState(1);
  
  const { data: state, isLoading, error } = useWorkspaceState(workspaceId);

  const sprintId = state?.workspace?.currentSprintId;

  const { data: tickets = [] } = useQuery<SprintTicket[]>({
    queryKey: ['/api/sprints', sprintId, 'tickets'],
    enabled: !!sprintId,
  });

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto p-6 space-y-6" data-testid="workspace-execution-loading">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error || !state || !workspaceId) {
    return (
      <div className="container max-w-4xl mx-auto p-6" data-testid="workspace-execution-error">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Execution</CardTitle>
            <CardDescription>
              {error?.message || 'Workspace not found. Please check the URL and try again.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => navigate('/journey')}
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Journey
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { workspace } = state;

  const handleComplete = () => {
    navigate(`/workspace/${workspaceId}`);
  };

  const handleBack = () => {
    navigate(`/workspace/${workspaceId}`);
  };

  const handleStandupComplete = () => {
    setCurrentView('board');
  };

  const handleStartTicketWork = (ticketId: number) => {
    setSelectedTicketId(ticketId);
    setCurrentView('ticket');
  };

  const handleBackToBoard = () => {
    setSelectedTicketId(null);
    setCurrentView('board');
  };

  const handleShowStandup = () => {
    setCurrentView('standup');
  };

  const userLevel = 'intern';

  if (currentView === 'ticket' && selectedTicketId && sprintId) {
    return (
      <TicketWorkspace
        ticketId={selectedTicketId}
        workspaceId={workspaceId}
        sprintId={sprintId}
        role={workspace.role}
        level={userLevel}
        companyName={workspace.companyName}
        onBack={handleBackToBoard}
      />
    );
  }

  if (currentView === 'standup' && sprintId) {
    return (
      <PhaseGuard
        currentPhase={workspace.currentPhase}
        requiredPhase="execution"
        workspaceId={workspaceId}
        onNavigate={navigate}
      >
        <div className="container max-w-7xl mx-auto p-6" data-testid="workspace-standup">
          <DailyStandup
            workspaceId={workspaceId}
            sprintId={sprintId}
            sprintDay={sprintDay}
            role={workspace.role}
            level={userLevel}
            tickets={tickets}
            companyName={workspace.companyName}
            onComplete={handleStandupComplete}
            onBack={handleBackToBoard}
          />
        </div>
      </PhaseGuard>
    );
  }

  return (
    <PhaseGuard
      currentPhase={workspace.currentPhase}
      requiredPhase="execution"
      workspaceId={workspaceId}
      onNavigate={navigate}
    >
      <div className="container max-w-7xl mx-auto p-6" data-testid="workspace-execution">
        <ExecutionModule
          workspaceId={workspaceId}
          sprintId={sprintId || 0}
          userId={workspace.userId}
          journeyId={workspace.journeyId}
          companyName={workspace.companyName}
          role={workspace.role}
          level={userLevel}
          onComplete={handleComplete}
          onBack={handleBack}
          onStartTicketWork={handleStartTicketWork}
          onShowStandup={handleShowStandup}
        />
      </div>
    </PhaseGuard>
  );
}
