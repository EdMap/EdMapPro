/**
 * Interview Quality Test Script
 * 
 * Simulates a candidate going through the interview engine
 * and evaluates the conversation quality.
 */

import { InterviewOrchestrator } from '../services/interview-orchestrator';
import { ChatGroq } from '@langchain/groq';
import { storage } from '../storage';

interface ConversationTurn {
  speaker: 'interviewer' | 'candidate';
  message: string;
  questionNumber?: number;
}

interface QualityEvaluation {
  flow: {
    score: number;
    reasoning: string;
  };
  naturalness: {
    score: number;
    reasoning: string;
  };
  relevance: {
    score: number;
    reasoning: string;
  };
  overallScore: number;
  summary: string;
}

// Simulated candidate that responds based on their "profile"
class SimulatedCandidate {
  private model: ChatGroq;
  private profile: {
    name: string;
    yearsExperience: number;
    skills: string[];
    background: string;
    targetRole: string;
    personality: string;
  };

  constructor(profile: {
    name: string;
    yearsExperience: number;
    skills: string[];
    background: string;
    targetRole: string;
    personality: string;
  }) {
    this.profile = profile;
    this.model = new ChatGroq({
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
    });
  }

  async respond(interviewerMessage: string, conversationHistory: ConversationTurn[]): Promise<string> {
    const historyText = conversationHistory
      .map(turn => `${turn.speaker === 'interviewer' ? 'Interviewer' : 'You'}: ${turn.message}`)
      .join('\n');

    const prompt = `You are ${this.profile.name}, a candidate in a job interview for a ${this.profile.targetRole} position.

YOUR PROFILE:
- Years of Experience: ${this.profile.yearsExperience}
- Skills: ${this.profile.skills.join(', ')}
- Background: ${this.profile.background}
- Personality: ${this.profile.personality}

CONVERSATION SO FAR:
${historyText}

INTERVIEWER'S LATEST MESSAGE:
${interviewerMessage}

Respond naturally as this candidate would. Be authentic to the profile - give specific examples from your background when asked.
Keep responses conversational (2-4 sentences typically, longer for detailed questions).
If asked about experience, draw from your background.
If the interviewer asks if you have questions, ask 1-2 thoughtful questions about the role or company.

YOUR RESPONSE (just the response, no prefix):`;

    const response = await this.model.invoke(prompt);
    return response.content.toString().trim();
  }
}

// Quality evaluator
class QualityEvaluator {
  private model: ChatGroq;

  constructor() {
    this.model = new ChatGroq({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
    });
  }

  async evaluate(
    conversation: ConversationTurn[],
    jobTitle: string,
    candidateLevel: string
  ): Promise<QualityEvaluation> {
    const conversationText = conversation
      .map(turn => `[${turn.speaker.toUpperCase()}${turn.questionNumber ? ` Q${turn.questionNumber}` : ''}]: ${turn.message}`)
      .join('\n\n');

    const prompt = `You are an expert at evaluating interview quality. Analyze this interview conversation for a ${jobTitle} position (${candidateLevel} level).

CONVERSATION:
${conversationText}

Evaluate the INTERVIEWER's performance on these dimensions (1-10 scale):

1. FLOW (1-10): How well did the conversation progress?
   - Were transitions between questions smooth?
   - Did follow-up questions make sense?
   - Was there a logical structure (intro → core → wrap-up)?
   - Were there any awkward repetitions or abrupt changes?

2. NATURALNESS (1-10): How human-like was the interviewer?
   - Did responses feel scripted or authentic?
   - Were acknowledgments appropriate and varied?
   - Did the interviewer adapt to the candidate's responses?
   - Was the tone professional yet personable?

3. RELEVANCE (1-10): How well did questions match the position?
   - Were questions appropriate for a ${candidateLevel} ${jobTitle}?
   - Did questions probe the right skills and experiences?
   - Were technical depth and behavioral questions balanced appropriately?
   - Did the interviewer show understanding of the role requirements?

Respond in JSON format:
{
  "flow": {
    "score": <number 1-10>,
    "reasoning": "<2-3 sentences explaining the score>"
  },
  "naturalness": {
    "score": <number 1-10>,
    "reasoning": "<2-3 sentences explaining the score>"
  },
  "relevance": {
    "score": <number 1-10>,
    "reasoning": "<2-3 sentences explaining the score>"
  },
  "overallScore": <weighted average>,
  "summary": "<3-4 sentence overall assessment>"
}`;

    const response = await this.model.invoke(prompt);
    const content = response.content.toString().trim();
    
    // Strip markdown if present
    let cleaned = content;
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    
    try {
      return JSON.parse(cleaned.trim());
    } catch (e) {
      console.error('Failed to parse evaluation:', content);
      return {
        flow: { score: 0, reasoning: 'Parse error' },
        naturalness: { score: 0, reasoning: 'Parse error' },
        relevance: { score: 0, reasoning: 'Parse error' },
        overallScore: 0,
        summary: 'Failed to parse evaluation response'
      };
    }
  }
}

async function runInterviewTest() {
  console.log('='.repeat(80));
  console.log('INTERVIEW QUALITY TEST');
  console.log('='.repeat(80));
  
  const orchestrator = new InterviewOrchestrator();
  
  // Define job context (Senior Data Scientist at DataViz Pro)
  const jobContext = {
    companyName: "DataViz Pro",
    companyDescription: "A leading data visualization and analytics company helping enterprises make data-driven decisions.",
    jobTitle: "Senior Data Scientist",
    jobRequirements: `
      - 5+ years of experience in data science or machine learning
      - Strong proficiency in Python, scikit-learn, TensorFlow or PyTorch
      - Experience with statistical analysis and A/B testing
      - Ability to communicate findings to non-technical stakeholders
      - Experience building and deploying ML models to production
      - Background in anomaly detection or forecasting preferred
    `,
    candidateCv: `
      ARSEN PETROSYAN
      Senior Data Analyst / ML Engineer
      
      EXPERIENCE:
      Data Scientist at TechCorp (2021-Present)
      - Built predictive models for customer churn reducing attrition by 15%
      - Developed anomaly detection system for fraud prevention
      - Led A/B testing framework for product experiments
      
      Data Analyst at StartupXYZ (2019-2021)
      - Created dashboards and reports for executive team
      - Implemented automated data pipelines using Python
      - Performed statistical analysis on user behavior
      
      SKILLS:
      Python, R, SQL, scikit-learn, TensorFlow, Pandas, Spark
      Statistical Analysis, A/B Testing, Machine Learning
      Data Visualization (Tableau, PowerBI)
      
      EDUCATION:
      M.S. Computer Science, focus on Machine Learning
      B.S. Statistics
    `
  };
  
  // Create simulated candidate
  const candidate = new SimulatedCandidate({
    name: "Arsen",
    yearsExperience: 5,
    skills: ["Python", "Machine Learning", "TensorFlow", "A/B Testing", "Statistical Analysis"],
    background: "Data Scientist at TechCorp with experience in predictive modeling, anomaly detection, and A/B testing. Previously a Data Analyst at StartupXYZ.",
    targetRole: "Senior Data Scientist",
    personality: "Professional, thoughtful, gives specific examples, asks clarifying questions when needed"
  });
  
  const conversation: ConversationTurn[] = [];
  let questionCount = 0;
  
  // Start interview
  console.log('\n--- Starting Interview ---\n');
  
  const { session, greeting, isPreludeMode } = await orchestrator.startInterview(
    1, // userId
    "behavioral",
    "Data Scientist",
    "medium",
    10,
    jobContext,
    "Arsen"
  );
  
  console.log(`[INTERVIEWER - Greeting]: ${greeting}`);
  conversation.push({ speaker: 'interviewer', message: greeting || '' });
  
  // Candidate responds to greeting
  let candidateResponse = await candidate.respond(greeting || '', conversation);
  console.log(`[CANDIDATE]: ${candidateResponse}\n`);
  conversation.push({ speaker: 'candidate', message: candidateResponse });
  
  // Handle prelude (intro exchange)
  if (isPreludeMode) {
    const preludeResult1 = await orchestrator.handlePreludeResponse(session.id, candidateResponse);
    if (preludeResult1.preludeMessage) {
      console.log(`[INTERVIEWER - Intro]: ${preludeResult1.preludeMessage}`);
      conversation.push({ speaker: 'interviewer', message: preludeResult1.preludeMessage });
      
      candidateResponse = await candidate.respond(preludeResult1.preludeMessage, conversation);
      console.log(`[CANDIDATE]: ${candidateResponse}\n`);
      conversation.push({ speaker: 'candidate', message: candidateResponse });
      
      // Another prelude step (self-intro)
      const preludeResult2 = await orchestrator.handlePreludeResponse(session.id, candidateResponse);
      if (preludeResult2.preludeMessage) {
        console.log(`[INTERVIEWER - Self Intro]: ${preludeResult2.preludeMessage}`);
        conversation.push({ speaker: 'interviewer', message: preludeResult2.preludeMessage });
        
        candidateResponse = await candidate.respond(preludeResult2.preludeMessage, conversation);
        console.log(`[CANDIDATE]: ${candidateResponse}\n`);
        conversation.push({ speaker: 'candidate', message: candidateResponse });
        
        // Get first question
        const preludeResult3 = await orchestrator.handlePreludeResponse(session.id, candidateResponse);
        if (preludeResult3.firstQuestion) {
          questionCount++;
          console.log(`[INTERVIEWER - Q${questionCount}]: ${preludeResult3.firstQuestion.questionText}`);
          conversation.push({ 
            speaker: 'interviewer', 
            message: preludeResult3.firstQuestion.questionText,
            questionNumber: questionCount
          });
        }
      }
    }
  }
  
  // Main interview loop - answer questions until interview ends
  const maxQuestions = 8; // Limit for testing
  
  while (questionCount < maxQuestions) {
    // Get current question from session
    const currentSession = await storage.getInterviewSession(session.id);
    if (!currentSession || currentSession.status === 'completed') {
      console.log('\n--- Interview Completed by System ---\n');
      break;
    }
    
    const questions = await storage.getInterviewQuestions(session.id);
    const currentQuestion = questions[questions.length - 1];
    
    if (!currentQuestion) {
      console.log('No current question found');
      break;
    }
    
    // Candidate responds
    candidateResponse = await candidate.respond(currentQuestion.questionText, conversation);
    console.log(`[CANDIDATE]: ${candidateResponse}\n`);
    conversation.push({ speaker: 'candidate', message: candidateResponse });
    
    // Submit answer
    const result = await orchestrator.submitAnswer(session.id, currentQuestion.id, candidateResponse);
    
    if (result.finalReport) {
      console.log('\n--- Final Report Received ---');
      if (result.closure) {
        console.log(`[INTERVIEWER - Closure]: ${result.closure}`);
        conversation.push({ speaker: 'interviewer', message: result.closure });
      }
      break;
    }
    
    if (result.nextQuestion) {
      questionCount++;
      
      // Build the interviewer's response
      let interviewerResponse = '';
      if (result.reflection) {
        interviewerResponse += result.reflection + ' ';
      }
      interviewerResponse += result.nextQuestion.questionText;
      
      console.log(`[INTERVIEWER - Q${questionCount}]: ${interviewerResponse}`);
      conversation.push({ 
        speaker: 'interviewer', 
        message: interviewerResponse,
        questionNumber: questionCount
      });
    }
  }
  
  // Evaluate the conversation
  console.log('\n' + '='.repeat(80));
  console.log('QUALITY EVALUATION');
  console.log('='.repeat(80) + '\n');
  
  const evaluator = new QualityEvaluator();
  const evaluation = await evaluator.evaluate(
    conversation,
    "Senior Data Scientist",
    "Senior"
  );
  
  console.log('FLOW:');
  console.log(`  Score: ${evaluation.flow.score}/10`);
  console.log(`  Reasoning: ${evaluation.flow.reasoning}`);
  
  console.log('\nNATURALNESS:');
  console.log(`  Score: ${evaluation.naturalness.score}/10`);
  console.log(`  Reasoning: ${evaluation.naturalness.reasoning}`);
  
  console.log('\nRELEVANCE:');
  console.log(`  Score: ${evaluation.relevance.score}/10`);
  console.log(`  Reasoning: ${evaluation.relevance.reasoning}`);
  
  console.log('\nOVERALL:');
  console.log(`  Score: ${evaluation.overallScore}/10`);
  console.log(`  Summary: ${evaluation.summary}`);
  
  console.log('\n' + '='.repeat(80));
  console.log('TEST COMPLETE');
  console.log('='.repeat(80));
  
  return evaluation;
}

// Run the test
runInterviewTest()
  .then(evaluation => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
