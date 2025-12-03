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
│  │   OFFBOARDING (End of Final Sprint)                                 │ │
│  │   └── Final 1:1 with Manager (evaluates entire journey)             │ │
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
  type: 'onboarding' | 'sprint';    // Only two arc types
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
  isFinalArc: boolean;              // If true, ends with Final 1:1 (offboarding)
}
```

> **Note**: There is no separate "offboarding arc". Instead, the final sprint ends with a **Final 1:1** that evaluates the entire journey and exits the user from the experience.

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
  isFinal: boolean;                 // True for the last sprint's 1:1
  
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
      // Set goals for next sprint (not included in final 1:1)
      previousGoals: Goal[];
      newGoals: Goal[];
    };
  };
  
  competencies: ['receiving_feedback', 'goal_setting', 'self_advocacy'];
}
```

### 7. Final 1:1 (Offboarding)

The final 1:1 replaces the regular sprint 1:1 at the end of the last sprint. It evaluates the **entire journey**, not just the last sprint.

```typescript
interface FinalOneOnOneCeremony extends OneOnOneCeremony {
  isFinal: true;
  duration: '20-30 minutes';        // Longer than regular 1:1s
  
  journeyReview: {
    // Comprehensive review of entire experience
    overallPerformance: {
      strengths: string[];          // Key strengths demonstrated
      growthAreas: string[];        // Areas of improvement shown
      keyMoments: JourneyMoment[];  // Memorable achievements/challenges
    };
    
    competencyAssessment: {
      // Final competency scores
      competencies: CompetencyScore[];
      overallBand: 'explorer' | 'contributor' | 'junior_ready';
      readinessScore: number;       // 0-100
    };
    
    portfolioHighlights: {
      // Artifacts collected during journey
      bestPRs: PortfolioArtifact[];
      codeReviewsGiven: PortfolioArtifact[];
      documentationWritten: PortfolioArtifact[];
      challengesOvercome: string[];
    };
    
    managerFinalWords: {
      // Personalized closing message
      congratulations: string;
      adviceForFuture: string[];
      recommendationLetter?: string; // If junior_ready achieved
    };
  };
  
  exitExperience: {
    // User exits the workspace after this
    showBadge: boolean;             // Junior Ready badge if earned
    showPortfolio: boolean;         // Link to compiled portfolio
    returnToJobBoard: boolean;      // Option to start new journey
  };
  
  competencies: ['receiving_feedback', 'self_reflection', 'professional_growth'];
}
```

**Final 1:1 Flow:**

```
┌─────────────────────────────────────────────────────────────┐
│                     FINAL 1:1 WITH MANAGER                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. JOURNEY REVIEW                                           │
│     "Let's look back at your time here..."                   │
│     - Highlights from each sprint                            │
│     - Key accomplishments                                    │
│     - Challenges overcome                                    │
│                                                              │
│  2. COMPETENCY ASSESSMENT                                    │
│     "Here's where you stand on each skill..."                │
│     - Visual breakdown of competencies                       │
│     - Comparison to Junior Ready threshold                   │
│     - Specific examples of growth                            │
│                                                              │
│  3. PORTFOLIO COMPILATION                                    │
│     "You've built an impressive body of work..."             │
│     - Best PRs and code samples                              │
│     - Documentation contributions                            │
│     - Code reviews given                                     │
│                                                              │
│  4. CLOSING & BADGE                                          │
│     "Congratulations! You've earned..."                      │
│     - Junior Ready badge (if earned)                         │
│     - Manager's advice for the future                        │
│     - Exit to portfolio view                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Exit Triggers & Progression Paths

### When Does the Journey End?

The Final 1:1 is triggered by **either**:

| Trigger | Description |
|---------|-------------|
| **User Choice** | User decides they're ready to exit (clicks "Complete Journey") |
| **System Determination** | System detects user has reached target readiness level |

```typescript
interface ExitTrigger {
  type: 'user_initiated' | 'system_determined';
  
  userInitiated?: {
    // User clicks "I'm ready to graduate"
    minimumSprints: number;         // Must complete at least N sprints
    confirmationRequired: boolean;  // "Are you sure?" dialog
  };
  
  systemDetermined?: {
    // System detects readiness threshold reached
    readinessThreshold: number;     // e.g., 85 for Junior Ready
    competencyMinimums: {           // Must meet minimums in key areas
      [competencySlug: string]: number;
    };
    sustainedPerformance: number;   // Must maintain level for N sprints
  };
}
```

### Progression Paths (Extensible)

The Intern → Junior path is just the first use case. The same architecture supports:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      PROGRESSION PATHS                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  PATH 1: Intern → Junior Ready (Current Focus)                          │
│  ├── Entry: New graduate, bootcamp student, career changer              │
│  ├── Focus: Foundational habits, core delivery skills                   │
│  ├── Duration: 2-4 sprints                                              │
│  └── Exit Badge: "Junior Ready"                                         │
│                                                                          │
│  PATH 2: Junior → Mid-Level (Future)                                    │
│  ├── Entry: 1-2 years experience, Junior Ready badge holders            │
│  ├── Focus: Technical leadership, mentoring, system design              │
│  ├── Duration: 4-6 sprints                                              │
│  └── Exit Badge: "Mid-Level Professional"                               │
│                                                                          │
│  PATH 3: Mid → Senior (Future)                                          │
│  ├── Entry: 3-5 years experience, Mid-Level badge holders               │
│  ├── Focus: Architecture, cross-team influence, strategic thinking      │
│  ├── Duration: 6-8 sprints                                              │
│  └── Exit Badge: "Senior Professional"                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Progression Path Configuration

```typescript
interface ProgressionPath {
  id: string;
  name: string;                     // "Intern to Junior Ready"
  
  entryLevel: Level;                // 'intern' | 'junior' | 'mid' | 'senior'
  exitLevel: Level;                 // Target level to achieve
  
  requirements: {
    entry: {
      previousBadge?: string;       // Required badge to start (null for intern)
      minimumExperience?: string;   // "1-2 years" (for display only)
    };
    exit: {
      readinessScore: number;       // Threshold to complete path
      requiredCompetencies: string[]; // Must demonstrate these
      minimumSprints: number;       // Can't exit before this
      maximumSprints: number;       // Forced graduation after this
    };
  };
  
  competencyFocus: {
    // Different paths emphasize different competencies
    primary: string[];              // Main focus areas
    secondary: string[];            // Also tracked but less weight
  };
  
  difficultyProgression: {
    // How difficulty scales through the path
    startingBand: 'guided' | 'supported' | 'independent';
    endingBand: 'guided' | 'supported' | 'independent';
    escalationRate: 'gradual' | 'steep';
  };
  
  exitBadge: {
    name: string;                   // "Junior Ready"
    description: string;
    icon: string;
  };
}
```

### Example: Two Progression Paths

**Path 1: Intern → Junior Ready**
```json
{
  "id": "intern-to-junior",
  "name": "Intern to Junior Ready",
  "entryLevel": "intern",
  "exitLevel": "junior",
  "requirements": {
    "entry": {
      "previousBadge": null
    },
    "exit": {
      "readinessScore": 85,
      "requiredCompetencies": ["debugging", "git_workflow", "code_review", "communication"],
      "minimumSprints": 2,
      "maximumSprints": 6
    }
  },
  "competencyFocus": {
    "primary": ["debugging", "git_workflow", "testing", "code_review"],
    "secondary": ["documentation", "estimation", "collaboration"]
  },
  "difficultyProgression": {
    "startingBand": "guided",
    "endingBand": "supported",
    "escalationRate": "gradual"
  },
  "exitBadge": {
    "name": "Junior Ready",
    "description": "Demonstrated readiness for a junior developer role",
    "icon": "badge-junior-ready"
  }
}
```

**Path 2: Junior → Mid-Level (Future)**
```json
{
  "id": "junior-to-mid",
  "name": "Junior to Mid-Level Professional",
  "entryLevel": "junior",
  "exitLevel": "mid",
  "requirements": {
    "entry": {
      "previousBadge": "Junior Ready"
    },
    "exit": {
      "readinessScore": 90,
      "requiredCompetencies": ["system_design", "mentoring", "technical_leadership", "cross_team_collab"],
      "minimumSprints": 4,
      "maximumSprints": 10
    }
  },
  "competencyFocus": {
    "primary": ["system_design", "technical_leadership", "mentoring", "architecture"],
    "secondary": ["stakeholder_management", "estimation", "risk_assessment"]
  },
  "difficultyProgression": {
    "startingBand": "supported",
    "endingBand": "independent",
    "escalationRate": "steep"
  },
  "exitBadge": {
    "name": "Mid-Level Professional",
    "description": "Demonstrated readiness for mid-level technical roles",
    "icon": "badge-mid-level"
  }
}
```

### Exit Flow Decision Tree

```
┌─────────────────────────────────────────────────────────────┐
│              END OF SPRINT CHECK                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  After Sprint Retrospective...                               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Has user completed minimum sprints?                   │   │
│  └──────────────────────────────────────────────────────┘   │
│              │                                               │
│      NO ─────┴───── YES                                      │
│       │              │                                       │
│       ▼              ▼                                       │
│  Continue to    ┌──────────────────────────────────────┐    │
│  next sprint    │ Check exit conditions:               │    │
│                 │                                       │    │
│                 │ A) User clicked "Complete Journey"?   │    │
│                 │    → Trigger Final 1:1                │    │
│                 │                                       │    │
│                 │ B) Readiness score >= threshold?      │    │
│                 │    → System suggests Final 1:1        │    │
│                 │    → User can accept or continue      │    │
│                 │                                       │    │
│                 │ C) Reached maximum sprints?           │    │
│                 │    → Force Final 1:1 (graduation)     │    │
│                 │                                       │    │
│                 │ D) None of above?                     │    │
│                 │    → Continue to next sprint          │    │
│                 └──────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### System-Suggested Graduation

When the system determines the user is ready:

```typescript
interface GraduationSuggestion {
  trigger: 'readiness_threshold_met';
  
  notification: {
    title: "You're Ready!";
    message: "Based on your performance, you've reached Junior Ready status.";
    readinessScore: number;
    competencyHighlights: string[];
  };
  
  options: {
    accept: {
      label: "Graduate Now";
      action: 'trigger_final_1_1';
    };
    defer: {
      label: "Continue Practicing";
      action: 'continue_to_next_sprint';
      note: "You can graduate after any future sprint";
    };
  };
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
│  ASSEMBLE ONBOARDING ARC (Mostly Scripted)                   │
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
│  DYNAMICALLY GENERATE SPRINT N                               │
│                                                              │
│  → See "Dynamic Sprint Generation" section below             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
           ↓
Repeat until Exit Trigger fires
```

---

## Dynamic Sprint Generation

After onboarding, **each sprint is dynamically generated** to ensure variety and prevent repetition. The system combines:
- **Seed content** from the catalogue (problem templates, scenario structures)
- **AI generation** for variations, dialogue, and contextual details
- **Progression rules** to ensure appropriate difficulty

### Why Dynamic Generation?

| Approach | Pros | Cons |
|----------|------|------|
| **Fully Scripted** | Consistent, predictable | Repetitive on replay, limited replayability |
| **Fully AI-Generated** | Infinite variety | Inconsistent quality, may break narrative |
| **Hybrid (Our Approach)** | Variety + consistency | More complex to build |

### Sprint Generation Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SPRINT GENERATION PIPELINE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  INPUTS:                                                                 │
│  ├── Project Template (team, codebase, themes)                          │
│  ├── User Progress (completed sprints, competency scores, gaps)         │
│  ├── Sprint Number (determines difficulty band)                         │
│  └── Previous Sprint State (what happened, what to avoid repeating)     │
│                                                                          │
│                              ↓                                           │
│                                                                          │
│  STEP 1: SELECT SPRINT THEME                                            │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Choose theme not used in recent sprints:                         │   │
│  │  • "Payment Processing Reliability"                               │   │
│  │  • "Fraud Detection Features"                                     │   │
│  │  • "Performance Optimization"                                     │   │
│  │  • "Customer Dashboard Improvements"                              │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              ↓                                           │
│                                                                          │
│  STEP 2: GENERATE BACKLOG                                               │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  AI generates 5-8 tickets based on:                               │   │
│  │  • Theme selected                                                 │   │
│  │  • Difficulty band for this sprint                                │   │
│  │  • Problem templates from catalogue                               │   │
│  │  • User's competency gaps (prioritize weak areas)                 │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              ↓                                           │
│                                                                          │
│  STEP 3: SELECT USER TICKETS                                            │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Assign 1-3 tickets to user:                                      │   │
│  │  • At least one technical (bug, feature)                          │   │
│  │  • Optionally one soft-skill heavy (ambiguous requirements)       │   │
│  │  • Complexity matches difficulty band                             │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              ↓                                           │
│                                                                          │
│  STEP 4: GENERATE SOFT SKILL EVENTS                                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Roll for 2-4 events, avoiding recent repeats:                    │   │
│  │  • Code review conflict                                           │   │
│  │  • Requirement change mid-sprint                                  │   │
│  │  • Peer disagreement in standup                                   │   │
│  │  • Production incident (urgent interrupt)                         │   │
│  │  • Scope creep pressure from PM                                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              ↓                                           │
│                                                                          │
│  STEP 5: SCHEDULE EVENTS ACROSS DAYS                                    │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Place events throughout the sprint:                              │   │
│  │  • Day 1: Sprint Planning                                         │   │
│  │  • Day 2-3: Work begins, optional early conflict                  │   │
│  │  • Day 4-5: Mid-sprint event (incident, requirement change)       │   │
│  │  • Day 6-7: Push to complete, possible deadline pressure          │   │
│  │  • Day 8: Sprint Review                                           │   │
│  │  • Day 9: Retrospective + 1:1                                     │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              ↓                                           │
│                                                                          │
│  OUTPUT: Complete Sprint Definition                                      │
│  ├── Sprint Goal                                                        │
│  ├── Backlog (with generated tickets)                                   │
│  ├── User's assigned tickets (with generated code/bugs)                 │
│  ├── Scheduled soft skill events                                        │
│  └── Ceremony prompts (for AI team members)                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Dynamic Ticket Generation

```typescript
interface TicketGenerator {
  // Inputs
  inputs: {
    projectTemplate: ProjectTemplate;
    sprintTheme: string;
    difficultyBand: 'guided' | 'supported' | 'independent';
    userCompetencyGaps: string[];
    previousTickets: Ticket[];       // Avoid repetition
  };
  
  // Generation process
  generate(): GeneratedTicket {
    // 1. Select problem template from catalogue
    const template = selectProblemTemplate({
      type: this.inputs.difficultyBand === 'guided' ? 'bug' : 'feature',
      competencies: this.inputs.userCompetencyGaps,
      notIn: this.inputs.previousTickets.map(t => t.templateId)
    });
    
    // 2. AI generates variations
    const ticket = aiGenerate({
      prompt: `Generate a ${template.type} ticket for a ${this.inputs.sprintTheme} sprint.
               Base it on this template: ${template.description}
               Make it appropriate for ${this.inputs.difficultyBand} difficulty.
               The codebase is: ${this.inputs.projectTemplate.codebase.description}`,
      schema: TicketSchema
    });
    
    // 3. Generate the actual code/bug
    const codeArtifact = generateCodeArtifact({
      ticket,
      codebaseStructure: this.inputs.projectTemplate.codebase,
      bugPattern: template.bugPattern
    });
    
    return { ticket, codeArtifact };
  };
}

interface GeneratedTicket {
  id: string;
  title: string;                    // AI-generated, contextual
  description: string;              // AI-generated, detailed
  acceptanceCriteria: string[];     // AI-generated
  storyPoints: number;              // Based on difficulty band
  type: 'bug' | 'feature' | 'chore';
  
  // The actual technical content
  codeArtifact: {
    affectedFiles: string[];
    buggyCode?: string;             // For bugs: the broken code
    expectedFix?: string;           // For evaluation
    testCases?: TestCase[];
  };
  
  // Metadata
  competencies: string[];           // What this ticket practices
  templateId: string;               // Which catalogue template it's based on
}
```

### Problem Template Examples (Catalogue)

The catalogue contains **problem templates** that the AI uses as seeds:

```json
{
  "templates": [
    {
      "id": "bug-timezone-formatting",
      "type": "bug",
      "category": "date-handling",
      "difficulty": ["guided", "supported"],
      "description": "Date displays incorrectly across timezones",
      "bugPattern": "Uses local timezone instead of UTC for display",
      "affectedArea": "date formatting utilities",
      "competencies": ["debugging", "testing"],
      "variations": [
        "Payment timestamps show wrong time",
        "Transaction dates off by hours",
        "Scheduled payments trigger at wrong time"
      ]
    },
    {
      "id": "bug-race-condition",
      "type": "bug",
      "category": "concurrency",
      "difficulty": ["supported", "independent"],
      "description": "Data inconsistency under concurrent updates",
      "bugPattern": "Missing locks or transactions on shared resource",
      "affectedArea": "database operations",
      "competencies": ["debugging", "system-design"],
      "variations": [
        "Double-charge on rapid button clicks",
        "Balance mismatch after concurrent transfers",
        "Inventory count goes negative"
      ]
    },
    {
      "id": "feature-validation",
      "type": "feature",
      "category": "input-handling",
      "difficulty": ["guided", "supported"],
      "description": "Add input validation to a form",
      "featurePattern": "Validate user input with appropriate error messages",
      "affectedArea": "form components",
      "competencies": ["code-quality", "testing"],
      "variations": [
        "Credit card number validation",
        "Email format validation",
        "Password strength requirements"
      ]
    },
    {
      "id": "feature-error-handling",
      "type": "feature",
      "category": "resilience",
      "difficulty": ["supported", "independent"],
      "description": "Improve error handling for API failures",
      "featurePattern": "Add retry logic, fallbacks, and user feedback",
      "affectedArea": "API client layer",
      "competencies": ["debugging", "system-design", "code-quality"],
      "variations": [
        "Payment gateway timeout handling",
        "Third-party API rate limiting",
        "Graceful degradation when service unavailable"
      ]
    }
  ]
}
```

### Soft Skill Event Generation

```typescript
interface SoftSkillEventGenerator {
  inputs: {
    sprintNumber: number;
    userCompetencyGaps: string[];    // Include soft skills
    previousEvents: SoftSkillEvent[];
    teamDynamics: TeamMember[];
  };
  
  generate(): SoftSkillEvent[] {
    const events: SoftSkillEvent[] = [];
    
    // Determine how many events based on sprint number
    const eventCount = Math.min(2 + Math.floor(sprintNumber / 2), 4);
    
    // Select event types, avoiding recent repeats
    const availableTypes = [
      'code_review_conflict',
      'requirement_change',
      'peer_disagreement',
      'production_incident',
      'scope_creep',
      'deadline_pressure',
      'unclear_feedback',
      'team_member_absence'
    ].filter(type => !recentlyUsed(type, this.inputs.previousEvents));
    
    // Prioritize events that practice user's weak competencies
    const prioritized = prioritizeByCompetencyGaps(
      availableTypes, 
      this.inputs.userCompetencyGaps
    );
    
    // Generate each event with AI
    for (let i = 0; i < eventCount; i++) {
      const eventType = prioritized[i];
      const event = aiGenerate({
        prompt: `Generate a "${eventType}" scenario for sprint ${sprintNumber}.
                 Team members: ${this.inputs.teamDynamics.map(m => m.name).join(', ')}
                 Make it realistic and challenging but fair.`,
        schema: SoftSkillEventSchema
      });
      events.push(event);
    }
    
    return events;
  };
}

interface SoftSkillEvent {
  id: string;
  type: string;
  scheduledDay: number;             // Which day of sprint
  scheduledMoment: string;          // 'standup' | 'mid_work' | 'review' | etc.
  
  scenario: {
    setup: string;                  // Context for the AI
    triggerMessage: string;         // What the team member says
    involvedMembers: string[];      // Who's involved
  };
  
  evaluation: {
    competencies: string[];
    successCriteria: string[];
  };
}
```

### Ensuring Variety Across Sprints

```typescript
interface SprintHistory {
  // Track what's been used to avoid repetition
  usedThemes: string[];
  usedTicketTemplates: string[];
  usedSoftSkillTypes: string[];
  usedConflictPairings: string[];   // e.g., "user-Marcus", "user-Priya"
  
  // Cooldown periods
  cooldowns: {
    themes: 2;                       // Can't reuse theme for 2 sprints
    ticketTemplates: 3;              // Can't reuse template for 3 sprints
    softSkillTypes: 2;               // Can't repeat same scenario type
    conflictPairings: 3;             // Different people for conflicts
  };
}

function canUse(item: string, history: string[], cooldown: number): boolean {
  const recentHistory = history.slice(-cooldown);
  return !recentHistory.includes(item);
}
```

### Generation vs Selection Breakdown

| Element | Generation Method |
|---------|-------------------|
| **Sprint Theme** | Selected from template pool, avoiding recent |
| **Backlog Tickets (full list)** | AI-generated based on theme + templates |
| **User's Tickets (code/bugs)** | AI-generated code from problem templates |
| **Standup Dialogue** | AI-generated based on sprint state |
| **Code Review Comments** | AI-generated based on user's actual code |
| **Soft Skill Scenarios** | AI-generated from event templates |
| **Retro Discussion** | AI-generated based on what happened |
| **1:1 Feedback** | AI-generated based on user's performance |

### Quality Guardrails

To ensure generated content is coherent and fair:

```typescript
interface GenerationGuardrails {
  // Content must be...
  validation: {
    solvable: boolean;               // Bug has a fix, feature is achievable
    appropriateDifficulty: boolean;  // Matches difficulty band
    narrativeConsistent: boolean;    // Fits project/team context
    notRepetitive: boolean;          // Hasn't been used recently
  };
  
  // Human review for edge cases
  flagForReview: {
    ifDifficultyMismatch: boolean;
    ifNarrativeBreak: boolean;
    ifUserComplaint: boolean;
  };
  
  // Fallback to scripted content
  fallback: {
    onGenerationFailure: 'use_scripted_template';
    onQualityFailure: 'regenerate_with_feedback';
    maxRetries: 3;
  };
}
```

### Scalability to Other Levels

The Sprint Generation Pipeline is **level-agnostic**. The same engine powers all progression paths:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              SAME PIPELINE, DIFFERENT PARAMETERS                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  SPRINT GENERATOR                                                            │
│       │                                                                      │
│       ├── Intern → Junior                                                    │
│       │   └── Params: guided difficulty, basic bugs, supportive team         │
│       │                                                                      │
│       ├── Junior → Mid                                                       │
│       │   └── Params: supported difficulty, system design, mentoring others  │
│       │                                                                      │
│       └── Mid → Senior                                                       │
│           └── Params: independent difficulty, architecture, leadership       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### What Changes Per Level

| Dimension | Intern → Junior | Junior → Mid | Mid → Senior |
|-----------|-----------------|--------------|--------------|
| **Difficulty Band** | guided → supported | supported → independent | independent → expert |
| **Ticket Complexity** | Single-file bugs | Multi-service features | Architecture changes |
| **Problem Templates** | Basic patterns | System design patterns | Cross-team problems |
| **User's Role** | Individual contributor | Mentor + contributor | Tech lead + architect |
| **Soft Skills** | Receiving feedback | Giving feedback, mentoring | Managing conflict, influencing |
| **Team Dynamics** | Supportive seniors | Mixed, some juniors to mentor | Challenging stakeholders |
| **Ambiguity** | Clear requirements | Some gaps to fill | Strategic decisions |
| **Scope** | Single ticket | Multi-ticket coordination | Cross-team initiatives |

#### Level-Specific Problem Templates

```json
{
  "problemTemplates": {
    "intern_junior": [
      { "id": "bug-null-check", "description": "Missing null check causing crash" },
      { "id": "bug-timezone", "description": "Timezone handling issue" },
      { "id": "feature-validation", "description": "Add form validation" },
      { "id": "feature-error-message", "description": "Improve error messages" }
    ],
    "junior_mid": [
      { "id": "design-api", "description": "Design REST API for new feature" },
      { "id": "refactor-module", "description": "Refactor module for testability" },
      { "id": "performance-query", "description": "Optimize slow database query" },
      { "id": "incident-debug", "description": "Debug production incident" },
      { "id": "mentor-review", "description": "Review and mentor junior's PR" }
    ],
    "mid_senior": [
      { "id": "architecture-decision", "description": "Make architecture decision with tradeoffs" },
      { "id": "cross-team-coordination", "description": "Coordinate feature across 3 teams" },
      { "id": "technical-strategy", "description": "Define technical strategy for quarter" },
      { "id": "stakeholder-negotiation", "description": "Negotiate scope with product/business" },
      { "id": "team-scaling", "description": "Plan team scaling and hiring" }
    ]
  }
}
```

#### Level-Specific Soft Skill Events

```json
{
  "softSkillEvents": {
    "intern_junior": [
      { "type": "receiving_feedback", "description": "Senior gives constructive criticism on your PR" },
      { "type": "asking_for_help", "description": "You're stuck, need to ask for help effectively" },
      { "type": "unclear_requirements", "description": "PM's requirements are vague, need to clarify" },
      { "type": "deadline_pressure", "description": "Sprint ending, your ticket isn't done" }
    ],
    "junior_mid": [
      { "type": "giving_feedback", "description": "Review junior's code, give constructive feedback" },
      { "type": "mentoring", "description": "Junior is stuck, help them without doing it for them" },
      { "type": "technical_disagreement", "description": "Peer disagrees with your approach, defend or adapt" },
      { "type": "scope_negotiation", "description": "PM wants more, negotiate realistic scope" },
      { "type": "incident_leadership", "description": "Lead the response to a production incident" }
    ],
    "mid_senior": [
      { "type": "conflict_resolution", "description": "Two team members in conflict, mediate" },
      { "type": "stakeholder_pushback", "description": "VP questions your technical decision" },
      { "type": "resource_constraints", "description": "Not enough engineers, prioritize ruthlessly" },
      { "type": "strategic_tradeoff", "description": "Speed vs quality decision with business impact" },
      { "type": "cross_team_alignment", "description": "Other team's priorities conflict with yours" }
    ]
  }
}
```

#### Level-Specific Team Dynamics

| Level | User's Position | Team Composition |
|-------|-----------------|------------------|
| **Intern → Junior** | Newest member | Supportive seniors, helpful PM, patient tech lead |
| **Junior → Mid** | Experienced IC | Mix of seniors and juniors (you mentor the juniors) |
| **Mid → Senior** | Tech lead | Juniors, mids, challenging stakeholders, peer leads |

```typescript
interface LevelSpecificTeamConfig {
  level: 'intern' | 'junior' | 'mid' | 'senior';
  
  userRole: {
    title: string;                  // "Software Engineer I", "Senior Engineer", etc.
    responsibilities: string[];
    autonomyLevel: 'low' | 'medium' | 'high';
  };
  
  teamComposition: {
    reportsToUser: number;          // 0 for intern, 0-1 for junior, 2-4 for mid+
    peersAboveUser: number;         // Many for intern, few for senior
    peersBelowUser: number;         // 0 for intern, some for mid, many for senior
  };
  
  interactionPatterns: {
    primaryMentor: boolean;         // Intern has a dedicated mentor
    mentoringOthers: boolean;       // Mid+ mentors juniors
    stakeholderAccess: 'limited' | 'regular' | 'frequent';
    crossTeamWork: 'rare' | 'occasional' | 'frequent';
  };
}
```

#### The Generator Adapts Automatically

```typescript
function generateSprint(
  progressionPath: ProgressionPath,
  sprintNumber: number,
  userProgress: UserProgress
): GeneratedSprint {
  
  // 1. Determine difficulty band based on progression path + sprint number
  const difficultyBand = calculateDifficultyBand(
    progressionPath.difficultyProgression,
    sprintNumber
  );
  
  // 2. Select problem templates for this level
  const templates = getProblemTemplates(progressionPath.entryLevel);
  
  // 3. Select soft skill events for this level
  const softSkillPool = getSoftSkillEvents(progressionPath.entryLevel);
  
  // 4. Configure team dynamics for this level
  const teamConfig = getTeamConfig(progressionPath.entryLevel);
  
  // 5. Generate sprint using standard pipeline
  return sprintGenerationPipeline({
    difficultyBand,
    problemTemplates: templates,
    softSkillPool,
    teamConfig,
    userCompetencyGaps: userProgress.gaps,
    previousSprints: userProgress.completedSprints
  });
}
```

This means:
- **One codebase** powers all progression paths
- **Content packs** (problem templates, soft skills) are swapped based on level
- **Team dynamics** adjust automatically
- **New progression paths** can be added by creating new content packs

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

**Week 4-5: Sprint 2 (Final Sprint) - "Fraud Prevention"**
- Higher complexity tickets
- Day 15: Production incident - payment failures spike
- Collaborate with DevOps to investigate
- More challenging code reviews
- Sprint Review & Retrospective
- **Final 1:1 with Sarah** (replaces regular 1:1):
  - Reviews entire journey from Day 1 to now
  - Competency assessment across all sprints
  - Portfolio compilation: PRs, code samples, reflections
  - Badge earned: "Junior Ready - Developer"
  - Exit experience → Portfolio view

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
