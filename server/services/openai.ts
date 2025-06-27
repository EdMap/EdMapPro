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
      throw new Error("Failed to generate interview question: " + (error as Error).message);
    }
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
      throw new Error("Failed to evaluate interview answer: " + (error as Error).message);
    }
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
      throw new Error("Failed to generate negotiation response: " + (error as Error).message);
    }
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
