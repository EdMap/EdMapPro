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
