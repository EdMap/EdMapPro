import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Send, 
  User, 
  Bot, 
  Clock, 
  Target, 
  CheckCircle2, 
  XCircle,
  ArrowRight,
  Trophy,
  TrendingUp,
  AlertCircle,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InterviewQuestion {
  id: number;
  questionText: string;
  questionType: string;
  score?: number;
  feedback?: string;
  strengths?: string[];
  improvements?: string[];
}

interface InterviewSession {
  id: number;
  interviewType: string;
  targetRole: string;
  difficulty: string;
  status: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  overallScore?: number;
}

interface FinalReport {
  overallScore: number;
  communicationScore: number;
  technicalScore?: number;
  problemSolvingScore: number;
  cultureFitScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  hiringDecision: string;
}

interface LangchainInterviewSessionProps {
  session: InterviewSession;
  firstQuestion: InterviewQuestion;
  onComplete: () => void;
}

export default function LangchainInterviewSession({ 
  session: initialSession, 
  firstQuestion,
  onComplete 
}: LangchainInterviewSessionProps) {
  const { toast } = useToast();
  const [session, setSession] = useState(initialSession);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion>(firstQuestion);
  const [answer, setAnswer] = useState("");
  const [messages, setMessages] = useState<Array<{role: 'interviewer' | 'candidate', content: string, evaluation?: any}>>([
    { role: 'interviewer', content: firstQuestion.questionText }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showTypingIndicator]);

  const submitAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: number; answer: string }) => {
      const response = await apiRequest("POST", `/api/interviews/${session.id}/answer`, {
        questionId,
        answer
      });
      return response.json();
    },
    onSuccess: (result) => {
      setMessages(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (updated[lastIndex].role === 'candidate') {
          updated[lastIndex] = {
            ...updated[lastIndex],
            evaluation: result.evaluation
          };
        }
        return updated;
      });

      if (result.finalReport) {
        setFinalReport(result.finalReport);
        setSession(prev => ({ ...prev, status: 'completed', overallScore: result.finalReport.overallScore }));
      } else if (result.nextQuestion) {
        setShowTypingIndicator(true);
        setTimeout(() => {
          setShowTypingIndicator(false);
          setCurrentQuestion(result.nextQuestion);
          setMessages(prev => [...prev, { role: 'interviewer', content: result.nextQuestion.questionText }]);
          setSession(prev => ({ ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 }));
        }, 1500);
      }
      
      setIsSubmitting(false);
      setAnswer("");
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: "Failed to submit answer. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmitAnswer = () => {
    if (!answer.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setMessages(prev => [...prev, { role: 'candidate', content: answer }]);
    
    submitAnswerMutation.mutate({
      questionId: currentQuestion.id,
      answer: answer.trim()
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitAnswer();
    }
  };

  const getHiringDecisionColor = (decision: string) => {
    switch (decision) {
      case 'strong_yes': return 'text-green-600 bg-green-50';
      case 'yes': return 'text-green-500 bg-green-50';
      case 'maybe': return 'text-yellow-600 bg-yellow-50';
      case 'no': return 'text-orange-600 bg-orange-50';
      case 'strong_no': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getHiringDecisionText = (decision: string) => {
    switch (decision) {
      case 'strong_yes': return 'Strong Yes - Highly Recommend';
      case 'yes': return 'Yes - Recommend';
      case 'maybe': return 'Maybe - Further Evaluation Needed';
      case 'no': return 'No - Not Recommended';
      case 'strong_no': return 'Strong No - Not a Fit';
      default: return decision;
    }
  };

  if (finalReport) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Trophy className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Interview Complete!</CardTitle>
            <p className="text-gray-600 mt-2">Here's your performance summary</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">{finalReport.overallScore}</div>
              <p className="text-gray-500">Overall Score</p>
              <div className={cn("inline-block px-4 py-2 rounded-full mt-4 font-medium", getHiringDecisionColor(finalReport.hiringDecision))}>
                {getHiringDecisionText(finalReport.hiringDecision)}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-semibold text-gray-900">{finalReport.communicationScore}</div>
                <p className="text-sm text-gray-600">Communication</p>
              </div>
              {finalReport.technicalScore && (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-semibold text-gray-900">{finalReport.technicalScore}</div>
                  <p className="text-sm text-gray-600">Technical</p>
                </div>
              )}
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-semibold text-gray-900">{finalReport.problemSolvingScore}</div>
                <p className="text-sm text-gray-600">Problem Solving</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-semibold text-gray-900">{finalReport.cultureFitScore}</div>
                <p className="text-sm text-gray-600">Culture Fit</p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Summary</h4>
              <p className="text-gray-700">{finalReport.summary}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  Strengths
                </h4>
                <ul className="space-y-2">
                  {finalReport.strengths.map((strength, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      <span className="text-gray-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <TrendingUp className="h-5 w-5 text-orange-500 mr-2" />
                  Areas to Improve
                </h4>
                <ul className="space-y-2">
                  {finalReport.improvements.map((improvement, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-orange-500 mr-2">•</span>
                      <span className="text-gray-700">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <AlertCircle className="h-5 w-5 text-blue-500 mr-2" />
                Recommendations
              </h4>
              <ul className="space-y-2">
                {finalReport.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start bg-gray-50 p-3 rounded-lg">
                    <ArrowRight className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-center pt-4">
              <Button onClick={onComplete} size="lg" data-testid="button-back-to-setup">
                Back to Interview Setup
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col p-4">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {session.interviewType.charAt(0).toUpperCase() + session.interviewType.slice(1)} Interview
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {session.targetRole} • {session.difficulty} level
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Question {session.currentQuestionIndex + 1} of {session.totalQuestions}
                </span>
              </div>
              <Progress 
                value={((session.currentQuestionIndex + 1) / session.totalQuestions) * 100} 
                className="w-32 h-2"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={cn(
                "flex items-start space-x-3",
                msg.role === 'candidate' && "flex-row-reverse space-x-reverse"
              )}
            >
              <Avatar className={cn(
                "h-10 w-10",
                msg.role === 'interviewer' ? "bg-blue-100" : "bg-green-100"
              )}>
                <AvatarFallback>
                  {msg.role === 'interviewer' ? (
                    <Bot className="h-5 w-5 text-blue-600" />
                  ) : (
                    <User className="h-5 w-5 text-green-600" />
                  )}
                </AvatarFallback>
              </Avatar>
              <div className={cn(
                "max-w-[70%] rounded-lg p-4",
                msg.role === 'interviewer' 
                  ? "bg-blue-50 text-gray-900" 
                  : "bg-green-50 text-gray-900"
              )}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.evaluation && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant={msg.evaluation.score >= 7 ? "default" : msg.evaluation.score >= 5 ? "secondary" : "destructive"}>
                        Score: {msg.evaluation.score}/10
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{msg.evaluation.feedback}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {showTypingIndicator && (
            <div className="flex items-start space-x-3">
              <Avatar className="h-10 w-10 bg-blue-100">
                <AvatarFallback>
                  <Bot className="h-5 w-5 text-blue-600" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </CardContent>

        <div className="flex-shrink-0 border-t p-4">
          <div className="flex space-x-3">
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer here... (Press Enter to send, Shift+Enter for new line)"
              className="flex-1 min-h-[80px] resize-none"
              disabled={isSubmitting}
              data-testid="input-answer"
            />
            <Button 
              onClick={handleSubmitAnswer}
              disabled={!answer.trim() || isSubmitting}
              className="self-end"
              data-testid="button-submit-answer"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
