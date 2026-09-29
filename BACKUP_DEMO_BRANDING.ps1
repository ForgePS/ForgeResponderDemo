$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$source = Join-Path $PSScriptRoot "demo-persistence"

if (-not (Test-Path $source)) {
    Write-Host ""
    Write-Host "No demo branding has been saved yet." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press ENTER to close"
    exit 0
}

$backupRoot = Join-Path $PSScriptRoot "demo-branding-backups"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$destination = Join-Path $backupRoot $stamp

New-Item -ItemType Directory -Force -Path $destination | Out-Null
Copy-Item -Path "$source\*" -Destination $destination -Recurse -Force

Write-Host ""
Write-Host "Forge Responder demo branding backed up to:" -ForegroundColor Green
Write-Host $destination -ForegroundColor Cyan
Write-Host ""
Read-Host "Press ENTER to close"
