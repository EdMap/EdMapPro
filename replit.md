# edmap: AI-Powered B2B Onboarding Platform

## Overview
edmap is an AI-powered B2B onboarding platform designed to transition students from "Intern" to "Junior Ready" through realistic professional simulations. It exposes learners to real-world technical and soft challenges, enabling them to gain practical experience and stand out in the job market. The platform offers two primary user paths: a guided, story-driven "Journey Path" and a targeted, drill-focused "Practice Path." Its core value proposition is to provide simulated work experience, demonstrated readiness, and a professional portfolio, addressing the gap between theoretical knowledge and real-world job demands. Future ambitions include multi-role support (Developer, PM, QA, DevOps, Data Science) and language adapters (C/C++, JavaScript, Python).

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features a fixed sidebar navigation, responsive header, and distinct interfaces for each simulator. Interactive chat interfaces with message persistence are central. Journey Mode uses a blue accent theme, while Practice Mode uses a teal accent theme. Team interview messages incorporate persona-specific styling with distinct colors and display persona names and roles.

**Sprint Planning UI Enhancements**:
- Collapsible Learning Objectives panel with localStorage persistence (collapsed by default after first view)
- Improved chat message styling with larger avatars (h-10), rounded-2xl corners, better spacing (mb-5), and visual hierarchy
- Enhanced chat area with increased min-height (400px/450px on desktop) for better conversation visibility
- Visual separation between AI and user message groups via gradient divider lines
- Enhanced backlog panel with card-style items, subtle hover effects, ring highlighting for selected items
- Responsive mobile tabs for switching between Discussion and Backlog panels on smaller screens
- Typing indicator with animated indigo-colored dots during message staggering
- Phase transition visual cues with pulsing Continue button and inline hints

### Technical Implementations
edmap is built as a monorepo, utilizing a React 18 frontend (TypeScript, Vite, shadcn/ui, Tailwind CSS, TanStack Query, Wouter, React Hook Form with Zod) and a Node.js Express.js backend (TypeScript, Drizzle ORM, PostgreSQL). AI integration is powered by Groq via LangChain.js, and session management uses Express sessions with a PostgreSQL store.

### System Design Choices
The system employs a monorepo structure (`client/`, `server/`, `shared/`, `migrations/`). Both simulators consistently use dual-mode architectures (Journey and Practice) for varied learning experiences. AI agent architectures are modular, orchestrated by LangChain for complex interactions and evaluations. A unified adapter and catalogue architecture is implemented to manage various roles, levels, and content. The competency framework tracks progression from Explorer to Contributor to Junior Ready.

### Feature Specifications
- **Job Journey System**: Manages the job application lifecycle, including a searchable Job Board, AI-feedback-enabled Application Flow, and a Journey Timeline, integrating with the Interview Simulator.
- **Interview Simulator**: An AI-powered tool offering dual-mode interview experiences with multi-persona AI teams, level calibration, and a two-phase AI agent architecture (Preparation and Conversation). It includes a question backlog, real-time evaluation, smart follow-ups, and comprehensive final reports.
- **Workspace Simulator**: Creates a virtual tech team environment for collaborative project work in dual-mode. It features multi-character AI teams, role-based practice, various project scenarios, persistent progress saving, dynamic collaboration via multi-channel communication, interactive project artifacts, and specialized session components.
- **Workspace Phase System**: A complete Scrum sprint cycle simulation integrated with the Job Journey system:
  - Five phases: Onboarding → Planning → Execution → Review → Retro
  - Phase-specific modules with multi-step workflows
  - PhaseGuard component for enforcing linear phase progression
  - Phase-specific color themes and automatic workspace creation on job offer acceptance
  - WorkspaceDashboard with PhaseStepper visualization and phase checklist
- **Collaborative Sprint Planning**: A role-aware, adapter-driven sprint planning experience simulating real Scrum planning meetings:
  - Single meeting flow with Context, Discussion, and Commitment phases
  - Role-aware adapters adapting experience based on workspace.role
  - Level overlays adjusting difficulty and scaffolding
  - AutoStartSequence system for multi-message conversation kickoffs
  - Message staggering UI for realistic typing simulation
  - AI response guardrails for clean, single-persona responses
- **Narrative Progression System**: Dynamic journey system with configurable progression paths and competency tracking
- **Template-Driven Sprint Generation**: Catalogue-based system for generating varied sprint content

## Adapter Architecture

### Sprint Planning Adapters
Located in `shared/adapters/planning/`, the adapter system provides role-aware and level-adjusted planning experiences.

**Structure:**
```
shared/adapters/planning/
├── index.ts           # Factory: getSprintPlanningAdapter(role, level)
├── types.ts           # TypeScript interfaces
├── roles/
│   ├── developer.ts   # Developer, QA, DevOps, Data Science adapters
│   └── pm.ts          # Product Manager adapter
└── levels/
    ├── intern.ts      # Heavy guidance, auto-start sequences
    ├── junior.ts      # Moderate guidance
    ├── mid.ts         # Light guidance
    └── senior.ts      # Minimal guidance, complex scenarios
```

**Key Interfaces:**
- `RolePlanningAdapter`: Base behavior per role (prompts, personas, facilitator, commitmentGuidance)
- `LevelPlanningOverlay`: Difficulty modifiers, engagement patterns, UI overrides
- `SprintPlanningAdapter`: Final merged adapter returned by factory

**Role-Based Guidance:**

| Feature | Developer Roles | PM Role |
|---------|-----------------|---------|
| Facilitator | AI (Priya) | User (intern/junior: mentored by senior PM) |
| Selection Guidance | Level-defined (autoAssign for intern) | Level-defined |
| Commitment Guidance | `autoSet` - AI PM defines sprint goal | `userDefined` - User defines goal |
| Personas | Priya (PM), Marcus (Sr Dev), Alex (QA) | Marcus (Sr Dev), Sarah (Tech Lead), Alex (QA) |

**Level-Based Engagement:**

| Level | Mode | Selection | Auto-Start | Team Talk Ratio |
|-------|------|-----------|------------|-----------------|
| Intern | Shadow | autoAssign | 6-message sequence | 85% AI |
| Junior | Guided | prompted | 3-message sequence | 70% AI |
| Mid | Active | selfManaged | Single welcome | 50% AI |
| Senior | Facilitator | selfManaged | None | 30% AI |

**Selection Guidance Modes:**
- `autoAssign`: Team auto-selects recommended items, user reviews (intern)
- `prompted`: Team suggests, user makes final selection (junior)
- `selfManaged`: User manages selection independently (mid/senior)

**Commitment Guidance Modes:**
- `autoSet`: AI PM (Priya) defines the sprint goal (developer roles)
- `userDefined`: User defines the sprint goal (PM role at all levels)

### Backlog Catalogue
Located in `shared/adapters/planning/backlog-catalogue.ts`, the unified backlog catalogue serves as the single source of truth for sprint items across planning and execution phases.

**Key Features:**
- Centralized `BACKLOG_CATALOGUE` array with all available sprint items
- Each item has `id`, `title`, `description`, `storyPoints`, `priority`, `type`, and `acceptanceCriteria`
- `getBacklogItems()` and `getBacklogItemById()` helper functions
- Items selected during planning (stored as IDs) are resolved to full ticket data during execution

### Planning-to-Execution Integration
When transitioning from planning to execution phase:
1. `advanceWorkspacePhase` calls `createSprintTicketsFromPlanning(workspaceId, sprintId)`
2. Function queries the most recent planning session (completed or active)
3. Deletes any existing sprint_tickets not in the selected items
4. Creates new sprint_tickets from the backlog catalogue for each selected item
5. Sync endpoint `/api/workspaces/:workspaceId/sync-tickets` available for retroactive fixes

**Route Pattern:** Sprint execution requires both journeyId and sprintId: `/journey/:journeyId/sprint/:sprintId`

## Data Model

### Planning Tables
- `planningSessions`: Tracks phase progress, selected items, goal, commitment
- `planningMessages`: Conversation history with sender, role, phase

### Key Fields
- `goalStatement`: Sprint goal (auto-set for developers, user-defined for PMs)
- `selectedItems`: Array of selected backlog item IDs (references BACKLOG_CATALOGUE)
- `capacityUsed`: Story points committed
- `autoStartInitialized`: Prevents duplicate auto-start messages on refresh

## External Dependencies

### AI Services
- **Groq API**: Powers AI features using `llama-3.3-70b-versatile` for AI team responses and Whisper AI for voice transcription.

### Database
- **Neon Database**: Serverless PostgreSQL for production environments.
- **@neondatabase/serverless**: Optimized database connections.

### Authentication
- Session-based authentication with PostgreSQL session store.
