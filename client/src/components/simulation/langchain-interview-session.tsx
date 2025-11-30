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
  Loader2,
  MessageCircle,
  ClipboardCheck,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getPersonaStyle, type TeamPersona } from "@/lib/persona-styles";

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

interface PreludeMessage {
  role: 'interviewer' | 'candidate';
  content: string;
  personaId?: string;
}

interface PacingInfo {
  elapsedMinutes: number;
  progressPercent: number;
  status: 'starting' | 'on_track' | 'mid_interview' | 'wrapping_soon' | 'overtime';
}

interface LangchainInterviewSessionProps {
  session: InterviewSession;
  firstQuestion: InterviewQuestion;
  introduction?: string;
  preludeMessages?: PreludeMessage[];
  onComplete: () => void;
  mode?: "practice" | "journey";
  isTeamInterview?: boolean;
  teamPersonas?: TeamPersona[];
}

export default function LangchainInterviewSession({ 
  session: initialSession, 
  firstQuestion,
  introduction,
  preludeMessages: initialPreludeMessages,
  onComplete,
  mode = "practice",
  isTeamInterview = false,
  teamPersonas: initialTeamPersonas = []
}: LangchainInterviewSessionProps) {
  const { toast } = useToast();
  const [session, setSession] = useState(initialSession);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion>(firstQuestion);
  const [answer, setAnswer] = useState("");
  
  // Message type with evaluation, interim flag, and team persona info
  type ChatMessage = {
    role: 'interviewer' | 'candidate';
    content: string;
    evaluation?: any;
    isInterim?: boolean; // Marks messages that triggered interim responses (not real answers)
    personaId?: string; // For team interviews: which persona is speaking
  };

  // Track team personas (from props or updated from API responses)
  const [teamPersonas, setTeamPersonas] = useState<TeamPersona[]>(initialTeamPersonas);
  const [activePersonaId, setActivePersonaId] = useState<string | null>(
    initialTeamPersonas.length > 0 ? initialTeamPersonas[0].id : null
  );

  // Initialize messages: prelude messages (if any) OR introduction (legacy), then first question
  const buildInitialMessages = (): Array<ChatMessage> => {
    const msgs: Array<ChatMessage> = [];
    
    // Prefer prelude messages (properly attributed) over introduction string
    if (initialPreludeMessages && initialPreludeMessages.length > 0) {
      initialPreludeMessages.forEach(pm => {
        msgs.push({ 
          role: pm.role, 
          content: pm.content,
          personaId: pm.personaId // Include persona for team interviews
        });
      });
    } else if (introduction) {
      // Legacy: single introduction from interviewer
      msgs.push({ 
        role: 'interviewer', 
        content: introduction,
        personaId: isTeamInterview && initialTeamPersonas.length > 0 ? initialTeamPersonas[0].id : undefined
      });
    }
    
    // Add first question (use current active persona for team interviews)
    msgs.push({ 
      role: 'interviewer', 
      content: firstQuestion.questionText,
      personaId: isTeamInterview && initialTeamPersonas.length > 0 ? initialTeamPersonas[0].id : undefined
    });
    return msgs;
  };
  
  const [messages, setMessages] = useState(buildInitialMessages());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [showPreparingFeedback, setShowPreparingFeedback] = useState(false);
  const [showInterviewEndModal, setShowInterviewEndModal] = useState(false);
  const [pendingFinalReport, setPendingFinalReport] = useState<FinalReport | null>(null);
  const [pacing, setPacing] = useState<PacingInfo>({ elapsedMinutes: 0, progressPercent: 0, status: 'starting' });
  const [startTime] = useState(() => Date.now());
  const [showFeedbackBanner, setShowFeedbackBanner] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showTypingIndicator]);
  
  // Local timer to update elapsed time every 10 seconds for smooth display
  useEffect(() => {
    // Immediate update on mount
    const elapsed = Math.floor((Date.now() - startTime) / 60000);
    setPacing(prev => ({ ...prev, elapsedMinutes: elapsed }));
    
    const timer = setInterval(() => {
      const elapsedNow = Math.floor((Date.now() - startTime) / 60000);
      setPacing(prev => {
        if (prev.elapsedMinutes !== elapsedNow) {
          return { ...prev, elapsedMinutes: elapsedNow };
        }
        return prev;
      });
    }, 10000); // Update every 10 seconds for smoother UX
    
    return () => clearInterval(timer);
  }, [startTime]);

  const submitAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: number; answer: string }) => {
      const response = await apiRequest("POST", `/api/interviews/${session.id}/answer`, {
        questionId,
        answer
      });
      return response.json();
    },
    onSuccess: (result) => {
      // Update team persona state if provided (for team interviews)
      if (result.activePersona) {
        setActivePersonaId(result.activePersona.id);
      }
      if (result.teamPersonas && result.teamPersonas.length > 0) {
        setTeamPersonas(result.teamPersonas);
      }
      
      // Get current active persona ID for message attribution
      const currentPersonaId = result.activePersona?.id || activePersonaId || undefined;
      
      // Handle interim responses (when AI responds to questions, confusion, comments, etc.)
      if (result.interimResponse) {
        // The AI is responding to a non-answer (question, confusion, etc.)
        // The question is still pending - don't advance the interview
        
        // CRITICAL: Mark the last candidate message as interim IMMEDIATELY (before re-enabling input)
        // This prevents a race where a fast follow-up answer gets incorrectly marked as interim
        setMessages(prev => {
          const updated = [...prev];
          for (let i = updated.length - 1; i >= 0; i--) {
            if (updated[i].role === 'candidate' && !updated[i].isInterim) {
              updated[i] = { ...updated[i], isInterim: true };
              break;
            }
          }
          return updated;
        });
        
        // Now re-enable input so user can respond
        setIsSubmitting(false);
        setAnswer("");
        
        // Show typing indicator, then add the interim response
        setShowTypingIndicator(true);
        setTimeout(() => {
          setShowTypingIndicator(false);
          setMessages(prev => {
            const updated = [...prev];
            // Add interviewer's interim response (with persona for team interviews)
            updated.push({ role: 'interviewer', content: result.interimResponse, personaId: currentPersonaId });
            // If question should be repeated, also re-display it
            if (result.questionRepeated && result.currentQuestionText) {
              updated.push({ role: 'interviewer', content: result.currentQuestionText, personaId: currentPersonaId });
            }
            return updated;
          });
        }, 1200);
        return;
      }
      
      // Handle normal answer flow with evaluation
      // Find the last candidate message that is NOT interim (skips messages that triggered interim responses)
      if (result.evaluation) {
        setMessages(prev => {
          const updated = [...prev];
          // Find the most recent candidate message that isn't interim to attach evaluation
          for (let i = updated.length - 1; i >= 0; i--) {
            if (updated[i].role === 'candidate' && !updated[i].evaluation && !updated[i].isInterim) {
              updated[i] = {
                ...updated[i],
                evaluation: result.evaluation
              };
              break;
            }
          }
          return updated;
        });
      }

      // Check if there's a candidate question answer to show (for mixed content)
      const hasCandidateQuestionAnswer = result.candidateQuestionAnswer && result.candidateQuestionAnswer.trim().length > 0;

      if (result.finalReport) {
        // Helper to show the interview end modal (instead of auto-transitioning)
        const showEndModal = (report: FinalReport) => {
          setPendingFinalReport(report);
          setShowInterviewEndModal(true);
        };
        
        // Show candidate question answer first if present, then closure
        if (hasCandidateQuestionAnswer) {
          setShowTypingIndicator(true);
          setTimeout(() => {
            setShowTypingIndicator(false);
            setMessages(prev => [...prev, { role: 'interviewer', content: result.candidateQuestionAnswer, personaId: currentPersonaId }]);
            // Then show closure if available
            if (result.closure) {
              setTimeout(() => {
                setShowTypingIndicator(true);
                setTimeout(() => {
                  setShowTypingIndicator(false);
                  setMessages(prev => [...prev, { role: 'interviewer', content: result.closure, personaId: currentPersonaId }]);
                  // Show modal after a brief pause to let user read closure
                  setTimeout(() => {
                    showEndModal(result.finalReport);
                  }, 2000);
                }, 1200);
              }, 1000);
            } else {
              setTimeout(() => {
                showEndModal(result.finalReport);
              }, 1500);
            }
          }, 1200);
        } else if (result.closure) {
          setShowTypingIndicator(true);
          setTimeout(() => {
            setShowTypingIndicator(false);
            setMessages(prev => [...prev, { role: 'interviewer', content: result.closure, personaId: currentPersonaId }]);
            // Show modal after a brief pause to let user read closure
            setTimeout(() => {
              showEndModal(result.finalReport);
            }, 2000);
          }, 1500);
        } else {
          showEndModal(result.finalReport);
        }
      } else if (result.nextQuestion) {
        // Update pacing info if provided
        if (result.pacing) {
          setPacing(result.pacing);
        }
        
        // Update session state immediately to avoid stale state
        setSession(prev => ({ ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 }));
        setCurrentQuestion(result.nextQuestion);
        
        setShowTypingIndicator(true);
        
        // Show candidate question answer first (if any), then reflection, then question
        const hasReflection = result.reflection && result.reflection.trim().length > 0;
        
        setTimeout(() => {
          setShowTypingIndicator(false);
          
          // Add all messages in a single state update to avoid race conditions
          setMessages(prev => {
            const newMessages = [...prev];
            // Add candidate question answer first (if any)
            if (hasCandidateQuestionAnswer) {
              newMessages.push({ role: 'interviewer', content: result.candidateQuestionAnswer, personaId: currentPersonaId });
            }
            if (hasReflection) {
              newMessages.push({ role: 'interviewer', content: result.reflection, personaId: currentPersonaId });
            }
            newMessages.push({ role: 'interviewer', content: result.nextQuestion.questionText, personaId: currentPersonaId });
            return newMessages;
          });
        }, hasCandidateQuestionAnswer ? 1800 : hasReflection ? 1500 : 1200);
      }
      
      setIsSubmitting(false);
    },
    onError: (error) => {
      setIsSubmitting(false);
      setShowTypingIndicator(false);
      toast({
        title: "Error",
        description: "Failed to submit answer. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmitAnswer = () => {
    if (!answer.trim() || isSubmitting) return;

    const trimmedAnswer = answer.trim();
    
    setIsSubmitting(true);
    setMessages(prev => [...prev, { role: 'candidate', content: trimmedAnswer }]);
    
    // Clear input immediately so user sees their message was sent
    setAnswer("");
    
    // Show typing indicator immediately so user knows AI is processing
    setShowTypingIndicator(true);
    
    submitAnswerMutation.mutate({
      questionId: currentQuestion.id,
      answer: trimmedAnswer
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

  // Handle "Stay in conversation" - dismiss modal and show banner
  const handleStayInConversation = () => {
    setShowInterviewEndModal(false);
    setShowFeedbackBanner(true);
  };

  // Handle "View feedback" - transition to feedback report
  const handleViewFeedback = () => {
    setShowInterviewEndModal(false);
    setShowFeedbackBanner(false);
    if (pendingFinalReport) {
      setShowPreparingFeedback(true);
      setTimeout(() => {
        setShowPreparingFeedback(false);
        setFinalReport(pendingFinalReport);
        setSession(prev => ({ ...prev, status: 'completed', overallScore: pendingFinalReport.overallScore }));
      }, 2500);
    }
  };

  // Show "Preparing feedback" transition state
  if (showPreparingFeedback) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-6">
              <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-gray-900">Preparing Your Feedback</h2>
                <p className="text-gray-500">
                  We're analyzing your interview performance...
                </p>
              </div>
              <div className="space-y-3 text-left bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-600">Interview completed</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-600">Responses analyzed</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                  <span className="text-sm text-gray-600">Generating personalized feedback...</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
    <div className="h-[calc(100vh-80px)] flex flex-col p-4 relative">
      {/* Interview End Modal */}
      {showInterviewEndModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200"
          data-testid="modal-interview-end"
        >
          <Card className="max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
            <CardContent className="pt-8 pb-6">
              <div className="text-center space-y-6">
                {/* Interviewer avatar */}
                <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                  <Bot className="h-10 w-10 text-blue-600" />
                </div>
                
                {/* Heading */}
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-gray-900">Interview Complete</h2>
                  <p className="text-gray-500 px-4">
                    Great job! Take a moment to review your conversation, or jump straight to your feedback report.
                  </p>
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-col gap-3 pt-2">
                  <Button 
                    onClick={handleViewFeedback}
                    size="lg"
                    className="w-full"
                    data-testid="button-view-feedback"
                  >
                    <ClipboardCheck className="h-5 w-5 mr-2" />
                    View Feedback Report
                  </Button>
                  <Button 
                    onClick={handleStayInConversation}
                    variant="ghost"
                    size="lg"
                    className="w-full text-gray-600 hover:text-gray-900"
                    data-testid="button-stay-in-chat"
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Stay in Conversation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="flex-shrink-0 border-b">
          {/* Feedback ready banner */}
          {showFeedbackBanner && (
            <div className="mb-3 -mt-2 -mx-2 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-700">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">Your feedback report is ready!</span>
              </div>
              <Button 
                onClick={handleViewFeedback}
                size="sm"
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-100"
                data-testid="button-view-feedback-banner"
              >
                View Report
              </Button>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {session.interviewType.charAt(0).toUpperCase() + session.interviewType.slice(1)} Interview
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {session.targetRole} • {session.difficulty.charAt(0).toUpperCase() + session.difficulty.slice(1)} level
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Time-based pacing indicator */}
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {pacing.elapsedMinutes} min
                </span>
              </div>
              
              {/* Status chip */}
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs px-2 py-0.5",
                  pacing.status === 'starting' && "border-blue-200 bg-blue-50 text-blue-700",
                  pacing.status === 'on_track' && "border-green-200 bg-green-50 text-green-700",
                  pacing.status === 'mid_interview' && "border-yellow-200 bg-yellow-50 text-yellow-700",
                  pacing.status === 'wrapping_soon' && "border-orange-200 bg-orange-50 text-orange-700",
                  pacing.status === 'overtime' && "border-red-200 bg-red-50 text-red-700"
                )}
                data-testid="badge-pacing-status"
              >
                {pacing.status === 'starting' && 'Getting started'}
                {pacing.status === 'on_track' && 'On track'}
                {pacing.status === 'mid_interview' && 'In progress'}
                {pacing.status === 'wrapping_soon' && 'Wrapping up soon'}
                {pacing.status === 'overtime' && 'Overtime'}
              </Badge>
              
              {/* Progress ring (visual indicator) */}
              <div className="relative w-8 h-8">
                <svg className="w-8 h-8 transform -rotate-90">
                  <circle
                    cx="16"
                    cy="16"
                    r="12"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r="12"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={`${pacing.progressPercent * 0.75} 100`}
                    className={cn(
                      pacing.status === 'starting' && "text-blue-500",
                      pacing.status === 'on_track' && "text-green-500",
                      pacing.status === 'mid_interview' && "text-yellow-500",
                      pacing.status === 'wrapping_soon' && "text-orange-500",
                      pacing.status === 'overtime' && "text-red-500"
                    )}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => {
            const personaStyle = msg.role === 'interviewer' ? getPersonaStyle(msg.personaId, isTeamInterview, teamPersonas) : null;
            
            return (
            <div
              key={index}
              className={cn(
                "flex items-start space-x-3",
                msg.role === 'candidate' && "flex-row-reverse space-x-reverse"
              )}
            >
              <Avatar className={cn(
                "h-10 w-10",
                msg.role === 'interviewer' 
                  ? (personaStyle?.bgColor || "bg-blue-100") 
                  : "bg-green-100"
              )}>
                <AvatarFallback>
                  {msg.role === 'interviewer' ? (
                    <Bot className={cn("h-5 w-5", personaStyle?.iconColor || "text-blue-600")} />
                  ) : (
                    <User className="h-5 w-5 text-green-600" />
                  )}
                </AvatarFallback>
              </Avatar>
              <div className={cn(
                "max-w-[70%] rounded-lg p-4",
                msg.role === 'interviewer' 
                  ? (personaStyle?.messageBg || "bg-blue-50") + " text-gray-900" 
                  : "bg-green-50 text-gray-900"
              )}>
                {/* Show persona name and role for team interviews */}
                {isTeamInterview && msg.role === 'interviewer' && personaStyle && personaStyle.name !== 'Interviewer' && (
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-semibold text-sm">{personaStyle.name}</span>
                    {personaStyle.displayRole && (
                      <span className="text-xs text-gray-500">({personaStyle.displayRole})</span>
                    )}
                  </div>
                )}
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
          );
          })}
          
          {showTypingIndicator && (() => {
            const typingPersonaStyle = getPersonaStyle(activePersonaId, isTeamInterview, teamPersonas);
            return (
            <div className="flex items-start space-x-3">
              <Avatar className={cn("h-10 w-10", typingPersonaStyle.bgColor)}>
                <AvatarFallback>
                  <Bot className={cn("h-5 w-5", typingPersonaStyle.iconColor)} />
                </AvatarFallback>
              </Avatar>
              <div className={cn(typingPersonaStyle.messageBg, "rounded-lg p-4")}>
                {isTeamInterview && typingPersonaStyle.name !== 'Interviewer' && (
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-semibold text-sm">{typingPersonaStyle.name}</span>
                    {typingPersonaStyle.displayRole && (
                      <span className="text-xs text-gray-500">({typingPersonaStyle.displayRole})</span>
                    )}
                  </div>
                )}
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          );
          })()}
          
          <div ref={messagesEndRef} />
        </CardContent>

        <div className="flex-shrink-0 border-t p-4">
          <div className="flex space-x-3">
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={showFeedbackBanner ? "Interview complete - view your feedback report above" : "Type your answer here... (Press Enter to send, Shift+Enter for new line)"}
              className="flex-1 min-h-[80px] resize-none"
              disabled={isSubmitting || showFeedbackBanner}
              data-testid="input-answer"
            />
            <Button 
              onClick={handleSubmitAnswer}
              disabled={!answer.trim() || isSubmitting || showFeedbackBanner}
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
