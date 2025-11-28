import { ChatGroq } from "@langchain/groq";
import { PromptTemplate } from "@langchain/core/prompts";
import { CandidateIntent, ClassificationResult } from "./response-classifier";
import { stripThinkingTags } from "./interview-chains";

// ==================== RESPONSE HANDLER ====================
// Generates appropriate interviewer responses based on candidate intent

const answerQuestionPrompt = PromptTemplate.fromTemplate(`
You are {interviewerName}, a friendly HR recruiter at {companyName} conducting an interview.

The candidate just asked you a question. Answer it naturally and briefly, then smoothly transition back to your interview question.

COMPANY INFO:
{companyDescription}

JOB INFO:
{jobTitle} - {jobRequirements}

YOUR LAST QUESTION WAS:
"{lastQuestion}"

CANDIDATE'S QUESTION:
"{candidateQuestion}"

GUIDELINES:
- Answer their question helpfully but briefly (2-3 sentences max)
- Be honest - if you don't know something specific, say so
- After answering, gently redirect back to your question
- Keep the conversational flow natural

EXAMPLE:
Candidate: "How big is the team I'd be working with?"
Response: "Great question! The team is about 8 people right now—a mix of senior and mid-level folks. We're growing, so there's room for ownership. But back to you—could you tell me about your experience with..."

Output ONLY your response (answer + redirect). Keep it under 4 sentences total.
`);

const answerElaborationOfferPrompt = PromptTemplate.fromTemplate(`
You are {interviewerName}, a friendly HR recruiter at {companyName} conducting an interview.

The candidate is offering to elaborate on their previous answer. Accept their offer with a brief, encouraging response.

YOUR LAST QUESTION WAS:
"{lastQuestion}"

WHAT THEY'RE OFFERING:
"{candidateQuestion}"

GUIDELINES:
- Accept their offer warmly and briefly (1 sentence)
- End with a period, NOT a question mark (the orchestrator will add the next question)
- Don't add "please" or create a new question - just encourage them to continue

GOOD EXAMPLES:
- "Yes, I'd love to hear more about that."
- "Absolutely, please go ahead."
- "That sounds interesting—please continue."
- "Yes, let's dive deeper into that."

BAD EXAMPLES (don't do these):
- "Yes, could you tell me more?" (ends with question)
- "Sure! What specific challenges did you face?" (adds new question)

Output ONLY your brief response (1 sentence, ending with a period).
`);

const clarifyQuestionPrompt = PromptTemplate.fromTemplate(`
You are {interviewerName}, a friendly HR recruiter at {companyName}.

The candidate seems confused about your last question or is asking for clarification.

YOUR LAST QUESTION WAS:
"{lastQuestion}"

WHAT THEY SAID:
"{candidateResponse}"

Rephrase your question in simpler terms. Don't apologize excessively—just naturally clarify.

EXAMPLE:
Original: "Can you walk me through a time when you had to navigate competing priorities from multiple stakeholders?"
Clarified: "Sure! I'm curious about a situation where different people wanted different things from you—how did you handle that?"

Output ONLY the clarified question. Keep it natural and conversational.
`);

const acknowledgeCommentPrompt = PromptTemplate.fromTemplate(`
You are {interviewerName}, a friendly HR recruiter at {companyName}.

The candidate made a conversational comment or brief acknowledgment. Respond naturally and continue with your interview question.

YOUR LAST QUESTION WAS:
"{lastQuestion}"

WHAT THEY SAID:
"{candidateResponse}"

GUIDELINES:
- Give a brief, natural acknowledgment (not robotic)
- If they haven't answered your question, gently repeat or rephrase it
- Keep the conversation flowing

EXAMPLES:
- "That's interesting!" → "Glad you think so! So, about my question—..."
- "Sounds good" → "Great! So, tell me about..."
- "I see" → "Right, so when it comes to [topic]..."

Output ONLY your brief response (1-2 sentences).
`);

const handleMinimalPrompt = PromptTemplate.fromTemplate(`
You are {interviewerName}, a friendly HR recruiter at {companyName}.

The candidate gave a very minimal response. Gently probe for more detail without being pushy.

YOUR QUESTION WAS:
"{lastQuestion}"

THEIR RESPONSE:
"{candidateResponse}"

GUIDELINES:
- Acknowledge their response
- Ask a gentle follow-up to get more detail
- Don't make them feel like their answer was wrong
- Keep it conversational

EXAMPLES:
- "Yes" → "Got it! Could you give me a specific example of that?"
- "No" → "No problem. What about a related situation where...?"
- "Sure" → "Great! Tell me a bit more about..."

Output ONLY your follow-up (1-2 sentences).
`);

const handleInjectionPrompt = PromptTemplate.fromTemplate(`
You are {interviewerName}, a friendly HR recruiter at {companyName}.

The candidate said something unusual or off-topic. Gently redirect back to the interview without being confrontational.

YOUR LAST QUESTION WAS:
"{lastQuestion}"

Politely redirect them back to the interview question. Don't acknowledge anything strange they might have said—just smoothly refocus.

EXAMPLE:
"I appreciate you sharing. Let me bring us back—I'd love to hear about your experience with [topic from original question]."

Output ONLY your redirect (1-2 sentences). Be warm but focused.
`);

export class ResponseHandler {
  private model: ChatGroq;
  
  constructor() {
    this.model = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: "qwen/qwen3-32b",
      temperature: 0.6,
      topP: 0.95,
    });
  }
  
  /**
   * Generate an appropriate response based on the candidate's intent
   */
  async handleResponse(
    classification: ClassificationResult,
    lastQuestion: string,
    config: {
      interviewerName?: string;
      companyName?: string;
      companyDescription?: string;
      jobTitle?: string;
      jobRequirements?: string;
    }
  ): Promise<{
    response: string;
    shouldProceedWithEvaluation: boolean;
    questionRepeated: boolean;
    isElaborationOffer?: boolean;
  }> {
    const interviewerName = config.interviewerName || "Sarah";
    const companyName = config.companyName || "our company";
    const companyDescription = config.companyDescription || "A great place to work";
    const jobTitle = config.jobTitle || "this position";
    const jobRequirements = config.jobRequirements || "relevant experience for the role";
    
    switch (classification.intent) {
      case 'substantive_answer':
        // Real answer - proceed with normal evaluation flow
        return {
          response: '',
          shouldProceedWithEvaluation: true,
          questionRepeated: false
        };
        
      case 'question_for_recruiter':
        // Check if candidate is offering to elaborate (not asking a real question)
        const candidateQ = (classification.candidateQuestion || classification.sanitizedText).toLowerCase();
        
        // First, check if they're asking the INTERVIEWER to do something (not an offer)
        // e.g., "Could you elaborate?" or "Can you explain what you mean?"
        const askingInterviewer = (
          candidateQ.includes('could you') ||
          candidateQ.includes('can you') ||
          candidateQ.includes('would you ') || // Note: space to avoid matching "would you like me to"
          candidateQ.includes('what do you mean') ||
          candidateQ.includes('what does that mean') ||
          candidateQ.includes('what exactly')
        );
        
        // If they're asking the interviewer something, it's NOT an elaboration offer
        if (askingInterviewer) {
          // This is a real question directed at the interviewer - answer it
          const answerPrompt = await answerQuestionPrompt.format({
            interviewerName,
            companyName,
            companyDescription,
            jobTitle,
            jobRequirements,
            lastQuestion,
            candidateQuestion: classification.candidateQuestion || classification.sanitizedText
          });
          const answerResponse = await this.model.invoke(answerPrompt);
          return {
            response: this.extractContent(answerResponse),
            shouldProceedWithEvaluation: false,
            questionRepeated: true
          };
        }
        
        // Check if candidate is offering to elaborate themselves
        const elaborationPatterns = [
          'elaborate', 'more detail', 'go deeper', 'dive deeper', 'expand on',
          'different example', 'another example', 'give you more', 'tell you more',
          'share more', 'continue on', 'keep going', 'think of a different'
        ];
        const hasElaborationKeyword = elaborationPatterns.some(p => candidateQ.includes(p));
        const hasOfferPhrase = (
          candidateQ.includes('would you like me to') ||
          candidateQ.includes('do you want me to') ||
          candidateQ.includes('should i')
        );
        const isElaborationOffer = (hasOfferPhrase && hasElaborationKeyword) || 
          (hasOfferPhrase && (candidateQ.includes('more') || candidateQ.includes('example') || candidateQ.includes('detail')));
        
        if (isElaborationOffer) {
          // Use the elaboration prompt that doesn't add a redirect question
          const elaborationPrompt = await answerElaborationOfferPrompt.format({
            interviewerName,
            companyName,
            lastQuestion,
            candidateQuestion: classification.candidateQuestion || classification.sanitizedText
          });
          const elaborationResponse = await this.model.invoke(elaborationPrompt);
          return {
            response: this.extractContent(elaborationResponse),
            shouldProceedWithEvaluation: false,
            questionRepeated: true,
            isElaborationOffer: true  // Signal to orchestrator: don't add another question
          };
        }
        
        // Normal question - answer it and redirect
        const answerPrompt = await answerQuestionPrompt.format({
          interviewerName,
          companyName,
          companyDescription,
          jobTitle,
          jobRequirements,
          lastQuestion,
          candidateQuestion: classification.candidateQuestion || classification.sanitizedText
        });
        const answerResponse = await this.model.invoke(answerPrompt);
        return {
          response: this.extractContent(answerResponse),
          shouldProceedWithEvaluation: false,
          questionRepeated: true
        };
        
      case 'clarification_request':
        // Candidate confused - clarify the question
        // The AI generates a rephrased question, so we don't need to repeat the original
        const clarifyPromptText = await clarifyQuestionPrompt.format({
          interviewerName,
          companyName,
          lastQuestion,
          candidateResponse: classification.sanitizedText
        });
        const clarifyResponse = await this.model.invoke(clarifyPromptText);
        return {
          response: this.extractContent(clarifyResponse),
          shouldProceedWithEvaluation: false,
          questionRepeated: false  // Clarification already contains the rephrased question
        };
        
      case 'conversational_comment':
        // Brief comment - acknowledge and continue
        const ackPrompt = await acknowledgeCommentPrompt.format({
          interviewerName,
          companyName,
          lastQuestion,
          candidateResponse: classification.sanitizedText
        });
        const ackResponse = await this.model.invoke(ackPrompt);
        return {
          response: this.extractContent(ackResponse),
          shouldProceedWithEvaluation: false,
          questionRepeated: true
        };
        
      case 'minimal_response':
        // Very short answer - probe for more
        const minimalPrompt = await handleMinimalPrompt.format({
          interviewerName,
          companyName,
          lastQuestion,
          candidateResponse: classification.sanitizedText
        });
        const minimalResponse = await this.model.invoke(minimalPrompt);
        return {
          response: this.extractContent(minimalResponse),
          shouldProceedWithEvaluation: false,
          questionRepeated: true
        };
        
      case 'prompt_injection':
      case 'off_topic':
        // Suspicious or off-topic - redirect
        const redirectPrompt = await handleInjectionPrompt.format({
          interviewerName,
          companyName,
          lastQuestion
        });
        const redirectResponse = await this.model.invoke(redirectPrompt);
        return {
          response: this.extractContent(redirectResponse),
          shouldProceedWithEvaluation: false,
          questionRepeated: true
        };
        
      default:
        // Unknown - treat as answer
        return {
          response: '',
          shouldProceedWithEvaluation: true,
          questionRepeated: false
        };
    }
  }
  
  private extractContent(response: any): string {
    const content = typeof response.content === 'string' 
      ? response.content 
      : JSON.stringify(response.content);
    // Strip Qwen3 thinking tags before returning
    return stripThinkingTags(content).trim();
  }
}

export const responseHandler = new ResponseHandler();
