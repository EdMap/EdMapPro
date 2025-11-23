import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Briefcase, Users, Target, Clock, Code, Palette, TestTube, Server, Wrench, ChevronRight, CheckCircle2, Info, AlertCircle } from "lucide-react";
import WorkspaceSession from "@/components/simulation/workspace-session";
import WorkspaceDashboard from "@/components/simulation/workspace-dashboard";
import EnterpriseFeatureSession from "@/components/simulation/enterprise-feature-session";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

const ROLE_DETAILS: Record<string, {
  keyTasks: string[];
  sampleScenarios: string[];
  skills: string[];
  estimatedTime: string;
}> = {
  'Developer': {
    keyTasks: [
      'Review existing codebase and architecture',
      'Write clean, maintainable code for new features',
      'Participate in code reviews with teammates',
      'Debug issues and optimize performance',
      'Collaborate with designers and PMs on technical feasibility'
    ],
    sampleScenarios: [
      'Claire asks you to review the technical approach for the heatmap API',
      'Ravi shares a code snippet and asks for your feedback on the data aggregation logic',
      'Elena reports a bug in your recent commit - you need to debug and fix it'
    ],
    skills: ['Problem-solving', 'Code quality', 'Technical communication', 'Collaboration'],
    estimatedTime: '30-45 min'
  },
  'Product Manager': {
    keyTasks: [
      'Review business requirements and stakeholder needs',
      'Define clear feature specifications and acceptance criteria',
      'Prioritize work and manage trade-offs',
      'Communicate with stakeholders and team members',
      'Make decisions about scope and timeline'
    ],
    sampleScenarios: [
      'Engineering team asks you to clarify ambiguous requirements',
      'Stakeholder requests a feature change that impacts the timeline',
      'Designer needs your input on which user flow to prioritize'
    ],
    skills: ['Strategic thinking', 'Stakeholder management', 'Prioritization', 'Clear communication'],
    estimatedTime: '25-40 min'
  },
  'Designer': {
    keyTasks: [
      'Understand user needs and business requirements',
      'Create intuitive, accessible interface designs',
      'Maintain design consistency with existing patterns',
      'Collaborate with developers on implementation',
      'Iterate based on feedback from team and stakeholders'
    ],
    sampleScenarios: [
      'PM asks you to design a complex data visualization',
      'Developer questions the feasibility of your design approach',
      'QA finds accessibility issues in your mockups'
    ],
    skills: ['Visual design', 'User empathy', 'Design systems', 'Feedback integration'],
    estimatedTime: '30-45 min'
  },
  'QA Engineer': {
    keyTasks: [
      'Create comprehensive test plans and test cases',
      'Execute manual and automated testing',
      'Identify, document, and report bugs clearly',
      'Verify bug fixes and regression test',
      'Ensure quality standards are met before release'
    ],
    sampleScenarios: [
      'New feature is ready for testing - you need to create a test plan',
      'You discover a critical bug that could block the release',
      'Developer asks you to verify their bug fix'
    ],
    skills: ['Attention to detail', 'Testing methodologies', 'Bug reporting', 'Quality advocacy'],
    estimatedTime: '25-40 min'
  },
  'DevOps Engineer': {
    keyTasks: [
      'Configure deployment pipelines and infrastructure',
      'Monitor system performance and reliability',
      'Automate repetitive operations tasks',
      'Ensure security and compliance standards',
      'Support team with technical infrastructure needs'
    ],
    sampleScenarios: [
      'Team needs a new staging environment for the heatmap feature',
      'Production monitoring shows performance degradation',
      'Developer needs help debugging a deployment issue'
    ],
    skills: ['Infrastructure', 'Automation', 'Problem-solving', 'Security awareness'],
    estimatedTime: '30-45 min'
  }
};

export default function WorkspaceSimulator() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [activeSession, setActiveSession] = useState<any>(null);
  const [expandedProject, setExpandedProject] = useState<number | null>(null);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/workspace/projects'],
  });

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['/api/workspace/roles'],
  });

  const { data: user } = useQuery({
    queryKey: ['/api/user'],
  });

  const createSessionMutation = useMutation({
    mutationFn: async (config: any) => {
      const response = await apiRequest("POST", "/api/sessions", config);
      return response.json();
    },
    onSuccess: (session) => {
      setActiveSession(session);
      setShowWelcomeModal(true);
      queryClient.invalidateQueries({ queryKey: ['/api/user/1/sessions'] });
    },
  });

  const handleStartSession = async () => {
    if (!selectedProject || !selectedRole || !user) return;

    await createSessionMutation.mutateAsync({
      userId: (user as any).id,
      type: 'workspace',
      status: 'active',
      configuration: {
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        activeRole: selectedRole,
        sprintPhase: 'onboarding',
        teamMembers: selectedProject.teamStructure,
        duration: selectedProject.estimatedDuration
      },
      messages: []
    });
  };

  const handleSessionComplete = () => {
    setActiveSession(null);
    setSelectedProject(null);
    setSelectedRole("");
    setCurrentStep(0);
    queryClient.invalidateQueries({ queryKey: ['/api/user/1/progress'] });
  };

  const handleProjectSelect = (project: any) => {
    setSelectedProject(project);
    setCurrentStep(1);
    setExpandedProject(null);
  };

  const handleRoleSelect = (roleName: string) => {
    setSelectedRole(roleName);
    setCurrentStep(2);
    setExpandedRole(null);
  };

  const getRoleIcon = (roleName: string) => {
    const icons: Record<string, any> = {
      'Developer': Code,
      'Product Manager': Briefcase,
      'Designer': Palette,
      'QA Engineer': TestTube,
      'DevOps Engineer': Server
    };
    return icons[roleName] || Wrench;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      'junior': 'bg-green-100 text-green-800',
      'mid': 'bg-yellow-100 text-yellow-800',
      'senior': 'bg-red-100 text-red-800'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  const getStepStatus = (step: number) => {
    if (step < currentStep) return 'complete';
    if (step === currentStep) return 'current';
    return 'upcoming';
  };

  if (activeSession) {
    const isEnterpriseFeature = activeSession.configuration?.projectName?.includes('PulseOps IQ');
    
    return (
      <>
        <Dialog open={showWelcomeModal} onOpenChange={setShowWelcomeModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">Welcome to Your Workspace Simulation!</DialogTitle>
              <DialogDescription className="text-base space-y-4 pt-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">Project: {selectedProject?.name}</h4>
                      <p className="text-sm text-blue-800">{selectedProject?.description}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Your Role: {selectedRole}</h4>
                  <p className="text-sm text-gray-600">
                    You'll be working with {selectedProject?.teamStructure?.length || 0} AI teammates who will respond realistically to your messages and actions.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <Target className="h-4 w-4 mr-2 text-gray-600" />
                    What to Do Now
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1 ml-6 list-disc">
                    <li>Check the <strong>"What to Do Now"</strong> panel for your current objectives</li>
                    {selectedRole === 'Product Manager' && (
                      <li>Review the <strong>Requirements</strong> tab to access PM documentation</li>
                    )}
                    {(selectedRole === 'Developer' || selectedRole === 'Designer') && (
                      <li>Explore the <strong>Codebase</strong> tab to understand the project structure</li>
                    )}
                    <li>Use the <strong>Chat</strong> tab to communicate with your team</li>
                    <li>Click team member names to send direct messages (DMs)</li>
                  </ul>
                </div>

                <div className="flex items-start space-x-2 text-sm text-gray-600 bg-amber-50 p-3 rounded border border-amber-200">
                  <Clock className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span>Estimated time: {selectedProject?.estimatedDuration || 30} minutes</span>
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end pt-4">
              <Button onClick={() => setShowWelcomeModal(false)} data-testid="button-start-working">
                Start Working
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {isEnterpriseFeature && selectedProject ? (
          <EnterpriseFeatureSession
            session={activeSession}
            project={selectedProject}
            onComplete={handleSessionComplete}
          />
        ) : (
          <WorkspaceSession session={activeSession} onComplete={handleSessionComplete} />
        )}
      </>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="text-workspace-title">Workspace Simulator</h1>
          <p className="text-gray-600 mt-2">
            Practice real workplace collaboration with AI teammates. Choose a project and role to begin your simulation.
          </p>
        </div>

        {currentStep === 0 && (
          <div className="mb-8">
            <WorkspaceDashboard
              userId={(user as any)?.id || 1}
              onResumeSession={(session) => setActiveSession(session)}
              onStartNew={() => {}}
            />
            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Start New Simulation</h2>
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {[
              { number: 1, label: 'Choose Project', icon: Target },
              { number: 2, label: 'Select Role', icon: Users },
              { number: 3, label: 'Confirm & Start', icon: CheckCircle2 }
            ].map((step, idx) => {
              const status = getStepStatus(idx);
              const Icon = step.icon;
              
              return (
                <div key={idx} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all
                      ${status === 'complete' ? 'bg-green-500 border-green-500 text-white' : ''}
                      ${status === 'current' ? 'bg-blue-500 border-blue-500 text-white' : ''}
                      ${status === 'upcoming' ? 'bg-gray-100 border-gray-300 text-gray-400' : ''}
                    `}>
                      {status === 'complete' ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </div>
                    <span className={`
                      mt-2 text-sm font-medium
                      ${status === 'current' ? 'text-blue-600' : ''}
                      ${status === 'complete' ? 'text-green-600' : ''}
                      ${status === 'upcoming' ? 'text-gray-400' : ''}
                    `}>
                      {step.label}
                    </span>
                  </div>
                  {idx < 2 && (
                    <div className={`
                      h-0.5 flex-1 mx-4 transition-all
                      ${status === 'complete' ? 'bg-green-500' : 'bg-gray-300'}
                    `} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          {currentStep === 0 && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Choose Your Project</h2>
                <p className="text-gray-600">Select a project to work on. Each project has different challenges and team dynamics.</p>
              </div>

              {projectsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading projects...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(projects as any[])?.map((project: any) => (
                    <Card
                      key={project.id}
                      className="cursor-pointer transition-all hover:shadow-lg"
                      data-testid={`card-project-${project.id}`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-2">{project.name}</CardTitle>
                            <CardDescription className="text-base">{project.description}</CardDescription>
                          </div>
                          <div className="flex flex-col items-end space-y-2 ml-4">
                            <Badge className={getDifficultyColor(project.difficulty)}>
                              {project.difficulty}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="h-4 w-4 mr-2" />
                            <span>{project.teamStructure?.length || 0} team members</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>~{project.estimatedDuration} minutes</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Target className="h-4 w-4 mr-2" />
                            <span>{project.category}</span>
                          </div>
                        </div>

                        {expandedProject === project.id ? (
                          <div className="mt-4 space-y-4 border-t pt-4">
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Your Team</h4>
                              <div className="grid grid-cols-2 gap-3">
                                {project.teamStructure?.map((member: any, idx: number) => (
                                  <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                                    <div className="flex items-start space-x-3">
                                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-sm font-medium text-blue-600">
                                          {member.name.charAt(0)}
                                        </span>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                                        <p className="text-xs text-gray-600">{member.role}</p>
                                        <p className="text-xs text-gray-500 mt-1">{member.personality}</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {member.expertise?.slice(0, 2).map((exp: string) => (
                                            <Badge key={exp} variant="outline" className="text-xs">
                                              {exp}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {project.requirements && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Key Features</h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                  {project.requirements.features?.map((feature: string, idx: number) => (
                                    <li key={idx}>{feature}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div className="flex space-x-3">
                              <Button
                                onClick={() => handleProjectSelect(project)}
                                className="flex-1"
                                data-testid={`button-select-project-${project.id}`}
                              >
                                Select This Project
                                <ChevronRight className="ml-2 h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setExpandedProject(null)}
                                data-testid="button-collapse-project"
                              >
                                Collapse
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => setExpandedProject(project.id)}
                            className="w-full"
                            data-testid={`button-view-details-${project.id}`}
                          >
                            View Full Details
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 1 && (
            <div>
              <div className="mb-6">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setCurrentStep(0);
                    setSelectedRole("");
                  }}
                  className="mb-4"
                  data-testid="button-back-to-projects"
                >
                  ← Back to Projects
                </Button>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Select Your Role</h2>
                <p className="text-gray-600">
                  Choose the role you want to practice for "{selectedProject?.name}". Each role has unique responsibilities and learning opportunities.
                </p>
              </div>

              {rolesLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading roles...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(roles as any[])?.map((role: any) => {
                    const Icon = getRoleIcon(role.name);
                    const details = ROLE_DETAILS[role.name];
                    
                    return (
                      <Card
                        key={role.id}
                        className="cursor-pointer transition-all hover:shadow-lg"
                        data-testid={`card-role-${role.name.toLowerCase().replace(' ', '-')}`}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-3 bg-blue-100 rounded-lg">
                                <Icon className="h-6 w-6 text-blue-600" />
                              </div>
                              <div>
                                <CardTitle className="text-xl">{role.name}</CardTitle>
                                <CardDescription className="text-base mt-1">{role.description}</CardDescription>
                              </div>
                            </div>
                            {details && (
                              <Badge variant="outline" className="ml-4">
                                {details.estimatedTime}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {role.competencies?.map((comp: string) => (
                              <Badge key={comp} variant="outline">
                                {comp}
                              </Badge>
                            ))}
                          </div>

                          {expandedRole === role.name && details ? (
                            <div className="mt-4 space-y-4 border-t pt-4">
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                                  What You'll Do
                                </h4>
                                <ul className="space-y-2">
                                  {details.keyTasks.map((task, idx) => (
                                    <li key={idx} className="flex items-start text-sm text-gray-600">
                                      <span className="text-blue-500 mr-2 mt-1">•</span>
                                      <span>{task}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                                  <AlertCircle className="h-4 w-4 mr-2 text-amber-600" />
                                  Example Scenarios
                                </h4>
                                <ul className="space-y-2">
                                  {details.sampleScenarios.map((scenario, idx) => (
                                    <li key={idx} className="text-sm text-gray-600 bg-amber-50 p-2 rounded border-l-2 border-amber-400">
                                      "{scenario}"
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Skills You'll Practice</h4>
                                <div className="flex flex-wrap gap-2">
                                  {details.skills.map((skill) => (
                                    <Badge key={skill} className="bg-green-100 text-green-800">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              <div className="flex space-x-3">
                                <Button
                                  onClick={() => handleRoleSelect(role.name)}
                                  className="flex-1"
                                  data-testid={`button-select-role-${role.name.toLowerCase().replace(' ', '-')}`}
                                >
                                  Select {role.name}
                                  <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setExpandedRole(null)}
                                  data-testid="button-collapse-role"
                                >
                                  Collapse
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              onClick={() => setExpandedRole(role.name)}
                              className="w-full"
                              data-testid={`button-view-role-details-${role.name.toLowerCase().replace(' ', '-')}`}
                            >
                              View Full Role Details
                              <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && selectedProject && selectedRole && (
            <div>
              <Button
                variant="ghost"
                onClick={() => setCurrentStep(1)}
                className="mb-4"
                data-testid="button-back-to-roles"
              >
                ← Back to Roles
              </Button>

              <Card className="border-2 border-green-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl">Ready to Start Your Simulation!</CardTitle>
                  <CardDescription className="text-base">Review your selection and get started when you're ready</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Target className="h-5 w-5 mr-2 text-blue-600" />
                        Project
                      </h4>
                      <h5 className="font-medium text-gray-900 text-lg">{selectedProject.name}</h5>
                      <p className="text-sm text-gray-600 mt-1">{selectedProject.description}</p>
                      <div className="mt-4 flex items-center space-x-4">
                        <Badge className={getDifficultyColor(selectedProject.difficulty)}>
                          {selectedProject.difficulty}
                        </Badge>
                        <span className="text-sm text-gray-600 flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {selectedProject.estimatedDuration} minutes
                        </span>
                        <span className="text-sm text-gray-600 flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {selectedProject.teamStructure?.length || 0} teammates
                        </span>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        {(() => {
                          const Icon = getRoleIcon(selectedRole);
                          return <Icon className="h-5 w-5 mr-2 text-green-600" />;
                        })()}
                        Your Role
                      </h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-gray-900 text-lg">{selectedRole}</span>
                          <p className="text-sm text-gray-600 mt-1">
                            {ROLE_DETAILS[selectedRole]?.estimatedTime && (
                              `Estimated time: ${ROLE_DETAILS[selectedRole].estimatedTime}`
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Your AI Team</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedProject.teamStructure?.map((member: any, idx: number) => (
                          <div key={idx} className="flex items-center space-x-3 bg-white p-3 rounded-lg border">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-medium text-blue-600">
                                {member.name.charAt(0)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{member.name}</p>
                              <p className="text-xs text-gray-600">{member.role}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-blue-900 mb-2">What Happens Next</h4>
                          <ul className="text-sm text-blue-800 space-y-1">
                            <li>• You'll enter the workspace and see your team's chat</li>
                            <li>• Check the "What to Do Now" panel for your first objectives</li>
                            {selectedRole === 'Product Manager' && (
                              <li>• Review PM documentation in the Requirements tab</li>
                            )}
                            {(selectedRole === 'Developer' || selectedRole === 'Designer') && (
                              <li>• Explore the codebase to understand the project</li>
                            )}
                            <li>• Work through objectives by collaborating with your AI teammates</li>
                            <li>• Progress through different project phases as you complete tasks</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button
                        onClick={handleStartSession}
                        disabled={createSessionMutation.isPending}
                        size="lg"
                        className="w-full text-lg h-14"
                        data-testid="button-start-simulation"
                      >
                        {createSessionMutation.isPending ? (
                          <span className="flex items-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                            Starting Simulation...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            Start Workspace Simulation
                            <ChevronRight className="ml-2 h-5 w-5" />
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
