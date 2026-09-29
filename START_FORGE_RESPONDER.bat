@echo off
setlocal
title Forge Responder - Production Server
cd /d "%~dp0"

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -NoExit -File "%~dp0START_FORGE_RESPONDER.ps1"

echo.
pause
endlocal
