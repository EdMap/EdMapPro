import { useParams, Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowRight, 
  Building2, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  Play,
  ChevronLeft,
  Lightbulb,
} from "lucide-react";
import { PhaseStepper, MiniPhaseStepper, type WorkspacePhase } from "@/components/workspace/phase-stepper";
import { useWorkspaceState, useAdvanceWorkspacePhase } from "@/hooks/use-sprint-workflow";
import { useToast } from "@/hooks/use-toast";

function getPhaseColor(phase: WorkspacePhase): string {
  switch (phase) {
    case 'onboarding': return 'border-teal-500 bg-teal-50 dark:bg-teal-950';
    case 'planning': return 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950';
    case 'execution': return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
    case 'review': return 'border-amber-500 bg-amber-50 dark:bg-amber-950';
    case 'retro': return 'border-violet-500 bg-violet-50 dark:bg-violet-950';
    default: return 'border-gray-500 bg-gray-50';
  }
}

function getPhaseLabel(phase: WorkspacePhase): string {
  switch (phase) {
    case 'onboarding': return 'Onboarding';
    case 'planning': return 'Sprint Planning';
    case 'execution': return 'Sprint Execution';
    case 'review': return 'Sprint Review';
    case 'retro': return 'Sprint Retrospective';
    default: return phase;
  }
}

function getPhaseTip(phase: WorkspacePhase): string {
  switch (phase) {
    case 'onboarding': 
      return "Welcome! Start by meeting your team and reviewing the company documentation. Take your time to understand how things work.";
    case 'planning': 
      return "Review the product backlog with your team. Select priority items and agree on a sprint goal. Commit to a realistic scope.";
    case 'execution': 
      return "Focus on completing your assigned tickets. Attend daily standups and don't hesitate to ask for help when stuck.";
    case 'review': 
      return "Prepare to demo your completed work. Gather feedback from stakeholders and celebrate what you've accomplished!";
    case 'retro': 
      return "Reflect on the sprint honestly. Share what went well, identify improvements, and commit to actionable changes for next time.";
    default: 
      return "";
  }
}

export default function WorkspaceDashboard() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params.workspaceId ? parseInt(params.workspaceId) : null;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const { data: state, isLoading, error } = useWorkspaceState(workspaceId);
  const advancePhase = useAdvanceWorkspacePhase();

  const handleAdvancePhase = async () => {
    if (!workspaceId) return;
    
    try {
      await advancePhase.mutateAsync({ workspaceId });
      toast({
        title: "Phase Advanced",
        description: "Moving to the next phase of your workspace journey.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to advance phase. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto p-6 space-y-6" data-testid="workspace-dashboard-loading">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="container max-w-6xl mx-auto p-6" data-testid="workspace-dashboard-error">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Workspace</CardTitle>
            <CardDescription>
              {error?.message || 'Workspace not found. Please check the URL and try again.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/journey">
              <Button variant="outline" className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Back to Journey
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { workspace, currentPhase, currentSprint, phaseChecklist, nextActions, phaseHistory } = state;
  const primaryAction = nextActions.find(a => a.priority === 'primary');
  const secondaryActions = nextActions.filter(a => a.priority === 'secondary');
  const completedItems = phaseChecklist.filter(item => item.completed).length;
  const requiredItems = phaseChecklist.filter(item => item.required);
  const allRequiredCompleted = requiredItems.every(item => item.completed);

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6" data-testid="workspace-dashboard">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/journey/${workspace.journeyId}`}>
            <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-journey">
              <ChevronLeft className="h-4 w-4" />
              Journey
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" data-testid="text-workspace-title">
              <Building2 className="h-6 w-6" />
              {workspace.companyName}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Briefcase className="h-4 w-4" />
              <span data-testid="text-workspace-role">{workspace.role}</span>
            </p>
          </div>
        </div>
        
        {primaryAction && (
          <Link href={primaryAction.route}>
            <Button size="lg" className="gap-2" data-testid="button-primary-action">
              <Play className="h-4 w-4" />
              {primaryAction.action}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>

      <Card className="border-t-4 border-t-primary" data-testid="card-phase-stepper">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Your Progress</CardTitle>
          <CardDescription>
            Follow the Scrum workflow phases to complete your journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PhaseStepper 
            currentPhase={currentPhase}
            workspaceId={workspace.id}
            sprintId={workspace.currentSprintId}
            size="md"
            showLabels={true}
            interactive={true}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card 
          className={`lg:col-span-2 border-l-4 ${getPhaseColor(currentPhase)}`}
          data-testid="card-current-phase"
        >
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <Badge 
                  variant="outline" 
                  className="mb-2"
                  data-testid="badge-phase"
                >
                  Current Phase
                </Badge>
                <CardTitle className="text-xl" data-testid="text-phase-title">
                  {getPhaseLabel(currentPhase)}
                </CardTitle>
              </div>
              <MiniPhaseStepper currentPhase={currentPhase} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-lg bg-muted/50 flex gap-3" data-testid="phase-tip">
              <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                {getPhaseTip(currentPhase)}
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Phase Checklist
                <span className="text-sm text-muted-foreground font-normal">
                  ({completedItems}/{phaseChecklist.length} completed)
                </span>
              </h4>
              <div className="space-y-2">
                {phaseChecklist.map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg bg-background border"
                    data-testid={`checklist-item-${index}`}
                  >
                    <Checkbox 
                      checked={item.completed}
                      disabled
                      className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                    />
                    <span className={item.completed ? "line-through text-muted-foreground" : ""}>
                      {item.item}
                    </span>
                    {item.required && !item.completed && (
                      <Badge variant="outline" className="ml-auto text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {secondaryActions.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-3">Quick Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    {secondaryActions.map((action, index) => (
                      <Link key={index} href={action.route}>
                        <Button variant="outline" size="sm" data-testid={`button-action-${index}`}>
                          {action.action}
                        </Button>
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card data-testid="card-sprint-info">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sprint Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentSprint ? (
                <div className="space-y-2">
                  <p className="font-medium" data-testid="text-sprint-theme">
                    {currentSprint.theme}
                  </p>
                  <p className="text-sm text-muted-foreground" data-testid="text-sprint-goal">
                    {currentSprint.goal}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3">
                    <Clock className="h-4 w-4" />
                    <span>Sprint {currentSprint.sprintNumber}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No active sprint. Complete {currentPhase === 'onboarding' ? 'onboarding' : 'planning'} to start a sprint.
                </p>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-phase-history">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {phaseHistory.length > 0 ? (
                <div className="space-y-3">
                  {phaseHistory.slice(0, 5).map((event, index) => (
                    <div 
                      key={event.id}
                      className="flex items-start gap-2 text-sm"
                      data-testid={`history-item-${index}`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${
                        event.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                      }`} />
                      <div>
                        <p className="font-medium capitalize">
                          {event.phase.replace('_', ' ')} {event.status}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No activity yet. Get started with your workspace!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
