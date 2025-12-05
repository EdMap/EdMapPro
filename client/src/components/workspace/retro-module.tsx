import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft,
  ArrowRight,
  CheckCircle2, 
  ThumbsUp,
  Lightbulb,
  Plus,
  Trash2,
  Trophy,
  Sparkles,
  Heart,
  Zap,
  Target,
  RotateCcw,
  MessageSquare,
  Bug,
  Star,
  AlertTriangle,
  TrendingUp,
  PartyPopper,
  Clock,
  Users,
  GitPullRequest
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspacePhase } from "@/hooks/use-sprint-workflow";
import { useToast } from "@/hooks/use-toast";
import { getRetroAdapter } from "@shared/adapters/retro";
import type { 
  SprintRetroConfig, 
  RetroCard as AdapterRetroCard,
  SprintContextData,
  CardCategory
} from "@shared/adapters/retro";
import { normalizeRole, normalizeLevel, type Role, type Level } from "@shared/adapters";

interface RetroModuleProps {
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

type RetroStep = 'context' | 'reflection' | 'action_items' | 'summary';

interface ActionItem {
  id: string;
  text: string;
  owner: string;
  category?: string;
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

export function RetroModule({ 
  workspaceId, 
  userId, 
  journeyId,
  companyName, 
  role,
  level = 'intern',
  sprintId,
  onComplete,
  onBack 
}: RetroModuleProps) {
  const { toast } = useToast();
  
  const normalizedRole = normalizeRole(role) as Role;
  const normalizedLevel = normalizeLevel(level) as Level;
  const adapter = useMemo(() => 
    getRetroAdapter(normalizedRole, normalizedLevel),
    [normalizedRole, normalizedLevel]
  );

  const showContext = adapter.uiConfig.showSprintContext;
  const [currentStep, setCurrentStep] = useState<RetroStep>(showContext ? 'context' : 'reflection');
  const [cards, setCards] = useState<AdapterRetroCard[]>(adapter.starterCards);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [newWentWell, setNewWentWell] = useState('');
  const [newToImprove, setNewToImprove] = useState('');
  const [newActionItem, setNewActionItem] = useState('');
  const [newActionOwner, setNewActionOwner] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);

  const { data: sprintData, isLoading: isLoadingSprint } = useQuery<{
    sprint: { id: number; goal: string; status: string };
  }>({
    queryKey: ['/api/sprints', sprintId],
    queryFn: async () => {
      const response = await fetch(`/api/sprints/${sprintId}`);
      if (!response.ok) throw new Error('Failed to fetch sprint');
      return response.json();
    },
    enabled: !!sprintId,
  });

  const { data: ticketsData } = useQuery<{
    id: number;
    ticketKey: string;
    title: string;
    type: string;
    storyPoints: number;
    status: string;
  }[]>({
    queryKey: ['/api/sprints', sprintId, 'tickets'],
    queryFn: async () => {
      const response = await fetch(`/api/sprints/${sprintId}/tickets`);
      if (!response.ok) throw new Error('Failed to fetch tickets');
      return response.json();
    },
    enabled: !!sprintId,
  });

  const sprintContext: SprintContextData | undefined = useMemo(() => {
    if (!sprintData || !ticketsData) return undefined;
    
    const completedTickets = ticketsData
      .filter(t => t.status === 'done')
      .map(t => ({
        id: String(t.id),
        key: t.ticketKey,
        title: t.title,
        type: t.type || 'task',
        points: t.storyPoints || 0,
      }));

    const totalPoints = ticketsData.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const completedPoints = completedTickets.reduce((sum, t) => sum + t.points, 0);

    return {
      sprintId: sprintData.sprint.id,
      sprintGoal: sprintData.sprint.goal,
      completedTickets,
      blockers: [],
      prReviewCycles: [],
      stakeholderFeedback: [],
      metrics: {
        plannedPoints: totalPoints,
        completedPoints,
        velocity: completedPoints,
      },
    };
  }, [sprintData, ticketsData]);

  const wentWellCards = cards.filter(c => c.type === 'went_well');
  const toImproveCards = cards.filter(c => c.type === 'to_improve');

  const completePhase = useMutation({
    mutationFn: async () => {
      return apiRequest('PATCH', `/api/workspaces/${workspaceId}/phase`, {
        newPhase: 'onboarding' as WorkspacePhase,
        status: 'completed',
        payload: {
          wentWell: wentWellCards.length,
          toImprove: toImproveCards.length,
          actionItems: actionItems.length,
          retroCards: cards,
          actions: actionItems,
          sprintCycleComplete: true
        }
      });
    },
    onSuccess: () => {
      if (adapter.uiConfig.celebrationAnimation) {
        setShowCelebration(true);
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/workspaces', workspaceId] });
          onComplete();
        }, 2000);
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/workspaces', workspaceId] });
        onComplete();
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete retrospective. Please try again.",
        variant: "destructive"
      });
    }
  });

  const addCard = (type: CardCategory, text: string) => {
    if (!text.trim()) return;
    const newCard: AdapterRetroCard = {
      id: `card-${Date.now()}`,
      type,
      text: text.trim(),
      votes: 0,
      isAISuggested: false,
    };
    setCards([...cards, newCard]);
    if (type === 'went_well') setNewWentWell('');
    else setNewToImprove('');
    
    toast({
      title: "Card added",
      description: `Added to ${type === 'went_well' ? '"Went Well"' : '"To Improve"'}`,
    });
  };

  const removeCard = (cardId: string) => {
    setCards(cards.filter(c => c.id !== cardId));
  };

  const voteCard = (cardId: string) => {
    if (!adapter.facilitationConfig.votingEnabled) return;
    setCards(cards.map(c => 
      c.id === cardId ? { ...c, votes: (c.votes || 0) + 1 } : c
    ));
  };

  const addActionItem = () => {
    if (!newActionItem.trim()) return;
    setActionItems([...actionItems, {
      id: `ai-${Date.now()}`,
      text: newActionItem.trim(),
      owner: newActionOwner.trim() || 'Team'
    }]);
    setNewActionItem('');
    setNewActionOwner('');
    
    toast({
      title: "Action item added",
      description: "Remember to follow up on this next sprint!",
    });
  };

  const removeActionItem = (id: string) => {
    setActionItems(actionItems.filter(ai => ai.id !== id));
  };

  const { facilitator } = adapter.facilitationConfig;
  const showFacilitator = adapter.facilitationConfig.showFacilitatorMessages;

  const renderContext = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sprint Recap</h2>
          <p className="text-gray-500 dark:text-gray-400">Review what happened this sprint before reflecting</p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack} data-testid="button-back-to-dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
      </div>

      {showFacilitator && (
        <Card className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-violet-200 dark:border-violet-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback style={{ backgroundColor: facilitator.color + '20', color: facilitator.color }}>
                  {getInitials(facilitator.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{facilitator.name}</span>
                  <Badge variant="outline" className="text-xs">{facilitator.role}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {adapter.prompts.contextIntroPrompt}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoadingSprint ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : sprintContext ? (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-5 w-5 text-violet-600" />
                Sprint Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{sprintContext.sprintGoal}</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{sprintContext.completedTickets.length}</div>
                <div className="text-sm text-muted-foreground">Tickets Completed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{sprintContext.metrics.completedPoints}</div>
                <div className="text-sm text-muted-foreground">Points Delivered</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-amber-600">
                  {Math.round((sprintContext.metrics.completedPoints / sprintContext.metrics.plannedPoints) * 100) || 0}%
                </div>
                <div className="text-sm text-muted-foreground">Completion Rate</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Completed Work
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sprintContext.completedTickets.map(ticket => (
                  <div key={ticket.id} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <Badge variant="outline" className="font-mono text-xs">{ticket.key}</Badge>
                    {ticket.type === 'bug' && <Bug className="h-4 w-4 text-red-500" />}
                    {ticket.type === 'feature' && <Star className="h-4 w-4 text-blue-500" />}
                    <span className="text-sm flex-1">{ticket.title}</span>
                    <Badge variant="secondary">{ticket.points} pts</Badge>
                  </div>
                ))}
                {sprintContext.completedTickets.length === 0 && (
                  <p className="text-sm text-muted-foreground">No tickets completed this sprint</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
              <div>
                <h3 className="font-semibold">Sprint data unavailable</h3>
                <p className="text-sm text-muted-foreground">
                  We couldn't load the sprint details, but you can still continue with the retrospective.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={() => setCurrentStep('reflection')} data-testid="button-start-reflection">
          Start Reflection
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderReflection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sprint Retrospective</h2>
          <p className="text-gray-500 dark:text-gray-400">{adapter.metadata.description}</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => showContext ? setCurrentStep('context') : onBack?.()} 
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {showFacilitator && (
        <Card className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-violet-200 dark:border-violet-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback style={{ backgroundColor: facilitator.color + '20', color: facilitator.color }}>
                  {getInitials(facilitator.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{facilitator.name}</span>
                  <Badge variant="outline" className="text-xs">{facilitator.role}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {adapter.prompts.reflectionPrompt}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-700">
              <ThumbsUp className="h-5 w-5" />
              What Went Well
            </CardTitle>
            <CardDescription>Celebrate wins and successes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {wentWellCards.length === 0 && (
              <div className="p-4 border-2 border-dashed border-green-200 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  {adapter.facilitationConfig.guidedQuestions.find(q => q.category === 'went_well')?.prompt 
                    || "What made you proud this sprint?"}
                </p>
              </div>
            )}
            {wentWellCards.map(card => (
              <div 
                key={card.id}
                className={cn(
                  "p-3 border rounded-lg",
                  card.isAISuggested 
                    ? "bg-green-50/50 dark:bg-green-900/10 border-green-200 border-dashed" 
                    : "bg-green-50 dark:bg-green-900/20 border-green-200"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm">{card.text}</p>
                    {card.isAISuggested && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Suggested
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {adapter.uiConfig.showVoteCounts && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => voteCard(card.id)}
                        className="h-8 px-2"
                      >
                        <Heart className="h-4 w-4 mr-1 text-green-600" />
                        {card.votes || 0}
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeCard(card.id)}
                      className="h-8 px-2 text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="flex gap-2">
              <Input
                value={newWentWell}
                onChange={(e) => setNewWentWell(e.target.value)}
                placeholder="Add something that went well..."
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && addCard('went_well', newWentWell)}
                data-testid="input-went-well"
              />
              <Button 
                size="sm"
                onClick={() => addCard('went_well', newWentWell)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <Lightbulb className="h-5 w-5" />
              To Improve
            </CardTitle>
            <CardDescription>Identify areas for growth</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {toImproveCards.length === 0 && (
              <div className="p-4 border-2 border-dashed border-amber-200 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  {adapter.facilitationConfig.guidedQuestions.find(q => q.category === 'to_improve')?.prompt 
                    || "What slowed you down or caused frustration?"}
                </p>
              </div>
            )}
            {toImproveCards.map(card => (
              <div 
                key={card.id}
                className={cn(
                  "p-3 border rounded-lg",
                  card.isAISuggested 
                    ? "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 border-dashed" 
                    : "bg-amber-50 dark:bg-amber-900/20 border-amber-200"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm">{card.text}</p>
                    {card.isAISuggested && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Suggested
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {adapter.uiConfig.showVoteCounts && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => voteCard(card.id)}
                        className="h-8 px-2"
                      >
                        <Zap className="h-4 w-4 mr-1 text-amber-600" />
                        {card.votes || 0}
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeCard(card.id)}
                      className="h-8 px-2 text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="flex gap-2">
              <Input
                value={newToImprove}
                onChange={(e) => setNewToImprove(e.target.value)}
                placeholder="Add something to improve..."
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && addCard('to_improve', newToImprove)}
                data-testid="input-to-improve"
              />
              <Button 
                size="sm"
                onClick={() => addCard('to_improve', newToImprove)}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {adapter.tips.length > 0 && (
        <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-medium">Tip: </span>
                {adapter.tips[Math.floor(Math.random() * adapter.tips.length)]}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button 
          onClick={() => setCurrentStep('action_items')} 
          disabled={cards.length === 0}
          data-testid="button-next-actions"
        >
          Define Action Items
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderActionItems = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Action Items</h2>
          <p className="text-gray-500 dark:text-gray-400">Define concrete improvements for next sprint</p>
        </div>
        <Button variant="outline" onClick={() => setCurrentStep('reflection')} data-testid="button-back-to-reflection">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {showFacilitator && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback style={{ backgroundColor: facilitator.color + '20', color: facilitator.color }}>
                  {getInitials(facilitator.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{facilitator.name}</span>
                  <Badge variant="outline" className="text-xs">{facilitator.role}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {adapter.prompts.actionItemsPrompt}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {adapter.actionItemConfig.suggestFromTopVoted && toImproveCards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-600" />
              Top Issues from Reflection
            </CardTitle>
            <CardDescription>Consider these when creating action items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {toImproveCards
                .sort((a, b) => (b.votes || 0) - (a.votes || 0))
                .slice(0, 3)
                .map(card => (
                  <div key={card.id} className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
                    <Badge variant="outline">{card.votes || 0} votes</Badge>
                    <span className="text-sm">{card.text}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
            Action Items
            <Badge variant="secondary" className="ml-2">
              {actionItems.length}/{adapter.actionItemConfig.maxActionItems}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {actionItems.length === 0 && (
            <div className="p-4 border-2 border-dashed border-blue-200 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                {adapter.facilitationConfig.guidedQuestions.find(q => q.category === 'action_item')?.prompt 
                  || "What concrete improvement can we commit to for next sprint?"}
              </p>
            </div>
          )}
          
          {actionItems.map(item => (
            <div 
              key={item.id}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
            >
              <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm">{item.text}</p>
                <Badge variant="outline" className="mt-1">Owner: {item.owner}</Badge>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => removeActionItem(item.id)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
          
          {actionItems.length < adapter.actionItemConfig.maxActionItems && (
            <>
              <Separator />
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="action-text">New Action Item</Label>
                  <Textarea
                    id="action-text"
                    value={newActionItem}
                    onChange={(e) => setNewActionItem(e.target.value)}
                    placeholder="Describe the improvement action..."
                    rows={2}
                    data-testid="input-action-item"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="action-owner">Owner</Label>
                    <Input
                      id="action-owner"
                      value={newActionOwner}
                      onChange={(e) => setNewActionOwner(e.target.value)}
                      placeholder={adapter.actionItemConfig.requireOwner ? "Who will own this?" : "Team (optional)"}
                      data-testid="input-action-owner"
                    />
                  </div>
                  <Button 
                    className="self-end"
                    onClick={addActionItem}
                    disabled={!newActionItem.trim() || (adapter.actionItemConfig.requireOwner && !newActionOwner.trim())}
                    data-testid="button-add-action"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={() => setCurrentStep('summary')} 
          disabled={actionItems.length === 0}
          data-testid="button-complete-retro"
        >
          Complete Retrospective
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderSummary = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sprint Complete!</h2>
          <p className="text-gray-500 dark:text-gray-400">You've completed your sprint cycle</p>
        </div>
        <Button variant="outline" onClick={() => setCurrentStep('action_items')} data-testid="button-back-to-actions">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <Card className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 border-green-200 dark:border-green-800">
        <CardContent className="p-8 text-center">
          <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-10 w-10 text-green-600 dark:text-green-300" />
          </div>
          <h3 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">
            Congratulations!
          </h3>
          <p className="text-green-700 dark:text-green-300 max-w-md mx-auto">
            You've successfully completed your full sprint cycle from planning through retrospective.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{wentWellCards.length}</div>
            <div className="text-sm text-muted-foreground">Things Went Well</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-amber-600">{toImproveCards.length}</div>
            <div className="text-sm text-muted-foreground">To Improve</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{actionItems.length}</div>
            <div className="text-sm text-muted-foreground">Action Items</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">
              {sprintContext?.metrics.completedPoints || 0}
            </div>
            <div className="text-sm text-muted-foreground">Points Delivered</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Action Items for Next Sprint
          </CardTitle>
          <CardDescription>These will carry forward to your next sprint</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {actionItems.map((item, i) => (
              <div key={item.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                <Badge>{i + 1}</Badge>
                <span className="text-sm flex-1">{item.text}</span>
                <Badge variant="outline">{item.owner}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-indigo-200 dark:border-indigo-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">Finish Sprint Cycle</h3>
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  Complete this sprint and return to the workspace
                </p>
              </div>
            </div>
            <Button 
              onClick={() => completePhase.mutate()}
              disabled={completePhase.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
              data-testid="button-finish-sprint"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Finish Sprint
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (showCelebration) {
    return (
      <div className="h-full flex items-center justify-center" data-testid="retro-celebration">
        <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="relative">
            <div className="h-32 w-32 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 flex items-center justify-center mx-auto animate-bounce">
              <PartyPopper className="h-16 w-16 text-white" />
            </div>
            <div className="absolute -top-4 -right-4 animate-ping">
              <Sparkles className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="absolute -bottom-2 -left-4 animate-ping delay-150">
              <Star className="h-6 w-6 text-amber-500" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Sprint Complete!
            </h2>
            <p className="text-lg text-muted-foreground">
              Great work! You've finished the full sprint cycle.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full" data-testid="retro-module">
      {currentStep === 'context' && renderContext()}
      {currentStep === 'reflection' && renderReflection()}
      {currentStep === 'action_items' && renderActionItems()}
      {currentStep === 'summary' && renderSummary()}
    </div>
  );
}
