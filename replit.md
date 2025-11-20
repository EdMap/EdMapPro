# replit.md - edmap: AI-Powered B2B Onboarding Platform

## Overview

edmap is a comprehensive B2B onboarding platform that leverages AI-powered workspace simulators to accelerate enterprise onboarding processes. The platform consists of three core simulation products: Interview Simulator, Negotiation Simulator, and Workspace Simulator, each targeting different stages of a professional's journey from pre-hire to post-hire integration.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon Database)
- **AI Integration**: OpenAI GPT-4o for generating dynamic simulation content
- **Session Management**: Express sessions with PostgreSQL store

### Monorepo Structure
- **client/**: React frontend application
- **server/**: Express.js backend API
- **shared/**: Shared TypeScript types and database schema
- **migrations/**: Database migration files

## Key Components

### Database Schema
- **users**: User authentication and profile data
- **simulation_sessions**: Active and completed simulation sessions with configuration and chat history
- **user_progress**: Tracking user performance across different simulation types

### API Endpoints
- User management (`/api/user`)
- Session management (`/api/sessions`)
- Progress tracking (`/api/user/:id/progress`)
- AI-powered simulation interactions

### UI Components
- **Layout**: Fixed sidebar navigation with responsive header
- **Simulation Pages**: Dedicated interfaces for each simulator type
- **Dashboard**: Progress overview and simulation access
- **Real-time Chat**: Interactive simulation sessions with AI

## Data Flow

1. **User Authentication**: Simplified authentication with default user for MVP
2. **Simulation Configuration**: Users configure simulation parameters (profession, difficulty, scenario)
3. **AI Content Generation**: OpenAI API generates dynamic questions, responses, and feedback
4. **Session Management**: Real-time chat interface with message persistence
5. **Progress Tracking**: Performance metrics and completion statistics stored and displayed

## External Dependencies

### AI Services
- **OpenAI API**: GPT-4o model for generating interview questions, negotiation responses, and feedback
- **Content Generation**: Dynamic, context-aware simulation content based on user input

### Database
- **Neon Database**: Serverless PostgreSQL for production deployment
- **Connection Pooling**: @neondatabase/serverless for optimized database connections

### Authentication
- **Session-based**: Simple session management for MVP (expandable to OAuth/JWT)

### Development Tools
- **Replit Integration**: Development environment optimizations and error handling
- **Vite Plugins**: Hot module replacement and development experience enhancements

## Deployment Strategy

### Development
- **Local Development**: Vite dev server with Express API proxy
- **Hot Reloading**: Full-stack development with instant updates
- **Error Handling**: Runtime error overlay for debugging

### Production
- **Build Process**: Vite builds optimized client bundle, esbuild creates server bundle
- **Static Serving**: Express serves built client files
- **Environment Variables**: Database URL and OpenAI API key configuration

### Database Management
- **Migrations**: Drizzle Kit for schema management and migrations
- **Schema Evolution**: Type-safe database schema updates

## Workspace Simulator Architecture (NEW)

### Overview
The Workspace Simulator is the newest and most comprehensive simulator in the edmap platform. It creates a virtual tech team environment where users practice real-world collaboration by working on simulated projects with AI-powered teammates.

### Key Features
- **Multi-Character AI Team**: 4-6 AI teammates with distinct personalities, roles, and expertise
- **Role-Based Practice**: Users can practice as Developer, Product Manager, Designer, QA Engineer, or DevOps Engineer
- **Real Project Scenarios**: Three pre-configured projects (Task Management App, E-commerce API, Mobile Fitness App)
- **Dynamic Collaboration**: Multi-channel communication (chat, standups, code reviews, email)
- **Project Artifacts**: Tasks, tickets, code reviews, designs, documentation, test cases
- **Performance Tracking**: Role-specific competency scoring with real-time feedback

### Database Schema Extensions
- **workspace_projects**: Project scenarios with team structure, requirements, and difficulty levels
- **workspace_roles**: Role definitions with competencies, actions, and evaluation criteria
- **workspace_artifacts**: Project work items (tickets, code, designs, docs) with version history
- **workspace_tasks**: Kanban workflow with status tracking and dependencies
- **workspace_interactions**: All team communications across channels
- **workspace_evaluations**: Performance metrics for collaboration, delivery, and communication

### Backend Components
- **WorkspaceOrchestrator** (`server/services/workspace-orchestrator.ts`): Multi-agent AI coordination service that manages team member personas, generates contextual responses, orchestrates conversations, and evaluates user actions
- **Workspace API Endpoints** (`server/routes.ts`):
  - `/api/workspace/projects` - Get available project scenarios
  - `/api/workspace/roles` - Get role definitions
  - `/api/workspace/:sessionId/tasks` - Task management
  - `/api/workspace/:sessionId/artifacts` - Artifact CRUD
  - `/api/workspace/:sessionId/interactions` - Communication history
  - `/api/workspace/:sessionId/action` - Main orchestration endpoint for user actions
  - `/api/workspace/:sessionId/evaluation` - Performance assessment

### AI Team Members
Each project includes 3-4 AI teammates with unique characteristics:
- **Name & Role**: e.g., "Sarah - Senior Developer"
- **Personality**: e.g., "experienced and helpful"
- **Expertise**: Role-specific skills (React, Node.js, API design, etc.)
- **Availability**: Response patterns (always, usually, sometimes)

### Workspace Session Flow
1. **Project Selection**: User chooses from available project scenarios
2. **Role Assignment**: User selects their role (Developer, PM, Designer, QA, DevOps)
3. **Onboarding Phase**: Introduction to team, project goals, sprint objectives
4. **Active Collaboration**: Daily standups, task work, code reviews, team discussions
5. **Performance Evaluation**: Real-time feedback on collaboration, communication, and delivery

### Technical Implementation
- **Frontend**: React-based multi-tab interface with Dashboard, project/role selection, and interactive session view
- **Backend**: Express.js REST API with Groq/OpenAI integration for AI responses
- **Data Layer**: In-memory storage (MemStorage) with full CRUD operations for all workspace entities
- **AI Integration**: Groq llama-3.1-70b-versatile model for dynamic team member responses with fallback mechanisms

### Workspace Dashboard (NEW)
The Dashboard provides users with a comprehensive overview of their workspace simulation progress:
- **Hero Metrics**: Total sessions, completed simulations, average score, and time spent
- **Active Sessions**: Quick access to resume ongoing simulations with project details and team info
- **Recent Completions**: History of completed workspace simulations
- **Completion Rate**: Visual donut chart showing session completion percentage
- **Performance Metrics**: Progress bars for collaboration, communication, delivery, and technical skills
- **Quick Stats**: Active projects count, total completions, and current streak

### Enterprise Feature Scenario (NEW)
A specialized simulation for practicing adding features to existing enterprise codebases:
- **Scenario**: PulseOps IQ - Executive Incident Heatmap & Forecasting feature
- **Team**: 6 AI teammates (Claire-PM, Ravi-Backend, Maya-Frontend, Jon-DataScience, Elena-QA, Luis-DevOps)
- **Workflow**: Multi-phase progression (Onboarding → Planning → Implementation → Review → Release)
- **Simulated Codebase**: File structure explorer with key files, code snippets, and product context
- **Phase-Based Events**: Auto-triggered welcome messages with staggered delays (3-8 seconds apart) and contextual guidance per phase
- **Real Collaboration**: Team chat with @mention tagging, smart message routing, requirements view, codebase exploration, and AI responses with realistic delays (2-5 seconds)
- **Chat Features**: @mention autocomplete dropdown, case-insensitive name detection ("hey Claire" or "@Ravi"), availability-based response routing, auto-scroll to latest messages
- **Phase Guidance System**: Interactive "What to Do Now" panel with role-specific tips, objectives checklist with progress tracking, and smart phase progression that enables when ≥50% objectives complete

### Seed Data
The system includes 4 pre-configured projects and 5 role templates:
- **Projects**: Task Management App (mid), E-commerce Platform API (senior), Mobile Fitness App (junior), PulseOps IQ Enterprise Feature (senior)
- **Roles**: Developer, Product Manager, Designer, QA Engineer, DevOps Engineer

## Changelog
- June 27, 2025. Initial setup
- June 27, 2025. Added voice recording functionality to interview simulator with Web Speech API integration
- June 29, 2025. Enhanced voice input with comprehensive error handling, network monitoring, and fallback guidance for connectivity issues
- June 29, 2025. Implemented Whisper AI voice transcription through Groq API with integrated recording interface, real-time voice wave visualization, and seamless text area integration
- June 29, 2025. Fixed duplicate question issue in interview simulator - hiring manager now sends only one response at a time
- June 29, 2025. Implemented Customer Support Simulator with AI-driven customer personas, multi-stage support flow, empathy/clarity scoring, and voice support for call simulations
- October 20, 2025. **MAJOR FEATURE**: Implemented Workspace Simulator - a comprehensive multi-agent collaboration platform with role-based practice, AI team members, project scenarios, task management, and performance evaluation
- October 20, 2025. Enhanced AI teammate responses with topic extraction and contextual references to user questions
- November 4, 2025. Added Workspace Simulator Dashboard with hero metrics, active sessions, completion tracking, performance visualizations, and quick access to resume simulations
- November 20, 2025. **ENTERPRISE FEATURE**: Implemented PulseOps IQ Enterprise Feature scenario with multi-phase simulation (onboarding → planning → implementation → review → release), simulated codebase explorer, 6 AI teammates, phase-based auto-messages, and complete feature development workflow
- November 20, 2025. **CHAT ENHANCEMENTS**: Added @mention autocomplete, smart message routing (detects @mentions and name mentions like "hey Claire"), staggered auto-message delays (3-8s apart), realistic AI response delays (2-5s), and auto-scroll to latest messages
- November 20, 2025. **TYPING INDICATOR**: Implemented real-time typing indicator with animated dots that shows when AI teammates are generating responses and automatically hides when user starts typing
- November 20, 2025. **PHASE GUIDANCE SYSTEM**: Added interactive guidance panel with "What to Do Now" tips, objectives checklist with progress tracking (X/Y completed, percentage badge), and smart phase progression that requires ≥50% objective completion before advancing to next phase
- November 20, 2025. **STANDBY ROLE BEHAVIOR**: Implemented intelligent role-based mentorship where AI teammates with the same role as the user (e.g., Claire the PM when user is PM) actively help during onboarding phase, then transition to standby mode where they only respond to @mentions, creating a realistic experience where the user leads their role while having a safety net for guidance
- November 20, 2025. **DIRECT MESSAGING (DM) FEATURE**: Implemented 1-on-1 private conversations with individual AI teammates. Users can click any team member to open a private DM, with conversation tabs for switching between teammates, message isolation per channel, and case-insensitive member matching for robust routing

## User Preferences

Preferred communication style: Simple, everyday language.