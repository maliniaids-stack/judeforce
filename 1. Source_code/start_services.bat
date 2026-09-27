@echo off
title PRISM AI - Service Launcher
echo ========================================================
echo               PRISM AI - SERVICE LAUNCHER
echo ========================================================
echo.
echo 1. Checking Docker Containers...
cd /d "%~dp0"
docker compose up -d
echo.

echo 2. Launching Backend FastAPI Server (Port 8000)...
start "Prism AI - Backend API" cmd /k "cd /d "%~dp0backend" && venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo 3. Launching Celery Worker...
start "Prism AI - Celery Worker" cmd /k "cd /d "%~dp0backend" && venv\Scripts\python.exe -m celery -A app.worker.celery_app worker --loglevel=info -P solo"

timeout /t 3 /nobreak >nul

echo 4. Launching Frontend Dev Server (Port 5173)...
start "Prism AI - Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================================
echo  All services launched in separate terminal windows!
echo  - Frontend: http://localhost:5173/
echo  - Backend API docs: http://localhost:8000/docs
echo  - MinIO Console: http://localhost:9001/
echo ========================================================
pause
