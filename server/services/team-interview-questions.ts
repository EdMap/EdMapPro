import { ExperienceLevel, TeamInterviewPersona } from '@shared/schema';

export interface TeamInterviewQuestion {
  id: string;
  category: 'learning' | 'collaboration' | 'technical' | 'curiosity';
  personaRole: string; // Which persona typically asks this
  question: string;
  followUps: string[]; // Possible follow-up questions
  lookingFor: string[]; // What a good answer includes
  redFlags: string[]; // Warning signs in answers
  sampleArtifact?: string; // Optional code/scenario to discuss
}

export const INTERN_QUESTIONS: TeamInterviewQuestion[] = [
  // LEARNING & GROWTH (40% of interview)
  {
    id: 'intern_learn_1',
    category: 'learning',
    personaRole: 'peer_engineer',
    question: "When you're learning something completely new - like a framework or language you've never used - how do you typically approach it?",
    followUps: [
      "Can you give me a specific example of when you did this?",
      "What resources do you find most helpful?",
      "How do you know when you've learned enough to start building?",
    ],
    lookingFor: [
      'Has a structured approach (docs, tutorials, small projects)',
      'Mentions hands-on practice',
      'Shows awareness of different learning resources',
      'Balances learning and doing',
    ],
    redFlags: [
      'Only mentions watching videos passively',
      'No concrete examples',
      'Claims to never struggle with learning',
    ],
  },
  {
    id: 'intern_learn_2',
    category: 'learning',
    personaRole: 'tech_lead',
    question: "Tell me about a time you were stuck on a problem for a while. What did you do?",
    followUps: [
      "At what point did you decide to ask for help?",
      "Looking back, would you do anything differently?",
      "What did you learn from that experience?",
    ],
    lookingFor: [
      'Tried multiple approaches before giving up',
      'Knows when to ask for help (not too early, not too late)',
      'Can articulate what they tried',
      'Learned something from the experience',
    ],
    redFlags: [
      'Immediately asks for help without trying',
      'Spends days stuck without seeking help',
      'Gets frustrated and gives up',
      'Blames tools or others',
    ],
  },
  {
    id: 'intern_learn_3',
    category: 'learning',
    personaRole: 'peer_engineer',
    question: "What's something technical you've taught yourself recently? Walk me through how you learned it.",
    followUps: [
      "What made you interested in learning that?",
      "What was the hardest part?",
      "Have you used it in a project yet?",
    ],
    lookingFor: [
      'Shows genuine curiosity',
      'Can explain their learning process',
      'Applied what they learned',
      'Specific about what they learned',
    ],
    redFlags: [
      'Can not name anything specific',
      'Only learns what is required for class',
      'Vague about details',
    ],
  },
  {
    id: 'intern_learn_4',
    category: 'learning',
    personaRole: 'tech_lead',
    question: "How do you decide when to keep trying on your own versus asking for help?",
    followUps: [
      "Is there a time limit you set for yourself?",
      "How do you prepare before asking someone for help?",
      "What makes a good question when asking for help?",
    ],
    lookingFor: [
      'Has a reasonable threshold (15-30 min for simple, longer for complex)',
      'Documents what they tried before asking',
      'Asks specific questions, not "it doesn not work"',
      'Respects others time',
    ],
    redFlags: [
      'No sense of when to escalate',
      'Expects others to solve problems for them',
      'Asks vague questions without context',
    ],
  },

  // COLLABORATION BASICS (30% of interview)
  {
    id: 'intern_collab_1',
    category: 'collaboration',
    personaRole: 'peer_engineer',
    question: "Imagine you're working on a shared codebase with a teammate. How would you coordinate your work to avoid stepping on each other's toes?",
    followUps: [
      "What if you accidentally made conflicting changes?",
      "How would you communicate what you're working on?",
      "Have you used version control for group projects before?",
    ],
    lookingFor: [
      'Mentions communication (standups, chat, etc.)',
      'Understands version control basics',
      'Proactive about updates',
      'Thinks about impact on others',
    ],
    redFlags: [
      'Works in isolation without updates',
      'Does not understand why coordination matters',
      'Assumes conflicts will not happen',
    ],
  },
  {
    id: 'intern_collab_2',
    category: 'collaboration',
    personaRole: 'tech_lead',
    question: "If you disagreed with how a teammate wanted to solve a problem, how would you handle it?",
    followUps: [
      "What if they were more senior than you?",
      "How would you make your case?",
      "What if they still disagreed after you explained?",
    ],
    lookingFor: [
      'Seeks to understand their perspective first',
      'Explains their reasoning respectfully',
      'Open to being wrong',
      'Focuses on the best solution, not winning',
    ],
    redFlags: [
      'Avoids conflict entirely',
      'Insists they are right without listening',
      'Would just do it their way anyway',
    ],
  },
  {
    id: 'intern_collab_3',
    category: 'collaboration',
    personaRole: 'peer_engineer',
    question: "How do you prefer to receive feedback on your code or work?",
    followUps: [
      "Can you tell me about a time you got tough feedback?",
      "What kind of feedback is most helpful to you?",
      "How do you give feedback to others?",
    ],
    lookingFor: [
      'Open to constructive criticism',
      'Sees feedback as learning opportunity',
      'Can separate ego from work',
      'Appreciates specific feedback over vague',
    ],
    redFlags: [
      'Gets defensive about feedback',
      'Only wants positive feedback',
      'Takes criticism personally',
    ],
  },
  {
    id: 'intern_collab_4',
    category: 'collaboration',
    personaRole: 'tech_lead',
    question: "What does good communication look like when you're working on code with someone else?",
    followUps: [
      "How often should you sync with teammates?",
      "What information is important to share?",
      "How do you handle async communication?",
    ],
    lookingFor: [
      'Mentions regular check-ins',
      'Shares blockers proactively',
      'Clear about what they are working on',
      'Responsive to messages',
    ],
    redFlags: [
      'Goes silent for long periods',
      'Only communicates when asked',
      'Does not see value in updates',
    ],
  },

  // TECHNICAL FUNDAMENTALS (20% of interview)
  {
    id: 'intern_tech_1',
    category: 'technical',
    personaRole: 'peer_engineer',
    question: "Walk me through how you'd approach debugging a simple issue - say, a button on a webpage that doesn't work when clicked.",
    followUps: [
      "What tools would you use?",
      "How would you narrow down where the problem is?",
      "What if the console showed no errors?",
    ],
    lookingFor: [
      'Checks browser console for errors',
      'Inspects the element',
      'Looks at event handlers',
      'Systematic approach (not random changes)',
    ],
    redFlags: [
      'Random trial and error only',
      'Does not know about browser dev tools',
      'Gives up quickly without investigating',
    ],
    sampleArtifact: `// This button should show an alert when clicked, but it doesn't work
<button onclick="showMessage()">Click me</button>

<script>
function showMessge() {
  alert("Hello!");
}
</script>`,
  },
  {
    id: 'intern_tech_2',
    category: 'technical',
    personaRole: 'tech_lead',
    question: "Before starting a new coding task, what questions would you want answered first?",
    followUps: [
      "What if some requirements were unclear?",
      "How do you handle ambiguity?",
      "When would you start coding vs. ask more questions?",
    ],
    lookingFor: [
      'Asks about expected behavior',
      'Clarifies edge cases',
      'Understands the "why" not just the "what"',
      'Checks for existing similar code',
    ],
    redFlags: [
      'Just starts coding immediately',
      'Assumes they understand everything',
      'Does not think about edge cases',
    ],
  },
  {
    id: 'intern_tech_3',
    category: 'technical',
    personaRole: 'peer_engineer',
    question: "How do you keep your code organized when working on a larger project?",
    followUps: [
      "How do you name things?",
      "What makes code easy to read?",
      "How do you decide when to break something into smaller pieces?",
    ],
    lookingFor: [
      'Meaningful variable/function names',
      'Breaks code into functions',
      'Comments when necessary',
      'Some awareness of structure',
    ],
    redFlags: [
      'Everything in one giant file',
      'Single-letter variable names everywhere',
      'No concept of organization',
    ],
  },

  // CURIOSITY & QUESTIONS (10% of interview)
  {
    id: 'intern_curiosity_1',
    category: 'curiosity',
    personaRole: 'tech_lead',
    question: "What questions do you have about our team or how we work?",
    followUps: [],
    lookingFor: [
      'Asks about learning opportunities',
      'Interested in team dynamics',
      'Curious about the work itself',
      'Thoughtful, prepared questions',
    ],
    redFlags: [
      'No questions at all',
      'Only asks about time off/perks',
      'Questions show no research',
    ],
  },
  {
    id: 'intern_curiosity_2',
    category: 'curiosity',
    personaRole: 'peer_engineer',
    question: "What would you want to learn in your first month here?",
    followUps: [
      "How would you go about learning that?",
      "What's your biggest growth area right now?",
    ],
    lookingFor: [
      'Specific learning goals',
      'Realistic expectations',
      'Eager but humble',
      'Relevant to the role',
    ],
    redFlags: [
      'No thoughts on development',
      'Unrealistic expectations (lead the team quickly)',
      'Only interested in one narrow thing',
    ],
  },
];

export const JUNIOR_QUESTIONS: TeamInterviewQuestion[] = [
  {
    id: 'junior_tech_1',
    category: 'technical',
    personaRole: 'peer_engineer',
    question: "Tell me about a bug you've debugged that took a while to find. What was your process?",
    followUps: [
      "What made it tricky?",
      "What tools did you use?",
      "How did you prevent it from happening again?",
    ],
    lookingFor: [
      'Systematic debugging process',
      'Uses appropriate tools',
      'Documents findings',
      'Thinks about prevention',
    ],
    redFlags: [
      'No real debugging experience',
      'Random trial and error only',
      'Cannot explain their process',
    ],
  },
  {
    id: 'junior_collab_1',
    category: 'collaboration',
    personaRole: 'tech_lead',
    question: "How do you handle code reviews - both giving and receiving them?",
    followUps: [
      "What makes a helpful code review comment?",
      "How do you respond to feedback you disagree with?",
    ],
    lookingFor: [
      'Sees code review as learning',
      'Gives constructive feedback',
      'Separates ego from code',
    ],
    redFlags: [
      'Gets defensive',
      'Harsh or unconstructive feedback',
      'Rubber-stamps everything',
    ],
  },
];

export function getQuestionsForLevel(level: ExperienceLevel): TeamInterviewQuestion[] {
  switch (level) {
    case 'intern':
      return INTERN_QUESTIONS;
    case 'junior':
      return [...JUNIOR_QUESTIONS, ...INTERN_QUESTIONS.filter(q => 
        q.category === 'collaboration' || q.category === 'learning'
      )];
    default:
      return INTERN_QUESTIONS;
  }
}

export function getQuestionsForPersona(
  questions: TeamInterviewQuestion[],
  persona: TeamInterviewPersona
): TeamInterviewQuestion[] {
  return questions.filter(q => 
    q.personaRole === persona.role || persona.focusAreas.includes(q.category)
  );
}

export function selectQuestionsForInterview(
  level: ExperienceLevel,
  weights: { learning: number; collaboration: number; technical: number; curiosity: number },
  maxQuestions: number
): TeamInterviewQuestion[] {
  const allQuestions = getQuestionsForLevel(level);
  const selected: TeamInterviewQuestion[] = [];
  
  const categories: Array<'learning' | 'collaboration' | 'technical' | 'curiosity'> = 
    ['learning', 'collaboration', 'technical', 'curiosity'];
  
  for (const category of categories) {
    const categoryQuestions = allQuestions.filter(q => q.category === category);
    const targetCount = Math.round((weights[category] / 100) * maxQuestions);
    
    const shuffled = categoryQuestions.sort(() => Math.random() - 0.5);
    selected.push(...shuffled.slice(0, targetCount));
  }
  
  return selected.slice(0, maxQuestions);
}
