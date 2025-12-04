import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Rocket, 
  Users, 
  Clock, 
  Play, 
  RotateCcw, 
  ChevronRight,
  Calendar,
  CheckCircle2,
  Circle,
  Lock,
  Briefcase,
  ArrowRight,
  Building2
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import InternOnboardingSession from "@/components/simulation/intern-onboarding-session";

export default function WorkspaceJourney() {
  const [, navigate] = useLocation();
  const [activeSession, setActiveSession] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [sessionToRestart, setSessionToRestart] = useState<any>(null);

  const { data: user } = useQuery({
    queryKey: ['/api/user'],
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/workspace/projects'],
  });

  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: [`/api/workspace/progress/${(user as any)?.id}/journey`],
    enabled: !!(user as any)?.id,
  });

  // Fetch user's accepted job applications to gate workspace access
  const { data: applications = [], isLoading: applicationsLoading } = useQuery<any[]>({
    queryKey: [`/api/users/${(user as any)?.id}/applications`],
    enabled: !!(user as any)?.id,
  });

  // Filter to only accepted applications
  const acceptedApplications = applications.filter((app: any) => app.status === 'accepted');

  // Fetch user's active workspace instances
  const { data: activeWorkspaces = [], isLoading: workspacesLoading } = useQuery<any[]>({
    queryKey: [`/api/users/${(user as any)?.id}/workspaces`],
    enabled: !!(user as any)?.id,
  });

  const createSessionMutation = useMutation({
    mutationFn: async (config: any) => {
      const response = await apiRequest("POST", "/api/sessions", config);
      return response.json();
    },
    onSuccess: () => {
      // Don't set activeSession here - let handleStartJourney do it after progress is created
      queryClient.invalidateQueries({ 
        predicate: (query) => (query.queryKey[0] as string)?.startsWith('/api/workspace/progress')
      });
    },
  });

  const restartSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await apiRequest("POST", `/api/workspace/progress/${sessionId}/restart`);
      return response.json();
    },
    onSuccess: (session) => {
      setActiveSession(session);
      setShowRestartDialog(false);
      setSessionToRestart(null);
      queryClient.invalidateQueries({ 
        predicate: (query) => (query.queryKey[0] as string)?.startsWith('/api/workspace/progress')
      });
    },
  });

  const handleStartJourney = async (project: any) => {
    if (!user) return;

    // Check if there's already an existing journey for this project
    const existingProgress = Array.isArray(progressData) 
      ? progressData.find((p: any) => 
          p.projectId === project.id && 
          p.mode === 'journey' &&
          p.status === 'in_progress'
        )
      : null;

    if (existingProgress) {
      // Resume existing journey instead of creating a new one
      handleResumeSession(existingProgress, project);
      return;
    }

    const session = await createSessionMutation.mutateAsync({
      userId: (user as any).id,
      type: 'workspace',
      status: 'active',
      configuration: {
        projectId: project.id,
        projectName: project.name,
        projectCategory: project.category,
        projectDescription: project.description,
        activeRole: 'Developer',
        sprintPhase: 'onboarding',
        teamMembers: project.teamStructure,
        duration: project.estimatedDuration,
        requirements: project.requirements,
        scenarioScript: project.scenarioScript,
        mode: 'journey'
      },
      messages: []
    });
    
    // Save initial progress record BEFORE setting activeSession
    // This ensures the component receives savedProgressId at mount time
    try {
      const progressResponse = await apiRequest("POST", "/api/workspace/progress", {
        sessionId: session.id,
        userId: (user as any).id,
        projectId: project.id,
        role: 'Developer',
        mode: 'journey',
        currentDay: 1,
        dayProgress: {},
        overallProgress: 0,
        status: 'in_progress'
      });
      const savedProgress = await progressResponse.json();
      
      // Set project first, then activeSession with savedProgressId included
      setSelectedProject(project);
      setActiveSession({
        ...session,
        configuration: {
          ...session.configuration,
          savedProgressId: savedProgress.id
        }
      });
    } catch (error) {
      console.error('Failed to save initial progress:', error);
      // Still set the session even if progress save fails
      setSelectedProject(project);
      setActiveSession(session);
    }
  };

  const handleResumeSession = (progress: any, project: any) => {
    setSelectedProject(project);
    setActiveSession({
      id: progress.sessionId,
      configuration: {
        projectId: project.id,
        projectName: project.name,
        projectCategory: project.category,
        projectDescription: project.description,
        activeRole: progress.role,
        sprintPhase: 'onboarding',
        teamMembers: project.teamStructure,
        duration: project.estimatedDuration,
        requirements: project.requirements,
        scenarioScript: project.scenarioScript,
        mode: 'journey',
        savedProgress: progress.dayProgress,
        savedProgressId: progress.id,
        currentDay: progress.currentDay
      }
    });
  };

  const handleRestartClick = (progress: any) => {
    setSessionToRestart(progress);
    setShowRestartDialog(true);
  };

  const handleConfirmRestart = () => {
    if (sessionToRestart) {
      restartSessionMutation.mutate(sessionToRestart.sessionId);
    }
  };

  const handleSessionComplete = () => {
    setActiveSession(null);
    setSelectedProject(null);
    queryClient.invalidateQueries({ 
      predicate: (query) => (query.queryKey[0] as string)?.startsWith('/api/workspace/progress')
    });
  };

  const getDayStatus = (currentDay: number, dayNumber: number) => {
    if (dayNumber < currentDay) return 'completed';
    if (dayNumber === currentDay) return 'current';
    return 'locked';
  };

  if (activeSession) {
    const config = activeSession.configuration;
    const isInternOnboarding = config?.projectCategory === 'intern-onboarding' || 
                               selectedProject?.category === 'intern-onboarding';
    
    const projectData = selectedProject || {
      id: config?.projectId,
      name: config?.projectName,
      description: config?.projectDescription,
      category: config?.projectCategory,
      teamStructure: config?.teamMembers,
      estimatedDuration: config?.duration,
      requirements: config?.requirements || {},
      scenarioScript: config?.scenarioScript || {}
    };
    
    if (isInternOnboarding) {
      return (
        <InternOnboardingSession
          session={activeSession}
          project={projectData}
          onComplete={handleSessionComplete}
          mode="journey"
          savedProgress={config?.savedProgress}
          savedProgressId={config?.savedProgressId}
          initialDay={config?.currentDay}
          user={user}
        />
      );
    }
    
    return null;
  }

  const inProgressJourneys = Array.isArray(progressData) 
    ? progressData.filter((p: any) => p.mode === 'journey' && p.status === 'in_progress')
    : [];

  const journeyProjects = Array.isArray(projects) 
    ? projects.filter((p: any) => p.category === 'intern-onboarding')
    : [];

  // Filter active workspace instances (from job offers)
  const activeWorkspacesList = Array.isArray(activeWorkspaces) 
    ? activeWorkspaces.filter((w: any) => w.status === 'active')
    : [];

  if (workspacesLoading || applicationsLoading) {
    return (
      <div className="p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Rocket className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="text-workspace-journey-title">
              Workspace Journey
            </h1>
          </div>
          <p className="text-gray-600 mt-2">
            Experience the complete 5-day onboarding journey. One company, start to finish.
          </p>
        </div>

        {/* Active Workspaces from Accepted Job Offers */}
        {activeWorkspacesList.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Active Workspaces</h2>
            <div className="space-y-4">
              {activeWorkspacesList.map((workspace: any) => (
                <Card key={workspace.id} className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50" data-testid={`card-workspace-${workspace.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-xl bg-white border border-green-200 flex items-center justify-center">
                          <Building2 className="h-7 w-7 text-green-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">{workspace.companyName}</h3>
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {workspace.role} • {workspace.currentPhase.charAt(0).toUpperCase() + workspace.currentPhase.slice(1)} Phase
                          </p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => navigate(`/workspace/${workspace.id}`)}
                        className="gap-2"
                        data-testid={`button-enter-workspace-${workspace.id}`}
                      >
                        <Play className="h-4 w-4" />
                        Enter Workspace
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {inProgressJourneys.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Continue Your Journey</h2>
            <div className="space-y-4">
              {inProgressJourneys.map((progress: any) => {
                const project = journeyProjects.find((p: any) => p.id === progress.projectId);
                if (!project) return null;
                
                return (
                  <Card key={progress.id} className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                            <Badge className="bg-amber-100 text-amber-800">In Progress</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            Day {progress.currentDay} of 5 • {progress.role}
                          </p>
                          <div className="flex items-center gap-4">
                            <div className="flex-1 max-w-xs">
                              <Progress value={progress.overallProgress} className="h-2" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {progress.overallProgress}% complete
                            </span>
                          </div>
                          <div className="flex gap-5 mt-4">
                            {[1, 2, 3, 4, 5].map((day) => {
                              const status = getDayStatus(progress.currentDay, day);
                              return (
                                <div key={day} className="flex items-center gap-1.5">
                                  {status === 'completed' ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  ) : status === 'current' ? (
                                    <div className="h-4 w-4 rounded-full border-2 border-blue-600 bg-blue-100" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-gray-300" />
                                  )}
                                  <span className={`text-xs ${status === 'current' ? 'text-blue-600 font-medium' : status === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                                    Day {day}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestartClick(progress)}
                            data-testid={`button-restart-${progress.id}`}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Start Over
                          </Button>
                          <Button
                            onClick={() => handleResumeSession(progress, project)}
                            data-testid={`button-resume-${progress.id}`}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Continue Day {progress.currentDay}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Only show "Start a New Journey" section if no active journeys - Journey mode is one company at a time */}
        {inProgressJourneys.length === 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Choose Your Journey
            </h2>
          
            {projectsLoading || applicationsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading journeys...</p>
            </div>
          ) : acceptedApplications.length === 0 ? (
            // No accepted offers - show locked state with guidance
            <Card className="border-gray-200 bg-gray-50">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Lock className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Complete Your Job Journey First
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    The Workspace Journey unlocks after you've successfully completed the interview process and accepted a job offer.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600">1</span>
                      </div>
                      <span>Apply for jobs</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300 hidden sm:block" />
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600">2</span>
                      </div>
                      <span>Pass interviews</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300 hidden sm:block" />
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600">3</span>
                      </div>
                      <span>Accept offer</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300 hidden sm:block" />
                    <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                      <span>Start onboarding</span>
                    </div>
                  </div>
                  
                  <Button onClick={() => navigate('/jobs')} data-testid="button-go-to-jobs">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Browse Job Openings
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {journeyProjects.map((project: any) => {
                const hasActiveJourney = inProgressJourneys.some((p: any) => p.projectId === project.id);
                // Check if user has an accepted offer that matches this project's company
                // For NovaPay projects, check if any accepted application is for NovaPay
                const projectCompanyName = project.name.toLowerCase();
                const hasMatchingOffer = acceptedApplications.some((app: any) => 
                  app.job?.company?.name?.toLowerCase().includes('novapay') && projectCompanyName.includes('novapay')
                );
                
                if (!hasMatchingOffer) return null;
                
                return (
                  <Card 
                    key={project.id} 
                    className={`transition-all ${hasActiveJourney ? 'opacity-60' : 'hover:shadow-lg cursor-pointer'}`}
                    data-testid={`card-journey-${project.id}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-6">
                        <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                          <Users className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900 mb-1">{project.name}</h3>
                              <p className="text-gray-600 mb-4">{project.description}</p>
                            </div>
                            <Badge className="bg-blue-100 text-blue-800">
                              {project.difficulty}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>5 Days</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>~{project.estimatedDuration} min total</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span>{project.teamStructure?.length || 0} team members</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-sm font-medium text-gray-700">Role:</span>
                            <Badge variant="outline">Developer</Badge>
                          </div>

                          {!hasActiveJourney && (
                            <Button 
                              onClick={() => handleStartJourney(project)}
                              disabled={createSessionMutation.isPending}
                              data-testid={`button-start-journey-${project.id}`}
                            >
                              {createSessionMutation.isPending ? (
                                'Starting...'
                              ) : (
                                <>
                                  Start Journey
                                  <ChevronRight className="h-4 w-4 ml-2" />
                                </>
                              )}
                            </Button>
                          )}
                          
                          {hasActiveJourney && (
                            <p className="text-sm text-amber-600 font-medium">
                              You have an active journey for this project. Continue or restart above.
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {journeyProjects.length === 0 && !projectsLoading && (
                <Card className="p-12 text-center">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Rocket className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Journeys Available</h3>
                  <p className="text-gray-600">Check back soon for new workspace journeys.</p>
                </Card>
              )}
            </div>
          )}
          </div>
        )}
      </div>

      <AlertDialog open={showRestartDialog} onOpenChange={setShowRestartDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Over?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all your progress for this journey. You'll start from Day 1 again. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRestart}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, Start Over
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
