import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import * as pdfParse from "pdf-parse";
import { storage } from "./storage";
import { groqService } from "./services/groq";
import { openaiService } from "./services/openai";
import { workspaceOrchestrator } from "./services/workspace-orchestrator";
import { insertSimulationSessionSchema } from "@shared/schema";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept audio and document files
    if (file.mimetype.startsWith('audio/') || 
        file.mimetype === 'application/pdf' ||
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only audio and document files (PDF, DOC, DOCX) are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // User authentication (simplified for MVP)
  app.get("/api/user", async (req, res) => {
    try {
      // For MVP, return the default user
      const user = await storage.getUser(1);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Get user progress
  app.get("/api/user/:userId/progress", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const progress = await storage.getUserProgress(userId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user progress" });
    }
  });

  // Get simulation sessions
  app.get("/api/user/:userId/sessions", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const type = req.query.type as string;
      const sessions = await storage.getUserSimulationSessions(userId, type);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get sessions" });
    }
  });

  // Create simulation session
  app.post("/api/sessions", async (req, res) => {
    try {
      const sessionData = insertSimulationSessionSchema.parse(req.body);
      const session = await storage.createSimulationSession(sessionData);
      
      // Update user progress
      let progress = await storage.getUserProgressByType(session.userId, session.type);
      if (!progress) {
        progress = await storage.createUserProgress({
          userId: session.userId,
          simulationType: session.type,
          totalSessions: 1,
          completedSessions: 0,
          totalTime: 0
        });
      } else {
        await storage.updateUserProgress(session.userId, session.type, {
          totalSessions: progress.totalSessions + 1,
          lastSessionAt: new Date()
        });
      }
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  // Get single simulation session
  app.get("/api/sessions/:sessionId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const session = await storage.getSimulationSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to get session" });
    }
  });

  // Update simulation session
  app.patch("/api/sessions/:sessionId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const updates = req.body;
      const session = await storage.updateSimulationSession(sessionId, updates);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  // Generate interview question
  app.post("/api/interview/question", async (req, res) => {
    try {
      const { profession, interviewType, difficulty, jobPosting, previousQuestions } = req.body;
      
      const question = await groqService.generateInterviewQuestion(
        profession,
        interviewType,
        difficulty,
        jobPosting,
        previousQuestions
      );
      
      res.json(question);
    } catch (error) {
      console.log("API error, using fallback:", (error as Error).message);
      // If OpenAI fails, provide a fallback response
      const { difficulty: reqDifficulty } = req.body;
      const fallbackQuestion = {
        question: "What is the difference between let, const, and var in JavaScript?",
        category: "technical",
        difficulty: reqDifficulty || "junior",
        expectedAnswer: "Provide a clear explanation of the scoping and reassignment differences between these variable declaration keywords."
      };
      res.json(fallbackQuestion);
    }
  });

  // Evaluate interview answer
  app.post("/api/interview/evaluate", async (req, res) => {
    try {
      const { question, answer, profession, difficulty } = req.body;
      
      const evaluation = await groqService.evaluateInterviewAnswer(
        question,
        answer,
        difficulty
      );
      
      res.json(evaluation);
    } catch (error) {
      console.log("API error, using fallback evaluation:", (error as Error).message);
      // Fallback evaluation
      const { answer: userAnswer } = req.body;
      const answerLength = userAnswer?.length || 0;
      const score = Math.min(85, Math.max(60, 60 + Math.floor(answerLength / 50)));
      const fallbackEvaluation = {
        score,
        feedback: score >= 75 
          ? "Good answer! You demonstrated understanding of the topic. Consider adding more specific examples."
          : "Your response shows basic knowledge. Try to provide more detailed explanations and examples.",
        followUp: "Can you elaborate on how you would implement this in practice?"
      };
      res.json(fallbackEvaluation);
    }
  });

  // Generate negotiation response
  app.post("/api/negotiation/respond", async (req, res) => {
    try {
      const { scenario, userMessage, negotiationHistory, counterpartStyle } = req.body;
      
      const response = await groqService.generateNegotiationResponse(
        scenario,
        userMessage,
        negotiationHistory,
        counterpartStyle
      );
      
      res.json(response);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate response: " + (error as Error).message });
    }
  });

  // Generate workspace team message
  app.post("/api/workspace/message", async (req, res) => {
    try {
      const { teamMember, context, userAction } = req.body;
      
      const message = await groqService.generateWorkspaceMessage(
        context,
        userAction,
        teamMember,
        'message'
      );
      
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate message: " + (error as Error).message });
    }
  });

  // Transcribe audio using Whisper
  app.post("/api/transcribe", upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No audio file provided" });
      }

      const audioBuffer = req.file.buffer;
      const mimeType = req.file.mimetype;

      const result = await groqService.transcribeAudio(audioBuffer, mimeType);
      res.json(result);
    } catch (error) {
      console.error('Transcription error:', error);
      res.status(500).json({ message: "Failed to transcribe audio: " + (error as Error).message });
    }
  });

  // Customer Support API endpoints
  app.post("/api/customer-support/message", async (req, res) => {
    try {
      const { stage, persona, problem, agentMessage, conversationHistory, isInitial, stageTransition } = req.body;
      
      const response = await groqService.generateCustomerSupportMessage(
        stage,
        persona,
        problem,
        agentMessage,
        conversationHistory,
        isInitial,
        stageTransition
      );
      
      res.json(response);
    } catch (error) {
      console.error('Customer support message generation error:', error);
      res.status(500).json({ message: "Failed to generate customer message" });
    }
  });

  app.post("/api/customer-support/evaluate", async (req, res) => {
    try {
      const { stage, agentMessage, customerPersona, problem, conversationHistory } = req.body;
      
      const evaluation = await groqService.evaluateCustomerSupportResponse(
        stage,
        agentMessage,
        customerPersona,
        problem,
        conversationHistory
      );
      
      res.json(evaluation);
    } catch (error) {
      console.error('Customer support evaluation error:', error);
      res.status(500).json({ message: "Failed to evaluate response" });
    }
  });

  // Workspace Simulator API endpoints
  
  // Get all workspace projects
  app.get("/api/workspace/projects", async (req, res) => {
    try {
      const projects = await storage.getWorkspaceProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to get projects: " + (error as Error).message });
    }
  });

  // Get specific workspace project
  app.get("/api/workspace/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getWorkspaceProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to get project: " + (error as Error).message });
    }
  });

  // Get workspace roles
  app.get("/api/workspace/roles", async (req, res) => {
    try {
      const roles = await storage.getWorkspaceRoles();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: "Failed to get roles: " + (error as Error).message });
    }
  });

  // Get session tasks
  app.get("/api/workspace/:sessionId/tasks", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const tasks = await storage.getWorkspaceTasks(sessionId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to get tasks: " + (error as Error).message });
    }
  });

  // Update task
  app.patch("/api/workspace/tasks/:taskId", async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const updates = req.body;
      const task = await storage.updateWorkspaceTask(taskId, updates);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to update task: " + (error as Error).message });
    }
  });

  // Get session artifacts
  app.get("/api/workspace/:sessionId/artifacts", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const artifacts = await storage.getWorkspaceArtifacts(sessionId);
      res.json(artifacts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get artifacts: " + (error as Error).message });
    }
  });

  // Create artifact
  app.post("/api/workspace/:sessionId/artifacts", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const artifactData = { ...req.body, sessionId };
      const artifact = await storage.createWorkspaceArtifact(artifactData);
      res.json(artifact);
    } catch (error) {
      res.status(500).json({ message: "Failed to create artifact: " + (error as Error).message });
    }
  });

  // Get session interactions
  app.get("/api/workspace/:sessionId/interactions", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const channel = req.query.channel as string | undefined;
      const interactions = await storage.getWorkspaceInteractions(sessionId, channel);
      res.json(interactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get interactions: " + (error as Error).message });
    }
  });

  // Create interaction (for auto-messages and direct messages)
  app.post("/api/workspace/:sessionId/interactions", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const interactionData = { ...req.body, sessionId };
      const interaction = await storage.createWorkspaceInteraction(interactionData);
      res.json(interaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to create interaction: " + (error as Error).message });
    }
  });

  // Handle user action (main orchestration endpoint)
  app.post("/api/workspace/:sessionId/action", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const { type, channel, data } = req.body;
      
      const session = await storage.getSimulationSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const config = session.configuration as any;
      const project = await storage.getWorkspaceProject(config.projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Store user interaction
      await storage.createWorkspaceInteraction({
        sessionId,
        channel,
        sender: 'User',
        senderRole: config.activeRole,
        content: data.content || JSON.stringify(data),
        metadata: { actionType: type }
      });

      // Build context for orchestrator
      const context = {
        projectName: project.name,
        projectDescription: project.description,
        currentSprint: config.sprintPhase || 'sprint',
        teamMembers: project.teamStructure as any[],
        userRole: config.activeRole,
        phase: config.sprintPhase || 'sprint'
      };

      // Evaluate user action
      const evaluation = await workspaceOrchestrator.evaluateAction(
        { type, channel, data },
        context
      );

      // Orchestrate team member responses
      let responses: any[] = [];
      if (type === 'send-message') {
        responses = await workspaceOrchestrator.orchestrateConversation(
          data.content,
          channel,
          context,
          sessionId
        );

        // Store AI responses
        for (const response of responses) {
          await storage.createWorkspaceInteraction({
            sessionId,
            channel,
            sender: response.sender,
            senderRole: response.senderRole,
            content: response.content
          });
        }
      }

      res.json({
        evaluation,
        responses,
        success: true
      });
    } catch (error) {
      console.error('Workspace action error:', error);
      res.status(500).json({ message: "Failed to process action: " + (error as Error).message });
    }
  });

  // Get session evaluation
  app.get("/api/workspace/:sessionId/evaluation", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const evaluations = await storage.getWorkspaceEvaluations(sessionId);
      res.json(evaluations);
    } catch (error) {
      res.status(500).json({ message: "Failed to get evaluation: " + (error as Error).message });
    }
  });

  // Create evaluation
  app.post("/api/workspace/:sessionId/evaluation", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const evaluationData = { ...req.body, sessionId };
      const evaluation = await storage.createWorkspaceEvaluation(evaluationData);
      res.json(evaluation);
    } catch (error) {
      res.status(500).json({ message: "Failed to create evaluation: " + (error as Error).message });
    }
  });

  // Generate session feedback
  app.post("/api/sessions/:sessionId/feedback", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const session = await storage.getSimulationSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      const feedback = await openaiService.generateSessionFeedback(
        session.type,
        session.messages as any[],
        session.configuration as any
      );
      
      // Update session with feedback and mark as completed
      const duration = session.completedAt 
        ? Math.floor((session.completedAt.getTime() - session.startedAt.getTime()) / 1000)
        : 0;
        
      await storage.updateSimulationSession(sessionId, {
        status: 'completed',
        score: feedback.score,
        feedback: feedback,
        completedAt: new Date(),
        duration
      });
      
      // Update user progress
      const progress = await storage.getUserProgressByType(session.userId, session.type);
      if (progress) {
        const newCompletedSessions = progress.completedSessions + 1;
        const newAverageScore = progress.averageScore 
          ? Math.round((progress.averageScore * progress.completedSessions + feedback.score) / newCompletedSessions)
          : feedback.score;
          
        await storage.updateUserProgress(session.userId, session.type, {
          completedSessions: newCompletedSessions,
          averageScore: newAverageScore,
          totalTime: progress.totalTime + duration,
          lastSessionAt: new Date()
        });
      }
      
      res.json(feedback);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate feedback: " + (error as Error).message });
    }
  });

  // ============================================
  // Interview Simulator API Endpoints
  // ============================================

  // Start a new interview
  app.post("/api/interviews/start", async (req, res) => {
    try {
      const { userId, interviewType, targetRole, difficulty, totalQuestions, applicationStageId } = req.body;
      
      if (!userId || !interviewType || !targetRole) {
        return res.status(400).json({ message: "userId, interviewType, and targetRole are required" });
      }

      // Build job context if this is a Journey mode interview
      let jobContext: {
        companyName?: string;
        companyDescription?: string;
        jobTitle?: string;
        jobRequirements?: string;
        candidateCv?: string;
      } | undefined;

      if (applicationStageId) {
        const stage = await storage.getApplicationStage(applicationStageId);
        if (stage) {
          const application = await storage.getJobApplication(stage.applicationId);
          if (application) {
            const jobWithCompany = await storage.getJobPostingWithCompany(application.jobPostingId);
            if (jobWithCompany) {
              // Build requirements string from job posting
              const requirements = [];
              if (jobWithCompany.requirements) {
                requirements.push(...(jobWithCompany.requirements as string[]));
              }
              if (jobWithCompany.responsibilities) {
                requirements.push(...(jobWithCompany.responsibilities as string[]).map(r => `Responsibility: ${r}`));
              }
              
              jobContext = {
                companyName: jobWithCompany.company?.name,
                companyDescription: jobWithCompany.company?.description || `${jobWithCompany.company?.name} is a ${jobWithCompany.company?.size} ${jobWithCompany.company?.industry} company`,
                jobTitle: jobWithCompany.title,
                jobRequirements: requirements.length > 0 ? requirements.join('\n') : undefined,
                candidateCv: application.cvContent || undefined,
              };
            }
          }
        }
      }

      const { interviewOrchestrator } = await import("./services/interview-orchestrator");
      const result = await interviewOrchestrator.startInterview(
        userId,
        interviewType,
        targetRole,
        difficulty || "medium",
        totalQuestions || 5,
        jobContext
      );
      
      // If this interview is for an application stage, link them
      if (applicationStageId) {
        const stage = await storage.getApplicationStage(applicationStageId);
        if (stage) {
          await storage.updateApplicationStage(applicationStageId, {
            interviewSessionId: result.session.id,
            status: 'in_progress',
            scheduledAt: new Date(),
          });
        }
      }
      
      res.json({ ...result, applicationStageId });
    } catch (error) {
      console.error("Failed to start interview:", error);
      res.status(500).json({ message: "Failed to start interview: " + (error as Error).message });
    }
  });

  // Submit an answer to a question
  app.post("/api/interviews/:sessionId/answer", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const { questionId, answer } = req.body;
      
      if (!questionId || !answer) {
        return res.status(400).json({ message: "questionId and answer are required" });
      }

      const { interviewOrchestrator } = await import("./services/interview-orchestrator");
      const result = await interviewOrchestrator.submitAnswer(sessionId, questionId, answer);
      
      // If interview is complete and linked to an application stage, update the stage
      if (result.finalReport) {
        // Find the application stage linked to this interview session
        const linkedStage = await storage.getApplicationStageByInterviewSession(sessionId);
        if (linkedStage) {
          await storage.updateApplicationStage(linkedStage.id, {
            status: 'completed',
            completedAt: new Date(),
            score: result.finalReport.overallScore,
            feedback: result.finalReport.summary,
          });
          
          // Update the application's current stage index
          const application = await storage.getJobApplication(linkedStage.applicationId);
          if (application) {
            const stages = await storage.getApplicationStages(application.id);
            const nextStageIndex = application.currentStageIndex + 1;
            const totalStages = stages.length;
            
            await storage.updateJobApplication(application.id, {
              currentStageIndex: nextStageIndex,
              status: nextStageIndex >= totalStages ? 'offer' : 'interviewing',
            });
          }
        }
      }
      
      res.json(result);
    } catch (error) {
      console.error("Failed to submit answer:", error);
      res.status(500).json({ message: "Failed to submit answer: " + (error as Error).message });
    }
  });

  // Get interview status
  app.get("/api/interviews/:sessionId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      
      const { interviewOrchestrator } = await import("./services/interview-orchestrator");
      const status = await interviewOrchestrator.getInterviewStatus(sessionId);
      
      res.json(status);
    } catch (error) {
      console.error("Failed to get interview status:", error);
      res.status(500).json({ message: "Failed to get interview status: " + (error as Error).message });
    }
  });

  // Get user's interview history
  app.get("/api/users/:userId/interviews", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const sessions = await storage.getUserInterviewSessions(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get interview history: " + (error as Error).message });
    }
  });

  // ==================== JOB JOURNEY ROUTES ====================

  // Get all companies
  app.get("/api/companies", async (req, res) => {
    try {
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ message: "Failed to get companies" });
    }
  });

  // Get single company
  app.get("/api/companies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const company = await storage.getCompany(id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      res.status(500).json({ message: "Failed to get company" });
    }
  });

  // Get job postings with optional filters
  app.get("/api/jobs", async (req, res) => {
    try {
      const filters: { companyId?: number; role?: string; isActive?: boolean } = {};
      if (req.query.companyId) filters.companyId = parseInt(req.query.companyId as string);
      if (req.query.role) filters.role = req.query.role as string;
      if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';
      
      const postings = await storage.getJobPostings(filters);
      
      // Attach company info to each posting
      const postingsWithCompanies = await Promise.all(
        postings.map(async (posting) => {
          const company = await storage.getCompany(posting.companyId);
          return { ...posting, company };
        })
      );
      
      res.json(postingsWithCompanies);
    } catch (error) {
      res.status(500).json({ message: "Failed to get job postings" });
    }
  });

  // Get single job posting with company
  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const posting = await storage.getJobPostingWithCompany(id);
      if (!posting) {
        return res.status(404).json({ message: "Job posting not found" });
      }
      res.json(posting);
    } catch (error) {
      res.status(500).json({ message: "Failed to get job posting" });
    }
  });

  // Get glossary terms
  app.get("/api/glossary", async (req, res) => {
    try {
      const terms = await storage.getJobGlossary();
      res.json(terms);
    } catch (error) {
      res.status(500).json({ message: "Failed to get glossary" });
    }
  });

  // Get single glossary term
  app.get("/api/glossary/:term", async (req, res) => {
    try {
      const term = decodeURIComponent(req.params.term);
      const glossaryTerm = await storage.getJobGlossaryTerm(term);
      if (!glossaryTerm) {
        return res.status(404).json({ message: "Term not found" });
      }
      res.json(glossaryTerm);
    } catch (error) {
      res.status(500).json({ message: "Failed to get glossary term" });
    }
  });

  // Get user's job applications
  app.get("/api/users/:userId/applications", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const applications = await storage.getJobApplications(userId);
      
      // Attach job and company info
      const applicationsWithDetails = await Promise.all(
        applications.map(async (app) => {
          const jobWithCompany = await storage.getJobPostingWithCompany(app.jobPostingId);
          const stages = await storage.getApplicationStages(app.id);
          return { ...app, job: jobWithCompany, stages };
        })
      );
      
      res.json(applicationsWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to get applications" });
    }
  });

  // Create job application
  app.post("/api/applications", upload.single('cv'), async (req, res) => {
    try {
      const { userId, jobPostingId, coverLetter } = req.body;
      
      if (!userId || !jobPostingId) {
        return res.status(400).json({ message: "userId and jobPostingId are required" });
      }

      // Parse IDs as integers (FormData sends them as strings)
      const userIdNum = parseInt(userId);
      const jobPostingIdNum = parseInt(jobPostingId);

      // Get job posting to determine interview stages
      const job = await storage.getJobPosting(jobPostingIdNum);
      if (!job) {
        return res.status(404).json({ message: "Job posting not found" });
      }

      // Extract CV data if provided
      let cvFileName: string | null = null;
      let cvContent: string | null = null;
      
      if (req.file) {
        cvFileName = req.file.originalname;
        
        // Extract text content from PDF
        if (req.file.mimetype === 'application/pdf') {
          try {
            const pdfData = await (pdfParse as any).default(req.file.buffer);
            cvContent = pdfData.text.trim();
            console.log(`Extracted ${cvContent.length} characters from CV PDF`);
          } catch (pdfError) {
            console.error("Failed to parse PDF:", pdfError);
            cvContent = `[PDF parsing failed] ${req.file.originalname}`;
          }
        } else {
          // For other document types, store metadata
          cvContent = `[${req.file.mimetype}] ${req.file.originalname} (${req.file.size} bytes)`;
        }
      }

      // Create the application
      const application = await storage.createJobApplication({
        userId: userIdNum,
        jobPostingId: jobPostingIdNum,
        status: 'submitted',
        coverLetter: coverLetter || null,
        cvFileName: cvFileName,
        cvContent: cvContent,
        appliedAt: new Date(),
      });

      // Get interview template for this role
      const templates = await storage.getInterviewTemplates(job.companyId, job.role);
      const template = templates[0]; // Use first matching template
      
      // Create interview stages based on template or defaults
      if (template && template.stages) {
        const stages = template.stages as Array<{ order: number; type: string; name: string; duration: number; config: any }>;
        for (const stage of stages) {
          await storage.createApplicationStage({
            applicationId: application.id,
            stageOrder: stage.order,
            stageName: stage.name,
            stageType: stage.type,
            status: 'pending',
          });
        }
      } else {
        // Default stages based on role
        const defaultStages = job.role === 'developer' 
          ? [
              { order: 1, name: 'Recruiter Screen', type: 'recruiter_call' },
              { order: 2, name: 'Technical Screen', type: 'technical' },
              { order: 3, name: 'Coding Interview', type: 'technical' },
              { order: 4, name: 'System Design', type: 'technical' },
              { order: 5, name: 'Team Fit', type: 'behavioral' },
            ]
          : job.role === 'pm'
          ? [
              { order: 1, name: 'Recruiter Screen', type: 'recruiter_call' },
              { order: 2, name: 'Hiring Manager', type: 'behavioral' },
              { order: 3, name: 'Product Case', type: 'case_study' },
            ]
          : [
              { order: 1, name: 'Recruiter Screen', type: 'recruiter_call' },
              { order: 2, name: 'Skills Interview', type: 'behavioral' },
              { order: 3, name: 'Team Fit', type: 'behavioral' },
            ];

        for (const stage of defaultStages) {
          await storage.createApplicationStage({
            applicationId: application.id,
            stageOrder: stage.order,
            stageName: stage.name,
            stageType: stage.type,
            status: 'pending',
          });
        }
      }

      // Get the created stages
      const stages = await storage.getApplicationStages(application.id);
      const jobWithCompany = await storage.getJobPostingWithCompany(jobPostingId);

      res.json({ ...application, job: jobWithCompany, stages });
    } catch (error) {
      console.error("Failed to create application:", error);
      res.status(500).json({ message: "Failed to create application" });
    }
  });

  // Get single application with stages
  app.get("/api/applications/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const application = await storage.getJobApplication(id);
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const jobWithCompany = await storage.getJobPostingWithCompany(application.jobPostingId);
      const stages = await storage.getApplicationStages(id);

      res.json({ ...application, job: jobWithCompany, stages });
    } catch (error) {
      res.status(500).json({ message: "Failed to get application" });
    }
  });

  // Update application status
  app.patch("/api/applications/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const application = await storage.updateJobApplication(id, updates);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      res.json(application);
    } catch (error) {
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  // Update application stage (for interview completion, etc.)
  app.patch("/api/applications/:applicationId/stages/:stageId", async (req, res) => {
    try {
      const stageId = parseInt(req.params.stageId);
      const updates = req.body;
      
      const stage = await storage.updateApplicationStage(stageId, updates);
      if (!stage) {
        return res.status(404).json({ message: "Stage not found" });
      }
      
      // If stage is completed, update application's current stage index
      if (updates.status === 'completed') {
        const applicationId = parseInt(req.params.applicationId);
        const application = await storage.getJobApplication(applicationId);
        if (application) {
          await storage.updateJobApplication(applicationId, {
            currentStageIndex: application.currentStageIndex + 1,
          });
        }
      }
      
      res.json(stage);
    } catch (error) {
      res.status(500).json({ message: "Failed to update stage" });
    }
  });

  // Get interview templates
  app.get("/api/interview-templates", async (req, res) => {
    try {
      const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
      const role = req.query.role as string | undefined;
      
      const templates = await storage.getInterviewTemplates(companyId, role);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to get templates" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
