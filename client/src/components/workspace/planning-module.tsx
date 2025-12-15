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
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Users,
  ClipboardList
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

interface MessageStaggerConfig {
  enabled: boolean;
  baseDelayMs: number;
  perCharacterDelayMs: number;
  maxDelayMs: number;
}

interface SelectionGuidance {
  mode: 'autoAssign' | 'prompted' | 'selfManaged';
  suggestedItemIds?: string[];
  confirmationPrompt?: string;
  visualCueCopy?: string;
  backlogPanelHighlight?: boolean;
  nextStepHint?: string;
}

interface CommitmentGuidance {
  mode: 'autoSet' | 'userDefined';
  suggestedGoal?: string;
}

interface PreMeetingBriefing {
  enabled: boolean;
  title: string;
  subtitle: string;
  agenda: string[];
  attendees: { name: string; role: string; avatarSeed: string }[];
  contextNote?: string;
  joinButtonText: string;
}

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
  messageStagger?: MessageStaggerConfig;
  selectionGuidance?: SelectionGuidance;
  preMeetingBriefing?: PreMeetingBriefing;
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
    commitmentGuidance?: CommitmentGuidance;
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
      "flex gap-3.5 mb-5",
      message.isUser && "flex-row-reverse"
    )}>
      <Avatar className={cn(
        "h-10 w-10 flex-shrink-0 border-2 shadow-sm",
        message.isUser 
          ? "bg-indigo-100 border-indigo-200" 
          : cn(colorClass.split(' ')[0], "border-white dark:border-gray-700")
      )}>
        <AvatarFallback className={cn(
          "text-xs font-medium",
          message.isUser ? "text-indigo-700" : colorClass.split(' ')[1]
        )}>{avatar}</AvatarFallback>
      </Avatar>
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-3.5 shadow-sm",
        message.isUser 
          ? "bg-indigo-500 text-white rounded-br-sm" 
          : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-bl-sm"
      )}>
        {!message.isUser && (
          <div className="flex items-center gap-2 mb-2">
            <span className={cn("font-semibold text-sm", colorClass.split(' ')[1])}>{message.sender}</span>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 font-normal text-muted-foreground">{message.senderRole}</Badge>
          </div>
        )}
        <p className={cn(
          "text-sm leading-relaxed whitespace-pre-wrap",
          message.isUser ? "text-white" : "text-gray-700 dark:text-gray-200"
        )}>{message.message}</p>
      </div>
    </div>
  );
}

function TypingIndicator({ personaName }: { personaName?: string }) {
  const colorClass = personaName ? PERSONA_COLORS[personaName] || PERSONA_COLORS.default : PERSONA_COLORS.default;
  const avatar = personaName ? PERSONA_AVATARS[personaName] || personaName.substring(0, 2).toUpperCase() : '...';
  
  return (
    <div className="flex gap-3.5 mb-5">
      <Avatar className={cn(
        "h-10 w-10 flex-shrink-0 border-2 shadow-sm",
        colorClass.split(' ')[0], "border-white dark:border-gray-700"
      )}>
        <AvatarFallback className={cn("text-xs font-medium", colorClass.split(' ')[1])}>
          {avatar}
        </AvatarFallback>
      </Avatar>
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-sm px-4 py-3.5 shadow-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

function PreMeetingBriefingScreen({ 
  briefing, 
  onJoin,
  isJoining 
}: { 
  briefing: PreMeetingBriefing; 
  onJoin: () => void;
  isJoining: boolean;
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Card className="max-w-lg w-full shadow-lg border-0">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
            <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <CardTitle className="text-2xl font-bold">{briefing.title}</CardTitle>
          <CardDescription className="text-base">{briefing.subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Meeting Agenda
            </h4>
            <ul className="space-y-2">
              {briefing.agenda.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-medium">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Attendees
            </h4>
            <div className="flex flex-wrap gap-3">
              {briefing.attendees.map((attendee) => (
                <div key={attendee.name} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                  <Avatar className={cn("h-8 w-8 border", PERSONA_COLORS[attendee.name]?.split(' ')[0] || 'bg-gray-100')}>
                    <AvatarFallback className={cn("text-xs font-medium", PERSONA_COLORS[attendee.name]?.split(' ')[1] || 'text-gray-700')}>
                      {PERSONA_AVATARS[attendee.name] || attendee.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">{attendee.name}</div>
                    <div className="text-xs text-muted-foreground">{attendee.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {briefing.contextNote && (
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-200">{briefing.contextNote}</p>
              </div>
            </div>
          )}
          
          <Button 
            className="w-full py-6 text-lg" 
            onClick={onJoin}
            disabled={isJoining}
            data-testid="button-join-planning"
          >
            {isJoining ? (
              <>
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Joining...
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                {briefing.joinButtonText}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function BacklogPanel({ 
  items, 
  selectedItems, 
  capacity, 
  onToggleItem,
  disabled,
  selectionCue,
  nextStepHint
}: { 
  items: BacklogItem[]; 
  selectedItems: string[]; 
  capacity: number;
  onToggleItem: (id: string) => void;
  disabled?: boolean;
  selectionCue?: string;
  nextStepHint?: string;
}) {
  const selectedPoints = items
    .filter(item => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.points, 0);
  
  const capacityUsed = (selectedPoints / capacity) * 100;
  const isOverCapacity = selectedPoints > capacity;
  
  return (
    <Card className="h-full flex flex-col border-0 shadow-sm bg-gray-50/50 dark:bg-gray-900/50">
      <CardHeader className="pb-3 sticky top-0 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm z-10 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            <div>
              <CardTitle className="text-sm font-semibold">Sprint Backlog</CardTitle>
              <CardDescription className="text-xs">Select items for this sprint</CardDescription>
            </div>
            {selectionCue && selectedItems.length > 0 && (
              <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {selectionCue}
              </Badge>
            )}
          </div>
          <div className="text-right">
            <div className={cn(
              "text-xl font-bold tabular-nums",
              isOverCapacity ? "text-red-600" : selectedPoints > 0 ? "text-green-600" : "text-muted-foreground"
            )}>
              {selectedPoints}/{capacity}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">points</div>
          </div>
        </div>
        <Progress 
          value={Math.min(capacityUsed, 100)} 
          className={cn("h-1.5 mt-3", isOverCapacity && "bg-red-100")}
        />
        {isOverCapacity && (
          <div className="flex items-center gap-1.5 mt-2 text-red-600 text-xs font-medium">
            <AlertCircle className="h-3 w-3" />
            Over capacity - remove some items
          </div>
        )}
        {nextStepHint && selectedItems.length > 0 && !disabled && (
          <div className="mt-3 p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 animate-pulse">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
              <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{nextStepHint}</span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="p-3 space-y-2.5">
            {items.map(item => {
              const Icon = getTypeIcon(item.type);
              const isSelected = selectedItems.includes(item.id);
              
              const handleItemClick = () => {
                if (disabled) return;
                onToggleItem(item.id);
              };
              
              return (
                <div 
                  key={item.id}
                  className={cn(
                    "p-3.5 rounded-lg border transition-all bg-white dark:bg-gray-800",
                    disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:shadow-md hover:scale-[1.01]",
                    isSelected 
                      ? "border-indigo-400 bg-indigo-50/80 dark:bg-indigo-900/30 shadow-sm ring-1 ring-indigo-200 dark:ring-indigo-800" 
                      : "border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500"
                  )}
                  onClick={handleItemClick}
                  data-testid={`backlog-item-${item.id}`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      checked={isSelected}
                      onCheckedChange={handleItemClick}
                      className="mt-0.5"
                      disabled={disabled}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-[10px] font-mono text-muted-foreground bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{item.id}</span>
                        <Badge className={cn("text-[10px] py-0 px-1.5", getTypeColor(item.type))} variant="secondary">
                          <Icon className="h-2.5 w-2.5 mr-0.5" />
                          {item.type}
                        </Badge>
                        <Badge className={cn("text-[10px] py-0 px-1.5", getPriorityBadge(item.priority))}>
                          {item.priority}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white leading-snug">{item.title}</h4>
                      <div className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">{item.points} points</div>
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
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      const hasSeenBefore = localStorage.getItem('planning-learning-objectives-seen');
      if (!hasSeenBefore) {
        localStorage.setItem('planning-learning-objectives-seen', 'true');
        return true;
      }
      const stored = localStorage.getItem('planning-learning-objectives-expanded');
      return stored === 'true';
    }
    return false;
  });
  
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
  
  const toggleExpanded = () => {
    const newValue = !isExpanded;
    setIsExpanded(newValue);
    localStorage.setItem('planning-learning-objectives-expanded', String(newValue));
  };
  
  return (
    <div 
      className={cn(
        "rounded-lg border transition-all cursor-pointer",
        isExpanded 
          ? "bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200" 
          : "bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 hover:border-amber-200"
      )}
      onClick={toggleExpanded}
    >
      <div className={cn("flex items-center justify-between gap-3 px-4", isExpanded ? "py-3" : "py-2.5")}>
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <span className="font-medium text-amber-900 dark:text-amber-100 text-sm">Learning Objectives</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-100"
          onClick={(e) => { e.stopPropagation(); toggleExpanded(); }}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      {isExpanded && (
        <div className="px-4 pb-3 pt-0">
          <ul className="space-y-1.5 ml-6">
            {objectives[phase]?.map((obj, i) => (
              <li key={i} className="text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
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
  const [visibleMessageCount, setVisibleMessageCount] = useState(0);
  const [isStaggering, setIsStaggering] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<'chat' | 'backlog'>('chat');
  const [showPhaseTransitionHint, setShowPhaseTransitionHint] = useState(false);
  const [pendingPhaseTransitionHint, setPendingPhaseTransitionHint] = useState(false);
  const [showBriefing, setShowBriefing] = useState(true);
  const [isJoiningMeeting, setIsJoiningMeeting] = useState(false);
  const staggerTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialLoadRef = useRef(true);
  const previousMessageCountRef = useRef(0);
  
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
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send message');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}/planning`] });
      setInputMessage('');
      
      // Check adapter config for auto-advance behavior
      if (data.isPhaseTransitionCue) {
        const shouldAutoAdvance = sessionState?.adapterConfig?.engagement?.autoAdvancePhases;
        
        if (shouldAutoAdvance) {
          // Auto-advance after a short delay to let the user see the closing message
          setTimeout(() => {
            advancePhase.mutate();
          }, 2000);
        } else {
          // Queue phase transition hint for manual advance
          setPendingPhaseTransitionHint(true);
        }
      }
    },
    onError: async (error) => {
      console.error('Send message failed:', error);
      // If session not found, try to recreate it
      if (error.message?.includes('No active planning session')) {
        await initSession.mutateAsync();
      }
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
      setShowPhaseTransitionHint(false); // Reset hint when advancing
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
  
  // Determine if we should skip the briefing (session already has messages = returning user)
  useEffect(() => {
    if (sessionState?.messages && sessionState.messages.length > 0) {
      // Skip briefing if session already has any messages (user has already joined before)
      setShowBriefing(false);
    }
  }, [sessionState?.messages]);
  
  // Handler for joining the meeting from briefing screen
  const handleJoinMeeting = () => {
    setIsJoiningMeeting(true);
    // Small delay for visual feedback before showing chat
    setTimeout(() => {
      setShowBriefing(false);
      setIsJoiningMeeting(false);
    }, 500);
  };
  
  // Message staggering effect - reveals messages one at a time with typing simulation
  // Staggers on fresh sessions (no user messages yet) or when new messages arrive
  useEffect(() => {
    if (!sessionState?.messages) {
      return;
    }
    
    const messages = sessionState.messages;
    const staggerConfig = sessionState?.adapterConfig?.engagement?.messageStagger;
    const staggerEnabled = staggerConfig?.enabled;
    
    // Check if this is a fresh session (no user messages yet = autoStart sequence)
    const hasUserMessages = messages.some(m => m.isUser);
    const isFreshSession = initialLoadRef.current && !hasUserMessages && messages.length > 0;
    
    // On initial load with existing user conversation, show all immediately
    if (initialLoadRef.current && hasUserMessages) {
      initialLoadRef.current = false;
      previousMessageCountRef.current = messages.length;
      setVisibleMessageCount(messages.length);
      return;
    }
    
    // For fresh sessions with autoStart, stagger the initial messages
    if (isFreshSession && staggerEnabled) {
      initialLoadRef.current = false;
      previousMessageCountRef.current = messages.length;
      
      // Clear any existing timeouts
      staggerTimeoutsRef.current.forEach(clearTimeout);
      staggerTimeoutsRef.current = [];
      
      setIsStaggering(true);
      let cumulativeDelay = 0;
      
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        const charDelay = Math.min(
          msg.message.length * staggerConfig.perCharacterDelayMs,
          staggerConfig.maxDelayMs
        );
        const delay = staggerConfig.baseDelayMs + charDelay;
        cumulativeDelay += delay;
        
        const timeout = setTimeout(() => {
          setVisibleMessageCount(i + 1);
          if (i === messages.length - 1) {
            setIsStaggering(false);
          }
        }, cumulativeDelay);
        
        staggerTimeoutsRef.current.push(timeout);
      }
      return;
    }
    
    // Mark initial load complete if we haven't already
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      previousMessageCountRef.current = messages.length;
      setVisibleMessageCount(messages.length);
      return;
    }
    
    // Check if new messages were added (after initial load)
    const newMessageCount = messages.length - previousMessageCountRef.current;
    previousMessageCountRef.current = messages.length;
    
    // If no new messages, nothing to do
    if (newMessageCount <= 0) {
      setVisibleMessageCount(messages.length);
      return;
    }
    
    // Get the new messages
    const startIndex = messages.length - newMessageCount;
    const newMessages = messages.slice(startIndex);
    
    // If any of the new messages are user messages, show them immediately
    // (User messages should never be staggered)
    const hasUserMessage = newMessages.some(m => m.isUser);
    if (hasUserMessage || !staggerEnabled) {
      setVisibleMessageCount(messages.length);
      return;
    }
    
    // Clear any existing timeouts
    staggerTimeoutsRef.current.forEach(clearTimeout);
    staggerTimeoutsRef.current = [];
    
    // Stagger only AI/team messages
    if (startIndex < messages.length) {
      setIsStaggering(true);
      
      let cumulativeDelay = 0;
      
      for (let i = startIndex; i < messages.length; i++) {
        const msg = messages[i];
        const charDelay = Math.min(
          msg.message.length * staggerConfig.perCharacterDelayMs,
          staggerConfig.maxDelayMs
        );
        const delay = staggerConfig.baseDelayMs + charDelay;
        cumulativeDelay += delay;
        
        const timeout = setTimeout(() => {
          setVisibleMessageCount(i + 1);
          if (i === messages.length - 1) {
            setIsStaggering(false);
          }
        }, cumulativeDelay);
        
        staggerTimeoutsRef.current.push(timeout);
      }
    }
    
    return () => {
      staggerTimeoutsRef.current.forEach(clearTimeout);
      staggerTimeoutsRef.current = [];
    };
  }, [sessionState?.messages?.length, sessionState?.adapterConfig?.engagement?.messageStagger?.enabled]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessageCount]);
  
  // Show pending phase transition hint after ALL messages are visible (staggering complete)
  useEffect(() => {
    if (!sessionState?.messages) return;
    
    const allMessagesVisible = visibleMessageCount >= sessionState.messages.length;
    
    if (allMessagesVisible && pendingPhaseTransitionHint && !isStaggering) {
      // Small delay to ensure the last message is rendered
      const timer = setTimeout(() => {
        setShowPhaseTransitionHint(true);
        setPendingPhaseTransitionHint(false);
        // Auto-hide after 10 seconds
        setTimeout(() => setShowPhaseTransitionHint(false), 10000);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visibleMessageCount, sessionState?.messages?.length, pendingPhaseTransitionHint, isStaggering]);
  
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
    
    // Don't allow advancing while messages are still being staggered/displayed
    const allMessagesDisplayed = visibleMessageCount >= messages.length && !isStaggering;
    
    switch (session.currentPhase) {
      case 'context':
        return sessionState.messages.length >= 2 && allMessagesDisplayed;
      case 'discussion':
        return (session.selectedItems || []).length > 0 && allMessagesDisplayed;
      case 'commitment':
        return !!session.goalStatement && allMessagesDisplayed;
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
  const preMeetingBriefing = engagement.preMeetingBriefing;
  
  // Show pre-meeting briefing screen if enabled and briefing hasn't been dismissed
  if (showBriefing && preMeetingBriefing?.enabled) {
    return (
      <div className="h-full flex flex-col" data-testid="planning-module-briefing">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sprint Planning</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{companyName} • {role}</p>
            </div>
            {onBack && (
              <Button variant="outline" size="sm" onClick={onBack} data-testid="button-back-to-dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
        </div>
        <PreMeetingBriefingScreen 
          briefing={preMeetingBriefing}
          onJoin={handleJoinMeeting}
          isJoining={isJoiningMeeting}
        />
      </div>
    );
  }
  
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
      
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden border-b bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex">
          <button
            onClick={() => setMobilePanel('chat')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2",
              mobilePanel === 'chat' 
                ? "border-indigo-500 text-indigo-600 bg-white dark:bg-gray-800" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Users className="h-4 w-4" />
            Discussion
          </button>
          <button
            onClick={() => setMobilePanel('backlog')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2",
              mobilePanel === 'backlog' 
                ? "border-indigo-500 text-indigo-600 bg-white dark:bg-gray-800" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <ClipboardList className="h-4 w-4" />
            Backlog
            {selectedItems.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{selectedItems.length}</Badge>
            )}
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel - Hidden on mobile when backlog selected */}
        <div className={cn(
          "flex-1 flex flex-col lg:border-r",
          mobilePanel !== 'chat' && "hidden lg:flex"
        )}>
          {adapterConfig.showLearningObjectives && (
            <div className="p-4 pb-2">
              <LearningObjectives 
                phase={session.currentPhase} 
                role={adapterConfig.role} 
                level={adapterConfig.level} 
              />
            </div>
          )}
          
          <div className="flex-1 overflow-hidden p-4 pt-2">
            <Card className="h-full flex flex-col shadow-sm">
              <CardHeader className="pb-2 border-b bg-white dark:bg-gray-900">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    Team Discussion
                  </div>
                  {engagement.mode === 'shadow' && (
                    <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                      Observing
                    </Badge>
                  )}
                  {engagement.mode === 'guided' && (
                    <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      Guided
                    </Badge>
                  )}
                  {engagement.mode === 'active' && (
                    <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      Active
                    </Badge>
                  )}
                  {engagement.mode === 'facilitator' && (
                    <Badge variant="secondary" className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                      Facilitating
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs">
                  {session.currentPhase === 'context' && currentPhaseEngagement === 'observe' && "Watch how Priya presents priorities - you'll be asked for questions later"}
                  {session.currentPhase === 'context' && currentPhaseEngagement !== 'observe' && "Priya is presenting sprint priorities"}
                  {session.currentPhase === 'discussion' && currentPhaseEngagement === 'observe' && "Observe how the team discusses and estimates together"}
                  {session.currentPhase === 'discussion' && currentPhaseEngagement !== 'observe' && "Discuss items and estimate as a team"}
                  {session.currentPhase === 'commitment' && "Finalize the sprint commitment"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0 min-h-[400px] lg:min-h-[450px] bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900/50 dark:to-gray-800">
                <ScrollArea className="h-full p-5">
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
                  {messages.slice(0, visibleMessageCount).map((msg, index) => {
                    const prevMsg = index > 0 ? messages[index - 1] : null;
                    const showSeparator = prevMsg && prevMsg.isUser !== msg.isUser;
                    
                    return (
                      <div key={msg.id}>
                        {showSeparator && (
                          <div className="flex items-center gap-3 my-4">
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
                          </div>
                        )}
                        <ChatMessage message={msg} />
                      </div>
                    );
                  })}
                  {isStaggering && visibleMessageCount < messages.length && (
                    <TypingIndicator personaName={messages[visibleMessageCount]?.sender} />
                  )}
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
                  {adapterConfig.commitmentGuidance?.mode !== 'autoSet' && (
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
                  )}
                  {session.goalStatement && (
                    <div className={cn(
                      "p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200",
                      adapterConfig.commitmentGuidance?.mode !== 'autoSet' && "mt-3"
                    )}>
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
            {/* Phase transition hint */}
            {showPhaseTransitionHint && session.currentPhase === 'context' && (
              <div className="mb-3 flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2 rounded-lg border border-indigo-100 dark:border-indigo-800 animate-fade-in">
                <Lightbulb className="h-4 w-4 flex-shrink-0" />
                <span>Ready to discuss the backlog items</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {session.currentPhase === 'context' && messages.length < 2 && !showPhaseTransitionHint && "Have a brief discussion first"}
                {session.currentPhase === 'discussion' && selectedItems.length === 0 && "Select at least one backlog item"}
                {session.currentPhase === 'commitment' && !session.goalStatement && adapterConfig.commitmentGuidance?.mode !== 'autoSet' && "Set a sprint goal to continue"}
                {session.currentPhase === 'commitment' && session.goalStatement && "Review the sprint goal and start the sprint"}
              </div>
              <Button 
                onClick={() => advancePhase.mutate()}
                disabled={!canAdvance() || advancePhase.isPending}
                className={cn(
                  session.currentPhase === 'commitment' ? "bg-green-600 hover:bg-green-700" : "",
                  showPhaseTransitionHint && session.currentPhase === 'context' && "animate-pulse ring-2 ring-indigo-400 ring-offset-2"
                )}
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
        
        {/* Backlog Panel - Hidden on mobile when chat selected */}
        <div className={cn(
          "w-full lg:w-80 p-4",
          mobilePanel !== 'backlog' && "hidden lg:block"
        )}>
          <BacklogPanel
            items={backlogItems}
            selectedItems={selectedItems}
            capacity={capacity}
            onToggleItem={handleToggleItem}
            disabled={session.currentPhase === 'context'}
            selectionCue={sessionState?.adapterConfig?.engagement?.selectionGuidance?.mode === 'autoAssign' 
              ? sessionState?.adapterConfig?.engagement?.selectionGuidance?.visualCueCopy 
              : undefined}
            nextStepHint={session.currentPhase === 'discussion' && sessionState?.adapterConfig?.engagement?.selectionGuidance?.nextStepHint
              ? sessionState?.adapterConfig?.engagement?.selectionGuidance?.nextStepHint
              : undefined}
          />
        </div>
      </div>
    </div>
  );
}
