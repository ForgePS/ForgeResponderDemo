@echo off
setlocal
title Forge Responder - Setup Check
cd /d "%~dp0"

echo ==================================================
echo  FORGE RESPONDER - WINDOWS SETUP CHECK
echo ==================================================
echo.

echo [Node]
where node
node -v
echo.

echo [Corepack]
where corepack
corepack --version
echo.

echo [pnpm through Corepack - no admin required]
corepack pnpm --version
echo.

echo [Internet / npm registry]
powershell -NoProfile -Command "try { (Invoke-WebRequest -UseBasicParsing -TimeoutSec 10 https://registry.npmjs.org/pnpm).StatusCode } catch { Write-Host $_.Exception.Message -ForegroundColor Red }"
echo.

echo [Project files]
if exist package.json (echo package.json: OK) else (echo package.json: MISSING)
if exist pnpm-lock.yaml (echo pnpm-lock.yaml: OK) else (echo pnpm-lock.yaml: MISSING)
if exist .env.example (echo .env.example: OK) else (echo .env.example: MISSING)
echo.

echo Check complete.
echo.
pause
endlocal
