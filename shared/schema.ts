import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const simulationSessions = pgTable("simulation_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'interview', 'negotiation', 'workspace'
  status: text("status").notNull().default('active'), // 'active', 'completed', 'paused'
  configuration: jsonb("configuration").notNull(), // stores simulation config
  messages: jsonb("messages").notNull().default('[]'), // chat messages
  score: integer("score"), // final score
  feedback: jsonb("feedback"), // AI feedback
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  duration: integer("duration"), // in seconds
});

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  simulationType: text("simulation_type").notNull(),
  totalSessions: integer("total_sessions").notNull().default(0),
  completedSessions: integer("completed_sessions").notNull().default(0),
  averageScore: integer("average_score"),
  totalTime: integer("total_time").notNull().default(0), // in seconds
  lastSessionAt: timestamp("last_session_at"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertSimulationSessionSchema = createInsertSchema(simulationSessions).omit({
  id: true,
  startedAt: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
});

// Workspace Simulator Tables
export const workspaceProjects = pgTable("workspace_projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // 'web-app', 'mobile-app', 'api', 'platform'
  teamStructure: jsonb("team_structure").notNull(), // Array of AI team members with roles and personas
  requirements: jsonb("requirements").notNull(), // Project requirements and milestones
  scenarioScript: jsonb("scenario_script"), // Staged events and challenges
  difficulty: text("difficulty").notNull(), // 'junior', 'mid', 'senior'
  estimatedDuration: integer("estimated_duration").notNull(), // in minutes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workspaceRoles = pgTable("workspace_roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // 'Developer', 'Product Manager', 'Designer', 'QA', 'DevOps'
  description: text("description").notNull(),
  competencies: jsonb("competencies").notNull(), // Skills to track for this role
  availableActions: jsonb("available_actions").notNull(), // Actions this role can perform
  evaluationCriteria: jsonb("evaluation_criteria").notNull(), // How to evaluate this role
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workspaceArtifacts = pgTable("workspace_artifacts", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => simulationSessions.id).notNull(),
  type: text("type").notNull(), // 'ticket', 'code-review', 'design', 'documentation', 'test-case'
  title: text("title").notNull(),
  content: jsonb("content").notNull(), // Artifact data (code, design file, test cases, etc.)
  status: text("status").notNull(), // 'draft', 'in-review', 'approved', 'completed'
  assignedRole: text("assigned_role"), // Which role owns this artifact
  metadata: jsonb("metadata"), // Additional metadata (priority, labels, etc.)
  versionHistory: jsonb("version_history").notNull().default('[]'), // Track changes
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workspaceTasks = pgTable("workspace_tasks", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => simulationSessions.id).notNull(),
  artifactId: integer("artifact_id").references(() => workspaceArtifacts.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default('todo'), // 'todo', 'in-progress', 'review', 'done'
  priority: text("priority").notNull().default('medium'), // 'low', 'medium', 'high', 'urgent'
  assignedRole: text("assigned_role"),
  complexity: integer("complexity"), // Story points or complexity rating
  dependencies: jsonb("dependencies").default('[]'), // Task IDs this depends on
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workspaceInteractions = pgTable("workspace_interactions", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => simulationSessions.id).notNull(),
  channel: text("channel").notNull(), // 'chat', 'email', 'standup', 'code-review', 'one-on-one'
  sender: text("sender").notNull(), // 'user' or AI persona name
  senderRole: text("sender_role").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // Sentiment, action items, mentions, etc.
  threadId: text("thread_id"), // For grouping related messages
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workspaceEvaluations = pgTable("workspace_evaluations", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => simulationSessions.id).notNull(),
  role: text("role").notNull(),
  competencyScores: jsonb("competency_scores").notNull(), // Role-specific skill scores
  collaborationScore: integer("collaboration_score"), // 0-100
  deliveryScore: integer("delivery_score"), // 0-100
  communicationScore: integer("communication_score"), // 0-100
  feedback: jsonb("feedback"), // Detailed feedback and suggestions
  phase: text("phase").notNull(), // 'onboarding', 'sprint', 'retro'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWorkspaceProjectSchema = createInsertSchema(workspaceProjects).omit({
  id: true,
  createdAt: true,
});

export const insertWorkspaceRoleSchema = createInsertSchema(workspaceRoles).omit({
  id: true,
  createdAt: true,
});

export const insertWorkspaceArtifactSchema = createInsertSchema(workspaceArtifacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkspaceTaskSchema = createInsertSchema(workspaceTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkspaceInteractionSchema = createInsertSchema(workspaceInteractions).omit({
  id: true,
  createdAt: true,
});

export const insertWorkspaceEvaluationSchema = createInsertSchema(workspaceEvaluations).omit({
  id: true,
  createdAt: true,
});

// Workspace Progress Tracking - persists day-level progress for simulations
export const workspaceProgress = pgTable("workspace_progress", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => simulationSessions.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  projectId: integer("project_id").references(() => workspaceProjects.id).notNull(),
  role: text("role").notNull(),
  mode: text("mode").notNull().default('journey'), // 'practice' or 'journey'
  currentDay: integer("current_day").notNull().default(1),
  scenarioId: text("scenario_id"), // For practice mode: specific day/scenario selected
  dayProgress: jsonb("day_progress").notNull().default('{}'), // Day-specific progress: {docsRead, introProgress, comprehensionComplete, etc.}
  overallProgress: integer("overall_progress").notNull().default(0), // 0-100
  status: text("status").notNull().default('in_progress'), // 'in_progress', 'completed', 'abandoned'
  score: integer("score"), // Final score for completed sessions
  startedAt: timestamp("started_at").defaultNow().notNull(),
  lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertWorkspaceProgressSchema = createInsertSchema(workspaceProgress).omit({
  id: true,
  startedAt: true,
  lastActivityAt: true,
});

export type WorkspaceProgress = typeof workspaceProgress.$inferSelect;
export type InsertWorkspaceProgress = z.infer<typeof insertWorkspaceProgressSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SimulationSession = typeof simulationSessions.$inferSelect;
export type InsertSimulationSession = z.infer<typeof insertSimulationSessionSchema>;
export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type WorkspaceProject = typeof workspaceProjects.$inferSelect;
export type InsertWorkspaceProject = z.infer<typeof insertWorkspaceProjectSchema>;
export type WorkspaceRole = typeof workspaceRoles.$inferSelect;
export type InsertWorkspaceRole = z.infer<typeof insertWorkspaceRoleSchema>;
export type WorkspaceArtifact = typeof workspaceArtifacts.$inferSelect;
export type InsertWorkspaceArtifact = z.infer<typeof insertWorkspaceArtifactSchema>;
export type WorkspaceTask = typeof workspaceTasks.$inferSelect;
export type InsertWorkspaceTask = z.infer<typeof insertWorkspaceTaskSchema>;
export type WorkspaceInteraction = typeof workspaceInteractions.$inferSelect;
export type InsertWorkspaceInteraction = z.infer<typeof insertWorkspaceInteractionSchema>;
export type WorkspaceEvaluation = typeof workspaceEvaluations.$inferSelect;
export type InsertWorkspaceEvaluation = z.infer<typeof insertWorkspaceEvaluationSchema>;

// Interview Simulator Tables
export const interviewSessions = pgTable("interview_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  interviewType: text("interview_type").notNull(), // 'behavioral', 'technical', 'system-design', 'case-study'
  targetRole: text("target_role").notNull(), // 'developer', 'pm', 'designer', 'data-scientist'
  difficulty: text("difficulty").notNull().default('medium'), // 'easy', 'medium', 'hard'
  status: text("status").notNull().default('in_progress'), // 'in_progress', 'completed', 'abandoned'
  mode: text("mode").notNull().default('practice'), // 'practice' or 'journey'
  applicationStageId: integer("application_stage_id"), // Links to application_stages for journey mode
  currentQuestionIndex: integer("current_question_index").notNull().default(0),
  totalQuestions: integer("total_questions").notNull().default(5),
  overallScore: integer("overall_score"), // 0-100
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const interviewQuestions = pgTable("interview_questions", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => interviewSessions.id).notNull(),
  questionIndex: integer("question_index").notNull(),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull(), // 'opening', 'main', 'follow-up', 'closing'
  expectedCriteria: jsonb("expected_criteria").notNull(), // What to look for in the answer
  candidateAnswer: text("candidate_answer"),
  score: integer("score"), // 1-10
  feedback: text("feedback"),
  strengths: jsonb("strengths").default('[]'),
  improvements: jsonb("improvements").default('[]'),
  askedAt: timestamp("asked_at").defaultNow().notNull(),
  answeredAt: timestamp("answered_at"),
});

export const interviewFeedback = pgTable("interview_feedback", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => interviewSessions.id).notNull(),
  overallScore: integer("overall_score").notNull(), // 0-100
  communicationScore: integer("communication_score").notNull(),
  technicalScore: integer("technical_score"),
  problemSolvingScore: integer("problem_solving_score"),
  cultureFitScore: integer("culture_fit_score"),
  summary: text("summary").notNull(),
  strengths: jsonb("strengths").notNull(),
  improvements: jsonb("improvements").notNull(),
  recommendations: jsonb("recommendations").notNull(),
  hiringDecision: text("hiring_decision").notNull(), // 'strong_yes', 'yes', 'maybe', 'no', 'strong_no'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInterviewSessionSchema = createInsertSchema(interviewSessions).omit({
  id: true,
  startedAt: true,
});

export const insertInterviewQuestionSchema = createInsertSchema(interviewQuestions).omit({
  id: true,
  askedAt: true,
});

export const insertInterviewFeedbackSchema = createInsertSchema(interviewFeedback).omit({
  id: true,
  createdAt: true,
});

export type InterviewSession = typeof interviewSessions.$inferSelect;
export type InsertInterviewSession = z.infer<typeof insertInterviewSessionSchema>;
export type InterviewQuestion = typeof interviewQuestions.$inferSelect;
export type InsertInterviewQuestion = z.infer<typeof insertInterviewQuestionSchema>;
export type InterviewFeedback = typeof interviewFeedback.$inferSelect;
export type InsertInterviewFeedback = z.infer<typeof insertInterviewFeedbackSchema>;

// Job Journey Tables

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"), // URL or emoji
  industry: text("industry").notNull(), // 'tech', 'fintech', 'healthtech', 'e-commerce'
  size: text("size").notNull(), // 'startup', 'mid-size', 'enterprise'
  description: text("description").notNull(),
  culture: text("culture").notNull(), // Brief culture description
  values: jsonb("values").notNull().default('[]'), // Array of company values
  benefits: jsonb("benefits").notNull().default('[]'), // Array of benefits
  interviewStyle: text("interview_style").notNull().default('balanced'), // 'rigorous', 'balanced', 'casual'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const jobPostings = pgTable("job_postings", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  title: text("title").notNull(), // 'Junior Project Manager', 'Senior Software Engineer'
  role: text("role").notNull(), // 'pm', 'developer', 'designer', 'qa', 'devops'
  seniority: text("seniority").notNull(), // 'junior', 'mid', 'senior', 'lead'
  department: text("department").notNull(), // 'Engineering', 'Product', 'Design'
  location: text("location").notNull(), // 'Remote', 'San Francisco, CA', 'Hybrid'
  employmentType: text("employment_type").notNull().default('full-time'), // 'full-time', 'contract', 'part-time'
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  description: text("description").notNull(), // Full job description
  responsibilities: jsonb("responsibilities").notNull().default('[]'), // Array of responsibilities
  requirements: jsonb("requirements").notNull().default('[]'), // Array of requirements
  niceToHave: jsonb("nice_to_have").default('[]'), // Array of nice-to-haves
  highlightedTerms: jsonb("highlighted_terms").default('[]'), // Terms to highlight with glossary popups
  interviewStages: integer("interview_stages").notNull().default(3), // Number of interview stages
  isActive: boolean("is_active").notNull().default(true),
  postedAt: timestamp("posted_at").defaultNow().notNull(),
  // Phase 3: Narrative Architecture Fields
  projectTemplateSlug: text("project_template_slug"), // Links to project template
  narrativeContext: jsonb("narrative_context"), // Industry, domain, team topology overrides
  journeyLength: jsonb("journey_length"), // { minSprints, maxSprints }
});

export const jobGlossary = pgTable("job_glossary", {
  id: serial("id").primaryKey(),
  term: text("term").notNull().unique(),
  definition: text("definition").notNull(),
  category: text("category"), // 'product', 'engineering', 'business', 'general'
  relatedTerms: jsonb("related_terms").default('[]'),
});

export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  jobPostingId: integer("job_posting_id").references(() => jobPostings.id).notNull(),
  status: text("status").notNull().default('draft'), // 'draft', 'submitted', 'screening', 'interviewing', 'offer', 'accepted', 'rejected'
  cvFileName: text("cv_file_name"),
  cvContent: text("cv_content"), // Stored CV text for AI context
  coverLetter: text("cover_letter"),
  currentStageIndex: integer("current_stage_index").notNull().default(0),
  hrContactedAt: timestamp("hr_contacted_at"),
  offerDetails: jsonb("offer_details"), // Salary, start date, etc.
  notes: text("notes"),
  appliedAt: timestamp("applied_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const interviewTemplates = pgTable("interview_templates", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id),
  role: text("role"), // If null, applies to all roles at company
  name: text("name").notNull(),
  stages: jsonb("stages").notNull(), // Array of stage configs: [{order, type, name, duration, config}]
  totalDuration: integer("total_duration"), // Estimated total time in minutes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const applicationStages = pgTable("application_stages", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => jobApplications.id).notNull(),
  stageOrder: integer("stage_order").notNull(),
  stageName: text("stage_name").notNull(), // 'Phone Screen', 'Technical Interview', 'System Design'
  stageType: text("stage_type").notNull(), // 'recruiter_call', 'technical', 'behavioral', 'case_study', 'panel', 'team' (team/panel both use multi-persona interviews), 'offer'
  status: text("status").notNull().default('pending'), // 'pending', 'scheduled', 'in_progress', 'completed', 'skipped'
  interviewSessionId: integer("interview_session_id").references(() => interviewSessions.id),
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),
  score: integer("score"), // 0-100
  feedback: text("feedback"),
  recruiterNotes: text("recruiter_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
});

export const insertJobPostingSchema = createInsertSchema(jobPostings).omit({
  id: true,
  postedAt: true,
});

export const insertJobGlossarySchema = createInsertSchema(jobGlossary).omit({
  id: true,
});

export const insertJobApplicationSchema = createInsertSchema(jobApplications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInterviewTemplateSchema = createInsertSchema(interviewTemplates).omit({
  id: true,
  createdAt: true,
});

export const insertApplicationStageSchema = createInsertSchema(applicationStages).omit({
  id: true,
  createdAt: true,
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type JobPosting = typeof jobPostings.$inferSelect;
export type InsertJobPosting = z.infer<typeof insertJobPostingSchema>;
export type JobGlossary = typeof jobGlossary.$inferSelect;
export type InsertJobGlossary = z.infer<typeof insertJobGlossarySchema>;
export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type InterviewTemplate = typeof interviewTemplates.$inferSelect;
export type InsertInterviewTemplate = z.infer<typeof insertInterviewTemplateSchema>;
export type ApplicationStage = typeof applicationStages.$inferSelect;
export type InsertApplicationStage = z.infer<typeof insertApplicationStageSchema>;

// Team Interview Types and Settings
export type ExperienceLevel = 'intern' | 'junior' | 'mid' | 'senior' | 'lead';

export interface TeamInterviewPersona {
  id: string;
  name: string;
  role: string; // 'tech_lead', 'peer_engineer', 'product_partner', 'engineering_manager'
  displayRole: string; // Human-readable: "Tech Lead", "Software Engineer"
  tone: 'supportive' | 'collegial' | 'challenging' | 'strategic';
  focusAreas: string[]; // What this persona probes: ['learning', 'collaboration', 'debugging']
  introStyle: string; // How they introduce themselves
}

export interface TeamInterviewSettings {
  experienceLevel: ExperienceLevel;
  personas: TeamInterviewPersona[];
  questionWeights: {
    learning: number; // % of interview focused on learning/growth
    collaboration: number; // % on teamwork
    technical: number; // % on technical skills
    curiosity: number; // % on candidate questions
  };
  evaluationRubric: {
    criterion: string;
    weight: number;
    levelExpectations: Record<ExperienceLevel, string>;
  }[];
  artifactComplexity: 'simple' | 'moderate' | 'complex';
  maxQuestions: number;
}

// Predefined team interview settings by experience level
export const TEAM_INTERVIEW_PRESETS: Record<ExperienceLevel, TeamInterviewSettings> = {
  intern: {
    experienceLevel: 'intern',
    personas: [
      {
        id: 'peer_engineer',
        name: 'Marcus',
        role: 'peer_engineer',
        displayRole: 'Software Engineer',
        tone: 'supportive',
        focusAreas: ['learning', 'collaboration', 'asking_for_help'],
        introStyle: "Hey! I'm Marcus, one of the developers on the team. I've been here about a year, so I remember what it's like being new.",
      },
      {
        id: 'tech_lead',
        name: 'Sarah',
        role: 'tech_lead',
        displayRole: 'Tech Lead',
        tone: 'supportive',
        focusAreas: ['potential', 'growth_mindset', 'fundamentals'],
        introStyle: "Hi! I'm Sarah, the tech lead for this team. I'm excited to learn more about you and what you're looking to get out of this role.",
      },
    ],
    questionWeights: {
      learning: 40,
      collaboration: 30,
      technical: 20,
      curiosity: 10,
    },
    evaluationRubric: [
      {
        criterion: 'learning_mindset',
        weight: 35,
        levelExpectations: {
          intern: 'Shows curiosity, asks clarifying questions, admits knowledge gaps honestly',
          junior: 'Demonstrates self-directed learning, seeks feedback proactively',
          mid: 'Mentors others while continuing to grow, learns from mistakes quickly',
          senior: 'Drives learning culture, identifies skill gaps in team',
          lead: 'Shapes learning strategy, builds knowledge-sharing systems',
        },
      },
      {
        criterion: 'collaboration',
        weight: 30,
        levelExpectations: {
          intern: 'Communicates clearly, open to feedback, thinks about teammates',
          junior: 'Works effectively in pairs, gives and receives feedback well',
          mid: 'Facilitates team discussions, resolves minor conflicts',
          senior: 'Builds consensus, mentors collaboration skills',
          lead: 'Designs team structures, optimizes cross-team collaboration',
        },
      },
      {
        criterion: 'problem_solving',
        weight: 25,
        levelExpectations: {
          intern: 'Has a logical process, knows when to ask for help',
          junior: 'Breaks down problems, proposes solutions with guidance',
          mid: 'Solves complex problems independently, considers trade-offs',
          senior: 'Anticipates problems, designs robust solutions',
          lead: 'Solves organizational problems, strategic thinking',
        },
      },
      {
        criterion: 'technical_foundations',
        weight: 10,
        levelExpectations: {
          intern: 'Basic understanding, does not need to be polished',
          junior: 'Solid fundamentals, can debug with guidance',
          mid: 'Strong skills, teaches fundamentals to others',
          senior: 'Expert level, designs systems and patterns',
          lead: 'Sets technical direction, evaluates new technologies',
        },
      },
    ],
    artifactComplexity: 'simple',
    maxQuestions: 8,
  },
  junior: {
    experienceLevel: 'junior',
    personas: [
      {
        id: 'peer_engineer',
        name: 'Marcus',
        role: 'peer_engineer',
        displayRole: 'Senior Engineer',
        tone: 'collegial',
        focusAreas: ['practical_skills', 'debugging', 'code_quality'],
        introStyle: "Hey, I'm Marcus. I'm a senior engineer on the team and I'll be asking you some questions about your experience.",
      },
      {
        id: 'tech_lead',
        name: 'Sarah',
        role: 'tech_lead',
        displayRole: 'Tech Lead',
        tone: 'collegial',
        focusAreas: ['problem_solving', 'growth', 'ownership'],
        introStyle: "Hi, I'm Sarah, the tech lead. Looking forward to hearing about your background and how you approach problems.",
      },
    ],
    questionWeights: {
      learning: 25,
      collaboration: 30,
      technical: 35,
      curiosity: 10,
    },
    evaluationRubric: [],
    artifactComplexity: 'moderate',
    maxQuestions: 10,
  },
  mid: {
    experienceLevel: 'mid',
    personas: [
      {
        id: 'senior_engineer',
        name: 'Marcus',
        role: 'peer_engineer',
        displayRole: 'Staff Engineer',
        tone: 'collegial',
        focusAreas: ['system_design', 'code_review', 'mentoring'],
        introStyle: "I'm Marcus, a staff engineer. I'll be diving into some technical scenarios with you.",
      },
      {
        id: 'tech_lead',
        name: 'Sarah',
        role: 'tech_lead',
        displayRole: 'Tech Lead',
        tone: 'challenging',
        focusAreas: ['ownership', 'decision_making', 'delivery'],
        introStyle: "Hi, I'm Sarah, the tech lead. I want to understand how you make technical decisions and drive projects forward.",
      },
      {
        id: 'product_partner',
        name: 'Priya',
        role: 'product_partner',
        displayRole: 'Product Manager',
        tone: 'collegial',
        focusAreas: ['cross_functional', 'requirements', 'stakeholder_management'],
        introStyle: "Hey, I'm Priya from the product team. I'll ask about how you collaborate with non-engineers.",
      },
    ],
    questionWeights: {
      learning: 15,
      collaboration: 25,
      technical: 50,
      curiosity: 10,
    },
    evaluationRubric: [],
    artifactComplexity: 'moderate',
    maxQuestions: 12,
  },
  senior: {
    experienceLevel: 'senior',
    personas: [
      {
        id: 'tech_lead',
        name: 'Sarah',
        role: 'tech_lead',
        displayRole: 'Engineering Manager',
        tone: 'challenging',
        focusAreas: ['system_design', 'leadership', 'trade_offs'],
        introStyle: "I'm Sarah, the engineering manager. I'll be exploring your technical depth and leadership experience.",
      },
      {
        id: 'staff_engineer',
        name: 'Marcus',
        role: 'peer_engineer',
        displayRole: 'Principal Engineer',
        tone: 'challenging',
        focusAreas: ['architecture', 'scalability', 'technical_vision'],
        introStyle: "Marcus here, principal engineer. Let's discuss system design and architectural decisions.",
      },
      {
        id: 'product_partner',
        name: 'Priya',
        role: 'product_partner',
        displayRole: 'Senior PM',
        tone: 'strategic',
        focusAreas: ['strategy', 'influence', 'cross_org'],
        introStyle: "I'm Priya, senior PM. I'll ask about your experience driving cross-functional initiatives.",
      },
    ],
    questionWeights: {
      learning: 10,
      collaboration: 20,
      technical: 55,
      curiosity: 15,
    },
    evaluationRubric: [],
    artifactComplexity: 'complex',
    maxQuestions: 12,
  },
  lead: {
    experienceLevel: 'lead',
    personas: [
      {
        id: 'director',
        name: 'David',
        role: 'engineering_manager',
        displayRole: 'Engineering Director',
        tone: 'strategic',
        focusAreas: ['team_building', 'technical_strategy', 'org_impact'],
        introStyle: "I'm David, engineering director. I'm interested in your experience building and scaling engineering teams.",
      },
      {
        id: 'staff_engineer',
        name: 'Sarah',
        role: 'tech_lead',
        displayRole: 'Staff Engineer',
        tone: 'challenging',
        focusAreas: ['architecture', 'technical_excellence', 'mentorship'],
        introStyle: "Sarah here, staff engineer. Let's discuss technical vision and how you elevate engineering standards.",
      },
      {
        id: 'product_leader',
        name: 'Priya',
        role: 'product_partner',
        displayRole: 'VP Product',
        tone: 'strategic',
        focusAreas: ['roadmap', 'business_alignment', 'vision'],
        introStyle: "I'm Priya, VP of Product. I want to understand how you align technical work with business goals.",
      },
    ],
    questionWeights: {
      learning: 5,
      collaboration: 25,
      technical: 50,
      curiosity: 20,
    },
    evaluationRubric: [],
    artifactComplexity: 'complex',
    maxQuestions: 15,
  },
};

// ============================================================================
// PHASE 1: UNIFIED DATA LAYER TABLES
// ============================================================================

// Mastery bands for competency progression
export const masteryBandEnum = ['explorer', 'contributor', 'junior_ready'] as const;
export type MasteryBand = typeof masteryBandEnum[number];

// Competencies - Skills with rubrics per mastery band
export const competencies = pgTable("competencies", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(), // e.g., "debugging", "git-workflow", "code-review"
  name: text("name").notNull(), // Human-readable name
  summary: text("summary").notNull(), // Brief description
  category: text("category").notNull(), // "foundational_habits", "core_delivery", "professional_impact"
  role: text("role"), // null = universal, or specific role like "developer"
  rubric: jsonb("rubric").notNull(), // { explorer: {...}, contributor: {...}, junior_ready: {...} }
  skills: jsonb("skills").notNull(), // Observable behaviors for this competency
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Simulation Catalogue - Questions/scenarios with adapter tags
export const simulationCatalogue = pgTable("simulation_catalogue", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").notNull().unique(), // Maps to JSON meta.id (e.g., "workspace-standup-day2")
  type: text("type").notNull(), // Content type (e.g., "standup_script", "code_exercise")
  simulator: text("simulator").notNull(), // "workspace" or "interview"
  role: text("role"), // "developer", "pm", "qa", etc. (null = shared)
  level: text("level"), // "intern", "junior", "mid", "senior" (null = all levels)
  language: text("language"), // "javascript", "python", "c_cpp" (null = language-agnostic)
  day: integer("day"), // Day number for daily content (null = not day-specific)
  version: text("version").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  content: jsonb("content").notNull(), // The actual content payload
  competencySlugs: text("competency_slugs").array(), // Links to competencies this item tests
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Role Adapters - Config per role
export const roleAdapters = pgTable("role_adapters", {
  id: serial("id").primaryKey(),
  role: text("role").notNull().unique(), // "developer", "pm", "qa", "devops", "data_science"
  displayName: text("display_name").notNull(),
  description: text("description").notNull(),
  levels: jsonb("levels").notNull(), // Per-level scaffolding and expectations
  languageOverrides: jsonb("language_overrides"), // Language-specific adaptations (for developer)
  simulatorSettings: jsonb("simulator_settings").notNull(), // Settings per simulator
  metadata: jsonb("metadata"), // Additional role-specific config
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Competency Ledger - User mastery scores
export const competencyLedger = pgTable("competency_ledger", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  competencyId: integer("competency_id").references(() => competencies.id).notNull(),
  currentBand: text("current_band").notNull().default('explorer'), // 'explorer', 'contributor', 'junior_ready'
  evidenceCount: integer("evidence_count").notNull().default(0),
  confidence: integer("confidence").notNull().default(0), // 0-100
  lastEvidenceAt: timestamp("last_evidence_at"),
  history: jsonb("history").notNull().default('[]'), // Array of delta events
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Portfolio Artifacts - Collected work samples
export const portfolioArtifacts = pgTable("portfolio_artifacts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  source: text("source").notNull(), // "workspace", "interview", "upload"
  catalogueItemId: integer("catalogue_item_id").references(() => simulationCatalogue.id),
  title: text("title").notNull(),
  artifactType: text("artifact_type").notNull(), // "code_fix", "standup_response", "interview_answer", etc.
  summary: text("summary"),
  artifactData: jsonb("artifact_data").notNull(), // The actual work sample data
  evidenceCompetencies: text("evidence_competencies").array(), // Competency slugs this demonstrates
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schemas for Phase 1 tables
export const insertCompetencySchema = createInsertSchema(competencies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSimulationCatalogueSchema = createInsertSchema(simulationCatalogue).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRoleAdapterSchema = createInsertSchema(roleAdapters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCompetencyLedgerSchema = createInsertSchema(competencyLedger).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPortfolioArtifactSchema = createInsertSchema(portfolioArtifacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for Phase 1 tables
export type InsertCompetency = z.infer<typeof insertCompetencySchema>;
export type Competency = typeof competencies.$inferSelect;

export type InsertSimulationCatalogue = z.infer<typeof insertSimulationCatalogueSchema>;
export type SimulationCatalogue = typeof simulationCatalogue.$inferSelect;

export type InsertRoleAdapter = z.infer<typeof insertRoleAdapterSchema>;
export type RoleAdapter = typeof roleAdapters.$inferSelect;

export type InsertCompetencyLedger = z.infer<typeof insertCompetencyLedgerSchema>;
export type CompetencyLedger = typeof competencyLedger.$inferSelect;

export type InsertPortfolioArtifact = z.infer<typeof insertPortfolioArtifactSchema>;
export type PortfolioArtifact = typeof portfolioArtifacts.$inferSelect;

// Competency delta payload for POST /api/user/:id/competency-delta
export const competencyDeltaSchema = z.object({
  competencySlug: z.string(),
  source: z.enum(['workspace', 'interview']),
  catalogueItemId: z.number().optional(),
  evidenceType: z.string(), // "exercise_complete", "answer_rated", etc.
  evidenceData: z.record(z.unknown()).optional(),
  score: z.number().min(0).max(100).optional(), // Optional score from the activity
});

export type CompetencyDelta = z.infer<typeof competencyDeltaSchema>;

// Readiness response structure
export interface ReadinessScore {
  overallScore: number; // 0-100
  currentBand: MasteryBand;
  competencyBreakdown: {
    slug: string;
    name: string;
    band: MasteryBand;
    confidence: number;
    evidenceCount: number;
  }[];
  gaps: string[]; // Competency slugs needing improvement
  strengths: string[]; // Competency slugs showing strength
}

// ============================================================================
// PHASE 3: NARRATIVE ARCHITECTURE TABLES
// ============================================================================

// Difficulty bands for progression
export const difficultyBandEnum = ['guided', 'supported', 'independent', 'expert'] as const;
export type DifficultyBand = typeof difficultyBandEnum[number];

// Arc types
export const arcTypeEnum = ['onboarding', 'sprint'] as const;
export type ArcType = typeof arcTypeEnum[number];

// Activity types
export const activityTypeEnum = [
  'team_chat',
  'documentation_reading', 
  'standup_meeting',
  'sprint_planning',
  'ticket_work',
  'code_exercise',
  'code_review',
  'pr_creation',
  'demo_presentation',
  'retrospective',
  'one_on_one',
  'incident_response',
  'reflection',
  'soft_skill_event'
] as const;
export type ActivityType = typeof activityTypeEnum[number];

// Ceremony types
export const ceremonyTypeEnum = [
  'sprint_planning',
  'daily_standup', 
  'sprint_review',
  'sprint_retrospective',
  'manager_1_1',
  'final_1_1'
] as const;
export type CeremonyType = typeof ceremonyTypeEnum[number];

// Progression Paths - defines level transitions (Intern→Junior, Junior→Mid, etc.)
export const progressionPaths = pgTable("progression_paths", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(), // "intern_to_junior", "junior_to_mid"
  entryLevel: text("entry_level").notNull(), // "intern", "junior", "mid"
  exitLevel: text("exit_level").notNull(), // "junior", "mid", "senior"
  role: text("role").notNull(), // "developer", "pm", "qa", etc.
  displayName: text("display_name").notNull(), // "Intern → Junior Ready"
  description: text("description").notNull(),
  requirements: jsonb("requirements").notNull(), // { minSprints, readinessThreshold, requiredCompetencies }
  difficultyProgression: jsonb("difficulty_progression").notNull(), // How difficulty increases over sprints
  exitBadge: text("exit_badge"), // Badge awarded on completion
  competencyFocus: text("competency_focus").array(), // Primary competencies for this path
  estimatedDuration: jsonb("estimated_duration").notNull(), // { minWeeks, maxWeeks }
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Project Templates - simulated project/team environments
export const projectTemplates = pgTable("project_templates", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(), // "novapay", "chatflow", "shopstack"
  name: text("name").notNull(), // "NovaPay"
  description: text("description").notNull(),
  industry: text("industry").notNull(), // "fintech", "social", "ecommerce"
  domain: text("domain").notNull(), // "payments", "messaging", "inventory"
  teamTopology: text("team_topology").notNull(), // "startup", "enterprise", "agency"
  team: jsonb("team").notNull(), // Team member templates with personas
  codebase: jsonb("codebase").notNull(), // Codebase structure, key files, bug patterns
  backlogThemes: jsonb("backlog_themes").notNull(), // Feature areas for sprint generation
  bugTemplates: jsonb("bug_templates").notNull(), // Bug patterns for exercises
  featureTemplates: jsonb("feature_templates").notNull(), // Feature patterns for exercises
  softSkillPacks: jsonb("soft_skill_packs").notNull(), // Soft skill event templates
  sprintCadence: integer("sprint_cadence").notNull().default(10), // Days per sprint
  techStack: text("tech_stack").array(), // ["react", "node", "postgres"]
  language: text("language").notNull().default('javascript'), // Primary language
  progressionPathId: integer("progression_path_id").references(() => progressionPaths.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User Journeys - user's journey through a progression path
export const userJourneys = pgTable("user_journeys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  progressionPathId: integer("progression_path_id").references(() => progressionPaths.id).notNull(),
  projectTemplateId: integer("project_template_id").references(() => projectTemplates.id).notNull(),
  jobApplicationId: integer("job_application_id").references(() => jobApplications.id), // Links to job application
  status: text("status").notNull().default('active'), // 'active', 'paused', 'completed', 'graduated', 'abandoned'
  currentArcId: integer("current_arc_id"), // Will be set after arcs are created
  currentSprintNumber: integer("current_sprint_number").notNull().default(0), // 0 = onboarding
  completedSprints: integer("completed_sprints").notNull().default(0),
  readinessScore: integer("readiness_score").notNull().default(0), // 0-100
  exitTrigger: text("exit_trigger"), // 'user_choice', 'readiness_threshold', 'max_sprints', null if not exited
  graduatedAt: timestamp("graduated_at"),
  badgeAwarded: text("badge_awarded"),
  journeyMetadata: jsonb("journey_metadata").notNull().default('{}'), // Additional journey state
  startedAt: timestamp("started_at").defaultNow().notNull(),
  lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Journey Arcs - arcs within a journey (onboarding, sprint 1, sprint 2, etc.)
export const journeyArcs = pgTable("journey_arcs", {
  id: serial("id").primaryKey(),
  journeyId: integer("journey_id").references(() => userJourneys.id).notNull(),
  arcType: text("arc_type").notNull(), // 'onboarding' or 'sprint'
  arcOrder: integer("arc_order").notNull(), // Sequence: 1 = onboarding, 2 = sprint 1, etc.
  name: text("name").notNull(), // "Onboarding", "Sprint 1", etc.
  description: text("description"),
  status: text("status").notNull().default('pending'), // 'pending', 'active', 'completed'
  difficultyBand: text("difficulty_band").notNull().default('guided'), // 'guided', 'supported', 'independent'
  durationDays: integer("duration_days").notNull().default(5),
  competencyFocus: text("competency_focus").array(), // Primary competencies for this arc
  isFinalArc: boolean("is_final_arc").notNull().default(false),
  arcData: jsonb("arc_data").notNull().default('{}'), // Arc-specific data (scripted content, etc.)
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sprints - sprint-specific data for sprint arcs
export const sprints = pgTable("sprints", {
  id: serial("id").primaryKey(),
  arcId: integer("arc_id").references(() => journeyArcs.id).notNull(),
  sprintNumber: integer("sprint_number").notNull(),
  goal: text("goal").notNull(), // Sprint goal
  theme: text("theme").notNull(), // Sprint theme from backlog themes
  backlog: jsonb("backlog").notNull(), // Generated backlog items
  userTickets: jsonb("user_tickets").notNull(), // Tickets assigned to user
  teamTickets: jsonb("team_tickets").notNull(), // Tickets for AI team members
  storyPointsTarget: integer("story_points_target").notNull().default(8),
  storyPointsCompleted: integer("story_points_completed").notNull().default(0),
  softSkillEvents: jsonb("soft_skill_events").notNull().default('[]'), // Scheduled soft skill events
  midSprintEvents: jsonb("mid_sprint_events").notNull().default('[]'), // Dynamic disruptions
  ceremonies: jsonb("ceremonies").notNull(), // Ceremony scripts and states
  sprintState: jsonb("sprint_state").notNull().default('{}'), // Current sprint state
  generationMetadata: jsonb("generation_metadata"), // How this sprint was generated
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sprint Activities - individual activities within a sprint day
export const sprintActivities = pgTable("sprint_activities", {
  id: serial("id").primaryKey(),
  sprintId: integer("sprint_id").references(() => sprints.id).notNull(),
  dayNumber: integer("day_number").notNull(), // Day within the sprint (1-10)
  activityOrder: integer("activity_order").notNull(), // Order within the day
  activityType: text("activity_type").notNull(), // From activityTypeEnum
  ceremonyType: text("ceremony_type"), // If this is a ceremony
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default('pending'), // 'pending', 'in_progress', 'completed', 'skipped'
  isRequired: boolean("is_required").notNull().default(true),
  estimatedMinutes: integer("estimated_minutes").notNull().default(15),
  competencyTags: text("competency_tags").array(), // Competencies practiced
  activityData: jsonb("activity_data").notNull().default('{}'), // Activity-specific content
  userResponse: jsonb("user_response"), // User's actions/responses
  evaluation: jsonb("evaluation"), // AI evaluation of user's performance
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Competency Snapshots - snapshots of competency state at key points
export const competencySnapshots = pgTable("competency_snapshots", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  journeyId: integer("journey_id").references(() => userJourneys.id).notNull(),
  arcId: integer("arc_id").references(() => journeyArcs.id),
  sprintId: integer("sprint_id").references(() => sprints.id),
  snapshotType: text("snapshot_type").notNull(), // 'arc_start', 'arc_end', 'sprint_end', 'journey_end'
  readinessScore: integer("readiness_score").notNull(),
  competencyScores: jsonb("competency_scores").notNull(), // { [slug]: { band, confidence, score } }
  strengths: text("strengths").array(),
  gaps: text("gaps").array(),
  recommendations: jsonb("recommendations"), // AI-generated recommendations
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas for Phase 3 tables
export const insertProgressionPathSchema = createInsertSchema(progressionPaths).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectTemplateSchema = createInsertSchema(projectTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserJourneySchema = createInsertSchema(userJourneys).omit({
  id: true,
  startedAt: true,
  lastActivityAt: true,
});

export const insertJourneyArcSchema = createInsertSchema(journeyArcs).omit({
  id: true,
  createdAt: true,
});

export const insertSprintSchema = createInsertSchema(sprints).omit({
  id: true,
  createdAt: true,
});

export const insertSprintActivitySchema = createInsertSchema(sprintActivities).omit({
  id: true,
  createdAt: true,
});

export const insertCompetencySnapshotSchema = createInsertSchema(competencySnapshots).omit({
  id: true,
  createdAt: true,
});

// Types for Phase 3 tables
export type InsertProgressionPath = z.infer<typeof insertProgressionPathSchema>;
export type ProgressionPath = typeof progressionPaths.$inferSelect;

export type InsertProjectTemplate = z.infer<typeof insertProjectTemplateSchema>;
export type ProjectTemplate = typeof projectTemplates.$inferSelect;

export type InsertUserJourney = z.infer<typeof insertUserJourneySchema>;
export type UserJourney = typeof userJourneys.$inferSelect;

export type InsertJourneyArc = z.infer<typeof insertJourneyArcSchema>;
export type JourneyArc = typeof journeyArcs.$inferSelect;

export type InsertSprint = z.infer<typeof insertSprintSchema>;
export type Sprint = typeof sprints.$inferSelect;

export type InsertSprintActivity = z.infer<typeof insertSprintActivitySchema>;
export type SprintActivity = typeof sprintActivities.$inferSelect;

export type InsertCompetencySnapshot = z.infer<typeof insertCompetencySnapshotSchema>;
export type CompetencySnapshot = typeof competencySnapshots.$inferSelect;

// Journey state interface for frontend consumption
export interface JourneyState {
  journey: UserJourney;
  currentArc: JourneyArc | null;
  currentSprint: Sprint | null;
  currentDay: number;
  todayActivities: SprintActivity[];
  readinessScore: number;
  canGraduate: boolean;
  exitOptions: {
    userChoice: boolean;
    readinessThreshold: boolean;
    maxSprints: boolean;
  };
}

// Sprint generation request
export interface SprintGenerationRequest {
  journeyId: number;
  sprintNumber: number;
  difficultyBand: DifficultyBand;
  previousSprints: Sprint[];
  userCompetencyGaps: string[];
  avoidThemes: string[];
  avoidTemplates: string[];
}

// Progression requirements
export interface ProgressionRequirements {
  minSprints: number;
  maxSprints: number;
  readinessThreshold: number;
  requiredCompetencies: {
    slug: string;
    minBand: MasteryBand;
  }[];
}

// Job Offer Details Structure - mimics real job offers
export interface OfferDetails {
  // Core Compensation
  baseSalary: number;
  salaryFrequency: 'annual' | 'monthly';
  signingBonus?: number;
  annualBonus?: {
    targetPercent: number;
    description: string;
  };
  
  // Equity
  equity?: {
    type: 'stock_options' | 'rsu' | 'none';
    amount: number;
    vestingSchedule: string;
    cliffMonths: number;
    totalVestingMonths: number;
  };
  
  // Benefits
  benefits: {
    healthInsurance: string;
    dentalVision: boolean;
    retirement401k: {
      available: boolean;
      matchPercent?: number;
      maxMatch?: number;
    };
    pto: {
      days: number;
      type: 'unlimited' | 'accrued' | 'fixed';
    };
    remote: 'full' | 'hybrid' | 'onsite';
    otherBenefits: string[];
  };
  
  // Job Details
  startDate: string;
  responseDeadline: string;
  reportingTo: string;
  teamSize: number;
  
  // Offer metadata
  offerDate: string;
  offerLetterSignatory: string;
  offerLetterSignatoryTitle: string;
}

// =====================================================
// Phase 4: Dynamic Sprint Generation Templates
// =====================================================

export type TemplateCategory = 'bug' | 'feature' | 'soft_skill';
export type TemplateDifficulty = 'guided' | 'supported' | 'independent' | 'expert';

export interface ContextVariable {
  key: string;
  description: string;
  examples: Record<string, string>;
}

export interface BugTemplate {
  id: string;
  version: string;
  category: 'bug';
  name: string;
  summary: string;
  description: string;
  difficulty: TemplateDifficulty[];
  roles: string[];
  languages: string[];
  competencies: string[];
  contextVariables: ContextVariable[];
  scenarioTemplate: {
    ticketTitle: string;
    ticketDescription: string;
    acceptanceCriteria: string[];
    filesToInvestigate: string[];
  };
  codeExercise: {
    problemDescription: string;
    codeTemplate: string;
    blanks: {
      id: string;
      placeholder: string;
      correctAnswers: string[];
      hint: string;
    }[];
    fixedCode: string;
    successMessage: string;
  };
  hints: string[];
  commonMistakes: string[];
  industryExamples: Record<string, {
    feature: string;
    specificContext: string;
    testScenario: string;
  }>;
  cooldownSprints: number;
}

export interface FeatureTemplate {
  id: string;
  version: string;
  category: 'feature';
  name: string;
  summary: string;
  description: string;
  difficulty: TemplateDifficulty[];
  roles: string[];
  languages: string[];
  competencies: string[];
  contextVariables: ContextVariable[];
  scenarioTemplate: {
    ticketTitle: string;
    ticketDescription: string;
    acceptanceCriteria: string[];
    technicalRequirements: string[];
  };
  codeExercise: {
    problemDescription: string;
    codeTemplate: string;
    blanks: {
      id: string;
      placeholder: string;
      correctAnswers: string[];
      hint: string;
    }[];
    solutionCode: string;
    successMessage: string;
  };
  hints: string[];
  industryExamples: Record<string, {
    feature: string;
    specificContext: string;
    businessValue: string;
  }>;
  cooldownSprints: number;
}

export interface SoftSkillTemplate {
  id: string;
  version: string;
  category: 'soft_skill';
  name: string;
  summary: string;
  skillType: 'pressure' | 'feedback' | 'conflict' | 'ambiguity' | 'communication' | 'help' | 'mistakes';
  competencies: string[];
  trigger: 'start_of_day' | 'mid_sprint' | 'end_of_day' | 'after_activity' | 'random';
  contextVariables: ContextVariable[];
  scenarioTemplate: {
    setup: string;
    message: string;
    sender: string;
    senderRole: string;
  };
  responseOptions: {
    id: string;
    label: string;
    description: string;
    isRecommended: boolean;
    evaluationNotes: string;
  }[];
  evaluationCriteria: {
    dimension: string;
    question: string;
    weight: number;
  }[];
  followUpTemplates: {
    condition: string;
    message: string;
  }[];
  industryExamples: Record<string, {
    context: string;
    specificMessage: string;
  }>;
  cooldownSprints: number;
}

export type ProblemTemplate = BugTemplate | FeatureTemplate | SoftSkillTemplate;

export interface SprintTheme {
  id: string;
  name: string;
  description: string;
  industries: string[];
  suggestedTemplates: {
    bugs: string[];
    features: string[];
    softSkills: string[];
  };
}

export interface GeneratedSprintBacklog {
  theme: SprintTheme;
  tickets: {
    templateId: string;
    type: 'bug' | 'feature';
    day: number;
    appliedContext: Record<string, string>;
    generatedTicket: {
      title: string;
      description: string;
      acceptanceCriteria: string[];
      difficulty: TemplateDifficulty;
    };
  }[];
  softSkillEvents: {
    templateId: string;
    day: number;
    trigger: string;
    appliedContext: Record<string, string>;
    generatedScenario: {
      setup: string;
      message: string;
      sender: string;
      senderRole: string;
    };
  }[];
  ceremonies: {
    planning: { day: number; script: string[] };
    standups: { day: number; script: string[] }[];
    review: { day: number; script: string[] };
    retro: { day: number; script: string[] };
  };
}

// =====================================================
// Phase 5: Sprint Tickets, Ceremonies, Git Workflow
// =====================================================

export type TicketStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type TicketType = 'bug' | 'feature';
export type CeremonyStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';
export type GitCommandType = 'clone' | 'checkout' | 'branch' | 'add' | 'commit' | 'push' | 'pull' | 'fetch' | 'merge' | 'rebase' | 'status' | 'log' | 'diff';
export type PRStatus = 'draft' | 'open' | 'changes_requested' | 'approved' | 'merged' | 'closed';

// Sprint Tickets - individual work items with Git state
export const sprintTickets = pgTable("sprint_tickets", {
  id: serial("id").primaryKey(),
  sprintId: integer("sprint_id").references(() => sprints.id).notNull(),
  ticketKey: text("ticket_key").notNull(), // e.g., "ACME-42"
  templateId: text("template_id"), // Reference to template used
  type: text("type").notNull(), // 'bug' | 'feature'
  title: text("title").notNull(),
  description: text("description").notNull(),
  acceptanceCriteria: jsonb("acceptance_criteria").notNull().default('[]'),
  storyPoints: integer("story_points").notNull().default(2),
  status: text("status").notNull().default('todo'), // TicketStatus
  priority: text("priority").notNull().default('medium'),
  dayAssigned: integer("day_assigned").notNull().default(1),
  gitState: jsonb("git_state").notNull().default('{}'), // GitTicketState
  codeExercise: jsonb("code_exercise"), // Code exercise data from template
  prDetails: jsonb("pr_details"), // PR information
  reviewComments: jsonb("review_comments").default('[]'),
  competenciesPracticed: text("competencies_practiced").array(),
  evaluation: jsonb("evaluation"), // AI evaluation of work
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Ceremony Instances - tracking ceremony execution
export const ceremonyInstances = pgTable("ceremony_instances", {
  id: serial("id").primaryKey(),
  sprintId: integer("sprint_id").references(() => sprints.id).notNull(),
  ceremonyType: text("ceremony_type").notNull(), // CeremonyType
  dayNumber: integer("day_number").notNull(),
  status: text("status").notNull().default('pending'), // CeremonyStatus
  script: jsonb("script").notNull().default('[]'), // Ceremony script/prompts
  teamMessages: jsonb("team_messages").notNull().default('[]'), // AI team member messages
  userResponses: jsonb("user_responses").notNull().default('[]'), // User's responses
  actionItems: jsonb("action_items").default('[]'), // For retro
  commitments: jsonb("commitments").default('[]'), // For planning
  feedback: jsonb("feedback"), // Manager feedback for 1:1
  competencyDeltas: jsonb("competency_deltas"), // Competency changes from this ceremony
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Git Sessions - one per ticket, tracks Git state
export const gitSessions = pgTable("git_sessions", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").references(() => sprintTickets.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  repoName: text("repo_name").notNull(),
  currentBranch: text("current_branch").notNull().default('main'),
  isCloned: boolean("is_cloned").notNull().default(false),
  stagedFiles: text("staged_files").array().default([]),
  commits: jsonb("commits").notNull().default('[]'), // Local commit history
  remoteSyncStatus: text("remote_sync_status").notNull().default('synced'), // 'synced', 'ahead', 'behind', 'diverged'
  prStatus: text("pr_status"), // PRStatus
  prUrl: text("pr_url"),
  lastFetchAt: timestamp("last_fetch_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Git Events - individual Git commands executed
export const gitEvents = pgTable("git_events", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => gitSessions.id).notNull(),
  commandType: text("command_type").notNull(), // GitCommandType
  rawCommand: text("raw_command").notNull(), // Full command string
  isValid: boolean("is_valid").notNull().default(true),
  output: text("output"), // Simulated output
  errorMessage: text("error_message"),
  stateChange: jsonb("state_change"), // What changed in git state
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Workspace Phase types
export type WorkspacePhase = 'onboarding' | 'planning' | 'execution' | 'review' | 'retro';
export type WorkspaceStatus = 'active' | 'paused' | 'completed';
export type PhaseEventStatus = 'started' | 'completed';

// Workspace Instances - created when job offer is accepted
export const workspaceInstances = pgTable("workspace_instances", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  journeyId: integer("journey_id").references(() => userJourneys.id).notNull(),
  jobApplicationId: integer("job_application_id").references(() => jobApplications.id),
  projectTemplateId: integer("project_template_id").references(() => projectTemplates.id),
  companyName: text("company_name").notNull(),
  role: text("role").notNull(),
  status: text("status").notNull().default('active'), // WorkspaceStatus
  currentPhase: text("current_phase").notNull().default('onboarding'), // WorkspacePhase
  currentSprintId: integer("current_sprint_id"),
  onboardingCompletedAt: timestamp("onboarding_completed_at"),
  workspaceMetadata: jsonb("workspace_metadata").notNull().default('{}'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Workspace Phase Events - tracks phase transitions
export const workspacePhaseEvents = pgTable("workspace_phase_events", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").references(() => workspaceInstances.id).notNull(),
  phase: text("phase").notNull(), // WorkspacePhase
  sprintId: integer("sprint_id"), // Nullable - only for sprint phases
  status: text("status").notNull(), // PhaseEventStatus: 'started' | 'completed'
  payload: jsonb("payload").default('{}'), // Phase-specific outputs (sprint goal, retro actions, etc.)
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas for workspace tables
export const insertWorkspaceInstanceSchema = createInsertSchema(workspaceInstances).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkspacePhaseEventSchema = createInsertSchema(workspacePhaseEvents).omit({
  id: true,
  createdAt: true,
});

// Types for workspace tables
export type InsertWorkspaceInstance = z.infer<typeof insertWorkspaceInstanceSchema>;
export type WorkspaceInstance = typeof workspaceInstances.$inferSelect;

// Phase 6: Sprint Planning Session Tables
export type PlanningPhase = 'context' | 'discussion' | 'commitment';

export const planningSessions = pgTable("planning_sessions", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").references(() => workspaceInstances.id).notNull(),
  sprintId: integer("sprint_id").references(() => sprints.id),
  role: text("role").notNull(), // 'developer' | 'pm' | 'qa' | etc.
  level: text("level").notNull(), // 'intern' | 'junior' | 'mid' | 'senior'
  currentPhase: text("current_phase").notNull().default('context'), // PlanningPhase
  phaseCompletions: jsonb("phase_completions").notNull().default('{"context": false, "discussion": false, "commitment": false}'),
  selectedItems: jsonb("selected_items").notNull().default('[]'), // Array of backlog item IDs selected for sprint
  capacityUsed: integer("capacity_used").notNull().default(0),
  goalStatement: text("goal_statement"),
  commitmentSummary: text("commitment_summary"),
  knowledgeCheckPassed: boolean("knowledge_check_passed").notNull().default(false),
  status: text("status").notNull().default('active'), // 'active' | 'completed' | 'abandoned'
  score: integer("score"), // Final planning score (0-100)
  feedback: jsonb("feedback"), // Evaluation feedback
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const planningMessages = pgTable("planning_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => planningSessions.id).notNull(),
  sender: text("sender").notNull(), // 'User' or AI persona name
  senderRole: text("sender_role").notNull(), // 'user' | 'pm' | 'developer' | 'qa' | etc.
  message: text("message").notNull(),
  phase: text("phase").notNull(), // PlanningPhase
  isUser: boolean("is_user").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas for planning tables
export const insertPlanningSessionSchema = createInsertSchema(planningSessions).omit({
  id: true,
  startedAt: true,
});

export const insertPlanningMessageSchema = createInsertSchema(planningMessages).omit({
  id: true,
  createdAt: true,
});

// Types for planning tables
export type InsertPlanningSession = z.infer<typeof insertPlanningSessionSchema>;
export type PlanningSession = typeof planningSessions.$inferSelect;

export type InsertPlanningMessage = z.infer<typeof insertPlanningMessageSchema>;
export type PlanningMessage = typeof planningMessages.$inferSelect;

// Engagement mode types for planning
export type EngagementMode = 'shadow' | 'guided' | 'active' | 'facilitator';
export type PhaseEngagement = 'observe' | 'respond' | 'lead';

export interface LevelEngagement {
  mode: EngagementMode;
  autoStartConversation: boolean;
  teamTalkRatio: number;
  phaseEngagement: {
    context: PhaseEngagement;
    discussion: PhaseEngagement;
    commitment: PhaseEngagement;
  };
  promptSuggestions?: {
    context: string[];
    discussion: string[];
    commitment: string[];
  };
  autoStartMessage: string;
}

// Planning session state for API responses
export interface PlanningSessionState {
  session: PlanningSession;
  messages: PlanningMessage[];
  backlogItems: {
    id: string;
    title: string;
    description: string;
    type: 'bug' | 'feature' | 'improvement';
    priority: 'high' | 'medium' | 'low';
    points: number;
    selected: boolean;
  }[];
  capacity: number;
  adapterConfig: {
    role: string;
    level: string;
    facilitator: 'user' | 'ai';
    showLearningObjectives: boolean;
    showKnowledgeCheck: boolean;
    canSkipPhases: boolean;
    engagement?: LevelEngagement;
  };
}

export type InsertWorkspacePhaseEvent = z.infer<typeof insertWorkspacePhaseEventSchema>;
export type WorkspacePhaseEvent = typeof workspacePhaseEvents.$inferSelect;

// Workspace state for API responses
export interface WorkspaceState {
  workspace: WorkspaceInstance;
  currentPhase: WorkspacePhase;
  currentSprint: Sprint | null;
  phaseChecklist: {
    item: string;
    completed: boolean;
    required: boolean;
  }[];
  nextActions: {
    action: string;
    route: string;
    priority: 'primary' | 'secondary';
  }[];
  phaseHistory: WorkspacePhaseEvent[];
}

// Insert schemas for Phase 5 tables
export const insertSprintTicketSchema = createInsertSchema(sprintTickets).omit({
  id: true,
  createdAt: true,
});

export const insertCeremonyInstanceSchema = createInsertSchema(ceremonyInstances).omit({
  id: true,
  createdAt: true,
});

export const insertGitSessionSchema = createInsertSchema(gitSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGitEventSchema = createInsertSchema(gitEvents).omit({
  id: true,
  createdAt: true,
});

// Types for Phase 5 tables
export type InsertSprintTicket = z.infer<typeof insertSprintTicketSchema>;
export type SprintTicket = typeof sprintTickets.$inferSelect;

export type InsertCeremonyInstance = z.infer<typeof insertCeremonyInstanceSchema>;
export type CeremonyInstance = typeof ceremonyInstances.$inferSelect;

export type InsertGitSession = z.infer<typeof insertGitSessionSchema>;
export type GitSession = typeof gitSessions.$inferSelect;

export type InsertGitEvent = z.infer<typeof insertGitEventSchema>;
export type GitEvent = typeof gitEvents.$inferSelect;

// Git state for a ticket
export interface GitTicketState {
  branchName: string | null;
  branchCreatedAt: string | null;
  commits: {
    hash: string;
    message: string;
    timestamp: string;
  }[];
  isPushed: boolean;
  prCreated: boolean;
  prApproved: boolean;
  isMerged: boolean;
}

// PR Details structure
export interface PRDetails {
  title: string;
  description: string;
  targetBranch: string;
  sourceBranch: string;
  status: PRStatus;
  reviewers: string[];
  checksStatus: 'pending' | 'passing' | 'failing';
  comments: {
    author: string;
    authorRole: string;
    message: string;
    file?: string;
    line?: number;
    timestamp: string;
  }[];
  approvedBy: string[];
  createdAt: string;
  mergedAt?: string;
}

// Ceremony user response
export interface CeremonyUserResponse {
  promptId: string;
  response: string;
  timestamp: string;
}

// Standup response structure
export interface StandupResponse {
  yesterday: string;
  today: string;
  blockers: string;
}

// Retro item structure
export interface RetroItem {
  id: string;
  category: 'went_well' | 'improve' | 'action_item';
  content: string;
  votes: number;
  author: 'user' | string; // 'user' or AI team member name
}

// Sprint overview for dashboard
export interface SprintOverview {
  sprint: Sprint;
  tickets: SprintTicket[];
  ceremonies: CeremonyInstance[];
  currentDay: number;
  ticketStats: {
    todo: number;
    inProgress: number;
    inReview: number;
    done: number;
  };
  upcomingCeremonies: CeremonyInstance[];
  todayActivities: SprintActivity[];
}

// Journey dashboard data
export interface JourneyDashboard {
  journey: UserJourney;
  currentArc: JourneyArc | null;
  currentSprint: SprintOverview | null;
  readinessScore: number;
  competencyScores: Record<string, { score: number; band: MasteryBand }>;
  timeline: {
    arcs: (JourneyArc & { sprints: Sprint[] })[];
    currentPosition: { arcIndex: number; sprintIndex: number };
  };
  canGraduate: boolean;
  estimatedSprintsRemaining: number;
}
