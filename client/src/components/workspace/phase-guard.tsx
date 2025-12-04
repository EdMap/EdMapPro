import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, ChevronLeft, CheckCircle2 } from "lucide-react";
import type { WorkspacePhase } from "@/hooks/use-sprint-workflow";

const PHASE_ORDER: WorkspacePhase[] = ['onboarding', 'planning', 'execution', 'review', 'retro'];

const PHASE_NAMES: Record<WorkspacePhase, string> = {
  onboarding: 'Onboarding',
  planning: 'Sprint Planning',
  execution: 'Sprint Execution',
  review: 'Sprint Review',
  retro: 'Sprint Retrospective'
};

interface PhaseGuardProps {
  currentPhase: WorkspacePhase;
  requiredPhase: WorkspacePhase;
  workspaceId: number;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export function PhaseGuard({ 
  currentPhase, 
  requiredPhase, 
  workspaceId,
  onNavigate,
  children 
}: PhaseGuardProps) {
  const currentIndex = PHASE_ORDER.indexOf(currentPhase);
  const requiredIndex = PHASE_ORDER.indexOf(requiredPhase);

  if (currentPhase === requiredPhase) {
    return <>{children}</>;
  }

  if (currentIndex < requiredIndex) {
    return (
      <div className="container max-w-2xl mx-auto p-6" data-testid="phase-locked">
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/50">
          <CardHeader className="text-center">
            <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-amber-600 dark:text-amber-300" />
            </div>
            <CardTitle className="text-xl">Phase Locked</CardTitle>
            <CardDescription className="text-base">
              You need to complete earlier phases to unlock {PHASE_NAMES[requiredPhase]}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-background rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Phase</p>
                  <p className="font-medium">{PHASE_NAMES[currentPhase]}</p>
                </div>
                <Badge variant="outline" className="text-amber-600 border-amber-300">
                  In Progress
                </Badge>
              </div>
            </div>
            
            <div className="flex justify-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => onNavigate(`/workspace/${workspaceId}`)}
                data-testid="button-back-to-dashboard"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <Button 
                onClick={() => onNavigate(`/workspace/${workspaceId}/${currentPhase}`)}
                data-testid="button-continue-current-phase"
              >
                Continue {PHASE_NAMES[currentPhase]}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto p-6" data-testid="phase-completed">
      <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/50">
        <CardHeader className="text-center">
          <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-300" />
          </div>
          <CardTitle className="text-xl">Phase Completed</CardTitle>
          <CardDescription className="text-base">
            You've already completed {PHASE_NAMES[requiredPhase]}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-background rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Phase</p>
                <p className="font-medium">{PHASE_NAMES[currentPhase]}</p>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-300">
                Available
              </Badge>
            </div>
          </div>
          
          <div className="flex justify-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => onNavigate(`/workspace/${workspaceId}`)}
              data-testid="button-back-to-dashboard"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <Button 
              onClick={() => onNavigate(`/workspace/${workspaceId}/${currentPhase}`)}
              data-testid="button-continue-current-phase"
            >
              Continue {PHASE_NAMES[currentPhase]}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
