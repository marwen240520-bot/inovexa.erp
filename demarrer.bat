@echo off
title Inovexa ERP - D?marrage
color 0A
echo ========================================
echo    ?? INOVEXA ERP - D?MARRAGE
echo ========================================
echo.
echo ?? ADMIN: marwen2405@gmail.com / 123456
echo ?? CLIENT: client1@test.com / client123
echo.
echo ?? Nettoyage des ports...
npx kill-port 3000 >nul 2>&1
npx kill-port 3001 >nul 2>&1
echo.
echo ?? D?marrage du backend...
start "Backend" cmd /k "cd backend && echo ?? BACKEND INOVEXA && npm run start:dev"
timeout /t 5 /nobreak >nul
echo.
echo ?? D?marrage du frontend...
start "Frontend" cmd /k "cd frontend && echo ?? FRONTEND INOVEXA && npm run dev"
timeout /t 8 /nobreak >nul
echo.
echo ?? Ouverture du navigateur...
start http://localhost:3000/auth/login
echo.
echo ========================================
echo    ? SERVICES D?MARR?S !
echo ========================================
echo    ?? ADMIN: marwen2405@gmail.com / 123456
echo    ?? CLIENT: client1@test.com / client123
echo ========================================
echo.
echo ??  Ne fermez pas les fen?tres !
pause
