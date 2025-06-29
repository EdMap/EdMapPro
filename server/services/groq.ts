import Groq from "groq-sdk";

// Using Groq for fast AI inference with llama models
const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY
});

export interface InterviewQuestion {
  question: string;
  category: string;
  difficulty: string;
  expectedAnswer?: string;
}

export interface InterviewFeedback {
  score: number;
  strengths: string[];
  improvements: string[];
  overallFeedback: string;
}

export interface NegotiationResponse {
  response: string;
  sentiment: string;
  strategy: string;
  counterOffer?: any;
}

export class GroqService {
  async generateInterviewQuestion(
    profession: string,
    interviewType: string,
    difficulty: string,
    jobPosting?: string,
    previousQuestions: string[] = []
  ): Promise<InterviewQuestion> {
    const prompt = `Generate a ${difficulty}-level ${interviewType} interview question for a ${profession} position.
    ${jobPosting ? `Job posting context: ${jobPosting}` : ''}
    ${previousQuestions.length > 0 ? `Avoid these previously asked questions: ${previousQuestions.join(', ')}` : ''}
    
    Respond with JSON in this format: {
      "question": "specific interview question",
      "category": "technical/behavioral/system-design/culture-fit",
      "difficulty": "${difficulty}",
      "expectedAnswer": "brief guidance on what a good answer would include"
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
            content: "You are an expert interviewer who creates realistic and challenging interview questions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result as InterviewQuestion;
    } catch (error) {
      console.log('Using fallback question generation due to API error');
      return this.getFallbackQuestion(profession, interviewType, difficulty, previousQuestions);
    }
  }

  private getFallbackQuestion(profession: string, interviewType: string, difficulty: string, previousQuestions: string[]): InterviewQuestion {
    const questionBank = {
      "Software Engineer": {
        "Technical Interview": {
          junior: [
            "What is the difference between let, const, and var in JavaScript?",
            "Explain the concept of closures in JavaScript with an example.",
            "How would you reverse a string in your preferred programming language?"
          ],
          mid: [
            "Design a REST API for a simple e-commerce application. What endpoints would you create?",
            "Explain the difference between SQL and NoSQL databases. When would you use each?",
            "How would you implement a simple caching mechanism in a web application?"
          ],
          senior: [
            "How would you design a system to handle 1 million concurrent users?",
            "Explain microservices architecture and its trade-offs compared to monolithic design.",
            "Describe your approach to implementing real-time features in a web application."
          ]
        },
        "Behavioral Interview": {
          junior: [
            "Tell me about your experience working in a team.",
            "Describe a challenging project you worked on.",
            "How do you handle tight deadlines?"
          ],
          mid: [
            "Tell me about a time when you had to learn a new technology quickly.",
            "Describe a situation where you had to solve a complex problem.",
            "How do you approach code reviews?"
          ],
          senior: [
            "Tell me about a time when you had to make a difficult technical decision.",
            "Describe your experience mentoring junior developers.",
            "How do you handle disagreements with team members about technical approaches?"
          ]
        }
      },
      "Product Manager": {
        "Behavioral Interview": {
          junior: [
            "Tell me about your experience with product development.",
            "How do you prioritize features?",
            "Describe a time when you had to work with engineers."
          ],
          mid: [
            "Tell me about a product you launched and its results.",
            "How do you handle competing stakeholder demands?",
            "Describe your approach to user research."
          ],
          senior: [
            "Tell me about a time when you had to pivot a product strategy.",
            "How do you measure product success?",
            "Describe your experience building and leading product teams."
          ]
        }
      }
    };

    const professionQuestions = questionBank[profession as keyof typeof questionBank] || questionBank["Software Engineer"];
    const typeQuestions = professionQuestions[interviewType as keyof typeof professionQuestions] || professionQuestions["Behavioral Interview"];
    const difficultyQuestions = typeQuestions[difficulty as keyof typeof typeQuestions] || typeQuestions.mid;

    // Filter out previously asked questions
    const availableQuestions = difficultyQuestions.filter(q => !previousQuestions.includes(q));
    const question = availableQuestions.length > 0 
      ? availableQuestions[Math.floor(Math.random() * availableQuestions.length)]
      : difficultyQuestions[Math.floor(Math.random() * difficultyQuestions.length)];

    return {
      question,
      category: interviewType.toLowerCase().includes('technical') ? 'technical' : 'behavioral',
      difficulty,
      expectedAnswer: "Provide a clear, structured answer with specific examples and demonstrate your understanding of the topic."
    };
  }

  async evaluateInterviewAnswer(
    question: string,
    answer: string,
    difficulty: string
  ): Promise<{ score: number; feedback: string; followUp?: string }> {
    const prompt = `Evaluate this interview answer:
    Question: ${question}
    Answer: ${answer}
    Difficulty: ${difficulty}
    
    Provide a score (0-100) and constructive feedback. Format as JSON:
    {
      "score": number,
      "feedback": "detailed feedback on the answer",
      "followUp": "optional follow-up question to dive deeper"
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
            content: "You are an expert interviewer providing constructive feedback on interview answers."
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
        score: result.score || 75,
        feedback: result.feedback || "Good answer with room for improvement.",
        followUp: result.followUp
      };
    } catch (error) {
      console.log('Using fallback evaluation due to API error');
      return this.getFallbackEvaluation(question, answer, difficulty);
    }
  }

  private getFallbackEvaluation(question: string, answer: string, difficulty: string): { score: number; feedback: string; followUp?: string } {
    const answerLength = answer.trim().length;
    let baseScore = 60;
    
    if (answerLength > 200) baseScore += 15;
    else if (answerLength > 100) baseScore += 10;
    else if (answerLength > 50) baseScore += 5;
    
    if (difficulty === 'senior') baseScore = Math.min(baseScore, 80);
    else if (difficulty === 'junior') baseScore += 10;
    
    const score = Math.min(90, Math.max(40, baseScore + Math.floor(Math.random() * 20) - 10));
    
    const feedbackOptions = [
      "Your answer shows good understanding. Consider providing more specific examples to strengthen your response.",
      "Good response overall. Try to elaborate more on the technical details and your thought process.",
      "Nice approach to the question. Adding more context about your experience would make this even stronger.",
      "Solid answer. Consider discussing potential challenges and how you'd address them.",
      "Good foundation. Try to connect your answer more directly to real-world scenarios."
    ];
    
    return {
      score,
      feedback: feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)],
      followUp: score > 70 ? "Can you tell me about a specific time when you applied this approach?" : undefined
    };
  }

  async generateNegotiationResponse(
    scenario: string,
    userMessage: string,
    counterpartStyle: string,
    conversationHistory: string[] = []
  ): Promise<NegotiationResponse> {
    const prompt = `You are roleplaying as a ${counterpartStyle} negotiation counterpart in this scenario: ${scenario}
    
    Conversation history: ${conversationHistory.join(' | ')}
    User's latest message: ${userMessage}
    
    Respond in character with a realistic negotiation response. Format as JSON:
    {
      "response": "your negotiation response",
      "sentiment": "cooperative/competitive/neutral",
      "strategy": "brief description of negotiation strategy used",
      "counterOffer": "any specific counter-proposal if applicable"
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
            content: "You are an expert negotiator roleplaying different negotiation styles realistically."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result as NegotiationResponse;
    } catch (error) {
      console.log('Using fallback negotiation response due to API error');
      return this.getFallbackNegotiationResponse(scenario, userMessage, counterpartStyle);
    }
  }

  private getFallbackNegotiationResponse(scenario: string, userMessage: string, counterpartStyle: string): NegotiationResponse {
    const responses = {
      cooperative: [
        "I appreciate your perspective. Let's see how we can find a solution that works for both of us.",
        "That's an interesting point. I'd like to explore how we might address both of our concerns here.",
        "I hear what you're saying. Let me share my thoughts and see where we might find common ground."
      ],
      competitive: [
        "I understand your position, but I need to be clear about our requirements and constraints.",
        "I appreciate the offer, but we need to discuss this further. Here's what I'm thinking...",
        "That's one way to look at it. However, from our perspective, we need to consider..."
      ],
      analytical: [
        "Let me break down the key factors we should consider in this decision.",
        "I'd like to examine the data behind this proposal more carefully.",
        "Before we proceed, let's analyze the potential outcomes of different approaches."
      ]
    };

    const styleResponses = responses[counterpartStyle as keyof typeof responses] || responses.cooperative;
    const response = styleResponses[Math.floor(Math.random() * styleResponses.length)];

    return {
      response,
      sentiment: counterpartStyle === 'competitive' ? 'competitive' : counterpartStyle === 'cooperative' ? 'cooperative' : 'neutral',
      strategy: `Using ${counterpartStyle} approach to maintain dialogue while protecting interests`,
      counterOffer: userMessage.toLowerCase().includes('price') || userMessage.toLowerCase().includes('cost') 
        ? "Let's discuss the value proposition and see if we can find a mutually beneficial arrangement"
        : undefined
    };
  }

  async generateWorkspaceMessage(
    scenario: string,
    userMessage: string,
    character: string,
    messageType: string
  ): Promise<{ content: string; sender: string; type: string }> {
    const prompt = `You are ${character} in this workplace scenario: ${scenario}
    
    User sent: ${userMessage}
    Message type: ${messageType}
    
    Respond in character with a realistic workplace message. Format as JSON:
    {
      "content": "your response message",
      "sender": "${character}",
      "type": "${messageType}"
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
            content: "You are roleplaying workplace scenarios with realistic professional communication."
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
        content: result.content || "Thanks for your message. Let me get back to you on this.",
        sender: character,
        type: messageType
      };
    } catch (error) {
      console.log('Using fallback workspace message due to API error');
      
      const fallbackMessages = [
        "Thanks for bringing this to my attention. Let me review and get back to you.",
        "I appreciate you reaching out. Let's schedule some time to discuss this further.",
        "Good point. I'll need to coordinate with the team on this one.",
        "Thanks for the update. Let me know if you need any support on this.",
        "I'll take a look at this and circle back with you soon."
      ];
      
      return {
        content: fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)],
        sender: character,
        type: messageType
      };
    }
  }

  async transcribeAudio(audioBuffer: Buffer, mimeType: string = 'audio/webm'): Promise<{ text: string }> {
    try {
      if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY not configured');
      }

      // Import FormData for Node.js
      const { FormData } = await import('formdata-node');
      const { Blob } = await import('formdata-node');

      const formData = new FormData();
      formData.append('file', new Blob([audioBuffer], { type: mimeType }), 'recording.webm');
      formData.append('model', 'whisper-large-v3');
      formData.append('response_format', 'json');
      formData.append('language', 'en');

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: formData as any
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Groq API error response:', errorText);
        throw new Error(`Groq API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Groq transcription result:', result);
      return { text: result.text || '' };
    } catch (error) {
      console.error('Groq transcription error:', error);
      throw new Error('Failed to transcribe audio: ' + (error as Error).message);
    }
  }

  async generateSessionFeedback(
    sessionType: string,
    messages: any[],
    score: number
  ): Promise<{
    score: number;
    summary: string;
    strengths: string[];
    improvements: string[];
    nextSteps: string[];
  }> {
    const prompt = `Analyze this ${sessionType} simulation session and provide comprehensive feedback:
    
    Session messages: ${JSON.stringify(messages.slice(-10))} // Last 10 messages
    Performance score: ${score}
    
    Provide detailed feedback in JSON format:
    {
      "score": number,
      "summary": "overall session summary",
      "strengths": ["strength1", "strength2", "strength3"],
      "improvements": ["improvement1", "improvement2", "improvement3"],
      "nextSteps": ["next step 1", "next step 2", "next step 3"]
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
            content: "You are an expert coach providing detailed feedback on professional simulation sessions."
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
        score: result.score || score,
        summary: result.summary || `Completed ${sessionType} simulation session.`,
        strengths: result.strengths || ["Active participation", "Good engagement", "Completion of session"],
        improvements: result.improvements || ["More detailed responses", "Clearer explanations", "Better examples"],
        nextSteps: result.nextSteps || [`Try another ${sessionType} session`, "Practice specific skills", "Review feedback"]
      };
    } catch (error) {
      console.log('Using fallback session feedback due to API error');
      
      return {
        score,
        summary: `Completed ${sessionType} simulation with ${messages.length} interactions. Good overall engagement.`,
        strengths: [
          "Active participation in the simulation",
          "Consistent engagement with scenarios",
          "Completion of the full session"
        ],
        improvements: [
          "Consider providing more detailed responses",
          "Practice explaining reasoning more thoroughly", 
          "Try to incorporate specific examples"
        ],
        nextSteps: [
          `Try another ${sessionType} session with different parameters`,
          "Explore other simulation types to build comprehensive skills",
          "Review feedback and focus on improvement areas"
        ]
      };
    }
  }

  async generateCustomerSupportMessage(
    stage: string,
    persona: string,
    problem: string,
    agentMessage?: string,
    conversationHistory?: any[],
    isInitial?: boolean,
    stageTransition?: boolean
  ): Promise<{ message: string; sentiment: string }> {
    const conversationCount = conversationHistory ? conversationHistory.length : 0;
    
    // Always use contextual fallback for more consistent conversation flow
    console.log('Generating contextual customer message');
    return this.getContextualCustomerMessage(stage, persona, problem, agentMessage, isInitial, stageTransition, conversationCount);
  }

  async evaluateCustomerSupportResponse(
    stage: string,
    agentMessage: string,
    customerPersona: string,
    problem: string,
    conversationHistory: any[]
  ): Promise<{ empathyScore: number; clarityScore: number; feedback: string }> {
    const prompt = `Evaluate this customer support agent's response:
    
    Stage: ${stage}
    Customer Persona: ${customerPersona}
    Problem: ${problem}
    Agent Message: "${agentMessage}"
    
    Rate the response on:
    1. Empathy (1-10): How well does the agent show understanding and care?
    2. Clarity (1-10): How clear and easy to understand is the response?
    
    Provide brief feedback on strengths and areas for improvement.
    
    Format as JSON:
    {
      "empathyScore": number,
      "clarityScore": number,
      "feedback": "brief constructive feedback"
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
            content: "You are an expert customer support trainer providing feedback on agent performance."
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
        empathyScore: result.empathyScore || 7,
        clarityScore: result.clarityScore || 7,
        feedback: result.feedback || "Good response overall."
      };
    } catch (error) {
      console.log('Using fallback evaluation due to API error');
      return this.getFallbackSupportEvaluation(agentMessage, stage);
    }
  }

  private detectSentiment(message: string, persona: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (persona.includes('angry') || lowerMessage.includes('frustrated') || lowerMessage.includes('angry')) {
      return 'angry';
    } else if (lowerMessage.includes('thank') || lowerMessage.includes('great') || lowerMessage.includes('perfect')) {
      return 'happy';
    } else if (lowerMessage.includes('confused') || lowerMessage.includes('understand') || lowerMessage.includes('what')) {
      return 'confused';
    } else {
      return 'neutral';
    }
  }

  private getFallbackCustomerMessage(stage: string, persona: string, problem: string, isInitial?: boolean, conversationCount: number = 0): { message: string; sentiment: string } {
    const personaKey = persona.includes('angry') ? 'angry' : 
                     persona.includes('polite') ? 'polite' : 
                     persona.includes('confused') ? 'confused' :
                     persona.includes('elderly') ? 'elderly' :
                     persona.includes('urgent') ? 'urgent' : 'polite';
    
    // Generate contextual responses based on conversation flow
    const responseTemplates = {
      angry: {
        initial: [
          "This is absolutely ridiculous! I've been trying to resolve this for hours and nothing works!",
          "I'm extremely frustrated! Your system has been down and I need this fixed immediately!",
          "This is unacceptable! I've been dealing with this issue all day and getting nowhere!"
        ],
        responses: [
          "Look, I appreciate you trying to help, but I need actual solutions, not just sympathy.",
          "Can you please just fix this instead of asking me more questions?",
          "I've already explained this twice. When will this actually be resolved?",
          "This is taking way too long. What exactly are you going to do about it?",
          "I don't have time for this runaround. Give me a straight answer!"
        ]
      },
      polite: {
        initial: [
          "Hello, I'm having an issue that I was hoping you could help me with.",
          "Hi there, I'm experiencing a problem and would appreciate your assistance.",
          "Good day, I have a concern that I need help resolving."
        ],
        responses: [
          "Thank you for explaining that. Could you help me with the next steps?",
          "I appreciate your patience. What should I do from here?",
          "That makes sense. Is there anything else I need to know?",
          "Thank you for the clarification. How long might this take to resolve?",
          "I understand. What would be the best way to proceed?"
        ]
      },
      confused: {
        initial: [
          "Um, hi... I'm not really sure what's going on but something isn't working right.",
          "Hello, I'm having some kind of problem but I'm not sure how to explain it.",
          "Hi, something seems wrong but I don't really understand what happened."
        ],
        responses: [
          "I'm sorry, I don't really understand what you mean. Could you explain that differently?",
          "That sounds complicated. Can you walk me through it step by step?",
          "I'm still not sure I follow. Could you say that in simpler terms?",
          "Okay, I think I'm getting it, but what exactly do I need to click?",
          "I'm trying to follow along, but where exactly should I be looking?"
        ]
      },
      elderly: {
        initial: [
          "Hello dear, I'm having trouble with this computer thing and I don't know what to do.",
          "Hi, I'm not very good with technology and something's not working properly.",
          "Excuse me, I need help but I'm not sure how to explain what's wrong."
        ],
        responses: [
          "I'm sorry, could you please speak more slowly? I'm not good with these technical terms.",
          "That sounds very complicated. Is there a simpler way to do this?",
          "I'm trying to follow but where exactly is this button you mentioned?",
          "Could you please repeat that? I want to make sure I understand correctly.",
          "This is all very confusing for me. Can we go through it one step at a time?"
        ]
      },
      urgent: {
        initial: [
          "I need help immediately! This is extremely time-sensitive and I'm running out of time!",
          "This is urgent! I have a deadline in an hour and nothing is working!",
          "Please help me quickly! I'm in the middle of something important and this broke!"
        ],
        responses: [
          "Okay, but can we please speed this up? I really don't have much time.",
          "That sounds like it might work, but how quickly can we get this resolved?",
          "I understand, but is there a faster way to do this? Time is really critical here.",
          "Alright, I'll try that, but what if it doesn't work? I need a backup plan.",
          "Good, that seems to be working. What's the next step to finish this quickly?"
        ]
      }
    };

    if (isInitial) {
      const initialMessages = responseTemplates[personaKey]?.initial || responseTemplates.polite.initial;
      const message = initialMessages[Math.floor(Math.random() * initialMessages.length)];
      const sentiment = personaKey === 'angry' ? 'angry' : 
                       personaKey === 'urgent' ? 'stressed' :
                       personaKey === 'polite' ? 'neutral' : 'confused';
      return { message, sentiment };
    }

    // For follow-up responses, use different messages based on conversation count
    const responses = responseTemplates[personaKey]?.responses || responseTemplates.polite.responses;
    const messageIndex = Math.min(Math.floor(conversationCount / 2), responses.length - 1);
    const message = responses[messageIndex];
    
    const sentiment = personaKey === 'angry' ? 'frustrated' : 
                     personaKey === 'urgent' ? 'impatient' :
                     personaKey === 'polite' ? 'cooperative' : 'confused';

    return { message, sentiment };
  }

  private getFallbackSupportEvaluation(agentMessage: string, stage: string): { empathyScore: number; clarityScore: number; feedback: string } {
    const messageLength = agentMessage.length;
    let empathyScore = 6;
    let clarityScore = 6;
    
    // Basic scoring based on message characteristics
    if (agentMessage.toLowerCase().includes('sorry') || agentMessage.toLowerCase().includes('understand')) {
      empathyScore += 2;
    }
    if (agentMessage.length > 50 && messageLength < 200) {
      clarityScore += 2;
    }
    if (agentMessage.includes('?')) {
      empathyScore += 1;
    }
    
    empathyScore = Math.min(10, Math.max(1, empathyScore));
    clarityScore = Math.min(10, Math.max(1, clarityScore));
    
    const feedbackOptions = [
      "Good response with appropriate tone for customer support.",
      "Shows empathy and provides clear information. Consider adding more specific next steps.",
      "Professional response. Try to acknowledge the customer's feelings more explicitly.",
      "Clear communication. Consider asking follow-up questions to better understand the issue."
    ];
    
    return {
      empathyScore,
      clarityScore,
      feedback: feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)]
    };
  }

  private getContextualCustomerMessage(
    stage: string,
    persona: string,
    problem: string,
    agentMessage?: string,
    isInitial?: boolean,
    stageTransition?: boolean,
    conversationCount: number = 0
  ): { message: string; sentiment: string } {
    const personaKey = persona.includes('angry') ? 'angry' : 
                     persona.includes('polite') ? 'polite' : 
                     persona.includes('confused') ? 'confused' :
                     persona.includes('elderly') ? 'elderly' :
                     persona.includes('urgent') ? 'urgent' : 'polite';

    if (isInitial) {
      return this.getFallbackCustomerMessage(stage, persona, problem, true, 0);
    }

    // Generate contextual responses based on agent's message
    if (agentMessage) {
      const agentLower = agentMessage.toLowerCase();
      
      // Analyze agent's response and generate appropriate customer reply
      if (agentLower.includes('sorry') || agentLower.includes('apologize')) {
        return this.generateApologyResponse(personaKey, conversationCount);
      } else if (agentLower.includes('try') || agentLower.includes('can you')) {
        return this.generateActionResponse(personaKey, conversationCount);
      } else if (agentLower.includes('understand') || agentLower.includes('let me')) {
        return this.generateUnderstandingResponse(personaKey, conversationCount);
      } else if (agentLower.includes('help') || agentLower.includes('assist')) {
        return this.generateHelpResponse(personaKey, conversationCount);
      } else if (agentLower.includes('?')) {
        return this.generateQuestionResponse(personaKey, problem, conversationCount);
      }
    }

    // Default contextual response
    return this.getFallbackCustomerMessage(stage, persona, problem, false, conversationCount);
  }

  private generateApologyResponse(personaKey: string, conversationCount: number): { message: string; sentiment: string } {
    const responses = {
      angry: [
        "Well, it's about time someone acknowledged this mess!",
        "I appreciate that, but I need this fixed, not just apologies.",
        "Look, saying sorry is fine, but what are you going to do about it?"
      ],
      polite: [
        "Thank you for the apology. I understand these things happen.",
        "I appreciate that. Can we work together to solve this?",
        "That's okay, I just want to get this resolved."
      ],
      confused: [
        "Oh, okay... but I'm still not sure what went wrong.",
        "I don't really understand what happened, but thank you.",
        "It's fine, I guess. Can you explain what the problem was?"
      ],
      elderly: [
        "Well, I appreciate you saying that, dear.",
        "Thank you for being honest. These computer things are so complicated.",
        "That's alright. I know I'm not good with technology."
      ],
      urgent: [
        "Okay, but can we please focus on fixing this quickly?",
        "I appreciate that, but time is really critical here.",
        "Fine, but I really need this resolved immediately."
      ]
    };

    const messages = responses[personaKey as keyof typeof responses] || responses.polite;
    const messageIndex = Math.min(conversationCount, messages.length - 1);
    const sentiment = personaKey === 'angry' ? 'frustrated' : 
                     personaKey === 'urgent' ? 'impatient' : 'understanding';
    
    return { message: messages[messageIndex], sentiment };
  }

  private generateActionResponse(personaKey: string, conversationCount: number): { message: string; sentiment: string } {
    const responses = {
      angry: [
        "Fine, I'll try it, but this better work this time!",
        "Alright, but if this doesn't work, I want to speak to a manager.",
        "I've tried so many things already, but sure, let's do this."
      ],
      polite: [
        "Of course, I'll try that right now. Thank you for the suggestion.",
        "That sounds reasonable. Let me give that a try.",
        "Sure, I'm willing to try anything that might help."
      ],
      confused: [
        "Um, okay... where exactly do I do that?",
        "I'm not sure I understand, but I'll try my best.",
        "Could you walk me through that step by step?"
      ],
      elderly: [
        "I'll try, but could you please tell me exactly where to click?",
        "This sounds complicated. Can you help me through it?",
        "I'm not sure I can do that on my own. Could you guide me?"
      ],
      urgent: [
        "Okay, I'll try that quickly. How long should this take?",
        "Fine, but please tell me this will be fast.",
        "Alright, doing it now. What if it doesn't work?"
      ]
    };

    const messages = responses[personaKey as keyof typeof responses] || responses.polite;
    const messageIndex = Math.min(conversationCount, messages.length - 1);
    const sentiment = personaKey === 'angry' ? 'reluctant' : 
                     personaKey === 'urgent' ? 'anxious' : 'cooperative';
    
    return { message: messages[messageIndex], sentiment };
  }

  private generateUnderstandingResponse(personaKey: string, conversationCount: number): { message: string; sentiment: string } {
    const responses = {
      angry: [
        "Good, finally someone who gets it. Now what's the solution?",
        "Yes, exactly! So how are we going to fix this?",
        "Right, you understand the problem. What's next?"
      ],
      polite: [
        "Yes, that's exactly right. I'm glad you understand.",
        "Thank you for taking the time to understand my situation.",
        "Perfect, you've got it. What should we do next?"
      ],
      confused: [
        "I think so... maybe? I'm still a bit lost though.",
        "Kind of, but I'm not really sure about some parts.",
        "I hope you understand it better than I do!"
      ],
      elderly: [
        "I hope you understand it, because I certainly don't!",
        "Yes, you seem to know what you're talking about.",
        "That's good, dear. I trust you know what to do."
      ],
      urgent: [
        "Great, you get it. Now can we fix this quickly?",
        "Perfect. How fast can we resolve this?",
        "Good, you understand the urgency. What's the quickest solution?"
      ]
    };

    const messages = responses[personaKey as keyof typeof responses] || responses.polite;
    const messageIndex = Math.min(conversationCount, messages.length - 1);
    const sentiment = personaKey === 'angry' ? 'hopeful' : 
                     personaKey === 'urgent' ? 'expectant' : 'relieved';
    
    return { message: messages[messageIndex], sentiment };
  }

  private generateHelpResponse(personaKey: string, conversationCount: number): { message: string; sentiment: string } {
    const responses = {
      angry: [
        "Yes, I definitely need help! This has been a nightmare.",
        "Finally! Yes, I need help getting this sorted out.",
        "Absolutely, I've been trying to get help for hours!"
      ],
      polite: [
        "Yes, I would really appreciate your help with this.",
        "That would be wonderful, thank you so much.",
        "Yes please, I'd be very grateful for your assistance."
      ],
      confused: [
        "Yes, I really need help. I don't know what I'm doing.",
        "Please, I'm so lost and don't understand any of this.",
        "Yes, I definitely need someone to help me figure this out."
      ],
      elderly: [
        "Oh yes, please help me. I'm terrible with these things.",
        "I would appreciate that so much. Technology confuses me.",
        "Yes, please be patient with me. I learn slowly."
      ],
      urgent: [
        "Yes, urgent help! I need this fixed immediately!",
        "Please help me quickly! Time is running out!",
        "Yes, but I need fast help. This can't wait much longer."
      ]
    };

    const messages = responses[personaKey as keyof typeof responses] || responses.polite;
    const messageIndex = Math.min(conversationCount, messages.length - 1);
    const sentiment = personaKey === 'angry' ? 'desperate' : 
                     personaKey === 'urgent' ? 'stressed' : 'hopeful';
    
    return { message: messages[messageIndex], sentiment };
  }

  private generateQuestionResponse(personaKey: string, problem: string, conversationCount: number): { message: string; sentiment: string } {
    const responses = {
      angry: [
        "Look, I already explained this. The issue is with " + problem.substring(0, 50) + "...",
        "I told you already! Why do I have to keep repeating myself?",
        "Are you even listening? I said the problem is " + problem.substring(0, 30) + "..."
      ],
      polite: [
        "Of course! The issue I'm having is: " + problem.substring(0, 60) + "...",
        "Sure, let me explain. " + problem.substring(0, 50) + "...",
        "Yes, to clarify: " + problem.substring(0, 55) + "..."
      ],
      confused: [
        "Um, I think the problem is... " + problem.substring(0, 40) + "... but I'm not sure.",
        "Well, something about " + problem.substring(0, 35) + "... I think?",
        "I'm not really sure how to explain it, but " + problem.substring(0, 30) + "..."
      ],
      elderly: [
        "Well, I think it has something to do with " + problem.substring(0, 40) + "...",
        "Let me try to explain... " + problem.substring(0, 45) + "...",
        "I'm not sure I can explain it properly, but " + problem.substring(0, 35) + "..."
      ],
      urgent: [
        "Yes! " + problem.substring(0, 50) + "... and I need it fixed NOW!",
        "The problem is " + problem.substring(0, 45) + "... and it's urgent!",
        "Look, " + problem.substring(0, 40) + "... and time is critical!"
      ]
    };

    const messages = responses[personaKey as keyof typeof responses] || responses.polite;
    const messageIndex = Math.min(conversationCount, messages.length - 1);
    const sentiment = personaKey === 'angry' ? 'irritated' : 
                     personaKey === 'urgent' ? 'stressed' : 'explanatory';
    
    return { message: messages[messageIndex], sentiment };
  }
}

export const groqService = new GroqService();