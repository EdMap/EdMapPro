# edmap Journey System

> **Status**: ✅ Implemented (core flow) | ✅ Sprint cycling bug fixed | ⏳ Graduation pending

## Overview

This document describes how users progress through edmap, from discovering a job posting to becoming "Junior Ready".

---

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        COMPLETE USER JOURNEY                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  JOB BOARD ✅                                                            │
│      ↓                                                                   │
│  APPLICATION & INTERVIEW (Interview Simulator) ✅                        │
│      ↓                                                                   │
│  OFFER ACCEPTANCE ✅                                                     │
│      ↓                                                                   │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    WORKSPACE SIMULATOR ✅                           │ │
│  │                                                                      │ │
│  │   ONBOARDING (one-time) ✅                                          │ │
│  │   ├── Meet team: Sarah (lead), Marcus, Priya, Alex                  │ │
│  │   ├── Read company & product documentation                          │ │
│  │   ├── Comprehension check with Sarah                                │ │
│  │   └── → Unlocks Sprint cycles                                       │ │
│  │                                                                      │ │
│  │   SPRINT CYCLE (repeats) ✅                                         │ │
│  │   ├── Sprint Planning ✅ (tier progression)                         │ │
│  │   ├── Sprint Execution ✅                                           │ │
│  │   │   ├── Kanban board                                              │ │
│  │   │   ├── Ticket Workspace (git, code, PR review)                   │ │
│  │   │   └── Daily Standups                                            │ │
│  │   ├── Sprint Review ✅                                              │ │
│  │   ├── Sprint Retrospective ✅                                       │ │
│  │   └── → Next Sprint ✅                                              │ │
│  │                                                                      │ │
│  │   GRADUATION ⏳                                                      │ │
│  │   ├── Final 1:1 with Manager                                        │ │
│  │   ├── Portfolio compilation                                         │ │
│  │   └── Junior Ready badge                                            │ │
│  │                                                                      │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase State Machine

The workspace uses a linear phase state machine:

```
ONBOARDING → PLANNING → EXECUTION → REVIEW → RETRO → [PLANNING...]
```

| Phase | Guard File | Module File |
|-------|------------|-------------|
| onboarding | `phase-guard.tsx` | `onboarding-module.tsx` |
| planning | `phase-guard.tsx` | `planning-module.tsx` |
| execution | `phase-guard.tsx` | `execution-module.tsx` |
| review | `phase-guard.tsx` | `review-module.tsx` |
| retro | `phase-guard.tsx` | `retro-module.tsx` |

### Phase Advancement

Phases are advanced via API call:

```typescript
// POST /api/workspaces/:id/advance
{
  currentPhase: 'onboarding',
  payload: { completedTeamIntros: true, readDocs: true }
}
// Returns: { newPhase: 'planning', success: true }
```

**Important Pattern**: Always call advance API and wait for response before navigating.

---

## Job Board → Workspace Flow

### Step 1: Job Board (✅ Built)

User browses available positions filtered by:
- Role (Developer, PM, QA, etc.)
- Level (Intern, Junior, Mid, Senior)
- Company/project type

### Step 2: Application (✅ Built)

User submits application with:
- Resume/portfolio link
- Cover letter responses
- Availability

### Step 3: Interview Simulator (✅ Built)

Multi-stage interview process:
1. **HR Screening** - Background, culture fit
2. **Team Interview** - Multi-persona interviewers (see TEAM_INTERVIEW_SPEC.md)
3. **Technical Assessment** - Role-appropriate challenges

### Step 4: Offer & Acceptance (✅ Built)

On successful interview:
- User receives offer details
- Celebration modal on acceptance
- Workspace automatically created

---

## Workspace Phases

### Onboarding Phase (✅ Built)

**Purpose**: Introduce user to team and project context

**Activities**:
1. **Team Introductions** - 1:1 chats with each team member
   - Marcus (Developer) - Tech stack, code reviews
   - Priya (Product Manager) - Product context, stakeholders
   - Alex (QA Engineer) - Testing processes
   
2. **Documentation Reading** - Company and product docs

3. **Comprehension Check** - Chat with Sarah (team lead) to verify understanding

**Completion Criteria**:
- All team intros completed
- Documentation read
- Sarah check passes

**Adapter System**: `shared/adapters/team-intro/`, `shared/adapters/comprehension/`

---

### Planning Phase (✅ Built)

**Purpose**: Collaborative sprint planning with AI team

**Flow**:
```
Briefing Screen → Context Phase → Discussion Phase → Commitment Phase
```

**Features**:
- Pre-meeting briefing with agenda and attendees
- Multi-persona AI discussion (Sarah, Marcus, Priya, Alex)
- Backlog item selection
- Story point estimation
- Sprint goal commitment

**Output**: Sprint with selected tickets and goal

**Adapter System**: `shared/adapters/planning/`

---

### Execution Phase (✅ Built)

**Purpose**: Work on sprint tickets

**Features**:
- **Kanban Board** - Drag tickets between columns (To Do, In Progress, Review, Done)
- **Daily Standups** - AI feedback on progress updates
- **Ticket Workspace** - Full development environment
  - Git terminal (branch, add, commit, push, PR)
  - Monaco code editor with LLM execution
  - PR review with persistent threads
  - Team chat

**Completion Criteria**: All assigned tickets in "Done" column

**Adapter System**: `shared/adapters/execution/`, `shared/adapters/code-execution/`

---

### Review Phase (✅ Built)

**Purpose**: Demo completed work to stakeholders

**Features**:
- Role-aware stakeholders (Eng Manager, Tech Lead, VP Product)
- Level-adjusted demo format (guided → freeform)
- AI-generated feedback on deliverables

**Adapter System**: `shared/adapters/review/`

---

### Retro Phase (✅ Built)

**Purpose**: Reflect on sprint and set action items

**Features**:
- Sprint context recap with metrics
- What went well / What could improve
- Level-adjusted facilitation
- Action items for next sprint

**Adapter System**: `shared/adapters/retro/`

---

## Sprint Cycling (🔄 Partial)

After retro, system should:
1. Complete current sprint
2. Generate new sprint with fresh backlog
3. Create new planning session
4. Return to planning phase

**Known Issues** (see PRODUCT_ROADMAP.md for details):
- Sprint number off-by-one error
- Auto-start messages missing for new sprints
- Orphaned planning sessions not cleaned up

---

## Graduation System (⏳ Planned)

### Final 1:1 Ceremony

Triggered when user:
- Completes minimum sprints (e.g., 3)
- Reaches readiness threshold
- Chooses to graduate

**Content**:
1. Journey review - Highlights from all sprints
2. Competency assessment - Final scores
3. Portfolio compilation - Best PRs, code samples
4. Manager's closing words

### Exit Experience

- Junior Ready badge display
- Portfolio view
- Option to start new journey

---

## Progression Paths

The journey system supports multiple progression paths:

| Path | Entry | Focus | Exit Badge |
|------|-------|-------|------------|
| Intern → Junior | New graduates | Foundational habits | Junior Ready |
| Junior → Mid | 1-2 years exp | Technical leadership | Mid Ready |
| Mid → Senior | 3-5 years exp | Architecture, mentoring | Senior Ready |

Currently only **Intern → Junior** is implemented.

---

## Key Database Tables

| Table | Purpose |
|-------|---------|
| `job_postings` | Available positions |
| `job_applications` | User applications |
| `workspace_instances` | User workspaces |
| `workspace_phase_events` | Phase transitions |
| `journeys` | User progression data |
| `sprints` | Sprint metadata |
| `planning_sessions` | Planning state |
| `sprint_tickets` | Tickets in sprints |

---

## See Also

- [SPRINT_CEREMONIES.md](./SPRINT_CEREMONIES.md) - Detailed ceremony specifications
- [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md) - Current state and priorities
- [TEAM_INTERVIEW_SPEC.md](./TEAM_INTERVIEW_SPEC.md) - Interview level calibration
