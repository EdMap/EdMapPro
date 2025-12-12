# edmap Documentation Index

## Overview

edmap is an AI-powered B2B onboarding platform transforming students from "Intern" to "Junior Ready" through realistic professional simulations.

---

## Documentation Files

| Document | Description | Audience |
|----------|-------------|----------|
| [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md) | Current state, priorities, what's built vs planned | Product, Engineering |
| [JOURNEY_SYSTEM.md](./JOURNEY_SYSTEM.md) | User journey from job board to graduation | Product, Design |
| [SPRINT_CEREMONIES.md](./SPRINT_CEREMONIES.md) | Scrum ceremony specifications (Planning, Review, Retro) | Engineering |
| [CODE_EXECUTION_ARCHITECTURE.md](./CODE_EXECUTION_ARCHITECTURE.md) | LLM-simulated code execution system | Engineering |
| [TEAM_INTERVIEW_SPEC.md](./TEAM_INTERVIEW_SPEC.md) | Level-calibrated interview system | Engineering |
| [DESIGN_GUIDELINES.md](./DESIGN_GUIDELINES.md) | UI/UX patterns and styling | Design, Frontend |

---

## Quick Links

### What's Built (✅)

- Job Board → Application → Interview flow
- Workspace with 5-phase sprint cycle (Onboarding → Planning → Execution → Review → Retro)
- Monaco code editor with LLM-simulated execution
- PR review with persistent threads and re-review workflow
- Role adapters (Developer, PM) and level overlays (Intern → Senior)
- Adaptive tier progression for sprint planning (Observer → Co-Facilitator → Emerging Leader)
- Sprint cycling with session archiving

### Partially Built (🔄)

- Soft skill events (generation works, triggering/UI missing)

### Planned (⏳)

- Static analysis (ESLint, TypeScript) for real-time error detection
- Portfolio system and graduation flow
- Multi-language support (Python, C++)
- Full content for PM, QA, DevOps roles

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React/Vite)                        │
│  client/src/                                                         │
│  ├── pages/          # Route pages (job-board, workspace, etc.)      │
│  ├── components/     # UI components                                 │
│  │   ├── workspace/  # Workspace modules (planning, execution, etc.) │
│  │   └── interview/  # Interview simulator                           │
│  └── lib/            # Utilities (queryClient, etc.)                 │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       SHARED (Types/Adapters)                        │
│  shared/                                                             │
│  ├── schema.ts       # Database schema (Drizzle)                     │
│  ├── adapters/       # Role/level configuration                      │
│  │   ├── planning/   # Sprint planning adapters                      │
│  │   ├── execution/  # Sprint execution adapters                     │
│  │   ├── review/     # Sprint review adapters                        │
│  │   ├── retro/      # Retrospective adapters                        │
│  │   └── code-execution/  # Code editor adapters                     │
│  └── catalogue/      # Sprint content templates                      │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Express)                            │
│  server/                                                             │
│  ├── routes.ts       # API endpoints                                 │
│  ├── storage.ts      # Database operations                           │
│  └── services/       # Business logic                                │
│      ├── workspace-orchestrator.ts  # AI chat orchestration          │
│      ├── progression-engine.ts      # Phase/sprint transitions       │
│      ├── sprint-generator.ts        # Generate sprint content        │
│      └── code-analysis.ts           # LLM code execution             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Adapter System

Adapters configure behavior based on user role and experience level:

```typescript
const config = getSprintExecutionAdapter(role, level);
// Returns: GitCommands, StandupConfig, LayoutConfig, etc.
```

| Adapter Type | Location | Purpose |
|--------------|----------|---------|
| Sprint Planning | `shared/adapters/planning/` | Planning ceremony config |
| Planning Tiers | `shared/adapters/planning/tiers/` | Tier-based ownership levels |
| Sprint Execution | `shared/adapters/execution/` | Git workflow, standups |
| Sprint Review | `shared/adapters/review/` | Demo format, stakeholders |
| Retrospective | `shared/adapters/retro/` | Facilitation style |
| Code Execution | `shared/adapters/code-execution/` | Editor scaffolding |
| Team Intro | `shared/adapters/team-intro/` | Onboarding conversations |
| Comprehension | `shared/adapters/comprehension/` | Sarah check-in config |

---

## Key Concepts

### Phases

Workspace progresses through 5 phases in order:
1. **Onboarding** - Meet team, read docs, comprehension check
2. **Planning** - Collaborative sprint planning with AI team
3. **Execution** - Work tickets (git, code, PR review)
4. **Review** - Demo work to stakeholders
5. **Retro** - Reflect and set action items

### Levels

| Level | Guidance | Hints | Validation |
|-------|----------|-------|------------|
| Intern | Heavy | Always | Lenient |
| Junior | Moderate | On error | Moderate |
| Mid | Light | On request | Moderate |
| Senior | None | Never | Strict |

### Roles

| Role | Git | Code | Focus |
|------|-----|------|-------|
| Developer | Full | Full | Technical delivery |
| PM | None | Read-only | Stakeholder management |
| QA | Limited | Read + Test | Quality assurance |

---

## See Also

- `replit.md` - Agent memory and project summary
- `package.json` - Dependencies and scripts
- `drizzle.config.ts` - Database configuration
