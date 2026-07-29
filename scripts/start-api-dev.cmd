@echo off
setlocal

REM Ensure the local development database is available before starting the API.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-mysql-local.ps1"
if errorlevel 1 (
  echo Failed to start the local MySQL server. Check .mysql\logs\error.log.
  exit /b 1
)

REM Treat an already healthy API as success instead of starting a duplicate process.
powershell.exe -NoProfile -Command "try { $response = Invoke-RestMethod -Uri 'http://127.0.0.1:3001/api/health' -TimeoutSec 2; if ($response.success -eq $true) { exit 0 } } catch {}; exit 1"
if not errorlevel 1 (
  echo API dev server is already running on http://localhost:3001
  exit /b 0
)

REM Fail clearly when another application owns port 3001.
powershell.exe -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if not errorlevel 1 (
  echo Port 3001 is already occupied by another application.
  exit /b 1
)

cd /d "%~dp0..\api"
npm.cmd run dev
pause
