Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "              PRISM AI - SERVICE LAUNCHER              " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Docker Compose
Write-Host "`n1. Starting Docker Containers..." -ForegroundColor Yellow
Set-Location $baseDir
docker compose up -d

# 2. Backend FastAPI
Write-Host "`n2. Launching Backend FastAPI (Port 8000)..." -ForegroundColor Yellow
$backendDir = Join-Path $baseDir "backend"
$pythonPath = Join-Path $backendDir "venv\Scripts\python.exe"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendDir'; & '$pythonPath' -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

Start-Sleep -Seconds 3

# 3. Celery Worker
Write-Host "`n3. Launching Celery Background Worker..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendDir'; & '$pythonPath' -m celery -A app.worker.celery_app worker --loglevel=info -P solo"

Start-Sleep -Seconds 3

# 4. Frontend Vite Dev Server
Write-Host "`n4. Launching Frontend (Port 5173)..." -ForegroundColor Yellow
$frontendDir = Join-Path $baseDir "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontendDir'; npm run dev"

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host " All services have been launched in manual terminals!" -ForegroundColor Green
Write-Host " - Frontend UI:   http://localhost:5173/" -ForegroundColor White
Write-Host " - Backend API:   http://localhost:8000/docs" -ForegroundColor White
Write-Host " - MinIO Console: http://localhost:9001/" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Green
