#!/bin/bash
# This script automates the local setup for the project without Devcontainer.
# Run this script from the project root directory.

set -e

echo "--- Setting up backend ---"
cd backend

if [ ! -d "venv" ]; then
  python3 -m venv venv
  echo "Virtual environment created in 'backend/venv'."
fi

source venv/bin/activate

pip install -r requirements.txt

deactivate

if [ -f .env.example ] && [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file in 'backend' directory."
fi

echo "Backend setup complete."
echo ""


echo "--- Setting up frontend ---"
cd ../frontend
npm install
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file in 'frontend' directory from .env.example."
fi
echo "Frontend setup complete."
echo ""

echo "✅ --- Setup Finished --- ✅"

echo "
Next steps:

1. Open a terminal for the backend:
   cd backend
   source venv/bin/activate
   # The backend now loads settings from backend/.env automatically.
   # You can edit this file to switch to Vertex AI.
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

2. Open another terminal for the frontend:
   cd frontend
   npm run dev
"