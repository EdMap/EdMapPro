import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Briefcase, Calendar, Check, ChevronRight, Clock, FileText, MapPin, 
  MessageCircle, Play, Target, TrendingUp, Building2, ArrowRight,
  Rocket, Trophy, Users, Video
} from "lucide-react";

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

function StageTimeline({ stages, currentIndex }: { stages: ApplicationStage[]; currentIndex: number }) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
      
      <div className="space-y-4">
        {stages.map((stage, index) => {
          const isCompleted = stage.status === 'completed';
          const isCurrent = index === currentIndex && stage.status !== 'completed';
          const isPending = index > currentIndex;
          
          return (
            <div key={stage.id} className="relative flex items-start gap-4">
              <div 
                className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  isCompleted 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : isCurrent 
                    ? 'bg-primary border-primary text-white' 
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-medium">{stage.stageOrder}</span>
                )}
              </div>
              
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-medium ${
                      isCompleted ? 'text-green-600' : isCurrent ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                    }`}>
                      {stage.stageName}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                      {getStageIcon(stage.stageType)}
                      <span>{getStageTypeLabel(stage.stageType)}</span>
                    </div>
                  </div>
                  
                  {isCompleted && stage.score && (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      Score: {stage.score}%
                    </Badge>
                  )}
                  
                  {isCurrent && (
                    <Badge className="bg-primary">
                      Current Stage
                    </Badge>
                  )}
                </div>
                
                {isCompleted && stage.feedback && (
                  <p className="text-sm text-gray-500 mt-2 bg-gray-50 dark:bg-gray-800 p-2 rounded">
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

function ApplicationCard({ 
  application, 
  onStartInterview,
  isMostPromising = false
}: { 
  application: JobApplication;
  onStartInterview: (stage: ApplicationStage) => void;
  isMostPromising?: boolean;
}) {
  const progressPercent = (application.currentStageIndex / application.stages.length) * 100;
  const currentStage = application.stages[application.currentStageIndex];
  const completedStages = application.stages.filter(s => s.status === 'completed').length;
  
  return (
    <Card className="overflow-hidden" data-testid={`application-card-${application.id}`}>
      <CardContent className="p-0">
        <div className="p-5 border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-2xl shrink-0 relative">
                {application.job.company.logo || '🏢'}
                {isMostPromising && (
                  <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                    ⭐
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {application.job.title}
                  </h3>
                  {isMostPromising && (
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs">
                      Most Promising
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {application.job.company.name}
                </p>
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {application.job.location}
                  </span>
                  <Badge className={getStatusColor(application.status)}>
                    {application.status}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {completedStages}/{application.stages.length}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">
                Stages Complete
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-500">Interview Progress</span>
              <span className="font-medium">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </div>
        
        <div className="p-5">
          <StageTimeline 
            stages={application.stages} 
            currentIndex={application.currentStageIndex} 
          />
          
          {currentStage && currentStage.status !== 'completed' && (
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Ready for the next stage?
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                      {currentStage.stageName} Interview
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => onStartInterview(currentStage)}
                  className="w-full"
                  data-testid={`button-start-interview-${currentStage.id}`}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Practice This Interview
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
          
          {application.status === 'offer' && (
            <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-green-500" />
                <div>
                  <h4 className="font-semibold text-green-700 dark:text-green-400">
                    Congratulations! You received an offer!
                  </h4>
                  <p className="text-sm text-green-600 dark:text-green-500 mt-0.5">
                    Continue to negotiation to maximize your compensation
                  </p>
                </div>
                <Button 
                  onClick={() => navigate('/negotiation')}
                  className="ml-auto bg-green-600 hover:bg-green-700 text-white"
                  data-testid={`button-start-negotiation-${application.id}`}
                >
                  Practice Negotiation
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  const [, navigate] = useLocation();
  
  return (
    <Card className="p-8">
      <div className="text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <Rocket className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="font-semibold text-xl text-gray-900 dark:text-white mb-2">
          Start Your Job Journey
        </h3>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          Browse job listings, apply to positions, and practice your interviews with our AI-powered simulators.
        </p>
        <Button onClick={() => navigate('/jobs')} size="lg" data-testid="button-browse-jobs">
          <Briefcase className="h-5 w-5 mr-2" />
          Browse Job Listings
        </Button>
      </div>
    </Card>
  );
}

function JourneyStats({ applications }: { applications: JobApplication[] }) {
  const stats = {
    totalApplications: applications.length,
    interviewing: applications.filter(a => a.status === 'interviewing' || a.status === 'submitted').length,
    offers: applications.filter(a => a.status === 'offer').length,
    interviewsCompleted: applications.reduce((acc, app) => 
      acc + app.stages.filter(s => s.status === 'completed').length, 0
    ),
  };
  
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.totalApplications}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Applications</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.interviewing}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">In Progress</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Video className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.interviewsCompleted}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Interviews Done</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.offers}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Offers</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Journey() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const { data: user } = useQuery<{ id: number }>({
    queryKey: ['/api/user'],
  });

  const { data: applications, isLoading } = useQuery<JobApplication[]>({
    queryKey: [user?.id ? `/api/users/${user.id}/applications` : null],
    enabled: !!user?.id,
  });

  const getMostPromisingApplication = (): JobApplication | null => {
    if (!applications || applications.length === 0) return null;
    return applications.reduce((best, current) => {
      const currentProgress = current.currentStageIndex / current.stages.length;
      const bestProgress = best.currentStageIndex / best.stages.length;
      
      if (current.status === 'offer' && best.status !== 'offer') return current;
      if (best.status === 'offer' && current.status !== 'offer') return best;
      if (currentProgress > bestProgress) return current;
      return best;
    });
  };

  const mostPromising = getMostPromisingApplication();

  const handleStartInterview = (stage: ApplicationStage) => {
    const stageTypeToInterviewType: Record<string, string> = {
      recruiter_call: 'behavioral',
      behavioral: 'behavioral',
      technical: 'technical',
      case_study: 'case_study',
      portfolio: 'behavioral',
    };
    
    const interviewType = stageTypeToInterviewType[stage.stageType] || 'behavioral';
    
    navigate(`/interview?stageId=${stage.id}&type=${interviewType}`);
  };

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Job Journey</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Track your applications and progress through interview stages
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-10 w-10 rounded-lg mb-2" />
                  <Skeleton className="h-6 w-12 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-2 w-full mt-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : !applications || applications.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <JourneyStats applications={applications} />
          
          <div className="space-y-4">
            {applications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                onStartInterview={handleStartInterview}
                isMostPromising={mostPromising?.id === application.id}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
