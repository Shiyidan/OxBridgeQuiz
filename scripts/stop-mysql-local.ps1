# Stops the local MySQL 8.4 instance used by QuizTestDemo development.
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $repoRoot '.mysql\mysql.pid'
$port = 3307

$ready = Test-NetConnection -ComputerName 127.0.0.1 -Port $port -InformationLevel Quiet
if (-not $ready) {
  Write-Output "MySQL local dev server is not running on 127.0.0.1:$port"
  exit 0
}

if (-not (Test-Path $pidFile)) {
  throw "PID file not found at $pidFile"
}

$pidValue = (Get-Content $pidFile | Select-Object -First 1).Trim()
if (-not $pidValue) {
  throw "PID file is empty: $pidFile"
}

Stop-Process -Id ([int]$pidValue) -Force
Start-Sleep -Seconds 2

Write-Output "MySQL local dev server stopped (PID $pidValue)"
