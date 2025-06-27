import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Send, Mic, HelpCircle, Lightbulb, Bus, User, X } from "lucide-react";

interface Message {
  id: string;
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: Date;
  score?: number;
  feedback?: string;
}

interface InterviewSessionProps {
  session: any;
  onComplete: () => void;
}

export default function InterviewSession({ session, onComplete }: InterviewSessionProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentResponse, setCurrentResponse] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(session.configuration.duration * 60);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateQuestionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/interview/question", data);
      return response.json();
    },
    onSuccess: (question) => {
      setCurrentQuestion(question);
      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'interviewer',
        content: question.question,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
    }
  });

  const evaluateAnswerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/interview/evaluate", data);
      return response.json();
    },
    onSuccess: (evaluation) => {
      // Update the last user message with score and feedback
      setMessages(prev => {
        const updated = [...prev];
        const lastUserMessageIndex = updated.map(m => m.role).lastIndexOf('candidate');
        if (lastUserMessageIndex !== -1) {
          updated[lastUserMessageIndex] = {
            ...updated[lastUserMessageIndex],
            score: evaluation.score,
            feedback: evaluation.feedback
          };
        }
        return updated;
      });

      // Generate follow-up question if provided
      if (evaluation.followUp) {
        setTimeout(() => {
          const followUpMessage: Message = {
            id: Date.now().toString(),
            role: 'interviewer',
            content: evaluation.followUp,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, followUpMessage]);
        }, 1000);
      }
    }
  });

  const generateFeedbackMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/sessions/${session.id}/feedback`);
      return response.json();
    },
    onSuccess: (feedback) => {
      toast({
        title: "Interview Complete!",
        description: `Your final score: ${feedback.score}/100`,
      });
      onComplete();
    }
  });

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0) {
      handleEndInterview();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Generate initial question
  useEffect(() => {
    if (messages.length === 0) {
      generateQuestionMutation.mutate({
        profession: session.configuration.profession,
        interviewType: session.configuration.interviewType,
        difficulty: session.configuration.difficulty,
        jobPosting: session.configuration.jobPosting,
        previousQuestions: []
      });
    }
  }, []);

  const handleSendResponse = async () => {
    if (!currentResponse.trim() || !currentQuestion || isLoading) return;

    setIsLoading(true);
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'candidate',
      content: currentResponse,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input
    const response = currentResponse;
    setCurrentResponse("");

    try {
      // Evaluate the answer
      await evaluateAnswerMutation.mutateAsync({
        question: currentQuestion.question,
        answer: response,
        profession: session.configuration.profession,
        difficulty: session.configuration.difficulty
      });

      // Generate next question after a delay
      setTimeout(() => {
        const previousQuestions = messages
          .filter(m => m.role === 'interviewer')
          .map(m => m.content);
        
        generateQuestionMutation.mutate({
          profession: session.configuration.profession,
          interviewType: session.configuration.interviewType,
          difficulty: session.configuration.difficulty,
          jobPosting: session.configuration.jobPosting,
          previousQuestions
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process your response",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const handleEndInterview = async () => {
    // Update session with messages
    await apiRequest("PATCH", `/api/sessions/${session.id}`, {
      messages: messages,
      status: 'completed',
      completedAt: new Date()
    });

    // Generate final feedback
    generateFeedbackMutation.mutate();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getInterviewerName = () => {
    const names = {
      friendly: "Sarah Chen",
      strict: "Michael Rodriguez", 
      casual: "Alex Thompson",
      challenging: "Dr. Jennifer Wu"
    };
    return names[session.configuration.personality as keyof typeof names] || "Sarah Chen";
  };

  const getInterviewerRole = () => {
    const roles = {
      "Technical Interview": "Senior Software Engineer",
      "Behavioral Interview": "Engineering Manager",
      "System Design": "Principal Architect", 
      "HR/Culture Fit": "HR Business Partner"
    };
    return roles[session.configuration.interviewType as keyof typeof roles] || "Senior Engineer";
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          {/* Session Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarFallback className="bg-blue-600 text-white">
                    <Bus className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-gray-900">{getInterviewerName()}</h3>
                  <p className="text-sm text-gray-600">{getInterviewerRole()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Time Remaining</p>
                  <p className={`font-semibold ${timeRemaining < 300 ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatTime(timeRemaining)}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleEndInterview}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  End Interview
                </Button>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <CardContent className="p-6">
            <div className="h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50 space-y-4">
              {messages.length === 0 && generateQuestionMutation.isPending && (
                <div className="flex items-center space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-blue-600 text-white">
                      <Bus className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{getInterviewerName()}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="animate-pulse flex space-x-1">
                        <div className="rounded-full bg-gray-400 h-2 w-2"></div>
                        <div className="rounded-full bg-gray-400 h-2 w-2"></div>
                        <div className="rounded-full bg-gray-400 h-2 w-2"></div>
                      </div>
                      <span className="text-xs text-gray-500">Preparing question...</span>
                    </div>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div key={message.id} className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className={
                      message.role === 'interviewer' 
                        ? "bg-blue-600 text-white" 
                        : "bg-gray-600 text-white"
                    }>
                      {message.role === 'interviewer' ? (
                        <Bus className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900">
                        {message.role === 'interviewer' ? getInterviewerName() : 'You'}
                      </p>
                      {message.score && (
                        <Badge variant={message.score >= 70 ? "default" : "secondary"}>
                          {message.score}/100
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-700 mt-1">{message.content}</p>
                    {message.feedback && (
                      <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                        <p className="text-sm text-blue-800">{message.feedback}</p>
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
                    <AvatarFallback className="bg-blue-600 text-white">
                      <Bus className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{getInterviewerName()}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="animate-pulse flex space-x-1">
                        <div className="rounded-full bg-gray-400 h-2 w-2"></div>
                        <div className="rounded-full bg-gray-400 h-2 w-2"></div>
                        <div className="rounded-full bg-gray-400 h-2 w-2"></div>
                      </div>
                      <span className="text-xs text-gray-500">Evaluating your response...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Response Input */}
            <div className="flex space-x-3">
              <Textarea
                className="flex-1 resize-none"
                rows={3}
                placeholder="Type your response..."
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendResponse();
                  }
                }}
                disabled={isLoading || generateQuestionMutation.isPending}
              />
              <div className="flex flex-col space-y-2">
                <Button 
                  size="lg"
                  onClick={handleSendResponse}
                  disabled={!currentResponse.trim() || isLoading || generateQuestionMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  disabled
                  title="Voice Response (Coming Soon)"
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex space-x-2 mt-3">
              <Button 
                variant="outline" 
                size="sm"
                disabled
                className="text-sm"
              >
                <HelpCircle className="h-3 w-3 mr-1" />
                Ask for clarification
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                disabled
                className="text-sm"
              >
                <Lightbulb className="h-3 w-3 mr-1" />
                Request a hint
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
