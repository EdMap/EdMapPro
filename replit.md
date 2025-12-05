# edmap: AI-Powered B2B Onboarding Platform

## Overview
edmap is an AI-powered B2B onboarding platform that transforms students into "Junior Ready" professionals through realistic B2B simulations. It offers a "Journey Path" for guided, story-driven learning and a "Practice Path" for targeted skill development. The platform's core purpose is to provide simulated work experience, demonstrable readiness, and a professional portfolio, bridging the gap between academic knowledge and industry demands. Future plans include expanding to multiple roles (Developer, PM, QA, DevOps, Data Science) and supporting various programming languages.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
edmap is built as a monorepo, utilizing a React 18 frontend (TypeScript, Vite, shadcn/ui, Tailwind CSS, TanStack Query, Wouter, React Hook Form with Zod) and a Node.js Express.js backend (TypeScript, Drizzle ORM, PostgreSQL). AI integration is handled by Groq via LangChain.js, and session management uses Express sessions with a PostgreSQL store.

### UI/UX Decisions
The platform features a fixed sidebar, responsive header, and distinct interfaces for each simulator. Interactive chat interfaces with message persistence are central, using blue for Journey Mode and teal for Practice Mode. Team interview messages have persona-specific styling. UI enhancements include collapsible panels with localStorage persistence, improved chat message styling with larger avatars and better spacing, visual separation of AI/user messages, and responsive mobile components. Typing indicators and visual cues for phase transitions enhance user experience.

### System Design Choices
The system uses a monorepo structure (`client/`, `server/`, `shared/`, `migrations/`) and a dual-mode architecture (Journey/Practice) for simulators. AI agent architectures are modular and orchestrated by LangChain. A unified adapter and catalogue architecture supports various roles, levels, and content, tracking competency progression (Explorer to Junior Ready).

### Feature Specifications
-   **Job Journey System**: Manages job application lifecycle, including a Job Board, AI-feedback-enabled Application Flow, and a Journey Timeline, integrated with the Interview Simulator.
-   **Interview Simulator**: AI-powered tool with dual-mode experiences, multi-persona AI teams, level calibration, two-phase AI agent architecture (Preparation/Conversation), real-time evaluation, and comprehensive reports.
-   **Workspace Simulator**: Virtual tech team environment for collaborative project work in dual-mode, featuring multi-character AI teams, role-based practice, dynamic collaboration, and interactive project artifacts.
-   **Workspace Phase System**: Simulates a complete Scrum sprint cycle (Onboarding → Planning → Execution → Review → Retro) integrated with the Job Journey. Includes phase-specific modules, PhaseGuard for linear progression, and a WorkspaceDashboard.
-   **Collaborative Sprint Planning**: Role-aware, adapter-driven sprint planning simulating Scrum meetings, with Context, Discussion, and Commitment phases. Features role-aware adapters, level overlays for difficulty adjustment, AutoStartSequence, message staggering, and AI response guardrails.
-   **Narrative Progression System**: Dynamic journey system with configurable progression paths and competency tracking.
-   **Template-Driven Sprint Generation**: Catalogue-based system for generating varied sprint content.

### Adapter Architecture
The platform utilizes extensive adapter systems (`shared/adapters/planning/` and `shared/adapters/execution/`) to provide role-aware and level-adjusted experiences for sprint planning and execution. These adapters dynamically configure prompts, personas, guidance levels, and UI layouts based on the user's role (e.g., Developer, PM) and experience level (e.g., Intern, Junior, Mid, Senior).

**Sprint Planning Adapters** define facilitator roles, item selection guidance (e.g., `autoAssign`, `prompted`, `selfManaged`), and sprint goal commitment (e.g., `autoSet`, `userDefined`).
**Sprint Execution Adapters** configure Git workflows, standup behaviors, and UI scaffolding. Git command strictness, hint visibility, and shortcut availability are level-dependent.

**Execution Phase Components** include a Kanban board, Daily Standup module, and a Ticket Workspace. The Ticket Workspace features a Git terminal with command validation, team chat, quick actions, a Git workflow tracker, and a Code Work Panel for interactive code editing simulation. A `LayoutConfig` interface provides adapter-driven control over UI layout, including panel positions, sizes, and responsiveness, tailored for different roles and levels. The Code Work System integrates with Git workflow, allowing simulated code editing, testing, and persistence.

**Layout Configuration System**: The `LayoutConfig` interface in `ExecutionUIControls` provides:
- `mode`: 'two-column' | 'stacked' | 'focus-code' | 'focus-terminal'
- `sidebarPosition`: 'left' | 'right' (dynamically positions sidebar via CSS order)
- `sidebarWidth`: 'narrow' (w-72) | 'medium' (w-80) | 'wide' (w-96)
- `terminalHeight`: 'compact' | 'medium' | 'expanded'
- `chatPosition`: 'sidebar' | 'main-bottom' | 'floating'
- `collapsiblePanels`, `animateTransitions`, `mobileBreakpoint`

**Layout Merge Precedence**: Defaults → Role adapter → Level overlay (level takes highest precedence).

**Level-Specific Layout Preferences**:
| Level | Mode | Sidebar | Width | Chat Position |
|-------|------|---------|-------|---------------|
| Intern | two-column | right | wide | sidebar |
| Junior | two-column | right | medium | sidebar |
| Mid | two-column | right | narrow | main-bottom |
| Senior | focus-terminal | left | narrow | floating |

**Backlog Catalogue**: A unified `BACKLOG_CATALOGUE` in `shared/adapters/planning/backlog-catalogue.ts` serves as the single source of truth for all sprint items, integrated from planning to execution.

### PR Review System
The PR Review system follows the same adapter architecture pattern, providing level-aware code review experiences:

**PR Review Adapter Types** (`shared/adapters/execution/types.ts`):
- `PRReviewConfig`: Merged config with enabled, comment counts, reviewers, uiConfig, prompts, and levelModifiers
- `RolePRReviewConfig`: Base config per role with baseReviewers, baseUIConfig, basePrompts
- `PRReviewModifiers`: Level-specific adjustments (severityDistribution, feedbackTone, autoResolveMinorOnResponse)
- `ReviewerPersona`: Extends AIPersona with expertise, reviewStyle, focusAreas, typicalCommentCount
- `PRReviewUIConfig`: Layout options (split-diff, unified, conversation-first), showDiffViewer, inlineComments, etc.

**Merge Precedence**: `mergePRReviewConfig(roleConfig, levelComments, levelModifiers)` follows defaults → role → level.

**Level-Specific PR Review Experience**:
| Level | Layout Mode | Feedback Tone | Severity Mix | Auto-Resolve Minor |
|-------|-------------|---------------|--------------|-------------------|
| Intern | conversation-first | educational | 70% minor | Yes |
| Junior | split-diff | collaborative | 50% minor, 40% major | No |
| Mid | split-diff | direct | 30% minor, 50% major, 20% blocking | No |
| Senior | unified | peer | 20% minor, 50% major, 30% blocking | No |

**Database Schema** (`shared/schema.ts`):
- `pull_requests`: PR metadata, status, reviewers, revision cycles
- `review_threads`: Comment threads per file/line with status
- `review_comments`: Individual comments with author, type, severity
- `revision_cycles`: Tracks change request iterations
- `pr_review_events`: Audit log for review activities

## External Dependencies

### AI Services
-   **Groq API**: Utilized for AI features, specifically `llama-3.3-70b-versatile` for AI team responses and Whisper AI for voice transcription.

### Database
-   **Neon Database**: Serverless PostgreSQL database used for production environments.
-   **@neondatabase/serverless**: Library for optimized database connections.

### Authentication
-   Session-based authentication with a PostgreSQL session store.