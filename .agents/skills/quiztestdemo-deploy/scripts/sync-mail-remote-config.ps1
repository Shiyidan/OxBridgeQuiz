[CmdletBinding()]
param(
  [Parameter(Mandatory)]
  [ValidateSet('test', 'prod')]
  [string]$Environment,
  [string]$SourceEnvFile,
  [string]$DeploymentProfile
)

$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\..\..'))
if (-not $SourceEnvFile) { $SourceEnvFile = Join-Path $projectRoot 'api\.env' }
if (-not $DeploymentProfile) { $DeploymentProfile = Join-Path $projectRoot '.env.deploy.local' }
$mergeScript = Join-Path $PSScriptRoot 'merge-mail-runtime-config.sh'
$verifyScript = Join-Path $PSScriptRoot 'verify-mail-runtime.cjs'

# Parse env files while preserving each raw right-hand side for an exact private overlay.
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

$profile = Read-EnvEntries -Path $DeploymentProfile
$source = Read-EnvEntries -Path $SourceEnvFile
$prefix = "QUIZ_$($Environment.ToUpperInvariant())"
$sshHost = $profile["${prefix}_SSH_HOST"].Value
$user = $profile["${prefix}_SSH_USER"].Value
$key = $profile["${prefix}_SSH_KEY"].Value
if ($sshHost -notmatch '^[A-Za-z0-9.-]+$' -or $user -notmatch '^[A-Za-z0-9._-]+$') {
  throw 'SSH target contains unsupported characters.'
}
if (-not (Test-Path -LiteralPath $key)) { throw 'SSH key file was not found.' }

$mailKeys = @(
  'SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM',
  'BULK_SMTP_HOST', 'BULK_SMTP_PORT', 'BULK_SMTP_SECURE', 'BULK_SMTP_USER', 'BULK_SMTP_PASS', 'BULK_MAIL_FROM'
)
$overlayLines = foreach ($mailKey in $mailKeys) {
  if (-not $source.ContainsKey($mailKey) -or -not $source[$mailKey].Value) { throw "Source environment is missing $mailKey." }
  "$mailKey=$($source[$mailKey].Raw)"
}
$overlay = ($overlayLines -join "`n") + "`n"
$target = "${user}@${sshHost}"

& scp -q -i $key -o BatchMode=yes -o StrictHostKeyChecking=accept-new $mergeScript "${target}:/tmp/quiz-merge-mail-runtime-config.sh"
if ($LASTEXITCODE -ne 0) { throw "Failed to upload mail merge script to $Environment." }
& scp -q -i $key -o BatchMode=yes -o StrictHostKeyChecking=accept-new $verifyScript "${target}:/tmp/quiz-verify-mail-runtime.cjs"
if ($LASTEXITCODE -ne 0) { throw "Failed to upload mail verification script to $Environment." }

$remoteCommand = "trap 'rm -f /tmp/quiz-merge-mail-runtime-config.sh /tmp/quiz-verify-mail-runtime.cjs' EXIT; bash /tmp/quiz-merge-mail-runtime-config.sh $Environment /opt/quiz/api/.env; node /tmp/quiz-verify-mail-runtime.cjs /opt/quiz/api /opt/quiz/api/.env; pm2 reload /opt/quiz/ecosystem.config.cjs --only quiz-api --update-env >/dev/null; for attempt in 1 2 3 4 5 6 7 8 9 10; do if curl -fsS http://127.0.0.1:3001/api/health >/dev/null; then echo 'api_reload=healthy'; exit 0; fi; sleep 1; done; echo 'api health check failed after mail config reload' >&2; exit 1"
$overlay | & ssh -i $key -o BatchMode=yes -o StrictHostKeyChecking=accept-new $target $remoteCommand
if ($LASTEXITCODE -ne 0) { throw "Remote mail configuration or verification failed for $Environment." }
Write-Output "remote_mail_config=$Environment status=updated_and_authenticated"
