import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Briefcase, Users, Target, Clock, Code, Palette, TestTube, Server, Wrench } from "lucide-react";
import WorkspaceSession from "@/components/simulation/workspace-session";
import WorkspaceDashboard from "@/components/simulation/workspace-dashboard";

export default function WorkspaceSimulator() {
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [activeSession, setActiveSession] = useState<any>(null);

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
    queryClient.invalidateQueries({ queryKey: ['/api/user/1/progress'] });
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

  if (activeSession) {
    return <WorkspaceSession session={activeSession} onComplete={handleSessionComplete} />;
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="text-workspace-title">Workspace Simulator</h1>
          <p className="text-gray-600 mt-2">
            Experience real-world team collaboration by working on projects with AI teammates
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="select-project" data-testid="tab-select-project">Select Project</TabsTrigger>
            <TabsTrigger value="select-role" disabled={!selectedProject} data-testid="tab-select-role">
              Choose Role
            </TabsTrigger>
            <TabsTrigger value="review" disabled={!selectedProject || !selectedRole} data-testid="tab-review">
              Review & Start
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <WorkspaceDashboard
              userId={(user as any)?.id || 1}
              onResumeSession={(session) => setActiveSession(session)}
              onStartNew={() => {
                const tabsList = document.querySelector('[value="select-project"]') as HTMLElement;
                tabsList?.click();
              }}
            />
          </TabsContent>

          <TabsContent value="select-project">
            {projectsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading projects...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(projects as any[])?.map((project: any) => (
                  <Card
                    key={project.id}
                    className={`cursor-pointer transition-all ${
                      selectedProject?.id === project.id
                        ? 'ring-2 ring-blue-500 shadow-lg'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedProject(project)}
                    data-testid={`card-project-${project.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <Badge className={getDifficultyColor(project.difficulty)}>
                          {project.difficulty}
                        </Badge>
                      </div>
                      <CardDescription>{project.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="select-role">
            {rolesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading roles...</p>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Choose Your Role for "{selectedProject?.name}"
                  </h3>
                  <p className="text-gray-600">
                    Select the role you want to practice. You'll collaborate with AI teammates in other roles.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(roles as any[])?.map((role: any) => {
                    const Icon = getRoleIcon(role.name);
                    return (
                      <Card
                        key={role.id}
                        className={`cursor-pointer transition-all ${
                          selectedRole === role.name
                            ? 'ring-2 ring-blue-500 shadow-lg'
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => setSelectedRole(role.name)}
                        data-testid={`card-role-${role.name.toLowerCase().replace(' ', '-')}`}
                      >
                        <CardHeader>
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Icon className="h-6 w-6 text-blue-600" />
                            </div>
                            <CardTitle className="text-base">{role.name}</CardTitle>
                          </div>
                          <CardDescription className="mt-2">{role.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">Key Competencies:</p>
                            <div className="flex flex-wrap gap-1">
                              {role.competencies?.slice(0, 3).map((comp: string) => (
                                <Badge key={comp} variant="outline" className="text-xs">
                                  {comp}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="review">
            {selectedProject && selectedRole && (
              <Card>
                <CardHeader>
                  <CardTitle>Ready to Start</CardTitle>
                  <CardDescription>Review your selection and start the workspace simulation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Project</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-900">{selectedProject.name}</h5>
                        <p className="text-sm text-gray-600 mt-1">{selectedProject.description}</p>
                        <div className="mt-3 flex items-center space-x-4">
                          <Badge className={getDifficultyColor(selectedProject.difficulty)}>
                            {selectedProject.difficulty}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {selectedProject.estimatedDuration} minutes
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Your Role</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {(() => {
                            const Icon = getRoleIcon(selectedRole);
                            return <Icon className="h-5 w-5 text-blue-600" />;
                          })()}
                          <span className="font-medium text-gray-900">{selectedRole}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Your Team</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-3">
                          {selectedProject.teamStructure?.map((member: any, idx: number) => (
                            <div key={idx} className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {member.name.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{member.name}</p>
                                <p className="text-xs text-gray-600">{member.role}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button
                        onClick={handleStartSession}
                        disabled={createSessionMutation.isPending}
                        className="w-full"
                        data-testid="button-start-simulation"
                      >
                        {createSessionMutation.isPending ? 'Starting...' : 'Start Workspace Simulation'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
