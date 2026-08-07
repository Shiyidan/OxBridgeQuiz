# Starts a clean QuizTestDemo development, test, or online-integration environment.
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('development', 'test', 'online')]
  [string]$Environment,

  [string]$RepoRoot,

  [ValidateRange(10, 60)]
  [int]$TimeoutSeconds = 45,

  [switch]$ValidateOnly
)

$ErrorActionPreference = 'Stop'
$ExpectedTestApiOrigin = 'http://114.215.189.215'

# Resolve the repository independently of the caller's current directory.
function Resolve-RepositoryRoot {
  if ($RepoRoot) {
    return [System.IO.Path]::GetFullPath($RepoRoot)
  }

  return [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\..\..'))
}

# Fail with a useful path when a required project artifact is unavailable.
function Assert-PathExists {
  param(
    [Parameter(Mandatory = $true)]
    [string]$LiteralPath,

    [Parameter(Mandatory = $true)]
    [string]$Description
  )

  if (-not (Test-Path -LiteralPath $LiteralPath)) {
    throw "$Description not found: $LiteralPath"
  }
}

# Read one public frontend origin without exposing unrelated private env values.
function Get-EnvValue {
  param(
    [Parameter(Mandatory = $true)]
    [string]$LiteralPath,

    [Parameter(Mandatory = $true)]
    [string]$Key
  )

  Assert-PathExists -LiteralPath $LiteralPath -Description 'Environment file'
  $escapedKey = [regex]::Escape($Key)
  $match = Get-Content -LiteralPath $LiteralPath | Where-Object {
    $_ -match "^\s*$escapedKey\s*="
  } | Select-Object -Last 1

  if (-not $match) {
    throw "$Key is required in $LiteralPath"
  }

  $value = ($match -split '=', 2)[1].Trim().Trim('"').Trim("'")
  if (-not $value) {
    throw "$Key is empty in $LiteralPath"
  }

  return $value.TrimEnd('/')
}

# Validate that a proxy target is an explicit HTTP(S) origin.
function Assert-HttpOrigin {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Origin,

    [Parameter(Mandatory = $true)]
    [string]$Key
  )

  [System.Uri]$parsedUri = $null
  if (-not [System.Uri]::TryCreate($Origin, [System.UriKind]::Absolute, [ref]$parsedUri)) {
    throw "$Key must be an absolute HTTP(S) origin"
  }

  if ($parsedUri.Scheme -notin @('http', 'https')) {
    throw "$Key must use HTTP or HTTPS"
  }
}

# Resolve listener PIDs with a netstat fallback for hosts where Get-NetTCPConnection is restricted.
function Get-ListeningProcessIds {
  param(
    [Parameter(Mandatory = $true)]
    [int]$Port
  )

  $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  $processIds = @($connections | Select-Object -ExpandProperty OwningProcess -Unique)
  if ($processIds.Count -gt 0) {
    return $processIds
  }

  $pattern = "^\s*TCP\s+\S+:$Port\s+\S+\s+LISTENING\s+(\d+)\s*$"
  return @(
    & netstat.exe -ano -p TCP | ForEach-Object {
      if ($_ -match $pattern) { [int]$Matches[1] }
    } | Sort-Object -Unique
  )
}

# Stop only listeners on an environment-owned port, including stale dev servers.
function Stop-PortListeners {
  param(
    [Parameter(Mandatory = $true)]
    [int]$Port
  )

  $processIds = @(Get-ListeningProcessIds -Port $Port)

  foreach ($processId in $processIds) {
    if (-not $processId) { continue }

    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    $processName = if ($process) { $process.ProcessName } else { 'unknown' }
    Write-Output "Stopping listener on port $Port (PID $processId, process $processName)"
    Stop-Process -Id $processId -Force -ErrorAction Stop
  }

  $deadline = (Get-Date).AddSeconds(10)
  while ((Get-Date) -lt $deadline) {
    $remainingProcessIds = @(Get-ListeningProcessIds -Port $Port)
    if ($remainingProcessIds.Count -eq 0) { return }
    Start-Sleep -Milliseconds 250
  }

  throw "Port $Port is still occupied after stopping its listener"
}

# Wait for one local service port while keeping total startup time bounded.
function Wait-ForPort {
  param(
    [Parameter(Mandatory = $true)]
    [int]$Port,

    [Parameter(Mandatory = $true)]
    [string]$ServiceName
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    $listenerProcessIds = @(Get-ListeningProcessIds -Port $Port)
    if ($listenerProcessIds.Count -gt 0) { return }
    Start-Sleep -Milliseconds 500
  }

  throw "$ServiceName did not listen on port $Port within $TimeoutSeconds seconds"
}

# Start a hidden npm process and keep stdout/stderr in the ignored runtime folder.
function Start-NpmProcess {
  param(
    [Parameter(Mandatory = $true)]
    [string]$WorkingDirectory,

    [Parameter(Mandatory = $true)]
    [string]$NpmArguments,

    [Parameter(Mandatory = $true)]
    [string]$LogPrefix,

    [Parameter(Mandatory = $true)]
    [string]$LogDirectory
  )

  $stdoutPath = Join-Path $LogDirectory "$LogPrefix.out.log"
  $stderrPath = Join-Path $LogDirectory "$LogPrefix.err.log"
  $processEnvironment = [System.Environment]::GetEnvironmentVariables()
  $pathKeys = @($processEnvironment.Keys | Where-Object { $_ -ieq 'Path' })
  if ($pathKeys.Count -gt 1) {
    $pathValues = @($pathKeys | ForEach-Object { [string]$processEnvironment[$_] })
    [System.Environment]::SetEnvironmentVariable('PATH', $null, 'Process')
    [System.Environment]::SetEnvironmentVariable('Path', ($pathValues -join ';'), 'Process')
  }

  $process = Start-Process -FilePath 'cmd.exe' `
    -ArgumentList @('/d', '/c', "npm.cmd $NpmArguments") `
    -WorkingDirectory $WorkingDirectory `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdoutPath `
    -RedirectStandardError $stderrPath `
    -PassThru

  Write-Output "Started $LogPrefix (PID $($process.Id))"
  return $process
}

# Verify the API response without printing response bodies that may contain details.
function Assert-HealthEndpoint {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Uri,

    [Parameter(Mandatory = $true)]
    [string]$Description
  )

  try {
    $response = Invoke-RestMethod -Uri $Uri -Method Get -TimeoutSec 10
  } catch {
    throw "$Description health check failed at $Uri`: $($_.Exception.Message)"
  }

  if ($null -ne $response.success -and $response.success -ne $true) {
    throw "$Description health check returned success=false at $Uri"
  }
}

$resolvedRepoRoot = Resolve-RepositoryRoot
$webRoot = Join-Path $resolvedRepoRoot 'quiz-web'
$apiRoot = Join-Path $resolvedRepoRoot 'api'
$localMysqlStartScript = Join-Path $resolvedRepoRoot 'scripts\start-mysql-local.ps1'
$logDirectory = Join-Path $resolvedRepoRoot '.tmp\environment-runner'

Assert-PathExists -LiteralPath (Join-Path $resolvedRepoRoot 'AGENTS.md') -Description 'QuizTestDemo repository marker'
Assert-PathExists -LiteralPath (Join-Path $webRoot 'package.json') -Description 'Frontend package'
Assert-PathExists -LiteralPath (Join-Path $webRoot 'node_modules') -Description 'Frontend dependencies; run npm.cmd install in quiz-web'

$frontendNpmArguments = 'run dev'
$backendTarget = 'local Express API and local MySQL'

switch ($Environment) {
  'development' {
    Assert-PathExists -LiteralPath (Join-Path $apiRoot 'package.json') -Description 'API package'
    Assert-PathExists -LiteralPath (Join-Path $apiRoot 'node_modules') -Description 'API dependencies; run npm.cmd install in api'
    Assert-PathExists -LiteralPath (Join-Path $apiRoot '.env') -Description 'Local API environment file'
    Assert-PathExists -LiteralPath $localMysqlStartScript -Description 'Local MySQL startup script'
  }
  'test' {
    $testEnvPath = Join-Path $webRoot '.env.test.local'
    $remoteOrigin = Get-EnvValue -LiteralPath $testEnvPath -Key 'VITE_TEST_API_ORIGIN'
    Assert-HttpOrigin -Origin $remoteOrigin -Key 'VITE_TEST_API_ORIGIN'
    if (-not $remoteOrigin.Equals($ExpectedTestApiOrigin, [System.StringComparison]::OrdinalIgnoreCase)) {
      throw "VITE_TEST_API_ORIGIN must be $ExpectedTestApiOrigin in $testEnvPath"
    }
    $frontendNpmArguments = 'run dev:test'
    $backendTarget = 'test backend (database owned by remote backend)'
  }
  'online' {
    $onlineEnvPath = Join-Path $webRoot '.env.online.local'
    $remoteOrigin = Get-EnvValue -LiteralPath $onlineEnvPath -Key 'VITE_ONLINE_API_ORIGIN'
    Assert-HttpOrigin -Origin $remoteOrigin -Key 'VITE_ONLINE_API_ORIGIN'
    $frontendNpmArguments = 'run dev:online'
    $backendTarget = 'production backend (database owned by remote backend)'
  }
}

if ($ValidateOnly) {
  Write-Output "Validation successful for environment: $Environment"
  Write-Output "Backend target: $backendTarget"
  exit 0
}

New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null

if ($Environment -eq 'development') {
  foreach ($port in @(5173, 3001, 3307)) {
    Stop-PortListeners -Port $port
  }

  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $localMysqlStartScript
  Wait-ForPort -Port 3307 -ServiceName 'Local MySQL'

  Start-NpmProcess -WorkingDirectory $apiRoot -NpmArguments 'run dev' -LogPrefix 'development-api' -LogDirectory $logDirectory | Out-Null
  Wait-ForPort -Port 3001 -ServiceName 'Local API'
  Assert-HealthEndpoint -Uri 'http://127.0.0.1:3001/api/health' -Description 'Local API'
} else {
  Stop-PortListeners -Port 5173
}

Start-NpmProcess -WorkingDirectory $webRoot -NpmArguments $frontendNpmArguments -LogPrefix "$Environment-frontend" -LogDirectory $logDirectory | Out-Null
Wait-ForPort -Port 5173 -ServiceName 'Vue frontend'

if ($Environment -in @('test', 'online')) {
  Assert-HealthEndpoint -Uri 'http://127.0.0.1:5173/api/health' -Description "$Environment frontend proxy"
}

Write-Output "Environment started successfully: $Environment"
Write-Output 'Frontend URL: http://127.0.0.1:5173'
Write-Output "Backend target: $backendTarget"
Write-Output "Logs: $logDirectory"
