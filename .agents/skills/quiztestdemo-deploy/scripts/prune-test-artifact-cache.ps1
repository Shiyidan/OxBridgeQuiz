[CmdletBinding()]
param(
    [string]$CacheRoot,
    [ValidateRange(1, 20)]
    [int]$KeepCommitCount = 5,
    [ValidatePattern('^[0-9a-f]{40}$')]
    [string]$ActiveCommit,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

# Resolve only the versioned test cache owned by this repository before any recursive deletion.
$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\..\..'))
$expectedCacheRoot = [System.IO.Path]::GetFullPath((Join-Path $repoRoot '.private\deployment-cache\test\v1'))
if (-not $CacheRoot) { $CacheRoot = $expectedCacheRoot }
$resolvedCacheRoot = [System.IO.Path]::GetFullPath($CacheRoot)
if (-not $resolvedCacheRoot.Equals($expectedCacheRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Cache cleanup is limited to $expectedCacheRoot"
}
if (-not (Test-Path -LiteralPath $resolvedCacheRoot -PathType Container)) {
    Write-Output "artifact_cache_retention=ok kept=0 removed=0 limit=$KeepCommitCount"
    exit 0
}

# Treat a successfully reused Commit as recent so active retry artifacts remain available.
if ($ActiveCommit) {
    $activePath = Join-Path $resolvedCacheRoot $ActiveCommit
    if ((Test-Path -LiteralPath $activePath -PathType Container) -and -not $DryRun) {
        [System.IO.Directory]::SetLastWriteTimeUtc($activePath, [DateTime]::UtcNow)
    }
}

# Rank Commit directories by their newest artifact timestamp and prune only validated direct children.
$commitDirectories = @(Get-ChildItem -LiteralPath $resolvedCacheRoot -Directory |
    Where-Object { $_.Name -match '^[0-9a-f]{40}$' } |
    ForEach-Object {
        $latestFile = Get-ChildItem -LiteralPath $_.FullName -Recurse -File -ErrorAction SilentlyContinue |
            Sort-Object LastWriteTimeUtc -Descending |
            Select-Object -First 1
        $latestArtifactTime = if ($latestFile) { $latestFile.LastWriteTimeUtc } else { [DateTime]::MinValue }
        [pscustomobject]@{
            Directory = $_
            LastUsed = if ($_.LastWriteTimeUtc -gt $latestArtifactTime) { $_.LastWriteTimeUtc } else { $latestArtifactTime }
        }
    } |
    Sort-Object LastUsed -Descending)

$removeCandidates = @($commitDirectories | Select-Object -Skip $KeepCommitCount)
foreach ($candidate in $removeCandidates) {
    $target = [System.IO.Path]::GetFullPath($candidate.Directory.FullName)
    $parent = [System.IO.Path]::GetFullPath((Split-Path -Parent $target))
    if (
        -not $parent.Equals($resolvedCacheRoot, [System.StringComparison]::OrdinalIgnoreCase) -or
        (Split-Path -Leaf $target) -notmatch '^[0-9a-f]{40}$'
    ) {
        throw "Refusing to remove an unexpected cache path: $target"
    }
    if ($DryRun) {
        Write-Output "artifact_cache_retention_would_remove=$($candidate.Directory.Name)"
    } else {
        Remove-Item -LiteralPath $target -Recurse -Force
    }
}

$removedCount = if ($DryRun) { 0 } else { $removeCandidates.Count }
Write-Output "artifact_cache_retention=ok kept=$([Math]::Min($KeepCommitCount, $commitDirectories.Count)) removed=$removedCount candidates=$($removeCandidates.Count) limit=$KeepCommitCount dry_run=$($DryRun.IsPresent.ToString().ToLowerInvariant())"
