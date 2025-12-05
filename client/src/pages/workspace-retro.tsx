import { useParams, useLocation } from "wouter";
import { RetroModule } from "@/components/workspace/retro-module";
import { PhaseGuard } from "@/components/workspace/phase-guard";
import { useWorkspaceState } from "@/hooks/use-sprint-workflow";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";

export default function WorkspaceRetro() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params.workspaceId ? parseInt(params.workspaceId) : null;
  const [, navigate] = useLocation();
  
  const { data: state, isLoading, error } = useWorkspaceState(workspaceId);

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-6 space-y-6" data-testid="workspace-retro-loading">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !state || !workspaceId) {
    return (
      <div className="container max-w-4xl mx-auto p-6" data-testid="workspace-retro-error">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Retrospective</CardTitle>
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

  const { workspace, currentSprint } = state;

  const handleComplete = () => {
    navigate(`/workspace/${workspaceId}`);
  };

  const handleBack = () => {
    navigate(`/workspace/${workspaceId}`);
  };

  return (
    <PhaseGuard
      currentPhase={workspace.currentPhase}
      requiredPhase="retro"
      workspaceId={workspaceId}
      onNavigate={navigate}
    >
      <div className="container max-w-4xl mx-auto p-6" data-testid="workspace-retro">
        <RetroModule
          workspaceId={workspaceId}
          userId={workspace.userId}
          journeyId={workspace.journeyId}
          companyName={workspace.companyName}
          role={workspace.role}
          level="intern"
          sprintId={currentSprint?.id}
          onComplete={handleComplete}
          onBack={handleBack}
        />
      </div>
    </PhaseGuard>
  );
}
