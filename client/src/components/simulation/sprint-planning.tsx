import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Target,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Calendar,
  Bug,
  Sparkles,
  Zap,
  ArrowRight,
  Loader2,
  MessageSquare,
} from "lucide-react";
import type { SprintTicket, Sprint, CeremonyInstance } from "@shared/schema";

interface SprintPlanningProps {
  sprint: Sprint;
  ceremony: CeremonyInstance;
  tickets: SprintTicket[];
  onComplete: () => void;
  mode: 'journey' | 'practice';
}

interface PlanningAdvice {
  recommendation: string;
  capacityAnalysis: string;
  risks: string[];
  tips: string[];
}

const TEAM_VELOCITY = 20;
const SPRINT_CAPACITY = 21;

export default function SprintPlanning({
  sprint,
  ceremony,
  tickets,
  onComplete,
  mode
}: SprintPlanningProps) {
  const { toast } = useToast();
  const [selectedTickets, setSelectedTickets] = useState<number[]>(
    tickets.filter(t => t.status !== 'done').map(t => t.id)
  );
  const [sprintGoal, setSprintGoal] = useState("");
  const [showAIAdvice, setShowAIAdvice] = useState(false);
  const [currentStep, setCurrentStep] = useState<'backlog' | 'goal' | 'confirm'>('backlog');

  const totalPoints = tickets
    .filter(t => selectedTickets.includes(t.id))
    .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

  const capacityPercentage = Math.min(100, (totalPoints / SPRINT_CAPACITY) * 100);
  const isOverCapacity = totalPoints > SPRINT_CAPACITY;

  const ticketsByType = {
    bug: tickets.filter(t => t.type === 'bug'),
    feature: tickets.filter(t => t.type === 'feature'),
  };

  const selectedByType = {
    bug: ticketsByType.bug.filter(t => selectedTickets.includes(t.id)).length,
    feature: ticketsByType.feature.filter(t => selectedTickets.includes(t.id)).length,
  };

  const toggleTicket = (ticketId: number) => {
    setSelectedTickets(prev =>
      prev.includes(ticketId)
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const updateCeremonyMutation = useMutation({
    mutationFn: async (data: { status: string; outcome?: any }) => {
      const response = await apiRequest("PATCH", `/api/ceremonies/${ceremony.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sprints', sprint.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/ceremonies'] });
    },
  });

  const handleStartPlanning = async () => {
    if (ceremony.status === 'pending') {
      await updateCeremonyMutation.mutateAsync({ status: 'in_progress' });
    }
  };

  const handleCompletePlanning = async () => {
    if (!sprintGoal.trim()) {
      toast({
        title: "Sprint goal required",
        description: "Please enter a sprint goal before completing planning.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await updateCeremonyMutation.mutateAsync({
        status: 'completed',
        outcome: {
          selectedTickets,
          sprintGoal,
          totalPoints,
          completedAt: new Date().toISOString(),
        }
      });
      toast({
        title: "Sprint planning complete",
        description: "Your sprint has been planned successfully.",
      });
      onComplete();
    } catch (error) {
      console.error('Failed to complete sprint planning:', error);
      toast({
        title: "Failed to complete planning",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const advice: PlanningAdvice = {
    recommendation: totalPoints <= TEAM_VELOCITY 
      ? "Your sprint scope looks balanced. The selected work aligns well with the team's typical velocity."
      : "Consider reducing scope. You've selected more points than the team's historical velocity suggests is sustainable.",
    capacityAnalysis: isOverCapacity
      ? `Warning: You've selected ${totalPoints} points, which exceeds the sprint capacity of ${SPRINT_CAPACITY} points.`
      : `You've selected ${totalPoints} of ${SPRINT_CAPACITY} available points (${Math.round(capacityPercentage)}% capacity).`,
    risks: [
      ...(isOverCapacity ? ["Risk of not completing all committed work"] : []),
      ...(selectedByType.bug > selectedByType.feature * 2 ? ["Heavy bug focus may delay feature development"] : []),
      ...(totalPoints < 10 ? ["Very light sprint - consider adding more scope"] : []),
    ],
    tips: [
      "Break down any ticket over 5 points into smaller tasks",
      "Ensure at least one team member is familiar with each selected ticket",
      "Reserve ~15% capacity for unexpected work",
      "Prioritize tickets that unblock other work",
    ],
  };

  const renderBacklogStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Select Sprint Backlog</h3>
          <p className="text-sm text-muted-foreground">
            Choose which tickets to commit to this sprint
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAIAdvice(!showAIAdvice)}
          data-testid="button-toggle-advice"
        >
          <Lightbulb className="h-4 w-4 mr-2" />
          {showAIAdvice ? 'Hide' : 'Show'} Tips
        </Button>
      </div>

      {showAIAdvice && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-900">{advice.recommendation}</p>
                <p className="text-sm text-blue-700">{advice.capacityAnalysis}</p>
                {advice.risks.length > 0 && (
                  <div className="space-y-1 mt-2">
                    <p className="text-xs font-medium text-blue-800">Potential Risks:</p>
                    <ul className="text-xs text-blue-700 list-disc ml-4">
                      {advice.risks.map((risk, i) => (
                        <li key={i}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Bug className="h-4 w-4 text-red-500" />
                  <span className="font-medium">Bugs ({ticketsByType.bug.length})</span>
                  <Badge variant="secondary" className="ml-auto">
                    {selectedByType.bug} selected
                  </Badge>
                </div>
                {ticketsByType.bug.map(ticket => (
                  <TicketItem
                    key={ticket.id}
                    ticket={ticket}
                    selected={selectedTickets.includes(ticket.id)}
                    onToggle={() => toggleTicket(ticket.id)}
                  />
                ))}
                {ticketsByType.bug.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">No bugs in backlog</p>
                )}
              </div>

              <Separator />

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="font-medium">Features ({ticketsByType.feature.length})</span>
                  <Badge variant="secondary" className="ml-auto">
                    {selectedByType.feature} selected
                  </Badge>
                </div>
                {ticketsByType.feature.map(ticket => (
                  <TicketItem
                    key={ticket.id}
                    ticket={ticket}
                    selected={selectedTickets.includes(ticket.id)}
                    onToggle={() => toggleTicket(ticket.id)}
                  />
                ))}
                {ticketsByType.feature.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">No features in backlog</p>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>

        <div className="col-span-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Sprint Capacity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Committed Points</span>
                  <span className={isOverCapacity ? 'text-red-600 font-medium' : ''}>
                    {totalPoints} / {SPRINT_CAPACITY}
                  </span>
                </div>
                <Progress 
                  value={capacityPercentage} 
                  className={isOverCapacity ? '[&>div]:bg-red-500' : ''}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Team Velocity</span>
                  <span>{TEAM_VELOCITY} pts/sprint</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Selected Tickets</span>
                  <span>{selectedTickets.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bugs</span>
                  <span>{selectedByType.bug}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Features</span>
                  <span>{selectedByType.feature}</span>
                </div>
              </div>

              {isOverCapacity && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-sm text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Over capacity! Consider removing some items.</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={() => setCurrentStep('goal')} 
          disabled={selectedTickets.length === 0}
          data-testid="button-continue-to-goal"
        >
          Continue to Sprint Goal
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderGoalStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Set Sprint Goal</h3>
        <p className="text-sm text-muted-foreground">
          Define a clear objective that the team will work towards this sprint
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Sprint Goal</label>
              <Textarea
                placeholder="e.g., 'Complete user authentication flow and fix critical payment bugs'"
                value={sprintGoal}
                onChange={(e) => setSprintGoal(e.target.value)}
                className="min-h-[100px]"
                data-testid="input-sprint-goal"
              />
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Tips for a Good Sprint Goal</p>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Focus on the business value to be delivered</li>
                    <li>• Make it specific and measurable</li>
                    <li>• Ensure it's achievable within the sprint</li>
                    <li>• Align with the selected backlog items</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep('backlog')} data-testid="button-back-to-backlog">
          Back to Backlog
        </Button>
        <Button 
          onClick={() => setCurrentStep('confirm')} 
          disabled={!sprintGoal.trim()}
          data-testid="button-continue-to-confirm"
        >
          Review & Confirm
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderConfirmStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Confirm Sprint Plan</h3>
        <p className="text-sm text-muted-foreground">
          Review your sprint commitments before finalizing
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Sprint Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{sprintGoal}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Capacity Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Tickets</span>
                <span className="font-medium">{selectedTickets.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Story Points</span>
                <span className={`font-medium ${isOverCapacity ? 'text-red-600' : ''}`}>
                  {totalPoints} / {SPRINT_CAPACITY}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Utilization</span>
                <span className="font-medium">{Math.round(capacityPercentage)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Selected Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {tickets
                .filter(t => selectedTickets.includes(t.id))
                .map(ticket => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      {ticket.type === 'bug' ? (
                        <Bug className="h-3 w-3 text-red-500" />
                      ) : (
                        <Sparkles className="h-3 w-3 text-purple-500" />
                      )}
                      <span className="text-sm font-mono text-muted-foreground">
                        {ticket.ticketKey}
                      </span>
                      <span className="text-sm">{ticket.title}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {ticket.storyPoints} pts
                    </Badge>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep('goal')} data-testid="button-back-to-goal">
          Back to Goal
        </Button>
        <Button 
          onClick={handleCompletePlanning}
          disabled={updateCeremonyMutation.isPending}
          data-testid="button-start-sprint"
        >
          {updateCeremonyMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Starting Sprint...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Start Sprint
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const steps = [
    { id: 'backlog', label: 'Select Backlog' },
    { id: 'goal', label: 'Sprint Goal' },
    { id: 'confirm', label: 'Confirm' },
  ];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sprint Planning</h2>
          <p className="text-muted-foreground">
            {sprint.sprintNumber ? `Sprint ${sprint.sprintNumber}` : 'Sprint'} • 
            {mode === 'journey' ? ' Journey Mode' : ' Practice Mode'}
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Calendar className="h-3 w-3 mr-1" />
          10 days
        </Badge>
      </div>

      <div className="flex items-center justify-center py-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                currentStep === step.id
                  ? 'bg-blue-100 text-blue-700'
                  : steps.findIndex(s => s.id === currentStep) > index
                  ? 'text-green-600'
                  : 'text-muted-foreground'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  currentStep === step.id
                    ? 'bg-blue-600 text-white'
                    : steps.findIndex(s => s.id === currentStep) > index
                    ? 'bg-green-100 text-green-600'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {steps.findIndex(s => s.id === currentStep) > index ? '✓' : index + 1}
              </div>
              <span className="text-sm font-medium">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className="w-12 h-0.5 bg-muted mx-2" />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          {currentStep === 'backlog' && renderBacklogStep()}
          {currentStep === 'goal' && renderGoalStep()}
          {currentStep === 'confirm' && renderConfirmStep()}
        </CardContent>
      </Card>
    </div>
  );
}

interface TicketItemProps {
  ticket: SprintTicket;
  selected: boolean;
  onToggle: () => void;
}

function TicketItem({ ticket, selected, onToggle }: TicketItemProps) {
  const priorityColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-gray-100 text-gray-700',
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer mb-2 ${
        selected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'
      }`}
      onClick={onToggle}
      data-testid={`ticket-item-${ticket.id}`}
    >
      <Checkbox 
        checked={selected} 
        onCheckedChange={onToggle}
        data-testid={`checkbox-ticket-${ticket.id}`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-muted-foreground">
            {ticket.ticketKey}
          </span>
          <span className="font-medium truncate">{ticket.title}</span>
        </div>
        <p className="text-sm text-muted-foreground truncate">{ticket.description}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge className={priorityColors[ticket.priority] || priorityColors.medium}>
          {ticket.priority}
        </Badge>
        <Badge variant="outline">{ticket.storyPoints || 0} pts</Badge>
      </div>
    </div>
  );
}
