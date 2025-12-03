# edmap: AI-Powered B2B Onboarding Platform

## Overview
edmap is an AI-powered B2B onboarding platform designed to help students progress from **Intern → Junior Ready** through realistic professional simulations. The platform exposes learners to real-world challenges—both technical (code bugs, git issues, CI/CD) and soft (time pressure, peer conflicts, manager evaluations, feedback)—so they stand out when graduating from any training program.

## Product Vision
See `docs/PRODUCT_ROADMAP.md` for the complete product strategy and implementation plan.

### Core Value Proposition
- **Without edmap**: Graduate with theoretical knowledge, struggle with first job challenges
- **With edmap**: Graduate with simulated work experience, demonstrated readiness, professional portfolio

### Two Paths
1. **Journey Path**: Guided, story-driven experience where problems arise organically in narrative context
2. **Practice Path**: Targeted, drill-focused experience where users pick specific skills to practice

### Competency Framework
- **Three Layers**: Foundational Habits → Core Delivery Skills → Professional Impact
- **Mastery Bands**: Explorer → Contributor → Junior Ready
- **Unified Tracking**: Both Interview and Workspace simulators feed the same progression engine

### Multi-Role Support (Planned)
- Developer, PM, QA, DevOps, Data Science
- Role Adapters: Technical problems change per role, soft problems stay universal
- Language Adapters (Developer): C/C++, JavaScript, Python

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features a fixed sidebar navigation with a responsive header and dedicated interfaces for each simulator type. Interactive chat interfaces with message persistence are central to the user experience. Different accent themes are used to distinguish between Journey Mode (blue) and Practice Mode (teal) in the Workspace Simulator.

### Technical Implementations
edmap is built as a monorepo with a React 18 frontend (TypeScript, Vite, shadcn/ui, Tailwind CSS, TanStack Query, Wouter, React Hook Form with Zod) and a Node.js Express.js backend (TypeScript, Drizzle ORM, PostgreSQL). AI integration is powered by Groq via LangChain.js, and session management uses Express sessions with a PostgreSQL store.

### Unified Adapter + Catalogue Architecture (Target State)
```
SIMULATION ENGINE (Shared)
├── Interview Simulator
│   ├── Role Adapters (Developer, PM, QA, DevOps, Data Science)
│   ├── Level Adapters (Intern, Junior, Mid, Senior)
│   └── Catalogue (Behavioral Qs, Technical Qs, Case Studies)
├── Workspace Simulator
│   ├── Role Adapters (Developer, PM, QA, DevOps, Data Science)
│   ├── Language Adapters (C/C++, JavaScript, Python)
│   └── Catalogue (Technical Drills, Soft Skills Drills, Sprint Arcs)
└── Shared Components
    ├── Competency Framework
    ├── Readiness Engine
    ├── Portfolio System
    └── AI Orchestrator
```

### Feature Specifications
- **Job Journey System**: Manages the entire job application lifecycle, including a searchable Job Board, an Application Flow with AI-generated feedback, and a Journey Timeline to track progress. It supports various company profiles and interview pipelines, integrating seamlessly with the Interview Simulator.
- **Interview Simulator**: An AI-powered tool offering dual-mode (Practice and Journey) interview experiences. It features multi-persona team interviews with distinct AI roles, level calibration for questions, and a two-phase AI agent architecture (Preparation and Conversation) for dynamic, adaptive interviews. Key elements include a question backlog system, real-time evaluation, smart follow-ups, proactive answer detection, and a comprehensive final report.
- **Workspace Simulator**: Creates a virtual tech team environment for collaborative project work, also featuring dual-mode functionality (Journey and Practice). It includes multi-character AI teams with distinct roles and personalities, role-based practice, and various project scenarios like "Task Management App" and "Enterprise Feature Scenario." Progress is persistently saved, and the simulator offers dynamic collaboration through multi-channel communication, interactive project artifacts, and specialized session components (e.g., `InternOnboardingSession` for a 5-day intern onboarding journey). Enhanced chat features, a "What to Do Now" guidance system, and a document viewer for PM documentation are also integrated.

### System Design Choices
The system uses a monorepo structure to organize `client/`, `server/`, `shared/`, and `migrations/` directories. Dual-mode architectures are consistently applied across simulators to provide both structured, context-aware experiences (Journey Mode) and flexible, skill-building opportunities (Practice Mode). AI agent architectures are modular, utilizing LangChain for orchestrating specialized chains to manage complex interactions and evaluations.

## Key Files

| File | Purpose |
|------|---------|
| `docs/PRODUCT_ROADMAP.md` | Complete product strategy and implementation plan |
| `shared/catalogue/index.json` | Catalogue structure and content type definitions |
| `shared/catalogue/README.md` | Catalogue documentation and usage guide |
| `shared/catalogue/service.ts` | Query-based catalogue service (Phase 1-ready interface) |
| `shared/catalogue/loaders.ts` | Zod schemas and validation helpers for catalogue content |
| `shared/catalogue/workspace/` | Workspace simulator extracted content (team, docs, activities, tickets) |
| `shared/catalogue/interview/` | Interview simulator extracted content (questions, rubrics, personas) |
| `client/src/components/simulation/intern-onboarding-session.tsx` | Current workspace simulation (4k lines, to be modularized) |
| `client/src/pages/workspace-journey.tsx` | Journey mode entry point |
| `client/src/pages/workspace-practice.tsx` | Practice mode entry point |
| `client/src/pages/interview-simulator.tsx` | Interview simulator |
| `server/services/workspace-orchestrator.ts` | AI team member responses |
| `shared/schema.ts` | Database schema |

## External Dependencies

### AI Services
- **Groq API**: Utilized for its `llama-3.3-70b-versatile` model to power AI features across the Interview Simulator, Workspace Simulator AI team responses, and Whisper AI for voice transcription.

### Database
- **Neon Database**: Serverless PostgreSQL database used for production environments.
- **@neondatabase/serverless**: Library for optimized database connections.

### Authentication
- Session-based authentication is implemented.

## Implementation Roadmap

| Phase | Duration | Focus |
|-------|----------|-------|
| Phase 0 | 1-2 weeks | Extract content to JSON (both simulators) |
| Phase 1 | 2-3 weeks | Shared schema, catalogue API, seed content |
| Phase 2 | 2-3 weeks | Role + Level adapters (both simulators) |
| Phase 3 | 2 weeks | Progression engine, readiness tracking |
| Phase 4 | 3-4 weeks | New UX (Journey dashboard, Practice browser) |
| Phase 5 | 2-3 weeks | Multi-role expansion (PM, QA, DevOps, DS) |
| Phase 6 | 2 weeks | Portfolio + credentialing |
| Phase 7 | 1-2 weeks | Language adapters (C/C++, Python) |

See `docs/PRODUCT_ROADMAP.md` for detailed phase descriptions.

## Recent Updates

### Phase 0 Complete: Content Extraction & Service Layer (December 2025)
**Extraction Complete:**
- Extracted all hardcoded content to JSON catalogue files (15 files total)
- **Workspace Catalogue**: team-members.json, documentation-day1.json, activities-day1.json, activities-day2.json, ticket-timezone-bug.json, standup-script.json, dev-setup-steps.json, git-workflow-steps.json, codebase-structure.json, code-exercise-timezone.json, branch-creation.json
- **Interview Catalogue**: question-banks.json, interview-config.json, evaluation-rubrics.json, team-personas.json
- Created catalogue index and documentation at `shared/catalogue/`

**Service Layer (Phase 1-Ready):**
- Created `shared/catalogue/service.ts` with query-based interface matching future API signature
- `CatalogueQuery` interface: `{ simulator, type, role, level, language, day }`
- `CatalogueItem` structure: `{ meta: {...adapterTags}, content: T }`
- Strict filtering: queries only return items with matching tags (mirrors Phase 1 API behavior)
- In Phase 1, only the service implementation changes (JSON → API), not components

**Component Migration:**
- `intern-onboarding-session.tsx`: Uses JSON imports for Day 2 exercises (standup, dev-setup, git, codebase, code-exercise, branch)
- `interview-simulator.tsx`: Uses JSON imports for config (roles, types, difficulties)
- Validation helpers: validateSetupCommand, validateGitCommand, validateBranchName, validateCodeBlank

**Technical Details:**
- Added `resolveJsonModule: true` to tsconfig.json
- Using `@shared/catalogue/...` import path alias
- Service layer preserves JSON `type` field verbatim for Phase 1 DB mapping

### Strategic Planning (December 2025)
- Defined competency-based progression framework (Explorer → Contributor → Junior Ready)
- Designed unified adapter + catalogue architecture for both simulators
- Created comprehensive product roadmap with phased implementation plan
- Established multi-role support strategy (Developer, PM, QA, DevOps, Data Science)

### Team Interview UI Improvements (November 2025)
- Added persona-specific styling for team interview messages with distinct colors per role:
  - Tech Lead: Purple theme
  - Peer Engineer: Teal theme  
  - Product Partner: Orange theme
  - Engineering Manager: Indigo theme
- Messages now display persona name and role (e.g., "Sarah (Tech Lead)")
- Typing indicator shows current speaking persona
- Shared styling utility at `client/src/lib/persona-styles.ts`
- Backend returns `teamPersonas`, `isTeamInterview`, and `activePersonaId` for team interviews

### Interview Flow Improvements
- Topic rotation limits prevent repetitive questioning (max 2 consecutive questions per criterion)
- Simplified wrap-up flow only asks "any questions?" (feedback provided separately)
- Journey mode displays job posting's seniority level correctly (e.g., "Intern level")
