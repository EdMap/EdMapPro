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

### Frontend (React)
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.4.21
- **UI Components**: Shoelace (web components)
- **State Management**: Redux Toolkit
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios
- **Authentication**: JWT with jwt-decode

### Monorepo Structure
- `backend/`: Django REST API backend (primary)
- `frontend/`: React/TypeScript frontend (primary)
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

#### Frontend (React + Shoelace)
- Component-based architecture
- Web components via Shoelace
- Redux for global state management
- React Router DOM v6 for navigation
- Axios for API calls
- Type-safe API client (auto-generated)

### Development Tools
- **Replit Integration**: Development environment optimizations
- **Vite HMR**: Instant frontend updates during development
- **Django Dev Server**: Auto-reloads on backend code changes
- **Swagger UI**: Interactive API testing
- **Django Admin**: Database management at `/admin/`

### Recent Changes (November 2025)

**Initial Setup:**
- Migrated from Express.js/React to Django/Preact architecture
- Cloned forked repositories from GitHub
- Installed all dependencies (Python + Node.js)
- Applied database migrations successfully
- Downloaded Spacy language model (en_core_web_sm)
- Configured environment variables for local development
- Created startup script for running both servers

**Replit Environment Configuration (Nov 23, 2025):**
- ✅ Fixed Vite server to bind to 0.0.0.0 for external access
- ✅ Configured allowedHosts for Replit domains (.replit.dev, .repl.co)
- ✅ Disabled HMR (hot module reload) for HTTPS stability - manual browser refresh required after code changes
- ✅ Replaced sanitize-html with DOMPurify for browser compatibility
- ✅ Fixed routing: Login at root path `/`, Dashboard at `/dashboard`
- ✅ Configured VITE_API_URL to use Replit domain for frontend-backend communication
- ✅ Created demo user account (username: demo, password: demo123)
- ✅ Verified end-to-end login flow working successfully

**React Migration (Nov 23, 2025):**
- ✅ Migrated frontend from Preact 10.19.6 to React 18.3.1
- ✅ Updated all package dependencies (react, react-dom, react-router-dom v6)
- ✅ Replaced Preact imports with React imports across entire codebase
- ✅ Converted preact-router to react-router-dom with BrowserRouter and Routes
- ✅ Updated all JSX syntax: replaced `class=` with `className=`
- ✅ Fixed import syntax errors (MutableRefObject)
- ✅ Updated vite.config.ts to use @vitejs/plugin-react instead of @preact/preset-vite
- ✅ Updated tsconfig.json to remove Preact-specific configurations
- ✅ Verified successful compilation with no React errors
- ✅ Confirmed no runtime errors in browser console
- **Reason for migration**: Better ecosystem support, easier team scaling, comprehensive app scope

### Current Configuration

**Environment Variables (Development):**
```
VITE_API_URL=https://{replit-domain}:8000
DJANGO_APP_GROQ_API_KEY={from-secrets}
DJANGO_APP_MODE=local
DJANGO_APP_DEBUG=True
```

**Demo User Account:**
- Username: `demo`
- Password: `demo123`
- Email: `demo@edmap.com`

### Known Issues/Notes
1. **HMR Disabled**: Hot module reload is disabled for stability in Replit's HTTPS environment. After making code changes, manually refresh the browser to see updates.
2. **LSP Warnings**: Python import warnings are cosmetic (path configuration issue)
3. **Old Code**: `client/`, `server/`, `shared/` directories contain deprecated Express/React code (legacy codebase)
4. **Browser Compatibility**: Using DOMPurify instead of sanitize-html for HTML sanitization
5. **Tech Stack**: Now using React 18 instead of Preact (migrated Nov 23, 2025)

### Application Status
✅ **Fully Functional** - Application is running and accessible in Replit environment
- Backend API: Port 8000
- Frontend: Port 5175
- Login and authentication working
- Ready for simulator testing

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
