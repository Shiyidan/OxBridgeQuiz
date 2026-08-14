[CmdletBinding()]
param(
  [string]$SourceEnvFile,
  [string]$DeploymentProfile,
  [ValidateSet('profile', 'test', 'prod', 'all')]
  [string]$Scope = 'all'
)

$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\..\..'))
if (-not $SourceEnvFile) { $SourceEnvFile = Join-Path $projectRoot 'api\.env' }
if (-not $DeploymentProfile) { $DeploymentProfile = Join-Path $projectRoot '.env.deploy.local' }
$backupDirectory = Join-Path $projectRoot '.private\config-backups'
$backupStamp = Get-Date -Format 'yyyyMMdd_HHmmss'
New-Item -ItemType Directory -Path $backupDirectory -Force | Out-Null

# Parse env values while retaining the original right-hand side for lossless secret copying.
function Read-EnvEntries {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) { throw "Environment file not found: $Path" }
  $entries = @{}
  [System.IO.File]::ReadAllLines($Path, [System.Text.Encoding]::UTF8) | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$') {
      $raw = $Matches[2].Trim()
      $value = $raw
      if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
        $value = $value.Substring(1, $value.Length - 2)
      }
      $entries[$Matches[1]] = @{ Raw = $raw; Value = $value }
    }
  }
  return $entries
}

# Normalize From values before enforcing the fixed transactional and bulk identities.
function Get-MailboxAddress {
  param([string]$Value)

  if ($Value -match '<([^<>]+)>') { return $Matches[1].Trim().ToLowerInvariant() }
  return $Value.Trim().ToLowerInvariant()
}

# Replace only selected keys, remove obsolete aliases, and preserve every unrelated private value.
function Set-EnvEntries {
  param([string]$Path, [hashtable]$Updates, [string[]]$RemoveKeys = @())

  $seen = @{}
  $lines = [System.IO.File]::ReadAllLines($Path, [System.Text.Encoding]::UTF8) | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=') {
      $key = $Matches[1]
      if ($RemoveKeys -contains $key) { return }
      if ($Updates.ContainsKey($key)) {
        $seen[$key] = $true
        return "$key=$($Updates[$key])"
      }
    }
    return $_
  }
  foreach ($key in $Updates.Keys) {
    if (-not $seen.ContainsKey($key)) { $lines += "$key=$($Updates[$key])" }
  }
  [System.IO.File]::WriteAllLines($Path, [string[]]$lines, [System.Text.UTF8Encoding]::new($false))
}

$source = Read-EnvEntries -Path $SourceEnvFile
$requiredSourceKeys = @(
  'SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM',
  'BULK_SMTP_HOST', 'BULK_SMTP_PORT', 'BULK_SMTP_SECURE', 'BULK_SMTP_USER', 'BULK_SMTP_PASS', 'BULK_MAIL_FROM'
)
foreach ($key in $requiredSourceKeys) {
  if (-not $source.ContainsKey($key) -or -not $source[$key].Value) { throw "Source environment is missing $key." }
}
if ((Get-MailboxAddress $source.SMTP_USER.Value) -ne 'no-reply@mail.acemock.cn' -or (Get-MailboxAddress $source.MAIL_FROM.Value) -ne 'no-reply@mail.acemock.cn') {
  throw 'Source transactional mail must use no-reply@mail.acemock.cn.'
}
if ((Get-MailboxAddress $source.BULK_SMTP_USER.Value) -ne 'news@mail.acemock.cn' -or (Get-MailboxAddress $source.BULK_MAIL_FROM.Value) -ne 'news@mail.acemock.cn') {
  throw 'Source bulk activity mail must use news@mail.acemock.cn.'
}

$profile = Read-EnvEntries -Path $DeploymentProfile
$profileUpdates = @{
  DEPLOY_REPORT_SMTP_HOST = $source.SMTP_HOST.Raw
  DEPLOY_REPORT_SMTP_PORT = $source.SMTP_PORT.Raw
  DEPLOY_REPORT_SMTP_USER = $source.SMTP_USER.Raw
  DEPLOY_REPORT_SMTP_PASS = $source.SMTP_PASS.Raw
  DEPLOY_REPORT_FROM = $source.SMTP_USER.Raw
  QUIZ_BULK_SMTP_HOST = $source.BULK_SMTP_HOST.Raw
  QUIZ_BULK_SMTP_PORT = $source.BULK_SMTP_PORT.Raw
  QUIZ_BULK_SMTP_SECURE = $source.BULK_SMTP_SECURE.Raw
  QUIZ_BULK_SMTP_USER = $source.BULK_SMTP_USER.Raw
  QUIZ_BULK_SMTP_PASS = $source.BULK_SMTP_PASS.Raw
  QUIZ_BULK_MAIL_FROM = $source.BULK_MAIL_FROM.Raw
}
Copy-Item -LiteralPath $DeploymentProfile -Destination (Join-Path $backupDirectory "deploy-profile-before-mail-$backupStamp.env") -Force
Set-EnvEntries -Path $DeploymentProfile -Updates $profileUpdates -RemoveKeys @('DEPLOY_REPORT_SMTP_AUTH_CODE')
Write-Output 'deployment_profile=updated sender_roles=validated backup=created'

if ($Scope -eq 'profile') { exit 0 }

$runtimeUpdates = @{}
foreach ($key in $requiredSourceKeys) { $runtimeUpdates[$key] = $source[$key].Raw }
$environments = if ($Scope -eq 'all') { @('test', 'prod') } else { @($Scope) }
$updatedProfile = Read-EnvEntries -Path $DeploymentProfile
foreach ($environment in $environments) {
  $runtimeKey = "QUIZ_$($environment.ToUpperInvariant())_RUNTIME_ENV_FILE"
  if (-not $updatedProfile.ContainsKey($runtimeKey) -or -not $updatedProfile[$runtimeKey].Value) {
    Write-Output "runtime_profile=$environment status=not-configured"
    continue
  }
  $runtimePath = $updatedProfile[$runtimeKey].Value
  if (-not (Test-Path -LiteralPath $runtimePath)) {
    Write-Output "runtime_profile=$environment status=missing"
    continue
  }
  $runtime = Read-EnvEntries -Path $runtimePath
  if ($runtime.API_RUNTIME_ENV.Value -ne $environment) { throw "Runtime environment guard failed for $environment." }
  Copy-Item -LiteralPath $runtimePath -Destination (Join-Path $backupDirectory "$environment-runtime-before-mail-$backupStamp.env") -Force
  Set-EnvEntries -Path $runtimePath -Updates $runtimeUpdates
  Write-Output "runtime_profile=$environment status=updated backup=created"
}
