param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('frontend', 'backend', 'all')]
    [string]$Scope,

    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[A-Za-z0-9._/-]+$')]
    [string]$Branch
)

# 在本地构建受 commit 绑定的测试产物，再上传至低配测试 ECS；不读取或输出运行时密钥。
$ErrorActionPreference = 'Stop'

$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\..\..'))
$skillRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$privateConfig = Join-Path $repoRoot '.env.deploy.local'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$localDir = Join-Path $repoRoot ".tmp\quiz-deploy-test-$stamp"
$artifactDir = Join-Path $localDir 'artifacts'
$buildWorktree = Join-Path $localDir 'source'
$remoteDir = "/tmp/quiz-deploy-$stamp"
$reportPath = Join-Path $repoRoot ".private\deployment-reports\quiztestdemo-test-deploy-$stamp.html"
$result = 'failed'
$remoteCreated = $false
$buildWorktreeCreated = $false

function Read-DotEnv {
    param([Parameter(Mandatory = $true)][string]$Path)

    $values = @{}
    foreach ($line in Get-Content -LiteralPath $Path) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith('#')) { continue }
        $separator = $trimmed.IndexOf('=')
        if ($separator -lt 1) { continue }
        $key = $trimmed.Substring(0, $separator).Trim()
        $value = $trimmed.Substring($separator + 1).Trim()
        if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        $values[$key] = $value
    }
    return $values
}

function Invoke-Checked {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][scriptblock]$Command
    )

    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Name failed with exit code $LASTEXITCODE."
    }
}

function Assert-TextValue {
    param([string]$Name, [string]$Value, [string]$Pattern)

    if (-not $Value -or $Value -notmatch $Pattern) {
        throw "Invalid or missing $Name in .env.deploy.local."
    }
}

function Write-FallbackReport {
    param([string]$Outcome, [string]$Message)

    if (Test-Path -LiteralPath $reportPath) { return }
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $reportPath) | Out-Null
    $safeOutcome = [System.Net.WebUtility]::HtmlEncode($Outcome)
    $safeMessage = [System.Net.WebUtility]::HtmlEncode($Message)
    $html = @"
<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>QuizTestDemo 测试部署报告</title></head>
<body><main><h1>QuizTestDemo 测试部署报告</h1><p>结果：$safeOutcome</p><p>构建模式：本地构建产物上传</p><p>说明：$safeMessage</p></main></body></html>
"@
    Set-Content -LiteralPath $reportPath -Value $html -Encoding utf8
}

if (-not (Test-Path -LiteralPath $privateConfig)) {
    throw 'Missing .env.deploy.local.'
}

$config = Read-DotEnv -Path $privateConfig
$hostName = $config['QUIZ_TEST_SSH_HOST']
$sshUser = $config['QUIZ_TEST_SSH_USER']
$sshKey = $config['QUIZ_TEST_SSH_KEY']
$publicUrl = $config['QUIZ_TEST_PUBLIC_URL']
$expectedDatabase = $config['QUIZ_TEST_DATABASE']
Assert-TextValue -Name 'QUIZ_TEST_SSH_HOST' -Value $hostName -Pattern '^[A-Za-z0-9.-]+$'
Assert-TextValue -Name 'QUIZ_TEST_SSH_USER' -Value $sshUser -Pattern '^[A-Za-z0-9._-]+$'
Assert-TextValue -Name 'QUIZ_TEST_PUBLIC_URL' -Value $publicUrl -Pattern '^https?://[A-Za-z0-9.-]+(?::[0-9]+)?$'
Assert-TextValue -Name 'QUIZ_TEST_DATABASE' -Value $expectedDatabase -Pattern '^[A-Za-z0-9_-]+$'
if (-not (Test-Path -LiteralPath $sshKey)) { throw 'Test SSH private key is missing.' }
if (-not (Get-Command tar.exe -ErrorAction SilentlyContinue)) { throw 'tar.exe is required to package test build artifacts.' }

Set-Location $repoRoot
$currentBranch = (& git branch --show-current).Trim()
if ($currentBranch -ne $Branch) { throw "Current branch $currentBranch does not match requested branch $Branch." }
$dirtyFiles = @(& git status --porcelain)
if ($dirtyFiles.Count -gt 0) {
    throw 'Refusing local-artifact deployment from a dirty worktree. Commit or stash changes first.'
}
$commit = (& git rev-parse HEAD).Trim()
if ($commit -notmatch '^[0-9a-f]{40}$') { throw 'Unable to resolve the current commit.' }
$remoteBranch = @(& git ls-remote --exit-code origin "refs/heads/$Branch")
if ($LASTEXITCODE -ne 0 -or -not $remoteBranch) { throw "The requested branch $Branch is not available on origin." }
$originCommit = ($remoteBranch[0] -split '\s+')[0]
if ($originCommit -ne $commit) { throw 'Refusing to deploy a commit that has not been pushed to origin.' }

New-Item -ItemType Directory -Force -Path $artifactDir | Out-Null
$target = "$sshUser@$hostName"

try {
    # 在独立的固定提交 worktree 中安装依赖与构建，避免占用开发中的 Prisma 引擎文件。
    Invoke-Checked -Name 'Temporary source worktree creation' -Command {
    # Keep the following command separate for Windows PowerShell source decoding.
    Invoke-Checked -Name 'Temporary source worktree creation' -Command {
        git -C $repoRoot worktree add --detach $buildWorktree $commit
    }
    $buildWorktreeCreated = $true

    if ($Scope -eq 'backend' -or $Scope -eq 'all') {
        Push-Location (Join-Path $buildWorktree 'api')
        try {
            Invoke-Checked -Name 'Local API dependency install' -Command { npm.cmd ci }
            Invoke-Checked -Name 'Local Prisma client generation' -Command { .\node_modules\.bin\prisma.cmd generate --schema prisma\schema.prisma }
            Invoke-Checked -Name 'Local API build' -Command { npm.cmd run build }
        } finally {
            Pop-Location
        }
        $apiArchive = Join-Path $artifactDir 'api-dist.tar.gz'
        Invoke-Checked -Name 'API artifact packaging' -Command { tar.exe -czf $apiArchive -C (Join-Path $buildWorktree 'api') dist }
    }

    if ($Scope -eq 'frontend' -or $Scope -eq 'all') {
        Push-Location (Join-Path $buildWorktree 'quiz-web')
        try {
            Invoke-Checked -Name 'Local web dependency install' -Command { npm.cmd ci }
            Invoke-Checked -Name 'Local test web build' -Command { npm.cmd run build-only:test }
        } finally {
            Pop-Location
        }
        $webArchive = Join-Path $artifactDir 'web-dist.tar.gz'
        Invoke-Checked -Name 'Web artifact packaging' -Command { tar.exe -czf $webArchive -C (Join-Path $buildWorktree 'quiz-web') dist }
    }

    $files = [ordered]@{}
    Get-ChildItem -LiteralPath $artifactDir -File -Filter '*.tar.gz' | ForEach-Object {
        $files[$_.Name] = [ordered]@{ sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant() }
    }
    $manifest = [ordered]@{
        schemaVersion = 1
        environment = 'test'
        scope = $Scope
        branch = $Branch
        commit = $commit
        createdAt = (Get-Date).ToString('o')
        files = $files
    }
    $manifestPath = Join-Path $artifactDir 'manifest.json'
    $manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $manifestPath -Encoding utf8

    Invoke-Checked -Name 'Test SSH identity check' -Command { ssh.exe -i $sshKey -o IdentitiesOnly=yes $target "printf 'connected\n'; hostname; whoami" }
    $remoteDirty = @(& ssh.exe -i $sshKey -o IdentitiesOnly=yes $target 'cd /opt/quiz/repo && git status --porcelain')
    if ($LASTEXITCODE -ne 0) { throw 'Unable to read the test server repository status.' }
    if ($remoteDirty.Count -gt 0) { throw 'Test server repository is dirty; inspect it before deploying.' }
    $remoteCommit = (& ssh.exe -i $sshKey -o IdentitiesOnly=yes $target 'cd /opt/quiz/repo && git rev-parse HEAD').Trim()
    if ($LASTEXITCODE -ne 0 -or $remoteCommit -notmatch '^[0-9a-f]{40}$') { throw 'Unable to resolve the test server commit.' }
    & git merge-base --is-ancestor $remoteCommit $commit
    if ($LASTEXITCODE -ne 0) { throw 'Test server commit is not an ancestor of the selected local commit.' }

    $bundlePath = Join-Path $localDir 'source.bundle'
    if ($remoteCommit -eq $commit) {
        Invoke-Checked -Name 'Full source bundle packaging' -Command { git bundle create $bundlePath $Branch }
    } else {
        Invoke-Checked -Name 'Incremental source bundle packaging' -Command { git bundle create $bundlePath $Branch "^$remoteCommit" }
    }
    Invoke-Checked -Name 'Source bundle verification' -Command { git bundle verify $bundlePath }

    Invoke-Checked -Name 'Remote deployment directory creation' -Command { ssh.exe -i $sshKey -o IdentitiesOnly=yes $target "mkdir -p $remoteDir/artifacts" }
    $remoteCreated = $true
    $uploadFiles = @(
        (Join-Path $skillRoot 'scripts\remote-deploy.sh'),
        (Join-Path $skillRoot 'scripts\check-prisma-migrations.sh'),
        (Join-Path $skillRoot 'scripts\check-runtime-config.sh'),
        (Join-Path $skillRoot 'scripts\backup-rds-runtime.sh'),
        (Join-Path $skillRoot 'scripts\verify-request-id.sh'),
        (Join-Path $skillRoot 'scripts\collect-report.sh'),
        $bundlePath,
        $manifestPath
    )
    $uploadFiles += @(Get-ChildItem -LiteralPath $artifactDir -File -Filter '*.tar.gz' | Select-Object -ExpandProperty FullName)
    Invoke-Checked -Name 'Deployment artifact upload' -Command { scp.exe -i $sshKey -o IdentitiesOnly=yes @uploadFiles "${target}:$remoteDir/" }
    Invoke-Checked -Name 'Remote artifact placement' -Command { ssh.exe -i $sshKey -o IdentitiesOnly=yes $target "mv $remoteDir/manifest.json $remoteDir/artifacts/; mv $remoteDir/*.tar.gz $remoteDir/artifacts/" }

    $remoteDeploy = "DEPLOY_SOURCE_BUNDLE=$remoteDir/source.bundle DEPLOY_EXPECTED_COMMIT=$commit DEPLOY_TEST_ARTIFACT_DIR=$remoteDir/artifacts bash $remoteDir/remote-deploy.sh test $Scope $Branch $expectedDatabase"
    & ssh.exe -i $sshKey -o IdentitiesOnly=yes $target $remoteDeploy 2>&1 | Tee-Object -FilePath (Join-Path $localDir 'deploy.log')
    if ($LASTEXITCODE -ne 0) { throw "Remote test deployment failed with exit code $LASTEXITCODE." }

    & ssh.exe -i $sshKey -o IdentitiesOnly=yes $target "bash $remoteDir/collect-report.sh test $Scope $Branch $expectedDatabase $publicUrl" 2>&1 | Tee-Object -FilePath (Join-Path $localDir 'server-report.log')
    if ($LASTEXITCODE -ne 0) { throw 'Remote report collection failed.' }
    & curl.exe -I "$publicUrl/" 2>&1 | Tee-Object -FilePath (Join-Path $localDir 'public-home.log')
    if ($LASTEXITCODE -ne 0) { throw 'Public homepage validation failed.' }
    & curl.exe -fsS "$publicUrl/api/health" 2>&1 | Tee-Object -FilePath (Join-Path $localDir 'public-health.log')
    if ($LASTEXITCODE -ne 0) { throw 'Public health validation failed.' }
    & curl.exe -fsS "$publicUrl/api/payment/config" 2>&1 | Tee-Object -FilePath (Join-Path $localDir 'database-read.log')
    if ($LASTEXITCODE -ne 0) { throw 'Database-dependent GET validation failed.' }
    & ssh.exe -i $sshKey -o IdentitiesOnly=yes $target "bash $remoteDir/verify-request-id.sh http://127.0.0.1/api/health quiz-api" 2>&1 | Tee-Object -FilePath (Join-Path $localDir 'request-id-runtime.log')
    if ($LASTEXITCODE -ne 0) { throw 'Request ID runtime log validation failed.' }

    Invoke-Checked -Name 'Deployment report generation' -Command {
        node (Join-Path $skillRoot 'scripts\generate-report.cjs') `
            --environment test `
            --scope $Scope `
            --branch $Branch `
            --result success `
            --deploy-log (Join-Path $localDir 'deploy.log') `
            --server-report (Join-Path $localDir 'server-report.log') `
            --public-home (Join-Path $localDir 'public-home.log') `
            --public-health (Join-Path $localDir 'public-health.log') `
            --database-read (Join-Path $localDir 'database-read.log') `
            --request-id-runtime (Join-Path $localDir 'request-id-runtime.log') `
            --output $reportPath
    }
    $result = 'success'
    Write-Output "test_local_artifact_deploy=success scope=$Scope branch=$Branch commit=$commit"
} catch {
    $failure = $_.Exception.Message
    Write-Error $failure
    throw
} finally {
    if ($result -ne 'success') {
        $failureMessage = if ($failure) { $failure } else { 'Deployment stopped before completion.' }
        Write-FallbackReport -Outcome $result -Message $failureMessage
    }
    if ($buildWorktreeCreated -and (Test-Path -LiteralPath $buildWorktree)) {
        & git -C $repoRoot worktree remove --force $buildWorktree
        if ($LASTEXITCODE -ne 0) { throw 'Temporary source worktree cleanup failed.' }
    }
    if ($remoteCreated) {
        & powershell.exe -ExecutionPolicy Bypass -File (Join-Path $skillRoot 'scripts\cleanup-transient.ps1') `
            -Environment test `
            -LocalDirectory $localDir `
            -RemoteDirectory $remoteDir `
            -ReportPath $reportPath `
            -Result $result
        if ($LASTEXITCODE -ne 0) { throw 'Transient deployment cleanup failed.' }
    } elseif (Test-Path -LiteralPath $localDir) {
        Remove-Item -LiteralPath $localDir -Recurse -Force
    }
}
