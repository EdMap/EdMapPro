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
    let prompt;
    
    if (isInitial) {
      prompt = `You are a customer with this persona: ${persona}. Your problem is: ${problem}
      
      This is the beginning of a customer support ${stage.toLowerCase()} interaction. Send your initial message expressing your issue.
      Be realistic and match your persona's communication style.`;
    } else if (stageTransition) {
      prompt = `You are a customer with this persona: ${persona}. Your problem is: ${problem}
      
      The support conversation has moved to the ${stage.toLowerCase()} stage. Respond appropriately for this stage.
      Match your persona's communication style.`;
    } else {
      prompt = `You are a customer with this persona: ${persona}. Your problem is: ${problem}
      
      The support agent just said: "${agentMessage}"
      
      Respond as the customer. Consider the conversation history and current stage: ${stage}.
      Be realistic and match your persona's communication style.`;
    }

    try {
      if (!process.env.GROQ_API_KEY) {
        throw new Error('Invalid API key');
      }

      const response = await groq.chat.completions.create({
        model: "llama-3.1-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are roleplaying as a customer in a support interaction. Be realistic and stay in character."
          },
          {
            role: "user",
            content: prompt
          }
        ],
      });

      const message = response.choices[0].message.content || "I need help with my issue.";
      const sentiment = this.detectSentiment(message, persona);

      return { message, sentiment };
    } catch (error) {
      console.log('Using fallback customer message due to API error');
      return this.getFallbackCustomerMessage(stage, persona, problem, isInitial);
    }
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

  private getFallbackCustomerMessage(stage: string, persona: string, problem: string, isInitial?: boolean): { message: string; sentiment: string } {
    const messages = {
      angry: {
        initial: "This is absolutely ridiculous! I've been trying to resolve this for hours and nothing works!",
        greeting: "Finally! I've been waiting forever. Can you actually help me this time?",
        diagnosis: "I already told you what the problem is! Why do I have to repeat everything?",
        resolution: "That better work because I'm losing my patience here.",
        escalation: "I want to speak to your manager. This is unacceptable.",
        closing: "It's about time! This should never have taken this long."
      },
      polite: {
        initial: "Hello, I'm having an issue that I was hoping you could help me with.",
        greeting: "Hi there! Thank you for your time. I have a question about my account.",
        diagnosis: "I understand. Let me provide you with the details you need.",
        resolution: "Thank you so much for walking me through that. I really appreciate your help.",
        escalation: "I appreciate your help, but I think I might need to speak with someone else about this.",
        closing: "Perfect! Thank you again for all your assistance today."
      },
      confused: {
        initial: "Um, hi... I'm not really sure what's going on but something isn't working right.",
        greeting: "Hello, I'm having some kind of problem but I'm not sure how to explain it.",
        diagnosis: "I'm sorry, I don't really understand what you mean. Could you explain that differently?",
        resolution: "Okay... I think I follow but I'm still a bit confused about some steps.",
        escalation: "I'm really lost here. Is there someone who can help explain this more simply?",
        closing: "I think I get it now. Thank you for being so patient with me."
      }
    };

    const personaKey = persona.includes('angry') ? 'angry' : 
                     persona.includes('polite') ? 'polite' : 'confused';
    const stageKey = stage.toLowerCase().replace(' ', '') as keyof typeof messages.angry;
    
    const message = messages[personaKey][stageKey] || messages[personaKey].initial;
    const sentiment = personaKey === 'angry' ? 'angry' : 
                     personaKey === 'polite' ? 'happy' : 'confused';

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
}

export const groqService = new GroqService();