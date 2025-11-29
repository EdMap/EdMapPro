import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Trophy, 
  CheckCircle2, 
  TrendingUp, 
  AlertCircle, 
  ArrowRight,
  Calendar,
  Clock,
  Target,
  ChevronRight,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InterviewSession {
  id: number;
  interviewType: string;
  targetRole: string;
  difficulty: string;
  status: string;
  overallScore?: number;
  startedAt: string;
  completedAt?: string;
}

interface InterviewFeedback {
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

interface InterviewQuestion {
  id: number;
  questionText: string;
  candidateAnswer?: string;
  score?: number;
  feedback?: string;
}

export default function InterviewHistory() {
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  
  // Fetch practice-only interviews
  const { data: sessions, isLoading: sessionsLoading } = useQuery<InterviewSession[]>({
    queryKey: ['/api/users/1/interviews?mode=practice']
  });

  const { data: feedbackData, isLoading: feedbackLoading } = useQuery<{
    feedback: InterviewFeedback;
    session: InterviewSession;
    questions: InterviewQuestion[];
  }>({
    queryKey: [`/api/interviews/${selectedSessionId}/feedback`],
    enabled: !!selectedSessionId
  });

  const completedSessions = sessions?.filter(s => s.status === 'completed') || [];

  const getHiringDecisionColor = (decision: string) => {
    switch (decision) {
      case 'strong_yes': return 'bg-green-100 text-green-800';
      case 'yes': return 'bg-green-50 text-green-700';
      case 'maybe': return 'bg-yellow-100 text-yellow-800';
      case 'no': return 'bg-red-50 text-red-700';
      case 'strong_no': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getHiringDecisionText = (decision: string) => {
    switch (decision) {
      case 'strong_yes': return 'Strong Hire';
      case 'yes': return 'Hire';
      case 'maybe': return 'Maybe';
      case 'no': return 'No Hire';
      case 'strong_no': return 'Strong No';
      default: return decision;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (sessionsLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (selectedSessionId && feedbackLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Loading feedback...</p>
        </div>
      </div>
    );
  }

  if (selectedSessionId && feedbackData) {
    const { feedback, session, questions } = feedbackData;
    
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedSessionId(null)}
          className="mb-6"
          data-testid="button-back-to-list"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to History
        </Button>
        
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Trophy className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Interview Feedback</CardTitle>
            <p className="text-gray-600 mt-2">
              {session.interviewType.charAt(0).toUpperCase() + session.interviewType.slice(1)} Interview - {session.targetRole}
            </p>
            <p className="text-sm text-gray-400">
              {formatDate(session.completedAt || session.startedAt)}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2" data-testid="text-overall-score">{feedback.overallScore}</div>
              <p className="text-gray-500">Overall Score</p>
              <div className={cn("inline-block px-4 py-2 rounded-full mt-4 font-medium", getHiringDecisionColor(feedback.hiringDecision))} data-testid="text-hiring-decision">
                {getHiringDecisionText(feedback.hiringDecision)}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-semibold text-gray-900" data-testid="text-communication-score">{feedback.communicationScore}</div>
                <p className="text-sm text-gray-600">Communication</p>
              </div>
              {feedback.technicalScore && (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-semibold text-gray-900" data-testid="text-technical-score">{feedback.technicalScore}</div>
                  <p className="text-sm text-gray-600">Technical</p>
                </div>
              )}
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-semibold text-gray-900">{feedback.problemSolvingScore}</div>
                <p className="text-sm text-gray-600">Problem Solving</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-semibold text-gray-900">{feedback.cultureFitScore}</div>
                <p className="text-sm text-gray-600">Culture Fit</p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Summary</h4>
              <p className="text-gray-700">{feedback.summary}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  Strengths
                </h4>
                <ul className="space-y-2">
                  {feedback.strengths.map((strength, i) => (
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
                  {feedback.improvements.map((improvement, i) => (
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
                {feedback.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start bg-gray-50 p-3 rounded-lg">
                    <ArrowRight className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {questions && questions.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Questions & Answers</h4>
                  <div className="space-y-4">
                    {questions.filter(q => q.candidateAnswer).map((question, i) => (
                      <div key={question.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-gray-900">Q{i + 1}: {question.questionText}</p>
                          {question.score && (
                            <Badge variant={question.score >= 7 ? "default" : question.score >= 5 ? "secondary" : "destructive"}>
                              {question.score}/10
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{question.candidateAnswer}</p>
                        {question.feedback && (
                          <p className="text-xs text-gray-500 italic">{question.feedback}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-center pt-4">
              <Link href="/interview">
                <Button size="lg" data-testid="button-practice-again">
                  Practice Again
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Practice History</h1>
            <p className="text-gray-600 mt-1">Track your interview practice sessions and progress</p>
          </div>
          <Link href="/interview">
            <Button data-testid="button-new-interview">
              New Practice
            </Button>
          </Link>
        </div>
        
        {/* Cross-link to Journey interviews */}
        <div className="mb-6 text-sm text-gray-500">
          Looking for job application interviews?{' '}
          <Link href="/journey" className="text-blue-600 hover:underline">
            View Journey History →
          </Link>
        </div>

        {completedSessions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No practice sessions yet</h3>
              <p className="text-gray-500 mb-6">Start your first practice interview to build your history</p>
              <Link href="/interview">
                <Button data-testid="button-start-first-interview">Start Your First Practice</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {completedSessions.map((session) => (
              <Card 
                key={session.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedSessionId(session.id)}
                data-testid={`card-session-${session.id}`}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center",
                        session.overallScore && session.overallScore >= 70 
                          ? "bg-green-100" 
                          : session.overallScore && session.overallScore >= 50 
                            ? "bg-yellow-100" 
                            : "bg-red-100"
                      )}>
                        <span className={cn(
                          "text-lg font-bold",
                          session.overallScore && session.overallScore >= 70 
                            ? "text-green-600" 
                            : session.overallScore && session.overallScore >= 50 
                              ? "text-yellow-600" 
                              : "text-red-600"
                        )}>
                          {session.overallScore || '—'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {session.interviewType.charAt(0).toUpperCase() + session.interviewType.slice(1)} Interview
                        </h3>
                        <div className="flex items-center space-x-3 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Target className="h-3 w-3 mr-1" />
                            {session.targetRole}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(session.completedAt || session.startedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="capitalize">
                        {session.difficulty}
                      </Badge>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
