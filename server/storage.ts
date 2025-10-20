import { 
  users, simulationSessions, userProgress,
  workspaceProjects, workspaceRoles, workspaceArtifacts, workspaceTasks, workspaceInteractions, workspaceEvaluations,
  type User, type InsertUser, type SimulationSession, type InsertSimulationSession, type UserProgress, type InsertUserProgress,
  type WorkspaceProject, type InsertWorkspaceProject,
  type WorkspaceRole, type InsertWorkspaceRole,
  type WorkspaceArtifact, type InsertWorkspaceArtifact,
  type WorkspaceTask, type InsertWorkspaceTask,
  type WorkspaceInteraction, type InsertWorkspaceInteraction,
  type WorkspaceEvaluation, type InsertWorkspaceEvaluation
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Simulation session operations
  getSimulationSession(id: number): Promise<SimulationSession | undefined>;
  getUserSimulationSessions(userId: number, type?: string): Promise<SimulationSession[]>;
  createSimulationSession(session: InsertSimulationSession): Promise<SimulationSession>;
  updateSimulationSession(id: number, updates: Partial<SimulationSession>): Promise<SimulationSession | undefined>;
  
  // User progress operations
  getUserProgress(userId: number): Promise<UserProgress[]>;
  getUserProgressByType(userId: number, type: string): Promise<UserProgress | undefined>;
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  updateUserProgress(userId: number, type: string, updates: Partial<UserProgress>): Promise<UserProgress | undefined>;
  
  // Workspace project operations
  getWorkspaceProjects(): Promise<WorkspaceProject[]>;
  getWorkspaceProject(id: number): Promise<WorkspaceProject | undefined>;
  createWorkspaceProject(project: InsertWorkspaceProject): Promise<WorkspaceProject>;
  
  // Workspace role operations
  getWorkspaceRoles(): Promise<WorkspaceRole[]>;
  getWorkspaceRole(id: number): Promise<WorkspaceRole | undefined>;
  createWorkspaceRole(role: InsertWorkspaceRole): Promise<WorkspaceRole>;
  
  // Workspace artifact operations
  getWorkspaceArtifacts(sessionId: number): Promise<WorkspaceArtifact[]>;
  getWorkspaceArtifact(id: number): Promise<WorkspaceArtifact | undefined>;
  createWorkspaceArtifact(artifact: InsertWorkspaceArtifact): Promise<WorkspaceArtifact>;
  updateWorkspaceArtifact(id: number, updates: Partial<WorkspaceArtifact>): Promise<WorkspaceArtifact | undefined>;
  
  // Workspace task operations
  getWorkspaceTasks(sessionId: number): Promise<WorkspaceTask[]>;
  getWorkspaceTask(id: number): Promise<WorkspaceTask | undefined>;
  createWorkspaceTask(task: InsertWorkspaceTask): Promise<WorkspaceTask>;
  updateWorkspaceTask(id: number, updates: Partial<WorkspaceTask>): Promise<WorkspaceTask | undefined>;
  
  // Workspace interaction operations
  getWorkspaceInteractions(sessionId: number, channel?: string): Promise<WorkspaceInteraction[]>;
  createWorkspaceInteraction(interaction: InsertWorkspaceInteraction): Promise<WorkspaceInteraction>;
  
  // Workspace evaluation operations
  getWorkspaceEvaluations(sessionId: number): Promise<WorkspaceEvaluation[]>;
  createWorkspaceEvaluation(evaluation: InsertWorkspaceEvaluation): Promise<WorkspaceEvaluation>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private sessions: Map<number, SimulationSession>;
  private progress: Map<string, UserProgress>; // key: `${userId}-${type}`
  private workspaceProjects: Map<number, WorkspaceProject>;
  private workspaceRoles: Map<number, WorkspaceRole>;
  private workspaceArtifacts: Map<number, WorkspaceArtifact>;
  private workspaceTasks: Map<number, WorkspaceTask>;
  private workspaceInteractions: Map<number, WorkspaceInteraction>;
  private workspaceEvaluations: Map<number, WorkspaceEvaluation>;
  private currentUserId: number;
  private currentSessionId: number;
  private currentProgressId: number;
  private currentProjectId: number;
  private currentRoleId: number;
  private currentArtifactId: number;
  private currentTaskId: number;
  private currentInteractionId: number;
  private currentEvaluationId: number;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.progress = new Map();
    this.workspaceProjects = new Map();
    this.workspaceRoles = new Map();
    this.workspaceArtifacts = new Map();
    this.workspaceTasks = new Map();
    this.workspaceInteractions = new Map();
    this.workspaceEvaluations = new Map();
    this.currentUserId = 1;
    this.currentSessionId = 1;
    this.currentProgressId = 1;
    this.currentProjectId = 1;
    this.currentRoleId = 1;
    this.currentArtifactId = 1;
    this.currentTaskId = 1;
    this.currentInteractionId = 1;
    this.currentEvaluationId = 1;
    
    // Create a default user
    this.createUser({
      username: "arsen",
      password: "password",
      email: "arsen@edmap.com",
      firstName: "Arsen",
      lastName: "User"
    });

    // Seed workspace data
    this.seedWorkspaceData();
  }

  private async seedWorkspaceData() {
    // Seed roles
    const roles = [
      {
        name: 'Developer',
        description: 'Build features, write code, and fix bugs',
        competencies: ['coding', 'problem-solving', 'technical-communication'],
        availableActions: ['write-code', 'review-code', 'create-ticket', 'update-task', 'ask-question'],
        evaluationCriteria: ['code-quality', 'technical-accuracy', 'collaboration', 'communication']
      },
      {
        name: 'Product Manager',
        description: 'Define requirements, prioritize features, and coordinate team',
        competencies: ['strategic-thinking', 'stakeholder-management', 'prioritization'],
        availableActions: ['create-ticket', 'prioritize-backlog', 'clarify-requirements', 'run-meeting'],
        evaluationCriteria: ['clarity', 'prioritization', 'stakeholder-communication', 'decision-making']
      },
      {
        name: 'Designer',
        description: 'Create designs, conduct user research, and ensure great UX',
        competencies: ['visual-design', 'user-research', 'prototyping'],
        availableActions: ['create-design', 'provide-feedback', 'conduct-research', 'update-design-system'],
        evaluationCriteria: ['design-quality', 'user-focus', 'collaboration', 'communication']
      },
      {
        name: 'QA Engineer',
        description: 'Write tests, find bugs, and ensure quality',
        competencies: ['testing', 'attention-to-detail', 'bug-reporting'],
        availableActions: ['write-test', 'report-bug', 'verify-fix', 'create-test-plan'],
        evaluationCriteria: ['test-coverage', 'bug-quality', 'thoroughness', 'communication']
      },
      {
        name: 'DevOps Engineer',
        description: 'Manage infrastructure, deployments, and system reliability',
        competencies: ['infrastructure', 'automation', 'monitoring'],
        availableActions: ['configure-deployment', 'monitor-systems', 'optimize-performance', 'fix-infrastructure'],
        evaluationCriteria: ['reliability', 'automation', 'security', 'problem-solving']
      }
    ];

    for (const role of roles) {
      await this.createWorkspaceRole(role);
    }

    // Seed projects
    const projects = [
      {
        name: 'Task Management App',
        description: 'Build a modern task management application for teams',
        category: 'web-app',
        teamStructure: [
          {
            name: 'Sarah',
            role: 'Developer',
            personality: 'experienced and helpful',
            expertise: ['React', 'Node.js', 'TypeScript'],
            availability: 'usually'
          },
          {
            name: 'Marcus',
            role: 'Product Manager',
            personality: 'strategic and detail-oriented',
            expertise: ['product-strategy', 'user-research', 'agile'],
            availability: 'usually'
          },
          {
            name: 'Elena',
            role: 'Designer',
            personality: 'creative and user-focused',
            expertise: ['UI-design', 'UX-research', 'prototyping'],
            availability: 'sometimes'
          },
          {
            name: 'Raj',
            role: 'QA Engineer',
            personality: 'thorough and analytical',
            expertise: ['automated-testing', 'manual-testing', 'bug-tracking'],
            availability: 'always'
          }
        ],
        requirements: {
          features: ['User authentication', 'Task creation and editing', 'Team collaboration', 'Deadline tracking'],
          techStack: ['React', 'Node.js', 'PostgreSQL', 'TailwindCSS'],
          milestones: [
            { name: 'MVP Launch', deadline: '2 weeks', tasks: 8 },
            { name: 'Beta Release', deadline: '4 weeks', tasks: 12 }
          ]
        },
        scenarioScript: {
          events: [
            { trigger: 'task_3_complete', type: 'bug-report', from: 'Raj', severity: 'high' },
            { trigger: 'day_3', type: 'requirement-change', from: 'Marcus', impact: 'medium' },
            { trigger: 'review_requested', type: 'design-feedback', from: 'Elena', detail: 'positive' }
          ]
        },
        difficulty: 'mid',
        estimatedDuration: 45
      },
      {
        name: 'E-commerce Platform API',
        description: 'Design and build REST APIs for an e-commerce platform',
        category: 'api',
        teamStructure: [
          {
            name: 'David',
            role: 'Developer',
            personality: 'senior and mentoring',
            expertise: ['API-design', 'database-optimization', 'security'],
            availability: 'usually'
          },
          {
            name: 'Lisa',
            role: 'Product Manager',
            personality: 'business-focused and pragmatic',
            expertise: ['API-products', 'technical-specs', 'pricing'],
            availability: 'sometimes'
          },
          {
            name: 'Tom',
            role: 'DevOps Engineer',
            personality: 'security-conscious and systematic',
            expertise: ['cloud-infrastructure', 'CI-CD', 'monitoring'],
            availability: 'usually'
          }
        ],
        requirements: {
          features: ['Product catalog API', 'Order management', 'Payment integration', 'Admin dashboard'],
          techStack: ['Node.js', 'Express', 'MongoDB', 'Redis'],
          milestones: [
            { name: 'Core APIs', deadline: '2 weeks', tasks: 6 },
            { name: 'Integration', deadline: '3 weeks', tasks: 8 }
          ]
        },
        scenarioScript: null,
        difficulty: 'senior',
        estimatedDuration: 60
      },
      {
        name: 'Mobile Fitness App',
        description: 'Create a mobile fitness tracking application',
        category: 'mobile-app',
        teamStructure: [
          {
            name: 'Alex',
            role: 'Developer',
            personality: 'enthusiastic and fast-paced',
            expertise: ['React-Native', 'mobile-development', 'animations'],
            availability: 'always'
          },
          {
            name: 'Priya',
            role: 'Designer',
            personality: 'detail-oriented and empathetic',
            expertise: ['mobile-UI', 'micro-interactions', 'accessibility'],
            availability: 'usually'
          },
          {
            name: 'Jordan',
            role: 'Product Manager',
            personality: 'data-driven and collaborative',
            expertise: ['mobile-products', 'analytics', 'user-retention'],
            availability: 'usually'
          },
          {
            name: 'Sam',
            role: 'QA Engineer',
            personality: 'meticulous and patient',
            expertise: ['mobile-testing', 'device-testing', 'performance'],
            availability: 'usually'
          }
        ],
        requirements: {
          features: ['Workout tracking', 'Progress charts', 'Social features', 'Goal setting'],
          techStack: ['React Native', 'Firebase', 'TypeScript'],
          milestones: [
            { name: 'Core Features', deadline: '3 weeks', tasks: 10 },
            { name: 'Social Features', deadline: '5 weeks', tasks: 8 }
          ]
        },
        scenarioScript: null,
        difficulty: 'junior',
        estimatedDuration: 40
      }
    ];

    for (const project of projects) {
      await this.createWorkspaceProject(project);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getSimulationSession(id: number): Promise<SimulationSession | undefined> {
    return this.sessions.get(id);
  }

  async getUserSimulationSessions(userId: number, type?: string): Promise<SimulationSession[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId && (!type || session.type === type))
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  async createSimulationSession(insertSession: InsertSimulationSession): Promise<SimulationSession> {
    const id = this.currentSessionId++;
    const session: SimulationSession = {
      ...insertSession,
      id,
      startedAt: new Date(),
      completedAt: null,
      score: null,
      feedback: null,
      duration: null,
      status: insertSession.status || 'active',
      messages: insertSession.messages || []
    };
    this.sessions.set(id, session);
    return session;
  }

  async updateSimulationSession(id: number, updates: Partial<SimulationSession>): Promise<SimulationSession | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...updates };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  async getUserProgress(userId: number): Promise<UserProgress[]> {
    return Array.from(this.progress.values())
      .filter(p => p.userId === userId);
  }

  async getUserProgressByType(userId: number, type: string): Promise<UserProgress | undefined> {
    return this.progress.get(`${userId}-${type}`);
  }

  async createUserProgress(insertProgress: InsertUserProgress): Promise<UserProgress> {
    const id = this.currentProgressId++;
    const progress: UserProgress = {
      ...insertProgress,
      id,
      totalSessions: insertProgress.totalSessions || 0,
      completedSessions: insertProgress.completedSessions || 0,
      totalTime: insertProgress.totalTime || 0,
      averageScore: insertProgress.averageScore || null,
      lastSessionAt: null
    };
    this.progress.set(`${progress.userId}-${progress.simulationType}`, progress);
    return progress;
  }

  async updateUserProgress(userId: number, type: string, updates: Partial<UserProgress>): Promise<UserProgress | undefined> {
    const key = `${userId}-${type}`;
    const progress = this.progress.get(key);
    if (!progress) return undefined;
    
    const updatedProgress = { ...progress, ...updates };
    this.progress.set(key, updatedProgress);
    return updatedProgress;
  }

  // Workspace project operations
  async getWorkspaceProjects(): Promise<WorkspaceProject[]> {
    return Array.from(this.workspaceProjects.values());
  }

  async getWorkspaceProject(id: number): Promise<WorkspaceProject | undefined> {
    return this.workspaceProjects.get(id);
  }

  async createWorkspaceProject(insertProject: InsertWorkspaceProject): Promise<WorkspaceProject> {
    const id = this.currentProjectId++;
    const project: WorkspaceProject = {
      ...insertProject,
      id,
      scenarioScript: insertProject.scenarioScript || null,
      createdAt: new Date()
    };
    this.workspaceProjects.set(id, project);
    return project;
  }

  // Workspace role operations
  async getWorkspaceRoles(): Promise<WorkspaceRole[]> {
    return Array.from(this.workspaceRoles.values());
  }

  async getWorkspaceRole(id: number): Promise<WorkspaceRole | undefined> {
    return this.workspaceRoles.get(id);
  }

  async createWorkspaceRole(insertRole: InsertWorkspaceRole): Promise<WorkspaceRole> {
    const id = this.currentRoleId++;
    const role: WorkspaceRole = {
      ...insertRole,
      id,
      createdAt: new Date()
    };
    this.workspaceRoles.set(id, role);
    return role;
  }

  // Workspace artifact operations
  async getWorkspaceArtifacts(sessionId: number): Promise<WorkspaceArtifact[]> {
    return Array.from(this.workspaceArtifacts.values())
      .filter(artifact => artifact.sessionId === sessionId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async getWorkspaceArtifact(id: number): Promise<WorkspaceArtifact | undefined> {
    return this.workspaceArtifacts.get(id);
  }

  async createWorkspaceArtifact(insertArtifact: InsertWorkspaceArtifact): Promise<WorkspaceArtifact> {
    const id = this.currentArtifactId++;
    const artifact: WorkspaceArtifact = {
      ...insertArtifact,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      assignedRole: insertArtifact.assignedRole || null,
      metadata: insertArtifact.metadata || null,
      versionHistory: insertArtifact.versionHistory || []
    };
    this.workspaceArtifacts.set(id, artifact);
    return artifact;
  }

  async updateWorkspaceArtifact(id: number, updates: Partial<WorkspaceArtifact>): Promise<WorkspaceArtifact | undefined> {
    const artifact = this.workspaceArtifacts.get(id);
    if (!artifact) return undefined;
    
    const updatedArtifact = { 
      ...artifact, 
      ...updates,
      updatedAt: new Date()
    };
    this.workspaceArtifacts.set(id, updatedArtifact);
    return updatedArtifact;
  }

  // Workspace task operations
  async getWorkspaceTasks(sessionId: number): Promise<WorkspaceTask[]> {
    return Array.from(this.workspaceTasks.values())
      .filter(task => task.sessionId === sessionId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async getWorkspaceTask(id: number): Promise<WorkspaceTask | undefined> {
    return this.workspaceTasks.get(id);
  }

  async createWorkspaceTask(insertTask: InsertWorkspaceTask): Promise<WorkspaceTask> {
    const id = this.currentTaskId++;
    const task: WorkspaceTask = {
      ...insertTask,
      id,
      status: insertTask.status || 'todo',
      priority: insertTask.priority || 'medium',
      assignedRole: insertTask.assignedRole || null,
      complexity: insertTask.complexity || null,
      dependencies: insertTask.dependencies || [],
      artifactId: insertTask.artifactId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.workspaceTasks.set(id, task);
    return task;
  }

  async updateWorkspaceTask(id: number, updates: Partial<WorkspaceTask>): Promise<WorkspaceTask | undefined> {
    const task = this.workspaceTasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { 
      ...task, 
      ...updates,
      updatedAt: new Date()
    };
    this.workspaceTasks.set(id, updatedTask);
    return updatedTask;
  }

  // Workspace interaction operations
  async getWorkspaceInteractions(sessionId: number, channel?: string): Promise<WorkspaceInteraction[]> {
    return Array.from(this.workspaceInteractions.values())
      .filter(interaction => 
        interaction.sessionId === sessionId && 
        (!channel || interaction.channel === channel)
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createWorkspaceInteraction(insertInteraction: InsertWorkspaceInteraction): Promise<WorkspaceInteraction> {
    const id = this.currentInteractionId++;
    const interaction: WorkspaceInteraction = {
      ...insertInteraction,
      id,
      metadata: insertInteraction.metadata || null,
      threadId: insertInteraction.threadId || null,
      createdAt: new Date()
    };
    this.workspaceInteractions.set(id, interaction);
    return interaction;
  }

  // Workspace evaluation operations
  async getWorkspaceEvaluations(sessionId: number): Promise<WorkspaceEvaluation[]> {
    return Array.from(this.workspaceEvaluations.values())
      .filter(evaluation => evaluation.sessionId === sessionId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createWorkspaceEvaluation(insertEvaluation: InsertWorkspaceEvaluation): Promise<WorkspaceEvaluation> {
    const id = this.currentEvaluationId++;
    const evaluation: WorkspaceEvaluation = {
      ...insertEvaluation,
      id,
      collaborationScore: insertEvaluation.collaborationScore || null,
      deliveryScore: insertEvaluation.deliveryScore || null,
      communicationScore: insertEvaluation.communicationScore || null,
      feedback: insertEvaluation.feedback || null,
      createdAt: new Date()
    };
    this.workspaceEvaluations.set(id, evaluation);
    return evaluation;
  }
}

export const storage = new MemStorage();
