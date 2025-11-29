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
    - **Two-Phase Agent Architecture**:
      - **Phase 1 - Preparation** (Pre-interview): PreparationPlannerChain analyzes CV and job requirements to generate a tailored question backlog with priority scoring, assessment criteria tags, and depth targets. Identifies candidate strengths and concerns upfront.
      - **Phase 2 - Conversation**: Adaptive interview flow with smart follow-ups and proactive answer detection.
    - **Question Backlog System**: PlannedQuestion items with id, question text, criteria tags, priority (1-10), and status (pending/asked/covered_proactively).
    - **Dynamic Interview Completion**: Instead of fixed question counts, the HR agent continuously evaluates information sufficiency.
      - **Coverage Tracking**: Monitors 6 assessment criteria (background, skills, behavioral, motivation, culture_fit, logistics)
      - **Sufficiency Thresholds**: Critical areas need 60% coverage, overall 70% before natural wrap-up
      - **Maximum Questions**: Hard limit of 15 questions to prevent endless interviews
      - **Time-Pressure Awareness**: At 75% of limit with gaps remaining, agent acknowledges time constraints and prioritizes key questions
    - **TriageChain Response Evaluation**: Classifies candidate responses into outcomes:
      - **satisfied**: Answer complete - proceed to next planned question
      - **partial**: Answer missing specifics - generate targeted follow-up
      - **vague**: Answer too general - probe for concrete examples
      - **proactive_coverage**: Candidate answered upcoming questions early - acknowledge and mark as covered
      - **has_question**: Candidate asked a question - answer before continuing
    - **Proactive Answer Detection**: When candidate provides information that covers upcoming backlog questions, agent acknowledges naturally and marks those questions as covered_proactively.
    - **Smart Follow-ups**: For partial/vague answers, generates context-specific probes requesting examples or missing information before moving on.
    - **Adaptive Reflections**: Context-aware acknowledgments based on answer quality:
      - Detailed answers (~100+ chars): Specific acknowledgments (~40% of time during Core stage)
      - Brief answers: Short "Got it" / "Okay" responses
      - Wrapup stage: No reflections (direct transition to closure)
    - **LangChain Chains**: Modular AI workflow with specialized chains (PreparationPlanner, Triage, Question Generator, HR Question, Wrapup, Closure, Evaluator, Follow-up Decision, Reflection, Scoring).
    - **Interview Orchestrator**: Coordinates chains, manages stage transitions, coverage tracking, question backlog, and interview flow.
    - **Interview Types**: Behavioral, Technical, and Case Study interviews.
    - **Role-Based Preparation**: Practice for Developer, Product Manager, Designer roles.
    - **Real-time Evaluation**: Immediate feedback with scores, strengths, and improvement areas.
    - **Final Report**: Comprehensive scoring with hiring decision recommendation.
    - **AI Backend**: Powered by Groq (llama-3.3-70b-versatile) for fast, high-quality responses.
    - **Navigation**: Practice Mode returns to interview page for new sessions; Journey Mode redirects to journey page with updated application status.
- **Workspace Simulator**: Creates a virtual tech team environment for collaborative project work.
    - **Dual-Mode Architecture**:
      - **Journey Mode** (`/workspace/journey`): Linear 5-day progression, one company at a time, immersive story-driven experience. Blue accent theme.
      - **Practice Mode** (`/workspace/practice`): Flexible skill drills, select specific days, practice with multiple companies simultaneously. Teal accent theme. 3-step wizard (Project → Role → Scenario).
    - **Progress Persistence**: Auto-saves progress to database on state changes. Debounced saves with visibility change/unmount flush. Resume/restart functionality on both modes.
    - **Database Schema**: `workspace_progress` table tracks sessionId, projectId, role, mode, currentDay, dayProgress (JSON), overallProgress, status.
    - **Multi-Character AI Team**: 4-6 AI teammates with distinct roles, personalities, and expertise.
    - **Role-Based Practice**: Users can practice as Developer, Product Manager, Designer, QA Engineer, or DevOps Engineer.
    - **Project Scenarios**: Includes pre-configured projects like "Task Management App", "PulseOps IQ Enterprise Feature", and "NovaPay Intern Onboarding".
    - **Dynamic Collaboration**: Multi-channel communication (chat, standups, code reviews, email) and interactive project artifacts.
    - **Workspace Orchestrator**: Manages AI personas, orchestrates conversations, and evaluates user actions.
    - **Workspace Dashboard**: Provides progress overview, active session management, and performance visualizations.
    - **Enterprise Feature Scenario (PulseOps IQ)**: Simulates adding features to an enterprise codebase with a multi-phase workflow, simulated codebase explorer, and comprehensive PM documentation.
    - **Intern Onboarding Scenario (NovaPay)**: 5-day intern onboarding journey. Uses `InternOnboardingSession` component with day-based navigation, 1:1 team intro chats, and progress tracking.
      - **Day 1 - Onboarding**:
        - Meet the Team: 1:1 introductions with AI teammates (Sarah, Marcus, Priya, Alex, Jordan)
        - Documentation: Tabbed layout with progressive disclosure
          - Tab 1 "Product & Users": TL;DR card, features overview, Maria persona card with workflow
          - Tab 2 "Your Mission": TL;DR mission card, timezone bug visual, dev workflow
          - Collapsible sections with completion tracking (4/4 required)
        - Comprehension Check: Chat with Sarah about learnings
        - Day 2 Preview modal with option to start Day 2 directly
      - **Day 2 - First Ticket (Implemented)**:
        - Morning Standup: Chat with Sarah about daily plans and ticket clarification
        - Codebase Explorer: Navigate simulated file tree to find dateFormatters.ts
        - Code Fix: Fill-in-the-blank exercise to fix timezone bug (use merchantTimezone parameter)
        - Git Workflow: Step-by-step terminal simulation (checkout, add, commit, push)
        - Reflection: Prompt about what to confirm with QA tomorrow
        - Gated progression: Each activity unlocks after completing the previous one
        - Progress tracking: 20% standup, 15% codebase, 30% code fix, 25% git, 10% reflection
    - **Chat Enhancements**: `@mention` autocomplete, smart message routing, realistic AI response delays, auto-scroll, and real-time typing indicators.
    - **Phase Guidance System**: Interactive "What to Do Now" panel with objectives checklist and smart phase progression.
    - **Direct Messaging (DM) Feature**: 1-on-1 private conversations with individual AI teammates.
    - **Document Viewer System**: PM documentation opens in new browser tabs for focused reading. Requirements tab displays a document explorer with 10 clickable document cards (Executive Summary, Feature Requirements, Stakeholder Analysis, User Stories, Success Metrics, Roadmap Context, Competitive Analysis, Go-to-Market Strategy, Risk Assessment, Resource Planning). Clean, distraction-free viewing experience without sidebar/header.
    - **Specialized Session Components**: 
      - `WorkspaceSession`: Generic workspace simulation
      - `EnterpriseFeatureSession`: For enterprise-scale feature work (PulseOps IQ)
      - `InternOnboardingSession`: For intern onboarding flows (NovaPay, category: 'intern-onboarding')

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

## B2B Customer: 42 London Integration

### Curriculum Alignment (3 Blocks)
EdMap is being tailored for 42 London coding school with curriculum-aligned journeys:

- **Block 1** (Unix, Shell, Git, C basics): Intern-level positions, learn company processes and soft skills
- **Block 2** (Advanced C/C++, Data Structures): More advanced workspace scenarios (TBD)
- **Block 3** (Specialization): Help students experiment with tracks (Web, Cybersecurity, AI/ML, Mobile, DevOps) before choosing

### Block 1 Design: "First Week as an Intern"

**Structure:** 5-day journey, 30-60 min daily sessions with overnight events

**Company Profile: NovaPay** (Fintech startup, first of several company profiles)
- **Team:** Sarah (Lead), Marcus (Senior Dev), Priya (PM), Alex (QA), Jordan (Fellow Intern)
- **Project:** Merchant Dashboard improvements
- **Tech Stack:** Node.js, React, PostgreSQL

**Daily Flow:**
| Day | Focus | Key Activities |
|-----|-------|----------------|
| 1 | Onboarding | 1:1 intros with team, read project docs, comprehension check with Sarah |
| 2 | First Ticket | Timezone bug fix, Git workflow, asking questions |
| 3 | Code Review | Respond to Sarah's PR feedback, revise code |
| 4 | Documentation | Write README section, receive feedback |
| 5 | Bug Fix + Wrap-up | Fix edge case bug, final evaluation with Sarah |

**Task Types (Phased Build):**
- Phase 1: Code Review conversations, Documentation writing
- Phase 2: Git command simulator, File explorer with edits
- Phase 3: Real GitHub integration

### Future Enhancements (Backlog)
- **Multi-dimension Negotiation:** Allow users to select and negotiate multiple dimensions (salary, start date, remote flexibility, mentorship, learning budget) with current/goal values for each. Seniority-based recommendations for relevant dimensions.
- **Additional Company Profiles:** ShieldOps (Cybersecurity), Synth.ai (AI/ML), PocketApp (Mobile), CloudForge (DevOps)