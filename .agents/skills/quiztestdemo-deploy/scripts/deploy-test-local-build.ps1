param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('frontend', 'backend', 'all')]
    [string]$Scope,

    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[A-Za-z0-9._/-]+$')]
    [string]$Branch
)

# Build commit-bound test artifacts locally, then upload them to the low-resource test ECS.
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
$deploymentDoc = $null
$deployLog = Join-Path $localDir 'deploy.log'
$artifactCacheRoot = Join-Path $repoRoot '.private\deployment-cache\test\v1'
$result = 'failed'
$remoteCreated = $false
$buildWorktreeCreated = $false
$buildJobs = @()
$deploymentStopwatch = [System.Diagnostics.Stopwatch]::StartNew()
$lastTimingSeconds = 0.0
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)

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

# Record stage and cumulative durations in the sanitized deployment log.
function Write-DeploymentTiming {
    param([Parameter(Mandatory = $true)][string]$Stage)

    $totalSeconds = [Math]::Round($deploymentStopwatch.Elapsed.TotalSeconds, 2)
    $stageSeconds = [Math]::Round($totalSeconds - $lastTimingSeconds, 2)
    $script:lastTimingSeconds = $totalSeconds
    $line = "local_timing stage=$Stage seconds=$stageSeconds total_seconds=$totalSeconds"
    Write-Output $line
    [System.IO.File]::AppendAllText($deployLog, "$line`r`n", $utf8NoBom)
}

# Resolve the artifact set required by the explicitly selected deployment scope.
function Get-RequiredArtifactNames {
    if ($Scope -eq 'backend' -or $Scope -eq 'all') { 'api-dist.tar.gz' }
    if ($Scope -eq 'frontend' -or $Scope -eq 'all') { 'web-dist.tar.gz' }
}

# Reuse only commit- and toolchain-bound artifacts whose checksums still match.
function Restore-ArtifactCache {
    param(
        [Parameter(Mandatory = $true)][string]$CacheDirectory,
        [Parameter(Mandatory = $true)][string]$DestinationDirectory,
        [Parameter(Mandatory = $true)][string]$Commit,
        [Parameter(Mandatory = $true)][string]$NodeVersion,
        [Parameter(Mandatory = $true)][string]$NpmVersion
    )

    $metadataPath = Join-Path $CacheDirectory 'cache.json'
    if (-not (Test-Path -LiteralPath $metadataPath)) { return $false }

    try {
        $metadata = Get-Content -LiteralPath $metadataPath -Raw -Encoding utf8 | ConvertFrom-Json
        if ($metadata.schemaVersion -ne 1 -or $metadata.commit -ne $Commit -or $metadata.scope -ne $Scope) { return $false }
        if ($metadata.nodeVersion -ne $NodeVersion -or $metadata.npmVersion -ne $NpmVersion) { return $false }

        foreach ($name in @(Get-RequiredArtifactNames)) {
            $cachedPath = Join-Path $CacheDirectory $name
            $expectedHash = $metadata.files.$name.sha256
            if (-not (Test-Path -LiteralPath $cachedPath) -or $expectedHash -notmatch '^[a-f0-9]{64}$') { return $false }
            $actualHash = (Get-FileHash -LiteralPath $cachedPath -Algorithm SHA256).Hash.ToLowerInvariant()
            if ($actualHash -ne $expectedHash) { return $false }
        }

        foreach ($name in @(Get-RequiredArtifactNames)) {
            Copy-Item -LiteralPath (Join-Path $CacheDirectory $name) -Destination (Join-Path $DestinationDirectory $name) -Force
        }
        return $true
    } catch {
        Write-Warning 'The local deployment artifact cache is invalid and will be rebuilt.'
        return $false
    }
}

# Persist verified local build archives for safe retries of the same build identity.
function Save-ArtifactCache {
    param(
        [Parameter(Mandatory = $true)][string]$CacheDirectory,
        [Parameter(Mandatory = $true)][string]$SourceDirectory,
        [Parameter(Mandatory = $true)][string]$Commit,
        [Parameter(Mandatory = $true)][string]$NodeVersion,
        [Parameter(Mandatory = $true)][string]$NpmVersion
    )

    New-Item -ItemType Directory -Force -Path $CacheDirectory | Out-Null
    $cacheFiles = [ordered]@{}
    foreach ($name in @(Get-RequiredArtifactNames)) {
        $sourcePath = Join-Path $SourceDirectory $name
        $hash = (Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256).Hash.ToLowerInvariant()
        Copy-Item -LiteralPath $sourcePath -Destination (Join-Path $CacheDirectory $name) -Force
        $cacheFiles[$name] = [ordered]@{ sha256 = $hash }
    }
    $cacheMetadata = [ordered]@{
        schemaVersion = 1
        commit = $Commit
        scope = $Scope
        nodeVersion = $NodeVersion
        npmVersion = $NpmVersion
        files = $cacheFiles
    } | ConvertTo-Json -Depth 5
    [System.IO.File]::WriteAllText((Join-Path $CacheDirectory 'cache.json'), $cacheMetadata, $utf8NoBom)
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
<html lang="en"><head><meta charset="utf-8"><title>QuizTestDemo test deployment report</title></head>
<body><main><h1>QuizTestDemo test deployment report</h1><p>Result: $safeOutcome</p><p>Build mode: local artifact upload</p><p>Message: $safeMessage</p></main></body></html>
"@
    [System.IO.File]::WriteAllText($reportPath, $html, $utf8NoBom)
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
if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) { throw 'node.exe is required to build test artifacts.' }
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { throw 'npm.cmd is required to build test artifacts.' }

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
$deploymentDocRelative = @(& git -c core.quotePath=false ls-files '*5.3 *.md') | Select-Object -First 1
if (-not $deploymentDocRelative) { throw 'Unable to resolve the tracked test deployment document.' }
$deploymentDoc = Join-Path $repoRoot ($deploymentDocRelative -replace '/', '\')

New-Item -ItemType Directory -Force -Path $artifactDir | Out-Null
[System.IO.File]::WriteAllText($deployLog, '', $utf8NoBom)
$target = "$sshUser@$hostName"

try {
    # Validate the selected server before spending time on local dependency installation and builds.
    Invoke-Checked -Name 'Remote deployment directory creation' -Command { ssh.exe -i $sshKey -o IdentitiesOnly=yes $target "mkdir -p $remoteDir/artifacts" }
    $remoteCreated = $true
    Invoke-Checked -Name 'Remote preflight script upload' -Command {
        scp.exe -i $sshKey -o IdentitiesOnly=yes (Join-Path $skillRoot 'scripts\remote-deploy.sh') "${target}:$remoteDir/"
    }
    $remotePreflight = "DEPLOY_PREFLIGHT_ONLY=true bash $remoteDir/remote-deploy.sh test $Scope $Branch $expectedDatabase"
    Invoke-Checked -Name 'Remote target preflight' -Command { ssh.exe -i $sshKey -o IdentitiesOnly=yes $target $remotePreflight }
    $remoteCommit = (& ssh.exe -i $sshKey -o IdentitiesOnly=yes $target 'cd /opt/quiz/repo && git rev-parse HEAD').Trim()
    if ($LASTEXITCODE -ne 0 -or $remoteCommit -notmatch '^[0-9a-f]{40}$') { throw 'Unable to resolve the test server commit.' }
    & git merge-base --is-ancestor $remoteCommit $commit
    if ($LASTEXITCODE -ne 0) { throw 'Test server commit is not an ancestor of the selected local commit.' }
    Write-DeploymentTiming -Stage 'remote_preflight'

    $nodeVersion = (& node.exe --version).Trim()
    if ($LASTEXITCODE -ne 0) { throw 'Unable to resolve the local Node.js version.' }
    $npmVersion = (& npm.cmd --version).Trim()
    if ($LASTEXITCODE -ne 0) { throw 'Unable to resolve the local npm version.' }
    $builderKey = ("node-{0}_npm-{1}" -f $nodeVersion, $npmVersion) -replace '[^A-Za-z0-9._-]', '_'
    $artifactCacheDir = Join-Path (Join-Path (Join-Path $artifactCacheRoot $commit) $Scope) $builderKey
    $cacheHit = Restore-ArtifactCache `
        -CacheDirectory $artifactCacheDir `
        -DestinationDirectory $artifactDir `
        -Commit $commit `
        -NodeVersion $nodeVersion `
        -NpmVersion $npmVersion

    if ($cacheHit) {
        Write-Output "artifact_cache=hit commit=$commit scope=$Scope"
        Write-DeploymentTiming -Stage 'artifact_cache_restore'
    } else {
        Write-Output "artifact_cache=miss commit=$commit scope=$Scope"
        Invoke-Checked -Name 'Temporary source worktree creation' -Command {
            git -C $repoRoot worktree add --detach $buildWorktree $commit
        }
        $buildWorktreeCreated = $true

        $apiBuildTask = {
            param([string]$SourceRoot)
            $ErrorActionPreference = 'Stop'
            Set-Location (Join-Path $SourceRoot 'api')
            & npm.cmd ci --prefer-offline --no-audit --no-fund
            if ($LASTEXITCODE -ne 0) { throw "Local API dependency install failed with exit code $LASTEXITCODE." }
            & .\node_modules\.bin\prisma.cmd generate --schema prisma\schema.prisma
            if ($LASTEXITCODE -ne 0) { throw "Local Prisma client generation failed with exit code $LASTEXITCODE." }
            & npm.cmd run build
            if ($LASTEXITCODE -ne 0) { throw "Local API build failed with exit code $LASTEXITCODE." }
        }
        $webBuildTask = {
            param([string]$SourceRoot)
            $ErrorActionPreference = 'Stop'
            Set-Location (Join-Path $SourceRoot 'quiz-web')
            & npm.cmd ci --prefer-offline --no-audit --no-fund
            if ($LASTEXITCODE -ne 0) { throw "Local web dependency install failed with exit code $LASTEXITCODE." }
            & npm.cmd run build-only:test
            if ($LASTEXITCODE -ne 0) { throw "Local test web build failed with exit code $LASTEXITCODE." }
        }

        if ($Scope -eq 'all') {
            $buildJobs = @(
                Start-Job -Name 'quiz-api-test-build' -ScriptBlock $apiBuildTask -ArgumentList $buildWorktree
                Start-Job -Name 'quiz-web-test-build' -ScriptBlock $webBuildTask -ArgumentList $buildWorktree
            )
            $buildJobs | Wait-Job | Out-Null
            $failedBuilds = @()
            foreach ($job in $buildJobs) {
                Receive-Job -Job $job -ErrorAction SilentlyContinue | Write-Output
                if ($job.State -ne 'Completed') {
                    $reason = $job.ChildJobs[0].JobStateInfo.Reason.Message
                    $failedBuilds += "$($job.Name): $reason"
                }
            }
            $buildJobs | Remove-Job -Force
            $buildJobs = @()
            if ($failedBuilds.Count -gt 0) { throw "Parallel local builds failed: $($failedBuilds -join '; ')" }
        } elseif ($Scope -eq 'backend') {
            & $apiBuildTask $buildWorktree
        } else {
            & $webBuildTask $buildWorktree
        }
        Write-DeploymentTiming -Stage 'local_build'

        if ($Scope -eq 'backend' -or $Scope -eq 'all') {
            $apiArchive = Join-Path $artifactDir 'api-dist.tar.gz'
            Invoke-Checked -Name 'API artifact packaging' -Command { tar.exe -czf $apiArchive -C (Join-Path $buildWorktree 'api') dist }
        }
        if ($Scope -eq 'frontend' -or $Scope -eq 'all') {
            $webArchive = Join-Path $artifactDir 'web-dist.tar.gz'
            Invoke-Checked -Name 'Web artifact packaging' -Command { tar.exe -czf $webArchive -C (Join-Path $buildWorktree 'quiz-web') dist }
        }
        Save-ArtifactCache `
            -CacheDirectory $artifactCacheDir `
            -SourceDirectory $artifactDir `
            -Commit $commit `
            -NodeVersion $nodeVersion `
            -NpmVersion $npmVersion
        Write-DeploymentTiming -Stage 'artifact_packaging_and_cache'
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
    $manifestJson = $manifest | ConvertTo-Json -Depth 5
    [System.IO.File]::WriteAllText($manifestPath, $manifestJson, $utf8NoBom)

    $bundlePath = Join-Path $localDir 'source.bundle'
    if ($remoteCommit -eq $commit) {
        Invoke-Checked -Name 'Full source bundle packaging' -Command { git bundle create $bundlePath $Branch }
    } else {
        Invoke-Checked -Name 'Incremental source bundle packaging' -Command { git bundle create $bundlePath $Branch "^$remoteCommit" }
    }
    Invoke-Checked -Name 'Source bundle verification' -Command { git bundle verify $bundlePath }

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
    Write-DeploymentTiming -Stage 'bundle_and_upload'

    $remoteDeploy = "DEPLOY_SOURCE_BUNDLE=$remoteDir/source.bundle DEPLOY_EXPECTED_COMMIT=$commit DEPLOY_TEST_ARTIFACT_DIR=$remoteDir/artifacts bash $remoteDir/remote-deploy.sh test $Scope $Branch $expectedDatabase"
    & ssh.exe -i $sshKey -o IdentitiesOnly=yes $target $remoteDeploy 2>&1 | Tee-Object -FilePath $deployLog -Append
    if ($LASTEXITCODE -ne 0) { throw "Remote test deployment failed with exit code $LASTEXITCODE." }
    Write-DeploymentTiming -Stage 'remote_deploy'

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
    Write-DeploymentTiming -Stage 'post_deploy_validation'

    Invoke-Checked -Name 'Deployment report generation' -Command {
        node (Join-Path $skillRoot 'scripts\generate-report.cjs') `
            --environment test `
            --scope $Scope `
            --branch $Branch `
            --result success `
            --deploy-log $deployLog `
            --server-report (Join-Path $localDir 'server-report.log') `
            --public-home (Join-Path $localDir 'public-home.log') `
            --public-health (Join-Path $localDir 'public-health.log') `
            --database-read (Join-Path $localDir 'database-read.log') `
            --request-id-runtime (Join-Path $localDir 'request-id-runtime.log') `
            --deployment-doc $deploymentDoc `
            --output $reportPath
    }
    Write-DeploymentTiming -Stage 'report_generation'
    $result = 'success'
    Write-Output "test_local_artifact_deploy=success scope=$Scope branch=$Branch commit=$commit"
} catch {
    $failure = $_.Exception.Message
    Write-Error $failure
    throw
} finally {
    foreach ($job in @($buildJobs)) {
        if ($job.State -eq 'Running') { Stop-Job -Job $job -ErrorAction SilentlyContinue }
        Remove-Job -Job $job -Force -ErrorAction SilentlyContinue
    }
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
