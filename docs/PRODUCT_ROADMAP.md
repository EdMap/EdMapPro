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
