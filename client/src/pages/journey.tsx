import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OfferLetter } from "@/components/OfferLetter";
import type { OfferDetails } from "@shared/schema";
import { 
  Briefcase, Calendar, Check, ChevronRight, Clock, FileText, MapPin, 
  MessageCircle, Play, Target, Users, ArrowRight, ArrowLeft,
  Rocket, Trophy, Video, Building2
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  onStartInterview 
}: { 
  stages: ApplicationStage[]; 
  currentIndex: number;
  onStartInterview: (stage: ApplicationStage) => void;
}) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
      
      <div className="space-y-4">
        {stages.map((stage, index) => {
          const isCompleted = stage.status === 'completed' || stage.status === 'passed';
          const isCurrent = index === currentIndex && !isCompleted;
          
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
                  
                  {isCompleted && stage.score && (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      {stage.score}%
                    </Badge>
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
  const completedStages = application.stages.filter(s => s.status === 'completed' || s.status === 'passed').length;
  const progressPercent = (completedStages / application.stages.length) * 100;
  
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
            />
          </div>
        </div>
      </ScrollArea>
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
          Browse job listings, apply to positions, and practice your interviews.
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

export default function Journey() {
  const [, navigate] = useLocation();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  
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

  if (!applications || applications.length === 0) {
    return (
      <div className="h-[calc(100vh-64px)] flex">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Your Job Journey</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Track applications and interview progress
        </p>
      </div>
      
      {/* Master-Detail Layout */}
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
    </div>
  );
}
