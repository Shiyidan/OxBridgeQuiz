param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('test', 'prod')]
    [string]$Environment,

    [Parameter(Mandatory = $true)]
    [string]$LocalDirectory,

    [Parameter(Mandatory = $true)]
    [string]$RemoteDirectory,

    [Parameter(Mandatory = $true)]
    [string]$ReportPath,

    [ValidateSet('success', 'partial', 'failed')]
    [string]$Result = 'failed',

    [string]$EnvFile
)

$ErrorActionPreference = 'Stop'

# Resolve the repository root from this project-level Skill.
$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\..\..'))
$transientRoot = [System.IO.Path]::GetFullPath((Join-Path $repoRoot '.tmp'))
$reportRoot = [System.IO.Path]::GetFullPath((Join-Path $repoRoot '.private\deployment-reports'))

# Read the private deployment configuration without printing any values.
function Read-DotEnv {
    param([Parameter(Mandatory = $true)][string]$Path)

    $values = @{}
    foreach ($line in Get-Content -LiteralPath $Path) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith('#')) {
            continue
        }

        $separator = $trimmed.IndexOf('=')
        if ($separator -lt 1) {
            continue
        }

        $key = $trimmed.Substring(0, $separator).Trim()
        $value = $trimmed.Substring($separator + 1).Trim()
        if (
            ($value.StartsWith('"') -and $value.EndsWith('"')) -or
            ($value.StartsWith("'") -and $value.EndsWith("'"))
        ) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        $values[$key] = $value
    }
    return $values
}

# Ensure cleanup can only target one timestamped directory below the repository .tmp folder.
function Resolve-SafeTransientDirectory {
    param([Parameter(Mandatory = $true)][string]$Path)

    $resolved = (Resolve-Path -LiteralPath $Path).Path
    $expectedPrefix = $transientRoot.TrimEnd('\') + '\'
    if (
        $resolved -eq $transientRoot -or
        -not $resolved.StartsWith($expectedPrefix, [System.StringComparison]::OrdinalIgnoreCase)
    ) {
        throw "Refusing to remove a path outside a child of $transientRoot"
    }
    if ((Split-Path -Leaf $resolved) -notmatch '^quiz-deploy-(?:test|prod)-[0-9]{8}[-_][0-9]{6}$') {
        throw 'Local cleanup is limited to .tmp/quiz-deploy-<environment>-YYYYMMDD-HHMMSS.'
    }
    return $resolved
}

if (-not $EnvFile) {
    $EnvFile = Join-Path $repoRoot '.env.deploy.local'
}
$EnvFile = (Resolve-Path -LiteralPath $EnvFile).Path
$config = Read-DotEnv -Path $EnvFile

$prefix = if ($Environment -eq 'prod') { 'QUIZ_PROD' } else { 'QUIZ_TEST' }
$hostName = $config["${prefix}_SSH_HOST"]
$userName = $config["${prefix}_SSH_USER"]
$keyPath = $config["${prefix}_SSH_KEY"]
if (-not $hostName -or -not $userName -or -not $keyPath) {
    throw "Missing ${prefix}_SSH_HOST, ${prefix}_SSH_USER, or ${prefix}_SSH_KEY in the deployment environment file."
}
$keyPath = (Resolve-Path -LiteralPath $keyPath).Path

$resolvedReport = [System.IO.Path]::GetFullPath($ReportPath)
$expectedReportPrefix = $reportRoot.TrimEnd('\') + '\'
if (
    -not $resolvedReport.StartsWith($expectedReportPrefix, [System.StringComparison]::OrdinalIgnoreCase) -or
    [System.IO.Path]::GetExtension($resolvedReport) -ne '.html'
) {
    throw "Cleanup requires a saved HTML report below $reportRoot"
}
if (-not (Test-Path -LiteralPath $resolvedReport -PathType Leaf)) {
    New-Item -ItemType Directory -Path (Split-Path -Parent $resolvedReport) -Force | Out-Null
    $generatedAt = [System.Net.WebUtility]::HtmlEncode((Get-Date).ToString('yyyy-MM-dd HH:mm:ss zzz'))
    $safeEnvironment = [System.Net.WebUtility]::HtmlEncode($Environment)
    $safeResult = [System.Net.WebUtility]::HtmlEncode($Result)
    $fallbackReport = @"
<!doctype html>
<html lang="zh-CN">
<head><meta charset="utf-8"><title>QuizTestDemo 部署收尾报告</title></head>
<body>
<h1>QuizTestDemo 部署收尾报告</h1>
<p>环境：$safeEnvironment</p>
<p>结果：$safeResult</p>
<p>生成时间：$generatedAt</p>
<p>详细证据未能完整生成；临时证据已按安全清理规则移除。</p>
</body>
</html>
"@
    Set-Content -LiteralPath $resolvedReport -Value $fallbackReport -Encoding utf8
}

$resolvedLocalDirectory = Resolve-SafeTransientDirectory -Path $LocalDirectory
if ($RemoteDirectory -notmatch '^/tmp/quiz-deploy-[0-9]{8}[-_][0-9]{6}$') {
    throw 'Remote cleanup is limited to /tmp/quiz-deploy-YYYYMMDD-HHMMSS.'
}

# Delete the exact remote deployment directory before removing its local evidence copy.
$remoteCommand = "if [ -d '$RemoteDirectory' ]; then rm -rf -- '$RemoteDirectory'; fi"
& ssh -i $keyPath -o BatchMode=yes -- "$userName@$hostName" $remoteCommand
$remoteExitCode = $LASTEXITCODE
Remove-Item -LiteralPath $resolvedLocalDirectory -Recurse -Force
if ($remoteExitCode -ne 0) {
    throw "Local evidence was removed, but remote transient cleanup failed for the selected $Environment environment."
}
Write-Output "transient_cleanup=ok environment=$Environment"
