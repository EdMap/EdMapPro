import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
  ThumbsDown,
  Lightbulb,
  Bug,
  Wrench,
  Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspacePhase } from "@/hooks/use-sprint-workflow";
import { useToast } from "@/hooks/use-toast";

interface CompletedItem {
  id: string;
  title: string;
  type: 'bug' | 'feature' | 'improvement';
  points: number;
}

interface StakeholderFeedback {
  name: string;
  role: string;
  avatar: string;
  feedback: string;
  sentiment: 'positive' | 'neutral' | 'suggestion';
}

interface ReviewModuleProps {
  workspaceId: number;
  userId: number;
  journeyId?: number;
  companyName: string;
  role: string;
  completedItems?: string[];
  sprintGoal?: string;
  onComplete: () => void;
  onBack?: () => void;
}

const COMPLETED_ITEMS: CompletedItem[] = [
  { id: "TICKET-101", title: "Fix timezone display in transaction history", type: "bug", points: 3 },
  { id: "TICKET-102", title: "Add export to CSV functionality", type: "feature", points: 5 },
  { id: "TICKET-104", title: "Fix refund calculation rounding error", type: "bug", points: 2 },
];

const STAKEHOLDER_FEEDBACK: StakeholderFeedback[] = [
  {
    name: "Jennifer Martinez",
    role: "Product Owner",
    avatar: "JM",
    feedback: "Great work on the timezone fix! I've already heard positive feedback from the support team. The CSV export will be a huge time-saver for our enterprise clients.",
    sentiment: "positive"
  },
  {
    name: "David Chen",
    role: "Engineering Manager",
    avatar: "DC",
    feedback: "The code quality on these tickets was excellent. I noticed you followed our established patterns well. For next sprint, consider adding more unit tests for the export functionality.",
    sentiment: "suggestion"
  },
  {
    name: "Sarah Thompson",
    role: "QA Lead",
    avatar: "ST",
    feedback: "All acceptance criteria passed. The refund fix was particularly well-tested. I'd recommend we add this to our regression suite.",
    sentiment: "positive"
  }
];

function getTypeIcon(type: CompletedItem['type']) {
  switch (type) {
    case 'bug': return Bug;
    case 'feature': return Star;
    case 'improvement': return Wrench;
    default: return CheckCircle2;
  }
}

function getTypeColor(type: CompletedItem['type']) {
  switch (type) {
    case 'bug': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
    case 'feature': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    case 'improvement': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
    default: return 'bg-gray-100 text-gray-700';
  }
}

type ReviewStep = 'demo' | 'feedback' | 'summary';

export function ReviewModule({ 
  workspaceId, 
  userId, 
  journeyId,
  companyName, 
  role,
  completedItems = ["TICKET-101", "TICKET-102", "TICKET-104"],
  sprintGoal = "Fix critical timezone issues and add CSV export functionality",
  onComplete,
  onBack 
}: ReviewModuleProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<ReviewStep>('demo');
  const [currentDemoItem, setCurrentDemoItem] = useState(0);
  const [demoNotes, setDemoNotes] = useState<Record<string, string>>({});
  const [currentFeedback, setCurrentFeedback] = useState(0);
  const [feedbackAcknowledged, setFeedbackAcknowledged] = useState<Set<number>>(new Set());

  const items = COMPLETED_ITEMS.filter(item => completedItems.includes(item.id));
  const totalPoints = items.reduce((sum, item) => sum + item.points, 0);

  const completePhase = useMutation({
    mutationFn: async () => {
      return apiRequest('PATCH', `/api/workspaces/${workspaceId}/phase`, {
        newPhase: 'retro' as WorkspacePhase,
        status: 'completed',
        payload: {
          demoNotes,
          feedbackReceived: STAKEHOLDER_FEEDBACK.length,
          completedItems: items.map(i => i.id)
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
    if (currentDemoItem < items.length - 1) {
      setCurrentDemoItem(currentDemoItem + 1);
    } else {
      setCurrentStep('feedback');
    }
  };

  const handleAcknowledgeFeedback = () => {
    setFeedbackAcknowledged(prev => new Set(Array.from(prev).concat(currentFeedback)));
    if (currentFeedback < STAKEHOLDER_FEEDBACK.length - 1) {
      setCurrentFeedback(currentFeedback + 1);
    } else {
      setCurrentStep('summary');
    }
  };

  const renderDemo = () => {
    const currentItem = items[currentDemoItem];
    const Icon = getTypeIcon(currentItem.type);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sprint Review Demo</h2>
            <p className="text-gray-500 dark:text-gray-400">Present completed work to stakeholders</p>
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
                  Present each completed item to the team
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-amber-600">Item</div>
                <div className="text-2xl font-bold text-amber-900">{currentDemoItem + 1}/{items.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="font-mono">{currentItem.id}</Badge>
                  <Badge className={getTypeColor(currentItem.type)} variant="secondary">
                    <Icon className="h-3 w-3 mr-1" />
                    {currentItem.type}
                  </Badge>
                  <Badge variant="secondary">{currentItem.points} pts</Badge>
                </div>
                <CardTitle>{currentItem.title}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-3">
                <Play className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground mb-2">Demo Script:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Show the original issue or feature request</li>
                    <li>Walk through the implementation</li>
                    <li>Demonstrate the working solution</li>
                    <li>Highlight any edge cases handled</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Demo Notes (Optional)</label>
              <Textarea
                value={demoNotes[currentItem.id] || ''}
                onChange={(e) => setDemoNotes({ ...demoNotes, [currentItem.id]: e.target.value })}
                placeholder="Any notes about the demo, questions asked, or feedback received..."
                rows={3}
                data-testid={`input-demo-notes-${currentItem.id}`}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-green-800 dark:text-green-200">Demo complete!</span>
              </div>
              <Button onClick={handleNextDemo} data-testid="button-next-demo">
                {currentDemoItem < items.length - 1 ? 'Next Item' : 'Continue to Feedback'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          {items.map((item, index) => (
            <div 
              key={item.id}
              className={cn(
                "flex-1 h-2 rounded-full",
                index < currentDemoItem ? "bg-green-500" :
                index === currentDemoItem ? "bg-amber-500" : "bg-gray-200"
              )}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderFeedback = () => {
    const feedback = STAKEHOLDER_FEEDBACK[currentFeedback];
    
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
                <div className="text-2xl font-bold text-blue-900">{currentFeedback + 1}/{STAKEHOLDER_FEEDBACK.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className={cn(
                  feedback.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                  feedback.sentiment === 'suggestion' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-700'
                )}>
                  {feedback.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{feedback.name}</h4>
                  <Badge variant="outline">{feedback.role}</Badge>
                  {feedback.sentiment === 'positive' && (
                    <ThumbsUp className="h-4 w-4 text-green-500" />
                  )}
                  {feedback.sentiment === 'suggestion' && (
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                  )}
                </div>
                <p className="text-muted-foreground">{feedback.feedback}</p>
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
                {currentFeedback < STAKEHOLDER_FEEDBACK.length - 1 ? 'Acknowledge & Next' : 'Complete Feedback'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          {STAKEHOLDER_FEEDBACK.map((_, index) => (
            <div 
              key={index}
              className={cn(
                "flex-1 h-2 rounded-full",
                feedbackAcknowledged.has(index) ? "bg-green-500" :
                index === currentFeedback ? "bg-blue-500" : "bg-gray-200"
              )}
            />
          ))}
        </div>
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
            <div className="text-3xl font-bold text-green-600">{items.length}</div>
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
            <div className="text-3xl font-bold text-amber-600">{STAKEHOLDER_FEEDBACK.length}</div>
            <div className="text-sm text-muted-foreground">Feedback Received</div>
          </CardContent>
        </Card>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Key Feedback Highlights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {STAKEHOLDER_FEEDBACK.map((fb, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{fb.avatar}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{fb.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{fb.feedback}</p>
              </div>
            </div>
          ))}
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
