/**
 * Standup Feedback Service
 * 
 * Generates AI-powered team feedback based on user's standup submission.
 */

import Groq from "groq-sdk";
import { getStandupAdapter, type StandupSubmission, type TeamFeedbackResponse, type StandupSessionContext, type StandupPersona } from "@shared/adapters/standup";
import type { Role, Level } from "@shared/adapters";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface FeedbackResult {
  responses: TeamFeedbackResponse[];
  success: boolean;
  error?: string;
}

function selectRespondingPersonas(
  personas: StandupPersona[],
  submission: StandupSubmission,
  feedbackConfig: { minResponses: number; maxResponses: number }
): StandupPersona[] {
  const hasBlockers = submission.blockers && submission.blockers.trim().length > 0;
  const numResponses = hasBlockers 
    ? feedbackConfig.maxResponses 
    : feedbackConfig.minResponses;
  
  return personas.slice(0, numResponses);
}

export async function generateStandupFeedback(
  context: StandupSessionContext,
  submission: StandupSubmission
): Promise<FeedbackResult> {
  const adapter = getStandupAdapter(context.role, context.level);
  const respondingPersonas = selectRespondingPersonas(
    adapter.prompts.respondingPersonas,
    submission,
    adapter.feedbackConfig
  );

  try {
    if (!process.env.GROQ_API_KEY) {
      return generateFallbackFeedback(respondingPersonas, submission, adapter.feedbackConfig.feedbackTone);
    }

    const ticketContext = context.ticketContext;
    const ticketSummary = `
Current sprint status:
- In Progress: ${ticketContext.inProgress.length > 0 ? ticketContext.inProgress.join(', ') : 'None'}
- Completed: ${ticketContext.completed.length > 0 ? ticketContext.completed.join(', ') : 'None'}
- Blocked: ${ticketContext.blocked.length > 0 ? ticketContext.blocked.join(', ') : 'None'}
`;

    const prompt = `${adapter.prompts.systemPrompt}

USER'S STANDUP UPDATE:
Yesterday: ${submission.yesterday}
Today: ${submission.today}
${submission.blockers ? `Blockers: ${submission.blockers}` : 'No blockers reported.'}

${ticketSummary}

CONTEXT:
- Company: ${context.companyName}
- Sprint Day: ${context.sprintDay}
- User's Role: ${context.role}
- User's Level: ${context.level}

Generate ${respondingPersonas.length} realistic team member response(s) to this standup update.

IMPORTANT: Respond with ONLY valid JSON in this exact format:
{
  "responses": [
    {
      "personaId": "${respondingPersonas[0]?.id || 'sarah'}",
      "message": "Your acknowledgment/feedback message here",
      "type": "acknowledgment"
    }${respondingPersonas.length > 1 ? `,
    {
      "personaId": "${respondingPersonas[1]?.id || 'marcus'}",
      "message": "Your follow-up or suggestion here",
      "type": "suggestion"
    }` : ''}${respondingPersonas.length > 2 ? `,
    {
      "personaId": "${respondingPersonas[2]?.id || 'alex'}",
      "message": "Your response here",
      "type": "acknowledgment"
    }` : ''}
  ]
}

Response types: "acknowledgment", "suggestion", "followup", "encouragement"
Keep each message concise (1-3 sentences). Make responses specific to what the user shared.`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are simulating a software development team's standup meeting. Generate realistic, helpful team feedback. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from AI");
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]) as { responses: Array<{ personaId: string; message: string; type: string }> };
    
    if (!parsed.responses || !Array.isArray(parsed.responses) || parsed.responses.length === 0) {
      throw new Error("Invalid response format from AI");
    }
    
    const feedbackResponses: TeamFeedbackResponse[] = parsed.responses
      .filter(r => r && r.message && typeof r.message === 'string')
      .map(r => {
        const persona = respondingPersonas.find(p => p.id === r.personaId) || respondingPersonas[0];
        if (!persona) {
          throw new Error("No valid persona found");
        }
        return {
          from: persona,
          message: r.message,
          type: (r.type as TeamFeedbackResponse['type']) || 'acknowledgment',
        };
      });

    if (feedbackResponses.length === 0) {
      throw new Error("No valid feedback responses generated");
    }

    return {
      responses: feedbackResponses,
      success: true,
    };

  } catch (error) {
    console.error("Error generating standup feedback:", error);
    return generateFallbackFeedback(respondingPersonas, submission, adapter.feedbackConfig.feedbackTone);
  }
}

function generateFallbackFeedback(
  personas: StandupPersona[],
  submission: StandupSubmission,
  tone: 'encouraging' | 'balanced' | 'direct'
): FeedbackResult {
  const responses: TeamFeedbackResponse[] = [];
  
  const priya = personas.find(p => p.id === 'priya') || personas[0];
  if (priya) {
    const toneMessages = {
      encouraging: `Great update! I appreciate you keeping us in the loop. ${submission.today.toLowerCase().includes('ticket') ? "Good focus on the sprint tickets." : "Let me know if priorities need to shift."}`,
      balanced: `Thanks for the update. ${submission.today.toLowerCase().includes('ticket') ? "Good ticket focus." : "Remember to tie work back to sprint goals."} Let me know if anything changes.`,
      direct: `Noted. ${submission.today.toLowerCase().includes('ticket') ? "Good." : "Reference tickets where possible."} Keep me posted on any blockers.`,
    };
    responses.push({
      from: priya,
      message: toneMessages[tone],
      type: 'acknowledgment',
    });
  }

  if (submission.blockers && submission.blockers.trim().length > 0) {
    const sarah = personas.find(p => p.id === 'sarah') || personas[0];
    if (sarah) {
      const toneMessages = {
        encouraging: `I noticed you mentioned a blocker - don't worry, we'll figure it out together! Let's sync after standup to see how we can unblock you.`,
        balanced: `Let's sync after standup about that blocker. We should be able to resolve it quickly.`,
        direct: `Flag that blocker in the ticket. Let's address it immediately after standup.`,
      };
      responses.push({
        from: sarah,
        message: toneMessages[tone],
        type: 'followup',
      });
    }
  }

  if (responses.length < personas.length) {
    const marcus = personas.find(p => p.id === 'marcus');
    if (marcus) {
      const toneMessages = {
        encouraging: `Good progress! Remember to commit frequently and push your changes. Happy to pair if you hit any tricky parts.`,
        balanced: `Solid update. Let me know if you hit any technical roadblocks.`,
        direct: `Noted. Ping me on Slack if you need a quick code review.`,
      };
      responses.push({
        from: marcus,
        message: toneMessages[tone],
        type: 'suggestion',
      });
    }
  }

  return {
    responses,
    success: true,
  };
}
