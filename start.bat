@echo off
title INOVEXA ERP - D?marrage

echo.
echo ========================================
echo     ?? INOVEXA ERP - D?MARRAGE RAPIDE
echo ========================================
echo.

echo ?? V?rification des d?pendances...
cd backend
if not exist "node_modules" (
    echo Installation des d?pendances backend...
    call npm install
)
cd ..

cd frontend
if not exist "node_modules" (
    echo Installation des d?pendances frontend...
    call npm install
)
cd ..

echo.
echo ?? D?marrage du backend (port 3001)...
start "Backend INOVEXA" cmd /k "cd backend && npm run start:dev"

timeout /t 5 /nobreak >nul

echo ?? D?marrage du frontend (port 3000)...
start "Frontend INOVEXA" cmd /k "cd frontend && npm run dev"

timeout /t 8 /nobreak >nul

echo ?? Ouverture du navigateur...
start http://localhost:3000

echo.
echo ========================================
echo ? Application d?marr?e avec succ?s !
echo ========================================
echo.
echo ?? Frontend : http://localhost:3000
echo ?? Backend  : http://localhost:3001
echo.
echo ?? ADMIN : marwen2405@gmail.com / 123456
echo ?? CLIENT : S'inscrire via /auth/register
echo.
echo ========================================
echo.
pause
