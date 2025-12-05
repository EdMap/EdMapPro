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

**Code Execution System**: edmap uses LLM-simulated code execution, providing instant feedback and educational value without the overhead of sandboxed containers. This approach leverages static analysis (ESLint, TypeScript) combined with LLM simulation for test execution, offering a cost-effective and pedagogically rich experience. The system is level-aware, adjusting starter code, test visibility, and hints.

**PR Review System**: Utilizes adapter architecture to provide level-aware code review experiences, configuring `PRReviewConfig` based on role and level, influencing layout, feedback tone, severity distribution, and auto-resolution of minor comments.

**Sprint Review System**: Provides role-aware, level-adjusted sprint review ceremonies. `SprintReviewConfig` adapts demo formats, feedback tones, and stakeholder interactions based on user role and level, including dynamic demo scripts and AI-generated stakeholder feedback.

**Sprint Retrospective System**: Offers role-aware, level-adjusted retrospective ceremonies. `SprintRetroConfig` customizes facilitation styles, prompting frequency, action item requirements, and focuses based on role and level, incorporating sprint context recap and AI-suggested starter cards.

## External Dependencies

### AI Services
-   **Groq API**: For AI features, primarily `llama-3.3-70b-versatile` for AI team responses.
-   **Whisper AI**: For voice transcription.

### Database
-   **Neon Database**: Serverless PostgreSQL for production.
-   **@neondatabase/serverless**: Optimized library for database connections.

### Authentication
-   Session-based authentication with a PostgreSQL session store.