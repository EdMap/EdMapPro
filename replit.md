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

## Changelog
- June 27, 2025. Initial setup
- June 27, 2025. Added voice recording functionality to interview simulator with Web Speech API integration

## User Preferences

Preferred communication style: Simple, everyday language.