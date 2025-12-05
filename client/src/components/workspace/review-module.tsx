import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft,
  ArrowRight,
  CheckCircle2, 
  Users,
  Play,
  Presentation,
  Star,
  MessageSquare,
  ThumbsUp,
  Lightbulb,
  Bug,
  Wrench,
  Trophy,
  Clock,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspacePhase } from "@/hooks/use-sprint-workflow";
import { useToast } from "@/hooks/use-toast";
import { getSprintReviewAdapter } from "@shared/adapters/review";
import type { 
  SprintReviewConfig, 
  StakeholderFeedback as AdapterStakeholderFeedback,
  CompletedTicketSummary 
} from "@shared/adapters/review";
import { normalizeRole, normalizeLevel, type Role, type Level } from "@shared/adapters";

interface ReviewModuleProps {
  workspaceId: number;
  userId: number;
  journeyId?: number;
  companyName: string;
  role: string;
  level?: string;
  sprintId?: number;
  onComplete: () => void;
  onBack?: () => void;
}

type ReviewStep = 'demo' | 'feedback' | 'summary';

function getTypeIcon(type: string) {
  switch (type) {
    case 'bug': return Bug;
    case 'feature': return Star;
    case 'improvement': return Wrench;
    default: return CheckCircle2;
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case 'bug': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
    case 'feature': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    case 'improvement': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

export function ReviewModule({ 
  workspaceId, 
  userId, 
  journeyId,
  companyName, 
  role,
  level = 'intern',
  sprintId,
  onComplete,
  onBack 
}: ReviewModuleProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<ReviewStep>('demo');
  const [currentDemoItem, setCurrentDemoItem] = useState(0);
  const [demoNotes, setDemoNotes] = useState<Record<string, string>>({});
  const [currentFeedback, setCurrentFeedback] = useState(0);
  const [feedbackAcknowledged, setFeedbackAcknowledged] = useState<Set<number>>(new Set());
  const [generatedFeedback, setGeneratedFeedback] = useState<AdapterStakeholderFeedback[]>([]);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);

  const normalizedRole = normalizeRole(role) as Role;
  const normalizedLevel = normalizeLevel(level) as Level;
  const adapter = useMemo(() => 
    getSprintReviewAdapter(normalizedRole, normalizedLevel),
    [normalizedRole, normalizedLevel]
  );

  const { data: sprintData, isLoading: isLoadingSprint } = useQuery<{
    sprint: { id: number; goal: string; status: string };
  }>({
    queryKey: [`/api/sprints/${sprintId}`],
    enabled: !!sprintId,
  });

  const { data: ticketsData, isLoading: isLoadingTickets } = useQuery<{
    id: number;
    ticketKey: string;
    title: string;
    type: string;
    storyPoints: number;
    status: string;
    completedAt?: string;
  }[]>({
    queryKey: [`/api/sprints/${sprintId}/tickets`],
    enabled: !!sprintId,
  });

  const completedTickets: CompletedTicketSummary[] = useMemo(() => {
    if (!ticketsData) return [];
    return ticketsData
      .filter(t => t.status === 'done')
      .map(t => ({
        id: String(t.id),
        key: t.ticketKey,
        title: t.title,
        type: (t.type || 'task') as 'bug' | 'feature' | 'improvement' | 'task',
        points: t.storyPoints || 0,
        completedAt: t.completedAt || new Date().toISOString(),
        prMerged: true,
        reviewCycles: 1,
      }));
  }, [ticketsData]);

  const sprintGoal = sprintData?.sprint?.goal || 'Complete sprint deliverables';
  const totalPoints = completedTickets.reduce((sum, t) => sum + t.points, 0);

  const generateFeedbackMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/workspaces/${workspaceId}/generate-review-feedback`, {
        completedTickets,
        sprintGoal,
        stakeholders: adapter.feedbackConfig.stakeholders,
        feedbackConfig: adapter.feedbackConfig,
        prompts: adapter.prompts,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedFeedback(data.feedback || []);
      setIsGeneratingFeedback(false);
    },
    onError: () => {
      const fallbackFeedback = generateFallbackFeedback();
      setGeneratedFeedback(fallbackFeedback);
      setIsGeneratingFeedback(false);
    },
  });

  const generateFallbackFeedback = (): AdapterStakeholderFeedback[] => {
    const { stakeholders, sentimentDistribution } = adapter.feedbackConfig;
    const feedback: AdapterStakeholderFeedback[] = [];
    
    stakeholders.forEach((stakeholder, idx) => {
      const sentiment = idx === 0 ? 'positive' : 
                        idx === 1 ? 'suggestion' : 'positive';
      
      const ticketRef = completedTickets[idx % completedTickets.length];
      const feedbackTemplates = {
        positive: [
          `Great work on ${ticketRef?.title || 'this sprint'}! The implementation looks solid and addresses the requirements well.`,
          `I'm impressed with the quality of work delivered. The team should be proud of what we accomplished this sprint.`,
        ],
        suggestion: [
          `Good progress overall. For future sprints, consider adding more documentation for ${ticketRef?.title || 'complex features'}.`,
          `Nice work! One suggestion: let's ensure we have better test coverage for edge cases in similar tickets.`,
        ],
        neutral: [
          `The work meets expectations. Let's discuss any lessons learned in the retrospective.`,
        ],
        concern: [
          `We should discuss the scope of work for next sprint to ensure we're aligned on priorities.`,
        ],
      };
      
      const templates = feedbackTemplates[sentiment];
      const content = templates[Math.floor(Math.random() * templates.length)];
      
      feedback.push({
        stakeholderId: stakeholder.id,
        content,
        sentiment,
        category: sentiment === 'positive' ? 'praise' : 'improvement',
        requiresResponse: sentiment === 'suggestion' || sentiment === 'concern',
        relatedTicketId: ticketRef?.id,
      });
    });
    
    return feedback;
  };

  useEffect(() => {
    if (currentStep === 'feedback' && generatedFeedback.length === 0 && !isGeneratingFeedback) {
      setIsGeneratingFeedback(true);
      generateFeedbackMutation.mutate();
    }
  }, [currentStep]);

  const completePhase = useMutation({
    mutationFn: async () => {
      return apiRequest('PATCH', `/api/workspaces/${workspaceId}/phase`, {
        newPhase: 'retro' as WorkspacePhase,
        status: 'completed',
        payload: {
          demoNotes,
          feedbackReceived: generatedFeedback.length,
          completedTickets: completedTickets.map(t => t.id),
          totalPoints,
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces', workspaceId] });
      onComplete();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete review phase. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleNextDemo = () => {
    if (currentDemoItem < completedTickets.length - 1) {
      setCurrentDemoItem(currentDemoItem + 1);
    } else {
      setCurrentStep('feedback');
    }
  };

  const handleAcknowledgeFeedback = () => {
    const newAcknowledged = new Set(feedbackAcknowledged);
    newAcknowledged.add(currentFeedback);
    setFeedbackAcknowledged(newAcknowledged);
    
    if (adapter.feedbackModifiers?.autoAcknowledgePositive) {
      generatedFeedback.forEach((fb, idx) => {
        if (fb.sentiment === 'positive') {
          newAcknowledged.add(idx);
        }
      });
    }
    
    if (currentFeedback < generatedFeedback.length - 1) {
      setCurrentFeedback(currentFeedback + 1);
    } else {
      setCurrentStep('summary');
    }
  };

  const isLoading = isLoadingSprint || isLoadingTickets;

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="review-module-loading">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (completedTickets.length === 0) {
    return (
      <div className="space-y-6" data-testid="review-module-empty">
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-8 w-8 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">No Completed Tickets</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Complete some tickets before starting the sprint review.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Execution
          </Button>
        )}
      </div>
    );
  }

  const renderDemo = () => {
    const currentTicket = completedTickets[currentDemoItem];
    if (!currentTicket) return null;
    
    const Icon = getTypeIcon(currentTicket.type);
    const { demoConfig, uiConfig } = adapter;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sprint Review Demo</h2>
            <p className="text-gray-500 dark:text-gray-400">
              {adapter.metadata.description}
            </p>
          </div>
          {onBack && (
            <Button variant="outline" onClick={onBack} data-testid="button-back-to-dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
        </div>

        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center">
                <Presentation className="h-6 w-6 text-amber-600 dark:text-amber-300" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">Demo Session</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {demoConfig.format === 'guided' ? 'Follow the guided demo script' :
                   demoConfig.format === 'prompted' ? 'Use the prompts to structure your demo' :
                   'Present your completed work freely'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-amber-600">Item</div>
                <div className="text-2xl font-bold text-amber-900">{currentDemoItem + 1}/{completedTickets.length}</div>
              </div>
              {demoConfig.showTimer && (
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm text-amber-600">
                    <Clock className="h-4 w-4" />
                    Target
                  </div>
                  <div className="text-lg font-semibold text-amber-900">
                    {Math.round(demoConfig.timePerTicket / 60)}m
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="font-mono">{currentTicket.key}</Badge>
                  <Badge className={getTypeColor(currentTicket.type)} variant="secondary">
                    <Icon className="h-3 w-3 mr-1" />
                    {currentTicket.type}
                  </Badge>
                  {uiConfig.showPointsSummary && (
                    <Badge variant="secondary">{currentTicket.points} pts</Badge>
                  )}
                </div>
                <CardTitle>{currentTicket.title}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {demoConfig.showScript && demoConfig.scriptSteps.length > 0 && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Play className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground mb-2">Demo Script:</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                      {demoConfig.scriptSteps.map((step, idx) => (
                        <li key={idx}>
                          {step.instruction}
                          {step.hint && demoConfig.format === 'guided' && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ({step.hint})
                            </span>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {demoConfig.allowNotes && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Demo Notes (Optional)</label>
                <Textarea
                  value={demoNotes[currentTicket.id] || ''}
                  onChange={(e) => setDemoNotes({ ...demoNotes, [currentTicket.id]: e.target.value })}
                  placeholder="Any notes about the demo, questions asked, or feedback received..."
                  rows={3}
                  data-testid={`input-demo-notes-${currentTicket.key}`}
                />
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-green-800 dark:text-green-200">Demo complete!</span>
              </div>
              <Button onClick={handleNextDemo} data-testid="button-next-demo">
                {currentDemoItem < completedTickets.length - 1 ? 'Next Item' : 'Continue to Feedback'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {uiConfig.showProgressBar && (
          <div className="flex gap-2">
            {completedTickets.map((_, index) => (
              <div 
                key={index}
                className={cn(
                  "flex-1 h-2 rounded-full transition-colors",
                  index < currentDemoItem ? "bg-green-500" :
                  index === currentDemoItem ? "bg-amber-500" : "bg-gray-200"
                )}
              />
            ))}
          </div>
        )}

        {adapter.tips.length > 0 && (
          <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <span className="font-medium">Tip: </span>
                  {adapter.tips[currentDemoItem % adapter.tips.length]}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderFeedback = () => {
    if (isGeneratingFeedback || generatedFeedback.length === 0) {
      return (
        <div className="space-y-6" data-testid="review-feedback-loading">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Stakeholder Feedback</h2>
              <p className="text-gray-500 dark:text-gray-400">Generating feedback from stakeholders...</p>
            </div>
          </div>
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center animate-pulse">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-muted-foreground">Stakeholders are reviewing your demo...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    const currentFb = generatedFeedback[currentFeedback];
    const stakeholder = adapter.feedbackConfig.stakeholders.find(s => s.id === currentFb.stakeholderId);
    
    if (!stakeholder || !currentFb) return null;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Stakeholder Feedback</h2>
            <p className="text-gray-500 dark:text-gray-400">Receive feedback from the product team</p>
          </div>
          <Button variant="outline" onClick={() => setCurrentStep('demo')} data-testid="button-back-to-demo">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Demo
          </Button>
        </div>

        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">Feedback Session</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Review and acknowledge stakeholder feedback
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-600">Feedback</div>
                <div className="text-2xl font-bold text-blue-900">{currentFeedback + 1}/{generatedFeedback.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback 
                  className={cn(
                    currentFb.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                    currentFb.sentiment === 'suggestion' ? 'bg-amber-100 text-amber-700' :
                    currentFb.sentiment === 'concern' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  )}
                  style={{ backgroundColor: stakeholder.color + '20', color: stakeholder.color }}
                >
                  {getInitials(stakeholder.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{stakeholder.name}</h4>
                  <Badge variant="outline">{stakeholder.role}</Badge>
                  {adapter.feedbackConfig.showSentimentIcons && (
                    <>
                      {currentFb.sentiment === 'positive' && (
                        <ThumbsUp className="h-4 w-4 text-green-500" />
                      )}
                      {currentFb.sentiment === 'suggestion' && (
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                      )}
                    </>
                  )}
                </div>
                <p className="text-muted-foreground">{currentFb.content}</p>
                {currentFb.relatedTicketId && (
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Re: {completedTickets.find(t => t.id === currentFb.relatedTicketId)?.key}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                <span className="text-blue-800 dark:text-blue-200">
                  {feedbackAcknowledged.has(currentFeedback) 
                    ? 'Feedback acknowledged' 
                    : 'Acknowledge this feedback to continue'}
                </span>
              </div>
              <Button onClick={handleAcknowledgeFeedback} data-testid="button-acknowledge-feedback">
                {currentFeedback < generatedFeedback.length - 1 ? 'Acknowledge & Next' : 'Complete Feedback'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {adapter.uiConfig.showProgressBar && (
          <div className="flex gap-2">
            {generatedFeedback.map((_, index) => (
              <div 
                key={index}
                className={cn(
                  "flex-1 h-2 rounded-full transition-colors",
                  feedbackAcknowledged.has(index) ? "bg-green-500" :
                  index === currentFeedback ? "bg-blue-500" : "bg-gray-200"
                )}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderSummary = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Review Summary</h2>
          <p className="text-gray-500 dark:text-gray-400">Sprint review completed successfully</p>
        </div>
        <Button variant="outline" onClick={() => setCurrentStep('feedback')} data-testid="button-back-to-feedback">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-100">Sprint Review Complete!</h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Successfully demonstrated all completed work
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{completedTickets.length}</div>
            <div className="text-sm text-muted-foreground">Items Demoed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{totalPoints}</div>
            <div className="text-sm text-muted-foreground">Points Delivered</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-amber-600">{generatedFeedback.length}</div>
            <div className="text-sm text-muted-foreground">Feedback Received</div>
          </CardContent>
        </Card>
      </div>

      {adapter.uiConfig.showSprintGoal && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sprint Goal Achievement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">Goal Met</p>
                  <p className="text-sm text-green-700 dark:text-green-300">{sprintGoal}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Key Feedback Highlights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {generatedFeedback.slice(0, 3).map((fb, i) => {
            const stakeholder = adapter.feedbackConfig.stakeholders.find(s => s.id === fb.stakeholderId);
            if (!stakeholder) return null;
            return (
              <div key={i} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarFallback 
                    className="text-xs"
                    style={{ backgroundColor: stakeholder.color + '20', color: stakeholder.color }}
                  >
                    {getInitials(stakeholder.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{stakeholder.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{fb.content}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-violet-200 dark:border-violet-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <h3 className="font-semibold text-violet-900 dark:text-violet-100">Ready for Retrospective</h3>
                <p className="text-sm text-violet-700 dark:text-violet-300">
                  Reflect on the sprint and identify improvements
                </p>
              </div>
            </div>
            <Button 
              onClick={() => completePhase.mutate()}
              disabled={completePhase.isPending}
              className="bg-violet-600 hover:bg-violet-700"
              data-testid="button-start-retro"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Retrospective
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="h-full" data-testid="review-module">
      {currentStep === 'demo' && renderDemo()}
      {currentStep === 'feedback' && renderFeedback()}
      {currentStep === 'summary' && renderSummary()}
    </div>
  );
}
