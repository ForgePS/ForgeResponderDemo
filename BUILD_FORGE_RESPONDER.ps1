$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "Forge Responder - Production Build"

$LogFile = Join-Path $PSScriptRoot "forge-build.log"
Start-Transcript -Path $LogFile -Force | Out-Null

function Stop-Build {
    param([string]$Message)
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Red
    Write-Host " BUILD FAILED" -ForegroundColor Red
    Write-Host "==================================================" -ForegroundColor Red
    Write-Host $Message -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Build log:" -ForegroundColor White
    Write-Host $LogFile -ForegroundColor Cyan
    Write-Host ""
    Stop-Transcript | Out-Null
    Read-Host "Press ENTER to close"
    exit 1
}

function Run-Step {
    param([string]$Title,[scriptblock]$Command)

    Write-Host ""
    Write-Host "--------------------------------------------------" -ForegroundColor DarkGray
    Write-Host $Title -ForegroundColor Cyan
    Write-Host "--------------------------------------------------" -ForegroundColor DarkGray

    try {
        & $Command
        if ($LASTEXITCODE -ne 0) {
            Stop-Build "$Title failed with exit code $LASTEXITCODE."
        }
    }
    catch {
        Stop-Build "$Title failed: $($_.Exception.Message)"
    }
}

function Invoke-Pnpm {
    param([Parameter(ValueFromRemainingArguments=$true)][string[]]$PnpmArgs)
    & corepack pnpm @PnpmArgs
    return $LASTEXITCODE
}

Set-Location $PSScriptRoot

Write-Host ""
Write-Host "==================================================" -ForegroundColor Red
Write-Host " FORGE RESPONDER - PRODUCTION BUILD" -ForegroundColor Red
Write-Host "==================================================" -ForegroundColor Red
Write-Host "Working folder: $PSScriptRoot"
Write-Host ""

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Stop-Build "Node.js was not found. Install Node.js 22 LTS and run again."
}
Write-Host "Node version: $(node -v)"

if (-not (Get-Command corepack -ErrorAction SilentlyContinue)) {
    Stop-Build "Corepack was not found. Install Node.js 22 LTS with Corepack."
}
Write-Host "Corepack version: $(corepack --version)"

Run-Step "[1/7] Cleaning legacy files from older Forge builds" {
    node scripts/clean-legacy-booth-files.mjs
}

Run-Step "[2/7] Removing stale Next.js build artifacts" {
    node scripts/clean-generated-build.mjs
}

Run-Step "[3/7] Checking pnpm through Corepack (no admin install)" {
    & corepack pnpm --version
}

Run-Step "[4/7] Installing exact dependencies" {
    & corepack pnpm install --frozen-lockfile
}

Run-Step "[5/7] Running Forge validation suites" {
    & corepack pnpm validate:all
}

Run-Step "[6/7] Running TypeScript typecheck" {
    & corepack pnpm typecheck
}

Run-Step "[7/7] Building Next.js production bundle" {
    & corepack pnpm build
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host " BUILD PASSED" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next: run START_FORGE_RESPONDER.bat" -ForegroundColor Yellow
Write-Host ""
Write-Host "Build log saved to:" -ForegroundColor White
Write-Host $LogFile -ForegroundColor Cyan
Write-Host ""

Stop-Transcript | Out-Null
Read-Host "Press ENTER to close"
