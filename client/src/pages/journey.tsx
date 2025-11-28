import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { OfferLetter } from "@/components/OfferLetter";
import { ModeBanner } from "@/components/ModeBanner";
import type { OfferDetails, InterviewSession, InterviewQuestion, InterviewFeedback } from "@shared/schema";
import { 
  Briefcase, Calendar, Check, ChevronRight, Clock, FileText, MapPin, 
  MessageCircle, Play, Target, Users, ArrowRight, ArrowLeft,
  Rocket, Trophy, Video, Building2, Eye, Loader2, CheckCircle, AlertCircle, TrendingUp,
  History, Star, MessageSquare, Code, UserCheck, Timer, Award, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Company {
  id: number;
  name: string;
  logo: string | null;
  industry: string;
  size: string;
}

interface JobPosting {
  id: number;
  title: string;
  role: string;
  seniority: string;
  location: string;
  interviewStages: number;
  company: Company;
}

interface ApplicationStage {
  id: number;
  applicationId: number;
  stageOrder: number;
  stageName: string;
  stageType: string;
  status: string;
  scheduledAt: string | null;
  completedAt: string | null;
  score: number | null;
  feedback: string | null;
  interviewSessionId: number | null;
}

interface JobApplication {
  id: number;
  userId: number;
  jobPostingId: number;
  status: string;
  coverLetter: string | null;
  currentStageIndex: number;
  appliedAt: string | null;
  job: JobPosting;
  stages: ApplicationStage[];
  offerDetails: OfferDetails | null;
}

interface InterviewFeedbackData {
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

interface FeedbackResponse {
  feedback: InterviewFeedbackData;
  session: {
    interviewType: string;
    targetRole: string;
    completedAt: string;
  };
}

// Interview History Types
interface InterviewHistorySession {
  id: number;
  userId: number;
  interviewType: string;
  targetRole: string;
  difficulty: string;
  status: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  overallScore: number | null;
  startedAt: string;
  completedAt: string | null;
}

interface InterviewHistoryQuestion {
  id: number;
  sessionId: number;
  questionIndex: number;
  questionText: string;
  questionType: string;
  candidateAnswer: string | null;
  score: number | null;
  feedback: string | null;
  strengths: string[];
  improvements: string[];
  askedAt: string;
  answeredAt: string | null;
}

interface InterviewHistoryDetail {
  session: InterviewHistorySession;
  questions: InterviewHistoryQuestion[];
  feedback: InterviewFeedbackData | null;
}

function FeedbackModal({ 
  isOpen, 
  onClose, 
  sessionId,
  stageName
}: { 
  isOpen: boolean; 
  onClose: () => void;
  sessionId: number | null;
  stageName: string;
}) {
  const { data, isLoading, error } = useQuery<FeedbackResponse>({
    queryKey: [`/api/interviews/${sessionId}/feedback`],
    enabled: isOpen && !!sessionId
  });

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="dialog-feedback">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-blue-600" />
            {stageName} - Interview Feedback
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Unable to load feedback</p>
          </div>
        )}

        {data?.feedback && (
          <div className="space-y-6">
            <div className="text-center py-4">
              <div className="text-5xl font-bold text-blue-600 mb-2" data-testid="text-modal-overall-score">
                {data.feedback.overallScore}
              </div>
              <p className="text-gray-500">Overall Score</p>
              <div className={cn(
                "inline-block px-4 py-2 rounded-full mt-3 font-medium",
                getHiringDecisionColor(data.feedback.hiringDecision)
              )} data-testid="text-modal-hiring-decision">
                {getHiringDecisionText(data.feedback.hiringDecision)}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-xl font-semibold text-gray-900 dark:text-white" data-testid="text-modal-communication-score">
                  {data.feedback.communicationScore}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Communication</p>
              </div>
              {data.feedback.technicalScore !== null && data.feedback.technicalScore !== undefined && (
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-xl font-semibold text-gray-900 dark:text-white" data-testid="text-modal-technical-score">
                    {data.feedback.technicalScore}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Technical</p>
                </div>
              )}
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-xl font-semibold text-gray-900 dark:text-white">
                  {data.feedback.problemSolvingScore}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Problem Solving</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-xl font-semibold text-gray-900 dark:text-white">
                  {data.feedback.cultureFitScore}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Culture Fit</p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Summary</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{data.feedback.summary}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 dark:text-green-300 flex items-center gap-2 mb-3">
                  <CheckCircle className="h-4 w-4" />
                  Strengths
                </h4>
                <ul className="space-y-2">
                  {data.feedback.strengths.map((strength, i) => (
                    <li key={i} className="text-sm text-green-700 dark:text-green-400 flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4" />
                  Areas to Improve
                </h4>
                <ul className="space-y-2">
                  {data.feedback.improvements.map((improvement, i) => (
                    <li key={i} className="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {data.feedback.recommendations.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-3">Recommendations</h4>
                <ul className="space-y-2">
                  {data.feedback.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm text-blue-700 dark:text-blue-400 flex items-start gap-2">
                      <span className="text-blue-500 mt-1">{i + 1}.</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case "submitted": return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
    case "interviewing": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
    case "offer": return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    case "rejected": return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
    case "withdrawn": return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
}

function getStageIcon(type: string) {
  switch (type) {
    case "recruiter_call": return <MessageCircle className="h-4 w-4" />;
    case "behavioral": return <Users className="h-4 w-4" />;
    case "technical": return <FileText className="h-4 w-4" />;
    case "case_study": return <Target className="h-4 w-4" />;
    case "portfolio": return <Briefcase className="h-4 w-4" />;
    default: return <Calendar className="h-4 w-4" />;
  }
}

function getStageTypeLabel(type: string): string {
  switch (type) {
    case "recruiter_call": return "Recruiter Call";
    case "behavioral": return "Behavioral";
    case "technical": return "Technical";
    case "case_study": return "Case Study";
    case "portfolio": return "Portfolio Review";
    default: return type;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Compact list item for the left panel
function ApplicationListItem({ 
  application, 
  isSelected,
  onClick
}: { 
  application: JobApplication;
  isSelected: boolean;
  onClick: () => void;
}) {
  const completedStages = application.stages.filter(s => s.status === 'completed' || s.status === 'passed').length;
  const progressPercent = (completedStages / application.stages.length) * 100;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
        isSelected && "bg-primary/5 dark:bg-primary/10 border-l-2 border-l-primary"
      )}
      data-testid={`list-item-${application.id}`}
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg font-semibold text-primary shrink-0">
          {application.job.company.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-medium text-gray-900 dark:text-white truncate text-sm">
              {application.job.title}
            </h3>
            <Badge className={cn(getStatusColor(application.status), "text-xs shrink-0")}>
              {application.status === 'offer' ? '🎉 Offer' : application.status}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {application.job.company.name}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Progress value={progressPercent} className="h-1.5 flex-1" />
            <span className="text-xs text-gray-500 shrink-0">
              {completedStages}/{application.stages.length}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

// Stage timeline for the detail panel
function StageTimeline({ 
  stages, 
  currentIndex,
  onStartInterview,
  onViewFeedback
}: { 
  stages: ApplicationStage[]; 
  currentIndex: number;
  onStartInterview: (stage: ApplicationStage) => void;
  onViewFeedback: (stage: ApplicationStage) => void;
}) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
      
      <div className="space-y-4">
        {stages.map((stage, index) => {
          const isCompleted = stage.status === 'completed' || stage.status === 'passed';
          const isCurrent = index === currentIndex && !isCompleted;
          const hasFeedback = isCompleted && stage.interviewSessionId;
          
          return (
            <div key={stage.id} className="relative flex items-start gap-4">
              <div 
                className={cn(
                  "relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2",
                  isCompleted && "bg-green-500 border-green-500 text-white",
                  isCurrent && "bg-primary border-primary text-white",
                  !isCompleted && !isCurrent && "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-medium">{stage.stageOrder}</span>
                )}
              </div>
              
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className={cn(
                      "font-medium",
                      isCompleted && "text-green-600",
                      isCurrent && "text-gray-900 dark:text-white",
                      !isCompleted && !isCurrent && "text-gray-400"
                    )}>
                      {stage.stageName}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                      {getStageIcon(stage.stageType)}
                      <span>{getStageTypeLabel(stage.stageType)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isCompleted && stage.score && (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        {stage.score}%
                      </Badge>
                    )}
                    
                    {hasFeedback && (
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => onViewFeedback(stage)}
                        data-testid={`button-view-feedback-${stage.id}`}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Feedback
                      </Button>
                    )}
                    
                    {isCurrent && (
                      <Button 
                        size="sm"
                        onClick={() => onStartInterview(stage)}
                        data-testid={`button-start-interview-${stage.id}`}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Start
                      </Button>
                    )}
                  </div>
                </div>
                
                {isCompleted && stage.feedback && (
                  <p className="text-sm text-gray-500 mt-2 bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs">
                    {stage.feedback}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Detail panel showing selected application
function ApplicationDetail({ 
  application,
  onStartInterview,
  onBack
}: { 
  application: JobApplication;
  onStartInterview: (stage: ApplicationStage) => void;
  onBack: () => void;
}) {
  const [, navigate] = useLocation();
  const [feedbackModal, setFeedbackModal] = useState<{ isOpen: boolean; sessionId: number | null; stageName: string }>({
    isOpen: false,
    sessionId: null,
    stageName: ''
  });
  const completedStages = application.stages.filter(s => s.status === 'completed' || s.status === 'passed').length;
  const progressPercent = (completedStages / application.stages.length) * 100;

  const handleViewFeedback = (stage: ApplicationStage) => {
    if (stage.interviewSessionId) {
      setFeedbackModal({
        isOpen: true,
        sessionId: stage.interviewSessionId,
        stageName: stage.stageName
      });
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <button 
          onClick={onBack}
          className="md:hidden flex items-center gap-1 text-sm text-gray-500 mb-3 hover:text-gray-700"
          data-testid="button-back-to-list"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to list
        </button>
        
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl font-bold text-primary">
            {application.job.company.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {application.job.title}
              </h2>
              <Badge className={getStatusColor(application.status)}>
                {application.status}
              </Badge>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {application.job.company.name} • {application.job.company.industry}
            </p>
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {application.job.location}
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {application.job.company.size}
              </span>
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-500">Interview Progress</span>
            <span className="font-medium">{completedStages}/{application.stages.length} stages</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </div>
      
      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Show Offer Letter if status is offer */}
          {application.status === 'offer' && application.offerDetails && (
            <OfferLetter 
              offer={application.offerDetails}
              company={application.job.company}
              job={{
                title: application.job.title,
                role: application.job.role,
                location: application.job.location,
              }}
              candidateName="Test User"
              onProceedToNegotiation={() => navigate(`/negotiation?applicationId=${application.id}`)}
            />
          )}
          
          {application.status === 'offer' && !application.offerDetails && (
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Trophy className="h-8 w-8 text-green-500" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-700 dark:text-green-400">
                      Congratulations! You received an offer!
                    </h4>
                    <p className="text-sm text-green-600 dark:text-green-500">
                      Negotiate to maximize your compensation package
                    </p>
                  </div>
                  <Button 
                    onClick={() => navigate(`/negotiation?applicationId=${application.id}`)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Negotiate Your Offer
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Interview Stages */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Interview Stages</h3>
            <StageTimeline 
              stages={application.stages} 
              currentIndex={application.currentStageIndex}
              onStartInterview={onStartInterview}
              onViewFeedback={handleViewFeedback}
            />
          </div>
        </div>
      </ScrollArea>

      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal({ isOpen: false, sessionId: null, stageName: '' })}
        sessionId={feedbackModal.sessionId}
        stageName={feedbackModal.stageName}
      />
    </div>
  );
}

// Stats bar
function JourneyStats({ applications }: { applications: JobApplication[] }) {
  const stats = {
    totalApplications: applications.length,
    interviewing: applications.filter(a => a.status === 'interviewing' || a.status === 'submitted').length,
    offers: applications.filter(a => a.status === 'offer').length,
    interviewsCompleted: applications.reduce((acc, app) => 
      acc + app.stages.filter(s => s.status === 'completed' || s.status === 'passed').length, 0
    ),
  };
  
  return (
    <div className="grid grid-cols-4 gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
      <div className="text-center">
        <div className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalApplications}</div>
        <div className="text-xs text-gray-500">Apps</div>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold text-yellow-600">{stats.interviewing}</div>
        <div className="text-xs text-gray-500">Active</div>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold text-purple-600">{stats.interviewsCompleted}</div>
        <div className="text-xs text-gray-500">Interviews</div>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold text-green-600">{stats.offers}</div>
        <div className="text-xs text-gray-500">Offers</div>
      </div>
    </div>
  );
}

function EmptyState() {
  const [, navigate] = useLocation();
  
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <Rocket className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="font-semibold text-xl text-gray-900 dark:text-white mb-2">
          Start Your Job Journey
        </h3>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          Browse job listings, apply to positions, and complete your interviews.
        </p>
        <Button onClick={() => navigate('/jobs')} size="lg" data-testid="button-browse-jobs">
          <Briefcase className="h-5 w-5 mr-2" />
          Browse Jobs
        </Button>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex h-full">
      <div className="w-80 border-r border-gray-200 dark:border-gray-700">
        <div className="p-3 border-b">
          <Skeleton className="h-6 w-full" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 border-b">
            <div className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-1.5 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex-1 p-6">
        <div className="space-y-4">
          <div className="flex gap-4">
            <Skeleton className="h-14 w-14 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
      </div>
    </div>
  );
}

// Interview History Components
function getInterviewTypeIcon(type: string) {
  switch (type) {
    case 'behavioral': return <Users className="h-4 w-4" />;
    case 'technical': return <Code className="h-4 w-4" />;
    case 'case_study': return <Target className="h-4 w-4" />;
    default: return <MessageSquare className="h-4 w-4" />;
  }
}

function getInterviewTypeLabel(type: string): string {
  switch (type) {
    case 'behavioral': return 'Behavioral';
    case 'technical': return 'Technical';
    case 'case_study': return 'Case Study';
    default: return type;
  }
}

function getRoleLabel(role: string): string {
  switch (role) {
    case 'developer': return 'Developer';
    case 'pm': return 'Product Manager';
    case 'designer': return 'Designer';
    case 'data-scientist': return 'Data Scientist';
    default: return role;
  }
}

function getScoreColor(score: number | null): string {
  if (!score) return 'text-gray-400';
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Completed</Badge>;
    case 'in_progress':
      return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">In Progress</Badge>;
    case 'abandoned':
      return <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">Abandoned</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

function InterviewSessionListItem({
  session,
  isSelected,
  onClick
}: {
  session: InterviewHistorySession;
  isSelected: boolean;
  onClick: () => void;
}) {
  const startedAt = session.startedAt || session.startedAt;
  const formattedDate = startedAt 
    ? format(new Date(startedAt), 'MMM d, yyyy')
    : 'Unknown';
  const formattedTime = startedAt 
    ? format(new Date(startedAt), 'h:mm a')
    : '';
  
  const interviewType = session.interviewType || 'behavioral';
  const targetRole = session.targetRole || 'developer';
  const status = session.status || 'in_progress';
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
        isSelected && "bg-primary/5 dark:bg-primary/10 border-l-2 border-l-primary"
      )}
      data-testid={`interview-session-${session.id}`}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
          status === 'completed' 
            ? "bg-green-100 dark:bg-green-900/30 text-green-600" 
            : "bg-gray-100 dark:bg-gray-800 text-gray-500"
        )}>
          {getInterviewTypeIcon(interviewType)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-medium text-gray-900 dark:text-white truncate text-sm">
              {getInterviewTypeLabel(interviewType)} Interview
            </h3>
            {session.overallScore && (
              <span className={cn("text-sm font-semibold", getScoreColor(session.overallScore))}>
                {session.overallScore}%
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {getRoleLabel(targetRole)} • {formattedDate}
          </p>
          <div className="flex items-center gap-2 mt-2">
            {getStatusBadge(status)}
            <span className="text-xs text-gray-400">{formattedTime}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function InterviewTranscript({ questions }: { questions: InterviewHistoryQuestion[] }) {
  if (!questions.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No transcript available for this session
      </div>
    );
  }
  
  return (
    <Accordion type="single" collapsible className="space-y-2">
      {questions.map((q, index) => (
        <AccordionItem 
          key={q.id} 
          value={`q-${q.id}`}
          className="border rounded-lg bg-white dark:bg-gray-800/50 overflow-hidden"
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50 dark:hover:bg-gray-800">
            <div className="flex items-start gap-3 text-left w-full pr-4">
              <div className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-xs font-medium",
                q.score && q.score >= 70 
                  ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400"
                  : q.score 
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
              )}>
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                  {q.questionText}
                </p>
                {q.score && (
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs text-gray-500">{q.score}/100</span>
                  </div>
                )}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4 pt-2">
              {/* Candidate Answer */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Your Answer</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {q.candidateAnswer || <em className="text-gray-400">No answer recorded</em>}
                </p>
              </div>
              
              {/* Feedback */}
              {q.feedback && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Feedback</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{q.feedback}</p>
                </div>
              )}
              
              {/* Strengths & Improvements */}
              <div className="grid grid-cols-2 gap-3">
                {q.strengths && q.strengths.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-xs font-medium text-green-700 dark:text-green-300">Strengths</span>
                    </div>
                    <ul className="space-y-1">
                      {q.strengths.map((s, i) => (
                        <li key={i} className="text-xs text-green-700 dark:text-green-400">• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {q.improvements && q.improvements.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Improvements</span>
                    </div>
                    <ul className="space-y-1">
                      {q.improvements.map((s, i) => (
                        <li key={i} className="text-xs text-amber-700 dark:text-amber-400">• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

function InterviewSessionDetail({ 
  sessionId,
  onBack
}: { 
  sessionId: number;
  onBack: () => void;
}) {
  const { data, isLoading } = useQuery<InterviewHistoryDetail>({
    queryKey: [`/api/interviews/${sessionId}/detail`],
    enabled: !!sessionId
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Interview session not found
      </div>
    );
  }

  const { session, questions = [], feedback } = data;
  
  // Add defensive guards for session properties
  const interviewType = session?.interviewType || 'behavioral';
  const targetRole = session?.targetRole || 'developer';
  const status = session?.status || 'in_progress';
  const startedAt = session?.startedAt;
  const completedAt = session?.completedAt;
  
  const formattedDate = startedAt 
    ? format(new Date(startedAt), 'MMMM d, yyyy')
    : 'Unknown';
  const duration = completedAt && startedAt
    ? Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 60000)
    : null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <button 
          onClick={onBack}
          className="md:hidden flex items-center gap-2 text-sm text-gray-500 mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to list
        </button>
        
        <div className="flex items-start gap-4">
          <div className={cn(
            "h-14 w-14 rounded-xl flex items-center justify-center shrink-0",
            status === 'completed'
              ? "bg-green-100 dark:bg-green-900/30 text-green-600"
              : "bg-gray-100 dark:bg-gray-800 text-gray-500"
          )}>
            {getInterviewTypeIcon(interviewType)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {getInterviewTypeLabel(interviewType)} Interview
              </h2>
              {getStatusBadge(status)}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {getRoleLabel(targetRole)} • {formattedDate}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              {duration && (
                <span className="flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  {duration} min
                </span>
              )}
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {questions.length} questions
              </span>
              {session?.overallScore && (
                <span className={cn("flex items-center gap-1 font-semibold", getScoreColor(session.overallScore))}>
                  <Award className="h-3 w-3" />
                  {session.overallScore}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Content Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="transcript" className="h-full flex flex-col">
          <div className="px-4 pt-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="transcript" data-testid="tab-transcript">Transcript</TabsTrigger>
              <TabsTrigger value="insights" data-testid="tab-insights">Insights</TabsTrigger>
            </TabsList>
          </div>
          
          <ScrollArea className="flex-1">
            <TabsContent value="transcript" className="p-4 m-0">
              <InterviewTranscript questions={questions} />
            </TabsContent>
            
            <TabsContent value="insights" className="p-4 m-0">
              {feedback ? (
                <div className="space-y-6">
                  {/* Overall Score Card */}
                  <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Overall Performance</h3>
                          <p className="text-sm text-gray-500">{feedback.summary}</p>
                        </div>
                        <div className={cn(
                          "h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold",
                          feedback.overallScore >= 80 ? "bg-green-100 text-green-700" :
                          feedback.overallScore >= 60 ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        )}>
                          {feedback.overallScore}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Score Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <MessageSquare className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {feedback.communicationScore}
                        </div>
                        <div className="text-xs text-gray-500">Communication</div>
                      </CardContent>
                    </Card>
                    {feedback.technicalScore && (
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Code className="h-5 w-5 mx-auto mb-2 text-purple-500" />
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {feedback.technicalScore}
                          </div>
                          <div className="text-xs text-gray-500">Technical</div>
                        </CardContent>
                      </Card>
                    )}
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Target className="h-5 w-5 mx-auto mb-2 text-orange-500" />
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {feedback.problemSolvingScore}
                        </div>
                        <div className="text-xs text-gray-500">Problem Solving</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Users className="h-5 w-5 mx-auto mb-2 text-green-500" />
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {feedback.cultureFitScore}
                        </div>
                        <div className="text-xs text-gray-500">Culture Fit</div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Strengths & Improvements */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <h4 className="font-medium text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Strengths
                      </h4>
                      <ul className="space-y-2">
                        {feedback.strengths.map((s, i) => (
                          <li key={i} className="text-sm text-green-700 dark:text-green-400 flex items-start gap-2">
                            <span className="text-green-500 mt-1">•</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                      <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Areas to Improve
                      </h4>
                      <ul className="space-y-2">
                        {feedback.improvements.map((s, i) => (
                          <li key={i} className="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                            <span className="text-amber-500 mt-1">•</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  {/* Recommendations */}
                  {feedback.recommendations.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-3">Recommendations</h4>
                      <ul className="space-y-2">
                        {feedback.recommendations.map((rec, i) => (
                          <li key={i} className="text-sm text-blue-700 dark:text-blue-400 flex items-start gap-2">
                            <span className="text-blue-500 mt-1">{i + 1}.</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Award className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No insights available for this session</p>
                  <p className="text-sm mt-1">Complete the interview to see your performance analysis</p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
}

function InterviewHistoryPanel({ userId }: { userId: number }) {
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [filter, setFilter] = useState<'all' | 'completed' | 'in_progress'>('all');

  const { data: sessions, isLoading } = useQuery<InterviewHistorySession[]>({
    queryKey: ['/api/users', userId, 'interviews'],
    enabled: !!userId
  });

  const filteredSessions = sessions?.filter(s => {
    if (filter === 'all') return true;
    return s.status === filter;
  }) || [];

  const stats = {
    total: sessions?.length || 0,
    completed: sessions?.filter(s => s.status === 'completed').length || 0,
    avgScore: sessions?.filter(s => s.overallScore)
      .reduce((acc, s, _, arr) => acc + (s.overallScore || 0) / arr.length, 0) || 0
  };

  const handleSelectSession = (id: number) => {
    setSelectedSessionId(id);
    setShowDetail(true);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <History className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="font-semibold text-xl text-gray-900 dark:text-white mb-2">
            No Interview History
          </h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            Complete interviews to see your history here. Practice mode and journey interviews are both tracked.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Panel - Session List */}
      <div className={cn(
        "w-full md:w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col",
        showDetail && "hidden md:flex"
      )}>
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-white">{stats.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{stats.completed}</div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className={cn("text-lg font-bold", getScoreColor(stats.avgScore))}>
              {stats.avgScore > 0 ? Math.round(stats.avgScore) : '-'}
            </div>
            <div className="text-xs text-gray-500">Avg Score</div>
          </div>
        </div>
        
        {/* Filter */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            {(['all', 'completed', 'in_progress'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1 text-xs rounded-full transition-colors",
                  filter === f 
                    ? "bg-primary text-white" 
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
                data-testid={`filter-${f}`}
              >
                {f === 'all' ? 'All' : f === 'completed' ? 'Completed' : 'In Progress'}
              </button>
            ))}
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          {filteredSessions.map((session) => (
            <InterviewSessionListItem
              key={session.id}
              session={session}
              isSelected={selectedSessionId === session.id}
              onClick={() => handleSelectSession(session.id)}
            />
          ))}
        </ScrollArea>
      </div>
      
      {/* Right Panel - Session Detail */}
      <div className={cn(
        "flex-1 bg-gray-50 dark:bg-gray-900/50",
        !showDetail && "hidden md:block"
      )}>
        {selectedSessionId ? (
          <InterviewSessionDetail
            sessionId={selectedSessionId}
            onBack={() => setShowDetail(false)}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select an interview to view details
          </div>
        )}
      </div>
    </div>
  );
}

export default function Journey() {
  const [, navigate] = useLocation();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<'applications' | 'history'>('applications');
  
  const { data: user } = useQuery<{ id: number }>({
    queryKey: ['/api/user'],
  });

  const { data: applications, isLoading } = useQuery<JobApplication[]>({
    queryKey: [user?.id ? `/api/users/${user.id}/applications` : null],
    enabled: !!user?.id,
  });

  // Auto-select first application or most promising
  const selectedApplication = applications?.find(a => a.id === selectedId) 
    || applications?.[0] 
    || null;

  const handleSelectApplication = (id: number) => {
    setSelectedId(id);
    setShowDetail(true); // Show detail on mobile
  };

  const handleStartInterview = (stage: ApplicationStage) => {
    if (!selectedApplication) return;
    
    const stageTypeToInterviewType: Record<string, string> = {
      recruiter_call: 'behavioral',
      behavioral: 'behavioral',
      technical: 'technical',
      case_study: 'case_study',
      portfolio: 'behavioral',
    };
    
    const interviewType = stageTypeToInterviewType[stage.stageType] || 'behavioral';
    navigate(`/interview?stageId=${stage.id}&type=${interviewType}&role=${selectedApplication.job.role}`);
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-64px)]">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Journey Mode Banner */}
      <div className="p-4 pb-0 bg-white dark:bg-gray-900">
        <ModeBanner mode="journey" variant="banner" />
      </div>
      
      {/* Header with Tabs */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Your Job Journey</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Track applications and interview progress
            </p>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('applications')}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2",
              activeTab === 'applications'
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            )}
            data-testid="tab-applications"
          >
            <Briefcase className="h-4 w-4" />
            Applications
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2",
              activeTab === 'history'
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            )}
            data-testid="tab-history"
          >
            <History className="h-4 w-4" />
            Interview History
          </button>
        </div>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'applications' ? (
        // Applications Tab Content
        (!applications || applications.length === 0) ? (
          <EmptyState />
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel - Application List */}
            <div className={cn(
              "w-full md:w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col",
              showDetail && "hidden md:flex"
            )}>
              <JourneyStats applications={applications} />
              <ScrollArea className="flex-1">
                {applications.map((application) => (
                  <ApplicationListItem
                    key={application.id}
                    application={application}
                    isSelected={selectedApplication?.id === application.id}
                    onClick={() => handleSelectApplication(application.id)}
                  />
                ))}
              </ScrollArea>
            </div>
            
            {/* Right Panel - Application Detail */}
            <div className={cn(
              "flex-1 bg-gray-50 dark:bg-gray-900/50",
              !showDetail && "hidden md:block"
            )}>
              {selectedApplication ? (
                <ApplicationDetail
                  application={selectedApplication}
                  onStartInterview={handleStartInterview}
                  onBack={() => setShowDetail(false)}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Select an application to view details
                </div>
              )}
            </div>
          </div>
        )
      ) : (
        // Interview History Tab Content
        user?.id ? (
          <InterviewHistoryPanel userId={user.id} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Loading user data...
          </div>
        )
      )}
    </div>
  );
}
