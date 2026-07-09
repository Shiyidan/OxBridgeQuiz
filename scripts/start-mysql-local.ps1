# Starts the local MySQL 8.4 instance used by QuizTestDemo development.
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$mysqld = 'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe'
$config = Join-Path $repoRoot '.mysql\my.ini'
$port = 3307

if (-not (Test-Path $mysqld)) {
  throw "mysqld.exe not found at $mysqld"
}

$ready = Test-NetConnection -ComputerName 127.0.0.1 -Port $port -InformationLevel Quiet
if ($ready) {
  Write-Output "MySQL local dev server is already running on 127.0.0.1:$port"
  exit 0
}

$proc = Start-Process -WindowStyle Hidden -FilePath $mysqld -ArgumentList "--defaults-file=$config", "--console" -PassThru
Start-Sleep -Seconds 5

$ready = Test-NetConnection -ComputerName 127.0.0.1 -Port $port -InformationLevel Quiet
if (-not $ready) {
  throw "MySQL local dev server failed to start. Check .mysql/logs/error.log"
}

Write-Output "MySQL local dev server started on 127.0.0.1:$port (PID $($proc.Id))"
