import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Users,
  Clock,
  CheckCircle2,
  Send,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  MessageSquare,
  Coffee,
  Target,
  RotateCcw,
  Loader2,
  ChevronRight,
} from "lucide-react";
import type { CeremonyInstance, SprintTicket, Sprint } from "@shared/schema";

type CeremonyType = 'standup' | 'review' | 'retrospective';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

interface CeremonyMessage {
  id: string;
  speaker: TeamMember | 'user';
  content: string;
  timestamp: Date;
  type: 'message' | 'question' | 'action' | 'feedback';
}

interface CeremonySessionProps {
  ceremony: CeremonyInstance;
  sprint: Sprint;
  tickets: SprintTicket[];
  teamMembers: TeamMember[];
  onComplete: (outcome: any) => void;
  mode: 'journey' | 'practice';
}

const CEREMONY_CONFIG: Record<CeremonyType, {
  title: string;
  icon: any;
  description: string;
  prompts: string[];
  color: string;
}> = {
  standup: {
    title: 'Daily Standup',
    icon: Coffee,
    description: 'Share your progress, plans, and blockers with the team',
    prompts: [
      "What did you work on yesterday?",
      "What are you planning to work on today?",
      "Do you have any blockers or need help with anything?",
    ],
    color: 'blue',
  },
  review: {
    title: 'Sprint Review',
    icon: Target,
    description: 'Demo completed work and gather feedback from stakeholders',
    prompts: [
      "Walk us through what you accomplished this sprint.",
      "Can you demo the main feature you worked on?",
      "What feedback do you have on the sprint goal?",
    ],
    color: 'green',
  },
  retrospective: {
    title: 'Sprint Retrospective',
    icon: RotateCcw,
    description: 'Reflect on the sprint and identify improvements',
    prompts: [
      "What went well this sprint?",
      "What could we improve?",
      "What actions should we take going forward?",
    ],
    color: 'purple',
  },
};

export default function CeremonySession({
  ceremony,
  sprint,
  tickets,
  teamMembers,
  onComplete,
  mode
}: CeremonySessionProps) {
  const [messages, setMessages] = useState<CeremonyMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userResponses, setUserResponses] = useState<string[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  const ceremonyType = ceremony.ceremonyType as CeremonyType;
  const config = CEREMONY_CONFIG[ceremonyType];

  const completeCeremonyMutation = useMutation({
    mutationFn: async (outcome: any) => {
      const response = await apiRequest('PATCH', `/api/ceremonies/${ceremony.id}`, {
        status: 'completed',
        outcome,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ceremonies', ceremony.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/sprints', sprint.id, 'ceremonies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sprints', sprint.id] });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      startCeremony();
    }
  }, []);

  const startCeremony = () => {
    const facilitator = teamMembers.find(m => m.role.toLowerCase().includes('lead') || m.role.toLowerCase().includes('manager')) || teamMembers[0];
    
    const welcomeMessage: CeremonyMessage = {
      id: `msg-${Date.now()}`,
      speaker: facilitator,
      content: getWelcomeMessage(ceremonyType, facilitator.name),
      timestamp: new Date(),
      type: 'message',
    };

    setMessages([welcomeMessage]);

    setTimeout(() => {
      const firstPrompt: CeremonyMessage = {
        id: `msg-${Date.now()}-1`,
        speaker: facilitator,
        content: config.prompts[0],
        timestamp: new Date(),
        type: 'question',
      };
      setMessages(prev => [...prev, firstPrompt]);
    }, 1000);
  };

  const getWelcomeMessage = (type: CeremonyType, facilitatorName: string): string => {
    switch (type) {
      case 'standup':
        return `Good morning team! I'm ${facilitatorName}, and I'll be facilitating today's standup. Let's keep it focused - remember, it's about what you're working on, not a detailed status report. We'll go around the room.`;
      case 'review':
        return `Welcome everyone to our Sprint Review! I'm ${facilitatorName}. Today we'll be showcasing the work completed this sprint and gathering feedback. Let's start with our intern developer.`;
      case 'retrospective':
        return `Hi team, ${facilitatorName} here. Time for our retrospective! This is a safe space to discuss what went well, what didn't, and how we can improve. Let's be constructive and focus on the process, not individuals.`;
      default:
        return `Let's get started with today's ${type}.`;
    }
  };

  const handleSendMessage = async () => {
    if (!currentInput.trim() || isProcessing) return;

    const userMessage: CeremonyMessage = {
      id: `msg-${Date.now()}`,
      speaker: 'user',
      content: currentInput,
      timestamp: new Date(),
      type: 'message',
    };

    setMessages(prev => [...prev, userMessage]);
    setUserResponses(prev => [...prev, currentInput]);
    setCurrentInput("");
    setIsProcessing(true);

    setTimeout(() => {
      processResponse(currentInput);
    }, 1000);
  };

  const processResponse = (userResponse: string) => {
    const newPromptIndex = currentPromptIndex + 1;
    
    const respondingMember = teamMembers[newPromptIndex % teamMembers.length] || teamMembers[0];
    
    const acknowledgment: CeremonyMessage = {
      id: `msg-${Date.now()}-ack`,
      speaker: respondingMember,
      content: getAcknowledgment(ceremonyType, userResponse, respondingMember.name),
      timestamp: new Date(),
      type: 'feedback',
    };
    
    setMessages(prev => [...prev, acknowledgment]);

    if (newPromptIndex < config.prompts.length) {
      setTimeout(() => {
        const nextPrompt: CeremonyMessage = {
          id: `msg-${Date.now()}-q`,
          speaker: teamMembers[0],
          content: config.prompts[newPromptIndex],
          timestamp: new Date(),
          type: 'question',
        };
        setMessages(prev => [...prev, nextPrompt]);
        setCurrentPromptIndex(newPromptIndex);
        setIsProcessing(false);
      }, 1500);
    } else {
      setCurrentPromptIndex(newPromptIndex);
      setTimeout(() => {
        const closingMessage: CeremonyMessage = {
          id: `msg-${Date.now()}-close`,
          speaker: teamMembers[0],
          content: getClosingMessage(ceremonyType, teamMembers[0].name),
          timestamp: new Date(),
          type: 'message',
        };
        setMessages(prev => [...prev, closingMessage]);
        setIsProcessing(false);
      }, 1500);
    }
  };

  const getAcknowledgment = (type: CeremonyType, response: string, memberName: string): string => {
    const acknowledgments = {
      standup: [
        "Thanks for the update! Sounds like you're making good progress.",
        "Got it. Let us know if you need any help with that.",
        "Nice work! Keep the momentum going.",
      ],
      review: [
        "Great demo! I like how you approached that problem.",
        "Solid work. The stakeholders will appreciate this.",
        "Interesting solution. Can you tell us more about the technical decisions?",
      ],
      retrospective: [
        "That's a great observation. I've noticed that too.",
        "Thanks for bringing that up. It's important we address this.",
        "I agree. Let's add that to our action items.",
      ],
    };

    const options = acknowledgments[type];
    return options[Math.floor(Math.random() * options.length)];
  };

  const getClosingMessage = (type: CeremonyType, facilitatorName: string): string => {
    switch (type) {
      case 'standup':
        return `Great standup everyone! Remember, if anyone gets blocked, don't wait until tomorrow - reach out on Slack. Have a productive day!`;
      case 'review':
        return `Excellent work this sprint, team! The stakeholders were impressed with the progress. Let's take these feedback items into our next planning session.`;
      case 'retrospective':
        return `Thanks for the thoughtful discussion, team. I've captured our action items and we'll follow up on them next sprint. Great retrospective!`;
      default:
        return `Thanks everyone, great session!`;
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    const outcome = {
      responses: userResponses,
      messageCount: messages.length,
      completedAt: new Date().toISOString(),
    };
    
    try {
      await completeCeremonyMutation.mutateAsync(outcome);
      onComplete(outcome);
    } catch (error) {
      console.error('Failed to complete ceremony:', error);
      setIsCompleting(false);
    }
  };

  const isComplete = currentPromptIndex >= config.prompts.length && !isProcessing;
  const progress = ((currentPromptIndex + (isComplete ? 1 : 0)) / config.prompts.length) * 100;

  const Icon = config.icon;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-${config.color}-100`}>
                <Icon className={`h-5 w-5 text-${config.color}-600`} />
              </div>
              <div>
                <CardTitle className="text-xl">{config.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{config.description}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              {mode === 'journey' ? 'Journey Mode' : 'Practice Mode'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>

          <div className="flex gap-2 mb-4 flex-wrap">
            <span className="text-sm text-muted-foreground">Team:</span>
            {teamMembers.map((member) => (
              <Badge key={member.id} variant="secondary" className="text-xs">
                {member.name} ({member.role})
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px] p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              
              {isProcessing && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Team is responding...</span>
                </div>
              )}
            </div>
          </ScrollArea>

          <Separator />

          <div className="p-4">
            {!isComplete ? (
              <div className="flex gap-2">
                <Textarea
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder="Type your response..."
                  className="min-h-[80px] resize-none"
                  disabled={isProcessing}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  data-testid="input-ceremony-response"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!currentInput.trim() || isProcessing}
                  className="self-end"
                  data-testid="button-send-response"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">
                    {config.title} Complete!
                  </span>
                </div>
                <Button 
                  onClick={handleComplete} 
                  disabled={isCompleting}
                  data-testid="button-complete-ceremony"
                  aria-label="Complete ceremony and continue"
                >
                  {isCompleting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Continue
                  {!isCompleting && <ChevronRight className="h-4 w-4 ml-2" />}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {ceremonyType === 'standup' && (
        <StandupSidebar tickets={tickets} />
      )}

      {ceremonyType === 'review' && (
        <ReviewSidebar tickets={tickets} sprint={sprint} />
      )}

      {ceremonyType === 'retrospective' && (
        <RetroSidebar responses={userResponses} />
      )}
    </div>
  );
}

interface MessageBubbleProps {
  message: CeremonyMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.speaker === 'user';
  const speaker = isUser ? null : message.speaker as TeamMember;

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && speaker && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={speaker.avatar} />
          <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
            {speaker.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        {!isUser && speaker && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">{speaker.name}</span>
            <span className="text-xs text-muted-foreground">{speaker.role}</span>
          </div>
        )}
        <div
          className={`inline-block p-3 rounded-lg ${
            isUser
              ? 'bg-blue-600 text-white'
              : message.type === 'question'
              ? 'bg-yellow-50 border border-yellow-200'
              : 'bg-gray-100'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

interface StandupSidebarProps {
  tickets: SprintTicket[];
}

function StandupSidebar({ tickets }: StandupSidebarProps) {
  const inProgress = tickets.filter(t => t.status === 'in_progress');
  const blocked = tickets.filter(t => t.priority === 'critical');

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Your Current Work</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            In Progress ({inProgress.length})
          </h4>
          <div className="space-y-2">
            {inProgress.map(ticket => (
              <div key={ticket.id} className="text-sm p-2 bg-muted rounded">
                <span className="font-mono text-muted-foreground">{ticket.ticketKey}</span>
                <span className="ml-2">{ticket.title}</span>
              </div>
            ))}
            {inProgress.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No tickets in progress</p>
            )}
          </div>
        </div>

        {blocked.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              Critical Items
            </h4>
            <div className="space-y-2">
              {blocked.map(ticket => (
                <div key={ticket.id} className="text-sm p-2 bg-red-50 rounded border border-red-200">
                  <span className="font-mono text-red-600">{ticket.ticketKey}</span>
                  <span className="ml-2">{ticket.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ReviewSidebarProps {
  tickets: SprintTicket[];
  sprint: Sprint;
}

function ReviewSidebar({ tickets, sprint }: ReviewSidebarProps) {
  const completed = tickets.filter(t => t.status === 'done');
  const totalPoints = completed.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Sprint Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 rounded">
            <div className="text-2xl font-bold text-green-600">{completed.length}</div>
            <div className="text-xs text-green-700">Tickets Completed</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded">
            <div className="text-2xl font-bold text-blue-600">{totalPoints}</div>
            <div className="text-xs text-blue-700">Story Points</div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Completed Work</h4>
          <div className="space-y-1">
            {completed.map(ticket => (
              <div key={ticket.id} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span className="font-mono text-xs text-muted-foreground">{ticket.ticketKey}</span>
                <span className="truncate">{ticket.title}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface RetroSidebarProps {
  responses: string[];
}

function RetroSidebar({ responses }: RetroSidebarProps) {
  const categories = [
    { icon: ThumbsUp, label: 'What went well', color: 'green' },
    { icon: ThumbsDown, label: 'What to improve', color: 'orange' },
    { icon: Lightbulb, label: 'Action items', color: 'blue' },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Retrospective Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map((category, index) => {
          const Icon = category.icon;
          const response = responses[index];
          return (
            <div key={category.label}>
              <h4 className={`text-sm font-medium mb-2 flex items-center gap-2 text-${category.color}-600`}>
                <Icon className="h-4 w-4" />
                {category.label}
              </h4>
              {response ? (
                <p className="text-sm p-2 bg-muted rounded">{response}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Pending...</p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
