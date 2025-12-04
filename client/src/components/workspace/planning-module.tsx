import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ListTodo, 
  Target, 
  CheckCircle2, 
  ArrowLeft,
  ArrowRight,
  Lightbulb,
  AlertCircle,
  Play,
  Bug,
  Wrench,
  Star,
  Send,
  MessageCircle,
  GraduationCap,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BacklogItem {
  id: string;
  title: string;
  type: 'bug' | 'feature' | 'improvement';
  priority: 'high' | 'medium' | 'low';
  points: number;
  description: string;
  selected?: boolean;
}

interface PlanningMessage {
  id: number;
  sender: string;
  senderRole: string;
  message: string;
  phase: string;
  isUser: boolean;
  createdAt: string;
}

interface PlanningSession {
  id: number;
  workspaceId: number;
  role: string;
  level: string;
  currentPhase: string;
  phaseCompletions: Record<string, boolean>;
  selectedItems: string[];
  capacityUsed: number;
  goalStatement: string | null;
  status: string;
  knowledgeCheckPassed: boolean;
}

type EngagementMode = 'shadow' | 'guided' | 'active' | 'facilitator';
type PhaseEngagement = 'observe' | 'respond' | 'lead';

interface LevelEngagement {
  mode: EngagementMode;
  autoStartConversation: boolean;
  teamTalkRatio: number;
  phaseEngagement: {
    context: PhaseEngagement;
    discussion: PhaseEngagement;
    commitment: PhaseEngagement;
  };
  promptSuggestions?: {
    context: string[];
    discussion: string[];
    commitment: string[];
  };
  autoStartMessage: string;
}

interface PlanningSessionState {
  session: PlanningSession;
  messages: PlanningMessage[];
  backlogItems: BacklogItem[];
  capacity: number;
  adapterConfig: {
    role: string;
    level: string;
    facilitator: 'user' | 'ai';
    showLearningObjectives: boolean;
    showKnowledgeCheck: boolean;
    canSkipPhases: boolean;
    engagement: LevelEngagement;
  };
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

const PLANNING_PHASES = [
  { id: 'context', label: 'Context', icon: Lightbulb, description: 'Understand priorities' },
  { id: 'discussion', label: 'Discussion', icon: MessageCircle, description: 'Discuss & estimate' },
  { id: 'commitment', label: 'Commitment', icon: CheckCircle2, description: 'Finalize sprint' }
];

const PERSONA_COLORS: Record<string, string> = {
  'Priya': 'bg-purple-100 text-purple-700 border-purple-200',
  'Marcus': 'bg-blue-100 text-blue-700 border-blue-200',
  'Alex': 'bg-green-100 text-green-700 border-green-200',
  'default': 'bg-gray-100 text-gray-700 border-gray-200'
};

const PERSONA_AVATARS: Record<string, string> = {
  'Priya': 'PM',
  'Marcus': 'MD',
  'Alex': 'AQ',
  'You': 'ME'
};

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

function PhaseProgress({ currentPhase, phaseCompletions }: { currentPhase: string; phaseCompletions: Record<string, boolean> }) {
  return (
    <div className="flex items-center gap-2 p-4 bg-muted/30 rounded-lg mb-6">
      {PLANNING_PHASES.map((phase, index) => {
        const Icon = phase.icon;
        const isActive = currentPhase === phase.id;
        const isCompleted = phaseCompletions[phase.id];
        
        return (
          <div key={phase.id} className="flex items-center">
            <div className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
              isActive && "bg-indigo-100 dark:bg-indigo-900/50 ring-2 ring-indigo-500",
              isCompleted && !isActive && "bg-green-100 dark:bg-green-900/30",
              !isActive && !isCompleted && "opacity-50"
            )}>
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center",
                isActive && "bg-indigo-500 text-white",
                isCompleted && !isActive && "bg-green-500 text-white",
                !isActive && !isCompleted && "bg-muted text-muted-foreground"
              )}>
                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <div className="hidden sm:block">
                <div className={cn(
                  "text-sm font-medium",
                  isActive && "text-indigo-700 dark:text-indigo-300"
                )}>{phase.label}</div>
                <div className="text-xs text-muted-foreground">{phase.description}</div>
              </div>
            </div>
            {index < PLANNING_PHASES.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ChatMessage({ message }: { message: PlanningMessage }) {
  const colorClass = PERSONA_COLORS[message.sender] || PERSONA_COLORS.default;
  const avatar = PERSONA_AVATARS[message.sender] || message.sender.substring(0, 2).toUpperCase();
  
  return (
    <div className={cn(
      "flex gap-3 mb-4",
      message.isUser && "flex-row-reverse"
    )}>
      <Avatar className={cn("h-8 w-8", message.isUser ? "bg-indigo-100" : colorClass.split(' ')[0])}>
        <AvatarFallback className={cn("text-xs", message.isUser ? "text-indigo-700" : "")}>{avatar}</AvatarFallback>
      </Avatar>
      <div className={cn(
        "max-w-[80%] rounded-lg p-3",
        message.isUser 
          ? "bg-indigo-500 text-white" 
          : "bg-white dark:bg-gray-800 border"
      )}>
        {!message.isUser && (
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{message.sender}</span>
            <Badge variant="outline" className="text-xs py-0">{message.senderRole}</Badge>
          </div>
        )}
        <p className={cn("text-sm", message.isUser ? "text-white" : "text-foreground")}>{message.message}</p>
      </div>
    </div>
  );
}

function BacklogPanel({ 
  items, 
  selectedItems, 
  capacity, 
  onToggleItem,
  disabled 
}: { 
  items: BacklogItem[]; 
  selectedItems: string[]; 
  capacity: number;
  onToggleItem: (id: string) => void;
  disabled?: boolean;
}) {
  const selectedPoints = items
    .filter(item => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.points, 0);
  
  const capacityUsed = (selectedPoints / capacity) * 100;
  const isOverCapacity = selectedPoints > capacity;
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Sprint Backlog</CardTitle>
            <CardDescription>Select items for this sprint</CardDescription>
          </div>
          <div className="text-right">
            <div className={cn(
              "text-lg font-bold",
              isOverCapacity ? "text-red-600" : "text-green-600"
            )}>
              {selectedPoints}/{capacity}
            </div>
            <div className="text-xs text-muted-foreground">points</div>
          </div>
        </div>
        <Progress 
          value={Math.min(capacityUsed, 100)} 
          className={cn("h-2 mt-2", isOverCapacity && "bg-red-100")}
        />
        {isOverCapacity && (
          <div className="flex items-center gap-2 mt-2 text-red-600 text-xs">
            <AlertCircle className="h-3 w-3" />
            Over capacity
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-3">
          <div className="space-y-2">
            {items.map(item => {
              const Icon = getTypeIcon(item.type);
              const isSelected = selectedItems.includes(item.id);
              
              return (
                <div 
                  key={item.id}
                  className={cn(
                    "p-3 rounded-lg border transition-all",
                    disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                    isSelected 
                      ? "border-indigo-300 bg-indigo-50/50 dark:bg-indigo-900/20" 
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => !disabled && onToggleItem(item.id)}
                  data-testid={`backlog-item-${item.id}`}
                >
                  <div className="flex items-start gap-2">
                    <Checkbox 
                      checked={isSelected}
                      onCheckedChange={() => !disabled && onToggleItem(item.id)}
                      className="mt-1"
                      disabled={disabled}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="text-xs font-mono text-muted-foreground">{item.id}</span>
                        <Badge className={cn("text-xs py-0", getTypeColor(item.type))} variant="secondary">
                          <Icon className="h-2.5 w-2.5 mr-0.5" />
                          {item.type}
                        </Badge>
                        <Badge className={cn("text-xs py-0", getPriorityBadge(item.priority))}>
                          {item.priority}
                        </Badge>
                        <span className="text-xs font-medium text-indigo-600">{item.points}pts</span>
                      </div>
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white">{item.title}</h4>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function LearningObjectives({ phase, role, level }: { phase: string; role: string; level: string }) {
  const objectives: Record<string, string[]> = {
    context: [
      "Understand sprint goals come from business priorities",
      "Listen to how the PM presents context to the team",
      "Ask clarifying questions about priorities"
    ],
    discussion: [
      "Learn how teams estimate work together",
      "Understand the importance of breaking down work",
      "Practice raising concerns constructively"
    ],
    commitment: [
      "See how teams make realistic commitments",
      "Understand capacity planning basics",
      "Learn to balance ambition with sustainability"
    ]
  };
  
  return (
    <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 mb-4">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <GraduationCap className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-900 dark:text-amber-100 text-sm mb-2">Learning Objectives</h4>
            <ul className="space-y-1">
              {objectives[phase]?.map((obj, i) => (
                <li key={i} className="text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  {obj}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PlanningModule({ 
  workspaceId, 
  userId, 
  journeyId,
  companyName, 
  role,
  onComplete,
  onBack 
}: PlanningModuleProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [sprintGoal, setSprintGoal] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { data: sessionState, isLoading, refetch } = useQuery<PlanningSessionState>({
    queryKey: [`/api/workspaces/${workspaceId}/planning`],
    queryFn: async () => {
      const response = await fetch(`/api/workspaces/${workspaceId}/planning?_t=${Date.now()}`);
      if (!response.ok) throw new Error('Failed to fetch planning session');
      return response.json();
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });
  
  const initSession = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/workspaces/${workspaceId}/planning`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}/planning`] });
    }
  });
  
  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', `/api/workspaces/${workspaceId}/planning/message`, { message });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}/planning`] });
      setInputMessage('');
    }
  });
  
  const selectItems = useMutation({
    mutationFn: async ({ selectedItems, capacityUsed }: { selectedItems: string[]; capacityUsed: number }) => {
      const response = await apiRequest('POST', `/api/workspaces/${workspaceId}/planning/select-items`, { 
        selectedItems, 
        capacityUsed 
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}/planning`] });
    }
  });
  
  const setGoal = useMutation({
    mutationFn: async (goalStatement: string) => {
      const response = await apiRequest('POST', `/api/workspaces/${workspaceId}/planning/goal`, { goalStatement });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}/planning`] });
    }
  });
  
  const advancePhase = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/workspaces/${workspaceId}/planning/advance`, {});
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}/planning`] });
      if (data.completed) {
        onComplete(sessionState?.session.goalStatement || '', (sessionState?.session.selectedItems as string[]) || []);
      }
    }
  });
  
  useEffect(() => {
    if (!sessionState && !isLoading) {
      initSession.mutate();
    }
  }, [sessionState, isLoading]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessionState?.messages]);
  
  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      sendMessage.mutate(inputMessage.trim());
    }
  };
  
  const handleToggleItem = (itemId: string) => {
    if (!sessionState) return;
    
    const currentSelected = sessionState.session.selectedItems || [];
    const newSelected = currentSelected.includes(itemId)
      ? currentSelected.filter(id => id !== itemId)
      : [...currentSelected, itemId];
    
    const capacityUsed = sessionState.backlogItems
      .filter(item => newSelected.includes(item.id))
      .reduce((sum, item) => sum + item.points, 0);
    
    selectItems.mutate({ selectedItems: newSelected, capacityUsed });
  };
  
  const handleSetGoal = () => {
    if (sprintGoal.trim()) {
      setGoal.mutate(sprintGoal.trim());
    }
  };
  
  const canAdvance = () => {
    if (!sessionState) return false;
    const { session, backlogItems } = sessionState;
    
    switch (session.currentPhase) {
      case 'context':
        return sessionState.messages.length >= 2;
      case 'discussion':
        return (session.selectedItems || []).length > 0;
      case 'commitment':
        return !!session.goalStatement;
      default:
        return false;
    }
  };
  
  if (isLoading || !sessionState || !sessionState.session) {
    return (
      <div className="h-full p-6" data-testid="planning-module-loading">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-16 w-full" />
          <div className="grid grid-cols-2 gap-4 h-[500px]">
            <Skeleton className="h-full" />
            <Skeleton className="h-full" />
          </div>
        </div>
      </div>
    );
  }
  
  const defaultEngagement: LevelEngagement = {
    mode: 'guided',
    autoStartConversation: true,
    teamTalkRatio: 0.5,
    phaseEngagement: { context: 'respond', discussion: 'respond', commitment: 'respond' },
    autoStartMessage: 'Good morning team! Let\'s get started with our sprint planning.'
  };
  
  const { 
    session, 
    messages = [], 
    backlogItems = [], 
    capacity = 20, 
    adapterConfig = { 
      role: role, 
      level: 'intern', 
      facilitator: 'ai', 
      showLearningObjectives: true, 
      showKnowledgeCheck: false, 
      canSkipPhases: false,
      engagement: defaultEngagement
    }
  } = sessionState;
  const selectedItems = (session.selectedItems as string[] | null) || [];
  const engagement = adapterConfig.engagement || defaultEngagement;
  const currentPhaseEngagement = engagement.phaseEngagement[session.currentPhase as keyof typeof engagement.phaseEngagement] || 'respond';
  const promptSuggestions = engagement.promptSuggestions?.[session.currentPhase as keyof typeof engagement.promptSuggestions] || [];
  
  return (
    <div className="h-full flex flex-col" data-testid="planning-module">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sprint Planning Meeting</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{companyName} • {role}</p>
          </div>
          <div className="flex items-center gap-2">
            {onBack && (
              <Button variant="outline" size="sm" onClick={onBack} data-testid="button-back-to-dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
        </div>
        
        <PhaseProgress 
          currentPhase={session.currentPhase} 
          phaseCompletions={session.phaseCompletions as Record<string, boolean>} 
        />
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col border-r">
          {adapterConfig.showLearningObjectives && (
            <div className="p-4 pb-0">
              <LearningObjectives 
                phase={session.currentPhase} 
                role={adapterConfig.role} 
                level={adapterConfig.level} 
              />
            </div>
          )}
          
          <div className="flex-1 overflow-hidden p-4">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-2 border-b">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Team Discussion
                  </div>
                  {engagement.mode === 'shadow' && (
                    <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                      Observing
                    </Badge>
                  )}
                  {engagement.mode === 'guided' && (
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      Guided
                    </Badge>
                  )}
                  {engagement.mode === 'active' && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      Active
                    </Badge>
                  )}
                  {engagement.mode === 'facilitator' && (
                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                      Facilitating
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {session.currentPhase === 'context' && currentPhaseEngagement === 'observe' && "Watch how Priya presents priorities - you'll be asked for questions later"}
                  {session.currentPhase === 'context' && currentPhaseEngagement !== 'observe' && "Priya is presenting sprint priorities"}
                  {session.currentPhase === 'discussion' && currentPhaseEngagement === 'observe' && "Observe how the team discusses and estimates together"}
                  {session.currentPhase === 'discussion' && currentPhaseEngagement !== 'observe' && "Discuss items and estimate as a team"}
                  {session.currentPhase === 'commitment' && "Finalize the sprint commitment"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0 min-h-[200px]">
                <ScrollArea className="h-full min-h-[180px] p-4">
                  {messages.length === 0 && session.currentPhase === 'context' && (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      {engagement.mode === 'shadow' ? (
                        <>
                          <p>The meeting is about to start...</p>
                          <p className="text-sm mt-1">Priya will kick things off. Feel free to observe!</p>
                        </>
                      ) : (
                        <>
                          <p>The meeting is about to start...</p>
                          <p className="text-sm mt-1">Say hello to join the discussion!</p>
                        </>
                      )}
                    </div>
                  )}
                  {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                  ))}
                  <div ref={messagesEndRef} />
                </ScrollArea>
              </CardContent>
              <div className="p-4 border-t space-y-2">
                {promptSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {promptSuggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => setInputMessage(suggestion)}
                        disabled={sendMessage.isPending}
                        data-testid={`button-suggestion-${index}`}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={engagement.mode === 'shadow' ? "Type a question or observation..." : "Type your message..."}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={sendMessage.isPending}
                    data-testid="input-chat-message"
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!inputMessage.trim() || sendMessage.isPending}
                    data-testid="button-send-message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
          
          {session.currentPhase === 'commitment' && (
            <div className="p-4 pt-0">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Sprint Goal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      value={sprintGoal}
                      onChange={(e) => setSprintGoal(e.target.value)}
                      placeholder="e.g., Fix critical bugs to improve user trust"
                      data-testid="input-sprint-goal"
                    />
                    <Button 
                      onClick={handleSetGoal} 
                      disabled={!sprintGoal.trim() || setGoal.isPending}
                      variant="secondary"
                    >
                      Set Goal
                    </Button>
                  </div>
                  {session.goalStatement && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="font-medium text-sm">{session.goalStatement}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
          <div className="p-4 pt-0">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {session.currentPhase === 'context' && messages.length < 2 && "Have a brief discussion first"}
                {session.currentPhase === 'discussion' && selectedItems.length === 0 && "Select at least one backlog item"}
                {session.currentPhase === 'commitment' && !session.goalStatement && "Set a sprint goal to continue"}
              </div>
              <Button 
                onClick={() => advancePhase.mutate()}
                disabled={!canAdvance() || advancePhase.isPending}
                className={session.currentPhase === 'commitment' ? "bg-green-600 hover:bg-green-700" : ""}
                data-testid="button-advance-phase"
              >
                {advancePhase.isPending ? (
                  "Processing..."
                ) : session.currentPhase === 'commitment' ? (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Sprint
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="w-80 p-4">
          <BacklogPanel
            items={backlogItems}
            selectedItems={selectedItems}
            capacity={capacity}
            onToggleItem={handleToggleItem}
            disabled={session.currentPhase === 'context'}
          />
        </div>
      </div>
    </div>
  );
}
