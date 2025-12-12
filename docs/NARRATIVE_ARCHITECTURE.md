# Narrative Architecture Overview

> **Note**: This document has been refactored. For detailed specifications, see:
> - [JOURNEY_SYSTEM.md](./JOURNEY_SYSTEM.md) - User journey from job board to graduation
> - [SPRINT_CEREMONIES.md](./SPRINT_CEREMONIES.md) - Scrum ceremony specifications

## Overview

This document provides a high-level overview of edmap's narrative architecture - how the platform assembles experiences to transform users from Intern to Junior Ready.

---

## Core Concepts

### Arcs

The top-level narrative containers:

| Arc Type | Description | Status |
|----------|-------------|--------|
| **Onboarding** | One-time team introduction and documentation | ✅ Built |
| **Sprint** | Repeating Scrum cycle (Planning → Execution → Review → Retro) | ✅ Built |
| **Graduation** | Final 1:1, portfolio, badge award | ⏳ Planned |

### Phases

Within the workspace, users progress through 5 phases:

```
ONBOARDING → PLANNING → EXECUTION → REVIEW → RETRO → [PLANNING...]
```

Each phase has:
- **Guard component** (`phase-guard.tsx`) - Prevents access until previous phase complete
- **Module component** - The actual phase UI
- **Adapter system** - Role/level-specific configuration

### Activities

Activities are the interactive units within phases:

| Activity Type | Phase | Description |
|---------------|-------|-------------|
| `team_chat` | Onboarding | 1:1 conversations with AI team members |
| `documentation_reading` | Onboarding | Read company/product docs |
| `sprint_planning` | Planning | Collaborative backlog selection |
| `standup_meeting` | Execution | Daily progress check-in |
| `ticket_work` | Execution | Code, git, PR review |
| `code_exercise` | Execution | Code editor challenges |
| `demo_presentation` | Review | Show work to stakeholders |
| `retrospective` | Retro | Reflect and set action items |

---

## Adapter Architecture

Adapters provide role/level-specific configurations:

```
shared/adapters/
├── planning/      # Sprint planning ceremony
├── execution/     # Git workflow, standups, tickets
├── review/        # Demo and stakeholder feedback
├── retro/         # Retrospective facilitation
├── code-execution/# Monaco editor scaffolding
├── team-intro/    # Onboarding conversations
└── comprehension/ # Sarah check-in config
```

### Merge Precedence

```
Defaults → Role Adapter → Level Overlay
```

Level overlays take highest precedence.

### Level Progression

| Level | Guidance | Hints | Validation |
|-------|----------|-------|------------|
| Intern | Heavy scaffolding | Always shown | Lenient |
| Junior | Moderate support | On error | Moderate |
| Mid | Light guidance | On request | Moderate |
| Senior | No hand-holding | Never | Strict |

---

## Sprint Generation

### Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SPRINT GENERATION PIPELINE                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. SELECT THEME                                                         │
│     └── From template pool, avoiding recently used                       │
│                                                                          │
│  2. GENERATE BACKLOG                                                     │
│     └── 5-8 tickets based on theme + difficulty + templates              │
│                                                                          │
│  3. SELECT USER TICKETS                                                  │
│     └── 1-3 tickets at appropriate complexity                            │
│                                                                          │
│  4. GENERATE SOFT SKILL EVENTS ✅ (triggering ❌)                        │
│     └── 2-4 events, avoiding recent repeats                              │
│                                                                          │
│  5. SCHEDULE ACROSS DAYS                                                 │
│     └── Place ceremonies and events throughout sprint                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Content Sources

| Content Type | Source |
|--------------|--------|
| Team member bios | Scripted |
| Documentation | Scripted |
| Ticket templates | Catalogue (`shared/catalogue/`) |
| Ticket descriptions | AI-generated from templates |
| Standup dialogue | AI-generated from context |
| Code review feedback | AI-generated from user's code |
| Retro insights | AI-generated from sprint data |

---

## AI Team Personas

### Core Team

| Name | Role | Key Topics |
|------|------|------------|
| **Sarah** | Team Lead | Process, validation, next steps |
| **Marcus** | Developer | Tech stack, code reviews, chess/biryani |
| **Priya** | Product Manager | Product context, stakeholders, hiking |
| **Alex** | QA Engineer | Testing, quality, puzzles/board games |

### Persona Behavior

Each persona has:
- **Required topics** - Must cover in conversations
- **Personal transitions** - Natural conversation hooks
- **Closing checklists** - Ensure valuable content delivered
- **Level overlays** - Adjust tone and depth

---

## Progression Paths

Currently only Intern → Junior is implemented:

| Path | Entry | Focus | Sprints | Exit |
|------|-------|-------|---------|------|
| Intern → Junior | New graduates | Foundational habits | 2-4 | Junior Ready badge |
| Junior → Mid | 1-2 years exp | Technical leadership | TBD | ⏳ Planned |
| Mid → Senior | 3-5 years exp | Architecture | TBD | ⏳ Planned |

### Difficulty Progression

| Sprint | Difficulty Band | Ticket Complexity |
|--------|-----------------|-------------------|
| 1 | Guided | Single-file bugs |
| 2 | Guided → Supported | Simple features |
| 3+ | Supported | Multi-file changes |

---

## Key Database Tables

| Table | Purpose |
|-------|---------|
| `workspace_instances` | User workspaces |
| `workspace_phase_events` | Phase transitions |
| `journeys` | User progression data |
| `sprints` | Sprint metadata |
| `planning_sessions` | Planning state |
| `planning_messages` | Planning chat history |
| `sprint_tickets` | Tickets in sprints |
| `review_threads` | PR review comments |

---

## Sprint Cycling Status

### ✅ What Works

- Phase transitions (onboarding → planning → execution → review → retro)
- Sprint completion detection
- New sprint generation
- Planning session creation

### ❌ Known Issues

| Issue | Description |
|-------|-------------|
| Sprint number off-by-one | Incremented twice during transition |
| Missing auto-start messages | New planning sessions lack initial AI messages |
| Orphaned sessions | Old planning sessions not cleaned up |

See [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md) for fix priority.

---

## See Also

- [JOURNEY_SYSTEM.md](./JOURNEY_SYSTEM.md) - Detailed user journey specification
- [SPRINT_CEREMONIES.md](./SPRINT_CEREMONIES.md) - Ceremony specifications
- [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md) - Current state and priorities
- [CODE_EXECUTION_ARCHITECTURE.md](./CODE_EXECUTION_ARCHITECTURE.md) - Code execution system
