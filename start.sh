#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting EdMap Application...${NC}"

# Set GROQ API key from secret
export DJANGO_APP_GROQ_API_KEY="${GROQ_API_KEY}"

# Run Django migrations
echo -e "${GREEN}Running database migrations...${NC}"
cd backend && python manage.py migrate

# Start Django backend on port 8000
echo -e "${GREEN}Starting Django backend on port 8000...${NC}"
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!

# Go back to root and start frontend
cd ..

# Start Vite frontend on port 5175 (configured in package.json)
echo -e "${GREEN}Starting Vite frontend on port 5175...${NC}"
cd frontend && npm run dev &
FRONTEND_PID=$!

echo -e "${BLUE}Both servers started!${NC}"
echo -e "${GREEN}Backend: http://0.0.0.0:8000${NC}"
echo -e "${GREEN}Frontend: http://0.0.0.0:5175${NC}"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
