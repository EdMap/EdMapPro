# edmap: AI-Powered B2B Onboarding Platform

## Overview
edmap is an AI-powered B2B onboarding platform designed to transition students from "Intern" to "Junior Ready" through realistic professional simulations. It exposes learners to real-world technical and soft challenges, enabling them to gain practical experience and stand out in the job market. The platform offers two primary user paths: a guided, story-driven "Journey Path" and a targeted, drill-focused "Practice Path." Its core value proposition is to provide simulated work experience, demonstrated readiness, and a professional portfolio, addressing the gap between theoretical knowledge and real-world job demands. Future ambitions include multi-role support (Developer, PM, QA, DevOps, Data Science) and language adapters (C/C++, JavaScript, Python).

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features a fixed sidebar navigation, responsive header, and distinct interfaces for each simulator. Interactive chat interfaces with message persistence are central. Journey Mode uses a blue accent theme, while Practice Mode uses a teal accent theme. Team interview messages incorporate persona-specific styling with distinct colors and display persona names and roles.

### Technical Implementations
edmap is built as a monorepo, utilizing a React 18 frontend (TypeScript, Vite, shadcn/ui, Tailwind CSS, TanStack Query, Wouter, React Hook Form with Zod) and a Node.js Express.js backend (TypeScript, Drizzle ORM, PostgreSQL). AI integration is powered by Groq via LangChain.js, and session management uses Express sessions with a PostgreSQL store.

### System Design Choices
The system employs a monorepo structure (`client/`, `server/`, `shared/`, `migrations/`). Both simulators consistently use dual-mode architectures (Journey and Practice) for varied learning experiences. AI agent architectures are modular, orchestrated by LangChain for complex interactions and evaluations. A unified adapter and catalogue architecture is implemented to manage various roles, levels, and content. The competency framework tracks progression from Explorer to Contributor to Junior Ready.

### Feature Specifications
- **Job Journey System**: Manages the job application lifecycle, including a searchable Job Board, AI-feedback-enabled Application Flow, and a Journey Timeline, integrating with the Interview Simulator.
- **Interview Simulator**: An AI-powered tool offering dual-mode interview experiences with multi-persona AI teams, level calibration, and a two-phase AI agent architecture (Preparation and Conversation). It includes a question backlog, real-time evaluation, smart follow-ups, and comprehensive final reports.
- **Workspace Simulator**: Creates a virtual tech team environment for collaborative project work in dual-mode. It features multi-character AI teams, role-based practice, various project scenarios, persistent progress saving, dynamic collaboration via multi-channel communication, interactive project artifacts, and specialized session components (e.g., `InternOnboardingSession`).
- **Workspace Phase System (Phase 5)**: A complete Scrum sprint cycle simulation integrated with the Job Journey system. Features include:
  - Five distinct phases: Onboarding → Planning → Execution → Review → Retro
  - Phase-specific modules with multi-step workflows:
    - **OnboardingModule**: Team introductions, documentation review, comprehension check with Sarah
    - **PlanningModule**: Backlog review, sprint goal setting, team commitment with capacity validation
    - **ExecutionModule**: Kanban board with drag-and-drop, git workflow simulation, team chat
    - **ReviewModule**: Demo presenter, stakeholder feedback collection, summary
    - **RetroModule**: Reflection cards (went well/to improve), voting, action items with owners
  - PhaseGuard component for enforcing linear phase progression
  - Phase-specific color themes: onboarding (teal), planning (indigo), execution (blue), review (amber), retro (violet)
  - Automatic workspace creation on job offer acceptance
  - Routes: `/workspace/:id`, `/workspace/:id/onboarding`, `/workspace/:id/planning`, `/workspace/:id/execution`, `/workspace/:id/review`, `/workspace/:id/retro`
  - WorkspaceDashboard with PhaseStepper visualization, phase checklist, and CTA buttons
- **Narrative Progression System (Phase 3)**: A dynamic journey system with configurable progression paths (Intern→Junior, Junior→Mid, Mid→Senior), story arcs (Onboarding, Sprints, Graduation), and competency tracking. Features include:
  - Level-agnostic sprint generation engine (same code, different content packs per level)
  - Delta calculator for competency changes with mastery bands (Explorer → Contributor → Junior Ready)
  - Readiness scoring with exit triggers (min sprints + user choice OR ≥85% readiness OR max sprints)
  - Progress dashboard UI showing readiness, sprint progress, and graduation eligibility
  - React Query hooks for all progression data (use-progression.ts)
- **Template-Driven Sprint Generation (Phase 4)**: A catalogue-based system for generating varied sprint content. Features include:
  - Template schema for bugs, features, and soft skills with context variables
  - 15 initial templates (7 bug, 4 feature, 4 soft skill) organized in shared/catalogue/templates/
  - SprintGeneratorService with competency-aware selection and theme rotation
  - Context substitution engine for filling template variables based on company/industry
  - Integration with progression engine via startNewSprint method
  - Quality guardrails: validateAndRepairBacklog for crash-proof template handling
  - Fallback mechanisms for exhausted templates and missing content

## External Dependencies

### AI Services
- **Groq API**: Powers AI features using `llama-3.3-70b-versatile` for the Interview Simulator, Workspace Simulator AI team responses, and Whisper AI for voice transcription.

### Database
- **Neon Database**: Serverless PostgreSQL database used for production environments.
- **@neondatabase/serverless**: Library for optimized database connections.

### Authentication
- Session-based authentication is implemented.