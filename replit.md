# edmap: AI-Powered B2B Onboarding Platform

## Overview
edmap is an AI-powered B2B onboarding platform designed to accelerate enterprise onboarding through workspace simulators. It offers three core simulation products: Interview Simulator, Negotiation Simulator, and Workspace Simulator, covering the professional journey from pre-hire to post-hire integration. The platform aims to enhance real-world collaboration skills within a virtual tech team environment, allowing users to practice various roles in dynamic project scenarios with AI-powered teammates.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Form Handling**: React Hook Form with Zod

### Backend
- **Runtime**: Node.js with Express.js REST API
- **Language**: TypeScript
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL (Neon Database)
- **AI Integration**: Groq (llama-3.3-70b-versatile) via LangChain.js
- **Session Management**: Express sessions with PostgreSQL store

### Monorepo Structure
- `client/`: React frontend
- `server/`: Express.js backend
- `shared/`: Shared TypeScript types and database schema
- `migrations/`: Database migration files

### Key Features and Implementations
- **Job Journey System**: Complete job application flow from discovery to onboarding.
    - **Job Board**: Searchable/filterable job listings with company info, salary ranges, and interactive glossary for industry terms.
    - **Application Flow**: Apply with cover letter, track progress through interview stages, receive AI-generated feedback.
    - **Journey Timeline**: Dashboard showing all applications, current stage, next actions, and completion status.
    - **Stage Progression**: Automatic advancement through interview stages based on completion and scores.
    - **Company Variety**: Multiple seed companies (startups, mid-size, enterprise) with different interview pipelines.
    - **Interview Integration**: Seamless link from Journey page to Interview Simulator via URL parameters (stageId, type, role).
    - **Database Schema**: Companies, JobPostings, JobGlossary, JobApplications, InterviewTemplates, ApplicationStages.

- **Interview Simulator**: AI-powered interview practice with dual-mode architecture and natural conversational flow.
    - **Dual-Mode System**: 
      - **Practice Mode** (Sidebar access): Standalone interviews for skill-building. Users can practice any role/type without prerequisites. Results tracked separately.
      - **Journey Mode** (Job Journey): Context-aware interviews tied to job applications. Auto-populated with company/role. Completion updates application progress and advances stages.
    - **Mode Detection**: Determined by URL parameters—stageId in URL = Journey Mode, no stageId = Practice Mode.
    - **Dynamic Interview Completion**: Instead of fixed question counts, the HR agent continuously evaluates information sufficiency.
      - **Coverage Tracking**: Monitors 6 assessment criteria (background, skills, behavioral, motivation, culture_fit, logistics)
      - **Sufficiency Thresholds**: Critical areas need 60% coverage, overall 70% before natural wrap-up
      - **Maximum Questions**: Hard limit of 15 questions to prevent endless interviews
      - **Time-Pressure Awareness**: At 75% of limit with gaps remaining, agent acknowledges time constraints and prioritizes key questions
      - **Prioritized Question Generation**: Questions target the least-covered assessment criteria
    - **Adaptive Reflections**: Context-aware acknowledgments based on answer quality:
      - Detailed answers (~100+ chars): Specific acknowledgments (~40% of time during Core stage)
      - Brief answers: Short "Got it" / "Okay" responses
      - Wrapup stage: No reflections (direct transition to closure)
    - **LangChain Chains**: Modular AI workflow with specialized chains (Question Generator, HR Question, Wrapup, Closure, Evaluator, Follow-up Decision, Reflection, Scoring).
    - **Interview Orchestrator**: Coordinates chains, manages stage transitions, coverage tracking, and interview flow.
    - **Interview Types**: Behavioral, Technical, and Case Study interviews.
    - **Role-Based Preparation**: Practice for Developer, Product Manager, Designer roles.
    - **Real-time Evaluation**: Immediate feedback with scores, strengths, and improvement areas.
    - **Final Report**: Comprehensive scoring with hiring decision recommendation.
    - **AI Backend**: Powered by Groq (llama-3.3-70b-versatile) for fast, high-quality responses.
    - **Navigation**: Practice Mode returns to interview page for new sessions; Journey Mode redirects to journey page with updated application status.
- **Workspace Simulator**: Creates a virtual tech team environment for collaborative project work.
    - **Multi-Character AI Team**: 4-6 AI teammates with distinct roles, personalities, and expertise.
    - **Role-Based Practice**: Users can practice as Developer, Product Manager, Designer, QA Engineer, or DevOps Engineer.
    - **Project Scenarios**: Includes pre-configured projects like "Task Management App" and "PulseOps IQ Enterprise Feature".
    - **Dynamic Collaboration**: Multi-channel communication (chat, standups, code reviews, email) and interactive project artifacts.
    - **Workspace Orchestrator**: Manages AI personas, orchestrates conversations, and evaluates user actions.
    - **Workspace Dashboard**: Provides progress overview, active session management, and performance visualizations.
    - **Enterprise Feature Scenario (PulseOps IQ)**: Simulates adding features to an enterprise codebase with a multi-phase workflow, simulated codebase explorer, and comprehensive PM documentation.
    - **Chat Enhancements**: `@mention` autocomplete, smart message routing, realistic AI response delays, auto-scroll, and real-time typing indicators.
    - **Phase Guidance System**: Interactive "What to Do Now" panel with objectives checklist and smart phase progression.
    - **Direct Messaging (DM) Feature**: 1-on-1 private conversations with individual AI teammates.
    - **Document Viewer System**: PM documentation opens in new browser tabs for focused reading. Requirements tab displays a document explorer with 10 clickable document cards (Executive Summary, Feature Requirements, Stakeholder Analysis, User Stories, Success Metrics, Roadmap Context, Competitive Analysis, Go-to-Market Strategy, Risk Assessment, Resource Planning). Clean, distraction-free viewing experience without sidebar/header.

### UI/UX Decisions
- Fixed sidebar navigation with responsive header.
- Dedicated interfaces for each simulator type.
- Interactive chat interfaces with message persistence.

## External Dependencies

### AI Services
- **Groq API**: llama-3.3-70b-versatile powers all AI features:
  - Interview Simulator (via LangChain.js chains)
  - Workspace Simulator AI team member responses
  - Whisper AI for voice transcription

### Database
- **Neon Database**: Serverless PostgreSQL for production.
- **@neondatabase/serverless**: For optimized database connections.

### Authentication
- Session-based authentication (MVP).

### Development Tools
- **Replit Integration**: Development environment optimizations.
- **Vite**: For fast development and optimized builds.