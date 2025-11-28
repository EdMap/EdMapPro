/**
 * Interview Quality Test Script
 * 
 * Simulates a candidate going through the interview engine
 * with varied response types and evaluates conversation quality.
 */

import { InterviewOrchestrator } from '../services/interview-orchestrator';
import { ChatGroq } from '@langchain/groq';
import { storage } from '../storage';

interface ConversationTurn {
  speaker: 'interviewer' | 'candidate';
  message: string;
  questionNumber?: number;
  responseType?: 'complete' | 'vague' | 'partial' | 'asks_question';
}

interface QualityEvaluation {
  flow: { score: number; reasoning: string };
  naturalness: { score: number; reasoning: string };
  relevance: { score: number; reasoning: string };
  overallScore: number;
  summary: string;
  improvements: string[];
}

interface IterationResult {
  iteration: number;
  questionCount: number;
  conversation: ConversationTurn[];
  evaluation: QualityEvaluation;
}

// Response type distribution for realistic simulation
type ResponseType = 'complete' | 'vague' | 'partial' | 'asks_question';

function getRandomResponseType(): ResponseType {
  const rand = Math.random();
  if (rand < 0.5) return 'complete';      // 50% complete answers
  if (rand < 0.7) return 'partial';       // 20% partial answers
  if (rand < 0.85) return 'vague';        // 15% vague answers
  return 'asks_question';                  // 15% asks a question back
}

// Samvel's CV content
const SAMVEL_CV = `
SAMVEL MKHITARYAN, PhD

HIGHLIGHTS:
• 7+ years in research and program management positions
• 4+ years in data analytics
• 4+ years using Python, R and SQL, Power BI and Tableau
• Working knowledge of state of the art techniques in Machine Learning and AI
• Knowledge of Apache Spark and PySpark technologies

EXPERIENCE:

2025-Now: Senior Data Scientist at Rabobank, Utrecht, Netherlands
- Applied statistical methods and machine learning to obtain insights from data to inform decision making
- Built, tested and validated predictive models
- Turned data into simple valuable solutions for the business

2018-2022: PhD Candidate, Maastricht University
- Developed a computational framework for analysing behaviour as a system of interdependent components
- Helped stakeholders avoid costly experiments by developing a computational framework for scenario analysis using Fuzzy Cognitive Maps and Machine Learning

2019-2021: Data Analyst at RedKite, Armenia
- Collected and analysed user experience data for a SaaS
- Designed experiments to test the success of new features
- Contributed to the improvement and development of product features

2017: Data Analysis Consultant at UNFPA, Armenia
- Quantitatively evaluated the effectiveness and quality of e-learning modules

2015-2016: Data Analysis Consultant at World Bank, Armenia
- Designed and analysed baseline and follow-up evaluation surveys

2011-2014: Program Manager at UNICEF, Armenia
- Statistics, Monitoring and Evaluation Unit
- Conducted Multiple Overlapping Deprivation Analysis

EDUCATION:
- PhD, Maastricht University (2018-2022)
- Research Master of Sciences, Tilburg University (2016-2018)
- Master of Public Health, American University of Armenia (2013-2015)
- Bachelor's, Psychology, Yerevan State University (2007-2011)

TRAINING:
- Complex System Modeling Winter School at MIT/NECSI (2020)
- Advanced Statistics and Data Mining, Universidad Politécnica de Madrid (2017)
- Big Data on AWS, Pluralsight (2020)

PUBLICATIONS:
- FCMpy: A Python Module for Constructing and Analyzing Fuzzy Cognitive Maps
- How to Use Machine Learning and Fuzzy Cognitive Maps to Test Hypothetical Scenarios
- Dealing with complexity: How to use a hybrid approach to incorporate complexity in health behavior interventions

LANGUAGES: English, Dutch, Russian, Spanish, Armenian
`;

// Simulated candidate with varied response behaviors
class SimulatedCandidate {
  private model: ChatGroq;
  private profile: {
    name: string;
    cv: string;
  };

  constructor(name: string, cv: string) {
    this.profile = { name, cv };
    this.model = new ChatGroq({
      model: "llama-3.1-8b-instant",
      temperature: 0.8,
    });
  }

  async respond(
    interviewerMessage: string, 
    conversationHistory: ConversationTurn[],
    responseType: ResponseType
  ): Promise<string> {
    const historyText = conversationHistory.slice(-6)
      .map(turn => `${turn.speaker === 'interviewer' ? 'Interviewer' : 'You'}: ${turn.message}`)
      .join('\n');

    const responseInstructions = {
      'complete': `Give a COMPLETE answer with ONE specific example. 
        Keep it SHORT: 2-3 sentences max. Be conversational, not formal.
        Example: "Yes, I built a churn model at Rabobank using Python and scikit-learn. It reduced churn by 15%."`,
      
      'vague': `Give a VAGUE, short answer. Be general and non-committal.
        ONE sentence only. No specific examples or numbers.
        Examples: "Yeah, I've worked with that before." or "I have some experience there."`,
      
      'partial': `Give a PARTIAL answer - address part but miss something.
        1-2 sentences. Mention something relevant but leave gaps.
        Example: "I've used Python for ML projects." (missing which projects, outcomes)`,
      
      'asks_question': `Ask a CLARIFYING QUESTION instead of answering.
        1-2 sentences. Show interest but need more context.
        Example: "What kind of scale are we talking about here?"`,
    };

    const prompt = `You are ${this.profile.name}, a candidate in a job interview for a Senior Data Scientist position.

YOUR CV/BACKGROUND:
${this.profile.cv}

CONVERSATION SO FAR:
${historyText}

INTERVIEWER'S LATEST MESSAGE:
${interviewerMessage}

RESPONSE INSTRUCTION (${responseType.toUpperCase()}):
${responseInstructions[responseType]}

Respond naturally as this candidate would, staying authentic to your CV background.
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
      model: "llama-3.1-8b-instant",
      temperature: 0.2,
    });
  }

  async evaluate(
    conversation: ConversationTurn[],
    jobTitle: string,
    candidateLevel: string
  ): Promise<QualityEvaluation> {
    const conversationText = conversation
      .map(turn => {
        const typeLabel = turn.responseType ? ` [${turn.responseType}]` : '';
        return `[${turn.speaker.toUpperCase()}${turn.questionNumber ? ` Q${turn.questionNumber}` : ''}${typeLabel}]: ${turn.message}`;
      })
      .join('\n\n');

    const prompt = `You are an expert at evaluating interview quality. Analyze this interview for a ${jobTitle} position (${candidateLevel} level).

Note: Response types [vague], [partial], [asks_question] indicate intentionally limited candidate answers to test how the interviewer handles them.

CONVERSATION:
${conversationText}

Evaluate the INTERVIEWER's performance:

1. FLOW (1-10): 
   - Were transitions smooth?
   - Did follow-ups make sense after vague/partial answers?
   - Was there logical structure?
   - Any awkward repetitions?

2. NATURALNESS (1-10):
   - Did it feel scripted or authentic?
   - Did interviewer adapt to varied response quality?
   - Were acknowledgments appropriate?
   - Did interviewer probe deeper when answers were vague?

3. RELEVANCE (1-10):
   - Were questions appropriate for ${candidateLevel} ${jobTitle}?
   - Did questions leverage the candidate's specific CV/background?
   - Were technical depth and behavioral questions balanced?

Also provide 3-5 specific improvements to make the flow more like a real interview.

Respond in JSON:
{
  "flow": {"score": <1-10>, "reasoning": "<explanation>"},
  "naturalness": {"score": <1-10>, "reasoning": "<explanation>"},
  "relevance": {"score": <1-10>, "reasoning": "<explanation>"},
  "overallScore": <weighted average>,
  "summary": "<overall assessment>",
  "improvements": ["<improvement 1>", "<improvement 2>", ...]
}`;

    const response = await this.model.invoke(prompt);
    let content = response.content.toString().trim();
    
    // Strip markdown
    if (content.startsWith('```json')) content = content.slice(7);
    else if (content.startsWith('```')) content = content.slice(3);
    if (content.endsWith('```')) content = content.slice(0, -3);
    
    try {
      return JSON.parse(content.trim());
    } catch (e) {
      console.error('Parse error:', content);
      return {
        flow: { score: 0, reasoning: 'Parse error' },
        naturalness: { score: 0, reasoning: 'Parse error' },
        relevance: { score: 0, reasoning: 'Parse error' },
        overallScore: 0,
        summary: 'Failed to parse',
        improvements: []
      };
    }
  }
}

async function runSingleInterview(iteration: number): Promise<IterationResult> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`ITERATION ${iteration}`);
  console.log('='.repeat(80));
  
  const orchestrator = new InterviewOrchestrator();
  
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
    candidateCv: SAMVEL_CV
  };
  
  const candidate = new SimulatedCandidate("Samvel", SAMVEL_CV);
  const conversation: ConversationTurn[] = [];
  let questionCount = 0;
  
  // Start interview
  const { session, greeting, isPreludeMode } = await orchestrator.startInterview(
    1, "behavioral", "Data Scientist", "medium", 10, jobContext, "Samvel"
  );
  
  console.log(`\n[INTERVIEWER - Greeting]: ${greeting}`);
  conversation.push({ speaker: 'interviewer', message: greeting || '' });
  
  // Handle prelude with complete responses (greetings should be natural)
  let candidateResponse = await candidate.respond(greeting || '', conversation, 'complete');
  console.log(`[CANDIDATE]: ${candidateResponse}\n`);
  conversation.push({ speaker: 'candidate', message: candidateResponse, responseType: 'complete' });
  
  if (isPreludeMode) {
    // Intro exchange
    const prelude1 = await orchestrator.handlePreludeResponse(session.id, candidateResponse);
    if (prelude1.preludeMessage) {
      console.log(`[INTERVIEWER]: ${prelude1.preludeMessage}`);
      conversation.push({ speaker: 'interviewer', message: prelude1.preludeMessage });
      
      candidateResponse = await candidate.respond(prelude1.preludeMessage, conversation, 'complete');
      console.log(`[CANDIDATE]: ${candidateResponse}\n`);
      conversation.push({ speaker: 'candidate', message: candidateResponse, responseType: 'complete' });
      
      // Self-intro
      const prelude2 = await orchestrator.handlePreludeResponse(session.id, candidateResponse);
      if (prelude2.preludeMessage) {
        console.log(`[INTERVIEWER]: ${prelude2.preludeMessage}`);
        conversation.push({ speaker: 'interviewer', message: prelude2.preludeMessage });
        
        // First real answer - use varied response
        const responseType = getRandomResponseType();
        candidateResponse = await candidate.respond(prelude2.preludeMessage, conversation, responseType);
        console.log(`[CANDIDATE] (${responseType}): ${candidateResponse}\n`);
        conversation.push({ speaker: 'candidate', message: candidateResponse, responseType });
        
        // Get first question
        const prelude3 = await orchestrator.handlePreludeResponse(session.id, candidateResponse);
        if (prelude3.firstQuestion) {
          questionCount++;
          console.log(`[INTERVIEWER - Q${questionCount}]: ${prelude3.firstQuestion.questionText}`);
          conversation.push({ 
            speaker: 'interviewer', 
            message: prelude3.firstQuestion.questionText,
            questionNumber: questionCount
          });
        }
      }
    }
  }
  
  // Main interview loop
  const maxQuestions = 5;
  
  while (questionCount < maxQuestions) {
    const currentSession = await storage.getInterviewSession(session.id);
    if (!currentSession || currentSession.status === 'completed') break;
    
    const questions = await storage.getInterviewQuestions(session.id);
    const currentQuestion = questions[questions.length - 1];
    if (!currentQuestion) break;
    
    // Varied response type
    const responseType = getRandomResponseType();
    candidateResponse = await candidate.respond(currentQuestion.questionText, conversation, responseType);
    console.log(`[CANDIDATE] (${responseType}): ${candidateResponse}\n`);
    conversation.push({ speaker: 'candidate', message: candidateResponse, responseType });
    
    const result = await orchestrator.submitAnswer(session.id, currentQuestion.id, candidateResponse);
    
    if (result.finalReport) {
      if (result.closure) {
        console.log(`[INTERVIEWER - Closure]: ${result.closure}`);
        conversation.push({ speaker: 'interviewer', message: result.closure });
      }
      break;
    }
    
    if (result.nextQuestion) {
      questionCount++;
      let response = '';
      if (result.reflection) response += result.reflection + ' ';
      response += result.nextQuestion.questionText;
      
      console.log(`[INTERVIEWER - Q${questionCount}]: ${response}`);
      conversation.push({ 
        speaker: 'interviewer', 
        message: response,
        questionNumber: questionCount
      });
    }
  }
  
  // Evaluate
  const evaluator = new QualityEvaluator();
  const evaluation = await evaluator.evaluate(conversation, "Senior Data Scientist", "Senior");
  
  console.log(`\n--- Iteration ${iteration} Scores ---`);
  console.log(`Flow: ${evaluation.flow.score}/10 | Naturalness: ${evaluation.naturalness.score}/10 | Relevance: ${evaluation.relevance.score}/10`);
  console.log(`Overall: ${evaluation.overallScore}/10`);
  
  return { iteration, questionCount, conversation, evaluation };
}

async function runAllIterations() {
  console.log('\n' + '█'.repeat(80));
  console.log('INTERVIEW QUALITY TEST - 5 ITERATIONS');
  console.log('Candidate: Samvel Mkhitaryan, PhD (Senior Data Scientist at Rabobank)');
  console.log('Position: Senior Data Scientist at DataViz Pro');
  console.log('█'.repeat(80));
  
  const results: IterationResult[] = [];
  
  for (let i = 1; i <= 3; i++) {
    try {
      const result = await runSingleInterview(i);
      results.push(result);
      
      // Brief pause between iterations
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: any) {
      console.error(`\nIteration ${i} failed:`, error.message);
      if (error.message?.includes('Rate limit')) {
        console.log('Rate limit hit - stopping test');
        break;
      }
    }
  }
  
  // Aggregate results
  console.log('\n' + '█'.repeat(80));
  console.log('AGGREGATE RESULTS');
  console.log('█'.repeat(80));
  
  if (results.length === 0) {
    console.log('No successful iterations');
    return;
  }
  
  const avgFlow = results.reduce((sum, r) => sum + r.evaluation.flow.score, 0) / results.length;
  const avgNatural = results.reduce((sum, r) => sum + r.evaluation.naturalness.score, 0) / results.length;
  const avgRelevance = results.reduce((sum, r) => sum + r.evaluation.relevance.score, 0) / results.length;
  const avgOverall = results.reduce((sum, r) => sum + r.evaluation.overallScore, 0) / results.length;
  
  console.log(`\nAVERAGE SCORES (${results.length} iterations):`);
  console.log(`  Flow:        ${avgFlow.toFixed(1)}/10`);
  console.log(`  Naturalness: ${avgNatural.toFixed(1)}/10`);
  console.log(`  Relevance:   ${avgRelevance.toFixed(1)}/10`);
  console.log(`  Overall:     ${avgOverall.toFixed(1)}/10`);
  
  // Collect all improvements
  const allImprovements = results.flatMap(r => r.evaluation.improvements);
  const improvementCounts = new Map<string, number>();
  allImprovements.forEach(imp => {
    const key = imp.toLowerCase().slice(0, 50);
    improvementCounts.set(key, (improvementCounts.get(key) || 0) + 1);
  });
  
  console.log('\nTOP IMPROVEMENTS SUGGESTED:');
  results.forEach((r, i) => {
    console.log(`\n  Iteration ${i + 1}:`);
    r.evaluation.improvements.forEach((imp, j) => {
      console.log(`    ${j + 1}. ${imp}`);
    });
  });
  
  console.log('\nSUMMARIES:');
  results.forEach((r, i) => {
    console.log(`  [${i + 1}] ${r.evaluation.summary}`);
  });
  
  // Check for CV knowledge usage
  console.log('\n' + '-'.repeat(80));
  console.log('CV KNOWLEDGE CHECK:');
  console.log('-'.repeat(80));
  
  const cvKeywords = ['Rabobank', 'Maastricht', 'PhD', 'Fuzzy Cognitive Maps', 'FCMpy', 'UNICEF', 'UNFPA', 'RedKite', 'PySpark', 'Armenia'];
  
  results.forEach((r, i) => {
    const interviewerMessages = r.conversation
      .filter(t => t.speaker === 'interviewer')
      .map(t => t.message)
      .join(' ');
    
    const usedKeywords = cvKeywords.filter(kw => 
      interviewerMessages.toLowerCase().includes(kw.toLowerCase())
    );
    
    console.log(`  Iteration ${i + 1}: CV references used: ${usedKeywords.length > 0 ? usedKeywords.join(', ') : 'None detected'}`);
  });
  
  console.log('\n' + '█'.repeat(80));
  console.log('TEST COMPLETE');
  console.log('█'.repeat(80));
}

runAllIterations()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
