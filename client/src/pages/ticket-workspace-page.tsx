import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { TicketWorkspace } from "@/components/workspace/ticket-workspace";
import { PhaseGuard } from "@/components/workspace/phase-guard";
import { useWorkspaceState } from "@/hooks/use-sprint-workflow";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, AlertTriangle } from "lucide-react";
import type { WorkspaceInstance } from "@shared/schema";

export default function TicketWorkspacePage() {
  const params = useParams<{ journeyId: string; sprintId: string; ticketId: string }>();
  const [, navigate] = useLocation();
  
  const journeyId = params.journeyId ? parseInt(params.journeyId) : null;
  const sprintId = params.sprintId ? parseInt(params.sprintId) : null;
  const ticketId = params.ticketId ? parseInt(params.ticketId) : null;

  const { data: workspaces, isLoading: workspacesLoading } = useQuery<WorkspaceInstance[]>({
    queryKey: ['/api/users/1/workspaces'],
  });

  const workspace = workspaces?.find(w => w.journeyId === journeyId);
  const workspaceId = workspace?.id ?? null;

  const { data: state, isLoading: stateLoading, error } = useWorkspaceState(workspaceId);

  const handleBack = () => {
    if (journeyId && sprintId) {
      navigate(`/journey/${journeyId}/sprint/${sprintId}`);
    } else {
      navigate('/journey');
    }
  };

  if (workspacesLoading || stateLoading) {
    return (
      <div className="container max-w-7xl mx-auto p-6" data-testid="ticket-workspace-loading">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !state || !workspaceId || !journeyId || !sprintId || !ticketId) {
    return (
      <div className="container max-w-7xl mx-auto p-6 flex items-center justify-center min-h-[60vh]" data-testid="ticket-workspace-error">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <CardTitle>Ticket Not Found</CardTitle>
            </div>
            <CardDescription>
              {error?.message || 'Could not find the requested ticket. Please check the URL and try again.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleBack}
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Sprint
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { workspace: workspaceData } = state;
  
  const userLevel = 'intern';

  return (
    <PhaseGuard
      currentPhase={workspaceData.currentPhase}
      requiredPhase="execution"
      workspaceId={workspaceId}
      onNavigate={navigate}
    >
      <TicketWorkspace
        ticketId={ticketId}
        workspaceId={workspaceId}
        sprintId={sprintId}
        role={workspaceData.role}
        level={userLevel}
        companyName={workspaceData.companyName}
        onBack={handleBack}
      />
    </PhaseGuard>
  );
}
