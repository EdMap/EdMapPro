import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Send, Bus, User, X, DollarSign, TrendingUp, Handshake } from "lucide-react";

interface Message {
  id: string;
  role: 'counterpart' | 'user';
  content: string;
  timestamp: Date;
  sentiment?: string;
  strategy?: string;
  counterOffer?: any;
}

interface NegotiationSessionProps {
  session: any;
  onComplete: () => void;
}

export default function NegotiationSession({ session, onComplete }: NegotiationSessionProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const generateResponseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/negotiation/respond", data);
      return response.json();
    },
    onSuccess: (response) => {
      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'counterpart',
        content: response.response,
        timestamp: new Date(),
        sentiment: response.sentiment,
        strategy: response.strategy,
        counterOffer: response.counterOffer
      };
      setMessages(prev => [...prev, newMessage]);
    }
  });

  const generateFeedbackMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/sessions/${session.id}/feedback`);
      return response.json();
    },
    onSuccess: (feedback) => {
      toast({
        title: "Negotiation Complete!",
        description: `Success rate: ${feedback.score}%`,
      });
      onComplete();
    }
  });

  // Initialize with opening message
  useEffect(() => {
    if (messages.length === 0) {
      const openingMessage = getOpeningMessage();
      setMessages([{
        id: "opening",
        role: 'counterpart',
        content: openingMessage,
        timestamp: new Date()
      }]);
    }
  }, []);

  const getOpeningMessage = () => {
    const { scenario, targetAmount, companyRange } = session.configuration;
    
    switch (scenario) {
      case 'salary':
        return `Thank you for your interest in the position. I see you're looking at a salary of $${targetAmount?.toLocaleString()}. Our budget for this role is typically in the ${companyRange} range. Let's discuss what we can work out.`;
      case 'promotion':
        return `I appreciate you coming to discuss your career development. I understand you're interested in advancing to the next level. Let's talk about what that might look like and the requirements involved.`;
      case 'offer':
        return `Congratulations on receiving our offer! I'm here to discuss the complete package including salary, benefits, and other terms. What aspects would you like to focus on?`;
      default:
        return `Let's begin our negotiation discussion. What would you like to address first?`;
    }
  };

  const getCounterpartName = () => {
    const names = {
      collaborative: "Jennifer Martinez",
      competitive: "Robert Chen",
      analytical: "Dr. Sarah Kim",
      relationship: "Michael Johnson"
    };
    return names[session.configuration.counterpartStyle as keyof typeof names] || "Jennifer Martinez";
  };

  const getCounterpartRole = () => {
    const { scenario } = session.configuration;
    switch (scenario) {
      case 'salary':
        return "HR Manager";
      case 'promotion':
        return "Department Director";
      case 'offer':
        return "Hiring Manager";
      default:
        return "Negotiation Partner";
    }
  };

  const getScenarioIcon = () => {
    const { scenario } = session.configuration;
    switch (scenario) {
      case 'salary':
        return DollarSign;
      case 'promotion':
        return TrendingUp;
      case 'offer':
        return Handshake;
      default:
        return Handshake;
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    setIsLoading(true);
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: currentMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input
    const message = currentMessage;
    setCurrentMessage("");

    try {
      // Generate counterpart response
      await generateResponseMutation.mutateAsync({
        scenario: session.configuration.scenario,
        userMessage: message,
        negotiationHistory: messages,
        counterpartStyle: session.configuration.counterpartStyle
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate response",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const handleEndNegotiation = async () => {
    // Update session with messages
    await apiRequest("PATCH", `/api/sessions/${session.id}`, {
      messages: messages,
      status: 'completed',
      completedAt: new Date()
    });

    // Generate final feedback
    generateFeedbackMutation.mutate();
  };

  const Icon = getScenarioIcon();

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          {/* Session Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarFallback className="bg-green-600 text-white">
                    <Icon className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-gray-900">{getCounterpartName()}</h3>
                  <p className="text-sm text-gray-600">{getCounterpartRole()}</p>
                </div>
                <Badge variant="outline" className="capitalize">
                  {session.configuration.scenario} Negotiation
                </Badge>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Target</p>
                  <p className="font-semibold text-gray-900">
                    ${session.configuration.targetAmount?.toLocaleString()}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleEndNegotiation}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  End Negotiation
                </Button>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <CardContent className="p-6">
            <div className="h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className={
                      message.role === 'counterpart' 
                        ? "bg-green-600 text-white" 
                        : "bg-gray-600 text-white"
                    }>
                      {message.role === 'counterpart' ? (
                        <Icon className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900">
                        {message.role === 'counterpart' ? getCounterpartName() : 'You'}
                      </p>
                      {message.sentiment && (
                        <Badge variant="outline" className="text-xs">
                          {message.sentiment}
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-700 mt-1">{message.content}</p>
                    {message.strategy && (
                      <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                        <p className="text-sm text-green-800">
                          <strong>Strategy:</strong> {message.strategy}
                        </p>
                      </div>
                    )}
                    {message.counterOffer && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                        <p className="text-sm text-yellow-800">
                          <strong>Counter-offer:</strong> {message.counterOffer}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-green-600 text-white">
                      <Icon className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{getCounterpartName()}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="animate-pulse flex space-x-1">
                        <div className="rounded-full bg-gray-400 h-2 w-2"></div>
                        <div className="rounded-full bg-gray-400 h-2 w-2"></div>
                        <div className="rounded-full bg-gray-400 h-2 w-2"></div>
                      </div>
                      <span className="text-xs text-gray-500">Considering your proposal...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="flex space-x-3">
              <Textarea
                className="flex-1 resize-none"
                rows={3}
                placeholder="Type your negotiation message..."
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
              />
              <Button 
                size="lg"
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="flex space-x-2 mt-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentMessage("I appreciate your offer, but I was hoping we could explore some additional options.")}
                className="text-sm"
              >
                Request alternatives
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentMessage("Could you help me understand the reasoning behind this offer?")}
                className="text-sm"
              >
                Ask for justification
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
