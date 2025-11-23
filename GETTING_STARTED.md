# Getting Started with Your Django/Preact EdMap Project

## 🎉 Setup Complete!

Your forked repositories are now running on Replit with a clean Django/Preact architecture.

## 📁 Current Project Structure

```
edmap/
├── backend/                    # Django REST API
│   ├── src/
│   │   ├── _root/             # Django settings
│   │   ├── agents/            # AI agents (Groq + Langchain)
│   │   └── apps/              # Django apps
│   │       ├── UserProfile/   # User management
│   │       ├── Simulation/    # Interview simulator
│   │       └── OfferNegotiation/  # Negotiation simulator
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/                   # Preact + TypeScript
│   ├── src/
│   │   ├── features/          # Feature modules
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   └── ui/                # UI system (Shoelace)
│   ├── package.json
│   └── vite.config.ts
│
├── start.sh                    # Startup script
├── PROJECT_STRUCTURE.md        # Detailed architecture docs
├── MIGRATION_PLAN.md          # Guide to port workspace features
└── GETTING_STARTED.md         # This file
```

## 🚀 Running the Application

### Quick Start
```bash
./start.sh
```

This will:
1. Run database migrations
2. Start Django backend on port 8000
3. Start Preact frontend on port 5175

### Access Points
- **Frontend**: http://0.0.0.0:5175
- **Backend API**: http://0.0.0.0:8000/api/v1.0/
- **Swagger Docs**: http://0.0.0.0:8000/swagger/
- **Admin Panel**: http://0.0.0.0:8000/admin/

## 📋 What's Configured

### ✅ Backend (Django)
- [x] All Python dependencies installed
- [x] Database configured (SQLite for development)
- [x] Migrations applied successfully
- [x] 4 Django apps ready:
  - UserProfile
  - Simulation (Interview AI)
  - OfferNegotiation (Negotiation AI)
  - Subscriber
- [x] Spacy language model downloaded (`en_core_web_sm`)
- [x] JWT authentication configured
- [x] CORS configured for frontend
- [x] Swagger/OpenAPI documentation ready

### ✅ Frontend (Preact)
- [x] All npm dependencies installed
- [x] Vite configured with HMR
- [x] Shoelace UI components ready
- [x] Redux Toolkit for state management
- [x] Axios for API calls
- [x] TypeScript configured

### ✅ Environment
- [x] Development environment variables set
- [x] GROQ_API_KEY connected from secrets
- [x] CORS configured between frontend/backend
- [x] Clean directory structure (old code removed)

## 🎯 Immediate Next Steps

### 1. Create Django Admin User (2 minutes)
```bash
cd backend
python manage.py createsuperuser
```

This gives you access to the Django admin panel at http://0.0.0.0:8000/admin/

### 2. Test the API (5 minutes)
1. Open http://0.0.0.0:8000/swagger/
2. Explore available endpoints
3. Test authentication flow
4. Try creating an interview session

### 3. Configure AI Models (1 minute)
Add these environment variables in Replit:
- `DJANGO_APP_INTERVIEW_SIM_MODEL=llama-3.1-70b-versatile`
- `DJANGO_APP_OFFER_SIM_MODEL=llama-3.1-70b-versatile`

### 4. Explore the Frontend (5 minutes)
1. Open http://0.0.0.0:5175
2. Check what's currently implemented
3. Look at the UI components available

## 📚 Documentation

### For Backend Development
- **Architecture**: Read `PROJECT_STRUCTURE.md` → Backend Architecture section
- **Adding Endpoints**: Check existing views in `backend/src/apps/*/views.py`
- **Database Models**: See `backend/src/apps/*/models.py`
- **AI Agents**: Explore `backend/src/agents/`

### For Frontend Development
- **Components**: Check `frontend/src/components/`
- **Features**: See `frontend/src/features/`
- **API Integration**: Look at how existing features call the backend

### For Migration
- **Workspace Simulator**: Read `MIGRATION_PLAN.md`
  - Shows how to port the workspace simulator features
  - Backend models and views
  - Frontend component structure
  - Step-by-step migration guide

## 🔄 Migration Strategy: Workspace Simulator

You have a fully-functional workspace simulator in the old React code. Here's how to bring it to Django/Preact:

### Option 1: Quick Start (Recommended)
1. Create `WorkspaceSimulation` Django app
2. Copy models from MIGRATION_PLAN.md
3. Port frontend components piece-by-piece
4. Test each feature as you migrate

### Option 2: Full Migration
Follow the complete plan in `MIGRATION_PLAN.md`:
- Phase 1: Backend Foundation (1-2 hours)
- Phase 2: Frontend Structure (2-3 hours)
- Phase 3: Core UI Components (3-4 hours)
- Phase 4: Session Interface (4-5 hours)
- Phase 5: AI Integration (Optional, 5-6 hours)

## 🛠️ Development Workflow

### Backend Changes
1. Edit code in `backend/src/`
2. Django auto-reloads on file changes
3. Check terminal for errors
4. Test via Swagger docs

### Frontend Changes
1. Edit code in `frontend/src/`
2. Vite HMR updates browser instantly
3. Check browser console for errors
4. Test in browser

### Database Changes
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

## 🤝 Collaboration with GitHub

Your code is in forked repositories:
- Backend: https://github.com/EdMap/edmap-app-backend-fork
- Frontend: https://github.com/EdMap/edmap-app-frontend-fork

### Push Changes
```bash
# In backend/ or frontend/
git add .
git commit -m "Your commit message"
git push origin main
```

### Pull Latest Changes
```bash
git pull origin main
```

## 📝 Common Tasks

### Add a New Django App
```bash
cd backend/src/apps
python ../../manage.py startapp NewApp
```

### Install New Python Package
Use the Replit packager tool or:
```bash
pip install package-name
# Add to requirements.txt
```

### Install New npm Package
Use the Replit packager tool or:
```bash
cd frontend
npm install package-name
```

### View Database
```bash
cd backend
python manage.py dbshell
```

Or use Django admin: http://0.0.0.0:8000/admin/

### Generate API Client (Frontend)
```bash
cd frontend
npm run update-api-client
```

This regenerates TypeScript types from Django's OpenAPI schema.

## 🐛 Troubleshooting

### Backend won't start
- Check `backend/src/_root/local_config.py` for config issues
- Ensure database file exists: `backend/src/db.sqlite3`
- Check Python dependencies are installed

### Frontend won't start
- Run `cd frontend && npm install`
- Check `frontend/vite.config.ts`
- Clear node_modules and reinstall if needed

### CORS errors
- Check `DJANGO_APP_CORS_ORIGINS` includes `http://localhost:5175`
- Verify backend is running on port 8000

### LSP/Import warnings
- These are cosmetic Python path issues
- Code will still run correctly
- Safe to ignore

## 💡 Pro Tips

1. **Use Swagger docs** for quick API testing
2. **Django admin** is great for debugging database issues
3. **Browser DevTools** network tab shows API calls
4. **Check both terminal windows** for backend/frontend errors
5. **Vite HMR** is fast - changes appear instantly
6. **Database is SQLite** - easy to reset if needed (just delete db.sqlite3)

## 🎓 Learning Resources

### Django
- Official docs: https://docs.djangoproject.com/
- DRF (Django REST Framework): https://www.django-rest-framework.org/

### Preact
- Official docs: https://preactjs.com/
- Very similar to React

### Shoelace (UI Components)
- Official docs: https://shoelace.style/

## 🚢 Deployment (Future)

When ready for production:
1. Switch to PostgreSQL database
2. Set `DJANGO_APP_MODE=prod`
3. Build frontend: `cd frontend && npm run build`
4. Use Gunicorn for Django
5. Set up nginx as reverse proxy
6. Enable HTTPS
7. Set strong secret keys

## ❓ Need Help?

- Check `PROJECT_STRUCTURE.md` for architecture details
- Check `MIGRATION_PLAN.md` for workspace migration guide
- Review code in `backend/src/` and `frontend/src/`
- Test endpoints at http://0.0.0.0:8000/swagger/

---

**Ready to start?** Run `./start.sh` and visit http://0.0.0.0:8000/swagger/ to explore the API!
