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
│   ║   │              SPRINT REVIEW ✅                                │    ║   │
│   ║   │  • Demo completed work to stakeholders                       │    ║   │
│   ║   │  • Get AI-generated feedback on deliverables                 │    ║   │
│   ║   │  • Role-aware stakeholders (Eng Manager, Tech Lead, etc.)    │    ║   │
│   ║   │  • Level-adjusted demo format (guided → freeform)            │    ║   │
│   ║   └─────────────────────────────────────────────────────────────┘    ║   │
│   ║                              │                                        ║   │
│   ║                              ▼                                        ║   │
│   ║   ┌─────────────────────────────────────────────────────────────┐    ║   │
│   ║   │              SPRINT RETROSPECTIVE ✅                         │    ║   │
│   ║   │  • Sprint context recap with metrics                         │    ║   │
│   ║   │  • What went well? / What could improve?                     │    ║   │
│   ║   │  • Level-adjusted facilitation (guided → self-directed)      │    ║   │
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
| **Sprint Review** | Role-aware demo with AI stakeholder feedback | `shared/adapters/review/`, `client/src/components/workspace/review-module.tsx` |
| **Sprint Retrospective** | Level-adjusted facilitation with sprint context | `shared/adapters/retro/`, `client/src/components/workspace/retro-module.tsx` |
| **Monaco Code Editor** | Embedded code editor with syntax highlighting | `client/src/components/workspace/code-editor/code-editor-panel.tsx` |
| **LLM Code Execution** | AI-powered code analysis and test simulation | `server/services/code-analysis.ts`, `shared/adapters/code-execution/` |
| **Code Execution Adapters** | Role/level-based scaffolding for code challenges | `shared/adapters/code-execution/` |

### 🔄 Partially Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| **PR Review Flow** | Functional with re-review | Review threads persist, re-review verification works |
| **Sprint Cycling** | Core logic exists | See detailed breakdown below |

#### Sprint Cycling - Detailed Status

**✅ What's Built:**
| Component | Description |
|-----------|-------------|
| `progressionEngine.completeSprint()` | Updates journey's `completedSprints` and `currentSprintNumber` |
| `progressionEngine.startNewSprint()` | Generates new sprint with backlog from templates |
| Advance endpoint detects retro→planning | Calls completeSprint + startNewSprint when transitioning |
| Workspace `currentSprintId` update | Points to newly created sprint |
| New planning session creation | Creates session with adapter config |

**❌ What's Missing:**
| Issue | Description |
|-------|-------------|
| Sprint number off-by-one | Journey's `currentSprintNumber` incremented twice (once in completeSprint, once used by startNewSprint) |
| Auto-start messages missing | Sprint cycling creates planning session but doesn't insert initial AI chat messages |
| Old session cleanup | Orphaned planning sessions (no sprint_id) remain active |
| Backlog items not populated | New sprint's backlog needs proper propagation to `getPlanningSessionState()` |

#### Soft Skill Events - ✅ Implemented

**UX Design: Suggestion-Insert Pattern**

Soft skill events use a hybrid response pattern where curated suggestions populate an editable input field:

| User Action | suggestionId | wasEdited | Evaluation |
|-------------|--------------|-----------|------------|
| Used suggestion as-is | `"ask-clarifying"` | `false` | Direct rubric mapping (instant) |
| Used suggestion + edited | `"ask-clarifying"` | `true` | LLM evaluation (~2-3s) |
| Wrote from scratch | `null` | N/A | LLM evaluation (~2-3s) |

Level-aware suggestion visibility: Interns always see suggestions; Seniors see collapsed/hidden suggestions.

**✅ What's Built:**
| Component | Description |
|-----------|-------------|
| Template loading | Loads from `shared/catalogue/templates/soft-skills/` |
| Selection logic | Picks 2-4 events, avoids recent repeats via cooldown |
| Event generation | `generateSoftSkillEvents()` in sprint-generator.ts |
| Stored in sprint | Saved to `sprint.backlog` as `softSkillEvents` array |
| Triggering system | Events fire based on sprint day during execution module |
| UI component | `SoftSkillEventModal` with suggestion-insert pattern |
| Response evaluation | Direct rubric mapping + LLM scoring for edited/custom |
| Completion tracking | `softSkillEventCompletions` table tracks status |
| Competency scoring | Event scores contribute to competency deltas |

**Key Files:**
- Templates: `shared/catalogue/templates/soft-skills/*.json`
- Adapters: `shared/adapters/soft-skills/` (role/level configuration)
- Evaluation service: `server/services/soft-skill-evaluation.ts`
- UI component: `client/src/components/workspace/soft-skill-event-modal.tsx` (not yet created)
- Storage: `getSprintActivitiesByType()` filters by activity type

**API Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sprints/:sprintId/soft-skill-events` | GET | List all soft skill events for a sprint |
| `/api/sprints/:sprintId/soft-skill-events/pending` | GET | Get pending events for current day |
| `/api/soft-skill-events/:activityId/respond` | POST | Submit response and get evaluation |
| `/api/soft-skill-events/:activityId/trigger` | POST | Mark event as in-progress |

**Evaluation Service Features:**
- Dual evaluation path: rubric mapping (instant) or LLM scoring (~2-3s)
- Weighted scoring using role-specific rubric weights from adapter
- Competency deltas calculated based on performance
- Follow-up message generation from scenario sender
- Graceful fallback when GROQ_API_KEY unavailable

### ⏳ Planned (Not Started)

| Feature | Description |
|---------|-------------|
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

### Sprint Review Adapters

```
shared/adapters/review/
├── index.ts           # Factory: getSprintReviewAdapter(role, level)
├── types.ts           # StakeholderPersona, DemoConfig, FeedbackConfig
├── roles/
│   ├── developer.ts   # Tech-focused stakeholders (Eng Manager, Tech Lead)
│   └── pm.ts          # Product-focused stakeholders (VP Product, Customer Success)
└── levels/
    ├── intern.ts      # Guided demo, 70% positive feedback
    ├── junior.ts      # Prompted demo, constructive feedback
    ├── mid.ts         # Minimal prompts, direct feedback
    └── senior.ts      # Freeform demo, challenging feedback
```

### Sprint Retrospective Adapters

```
shared/adapters/retro/
├── index.ts           # Factory: getRetroAdapter(role, level)
├── types.ts           # FacilitatorPersona, RetroCard, SprintContextData
├── roles/
│   ├── developer.ts   # Focus: Code Quality, PR Process, Technical Debt
│   └── pm.ts          # Focus: Requirements, Stakeholders, Prioritization
└── levels/
    ├── intern.ts      # Guided facilitation, 3 starter cards
    ├── junior.ts      # Prompted facilitation, 2 starter cards
    ├── mid.ts         # Collaborative, 1 starter card
    └── senior.ts      # Self-directed, no starter cards
```

### Code Execution Adapters

```
shared/adapters/code-execution/
├── index.ts           # Factory: getCodeExecutionAdapter(role, level)
├── types.ts           # ExecutionProvider, CodeChallenge, ExecutionResponse
├── roles/
│   ├── developer.ts   # Full editing, all tests, complete feedback
│   └── pm.ts          # Read-only code, simplified tests, high-level feedback
└── levels/
    ├── intern.ts      # 80% scaffolded code, all tests visible, always hints
    ├── junior.ts      # Function stubs, test names only, on-error hints
    ├── mid.ts         # File structure only, hidden tests, on-request hints
    └── senior.ts      # Empty project, write own tests, no hints
└── providers/
    └── llm-provider.ts # Groq-powered code analysis and test simulation
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

## Code Execution System (Implemented)

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

### ✅ P0: Complete Sprint Cycle (DONE)
1. ~~Wire up Sprint Review ceremony (demo presentation flow)~~ ✅
2. ~~Wire up Sprint Retro ceremony (reflection and action items)~~ ✅
3. Enable sprint cycling (complete retro → start next sprint) - *partial*

### ✅ P1: Real Code Editor & LLM Execution (DONE)
1. ~~Embed Monaco editor in TicketWorkspace~~ ✅
2. ~~Create code analysis API endpoint with LLM simulation~~ ✅
3. ~~Extend backlog catalogue with code challenges~~ ✅
4. ~~Level-based editor scaffolding (templates → empty)~~ ✅
5. Integrate simulated test results with PR Review - *partial*

### P2: Complete Sprint Cycling & Soft Skills
1. **Fix sprint cycling bugs** (sprint number off-by-one, auto-start messages, session cleanup)
2. **Soft skill event triggering** - Day-based event scheduling during sprint execution
3. **Soft skill event UI** - Modal/chat interface for handling scenarios
4. **Event completion tracking** - Mark events as handled, track competency impact
5. Mid-sprint interruptions (AI team asks questions)
6. Burndown chart visualization

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
