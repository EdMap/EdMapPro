import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Target, 
  Users, 
  Clock, 
  Play, 
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Code,
  FileText,
  GitBranch,
  MessageSquare,
  Lock,
  CheckCircle2,
  Building2,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import InternOnboardingSession from "@/components/simulation/intern-onboarding-session";

type WizardStep = 'project' | 'role' | 'scenario';

interface Scenario {
  id: string;
  day: number;
  title: string;
  description: string;
  skills: string[];
  duration: string;
  icon: any;
  available: boolean;
  prerequisite?: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'day-1',
    day: 1,
    title: 'Day 1: Onboarding',
    description: 'Meet your team, read project docs, and have your first check-in',
    skills: ['Team Communication', 'Documentation', 'Active Listening'],
    duration: '~45 min',
    icon: Users,
    available: true
  },
  {
    id: 'day-2',
    day: 2,
    title: 'Day 2: First Ticket',
    description: 'Fix your first bug, learn Git workflow, and submit a PR',
    skills: ['Git', 'Code Review', 'Problem Solving'],
    duration: '~30 min',
    icon: GitBranch,
    available: true
  },
  {
    id: 'day-3',
    day: 3,
    title: 'Day 3: Code Review',
    description: 'Respond to PR feedback and revise your code',
    skills: ['Code Quality', 'Feedback', 'Iteration'],
    duration: '~25 min',
    icon: Code,
    available: false,
    prerequisite: 'Complete Day 2 first'
  },
  {
    id: 'day-4',
    day: 4,
    title: 'Day 4: Documentation',
    description: 'Write a README section and receive feedback',
    skills: ['Technical Writing', 'Documentation', 'Clarity'],
    duration: '~20 min',
    icon: FileText,
    available: false,
    prerequisite: 'Complete Day 3 first'
  },
  {
    id: 'day-5',
    day: 5,
    title: 'Day 5: Bug Fix & Wrap-up',
    description: 'Fix an edge case bug and complete your final evaluation',
    skills: ['Debugging', 'Testing', 'Self-Reflection'],
    duration: '~30 min',
    icon: MessageSquare,
    available: false,
    prerequisite: 'Complete Day 4 first'
  }
];

export default function WorkspacePractice() {
  const [activeSession, setActiveSession] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [wizardStep, setWizardStep] = useState<WizardStep>('project');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);

  const { data: user } = useQuery({
    queryKey: ['/api/user'],
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/workspace/projects'],
  });

  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: [`/api/workspace/progress/${(user as any)?.id}/practice`],
    enabled: !!(user as any)?.id,
  });

  const createSessionMutation = useMutation({
    mutationFn: async (config: any) => {
      const response = await apiRequest("POST", "/api/sessions", config);
      return response.json();
    },
    onSuccess: (session) => {
      setActiveSession(session);
      queryClient.invalidateQueries({ 
        predicate: (query) => (query.queryKey[0] as string)?.startsWith('/api/workspace/progress')
      });
    },
  });

  const handleSelectProject = (project: any) => {
    setSelectedProject(project);
    setWizardStep('role');
  };

  const handleSelectRole = (role: string) => {
    setSelectedRole(role);
    setWizardStep('scenario');
  };

  const handleSelectScenario = (scenario: Scenario) => {
    if (!scenario.available) return;
    setSelectedScenario(scenario);
  };

  const handleStartPractice = async () => {
    if (!selectedProject || !selectedRole || !selectedScenario || !user) return;

    const session = await createSessionMutation.mutateAsync({
      userId: (user as any).id,
      type: 'workspace',
      status: 'active',
      configuration: {
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        projectCategory: selectedProject.category,
        projectDescription: selectedProject.description,
        activeRole: selectedRole,
        sprintPhase: 'onboarding',
        teamMembers: selectedProject.teamStructure,
        duration: selectedProject.estimatedDuration,
        requirements: selectedProject.requirements,
        scenarioScript: selectedProject.scenarioScript,
        mode: 'practice',
        scenarioId: selectedScenario.id,
        startDay: selectedScenario.day
      },
      messages: []
    });

    // Save initial progress record immediately so session appears in "My Practice Sessions"
    try {
      const progressResponse = await apiRequest("POST", "/api/workspace/progress", {
        sessionId: session.id,
        userId: (user as any).id,
        projectId: selectedProject.id,
        role: selectedRole,
        mode: 'practice',
        currentDay: selectedScenario.day,
        scenarioId: selectedScenario.id,
        dayProgress: {},
        overallProgress: 0,
        status: 'in_progress'
      });
      const progressData = await progressResponse.json();
      
      // Update active session with saved progress ID
      setActiveSession({
        ...session,
        configuration: {
          ...session.configuration,
          savedProgressId: progressData.id
        }
      });
    } catch (error) {
      console.error('Failed to save initial progress:', error);
    }
  };

  const handleResumePractice = (progress: any, project: any) => {
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
        mode: 'practice',
        scenarioId: progress.scenarioId,
        savedProgress: progress.dayProgress,
        savedProgressId: progress.id,
        currentDay: progress.currentDay
      }
    });
  };

  const handleSessionComplete = () => {
    setActiveSession(null);
    setSelectedProject(null);
    setSelectedRole('');
    setSelectedScenario(null);
    setWizardStep('project');
    queryClient.invalidateQueries({ 
      predicate: (query) => (query.queryKey[0] as string)?.startsWith('/api/workspace/progress')
    });
  };

  const handleBack = () => {
    if (wizardStep === 'role') {
      setWizardStep('project');
      setSelectedProject(null);
    } else if (wizardStep === 'scenario') {
      setWizardStep('role');
      setSelectedRole('');
    }
  };

  if (activeSession) {
    const config = activeSession.configuration;
    const isInternOnboarding = config?.projectCategory === 'intern-onboarding';
    
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
          mode="practice"
          savedProgress={config?.savedProgress}
          savedProgressId={config?.savedProgressId}
          initialDay={config?.currentDay || config?.startDay}
        />
      );
    }
    
    return null;
  }

  const practiceProjects = Array.isArray(projects) 
    ? projects.filter((p: any) => p.category === 'intern-onboarding')
    : [];

  const practiceSessions = Array.isArray(progressData) 
    ? progressData.filter((p: any) => p.mode === 'practice')
    : [];

  const inProgressSessions = practiceSessions.filter((p: any) => p.status === 'in_progress');
  const completedSessions = practiceSessions.filter((p: any) => p.status === 'completed');

  const availableRoles = [
    { name: 'Developer', available: true, description: 'Write code, fix bugs, and collaborate with your team' },
    { name: 'Product Manager', available: false, description: 'Coming soon' },
    { name: 'Designer', available: false, description: 'Coming soon' }
  ];

  const renderWizardSteps = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-2 ${wizardStep === 'project' ? 'text-teal-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            wizardStep === 'project' ? 'bg-teal-600 text-white' : 
            selectedProject ? 'bg-teal-100 text-teal-600 border border-teal-600' : 'bg-gray-200 text-gray-500'
          }`}>
            {selectedProject ? '✓' : '1'}
          </div>
          <span className="font-medium">Project</span>
        </div>
        
        <div className="w-12 h-0.5 bg-gray-200" />
        
        <div className={`flex items-center gap-2 ${wizardStep === 'role' ? 'text-teal-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            wizardStep === 'role' ? 'bg-teal-600 text-white' : 
            selectedRole ? 'bg-teal-100 text-teal-600 border border-teal-600' : 'bg-gray-200 text-gray-500'
          }`}>
            {selectedRole ? '✓' : '2'}
          </div>
          <span className="font-medium">Role</span>
        </div>
        
        <div className="w-12 h-0.5 bg-gray-200" />
        
        <div className={`flex items-center gap-2 ${wizardStep === 'scenario' ? 'text-teal-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            wizardStep === 'scenario' ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            3
          </div>
          <span className="font-medium">Scenario</span>
        </div>
      </div>
    </div>
  );

  const renderProjectStep = () => (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Select a Project</h2>
      {projectsLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {practiceProjects.map((project: any) => (
            <Card 
              key={project.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedProject?.id === project.id ? 'ring-2 ring-teal-500 shadow-lg bg-teal-50/30' : ''
              }`}
              onClick={() => handleSelectProject(project)}
              data-testid={`card-practice-project-${project.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-teal-100 rounded-xl">
                    <Building2 className="h-6 w-6 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      <Badge className="bg-blue-100 text-blue-800">{project.difficulty}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {project.teamStructure?.length || 0} team
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        5 days
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {practiceProjects.length === 0 && (
            <Card className="col-span-2 p-8 text-center">
              <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">No Projects Available</h3>
              <p className="text-gray-600">Check back soon for practice projects.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );

  const renderRoleStep = () => (
    <div>
      <Button variant="ghost" size="sm" onClick={handleBack} className="mb-4">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back
      </Button>
      
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Select Your Role</h2>
      <p className="text-gray-600 mb-4">For: {selectedProject?.name}</p>
      
      <div className="grid md:grid-cols-3 gap-4">
        {availableRoles.map((role) => (
          <Card 
            key={role.name}
            className={`transition-all ${
              role.available 
                ? `cursor-pointer hover:shadow-lg ${selectedRole === role.name ? 'ring-2 ring-teal-500 shadow-lg bg-teal-50/30' : ''}`
                : 'opacity-50 cursor-not-allowed'
            }`}
            onClick={() => role.available && handleSelectRole(role.name)}
            data-testid={`card-practice-role-${role.name.toLowerCase().replace(' ', '-')}`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <Code className="h-5 w-5 text-teal-600" />
                </div>
                {!role.available && (
                  <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{role.name}</h3>
              <p className="text-sm text-gray-600">{role.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderScenarioStep = () => (
    <div>
      <Button variant="ghost" size="sm" onClick={handleBack} className="mb-4">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back
      </Button>
      
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Select a Scenario</h2>
      <p className="text-gray-600 mb-4">{selectedProject?.name} • {selectedRole}</p>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {SCENARIOS.map((scenario) => {
          const Icon = scenario.icon;
          return (
            <Card 
              key={scenario.id}
              className={`transition-all ${
                scenario.available 
                  ? `cursor-pointer hover:shadow-lg ${selectedScenario?.id === scenario.id ? 'ring-2 ring-teal-500 shadow-lg bg-teal-50/30' : ''}`
                  : 'opacity-60 cursor-not-allowed relative'
              }`}
              onClick={() => handleSelectScenario(scenario)}
              data-testid={`card-practice-scenario-${scenario.id}`}
            >
              {!scenario.available && (
                <div className="absolute inset-0 bg-gray-100/50 rounded-lg flex items-center justify-center z-10">
                  <div className="text-center p-4">
                    <Lock className="h-5 w-5 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">{scenario.prerequisite}</p>
                  </div>
                </div>
              )}
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${scenario.available ? 'bg-teal-100' : 'bg-gray-100'}`}>
                    <Icon className={`h-5 w-5 ${scenario.available ? 'text-teal-600' : 'text-gray-400'}`} />
                  </div>
                  <Badge variant="outline" className="text-xs">{scenario.duration}</Badge>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{scenario.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
                <div className="flex flex-wrap gap-1">
                  {scenario.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs bg-gray-100">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedScenario && (
        <div className="flex justify-end">
          <Button 
            onClick={handleStartPractice}
            disabled={createSessionMutation.isPending}
            className="bg-teal-600 hover:bg-teal-700"
            data-testid="button-start-practice"
          >
            {createSessionMutation.isPending ? 'Starting...' : (
              <>
                Start Practice
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Target className="h-6 w-6 text-teal-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="text-workspace-practice-title">
              Workspace Practice
            </h1>
          </div>
          <p className="text-gray-600 mt-2">
            Pick any day, any company. Build specific skills without completing the full journey.
          </p>
        </div>

        {inProgressSessions.length > 0 && wizardStep === 'project' && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">My Practice Workspaces</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {inProgressSessions.map((progress: any) => {
                const project = practiceProjects.find((p: any) => p.id === progress.projectId);
                if (!project) return null;
                const scenario = SCENARIOS.find(s => s.id === progress.scenarioId);
                
                return (
                  <Card key={progress.id} className="border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{project.name}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600">{progress.role}</span>
                          </div>
                          <h3 className="font-semibold text-gray-900">{scenario?.title || `Day ${progress.currentDay}`}</h3>
                        </div>
                        <Badge className="bg-amber-100 text-amber-800">In Progress</Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 mb-4">
                        <Progress value={progress.overallProgress} className="flex-1 h-2" />
                        <span className="text-sm text-gray-600">{progress.overallProgress}%</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Started {new Date(progress.startedAt).toLocaleDateString()}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleResumePractice(progress, project)}
                            className="bg-teal-600 hover:bg-teal-700"
                            data-testid={`button-resume-practice-${progress.id}`}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Resume
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Restart
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {completedSessions.length > 0 && wizardStep === 'project' && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Completed Practice Sessions</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedSessions.slice(0, 6).map((progress: any) => {
                const project = practiceProjects.find((p: any) => p.id === progress.projectId);
                if (!project) return null;
                const scenario = SCENARIOS.find(s => s.id === progress.scenarioId);
                
                return (
                  <Card key={progress.id} className="bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-xs text-gray-500">{project.name} • {progress.role}</p>
                          <h3 className="font-medium text-gray-900">{scenario?.title || `Day ${progress.currentDay}`}</h3>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          {progress.score && (
                            <span className="text-sm font-medium text-green-600">{progress.score}%</span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Completed {progress.completedAt ? new Date(progress.completedAt).toLocaleDateString() : 'recently'}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        <Card className="p-6">
          {renderWizardSteps()}
          
          {wizardStep === 'project' && renderProjectStep()}
          {wizardStep === 'role' && renderRoleStep()}
          {wizardStep === 'scenario' && renderScenarioStep()}
        </Card>
      </div>
    </div>
  );
}
