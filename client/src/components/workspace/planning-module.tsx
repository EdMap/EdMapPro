import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ListTodo, 
  Target, 
  CheckCircle2, 
  Clock,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Users,
  CalendarDays,
  Lightbulb,
  AlertCircle,
  Play,
  Bug,
  Wrench,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspacePhase } from "@/hooks/use-sprint-workflow";

interface BacklogItem {
  id: string;
  title: string;
  type: 'bug' | 'feature' | 'improvement';
  priority: 'high' | 'medium' | 'low';
  points: number;
  description: string;
  selected?: boolean;
}

interface PlanningModuleProps {
  workspaceId: number;
  userId: number;
  journeyId?: number;
  companyName: string;
  role: string;
  onComplete: (sprintGoal: string, selectedItems: string[]) => void;
  onBack?: () => void;
}

const SAMPLE_BACKLOG: BacklogItem[] = [
  {
    id: "TICKET-101",
    title: "Fix timezone display in transaction history",
    type: "bug",
    priority: "high",
    points: 3,
    description: "Transactions are showing in UTC instead of merchant's local timezone"
  },
  {
    id: "TICKET-102",
    title: "Add export to CSV functionality",
    type: "feature",
    priority: "medium",
    points: 5,
    description: "Allow merchants to export their transaction data to CSV format"
  },
  {
    id: "TICKET-103",
    title: "Improve dashboard load time",
    type: "improvement",
    priority: "medium",
    points: 8,
    description: "Optimize queries and add caching to reduce dashboard load time"
  },
  {
    id: "TICKET-104",
    title: "Fix refund calculation rounding error",
    type: "bug",
    priority: "high",
    points: 2,
    description: "Partial refunds sometimes show incorrect amounts due to floating point errors"
  },
  {
    id: "TICKET-105",
    title: "Add search filters to transaction list",
    type: "feature",
    priority: "low",
    points: 5,
    description: "Add ability to filter transactions by date range, amount, and status"
  }
];

const SPRINT_CAPACITY = 13;

function getTypeIcon(type: BacklogItem['type']) {
  switch (type) {
    case 'bug': return Bug;
    case 'feature': return Star;
    case 'improvement': return Wrench;
    default: return ListTodo;
  }
}

function getTypeColor(type: BacklogItem['type']) {
  switch (type) {
    case 'bug': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
    case 'feature': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    case 'improvement': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getPriorityBadge(priority: BacklogItem['priority']) {
  switch (priority) {
    case 'high': return 'bg-red-500 text-white';
    case 'medium': return 'bg-amber-500 text-white';
    case 'low': return 'bg-gray-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
}

type PlanningStep = 'backlog-review' | 'sprint-goal' | 'commitment';

export function PlanningModule({ 
  workspaceId, 
  userId, 
  journeyId,
  companyName, 
  role,
  onComplete,
  onBack 
}: PlanningModuleProps) {
  const [currentStep, setCurrentStep] = useState<PlanningStep>('backlog-review');
  const [backlog, setBacklog] = useState<BacklogItem[]>(SAMPLE_BACKLOG);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [sprintGoal, setSprintGoal] = useState('');
  const [goalNotes, setGoalNotes] = useState('');
  const [teamFeedback, setTeamFeedback] = useState<string | null>(null);

  const selectedPoints = backlog
    .filter(item => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.points, 0);

  const capacityUsed = (selectedPoints / SPRINT_CAPACITY) * 100;
  const isOverCapacity = selectedPoints > SPRINT_CAPACITY;

  const completePhase = useMutation({
    mutationFn: async () => {
      return apiRequest('PATCH', `/api/workspaces/${workspaceId}/phase`, {
        newPhase: 'execution' as WorkspacePhase,
        status: 'completed',
        payload: {
          sprintGoal,
          selectedItems,
          points: selectedPoints
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces', workspaceId] });
      onComplete(sprintGoal, selectedItems);
    }
  });

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleGetTeamFeedback = () => {
    if (isOverCapacity) {
      setTeamFeedback("Sarah: That's a lot for one sprint. I'd recommend dropping one of the 5-point items to keep things realistic. Remember, it's better to under-promise and over-deliver!");
    } else if (selectedPoints < 8) {
      setTeamFeedback("Marcus: We could probably take on a bit more. The team has good velocity right now. Consider adding another small item if you feel comfortable.");
    } else {
      setTeamFeedback("Priya: This looks like a solid sprint plan! Good mix of bugs and features. The team should be able to deliver this confidently.");
    }
  };

  const renderBacklogReview = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sprint Planning</h2>
          <p className="text-gray-500 dark:text-gray-400">Review and select items for the upcoming sprint</p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack} data-testid="button-back-to-dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
      </div>

      <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-indigo-200 dark:border-indigo-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center">
              <ListTodo className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">Step 1: Review the Backlog</h3>
              <p className="text-sm text-indigo-700 dark:text-indigo-300">
                Select items that the team will commit to completing this sprint
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-indigo-600 dark:text-indigo-300">Sprint Capacity</div>
              <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{SPRINT_CAPACITY} points</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Product Backlog</CardTitle>
              <CardDescription>Select items based on priority and team capacity</CardDescription>
            </div>
            <div className="text-right">
              <div className={cn(
                "text-2xl font-bold",
                isOverCapacity ? "text-red-600" : "text-green-600"
              )}>
                {selectedPoints}/{SPRINT_CAPACITY}
              </div>
              <div className="text-xs text-muted-foreground">points selected</div>
            </div>
          </div>
          <Progress 
            value={Math.min(capacityUsed, 100)} 
            className={cn("h-2 mt-2", isOverCapacity && "bg-red-100")}
          />
          {isOverCapacity && (
            <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              Over capacity! Consider removing some items.
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {backlog.map(item => {
              const Icon = getTypeIcon(item.type);
              const isSelected = selectedItems.includes(item.id);
              
              return (
                <div 
                  key={item.id}
                  className={cn(
                    "p-4 rounded-lg border transition-all cursor-pointer",
                    isSelected 
                      ? "border-indigo-300 bg-indigo-50/50 dark:bg-indigo-900/20" 
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => toggleItem(item.id)}
                  data-testid={`backlog-item-${item.id}`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      checked={isSelected}
                      onCheckedChange={() => toggleItem(item.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-mono text-muted-foreground">{item.id}</span>
                        <Badge className={getTypeColor(item.type)} variant="secondary">
                          <Icon className="h-3 w-3 mr-1" />
                          {item.type}
                        </Badge>
                        <Badge className={getPriorityBadge(item.priority)}>
                          {item.priority}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{item.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-indigo-600">{item.points}</div>
                      <div className="text-xs text-muted-foreground">points</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedItems.length > 0 && (
        <div className="flex justify-end">
          <Button 
            onClick={() => setCurrentStep('sprint-goal')}
            disabled={isOverCapacity}
            data-testid="button-next-sprint-goal"
          >
            Set Sprint Goal
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );

  const renderSprintGoal = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Define Sprint Goal</h2>
          <p className="text-gray-500 dark:text-gray-400">What is the team aiming to achieve this sprint?</p>
        </div>
        <Button variant="outline" onClick={() => setCurrentStep('backlog-review')} data-testid="button-back-to-backlog">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center">
              <Target className="h-6 w-6 text-purple-600 dark:text-purple-300" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-900 dark:text-purple-100">Step 2: Sprint Goal</h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                A clear, concise statement of what the team will deliver
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Sprint Goal
          </CardTitle>
          <CardDescription>
            Write a single sentence that describes the value delivered this sprint
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sprint-goal">Goal Statement</Label>
            <Input
              id="sprint-goal"
              value={sprintGoal}
              onChange={(e) => setSprintGoal(e.target.value)}
              placeholder="e.g., Fix critical timezone issues so merchants can trust their transaction data"
              className="text-lg"
              data-testid="input-sprint-goal"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="goal-notes">Additional Context (Optional)</Label>
            <Textarea
              id="goal-notes"
              value={goalNotes}
              onChange={(e) => setGoalNotes(e.target.value)}
              placeholder="Any notes about dependencies, risks, or success criteria..."
              rows={3}
              data-testid="input-goal-notes"
            />
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Tips for a good sprint goal:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Focus on user value, not just tasks</li>
                  <li>Be specific but achievable</li>
                  <li>Something the whole team can rally behind</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Selected Items Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {backlog.filter(item => selectedItems.includes(item.id)).map(item => (
              <Badge key={item.id} variant="outline" className="py-1.5">
                {item.id}: {item.title.slice(0, 30)}...
              </Badge>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            {selectedItems.length} items • {selectedPoints} points
          </p>
        </CardContent>
      </Card>

      {sprintGoal.trim() && (
        <div className="flex justify-end">
          <Button 
            onClick={() => setCurrentStep('commitment')}
            data-testid="button-next-commitment"
          >
            Review & Commit
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );

  const renderCommitment = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Team Commitment</h2>
          <p className="text-gray-500 dark:text-gray-400">Review and confirm your sprint plan with the team</p>
        </div>
        <Button variant="outline" onClick={() => setCurrentStep('sprint-goal')} data-testid="button-back-to-goal">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <Card className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border-green-200 dark:border-green-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-100">Step 3: Team Commitment</h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Get team feedback and make the final commitment to the sprint
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sprint Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-indigo-600" />
              <span className="font-medium text-indigo-900 dark:text-indigo-100">Sprint Goal</span>
            </div>
            <p className="text-indigo-800 dark:text-indigo-200">{sprintGoal}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{selectedItems.length}</div>
              <div className="text-xs text-muted-foreground">Items</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">{selectedPoints}</div>
              <div className="text-xs text-muted-foreground">Points</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">10</div>
              <div className="text-xs text-muted-foreground">Days</div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Committed Items
            </h4>
            <div className="space-y-2">
              {backlog.filter(item => selectedItems.includes(item.id)).map(item => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-muted-foreground">{item.id}</span>
                    <span>{item.title}</span>
                  </div>
                  <Badge variant="outline">{item.points} pts</Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Feedback
          </CardTitle>
          <CardDescription>Get input from your teammates before committing</CardDescription>
        </CardHeader>
        <CardContent>
          {teamFeedback ? (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
              <p className="text-blue-800 dark:text-blue-200">{teamFeedback}</p>
            </div>
          ) : (
            <Button 
              variant="outline" 
              onClick={handleGetTeamFeedback}
              data-testid="button-get-feedback"
            >
              <Users className="h-4 w-4 mr-2" />
              Get Team Feedback
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100">Ready to Start Sprint!</h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Commit to the sprint and begin execution
                </p>
              </div>
            </div>
            <Button 
              onClick={() => completePhase.mutate()}
              disabled={completePhase.isPending}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-start-sprint"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Sprint
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="h-full" data-testid="planning-module">
      {currentStep === 'backlog-review' && renderBacklogReview()}
      {currentStep === 'sprint-goal' && renderSprintGoal()}
      {currentStep === 'commitment' && renderCommitment()}
    </div>
  );
}
