# edmap: AI-Powered B2B Onboarding Platform

## Overview
edmap is an AI-powered B2B onboarding platform designed to accelerate enterprise onboarding through workspace simulators. It offers three core simulation products: Interview Simulator, Negotiation Simulator, and Workspace Simulator, covering the professional journey from pre-hire to post-hire integration. The platform aims to enhance real-world collaboration skills within a virtual tech team environment, allowing users to practice various roles in dynamic project scenarios with AI-powered teammates. The project's ambition includes tailoring curriculum-aligned journeys for educational institutions like 42 London, starting with intern-level positions and progressing to advanced scenarios across various tech specializations.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features a fixed sidebar navigation with a responsive header and dedicated interfaces for each simulator type. Interactive chat interfaces with message persistence are central to the user experience. Different accent themes are used to distinguish between Journey Mode (blue) and Practice Mode (teal) in the Workspace Simulator.

### Technical Implementations
edmap is built as a monorepo with a React 18 frontend (TypeScript, Vite, shadcn/ui, Tailwind CSS, TanStack Query, Wouter, React Hook Form with Zod) and a Node.js Express.js backend (TypeScript, Drizzle ORM, PostgreSQL). AI integration is powered by Groq via LangChain.js, and session management uses Express sessions with a PostgreSQL store.

### Feature Specifications
- **Job Journey System**: Manages the entire job application lifecycle, including a searchable Job Board, an Application Flow with AI-generated feedback, and a Journey Timeline to track progress. It supports various company profiles and interview pipelines, integrating seamlessly with the Interview Simulator.
- **Interview Simulator**: An AI-powered tool offering dual-mode (Practice and Journey) interview experiences. It features multi-persona team interviews with distinct AI roles, level calibration for questions, and a two-phase AI agent architecture (Preparation and Conversation) for dynamic, adaptive interviews. Key elements include a question backlog system, real-time evaluation, smart follow-ups, proactive answer detection, and a comprehensive final report.
- **Workspace Simulator**: Creates a virtual tech team environment for collaborative project work, also featuring dual-mode functionality (Journey and Practice). It includes multi-character AI teams with distinct roles and personalities, role-based practice, and various project scenarios like "Task Management App" and "Enterprise Feature Scenario." Progress is persistently saved, and the simulator offers dynamic collaboration through multi-channel communication, interactive project artifacts, and specialized session components (e.g., `InternOnboardingSession` for a 5-day intern onboarding journey). Enhanced chat features, a "What to Do Now" guidance system, and a document viewer for PM documentation are also integrated.

### System Design Choices
The system uses a monorepo structure to organize `client/`, `server/`, `shared/`, and `migrations/` directories. Dual-mode architectures are consistently applied across simulators to provide both structured, context-aware experiences (Journey Mode) and flexible, skill-building opportunities (Practice Mode). AI agent architectures are modular, utilizing LangChain for orchestrating specialized chains to manage complex interactions and evaluations.

## External Dependencies

### AI Services
- **Groq API**: Utilized for its `llama-3.3-70b-versatile` model to power AI features across the Interview Simulator, Workspace Simulator AI team responses, and Whisper AI for voice transcription.

### Database
- **Neon Database**: Serverless PostgreSQL database used for production environments.
- **@neondatabase/serverless**: Library for optimized database connections.

### Authentication
- Session-based authentication is implemented.

## Recent Updates

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