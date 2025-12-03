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

### Phase 3: Progression Engine & Narrative Schema (3 weeks)
**Goal**: Unified competency tracking + narrative data structures

> **Updated**: Now includes narrative schema to support dynamic sprint generation

**3A: Schema & Data Models (1 week)**
- Add `journey_arcs` table (type, order, projectTemplateId, isFinalArc)
- Add `sprints` table (arcId, sprintNumber, goal, backlog, state)
- Add `sprint_activities` table (sprintId, day, type, status)
- Add `project_templates` table (team, codebase, themes, softSkillPacks)
- Add `progression_paths` table (entryLevel, exitLevel, requirements, badge)
- Extend `job_postings` with `projectTemplateId` and `narrativeProfile`

**3B: Progression Engine (1 week)**
- Delta Calculator: Compute competency changes after activities
- Readiness Engine: Aggregate scores → mastery band
- Exit Trigger Logic: Check readiness threshold, min/max sprints
- Graduation Suggestion: Notify user when ready

**3C: Progress Dashboard (1 week)**
- Competency heatmap visualization
- Journey timeline (arcs completed, current sprint)
- Gap analysis and recommendations
- Readiness score display

**APIs Added:**
- `GET /api/user/:id/journey` - Current journey state
- `POST /api/user/:id/journey/start` - Start journey from job posting
- `GET /api/user/:id/journey/current-sprint` - Current sprint details
- `POST /api/user/:id/journey/complete-activity` - Mark activity done + record delta
- `GET /api/progression-paths` - Available progression paths

**Outcome**: Foundation for dynamic narratives + users see unified progress

---

### Phase 4: Dynamic Sprint Generation (3-4 weeks)
**Goal**: AI-powered sprint assembly from catalogue templates

> **New Phase**: Core narrative engine that generates unique sprints

**4A: Sprint Generator Service (1.5 weeks)**
- Theme selection (avoiding recent themes)
- Backlog generation from problem templates
- User ticket assignment based on difficulty band
- Soft skill event scheduling
- Day-by-day activity planning

**4B: Problem Template Authoring (1 week)**
- Create 20+ bug templates (timezone, null check, race condition, etc.)
- Create 15+ feature templates (validation, error handling, etc.)
- Create 10+ soft skill event templates
- Cooldown and variety tracking

**4C: Workspace Orchestrator Updates (1 week)**
- Consume generated sprint payloads
- Dynamic ceremony scripts (standup, planning, review, retro)
- AI team member responses based on sprint context
- Mid-sprint event injection

**4D: Quality Guardrails (0.5 weeks)**
- Validation: solvable, appropriate difficulty, narrative consistent
- Fallback to scripted templates on generation failure
- Telemetry for generated content quality

**APIs Added:**
- `POST /api/journey/:id/generate-sprint` - Generate next sprint
- `GET /api/sprint/:id/ceremonies` - Get ceremony scripts for sprint
- `POST /api/sprint/:id/soft-skill-event` - Trigger soft skill scenario

**Outcome**: Each sprint is dynamically generated, ensuring variety

---

### Phase 5: Journey UX & Ceremony UI (3 weeks)
**Goal**: New user flows with sprint-based narrative

> **Merged**: Combines previous UX phase with ceremony implementation

**5A: Journey Dashboard (1 week)**
- Arc timeline visualization
- Current sprint progress
- Upcoming ceremonies
- "Complete Journey" button (exit trigger)

**5B: Ceremony UI Components (1.5 weeks)**
- Sprint Planning UI (backlog review, task selection, commitment)
- Daily Standup UI (team updates, user input, blockers)
- Sprint Review UI (demo to stakeholders, feedback)
- Retrospective UI (what went well, improvements)
- 1:1 / Final 1:1 UI (feedback, goals, graduation)

**5C: Sprint Board UI (0.5 weeks)**
- Kanban-style ticket board
- Ticket detail view with code exercise
- PR creation flow
- Code review interface

**Outcome**: Users experience full sprint ceremonies with dynamic content

---

### Phase 6: Multi-Role Content Packs (2-3 weeks)
**Goal**: Extend to PM, QA, DevOps, Data Science

> **Updated**: Now includes level-specific content packs

**Per Role:**
- Problem templates appropriate to role
- Soft skill events appropriate to role
- Role-specific competencies
- Interview adapters (question focus, cases)
- Workspace adapters (problems, artifacts)

**Per Level (Intern→Junior, Junior→Mid, Mid→Senior):**
- Level-specific problem templates
- Level-specific soft skill events
- Level-specific team dynamics
- Difficulty band configurations

**Content Required:**
| Role | Bug Templates | Feature Templates | Soft Skill Events |
|------|---------------|-------------------|-------------------|
| Developer | 20 | 15 | 10 |
| PM | N/A | 15 (requirements, roadmaps) | 15 |
| QA | 15 (test scenarios) | 10 | 10 |
| DevOps | 15 (infra issues) | 10 | 10 |
| Data Science | 15 (data issues) | 10 | 10 |

**Outcome**: Platform works for 5 roles × 3 levels = 15 progression paths

---

### Phase 7: Portfolio, Credentialing & Exit (2 weeks)
**Goal**: Employer-facing differentiation + graduation flow

**7A: Final 1:1 & Graduation (1 week)**
- Journey review (all sprints, key moments)
- Competency assessment visualization
- Portfolio compilation (best PRs, docs, reviews)
- Badge award (if thresholds met)
- Exit experience → Portfolio view

**7B: Portfolio System (1 week)**
- Timeline view of artifacts
- Competency breakdown
- Feedback history from all 1:1s
- Shareable profile / PDF export
- Badge display

**Outcome**: Graduates prove readiness with verifiable portfolio

---

### Phase 8: Language Adapters (1-2 weeks)
**Goal**: C/C++ and Python for Developer role

| Language | Problem Adaptations |
|----------|---------------------|
| C/C++ | Memory bugs, segfaults, pointers, Makefiles, gtest |
| Python | Type errors, async/await, pytest, venvs, imports |
| JavaScript | (exists) Async bugs, npm, Jest, TypeScript |

**Per Language:**
- Code exercise templates
- Bug patterns
- Toolchain simulation (build, test, lint)
- Error messages

**Outcome**: Developer track for 3 tech stacks

---

## Updated Timeline Summary

| Phase | Duration | Focus | Status |
|-------|----------|-------|--------|
| Phase 0 | 1-2 weeks | Extract content to JSON | ✅ Complete |
| Phase 1 | 2-3 weeks | Shared schema, catalogue API | ✅ Complete |
| Phase 2 | 2-3 weeks | Role + Level adapters | ✅ Complete |
| **Phase 3** | **3 weeks** | **Progression engine + narrative schema** | 🔄 Next |
| **Phase 4** | **3-4 weeks** | **Dynamic sprint generation** | ⏳ Planned |
| **Phase 5** | **3 weeks** | **Journey UX + ceremony UI** | ⏳ Planned |
| **Phase 6** | **2-3 weeks** | **Multi-role content packs** | ⏳ Planned |
| **Phase 7** | **2 weeks** | **Portfolio + graduation** | ⏳ Planned |
| **Phase 8** | **1-2 weeks** | **Language adapters** | ⏳ Planned |

**Total**: ~17-22 weeks for full implementation

---

## Phase Dependencies

```
Phase 0-2 (Complete)
     │
     ▼
Phase 3: Progression + Schema ──────────────────┐
     │                                           │
     ▼                                           │
Phase 4: Dynamic Sprint Generation ◄─────────────┤
     │                                           │
     ▼                                           │
Phase 5: Journey UX + Ceremony UI                │
     │                                           │
     ├──────────────────────────────────────────►│
     │                                           │
     ▼                                           ▼
Phase 6: Multi-Role Content ◄───────────── Phase 7: Portfolio + Graduation
     │
     ▼
Phase 8: Language Adapters
```

**Critical Path**: Phase 3 → Phase 4 → Phase 5 → Phase 7

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI generation quality inconsistent | High | Guardrails, fallback to scripted, human review flag |
| AI generation costs too high | Medium | Caching, batched generation, cost monitoring |
| Schema changes break existing features | High | Migrations, feature flags, backward compatibility |
| Content authoring bottleneck | Medium | Prioritize Developer role, template-based approach |
| Sprint generation too slow | Medium | Pre-generate next sprint, background processing |

---

## What's Already Built (Phases 0-2)

| Component | Status | Location |
|-----------|--------|----------|
| Catalogue JSON files | ✅ | `shared/catalogue/workspace/`, `shared/catalogue/interview/` |
| Catalogue service | ✅ | `shared/catalogue/service.ts` |
| Database tables (competencies, catalogue, role_adapters) | ✅ | `shared/schema.ts` |
| Adapter service | ✅ | `server/services/adapter-service.ts` |
| Adapter hooks | ✅ | `client/src/hooks/use-adapters.ts` |
| Intern onboarding (Days 1-2) | ✅ | `client/src/components/simulation/intern-onboarding-session.tsx` |
| Workspace orchestrator | ✅ | `server/services/workspace-orchestrator.ts` |
| Interview simulator | ✅ | `client/src/pages/interview-simulator.tsx` |
| Job board & applications | ✅ | Various |

## What Needs to Be Built (Phases 3-8)

| Component | Phase | Priority |
|-----------|-------|----------|
| Journey arc schema | 3 | P0 |
| Sprint schema | 3 | P0 |
| Project template schema | 3 | P0 |
| Progression path schema | 3 | P0 |
| Delta calculator | 3 | P0 |
| Exit trigger logic | 3 | P0 |
| Progress dashboard | 3 | P1 |
| Sprint generator service | 4 | P0 |
| Problem templates (20+) | 4 | P0 |
| Soft skill templates (10+) | 4 | P0 |
| Dynamic ceremony scripts | 4 | P1 |
| Quality guardrails | 4 | P1 |
| Journey dashboard UI | 5 | P0 |
| Ceremony UI components | 5 | P0 |
| Sprint board UI | 5 | P1 |
| Multi-role content | 6 | P2 |
| Final 1:1 UI | 7 | P0 |
| Portfolio system | 7 | P1 |
| Language adapters | 8 | P2 |

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
