# EdMap Project Structure Overview

## Repository Layout

```
/
├── backend/               # Django REST API backend
├── frontend/             # Preact/TypeScript frontend  
├── start.sh             # Startup script (runs both servers)
├── server/              # [OLD] Express.js backend (from previous edmap)
├── client/              # [OLD] React frontend (from previous edmap)
└── shared/              # [OLD] Shared types (from previous edmap)
```

## Backend Architecture (Django)

### Tech Stack
- **Framework**: Django 5.0.4 + Django REST Framework
- **Database**: SQLite (development), PostgreSQL (production)
- **AI/ML**: 
  - Groq API (LLM inference)
  - Langchain + LangGraph (agent orchestration)
  - Spacy + spacy-langdetect (language detection)
- **Authentication**: JWT (djangorestframework-simplejwt)
- **API Documentation**: drf-spectacular (Swagger/OpenAPI)

### Project Structure

```
backend/src/
├── _root/                      # Django project configuration
│   ├── config.py              # Main settings (imports local/prod configs)
│   ├── local_config.py        # Development settings (SQLite)
│   ├── prod_config.py         # Production settings (PostgreSQL)
│   └── urls.py                # Root URL configuration
│
├── _prompts/                   # AI prompt templates
│   ├── interview/             # Interview simulation prompts
│   └── offer_negotiation/     # Negotiation simulation prompts
│
├── agents/                     # AI Agent implementations
│   ├── interview/             # Interview simulator agents
│   │   ├── interviewer_agent.py
│   │   ├── feedback_agent.py
│   │   ├── greeting_agent.py
│   │   ├── termination_agent.py
│   │   └── finish_interview_agent.py
│   │
│   ├── offer/                 # Offer negotiation agents
│   │   ├── negotiation_agent.py
│   │   ├── offer_generation_agent.py
│   │   ├── feedback_agent.py
│   │   └── greeting_agent.py
│   │
│   ├── language_detector.py   # Spacy-based language detection
│   └── llm.py                 # LLM configuration/utilities
│
└── apps/                       # Django applications
    ├── core/                  # Shared utilities
    │   ├── models.py         # Common models (MessageOwnerType, etc.)
    │   ├── pagination.py     # Custom pagination
    │   ├── serializers.py    # Shared serializers
    │   └── utils.py          # Helper functions
    │
    ├── UserProfile/          # User management
    │   ├── models.py         # UserProfile model
    │   ├── serializers.py
    │   ├── views.py
    │   └── urls.py
    │
    ├── Subscriber/           # Subscription management
    │   ├── models.py         # Subscriber model
    │   └── views.py
    │
    ├── Simulation/           # Interview simulator
    │   ├── models.py         # InterviewSession, InterviewSessionMessage
    │   ├── serializers.py
    │   ├── views.py          # Interview API endpoints
    │   └── urls.py
    │
    └── OfferNegotiation/     # Offer negotiation simulator
        ├── models.py         # OfferNegotiationSession, NegotiationSessionMessage
        ├── serializers.py
        ├── views.py          # Negotiation API endpoints
        └── urls.py
```

### API Structure

Base URL: `http://localhost:8000/api/v1.0/`

```
/api/v1.0/
├── accounts/                  # User profile endpoints
├── interview_simulation/      # Interview simulator endpoints
│   ├── GET /sessions         # List interview sessions
│   ├── POST /sessions        # Start new interview
│   ├── POST /sessions/{id}/messages  # Send message
│   └── GET /sessions/{id}/feedback   # Get feedback
│
└── offer_negotiation_simulation/  # Negotiation simulator endpoints
    ├── GET /sessions         # List negotiation sessions
    ├── POST /sessions        # Start new negotiation
    └── POST /sessions/{id}/messages  # Send message
```

### Database Models

**UserProfile** (extends Django User)
- User profile information
- Links to interview and negotiation sessions

**InterviewSession**
- Stores interview simulation sessions
- Fields: user, role, company, seniority, duration, status, etc.

**InterviewSessionMessage**
- Chat messages for interview sessions
- Fields: session, message, owner_type, timestamp

**OfferNegotiationSession**
- Stores offer negotiation sessions
- Fields: user, offer_details, status, etc.

**NegotiationSessionMessage**
- Chat messages for negotiation sessions

**Subscriber**
- Newsletter/subscription management

### Environment Variables (Development)

```bash
DJANGO_APP_MODE=local
DJANGO_APP_DEBUG=True
DJANGO_APP_ALLOWED_HOSTS=localhost,127.0.0.1,.replit.dev
DJANGO_APP_CORS_ORIGINS=http://localhost:5175,https://*.replit.dev
DJANGO_APP_GROQ_API_KEY=<your-groq-api-key>
DJANGO_APP_INTERVIEW_SIM_MODEL=<model-name>
DJANGO_APP_OFFER_SIM_MODEL=<model-name>
```

## Frontend Architecture (Preact)

### Tech Stack
- **Framework**: Preact 10.19.6 (React alternative, lighter)
- **Router**: preact-router
- **State Management**: Redux Toolkit
- **UI Library**: Shoelace (web components)
- **Build Tool**: Vite 5.2.0
- **API Client**: Axios
- **Auth**: JWT (jwt-decode)

### Project Structure

```
frontend/src/
├── main.tsx              # Application entry point
├── features/
│   └── app/             # Main app feature
│       ├── context.ts   # App context/state
│       └── index.tsx
│
├── components/          # Reusable components
├── pages/              # Page components
├── ui/                 # UI system
│   ├── layouts/       # Layout components
│   ├── shoelace/      # Shoelace component wrappers
│   └── styles/        # Global styles
│       ├── global/
│       │   ├── _colors.css
│       │   ├── _normalize.css
│       │   └── _reset.css
│       └── index.css
│
└── utils/              # Utility functions
    ├── date.ts
    ├── helpers.ts
    ├── models.ts
    ├── number.ts
    ├── string.ts
    └── url.ts
```

### Build Configuration

**Vite Config**: Simple Preact preset
**Port**: 5175 (configured in package.json)
**API Proxy**: Direct calls to backend at `http://localhost:8000`

### API Client

The frontend includes generated API client code:
- `src/__generated__/api.ts` - Generated from Django OpenAPI schema
- `src/features/api/models/__generated__/` - Type-safe API models

To regenerate API client:
```bash
npm run update-api-client
```

## Key Features

### 1. Interview Simulator
- AI-powered HR interviewer
- Multiple roles (technical, behavioral, etc.)
- Real-time conversation with streaming responses
- Post-interview feedback analysis
- Session history and tracking

### 2. Offer Negotiation Simulator
- Practice salary/offer negotiations
- AI negotiation partner
- Feedback on negotiation tactics
- Multiple scenario types

### 3. Language Detection
- Automatically detects message language
- Uses Spacy NLP for accuracy
- Supports English detection currently

## Running the Application

### Option 1: Using start.sh (Recommended)
```bash
./start.sh
```
This starts both backend (port 8000) and frontend (port 5175)

### Option 2: Manual Start

**Backend:**
```bash
cd backend
export DJANGO_APP_GROQ_API_KEY="${GROQ_API_KEY}"
python manage.py runserver 0.0.0.0:8000
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## Database Setup

Database is already configured and migrated:
- ✅ SQLite database created at `backend/src/db.sqlite3`
- ✅ All migrations applied
- ✅ Tables created for all apps

To create an admin user:
```bash
cd backend
python manage.py createsuperuser
```

Admin panel: `http://localhost:8000/admin`
API docs: `http://localhost:8000/swagger/`

## Important Notes

1. **Spacy Model**: The `en_core_web_sm` model is installed and ready
2. **GROQ_API_KEY**: Already connected from Replit secrets
3. **LSP Warnings**: Python import warnings are cosmetic (LSP path config issue)
4. **Old Code**: The `client/`, `server/`, and `shared/` directories are from the previous Express/React version - safe to ignore or delete
5. **CORS**: Configured to allow frontend (port 5175) to call backend (port 8000)

## Next Steps

1. **Add GROQ API models**: Set `DJANGO_APP_INTERVIEW_SIM_MODEL` and `DJANGO_APP_OFFER_SIM_MODEL` env vars
2. **Test API endpoints**: Use Swagger docs at `/swagger/`
3. **Create admin user**: For backend admin panel access
4. **Configure frontend API base URL**: May need to update if deployed
5. **Start both servers**: Run `./start.sh` to begin development

## Development Workflow

1. Make changes to backend code in `backend/src/`
2. Make changes to frontend code in `frontend/src/`
3. Django auto-reloads on file changes
4. Vite HMR (Hot Module Replacement) for instant frontend updates
5. Check API docs at `/swagger/` for endpoint testing
6. Check browser console for frontend errors
7. Check terminal for backend errors

## Production Considerations

- Switch `DJANGO_APP_MODE` to "prod"
- Configure PostgreSQL database in `prod_config.py`
- Update `DJANGO_APP_ALLOWED_HOSTS` and `DJANGO_APP_CORS_ORIGINS`
- Build frontend: `cd frontend && npm run build`
- Serve with gunicorn (already in requirements.txt)
- Set strong `DJANGO_APP_SECRET_KEY`
