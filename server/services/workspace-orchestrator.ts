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
        model: "llama-3.3-70b-versatile",
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
      console.error('Groq API Error:', error instanceof Error ? error.message : error);
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
      
      // Simulate realistic typing speed: 190-200 characters per minute
      // 190 CPM = 315.8 ms/char, 200 CPM = 300 ms/char
      const charsPerMinute = 190 + Math.random() * 10; // Random between 190-200
      const msPerChar = 60000 / charsPerMinute; // Convert to milliseconds per character
      const typingDelay = response.content.length * msPerChar;
      
      // Add small thinking delay (1-2 seconds) before typing starts
      const thinkingDelay = 1000 + Math.random() * 1000;
      
      // Cap maximum delay at 8-12 seconds for better UX
      const maxDelay = 8000 + Math.random() * 4000; // 8-12 seconds max
      const calculatedDelay = thinkingDelay + typingDelay;
      const totalDelay = Math.min(calculatedDelay, maxDelay);
      
      console.log(`[Typing] ${member.name} typing ${response.content.length} chars at ${Math.round(charsPerMinute)} CPM = ${Math.round(totalDelay)}ms total (calculated: ${Math.round(calculatedDelay)}ms, capped: ${totalDelay < calculatedDelay})`);
      
      await new Promise(resolve => setTimeout(resolve, totalDelay));
      
      const message: ChannelMessage = {
        sender: member.name,
        senderRole: member.role,
        content: response.content,
        timestamp: new Date()
      };

      this.addToMemory(sessionId, channel, message);
      responses.push(message);

      // Add brief pause between multiple responses (500ms-1s)
      if (respondingMembers.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
      }
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
    // Generate contextual response based on message content and member role
    const message = userMessage.toLowerCase();
    
    // Greeting responses
    if (message.match(/^(hi|hello|hey|greetings)/)) {
      const greetings = [
        `Hey! Great to have you on the team. I'm ${member.name}, the ${member.role}. ${this.getRoleIntro(member.role)}`,
        `Hi there! Welcome aboard. Looking forward to working together on this project!`,
        `Hello! I'm ${member.name}. ${this.getRoleIntro(member.role)} Let me know how I can help!`,
        `Hey there! ${member.name} here. Excited to be working with you on this! ${this.getRoleIntro(member.role)}`,
        `Hi! Good to see you in the chat. I'm ${member.name} - I'll be your ${member.role} on this project. Feel free to reach out anytime!`,
        `Welcome! ${member.name} checking in. ${this.getRoleIntro(member.role)} Looking forward to collaborating!`
      ];
      return { content: greetings[Math.floor(Math.random() * greetings.length)], metadata: { sentiment: 'positive' } };
    }

    // Extract key topic from user message
    const topic = this.extractTopic(userMessage);

    // Task/priority questions - reference the actual topic
    if (message.includes('task') || message.includes('priority') || message.includes('start') || message.includes('begin')) {
      const advice = this.getTaskAdvice(member.role);
      return { 
        content: topic ? `Regarding ${topic}, ${advice.charAt(0).toLowerCase() + advice.slice(1)}` : advice,
        metadata: { sentiment: 'helpful' } 
      };
    }

    // Technical questions - be specific about what they're asking
    if (message.includes('how') || message.includes('implement') || message.includes('approach') || message.includes('should we')) {
      const technicalAdvice = this.getTechnicalAdvice(member.role, userMessage);
      if (topic && !technicalAdvice.includes(topic)) {
        return {
          content: `Good question about ${topic}. ${technicalAdvice}`,
          metadata: { sentiment: 'helpful' }
        };
      }
      return { 
        content: technicalAdvice, 
        metadata: { sentiment: 'helpful' } 
      };
    }

    // Review/feedback requests - acknowledge what they want reviewed
    if (message.includes('review') || message.includes('feedback') || message.includes('thoughts') || message.includes('opinion')) {
      const reviewResponse = this.getReviewResponse(member.role);
      return { 
        content: topic ? `I can definitely review ${topic}. ${reviewResponse}` : reviewResponse,
        metadata: { sentiment: 'collaborative' } 
      };
    }

    // Status questions - be specific
    if (message.includes('status') || message.includes('progress') || message.includes('update') || message.includes('how is')) {
      const statusUpdate = this.getStatusUpdate(member.role);
      return { 
        content: topic ? `For ${topic}, ${statusUpdate.charAt(0).toLowerCase() + statusUpdate.slice(1)}` : statusUpdate,
        metadata: { sentiment: 'informative' } 
      };
    }

    // Generic but contextual fallback - reference what they said
    const genericResponse = this.getGenericResponse(member.role, userMessage);
    if (topic) {
      return {
        content: `Re: ${topic} - ${genericResponse} I can share some thoughts from my ${member.role} perspective if that would help.`,
        metadata: { sentiment: 'neutral' }
      };
    }
    
    return { 
      content: `${genericResponse} Feel free to ping me if you need anything specific about ${member.expertise.slice(0, 2).join(' or ')}.`, 
      metadata: { sentiment: 'neutral' } 
    };
  }

  private extractTopic(userMessage: string): string {
    const message = userMessage.toLowerCase();
    
    // Extract specific technical topics
    const topics = [
      'authentication', 'auth', 'login', 'signup', 'user management',
      'database', 'api', 'backend', 'frontend', 'ui', 'ux', 'design',
      'testing', 'deployment', 'ci/cd', 'infrastructure', 'security',
      'performance', 'caching', 'validation', 'error handling',
      'documentation', 'code review', 'refactoring', 'architecture'
    ];
    
    for (const topic of topics) {
      if (message.includes(topic)) {
        return topic;
      }
    }
    
    // Extract quoted phrases or key nouns
    const quotedMatch = userMessage.match(/"([^"]+)"/);
    if (quotedMatch) {
      return quotedMatch[1];
    }
    
    // Extract question subjects
    const questionPatterns = [
      /(?:about|regarding|concerning) (\w+(?:\s+\w+)?)/i,
      /(\w+(?:\s+\w+)?)\?/,
      /(?:the|our|my) (\w+(?:\s+\w+)?)/i
    ];
    
    for (const pattern of questionPatterns) {
      const match = userMessage.match(pattern);
      if (match && match[1] && match[1].length > 3) {
        return match[1];
      }
    }
    
    return '';
  }

  private getRoleIntro(role: string): string {
    const intros: Record<string, string> = {
      'Developer': "I'll be handling most of the implementation work.",
      'Product Manager': "I'm coordinating the project roadmap and priorities.",
      'Designer': "I'm working on the UX/UI design for this project.",
      'QA Engineer': "I'll be ensuring quality through testing and validation.",
      'DevOps Engineer': "I'm managing the deployment and infrastructure."
    };
    return intros[role] || "Excited to collaborate on this project.";
  }

  private getTaskAdvice(role: string): string {
    const advice: Record<string, string[]> = {
      'Developer': [
        "I'd suggest starting with the authentication flow - it's foundational for everything else. After that, we can tackle the main features. Want me to create some initial tickets?",
        "Let's start with setting up the project structure and database models. Once that's solid, we can build out the API endpoints. I can pair with you on this if helpful!",
        "I'd recommend beginning with the core data models and API layer. Get that working first, then we can add the UI on top. Sound good?"
      ],
      'Product Manager': [
        "Let's prioritize the MVP features first. I'd recommend focusing on user authentication, core CRUD operations, and basic UI. We can iterate from there based on feedback.",
        "I've drafted a priority list: 1) User accounts 2) Main workflow 3) Data management. Let's tackle these in order and get user feedback early.",
        "From a product perspective, we should focus on the highest-value features first. I'm thinking user login and the core task flow. What do you think?"
      ],
      'Designer': [
        "From a design perspective, I'd start with the user flow mapping and wireframes. Once we align on that, I can create high-fidelity mockups for the key screens.",
        "I'd recommend starting with user research and sketching out the main flows. Then we can move to wireframes and visual design. Want to sync on this tomorrow?",
        "Let's begin with low-fidelity wireframes to validate the UX flow, then I'll create the high-fidelity designs and components. Does that work for you?"
      ],
      'QA Engineer': [
        "I recommend setting up the testing framework early - it pays off later. We should also define acceptance criteria for each feature as we plan them.",
        "Let's get test automation in place from the start. I'll set up the framework and we can write tests alongside development. Much easier than retrofitting!",
        "I'd start by defining test scenarios for the critical paths, then build out the automation framework. Happy to walk through my testing approach if that helps."
      ],
      'DevOps Engineer': [
        "Let's get the CI/CD pipeline set up first so we can deploy frequently. I'll also configure staging and production environments.",
        "I'd prioritize getting the deployment pipeline working early. That way we can push to staging regularly and catch issues fast. I'll handle the infrastructure setup.",
        "Start with containerizing the app and setting up automated deployments. I'll configure monitoring too so we can track performance from day one."
      ]
    };
    const responses = advice[role] || ["Let me check the backlog and get back to you with specific recommendations based on our sprint goals."];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private getTechnicalAdvice(role: string, question: string): string {
    const message = question.toLowerCase();
    
    if (message.includes('auth') || message.includes('login')) {
      if (role === 'Developer') {
        return "For authentication, I'd recommend using JWT tokens with refresh token rotation. We can implement OAuth2 for third-party logins. Want me to draft an architecture diagram?";
      } else if (role === 'Product Manager') {
        return "From a product standpoint, we should support email/password login and social auth (Google, GitHub). Two-factor authentication can be a phase 2 feature.";
      }
    }

    if (message.includes('api') || message.includes('backend')) {
      if (role === 'Developer') {
        return "I'd suggest a RESTful API with proper error handling and validation. We should also add rate limiting and caching for performance. Happy to pair on this!";
      } else if (role === 'DevOps Engineer') {
        return "For the API, let's containerize it with Docker and use auto-scaling. I'll set up monitoring and logging so we can catch issues early.";
      }
    }

    if (message.includes('design') || message.includes('ui')) {
      if (role === 'Designer') {
        return "Let's follow a mobile-first approach. I'm thinking clean, minimal UI with good use of white space. I can create a design system to keep everything consistent.";
      } else if (role === 'Developer') {
        return "From an implementation perspective, we should use a component library like Material UI or Tailwind for faster development. What's your preference?";
      }
    }

    return "That's a great question. Based on my experience, I'd approach it systematically - break it into smaller parts, validate assumptions early, and keep the team in the loop. Want to hop on a quick call to discuss details?";
  }

  private getReviewResponse(role: string): string {
    const responses: Record<string, string> = {
      'Developer': "I'd be happy to review! Send over the PR or code snippet and I'll take a look. Generally I focus on code quality, performance, and whether it follows our team conventions.",
      'Product Manager': "Sure, I can provide feedback from a product perspective. I'll check if it aligns with user needs and our roadmap. Share what you've got!",
      'Designer': "I'd love to give feedback! From a UX standpoint, I'll look at usability, accessibility, and visual consistency with our design system.",
      'QA Engineer': "Absolutely! I'll review it from a testing perspective - checking edge cases, error handling, and making sure it's testable. When can I see it?",
      'DevOps Engineer': "Happy to review! I'll check for security issues, scalability considerations, and deployment implications. Fire away!"
    };
    return responses[role] || "I'd be glad to provide feedback. Share what you need reviewed and I'll get back to you with thoughtful comments.";
  }

  private getStatusUpdate(role: string): string {
    const updates: Record<string, string> = {
      'Developer': "Making good progress on the core features. Authentication module is about 80% complete, working on the API integration next. Should have something demo-able by end of week.",
      'Product Manager': "Sprint is on track! We've completed 60% of planned stories. There's some scope creep we need to discuss, but overall timeline looks good. Stakeholders are happy with progress.",
      'Designer': "Design phase is going well. Completed wireframes for all main flows, now working on high-fidelity screens. Will have designs ready for dev handoff in 2-3 days.",
      'QA Engineer': "Testing is progressing smoothly. Found and reported 5 bugs so far, 3 are already fixed. Setting up automated tests for the new features. Coverage is at 75%.",
      'DevOps Engineer': "Infrastructure is stable. Deployment pipeline is working great - we're doing 3-4 deployments per day with zero downtime. Monitoring shows all systems green."
    };
    return updates[role] || "Everything is moving forward nicely. I'll have a detailed update ready for the next standup. No major blockers on my end.";
  }

  private getGenericResponse(role: string, message: string): string {
    const responses = [
      "Good point! Let me think through this and provide a thoughtful response.",
      "That's worth exploring. Based on my experience with similar projects, we have a few good options here.",
      "Interesting question. I'll do some research and get back to you with concrete recommendations.",
      "Thanks for bringing this up. Let's make sure we're aligned with the team on this approach."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
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
    // Handle DM channels - only the specific member responds
    if (channel.startsWith('dm-')) {
      const memberName = channel.replace('dm-', '').trim();
      
      // Case-insensitive and trimmed comparison for robust member matching
      const member = context.teamMembers.find(m => 
        m.name.trim().toLowerCase() === memberName.toLowerCase()
      );
      
      if (!member) {
        console.error(`[DM] Could not find member "${memberName}" for channel "${channel}"`);
        return [];
      }
      
      return [member];
    }
    
    // Identify "standby" members - those with same role as user (senior helping junior)
    // They're active during onboarding but step back afterwards
    const isOnboarding = context.phase === 'onboarding';
    const activeMembers = context.teamMembers.filter(m => m.role !== context.userRole || isOnboarding);
    
    // Simple selection logic - can be enhanced with more sophisticated rules
    if (channel === 'standup') {
      // In standup, everyone responds except standby members (unless onboarding)
      return activeMembers;
    }

    if (channel === 'code-review' && context.userRole === 'Developer') {
      return activeMembers.filter(m => m.role === 'Developer' || m.role === 'QA').slice(0, 1);
    }

    // Check for direct mentions (@name or name in text)
    const mentionedMembers = this.extractMentionedMembers(userMessage, context.teamMembers);
    
    if (mentionedMembers.length > 0) {
      // Filter by availability - 'always' responds 100%, 'usually' 80%, 'sometimes' 40%
      // Important: Standby members CAN respond to @mentions even after onboarding
      const responding = mentionedMembers.filter(member => {
        if (member.availability === 'always') return true;
        if (member.availability === 'usually') return Math.random() > 0.2;
        if (member.availability === 'sometimes') return Math.random() > 0.6;
        return true;
      });
      
      // If mentioned person is not available, someone else picks it up 50% of the time
      if (responding.length === 0 && Math.random() > 0.5) {
        const others = activeMembers.filter(m => !mentionedMembers.includes(m));
        return others.slice(0, 1);
      }
      
      return responding;
    }
    
    // For chat, select relevant team members (excluding standby after onboarding)
    const relevantMembers = this.findRelevantMembers(userMessage, activeMembers);
    
    // Shuffle to get variety
    const shuffled = [...relevantMembers].sort(() => Math.random() - 0.5);
    
    // Return 1-2 members (reduced from 1-3 for more realistic conversations)
    const count = Math.floor(Math.random() * 2) + 1; // 1 to 2 members
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  /**
   * Extract team members mentioned in the message (via @mention or name in text)
   * Case-insensitive to handle both "@Claire" and "@claire"
   */
  private extractMentionedMembers(message: string, teamMembers: TeamMember[]): TeamMember[] {
    const mentioned: TeamMember[] = [];
    const lowerMessage = message.toLowerCase();
    
    for (const member of teamMembers) {
      const firstName = member.name.split(' ')[0].toLowerCase();
      const fullName = member.name.toLowerCase();
      
      // Check for @mentions (e.g., @Claire, @Ravi, @claire)
      // Case-insensitive comparison
      if (lowerMessage.includes(`@${firstName}`) || lowerMessage.includes(`@${fullName}`)) {
        mentioned.push(member);
        continue;
      }
      
      // Check for name mentions in text (e.g., "hey Claire", "ask Ravi", "Louise can you")
      const namePatterns = [
        `hey ${firstName}`,
        `hi ${firstName}`,
        `ask ${firstName}`,
        `${firstName} can`,
        `${firstName} could`,
        `${firstName},`,
        ` ${firstName} `,
        `${firstName}?`
      ];
      
      if (namePatterns.some(pattern => lowerMessage.includes(pattern))) {
        mentioned.push(member);
      }
    }
    
    return mentioned;
  }

  private findRelevantMembers(message: string, teamMembers: TeamMember[]): TeamMember[] {
    const lowerMessage = message.toLowerCase();
    
    // Match based on keywords
    const relevant = teamMembers.filter(member => {
      const keywords = member.expertise.join(' ').toLowerCase();
      return keywords.split(' ').some(keyword => lowerMessage.includes(keyword)) ||
             lowerMessage.includes(member.role.toLowerCase());
    });

    // If no match, return random 1-2 members instead of always the first one
    if (relevant.length === 0) {
      const shuffled = [...teamMembers].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, Math.floor(Math.random() * 2) + 1); // 1-2 random members
    }

    return relevant;
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
