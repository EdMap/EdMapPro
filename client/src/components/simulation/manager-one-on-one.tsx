import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Clock,
  CheckCircle2,
  Send,
  Target,
  TrendingUp,
  Lightbulb,
  MessageSquare,
  Award,
  Brain,
  ChevronRight,
  Loader2,
  Star,
} from "lucide-react";
import type { UserJourney, Sprint } from "@shared/schema";

interface Manager {
  name: string;
  title: string;
  avatar?: string;
}

interface Message {
  id: string;
  speaker: 'manager' | 'user';
  content: string;
  timestamp: Date;
  type: 'message' | 'question' | 'feedback' | 'action';
}

interface ManagerOneOnOneProps {
  journey: UserJourney;
  sprint: Sprint;
  manager: Manager;
  readinessScore: number;
  competencyScores: Record<string, { score: number; band: string }>;
  onComplete: (outcome: any) => void;
  mode: 'journey' | 'practice';
}

const ONE_ON_ONE_TOPICS = [
  {
    id: 'progress',
    title: 'Sprint Progress',
    question: "Let's start with your work this sprint. What are you most proud of accomplishing?",
    followUp: "That's great to hear. Were there any challenges you faced along the way?",
  },
  {
    id: 'learning',
    title: 'Learning & Growth',
    question: "What new skills have you picked up this sprint? Any areas where you felt you grew?",
    followUp: "Those are valuable insights. How do you plan to build on these learnings?",
  },
  {
    id: 'blockers',
    title: 'Challenges & Support',
    question: "Are there any blockers or challenges I can help you with? Anything preventing you from doing your best work?",
    followUp: "I appreciate you sharing that. Let me think about how we can address this together.",
  },
  {
    id: 'goals',
    title: 'Goals & Next Steps',
    question: "Looking ahead, what would you like to focus on in the next sprint? Any goals you're setting for yourself?",
    followUp: "Those sound like solid goals. Let's make sure we track your progress on these.",
  },
];

export default function ManagerOneOnOne({
  journey,
  sprint,
  manager,
  readinessScore,
  competencyScores,
  onComplete,
  mode
}: ManagerOneOnOneProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userResponses, setUserResponses] = useState<Record<string, string>>({});
  const [showFollowUp, setShowFollowUp] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      startSession();
    }
  }, []);

  const startSession = () => {
    const welcomeMessage: Message = {
      id: `msg-${Date.now()}`,
      speaker: 'manager',
      content: `Hi there! Thanks for making time for our 1:1. I've been reviewing your progress this sprint, and I'm impressed with how you've been growing. Your readiness score has improved to ${readinessScore}%. Let's talk about how things are going.`,
      timestamp: new Date(),
      type: 'message',
    };

    setMessages([welcomeMessage]);

    setTimeout(() => {
      const firstQuestion: Message = {
        id: `msg-${Date.now()}-q`,
        speaker: 'manager',
        content: ONE_ON_ONE_TOPICS[0].question,
        timestamp: new Date(),
        type: 'question',
      };
      setMessages(prev => [...prev, firstQuestion]);
    }, 1500);
  };

  const handleSendMessage = async () => {
    if (!currentInput.trim() || isProcessing) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      speaker: 'user',
      content: currentInput,
      timestamp: new Date(),
      type: 'message',
    };

    setMessages(prev => [...prev, userMessage]);
    
    const currentTopic = ONE_ON_ONE_TOPICS[currentTopicIndex];
    setUserResponses(prev => ({
      ...prev,
      [currentTopic.id]: currentInput,
    }));
    
    setCurrentInput("");
    setIsProcessing(true);

    setTimeout(() => {
      processResponse(currentInput);
    }, 1000);
  };

  const processResponse = (userResponse: string) => {
    const currentTopic = ONE_ON_ONE_TOPICS[currentTopicIndex];

    if (!showFollowUp) {
      const followUpMessage: Message = {
        id: `msg-${Date.now()}-fu`,
        speaker: 'manager',
        content: currentTopic.followUp,
        timestamp: new Date(),
        type: 'feedback',
      };
      setMessages(prev => [...prev, followUpMessage]);
      setShowFollowUp(true);
      setIsProcessing(false);
      return;
    }

    const nextTopicIndex = currentTopicIndex + 1;
    setShowFollowUp(false);

    if (nextTopicIndex < ONE_ON_ONE_TOPICS.length) {
      setTimeout(() => {
        const transitionMessage: Message = {
          id: `msg-${Date.now()}-tr`,
          speaker: 'manager',
          content: getTransitionMessage(nextTopicIndex),
          timestamp: new Date(),
          type: 'message',
        };
        setMessages(prev => [...prev, transitionMessage]);

        setTimeout(() => {
          const nextQuestion: Message = {
            id: `msg-${Date.now()}-q`,
            speaker: 'manager',
            content: ONE_ON_ONE_TOPICS[nextTopicIndex].question,
            timestamp: new Date(),
            type: 'question',
          };
          setMessages(prev => [...prev, nextQuestion]);
          setCurrentTopicIndex(nextTopicIndex);
          setIsProcessing(false);
        }, 1000);
      }, 500);
    } else {
      setTimeout(() => {
        const closingMessage: Message = {
          id: `msg-${Date.now()}-close`,
          speaker: 'manager',
          content: getClosingMessage(),
          timestamp: new Date(),
          type: 'message',
        };
        setMessages(prev => [...prev, closingMessage]);
        setCurrentTopicIndex(nextTopicIndex);
        setIsProcessing(false);
      }, 500);
    }
  };

  const getTransitionMessage = (topicIndex: number): string => {
    const transitions = [
      "That's really helpful context. Now let's talk about something else...",
      "Great, I'm glad we discussed that. Moving on...",
      "Understood. I have another topic I'd like to cover...",
      "Thanks for sharing. One more thing I wanted to discuss...",
    ];
    return transitions[topicIndex - 1] || transitions[0];
  };

  const getClosingMessage = (): string => {
    const readinessMessage = readinessScore >= 85 
      ? "Based on your performance, I think you're very close to being ready for promotion to Junior Developer!"
      : readinessScore >= 70
      ? "You're making great progress. Keep up the momentum and you'll be ready for the next level soon."
      : "I can see you're developing well. Let's keep working on these areas and revisit in our next 1:1.";

    return `Thank you for this great conversation. I really appreciate your openness and self-reflection. ${readinessMessage} Keep up the excellent work, and don't hesitate to reach out if you need anything before our next 1:1.`;
  };

  const handleComplete = () => {
    onComplete({
      responses: userResponses,
      topicsCovered: ONE_ON_ONE_TOPICS.slice(0, currentTopicIndex + 1).map(t => t.id),
      completedAt: new Date().toISOString(),
    });
  };

  const isComplete = currentTopicIndex >= ONE_ON_ONE_TOPICS.length && !isProcessing;
  const progress = (currentTopicIndex / ONE_ON_ONE_TOPICS.length) * 100;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={manager.avatar} />
            <AvatarFallback className="text-lg bg-purple-100 text-purple-700">
              {manager.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold">1:1 with {manager.name}</h2>
            <p className="text-sm text-muted-foreground">{manager.title}</p>
          </div>
        </div>
        <Badge variant="outline" className="text-sm">
          {mode === 'journey' ? 'Journey Mode' : 'Practice Mode'}
        </Badge>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Conversation</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>~30 min</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Topics Covered</span>
                  <span>{Math.min(currentTopicIndex + 1, ONE_ON_ONE_TOPICS.length)} / {ONE_ON_ONE_TOPICS.length}</span>
                </div>
                <Progress value={progress} />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px] p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <MessageBubble 
                      key={message.id} 
                      message={message} 
                      manager={manager}
                    />
                  ))}
                  
                  {isProcessing && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">{manager.name.split(' ')[0]} is typing...</span>
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
                      placeholder="Share your thoughts..."
                      className="min-h-[80px] resize-none"
                      disabled={isProcessing}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      data-testid="input-one-on-one-response"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!currentInput.trim() || isProcessing}
                      className="self-end"
                      data-testid="button-send-one-on-one"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-purple-800">
                        Great 1:1 session!
                      </span>
                    </div>
                    <Button onClick={handleComplete} data-testid="button-complete-one-on-one">
                      Complete Session
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{readinessScore}%</div>
                <div className="text-sm text-muted-foreground">Readiness Score</div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-2">Competency Highlights</h4>
                <div className="space-y-2">
                  {Object.entries(competencyScores).slice(0, 4).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                      <Badge variant={value.band === 'junior_ready' ? 'default' : 'secondary'}>
                        {value.band.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Discussion Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {ONE_ON_ONE_TOPICS.map((topic, index) => (
                  <div
                    key={topic.id}
                    className={`flex items-center gap-2 p-2 rounded text-sm ${
                      index < currentTopicIndex
                        ? 'bg-green-50 text-green-700'
                        : index === currentTopicIndex
                        ? 'bg-purple-50 text-purple-700'
                        : 'bg-gray-50 text-gray-500'
                    }`}
                  >
                    {index < currentTopicIndex ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : index === currentTopicIndex ? (
                      <div className="h-4 w-4 rounded-full bg-purple-500 animate-pulse" />
                    ) : (
                      <div className="h-4 w-4 rounded-full bg-gray-300" />
                    )}
                    <span>{topic.title}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Tips for 1:1s</h4>
                  <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                    <li>• Be honest and open about challenges</li>
                    <li>• Come prepared with specific examples</li>
                    <li>• Ask for specific feedback</li>
                    <li>• Take notes on action items</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  manager: Manager;
}

function MessageBubble({ message, manager }: MessageBubbleProps) {
  const isUser = message.speaker === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={manager.avatar} />
          <AvatarFallback className="text-xs bg-purple-100 text-purple-700">
            {manager.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        {!isUser && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">{manager.name}</span>
          </div>
        )}
        <div
          className={`inline-block p-3 rounded-lg ${
            isUser
              ? 'bg-purple-600 text-white'
              : message.type === 'question'
              ? 'bg-yellow-50 border border-yellow-200'
              : message.type === 'feedback'
              ? 'bg-green-50 border border-green-200'
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
