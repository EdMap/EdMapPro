import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft,
  GitBranch, 
  GitPullRequest,
  CheckCircle2, 
  Clock, 
  Target,
  Users,
  Play,
  AlertCircle,
  ChevronRight,
  Code,
  Bug,
  Star,
  Wrench,
  Send,
  MessageSquare,
  Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspacePhase } from "@/hooks/use-sprint-workflow";
import { useToast } from "@/hooks/use-toast";

interface SprintItem {
  id: string;
  title: string;
  type: 'bug' | 'feature' | 'improvement';
  priority: 'high' | 'medium' | 'low';
  points: number;
  description: string;
  status: 'todo' | 'in_progress' | 'in_review' | 'done';
  branchCreated?: boolean;
  prCreated?: boolean;
  merged?: boolean;
}

interface ExecutionModuleProps {
  workspaceId: number;
  userId: number;
  journeyId?: number;
  companyName: string;
  role: string;
  sprintGoal?: string;
  selectedItems?: string[];
  onComplete: () => void;
  onBack?: () => void;
}

const SPRINT_ITEMS: SprintItem[] = [
  {
    id: "TICKET-101",
    title: "Fix timezone display in transaction history",
    type: "bug",
    priority: "high",
    points: 3,
    description: "Transactions are showing in UTC instead of merchant's local timezone",
    status: "todo"
  },
  {
    id: "TICKET-102",
    title: "Add export to CSV functionality",
    type: "feature",
    priority: "medium",
    points: 5,
    description: "Allow merchants to export their transaction data to CSV format",
    status: "todo"
  },
  {
    id: "TICKET-103",
    title: "Improve dashboard load time",
    type: "improvement",
    priority: "medium",
    points: 8,
    description: "Optimize queries and add caching to reduce dashboard load time",
    status: "todo"
  },
  {
    id: "TICKET-104",
    title: "Fix refund calculation rounding error",
    type: "bug",
    priority: "high",
    points: 2,
    description: "Partial refunds sometimes show incorrect amounts due to floating point errors",
    status: "todo"
  }
];

function getTypeIcon(type: SprintItem['type']) {
  switch (type) {
    case 'bug': return Bug;
    case 'feature': return Star;
    case 'improvement': return Wrench;
    default: return Code;
  }
}

function getTypeColor(type: SprintItem['type']) {
  switch (type) {
    case 'bug': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
    case 'feature': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    case 'improvement': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
    default: return 'bg-gray-100 text-gray-700';
  }
}

type TicketStatus = 'todo' | 'in_progress' | 'in_review' | 'done';

function TicketCard({ 
  item, 
  onSelect,
  onMove
}: { 
  item: SprintItem;
  onSelect: (item: SprintItem) => void;
  onMove: (itemId: string, newStatus: TicketStatus) => void;
}) {
  const Icon = getTypeIcon(item.type);
  
  const priorityColors = {
    high: 'bg-red-500',
    medium: 'bg-amber-500',
    low: 'bg-gray-400',
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('itemId', item.id);
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onSelect(item)}
      draggable
      onDragStart={handleDragStart}
      data-testid={`card-ticket-${item.id}`}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="outline" className="text-xs font-mono">
            {item.id}
          </Badge>
          <div 
            className={`h-2 w-2 rounded-full ${priorityColors[item.priority]}`}
            title={`Priority: ${item.priority}`}
          />
        </div>
        
        <p className="text-sm font-medium line-clamp-2">{item.title}</p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {item.points} pts
            </Badge>
            <Badge className={cn("text-xs", getTypeColor(item.type))} variant="secondary">
              <Icon className="h-3 w-3 mr-1" />
              {item.type}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            {item.branchCreated && (
              <GitBranch className="h-3 w-3 text-blue-500" />
            )}
            {item.prCreated && (
              <GitPullRequest className="h-3 w-3 text-purple-500" />
            )}
            {item.merged && (
              <CheckCircle2 className="h-3 w-3 text-green-500" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function KanbanColumn({ 
  title, 
  status, 
  items,
  onSelectItem,
  onDropItem,
}: {
  title: string;
  status: TicketStatus;
  items: SprintItem[];
  onSelectItem: (item: SprintItem) => void;
  onDropItem: (itemId: string, newStatus: TicketStatus) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const itemId = e.dataTransfer.getData('itemId');
    if (itemId) {
      onDropItem(itemId, status);
    }
  };

  const statusColors = {
    todo: 'border-t-gray-400',
    in_progress: 'border-t-blue-500',
    in_review: 'border-t-amber-500',
    done: 'border-t-green-500',
  };

  return (
    <div 
      className={cn(
        "flex flex-col bg-muted/30 rounded-lg overflow-hidden border-t-4",
        statusColors[status],
        isDragOver && "ring-2 ring-blue-400"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid={`column-${status}`}
    >
      <div className="p-3 bg-background border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{title}</h3>
          <Badge variant="secondary" className="text-xs">
            {items.length}
          </Badge>
        </div>
      </div>
      
      <div className="flex-1 p-2 space-y-2 min-h-[200px] overflow-y-auto">
        {items.map(item => (
          <TicketCard
            key={item.id}
            item={item}
            onSelect={onSelectItem}
            onMove={onDropItem}
          />
        ))}
        
        {items.length === 0 && (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground p-4">
            No tickets
          </div>
        )}
      </div>
    </div>
  );
}

function TicketDetailDialog({ 
  item, 
  open,
  onClose,
  onUpdateStatus,
  onSimulateWork
}: { 
  item: SprintItem;
  open: boolean;
  onClose: () => void;
  onUpdateStatus: (itemId: string, newStatus: TicketStatus) => void;
  onSimulateWork: (itemId: string, action: 'branch' | 'pr' | 'merge') => void;
}) {
  const Icon = getTypeIcon(item.type);
  const [teamMessage, setTeamMessage] = useState('');
  const [messages, setMessages] = useState<{from: string; text: string; isUser?: boolean}[]>([
    { from: 'Sarah', text: "Let me know if you need any help with this ticket!" }
  ]);

  const handleSendMessage = () => {
    if (!teamMessage.trim()) return;
    setMessages([...messages, { from: 'You', text: teamMessage, isUser: true }]);
    setTeamMessage('');
    
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        from: 'Marcus', 
        text: "Good question! Check the existing codebase patterns in src/utils for reference. I can pair with you if needed." 
      }]);
    }, 1000);
  };

  const nextAction = !item.branchCreated ? 'branch' : !item.prCreated ? 'pr' : !item.merged ? 'merge' : null;
  const nextActionLabel = !item.branchCreated ? 'Create Branch' : !item.prCreated ? 'Open PR' : !item.merged ? 'Merge PR' : null;
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="font-mono">{item.id}</Badge>
            <Badge className={getTypeColor(item.type)} variant="secondary">
              <Icon className="h-3 w-3 mr-1" />
              {item.type}
            </Badge>
          </div>
          <DialogTitle>{item.title}</DialogTitle>
          <DialogDescription>{item.description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-lg font-bold">{item.points}</div>
              <div className="text-xs text-muted-foreground">Points</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-lg font-bold capitalize">{item.priority}</div>
              <div className="text-xs text-muted-foreground">Priority</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-lg font-bold capitalize">{item.status.replace('_', ' ')}</div>
              <div className="text-xs text-muted-foreground">Status</div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Git Workflow
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <div className="flex items-center gap-2">
                  {item.branchCreated ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span className={item.branchCreated ? '' : 'text-muted-foreground'}>
                    Create feature branch
                  </span>
                </div>
                {!item.branchCreated && (
                  <Button size="sm" variant="outline" onClick={() => onSimulateWork(item.id, 'branch')}>
                    <GitBranch className="h-3 w-3 mr-1" />
                    Create
                  </Button>
                )}
              </div>
              
              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <div className="flex items-center gap-2">
                  {item.prCreated ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span className={item.prCreated ? '' : 'text-muted-foreground'}>
                    Open pull request
                  </span>
                </div>
                {item.branchCreated && !item.prCreated && (
                  <Button size="sm" variant="outline" onClick={() => onSimulateWork(item.id, 'pr')}>
                    <GitPullRequest className="h-3 w-3 mr-1" />
                    Open PR
                  </Button>
                )}
              </div>
              
              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <div className="flex items-center gap-2">
                  {item.merged ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span className={item.merged ? '' : 'text-muted-foreground'}>
                    Merge to main
                  </span>
                </div>
                {item.prCreated && !item.merged && (
                  <Button size="sm" variant="outline" onClick={() => onSimulateWork(item.id, 'merge')}>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Merge
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Team Chat
            </h4>
            <div className="border rounded-lg">
              <div className="max-h-40 overflow-y-auto p-3 space-y-2">
                {messages.map((msg, i) => (
                  <div key={i} className={cn(
                    "text-sm p-2 rounded",
                    msg.isUser ? "bg-blue-100 dark:bg-blue-900 ml-8" : "bg-muted/50 mr-8"
                  )}>
                    <span className="font-medium">{msg.from}: </span>
                    {msg.text}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 p-2 border-t">
                <Textarea 
                  value={teamMessage}
                  onChange={(e) => setTeamMessage(e.target.value)}
                  placeholder="Ask your team for help..."
                  className="min-h-[40px] resize-none"
                  rows={1}
                />
                <Button size="sm" onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between pt-4">
            <div className="flex gap-2">
              {item.status !== 'todo' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onUpdateStatus(item.id, 
                    item.status === 'in_progress' ? 'todo' : 
                    item.status === 'in_review' ? 'in_progress' : 'in_review'
                  )}
                >
                  Move Back
                </Button>
              )}
            </div>
            {item.status !== 'done' && (
              <Button 
                onClick={() => onUpdateStatus(item.id,
                  item.status === 'todo' ? 'in_progress' :
                  item.status === 'in_progress' ? 'in_review' : 'done'
                )}
              >
                {item.status === 'todo' ? 'Start Working' :
                 item.status === 'in_progress' ? 'Submit for Review' : 'Mark Done'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ExecutionModule({ 
  workspaceId, 
  userId, 
  journeyId,
  companyName, 
  role,
  sprintGoal = "Fix critical timezone issues and add CSV export functionality",
  selectedItems = ["TICKET-101", "TICKET-102", "TICKET-104"],
  onComplete,
  onBack 
}: ExecutionModuleProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<SprintItem[]>(() => 
    SPRINT_ITEMS.filter(i => selectedItems.includes(i.id))
  );
  const [selectedItem, setSelectedItem] = useState<SprintItem | null>(null);
  const [sprintDay, setSprintDay] = useState(1);

  const itemsByStatus = useMemo(() => ({
    todo: items.filter(i => i.status === 'todo'),
    in_progress: items.filter(i => i.status === 'in_progress'),
    in_review: items.filter(i => i.status === 'in_review'),
    done: items.filter(i => i.status === 'done'),
  }), [items]);

  const totalPoints = items.reduce((sum, i) => sum + i.points, 0);
  const completedPoints = itemsByStatus.done.reduce((sum, i) => sum + i.points, 0);
  const progressPercent = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

  const allDone = items.every(i => i.status === 'done');

  const completePhase = useMutation({
    mutationFn: async () => {
      return apiRequest('PATCH', `/api/workspaces/${workspaceId}/phase`, {
        newPhase: 'review' as WorkspacePhase,
        status: 'completed',
        payload: {
          completedItems: items.map(i => i.id),
          totalPoints,
          completedPoints
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces', workspaceId] });
      onComplete();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to complete execution phase. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleMoveItem = (itemId: string, newStatus: TicketStatus) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, status: newStatus } : item
    ));
    if (selectedItem?.id === itemId) {
      setSelectedItem(prev => prev ? { ...prev, status: newStatus } : null);
    }
    
    if (newStatus === 'done') {
      toast({
        title: "Ticket completed!",
        description: `${itemId} has been moved to Done.`,
      });
    }
  };

  const handleSimulateWork = (itemId: string, action: 'branch' | 'pr' | 'merge') => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const updates: Partial<SprintItem> = {};
      if (action === 'branch') updates.branchCreated = true;
      if (action === 'pr') updates.prCreated = true;
      if (action === 'merge') updates.merged = true;
      return { ...item, ...updates };
    }));
    
    if (selectedItem?.id === itemId) {
      setSelectedItem(prev => {
        if (!prev) return null;
        const updates: Partial<SprintItem> = {};
        if (action === 'branch') updates.branchCreated = true;
        if (action === 'pr') updates.prCreated = true;
        if (action === 'merge') updates.merged = true;
        return { ...prev, ...updates };
      });
    }
    
    toast({
      title: action === 'branch' ? 'Branch Created' : action === 'pr' ? 'PR Opened' : 'PR Merged',
      description: action === 'branch' 
        ? `Created feature/${itemId.toLowerCase()}-fix`
        : action === 'pr'
        ? 'Pull request is ready for review'
        : 'Changes have been merged to main',
    });
  };

  return (
    <div className="space-y-6" data-testid="execution-module">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sprint Execution</h2>
          <p className="text-gray-500 dark:text-gray-400">{sprintGoal}</p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack} data-testid="button-back-to-dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sprint Day</p>
              <p className="text-xl font-semibold">{sprintDay}/10</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center">
              <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="text-xl font-semibold">{progressPercent}%</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center">
              <Users className="h-5 w-5 text-amber-600 dark:text-amber-300" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">In Review</p>
              <p className="text-xl font-semibold">{itemsByStatus.in_review.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-xl font-semibold">{completedPoints}/{totalPoints} pts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KanbanColumn
          title="To Do"
          status="todo"
          items={itemsByStatus.todo}
          onSelectItem={setSelectedItem}
          onDropItem={handleMoveItem}
        />
        <KanbanColumn
          title="In Progress"
          status="in_progress"
          items={itemsByStatus.in_progress}
          onSelectItem={setSelectedItem}
          onDropItem={handleMoveItem}
        />
        <KanbanColumn
          title="In Review"
          status="in_review"
          items={itemsByStatus.in_review}
          onSelectItem={setSelectedItem}
          onDropItem={handleMoveItem}
        />
        <KanbanColumn
          title="Done"
          status="done"
          items={itemsByStatus.done}
          onSelectItem={setSelectedItem}
          onDropItem={handleMoveItem}
        />
      </div>

      {selectedItem && (
        <TicketDetailDialog
          item={selectedItem}
          open={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdateStatus={handleMoveItem}
          onSimulateWork={handleSimulateWork}
        />
      )}

      <Progress value={progressPercent} className="h-2" />
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Day {sprintDay} of 10</span>
        <span>{completedPoints}/{totalPoints} story points completed</span>
      </div>

      {allDone && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-100">Sprint Complete!</h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    All tickets completed. Ready for Sprint Review.
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => completePhase.mutate()}
                disabled={completePhase.isPending}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-complete-sprint"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Sprint Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
