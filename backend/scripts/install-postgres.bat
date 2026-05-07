@echo off
echo ========================================
echo   Installation de PostgreSQL
echo ========================================
echo.

echo T?l?chargement de PostgreSQL...
curl -L -o postgres-installer.exe "https://get.enterprisedb.com/postgresql/postgresql-16.0-1-windows-x64.exe"

echo Installation de PostgreSQL...
start /wait postgres-installer.exe --mode unattended --unattendedmodeui minimal --superpassword postgres

echo Suppression de l'installateur...
del postgres-installer.exe

echo.
echo ? PostgreSQL install? avec succ?s !
echo ?? Email: postgres
echo ?? Mot de passe: postgres
echo ?? Port: 5432
echo.

pause
