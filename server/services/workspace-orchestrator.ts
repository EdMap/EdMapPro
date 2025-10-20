import Groq from "groq-sdk";

const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY
});

export interface TeamMember {
  name: string;
  role: string;
  personality: string;
  expertise: string[];
  availability: string; // 'always', 'usually', 'sometimes'
}

export interface WorkspaceContext {
  projectName: string;
  projectDescription: string;
  currentSprint: string;
  teamMembers: TeamMember[];
  userRole: string;
  phase: string; // 'onboarding', 'sprint', 'retro'
}

export interface ChannelMessage {
  sender: string;
  senderRole: string;
  content: string;
  timestamp: Date;
}

export interface WorkspaceAction {
  type: string; // 'send-message', 'update-task', 'create-artifact', 'request-review'
  channel: string;
  data: any;
}

export class WorkspaceOrchestrator {
  private conversationMemory: Map<string, ChannelMessage[]> = new Map();
  private maxMemoryPerChannel = 15;

  /**
   * Generate AI team member response in a specific channel
   */
  async generateTeamMemberResponse(
    teamMember: TeamMember,
    context: WorkspaceContext,
    userMessage: string,
    channel: string,
    conversationHistory: ChannelMessage[] = []
  ): Promise<{ content: string; metadata?: any }> {
    const prompt = this.buildTeamMemberPrompt(teamMember, context, userMessage, channel, conversationHistory);

    try {
      if (!process.env.GROQ_API_KEY) {
        throw new Error('Invalid API key');
      }

      const response = await groq.chat.completions.create({
        model: "llama-3.1-70b-versatile",
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt(teamMember, channel)
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
      });

      const content = response.choices[0].message.content || '';
      return { content, metadata: { sentiment: 'neutral' } };
    } catch (error) {
      console.log('Using fallback team member response due to API error');
      return this.getFallbackResponse(teamMember, userMessage, channel);
    }
  }

  /**
   * Generate daily standup updates from all team members
   */
  async generateStandupUpdates(
    context: WorkspaceContext,
    completedTasks: any[]
  ): Promise<{ member: string; update: string }[]> {
    const updates: { member: string; update: string }[] = [];

    for (const member of context.teamMembers) {
      const memberTasks = completedTasks.filter(t => t.assignedRole === member.role);
      const update = await this.generateStandupUpdate(member, context, memberTasks);
      updates.push({ member: member.name, update });
    }

    return updates;
  }

  private async generateStandupUpdate(
    member: TeamMember,
    context: WorkspaceContext,
    tasks: any[]
  ): Promise<string> {
    const taskSummary = tasks.length > 0 
      ? tasks.map(t => t.title).join(', ') 
      : 'setting up environment';

    const standupTemplates = {
      Developer: [
        `Yesterday: Worked on ${taskSummary}. Today: Will continue with implementation and write tests. No blockers.`,
        `Progress: Completed ${tasks.length} task(s). Planning to tackle the API integration next. Need clarification on the auth flow.`,
        `Update: Made good progress on ${taskSummary}. Today focusing on code review and bug fixes. All good here!`
      ],
      'Product Manager': [
        `Yesterday: Refined requirements for ${taskSummary}. Today: Will prioritize the backlog and schedule stakeholder sync. No blockers.`,
        `Update: User stories are ready for ${context.currentSprint}. Today planning the next sprint. Need team input on timeline.`,
        `Progress: Gathered user feedback. Today: Will update roadmap and communicate with stakeholders. Looking good!`
      ],
      Designer: [
        `Yesterday: Created designs for ${taskSummary}. Today: Will gather feedback and iterate. Waiting on product requirements.`,
        `Update: Wireframes complete. Today: Working on high-fidelity mockups. Need dev input on technical constraints.`,
        `Progress: Design system updates done. Today: Will conduct user testing and refine flows. All set!`
      ],
      QA: [
        `Yesterday: Tested ${taskSummary}. Today: Will create automated tests and verify bug fixes. Found 2 issues.`,
        `Update: Regression testing complete. Today: Focusing on edge cases. Need clarity on expected behavior for feature X.`,
        `Progress: ${tasks.length} test cases written. Today: Will execute tests and document results. No blockers!`
      ],
      DevOps: [
        `Yesterday: Configured deployment pipeline. Today: Will monitor performance and optimize infrastructure. Deployment ready.`,
        `Update: Infrastructure updates deployed. Today: Will review security configurations. Monitoring shows all green.`,
        `Progress: CI/CD pipeline improved. Today: Will work on database optimization. Everything running smoothly!`
      ]
    };

    const templates = standupTemplates[member.role as keyof typeof standupTemplates] || standupTemplates.Developer;
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Generate code review feedback
   */
  async generateCodeReviewFeedback(
    reviewer: TeamMember,
    codeContent: string,
    userRole: string
  ): Promise<{ content: string; approved: boolean; suggestions: string[] }> {
    const prompt = `You are ${reviewer.name}, a ${reviewer.role} reviewing code submitted by a ${userRole}.

Code to review:
${codeContent.substring(0, 500)}...

Provide constructive code review feedback in a realistic, professional manner. Include:
1. What looks good
2. Potential improvements
3. Whether you'd approve or request changes

Format as JSON:
{
  "content": "your review comment",
  "approved": boolean,
  "suggestions": ["suggestion1", "suggestion2"]
}`;

    try {
      if (!process.env.GROQ_API_KEY) {
        throw new Error('Invalid API key');
      }

      const response = await groq.chat.completions.create({
        model: "llama-3.1-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are ${reviewer.name}, a ${reviewer.personality} ${reviewer.role}. Provide helpful, professional code reviews.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        content: result.content || "Looks good overall! A few minor suggestions.",
        approved: result.approved !== false,
        suggestions: result.suggestions || []
      };
    } catch (error) {
      return this.getFallbackCodeReview(reviewer);
    }
  }

  /**
   * Evaluate user action and provide micro-feedback
   */
  async evaluateAction(
    action: WorkspaceAction,
    context: WorkspaceContext
  ): Promise<{ score: number; feedback: string; impact: string }> {
    const actionQuality = this.assessActionQuality(action, context);
    
    return {
      score: actionQuality.score,
      feedback: actionQuality.feedback,
      impact: actionQuality.impact
    };
  }

  /**
   * Generate artifacts (code, designs, documentation)
   */
  async generateArtifact(
    type: string,
    description: string,
    role: string
  ): Promise<{ content: any; metadata: any }> {
    const artifactTemplates: Record<string, any> = {
      'code-snippet': {
        language: 'typescript',
        code: `// ${description}\nfunction example() {\n  // Implementation here\n  return true;\n}`,
        comments: 'Basic implementation structure'
      },
      'design-mockup': {
        type: 'wireframe',
        description: description,
        components: ['Header', 'Main Content', 'Footer'],
        notes: 'Initial design concept'
      },
      'test-case': {
        title: description,
        steps: ['Setup test data', 'Execute action', 'Verify result'],
        expectedResult: 'Functionality works as expected'
      },
      'documentation': {
        title: description,
        sections: ['Overview', 'Usage', 'Examples'],
        content: 'Documentation content here'
      }
    };

    const template = artifactTemplates[type] || artifactTemplates['documentation'];
    
    return {
      content: template,
      metadata: {
        createdBy: role,
        status: 'draft',
        version: 1
      }
    };
  }

  /**
   * Orchestrate multi-agent conversation
   */
  async orchestrateConversation(
    userMessage: string,
    channel: string,
    context: WorkspaceContext,
    sessionId: number
  ): Promise<ChannelMessage[]> {
    const responses: ChannelMessage[] = [];
    
    // Store user message in memory
    this.addToMemory(sessionId, channel, {
      sender: 'User',
      senderRole: context.userRole,
      content: userMessage,
      timestamp: new Date()
    });

    // Determine which team members should respond
    const respondingMembers = this.selectRespondingMembers(userMessage, channel, context);

    for (const member of respondingMembers) {
      const history = this.getMemory(sessionId, channel);
      const response = await this.generateTeamMemberResponse(member, context, userMessage, channel, history);
      
      const message: ChannelMessage = {
        sender: member.name,
        senderRole: member.role,
        content: response.content,
        timestamp: new Date()
      };

      this.addToMemory(sessionId, channel, message);
      responses.push(message);

      // Add slight delay between responses for realism
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return responses;
  }

  // Helper methods

  private buildTeamMemberPrompt(
    member: TeamMember,
    context: WorkspaceContext,
    userMessage: string,
    channel: string,
    history: ChannelMessage[]
  ): string {
    const recentHistory = history.slice(-5).map(m => `${m.sender}: ${m.content}`).join('\n');
    
    return `You are ${member.name}, a ${member.personality} ${member.role} working on ${context.projectName}.

Project: ${context.projectDescription}
Current Phase: ${context.phase}
Channel: ${channel}
Your expertise: ${member.expertise.join(', ')}

Recent conversation:
${recentHistory || 'No previous messages'}

User (${context.userRole}): ${userMessage}

Respond naturally and helpfully as ${member.name}. Keep it conversational and realistic. ${channel === 'standup' ? 'Keep it brief and focused.' : channel === 'email' ? 'Be professional and structured.' : 'Be casual and collaborative.'}`;
  }

  private getSystemPrompt(member: TeamMember, channel: string): string {
    const channelGuidance = {
      chat: 'casual, quick, collaborative',
      email: 'professional, structured, detailed',
      standup: 'brief, focused, status-oriented',
      'code-review': 'technical, constructive, specific'
    };

    return `You are ${member.name}, a ${member.personality} ${member.role}. Communicate in a ${channelGuidance[channel as keyof typeof channelGuidance] || 'professional'} manner. Be helpful, realistic, and stay in character.`;
  }

  private getFallbackResponse(member: TeamMember, userMessage: string, channel: string): { content: string; metadata: any } {
    const responses: Record<string, string[]> = {
      chat: [
        "Good question! Let me think about that and get back to you shortly.",
        "Thanks for bringing this up. I'll take a look and share my thoughts.",
        "Interesting point. Let's discuss this with the team.",
        "I appreciate you asking. Let me check on that for you."
      ],
      email: [
        "Thank you for your email. I'll review this and respond with details soon.",
        "I've received your message and will get back to you with a comprehensive response.",
        "Thanks for reaching out. I'm looking into this and will update you shortly."
      ],
      standup: [
        "Making progress on assigned tasks. Will update on completion.",
        "Working through the current sprint goals. No blockers at the moment.",
        "On track with planned work. Will coordinate with team as needed."
      ]
    };

    const channelResponses = responses[channel] || responses.chat;
    const content = channelResponses[Math.floor(Math.random() * channelResponses.length)];

    return { content, metadata: { sentiment: 'neutral' } };
  }

  private getFallbackCodeReview(reviewer: TeamMember): { content: string; approved: boolean; suggestions: string[] } {
    return {
      content: "Thanks for the submission! The overall structure looks good. I have a few suggestions to make it even better.",
      approved: true,
      suggestions: [
        "Consider adding error handling for edge cases",
        "Could benefit from additional unit tests",
        "Nice work on code organization and clarity"
      ]
    };
  }

  private selectRespondingMembers(userMessage: string, channel: string, context: WorkspaceContext): TeamMember[] {
    // Simple selection logic - can be enhanced with more sophisticated rules
    if (channel === 'standup') {
      return context.teamMembers; // Everyone responds in standup
    }

    if (channel === 'code-review' && context.userRole === 'Developer') {
      return context.teamMembers.filter(m => m.role === 'Developer' || m.role === 'QA').slice(0, 1);
    }

    // For chat, 1-2 relevant team members respond
    const relevantMembers = this.findRelevantMembers(userMessage, context.teamMembers);
    return relevantMembers.slice(0, Math.random() > 0.5 ? 1 : 2);
  }

  private findRelevantMembers(message: string, teamMembers: TeamMember[]): TeamMember[] {
    const lowerMessage = message.toLowerCase();
    
    // Match based on keywords
    const relevant = teamMembers.filter(member => {
      const keywords = member.expertise.join(' ').toLowerCase();
      return keywords.split(' ').some(keyword => lowerMessage.includes(keyword)) ||
             lowerMessage.includes(member.role.toLowerCase());
    });

    return relevant.length > 0 ? relevant : [teamMembers[0]];
  }

  private assessActionQuality(action: WorkspaceAction, context: WorkspaceContext): { score: number; feedback: string; impact: string } {
    let score = 70; // Base score
    let feedback = '';
    let impact = 'neutral';

    switch (action.type) {
      case 'send-message':
        const messageLength = action.data.content?.length || 0;
        if (messageLength < 10) {
          score = 50;
          feedback = 'Message is quite brief. Providing more context helps team collaboration.';
          impact = 'low';
        } else if (messageLength > 50) {
          score = 85;
          feedback = 'Clear and detailed communication. Good collaboration!';
          impact = 'positive';
        } else {
          score = 70;
          feedback = 'Good communication.';
          impact = 'neutral';
        }
        break;

      case 'update-task':
        score = 80;
        feedback = 'Good job keeping the task board updated!';
        impact = 'positive';
        break;

      case 'create-artifact':
        score = 85;
        feedback = 'Creating documentation is valuable for the team!';
        impact = 'positive';
        break;

      case 'request-review':
        score = 90;
        feedback = 'Excellent! Requesting reviews promotes code quality.';
        impact = 'positive';
        break;

      default:
        score = 70;
        feedback = 'Action completed.';
        impact = 'neutral';
    }

    return { score, feedback, impact };
  }

  private addToMemory(sessionId: number, channel: string, message: ChannelMessage): void {
    const key = `${sessionId}-${channel}`;
    const memory = this.conversationMemory.get(key) || [];
    memory.push(message);

    // Keep only recent messages
    if (memory.length > this.maxMemoryPerChannel) {
      memory.shift();
    }

    this.conversationMemory.set(key, memory);
  }

  private getMemory(sessionId: number, channel: string): ChannelMessage[] {
    const key = `${sessionId}-${channel}`;
    return this.conversationMemory.get(key) || [];
  }

  clearMemory(sessionId: number, channel?: string): void {
    if (channel) {
      const key = `${sessionId}-${channel}`;
      this.conversationMemory.delete(key);
    } else {
      // Clear all memory for this session
      Array.from(this.conversationMemory.keys())
        .filter(key => key.startsWith(`${sessionId}-`))
        .forEach(key => this.conversationMemory.delete(key));
    }
  }
}

export const workspaceOrchestrator = new WorkspaceOrchestrator();
