# edmap: AI-Powered B2B Onboarding Platform

## Overview
EdMap is an AI-powered B2B onboarding platform designed to accelerate professional skills development through AI-driven simulations. It currently offers two core simulation products:

1. **Interview Simulator**: Practice technical and behavioral interviews with an AI interviewer
2. **Offer Negotiation Simulator**: Practice salary and offer negotiations with an AI negotiation partner

The platform uses advanced AI agents powered by Groq LLMs and Langchain to create realistic, adaptive conversation experiences.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Backend (Django)
- **Framework**: Django 5.0.4 with Django REST Framework
- **Database ORM**: Django ORM
- **Database**: SQLite (development), PostgreSQL (production)
- **AI Integration**: 
  - Groq API for LLM inference (llama-3.1-70b-versatile)
  - Langchain Core + LangGraph for agent orchestration
  - Spacy + spacy-langdetect for language detection
- **Authentication**: JWT tokens (djangorestframework-simplejwt)
- **API Documentation**: drf-spectacular (Swagger/OpenAPI)
- **CORS**: django-cors-headers

### Frontend (Preact)
- **Framework**: Preact 10.19.6 (lightweight React alternative)
- **Build Tool**: Vite 5.2.0
- **UI Components**: Shoelace (web components)
- **State Management**: Redux Toolkit
- **Routing**: preact-router
- **HTTP Client**: Axios
- **Authentication**: JWT with jwt-decode

### Monorepo Structure
- `backend/`: Django REST API backend (primary)
- `frontend/`: Preact/TypeScript frontend (primary)
- `server/`: Legacy Express.js backend (deprecated)
- `client/`: Legacy React frontend (deprecated)
- `shared/`: Legacy shared types (deprecated)
- `start.sh`: Startup script for both servers

### Key Features and Implementations

#### 1. Interview Simulator
- **AI-Powered Interviewer**: Uses Groq LLMs with custom prompts for realistic interview scenarios
- **Multi-Agent System**:
  - `HRAgent` (interviewer_agent.py): Main interviewer with role-specific questioning
  - `GreetingAgent`: Handles interview introduction and setup
  - `FeedbackAgent`: Provides detailed post-interview analysis
  - `TerminationAgent`: Manages interview conclusion
  - `FinishInterviewAgent`: Wraps up and summarizes
- **Session Management**: 
  - Stores interview sessions with user, role, company, seniority level
  - Tracks all conversation messages with timestamps
  - Maintains session state and duration
- **Streaming Responses**: Real-time message streaming for natural conversation flow
- **Multi-Role Support**: Technical interviews, behavioral interviews, leadership roles
- **Interview Feedback**: Comprehensive feedback on performance with AI analysis

#### 2. Offer Negotiation Simulator
- **AI Negotiation Partner**: Simulates realistic salary/offer negotiations
- **Multi-Agent System**:
  - `NegotiationAgent`: Main negotiation partner with strategic responses
  - `OfferGenerationAgent`: Creates realistic job offers
  - `GreetingAgent`: Initiates negotiation scenario
  - `FeedbackAgent`: Analyzes negotiation tactics and outcomes
  - `TerminationAgent`: Concludes negotiation
- **Session Tracking**: Stores negotiation history and outcomes
- **Scenario Variety**: Different company sizes, industries, seniority levels

#### 3. Language Detection
- **Spacy NLP**: Uses `en_core_web_sm` model for language detection
- **Real-time Detection**: Validates message language during conversation
- **English Enforcement**: Currently supports English conversations

#### 4. User Management
- **UserProfile**: Extended Django user model with simulation preferences
- **Subscriber**: Newsletter and subscription management
- **Authentication**: JWT-based authentication with refresh tokens
- **Session History**: Tracks all user simulation sessions

### API Architecture

**Base URL**: `/api/v1.0/`

**Endpoints**:
```
/api/v1.0/
├── accounts/                          # User profile management
├── interview_simulation/
│   ├── GET /sessions                 # List all interview sessions
│   ├── POST /sessions                # Start new interview
│   ├── POST /sessions/{id}/messages  # Send message in interview
│   └── GET /sessions/{id}/feedback   # Get interview feedback
└── offer_negotiation_simulation/
    ├── GET /sessions                 # List all negotiation sessions
    ├── POST /sessions                # Start new negotiation
    └── POST /sessions/{id}/messages  # Send message in negotiation
```

**API Documentation**: Available at `/swagger/` and `/redoc/`

### Database Schema

**UserProfile**
- Extends Django's default User model
- Links to interview and negotiation sessions
- Stores user preferences and history

**InterviewSession**
- `user`: ForeignKey to UserProfile
- `role`: Interview role (e.g., "Software Engineer")
- `company`: Company name
- `seniority`: Seniority level
- `status`: Session status (active, completed, abandoned)
- `duration`: Interview duration
- `creation_date`, `last_update_date`

**InterviewSessionMessage**
- `session`: ForeignKey to InterviewSession
- `message`: Message content
- `owner_type`: MessageOwnerType (USER or AI)
- `created_at`: Timestamp

**OfferNegotiationSession** (similar structure to InterviewSession)
**NegotiationSessionMessage** (similar structure to InterviewSessionMessage)
**Subscriber** (newsletter subscriptions)

### External Dependencies

#### AI Services
- **Groq API**: Fast LLM inference using llama-3.1-70b-versatile
- **Langchain Core**: Agent framework and prompt templates
- **LangGraph**: Multi-agent orchestration and workflows
- **Spacy**: NLP and language detection

#### Infrastructure
- **SQLite**: Development database (file-based)
- **PostgreSQL**: Production database (recommended)
- **Vite**: Fast frontend development and building
- **Django Admin**: Built-in admin panel

### Development Setup

#### Environment Variables (Development)
```bash
DJANGO_APP_MODE=local
DJANGO_APP_DEBUG=True
DJANGO_APP_ALLOWED_HOSTS=localhost,127.0.0.1,.replit.dev
DJANGO_APP_CORS_ORIGINS=http://localhost:5175,https://*.replit.dev
DJANGO_APP_GROQ_API_KEY=<from-replit-secrets>
DJANGO_APP_INTERVIEW_SIM_MODEL=llama-3.1-70b-versatile
DJANGO_APP_OFFER_SIM_MODEL=llama-3.1-70b-versatile
```

#### Running the Application

**Option 1: Start Script (Recommended)**
```bash
./start.sh
```
Starts both Django backend (port 8000) and Vite frontend (port 5175)

**Option 2: Manual Start**
```bash
# Terminal 1: Backend
cd backend
export DJANGO_APP_GROQ_API_KEY="${GROQ_API_KEY}"
python manage.py runserver 0.0.0.0:8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

#### Database Migrations
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser  # Create admin user
```

#### API Client Generation
Frontend includes auto-generated TypeScript API client:
```bash
cd frontend
npm run update-api-client  # Regenerates from Django OpenAPI schema
```

### UI/UX Architecture

#### Backend (API-Only)
- RESTful API design
- Swagger/OpenAPI documentation at `/swagger/`
- Real-time streaming for AI responses
- JWT authentication with refresh tokens

#### Frontend (Preact + Shoelace)
- Component-based architecture
- Web components via Shoelace
- Redux for global state management
- Preact Router for navigation
- Axios for API calls
- Type-safe API client (auto-generated)

### Development Tools
- **Replit Integration**: Development environment optimizations
- **Vite HMR**: Instant frontend updates during development
- **Django Dev Server**: Auto-reloads on backend code changes
- **Swagger UI**: Interactive API testing
- **Django Admin**: Database management at `/admin/`

### Recent Changes (November 2025)
- Migrated from Express.js/React to Django/Preact architecture
- Cloned forked repositories from GitHub
- Installed all dependencies (Python + Node.js)
- Applied database migrations successfully
- Downloaded Spacy language model (en_core_web_sm)
- Configured environment variables for local development
- Created startup script for running both servers

### Known Issues/Notes
1. **LSP Warnings**: Python import warnings are cosmetic (path configuration issue)
2. **Old Code**: `client/`, `server/`, `shared/` directories contain deprecated Express/React code
3. **GROQ_API_KEY**: Connected from Replit secrets, ensure it's set
4. **Model Configuration**: May need to specify AI models in environment variables

### Next Development Steps
1. Set AI model environment variables (INTERVIEW_SIM_MODEL, OFFER_SIM_MODEL)
2. Create Django superuser for admin panel access
3. Test API endpoints via Swagger documentation
4. Configure frontend to connect to Django backend
5. Test full end-to-end flow: frontend → backend → AI agents
6. Consider removing old Express/React code to reduce confusion

## Production Deployment

When deploying to production:
1. Set `DJANGO_APP_MODE=prod`
2. Configure PostgreSQL database
3. Update `ALLOWED_HOSTS` and `CORS_ORIGINS`
4. Set strong `SECRET_KEY`
5. Build frontend: `cd frontend && npm run build`
6. Serve with Gunicorn
7. Use nginx as reverse proxy
8. Enable HTTPS
9. Set up proper logging
10. Configure environment-specific GROQ API keys
