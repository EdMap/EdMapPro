import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
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

export class OpenAIService {
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
      // Check if we have a valid API key first
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('*')) {
        throw new Error('Invalid API key');
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
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
      // Fallback questions when API fails
      console.log('Using fallback question generation due to API error');
      const fallbackQuestions = this.getFallbackQuestion(profession, interviewType, difficulty, previousQuestions);
      return fallbackQuestions;
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
            "Tell me about a time when you had to learn a new technology quickly.",
            "Describe a challenging bug you encountered and how you solved it.",
            "How do you stay updated with new technologies and best practices?"
          ],
          mid: [
            "Tell me about a time when you had to work with a difficult team member.",
            "Describe a project where you had to balance technical debt with new feature development.",
            "How do you handle code reviews and feedback?"
          ],
          senior: [
            "Tell me about a time when you had to make a difficult technical decision.",
            "Describe how you would mentor a junior developer who is struggling.",
            "How do you approach system design decisions in a team environment?"
          ]
        }
      }
    };

    const questions = questionBank[profession as keyof typeof questionBank]?.[interviewType as keyof typeof questionBank["Software Engineer"]]?.[difficulty as keyof typeof questionBank["Software Engineer"]["Technical Interview"]] || [
      "Tell me about your experience with software development.",
      "What interests you about this role?",
      "Describe a project you're proud of."
    ];

    // Filter out previously asked questions
    const availableQuestions = questions.filter(q => !previousQuestions.includes(q));
    const selectedQuestion = availableQuestions.length > 0 ? availableQuestions[0] : questions[0];

    return {
      question: selectedQuestion,
      category: interviewType === "Technical Interview" ? "technical" : "behavioral",
      difficulty,
      expectedAnswer: "Provide a clear, structured answer with specific examples and demonstrate your understanding of the topic."
    };
  }

  async evaluateInterviewAnswer(
    question: string,
    answer: string,
    profession: string,
    difficulty: string
  ): Promise<{ score: number; feedback: string; followUp?: string }> {
    const prompt = `Evaluate this interview answer for a ${profession} position:
    
    Question: ${question}
    Answer: ${answer}
    Difficulty Level: ${difficulty}
    
    Provide evaluation with score (0-100) and constructive feedback. Also suggest a follow-up question if appropriate.
    
    Respond with JSON: {
      "score": number,
      "feedback": "detailed feedback on the answer",
      "followUp": "optional follow-up question"
    }`;

    try {
      // Check if we have a valid API key first
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('*')) {
        throw new Error('Invalid API key');
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert interviewer who provides fair and constructive feedback on interview answers."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result;
    } catch (error) {
      // Fallback evaluation when API fails
      console.log('Using fallback evaluation due to API error');
      return this.getFallbackEvaluation(question, answer, difficulty);
    }
  }

  private getFallbackEvaluation(question: string, answer: string, difficulty: string): { score: number; feedback: string; followUp?: string } {
    const answerLength = answer.trim().length;
    const hasExamples = answer.toLowerCase().includes('example') || answer.toLowerCase().includes('for instance');
    const hasStructure = answer.includes('.') && answer.split('.').length > 2;
    
    let score = 60; // Base score
    
    // Adjust score based on answer quality indicators
    if (answerLength > 100) score += 10;
    if (answerLength > 300) score += 10;
    if (hasExamples) score += 15;
    if (hasStructure) score += 10;
    
    // Adjust based on difficulty
    const difficultyMultiplier = difficulty === 'senior' ? 0.9 : difficulty === 'mid' ? 0.95 : 1.0;
    score = Math.round(score * difficultyMultiplier);
    score = Math.min(score, 95); // Cap at 95 for fallback
    
    const feedback = score >= 80 
      ? "Great answer! You demonstrated good understanding and provided relevant details. Consider adding more specific examples to strengthen your response."
      : score >= 65
      ? "Good response with solid fundamentals. Try to elaborate more on your reasoning and include specific examples when possible."
      : "Your answer shows basic understanding. Consider providing more detailed explanations and concrete examples to demonstrate your knowledge.";
      
    const followUps = [
      "Can you walk me through how you would implement this in practice?",
      "What challenges might you face with this approach?",
      "How would you handle edge cases in this scenario?",
      "What tools or technologies would you use for this?"
    ];
    
    const followUp = followUps[Math.floor(Math.random() * followUps.length)];
    
    return { score, feedback, followUp };
  }

  async generateNegotiationResponse(
    scenario: string,
    userMessage: string,
    negotiationHistory: any[],
    counterpartStyle: string
  ): Promise<NegotiationResponse> {
    const prompt = `You are playing the role of a ${counterpartStyle} negotiation counterpart in a ${scenario} scenario.
    
    Negotiation history: ${JSON.stringify(negotiationHistory)}
    User's latest message: ${userMessage}
    
    Respond as the counterpart would, considering their ${counterpartStyle} style.
    
    Respond with JSON: {
      "response": "your negotiation response",
      "sentiment": "collaborative/competitive/neutral",
      "strategy": "brief explanation of your negotiation strategy",
      "counterOffer": "any specific counter-offer if applicable"
    }`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert negotiator who adapts their style based on the scenario and maintains realistic negotiation dynamics."
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
      return this.getFallbackNegotiationResponse(scenario, userMessage, counterpartStyle);
    }
  }

  private getFallbackNegotiationResponse(scenario: string, userMessage: string, counterpartStyle: string): NegotiationResponse {
    const responses = {
      collaborative: [
        "I appreciate your perspective on this. Let's see how we can find a solution that works for both of us.",
        "That's an interesting point. I'd like to understand your priorities better so we can work together.",
        "I think we're making good progress. What if we explored some alternative approaches?"
      ],
      competitive: [
        "I understand your position, but we need to be realistic about what's possible here.",
        "That's quite ambitious. Our standard practice is different, but let me see what options we have.",
        "I need to be frank with you - that's outside our typical range, but I'm willing to discuss alternatives."
      ],
      analytical: [
        "Let me review the data and market standards for similar positions.",
        "Based on our compensation analysis, here's what I can share with you.",
        "I'd like to present some benchmarks that might help frame our discussion."
      ],
      relationship: [
        "I want to make sure we maintain a positive working relationship throughout this process.",
        "Your success is important to us, and I want to find a path that supports that.",
        "Let's focus on building something that sets you up for long-term success here."
      ]
    };

    const styleResponses = responses[counterpartStyle as keyof typeof responses] || responses.collaborative;
    const response = styleResponses[Math.floor(Math.random() * styleResponses.length)];
    
    const sentiment = counterpartStyle === 'competitive' ? 'competitive' : 
                     counterpartStyle === 'collaborative' ? 'collaborative' : 'neutral';
    
    const strategy = `Using a ${counterpartStyle} approach to address your request while maintaining our position.`;
    
    return {
      response,
      sentiment,
      strategy,
      counterOffer: scenario === 'salary' ? "We could consider a performance-based increase after 6 months." : undefined
    };
  }

  async generateWorkspaceMessage(
    teamMember: any,
    context: string,
    userAction: string
  ): Promise<{ message: string; urgency: string; nextAction?: string }> {
    const prompt = `You are ${teamMember.name}, a ${teamMember.role} with ${teamMember.personality} personality.
    
    Context: ${context}
    User just: ${userAction}
    
    Respond as this team member would in a workplace chat/meeting.
    
    Respond with JSON: {
      "message": "your workplace message",
      "urgency": "low/medium/high",
      "nextAction": "suggested next action for the user (optional)"
    }`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a realistic workplace team member who communicates professionally and authentically."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result;
    } catch (error) {
      throw new Error("Failed to generate workspace message: " + (error as Error).message);
    }
  }

  async generateSessionFeedback(
    sessionType: string,
    messages: any[],
    configuration: any
  ): Promise<InterviewFeedback> {
    const prompt = `Analyze this ${sessionType} simulation session and provide comprehensive feedback:
    
    Configuration: ${JSON.stringify(configuration)}
    Messages: ${JSON.stringify(messages)}
    
    Provide detailed feedback with score and recommendations.
    
    Respond with JSON: {
      "score": number (0-100),
      "strengths": ["list of strengths shown"],
      "improvements": ["list of areas for improvement"],
      "overallFeedback": "comprehensive summary feedback"
    }`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert coach who provides detailed, actionable feedback on professional simulations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result as InterviewFeedback;
    } catch (error) {
      throw new Error("Failed to generate session feedback: " + (error as Error).message);
    }
  }
}

export const openaiService = new OpenAIService();
