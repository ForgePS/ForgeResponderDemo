$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "Forge Responder - Production Server"
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "==================================================" -ForegroundColor Red
Write-Host " FORGE RESPONDER - PRODUCTION SERVER" -ForegroundColor Red
Write-Host "==================================================" -ForegroundColor Red
Write-Host ""

if (-not (Test-Path ".next")) {
    Write-Host "Production build was not found." -ForegroundColor Yellow
    Write-Host "Run BUILD_FORGE_RESPONDER.bat first." -ForegroundColor Yellow
    Read-Host "Press ENTER to close"
    exit 1
}

function Test-PortAvailable {
    param([int]$Port)
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
        $listener.Start()
        $listener.Stop()
        return $true
    }
    catch {
        return $false
    }
}

$Port = 4000
while (-not (Test-PortAvailable -Port $Port)) {
    Write-Host "Port $Port is already in use. Trying $($Port + 1)..." -ForegroundColor Yellow
    $Port++
    if ($Port -gt 4010) {
        Write-Host ""
        Write-Host "No free port found between 4000 and 4010." -ForegroundColor Red
        Read-Host "Press ENTER to close"
        exit 1
    }
}

try {
    $env:NODE_ENV = "production"
    $env:PORT = "$Port"

    $BaseUrl = "http://localhost:$Port"

    Write-Host "Starting Forge Responder..." -ForegroundColor Green
    Write-Host ""
    Write-Host "App:       $BaseUrl" -ForegroundColor Cyan
    Write-Host "Readiness: $BaseUrl/en/demo-readiness" -ForegroundColor Cyan
    Write-Host "Demo:      $BaseUrl/en/guided-demo" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Leave this window open while Forge Responder is running." -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to stop the server." -ForegroundColor Yellow
    Write-Host ""

    # Open the guided demo automatically after the server gets a moment to start.
    Start-Job -ScriptBlock {
        param($Url)
        Start-Sleep -Seconds 3
        Start-Process $Url
    } -ArgumentList "$BaseUrl/en/guided-demo" | Out-Null

    & corepack pnpm start

    if ($LASTEXITCODE -ne 0) {
        throw "Production server exited with code $LASTEXITCODE."
    }
}
catch {
    Write-Host ""
    Write-Host "SERVER FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Press ENTER to close"
    exit 1
}
