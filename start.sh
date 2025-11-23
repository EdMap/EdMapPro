#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Starting EdMap Django/Preact App    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Set GROQ API key from secret
export DJANGO_APP_GROQ_API_KEY="${GROQ_API_KEY}"

# Run Django migrations
echo -e "${YELLOW}[1/3] Running database migrations...${NC}"
cd backend && python manage.py migrate
echo ""

# Start Django backend on port 8000
echo -e "${YELLOW}[2/3] Starting Django REST API on port 8000...${NC}"
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Django backend started (PID: $BACKEND_PID)${NC}"
echo ""

# Go back to root and start frontend
cd ..

# Start Vite frontend on port 5175 (configured in package.json)
echo -e "${YELLOW}[3/3] Starting Preact + Vite frontend on port 5175...${NC}"
cd frontend && npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Vite frontend started (PID: $FRONTEND_PID)${NC}"
echo ""

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        All Services Running!           ║${NC}"
echo -e "${BLUE}╠════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Backend API:  http://0.0.0.0:8000     ║${NC}"
echo -e "${GREEN}║  Swagger Docs: http://0.0.0.0:8000/swagger/${NC}"
echo -e "${GREEN}║  Admin Panel:  http://0.0.0.0:8000/admin/${NC}"
echo -e "${GREEN}║  Frontend:     http://0.0.0.0:5175     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
