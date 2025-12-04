import { Link } from "wouter";
import { Check, ChevronRight, Circle, Play, Users, Repeat, MessageSquare, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export type WorkspacePhase = 'onboarding' | 'planning' | 'execution' | 'review' | 'retro';

interface PhaseStep {
  id: WorkspacePhase;
  label: string;
  description: string;
  icon: typeof Check;
}

const PHASE_STEPS: PhaseStep[] = [
  { id: 'onboarding', label: 'Onboarding', description: 'Meet the team & get set up', icon: Users },
  { id: 'planning', label: 'Planning', description: 'Define sprint scope', icon: Target },
  { id: 'execution', label: 'Execution', description: 'Complete sprint work', icon: Play },
  { id: 'review', label: 'Review', description: 'Demo completed work', icon: MessageSquare },
  { id: 'retro', label: 'Retrospective', description: 'Reflect & improve', icon: Repeat },
];

function getPhaseIndex(phase: WorkspacePhase): number {
  return PHASE_STEPS.findIndex(s => s.id === phase);
}

function getPhaseColor(phase: WorkspacePhase, isActive: boolean, isCompleted: boolean): string {
  if (isCompleted) return 'bg-green-500 text-white';
  if (!isActive) return 'bg-muted text-muted-foreground';
  
  switch (phase) {
    case 'onboarding': return 'bg-teal-500 text-white';
    case 'planning': return 'bg-indigo-500 text-white';
    case 'execution': return 'bg-blue-500 text-white';
    case 'review': return 'bg-amber-500 text-white';
    case 'retro': return 'bg-violet-500 text-white';
    default: return 'bg-primary text-primary-foreground';
  }
}

function getConnectorColor(currentPhaseIndex: number, stepIndex: number): string {
  if (stepIndex < currentPhaseIndex) return 'bg-green-500';
  return 'bg-muted';
}

interface PhaseStepperProps {
  currentPhase: WorkspacePhase;
  completedPhases?: WorkspacePhase[];
  workspaceId: number;
  sprintId?: number | null;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  interactive?: boolean;
}

export function PhaseStepper({
  currentPhase,
  completedPhases = [],
  workspaceId,
  sprintId,
  orientation = 'horizontal',
  size = 'md',
  showLabels = true,
  interactive = false,
}: PhaseStepperProps) {
  const currentIndex = getPhaseIndex(currentPhase);
  
  const isVertical = orientation === 'vertical';
  
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };
  
  const circleSizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };
  
  const getPhaseRoute = (phase: WorkspacePhase): string | null => {
    if (!interactive) return null;
    
    switch (phase) {
      case 'onboarding':
        return `/workspace/${workspaceId}/onboarding`;
      case 'planning':
        return `/workspace/${workspaceId}/planning`;
      case 'execution':
        return sprintId ? `/sprint/${sprintId}` : null;
      case 'review':
        return `/workspace/${workspaceId}/review`;
      case 'retro':
        return `/workspace/${workspaceId}/retro`;
      default:
        return null;
    }
  };
  
  return (
    <div 
      className={cn(
        "flex",
        isVertical ? "flex-col space-y-0" : "flex-row items-start justify-between",
        "w-full"
      )}
      data-testid="phase-stepper"
    >
      {PHASE_STEPS.map((step, index) => {
        const isActive = step.id === currentPhase;
        const isCompleted = completedPhases.includes(step.id) || index < currentIndex;
        const Icon = isCompleted ? Check : step.icon;
        const route = getPhaseRoute(step.id);
        
        const stepContent = (
          <div 
            className={cn(
              "flex",
              isVertical ? "flex-row items-start gap-4" : "flex-col items-center",
              interactive && route && "cursor-pointer"
            )}
          >
            <div 
              className={cn(
                "flex items-center justify-center rounded-full transition-colors",
                circleSizes[size],
                getPhaseColor(step.id, isActive, isCompleted),
                isActive && "ring-2 ring-offset-2 ring-offset-background",
                isActive && step.id === 'onboarding' && "ring-teal-500",
                isActive && step.id === 'planning' && "ring-indigo-500",
                isActive && step.id === 'execution' && "ring-blue-500",
                isActive && step.id === 'review' && "ring-amber-500",
                isActive && step.id === 'retro' && "ring-violet-500"
              )}
              data-testid={`phase-step-icon-${step.id}`}
            >
              <Icon className={iconSizes[size]} />
            </div>
            
            {showLabels && (
              <div className={cn(
                isVertical ? "pt-0" : "mt-2 text-center",
                "space-y-0.5"
              )}>
                <p 
                  className={cn(
                    "font-medium leading-none",
                    size === 'sm' && "text-xs",
                    size === 'md' && "text-sm",
                    size === 'lg' && "text-base",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                  data-testid={`phase-step-label-${step.id}`}
                >
                  {step.label}
                </p>
                {size !== 'sm' && (
                  <p 
                    className={cn(
                      "text-muted-foreground",
                      size === 'md' && "text-xs",
                      size === 'lg' && "text-sm"
                    )}
                  >
                    {step.description}
                  </p>
                )}
              </div>
            )}
          </div>
        );
        
        return (
          <div 
            key={step.id}
            className={cn(
              "flex",
              isVertical ? "flex-row" : "flex-col items-center flex-1",
              index === PHASE_STEPS.length - 1 && !isVertical && "flex-initial"
            )}
          >
            {interactive && route ? (
              <Link href={route} className="hover:opacity-80 transition-opacity">
                {stepContent}
              </Link>
            ) : (
              stepContent
            )}
            
            {index < PHASE_STEPS.length - 1 && (
              isVertical ? (
                <div className="flex flex-col items-center ml-4">
                  <div 
                    className={cn(
                      "w-0.5 h-8",
                      getConnectorColor(currentIndex, index)
                    )} 
                  />
                </div>
              ) : (
                <div className={cn(
                  "hidden md:flex items-center flex-1 mx-2",
                  "mt-5"
                )}>
                  <div 
                    className={cn(
                      "flex-1 h-0.5",
                      getConnectorColor(currentIndex, index)
                    )} 
                  />
                  <ChevronRight 
                    className={cn(
                      "h-4 w-4 mx-1",
                      index < currentIndex ? "text-green-500" : "text-muted-foreground"
                    )} 
                  />
                  <div 
                    className={cn(
                      "flex-1 h-0.5",
                      getConnectorColor(currentIndex, index)
                    )} 
                  />
                </div>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}

interface MiniPhaseStepperProps {
  currentPhase: WorkspacePhase;
}

export function MiniPhaseStepper({ currentPhase }: MiniPhaseStepperProps) {
  const currentIndex = getPhaseIndex(currentPhase);
  
  return (
    <div className="flex items-center gap-1" data-testid="mini-phase-stepper">
      {PHASE_STEPS.map((step, index) => (
        <div key={step.id} className="flex items-center">
          {index > 0 && (
            <div 
              className={cn(
                "w-3 h-0.5 mx-0.5",
                index <= currentIndex ? getConnectorColor(currentIndex, index - 1) : "bg-muted"
              )} 
            />
          )}
          <div 
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              index === currentIndex 
                ? getPhaseColor(step.id, true, false)
                : index < currentIndex
                ? "bg-green-500"
                : "bg-muted"
            )}
            title={step.label}
          />
        </div>
      ))}
    </div>
  );
}
