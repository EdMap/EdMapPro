import { 
  users, simulationSessions, userProgress,
  workspaceProjects, workspaceRoles, workspaceArtifacts, workspaceTasks, workspaceInteractions, workspaceEvaluations,
  workspaceProgress,
  interviewSessions, interviewQuestions, interviewFeedback,
  companies, jobPostings, jobGlossary, jobApplications, interviewTemplates, applicationStages,
  competencies, simulationCatalogue, roleAdapters, competencyLedger, portfolioArtifacts,
  progressionPaths, projectTemplates, userJourneys, journeyArcs, sprints, sprintActivities, competencySnapshots,
  sprintTickets, ceremonyInstances, gitSessions, gitEvents,
  workspaceInstances, workspacePhaseEvents,
  planningSessions, planningMessages, planningSessionAssessments,
  onboardingSessions,
  pullRequests, reviewThreads,
  type User, type InsertUser, type SimulationSession, type InsertSimulationSession, type UserProgress, type InsertUserProgress,
  type WorkspaceProject, type InsertWorkspaceProject,
  type WorkspaceRole, type InsertWorkspaceRole,
  type WorkspaceArtifact, type InsertWorkspaceArtifact,
  type WorkspaceTask, type InsertWorkspaceTask,
  type WorkspaceInteraction, type InsertWorkspaceInteraction,
  type WorkspaceEvaluation, type InsertWorkspaceEvaluation,
  type WorkspaceProgress, type InsertWorkspaceProgress,
  type InterviewSession, type InsertInterviewSession,
  type InterviewQuestion, type InsertInterviewQuestion,
  type InterviewFeedback, type InsertInterviewFeedback,
  type Company, type InsertCompany,
  type JobPosting, type InsertJobPosting,
  type JobGlossary, type InsertJobGlossary,
  type JobApplication, type InsertJobApplication,
  type InterviewTemplate, type InsertInterviewTemplate,
  type ApplicationStage, type InsertApplicationStage,
  type OfferDetails,
  type Competency, type InsertCompetency,
  type SimulationCatalogue, type InsertSimulationCatalogue,
  type RoleAdapter, type InsertRoleAdapter,
  type CompetencyLedger, type InsertCompetencyLedger,
  type PortfolioArtifact, type InsertPortfolioArtifact,
  type ReadinessScore,
  type ProgressionPath, type InsertProgressionPath,
  type ProjectTemplate, type InsertProjectTemplate,
  type UserJourney, type InsertUserJourney,
  type JourneyArc, type InsertJourneyArc,
  type Sprint, type InsertSprint,
  type SprintActivity, type InsertSprintActivity,
  type CompetencySnapshot, type InsertCompetencySnapshot,
  type JourneyState,
  type SprintTicket, type InsertSprintTicket,
  type CeremonyInstance, type InsertCeremonyInstance,
  type GitSession, type InsertGitSession,
  type GitEvent, type InsertGitEvent,
  type SprintOverview, type JourneyDashboard,
  type MasteryBand,
  type WorkspaceInstance, type InsertWorkspaceInstance,
  type WorkspacePhaseEvent, type InsertWorkspacePhaseEvent,
  type WorkspaceState, type WorkspacePhase,
  type PlanningSession, type InsertPlanningSession,
  type PlanningMessage, type InsertPlanningMessage,
  type PlanningSessionState,
  type PlanningSessionAssessment, type InsertPlanningSessionAssessment,
  type PullRequest, type InsertPullRequest,
  type ReviewThread, type InsertReviewThread,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, inArray } from "drizzle-orm";
import { getSprintPlanningAdapter } from "@shared/adapters/planning";
import { getBacklogItems, getSelectedBacklogItems, getBacklogItemById } from "@shared/adapters/planning/backlog-catalogue";
import { getOnboardingAdapter } from "@shared/adapters/onboarding";

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
  
  // Interview session operations
  getInterviewSession(id: number): Promise<InterviewSession | undefined>;
  getUserInterviewSessions(userId: number, mode?: 'practice' | 'journey'): Promise<InterviewSession[]>;
  createInterviewSession(session: InsertInterviewSession): Promise<InterviewSession>;
  updateInterviewSession(id: number, updates: Partial<InterviewSession>): Promise<InterviewSession | undefined>;
  
  // Interview question operations
  getInterviewQuestion(id: number): Promise<InterviewQuestion | undefined>;
  getInterviewQuestions(sessionId: number): Promise<InterviewQuestion[]>;
  createInterviewQuestion(question: InsertInterviewQuestion): Promise<InterviewQuestion>;
  updateInterviewQuestion(id: number, updates: Partial<InterviewQuestion>): Promise<InterviewQuestion | undefined>;
  
  // Interview feedback operations
  getInterviewFeedback(sessionId: number): Promise<InterviewFeedback | undefined>;
  createInterviewFeedback(feedback: InsertInterviewFeedback): Promise<InterviewFeedback>;
  
  // Company operations
  getCompanies(): Promise<Company[]>;
  getCompany(id: number): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  
  // Job posting operations
  getJobPostings(filters?: { companyId?: number; role?: string; isActive?: boolean }): Promise<JobPosting[]>;
  getJobPosting(id: number): Promise<JobPosting | undefined>;
  getJobPostingWithCompany(id: number): Promise<(JobPosting & { company: Company }) | undefined>;
  createJobPosting(posting: InsertJobPosting): Promise<JobPosting>;
  
  // Job glossary operations
  getJobGlossary(): Promise<JobGlossary[]>;
  getJobGlossaryTerm(term: string): Promise<JobGlossary | undefined>;
  createJobGlossaryTerm(term: InsertJobGlossary): Promise<JobGlossary>;
  
  // Job application operations
  getJobApplications(userId: number): Promise<JobApplication[]>;
  getJobApplicationsWithDetails(userId: number): Promise<Array<JobApplication & { job: JobPosting & { company: Company }, stages: ApplicationStage[] }>>;
  getJobApplication(id: number): Promise<JobApplication | undefined>;
  createJobApplication(application: InsertJobApplication): Promise<JobApplication>;
  updateJobApplication(id: number, updates: Partial<JobApplication>): Promise<JobApplication | undefined>;
  
  // Interview template operations
  getInterviewTemplates(companyId?: number, role?: string): Promise<InterviewTemplate[]>;
  getInterviewTemplate(id: number): Promise<InterviewTemplate | undefined>;
  createInterviewTemplate(template: InsertInterviewTemplate): Promise<InterviewTemplate>;
  
  // Application stage operations
  getApplicationStages(applicationId: number): Promise<ApplicationStage[]>;
  getApplicationStage(id: number): Promise<ApplicationStage | undefined>;
  getApplicationStageByInterviewSession(interviewSessionId: number): Promise<ApplicationStage | undefined>;
  createApplicationStage(stage: InsertApplicationStage): Promise<ApplicationStage>;
  updateApplicationStage(id: number, updates: Partial<ApplicationStage>): Promise<ApplicationStage | undefined>;
  
  // Workspace progress operations
  getWorkspaceProgress(userId: number, mode?: 'practice' | 'journey'): Promise<WorkspaceProgress[]>;
  getWorkspaceProgressBySession(sessionId: number): Promise<WorkspaceProgress | undefined>;
  createWorkspaceProgress(progress: InsertWorkspaceProgress): Promise<WorkspaceProgress>;
  updateWorkspaceProgress(id: number, updates: Partial<WorkspaceProgress>): Promise<WorkspaceProgress | undefined>;
  restartWorkspaceProgress(sessionId: number): Promise<WorkspaceProgress | undefined>;
  
  // Phase 1: Competency operations
  getCompetencies(filters?: { role?: string; category?: string }): Promise<Competency[]>;
  getCompetency(slug: string): Promise<Competency | undefined>;
  
  // Phase 1: Simulation Catalogue operations
  getCatalogueItems(filters?: { 
    simulator?: string; 
    type?: string;
    role?: string; 
    level?: string; 
    language?: string;
    day?: number;
  }): Promise<SimulationCatalogue[]>;
  getCatalogueItem(externalId: string): Promise<SimulationCatalogue | undefined>;
  getCatalogueItemById(id: number): Promise<SimulationCatalogue | undefined>;
  
  // Phase 1: Role Adapter operations
  getRoleAdapters(): Promise<RoleAdapter[]>;
  getRoleAdapter(role: string): Promise<RoleAdapter | undefined>;
  
  // Phase 1: Competency Ledger operations
  getUserCompetencyLedger(userId: number): Promise<CompetencyLedger[]>;
  getUserCompetencyEntry(userId: number, competencyId: number): Promise<CompetencyLedger | undefined>;
  createCompetencyEntry(entry: InsertCompetencyLedger): Promise<CompetencyLedger>;
  updateCompetencyEntry(id: number, updates: Partial<CompetencyLedger>): Promise<CompetencyLedger | undefined>;
  getUserReadiness(userId: number): Promise<ReadinessScore>;
  
  // Phase 1: Portfolio Artifact operations
  getUserPortfolio(userId: number): Promise<PortfolioArtifact[]>;
  getPortfolioArtifact(id: number): Promise<PortfolioArtifact | undefined>;
  createPortfolioArtifact(artifact: InsertPortfolioArtifact): Promise<PortfolioArtifact>;
  
  // Phase 3: Progression Path operations
  getProgressionPaths(filters?: { role?: string; entryLevel?: string }): Promise<ProgressionPath[]>;
  getProgressionPath(slug: string): Promise<ProgressionPath | undefined>;
  getProgressionPathById(id: number): Promise<ProgressionPath | undefined>;
  createProgressionPath(path: InsertProgressionPath): Promise<ProgressionPath>;
  
  // Phase 3: Project Template operations
  getProjectTemplates(filters?: { language?: string; industry?: string }): Promise<ProjectTemplate[]>;
  getProjectTemplate(slug: string): Promise<ProjectTemplate | undefined>;
  getProjectTemplateById(id: number): Promise<ProjectTemplate | undefined>;
  createProjectTemplate(template: InsertProjectTemplate): Promise<ProjectTemplate>;
  
  // Phase 3: User Journey operations
  getUserJourneys(userId: number): Promise<UserJourney[]>;
  getUserActiveJourney(userId: number): Promise<UserJourney | undefined>;
  getJourney(id: number): Promise<UserJourney | undefined>;
  createJourney(journey: InsertUserJourney): Promise<UserJourney>;
  updateJourney(id: number, updates: Partial<UserJourney>): Promise<UserJourney | undefined>;
  getJourneyState(journeyId: number): Promise<JourneyState | null>;
  
  // Phase 3: Journey Arc operations
  getJourneyArcs(journeyId: number): Promise<JourneyArc[]>;
  getJourneyArc(id: number): Promise<JourneyArc | undefined>;
  getCurrentArc(journeyId: number): Promise<JourneyArc | undefined>;
  createJourneyArc(arc: InsertJourneyArc): Promise<JourneyArc>;
  updateJourneyArc(id: number, updates: Partial<JourneyArc>): Promise<JourneyArc | undefined>;
  
  // Phase 3: Sprint operations
  getSprint(id: number): Promise<Sprint | undefined>;
  getSprintByArc(arcId: number): Promise<Sprint | undefined>;
  getSprintsByJourney(journeyId: number): Promise<Sprint[]>;
  createSprint(sprint: InsertSprint): Promise<Sprint>;
  updateSprint(id: number, updates: Partial<Sprint>): Promise<Sprint | undefined>;
  
  // Phase 3: Sprint Activity operations
  getSprintActivities(sprintId: number, dayNumber?: number): Promise<SprintActivity[]>;
  getSprintActivitiesByType(sprintId: number, activityType: string): Promise<SprintActivity[]>;
  getSprintActivity(id: number): Promise<SprintActivity | undefined>;
  createSprintActivity(activity: InsertSprintActivity): Promise<SprintActivity>;
  updateSprintActivity(id: number, updates: Partial<SprintActivity>): Promise<SprintActivity | undefined>;
  
  // Phase 3: Competency Snapshot operations
  getCompetencySnapshots(journeyId: number): Promise<CompetencySnapshot[]>;
  createCompetencySnapshot(snapshot: InsertCompetencySnapshot): Promise<CompetencySnapshot>;
  
  // Phase 5: Sprint Ticket operations
  getSprintTickets(sprintId: number): Promise<SprintTicket[]>;
  getSprintTicket(id: number): Promise<SprintTicket | undefined>;
  getSprintTicketByKey(sprintId: number, ticketKey: string): Promise<SprintTicket | undefined>;
  createSprintTicket(ticket: InsertSprintTicket): Promise<SprintTicket>;
  updateSprintTicket(id: number, updates: Partial<SprintTicket>): Promise<SprintTicket | undefined>;
  
  // Phase 5: Ceremony Instance operations
  getCeremonyInstances(sprintId: number): Promise<CeremonyInstance[]>;
  getCeremonyInstance(id: number): Promise<CeremonyInstance | undefined>;
  getCeremonyByType(sprintId: number, ceremonyType: string, dayNumber?: number): Promise<CeremonyInstance | undefined>;
  createCeremonyInstance(ceremony: InsertCeremonyInstance): Promise<CeremonyInstance>;
  updateCeremonyInstance(id: number, updates: Partial<CeremonyInstance>): Promise<CeremonyInstance | undefined>;
  
  // Phase 5: Git Session operations
  getGitSession(ticketId: number): Promise<GitSession | undefined>;
  getGitSessionById(id: number): Promise<GitSession | undefined>;
  createGitSession(session: InsertGitSession): Promise<GitSession>;
  updateGitSession(id: number, updates: Partial<GitSession>): Promise<GitSession | undefined>;
  
  // Phase 5: Git Event operations
  getGitEvents(sessionId: number): Promise<GitEvent[]>;
  createGitEvent(event: InsertGitEvent): Promise<GitEvent>;
  
  // Phase 5: Dashboard data operations
  getSprintOverview(sprintId: number): Promise<SprintOverview | null>;
  getJourneyDashboard(journeyId: number): Promise<JourneyDashboard | null>;
  
  // Phase 5: Workspace Instance operations
  getWorkspaceInstance(id: number): Promise<WorkspaceInstance | undefined>;
  getWorkspaceInstanceByJourney(journeyId: number): Promise<WorkspaceInstance | undefined>;
  getUserWorkspaceInstances(userId: number): Promise<WorkspaceInstance[]>;
  createWorkspaceInstance(workspace: InsertWorkspaceInstance): Promise<WorkspaceInstance>;
  updateWorkspaceInstance(id: number, updates: Partial<WorkspaceInstance>): Promise<WorkspaceInstance | undefined>;
  
  // Phase 5: Workspace Phase Event operations
  getWorkspacePhaseEvents(workspaceId: number): Promise<WorkspacePhaseEvent[]>;
  createWorkspacePhaseEvent(event: InsertWorkspacePhaseEvent): Promise<WorkspacePhaseEvent>;
  updateWorkspacePhaseEvent(id: number, updates: Partial<WorkspacePhaseEvent>): Promise<WorkspacePhaseEvent | undefined>;
  
  // Phase 5: Workspace State operations
  getWorkspaceState(workspaceId: number): Promise<WorkspaceState | null>;
  advanceWorkspacePhase(workspaceId: number, payload?: Record<string, unknown>): Promise<WorkspaceInstance | undefined>;
  createSprintTicketsFromPlanning(workspaceId: number, sprintId: number): Promise<void>;
  
  // Phase 6: Planning Session operations
  getPlanningSession(id: number): Promise<PlanningSession | undefined>;
  getPlanningSessionByWorkspace(workspaceId: number): Promise<PlanningSession | undefined>;
  createPlanningSession(session: InsertPlanningSession): Promise<PlanningSession>;
  updatePlanningSession(id: number, updates: Partial<PlanningSession>): Promise<PlanningSession | undefined>;
  
  // Phase 6: Planning Message operations
  getPlanningMessages(sessionId: number): Promise<PlanningMessage[]>;
  createPlanningMessage(message: InsertPlanningMessage): Promise<PlanningMessage>;
  
  // Phase 6: Planning Session State
  getPlanningSessionState(workspaceId: number): Promise<PlanningSessionState | null>;
  
  // Phase 6: Planning Session Assessment operations (Tier Progression)
  getPlanningAssessmentsByJourney(journeyId: number, tier?: string): Promise<PlanningSessionAssessment[]>;
  createPlanningAssessment(assessment: InsertPlanningSessionAssessment): Promise<PlanningSessionAssessment>;
  archivePlanningSessions(workspaceId: number): Promise<number>;
  
  // PR Review Thread operations
  getReviewThreadsByPR(prId: number): Promise<ReviewThread[]>;
  getReviewThreadsByTicket(ticketId: number): Promise<ReviewThread[]>;
  createReviewThread(thread: InsertReviewThread): Promise<ReviewThread>;
  updateReviewThread(id: number, updates: Partial<ReviewThread>): Promise<ReviewThread | undefined>;
  respondToReviewThread(threadId: number, userResponse: string): Promise<ReviewThread | undefined>;
  verifyReviewThread(threadId: number, verdict: 'approved' | 'needs_more_work'): Promise<ReviewThread | undefined>;
  
  // Pull Request operations
  getPullRequest(id: number): Promise<PullRequest | undefined>;
  getPullRequestByTicket(ticketId: number): Promise<PullRequest | undefined>;
  createPullRequest(pr: InsertPullRequest): Promise<PullRequest>;
  updatePullRequest(id: number, updates: Partial<PullRequest>): Promise<PullRequest | undefined>;
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
  private interviewSessionsMap: Map<number, InterviewSession>;
  private interviewQuestionsMap: Map<number, InterviewQuestion>;
  private interviewFeedbackMap: Map<number, InterviewFeedback>;
  private companiesMap: Map<number, Company>;
  private jobPostingsMap: Map<number, JobPosting>;
  private jobGlossaryMap: Map<number, JobGlossary>;
  private jobApplicationsMap: Map<number, JobApplication>;
  private interviewTemplatesMap: Map<number, InterviewTemplate>;
  private applicationStagesMap: Map<number, ApplicationStage>;
  private currentUserId: number;
  private currentSessionId: number;
  private currentProgressId: number;
  private currentProjectId: number;
  private currentRoleId: number;
  private currentArtifactId: number;
  private currentTaskId: number;
  private currentInteractionId: number;
  private currentEvaluationId: number;
  private currentInterviewSessionId: number;
  private currentInterviewQuestionId: number;
  private currentInterviewFeedbackId: number;
  private currentCompanyId: number;
  private currentJobPostingId: number;
  private currentJobGlossaryId: number;
  private currentJobApplicationId: number;
  private currentInterviewTemplateId: number;
  private currentApplicationStageId: number;

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
    this.interviewSessionsMap = new Map();
    this.interviewQuestionsMap = new Map();
    this.interviewFeedbackMap = new Map();
    this.companiesMap = new Map();
    this.jobPostingsMap = new Map();
    this.jobGlossaryMap = new Map();
    this.jobApplicationsMap = new Map();
    this.interviewTemplatesMap = new Map();
    this.applicationStagesMap = new Map();
    this.currentUserId = 1;
    this.currentSessionId = 1;
    this.currentProgressId = 1;
    this.currentProjectId = 1;
    this.currentRoleId = 1;
    this.currentArtifactId = 1;
    this.currentTaskId = 1;
    this.currentInteractionId = 1;
    this.currentEvaluationId = 1;
    this.currentInterviewSessionId = 1;
    this.currentInterviewQuestionId = 1;
    this.currentInterviewFeedbackId = 1;
    this.currentCompanyId = 1;
    this.currentJobPostingId = 1;
    this.currentJobGlossaryId = 1;
    this.currentJobApplicationId = 1;
    this.currentInterviewTemplateId = 1;
    this.currentApplicationStageId = 1;
    
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
    
    // Seed job journey data
    this.seedJobJourneyData();
    this.seedSprintWorkflowData();
  }

  private async seedWorkspaceData() {
    // Check if workspace projects already exist in database - skip seeding if so
    const existingProjects = await db.select().from(workspaceProjects).limit(1);
    if (existingProjects.length > 0) {
      console.log('Workspace data already exists in database, skipping seed...');
      return;
    }

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
      },
      {
        name: 'PulseOps IQ - Executive Heatmap Feature',
        description: 'Enterprise incident analytics platform - Add executive incident heatmap and forecasting module',
        category: 'enterprise-feature',
        teamStructure: [
          {
            name: 'Claire',
            role: 'Product Manager',
            personality: 'strategic and stakeholder-focused',
            expertise: ['enterprise-products', 'analytics', 'SLA-management', 'roadmap-planning'],
            availability: 'usually'
          },
          {
            name: 'Ravi',
            role: 'Developer',
            personality: 'architectural and thorough',
            expertise: ['TypeScript', 'API-design', 'data-aggregation', 'PostgreSQL', 'performance-optimization'],
            availability: 'always'
          },
          {
            name: 'Maya',
            role: 'Designer',
            personality: 'design-conscious and detail-oriented',
            expertise: ['data-visualization', 'design-systems', 'enterprise-UI', 'accessibility'],
            availability: 'usually'
          },
          {
            name: 'Jon',
            role: 'Data Scientist',
            personality: 'analytical and collaborative',
            expertise: ['forecasting-algorithms', 'statistical-analysis', 'trend-detection', 'data-validation'],
            availability: 'sometimes'
          },
          {
            name: 'Elena',
            role: 'QA Engineer',
            personality: 'methodical and regression-aware',
            expertise: ['test-automation', 'regression-testing', 'data-validation', 'integration-testing'],
            availability: 'always'
          },
          {
            name: 'Luis',
            role: 'DevOps Engineer',
            personality: 'reliability-focused and automation-minded',
            expertise: ['CI-CD', 'monitoring', 'deployment-automation', 'performance-testing'],
            availability: 'usually'
          }
        ],
        requirements: {
          scenario: 'enterprise-existing-codebase',
          existingProduct: {
            name: 'PulseOps IQ',
            description: 'Enterprise incident & service analytics SaaS for ITSM teams',
            existingFeatures: [
              'Incident ingestion dashboard',
              'SLA reporting',
              'Automation playbooks',
              'Stakeholder reporting',
              'Alert management'
            ],
            techStack: ['React', 'Vite', 'TypeScript', 'Express', 'PostgreSQL', 'TailwindCSS'],
            codebaseSize: '~15,000 LOC',
            architecture: 'Monorepo with client/, server/, shared/ structure'
          },
          featureRequest: {
            title: 'Executive Incident Heatmap & Forecasting',
            businessContext: 'Enterprise customers need proactive SLA management - visibility into incident patterns and prediction of future hotspots',
            requirements: [
              'New API endpoint: /api/analytics/heatmap - aggregates incidents by service & business unit',
              'Frontend heatmap visualization with color intensity = incident volume',
              'Trend forecasts (7-day, 30-day) with statistical confidence',
              'Alert threshold configuration for hotspot detection',
              'Export functionality (CSV, PDF) for executive reports',
              'Permission checks - executive role required',
              'Performance: <2s page load, handle 10k+ incidents'
            ],
            acceptanceCriteria: [
              'Heatmap displays accurate incident counts per service/unit',
              'Forecasting algorithm validated with historical test data (±10% accuracy)',
              'UI matches existing design system and component patterns',
              'All existing dashboard tests continue to pass (regression)',
              'New feature has ≥80% test coverage',
              'Documentation updated (API reference, user guide)'
            ]
          },
          productDocumentation: {
            executiveSummary: 'The Executive Heatmap & Forecasting feature enables C-level executives and IT directors to proactively identify incident patterns and predict future service hotspots. This strategic capability transforms PulseOps IQ from a reactive monitoring tool into a proactive SLA management platform, directly addressing our enterprise customers\' #1 feature request (mentioned in 73% of Q3 customer interviews).',
            stakeholders: [
              {
                name: 'Sarah Chen',
                title: 'VP of Product',
                priority: 'Critical - Q4 strategic initiative',
                concerns: ['Market differentiation', 'Enterprise upsell opportunity', 'Competitive parity with ServiceNow'],
                successMetrics: ['30% increase in enterprise tier conversions', 'Feature mentioned in 80% of sales demos']
              },
              {
                name: 'Michael Torres',
                title: 'Head of Customer Success',
                priority: 'High - reduces escalations',
                concerns: ['Ease of use for executives', 'Actionable insights', 'Reduces "firefighting" support'],
                successMetrics: ['50% reduction in SLA breach escalations', '4.5+ satisfaction rating']
              },
              {
                name: 'Enterprise Customer Council',
                title: 'Beta testers (5 Fortune 500 companies)',
                priority: 'Critical - retention risk',
                concerns: ['Accuracy of forecasts', 'Performance with large datasets', 'Export for board presentations'],
                successMetrics: ['±10% forecast accuracy', '<2s load time', 'PDF export used weekly']
              }
            ],
            userStories: [
              {
                persona: 'IT Director (Emily)',
                goal: 'Prevent SLA breaches before they happen',
                story: 'As an IT Director managing 200+ services, I want to see which services are trending toward incidents so that I can proactively allocate resources and avoid costly SLA breaches.',
                painPoint: 'Currently reacts to incidents after they occur - wants to be proactive',
                jobs: ['Weekly exec report preparation', 'Budget planning for support team', 'Vendor management']
              },
              {
                persona: 'CTO (David)',
                goal: 'Strategic visibility into operational health',
                story: 'As a CTO reporting to the board, I want exportable heatmaps showing incident trends so that I can demonstrate we\'re managing technical debt and service reliability strategically.',
                painPoint: 'Board asks "why so many incidents?" - needs data-driven answer',
                jobs: ['Monthly board presentations', 'Strategic planning', 'Technology investment decisions']
              },
              {
                persona: 'Service Owner (Priya)',
                goal: 'Understand impact of my service on business units',
                story: 'As a Service Owner for the payments API, I want to see incident distribution across business units so that I can prioritize fixes for the most critical customers.',
                painPoint: 'Doesn\'t know which incidents matter most to the business',
                jobs: ['Sprint planning', 'Incident post-mortems', 'Stakeholder communication']
              }
            ],
            successMetrics: {
              primary: [
                'Enterprise tier conversion rate: +30% (baseline: 12% of trials)',
                'Feature adoption: 70% of enterprise users within 60 days',
                'Forecast accuracy: ±10% of actual incident volume',
                'Customer satisfaction: 4.5/5.0 rating for feature'
              ],
              secondary: [
                'Page load performance: <2 seconds (95th percentile)',
                'Export usage: 40% of users export weekly',
                'Support ticket reduction: -25% SLA-related escalations',
                'Sales cycle impact: -15% time to close for enterprise'
              ],
              technical: [
                'API response time: <500ms for 10k incidents',
                'Test coverage: ≥80% for new code',
                'Zero regression bugs in existing dashboards',
                'Accessibility: WCAG 2.1 AA compliance'
              ]
            },
            roadmapContext: {
              quarterlyTheme: 'Q4 2024: Enterprise Proactive Operations',
              positioning: 'Flagship feature for enterprise tier - enables pricing increase from $499 to $799/month',
              dependencies: [
                'Q3: Analytics engine optimization (completed)',
                'Q4: Executive dashboard redesign (in parallel)',
                'Q1 2025: Machine learning model refinement (follow-up)'
              ],
              futureEnhancements: [
                'Q1 2025: Anomaly detection with ML',
                'Q2 2025: Predictive resource auto-scaling recommendations',
                'Q3 2025: Integration with PagerDuty for auto-escalation'
              ]
            },
            competitiveAnalysis: [
              {
                competitor: 'ServiceNow',
                theirCapability: 'Incident trending with basic visualization',
                ourDifferentiator: 'Statistical forecasting + business unit segmentation + executive export',
                gap: 'They lack predictive capabilities - reactive only'
              },
              {
                competitor: 'Datadog',
                theirCapability: 'APM monitoring with alerts',
                ourDifferentiator: 'Business-context layered heatmaps (not just technical metrics)',
                gap: 'Dev-focused, not exec-friendly. No business unit view.'
              },
              {
                competitor: 'PagerDuty',
                theirCapability: 'On-call scheduling and incident response',
                ourDifferentiator: 'Strategic analytics vs. tactical response - prevention vs. reaction',
                gap: 'Doesn\'t answer "where should we invest to prevent incidents?"'
              }
            ],
            goToMarketStrategy: {
              launchDate: 'December 15, 2024',
              targetSegment: 'Enterprise customers (500+ employees) with complex service architectures',
              messagingPillars: [
                'Transform from reactive to proactive - predict incidents before they happen',
                'Executive visibility - board-ready insights in minutes, not hours',
                'ROI proof - prevent costly SLA breaches with data-driven forecasting'
              ],
              salesEnablement: [
                'Demo video showing 2-minute executive workflow (produce by Dec 1)',
                'ROI calculator: "If you prevent 3 SLA breaches/month = $X saved"',
                'Competitive battlecard vs. ServiceNow (highlight forecast gap)',
                'Customer testimonial video from beta program (schedule Dec 10)'
              ],
              pricing: 'Enterprise tier exclusive - justifies $799/mo price point',
              launchActivities: [
                'Product Hunt launch (Dec 16)',
                'Webinar: "Proactive SLA Management" (Dec 18, 200 registrants goal)',
                'Blog post: "How Fortune 500 Companies Predict Incidents" (Dec 15)',
                'LinkedIn ad campaign targeting IT Directors (2-week campaign, $5k budget)'
              ]
            },
            riskAssessment: [
              {
                risk: 'Forecast accuracy below ±10% threshold',
                probability: 'Medium',
                impact: 'High - erodes trust in feature',
                mitigation: 'Extensive testing with historical data, phased rollout with beta customers, clearly communicate confidence intervals in UI'
              },
              {
                risk: 'Performance degrades with enterprise-scale data (>50k incidents)',
                probability: 'Low',
                impact: 'Critical - unusable for largest customers',
                mitigation: 'Load testing with 100k incident dataset, implement data aggregation caching, query optimization review with Jon (Data Scientist)'
              },
              {
                risk: 'Sales team lacks confidence to demo feature',
                probability: 'Medium',
                impact: 'Medium - slow adoption, missed revenue',
                mitigation: 'Dedicated training session Dec 8, simple demo script, pre-recorded video backup, involve sales in beta testing'
              },
              {
                risk: 'Feature too complex for target users',
                probability: 'Low',
                impact: 'High - low adoption despite development effort',
                mitigation: 'User testing with 3 customer personas, built-in tooltips, guided onboarding tour, "Quick Start" template presets'
              }
            ],
            resourcePlanning: {
              teamAllocation: {
                engineering: '2 backend (Ravi, Jon for forecasting), 1 frontend (Maya), 1 QA (Elena), 0.5 DevOps (Luis)',
                design: '0.5 FTE (Maya - UI design)',
                pm: '0.8 FTE (Claire - coordinate, stakeholder mgmt, launch prep)',
                dataScience: '0.3 FTE (Jon - forecasting model)'
              },
              timeline: '5 sprints (10 weeks) - Dec 15 target launch',
              budget: {
                development: '$85k (team time)',
                infrastructure: '$2k/month (increased analytics compute)',
                marketing: '$5k (launch campaign)',
                total: '$92k estimated'
              },
              dependencies: [
                'Analytics DB optimization (must complete by Nov 20)',
                'Design system v2 (parallel track, low risk)',
                'Sales enablement materials (Dec 1-8 window)'
              ]
            }
          },
          phases: [
            {
              name: 'onboarding',
              duration: 5,
              objectives: [
                'Welcome to PulseOps IQ team',
                'Review product overview and architecture',
                'Explore existing codebase structure',
                'Understand feature requirements and business context'
              ],
              deliverables: ['Understanding of codebase', 'Questions answered by team']
            },
            {
              name: 'planning',
              duration: 5,
              objectives: [
                'Break down feature into implementation tasks',
                'Discuss technical approach with team',
                'Identify dependencies and potential risks',
                'Define timeline and milestones'
              ],
              deliverables: ['Task breakdown', 'Technical design decisions', 'Sprint plan']
            },
            {
              name: 'implementation',
              duration: 30,
              objectives: [
                'Implement backend aggregation API',
                'Build frontend heatmap visualization',
                'Add forecasting algorithm integration',
                'Write unit and integration tests',
                'Update documentation'
              ],
              deliverables: ['Working code', 'Tests passing', 'PR ready for review']
            },
            {
              name: 'review',
              duration: 10,
              objectives: [
                'Submit PR for team review',
                'Address code review feedback',
                'Ensure all tests pass',
                'Verify no regression on existing features'
              ],
              deliverables: ['PR approved', 'All feedback addressed', 'CI passing']
            },
            {
              name: 'release',
              duration: 5,
              objectives: [
                'Merge feature to main branch',
                'Deploy to staging environment',
                'Sprint retrospective with team',
                'Receive performance evaluation'
              ],
              deliverables: ['Feature deployed', 'Release notes', 'Team feedback']
            }
          ],
          simulatedCodebase: {
            structure: {
              'client/src/pages/dashboard': ['incident-dashboard.tsx', 'sla-reports.tsx', 'automation-playbooks.tsx'],
              'client/src/pages/analytics': ['overview.tsx', 'service-health.tsx'],
              'client/src/components/charts': ['line-chart.tsx', 'bar-chart.tsx', 'pie-chart.tsx'],
              'server/routes': ['incidents.ts', 'reports.ts', 'analytics.ts', 'playbooks.ts'],
              'server/services': ['incident-service.ts', 'sla-calculator.ts', 'analytics-engine.ts'],
              'shared': ['schema.ts', 'types.ts', 'validation.ts'],
              'docs': ['README.md', 'ARCHITECTURE.md', 'API_REFERENCE.md']
            },
            keyFiles: [
              {
                path: 'server/routes/analytics.ts',
                description: 'Analytics API endpoints - you\'ll add heatmap endpoint here',
                snippet: 'export async function analyticsRoutes(app: Express) {\n  app.get("/api/analytics/overview", ...);\n  app.get("/api/analytics/service-health", ...);\n  // Add heatmap endpoint here\n}'
              },
              {
                path: 'client/src/pages/analytics/overview.tsx',
                description: 'Analytics dashboard page - good reference for adding heatmap',
                snippet: 'export default function AnalyticsOverview() {\n  const { data: metrics } = useQuery({ queryKey: [\'/api/analytics/overview\'] });\n  return <div>...</div>;\n}'
              },
              {
                path: 'shared/schema.ts',
                description: 'Data models and types - check incident schema',
                snippet: 'export const incidents = pgTable("incidents", {\n  id: serial("id"),\n  serviceId: integer("service_id"),\n  severity: text("severity"),\n  status: text("status"),\n  ...\n});'
              }
            ]
          }
        },
        scenarioScript: {
          phases: {
            onboarding: [
              { from: 'Claire', time: 1, message: 'Welcome to PulseOps IQ! Excited to have you on the team. We\'re building the Executive Heatmap feature - it\'s a high-priority request from our enterprise customers.' },
              { from: 'Ravi', time: 2, message: 'Hey! I can give you a quick tour of the codebase. We use a monorepo structure - client/ for React frontend, server/ for Express backend, shared/ for types.' },
              { from: 'Maya', time: 3, message: 'From a design perspective, we have an established design system in client/src/components. The heatmap should follow our existing chart patterns.' },
              { from: 'Claire', time: 4, message: 'Just to clarify - you\'re taking the lead on this feature. I\'ll be here to help with onboarding and then step back to a standby role. Feel free to @mention me anytime you need guidance or get stuck!' }
            ],
            planning: [
              { from: 'Jon', time: 1, message: 'For forecasting, I can provide a statistical model API you can call. We\'ll use exponential smoothing for trend prediction.' },
              { from: 'Elena', time: 2, message: 'Make sure we have test coverage for the new endpoints and regression tests for existing dashboards. I\'ll help with test strategy.' }
            ],
            implementation: [
              { from: 'Ravi', time: 10, message: 'How\'s the implementation going? Let me know if you hit any roadblocks with the aggregation logic.' },
              { from: 'Maya', time: 15, message: 'I\'d love to review the heatmap UI once you have something visual. Make sure it\'s responsive and accessible!' },
              { from: 'Luis', time: 20, message: 'FYI - deployment process is automated via GitHub Actions. Just make sure your tests pass locally first.' }
            ]
          }
        },
        difficulty: 'senior',
        estimatedDuration: 55
      },
      // NovaPay Intern Onboarding - 42 London Block 1
      {
        name: 'NovaPay - Intern Onboarding',
        description: 'Your first week as a software engineering intern at NovaPay, a fintech startup building payment solutions for small businesses.',
        category: 'intern-onboarding',
        teamStructure: [
          {
            name: 'Sarah',
            role: 'Engineering Lead',
            personality: 'calm, thorough, high standards but supportive',
            expertise: ['React', 'Node.js', 'TypeScript', 'code-review', 'mentoring'],
            availability: 'usually',
            bio: 'Sarah has been at NovaPay for 3 years and built most of the Merchant Dashboard. She loves mentoring new engineers and believes everyone deserves patient guidance.'
          },
          {
            name: 'Marcus',
            role: 'Senior Developer',
            personality: 'friendly, slightly impatient, pragmatic',
            expertise: ['Node.js', 'PostgreSQL', 'API-design', 'debugging'],
            availability: 'usually',
            bio: 'Marcus is a senior dev who joined from a big tech company. He\'s direct and efficient - sometimes his Slack messages feel terse, but he means well.'
          },
          {
            name: 'Priya',
            role: 'Product Manager',
            personality: 'organized, clear communicator, deadline-aware',
            expertise: ['product-strategy', 'agile', 'stakeholder-management', 'sprint-planning'],
            availability: 'usually',
            bio: 'Priya runs the daily standups and keeps the team on track. She\'s great at explaining why features matter to the business.'
          },
          {
            name: 'Alex',
            role: 'QA Engineer',
            personality: 'detail-oriented, finds edge cases, helpful',
            expertise: ['testing', 'bug-reporting', 'edge-cases', 'user-flows'],
            availability: 'always',
            bio: 'Alex catches bugs before they reach production. They\'ll give you detailed bug reports and help you understand what went wrong.'
          },
          {
            name: 'Jordan',
            role: 'Fellow Intern',
            personality: 'eager, occasionally asks for help, peer support',
            expertise: ['React', 'learning', 'asking-questions'],
            availability: 'always',
            bio: 'Jordan started 2 weeks before you. They remember what it\'s like to be new and are happy to share what they\'ve learned.'
          }
        ],
        requirements: {
          scenario: 'intern-first-week',
          project: {
            name: 'Merchant Dashboard',
            description: 'Admin panel where small business owners view their transactions, payouts, and account settings',
            techStack: ['React', 'Node.js', 'PostgreSQL', 'TypeScript']
          },
          learningObjectives: [
            'Navigate async communication (Slack, standups)',
            'Understand team roles and who to ask for what',
            'Follow a ticket from assignment to merge',
            'Handle code review feedback gracefully',
            'Ask good questions'
          ],
          dailyStructure: [
            {
              day: 1,
              theme: 'Welcome aboard',
              activities: ['Read onboarding docs', 'Meet the team in 1:1 chats', 'Comprehension check with Sarah'],
              overnightEvent: 'Priya assigns first ticket'
            },
            {
              day: 2,
              theme: 'Your first ticket',
              activities: ['Read ticket', 'Ask clarifying questions', 'Start working', 'Push initial commit'],
              overnightEvent: 'Sarah leaves code review comments'
            },
            {
              day: 3,
              theme: 'Code review culture',
              activities: ['Address PR feedback', 'Learn review etiquette', 'Push revision'],
              overnightEvent: 'Alex reports edge case bug'
            },
            {
              day: 4,
              theme: 'Documentation',
              activities: ['Write README section', 'Submit for review', 'Revise based on feedback'],
              overnightEvent: 'Alex assigns bug ticket'
            },
            {
              day: 5,
              theme: 'Bug fix + wrap-up',
              activities: ['Debug and fix issue', 'Get feedback from Alex', 'Final 1:1 evaluation with Sarah'],
              overnightEvent: null
            }
          ]
        },
        scenarioScript: {
          onboarding: [
            { from: 'Priya', time: 1, message: 'Welcome to NovaPay! 🎉 I\'m Priya, the PM for the Merchant Dashboard team. Take your time getting settled - Sarah will walk you through everything.' },
            { from: 'Sarah', time: 2, message: 'Hey! Welcome aboard. I\'ll be your main point of contact this week. Let\'s do quick 1:1s with everyone so you can put faces to names. Start by reading the project README, and then we\'ll chat about what you understood.' },
            { from: 'Jordan', time: 3, message: 'Hey! I\'m Jordan, also an intern here. Started 2 weeks ago. If you have any "dumb questions" you don\'t want to ask Sarah, feel free to ping me 😄' }
          ],
          firstTicket: [
            { from: 'Priya', time: 1, message: 'Good morning! I\'ve assigned your first ticket: fixing a timezone display bug in the transaction list. It\'s a small one - perfect for getting familiar with the codebase.' },
            { from: 'Marcus', time: 5, message: 'The timezone logic is in utils/formatDate.js if you need it. Let me know if you get stuck.' }
          ],
          codeReview: [
            { from: 'Sarah', time: 1, message: 'Nice work on the fix! I left a couple of comments on your PR. Nothing major - just some suggestions for optimization. Take a look when you get a chance.' }
          ],
          documentation: [
            { from: 'Sarah', time: 1, message: 'Today I\'d like you to update the README with local testing instructions. It\'s a great way to solidify your understanding of the dev environment.' }
          ],
          bugFix: [
            { from: 'Alex', time: 1, message: 'Found an edge case! When merchants select "Last 7 days" in UTC+12, we\'re showing 8 days. Screenshot attached. Can you take a look?' }
          ]
        },
        difficulty: 'intern',
        estimatedDuration: 30
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
    
    // Also sync user to database for foreign key constraints (interview_sessions, etc.)
    try {
      await db.insert(users).values({
        id: user.id,
        username: user.username,
        password: user.password,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      }).onConflictDoNothing();
    } catch (error) {
      console.log('User already exists in database or sync failed:', error);
    }
    
    return user;
  }

  async getSimulationSession(id: number): Promise<SimulationSession | undefined> {
    // Check memory first
    const memorySession = this.sessions.get(id);
    if (memorySession) return memorySession;
    
    // Fallback to database
    try {
      const [dbSession] = await db.select().from(simulationSessions).where(eq(simulationSessions.id, id));
      if (dbSession) {
        // Cache in memory
        this.sessions.set(dbSession.id, dbSession);
        return dbSession;
      }
    } catch (error) {
      console.error('Failed to fetch session from database:', error);
    }
    return undefined;
  }

  async getUserSimulationSessions(userId: number, type?: string): Promise<SimulationSession[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId && (!type || session.type === type))
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  async createSimulationSession(insertSession: InsertSimulationSession): Promise<SimulationSession> {
    // Insert into database first to get a valid ID for foreign key references
    try {
      const [dbSession] = await db.insert(simulationSessions).values({
        userId: insertSession.userId,
        type: insertSession.type,
        status: insertSession.status || 'active',
        configuration: insertSession.configuration,
        messages: insertSession.messages || [],
      }).returning();
      
      const session: SimulationSession = {
        ...dbSession,
        startedAt: dbSession.startedAt,
        completedAt: dbSession.completedAt,
        score: dbSession.score,
        feedback: dbSession.feedback,
        duration: dbSession.duration
      };
      
      // Also store in memory for fast access
      this.sessions.set(session.id, session);
      return session;
    } catch (error) {
      console.error('Failed to create session in database:', error);
      // Fallback to memory-only (will break FK constraints for workspace_progress)
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
  }

  async updateSimulationSession(id: number, updates: Partial<SimulationSession>): Promise<SimulationSession | undefined> {
    const session = await this.getSimulationSession(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...updates };
    this.sessions.set(id, updatedSession);
    
    // Also update in database
    try {
      await db.update(simulationSessions).set(updates).where(eq(simulationSessions.id, id));
    } catch (error) {
      console.error('Failed to update session in database:', error);
    }
    
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
    // Query from database to ensure we get all projects
    try {
      const dbProjects = await db.select().from(workspaceProjects);
      return dbProjects;
    } catch (error) {
      console.error('Failed to get workspace projects from database:', error);
      return Array.from(this.workspaceProjects.values());
    }
  }

  async getWorkspaceProject(id: number): Promise<WorkspaceProject | undefined> {
    // Query from database first
    try {
      const [dbProject] = await db.select().from(workspaceProjects).where(eq(workspaceProjects.id, id));
      return dbProject;
    } catch (error) {
      console.error('Failed to get workspace project from database:', error);
      return this.workspaceProjects.get(id);
    }
  }

  async createWorkspaceProject(insertProject: InsertWorkspaceProject): Promise<WorkspaceProject> {
    // Insert into database first to get a valid ID for foreign key references
    try {
      const [dbProject] = await db.insert(workspaceProjects).values({
        name: insertProject.name,
        description: insertProject.description,
        difficulty: insertProject.difficulty,
        category: insertProject.category,
        estimatedDuration: insertProject.estimatedDuration,
        techStack: insertProject.techStack,
        teamStructure: insertProject.teamStructure,
        requirements: insertProject.requirements,
        scenarioScript: insertProject.scenarioScript || null
      }).returning();
      
      // Also store in memory for fast access
      this.workspaceProjects.set(dbProject.id, dbProject);
      return dbProject;
    } catch (error) {
      console.error('Failed to create workspace project in database:', error);
      // Fallback to memory-only
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

  // Workspace interaction operations - Using PostgreSQL database for persistence
  async getWorkspaceInteractions(sessionId: number, channel?: string): Promise<WorkspaceInteraction[]> {
    if (channel) {
      return await db.select()
        .from(workspaceInteractions)
        .where(and(
          eq(workspaceInteractions.sessionId, sessionId),
          eq(workspaceInteractions.channel, channel)
        ))
        .orderBy(workspaceInteractions.createdAt);
    }
    return await db.select()
      .from(workspaceInteractions)
      .where(eq(workspaceInteractions.sessionId, sessionId))
      .orderBy(workspaceInteractions.createdAt);
  }

  async createWorkspaceInteraction(insertInteraction: InsertWorkspaceInteraction): Promise<WorkspaceInteraction> {
    const [interaction] = await db.insert(workspaceInteractions)
      .values({
        sessionId: insertInteraction.sessionId,
        channel: insertInteraction.channel,
        sender: insertInteraction.sender,
        senderRole: insertInteraction.senderRole,
        content: insertInteraction.content,
        metadata: insertInteraction.metadata || null,
        threadId: insertInteraction.threadId || null
      })
      .returning();
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

  // Interview session operations - Using PostgreSQL database for persistence
  async getInterviewSession(id: number): Promise<InterviewSession | undefined> {
    const [session] = await db.select().from(interviewSessions).where(eq(interviewSessions.id, id));
    return session || undefined;
  }

  async getUserInterviewSessions(userId: number, mode?: 'practice' | 'journey'): Promise<InterviewSession[]> {
    if (mode) {
      return await db.select()
        .from(interviewSessions)
        .where(and(
          eq(interviewSessions.userId, userId),
          eq(interviewSessions.mode, mode)
        ))
        .orderBy(desc(interviewSessions.startedAt));
    }
    return await db.select()
      .from(interviewSessions)
      .where(eq(interviewSessions.userId, userId))
      .orderBy(desc(interviewSessions.startedAt));
  }

  async createInterviewSession(insertSession: InsertInterviewSession): Promise<InterviewSession> {
    const [session] = await db.insert(interviewSessions)
      .values({
        ...insertSession,
        difficulty: insertSession.difficulty || "medium",
        status: insertSession.status || "in_progress",
        currentQuestionIndex: insertSession.currentQuestionIndex || 0,
        totalQuestions: insertSession.totalQuestions || 5,
      })
      .returning();
    return session;
  }

  async updateInterviewSession(id: number, updates: Partial<InterviewSession>): Promise<InterviewSession | undefined> {
    const [updated] = await db.update(interviewSessions)
      .set(updates)
      .where(eq(interviewSessions.id, id))
      .returning();
    return updated || undefined;
  }

  // Interview question operations - Using PostgreSQL database for persistence
  async getInterviewQuestion(id: number): Promise<InterviewQuestion | undefined> {
    const [question] = await db.select().from(interviewQuestions).where(eq(interviewQuestions.id, id));
    if (!question) return undefined;
    // Normalize jsonb arrays to ensure they're always arrays
    return {
      ...question,
      strengths: Array.isArray(question.strengths) ? question.strengths : [],
      improvements: Array.isArray(question.improvements) ? question.improvements : [],
    };
  }

  async getInterviewQuestions(sessionId: number): Promise<InterviewQuestion[]> {
    const questions = await db.select()
      .from(interviewQuestions)
      .where(eq(interviewQuestions.sessionId, sessionId))
      .orderBy(interviewQuestions.questionIndex);
    
    // Normalize jsonb arrays to ensure they're always arrays
    return questions.map(q => ({
      ...q,
      strengths: Array.isArray(q.strengths) ? q.strengths : [],
      improvements: Array.isArray(q.improvements) ? q.improvements : [],
    }));
  }

  async createInterviewQuestion(insertQuestion: InsertInterviewQuestion): Promise<InterviewQuestion> {
    const [question] = await db.insert(interviewQuestions)
      .values({
        ...insertQuestion,
        strengths: insertQuestion.strengths || [],
        improvements: insertQuestion.improvements || [],
      })
      .returning();
    return question;
  }

  async updateInterviewQuestion(id: number, updates: Partial<InterviewQuestion>): Promise<InterviewQuestion | undefined> {
    const [updated] = await db.update(interviewQuestions)
      .set(updates)
      .where(eq(interviewQuestions.id, id))
      .returning();
    return updated || undefined;
  }

  // Interview feedback operations - Using PostgreSQL database for persistence
  async getInterviewFeedback(sessionId: number): Promise<InterviewFeedback | undefined> {
    const [feedback] = await db.select()
      .from(interviewFeedback)
      .where(eq(interviewFeedback.sessionId, sessionId));
    if (!feedback) return undefined;
    // Normalize jsonb arrays to ensure they're always arrays
    return {
      ...feedback,
      strengths: Array.isArray(feedback.strengths) ? feedback.strengths : [],
      improvements: Array.isArray(feedback.improvements) ? feedback.improvements : [],
      recommendations: Array.isArray(feedback.recommendations) ? feedback.recommendations : [],
    };
  }

  async createInterviewFeedback(insertFeedback: InsertInterviewFeedback): Promise<InterviewFeedback> {
    const [feedback] = await db.insert(interviewFeedback)
      .values(insertFeedback)
      .returning();
    return feedback;
  }

  // Company operations - DATABASE PERSISTED
  async getCompanies(): Promise<Company[]> {
    return await db.select().from(companies);
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const results = await db.select().from(companies)
      .where(eq(companies.id, id));
    return results[0];
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const results = await db.insert(companies).values({
      ...insertCompany,
      logo: insertCompany.logo || null,
      values: insertCompany.values || [],
      benefits: insertCompany.benefits || [],
      interviewStyle: insertCompany.interviewStyle || 'balanced',
      createdAt: new Date()
    }).returning();
    return results[0];
  }

  // Job posting operations - DATABASE PERSISTED
  async getJobPostings(filters?: { companyId?: number; role?: string; isActive?: boolean }): Promise<JobPosting[]> {
    let results = await db.select().from(jobPostings);
    if (filters?.companyId) {
      results = results.filter(p => p.companyId === filters.companyId);
    }
    if (filters?.role) {
      results = results.filter(p => p.role === filters.role);
    }
    if (filters?.isActive !== undefined) {
      results = results.filter(p => p.isActive === filters.isActive);
    }
    return results;
  }

  async getJobPosting(id: number): Promise<JobPosting | undefined> {
    const results = await db.select().from(jobPostings)
      .where(eq(jobPostings.id, id));
    return results[0];
  }

  async getJobPostingWithCompany(id: number): Promise<(JobPosting & { company: Company }) | undefined> {
    const postingResults = await db.select().from(jobPostings)
      .where(eq(jobPostings.id, id));
    const posting = postingResults[0];
    if (!posting) return undefined;
    const company = await this.getCompany(posting.companyId);
    if (!company) return undefined;
    return { ...posting, company };
  }

  async createJobPosting(insertPosting: InsertJobPosting): Promise<JobPosting> {
    const results = await db.insert(jobPostings).values({
      ...insertPosting,
      employmentType: insertPosting.employmentType || 'full-time',
      salaryMin: insertPosting.salaryMin || null,
      salaryMax: insertPosting.salaryMax || null,
      responsibilities: insertPosting.responsibilities || [],
      requirements: insertPosting.requirements || [],
      niceToHave: insertPosting.niceToHave || [],
      highlightedTerms: insertPosting.highlightedTerms || [],
      interviewStages: insertPosting.interviewStages || 3,
      isActive: insertPosting.isActive !== false,
      postedAt: new Date()
    }).returning();
    return results[0];
  }

  // Job glossary operations
  async getJobGlossary(): Promise<JobGlossary[]> {
    return Array.from(this.jobGlossaryMap.values());
  }

  async getJobGlossaryTerm(term: string): Promise<JobGlossary | undefined> {
    return Array.from(this.jobGlossaryMap.values()).find(t => t.term.toLowerCase() === term.toLowerCase());
  }

  async createJobGlossaryTerm(insertTerm: InsertJobGlossary): Promise<JobGlossary> {
    const id = this.currentJobGlossaryId++;
    const glossaryTerm: JobGlossary = {
      ...insertTerm,
      id,
      category: insertTerm.category || null,
      relatedTerms: insertTerm.relatedTerms || []
    };
    this.jobGlossaryMap.set(id, glossaryTerm);
    return glossaryTerm;
  }

  // Job application operations - DATABASE PERSISTED
  async getJobApplications(userId: number): Promise<JobApplication[]> {
    const results = await db.select().from(jobApplications)
      .where(eq(jobApplications.userId, userId))
      .orderBy(desc(jobApplications.createdAt));
    return results;
  }

  async getJobApplicationsWithDetails(userId: number): Promise<Array<JobApplication & { job: JobPosting & { company: Company }, stages: ApplicationStage[] }>> {
    const applications = await db.select().from(jobApplications)
      .where(eq(jobApplications.userId, userId))
      .orderBy(desc(jobApplications.createdAt));
    
    if (applications.length === 0) {
      return [];
    }

    const applicationIds = applications.map(app => app.id);
    const jobPostingIds = applications.map(app => app.jobPostingId);

    const [jobPostingsResults, stagesResults] = await Promise.all([
      db.select().from(jobPostings)
        .innerJoin(companies, eq(jobPostings.companyId, companies.id))
        .where(inArray(jobPostings.id, jobPostingIds)),
      db.select().from(applicationStages)
        .where(inArray(applicationStages.applicationId, applicationIds))
        .orderBy(applicationStages.stageOrder)
    ]);

    const jobPostingsMap = new Map(
      jobPostingsResults.map(result => [
        result.job_postings.id,
        { ...result.job_postings, company: result.companies }
      ])
    );

    const stagesByApplicationId = new Map<number, ApplicationStage[]>();
    for (const stage of stagesResults) {
      const stages = stagesByApplicationId.get(stage.applicationId) || [];
      stages.push(stage);
      stagesByApplicationId.set(stage.applicationId, stages);
    }

    return applications.map(app => ({
      ...app,
      job: jobPostingsMap.get(app.jobPostingId)!,
      stages: stagesByApplicationId.get(app.id) || []
    }));
  }

  async getJobApplication(id: number): Promise<JobApplication | undefined> {
    const results = await db.select().from(jobApplications)
      .where(eq(jobApplications.id, id));
    return results[0];
  }

  async createJobApplication(insertApplication: InsertJobApplication): Promise<JobApplication> {
    const results = await db.insert(jobApplications).values({
      ...insertApplication,
      status: insertApplication.status || 'draft',
      cvFileName: insertApplication.cvFileName || null,
      cvContent: insertApplication.cvContent || null,
      coverLetter: insertApplication.coverLetter || null,
      currentStageIndex: insertApplication.currentStageIndex || 0,
      hrContactedAt: insertApplication.hrContactedAt || null,
      offerDetails: insertApplication.offerDetails || null,
      notes: insertApplication.notes || null,
      appliedAt: insertApplication.appliedAt || null,
      updatedAt: new Date(),
      createdAt: new Date()
    }).returning();
    return results[0];
  }

  async updateJobApplication(id: number, updates: Partial<JobApplication>): Promise<JobApplication | undefined> {
    const results = await db.update(jobApplications)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(jobApplications.id, id))
      .returning();
    return results[0];
  }

  // Interview template operations
  async getInterviewTemplates(companyId?: number, role?: string): Promise<InterviewTemplate[]> {
    let templates = Array.from(this.interviewTemplatesMap.values());
    if (companyId) {
      templates = templates.filter(t => t.companyId === companyId || t.companyId === null);
    }
    if (role) {
      templates = templates.filter(t => t.role === role || t.role === null);
    }
    return templates;
  }

  async getInterviewTemplate(id: number): Promise<InterviewTemplate | undefined> {
    return this.interviewTemplatesMap.get(id);
  }

  async createInterviewTemplate(insertTemplate: InsertInterviewTemplate): Promise<InterviewTemplate> {
    const id = this.currentInterviewTemplateId++;
    const template: InterviewTemplate = {
      ...insertTemplate,
      id,
      companyId: insertTemplate.companyId || null,
      role: insertTemplate.role || null,
      totalDuration: insertTemplate.totalDuration || null,
      createdAt: new Date()
    };
    this.interviewTemplatesMap.set(id, template);
    return template;
  }

  // Application stage operations - DATABASE PERSISTED
  async getApplicationStages(applicationId: number): Promise<ApplicationStage[]> {
    const results = await db.select().from(applicationStages)
      .where(eq(applicationStages.applicationId, applicationId))
      .orderBy(applicationStages.stageOrder);
    return results;
  }

  async getApplicationStage(id: number): Promise<ApplicationStage | undefined> {
    const results = await db.select().from(applicationStages)
      .where(eq(applicationStages.id, id));
    return results[0];
  }

  async getApplicationStageByInterviewSession(interviewSessionId: number): Promise<ApplicationStage | undefined> {
    const results = await db.select().from(applicationStages)
      .where(eq(applicationStages.interviewSessionId, interviewSessionId));
    return results[0];
  }

  async createApplicationStage(insertStage: InsertApplicationStage): Promise<ApplicationStage> {
    const results = await db.insert(applicationStages).values({
      ...insertStage,
      status: insertStage.status || 'pending',
      interviewSessionId: insertStage.interviewSessionId || null,
      scheduledAt: insertStage.scheduledAt || null,
      completedAt: insertStage.completedAt || null,
      score: insertStage.score || null,
      feedback: insertStage.feedback || null,
      recruiterNotes: insertStage.recruiterNotes || null,
      createdAt: new Date()
    }).returning();
    return results[0];
  }

  async updateApplicationStage(id: number, updates: Partial<ApplicationStage>): Promise<ApplicationStage | undefined> {
    const results = await db.update(applicationStages)
      .set(updates)
      .where(eq(applicationStages.id, id))
      .returning();
    return results[0];
  }

  // Workspace progress operations
  async getWorkspaceProgress(userId: number, mode?: 'practice' | 'journey'): Promise<WorkspaceProgress[]> {
    if (mode) {
      const results = await db.select().from(workspaceProgress)
        .where(and(
          eq(workspaceProgress.userId, userId),
          eq(workspaceProgress.mode, mode)
        ))
        .orderBy(desc(workspaceProgress.lastActivityAt));
      return results;
    }
    const results = await db.select().from(workspaceProgress)
      .where(eq(workspaceProgress.userId, userId))
      .orderBy(desc(workspaceProgress.lastActivityAt));
    return results;
  }

  async getWorkspaceProgressBySession(sessionId: number): Promise<WorkspaceProgress | undefined> {
    const results = await db.select().from(workspaceProgress)
      .where(eq(workspaceProgress.sessionId, sessionId));
    return results[0];
  }

  async createWorkspaceProgress(insertProgress: InsertWorkspaceProgress): Promise<WorkspaceProgress> {
    const results = await db.insert(workspaceProgress).values({
      ...insertProgress,
      mode: insertProgress.mode || 'journey',
      currentDay: insertProgress.currentDay || 1,
      dayProgress: insertProgress.dayProgress || {},
      overallProgress: insertProgress.overallProgress || 0,
      status: insertProgress.status || 'in_progress',
      startedAt: new Date(),
      lastActivityAt: new Date()
    }).returning();
    return results[0];
  }

  async updateWorkspaceProgress(id: number, updates: Partial<WorkspaceProgress>): Promise<WorkspaceProgress | undefined> {
    const results = await db.update(workspaceProgress)
      .set({
        ...updates,
        lastActivityAt: new Date()
      })
      .where(eq(workspaceProgress.id, id))
      .returning();
    return results[0];
  }

  async restartWorkspaceProgress(sessionId: number): Promise<WorkspaceProgress | undefined> {
    const results = await db.update(workspaceProgress)
      .set({
        currentDay: 1,
        dayProgress: {},
        overallProgress: 0,
        status: 'in_progress',
        score: null,
        completedAt: null,
        lastActivityAt: new Date()
      })
      .where(eq(workspaceProgress.sessionId, sessionId))
      .returning();
    return results[0];
  }

  private async seedJobJourneyData() {
    // Check if data already exists in database - skip seeding if so
    const existingCompanies = await this.getCompanies();
    if (existingCompanies.length > 0) {
      console.log('Job journey data already exists in database, skipping seed...');
      return;
    }
    
    console.log('Seeding job journey data to database...');
    
    // Seed companies
    const companySeedData = [
      {
        name: 'QuantumSphere Innovations',
        logo: '🔮',
        industry: 'tech',
        size: 'mid-size',
        description: 'QuantumSphere Innovations is a cutting-edge AI and machine learning company building the next generation of intelligent enterprise solutions.',
        culture: 'Innovation-driven culture with emphasis on experimentation and learning. We believe in failing fast and iterating quickly.',
        values: ['Innovation', 'Collaboration', 'Transparency', 'Growth Mindset'],
        benefits: ['Unlimited PTO', 'Remote-first', 'Learning budget $2,000/year', 'Health + dental', 'Stock options'],
        interviewStyle: 'rigorous'
      },
      {
        name: 'CyberVortex Technologies',
        logo: '⚡',
        industry: 'tech',
        size: 'startup',
        description: 'CyberVortex Technologies is a fast-growing cybersecurity startup protecting enterprises from emerging digital threats.',
        culture: 'Fast-paced, mission-driven team focused on making the internet safer. We work hard and celebrate wins together.',
        values: ['Security First', 'Speed', 'Customer Obsession', 'Integrity'],
        benefits: ['Competitive salary', 'Equity package', 'Flexible hours', 'Team offsites', 'Latest MacBook'],
        interviewStyle: 'balanced'
      },
      {
        name: 'NanoByte Dynamics',
        logo: '🧬',
        industry: 'healthtech',
        size: 'enterprise',
        description: 'NanoByte Dynamics leverages nanotechnology and AI to revolutionize healthcare diagnostics and treatment.',
        culture: 'Scientific rigor meets startup agility. Our diverse team includes PhDs, engineers, and healthcare professionals.',
        values: ['Scientific Excellence', 'Patient Impact', 'Diversity', 'Ethical Innovation'],
        benefits: ['Comprehensive healthcare', '401k matching', 'Parental leave', 'On-site gym', 'Research publications'],
        interviewStyle: 'rigorous'
      },
      {
        name: 'HyperSynth Innovations',
        logo: '🚀',
        industry: 'fintech',
        size: 'mid-size',
        description: 'HyperSynth Innovations is transforming financial services with AI-powered trading and risk management solutions.',
        culture: 'Data-driven decision making with a focus on continuous improvement. We value both individual excellence and team collaboration.',
        values: ['Excellence', 'Data-Driven', 'Accountability', 'Innovation'],
        benefits: ['Bonus structure', 'Stock options', 'Premium insurance', 'Gym membership', 'Conference budget'],
        interviewStyle: 'rigorous'
      },
      {
        name: 'NebulaForge Solutions',
        logo: '☁️',
        industry: 'tech',
        size: 'startup',
        description: 'NebulaForge Solutions builds developer tools and cloud infrastructure that makes deploying applications effortless.',
        culture: 'Developer-first company built by developers. We use our own tools daily and obsess over developer experience.',
        values: ['Developer Experience', 'Simplicity', 'Open Source', 'Community'],
        benefits: ['Remote-first', 'Unlimited PTO', 'Conference sponsorship', 'Home office budget', 'Async-friendly'],
        interviewStyle: 'casual'
      },
      {
        name: 'DataViz Pro',
        logo: '📊',
        industry: 'tech',
        size: 'mid-size',
        description: 'Enterprise-grade data analytics and visualization platform helping companies turn data chaos into actionable insights. DataViz Pro connects to 100+ data sources with real-time dashboards, AI-powered anomaly detection, and predictive forecasting.',
        culture: 'Data-driven decision making with a focus on continuous improvement. We value both individual excellence and team collaboration. Fast-moving, innovative environment where ideas matter.',
        values: ['Empower data democratization', 'Customer obsession', 'Bias for speed', 'Continuous learning', 'Inclusive excellence'],
        benefits: ['Competitive salary + equity', 'Unlimited PTO', 'Health insurance (medical, dental, vision)', 'Learning budget $2k/year', 'Remote work flexibility', 'Team offsites 2x/year'],
        interviewStyle: 'balanced'
      },
      // 42 London Block 1 Companies
      {
        name: 'NovaPay',
        logo: '💳',
        industry: 'fintech',
        size: 'startup',
        description: 'NovaPay is a fast-growing fintech startup building a payment platform for small businesses. We help merchants accept payments, manage transactions, and grow their business with simple, powerful tools.',
        culture: 'Fast-paced but supportive. We move quickly but never break payments. Great place to learn - seniors love mentoring and everyone\'s voice matters.',
        values: ['Move fast, don\'t break payments', 'Mentorship matters', 'Simple beats clever', 'Customer empathy'],
        benefits: ['Competitive salary', 'Equity for all', 'Flexible hours', 'Learning budget', 'Team lunches'],
        interviewStyle: 'casual'
      }
    ];

    const createdCompanies: Company[] = [];
    for (const company of companySeedData) {
      createdCompanies.push(await this.createCompany(company));
    }

    // Seed job postings
    const jobPostingSeedData = [
      // QuantumSphere Innovations
      {
        companyId: createdCompanies[0].id,
        title: 'Junior Project Manager',
        role: 'pm',
        seniority: 'junior',
        department: 'Product',
        location: 'Remote',
        salaryMin: 70000,
        salaryMax: 90000,
        description: 'As an Associate Product Manager, you\'ll support the end-to-end product development process, collaborating with cross-functional teams. Your role involves market research, roadmap maintenance, and coordination to ensure timely product delivery.',
        responsibilities: [
          'Collaborate with cross-functional teams to assist in the development and execution of product strategies',
          'Conduct market research to identify trends, customer needs, and competitor activities',
          'Assist in creating and maintaining product roadmaps, ensuring alignment with company objectives',
          'Support the product lifecycle from ideation to launch, including product planning, development, and post-launch analysis'
        ],
        requirements: [
          '1-2 years of experience in product management or related field',
          'Strong analytical and problem-solving skills',
          'Excellent communication and interpersonal abilities',
          'Familiarity with agile methodologies'
        ],
        niceToHave: [
          'MBA or relevant certification',
          'Experience with product analytics tools',
          'Technical background'
        ],
        highlightedTerms: ['cross-functional teams', 'product development process', 'roadmap'],
        interviewStages: 3
      },
      // CyberVortex Technologies
      {
        companyId: createdCompanies[1].id,
        title: 'Junior Project Manager',
        role: 'pm',
        seniority: 'junior',
        department: 'Product',
        location: 'San Francisco, CA (Hybrid)',
        salaryMin: 75000,
        salaryMax: 95000,
        description: 'Join our growing product team to help shape the future of cybersecurity. You\'ll work closely with engineering and design to deliver features that protect millions of users.',
        responsibilities: [
          'Define and prioritize product features based on customer feedback and market analysis',
          'Work with UX designers to create intuitive security interfaces',
          'Coordinate with engineering on sprint planning and delivery',
          'Track product metrics and report on KPIs'
        ],
        requirements: [
          'Bachelor\'s degree in Business, Computer Science, or related field',
          'Understanding of software development lifecycle',
          'Strong written and verbal communication skills',
          'Ability to work in a fast-paced startup environment'
        ],
        highlightedTerms: ['sprint planning', 'KPIs', 'product metrics'],
        interviewStages: 3
      },
      // NanoByte Dynamics
      {
        companyId: createdCompanies[2].id,
        title: 'Mid Project Manager',
        role: 'pm',
        seniority: 'mid',
        department: 'Product',
        location: 'Boston, MA',
        salaryMin: 100000,
        salaryMax: 130000,
        description: 'Lead product initiatives at the intersection of healthcare and technology. Drive products that have direct impact on patient outcomes.',
        responsibilities: [
          'Own product strategy for key diagnostic platform features',
          'Partner with clinical and engineering teams to ensure regulatory compliance',
          'Conduct user research with healthcare professionals',
          'Define success metrics and monitor product performance'
        ],
        requirements: [
          '3-5 years of product management experience',
          'Experience in healthcare or regulated industries preferred',
          'Strong stakeholder management skills',
          'Data-driven decision making approach'
        ],
        highlightedTerms: ['regulatory compliance', 'stakeholder management', 'product strategy'],
        interviewStages: 4
      },
      // HyperSynth Innovations
      {
        companyId: createdCompanies[3].id,
        title: 'Senior Project Manager',
        role: 'pm',
        seniority: 'senior',
        department: 'Product',
        location: 'New York, NY',
        salaryMin: 140000,
        salaryMax: 180000,
        description: 'Lead product strategy for our flagship AI trading platform. You\'ll work with quants, engineers, and business stakeholders to define the future of algorithmic trading.',
        responsibilities: [
          'Define product vision and roadmap for trading platform features',
          'Partner with quantitative research team on feature prioritization',
          'Lead cross-functional teams through complex product launches',
          'Present to C-level executives on product strategy and performance'
        ],
        requirements: [
          '5+ years of product management experience',
          'Fintech or trading platform experience strongly preferred',
          'Strong analytical and quantitative skills',
          'Experience with agile methodologies at scale'
        ],
        highlightedTerms: ['product vision', 'C-level', 'algorithmic trading'],
        interviewStages: 5
      },
      // NebulaForge Solutions
      {
        companyId: createdCompanies[4].id,
        title: 'Junior Project Manager',
        role: 'pm',
        seniority: 'junior',
        department: 'Product',
        location: 'Remote',
        salaryMin: 65000,
        salaryMax: 85000,
        description: 'Help shape developer tools that thousands of engineers use daily. Perfect for someone who loves developer experience and wants to learn product management.',
        responsibilities: [
          'Gather and synthesize feedback from developer community',
          'Write product specs and user stories',
          'Work with engineering to ship features iteratively',
          'Contribute to product documentation and changelog'
        ],
        requirements: [
          'Technical background or strong technical aptitude',
          'Passion for developer tools and experience',
          'Strong writing skills',
          'Self-motivated and comfortable with ambiguity'
        ],
        highlightedTerms: ['user stories', 'developer experience', 'product specs'],
        interviewStages: 3
      },
      // Software Developer positions
      {
        companyId: createdCompanies[0].id,
        title: 'Senior Software Engineer',
        role: 'developer',
        seniority: 'senior',
        department: 'Engineering',
        location: 'Remote',
        salaryMin: 150000,
        salaryMax: 200000,
        description: 'Build the core AI infrastructure powering our enterprise solutions. Work with cutting-edge ML technologies and distributed systems.',
        responsibilities: [
          'Design and implement scalable backend services',
          'Lead technical architecture decisions',
          'Mentor junior engineers',
          'Collaborate with ML team on model deployment'
        ],
        requirements: [
          '5+ years of software engineering experience',
          'Strong experience with Python, Go, or Java',
          'Experience with distributed systems',
          'Cloud platform experience (AWS/GCP/Azure)'
        ],
        highlightedTerms: ['distributed systems', 'ML technologies', 'technical architecture'],
        interviewStages: 5
      },
      {
        companyId: createdCompanies[1].id,
        title: 'Mid-Level Software Engineer',
        role: 'developer',
        seniority: 'mid',
        department: 'Engineering',
        location: 'San Francisco, CA (Hybrid)',
        salaryMin: 120000,
        salaryMax: 160000,
        description: 'Build secure, reliable systems that protect our customers from cyber threats. Work on challenging problems in network security and threat detection.',
        responsibilities: [
          'Develop and maintain security monitoring systems',
          'Implement threat detection algorithms',
          'Participate in code reviews and security audits',
          'On-call rotation for critical security incidents'
        ],
        requirements: [
          '3-5 years of software development experience',
          'Experience with security tools and practices',
          'Proficiency in Python or Rust',
          'Understanding of network protocols'
        ],
        highlightedTerms: ['threat detection', 'security monitoring', 'code reviews'],
        interviewStages: 4
      },
      // DataViz Pro - Product Manager
      {
        companyId: createdCompanies[5].id,
        title: 'Senior Product Manager',
        role: 'pm',
        seniority: 'senior',
        department: 'Product',
        location: 'San Francisco, CA (Remote-friendly)',
        salaryMin: 180000,
        salaryMax: 250000,
        description: 'Lead product strategy for DataViz Pro\'s core platform. Work across AI/ML-powered analytics features, connecting 100+ data sources, and real-time dashboards. Drive decisions that impact thousands of enterprise customers.',
        responsibilities: [
          'Own product roadmap for AI Insights v2.0 and data connector ecosystem',
          'Conduct user research with enterprise data teams and executives',
          'Define success metrics and track feature adoption',
          'Lead cross-functional collaboration with engineering, data science, and design'
        ],
        requirements: [
          '5+ years of product management in SaaS/enterprise',
          'Experience with data products or analytics platforms',
          'Strong business acumen and metrics-driven thinking',
          'Ability to communicate complex technical concepts'
        ],
        niceToHave: [
          'Experience with machine learning or data science',
          'Background in data analytics or business intelligence',
          'Knowledge of enterprise sales cycles'
        ],
        highlightedTerms: ['enterprise customers', 'AI-powered analytics', 'data-driven', 'product roadmap', 'cross-functional'],
        interviewStages: 5
      },
      // DataViz Pro - Senior Backend Engineer
      {
        companyId: createdCompanies[5].id,
        title: 'Senior Backend Engineer',
        role: 'developer',
        seniority: 'senior',
        department: 'Engineering',
        location: 'Remote',
        salaryMin: 180000,
        salaryMax: 250000,
        description: 'Design and build scalable backend infrastructure for real-time data processing. Lead technical decisions on our data connector APIs, aggregation engine, and analytics pipeline handling 100+ concurrent customers.',
        responsibilities: [
          'Architect API infrastructure for 100+ data source connectors',
          'Optimize query performance and data aggregation at scale',
          'Lead system design decisions and technical reviews',
          'Mentor junior engineers and establish best practices'
        ],
        requirements: [
          '5+ years backend development at scale',
          'Proficiency in TypeScript/Node.js, Go, or Python',
          'Experience with PostgreSQL, caching layers, and distributed systems',
          'Strong understanding of data pipeline architecture'
        ],
        niceToHave: [
          'Experience building data connectors or ETL pipelines',
          'Knowledge of analytics databases (ClickHouse, Snowflake)',
          'Experience with Kubernetes or container orchestration'
        ],
        highlightedTerms: ['distributed systems', 'data pipeline', 'API architecture', 'PostgreSQL', 'system design'],
        interviewStages: 5
      },
      // DataViz Pro - Data Scientist
      {
        companyId: createdCompanies[5].id,
        title: 'Senior Data Scientist',
        role: 'data-scientist',
        seniority: 'senior',
        department: 'Data Science',
        location: 'Remote',
        salaryMin: 180000,
        salaryMax: 250000,
        description: 'Lead development of AI/ML features for anomaly detection and predictive forecasting. Build models that help enterprises find insights in their data and predict future trends.',
        responsibilities: [
          'Design and train machine learning models for anomaly detection and forecasting',
          'Collaborate with engineers to integrate models into production systems',
          'Conduct A/B tests and measure model performance in production',
          'Research and evaluate emerging AI/ML techniques for analytics'
        ],
        requirements: [
          '5+ years experience in machine learning and data science',
          'Strong expertise in Python, scikit-learn, TensorFlow, or PyTorch',
          'Experience with statistical analysis and hypothesis testing',
          'Ability to communicate findings to non-technical stakeholders'
        ],
        niceToHave: [
          'Experience with time-series forecasting models',
          'Knowledge of production ML systems and MLOps',
          'Background in data engineering or analytics',
          'Familiarity with real-time model serving'
        ],
        highlightedTerms: ['machine learning', 'anomaly detection', 'forecasting', 'A/B testing', 'model training'],
        interviewStages: 5
      },
      // NovaPay - Software Engineering Intern (42 London Block 1)
      {
        companyId: createdCompanies[6].id,
        title: 'Software Engineering Intern',
        role: 'developer',
        seniority: 'intern',
        department: 'Engineering',
        location: 'London, UK (Hybrid)',
        salaryMin: 25000,
        salaryMax: 30000,
        description: 'Join NovaPay\'s engineering team as an intern and get hands-on experience building payment infrastructure. You\'ll work alongside senior engineers, participate in code reviews, and contribute to real features used by thousands of merchants. Perfect for coding bootcamp students ready to experience professional software development.',
        responsibilities: [
          'Contribute to the Merchant Dashboard - our React-based admin panel',
          'Fix bugs and implement small features with guidance from senior engineers',
          'Participate in daily standups and team rituals',
          'Write clean, tested code following our engineering standards',
          'Learn Git workflows, code review practices, and agile development'
        ],
        requirements: [
          'Currently enrolled in a coding bootcamp or computer science program',
          'Basic understanding of programming concepts (variables, loops, functions)',
          'Familiarity with Git and command line basics',
          'Eagerness to learn and receive feedback',
          'Strong communication skills'
        ],
        niceToHave: [
          'Experience with C or shell scripting',
          'Personal projects on GitHub',
          'Interest in fintech or payments'
        ],
        highlightedTerms: ['code reviews', 'Git workflows', 'agile development', 'Merchant Dashboard', 'standups'],
        interviewStages: 2
      }
    ];

    for (const posting of jobPostingSeedData) {
      await this.createJobPosting(posting);
    }

    // Seed glossary terms
    const glossaryTerms = [
      { term: 'cross-functional teams', definition: 'Groups of people with different functional expertise working toward a common goal. In tech companies, this typically includes engineers, designers, product managers, and other specialists collaborating on projects.', category: 'business' },
      { term: 'product development process', definition: 'The complete journey of creating a product from initial idea through launch and iteration. Includes discovery, design, development, testing, and release phases.', category: 'product' },
      { term: 'roadmap', definition: 'A strategic document that outlines the vision, direction, and progress of a product over time. Shows planned features, milestones, and timelines.', category: 'product' },
      { term: 'sprint planning', definition: 'An agile ceremony where the team decides what work to commit to during an upcoming sprint (typically 2 weeks). Involves breaking down user stories into tasks.', category: 'engineering' },
      { term: 'KPIs', definition: 'Key Performance Indicators - measurable values that demonstrate how effectively a company or team is achieving key business objectives.', category: 'business' },
      { term: 'product metrics', definition: 'Quantitative data points used to track product performance, user behavior, and business outcomes. Examples include DAU, retention rate, and conversion rate.', category: 'product' },
      { term: 'regulatory compliance', definition: 'Ensuring products and processes adhere to relevant laws, regulations, and guidelines. Critical in industries like healthcare, finance, and security.', category: 'business' },
      { term: 'stakeholder management', definition: 'The process of managing expectations and communication with people who have an interest in a project\'s outcome, including executives, customers, and team members.', category: 'business' },
      { term: 'product strategy', definition: 'A high-level plan that defines what a product will achieve and how it supports business goals. Includes target market, value proposition, and competitive positioning.', category: 'product' },
      { term: 'user stories', definition: 'Short, simple descriptions of a feature told from the user\'s perspective. Format: "As a [user], I want [goal] so that [benefit]."', category: 'product' },
      { term: 'developer experience', definition: 'The overall experience developers have when using tools, APIs, or platforms. Includes documentation quality, ease of use, and developer productivity.', category: 'engineering' },
      { term: 'product specs', definition: 'Detailed documents that describe what a product or feature should do, including requirements, user flows, and acceptance criteria.', category: 'product' },
      { term: 'distributed systems', definition: 'Computer systems where components are located on different networked computers and communicate by passing messages. Designed for scalability and fault tolerance.', category: 'engineering' },
      { term: 'ML technologies', definition: 'Machine Learning technologies - tools, frameworks, and techniques for building systems that can learn from data. Includes neural networks, deep learning, and NLP.', category: 'engineering' },
      { term: 'technical architecture', definition: 'The structure and design of a software system, including components, their relationships, and the principles guiding its design and evolution.', category: 'engineering' },
      { term: 'product vision', definition: 'A long-term aspirational description of what a product aims to achieve and the impact it will have on users and the market.', category: 'product' },
      { term: 'C-level', definition: 'Top executives in an organization, typically including CEO (Chief Executive Officer), CTO (Chief Technology Officer), CFO (Chief Financial Officer), etc.', category: 'business' },
      { term: 'algorithmic trading', definition: 'Using computer algorithms to automatically execute trading strategies. Involves analyzing market data and executing trades at high speeds.', category: 'fintech' },
      { term: 'enterprise customers', definition: 'Large organizations (typically 500+ employees) that use software solutions for business operations. Usually require advanced features, security, and support.', category: 'business' },
      { term: 'AI-powered analytics', definition: 'Using artificial intelligence and machine learning to automatically analyze data, detect patterns, and provide insights without manual analysis.', category: 'engineering' },
      { term: 'data-driven', definition: 'Making decisions based on analysis of data rather than intuition. Involves measuring results and using metrics to guide strategy.', category: 'business' },
      { term: 'product roadmap', definition: 'A strategic timeline showing planned features, improvements, and releases. Communicates product direction to engineering, marketing, and customers.', category: 'product' },
      { term: 'API architecture', definition: 'The design and structure of APIs (Application Programming Interfaces) that define how external systems interact with your software.', category: 'engineering' },
      { term: 'data pipeline', definition: 'The series of processes that collect, transform, and move data from source systems to analysis tools. Core to data engineering.', category: 'engineering' },
      { term: 'machine learning', definition: 'Branch of AI where systems learn patterns from data to make predictions or decisions without explicit programming for each case.', category: 'engineering' },
      { term: 'anomaly detection', definition: 'Identifying unusual patterns or outliers in data that deviate significantly from normal behavior. Important for fraud detection and quality monitoring.', category: 'engineering' },
      { term: 'forecasting', definition: 'Using historical data and statistical/ML models to predict future values or trends. Common in sales, demand planning, and financial analysis.', category: 'business' },
      { term: 'A/B testing', definition: 'Comparing two versions of a product or feature (A and B) with different user groups to determine which performs better based on metrics.', category: 'product' },
      { term: 'model training', definition: 'The process of teaching machine learning models to recognize patterns by feeding them historical data and adjusting parameters.', category: 'engineering' },
      { term: 'data connector', definition: 'Software that links external data sources (databases, APIs, cloud services) to your analytics platform to enable data import.', category: 'engineering' },
      { term: 'real-time processing', definition: 'Processing and analyzing data as it arrives, rather than in batches. Enables immediate insights and quick responses to events.', category: 'engineering' },
      { term: 'dashboard', definition: 'A visual interface displaying key metrics, charts, and data visualizations. Helps users monitor performance and understand data at a glance.', category: 'product' },
      { term: 'data democratization', definition: 'Making data accessible to all employees, not just analysts. Empowers teams across the organization to make data-driven decisions.', category: 'business' },
      { term: 'SaaS', definition: 'Software as a Service - cloud-based software delivered over the internet by subscription. Users access via browser instead of installing locally.', category: 'business' }
    ];

    for (const term of glossaryTerms) {
      await this.createJobGlossaryTerm(term);
    }

    // Seed interview templates
    const interviewTemplateSeedData = [
      {
        name: 'Standard PM Interview (3 rounds)',
        role: 'pm',
        stages: [
          { order: 1, type: 'recruiter_call', name: 'Recruiter Screen', duration: 30, config: { interviewType: 'behavioral' } },
          { order: 2, type: 'behavioral', name: 'Hiring Manager Interview', duration: 45, config: { interviewType: 'behavioral' } },
          { order: 3, type: 'case_study', name: 'Product Case Study', duration: 60, config: { interviewType: 'case_study' } }
        ],
        totalDuration: 135
      },
      {
        name: 'Standard Developer Interview (5 rounds)',
        role: 'developer',
        stages: [
          { order: 1, type: 'recruiter_call', name: 'Recruiter Screen', duration: 30, config: { interviewType: 'behavioral' } },
          { order: 2, type: 'technical', name: 'Technical Phone Screen', duration: 45, config: { interviewType: 'technical' } },
          { order: 3, type: 'technical', name: 'Coding Interview', duration: 60, config: { interviewType: 'technical' } },
          { order: 4, type: 'technical', name: 'System Design', duration: 60, config: { interviewType: 'system-design' } },
          { order: 5, type: 'behavioral', name: 'Team Fit', duration: 45, config: { interviewType: 'behavioral' } }
        ],
        totalDuration: 240
      },
      {
        name: 'Standard Designer Interview (4 rounds)',
        role: 'designer',
        stages: [
          { order: 1, type: 'recruiter_call', name: 'Recruiter Screen', duration: 30, config: { interviewType: 'behavioral' } },
          { order: 2, type: 'portfolio', name: 'Portfolio Review', duration: 60, config: { interviewType: 'behavioral' } },
          { order: 3, type: 'case_study', name: 'Design Challenge', duration: 90, config: { interviewType: 'case_study' } },
          { order: 4, type: 'behavioral', name: 'Team Fit', duration: 45, config: { interviewType: 'behavioral' } }
        ],
        totalDuration: 225
      },
      {
        companyId: createdCompanies[5].id,
        name: 'DataViz Pro - Product Manager Interview',
        role: 'pm',
        stages: [
          { order: 1, type: 'recruiter_call', name: 'Recruiter Screen', duration: 30, config: { interviewType: 'behavioral' } },
          { order: 2, type: 'behavioral', name: 'PM Case Study Round', duration: 60, config: { interviewType: 'case_study' } },
          { order: 3, type: 'behavioral', name: 'Metrics & Analytics Round', duration: 45, config: { interviewType: 'behavioral' } },
          { order: 4, type: 'behavioral', name: 'Cross-functional Collaboration', duration: 60, config: { interviewType: 'behavioral' } },
          { order: 5, type: 'behavioral', name: 'VP Product Interview', duration: 45, config: { interviewType: 'behavioral' } }
        ],
        totalDuration: 240
      },
      {
        companyId: createdCompanies[5].id,
        name: 'DataViz Pro - Backend Engineer Interview',
        role: 'developer',
        stages: [
          { order: 1, type: 'recruiter_call', name: 'Recruiter Screen', duration: 30, config: { interviewType: 'behavioral' } },
          { order: 2, type: 'technical', name: 'Technical Screening', duration: 45, config: { interviewType: 'technical' } },
          { order: 3, type: 'technical', name: 'Coding Interview', duration: 75, config: { interviewType: 'technical' } },
          { order: 4, type: 'technical', name: 'System Design (Data Pipeline)', duration: 90, config: { interviewType: 'system-design' } },
          { order: 5, type: 'behavioral', name: 'Team Fit & Leadership', duration: 60, config: { interviewType: 'behavioral' } }
        ],
        totalDuration: 300
      },
      {
        companyId: createdCompanies[5].id,
        name: 'DataViz Pro - Data Scientist Interview',
        role: 'data-scientist',
        stages: [
          { order: 1, type: 'recruiter_call', name: 'Recruiter Screen', duration: 30, config: { interviewType: 'behavioral' } },
          { order: 2, type: 'technical', name: 'Statistics & ML Fundamentals', duration: 60, config: { interviewType: 'technical' } },
          { order: 3, type: 'case_study', name: 'ML Case Study', duration: 90, config: { interviewType: 'case_study' } },
          { order: 4, type: 'behavioral', name: 'Experimentation & Metrics', duration: 60, config: { interviewType: 'behavioral' } },
          { order: 5, type: 'behavioral', name: 'Head of Data Science Interview', duration: 45, config: { interviewType: 'behavioral' } }
        ],
        totalDuration: 285
      }
    ];

    for (const template of interviewTemplateSeedData) {
      await this.createInterviewTemplate(template);
    }

    // Seed a completed Data Scientist application with all stages passed
    // Find the Data Scientist job posting at DataViz Pro from database
    const allPostings = await this.getJobPostings();
    const dataSciPosting = allPostings.find(p => p.title === 'Senior Data Scientist' && p.role === 'data-scientist');
    
    if (dataSciPosting) {
      // Use user ID 1 (the first registered user - typically "arsen")
      // This ensures the seeded application shows up for the logged-in user
      const userId = 1;

      // Generate dates for the offer
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() + 21);
      const deadline = new Date(today);
      deadline.setDate(deadline.getDate() + 7);
      
      const formatDate = (date: Date) => date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Create the job application with offer status and realistic offer details
      const application = await this.createJobApplication({
        userId: userId,
        jobPostingId: dataSciPosting.id,
        status: 'offer',
        cvFileName: 'alex_chen_resume.pdf',
        cvContent: `ALEX CHEN - Senior Data Scientist
Contact: alex.chen@email.com | San Francisco, CA

SUMMARY
Experienced data scientist with 7+ years leading ML initiatives at Fortune 500 companies. 
PhD in Computer Science from Stanford. Published researcher with expertise in predictive modeling and NLP.

EXPERIENCE
Lead Data Scientist | TechCorp Inc. | 2020-Present
- Led team of 5 data scientists building predictive models for customer churn
- Improved prediction accuracy by 35% using ensemble methods
- Built real-time ML pipeline processing 10M+ events daily

Senior Data Scientist | DataDriven Labs | 2018-2020
- Developed NLP models for sentiment analysis with 92% accuracy
- Created automated reporting dashboards saving 20 hours/week

EDUCATION
PhD Computer Science - Stanford University | 2018
BS Computer Science - MIT | 2014

SKILLS
Python, TensorFlow, PyTorch, SQL, Spark, AWS, Kubernetes`,
        coverLetter: 'I am thrilled to apply for the Senior Data Scientist position at DataViz Pro. With my extensive background in machine learning and data visualization, I believe I can contribute significantly to your mission of helping enterprises make sense of complex data.',
        currentStageIndex: 5,
        offerDetails: {
          baseSalary: 155000,
          salaryFrequency: 'annual',
          signingBonus: 15000,
          annualBonus: {
            targetPercent: 15,
            description: 'Based on individual and company performance, paid annually'
          },
          equity: {
            type: 'rsu',
            amount: 40000,
            vestingSchedule: '4-year vesting with 1-year cliff',
            cliffMonths: 12,
            totalVestingMonths: 48
          },
          benefits: {
            healthInsurance: 'Premium PPO medical, including family coverage (100% employer paid for employee)',
            dentalVision: true,
            retirement401k: {
              available: true,
              matchPercent: 4,
              maxMatch: 8000
            },
            pto: {
              days: 20,
              type: 'accrued'
            },
            remote: 'hybrid',
            otherBenefits: [
              'Life and disability insurance',
              'Employee Assistance Program (EAP)',
              'Professional development budget ($2,000/year)',
              'Home office stipend ($500)',
              'Wellness program'
            ]
          },
          startDate: formatDate(startDate),
          responseDeadline: formatDate(deadline),
          reportingTo: 'Head of Data Science',
          teamSize: 6,
          offerDate: formatDate(today),
          offerLetterSignatory: 'Amanda Rodriguez',
          offerLetterSignatoryTitle: 'Chief People Officer'
        }
      });

      // Create all 5 interview stages as passed
      const stagesData = [
        { order: 1, name: 'Recruiter Screen', type: 'recruiter_call', score: 88, feedback: 'Excellent communication skills. Very enthusiastic about the role and company mission. Strong background evident.' },
        { order: 2, name: 'Statistics & ML Fundamentals', type: 'technical', score: 92, feedback: 'Demonstrated deep understanding of ML algorithms. Excellent problem-solving approach. Explained complex concepts clearly.' },
        { order: 3, name: 'ML Case Study', type: 'case_study', score: 90, feedback: 'Presented compelling approach to anomaly detection problem. Strong analytical thinking and creative solutions.' },
        { order: 4, name: 'Experimentation & Metrics', type: 'behavioral', score: 87, feedback: 'Great understanding of A/B testing and experimentation. Solid approach to defining and tracking metrics.' },
        { order: 5, name: 'Head of Data Science Interview', type: 'behavioral', score: 94, feedback: 'Culture fit is excellent. Strong leadership potential. Team player with clear vision for advancing data science at DataViz Pro.' }
      ];

      for (const stage of stagesData) {
        await this.createApplicationStage({
          applicationId: application.id,
          stageOrder: stage.order,
          stageName: stage.name,
          stageType: stage.type as 'recruiter_call' | 'technical' | 'behavioral' | 'case_study' | 'portfolio' | 'onsite',
          status: 'passed',
          completedAt: new Date(Date.now() - (6 - stage.order) * 2 * 24 * 60 * 60 * 1000), // Stagger completion dates
          score: stage.score,
          feedback: stage.feedback
        });
      }

      // Seed user progress for the completed interviews
      const avgScore = Math.round(stagesData.reduce((sum, s) => sum + s.score, 0) / stagesData.length);
      await this.createUserProgress({
        userId: userId,
        simulationType: 'interview',
        totalSessions: 5,
        completedSessions: 5,
        averageScore: avgScore,
        totalTime: 285 * 60, // Total interview duration in seconds
      });
    }
  }

  private async seedSprintWorkflowData() {
    // Check if sprint workflow data already exists - skip if so
    const existingJourneys = await db.select().from(userJourneys).limit(1);
    if (existingJourneys.length > 0) {
      console.log('Sprint workflow data already exists, skipping seed...');
      return;
    }

    console.log('Seeding sprint workflow data...');

    // Get or create progression path
    let progressionPath;
    const existingPaths = await db.select().from(progressionPaths).where(eq(progressionPaths.slug, 'intern-to-junior')).limit(1);
    if (existingPaths.length > 0) {
      progressionPath = existingPaths[0];
    } else {
      const [newPath] = await db.insert(progressionPaths).values({
        slug: 'intern-to-junior',
        entryLevel: 'intern',
        exitLevel: 'junior',
        role: 'developer',
        displayName: 'Intern to Junior Developer',
        description: 'Progress from Intern to Junior Ready through realistic work simulations',
        requirements: { minSprints: 3, maxSprints: 8, readinessThreshold: 85 },
        difficultyProgression: { startDifficulty: 1, endDifficulty: 3, curve: 'linear' },
        exitBadge: 'Junior Ready Developer',
        competencyFocus: ['code-quality', 'git-workflow', 'communication', 'problem-solving'],
        estimatedDuration: '4-8 weeks',
      }).returning();
      progressionPath = newPath;
    }

    // Get or create project template
    let projectTemplate;
    const existingTemplates = await db.select().from(projectTemplates).where(eq(projectTemplates.slug, 'novapay-payment-platform')).limit(1);
    if (existingTemplates.length > 0) {
      projectTemplate = existingTemplates[0];
    } else {
      const [newTemplate] = await db.insert(projectTemplates).values({
        slug: 'novapay-payment-platform',
        name: 'NovaPay Payment Platform',
        description: 'A fintech payment processing platform for small businesses',
        industry: 'fintech',
        domain: 'payments',
        teamTopology: { structure: 'squad', size: 6 },
        team: [
          { id: 'tm-1', name: 'Sarah Chen', role: 'Engineering Manager', avatar: null },
          { id: 'tm-2', name: 'Marcus Johnson', role: 'Senior Developer', avatar: null },
          { id: 'tm-3', name: 'Priya Patel', role: 'Product Manager', avatar: null },
          { id: 'tm-4', name: 'Alex Rivera', role: 'QA Engineer', avatar: null },
        ],
        codebase: { language: 'typescript', framework: 'react', complexity: 'medium' },
        backlogThemes: ['payments', 'user-management', 'dashboard', 'notifications'],
        bugTemplates: ['null-pointer', 'ui-responsive', 'api-error-handling'],
        featureTemplates: ['add-field', 'loading-state', 'validation'],
        softSkillPacks: ['standup', 'code-review', 'pair-programming'],
        sprintCadence: 10,
        techStack: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
        language: 'typescript',
        progressionPathId: progressionPath.id,
      }).returning();
      projectTemplate = newTemplate;
    }

    // Get the job application with 'offer' status for user 1
    const offerApplications = await db.select()
      .from(jobApplications)
      .where(eq(jobApplications.userId, 1))
      .orderBy(jobApplications.id)
      .limit(1);
    
    const jobApplicationId = offerApplications.length > 0 ? offerApplications[0].id : null;

    // Create a journey for user 1 with accepted application
    const journey = await this.createJourney({
      userId: 1,
      progressionPathId: progressionPath.id,
      projectTemplateId: projectTemplate.id,
      jobApplicationId: jobApplicationId,
      status: 'in_progress',
      currentArcId: null,
      currentSprintNumber: 1,
      completedSprints: 0,
      readinessScore: 25,
      exitTrigger: null,
      journeyMetadata: {
        companyName: 'NovaPay',
        role: 'Junior Developer',
        level: 'intern',
      },
    });

    // Create a journey arc first
    const [arc] = await db.insert(journeyArcs).values({
      journeyId: journey.id,
      arcType: 'sprint',
      arcOrder: 1,
      name: 'Sprint 1: Onboarding',
      description: 'Your first sprint - get familiar with the codebase and team',
      status: 'active',
      difficultyBand: 'guided',
      durationDays: 10,
      competencyFocus: ['code-quality', 'git-workflow'],
      isFinalArc: false,
      arcData: { theme: 'Onboarding' },
    }).returning();

    // Update journey with current arc
    await db.update(userJourneys)
      .set({ currentArcId: arc.id })
      .where(eq(userJourneys.id, journey.id));

    // Create the first sprint with proper schema structure
    const [sprint] = await db.insert(sprints).values({
      arcId: arc.id,
      sprintNumber: 1,
      goal: 'Complete onboarding to start your first sprint',
      theme: 'Onboarding',
      backlog: [
        { id: 1, title: 'Fix login button', type: 'bug', points: 3 },
        { id: 2, title: 'Add loading spinner', type: 'feature', points: 2 },
        { id: 3, title: 'Review documentation', type: 'task', points: 1 },
        { id: 4, title: 'Fix null pointer', type: 'bug', points: 5 },
        { id: 5, title: 'Update profile API', type: 'feature', points: 2 },
      ],
      userTickets: [1, 2, 3], // Ticket IDs assigned to user
      teamTickets: [4, 5], // Ticket IDs for AI team
      storyPointsTarget: 13,
      storyPointsCompleted: 0,
      ceremonies: {
        planning: { status: 'pending', scheduledDay: 1 },
        standup: { status: 'pending', scheduledDay: 2 },
        review: { status: 'pending', scheduledDay: 10 },
        retrospective: { status: 'pending', scheduledDay: 10 },
      },
      sprintState: { currentDay: 1, phase: 'planning' },
    }).returning();

    // Create sprint tickets
    const ticketData = [
      {
        sprintId: sprint.id,
        ticketKey: 'NOVA-101',
        title: 'Fix login button not responding on mobile',
        description: 'Users report that the login button on mobile devices does not respond to taps. Investigate and fix the issue.',
        type: 'bug' as const,
        priority: 'high' as const,
        status: 'todo' as const,
        storyPoints: 3,
        acceptanceCriteria: ['Login button responds to taps on iOS and Android', 'No regression on desktop'],
        dayAssigned: 1,
      },
      {
        sprintId: sprint.id,
        ticketKey: 'NOVA-102',
        title: 'Add loading spinner to dashboard',
        description: 'The dashboard currently shows a blank screen while loading data. Add a loading spinner for better UX.',
        type: 'feature' as const,
        priority: 'medium' as const,
        status: 'todo' as const,
        storyPoints: 2,
        acceptanceCriteria: ['Spinner displays while data is loading', 'Spinner disappears when data loads'],
        dayAssigned: 1,
      },
      {
        sprintId: sprint.id,
        ticketKey: 'NOVA-103',
        title: 'Review onboarding documentation',
        description: 'Read through the developer onboarding docs and note any questions or unclear sections.',
        type: 'feature' as const,
        priority: 'low' as const,
        status: 'todo' as const,
        storyPoints: 1,
        acceptanceCriteria: ['Docs reviewed', 'Questions documented'],
        dayAssigned: 2,
      },
      {
        sprintId: sprint.id,
        ticketKey: 'NOVA-104',
        title: 'Fix null pointer in payment processing',
        description: 'The payment processing module throws a null pointer exception when the user has no saved cards.',
        type: 'bug' as const,
        priority: 'high' as const,
        status: 'todo' as const,
        storyPoints: 5,
        acceptanceCriteria: ['No crash when user has no saved cards', 'Proper error message shown'],
        dayAssigned: 3,
      },
      {
        sprintId: sprint.id,
        ticketKey: 'NOVA-105',
        title: 'Update user profile API endpoint',
        description: 'Add email verification field to the user profile API response.',
        type: 'feature' as const,
        priority: 'medium' as const,
        status: 'todo' as const,
        storyPoints: 2,
        acceptanceCriteria: ['API returns emailVerified field', 'Field is boolean'],
        dayAssigned: 4,
      },
    ];

    for (const ticket of ticketData) {
      await this.createSprintTicket(ticket);
    }

    // Create ceremonies for the sprint
    const ceremonyData = [
      {
        sprintId: sprint.id,
        ceremonyType: 'planning' as const,
        status: 'pending' as const,
        dayNumber: 1,
      },
      {
        sprintId: sprint.id,
        ceremonyType: 'standup' as const,
        status: 'pending' as const,
        dayNumber: 2,
      },
      {
        sprintId: sprint.id,
        ceremonyType: 'review' as const,
        status: 'pending' as const,
        dayNumber: 10,
      },
      {
        sprintId: sprint.id,
        ceremonyType: 'retrospective' as const,
        status: 'pending' as const,
        dayNumber: 10,
      },
    ];

    for (const ceremony of ceremonyData) {
      await this.createCeremonyInstance(ceremony);
    }

    console.log('Sprint workflow data seeded successfully!');
  }

  // Phase 1: Competency operations
  async getCompetencies(filters?: { role?: string; category?: string }): Promise<Competency[]> {
    let query = db.select().from(competencies);
    
    const conditions: any[] = [];
    if (filters?.role) {
      conditions.push(or(eq(competencies.role, filters.role), sql`${competencies.role} IS NULL`));
    }
    if (filters?.category) {
      conditions.push(eq(competencies.category, filters.category));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(competencies).where(and(...conditions));
    }
    return await db.select().from(competencies);
  }

  async getCompetency(slug: string): Promise<Competency | undefined> {
    const results = await db.select().from(competencies).where(eq(competencies.slug, slug));
    return results[0];
  }

  // Phase 1: Simulation Catalogue operations
  async getCatalogueItems(filters?: { 
    simulator?: string; 
    type?: string;
    role?: string; 
    level?: string; 
    language?: string;
    day?: number;
  }): Promise<SimulationCatalogue[]> {
    const conditions: any[] = [];
    
    if (filters?.simulator) {
      conditions.push(eq(simulationCatalogue.simulator, filters.simulator));
    }
    if (filters?.type) {
      conditions.push(eq(simulationCatalogue.type, filters.type));
    }
    if (filters?.role) {
      conditions.push(or(eq(simulationCatalogue.role, filters.role), sql`${simulationCatalogue.role} IS NULL`));
    }
    if (filters?.level) {
      conditions.push(or(eq(simulationCatalogue.level, filters.level), sql`${simulationCatalogue.level} IS NULL`));
    }
    if (filters?.language) {
      conditions.push(or(eq(simulationCatalogue.language, filters.language), sql`${simulationCatalogue.language} IS NULL`));
    }
    if (filters?.day !== undefined) {
      conditions.push(eq(simulationCatalogue.day, filters.day));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(simulationCatalogue).where(and(...conditions));
    }
    return await db.select().from(simulationCatalogue);
  }

  async getCatalogueItem(externalId: string): Promise<SimulationCatalogue | undefined> {
    const results = await db.select().from(simulationCatalogue).where(eq(simulationCatalogue.externalId, externalId));
    return results[0];
  }

  async getCatalogueItemById(id: number): Promise<SimulationCatalogue | undefined> {
    const results = await db.select().from(simulationCatalogue).where(eq(simulationCatalogue.id, id));
    return results[0];
  }

  // Phase 1: Role Adapter operations
  async getRoleAdapters(): Promise<RoleAdapter[]> {
    return await db.select().from(roleAdapters);
  }

  async getRoleAdapter(role: string): Promise<RoleAdapter | undefined> {
    const results = await db.select().from(roleAdapters).where(eq(roleAdapters.role, role));
    return results[0];
  }

  // Phase 1: Competency Ledger operations
  async getUserCompetencyLedger(userId: number): Promise<CompetencyLedger[]> {
    return await db.select().from(competencyLedger)
      .where(eq(competencyLedger.userId, userId));
  }

  async getUserCompetencyEntry(userId: number, competencyId: number): Promise<CompetencyLedger | undefined> {
    const results = await db.select().from(competencyLedger)
      .where(and(
        eq(competencyLedger.userId, userId),
        eq(competencyLedger.competencyId, competencyId)
      ));
    return results[0];
  }

  async createCompetencyEntry(entry: InsertCompetencyLedger): Promise<CompetencyLedger> {
    const results = await db.insert(competencyLedger).values({
      ...entry,
      currentBand: entry.currentBand || 'explorer',
      evidenceCount: entry.evidenceCount || 0,
      confidence: entry.confidence || 0,
      history: entry.history || [],
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return results[0];
  }

  async updateCompetencyEntry(id: number, updates: Partial<CompetencyLedger>): Promise<CompetencyLedger | undefined> {
    const results = await db.update(competencyLedger)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(competencyLedger.id, id))
      .returning();
    return results[0];
  }

  async getUserReadiness(userId: number): Promise<ReadinessScore> {
    // Get all competencies for this user
    const ledgerEntries = await this.getUserCompetencyLedger(userId);
    const allCompetencies = await this.getCompetencies();
    
    // Build competency map for quick lookup
    const competencyMap = new Map(allCompetencies.map(c => [c.id, c]));
    
    // Build breakdown with existing data
    const competencyBreakdown = allCompetencies.map(comp => {
      const entry = ledgerEntries.find(e => e.competencyId === comp.id);
      return {
        slug: comp.slug,
        name: comp.name,
        band: (entry?.currentBand || 'explorer') as 'explorer' | 'contributor' | 'junior_ready',
        confidence: entry?.confidence || 0,
        evidenceCount: entry?.evidenceCount || 0,
      };
    });
    
    // Calculate band weights: explorer=1, contributor=2, junior_ready=3
    const bandWeights: Record<string, number> = { 'explorer': 1, 'contributor': 2, 'junior_ready': 3 };
    const avgWeight = competencyBreakdown.length > 0
      ? competencyBreakdown.reduce((sum, c) => sum + (bandWeights[c.band] || 1), 0) / competencyBreakdown.length
      : 1;
    
    // Determine overall band based on average weight
    let currentBand: 'explorer' | 'contributor' | 'junior_ready';
    if (avgWeight >= 2.5) {
      currentBand = 'junior_ready';
    } else if (avgWeight >= 1.5) {
      currentBand = 'contributor';
    } else {
      currentBand = 'explorer';
    }
    
    // Calculate overall score (0-100 based on bands and confidence)
    const avgConfidence = competencyBreakdown.length > 0
      ? competencyBreakdown.reduce((sum, c) => sum + c.confidence, 0) / competencyBreakdown.length
      : 0;
    const overallScore = Math.round((avgWeight / 3) * 100 * 0.7 + avgConfidence * 0.3);
    
    // Identify gaps (low confidence or explorer band)
    const gaps = competencyBreakdown
      .filter(c => c.band === 'explorer' || c.confidence < 30)
      .map(c => c.slug);
    
    // Identify strengths (high confidence and contributor or above)
    const strengths = competencyBreakdown
      .filter(c => c.band !== 'explorer' && c.confidence >= 70)
      .map(c => c.slug);
    
    return {
      overallScore,
      currentBand,
      competencyBreakdown,
      gaps,
      strengths,
    };
  }

  // Phase 1: Portfolio Artifact operations
  async getUserPortfolio(userId: number): Promise<PortfolioArtifact[]> {
    return await db.select().from(portfolioArtifacts)
      .where(eq(portfolioArtifacts.userId, userId))
      .orderBy(desc(portfolioArtifacts.createdAt));
  }

  async getPortfolioArtifact(id: number): Promise<PortfolioArtifact | undefined> {
    const results = await db.select().from(portfolioArtifacts).where(eq(portfolioArtifacts.id, id));
    return results[0];
  }

  async createPortfolioArtifact(artifact: InsertPortfolioArtifact): Promise<PortfolioArtifact> {
    const results = await db.insert(portfolioArtifacts).values({
      ...artifact,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return results[0];
  }

  // ============================================================================
  // PHASE 3: NARRATIVE ARCHITECTURE OPERATIONS
  // ============================================================================

  // Progression Path operations
  async getProgressionPaths(filters?: { role?: string; entryLevel?: string }): Promise<ProgressionPath[]> {
    const conditions: any[] = [];
    
    if (filters?.role) {
      conditions.push(eq(progressionPaths.role, filters.role));
    }
    if (filters?.entryLevel) {
      conditions.push(eq(progressionPaths.entryLevel, filters.entryLevel));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(progressionPaths).where(and(...conditions));
    }
    return await db.select().from(progressionPaths);
  }

  async getProgressionPath(slug: string): Promise<ProgressionPath | undefined> {
    const results = await db.select().from(progressionPaths).where(eq(progressionPaths.slug, slug));
    return results[0];
  }

  async getProgressionPathById(id: number): Promise<ProgressionPath | undefined> {
    const results = await db.select().from(progressionPaths).where(eq(progressionPaths.id, id));
    return results[0];
  }

  async createProgressionPath(path: InsertProgressionPath): Promise<ProgressionPath> {
    const results = await db.insert(progressionPaths).values({
      ...path,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return results[0];
  }

  // Project Template operations
  async getProjectTemplates(filters?: { language?: string; industry?: string }): Promise<ProjectTemplate[]> {
    const conditions: any[] = [];
    
    if (filters?.language) {
      conditions.push(eq(projectTemplates.language, filters.language));
    }
    if (filters?.industry) {
      conditions.push(eq(projectTemplates.industry, filters.industry));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(projectTemplates).where(and(...conditions));
    }
    return await db.select().from(projectTemplates);
  }

  async getProjectTemplate(slug: string): Promise<ProjectTemplate | undefined> {
    const results = await db.select().from(projectTemplates).where(eq(projectTemplates.slug, slug));
    return results[0];
  }

  async getProjectTemplateById(id: number): Promise<ProjectTemplate | undefined> {
    const results = await db.select().from(projectTemplates).where(eq(projectTemplates.id, id));
    return results[0];
  }

  async createProjectTemplate(template: InsertProjectTemplate): Promise<ProjectTemplate> {
    const results = await db.insert(projectTemplates).values({
      ...template,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return results[0];
  }

  // User Journey operations
  async getUserJourneys(userId: number): Promise<UserJourney[]> {
    return await db.select().from(userJourneys)
      .where(eq(userJourneys.userId, userId))
      .orderBy(desc(userJourneys.startedAt));
  }

  async getUserActiveJourney(userId: number): Promise<UserJourney | undefined> {
    const results = await db.select().from(userJourneys)
      .where(and(
        eq(userJourneys.userId, userId),
        eq(userJourneys.status, 'active')
      ))
      .limit(1);
    return results[0];
  }

  async getJourney(id: number): Promise<UserJourney | undefined> {
    const results = await db.select().from(userJourneys).where(eq(userJourneys.id, id));
    return results[0];
  }

  async createJourney(journey: InsertUserJourney): Promise<UserJourney> {
    const results = await db.insert(userJourneys).values({
      ...journey,
      status: journey.status || 'active',
      currentSprintNumber: journey.currentSprintNumber || 0,
      completedSprints: journey.completedSprints || 0,
      readinessScore: journey.readinessScore || 0,
      journeyMetadata: journey.journeyMetadata || {},
      startedAt: new Date(),
      lastActivityAt: new Date()
    }).returning();
    return results[0];
  }

  async updateJourney(id: number, updates: Partial<UserJourney>): Promise<UserJourney | undefined> {
    const results = await db.update(userJourneys)
      .set({
        ...updates,
        lastActivityAt: new Date()
      })
      .where(eq(userJourneys.id, id))
      .returning();
    return results[0];
  }

  async getJourneyState(journeyId: number): Promise<JourneyState | null> {
    const journey = await this.getJourney(journeyId);
    if (!journey) return null;

    const currentArc = journey.currentArcId 
      ? await this.getJourneyArc(journey.currentArcId) 
      : await this.getCurrentArc(journeyId);
    
    let currentSprint: Sprint | null = null;
    let todayActivities: SprintActivity[] = [];
    
    if (currentArc && currentArc.arcType === 'sprint') {
      currentSprint = await this.getSprintByArc(currentArc.id) || null;
      if (currentSprint) {
        const sprintState = currentSprint.sprintState as { currentDay?: number } || {};
        const currentDay = sprintState.currentDay || 1;
        todayActivities = await this.getSprintActivities(currentSprint.id, currentDay);
      }
    }

    // Get progression path for exit requirements
    const progressionPath = await this.getProgressionPathById(journey.progressionPathId);
    const requirements = progressionPath?.requirements as { minSprints?: number; maxSprints?: number; readinessThreshold?: number } || {};
    
    const canGraduate = journey.completedSprints >= (requirements.minSprints || 2) && 
      (journey.readinessScore >= (requirements.readinessThreshold || 85) || 
       journey.completedSprints >= (requirements.maxSprints || 8));

    return {
      journey,
      currentArc: currentArc || null,
      currentSprint,
      currentDay: currentSprint ? ((currentSprint.sprintState as { currentDay?: number })?.currentDay || 1) : 1,
      todayActivities,
      readinessScore: journey.readinessScore,
      canGraduate,
      exitOptions: {
        userChoice: journey.completedSprints >= (requirements.minSprints || 2),
        readinessThreshold: journey.readinessScore >= (requirements.readinessThreshold || 85),
        maxSprints: journey.completedSprints >= (requirements.maxSprints || 8)
      }
    };
  }

  // Journey Arc operations
  async getJourneyArcs(journeyId: number): Promise<JourneyArc[]> {
    return await db.select().from(journeyArcs)
      .where(eq(journeyArcs.journeyId, journeyId))
      .orderBy(journeyArcs.arcOrder);
  }

  async getJourneyArc(id: number): Promise<JourneyArc | undefined> {
    const results = await db.select().from(journeyArcs).where(eq(journeyArcs.id, id));
    return results[0];
  }

  async getCurrentArc(journeyId: number): Promise<JourneyArc | undefined> {
    const results = await db.select().from(journeyArcs)
      .where(and(
        eq(journeyArcs.journeyId, journeyId),
        eq(journeyArcs.status, 'active')
      ))
      .limit(1);
    return results[0];
  }

  async createJourneyArc(arc: InsertJourneyArc): Promise<JourneyArc> {
    const results = await db.insert(journeyArcs).values({
      ...arc,
      status: arc.status || 'pending',
      difficultyBand: arc.difficultyBand || 'guided',
      durationDays: arc.durationDays || 5,
      isFinalArc: arc.isFinalArc || false,
      arcData: arc.arcData || {},
      createdAt: new Date()
    }).returning();
    return results[0];
  }

  async updateJourneyArc(id: number, updates: Partial<JourneyArc>): Promise<JourneyArc | undefined> {
    const results = await db.update(journeyArcs)
      .set(updates)
      .where(eq(journeyArcs.id, id))
      .returning();
    return results[0];
  }

  // Sprint operations
  async getSprint(id: number): Promise<Sprint | undefined> {
    const results = await db.select().from(sprints).where(eq(sprints.id, id));
    return results[0];
  }

  async getSprintByArc(arcId: number): Promise<Sprint | undefined> {
    const results = await db.select().from(sprints).where(eq(sprints.arcId, arcId));
    return results[0];
  }

  async getSprintsByJourney(journeyId: number): Promise<Sprint[]> {
    const arcs = await this.getJourneyArcs(journeyId);
    const arcIds = arcs.map(arc => arc.id);
    
    if (arcIds.length === 0) return [];
    
    const results = await db.select().from(sprints)
      .where(inArray(sprints.arcId, arcIds))
      .orderBy(sprints.sprintNumber);
    
    return results;
  }

  async createSprint(sprint: InsertSprint): Promise<Sprint> {
    const results = await db.insert(sprints).values({
      ...sprint,
      storyPointsTarget: sprint.storyPointsTarget || 8,
      storyPointsCompleted: sprint.storyPointsCompleted || 0,
      softSkillEvents: sprint.softSkillEvents || [],
      midSprintEvents: sprint.midSprintEvents || [],
      sprintState: sprint.sprintState || {},
      createdAt: new Date()
    }).returning();
    return results[0];
  }

  async updateSprint(id: number, updates: Partial<Sprint>): Promise<Sprint | undefined> {
    const results = await db.update(sprints)
      .set(updates)
      .where(eq(sprints.id, id))
      .returning();
    return results[0];
  }

  // Sprint Activity operations
  async getSprintActivities(sprintId: number, dayNumber?: number): Promise<SprintActivity[]> {
    const conditions = [eq(sprintActivities.sprintId, sprintId)];
    
    if (dayNumber !== undefined) {
      conditions.push(eq(sprintActivities.dayNumber, dayNumber));
    }
    
    return await db.select().from(sprintActivities)
      .where(and(...conditions))
      .orderBy(sprintActivities.dayNumber, sprintActivities.activityOrder);
  }

  async getSprintActivity(id: number): Promise<SprintActivity | undefined> {
    const results = await db.select().from(sprintActivities).where(eq(sprintActivities.id, id));
    return results[0];
  }

  async getSprintActivitiesByType(sprintId: number, activityType: string): Promise<SprintActivity[]> {
    return await db.select().from(sprintActivities)
      .where(and(
        eq(sprintActivities.sprintId, sprintId),
        eq(sprintActivities.activityType, activityType)
      ))
      .orderBy(sprintActivities.dayNumber, sprintActivities.activityOrder);
  }

  async createSprintActivity(activity: InsertSprintActivity): Promise<SprintActivity> {
    const results = await db.insert(sprintActivities).values({
      ...activity,
      status: activity.status || 'pending',
      isRequired: activity.isRequired ?? true,
      estimatedMinutes: activity.estimatedMinutes || 15,
      activityData: activity.activityData || {},
      createdAt: new Date()
    }).returning();
    return results[0];
  }

  async updateSprintActivity(id: number, updates: Partial<SprintActivity>): Promise<SprintActivity | undefined> {
    const results = await db.update(sprintActivities)
      .set(updates)
      .where(eq(sprintActivities.id, id))
      .returning();
    return results[0];
  }

  // Competency Snapshot operations
  async getCompetencySnapshots(journeyId: number): Promise<CompetencySnapshot[]> {
    return await db.select().from(competencySnapshots)
      .where(eq(competencySnapshots.journeyId, journeyId))
      .orderBy(competencySnapshots.createdAt);
  }

  async createCompetencySnapshot(snapshot: InsertCompetencySnapshot): Promise<CompetencySnapshot> {
    const results = await db.insert(competencySnapshots).values({
      ...snapshot,
      createdAt: new Date()
    }).returning();
    return results[0];
  }

  // Phase 5: Sprint Ticket operations
  async getSprintTickets(sprintId: number): Promise<SprintTicket[]> {
    return await db.select().from(sprintTickets)
      .where(eq(sprintTickets.sprintId, sprintId))
      .orderBy(sprintTickets.dayAssigned, sprintTickets.priority);
  }

  async getSprintTicket(id: number): Promise<SprintTicket | undefined> {
    const results = await db.select().from(sprintTickets).where(eq(sprintTickets.id, id));
    return results[0];
  }

  async getSprintTicketByKey(sprintId: number, ticketKey: string): Promise<SprintTicket | undefined> {
    const results = await db.select().from(sprintTickets)
      .where(and(
        eq(sprintTickets.sprintId, sprintId),
        eq(sprintTickets.ticketKey, ticketKey)
      ));
    return results[0];
  }

  async getCompletedTicketKeysForWorkspace(workspaceId: number, currentSprintId?: number): Promise<string[]> {
    const workspace = await this.getWorkspaceInstance(workspaceId);
    if (!workspace || !workspace.journeyId) return [];

    const allSprints = await this.getSprintsByJourney(workspace.journeyId);
    
    // Include all sprints except the current one (we want to filter out completed work from previous sprints)
    const previousSprints = currentSprintId 
      ? allSprints.filter(s => s.id !== currentSprintId)
      : allSprints;

    const completedKeys: string[] = [];
    for (const sprint of previousSprints) {
      const tickets = await this.getSprintTickets(sprint.id);
      // Case-insensitive status check to handle 'done', 'Done', 'DONE' variants
      const doneTickets = tickets.filter(t => t.status?.toLowerCase() === 'done');
      completedKeys.push(...doneTickets.map(t => t.ticketKey));
    }
    return completedKeys;
  }

  async createSprintTicket(ticket: InsertSprintTicket): Promise<SprintTicket> {
    const results = await db.insert(sprintTickets).values({
      ...ticket,
      status: ticket.status || 'todo',
      priority: ticket.priority || 'medium',
      storyPoints: ticket.storyPoints || 2,
      dayAssigned: ticket.dayAssigned || 1,
      gitState: ticket.gitState || {},
      acceptanceCriteria: ticket.acceptanceCriteria || [],
      reviewComments: ticket.reviewComments || [],
      createdAt: new Date()
    }).returning();
    return results[0];
  }

  async updateSprintTicket(id: number, updates: Partial<SprintTicket>): Promise<SprintTicket | undefined> {
    const results = await db.update(sprintTickets)
      .set(updates)
      .where(eq(sprintTickets.id, id))
      .returning();
    return results[0];
  }

  // Phase 5: Ceremony Instance operations
  async getCeremonyInstances(sprintId: number): Promise<CeremonyInstance[]> {
    return await db.select().from(ceremonyInstances)
      .where(eq(ceremonyInstances.sprintId, sprintId))
      .orderBy(ceremonyInstances.dayNumber);
  }

  async getCeremonyInstance(id: number): Promise<CeremonyInstance | undefined> {
    const results = await db.select().from(ceremonyInstances).where(eq(ceremonyInstances.id, id));
    return results[0];
  }

  async getCeremonyByType(sprintId: number, ceremonyType: string, dayNumber?: number): Promise<CeremonyInstance | undefined> {
    const conditions = [
      eq(ceremonyInstances.sprintId, sprintId),
      eq(ceremonyInstances.ceremonyType, ceremonyType)
    ];
    
    if (dayNumber !== undefined) {
      conditions.push(eq(ceremonyInstances.dayNumber, dayNumber));
    }
    
    const results = await db.select().from(ceremonyInstances)
      .where(and(...conditions))
      .orderBy(desc(ceremonyInstances.dayNumber));
    return results[0];
  }

  async createCeremonyInstance(ceremony: InsertCeremonyInstance): Promise<CeremonyInstance> {
    const results = await db.insert(ceremonyInstances).values({
      ...ceremony,
      status: ceremony.status || 'pending',
      script: ceremony.script || [],
      teamMessages: ceremony.teamMessages || [],
      userResponses: ceremony.userResponses || [],
      actionItems: ceremony.actionItems || [],
      commitments: ceremony.commitments || [],
      createdAt: new Date()
    }).returning();
    return results[0];
  }

  async updateCeremonyInstance(id: number, updates: Partial<CeremonyInstance>): Promise<CeremonyInstance | undefined> {
    const results = await db.update(ceremonyInstances)
      .set(updates)
      .where(eq(ceremonyInstances.id, id))
      .returning();
    return results[0];
  }

  // Phase 5: Git Session operations
  async getGitSession(ticketId: number): Promise<GitSession | undefined> {
    const results = await db.select().from(gitSessions).where(eq(gitSessions.ticketId, ticketId));
    return results[0];
  }

  async getGitSessionById(id: number): Promise<GitSession | undefined> {
    const results = await db.select().from(gitSessions).where(eq(gitSessions.id, id));
    return results[0];
  }

  async createGitSession(session: InsertGitSession): Promise<GitSession> {
    const results = await db.insert(gitSessions).values({
      ...session,
      currentBranch: session.currentBranch || 'main',
      isCloned: session.isCloned || false,
      stagedFiles: session.stagedFiles || [],
      commits: session.commits || [],
      remoteSyncStatus: session.remoteSyncStatus || 'synced',
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return results[0];
  }

  async updateGitSession(id: number, updates: Partial<GitSession>): Promise<GitSession | undefined> {
    const results = await db.update(gitSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(gitSessions.id, id))
      .returning();
    return results[0];
  }

  // Phase 5: Git Event operations
  async getGitEvents(sessionId: number): Promise<GitEvent[]> {
    return await db.select().from(gitEvents)
      .where(eq(gitEvents.sessionId, sessionId))
      .orderBy(gitEvents.createdAt);
  }

  async createGitEvent(event: InsertGitEvent): Promise<GitEvent> {
    const results = await db.insert(gitEvents).values({
      sessionId: event.sessionId,
      commandType: event.commandType,
      rawCommand: event.rawCommand,
      isValid: event.isValid ?? true,
      output: event.output || null,
      errorMessage: event.errorMessage || null,
      stateChange: event.stateChange || {},
      createdAt: new Date()
    }).returning();
    return results[0];
  }

  // Phase 5: Dashboard data operations
  async getSprintOverview(sprintId: number): Promise<SprintOverview | null> {
    const sprint = await this.getSprint(sprintId);
    if (!sprint) return null;

    const tickets = await this.getSprintTickets(sprintId);
    const ceremonies = await this.getCeremonyInstances(sprintId);
    const activities = await this.getSprintActivities(sprintId);

    const ticketStats = {
      todo: tickets.filter(t => t.status === 'todo').length,
      inProgress: tickets.filter(t => t.status === 'in_progress').length,
      inReview: tickets.filter(t => t.status === 'in_review').length,
      done: tickets.filter(t => t.status === 'done').length,
    };

    const upcomingCeremonies = ceremonies.filter(c => c.status === 'pending');
    const sprintState = sprint.sprintState as { currentDay?: number } | null;
    const currentDay = sprintState?.currentDay || 1;
    const todayActivities = activities.filter(a => a.dayNumber === currentDay);

    return {
      sprint,
      tickets,
      ceremonies,
      currentDay,
      ticketStats,
      upcomingCeremonies,
      todayActivities,
    };
  }

  async getJourneyDashboard(journeyId: number): Promise<JourneyDashboard | null> {
    const journey = await this.getJourney(journeyId);
    if (!journey) return null;

    const arcs = await this.getJourneyArcs(journeyId);
    const currentArc = arcs.find(arc => arc.status === 'active' || arc.status === 'in_progress') || null;
    
    let currentSprint: SprintOverview | null = null;
    if (currentArc) {
      const sprint = await this.getSprintByArc(currentArc.id);
      if (sprint) {
        currentSprint = await this.getSprintOverview(sprint.id);
      }
    }

    const readinessScore = journey.readinessScore || 0;
    const competencyScores: Record<string, { score: number; band: MasteryBand }> = {};
    
    const ledgerEntries = await this.getUserCompetencyLedger(journey.userId);
    for (const entry of ledgerEntries) {
      const competency = await db.select().from(competencies).where(eq(competencies.id, entry.competencyId));
      if (competency[0]) {
        competencyScores[competency[0].slug] = {
          score: entry.confidence,
          band: entry.currentBand as MasteryBand,
        };
      }
    }

    const allSprints = await this.getSprintsByJourney(journeyId);
    const arcsWithSprints = arcs.map(arc => ({
      ...arc,
      sprints: allSprints.filter(s => s.arcId === arc.id),
    }));

    const currentArcIndex = currentArc ? arcs.findIndex(a => a.id === currentArc.id) : -1;
    const currentSprintIndex = currentSprint ? 
      arcsWithSprints[currentArcIndex]?.sprints.findIndex(s => s.id === currentSprint?.sprint.id) ?? -1 : -1;

    const progressionPath = await this.getProgressionPathById(journey.progressionPathId);
    const requirements = progressionPath?.requirements as { minSprints?: number } | null;
    const minSprintsRequired = requirements?.minSprints || 3;
    
    const canGraduate = readinessScore >= 85 && journey.completedSprints >= minSprintsRequired;
    const estimatedSprintsRemaining = Math.max(0, Math.ceil((85 - readinessScore) / 10));

    return {
      journey,
      currentArc,
      currentSprint,
      readinessScore,
      competencyScores,
      timeline: {
        arcs: arcsWithSprints,
        currentPosition: { arcIndex: currentArcIndex, sprintIndex: currentSprintIndex },
      },
      canGraduate,
      estimatedSprintsRemaining,
    };
  }

  async getWorkspaceInstance(id: number): Promise<WorkspaceInstance | undefined> {
    const result = await db.select().from(workspaceInstances).where(eq(workspaceInstances.id, id));
    return result[0];
  }

  async getWorkspaceInstanceByJourney(journeyId: number): Promise<WorkspaceInstance | undefined> {
    const result = await db.select().from(workspaceInstances).where(eq(workspaceInstances.journeyId, journeyId));
    return result[0];
  }

  async getUserWorkspaceInstances(userId: number): Promise<WorkspaceInstance[]> {
    return db.select().from(workspaceInstances)
      .where(eq(workspaceInstances.userId, userId))
      .orderBy(desc(workspaceInstances.createdAt));
  }

  async createWorkspaceInstance(workspace: InsertWorkspaceInstance): Promise<WorkspaceInstance> {
    const result = await db.insert(workspaceInstances).values(workspace).returning();
    
    await this.createWorkspacePhaseEvent({
      workspaceId: result[0].id,
      phase: 'onboarding',
      status: 'started',
      payload: {},
    });
    
    return result[0];
  }

  async updateWorkspaceInstance(id: number, updates: Partial<WorkspaceInstance>): Promise<WorkspaceInstance | undefined> {
    const result = await db.update(workspaceInstances)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(workspaceInstances.id, id))
      .returning();
    return result[0];
  }

  async getWorkspacePhaseEvents(workspaceId: number): Promise<WorkspacePhaseEvent[]> {
    return db.select().from(workspacePhaseEvents)
      .where(eq(workspacePhaseEvents.workspaceId, workspaceId))
      .orderBy(desc(workspacePhaseEvents.createdAt));
  }

  async createWorkspacePhaseEvent(event: InsertWorkspacePhaseEvent): Promise<WorkspacePhaseEvent> {
    const result = await db.insert(workspacePhaseEvents).values(event).returning();
    return result[0];
  }

  async updateWorkspacePhaseEvent(id: number, updates: Partial<WorkspacePhaseEvent>): Promise<WorkspacePhaseEvent | undefined> {
    const result = await db.update(workspacePhaseEvents)
      .set(updates)
      .where(eq(workspacePhaseEvents.id, id))
      .returning();
    return result[0];
  }

  async getWorkspaceState(workspaceId: number): Promise<WorkspaceState | null> {
    const workspace = await this.getWorkspaceInstance(workspaceId);
    if (!workspace) return null;

    const phaseHistory = await this.getWorkspacePhaseEvents(workspaceId);
    
    let currentSprint: Sprint | null = null;
    if (workspace.currentSprintId) {
      currentSprint = await this.getSprint(workspace.currentSprintId) || null;
    }

    const currentPhase = workspace.currentPhase as WorkspacePhase;
    const phaseChecklist = await this.getPhaseChecklist(currentPhase, workspace, currentSprint, workspaceId);
    const nextActions = this.getPhaseNextActions(currentPhase, workspaceId, workspace.currentSprintId, workspace.journeyId);

    return {
      workspace,
      currentPhase,
      currentSprint,
      phaseChecklist,
      nextActions,
      phaseHistory,
    };
  }

  private async getPhaseChecklist(
    phase: WorkspacePhase, 
    workspace: WorkspaceInstance,
    currentSprint: Sprint | null,
    workspaceId: number
  ): Promise<{ item: string; completed: boolean; required: boolean }[]> {
    switch (phase) {
      case 'onboarding': {
        const onboardingProgress = (workspace.workspaceMetadata as any)?.onboardingProgress;
        const teamIntrosComplete = onboardingProgress?.teamIntrosComplete || {};
        const docsRead = onboardingProgress?.docsRead || {};
        const environmentComplete = onboardingProgress?.environmentComplete || false;
        const comprehensionComplete = onboardingProgress?.comprehensionComplete || false;
        
        const allTeamIntrosComplete = Object.values(teamIntrosComplete).filter(Boolean).length >= 3;
        const allDocsRead = Object.values(docsRead).filter(Boolean).length >= 4;
        
        const workspaceRole = workspace.role || 'developer';
        const workspaceLevel = (workspace as any).level || 'intern';
        let requiresGitTerminal = true;
        try {
          const onboardingAdapter = getOnboardingAdapter(workspaceRole as any, workspaceLevel as any);
          requiresGitTerminal = onboardingAdapter.requiresGitTerminal;
        } catch {
          requiresGitTerminal = workspaceRole !== 'pm';
        }
        
        const checklist = [
          { item: 'Read company documentation', completed: allDocsRead, required: true },
        ];
        
        if (requiresGitTerminal) {
          checklist.push({ item: 'Set up dev environment', completed: environmentComplete, required: true });
        }
        
        checklist.push(
          { item: 'Meet the team', completed: allTeamIntrosComplete, required: true },
          { item: 'Complete comprehension check', completed: comprehensionComplete, required: true }
        );
        
        return checklist;
      }
      case 'planning': {
        const planningSession = await this.getPlanningSessionByWorkspace(workspaceId);
        const selectedItems = (planningSession?.selectedItems as string[]) || [];
        const hasSelectedItems = selectedItems.length > 0;
        const hasGoal = !!planningSession?.goalStatement;
        const hasReviewedBacklog = planningSession?.currentPhase !== 'context';
        const isCommitted = planningSession?.currentPhase === 'commitment' && hasGoal && hasSelectedItems;
        
        return [
          { item: 'Review product backlog', completed: hasReviewedBacklog, required: true },
          { item: 'Select priority items', completed: hasSelectedItems, required: true },
          { item: 'Set sprint goal', completed: hasGoal, required: true },
          { item: 'Commit to sprint scope', completed: isCommitted, required: true },
        ];
      }
      case 'execution':
        return [
          { item: 'Attend daily standup', completed: false, required: true },
          { item: 'Complete assigned tickets', completed: false, required: true },
          { item: 'Submit code for review', completed: false, required: false },
        ];
      case 'review': {
        const reviewProgress = (workspace.workspaceMetadata as any)?.reviewProgress || {};
        const demoComplete = reviewProgress.demoComplete || false;
        const feedbackComplete = reviewProgress.feedbackComplete || false;
        
        return [
          { item: 'Prepare demo', completed: demoComplete, required: true },
          { item: 'Present completed work', completed: demoComplete, required: true },
          { item: 'Receive stakeholder feedback', completed: feedbackComplete, required: true },
        ];
      }
      case 'retro': {
        const retroProgress = (workspace.workspaceMetadata as any)?.retroProgress || {};
        const hasWentWell = (retroProgress.wentWell || 0) > 0;
        const hasToImprove = (retroProgress.toImprove || 0) > 0;
        const hasActionItems = (retroProgress.actionItemsCount || 0) > 0;
        
        return [
          { item: 'Share what went well', completed: hasWentWell, required: true },
          { item: 'Identify improvements', completed: hasToImprove, required: true },
          { item: 'Commit to action items', completed: hasActionItems, required: true },
        ];
      }
      default:
        return [];
    }
  }

  private getPhaseNextActions(
    phase: WorkspacePhase,
    workspaceId: number,
    currentSprintId: number | null,
    journeyId: number | null
  ): { action: string; route: string; priority: 'primary' | 'secondary' }[] {
    switch (phase) {
      case 'onboarding':
        return [
          { action: 'Start Onboarding', route: `/workspace/${workspaceId}/onboarding`, priority: 'primary' },
        ];
      case 'planning':
        return [
          { action: 'Open Sprint Planning', route: `/workspace/${workspaceId}/planning`, priority: 'primary' },
        ];
      case 'execution':
        return [
          { action: 'Open Sprint Hub', route: `/journey/${journeyId}/sprint/${currentSprintId}`, priority: 'primary' },
          { action: 'View Ceremonies', route: `/workspace/${workspaceId}/ceremonies`, priority: 'secondary' },
        ];
      case 'review':
        return [
          { action: 'Start Sprint Review', route: `/workspace/${workspaceId}/review`, priority: 'primary' },
        ];
      case 'retro':
        return [
          { action: 'Start Retrospective', route: `/workspace/${workspaceId}/retro`, priority: 'primary' },
        ];
      default:
        return [];
    }
  }

  async advanceWorkspacePhase(workspaceId: number, payload?: Record<string, unknown>): Promise<WorkspaceInstance | undefined> {
    const workspace = await this.getWorkspaceInstance(workspaceId);
    if (!workspace) return undefined;

    const phaseOrder: WorkspacePhase[] = ['onboarding', 'planning', 'execution', 'review', 'retro'];
    const currentIndex = phaseOrder.indexOf(workspace.currentPhase as WorkspacePhase);
    
    if (currentIndex === -1) return undefined;

    await this.updateWorkspacePhaseEvent(
      (await this.getWorkspacePhaseEvents(workspaceId))[0]?.id || 0,
      { status: 'completed', completedAt: new Date(), payload: payload || {} }
    );

    let nextPhase: WorkspacePhase;
    
    if (workspace.currentPhase === 'onboarding') {
      nextPhase = 'planning';
      await this.updateWorkspaceInstance(workspaceId, { onboardingCompletedAt: new Date() });
    } else if (workspace.currentPhase === 'retro') {
      nextPhase = 'planning';
    } else {
      nextPhase = phaseOrder[currentIndex + 1];
    }

    if (workspace.currentPhase === 'planning' && nextPhase === 'execution' && workspace.currentSprintId) {
      await this.createSprintTicketsFromPlanning(workspaceId, workspace.currentSprintId);
    }

    await this.createWorkspacePhaseEvent({
      workspaceId,
      phase: nextPhase,
      sprintId: workspace.currentSprintId,
      status: 'started',
      payload: {},
    });

    return this.updateWorkspaceInstance(workspaceId, { currentPhase: nextPhase });
  }

  // Phase 6: Planning Session operations
  async getPlanningSession(id: number): Promise<PlanningSession | undefined> {
    const [session] = await db.select().from(planningSessions).where(eq(planningSessions.id, id)).limit(1);
    return session;
  }

  async getPlanningSessionByWorkspace(workspaceId: number): Promise<PlanningSession | undefined> {
    const [session] = await db.select()
      .from(planningSessions)
      .where(and(
        eq(planningSessions.workspaceId, workspaceId),
        eq(planningSessions.status, 'active')
      ))
      .orderBy(desc(planningSessions.startedAt))
      .limit(1);
    return session;
  }

  async createPlanningSession(session: InsertPlanningSession): Promise<PlanningSession> {
    const [created] = await db.insert(planningSessions).values(session).returning();
    return created;
  }

  async updatePlanningSession(id: number, updates: Partial<PlanningSession>): Promise<PlanningSession | undefined> {
    const [updated] = await db.update(planningSessions)
      .set(updates)
      .where(eq(planningSessions.id, id))
      .returning();
    return updated;
  }

  // Phase 6: Planning Session Assessment operations (Tier Progression)
  async getPlanningAssessmentsByJourney(journeyId: number, tier?: string): Promise<PlanningSessionAssessment[]> {
    const conditions = [eq(planningSessionAssessments.journeyId, journeyId)];
    if (tier) {
      conditions.push(eq(planningSessionAssessments.tier, tier));
    }
    return db.select()
      .from(planningSessionAssessments)
      .where(and(...conditions))
      .orderBy(planningSessionAssessments.assessedAt);
  }

  async createPlanningAssessment(assessment: InsertPlanningSessionAssessment): Promise<PlanningSessionAssessment> {
    const [created] = await db.insert(planningSessionAssessments).values(assessment).returning();
    return created;
  }

  async archivePlanningSessions(workspaceId: number): Promise<number> {
    // Archive all active sessions for this workspace (mark as 'archived')
    const result = await db.update(planningSessions)
      .set({ status: 'archived' })
      .where(and(
        eq(planningSessions.workspaceId, workspaceId),
        eq(planningSessions.status, 'active')
      ))
      .returning();
    return result.length;
  }

  // Phase 6: Planning Message operations
  async getPlanningMessages(sessionId: number): Promise<PlanningMessage[]> {
    return db.select()
      .from(planningMessages)
      .where(eq(planningMessages.sessionId, sessionId))
      .orderBy(planningMessages.createdAt);
  }

  async createPlanningMessage(message: InsertPlanningMessage): Promise<PlanningMessage> {
    const [created] = await db.insert(planningMessages).values(message).returning();
    return created;
  }

  // Phase 6: Planning Session State
  async getPlanningSessionState(workspaceId: number): Promise<PlanningSessionState | null> {
    const session = await this.getPlanningSessionByWorkspace(workspaceId);
    if (!session) return null;

    const messages = await this.getPlanningMessages(session.id);
    const workspace = await this.getWorkspaceInstance(workspaceId);
    if (!workspace) return null;

    const selectedItemIds = (session.selectedItems as string[]) || [];

    // Get completed ticket keys from previous sprints to filter them out
    const completedTicketKeys = await this.getCompletedTicketKeysForWorkspace(workspaceId, session.sprintId || undefined);

    // Try to use dynamically generated sprint backlog, fall back to static catalogue
    let backlogItems: Array<{
      id: string;
      displayKey: string; // tick-XXX format for UI display
      title: string;
      description: string;
      type: 'bug' | 'feature' | 'improvement';
      priority: 'high' | 'medium' | 'low';
      points: number;
      selected: boolean;
      isCarryover?: boolean;
    }> = [];

    // Load sprint's generated backlog if sprintId exists
    if (session.sprintId) {
      const sprint = await this.getSprint(session.sprintId);
      if (sprint && sprint.backlog) {
        // Handle both full GeneratedSprintBacklog object and legacy array formats
        const backlogData = sprint.backlog as unknown;
        let tickets: Array<{
          templateId: string;
          type: string;
          day: number;
          appliedContext?: Record<string, string>;
          generatedTicket: {
            title: string;
            description: string;
            acceptanceCriteria: string[];
            difficulty: string;
          };
          isCarryover?: boolean;
        }> = [];

        // Check if backlog is full object with tickets property or direct array
        if (Array.isArray(backlogData)) {
          tickets = backlogData;
        } else if (backlogData && typeof backlogData === 'object' && 'tickets' in backlogData) {
          const backlogObj = backlogData as { tickets?: unknown[] };
          if (Array.isArray(backlogObj.tickets)) {
            tickets = backlogObj.tickets as typeof tickets;
          }
        }

        if (tickets.length > 0) {
          // Convert generated tickets to BacklogItem format
          // Keep templateId as id (for selection matching), add displayKey for UI
          const sprintNumber = sprint.sprintNumber || 1;
          const filteredTickets = tickets.filter(ticket => 
            ticket.templateId && !completedTicketKeys.includes(ticket.templateId)
          );
          
          backlogItems = filteredTickets.map((ticket, index) => {
            // Generate display key like tick-006, tick-007 for Sprint 2
            const globalIndex = ((sprintNumber - 1) * 5) + (index + 1);
            const displayKey = `tick-${String(globalIndex).padStart(3, '0')}`;
            
            return {
              id: ticket.templateId, // Keep templateId for selection matching
              displayKey, // tick-XXX format for UI display
              title: ticket.generatedTicket?.title || 'Untitled',
              description: ticket.generatedTicket?.description || '',
              type: (ticket.type === 'bug' || ticket.type === 'feature' || ticket.type === 'improvement' 
                ? ticket.type : 'feature') as 'bug' | 'feature' | 'improvement',
              priority: this.difficultyToPriority(ticket.generatedTicket?.difficulty || 'contributor'),
              points: this.difficultyToPoints(ticket.generatedTicket?.difficulty || 'contributor'),
              selected: selectedItemIds.includes(ticket.templateId),
              isCarryover: ticket.isCarryover || false,
            };
          });
        }
      }
    }

    // Fall back to static catalogue if no sprint backlog available
    if (backlogItems.length === 0) {
      const catalogueItems = getBacklogItems();
      const availableItems = catalogueItems.filter(item => !completedTicketKeys.includes(item.id));
      // Keep catalogue id for selection, add displayKey for UI
      backlogItems = availableItems.map((item, index) => {
        const displayKey = `tick-${String(index + 1).padStart(3, '0')}`;
        return {
          id: item.id, // Keep catalogue id for selection matching
          displayKey, // tick-XXX format for UI display
          title: item.title,
          description: item.description,
          type: item.type,
          priority: item.priority,
          points: item.points,
          selected: selectedItemIds.includes(item.id)
        };
      });
    }

    const adapter = getSprintPlanningAdapter(session.role as import('@shared/adapters').Role, session.level as import('@shared/adapters').Level);

    return {
      session,
      messages,
      backlogItems,
      capacity: 10,
      adapterConfig: {
        role: session.role,
        level: session.level,
        facilitator: session.role === 'pm' ? 'user' : 'ai',
        showLearningObjectives: session.level === 'intern' || session.level === 'junior',
        showKnowledgeCheck: session.level === 'intern',
        canSkipPhases: session.level === 'mid' || session.level === 'senior',
        engagement: adapter.engagement,
        commitmentGuidance: adapter.commitmentGuidance,
      }
    };
  }

  // Helper methods for converting difficulty to priority/points
  private difficultyToPriority(difficulty: string): 'high' | 'medium' | 'low' {
    switch (difficulty) {
      case 'explorer': return 'low';
      case 'contributor': return 'medium';
      case 'junior_ready': return 'high';
      default: return 'medium';
    }
  }

  private difficultyToPoints(difficulty: string): number {
    switch (difficulty) {
      case 'explorer': return 2;
      case 'contributor': return 3;
      case 'junior_ready': return 5;
      default: return 3;
    }
  }

  // Helper to generate proper sequential ticket keys like tick-001, tick-002
  private generateTicketKey(sprintNumber: number, ticketIndex: number): string {
    // Format: tick-{3-digit global index}
    // Sprint 1: tick-001, tick-002... Sprint 2 continues: tick-006, tick-007...
    // Calculate global index based on sprint number and ticket index
    const globalIndex = ((sprintNumber - 1) * 5) + ticketIndex; // Assuming ~5 tickets per sprint
    const paddedIndex = String(globalIndex).padStart(3, '0');
    return `tick-${paddedIndex}`;
  }

  async createSprintTicketsFromPlanning(workspaceId: number, sprintId: number): Promise<void> {
    const [planningSession] = await db.select()
      .from(planningSessions)
      .where(eq(planningSessions.workspaceId, workspaceId))
      .orderBy(desc(planningSessions.startedAt))
      .limit(1);
    if (!planningSession) return;

    const selectedItemIds = (planningSession.selectedItems as string[]) || [];
    if (selectedItemIds.length === 0) return;

    const existingTickets = await this.getSprintTickets(sprintId);
    
    // Build a map of templateId -> existing ticketKey for matching
    const templateToTicketKey = new Map<string, string>();
    for (const ticket of existingTickets) {
      // For carryover tickets, they might already have NOVA-xxx keys
      // Store both the ticketKey and any templateId reference
      templateToTicketKey.set(ticket.ticketKey, ticket.ticketKey);
    }
    
    // Delete tickets not in selected list (match by either ticketKey or templateId)
    for (const ticket of existingTickets) {
      // Check if this ticket's key or its template matches any selected item
      const isSelected = selectedItemIds.some(id => 
        id === ticket.ticketKey || 
        id.includes(ticket.ticketKey) ||
        ticket.ticketKey.includes(id)
      );
      if (!isSelected) {
        await db.delete(sprintTickets).where(eq(sprintTickets.id, ticket.id));
      }
    }

    const remainingTickets = await this.getSprintTickets(sprintId);
    const existingTicketKeys = remainingTickets.map(t => t.ticketKey);

    // Try to load from sprint's generated backlog first
    const sprint = await this.getSprint(sprintId);
    let backlogTickets: Array<{
      templateId: string;
      type: string;
      day: number;
      appliedContext?: Record<string, string>;
      generatedTicket: {
        title: string;
        description: string;
        acceptanceCriteria: string[];
        difficulty: string;
      };
      isCarryover?: boolean;
    }> = [];

    if (sprint?.backlog) {
      const backlogData = sprint.backlog as unknown;
      // Handle both full GeneratedSprintBacklog object and legacy array formats
      if (Array.isArray(backlogData)) {
        backlogTickets = backlogData;
      } else if (backlogData && typeof backlogData === 'object' && 'tickets' in backlogData) {
        const backlogObj = backlogData as { tickets?: unknown[] };
        if (Array.isArray(backlogObj.tickets)) {
          backlogTickets = backlogObj.tickets as typeof backlogTickets;
        }
      }
    }

    // Get sprint number for generating proper ticket keys
    const sprintNumber = sprint?.sprintNumber || 1;
    
    // Track ticket index for generating sequential keys
    let ticketIndex = remainingTickets.length + 1;

    for (const itemId of selectedItemIds) {
      // Check if we already have this item (by templateId or ticketKey)
      const alreadyExists = existingTicketKeys.some(key => 
        key === itemId || 
        itemId.includes(key) ||
        key.includes(itemId)
      );
      if (alreadyExists) continue;

      // First try to find in sprint's generated backlog
      const generatedTicket = backlogTickets.find(t => t.templateId === itemId);
      
      if (generatedTicket) {
        // Generate proper ticket key like NOVA-201
        const ticketKey = this.generateTicketKey(sprintNumber, ticketIndex);
        ticketIndex++;
        
        await this.createSprintTicket({
          sprintId,
          ticketKey,
          title: generatedTicket.generatedTicket.title,
          description: generatedTicket.generatedTicket.description,
          type: generatedTicket.type,
          priority: this.difficultyToPriority(generatedTicket.generatedTicket.difficulty),
          storyPoints: this.difficultyToPoints(generatedTicket.generatedTicket.difficulty),
          status: 'todo',
          dayAssigned: generatedTicket.day || 1,
          acceptanceCriteria: generatedTicket.generatedTicket.acceptanceCriteria || [],
          gitState: {},
          reviewComments: []
        });
      } else {
        // Fall back to static catalogue
        const catalogueItem = getBacklogItemById(itemId);
        if (!catalogueItem) continue;

        // Generate proper ticket key like NOVA-201
        const ticketKey = this.generateTicketKey(sprintNumber, ticketIndex);
        ticketIndex++;

        await this.createSprintTicket({
          sprintId,
          ticketKey,
          title: catalogueItem.title,
          description: catalogueItem.description,
          type: catalogueItem.type,
          priority: catalogueItem.priority,
          storyPoints: catalogueItem.points,
          status: 'todo',
          dayAssigned: 1,
          acceptanceCriteria: catalogueItem.acceptanceCriteria || [],
          gitState: {},
          reviewComments: []
        });
      }
    }
  }

  // PR Review Thread operations
  async getReviewThreadsByPR(prId: number): Promise<ReviewThread[]> {
    return db.select().from(reviewThreads).where(eq(reviewThreads.prId, prId));
  }

  async getReviewThreadsByTicket(ticketId: number): Promise<ReviewThread[]> {
    const pr = await this.getPullRequestByTicket(ticketId);
    if (!pr) return [];
    return this.getReviewThreadsByPR(pr.id);
  }

  async createReviewThread(thread: InsertReviewThread): Promise<ReviewThread> {
    const [created] = await db.insert(reviewThreads).values(thread).returning();
    return created;
  }

  async updateReviewThread(id: number, updates: Partial<ReviewThread>): Promise<ReviewThread | undefined> {
    const [updated] = await db.update(reviewThreads)
      .set(updates)
      .where(eq(reviewThreads.id, id))
      .returning();
    return updated;
  }

  async respondToReviewThread(threadId: number, userResponse: string): Promise<ReviewThread | undefined> {
    const [updated] = await db.update(reviewThreads)
      .set({
        userResponse,
        userRespondedAt: new Date(),
        status: 'addressed'
      })
      .where(eq(reviewThreads.id, threadId))
      .returning();
    return updated;
  }

  async verifyReviewThread(threadId: number, verdict: 'approved' | 'needs_more_work'): Promise<ReviewThread | undefined> {
    const [updated] = await db.update(reviewThreads)
      .set({
        reviewerVerdict: verdict,
        reviewerVerifiedAt: new Date(),
        status: verdict === 'approved' ? 'resolved' : 'open',
        resolvedAt: verdict === 'approved' ? new Date() : null
      })
      .where(eq(reviewThreads.id, threadId))
      .returning();
    return updated;
  }

  // Pull Request operations
  async getPullRequest(id: number): Promise<PullRequest | undefined> {
    const [pr] = await db.select().from(pullRequests).where(eq(pullRequests.id, id));
    return pr;
  }

  async getPullRequestByTicket(ticketId: number): Promise<PullRequest | undefined> {
    const [pr] = await db.select().from(pullRequests).where(eq(pullRequests.ticketId, ticketId));
    return pr;
  }

  async createPullRequest(pr: InsertPullRequest): Promise<PullRequest> {
    const [created] = await db.insert(pullRequests).values(pr).returning();
    return created;
  }

  async updatePullRequest(id: number, updates: Partial<PullRequest>): Promise<PullRequest | undefined> {
    const [updated] = await db.update(pullRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(pullRequests.id, id))
      .returning();
    return updated;
  }
}

export const storage = new MemStorage();
