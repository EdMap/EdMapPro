/**
 * QwQ-32B vs Llama Comparison Test
 * 
 * Compares the interview quality between the two models.
 */

import { ChatGroq } from '@langchain/groq';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

// Samvel's CV
const SAMVEL_CV = `
SAMVEL MKHITARYAN, PhD

HIGHLIGHTS:
• 7+ years in research and program management positions
• 4+ years in data analytics
• 4+ years using Python, R and SQL, Power BI and Tableau
• Working knowledge of Machine Learning and AI
• Knowledge of Apache Spark and PySpark technologies

EXPERIENCE:
2025-Now: Senior Data Scientist at Rabobank, Utrecht, Netherlands
- Applied statistical methods and machine learning to obtain insights from data
- Built, tested and validated predictive models

2018-2022: PhD Candidate, Maastricht University
- Developed computational framework using Fuzzy Cognitive Maps and Machine Learning

2019-2021: Data Analyst at RedKite, Armenia
- Collected and analysed user experience data for a SaaS
- Designed experiments to test new features

EDUCATION:
- PhD, Maastricht University (2018-2022)
- Research Master of Sciences, Tilburg University (2016-2018)
`;

const JOB_REQUIREMENTS = `
- 5+ years of experience in data science or machine learning
- Strong proficiency in Python, scikit-learn, TensorFlow or PyTorch
- Experience with statistical analysis and A/B testing
- Ability to communicate findings to non-technical stakeholders
- Experience building and deploying ML models to production
`;

// Test prompt - interview question generation
const testPrompt = PromptTemplate.fromTemplate(`
You are an HR recruiter preparing for an interview.

CANDIDATE CV:
{cv}

JOB REQUIREMENTS:
{requirements}

Generate 3 interview questions that:
1. Reference specific details from the candidate's CV
2. Are relevant to the job requirements
3. Would help assess the candidate's fit

Format: Return just the 3 questions, numbered.
`);

// Response evaluation prompt
const evaluationPrompt = PromptTemplate.fromTemplate(`
You are evaluating an interview question.

QUESTION: {question}
CANDIDATE ANSWER: {answer}

Evaluate the answer and decide:
1. Was it complete with specific examples? (satisfied)
2. Was it partial - addressed some but missed key aspects? (partial) 
3. Was it vague without specifics? (vague)

If partial or vague, provide a SHORT follow-up question (max 15 words) that probes for specifics.

Output JSON:
{{
  "outcome": "satisfied|partial|vague",
  "followUp": "specific follow-up question if needed"
}}
`);

async function testModel(modelName: string, modelConfig: { temperature: number; top_p?: number }) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${modelName}`);
  console.log(`Config: temperature=${modelConfig.temperature}${modelConfig.top_p ? `, top_p=${modelConfig.top_p}` : ''}`);
  console.log('='.repeat(60));

  const model = new ChatGroq({
    model: modelName,
    temperature: modelConfig.temperature,
    ...(modelConfig.top_p && { topP: modelConfig.top_p }),
  });

  const startTime = Date.now();

  // Test 1: Generate interview questions
  console.log('\n[Test 1] Generating interview questions...');
  const questionChain = testPrompt.pipe(model).pipe(new StringOutputParser());
  
  const questions = await questionChain.invoke({
    cv: SAMVEL_CV,
    requirements: JOB_REQUIREMENTS,
  });

  const questionTime = Date.now() - startTime;
  console.log(`Generated in ${questionTime}ms:`);
  
  // Strip thinking tokens if present (for QwQ)
  let cleanQuestions = questions;
  if (questions.includes('<think>')) {
    const thinkEnd = questions.indexOf('</think>');
    if (thinkEnd !== -1) {
      cleanQuestions = questions.slice(thinkEnd + 8).trim();
      console.log(`[Thinking tokens removed - ${questions.indexOf('</think>')} chars]`);
    }
  }
  console.log(cleanQuestions);

  // Test 2: Evaluate a partial answer
  console.log('\n[Test 2] Evaluating partial answer...');
  const evalStart = Date.now();
  
  const evalChain = evaluationPrompt.pipe(model).pipe(new StringOutputParser());
  
  const evaluation = await evalChain.invoke({
    question: "Can you walk me through your experience with model deployment?",
    answer: "I have experience deploying models at Rabobank using Python.",
  });

  const evalTime = Date.now() - evalStart;
  console.log(`Evaluated in ${evalTime}ms:`);
  
  // Strip thinking tokens
  let cleanEval = evaluation;
  if (evaluation.includes('<think>')) {
    const thinkEnd = evaluation.indexOf('</think>');
    if (thinkEnd !== -1) {
      cleanEval = evaluation.slice(thinkEnd + 8).trim();
      console.log(`[Thinking tokens removed]`);
    }
  }
  // Strip markdown code blocks
  if (cleanEval.startsWith('```json')) cleanEval = cleanEval.slice(7);
  if (cleanEval.startsWith('```')) cleanEval = cleanEval.slice(3);
  if (cleanEval.endsWith('```')) cleanEval = cleanEval.slice(0, -3);
  
  console.log(cleanEval.trim());

  // Test 3: Evaluate a vague answer
  console.log('\n[Test 3] Evaluating vague answer...');
  const vagueStart = Date.now();
  
  const vagueEval = await evalChain.invoke({
    question: "How do you stay up-to-date with ML developments?",
    answer: "I read blogs and papers.",
  });

  const vagueTime = Date.now() - vagueStart;
  console.log(`Evaluated in ${vagueTime}ms:`);
  
  let cleanVague = vagueEval;
  if (vagueEval.includes('<think>')) {
    const thinkEnd = vagueEval.indexOf('</think>');
    if (thinkEnd !== -1) {
      cleanVague = vagueEval.slice(thinkEnd + 8).trim();
      console.log(`[Thinking tokens removed]`);
    }
  }
  if (cleanVague.startsWith('```json')) cleanVague = cleanVague.slice(7);
  if (cleanVague.startsWith('```')) cleanVague = cleanVague.slice(3);
  if (cleanVague.endsWith('```')) cleanVague = cleanVague.slice(0, -3);
  
  console.log(cleanVague.trim());

  const totalTime = Date.now() - startTime;
  console.log(`\nTotal time: ${totalTime}ms`);
  
  return {
    model: modelName,
    questionTime,
    evalTime,
    vagueTime,
    totalTime,
  };
}

async function main() {
  console.log('█'.repeat(60));
  console.log('QwQ-32B vs Llama-3.1-8B Comparison');
  console.log('█'.repeat(60));

  const results: any[] = [];

  try {
    // Test Llama first (smaller, faster)
    const llamaResult = await testModel('llama-3.1-8b-instant', { 
      temperature: 0.3 
    });
    results.push(llamaResult);
  } catch (error: any) {
    console.error('Llama test failed:', error.message);
  }

  try {
    // Test Qwen3-32B (replacement for deprecated qwen-qwq-32b)
    const qwqResult = await testModel('qwen/qwen3-32b', { 
      temperature: 0.6,
      top_p: 0.95,
    });
    results.push(qwqResult);
  } catch (error: any) {
    console.error('Qwen3 test failed:', error.message);
  }

  // Summary
  console.log('\n' + '█'.repeat(60));
  console.log('SUMMARY');
  console.log('█'.repeat(60));
  
  results.forEach(r => {
    console.log(`\n${r.model}:`);
    console.log(`  Question generation: ${r.questionTime}ms`);
    console.log(`  Partial eval: ${r.evalTime}ms`);
    console.log(`  Vague eval: ${r.vagueTime}ms`);
    console.log(`  Total: ${r.totalTime}ms`);
  });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
