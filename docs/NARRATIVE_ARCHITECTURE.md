# Narrative Architecture Specification

## Overview

This document defines how the edmap Workspace Simulator assembles narrative experiences from the catalogue, connecting job postings to project templates and orchestrating the user's journey from hire to junior-ready.

---

## High-Level Journey Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        COMPLETE USER JOURNEY                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  JOB BOARD                                                               │
│      ↓                                                                   │
│  APPLICATION & INTERVIEW (Interview Simulator)                           │
│      ↓                                                                   │
│  OFFER ACCEPTANCE                                                        │
│      ↓                                                                   │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    WORKSPACE SIMULATOR                              │ │
│  │                                                                      │ │
│  │   ONBOARDING ARC (Week 1)                                           │ │
│  │   ├── Day 1: Team intros, documentation                             │ │
│  │   ├── Day 2-3: Dev environment setup, first ticket                  │ │
│  │   ├── Day 4-5: Code review feedback, iteration                      │ │
│  │   └── 1:1 with Manager                                              │ │
│  │                                                                      │ │
│  │   SPRINT ARC 1 (Week 2-3)                                           │ │
│  │   ├── Sprint Planning                                               │ │
│  │   ├── Daily Standups (5-10)                                         │ │
│  │   ├── Working the Board (tickets, PRs, reviews)                     │ │
│  │   ├── Mid-sprint adjustment (optional event)                        │ │
│  │   ├── Sprint Review                                                 │ │
│  │   ├── Sprint Retrospective                                          │ │
│  │   └── 1:1 with Manager                                              │ │
│  │                                                                      │ │
│  │   SPRINT ARC 2 (Week 4-5) - Higher complexity                       │ │
│  │   ├── [Same ceremony structure]                                     │ │
│  │   └── + Production incident, cross-team collab                      │ │
│  │                                                                      │ │
│  │   SPRINT ARC N... (as needed for progression)                       │ │
│  │                                                                      │ │
│  │   OFFBOARDING ARC (Final Week)                                      │ │
│  │   ├── Final evaluation                                              │ │
│  │   ├── Portfolio compilation                                         │ │
│  │   └── Readiness assessment                                          │ │
│  │                                                                      │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│      ↓                                                                   │
│  JUNIOR READY (Badge + Portfolio)                                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Arc

The top-level narrative container. Each journey consists of multiple arcs.

```typescript
interface Arc {
  id: string;
  type: 'onboarding' | 'sprint' | 'offboarding';
  order: number;                    // Sequence in journey (1, 2, 3...)
  name: string;                     // "Onboarding", "Sprint 1", etc.
  duration: {
    days: number;                   // e.g., 5 days for onboarding
    estimatedHours: number;         // Real user time: ~2-4 hours
  };
  difficultyBand: 'guided' | 'supported' | 'independent';
  projectTemplateId: string;        // Links to project template
  softSkillHooks: SoftSkillHook[];  // Injected challenges
  competencyFocus: string[];        // Primary competencies developed
  days: Day[];
}
```

### SprintArc (extends Arc)

Sprint-specific structure following Scrum ceremonies.

```typescript
interface SprintArc extends Arc {
  type: 'sprint';
  sprintNumber: number;
  sprintGoal: string;               // One-sentence objective
  backlogItems: BacklogItem[];      // Selected work for this sprint
  ceremonies: {
    planning: SprintPlanningCeremony;
    standups: StandupCeremony[];
    review: SprintReviewCeremony;
    retrospective: RetrospectiveCeremony;
    managerOneOnOne: OneOnOneCeremony;
  };
  midSprintEvents: MidSprintEvent[]; // Optional disruptions/adjustments
  storyPointsTarget: number;         // Increases with progression
}
```

### Day

A single simulation day within an arc.

```typescript
interface Day {
  dayNumber: number;                // Day within the arc
  theme: string;                    // "First Ticket", "Code Review Day"
  activities: Activity[];
  softSkillTriggers: SoftSkillTrigger[];  // Events that might fire
  requiredForProgression: string[]; // Must complete to advance
}
```

### Activity

A single interactive unit within a day.

```typescript
interface Activity {
  id: string;
  type: ActivityType;
  name: string;
  description: string;
  ceremonyType?: CeremonyType;      // If part of a Scrum ceremony
  
  // Content sources
  scriptedAssets: CatalogueReference[];  // Pre-authored content
  aiOrchestration: AIOrchestrationConfig;
  
  // Progression
  competencyTags: string[];         // Skills practiced
  estimatedMinutes: number;
  isRequired: boolean;
  
  // Branching
  branchingRules?: BranchingRule[]; // Conditional paths
  
  // Outputs
  producesArtifact?: ArtifactType;  // PR, document, etc.
}

type ActivityType = 
  | 'team_chat'
  | 'documentation_reading'
  | 'standup_meeting'
  | 'sprint_planning'
  | 'ticket_work'
  | 'code_exercise'
  | 'code_review'
  | 'pr_creation'
  | 'demo_presentation'
  | 'retrospective'
  | 'one_on_one'
  | 'incident_response'
  | 'reflection';

type CeremonyType =
  | 'sprint_planning'
  | 'daily_standup'
  | 'sprint_review'
  | 'sprint_retrospective'
  | 'manager_1_1';
```

---

## Job Posting → Project Template Connection

### Extended Job Posting Model

```typescript
interface JobPostingNarrativeProfile {
  // Existing fields from jobPostings table...
  
  // New narrative fields
  projectTemplateId: string;        // Which project template to use
  narrativeContext: {
    industry: string;               // 'fintech', 'social', 'ecommerce', 'healthcare'
    domain: string;                 // 'payments', 'messaging', 'inventory'
    teamTopology: string;           // 'startup', 'enterprise', 'agency'
    sprintCadence: number;          // 1 or 2 week sprints
    techStack: string[];            // ['react', 'node', 'postgres']
  };
  journeyLength: {
    minSprints: number;             // Minimum sprints to complete
    maxSprints: number;             // Maximum before forced graduation
  };
}
```

### Project Template

Defines the simulated company/project environment.

```typescript
interface ProjectTemplate {
  id: string;
  name: string;                     // "NovaPay", "ChatFlow", "ShopStack"
  description: string;
  
  // Team Configuration
  team: {
    members: TeamMemberTemplate[];
    dynamicRoles: string[];         // AI can generate additional team members
  };
  
  // Codebase Configuration
  codebase: {
    structure: CodebaseStructure;
    keyFiles: FileTemplate[];
    bugPatterns: BugPattern[];      // Types of bugs that can occur
    testingFramework: string;
  };
  
  // Backlog Configuration
  backlog: {
    themes: BacklogTheme[];         // Feature areas
    bugTemplates: BugTemplate[];
    featureTemplates: FeatureTemplate[];
    incidentTemplates: IncidentTemplate[];
  };
  
  // Soft Skill Scenarios
  softSkillPacks: {
    conflicts: ConflictScenario[];
    feedbackSituations: FeedbackScenario[];
    deadlinePressure: PressureScenario[];
    ambiguousRequirements: AmbiguityScenario[];
  };
  
  // Documentation
  documentation: {
    productDocs: DocumentTemplate[];
    teamDocs: DocumentTemplate[];
    technicalDocs: DocumentTemplate[];
  };
  
  // Catalogue References
  catalogueAssets: {
    onboarding: string[];           // Catalogue IDs for onboarding content
    sprints: string[];              // Catalogue IDs for sprint content
    ceremonies: string[];           // Catalogue IDs for ceremony scripts
  };
}
```

### Example Project Templates

| Template | Industry | Domain | Suitable For |
|----------|----------|--------|--------------|
| NovaPay | Fintech | Payments | Developer, QA |
| ChatFlow | Social | Messaging | Developer, DevOps |
| ShopStack | E-commerce | Inventory | Developer, PM |
| HealthTrack | Healthcare | Patient Records | Developer, QA |
| DataPulse | Analytics | Dashboards | Data Science, Developer |

---

## Sprint Ceremony Details

### 1. Sprint Planning

```typescript
interface SprintPlanningCeremony {
  duration: '30-60 minutes';        // Simulated as ~10-15 min real time
  
  phases: {
    backlogReview: {
      // PM presents prioritized backlog
      scriptedContent: 'backlog_presentation_script';
      userInteraction: 'ask_questions' | 'raise_concerns';
    };
    
    taskSelection: {
      // Team discusses and selects items
      availableItems: BacklogItem[];
      userRole: 'participant' | 'selector';
      aiDiscussion: true;           // AI team members debate priorities
    };
    
    taskBreakdown: {
      // Break selected items into subtasks
      selectedItem: BacklogItem;
      userCreatesSubtasks: boolean;
      aiSuggestions: boolean;
    };
    
    commitment: {
      // Team commits to sprint goal
      sprintGoalOptions: string[];
      userVotes: boolean;
    };
  };
  
  outputs: {
    sprintGoal: string;
    sprintBacklog: BacklogItem[];
    userAssignedTickets: Ticket[];
  };
  
  competencies: ['planning', 'estimation', 'communication'];
}
```

### 2. Daily Standup

```typescript
interface StandupCeremony {
  duration: '5-10 minutes';
  dayInSprint: number;
  
  format: {
    // Each team member shares (AI-generated based on sprint progress)
    teamUpdates: StandupUpdate[];
    
    // User shares their update
    userUpdate: {
      promptFor: ['yesterday', 'today', 'blockers'];
      evaluateQuality: boolean;     // AI assesses update quality
    };
    
    // Optional follow-up discussion
    discussion?: {
      topic: string;
      aiInitiated: boolean;
    };
  };
  
  // Soft skill injection points
  softSkillTriggers: {
    blockerEscalation?: BlockerScenario;
    scopeCreep?: ScopeCreepScenario;
    conflictSurface?: ConflictScenario;
  };
  
  competencies: ['communication', 'status_reporting', 'blocker_identification'];
}
```

### 3. Working the Sprint Board

```typescript
interface SprintBoardWork {
  // This is the main "work" phase between ceremonies
  
  ticketFlow: {
    columns: ['to_do', 'in_progress', 'review', 'qa', 'done'];
    userTickets: Ticket[];
    
    // Each ticket has activities
    ticketActivities: {
      understand: 'read_requirements' | 'ask_questions';
      implement: 'code_exercise' | 'configuration';
      test: 'write_tests' | 'manual_testing';
      submit: 'create_pr' | 'request_review';
      iterate: 'address_feedback' | 'fix_bugs';
    };
  };
  
  collaboration: {
    codeReviews: {
      receive: CodeReviewFeedback[];  // AI reviews user's code
      give: CodeReviewTask[];         // User reviews AI's code
    };
    
    pairProgramming?: {
      partner: TeamMember;
      scenario: PairingScenario;
    };
    
    qaHandoff: {
      writeTestCases: boolean;
      respondToBugs: BugReport[];
    };
  };
  
  // Mid-sprint events (randomly triggered)
  possibleEvents: {
    productionIncident: IncidentScenario;
    requirementChange: ChangeScenario;
    teamMemberOutage: CoverageScenario;
    urgentBugfix: HotfixScenario;
  };
}
```

### 4. Sprint Review

```typescript
interface SprintReviewCeremony {
  duration: '15-20 minutes';
  
  phases: {
    demo: {
      // User presents completed work
      userDemos: CompletedTicket[];
      audienceQuestions: ReviewQuestion[];  // AI stakeholders ask questions
      feedbackReceived: ReviewFeedback[];
    };
    
    teamDemos: {
      // AI team members present their work
      presentations: TeamPresentation[];
      userCanAsk: boolean;
    };
    
    backlogAdjustment: {
      // PM adjusts priorities based on feedback
      priorityChanges: PriorityChange[];
      userInput: 'suggest' | 'observe';
    };
  };
  
  competencies: ['presentation', 'demo_skills', 'stakeholder_communication'];
}
```

### 5. Sprint Retrospective

```typescript
interface RetrospectiveCeremony {
  duration: '15-20 minutes';
  
  format: {
    whatWentWell: {
      teamInputs: RetroItem[];      // AI team shares
      userContributes: boolean;
    };
    
    whatDidntGoWell: {
      teamInputs: RetroItem[];
      userContributes: boolean;
      // Soft skill: handling criticism, giving constructive feedback
    };
    
    improvements: {
      suggestions: ImprovementSuggestion[];
      voting: boolean;
      actionItems: ActionItem[];    // 1-2 items for next sprint
    };
  };
  
  // The retro can surface competency gaps
  competencyReflection: {
    aiObservations: CompetencyObservation[];
    userSelfAssessment: boolean;
  };
  
  competencies: ['self_reflection', 'feedback', 'continuous_improvement'];
}
```

### 6. Manager 1:1

```typescript
interface OneOnOneCeremony {
  duration: '10-15 minutes';
  frequency: 'after_each_sprint';
  
  topics: {
    sprintPerformance: {
      // Manager discusses user's sprint contributions
      positives: string[];
      areasToImprove: string[];
      specificExamples: Example[];
    };
    
    careerDevelopment: {
      // Tied to competency framework
      competencyProgress: CompetencyUpdate[];
      nextFocusAreas: string[];
    };
    
    userAgenda: {
      // User can bring topics
      promptForTopics: boolean;
      aiRespondsTo: UserTopic[];
    };
    
    goalSetting: {
      // Set goals for next sprint
      previousGoals: Goal[];
      newGoals: Goal[];
    };
  };
  
  competencies: ['receiving_feedback', 'goal_setting', 'self_advocacy'];
}
```

---

## Soft Skill Integration

Soft skill challenges are woven throughout the narrative, not isolated.

### Soft Skill Hook Points

| Ceremony | Possible Soft Skill Scenarios |
|----------|-------------------------------|
| Standup | Peer disagrees with your approach, unclear requirements surface |
| Sprint Planning | Overcommitment pressure, scope negotiation |
| Code Review | Receiving harsh feedback, defending technical decisions |
| Mid-Sprint | Deadline pressure, priority conflict, team member conflict |
| Sprint Review | Stakeholder pushback, demo failure |
| Retrospective | Giving constructive criticism, accepting blame |
| 1:1 | Receiving negative feedback, salary discussion, career concerns |

### Soft Skill Scenario Structure

```typescript
interface SoftSkillScenario {
  id: string;
  type: 'conflict' | 'pressure' | 'feedback' | 'ambiguity' | 'failure';
  
  trigger: {
    probability: number;            // 0-1, chance of occurring
    conditions: TriggerCondition[]; // When can this fire
  };
  
  scenario: {
    setup: string;                  // Narrative context
    characters: TeamMember[];
    initialMessage: string;         // AI delivers this
  };
  
  userResponseOptions: {
    freeform: boolean;              // User types response
    guidedChoices?: string[];       // Optional prompts
  };
  
  evaluation: {
    competencies: string[];
    rubric: EvaluationRubric;
  };
  
  outcomes: {
    positive: OutcomeScript;        // If handled well
    neutral: OutcomeScript;         // If handled okay
    negative: OutcomeScript;        // If handled poorly
  };
}
```

---

## Difficulty Progression

As users progress through sprints, difficulty increases:

| Aspect | Sprint 1 | Sprint 2 | Sprint 3+ |
|--------|----------|----------|-----------|
| **Ticket Complexity** | Simple bugs, single file | Multi-file features | System-wide changes |
| **Scaffolding** | Step-by-step guidance | Hints on request | Minimal guidance |
| **Story Points** | 3-5 points | 8-13 points | 13-21 points |
| **Soft Skills** | Friendly feedback | Constructive criticism | Conflict situations |
| **Ambiguity** | Clear requirements | Some ambiguity | Significant ambiguity |
| **Time Pressure** | Relaxed | Moderate | Realistic deadlines |
| **Team Dynamics** | Supportive | Mixed | Challenging personalities |

---

## Content Assembly Flow

```
User accepts job at "AtlasPay (Fintech)"
           ↓
Lookup: jobPosting.projectTemplateId = "novapay-template"
           ↓
Load ProjectTemplate "novapay-template"
           ↓
┌─────────────────────────────────────────────────────────────┐
│  ASSEMBLE ONBOARDING ARC                                     │
│                                                              │
│  1. Team Members: Load from template.team                    │
│  2. Documentation: Load from template.documentation          │
│  3. First Ticket: Select from template.backlog.bugTemplates  │
│  4. Day Scripts: Load from catalogue (onboarding assets)     │
│  5. Soft Skills: Select 1-2 from template.softSkillPacks     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
           ↓
User completes Onboarding
           ↓
┌─────────────────────────────────────────────────────────────┐
│  ASSEMBLE SPRINT 1                                           │
│                                                              │
│  1. Sprint Goal: Generate from template.backlog.themes       │
│  2. Backlog Items: Select 3-5 from template.backlog          │
│  3. Assign User: 1-2 tickets at appropriate complexity       │
│  4. Ceremonies: Load scripts from catalogue                  │
│  5. Mid-Sprint Event: 30% chance, select from template       │
│  6. Soft Skills: Select 2-3 scenarios                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
           ↓
Repeat for Sprint 2, 3... until Junior Ready
```

---

## Scripted vs AI-Generated Content

| Content Type | Scripted | AI-Generated |
|--------------|----------|--------------|
| Team member bios | ✓ | |
| Documentation | ✓ | |
| Ticket descriptions | ✓ (templates) | ✓ (variations) |
| Code bugs | ✓ | |
| Standup dialogue | | ✓ (based on context) |
| Code review feedback | | ✓ (based on user's code) |
| Soft skill scenarios | ✓ (setup) | ✓ (conversation) |
| Sprint planning discussion | | ✓ |
| Retro insights | | ✓ (based on sprint data) |
| 1:1 feedback | ✓ (structure) | ✓ (specifics) |

### AI Orchestration Rules

```typescript
interface AIOrchestrationConfig {
  // What the AI knows
  context: {
    projectTemplate: ProjectTemplate;
    currentArc: Arc;
    currentDay: Day;
    userProgress: UserProgress;
    sprintState: SprintState;
  };
  
  // Behavioral constraints
  persona: {
    teamMember: TeamMember;
    tone: 'supportive' | 'professional' | 'challenging';
    verbosity: 'concise' | 'detailed';
  };
  
  // Evaluation integration
  evaluation: {
    trackCompetencies: string[];
    recordToLedger: boolean;
  };
  
  // Guardrails
  constraints: {
    stayInCharacter: boolean;
    noBreakingFourthWall: boolean;
    maintainNarrativeConsistency: boolean;
  };
}
```

---

## Example Complete Journey

### User: Alex, applying for "AtlasPay Junior Developer"

**Week 1: Onboarding Arc**
- Day 1: Meet Sarah (Tech Lead), Marcus (Senior Dev), Priya (PM), Alex (QA), Jordan (Fellow Intern)
- Day 2: Set up dev environment, clone repo, run tests
- Day 3: First ticket - fix timezone bug in payment display
- Day 4: Receive code review from Marcus, iterate
- Day 5: 1:1 with Sarah - discuss first week, set goals

**Week 2-3: Sprint 1 - "Payment Reliability"**
- Sprint Planning: Team selects 5 tickets, Alex assigned 2 (retry logic, error messages)
- Days 6-10: Daily standups, work tickets, submit PRs
- Day 8: Soft skill trigger - Priya changes requirements mid-ticket
- Day 10: Sprint Review - demo to stakeholders
- Day 11: Retrospective - discuss what went well
- 1:1 with Sarah: Feedback on first sprint

**Week 4-5: Sprint 2 - "Fraud Prevention"**
- Higher complexity tickets
- Day 15: Production incident - payment failures spike
- Collaborate with DevOps to investigate
- More challenging code reviews
- 1:1 discusses areas for improvement

**Week 6: Offboarding Arc**
- Final evaluation with Sarah
- Portfolio compilation: PRs, code samples, reflections
- Readiness assessment: competency scores
- Badge earned: "Junior Ready - Developer"

---

## Implementation Phases

### Phase 3A: Schema & Data Models (1 week)
- Add Arc, Day, Activity models to schema
- Extend JobPosting with narrativeProfile
- Create ProjectTemplate structure

### Phase 3B: Ceremony Scripts (1 week)
- Author Sprint Planning scripts
- Author Standup templates
- Author Review/Retro scripts
- Author 1:1 templates

### Phase 3C: Sprint Assembly Logic (1 week)
- Build sprint generator from templates
- Implement difficulty progression
- Integrate soft skill hooks

### Phase 3D: UI Updates (1 week)
- Sprint board view
- Ceremony UI components
- Progress tracking across sprints

---

## Open Questions for Discussion

1. **Sprint Length**: Should we simulate 1-week or 2-week sprints? Or configurable?
2. **Real Time vs Simulated Time**: How do we map real user time to simulated days?
3. **Branching Narratives**: How much should user choices affect the story?
4. **Failure States**: What happens if user consistently underperforms?
5. **Practice Mode**: Can users replay specific ceremonies in Practice Path?
