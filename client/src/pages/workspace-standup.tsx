import { useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { DailyStandup } from "@/components/workspace/daily-standup";
import type { SprintTicket } from "@shared/schema";
import type { Role, Level } from "@shared/adapters";

interface WorkspaceData {
  id: number;
  companyName: string;
  role: string;
  level: string;
  currentPhase: string;
  status: string;
}

interface SprintData {
  id: number;
  theme: string;
  goal: string;
  currentDay: number;
  tickets: SprintTicket[];
}

export default function WorkspaceStandup() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [, navigate] = useLocation();
  const parsedWorkspaceId = parseInt(workspaceId || "0");

  const { data: workspace, isLoading: workspaceLoading } = useQuery<WorkspaceData>({
    queryKey: ["/api/workspaces", parsedWorkspaceId],
    enabled: parsedWorkspaceId > 0,
  });

  const { data: sprintOverview, isLoading: sprintLoading } = useQuery<{
    sprint: SprintData;
    tickets: SprintTicket[];
  }>({
    queryKey: ["/api/workspaces", parsedWorkspaceId, "sprint-overview"],
    enabled: parsedWorkspaceId > 0,
  });

  const role = useMemo(() => (workspace?.role || 'developer') as Role, [workspace?.role]);
  const level = useMemo(() => (workspace?.level || 'intern') as Level, [workspace?.level]);

  const handleComplete = () => {
    navigate(`/workspace/${parsedWorkspaceId}/execution`);
  };

  const handleBack = () => {
    if (sprintOverview?.sprint?.id) {
      const journeyQuery = new URLSearchParams(window.location.search).get('journeyId');
      if (journeyQuery) {
        navigate(`/journey/${journeyQuery}/sprint/${sprintOverview.sprint.id}`);
      } else {
        navigate(`/workspace/${parsedWorkspaceId}/execution`);
      }
    } else {
      navigate(`/workspace/${parsedWorkspaceId}/execution`);
    }
  };

  if (workspaceLoading || sprintLoading) {
    return (
      <div className="container max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!workspace || !sprintOverview) {
    return (
      <div className="container max-w-5xl mx-auto p-6">
        <p className="text-center text-muted-foreground">
          Unable to load standup. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto p-6" data-testid="workspace-standup-page">
      <DailyStandup
        workspaceId={parsedWorkspaceId}
        sprintId={sprintOverview.sprint.id}
        sprintDay={sprintOverview.sprint.currentDay}
        role={role}
        level={level}
        tickets={sprintOverview.tickets || []}
        companyName={workspace.companyName}
        onComplete={handleComplete}
        onBack={handleBack}
      />
    </div>
  );
}
