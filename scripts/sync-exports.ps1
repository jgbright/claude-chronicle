<#
.SYNOPSIS
    Keeps a directory of HTML exports in sync with source JSONL session files.

.DESCRIPTION
    Mirrors the .claude/projects/<project>/ directory structure under
    .claude-chronicle/projects/<project>/. By default, derives the project
    folder name from the current working directory using the same encoding
    Claude uses (e.g. D:\repos\claude-chronicle -> D--repos-claude-chronicle).

    For each JSONL file, exports only when:
      - The HTML file doesn't exist yet, or
      - The JSONL file is newer than the existing HTML file

.EXAMPLE
    .\scripts\sync-exports.ps1
    .\scripts\sync-exports.ps1 -Project D--repos-claude-chronicle
    .\scripts\sync-exports.ps1 -Theme copilot
#>
param(
    [string]$Project   = "",
    [string]$Theme     = "claude",
    [string]$Chronicle = ""
)

$ErrorActionPreference = "Stop"

# Derive project folder name from CWD if not provided
if (-not $Project) {
    $cwd = (Get-Location).Path
    # Encode the same way Claude does: D:\repos\foo -> D--repos-foo
    if ($cwd -match '^([A-Za-z]):[/\\](.+)$') {
        $Project = $Matches[1] + "--" + ($Matches[2] -replace '[/\\]', '-')
    } else {
        # Unix-style: /home/user/foo -> -home-user-foo
        $Project = $cwd -replace '[/\\]', '-'
    }
}

$Source = Join-Path $env:USERPROFILE ".claude\projects\$Project"
$Target = Join-Path $env:USERPROFILE ".claude-chronicle\projects\$Project"

# Locate the chronicle binary
if (-not $Chronicle) {
    $repoRoot = Join-Path $PSScriptRoot ".."
    foreach ($candidate in @(
        (Join-Path $repoRoot "claude-chronicle.exe"),
        (Join-Path $repoRoot "chronicle-tmp.exe"),
        (Get-Command "claude-chronicle" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -ErrorAction SilentlyContinue)
    )) {
        if ($candidate -and (Test-Path $candidate)) {
            $Chronicle = Resolve-Path $candidate
            break
        }
    }
}
if (-not $Chronicle) {
    Write-Error "claude-chronicle.exe not found. Build it first: go build -o claude-chronicle.exe ./cmd/chronicle"
    exit 1
}

if (-not (Test-Path $Source)) {
    Write-Error "Source directory not found: $Source"
    exit 1
}

Write-Host "Source:  $Source"
Write-Host "Target:  $Target"
Write-Host ""

if (-not (Test-Path $Target)) {
    New-Item -ItemType Directory -Path $Target -Force | Out-Null
    Write-Host "Created target directory: $Target"
}

$jsonlFiles = Get-ChildItem -Path $Source -Filter "*.jsonl" -File
if ($jsonlFiles.Count -eq 0) {
    Write-Host "No JSONL files found in $Source"
    exit 0
}

$exported = 0
$skipped  = 0

foreach ($jsonl in $jsonlFiles) {
    $htmlPath = Join-Path $Target ($jsonl.BaseName + ".html")

    if (Test-Path $htmlPath) {
        $htmlLastWrite = (Get-Item $htmlPath).LastWriteTime
        if ($jsonl.LastWriteTime -le $htmlLastWrite) {
            Write-Host "  skip    $($jsonl.Name) (up to date)"
            $skipped++
            continue
        }
        Write-Host "  update  $($jsonl.Name)"
    } else {
        Write-Host "  new     $($jsonl.Name)"
    }

    & $Chronicle export -file $jsonl.FullName -theme $Theme -o $htmlPath
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Failed to export $($jsonl.Name)"
    } else {
        $exported++
    }
}

Write-Host ""
Write-Host "Done. $exported exported, $skipped up to date."
