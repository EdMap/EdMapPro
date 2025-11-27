import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Search, Briefcase, MessageCircle, Handshake, Users, Check, Lock, 
  ChevronRight, Zap, Target, TrendingUp, Flame, Star
} from "lucide-react";

interface JobApplication {
  id: number;
  status: string;
  currentStageIndex: number;
  appliedAt?: string | null;
  stages: { status: string; score?: number | null; completedAt?: string | null }[];
}

interface Phase {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  status: "completed" | "active" | "locked";
  progress: number;
  stats: { label: string; value: string | number }[];
  href?: string;
  action?: string;
}

export default function JourneyMap() {
  const [, navigate] = useLocation();

  const { data: user } = useQuery<{ id: number }>({
    queryKey: ["/api/user"],
  });

  const { data: applications = [] } = useQuery<JobApplication[]>({
    queryKey: [user?.id ? `/api/users/${user.id}/applications` : null],
    enabled: !!user?.id,
  });

  // Calculate phase statuses
  const totalApplications = applications.length;
  const applicationsInProgress = applications.filter(
    a => a.status === "submitted" || a.status === "interviewing"
  ).length;
  const applicationsWithOffers = applications.filter(a => a.status === "offer").length;
  const totalInterviewsCompleted = applications.reduce(
    (acc, app) => acc + app.stages.filter(s => s.status === "completed").length,
    0
  );

  // Calculate streak (simulated based on completed stages)
  const calculateStreak = () => {
    if (totalInterviewsCompleted === 0) return 0;
    // Mock: assume 1 interview per day in the past week if they have completed interviews
    return Math.min(totalInterviewsCompleted, 7);
  };

  // Calculate performance insights
  const calculatePerformance = () => {
    const completedStages = applications.flatMap(app => 
      app.stages.filter(s => s.status === "completed" && s.score !== null)
    );
    
    if (completedStages.length === 0) {
      return {
        averageScore: 0,
        completionRate: 0,
        topStrength: "Keep practicing!",
        improvementArea: "All areas"
      };
    }

    const scores = completedStages.map(s => s.score as number);
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const completionRate = Math.round((totalInterviewsCompleted / (totalApplications * 3 + 1)) * 100);

    const scoreDistribution = {
      excellent: scores.filter(s => s >= 80).length,
      good: scores.filter(s => s >= 70 && s < 80).length,
      needsWork: scores.filter(s => s < 70).length,
    };

    return {
      averageScore,
      completionRate,
      topStrength: scoreDistribution.excellent > 0 ? "Strong Technical Skills" : "Consistent Progress",
      improvementArea: scoreDistribution.needsWork > 0 ? "Communication" : "System Design"
    };
  };

  const performance = calculatePerformance();
  const streak = calculateStreak();

  // Determine phase statuses
  const getPhaseStatus = (phaseId: string): "completed" | "active" | "locked" => {
    switch (phaseId) {
      case "job-search":
        return totalApplications > 0 ? "active" : "active";
      case "interview":
        return applicationsInProgress > 0 ? "active" : totalApplications > 0 ? "completed" : "locked";
      case "negotiations":
        return applicationsWithOffers > 0 ? "active" : "locked";
      case "workspace":
        return "locked";
      default:
        return "locked";
    }
  };

  const phases: Phase[] = [
    {
      id: "job-search",
      title: "Job Search",
      description: "Explore opportunities and submit applications",
      icon: <Search className="h-8 w-8" />,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      status: getPhaseStatus("job-search"),
      progress: totalApplications > 0 ? 100 : 0,
      stats: [
        { label: "Applications", value: totalApplications },
        { label: "Status", value: totalApplications > 0 ? "Active" : "Ready to Start" },
      ],
      href: "/jobs",
      action: "Browse Jobs",
    },
    {
      id: "interview",
      title: "Interview",
      description: "Practice and complete interview stages",
      icon: <MessageCircle className="h-8 w-8" />,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
      status: getPhaseStatus("interview"),
      progress: totalApplications > 0 
        ? Math.round((totalInterviewsCompleted / (totalApplications * 3)) * 100)
        : 0,
      stats: [
        { label: "In Progress", value: applicationsInProgress },
        { label: "Completed", value: totalInterviewsCompleted },
      ],
      href: "/journey",
      action: "View Details",
    },
    {
      id: "negotiations",
      title: "Negotiations",
      description: "Negotiate offers and maximize compensation",
      icon: <Handshake className="h-8 w-8" />,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
      status: getPhaseStatus("negotiations"),
      progress: applicationsWithOffers > 0 ? 50 : 0,
      stats: [
        { label: "Offers Received", value: applicationsWithOffers },
        { label: "Status", value: applicationsWithOffers > 0 ? "Ready" : "Awaiting Offers" },
      ],
      href: getPhaseStatus("negotiations") !== "locked" ? "/negotiation" : undefined,
      action: getPhaseStatus("negotiations") !== "locked" ? "Start" : "Unlock",
    },
    {
      id: "workspace",
      title: "Workspace",
      description: "Onboard and practice in a virtual team environment",
      icon: <Users className="h-8 w-8" />,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
      status: getPhaseStatus("workspace"),
      progress: 0,
      stats: [
        { label: "Readiness", value: "Coming Soon" },
        { label: "Status", value: "Awaiting Offer" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Your Job Journey
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Navigate through the four phases of your professional journey
          </p>
        </div>

        {/* First-Time User Onboarding */}
        {totalApplications === 0 && (
          <div className="mb-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Search className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Ready to start your job journey?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Begin by exploring opportunities that match your career goals. Apply to 2-3 positions to get started with interviews and build your skills.
                </p>
                <Button 
                  onClick={() => navigate('/jobs')}
                  data-testid="button-onboarding-browse"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Browse Job Listings
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Streak & Performance Highlight */}
        {totalInterviewsCompleted > 0 && (
          <div className="mb-12 p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg border border-orange-200 dark:border-orange-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Flame className="h-6 w-6 text-orange-500" />
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {streak}-Day Streak! 🔥
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  You completed {totalInterviewsCompleted} interviews
                </div>
              </div>
            </div>
            <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
              Keep it up!
            </Badge>
          </div>
        )}

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalApplications}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    Applications
                  </div>
                </div>
                <Briefcase className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {applicationsInProgress}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    In Progress
                  </div>
                </div>
                <Zap className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalInterviewsCompleted}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    Interviews Done
                  </div>
                </div>
                <Check className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {applicationsWithOffers}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    Offers
                  </div>
                </div>
                <Target className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Insights Card */}
        {totalInterviewsCompleted > 0 && (
          <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                      Average Score
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {performance.averageScore}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Star className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                      Strength
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {performance.topStrength}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                    <Target className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                      Focus Area
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {performance.improvementArea}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Phase Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {phases.map((phase) => (
            <Card key={phase.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                {/* Header with gradient */}
                <div className={`bg-gradient-to-r ${phase.color} p-6 text-white relative overflow-hidden`}>
                  <div className="absolute -right-8 -top-8 opacity-10">
                    <div className="text-8xl">{phase.icon}</div>
                  </div>
                  <div className="relative z-10 flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-white/20 rounded-lg">
                        {phase.icon}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">{phase.title}</h3>
                        <p className="text-sm text-white/80 mt-1">{phase.description}</p>
                      </div>
                    </div>
                    <div>
                      {phase.status === "completed" && (
                        <Badge className="bg-white/30 text-white border-white/50">
                          <Check className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                      {phase.status === "active" && (
                        <Badge className="bg-white/30 text-white border-white/50">
                          <Zap className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                      {phase.status === "locked" && (
                        <Badge variant="outline" className="bg-white/10 text-white border-white/50">
                          <Lock className="h-3 w-3 mr-1" />
                          Locked
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Progress
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {phase.progress}%
                      </span>
                    </div>
                    <Progress value={phase.progress} className="h-2" />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {phase.stats.map((stat, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">
                          {stat.label}
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                          {stat.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={() => {
                      if (phase.href) {
                        navigate(phase.href);
                      }
                    }}
                    disabled={phase.status === "locked" && !phase.href}
                    className="w-full"
                    variant={phase.status === "locked" ? "outline" : "default"}
                    data-testid={`button-${phase.id}`}
                  >
                    {phase.action || "View"} 
                    {phase.status !== "locked" && <ChevronRight className="h-4 w-4 ml-2" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
