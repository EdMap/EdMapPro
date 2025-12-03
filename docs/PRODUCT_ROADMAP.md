# edmap Product Roadmap

## Vision
Help students go from **Intern → Junior Ready** by exposing them to real-world professional challenges through simulations, so they stand out when they graduate from any training program.

---

## Core Value Proposition

| Without edmap | With edmap |
|---------------|------------|
| Graduate with theoretical knowledge | Graduate with simulated work experience |
| First job = first exposure to real problems | Practiced handling real problems |
| Struggle with soft skills | Already experienced soft skill challenges |
| Portfolio = class projects | Portfolio = professional-grade artifacts + feedback |
| "Hire me, I can learn" | "Hire me, I've demonstrated readiness" |

---

## Product Structure

### Two Paths

| Journey Path | Practice Path |
|--------------|---------------|
| Guided, Story-Driven | Targeted, Drill-Focused |
| Problems arise in narrative context | User picks from catalogue |
| Progression gates | Self-directed |
| Blended tech + soft | Tech OR soft (isolated) |

---

## Problem Exposure Framework

### Technical Problems (Role-Specific)

| Developer | PM | QA | DevOps | Data Science |
|-----------|----|----|--------|--------------|
| Code bugs | Requirements conflicts | Test gaps | Infra failures | Data quality |
| Git issues | Prioritization | Bug triage | Deployment issues | Model drift |
| CI/CD failures | Stakeholder alignment | Regression | Monitoring alerts | Pipeline failures |
| Performance | Roadmap changes | Automation | Scaling | Experiment design |

### Soft Problems (Universal, Context Adapts)

- Time pressure / deadlines
- Peer conflicts / disagreements
- Manager evaluations / performance feedback
- Giving and receiving feedback
- Ambiguous requirements / changing priorities
- Explaining technical concepts to non-technical stakeholders

---

## Competency Framework

### Three Layers

| Layer | What It Measures |
|-------|------------------|
| **Foundational Habits** | Time management, asking for help, persistence, task hygiene |
| **Core Delivery Skills** | Debugging, testing, git workflow, documentation, tool proficiency |
| **Professional Impact** | Communication, feedback, collaboration, ownership, mentoring |

### Mastery Bands

```
Explorer (just starting)
    ↓ demonstrates basic habits, learns with guidance
Contributor (can deliver with guidance)
    ↓ handles problems with less scaffolding, incorporates feedback
Junior Ready (can deliver independently)
    → graduates with verified readiness
```

---

## Unified Architecture

### Adapter + Catalogue Pattern (Both Simulators)

```
┌─────────────────────────────────────────────────────────────────┐
│                    SIMULATION ENGINE (Shared)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────┐    ┌─────────────────────────┐    │
│  │   INTERVIEW SIMULATOR   │    │   WORKSPACE SIMULATOR   │    │
│  ├─────────────────────────┤    ├─────────────────────────┤    │
│  │                         │    │                         │    │
│  │  ROLE ADAPTERS          │    │  ROLE ADAPTERS          │    │
│  │  ├── Developer          │    │  ├── Developer          │    │
│  │  ├── PM                 │    │  ├── PM                 │    │
│  │  ├── QA                 │    │  ├── QA                 │    │
│  │  ├── DevOps             │    │  ├── DevOps             │    │
│  │  └── Data Science       │    │  └── Data Science       │    │
│  │                         │    │                         │    │
│  │  LEVEL ADAPTERS         │    │  LANGUAGE ADAPTERS      │    │
│  │  ├── Intern             │    │  ├── C/C++              │    │
│  │  ├── Junior             │    │  ├── JavaScript         │    │
│  │  ├── Mid                │    │  └── Python             │    │
│  │  └── Senior             │    │                         │    │
│  │                         │    │                         │    │
│  │  CATALOGUE              │    │  CATALOGUE              │    │
│  │  ├── Behavioral Qs      │    │  ├── Technical Drills   │    │
│  │  ├── Technical Qs       │    │  ├── Soft Skills Drills │    │
│  │  ├── System Design      │    │  └── Sprint Arcs        │    │
│  │  └── Case Studies       │    │                         │    │
│  └─────────────────────────┘    └─────────────────────────┘    │
│                                                                 │
│  ═══════════════════════════════════════════════════════════   │
│                    SHARED COMPONENTS                            │
│  • Competency Framework    • Readiness Engine                   │
│  • Portfolio System        • AI Orchestrator                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Complete User Journey

```
PRE-HIRE PHASE                    POST-HIRE PHASE
──────────────                    ───────────────

Job Board                         Workspace Simulator
    ↓                                 ↓
Application                       Progression Engine
    ↓                                 ↓
INTERVIEW SIMULATOR ═══════════> Junior Ready!
    (Get the job)                 (Portfolio + Badge)
```

### Journey Path Chapters

1. **Getting the Job** - Apply, interview (Interview Simulator), negotiate, accept
2. **Onboarding** - Meet team, first tasks, learn codebase (Workspace Simulator)
3. **First Sprints** - Build features, handle incidents, grow (Workspace Simulator)
4. **Junior Ready** - Portfolio complete, badge earned

---

## Implementation Phases

### Phase 0: Stabilize & Extract (1-2 weeks)
**Goal**: De-risk refactoring by extracting hardcoded content

| Simulator | Tasks |
|-----------|-------|
| Interview | Extract questions to JSON, extract rubrics, extract personas |
| Workspace | Extract Day 1-2 content to JSON, extract team definitions |

**Outcome**: Same UX, but content is data-driven

---

### Phase 1: Shared Foundation (2-3 weeks)
**Goal**: Build unified data layer

**New Schema:**
- `competencies` - Skills with rubrics per mastery band
- `simulation_catalogue` - Questions/scenarios with adapter tags
- `role_adapters` - Config per role
- `competency_ledger` - User mastery scores
- `portfolio_artifacts` - Collected work samples

**API Endpoints:**
- `GET /api/catalogue?role=&level=&type=`
- `GET /api/competencies`
- `GET /api/user/:id/readiness`
- `POST /api/user/:id/competency-delta`
- `GET /api/user/:id/portfolio`

**Outcome**: Unified catalogue API for both simulators

---

### Phase 2: Adapter Implementation (2-3 weeks)
**Goal**: Role and level adapters for both simulators

**Interview Adapters:**
- Role Adapter: Question banks, evaluation criteria, personas
- Level Adapter: Difficulty calibration, expectations

**Workspace Adapters:**
- Role Adapter: Problem sets, artifacts, team dynamics
- Language Adapter: Code examples, tooling, errors

**Outcome**: Dynamic configuration based on user's role/level/language

---

### Phase 3: Progression Engine (2 weeks)
**Goal**: Unified competency tracking

**Components:**
- Competency Ledger (stores mastery scores)
- Delta Calculator (computes changes after simulation)
- Readiness Engine (aggregates → mastery band)
- Dashboard (heatmap, progression, recommendations)

**Outcome**: Users see unified progress across both simulators

---

### Phase 4: Journey & Practice UX (3-4 weeks)
**Goal**: New user flows with catalogue-powered content

**Features:**
- Unified Home Hub with readiness indicator
- Journey dashboard with arc timeline
- Practice catalogue browser with filters
- Component modularization (Shell + Modules pattern)

**Outcome**: New UX matching product vision

---

### Phase 5: Multi-Role Expansion (2-3 weeks)
**Goal**: Add PM, QA, DevOps, Data Science

**Per Role:**
- Interview adapters (question focus, cases)
- Workspace adapters (problems, artifacts)
- Content seeding (20 behavioral, 15 role-specific, arcs)
- AI orchestrator updates (role-aware prompts)

**Outcome**: Platform works for 5 career tracks

---

### Phase 6: Portfolio & Credentialing (2 weeks)
**Goal**: Employer-facing differentiation

**Features:**
- Timeline view of artifacts
- Competency breakdown visualization
- Feedback history
- Junior Ready badge
- Shareable profile / PDF export

**Outcome**: Graduates prove readiness to employers

---

### Phase 7: Language Adapters (1-2 weeks)
**Goal**: C/C++ and Python for Developer role

| Language | Adaptations |
|----------|-------------|
| C/C++ | Memory bugs, compilation, pointers, gtest |
| Python | Type errors, async, pytest, venvs |
| JavaScript | (exists) Async bugs, npm, Jest |

**Outcome**: Developer track for multiple tech stacks

---

## Timeline Summary

| Phase | Duration | Focus |
|-------|----------|-------|
| Phase 0 | 1-2 weeks | Extract content to JSON |
| Phase 1 | 2-3 weeks | Shared schema, catalogue API |
| Phase 2 | 2-3 weeks | Role + Level adapters |
| Phase 3 | 2 weeks | Progression engine |
| Phase 4 | 3-4 weeks | New UX |
| Phase 5 | 2-3 weeks | Multi-role expansion |
| Phase 6 | 2 weeks | Portfolio + credentialing |
| Phase 7 | 1-2 weeks | Language adapters |

**Total**: ~15-20 weeks for full implementation

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `client/src/components/simulation/intern-onboarding-session.tsx` | Current workspace simulation (4k lines, to be modularized) |
| `client/src/pages/workspace-journey.tsx` | Journey mode entry point |
| `client/src/pages/workspace-practice.tsx` | Practice mode entry point |
| `client/src/pages/interview-simulator.tsx` | Interview simulator |
| `server/services/workspace-orchestrator.ts` | AI team member responses |
| `shared/schema.ts` | Database schema (to be extended) |

---

## Design Decisions

1. **Curriculum-Agnostic**: Not coupled to specific programs (42 London, bootcamps)
2. **Competency-Based**: Progress based on demonstrated skills, not time
3. **Self-Paced**: No fixed timelines; adapts to learner speed
4. **Unified Architecture**: Same patterns for both simulators
5. **Role Adapters**: Technical problems change per role, soft problems stay universal
6. **Language Adapters**: Same competencies, different technical contexts

---

## Success Metrics

- Users reach "Junior Ready" status
- Portfolio artifacts demonstrate growth
- Employers value the credential
- Works across different training programs
- Supports multiple career tracks

---

## Future: Enterprise Self-Serve Layer (Phase 8+)

### Vision
Enable B2B clients (bootcamps, coding schools, universities) to configure custom curricula through a self-serve portal, with simulations automatically assembled from the catalogue.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 ENTERPRISE CONFIGURATION LAYER                   │
│               (B2B Client Self-Serve Portal)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Enterprise Client (e.g., 42 London, Bootcamp X)                │
│                        ↓                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  REQUIREMENTS INPUT                                      │   │
│  │                                                          │   │
│  │  1. Select Role Track    [Developer ▼]                   │   │
│  │  2. Select Language      [C/C++ ▼]                       │   │
│  │  3. Target Level         [Intern → Junior ▼]             │   │
│  │  4. Competency Focus     [☑ Debugging] [☑ Git] [☐ CI/CD] │   │
│  │  5. Duration             [4 weeks ▼]                     │   │
│  │  6. Custom Scenarios     [Upload JSON] or [Use Defaults] │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                        ↓                                        │
│            SIMULATION BUILDER (Background)                      │
│                        ↓                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  AUTO-GENERATED CURRICULUM                               │   │
│  │                                                          │   │
│  │  Week 1: Onboarding Arc (from catalogue)                 │   │
│  │  Week 2: First Sprint Arc (adapted for C/C++)            │   │
│  │  Week 3: Code Review + Debugging Focus                   │   │
│  │  Week 4: Final Evaluation                                │   │
│  │                                                          │   │
│  │  [Preview] [Edit] [Deploy to Cohort]                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SIMULATION ENGINE                             │
│                                                                 │
│  Catalogue → Adapters → Assembled Experience                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Enterprise Configuration Model

```json
{
  "enterprise": "42 London",
  "cohort": "2025 Intake",
  "track": {
    "role": "developer",
    "language": "c_cpp",
    "progression": ["intern", "junior"]
  },
  "competencies": {
    "required": ["memory_management", "debugging", "git", "code_review"],
    "optional": ["testing", "documentation"]
  },
  "structure": {
    "duration_weeks": 12,
    "arcs": [
      { "name": "Foundations", "weeks": 4, "focus": "onboarding" },
      { "name": "Core Skills", "weeks": 6, "focus": "sprints" },
      { "name": "Ownership", "weeks": 2, "focus": "capstone" }
    ]
  },
  "custom_scenarios": [
    { "id": "42-memory-leak", "type": "technical", "source": "uploaded" }
  ]
}
```

### Enterprise Features (Future)

| Feature | Description |
|---------|-------------|
| **Cohort Management** | Create cohorts, assign curricula, track progress |
| **Custom Scenario Editor** | GUI for enterprises to create their own scenarios |
| **AI Scenario Generation** | "Generate a debugging scenario about memory leaks" |
| **White-Label** | Enterprise branding on student-facing UI |
| **Analytics Dashboard** | Cohort performance, competency gaps, completion rates |
| **LMS Integration** | Connect to Canvas, Moodle, etc. |
| **API Access** | Programmatic curriculum configuration |

### B2B Scaling Model

```
edmap Core Platform
        ↓
┌───────────────────────────────────────────────────────────────┐
│                    ENTERPRISE LAYER                            │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ 42 London   │  │ Bootcamp X  │  │ Bootcamp Y  │  ...      │
│  │             │  │             │  │             │           │
│  │ C/C++ Focus │  │ JS Focus    │  │ Python Focus│           │
│  │ 12 weeks    │  │ 8 weeks     │  │ 16 weeks    │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                               │
│  Each enterprise configures their own curriculum              │
│  System assembles from shared catalogue                       │
│  Progress tracked per cohort                                  │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Why Current Architecture Enables This

| Architecture Element | How It Supports Enterprise |
|---------------------|---------------------------|
| **Catalogue** | Content is modular, queryable, filterable |
| **Role Adapters** | Switch between Developer/PM/QA without rebuilding |
| **Language Adapters** | Same scenarios, different tech context |
| **Level Adapters** | Calibrate for intern/junior/mid/senior |
| **Competency Tags** | Filter by what enterprise wants to teach |
| **JSON-based Scenarios** | Enterprises can upload custom content |
| **Progression Engine** | Track students against competency rubrics |

---

## Updated Timeline (Including Enterprise)

| Phase | Duration | Focus |
|-------|----------|-------|
| Phase 0 | 1-2 weeks | Extract content to JSON |
| Phase 1 | 2-3 weeks | Shared schema, catalogue API |
| Phase 2 | 2-3 weeks | Role + Level adapters |
| Phase 3 | 2 weeks | Progression engine |
| Phase 4 | 3-4 weeks | New UX |
| Phase 5 | 2-3 weeks | Multi-role expansion |
| Phase 6 | 2 weeks | Portfolio + credentialing |
| Phase 7 | 1-2 weeks | Language adapters |
| **Phase 8** | 3-4 weeks | **Enterprise self-serve portal** |
| **Phase 9** | 2-3 weeks | **Cohort management + analytics** |
| **Phase 10** | 2-3 weeks | **LMS integrations + API** |

**Total with Enterprise**: ~25-35 weeks
