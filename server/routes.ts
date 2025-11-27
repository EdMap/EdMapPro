import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { groqService } from "./services/groq";
import { openaiService } from "./services/openai";
import { workspaceOrchestrator } from "./services/workspace-orchestrator";
import { insertSimulationSessionSchema } from "@shared/schema";
import { z } from "zod";

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
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
      const { userId, interviewType, targetRole, difficulty, totalQuestions } = req.body;
      
      if (!userId || !interviewType || !targetRole) {
        return res.status(400).json({ message: "userId, interviewType, and targetRole are required" });
      }

      const { interviewOrchestrator } = await import("./services/interview-orchestrator");
      const result = await interviewOrchestrator.startInterview(
        userId,
        interviewType,
        targetRole,
        difficulty || "medium",
        totalQuestions || 5
      );
      
      res.json(result);
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

  const httpServer = createServer(app);
  return httpServer;
}
