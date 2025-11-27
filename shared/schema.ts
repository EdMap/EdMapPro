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
  stageType: text("stage_type").notNull(), // 'recruiter_call', 'technical', 'behavioral', 'case_study', 'panel', 'offer'
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
