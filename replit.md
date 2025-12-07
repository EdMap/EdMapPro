# edmap: AI-Powered B2B Onboarding Platform

## Overview
edmap is an AI-powered B2B onboarding platform designed to transform students into "Junior Ready" professionals through realistic B2B simulations. It offers structured "Journey Paths" for guided learning and "Practice Paths" for targeted skill development, providing simulated work experience, demonstrable readiness, and a professional portfolio. The platform aims to bridge the gap between academic knowledge and industry demands, with future ambitions to expand across various roles (Developer, PM, QA, DevOps, Data Science) and programming languages.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
edmap is built as a monorepo using React 18 (TypeScript, Vite, shadcn/ui, Tailwind CSS) for the frontend and Node.js Express.js (TypeScript, Drizzle ORM, PostgreSQL) for the backend. AI integration is powered by Groq via LangChain.js, and session management utilizes Express sessions with a PostgreSQL store.

### UI/UX Decisions
The platform features a fixed sidebar, responsive header, and distinct simulator interfaces. Interactive, persistent chat interfaces are central, with color-coding for Journey (blue) and Practice (teal) modes. Team interview messages have persona-specific styling. UI enhancements include collapsible panels with localStorage persistence, improved chat message styling, visual separation of AI/user messages, and responsive mobile components. Typing indicators and phase transition cues enhance user experience.

### System Design Choices
The system employs a monorepo structure and a dual-mode (Journey/Practice) architecture for simulators. AI agent architectures are modular and orchestrated by LangChain. A unified adapter and catalogue architecture supports diverse roles, levels, and content, tracking competency progression from Explorer to Junior Ready.

Key features include:
-   **Job Journey System**: Manages job application lifecycle, including a Job Board, AI-feedback-enabled Application Flow, and a Journey Timeline, integrated with the Interview Simulator.
-   **Interview Simulator**: AI-powered tool with dual-mode experiences, multi-persona AI teams, level calibration, two-phase AI agent architecture (Preparation/Conversation), real-time evaluation, and comprehensive reports.
-   **Workspace Simulator**: Virtual tech team environment for collaborative project work in dual-mode, featuring multi-character AI teams, role-based practice, dynamic collaboration, and interactive project artifacts.
-   **Workspace Phase System**: Simulates a complete Scrum sprint cycle (Onboarding → Planning → Execution → Review → Retro) with phase-specific modules and a `PhaseGuard` for linear progression.
-   **Collaborative Sprint Planning**: Role-aware, adapter-driven sprint planning simulating Scrum meetings, with Context, Discussion, and Commitment phases, featuring level overlays, `AutoStartSequence`, message staggering, and AI response guardrails.
-   **Narrative Progression System**: Dynamic journey system with configurable paths and competency tracking.
-   **Template-Driven Sprint Generation**: Catalogue-based system for generating varied sprint content.

The platform extensively uses adapter systems for sprint planning, execution, PR review, sprint review, and retrospective phases. These adapters dynamically configure prompts, personas, guidance levels, and UI layouts based on user role and experience level.

**Code Execution System**: edmap uses LLM-simulated code execution via Monaco editor integration, providing instant feedback and educational value without the overhead of sandboxed containers. The system features:
-   **Monaco Editor**: Full code editor with syntax highlighting in TicketWorkspace (`client/src/components/workspace/code-editor/code-editor-panel.tsx`)
-   **Code Execution Adapters**: Role/level-based scaffolding (`shared/adapters/code-execution/`) with ExecutionProvider interface for future extensibility
-   **LLM Code Analysis**: Groq-powered backend service (`server/services/code-analysis.ts`) with `/api/analyze-code` endpoint
-   **Level-aware scaffolding**: Intern gets 80% complete code, Senior gets empty files; tests and hints adjust by level

**PR Review System**: Utilizes adapter architecture to provide level-aware code review experiences, configuring `PRReviewConfig` based on role and level, influencing layout, feedback tone, severity distribution, and auto-resolution of minor comments.

**Sprint Review System**: Provides role-aware, level-adjusted sprint review ceremonies. `SprintReviewConfig` adapts demo formats, feedback tones, and stakeholder interactions based on user role and level, including dynamic demo scripts and AI-generated stakeholder feedback.

**Sprint Retrospective System**: Offers role-aware, level-adjusted retrospective ceremonies. `SprintRetroConfig` customizes facilitation styles, prompting frequency, action item requirements, and focuses based on role and level, incorporating sprint context recap and AI-suggested starter cards.

**Sprint Completion System**: Provides adaptive progress tracking and completion guidance across both the Sprint Hub dashboard and the Execution Module. `SprintCompletionConfig` includes level-aware progress messages (in progress, near complete, all done), completion CTAs with descriptions, optional team celebration messages, and configurable progress bar visibility. Interns receive encouraging team messages, while seniors get direct next-step CTAs. The Sprint Hub page displays a celebratory banner when all tickets are done, guiding users to the Sprint Review ceremony.

**Team Introduction Adapter System**: Located in `shared/adapters/team-intro/`, this provides role-aware, level-adjusted prompts for 1:1 conversations with team members (Marcus, Priya, Alex) during onboarding. Each persona has role-specific required topics (Marcus: code reviews/tech stack, Priya: product context/stakeholders, Alex: QA processes/testing). Level overlays adjust conversation tone, depth, and scaffolding - interns receive proactive guidance while seniors get concise peer-level discussion. Persona-specific personal topic transitions (Marcus mentions chess/biryani, Priya mentions hiking/podcasts, Alex mentions puzzles/board games) prevent repetitive hobby questions. Closing checklists ensure valuable onboarding content is delivered before conversations end. The `WorkspaceOrchestrator` consumes these adapters via `getTeamIntroConfig()`, `buildTeamIntroSystemPrompt()`, and `buildConversationGuidance()` functions.

**Comprehension Check Adapter System**: Located in `shared/adapters/comprehension/`, this provides role-aware, level-adjusted prompts for the comprehension check chat with Sarah (team lead) after team introductions. The adapter includes:
-   **Sarah Persona**: Team lead who validates understanding of team structure, onboarding info, and next steps
-   **Comprehension Topics**: Required topics covering team structure (roles), onboarding process (what to expect), and project context
-   **Level Overlays**: Intern gets warm encouraging tone with 2-3 user message minimum; senior gets direct professional tone with 1-2 message minimum
-   **Closing Criteria**: Configurable min/max user messages, optional understanding demonstration requirement
-   **State Analysis**: Tracks `userShowedUnderstanding`, `userAskedQuestions`, `sarahAnsweredQuestions`, `sarahOfferedNextSteps` - only evaluates user messages to avoid false positives from AI responses
-   **Completion CTA**: Level-aware completion button text and messages shown when chat completes (buttonText, description, celebrationMessage). Interns get encouraging "You're ready to join your first sprint planning session!" while seniors get direct "Move on to planning."

## External Dependencies

### AI Services
-   **Groq API**: For AI features, primarily `llama-3.3-70b-versatile` for AI team responses.
-   **Whisper AI**: For voice transcription.

### Database
-   **Neon Database**: Serverless PostgreSQL for production.
-   **@neondatabase/serverless**: Optimized library for database connections.

### Authentication
-   Session-based authentication with a PostgreSQL session store.