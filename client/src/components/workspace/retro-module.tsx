import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft,
  ArrowRight,
  CheckCircle2, 
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Plus,
  Trash2,
  Trophy,
  Sparkles,
  Heart,
  Zap,
  Target,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspacePhase } from "@/hooks/use-sprint-workflow";
import { useToast } from "@/hooks/use-toast";

interface RetroCard {
  id: string;
  type: 'went_well' | 'to_improve' | 'action_item';
  text: string;
  votes?: number;
}

interface RetroModuleProps {
  workspaceId: number;
  userId: number;
  journeyId?: number;
  companyName: string;
  role: string;
  onComplete: () => void;
  onBack?: () => void;
}

const INITIAL_CARDS: RetroCard[] = [
  { id: "1", type: "went_well", text: "Team collaboration was excellent - everyone helped when blocked", votes: 3 },
  { id: "2", type: "went_well", text: "Good estimation on tickets, delivered close to planned points", votes: 2 },
  { id: "3", type: "to_improve", text: "Daily standups ran too long, should be more focused", votes: 2 },
  { id: "4", type: "to_improve", text: "PR reviews took longer than expected", votes: 1 },
];

type RetroStep = 'reflection' | 'action_items' | 'summary';

export function RetroModule({ 
  workspaceId, 
  userId, 
  journeyId,
  companyName, 
  role,
  onComplete,
  onBack 
}: RetroModuleProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<RetroStep>('reflection');
  const [cards, setCards] = useState<RetroCard[]>(INITIAL_CARDS);
  const [actionItems, setActionItems] = useState<{id: string; text: string; owner: string}[]>([
    { id: "ai1", text: "Timebox standups to 15 minutes with parking lot for longer discussions", owner: "Team" },
  ]);
  const [newWentWell, setNewWentWell] = useState('');
  const [newToImprove, setNewToImprove] = useState('');
  const [newActionItem, setNewActionItem] = useState('');
  const [newActionOwner, setNewActionOwner] = useState('');

  const wentWellCards = cards.filter(c => c.type === 'went_well');
  const toImproveCards = cards.filter(c => c.type === 'to_improve');

  const completePhase = useMutation({
    mutationFn: async () => {
      return apiRequest('PATCH', `/api/workspaces/${workspaceId}/phase`, {
        newPhase: 'retro' as WorkspacePhase,
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
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces', workspaceId] });
      onComplete();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete retrospective. Please try again.",
        variant: "destructive"
      });
    }
  });

  const addCard = (type: 'went_well' | 'to_improve', text: string) => {
    if (!text.trim()) return;
    const newCard: RetroCard = {
      id: `card-${Date.now()}`,
      type,
      text: text.trim(),
      votes: 0
    };
    setCards([...cards, newCard]);
    if (type === 'went_well') setNewWentWell('');
    else setNewToImprove('');
    
    toast({
      title: "Card added",
      description: `Added to ${type === 'went_well' ? '"Went Well"' : '"To Improve"'}`,
    });
  };

  const voteCard = (cardId: string) => {
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

  const renderReflection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sprint Retrospective</h2>
          <p className="text-gray-500 dark:text-gray-400">Reflect on the sprint and identify improvements</p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack} data-testid="button-back-to-dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
      </div>

      <Card className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-violet-200 dark:border-violet-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-violet-100 dark:bg-violet-800 flex items-center justify-center">
              <RotateCcw className="h-6 w-6 text-violet-600 dark:text-violet-300" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-violet-900 dark:text-violet-100">Reflection Time</h3>
              <p className="text-sm text-violet-700 dark:text-violet-300">
                Add cards and vote on what went well and what to improve
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
            {wentWellCards.map(card => (
              <div 
                key={card.id}
                className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm">{card.text}</p>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => voteCard(card.id)}
                    className="h-8 px-2"
                  >
                    <Heart className="h-4 w-4 mr-1 text-green-600" />
                    {card.votes || 0}
                  </Button>
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
            {toImproveCards.map(card => (
              <div 
                key={card.id}
                className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm">{card.text}</p>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => voteCard(card.id)}
                    className="h-8 px-2"
                  >
                    <Zap className="h-4 w-4 mr-1 text-amber-600" />
                    {card.votes || 0}
                  </Button>
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

      <div className="flex justify-end">
        <Button onClick={() => setCurrentStep('action_items')} data-testid="button-next-actions">
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

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
              <Target className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Commit to Actions</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Turn insights into actionable improvements
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Issues from Reflection</CardTitle>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
            Action Items
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                  placeholder="Who will own this?"
                  data-testid="input-action-owner"
                />
              </div>
              <Button 
                className="self-end"
                onClick={addActionItem}
                disabled={!newActionItem.trim()}
                data-testid="button-add-action"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => setCurrentStep('summary')} data-testid="button-complete-retro">
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
          <p className="text-gray-500 dark:text-gray-400">You've completed your first sprint cycle</p>
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
            You've successfully completed your first full sprint cycle from onboarding through retrospective.
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
            <div className="text-3xl font-bold text-purple-600">100%</div>
            <div className="text-sm text-muted-foreground">Sprint Complete</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Action Items for Next Sprint</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {actionItems.map((item, i) => (
              <div key={item.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                <Badge>{i + 1}</Badge>
                <span className="text-sm">{item.text}</span>
                <Badge variant="outline" className="ml-auto">{item.owner}</Badge>
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

  return (
    <div className="h-full" data-testid="retro-module">
      {currentStep === 'reflection' && renderReflection()}
      {currentStep === 'action_items' && renderActionItems()}
      {currentStep === 'summary' && renderSummary()}
    </div>
  );
}
