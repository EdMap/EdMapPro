# Team Interview Product Specification

## Overview

The Team Interview is a distinct interview type that simulates meeting potential teammates. Unlike HR Screening (which focuses on background verification, culture fit, and logistics), Team Interviews assess how candidates would collaborate, problem-solve, and communicate with the people they'd work alongside.

**Key Differentiator:** Multi-persona interviewers + scenario-based questions + level-calibrated difficulty

---

## Level Calibration System

All team interviews automatically adapt based on the job posting's experience level.

### Level Definitions

| Level | Target Candidate | Core Assessment Focus |
|-------|------------------|----------------------|
| **Intern** | Students, bootcamp grads, career changers | Learning ability, curiosity, collaboration basics |
| **Junior** | 0-2 years experience | Practical skills, problem-solving fundamentals, growth mindset |
| **Mid** | 2-5 years experience | Independent execution, debugging depth, code quality |
| **Senior** | 5-8 years experience | System thinking, mentorship, technical leadership |
| **Lead** | 8+ years experience | Architecture, team scaling, cross-org influence |

---

## Intern-Level Team Interview (Priority)

### Interviewer Personas

**Primary:** Peer teammate (fellow junior/mid developer)
- Friendly, approachable tone
- Shares relatable experiences
- Asks about learning and collaboration

**Secondary:** Tech lead (brief appearance)
- Supportive, mentorship-oriented
- Focuses on potential over polish
- Asks about how they handle challenges

### Question Categories

#### 1. Learning & Growth (40% of interview)
- "How do you approach learning something completely new?"
- "Tell me about a time you were stuck on a problem. What did you do?"
- "What's something technical you taught yourself recently?"
- "How do you decide when to keep trying vs. ask for help?"

#### 2. Collaboration Basics (30% of interview)
- "How would you work with a teammate on a shared task?"
- "If you disagreed with a teammate's approach, how would you handle it?"
- "What does good communication look like when working on code together?"
- "How do you prefer to receive feedback on your work?"

#### 3. Technical Fundamentals (20% of interview)
- "Walk me through how you'd debug a simple issue"
- "What questions would you ask before starting a new task?"
- "How do you organize your work when you have multiple things to do?"

#### 4. Curiosity & Questions (10% of interview)
- "What questions do you have about working on our team?"
- "What would you want to learn in your first month?"

### What We Explicitly Avoid (Intern Level)
- System design or architecture questions
- Questions about leading teams or mentoring others
- Production incident management scenarios
- Complex trade-off discussions
- Questions assuming years of industry experience

### Evaluation Rubric (Intern)

| Criterion | Weight | What "Good" Looks Like |
|-----------|--------|------------------------|
| Learning Mindset | 35% | Shows curiosity, asks clarifying questions, admits knowledge gaps honestly |
| Collaboration | 30% | Communicates clearly, open to feedback, thinks about teammates |
| Problem-Solving Approach | 25% | Has a logical process, knows when to ask for help |
| Technical Foundations | 10% | Basic understanding, doesn't need to be polished |

### Sample Artifacts (Intern Level)

**Simple Code Snippet:**
```javascript
function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i <= items.length; i++) {
    total += items[i].price;
  }
  return total;
}
// "Can you spot any issues with this code?"
```

**Basic Task Scenario:**
"You're assigned a ticket to add a 'forgot password' button to the login page. What questions would you ask before starting?"

---

## Junior-Level Team Interview

### Interviewer Personas
- **Peer engineer** (mid-level): Collegial, asks about practical skills
- **Tech lead**: Evaluates problem-solving depth

### Question Focus
- More hands-on debugging scenarios
- Code review discussions
- Basic architectural awareness
- Independent task execution

### Evaluation Adjustments
- Higher expectations for technical foundations
- Still values growth mindset
- Looks for ability to work independently with guidance

---

## Mid-Level Team Interview

### Interviewer Personas
- **Senior engineer**: Peer-to-peer discussion
- **Tech lead**: Probes technical decisions
- **Product partner** (optional): Tests cross-functional collaboration

### Question Focus
- Debugging complex issues
- Code quality and maintainability
- Estimation and prioritization
- Mentoring junior teammates

### Evaluation Adjustments
- Expects solid technical depth
- Values ownership and delivery
- Looks for emerging leadership

---

## Senior-Level Team Interview

### Interviewer Personas
- **Tech lead**: Deep technical probing
- **Engineering manager**: Leadership and influence
- **Product partner**: Strategic collaboration

### Question Focus
- System design and trade-offs
- Technical decision-making
- Mentorship and team growth
- Cross-team collaboration
- Handling ambiguity

### Evaluation Adjustments
- Expects strategic thinking
- Values influence and mentorship
- Looks for architectural judgment

---

## Lead-Level Team Interview

### Interviewer Personas
- **Engineering director**: Organizational thinking
- **Staff engineer**: Technical vision
- **Product leader**: Business alignment

### Question Focus
- Scaling teams and systems
- Cross-organizational influence
- Technical strategy and vision
- Building engineering culture

### Evaluation Adjustments
- Expects executive-level thinking
- Values organizational impact
- Looks for vision and influence

---

## Multi-Persona Interaction Flow

### How Persona Switching Works

1. **Opening:** Primary persona introduces themselves and the format
2. **Core questions:** Personas take turns based on question category
3. **Transitions:** Natural handoffs ("Marcus, did you want to ask about...")
4. **Closing:** Primary persona wraps up, invites candidate questions

### Example Flow (Intern Level)

```
[Sarah - Tech Lead]
"Hi! I'm Sarah, the tech lead. You'll also be chatting with Marcus, 
one of our developers. We want to get to know how you work and learn. 
Marcus, want to kick us off?"

[Marcus - Peer Engineer]  
"Hey! So I'm curious - when you're learning something new, like a 
framework you've never used, how do you typically approach it?"

... conversation continues ...

[Marcus]
"That makes sense. Sarah, did you want to ask about the debugging side?"

[Sarah]
"Yeah! So imagine you're working on a bug and you've been stuck for 
about an hour. Walk me through what you'd do."
```

---

## Technical Implementation Notes

### Schema Changes
- Add `experienceLevel` to interview config (read from job posting)
- Add `teamInterviewSettings` with persona roster and scenario type
- Add level-specific question banks
- Add level-calibrated evaluation rubrics

### Chain Modifications
- Unified chain receives experience level in context
- Prompt adapts question complexity based on level
- Evaluation expectations adjust per level
- Persona labels prepended to responses

### Backward Compatibility
- Existing HR screening interviews unchanged
- Team interview type gets new behavior
- Feature flag for gradual rollout

---

## Success Metrics

1. **Differentiation:** Users can clearly distinguish team vs. HR interviews
2. **Level appropriateness:** Interns don't get senior-level questions
3. **Engagement:** Multi-persona format feels realistic
4. **Learning value:** Users report practicing relevant skills

---

## Implementation Phases

### Phase 1: Intern Team Interview
- Implement level-calibrated questions for intern level
- Add peer engineer + tech lead personas
- Basic artifact support (code snippets)
- Adjusted evaluation rubric

### Phase 2: Junior/Mid Levels
- Expand question banks
- Add more complex artifacts
- Refine persona behaviors

### Phase 3: Senior/Lead Levels
- System design scenarios
- Strategic discussion flows
- Panel interview dynamics
