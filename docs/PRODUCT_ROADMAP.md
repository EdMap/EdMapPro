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

## Complete User Journey

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
│   │              Button: "Enter Workspace"                               │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    ONBOARDING (one-time)                             │   │
│   │  • Meet the team (Sarah, Marcus, Priya, Alex)                        │   │
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
│   ║   │  • AI team discusses sprint scope                            │    ║   │
│   ║   │  • Review backlog items (bugs, features)                     │    ║   │
│   ║   │  • Select items based on capacity                            │    ║   │
│   ║   │  • Commit to sprint goal                                     │    ║   │
│   ║   │  → Outputs: Sprint Goal + Selected Tickets                   │    ║   │
│   ║   └─────────────────────────────────────────────────────────────┘    ║   │
│   ║                              │                                        ║   │
│   ║                              ▼                                        ║   │
│   ║   ┌─────────────────────────────────────────────────────────────┐    ║   │
│   ║   │              SPRINT EXECUTION                                │    ║   │
│   ║   │  • Daily Standups (AI feedback on updates)                   │    ║   │
│   ║   │  • Kanban board (drag tickets between columns)               │    ║   │
│   ║   │  • Ticket Workspace (full-screen work environment)           │    ║   │
│   ║   │    - Git terminal (branch, add, commit, push, PR)            │    ║   │
│   ║   │    - Code work panel (understand bug, apply fix)             │    ║   │
│   ║   │    - npm test (simulated test runner)                        │    ║   │
│   ║   │    - Team chat                                               │    ║   │
│   ║   │  → When tickets done, unlocks Review                         │    ║   │
│   ║   └─────────────────────────────────────────────────────────────┘    ║   │
│   ║                              │                                        ║   │
│   ║                              ▼                                        ║   │
│   ║   ┌─────────────────────────────────────────────────────────────┐    ║   │
│   ║   │              SPRINT REVIEW (planned)                         │    ║   │
│   ║   │  • Demo completed work to stakeholders                       │    ║   │
│   ║   │  • Get feedback on deliverables                              │    ║   │
│   ║   └─────────────────────────────────────────────────────────────┘    ║   │
│   ║                              │                                        ║   │
│   ║                              ▼                                        ║   │
│   ║   ┌─────────────────────────────────────────────────────────────┐    ║   │
│   ║   │              SPRINT RETROSPECTIVE (planned)                  │    ║   │
│   ║   │  • What went well?                                           │    ║   │
│   ║   │  • What could improve?                                       │    ║   │
│   ║   │  • Action items for next sprint                              │    ║   │
│   ║   └─────────────────────────────────────────────────────────────┘    ║   │
│   ║                              │                                        ║   │
│   ║                              ▼                                        ║   │
│   ║                [Next Sprint] ←──or──→ [Graduate]                      ║   │
│   ╚═════════════════════════════════════════════════════════════════════╝   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## What's Built (Current State)

### ✅ Fully Implemented

| Feature | Description | Key Files |
|---------|-------------|-----------|
| **Job Journey System** | Job board, applications, interview flow | `client/src/pages/job-board.tsx`, `client/src/pages/application-details.tsx` |
| **Interview Simulator** | AI-powered interviews with multi-persona teams | `client/src/components/interview/` |
| **Workspace Creation** | Auto-created on job offer acceptance | `server/routes.ts` |
| **Phase State Machine** | Onboarding → Planning → Execution → Review → Retro | `client/src/components/workspace/phase-guard.tsx` |
| **OnboardingModule** | Team intros, documentation, comprehension | `client/src/components/workspace/onboarding-module.tsx` |
| **PlanningModule** | Collaborative sprint planning with AI team | `client/src/components/workspace/planning-module.tsx` |
| **ExecutionModule** | Kanban board, daily standups | `client/src/components/workspace/execution-module.tsx` |
| **TicketWorkspace** | Full git workflow, code work, terminal | `client/src/components/workspace/ticket-workspace.tsx` |
| **Code Work Panel** | Interactive code editing simulation | `client/src/components/workspace/code-work-panel.tsx` |
| **Backlog Catalogue** | Unified source for sprint items | `shared/adapters/planning/backlog-catalogue.ts` |
| **Role Adapters** | Developer, PM, QA, DevOps, Data Science | `shared/adapters/execution/roles/` |
| **Level Overlays** | Intern, Junior, Mid, Senior | `shared/adapters/execution/levels/` |
| **Layout Config System** | Adapter-driven responsive layouts | `shared/adapters/execution/types.ts` |

### 🔄 Partially Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| **Sprint Review** | UI exists, ceremony not fully wired | Phase transition works, demo presentation pending |
| **Sprint Retro** | UI exists, ceremony not fully wired | Phase transition works, reflection flow pending |
| **PR Review Flow** | Schema exists, UI pending | `PRReviewConfig` in adapters ready |

### ⏳ Planned (Not Started)

| Feature | Description |
|---------|-------------|
| **Real Code Editor** | Embedded Monaco editor for actual code writing |
| **LLM-Simulated Execution** | AI analyzes code and simulates test results |
| **Portfolio System** | Collect work samples, shareable profile |
| **Graduation Flow** | Final 1:1, badge award, exit experience |
| **Language Adapters** | C/C++, Python problem templates |
| **Multi-role Content** | Full content for PM, QA, DevOps, Data Science |

---

## Adapter Architecture

### Sprint Execution Adapters

```
shared/adapters/execution/
├── index.ts           # Factory: getSprintExecutionAdapter(role, level)
├── types.ts           # GitCommand, StandupConfig, LayoutConfig, etc.
├── roles/
│   ├── developer.ts   # Full git workflow, PR reviews, code work
│   └── pm.ts          # No git terminal, stakeholder management focus
└── levels/
    ├── intern.ts      # Heavy hints, shortcut buttons, lenient validation
    ├── junior.ts      # Moderate hints, on-error hints
    ├── mid.ts         # Light hints, no shortcuts
    └── senior.ts      # No hints, strict validation
```

### Layout Configuration System

The `LayoutConfig` interface provides adapter-driven UI control:

| Property | Options | Description |
|----------|---------|-------------|
| `mode` | two-column, stacked, focus-code, focus-terminal | Layout mode |
| `sidebarPosition` | left, right | Sidebar placement |
| `sidebarWidth` | narrow (w-72), medium (w-80), wide (w-96) | Sidebar size |
| `terminalHeight` | compact, medium, expanded | Terminal panel size |
| `chatPosition` | sidebar, main-bottom, floating | Chat panel location |
| `collapsiblePanels` | true/false | Allow panel collapse |

**Merge Precedence**: Defaults → Role adapter → Level overlay (level takes highest precedence)

### Level-Specific Layout Preferences

| Level | Mode | Sidebar | Width | Chat Position |
|-------|------|---------|-------|---------------|
| Intern | two-column | right | wide | sidebar |
| Junior | two-column | right | medium | sidebar |
| Mid | two-column | right | narrow | main-bottom |
| Senior | focus-terminal | left | narrow | floating |

---

## Code Execution System (Planned)

> **Architecture Doc**: See `docs/CODE_EXECUTION_ARCHITECTURE.md` for full technical details.

### Approach: LLM-Simulated Execution

Instead of running code in sandboxed containers, edmap uses AI to analyze and simulate code execution:

```
┌─────────────────────────────────────────────────────────────┐
│  User writes code in Monaco Editor                          │
│                    ↓                                        │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │ Static Analysis │    │ LLM Simulation                  │ │
│  │ (Real errors)   │    │ (Predicts test pass/fail)       │ │
│  └─────────────────┘    └─────────────────────────────────┘ │
│                    ↓                                        │
│  Combined feedback: Syntax errors + Test results + Tips     │
└─────────────────────────────────────────────────────────────┘
```

### Why This Approach?

| Benefit | Description |
|---------|-------------|
| **Zero infrastructure** | No containers, VMs, or sandboxes to manage |
| **Instant feedback** | No cold starts, results in <2 seconds |
| **Educational value** | LLM explains *why* code works/fails |
| **Fits simulation** | Aligns with edmap's mentorship narrative |
| **Cost-effective** | ~$30/month for 1,000 users vs $170+ for containers |

### Level-Based Editor Experience

| Level | Starter Code | Tests Visible | Hints |
|-------|--------------|---------------|-------|
| Intern | 80% complete | All shown | Always |
| Junior | Function stubs | Names only | On error |
| Mid | File structure | Hidden | On request |
| Senior | Empty project | Write your own | Never |

### Language Roadmap

1. **Phase 1**: TypeScript (MVP)
2. **Phase 2**: JavaScript
3. **Phase 3**: Python
4. **Phase 4**: C++

---

## Git Workflow Simulation

### Command Flow
```
Branch → Code Work → npm test → Stage → Commit → Push → PR → Review → Merge
```

### Level-Based Guidance

| Level | Strictness | Hints | Shortcuts |
|-------|-----------|-------|-----------|
| Intern | Lenient | Always shown | Enabled |
| Junior | Moderate | On error | Enabled |
| Mid | Moderate | On request | Disabled |
| Senior | Strict | Never | Disabled |

---

## Database Schema (Key Tables)

| Table | Purpose |
|-------|---------|
| `workspace_instances` | Workspace per accepted job offer |
| `workspace_phase_events` | Phase transitions and payloads |
| `planning_sessions` | Sprint planning state and selections |
| `planning_messages` | Chat history during planning |
| `sprint_tickets` | Tickets created from backlog selection |
| `sprints` | Sprint metadata (goal, status) |

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS, TanStack Query, Wouter
- **Backend**: Node.js, Express.js, TypeScript, Drizzle ORM
- **Database**: PostgreSQL (Neon serverless)
- **AI**: Groq API (llama-3.3-70b-versatile) via LangChain.js
- **Sessions**: Express sessions with PostgreSQL store

---

## Next Steps (Priority Order)

### P0: Complete Sprint Cycle
1. Wire up Sprint Review ceremony (demo presentation flow)
2. Wire up Sprint Retro ceremony (reflection and action items)
3. Enable sprint cycling (complete retro → start next sprint)

### P1: Real Code Editor & LLM Execution (NEW)
1. Embed Monaco editor in TicketWorkspace
2. Create code analysis API endpoint with LLM simulation
3. Extend backlog catalogue with code challenges
4. Level-based editor scaffolding (templates → empty)
5. Integrate simulated test results with PR Review

### P2: Enhanced Execution
1. PR review flow in TicketWorkspace (partially complete)
2. Mid-sprint interruptions (AI team asks questions)
3. Burndown chart visualization

### P3: Portfolio & Graduation
1. Artifact collection during sprints
2. Competency score tracking
3. Graduation flow with badge award
4. Shareable portfolio page

### P4: Multi-Language & Multi-Role
1. Python code challenges
2. C++ code challenges
3. Full PM workflow (no git, stakeholder focus)
4. QA-specific problem templates
5. DevOps infra scenarios

---

## Success Metrics

- Users complete Onboarding → Planning → Execution flow
- Sprint tickets are moved through Kanban columns
- Git commands are executed successfully
- Code work panels are completed
- Users understand their current phase and next actions
- Phase completion rates are high (low drop-off)
