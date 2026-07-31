[CmdletBinding()]
param(
  [ValidateSet('test', 'prod')]
  [string]$Environment,
  [Parameter(Mandatory)]
  [string]$SshHost,
  [Parameter(Mandatory)]
  [string]$SshKey,
  [Parameter(Mandatory)]
  [ValidatePattern('^https?://[A-Za-z0-9.-]+(?::[0-9]+)?$')]
  [string]$PublicUrl,
  [string]$SshUser = 'deploy',
  [switch]$Force
)

$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\\..\\..\\..'))
$profilePath = Join-Path $projectRoot '.env.deploy.local'
$examplePath = Join-Path $projectRoot 'api/.env.example'

function Read-PrivateKeyValue {
  param([hashtable]$Values, [string[]]$Names)

  foreach ($name in $Names) {
    if ($Values.ContainsKey($name) -and $Values[$name]) {
      return $Values[$name]
    }
  }
  return $null
}

# Parse the local ignored deployment profile without displaying its sensitive values.
function Read-PrivateProfile {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Missing private deployment profile: $Path"
  }

  $values = @{}
  Get-Content -LiteralPath $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith('#')) { return }
    $index = $line.IndexOf('=')
    if ($index -le 0) { return }
    $key = $line.Substring(0, $index).Trim()
    $value = $line.Substring($index + 1).Trim().Trim('"').Trim("'")
    $values[$key] = $value
  }
  return $values
}

# Update only the selected environment's non-secret deployment-target fields.
function Set-PrivateProfileValues {
  param([string]$Path, [hashtable]$Updates)

  $found = @{}
  $lines = Get-Content -LiteralPath $Path | ForEach-Object {
    $line = $_
    $match = $line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*='
    if ($match -and $Updates.ContainsKey($Matches[1])) {
      $found[$Matches[1]] = $true
      return "$($Matches[1])=$($Updates[$Matches[1]])"
    }
    return $line
  }
  foreach ($key in $Updates.Keys) {
    if (-not $found.ContainsKey($key)) {
      $lines += "$key=$($Updates[$key])"
    }
  }
  [System.IO.File]::WriteAllLines($Path, [string[]]$lines, [System.Text.UTF8Encoding]::new($false))
}

# Generate stable high-entropy secrets for this newly provisioned runtime profile.
function New-RandomHex {
  param([int]$ByteCount = 48)

  $bytes = [byte[]]::new($ByteCount)
  [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
  return ([Convert]::ToHexString($bytes)).ToLowerInvariant()
}

function ConvertFrom-SecureStringValue {
  param([Security.SecureString]$Value)

  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Value)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  }
  finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  }
}

$profile = Read-PrivateProfile -Path $profilePath
$prefix = "QUIZ_$($Environment.ToUpperInvariant())"
$expectedDatabase = $profile["${prefix}_DATABASE"]
if (-not $expectedDatabase -or $expectedDatabase -like 'replace_with_*') {
  throw "${prefix}_DATABASE is missing or still a placeholder in .env.deploy.local."
}
if (-not (Test-Path -LiteralPath $SshKey)) {
  throw "SSH key file was not found."
}

$rdsHost = Read-Host 'RDS private endpoint (host or host:port)'
if ($rdsHost -notmatch '^[A-Za-z0-9.-]+(?::\d{1,5})?$') {
  throw 'RDS endpoint must be a host or host:port without a protocol.'
}
$rdsUser = Read-Host 'RDS application account'
if (-not $rdsUser) {
  throw 'RDS application account is required.'
}
$rdsPassword = Read-Host 'RDS application password' -AsSecureString
$rdsPasswordText = ConvertFrom-SecureStringValue -Value $rdsPassword
if (-not $rdsPasswordText) {
  throw 'RDS application password is required.'
}

$smtpHost = Read-PrivateKeyValue -Values $profile -Names @('DEPLOY_REPORT_SMTP_HOST')
$smtpPort = Read-PrivateKeyValue -Values $profile -Names @('DEPLOY_REPORT_SMTP_PORT')
$smtpUser = Read-PrivateKeyValue -Values $profile -Names @('DEPLOY_REPORT_SMTP_USER')
$smtpPassword = Read-PrivateKeyValue -Values $profile -Names @('DEPLOY_REPORT_SMTP_AUTH_CODE', 'DEPLOY_REPORT_SMTP_PASS')
$mailFrom = Read-PrivateKeyValue -Values $profile -Names @('DEPLOY_REPORT_FROM')
if (-not $smtpHost -or -not $smtpPort -or -not $smtpUser -or -not $smtpPassword -or -not $mailFrom) {
  throw 'Private deployment profile does not contain a complete reusable SMTP configuration.'
}

$runtimeDirectory = Join-Path $env:USERPROFILE '.quiztestdemo\runtime'
$runtimePath = Join-Path $runtimeDirectory "$Environment-api.env"
if ((Test-Path -LiteralPath $runtimePath) -and -not $Force) {
  throw "Runtime profile already exists at $runtimePath. Use -Force only when deliberately rotating its secrets."
}
New-Item -ItemType Directory -Force -Path $runtimeDirectory | Out-Null

$databaseUrl = 'mysql://{0}:{1}@{2}/{3}' -f [Uri]::EscapeDataString($rdsUser), [Uri]::EscapeDataString($rdsPasswordText), $rdsHost, [Uri]::EscapeDataString($expectedDatabase)
$smtpSecure = if ([int]$smtpPort -eq 465) { 'true' } else { 'false' }
$overrides = @{
  API_RUNTIME_ENV = $Environment
  API_PORT = '3001'
  DATABASE_URL = $databaseUrl
  JWT_SECRET = New-RandomHex
  EMAIL_CODE_SECRET = New-RandomHex
  FRONTEND_URL = $PublicUrl.TrimEnd('/')
  CORS_ORIGINS = $PublicUrl.TrimEnd('/')
  REFRESH_COOKIE_SECURE = 'false'
  REFRESH_COOKIE_SAME_SITE = 'lax'
  TRUST_PROXY = '1'
  SMTP_HOST = $smtpHost
  SMTP_PORT = $smtpPort
  SMTP_SECURE = $smtpSecure
  SMTP_CONNECTION_TIMEOUT_MS = '5000'
  SMTP_GREETING_TIMEOUT_MS = '5000'
  SMTP_SOCKET_TIMEOUT_MS = '15000'
  SMTP_USER = $smtpUser
  SMTP_PASS = $smtpPassword
  MAIL_FROM = $mailFrom
  CHINAUMS_ENABLED = 'false'
  CHINAUMS_ENV = 'test'
  PAYMENT_LIFECYCLE_ENABLED = 'false'
  PAYMENT_RECONCILIATION_ENABLED = 'false'
}

$lines = Get-Content -LiteralPath $examplePath | ForEach-Object {
  $line = $_
  if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=') {
    $key = $Matches[1]
    if ($overrides.ContainsKey($key)) {
      return "$key=$($overrides[$key])"
    }
  }
  return $line
}
[System.IO.File]::WriteAllLines($runtimePath, [string[]]$lines, [System.Text.UTF8Encoding]::new($false))

$acl = Get-Acl -LiteralPath $runtimePath
$acl.SetAccessRuleProtection($true, $false)
$acl.SetAccessRule((New-Object System.Security.AccessControl.FileSystemAccessRule($env:USERNAME, 'FullControl', 'Allow')))
Set-Acl -LiteralPath $runtimePath -AclObject $acl

Set-PrivateProfileValues -Path $profilePath -Updates @{
  "${prefix}_SSH_HOST" = $SshHost
  "${prefix}_SSH_USER" = $SshUser
  "${prefix}_SSH_KEY" = $SshKey
  "${prefix}_PUBLIC_URL" = $PublicUrl.TrimEnd('/')
  "${prefix}_RUNTIME_ENV_FILE" = $runtimePath
}

Write-Output "runtime_env=created environment=$Environment runtime_file=$runtimePath smtp=reused payment=disabled"
