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

## Complete User Journey (Updated)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRE-HIRE PHASE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    Job Board → Application → INTERVIEW SIMULATOR → Offer → Accept           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           POST-HIRE PHASE                                    │
│                        (Workspace Simulator)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    WORKSPACE CREATED                                 │   │
│   │              (e.g., "NovaPay" workspace)                             │   │
│   │              Button: "Open Workspace"                                │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    ONBOARDING (one-time)                             │   │
│   │  • Meet the team (Sarah, Marcus, Priya, Alex, Jordan)                │   │
│   │  • Read company & product documentation                              │   │
│   │  • Comprehension check                                               │   │
│   │  → Completes once, unlocks Sprint cycles                             │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│   ╔═════════════════════════════════════════════════════════════════════╗   │
│   ║                    SPRINT CYCLE (repeats)                            ║   │
│   ╠═════════════════════════════════════════════════════════════════════╣   │
│   ║                                                                      ║   │
│   ║   ┌─────────────────────────────────────────────────────────────┐    ║   │
│   ║   │              SPRINT PLANNING                                 │    ║   │
│   ║   │  • Review product backlog                                    │    ║   │
│   ║   │  • Select priority items (features, bugs, tasks)             │    ║   │
│   ║   │  • Break into smaller tasks                                  │    ║   │
│   ║   │  • Commit to sprint scope                                    │    ║   │
│   ║   │  → Outputs: Sprint Goal + Sprint Backlog                     │    ║   │
│   ║   └─────────────────────────────────────────────────────────────┘    ║   │
│   ║                              │                                        ║   │
│   ║                              ▼                                        ║   │
│   ║   ┌─────────────────────────────────────────────────────────────┐    ║   │
│   ║   │              SPRINT EXECUTION                                │    ║   │
│   ║   │  • Daily Standups (recurring ceremony)                       │    ║   │
│   ║   │  • Kanban board work (pick up tickets, move columns)         │    ║   │
│   ║   │  • Git workflow (branches, commits, PRs)                     │    ║   │
│   ║   │  • Code review & collaboration                               │    ║   │
│   ║   │  • Mid-sprint adjustments if needed                          │    ║   │
│   ║   │  → When tickets done, unlocks Review                         │    ║   │
│   ║   └─────────────────────────────────────────────────────────────┘    ║   │
│   ║                              │                                        ║   │
│   ║                              ▼                                        ║   │
│   ║   ┌─────────────────────────────────────────────────────────────┐    ║   │
│   ║   │              SPRINT REVIEW                                   │    ║   │
│   ║   │  • Demo completed work to stakeholders                       │    ║   │
│   ║   │  • Get feedback on deliverables                              │    ║   │
│   ║   │  → Unlocks Retrospective                                     │    ║   │
│   ║   └─────────────────────────────────────────────────────────────┘    ║   │
│   ║                              │                                        ║   │
│   ║                              ▼                                        ║   │
│   ║   ┌─────────────────────────────────────────────────────────────┐    ║   │
│   ║   │              SPRINT RETROSPECTIVE                            │    ║   │
│   ║   │  • What went well?                                           │    ║   │
│   ║   │  • What could improve?                                       │    ║   │
│   ║   │  • Action items for next sprint                              │    ║   │
│   ║   └─────────────────────────────────────────────────────────────┘    ║   │
│   ║                              │                                        ║   │
│   ║                              ▼                                        ║   │
│   ║                [Next Sprint] ←──or──→ [Graduate]                      ║   │
│   ╚═════════════════════════════════════════════════════════════════════╝   │
│                                      │                                       │
│                                      ▼                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    JUNIOR READY!                                     │   │
│   │              (Portfolio + Badge)                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Workspace Phase Architecture

### Phase Flow (replaces "Days" approach)

| Phase | Type | Description | Gates |
|-------|------|-------------|-------|
| **Onboarding** | One-time | Team intros, docs, comprehension | Must complete before Sprint 1 |
| **Sprint Planning** | Per-sprint | Backlog review, goal setting, commitment | Outputs Sprint Goal + Backlog |
| **Sprint Execution** | Per-sprint | Daily work, standups, Kanban, Git | Tickets must be done for Review |
| **Sprint Review** | Per-sprint | Demo to stakeholders, feedback | Completes before Retro |
| **Sprint Retrospective** | Per-sprint | Reflection, action items | Triggers next sprint or graduation |

### Phase State Machine

```
                    ┌──────────────────────────────────────────────┐
                    │                                              │
                    ▼                                              │
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │  ┌─────────────┐
│  Onboarding │──│  Planning   │──│  Execution  │──│   Review    │─┼──│    Retro    │
│   (once)    │  │(per sprint) │  │(per sprint) │  │(per sprint) │ │  │(per sprint) │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │  └─────────────┘
      │                                                             │         │
      │                                                             │         │
      ▼                                                             │         ▼
   Complete ──────────────────────────────────────────────────────►├─► Next Sprint
                                                                    │         or
                                                                    │    Graduate
                                                                    │
                                                                    └──────────┘
```

### Phase UI Components

| Phase | Primary UI | Key Actions |
|-------|-----------|-------------|
| Onboarding | Team intro cards, doc reader, quiz | Meet team, read docs, pass comprehension |
| Planning | Backlog table, goal editor | Select items, set goal, commit |
| Execution | Kanban board, Git panel, standup modal | Move tickets, create branches, attend standups |
| Review | Demo presenter, feedback collector | Present work, receive feedback |
| Retro | Reflection cards, action items | Add went-well/improve items, commit to actions |

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
│  │                         │    │  PHASE MODULES          │    │
│  │  CATALOGUE              │    │  ├── OnboardingModule   │    │
│  │  ├── Behavioral Qs      │    │  ├── PlanningModule     │    │
│  │  ├── Technical Qs       │    │  ├── ExecutionModule    │    │
│  │  ├── System Design      │    │  ├── ReviewModule       │    │
│  │  └── Case Studies       │    │  └── RetroModule        │    │
│  └─────────────────────────┘    └─────────────────────────┘    │
│                                                                 │
│  ═══════════════════════════════════════════════════════════   │
│                    SHARED COMPONENTS                            │
│  • Competency Framework    • Readiness Engine                   │
│  • Portfolio System        • AI Orchestrator                    │
│  • Phase State Machine     • Workspace Instance Manager         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 0: Stabilize & Extract (1-2 weeks)
**Goal**: De-risk refactoring by extracting hardcoded content

| Simulator | Tasks |
|-----------|-------|
| Interview | Extract questions to JSON, extract rubrics, extract personas |
| Workspace | Extract Day 1-2 content to JSON, extract team definitions |

**Outcome**: Same UX, but content is data-driven

**Status**: ✅ Complete

---

### Phase 1: Shared Foundation (2-3 weeks)
**Goal**: Build unified data layer

**New Schema:**
- `competencies` - Skills with rubrics per mastery band
- `simulation_catalogue` - Questions/scenarios with adapter tags
- `role_adapters` - Config per role
- `competency_ledger` - User mastery scores
- `portfolio_artifacts` - Collected work samples

**Outcome**: Unified catalogue API for both simulators

**Status**: ✅ Complete

---

### Phase 2: Adapter Implementation (2-3 weeks)
**Goal**: Role and level adapters for both simulators

**Outcome**: Dynamic configuration based on user's role/level/language

**Status**: ✅ Complete

---

### Phase 3: Progression Engine & Narrative Schema (3 weeks)
**Goal**: Unified competency tracking + narrative data structures

**3A: Schema & Data Models (1 week)**
- Add `journey_arcs` table (type, order, projectTemplateId, isFinalArc)
- Add `sprints` table (arcId, sprintNumber, goal, backlog, state)
- Add `sprint_tickets` table (sprintId, ticketKey, type, status)
- Add `ceremony_instances` table (sprintId, ceremonyType, status)
- Add `project_templates` table (team, codebase, themes, softSkillPacks)
- Add `progression_paths` table (entryLevel, exitLevel, requirements, badge)

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

**Status**: ✅ Complete

---

### Phase 4: Dynamic Sprint Generation (3-4 weeks)
**Goal**: AI-powered sprint assembly from catalogue templates

**4A: Sprint Generator Service (1.5 weeks)**
- Theme selection (avoiding recent themes)
- Backlog generation from problem templates
- User ticket assignment based on difficulty band
- Soft skill event scheduling

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

**Status**: ✅ Complete

---

### Phase 5: Workspace Phase Architecture (3-4 weeks) - IN PROGRESS
**Goal**: Replace day-based flow with Scrum phase-based architecture

> **Major Revision**: This phase now focuses on the complete workspace restructuring

**5A: Workspace Instance System (1 week)**
- Add `workspace_instances` table (userId, journeyId, jobApplicationId, status, currentPhase)
- Add `workspace_phase_events` table (workspaceId, phase, status, completedAt, payload)
- Create workspace on offer acceptance
- Phase state machine with guards and transitions
- API: `GET /api/workspaces/:id/state`

**5B: Phase Modules (1.5 weeks)**
- Extract onboarding content into `OnboardingModule` (team intros, docs, comprehension)
- Create `PlanningModule` (backlog review, goal setting, commitment)
- Create `ExecutionModule` (standups, Kanban, Git workflow)
- Create `ReviewModule` (demo, stakeholder feedback)
- Create `RetroModule` (reflection, action items)

**5C: Dashboard & Navigation UX (1 week)**
- Phase stepper component (Onboarding → Planning → Execution → Review → Retro)
- Workspace hero card with "Open Workspace" CTA on Journey page
- Phase-gated CTAs (can't enter Execution until Planning complete)
- Breadcrumb navigation (Journey → Workspace → Phase)
- "Next Up" panel showing required actions

**5D: Ceremony Integration (0.5 weeks)**
- Sprint Planning ceremony outputs Sprint Goal + Backlog
- Daily Standup during Execution phase
- Sprint Review ceremony at end of Execution
- Sprint Retrospective before next sprint

**Key Changes from Previous Design:**
| Old (Day-based) | New (Phase-based) |
|-----------------|-------------------|
| Day 1, Day 2, Day 3, Day 4 | Onboarding → Planning → Execution → Review → Retro |
| Linear day progression | Cyclical sprint phases |
| All activities in monolithic component | Modular phase components |
| Implicit sprint planning | Explicit Planning phase with outputs |
| Standup on specific day | Standups throughout Execution phase |

**Status**: 🔄 In Progress (restructuring from day-based to phase-based)

---

### Phase 6: Multi-Role Content Packs (2-3 weeks)
**Goal**: Extend to PM, QA, DevOps, Data Science

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

**Status**: ⏳ Planned

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

**Status**: ⏳ Planned

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

**Status**: ⏳ Planned

---

## Updated Timeline Summary

| Phase | Duration | Focus | Status |
|-------|----------|-------|--------|
| Phase 0 | 1-2 weeks | Extract content to JSON | ✅ Complete |
| Phase 1 | 2-3 weeks | Shared schema, catalogue API | ✅ Complete |
| Phase 2 | 2-3 weeks | Role + Level adapters | ✅ Complete |
| Phase 3 | 3 weeks | Progression engine + narrative schema | ✅ Complete |
| Phase 4 | 3-4 weeks | Dynamic sprint generation | ✅ Complete |
| **Phase 5** | **3-4 weeks** | **Workspace phase architecture** | 🔄 In Progress |
| Phase 6 | 2-3 weeks | Multi-role content packs | ⏳ Planned |
| Phase 7 | 2 weeks | Portfolio + graduation | ⏳ Planned |
| Phase 8 | 1-2 weeks | Language adapters | ⏳ Planned |

**Total**: ~17-22 weeks for full implementation

---

## Phase 5 Implementation Details

### Schema Changes Required

```typescript
// workspace_instances - created when offer is accepted
{
  id: serial,
  userId: integer,
  journeyId: integer,
  jobApplicationId: integer,
  projectTemplateId: integer,
  companyName: text,
  role: text,
  status: 'active' | 'completed' | 'paused',
  currentPhase: 'onboarding' | 'planning' | 'execution' | 'review' | 'retro',
  currentSprintId: integer,
  onboardingCompletedAt: timestamp,
  createdAt: timestamp
}

// workspace_phase_events - tracks phase transitions
{
  id: serial,
  workspaceId: integer,
  phase: text,
  sprintId: integer (nullable),
  status: 'started' | 'completed',
  payload: jsonb, // phase-specific outputs (e.g., sprint goal, retro actions)
  completedAt: timestamp,
  createdAt: timestamp
}
```

### API Endpoints Required

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/workspaces` | POST | Create workspace on offer accept |
| `/api/workspaces/:id` | GET | Get workspace details |
| `/api/workspaces/:id/state` | GET | Get current phase, checklist, next actions |
| `/api/workspaces/:id/phase` | PATCH | Advance to next phase |
| `/api/workspaces/:id/onboarding/complete` | POST | Complete onboarding |
| `/api/workspaces/:id/planning/complete` | POST | Complete planning with goal/backlog |

### UI Components Required

| Component | Purpose |
|-----------|---------|
| `PhaseStepperComponent` | Visual phase progress indicator |
| `WorkspaceHeroCard` | "Open Workspace" CTA on journey page |
| `PhaseChecklist` | Required actions for current phase |
| `NextUpPanel` | Upcoming ceremonies/actions |
| `OnboardingModule` | Team intros, docs, comprehension |
| `PlanningModule` | Backlog review, goal setting |
| `ExecutionHub` | Kanban + standups + Git |
| `ReviewModule` | Demo presenter |
| `RetroModule` | Reflection cards |

---

## Phase Dependencies

```
Phase 0-4 (Complete)
     │
     ▼
Phase 5: Workspace Phase Architecture ──────────────┐
     │                                               │
     ▼                                               │
Phase 6: Multi-Role Content ◄────────────────────────┤
     │                                               │
     ├───────────────────────────────────────────────┤
     │                                               │
     ▼                                               ▼
Phase 7: Portfolio + Graduation ◄─────────────── Phase 8: Language Adapters
```

**Critical Path**: Phase 5 → Phase 6 → Phase 7

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI generation quality inconsistent | High | Guardrails, fallback to scripted, human review flag |
| AI generation costs too high | Medium | Caching, batched generation, cost monitoring |
| Schema changes break existing features | High | Migrations, feature flags, backward compatibility |
| Content authoring bottleneck | Medium | Prioritize Developer role, template-based approach |
| Sprint generation too slow | Medium | Pre-generate next sprint, background processing |
| Phase transition UX confusing | Medium | Clear stepper, contextual help, phase checklists |

---

## What's Already Built (Phases 0-4)

| Component | Status | Location |
|-----------|--------|----------|
| Catalogue JSON files | ✅ | `shared/catalogue/workspace/`, `shared/catalogue/interview/` |
| Catalogue service | ✅ | `shared/catalogue/service.ts` |
| Database tables (competencies, catalogue, role_adapters) | ✅ | `shared/schema.ts` |
| Adapter service | ✅ | `server/services/adapter-service.ts` |
| Sprint schema (sprints, tickets, ceremonies) | ✅ | `shared/schema.ts` |
| Sprint Hub (Kanban board) | ✅ | `client/src/pages/sprint-hub.tsx` |
| Journey Dashboard | ✅ | `client/src/pages/journey-dashboard.tsx` |
| Ceremony Session component | ✅ | `client/src/components/simulation/ceremony-session.tsx` |
| Git workflow simulation | ✅ | `client/src/lib/git-simulator.ts` |
| Sprint generator service | ✅ | `server/services/sprint-generator-service.ts` |

## What Needs to Be Built (Phase 5)

| Component | Priority | Description |
|-----------|----------|-------------|
| `workspace_instances` schema | P0 | Track workspace per accepted offer |
| `workspace_phase_events` schema | P0 | Track phase transitions |
| Workspace state machine | P0 | Phase guards and transitions |
| Workspace creation on offer accept | P0 | Trigger workspace instance creation |
| PhaseStepperComponent | P0 | Visual phase indicator |
| WorkspaceHeroCard | P0 | "Open Workspace" CTA |
| OnboardingModule | P0 | Extract from intern-onboarding-session |
| PlanningModule | P0 | New: Backlog review, goal setting |
| Phase-gated navigation | P1 | Can't skip phases |
| NextUpPanel | P1 | Show required actions |
| Breadcrumb navigation | P1 | Journey → Workspace → Phase |

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `client/src/components/simulation/intern-onboarding-session.tsx` | Current onboarding (to be refactored into OnboardingModule) |
| `client/src/pages/journey-dashboard.tsx` | Journey dashboard (needs phase stepper) |
| `client/src/pages/sprint-hub.tsx` | Sprint execution UI (Kanban) |
| `client/src/components/simulation/ceremony-session.tsx` | Ceremony chat UI |
| `server/services/workspace-orchestrator.ts` | AI team member responses |
| `shared/schema.ts` | Database schema (needs workspace_instances) |

---

## Design Decisions

1. **Phase-Based, Not Day-Based**: Workspace progression follows Scrum phases, not arbitrary days
2. **Onboarding is One-Time**: Happens once per workspace, before first sprint
3. **Sprint Cycle is Repeatable**: Planning → Execution → Review → Retro cycles
4. **Explicit Planning Outputs**: Sprint Goal and Backlog are captured artifacts
5. **Phase Gates**: Can't skip phases; must complete current before advancing
6. **Ceremony Integration**: Standups during Execution, Review/Retro are phase transitions

---

## Success Metrics

- Users reach "Junior Ready" status
- Portfolio artifacts demonstrate growth
- Employers value the credential
- Works across different training programs
- Supports multiple career tracks
- Users understand their current phase and next actions
- Phase completion rates are high (low drop-off)

---

## Future: Enterprise Self-Serve Layer (Phase 9+)

### Vision
Enable B2B clients (bootcamps, coding schools, universities) to configure custom curricula through a self-serve portal, with simulations automatically assembled from the catalogue.

(Enterprise layer details remain as previously documented)
