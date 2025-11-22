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
- **AI Integration**: OpenAI GPT-4o, Groq (llama-3.1-70b-versatile)
- **Session Management**: Express sessions with PostgreSQL store

### Monorepo Structure
- `client/`: React frontend
- `server/`: Express.js backend
- `shared/`: Shared TypeScript types and database schema
- `migrations/`: Database migration files

### Key Features and Implementations
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
- **OpenAI API**: GPT-4o for dynamic simulation content generation.
- **Groq API**: llama-3.1-70b-versatile for dynamic AI team member responses and Whisper AI for voice transcription.

### Database
- **Neon Database**: Serverless PostgreSQL for production.
- **@neondatabase/serverless**: For optimized database connections.

### Authentication
- Session-based authentication (MVP).

### Development Tools
- **Replit Integration**: Development environment optimizations.
- **Vite**: For fast development and optimized builds.