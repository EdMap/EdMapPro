import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");
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
      const { type, channel, data, currentDay, dayActivities, completedActivities } = req.body;
      
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
        phase: config.sprintPhase || 'sprint',
        currentDay: currentDay,
        dayActivities: dayActivities,
        completedActivities: completedActivities
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
            content: response.content,
            metadata: response.metadata || null
          });
        }
      }

      // Check if any response indicates conversation closed
      const conversationClosed = responses.some(r => r.metadata?.closed === true);

      res.json({
        evaluation,
        responses,
        conversationClosed,
        success: true
      });
    } catch (error) {
      console.error('Workspace action error:', error);
      res.status(500).json({ message: "Failed to process action: " + (error as Error).message });
    }
  });

  // Reopen a closed channel (for continuing conversation after goodbye)
  app.post("/api/workspace/:sessionId/reopen-channel", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const { channel } = req.body;
      
      // Validate required fields
      if (!channel || typeof channel !== 'string') {
        return res.status(400).json({ 
          success: false, 
          message: "Missing or invalid 'channel' field in request body" 
        });
      }
      
      // Verify session exists
      const session = await storage.getSimulationSession(sessionId);
      if (!session) {
        return res.status(404).json({ 
          success: false, 
          message: "Session not found" 
        });
      }
      
      workspaceOrchestrator.reopenChannel(channel);
      res.json({ success: true, message: `Channel ${channel} reopened` });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Failed to reopen channel: " + (error as Error).message 
      });
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

  // ============================================
  // Workspace Progress API Endpoints
  // ============================================

  // Get workspace progress for a user
  app.get("/api/workspace/progress/:userId/:mode?", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const mode = req.params.mode as 'practice' | 'journey' | undefined;
      const progress = await storage.getWorkspaceProgress(userId, mode);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to get workspace progress: " + (error as Error).message });
    }
  });

  // Get workspace progress by session
  app.get("/api/workspace/progress/session/:sessionId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const progress = await storage.getWorkspaceProgressBySession(sessionId);
      res.json(progress || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to get workspace progress: " + (error as Error).message });
    }
  });

  // Create or update workspace progress
  app.post("/api/workspace/progress", async (req, res) => {
    try {
      const progressData = req.body;
      const progress = await storage.createWorkspaceProgress(progressData);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to create workspace progress: " + (error as Error).message });
    }
  });

  // Update workspace progress
  app.patch("/api/workspace/progress/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const progress = await storage.updateWorkspaceProgress(id, updates);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to update workspace progress: " + (error as Error).message });
    }
  });

  // Restart workspace progress (for Full Journey mode)
  app.post("/api/workspace/progress/:sessionId/restart", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const progress = await storage.restartWorkspaceProgress(sessionId);
      if (!progress) {
        return res.status(404).json({ message: "Progress not found" });
      }
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to restart workspace progress: " + (error as Error).message });
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
      
      // Extract candidate name for personalized greeting
      let candidateName: string | undefined;
      
      // For journey mode, use the job's seniority as difficulty (e.g., "intern", "junior")
      let resolvedDifficulty = difficulty;

      if (applicationStageId) {
        const stage = await storage.getApplicationStage(applicationStageId);
        if (stage) {
          const application = await storage.getJobApplication(stage.applicationId);
          if (application) {
            // Get candidate name from user profile
            const user = await storage.getUser(application.userId);
            if (user) {
              candidateName = user.firstName || user.username;
            }
            
            const jobWithCompany = await storage.getJobPostingWithCompany(application.jobPostingId);
            if (jobWithCompany) {
              // Use job seniority as difficulty for journey mode (intern, junior, mid, senior, lead)
              resolvedDifficulty = jobWithCompany.seniority || difficulty;
              
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
      
      // Determine default question count based on interview type
      // HR/behavioral interviews need more questions (7) to properly assess fit
      // Technical interviews can be shorter (5) as they're more focused
      const defaultQuestionCount = interviewType === 'behavioral' || interviewType === 'hr' ? 7 : 5;
      
      // Determine mode based on whether this is linked to an application stage
      const mode = applicationStageId ? 'journey' : 'practice';
      
      const result = await interviewOrchestrator.startInterview(
        userId,
        interviewType,
        targetRole,
        resolvedDifficulty || "medium",
        totalQuestions || defaultQuestionCount,
        jobContext,
        candidateName,
        mode,
        applicationStageId
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

  // Handle prelude responses during conversational interview intro
  app.post("/api/interviews/:sessionId/prelude", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const { response } = req.body;
      
      if (!response) {
        return res.status(400).json({ message: "response is required" });
      }

      const { interviewOrchestrator } = await import("./services/interview-orchestrator");
      const result = await interviewOrchestrator.handlePreludeResponse(sessionId, response);
      
      res.json(result);
    } catch (error) {
      console.error("Failed to handle prelude response:", error);
      res.status(500).json({ message: "Failed to handle prelude response: " + (error as Error).message });
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
            const isLastStage = nextStageIndex >= totalStages;
            
            // If this is the last stage, generate a job offer
            let offerDetails = undefined;
            if (isLastStage) {
              const { generateJobOffer } = await import("./services/offer-generator");
              const jobPosting = await storage.getJobPosting(application.jobPostingId);
              const company = jobPosting ? await storage.getCompany(jobPosting.companyId) : null;
              const user = await storage.getUser(application.userId);
              
              if (jobPosting && company) {
                offerDetails = generateJobOffer({
                  jobPosting,
                  company,
                  stages,
                  candidateName: user ? `${user.firstName} ${user.lastName}` : 'Candidate',
                });
              }
            }
            
            await storage.updateJobApplication(application.id, {
              currentStageIndex: nextStageIndex,
              status: isLastStage ? 'offer' : 'interviewing',
              offerDetails: offerDetails || undefined,
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

  // Get interview feedback (for viewing past results)
  app.get("/api/interviews/:sessionId/feedback", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      
      const feedback = await storage.getInterviewFeedback(sessionId);
      if (!feedback) {
        return res.status(404).json({ message: "Feedback not found for this session" });
      }
      
      // Also get the session info and questions for context
      const session = await storage.getInterviewSession(sessionId);
      const questions = await storage.getInterviewQuestions(sessionId);
      
      res.json({
        feedback,
        session,
        questions
      });
    } catch (error) {
      console.error("Failed to get interview feedback:", error);
      res.status(500).json({ message: "Failed to get interview feedback: " + (error as Error).message });
    }
  });

  // Get user's interview history (supports mode filtering via query param)
  app.get("/api/users/:userId/interviews", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const mode = req.query.mode as 'practice' | 'journey' | undefined;
      const sessions = await storage.getUserInterviewSessions(userId, mode);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get interview history: " + (error as Error).message });
    }
  });

  // Get interview detail with transcript and feedback
  app.get("/api/interviews/:sessionId/detail", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      
      const session = await storage.getInterviewSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Interview session not found" });
      }
      
      const rawQuestions = await storage.getInterviewQuestions(sessionId);
      const feedbackData = await storage.getInterviewFeedback(sessionId);
      
      // Ensure questions have proper array types for strengths/improvements
      const questions = rawQuestions.map(q => ({
        ...q,
        strengths: Array.isArray(q.strengths) ? q.strengths : [],
        improvements: Array.isArray(q.improvements) ? q.improvements : [],
      }));
      
      // Format feedback to match frontend expectations
      const formattedFeedback = feedbackData ? {
        overallScore: feedbackData.overallScore,
        communicationScore: feedbackData.communicationScore,
        technicalScore: feedbackData.technicalScore,
        problemSolvingScore: feedbackData.problemSolvingScore,
        cultureFitScore: feedbackData.cultureFitScore,
        summary: feedbackData.summary,
        strengths: Array.isArray(feedbackData.strengths) ? feedbackData.strengths : [],
        improvements: Array.isArray(feedbackData.improvements) ? feedbackData.improvements : [],
        recommendations: Array.isArray(feedbackData.recommendations) ? feedbackData.recommendations : [],
        hiringDecision: feedbackData.hiringDecision,
      } : null;
      
      res.json({
        session,
        questions,
        feedback: formattedFeedback
      });
    } catch (error) {
      console.error("Failed to get interview detail:", error);
      res.status(500).json({ message: "Failed to get interview detail: " + (error as Error).message });
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
      const applicationsWithDetails = await storage.getJobApplicationsWithDetails(userId);
      res.json(applicationsWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to get applications" });
    }
  });

  // Get user's workspace instances
  app.get("/api/users/:userId/workspaces", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const workspaces = await storage.getUserWorkspaceInstances(userId);
      res.json(workspaces);
    } catch (error) {
      res.status(500).json({ message: "Failed to get workspaces" });
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
            const parser = new PDFParse({ data: req.file.buffer });
            const pdfData = await parser.getText();
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
        // Check if this is an intern position (simplified 2-stage pipeline)
        const isIntern = job.title.toLowerCase().includes('intern');
        
        // Default stages based on role and level
        let defaultStages;
        
        if (isIntern) {
          // Intern positions: 2-stage pipeline with team interview
          defaultStages = [
            { order: 1, name: 'Recruiter Screen', type: 'recruiter_call' },
            { order: 2, name: 'Team Interview', type: 'team' },
          ];
        } else if (job.role === 'developer') {
          defaultStages = [
            { order: 1, name: 'Recruiter Screen', type: 'recruiter_call' },
            { order: 2, name: 'Technical Screen', type: 'technical' },
            { order: 3, name: 'Coding Interview', type: 'technical' },
            { order: 4, name: 'System Design', type: 'technical' },
            { order: 5, name: 'Team Fit', type: 'behavioral' },
          ];
        } else if (job.role === 'pm') {
          defaultStages = [
            { order: 1, name: 'Recruiter Screen', type: 'recruiter_call' },
            { order: 2, name: 'Hiring Manager', type: 'behavioral' },
            { order: 3, name: 'Product Case', type: 'case_study' },
          ];
        } else {
          defaultStages = [
            { order: 1, name: 'Recruiter Screen', type: 'recruiter_call' },
            { order: 2, name: 'Skills Interview', type: 'behavioral' },
            { order: 3, name: 'Team Fit', type: 'behavioral' },
          ];
        }

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
      
      if (updates.status === 'accepted') {
        const posting = await storage.getJobPostingWithCompany(application.jobPostingId);
        
        let journeyId: number | null = null;
        const existingJourney = await storage.getUserActiveJourney(application.userId);
        
        if (existingJourney) {
          journeyId = existingJourney.id;
          if (!existingJourney.jobApplicationId) {
            await storage.updateJourney(existingJourney.id, { jobApplicationId: id });
          }
        } else {
          const progressionPaths = await storage.getProgressionPaths({ role: 'developer', entryLevel: 'intern' });
          const progressionPath = progressionPaths[0];
          
          if (progressionPath) {
            const projectTemplates = await storage.getProjectTemplates({});
            const projectTemplate = projectTemplates[0];
            
            if (projectTemplate) {
              const newJourney = await storage.createJourney({
                userId: application.userId,
                progressionPathId: progressionPath.id,
                projectTemplateId: projectTemplate.id,
                jobApplicationId: id,
                status: 'active',
                currentSprintNumber: 0,
                completedSprints: 0,
              });
              journeyId = newJourney.id;
            }
          }
        }
        
        if (journeyId) {
          const existingWorkspace = await storage.getWorkspaceInstanceByJourney(journeyId);
          if (!existingWorkspace) {
            await storage.createWorkspaceInstance({
              userId: application.userId,
              journeyId,
              jobApplicationId: id,
              companyName: posting?.company?.name || 'TechCorp',
              role: posting?.role || 'Developer',
              currentPhase: 'onboarding',
            });
          }
        }
      }
      
      res.json(application);
    } catch (error) {
      console.error("Failed to update application:", error);
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

  // ============================================
  // Phase 1: Catalogue, Competency & Progression APIs
  // ============================================

  // GET /api/catalogue - List catalogue items with filters
  app.get("/api/catalogue", async (req, res) => {
    try {
      const filters: {
        simulator?: string;
        type?: string;
        role?: string;
        level?: string;
        language?: string;
        day?: number;
      } = {};

      if (req.query.simulator) filters.simulator = req.query.simulator as string;
      if (req.query.type) filters.type = req.query.type as string;
      if (req.query.role) filters.role = req.query.role as string;
      if (req.query.level) filters.level = req.query.level as string;
      if (req.query.language) filters.language = req.query.language as string;
      if (req.query.day) filters.day = parseInt(req.query.day as string);

      const items = await storage.getCatalogueItems(filters);
      res.json(items);
    } catch (error) {
      console.error("Failed to get catalogue items:", error);
      res.status(500).json({ message: "Failed to get catalogue items" });
    }
  });

  // GET /api/catalogue/:externalId - Get single catalogue item by external ID
  app.get("/api/catalogue/:externalId", async (req, res) => {
    try {
      const item = await storage.getCatalogueItem(req.params.externalId);
      if (!item) {
        return res.status(404).json({ message: "Catalogue item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to get catalogue item" });
    }
  });

  // GET /api/competencies - List all competencies with optional filters
  app.get("/api/competencies", async (req, res) => {
    try {
      const filters: { role?: string; category?: string } = {};

      if (req.query.role) filters.role = req.query.role as string;
      if (req.query.category) filters.category = req.query.category as string;

      const items = await storage.getCompetencies(filters);
      res.json(items);
    } catch (error) {
      console.error("Failed to get competencies:", error);
      res.status(500).json({ message: "Failed to get competencies" });
    }
  });

  // GET /api/competencies/:slug - Get single competency by slug
  app.get("/api/competencies/:slug", async (req, res) => {
    try {
      const competency = await storage.getCompetency(req.params.slug);
      if (!competency) {
        return res.status(404).json({ message: "Competency not found" });
      }
      res.json(competency);
    } catch (error) {
      res.status(500).json({ message: "Failed to get competency" });
    }
  });

  // GET /api/role-adapters - List all role adapters
  app.get("/api/role-adapters", async (req, res) => {
    try {
      const adapters = await storage.getRoleAdapters();
      res.json(adapters);
    } catch (error) {
      console.error("Failed to get role adapters:", error);
      res.status(500).json({ message: "Failed to get role adapters" });
    }
  });

  // GET /api/role-adapters/:role - Get single role adapter
  app.get("/api/role-adapters/:role", async (req, res) => {
    try {
      const adapter = await storage.getRoleAdapter(req.params.role);
      if (!adapter) {
        return res.status(404).json({ message: "Role adapter not found" });
      }
      res.json(adapter);
    } catch (error) {
      res.status(500).json({ message: "Failed to get role adapter" });
    }
  });

  // GET /api/user/:id/readiness - Get user's readiness score
  app.get("/api/user/:id/readiness", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const readiness = await storage.getUserReadiness(userId);
      res.json(readiness);
    } catch (error) {
      console.error("Failed to get user readiness:", error);
      res.status(500).json({ message: "Failed to get user readiness" });
    }
  });

  // POST /api/user/:id/competency-delta - Record competency evidence
  app.post("/api/user/:id/competency-delta", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Validate the delta payload
      const deltaSchema = z.object({
        competencySlug: z.string(),
        source: z.enum(['workspace', 'interview']),
        catalogueItemId: z.number().optional(),
        evidenceType: z.string(),
        evidenceData: z.record(z.unknown()).optional(),
        score: z.number().min(0).max(100).optional(),
      });

      const delta = deltaSchema.parse(req.body);

      // Find the competency by slug
      const competency = await storage.getCompetency(delta.competencySlug);
      if (!competency) {
        return res.status(404).json({ message: `Competency '${delta.competencySlug}' not found` });
      }

      // Get or create competency ledger entry for this user
      let entry = await storage.getUserCompetencyEntry(userId, competency.id);
      
      if (!entry) {
        entry = await storage.createCompetencyEntry({
          userId,
          competencyId: competency.id,
          currentBand: 'explorer',
          evidenceCount: 0,
          confidence: 0,
          history: [],
        });
      }

      // Calculate new values
      const newEvidenceCount = entry.evidenceCount + 1;
      const newConfidence = Math.min(100, entry.confidence + (delta.score ? Math.round(delta.score / 10) : 5));
      
      // Determine if band should upgrade
      let newBand = entry.currentBand;
      if (newEvidenceCount >= 10 && newConfidence >= 70 && entry.currentBand === 'explorer') {
        newBand = 'contributor';
      } else if (newEvidenceCount >= 25 && newConfidence >= 85 && entry.currentBand === 'contributor') {
        newBand = 'junior_ready';
      }

      // Build history event
      const historyEvent = {
        timestamp: new Date().toISOString(),
        source: delta.source,
        evidenceType: delta.evidenceType,
        catalogueItemId: delta.catalogueItemId,
        score: delta.score,
        bandBefore: entry.currentBand,
        bandAfter: newBand,
      };

      const existingHistory = Array.isArray(entry.history) ? entry.history : [];

      // Update the entry
      const updatedEntry = await storage.updateCompetencyEntry(entry.id, {
        evidenceCount: newEvidenceCount,
        confidence: newConfidence,
        currentBand: newBand,
        lastEvidenceAt: new Date(),
        history: [...existingHistory, historyEvent],
      });

      res.json({
        competencySlug: delta.competencySlug,
        previousBand: entry.currentBand,
        currentBand: newBand,
        evidenceCount: newEvidenceCount,
        confidence: newConfidence,
        bandChanged: entry.currentBand !== newBand,
        entry: updatedEntry,
      });
    } catch (error) {
      console.error("Failed to record competency delta:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request body", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to record competency delta" });
    }
  });

  // GET /api/user/:id/portfolio - Get user's portfolio artifacts
  app.get("/api/user/:id/portfolio", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const artifacts = await storage.getUserPortfolio(userId);
      res.json(artifacts);
    } catch (error) {
      console.error("Failed to get user portfolio:", error);
      res.status(500).json({ message: "Failed to get user portfolio" });
    }
  });

  // POST /api/user/:id/portfolio - Add portfolio artifact
  app.post("/api/user/:id/portfolio", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const artifactSchema = z.object({
        source: z.enum(['workspace', 'interview', 'upload']),
        catalogueItemId: z.number().optional(),
        title: z.string(),
        artifactType: z.string(),
        summary: z.string().optional(),
        artifactData: z.record(z.unknown()),
        evidenceCompetencies: z.array(z.string()).optional(),
      });

      const artifactInput = artifactSchema.parse(req.body);

      const artifact = await storage.createPortfolioArtifact({
        userId,
        ...artifactInput,
      });

      res.status(201).json(artifact);
    } catch (error) {
      console.error("Failed to create portfolio artifact:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request body", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create portfolio artifact" });
    }
  });

  // GET /api/user/:id/competency-ledger - Get user's competency ledger entries
  app.get("/api/user/:id/competency-ledger", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const entries = await storage.getUserCompetencyLedger(userId);
      res.json(entries);
    } catch (error) {
      console.error("Failed to get user competency ledger:", error);
      res.status(500).json({ message: "Failed to get user competency ledger" });
    }
  });

  // ============================================
  // Phase 2: Adapter Configuration APIs
  // ============================================

  // GET /api/adapters/interview-config - Get interview configuration for role/level
  app.get("/api/adapters/interview-config", async (req, res) => {
    try {
      const { adapterService, normalizeRole, normalizeLevel } = await import("./services/adapter-service");
      
      const role = req.query.role as string;
      const level = req.query.level as string;

      if (!role || !level) {
        return res.status(400).json({ message: "Role and level are required" });
      }

      const config = await adapterService.getInterviewConfiguration({
        role: normalizeRole(role),
        level: normalizeLevel(level),
      });

      if (!config) {
        return res.status(404).json({ message: "Configuration not found for role/level" });
      }

      res.json(config);
    } catch (error) {
      console.error("Failed to get interview config:", error);
      res.status(500).json({ message: "Failed to get interview configuration" });
    }
  });

  // GET /api/adapters/workspace-config - Get workspace configuration for role/level/language
  app.get("/api/adapters/workspace-config", async (req, res) => {
    try {
      const { adapterService, normalizeRole, normalizeLevel } = await import("./services/adapter-service");
      
      const role = req.query.role as string;
      const level = req.query.level as string;
      const language = (req.query.language as string) || 'javascript';

      if (!role || !level) {
        return res.status(400).json({ message: "Role and level are required" });
      }

      const config = await adapterService.getWorkspaceConfiguration({
        role: normalizeRole(role),
        level: normalizeLevel(level),
        language: language as 'javascript' | 'python' | 'c_cpp',
      });

      if (!config) {
        return res.status(404).json({ message: "Configuration not found for role/level" });
      }

      res.json(config);
    } catch (error) {
      console.error("Failed to get workspace config:", error);
      res.status(500).json({ message: "Failed to get workspace configuration" });
    }
  });

  // GET /api/adapters/interview-questions - Get interview question configuration
  app.get("/api/adapters/interview-questions", async (req, res) => {
    try {
      const { adapterService, normalizeRole, normalizeLevel } = await import("./services/adapter-service");
      
      const role = req.query.role as string;
      const level = req.query.level as string;

      if (!role || !level) {
        return res.status(400).json({ message: "Role and level are required" });
      }

      const config = await adapterService.getInterviewQuestionConfig({
        role: normalizeRole(role),
        level: normalizeLevel(level),
      });

      if (!config) {
        return res.status(404).json({ message: "Configuration not found for role/level" });
      }

      res.json(config);
    } catch (error) {
      console.error("Failed to get interview question config:", error);
      res.status(500).json({ message: "Failed to get interview question configuration" });
    }
  });

  // GET /api/adapters/workspace-problems - Get workspace problem configuration
  app.get("/api/adapters/workspace-problems", async (req, res) => {
    try {
      const { adapterService, normalizeRole, normalizeLevel } = await import("./services/adapter-service");
      
      const role = req.query.role as string;
      const level = req.query.level as string;
      const language = (req.query.language as string) || 'javascript';

      if (!role || !level) {
        return res.status(400).json({ message: "Role and level are required" });
      }

      const config = await adapterService.getWorkspaceProblemConfig({
        role: normalizeRole(role),
        level: normalizeLevel(level),
        language: language as 'javascript' | 'python' | 'c_cpp',
      });

      if (!config) {
        return res.status(404).json({ message: "Configuration not found for role/level" });
      }

      res.json(config);
    } catch (error) {
      console.error("Failed to get workspace problem config:", error);
      res.status(500).json({ message: "Failed to get workspace problem configuration" });
    }
  });

  // GET /api/adapters/available-roles - Get all available roles
  app.get("/api/adapters/available-roles", async (req, res) => {
    try {
      const { adapterService } = await import("./services/adapter-service");
      const roles = await adapterService.getAvailableRoles();
      res.json(roles);
    } catch (error) {
      console.error("Failed to get available roles:", error);
      res.status(500).json({ message: "Failed to get available roles" });
    }
  });

  // GET /api/adapters/available-levels/:role - Get available levels for a role
  app.get("/api/adapters/available-levels/:role", async (req, res) => {
    try {
      const { adapterService, normalizeRole } = await import("./services/adapter-service");
      const role = normalizeRole(req.params.role);
      const levels = await adapterService.getAvailableLevels(role);
      res.json(levels);
    } catch (error) {
      console.error("Failed to get available levels:", error);
      res.status(500).json({ message: "Failed to get available levels" });
    }
  });

  // GET /api/adapters/available-languages/:role - Get available languages for a role
  app.get("/api/adapters/available-languages/:role", async (req, res) => {
    try {
      const { adapterService, normalizeRole } = await import("./services/adapter-service");
      const role = normalizeRole(req.params.role);
      const languages = await adapterService.getAvailableLanguages(role);
      res.json(languages);
    } catch (error) {
      console.error("Failed to get available languages:", error);
      res.status(500).json({ message: "Failed to get available languages" });
    }
  });

  // ============================================================================
  // PHASE 3: NARRATIVE ARCHITECTURE ROUTES
  // ============================================================================

  // GET /api/progression-paths - Get all progression paths
  app.get("/api/progression-paths", async (req, res) => {
    try {
      const role = req.query.role as string;
      const entryLevel = req.query.entryLevel as string;
      const paths = await storage.getProgressionPaths({ role, entryLevel });
      res.json(paths);
    } catch (error) {
      console.error("Failed to get progression paths:", error);
      res.status(500).json({ message: "Failed to get progression paths" });
    }
  });

  // GET /api/progression-paths/:slug - Get single progression path
  app.get("/api/progression-paths/:slug", async (req, res) => {
    try {
      const path = await storage.getProgressionPath(req.params.slug);
      if (!path) {
        return res.status(404).json({ message: "Progression path not found" });
      }
      res.json(path);
    } catch (error) {
      console.error("Failed to get progression path:", error);
      res.status(500).json({ message: "Failed to get progression path" });
    }
  });

  // GET /api/project-templates - Get all project templates
  app.get("/api/project-templates", async (req, res) => {
    try {
      const language = req.query.language as string;
      const industry = req.query.industry as string;
      const templates = await storage.getProjectTemplates({ language, industry });
      res.json(templates);
    } catch (error) {
      console.error("Failed to get project templates:", error);
      res.status(500).json({ message: "Failed to get project templates" });
    }
  });

  // GET /api/project-templates/:slug - Get single project template
  app.get("/api/project-templates/:slug", async (req, res) => {
    try {
      const template = await storage.getProjectTemplate(req.params.slug);
      if (!template) {
        return res.status(404).json({ message: "Project template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Failed to get project template:", error);
      res.status(500).json({ message: "Failed to get project template" });
    }
  });

  // GET /api/user/:userId/journey - Get user's active journey state
  app.get("/api/user/:userId/journey", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const activeJourney = await storage.getUserActiveJourney(userId);
      
      if (!activeJourney) {
        return res.json({ journey: null, state: null });
      }
      
      const state = await storage.getJourneyState(activeJourney.id);
      res.json({ journey: activeJourney, state });
    } catch (error) {
      console.error("Failed to get user journey:", error);
      res.status(500).json({ message: "Failed to get user journey" });
    }
  });

  // GET /api/user/:userId/journeys - Get all user journeys
  app.get("/api/user/:userId/journeys", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const journeys = await storage.getUserJourneys(userId);
      res.json(journeys);
    } catch (error) {
      console.error("Failed to get user journeys:", error);
      res.status(500).json({ message: "Failed to get user journeys" });
    }
  });

  // POST /api/user/:userId/journey/start - Start a new journey
  app.post("/api/user/:userId/journey/start", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { progressionPathSlug, projectTemplateSlug, jobApplicationId } = req.body;

      // Check for existing active journey
      const existingJourney = await storage.getUserActiveJourney(userId);
      if (existingJourney) {
        return res.status(400).json({ message: "User already has an active journey" });
      }

      // Get progression path and project template
      const progressionPath = await storage.getProgressionPath(progressionPathSlug);
      if (!progressionPath) {
        return res.status(404).json({ message: "Progression path not found" });
      }

      const projectTemplate = await storage.getProjectTemplate(projectTemplateSlug);
      if (!projectTemplate) {
        return res.status(404).json({ message: "Project template not found" });
      }

      // Create journey
      const journey = await storage.createJourney({
        userId,
        progressionPathId: progressionPath.id,
        projectTemplateId: projectTemplate.id,
        jobApplicationId: jobApplicationId || null,
        status: 'active',
        currentSprintNumber: 0,
        completedSprints: 0,
        readinessScore: 0,
        journeyMetadata: {}
      });

      // Create onboarding arc
      const onboardingArc = await storage.createJourneyArc({
        journeyId: journey.id,
        arcType: 'onboarding',
        arcOrder: 1,
        name: 'Onboarding',
        description: 'First week at your new job',
        status: 'active',
        difficultyBand: 'guided',
        durationDays: 5,
        competencyFocus: ['professional-communication', 'codebase-navigation', 'git-workflow'],
        isFinalArc: false,
        arcData: {}
      });

      // Update journey with current arc
      await storage.updateJourney(journey.id, { currentArcId: onboardingArc.id });

      const state = await storage.getJourneyState(journey.id);
      res.json({ journey, state });
    } catch (error) {
      console.error("Failed to start journey:", error);
      res.status(500).json({ message: "Failed to start journey" });
    }
  });

  // GET /api/journey/:journeyId - Get journey details
  app.get("/api/journey/:journeyId", async (req, res) => {
    try {
      const journeyId = parseInt(req.params.journeyId);
      const journey = await storage.getJourney(journeyId);
      
      if (!journey) {
        return res.status(404).json({ message: "Journey not found" });
      }
      
      const state = await storage.getJourneyState(journeyId);
      res.json({ journey, state });
    } catch (error) {
      console.error("Failed to get journey:", error);
      res.status(500).json({ message: "Failed to get journey" });
    }
  });

  // GET /api/journey/:journeyId/arcs - Get all arcs for a journey
  app.get("/api/journey/:journeyId/arcs", async (req, res) => {
    try {
      const journeyId = parseInt(req.params.journeyId);
      const arcs = await storage.getJourneyArcs(journeyId);
      res.json(arcs);
    } catch (error) {
      console.error("Failed to get journey arcs:", error);
      res.status(500).json({ message: "Failed to get journey arcs" });
    }
  });

  // GET /api/journey/:journeyId/current-sprint - Get current sprint details
  app.get("/api/journey/:journeyId/current-sprint", async (req, res) => {
    try {
      const journeyId = parseInt(req.params.journeyId);
      const journey = await storage.getJourney(journeyId);
      
      if (!journey) {
        return res.status(404).json({ message: "Journey not found" });
      }

      const currentArc = await storage.getCurrentArc(journeyId);
      if (!currentArc || currentArc.arcType !== 'sprint') {
        return res.json({ sprint: null, activities: [] });
      }

      const sprint = await storage.getSprintByArc(currentArc.id);
      if (!sprint) {
        return res.json({ sprint: null, activities: [] });
      }

      const activities = await storage.getSprintActivities(sprint.id);
      res.json({ sprint, activities });
    } catch (error) {
      console.error("Failed to get current sprint:", error);
      res.status(500).json({ message: "Failed to get current sprint" });
    }
  });

  // POST /api/journey/:journeyId/complete-activity - Complete an activity and record competency delta
  app.post("/api/journey/:journeyId/complete-activity", async (req, res) => {
    try {
      const { progressionEngine } = await import("./services/progression-engine");
      const journeyId = parseInt(req.params.journeyId);
      const { activityId, userResponse, evaluation } = req.body;

      const result = await progressionEngine.completeActivity(
        journeyId,
        activityId,
        userResponse,
        evaluation
      );

      res.json(result);
    } catch (error) {
      console.error("Failed to complete activity:", error);
      res.status(500).json({ message: "Failed to complete activity" });
    }
  });

  // POST /api/journey/:journeyId/complete-sprint - Complete current sprint
  app.post("/api/journey/:journeyId/complete-sprint", async (req, res) => {
    try {
      const { progressionEngine } = await import("./services/progression-engine");
      const journeyId = parseInt(req.params.journeyId);

      const result = await progressionEngine.completeSprint(journeyId);
      res.json(result);
    } catch (error) {
      console.error("Failed to complete sprint:", error);
      res.status(500).json({ message: "Failed to complete sprint" });
    }
  });

  // POST /api/journey/:journeyId/start-new-sprint - Start a new sprint with generated backlog
  app.post("/api/journey/:journeyId/start-new-sprint", async (req, res) => {
    try {
      const { progressionEngine } = await import("./services/progression-engine");
      const journeyId = parseInt(req.params.journeyId);

      const result = await progressionEngine.startNewSprint(journeyId);
      res.json({
        sprint: result.sprint,
        arc: result.arc,
        backlog: {
          tickets: result.generatedBacklog.tickets,
          softSkillEvents: result.generatedBacklog.softSkillEvents,
          theme: result.generatedBacklog.theme
        }
      });
    } catch (error) {
      console.error("Failed to start new sprint:", error);
      res.status(500).json({ message: "Failed to start new sprint" });
    }
  });

  // GET /api/journey/:journeyId/exit-eligibility - Check if user can exit/graduate
  app.get("/api/journey/:journeyId/exit-eligibility", async (req, res) => {
    try {
      const { progressionEngine } = await import("./services/progression-engine");
      const journeyId = parseInt(req.params.journeyId);

      const eligibility = await progressionEngine.checkExitEligibility(journeyId);
      res.json(eligibility);
    } catch (error) {
      console.error("Failed to check exit eligibility:", error);
      res.status(500).json({ message: "Failed to check exit eligibility" });
    }
  });

  // GET /api/journey/:journeyId/summary - Get full progression summary
  app.get("/api/journey/:journeyId/summary", async (req, res) => {
    try {
      const { progressionEngine } = await import("./services/progression-engine");
      const journeyId = parseInt(req.params.journeyId);

      const summary = await progressionEngine.getProgressionSummary(journeyId);
      res.json(summary);
    } catch (error) {
      console.error("Failed to get progression summary:", error);
      res.status(500).json({ message: "Failed to get progression summary" });
    }
  });

  // POST /api/user/:userId/competency-delta - Record a competency delta
  app.post("/api/user/:userId/competency-delta", async (req, res) => {
    try {
      const { progressionEngine } = await import("./services/progression-engine");
      const userId = parseInt(req.params.userId);
      const { journeyId, competencySlug, source, evidenceType, score, activityId } = req.body;

      const result = await progressionEngine.calculateDelta({
        userId,
        journeyId,
        competencySlug,
        source,
        evidenceType,
        score,
        activityId
      });

      res.json(result);
    } catch (error) {
      console.error("Failed to record competency delta:", error);
      res.status(500).json({ message: "Failed to record competency delta" });
    }
  });

  // POST /api/journey/:journeyId/graduate - Trigger graduation
  app.post("/api/journey/:journeyId/graduate", async (req, res) => {
    try {
      const journeyId = parseInt(req.params.journeyId);
      const { exitTrigger } = req.body; // 'user_choice', 'readiness_threshold', 'max_sprints'

      const journey = await storage.getJourney(journeyId);
      if (!journey) {
        return res.status(404).json({ message: "Journey not found" });
      }

      // Get progression path for badge
      const progressionPath = await storage.getProgressionPathById(journey.progressionPathId);

      // Take final competency snapshot
      const userReadiness = await storage.getUserReadiness(journey.userId);
      await storage.createCompetencySnapshot({
        userId: journey.userId,
        journeyId: journey.id,
        snapshotType: 'journey_end',
        readinessScore: userReadiness.overallScore,
        competencyScores: userReadiness.competencyBreakdown.reduce((acc, c) => {
          acc[c.slug] = { band: c.band, confidence: c.confidence, score: c.evidenceCount };
          return acc;
        }, {} as Record<string, { band: string; confidence: number; score: number }>),
        strengths: userReadiness.strengths,
        gaps: userReadiness.gaps
      });

      // Update journey
      const updatedJourney = await storage.updateJourney(journeyId, {
        status: 'graduated',
        exitTrigger,
        graduatedAt: new Date(),
        completedAt: new Date(),
        badgeAwarded: progressionPath?.exitBadge || null
      });

      res.json({ journey: updatedJourney, badge: progressionPath?.exitBadge });
    } catch (error) {
      console.error("Failed to graduate journey:", error);
      res.status(500).json({ message: "Failed to graduate journey" });
    }
  });

  // GET /api/journey/:journeyId/snapshots - Get competency snapshots
  app.get("/api/journey/:journeyId/snapshots", async (req, res) => {
    try {
      const journeyId = parseInt(req.params.journeyId);
      const snapshots = await storage.getCompetencySnapshots(journeyId);
      res.json(snapshots);
    } catch (error) {
      console.error("Failed to get competency snapshots:", error);
      res.status(500).json({ message: "Failed to get competency snapshots" });
    }
  });

  // GET /api/sprint/:sprintId - Get sprint details
  app.get("/api/sprint/:sprintId", async (req, res) => {
    try {
      const sprintId = parseInt(req.params.sprintId);
      const sprint = await storage.getSprint(sprintId);
      
      if (!sprint) {
        return res.status(404).json({ message: "Sprint not found" });
      }
      
      const activities = await storage.getSprintActivities(sprintId);
      res.json({ sprint, activities });
    } catch (error) {
      console.error("Failed to get sprint:", error);
      res.status(500).json({ message: "Failed to get sprint" });
    }
  });

  // GET /api/sprint/:sprintId/activities - Get sprint activities
  app.get("/api/sprint/:sprintId/activities", async (req, res) => {
    try {
      const sprintId = parseInt(req.params.sprintId);
      const dayNumber = req.query.day ? parseInt(req.query.day as string) : undefined;
      const activities = await storage.getSprintActivities(sprintId, dayNumber);
      res.json(activities);
    } catch (error) {
      console.error("Failed to get sprint activities:", error);
      res.status(500).json({ message: "Failed to get sprint activities" });
    }
  });

  // PATCH /api/activity/:activityId - Update activity
  app.patch("/api/activity/:activityId", async (req, res) => {
    try {
      const activityId = parseInt(req.params.activityId);
      const updates = req.body;
      const activity = await storage.updateSprintActivity(activityId, updates);
      
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      
      res.json(activity);
    } catch (error) {
      console.error("Failed to update activity:", error);
      res.status(500).json({ message: "Failed to update activity" });
    }
  });

  // =====================================================
  // Phase 4: Sprint Generator Routes
  // =====================================================

  // GET /api/sprint-generator/templates - Get all template IDs
  app.get("/api/sprint-generator/templates", async (req, res) => {
    try {
      const { sprintGenerator } = await import("./services/sprint-generator");
      const templates = sprintGenerator.getAllTemplateIds();
      res.json(templates);
    } catch (error) {
      console.error("Failed to get templates:", error);
      res.status(500).json({ message: "Failed to get templates" });
    }
  });

  // GET /api/sprint-generator/templates/stats - Get template statistics
  app.get("/api/sprint-generator/templates/stats", async (req, res) => {
    try {
      const { sprintGenerator } = await import("./services/sprint-generator");
      const stats = sprintGenerator.getTemplateStats();
      res.json(stats);
    } catch (error) {
      console.error("Failed to get template stats:", error);
      res.status(500).json({ message: "Failed to get template stats" });
    }
  });

  // GET /api/sprint-generator/templates/:category/:id - Get specific template details
  app.get("/api/sprint-generator/templates/:category/:id", async (req, res) => {
    try {
      const { sprintGenerator } = await import("./services/sprint-generator");
      const category = req.params.category as 'bugs' | 'features' | 'soft_skills';
      const id = req.params.id;
      
      const template = sprintGenerator.getTemplateDetails(category, id);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Failed to get template:", error);
      res.status(500).json({ message: "Failed to get template" });
    }
  });

  // GET /api/sprint-generator/themes - Get all available themes
  app.get("/api/sprint-generator/themes", async (req, res) => {
    try {
      const { sprintGenerator } = await import("./services/sprint-generator");
      const themes = sprintGenerator.getAvailableThemes();
      res.json(themes);
    } catch (error) {
      console.error("Failed to get themes:", error);
      res.status(500).json({ message: "Failed to get themes" });
    }
  });

  // GET /api/sprint-generator/themes/:id - Get specific theme
  app.get("/api/sprint-generator/themes/:id", async (req, res) => {
    try {
      const { sprintGenerator } = await import("./services/sprint-generator");
      const theme = sprintGenerator.getTheme(req.params.id);
      
      if (!theme) {
        return res.status(404).json({ message: "Theme not found" });
      }
      
      res.json(theme);
    } catch (error) {
      console.error("Failed to get theme:", error);
      res.status(500).json({ message: "Failed to get theme" });
    }
  });

  // POST /api/sprint-generator/generate - Generate a new sprint backlog
  app.post("/api/sprint-generator/generate", async (req, res) => {
    try {
      const { sprintGenerator } = await import("./services/sprint-generator");
      
      const previousSprintSchema = z.object({
        id: z.number().optional(),
        theme: z.string().optional(),
        generationMetadata: z.any().optional(),
      }).passthrough();
      
      const requestSchema = z.object({
        journeyId: z.number(),
        sprintNumber: z.number(),
        difficultyBand: z.enum(['guided', 'supported', 'independent', 'expert']),
        previousSprints: z.array(previousSprintSchema).default([]),
        userCompetencyGaps: z.array(z.string()).default([]),
        avoidThemes: z.array(z.string()).default([]),
        avoidTemplates: z.array(z.string()).default([]),
      });
      
      const validatedRequest = requestSchema.parse(req.body);
      
      const backlog = await sprintGenerator.generateSprint(validatedRequest as any);
      
      res.json(backlog);
    } catch (error) {
      console.error("Failed to generate sprint:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to generate sprint" });
    }
  });

  // GET /api/sprint-generator/templates-by-difficulty/:band - Get templates for a mastery band
  app.get("/api/sprint-generator/templates-by-difficulty/:band", async (req, res) => {
    try {
      const { sprintGenerator } = await import("./services/sprint-generator");
      const band = req.params.band as 'explorer' | 'contributor' | 'junior_ready';
      
      if (!['explorer', 'contributor', 'junior_ready'].includes(band)) {
        return res.status(400).json({ message: "Invalid mastery band" });
      }
      
      const templates = sprintGenerator.getTemplatesByDifficulty(band);
      res.json(templates);
    } catch (error) {
      console.error("Failed to get templates by difficulty:", error);
      res.status(500).json({ message: "Failed to get templates by difficulty" });
    }
  });

  // ============================================
  // Phase 5: Journey & Sprint Management APIs
  // ============================================

  // GET /api/journeys - Get all journeys for current user
  app.get("/api/journeys", async (req, res) => {
    try {
      // For MVP, use user ID 1
      const userId = 1;
      const journeys = await storage.getUserJourneys(userId);
      res.json(journeys);
    } catch (error) {
      console.error("Failed to get journeys:", error);
      res.status(500).json({ message: "Failed to get journeys" });
    }
  });

  // GET /api/journeys/:journeyId/dashboard - Get full journey dashboard
  app.get("/api/journeys/:journeyId/dashboard", async (req, res) => {
    try {
      const journeyId = parseInt(req.params.journeyId);
      const dashboard = await storage.getJourneyDashboard(journeyId);
      
      if (!dashboard) {
        return res.status(404).json({ message: "Journey not found" });
      }
      
      res.json(dashboard);
    } catch (error) {
      console.error("Failed to get journey dashboard:", error);
      res.status(500).json({ message: "Failed to get journey dashboard" });
    }
  });

  // GET /api/journeys/:journeyId/sprints - Get all sprints for a journey
  app.get("/api/journeys/:journeyId/sprints", async (req, res) => {
    try {
      const journeyId = parseInt(req.params.journeyId);
      const sprints = await storage.getSprintsByJourney(journeyId);
      res.json(sprints);
    } catch (error) {
      console.error("Failed to get sprints:", error);
      res.status(500).json({ message: "Failed to get sprints" });
    }
  });

  // GET /api/sprints/:sprintId - Get sprint with overview
  app.get("/api/sprints/:sprintId", async (req, res) => {
    try {
      const sprintId = parseInt(req.params.sprintId);
      const overview = await storage.getSprintOverview(sprintId);
      
      if (!overview) {
        return res.status(404).json({ message: "Sprint not found" });
      }
      
      res.json(overview);
    } catch (error) {
      console.error("Failed to get sprint:", error);
      res.status(500).json({ message: "Failed to get sprint" });
    }
  });

  // PATCH /api/sprints/:sprintId - Update sprint state
  app.patch("/api/sprints/:sprintId", async (req, res) => {
    try {
      const sprintId = parseInt(req.params.sprintId);
      const updates = req.body;
      
      const sprint = await storage.updateSprint(sprintId, updates);
      
      if (!sprint) {
        return res.status(404).json({ message: "Sprint not found" });
      }
      
      res.json(sprint);
    } catch (error) {
      console.error("Failed to update sprint:", error);
      res.status(500).json({ message: "Failed to update sprint" });
    }
  });

  // ============================================
  // Sprint Ticket APIs
  // ============================================

  // GET /api/sprints/:sprintId/tickets - Get all tickets for a sprint
  app.get("/api/sprints/:sprintId/tickets", async (req, res) => {
    try {
      const sprintId = parseInt(req.params.sprintId);
      const tickets = await storage.getSprintTickets(sprintId);
      res.json(tickets);
    } catch (error) {
      console.error("Failed to get tickets:", error);
      res.status(500).json({ message: "Failed to get tickets" });
    }
  });

  // GET /api/tickets/:ticketId - Get single ticket
  app.get("/api/tickets/:ticketId", async (req, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      const ticket = await storage.getSprintTicket(ticketId);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      res.json(ticket);
    } catch (error) {
      console.error("Failed to get ticket:", error);
      res.status(500).json({ message: "Failed to get ticket" });
    }
  });

  // POST /api/sprints/:sprintId/tickets - Create ticket
  app.post("/api/sprints/:sprintId/tickets", async (req, res) => {
    try {
      const sprintId = parseInt(req.params.sprintId);
      const ticketData = { ...req.body, sprintId };
      
      const ticket = await storage.createSprintTicket(ticketData);
      res.status(201).json(ticket);
    } catch (error) {
      console.error("Failed to create ticket:", error);
      res.status(500).json({ message: "Failed to create ticket" });
    }
  });

  // PATCH /api/tickets/:ticketId - Update ticket status/details
  app.patch("/api/tickets/:ticketId", async (req, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      const updates = req.body;
      
      const ticket = await storage.updateSprintTicket(ticketId, updates);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      res.json(ticket);
    } catch (error) {
      console.error("Failed to update ticket:", error);
      res.status(500).json({ message: "Failed to update ticket" });
    }
  });

  // PATCH /api/tickets/:ticketId/move - Move ticket between kanban columns
  app.patch("/api/tickets/:ticketId/move", async (req, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      const { newStatus } = req.body;
      
      const validStatuses = ['todo', 'in_progress', 'in_review', 'done'];
      if (!validStatuses.includes(newStatus)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const ticket = await storage.getSprintTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Validate git gates based on status transition
      const gitState = ticket.gitState as { branchCreated?: boolean; hasPR?: boolean; merged?: boolean } || {};
      
      if (newStatus === 'in_progress' && ticket.status === 'todo') {
        // Must have created branch to move to in_progress
        if (!gitState.branchCreated) {
          return res.status(400).json({ 
            message: "Create a branch first before starting work",
            gate: "branch_required"
          });
        }
      }
      
      if (newStatus === 'in_review' && ticket.status === 'in_progress') {
        // Must have PR to move to in_review
        if (!gitState.hasPR) {
          return res.status(400).json({ 
            message: "Submit a pull request before moving to review",
            gate: "pr_required"
          });
        }
      }
      
      if (newStatus === 'done' && ticket.status === 'in_review') {
        // Must be merged to move to done
        if (!gitState.merged) {
          return res.status(400).json({ 
            message: "PR must be merged before marking as done",
            gate: "merge_required"
          });
        }
      }
      
      const updatedTicket = await storage.updateSprintTicket(ticketId, { status: newStatus });
      res.json(updatedTicket);
    } catch (error) {
      console.error("Failed to move ticket:", error);
      res.status(500).json({ message: "Failed to move ticket" });
    }
  });

  // ============================================
  // Ceremony Instance APIs
  // ============================================

  // GET /api/sprints/:sprintId/ceremonies - Get all ceremonies for a sprint
  app.get("/api/sprints/:sprintId/ceremonies", async (req, res) => {
    try {
      const sprintId = parseInt(req.params.sprintId);
      const ceremonies = await storage.getCeremonyInstances(sprintId);
      res.json(ceremonies);
    } catch (error) {
      console.error("Failed to get ceremonies:", error);
      res.status(500).json({ message: "Failed to get ceremonies" });
    }
  });

  // GET /api/ceremonies/:ceremonyId - Get ceremony with messages
  app.get("/api/ceremonies/:ceremonyId", async (req, res) => {
    try {
      const ceremonyId = parseInt(req.params.ceremonyId);
      const ceremony = await storage.getCeremonyInstance(ceremonyId);
      
      if (!ceremony) {
        return res.status(404).json({ message: "Ceremony not found" });
      }
      
      res.json(ceremony);
    } catch (error) {
      console.error("Failed to get ceremony:", error);
      res.status(500).json({ message: "Failed to get ceremony" });
    }
  });

  // POST /api/sprints/:sprintId/ceremonies - Create ceremony instance
  app.post("/api/sprints/:sprintId/ceremonies", async (req, res) => {
    try {
      const sprintId = parseInt(req.params.sprintId);
      const ceremonyData = { ...req.body, sprintId };
      
      const ceremony = await storage.createCeremonyInstance(ceremonyData);
      res.status(201).json(ceremony);
    } catch (error) {
      console.error("Failed to create ceremony:", error);
      res.status(500).json({ message: "Failed to create ceremony" });
    }
  });

  // PATCH /api/ceremonies/:ceremonyId - Update ceremony state
  app.patch("/api/ceremonies/:ceremonyId", async (req, res) => {
    try {
      const ceremonyId = parseInt(req.params.ceremonyId);
      const updates = req.body;
      
      const ceremony = await storage.updateCeremonyInstance(ceremonyId, updates);
      
      if (!ceremony) {
        return res.status(404).json({ message: "Ceremony not found" });
      }
      
      res.json(ceremony);
    } catch (error) {
      console.error("Failed to update ceremony:", error);
      res.status(500).json({ message: "Failed to update ceremony" });
    }
  });

  // POST /api/ceremonies/:ceremonyId/messages - Add message to ceremony
  app.post("/api/ceremonies/:ceremonyId/messages", async (req, res) => {
    try {
      const ceremonyId = parseInt(req.params.ceremonyId);
      const { message, type = 'team' } = req.body;
      
      const ceremony = await storage.getCeremonyInstance(ceremonyId);
      if (!ceremony) {
        return res.status(404).json({ message: "Ceremony not found" });
      }
      
      const messages = type === 'team' 
        ? [...(ceremony.teamMessages as any[] || []), message]
        : [...(ceremony.userResponses as any[] || []), message];
      
      const updated = await storage.updateCeremonyInstance(ceremonyId, {
        [type === 'team' ? 'teamMessages' : 'userResponses']: messages
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Failed to add message:", error);
      res.status(500).json({ message: "Failed to add message" });
    }
  });

  // ============================================
  // Git Session APIs
  // ============================================

  // GET /api/tickets/:ticketId/git - Get git session for ticket
  app.get("/api/tickets/:ticketId/git", async (req, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      const session = await storage.getGitSession(ticketId);
      
      if (!session) {
        return res.status(404).json({ message: "Git session not found" });
      }
      
      const events = await storage.getGitEvents(session.id);
      res.json({ session, events });
    } catch (error) {
      console.error("Failed to get git session:", error);
      res.status(500).json({ message: "Failed to get git session" });
    }
  });

  // POST /api/tickets/:ticketId/git - Create git session
  app.post("/api/tickets/:ticketId/git", async (req, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      
      // Check if session already exists
      const existing = await storage.getGitSession(ticketId);
      if (existing) {
        return res.status(400).json({ message: "Git session already exists for this ticket" });
      }
      
      const session = await storage.createGitSession({
        ticketId,
        ...req.body
      });
      
      res.status(201).json(session);
    } catch (error) {
      console.error("Failed to create git session:", error);
      res.status(500).json({ message: "Failed to create git session" });
    }
  });

  // POST /api/git/:sessionId/command - Execute git command
  app.post("/api/git/:sessionId/command", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const { command, args } = req.body;
      
      const session = await storage.getGitSessionById(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Git session not found" });
      }
      
      // Record the git event
      const event = await storage.createGitEvent({
        sessionId,
        commandType: command,
        rawCommand: `git ${command} ${(args || []).join(' ')}`,
        stateChange: { args },
        isValid: true
      });
      
      // Update session state based on command
      let updates: any = {};
      let ticketUpdates: any = {};
      
      switch (command) {
        case 'clone':
          updates.isCloned = true;
          break;
        case 'checkout':
        case 'branch':
          if (args && args.length > 0) {
            updates.currentBranch = args[args.length - 1];
            // Update ticket gitState
            const ticket = await storage.getSprintTicket(session.ticketId);
            if (ticket) {
              ticketUpdates.gitState = { 
                ...(ticket.gitState as any || {}), 
                branchCreated: true,
                branchName: args[args.length - 1]
              };
            }
          }
          break;
        case 'add':
          const currentStaged = session.stagedFiles as string[] || [];
          updates.stagedFiles = Array.from(new Set([...currentStaged, ...(args || [])]));
          break;
        case 'commit':
          const commits = session.commits as any[] || [];
          updates.commits = [...commits, { 
            message: args?.find((a: string) => a.startsWith('-m'))?.replace('-m ', '') || args?.[0],
            timestamp: new Date().toISOString()
          }];
          updates.stagedFiles = [];
          updates.remoteSyncStatus = 'ahead';
          break;
        case 'push':
          updates.remoteSyncStatus = 'synced';
          break;
        case 'pull':
          updates.remoteSyncStatus = 'synced';
          break;
      }
      
      if (Object.keys(updates).length > 0) {
        await storage.updateGitSession(sessionId, updates);
      }
      
      if (Object.keys(ticketUpdates).length > 0) {
        await storage.updateSprintTicket(session.ticketId, ticketUpdates);
      }
      
      res.json({ 
        event, 
        session: await storage.getGitSessionById(sessionId)
      });
    } catch (error) {
      console.error("Failed to execute git command:", error);
      res.status(500).json({ message: "Failed to execute git command" });
    }
  });

  // POST /api/tickets/:ticketId/pr - Create pull request
  app.post("/api/tickets/:ticketId/pr", async (req, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      const { title, description } = req.body;
      
      const ticket = await storage.getSprintTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      const gitState = ticket.gitState as any || {};
      if (!gitState.branchCreated) {
        return res.status(400).json({ message: "Must create branch before PR" });
      }
      
      // Update ticket with PR info
      const updated = await storage.updateSprintTicket(ticketId, {
        gitState: {
          ...gitState,
          hasPR: true,
          prTitle: title,
          prDescription: description,
          prCreatedAt: new Date().toISOString()
        }
      });
      
      // Record git event
      const session = await storage.getGitSession(ticketId);
      if (session) {
        await storage.createGitEvent({
          sessionId: session.id,
          commandType: 'pr_create',
          rawCommand: `Create PR: ${title}`,
          stateChange: { title, description },
          isValid: true
        });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Failed to create PR:", error);
      res.status(500).json({ message: "Failed to create PR" });
    }
  });

  // POST /api/tickets/:ticketId/merge - Merge pull request
  app.post("/api/tickets/:ticketId/merge", async (req, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      
      const ticket = await storage.getSprintTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      const gitState = ticket.gitState as any || {};
      if (!gitState.hasPR) {
        return res.status(400).json({ message: "No PR exists to merge" });
      }
      
      // Update ticket with merge info
      const updated = await storage.updateSprintTicket(ticketId, {
        gitState: {
          ...gitState,
          merged: true,
          mergedAt: new Date().toISOString()
        }
      });
      
      // Record git event
      const session = await storage.getGitSession(ticketId);
      if (session) {
        await storage.createGitEvent({
          sessionId: session.id,
          commandType: 'merge',
          rawCommand: `Merge PR: ${gitState.prTitle}`,
          stateChange: { branchName: gitState.branchName },
          isValid: true
        });
        
        // Update session branch to main after merge
        await storage.updateGitSession(session.id, {
          currentBranch: 'main',
          remoteSyncStatus: 'synced'
        });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Failed to merge PR:", error);
      res.status(500).json({ message: "Failed to merge PR" });
    }
  });

  // ============================================
  // Phase 5: Workspace Instance APIs
  // ============================================

  // GET /api/workspaces - Get all workspaces for current user
  app.get("/api/workspaces", async (req, res) => {
    try {
      const userId = 1;
      const workspaces = await storage.getUserWorkspaceInstances(userId);
      res.json(workspaces);
    } catch (error) {
      console.error("Failed to get workspaces:", error);
      res.status(500).json({ message: "Failed to get workspaces" });
    }
  });

  // GET /api/workspaces/:workspaceId - Get single workspace
  app.get("/api/workspaces/:workspaceId", async (req, res) => {
    try {
      const workspaceId = parseInt(req.params.workspaceId);
      const workspace = await storage.getWorkspaceInstance(workspaceId);
      
      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }
      
      res.json(workspace);
    } catch (error) {
      console.error("Failed to get workspace:", error);
      res.status(500).json({ message: "Failed to get workspace" });
    }
  });

  // GET /api/workspaces/:workspaceId/state - Get workspace state with phase info
  app.get("/api/workspaces/:workspaceId/state", async (req, res) => {
    try {
      const workspaceId = parseInt(req.params.workspaceId);
      const state = await storage.getWorkspaceState(workspaceId);
      
      if (!state) {
        return res.status(404).json({ message: "Workspace not found" });
      }
      
      res.json(state);
    } catch (error) {
      console.error("Failed to get workspace state:", error);
      res.status(500).json({ message: "Failed to get workspace state" });
    }
  });

  // GET /api/journeys/:journeyId/workspace - Get workspace for a journey
  app.get("/api/journeys/:journeyId/workspace", async (req, res) => {
    try {
      const journeyId = parseInt(req.params.journeyId);
      const workspace = await storage.getWorkspaceInstanceByJourney(journeyId);
      
      if (!workspace) {
        return res.status(404).json({ message: "No workspace found for this journey" });
      }
      
      res.json(workspace);
    } catch (error) {
      console.error("Failed to get journey workspace:", error);
      res.status(500).json({ message: "Failed to get journey workspace" });
    }
  });

  // POST /api/workspaces - Create workspace instance (on offer acceptance)
  app.post("/api/workspaces", async (req, res) => {
    try {
      const { journeyId, jobApplicationId, companyName, role, projectTemplateId } = req.body;
      
      if (!journeyId) {
        return res.status(400).json({ message: "journeyId is required" });
      }
      
      const existingWorkspace = await storage.getWorkspaceInstanceByJourney(journeyId);
      if (existingWorkspace) {
        return res.status(400).json({ message: "Workspace already exists for this journey" });
      }
      
      const journey = await storage.getJourney(journeyId);
      if (!journey) {
        return res.status(404).json({ message: "Journey not found" });
      }
      
      let workspaceCompanyName = companyName;
      let workspaceRole = role;
      
      if (jobApplicationId) {
        const application = await storage.getJobApplication(jobApplicationId);
        if (application) {
          const posting = await storage.getJobPostingWithCompany(application.jobPostingId);
          if (posting) {
            workspaceCompanyName = workspaceCompanyName || posting.company?.name || 'TechCorp';
            workspaceRole = workspaceRole || posting.role || 'Developer';
          }
        }
      }
      
      if (!workspaceCompanyName || !workspaceRole) {
        return res.status(400).json({ message: "companyName and role are required if no job application" });
      }
      
      const workspace = await storage.createWorkspaceInstance({
        userId: journey.userId,
        journeyId,
        jobApplicationId: jobApplicationId || null,
        projectTemplateId: projectTemplateId || null,
        companyName: workspaceCompanyName,
        role: workspaceRole,
        currentPhase: 'onboarding',
      });
      
      res.status(201).json(workspace);
    } catch (error) {
      console.error("Failed to create workspace:", error);
      res.status(500).json({ message: "Failed to create workspace" });
    }
  });

  // PATCH /api/workspaces/:workspaceId - Update workspace
  app.patch("/api/workspaces/:workspaceId", async (req, res) => {
    try {
      const workspaceId = parseInt(req.params.workspaceId);
      const updates = req.body;
      
      const workspace = await storage.updateWorkspaceInstance(workspaceId, updates);
      
      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }
      
      res.json(workspace);
    } catch (error) {
      console.error("Failed to update workspace:", error);
      res.status(500).json({ message: "Failed to update workspace" });
    }
  });

  // POST /api/workspaces/:workspaceId/advance - Advance to next phase
  app.post("/api/workspaces/:workspaceId/advance", async (req, res) => {
    try {
      const workspaceId = parseInt(req.params.workspaceId);
      const payload = req.body.payload || {};
      
      const workspace = await storage.advanceWorkspacePhase(workspaceId, payload);
      
      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found or cannot advance" });
      }
      
      const state = await storage.getWorkspaceState(workspaceId);
      res.json(state);
    } catch (error) {
      console.error("Failed to advance workspace phase:", error);
      res.status(500).json({ message: "Failed to advance workspace phase" });
    }
  });

  // GET /api/workspaces/:workspaceId/events - Get phase events history
  app.get("/api/workspaces/:workspaceId/events", async (req, res) => {
    try {
      const workspaceId = parseInt(req.params.workspaceId);
      const events = await storage.getWorkspacePhaseEvents(workspaceId);
      res.json(events);
    } catch (error) {
      console.error("Failed to get phase events:", error);
      res.status(500).json({ message: "Failed to get phase events" });
    }
  });

  // POST /api/workspaces/:workspaceId/start-sprint - Start a new sprint
  app.post("/api/workspaces/:workspaceId/start-sprint", async (req, res) => {
    try {
      const workspaceId = parseInt(req.params.workspaceId);
      const { sprintId } = req.body;
      
      const workspace = await storage.getWorkspaceInstance(workspaceId);
      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }
      
      if (workspace.currentPhase !== 'planning') {
        return res.status(400).json({ message: "Must be in planning phase to start sprint" });
      }
      
      const updated = await storage.updateWorkspaceInstance(workspaceId, {
        currentSprintId: sprintId,
      });
      
      const advanced = await storage.advanceWorkspacePhase(workspaceId, { sprintId });
      
      res.json(advanced);
    } catch (error) {
      console.error("Failed to start sprint:", error);
      res.status(500).json({ message: "Failed to start sprint" });
    }
  });

  // POST /api/workspaces/:workspaceId/onboarding-chat - Chat with team members during onboarding
  app.post("/api/workspaces/:workspaceId/onboarding-chat", async (req, res) => {
    try {
      const workspaceId = parseInt(req.params.workspaceId);
      const { teamMemberName, userMessage, conversationHistory } = req.body;
      
      if (!teamMemberName || !userMessage) {
        return res.status(400).json({ message: "teamMemberName and userMessage are required" });
      }

      const workspace = await storage.getWorkspaceInstance(workspaceId);
      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }

      // Team member personas for onboarding chat (personal/getting-to-know-you context)
      const teamPersonas: Record<string, { role: string; personality: string; background: string }> = {
        'Marcus': {
          role: 'Senior Developer',
          personality: 'Detail-oriented, patient, and helpful',
          background: `Been with ${workspace.companyName} for about 2 years. Previously worked at a large enterprise company doing backend work. Enjoys distributed systems and database optimization. Outside work, tinkers with side projects, plays chess online, and cooks - makes a mean biryani.`
        },
        'Priya': {
          role: 'Product Manager',
          personality: 'Energetic, clear communicator, approachable',
          background: `PM at ${workspace.companyName} for about 18 months. Previously a product manager at an e-commerce company. Bridges business needs and technical implementation. Huge boardgame enthusiast - hosts monthly game nights.`
        },
        'Alex': {
          role: 'QA Engineer',
          personality: 'Thorough, helpful, and friendly',
          background: `QA engineer for about 18 months. Was a developer before but found they enjoyed testing more. Philosophy is that quality is everyone's responsibility. Into rock climbing and escape rooms in free time.`
        }
      };

      const persona = teamPersonas[teamMemberName];
      if (!persona) {
        return res.status(400).json({ message: "Unknown team member" });
      }

      // Use Groq to generate response
      const Groq = require('groq-sdk');
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

      // Build full conversation text for analysis (conversationHistory already includes current message)
      const fullConversation = conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0
        ? conversationHistory.map((m: any) => `${m.sender}: ${m.message}`).join('\n')
        : `You: ${userMessage}`;

      // Step 1: Analyze what topics have been covered using LLM
      let topicsCovered = {
        userProfessional: false,  // User shared their work/career background
        userPersonal: false,      // User shared hobbies/interests
        teammateProfessional: false, // Teammate shared work info
        teammatePersonal: false   // Teammate shared hobbies/interests
      };

      try {
        const analysisResponse = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `Analyze this conversation between a new intern ("You") and ${teamMemberName} (a ${persona.role}).

Determine which topics have been ACTUALLY SHARED (not just asked about, but answered/revealed):

PROFESSIONAL EXAMPLES (mark true if ANY of these are shared):
- Education: "I'm in a bootcamp", "I studied CS", "I'm a student at..."
- Work history: "I used to be a data scientist", "I worked at...", "I have X years experience"
- Career goals: "I want to become a developer", "I'm interested in backend"
- Current role: "I'm a senior dev", "I've been here 2 years", "I work on the payments team"

PERSONAL EXAMPLES (mark true if ANY of these are shared):
- Sports: "I play tennis", "I run", "I go to the gym"
- Games: "I play chess", "I'm into video games", "I play online"
- Creative: "I cook", "I make music", "I paint"
- Entertainment: "I watch movies", "I read", "I hike"
- Family: "I used to play chess with my dad", "I have a dog"

Return JSON with these fields:
- userProfessional: true if intern shared education, work history, career info, or skills
- userPersonal: true if intern shared hobbies, sports, games, or personal interests
- teammateProfessional: true if ${teamMemberName} shared their role, experience, or work background
- teammatePersonal: true if ${teamMemberName} shared hobbies, interests, or personal activities

IMPORTANT: 
- Greetings like "Hi", "How are you", "Nice to meet you" do NOT count as sharing
- Questions don't count - only answers/statements about oneself
- Be accurate, not conservative - if they clearly shared something, mark it true

Respond ONLY with valid JSON, no other text.`
            },
            { role: "user", content: fullConversation }
          ],
          temperature: 0.1,
          max_tokens: 100
        });

        const analysisText = analysisResponse.choices[0]?.message?.content || '{}';
        try {
          const parsed = JSON.parse(analysisText.replace(/```json\n?|\n?```/g, '').trim());
          topicsCovered = {
            userProfessional: !!parsed.userProfessional,
            userPersonal: !!parsed.userPersonal,
            teammateProfessional: !!parsed.teammateProfessional,
            teammatePersonal: !!parsed.teammatePersonal
          };
        } catch (e) {
          console.log('Could not parse topic analysis, using defaults');
        }
      } catch (e) {
        console.log('Topic analysis failed, continuing with defaults');
      }

      // Determine conversation state
      const userComplete = topicsCovered.userProfessional && topicsCovered.userPersonal;
      const teammateComplete = topicsCovered.teammateProfessional && topicsCovered.teammatePersonal;
      const allTopicsCovered = userComplete && teammateComplete;
      
      // Check if we've offered to answer questions (look for question offer in history)
      const hasOfferedQuestions = conversationHistory && Array.isArray(conversationHistory) &&
        conversationHistory.some((m: any) => 
          m.sender !== 'You' && 
          (m.message.toLowerCase().includes('question') && 
           (m.message.toLowerCase().includes('company') || m.message.toLowerCase().includes('role') || m.message.toLowerCase().includes('team')))
        );
      
      const isReadyToClose = allTopicsCovered && hasOfferedQuestions;
      
      // Determine what's missing to guide the conversation
      const missingTopics: string[] = [];
      if (!topicsCovered.userProfessional) missingTopics.push("the intern's professional background");
      if (!topicsCovered.userPersonal) missingTopics.push("the intern's hobbies or interests");
      if (!topicsCovered.teammateProfessional) missingTopics.push("your work experience");
      if (!topicsCovered.teammatePersonal) missingTopics.push("your personal interests");
      
      // Determine conversation turn for scripted flow
      const turnCount = conversationHistory ? conversationHistory.length : 0;
      const isFirstResponse = turnCount <= 1; // First user message
      
      // Get the last user message for context-aware acknowledgment
      const lastUserMessage = userMessage.toLowerCase();
      
      const systemPrompt = `You are ${teamMemberName}, a ${persona.role} at ${workspace.companyName}. 
Personality: ${persona.personality}
Your background: ${persona.background}

This is a quick getting-to-know-you chat with a new intern on their first day.

CRITICAL RESPONSE RULES:
- Keep responses SHORT: 1-2 sentences MAX
- Be warm but concise - you're busy but friendly
- DO NOT write paragraphs or long explanations
- DO NOT discuss work tasks beyond brief intro
- ALWAYS acknowledge what they just said before transitioning to a new topic
- Vary your language - don't use the same phrases repeatedly

ACKNOWLEDGMENT EXAMPLES (use these patterns, vary the wording):
- "That's cool!" / "Nice!" / "Oh interesting!" / "That's awesome!"
- "Bootcamp, nice - those can be intense!" / "Data science background, that's solid!"
- "Chess with your dad, love that!" / "Tennis, nice - great way to stay active!"

${isReadyToClose ? 
`CONVERSATION IS COMPLETE - You've covered backgrounds, hobbies, and offered to answer questions!
END THE CONVERSATION NOW - Reference something specific from the chat, then say you need to run:
- If they mentioned a hobby: "Good luck with the [hobby] and the new role! I've got to run to standup, but ping me anytime."
- If they had questions: "Hope that helps! Anyway, I've got a meeting - but seriously, reach out anytime."
- General: "Really enjoyed chatting! Got to jump into a call, but my door's always open. Welcome to the team!"
Make the goodbye feel personal, not generic. Do NOT ask any more questions.` 
:
isFirstResponse ?
`THIS IS YOUR FIRST REPLY - Introduce yourself properly:
1. Greet them warmly (vary your greeting - "Hey!", "Hi there!", "Welcome!")
2. Share YOUR role briefly (e.g., "I'm a ${persona.role} here, been with the company about X years")
3. Ask about THEIR background/studies/what brought them here (professional question first!)
Example: "Hey, welcome aboard! I'm one of the senior devs here - been around about 2 years now. What's your background - are you studying CS or coming from somewhere else?"`
:
allTopicsCovered && !hasOfferedQuestions ?
`You've learned about each other! Now offer to answer questions:
First, briefly acknowledge their last message, then ask if they have questions.
Example: "That's great! By the way, do you have any questions about the team or how things work around here?"
Keep it brief - acknowledge + question offer.`
:
`GUIDE THE CONVERSATION - Topics still needed: ${missingTopics.join(', ')}

IMPORTANT: Always start by acknowledging what they just shared before moving on!

CONVERSATION FLOW (follow this order):
1. First, share YOUR professional background if you haven't
2. Then, learn about THEIR professional background
3. Share YOUR hobbies/interests AND ask about theirs in the same message
4. Finally, offer to answer questions about the company/role

${!topicsCovered.teammateProfessional ? 
  "You haven't shared your work background yet - briefly mention your role/experience." :
  !topicsCovered.userProfessional ? 
    "Acknowledge their greeting, then ask about their background, studies, or what got them into this field." :
  !topicsCovered.teammatePersonal ?
    "Acknowledge what they shared about their background (be specific!), then share your hobby AND ask about theirs." :
  !topicsCovered.userPersonal ? 
    "Acknowledge their response, then ASK what they do for fun outside of work/studies!" :
    "Acknowledge their response naturally."}

DO NOT say goodbye until you've offered to answer questions about the company/role!`}`;

      const messages: any[] = [
        { role: "system", content: systemPrompt }
      ];

      // Add conversation history
      if (conversationHistory && Array.isArray(conversationHistory)) {
        for (const msg of conversationHistory) {
          messages.push({
            role: msg.sender === 'You' ? 'user' : 'assistant',
            content: msg.message
          });
        }
      }

      // Add current message
      messages.push({ role: 'user', content: userMessage });

      try {
        const response = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages,
          temperature: 0.8,
          max_tokens: 150
        });

        const aiResponse = response.choices[0]?.message?.content || "Thanks for reaching out! Let me know if you have any questions.";
        
        // Determine completion state for frontend
        const completionState = isReadyToClose ? 'closed' : 
          (userComplete || teammateComplete) ? 'almostReady' : 'collecting';
        
        res.json({ 
          response: aiResponse, 
          sender: teamMemberName,
          isClosing: isReadyToClose,
          completionState,
          topicsCovered,
          missingTopics
        });
      } catch (groqError) {
        console.error('Groq API error:', groqError);
        // Fallback responses
        const fallbacks = [
          `Hey! Great to meet you. I've been here for a while now and really enjoy the team culture. What brings you to ${workspace.companyName}?`,
          `Welcome aboard! It's always exciting to have new people join. How are you finding your first day so far?`,
          `Nice to connect! Feel free to ask me anything - about the team, the company, or just life in general here.`
        ];
        res.json({ 
          response: fallbacks[Math.floor(Math.random() * fallbacks.length)], 
          sender: teamMemberName,
          completionState: 'collecting'
        });
      }
    } catch (error) {
      console.error("Failed to process onboarding chat:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
