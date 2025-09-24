@echo off
rem This script automates the local setup for the project without Devcontainer.
rem Run this script from the project root directory.

echo --- Setting up backend ---
cd backend

if not exist venv (
    python -m venv venv
    echo Virtual environment created in 'backend\venv'.
)

call venv\Scripts\activate.bat
pip install -r requirements.txt
call venv\Scripts\deactivate.bat

if exist .env.example ( if not exist .env ( copy .env.example .env && echo Created .env file in 'backend' directory. ) )

echo Backend setup complete.
echo.

echo --- Setting up frontend ---
cd ..\frontend
call npm install
if not exist .env (
    copy .env.example .env
    echo Created .env file in 'frontend' directory from .env.example.
)
echo Frontend setup complete.
echo.

echo --- Setup Finished --- 

echo.
echo Next steps:
echo.
echo 1. Open a terminal for the backend:
echo    cd backend
echo    venv\Scripts\activate
    rem The backend now loads settings from backend/.env automatically.
    rem You can edit this file to switch to Vertex AI.
echo    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
echo.
echo 2. Open another terminal for the frontend:
echo    cd frontend
echo    npm run dev
echo.