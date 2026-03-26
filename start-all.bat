@echo off
title INOVEXA-AI - DMARRAGE COMPLET
echo ============================================================
echo    INOVEXA-AI ERP - DMARRAGE COMPLET
echo ============================================================
cd /d C:\inovexa-erp
echo [1/4] V‚rification de PostgreSQL...
docker ps | findstr inovexa-postgres > nul
if %0% equ 0 (
    echo    ? PostgreSQL est d‚j… en cours d'ex‚cution
) else (
    echo    ??  D‚marrage de PostgreSQL...
    docker-compose up -d
    timeout /t 10 /nobreak > nul
)

echo [2/4] D‚marrage du BACKEND...
start "Inovexa-Backend" cmd /k "cd C:\inovexa-erp\backend ^&^& npm run start:dev"

echo [3/4] D‚marrage du FRONTEND...
start "Inovexa-Frontend" cmd /k "cd C:\inovexa-erp\frontend ^&^& npm run dev"

echo [4/4] Ouverture des navigateurs...
timeout /t 5 /nobreak > nul
start http://localhost:3002/api
start http://localhost:3000

echo ============================================================
echo    ? BACKEND : http://localhost:3002
echo    ? FRONTEND: http://localhost:3000
echo ============================================================
pause
