@echo off
setlocal
title Forge Responder - Production Build
cd /d "%~dp0"

echo.
echo ==================================================
echo  FORGE RESPONDER - PRODUCTION BUILD
echo ==================================================
echo.
echo This window will remain open when the build finishes
echo or if an error occurs.
echo.

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0BUILD_FORGE_RESPONDER.ps1"

echo.
echo ==================================================
echo  BUILD PROCESS ENDED
echo ==================================================
echo.
echo If the build failed, open:
echo   %~dp0forge-build.log
echo.
pause
endlocal
