@echo off
echo ========================================
echo     ?? BACKUP INOVEXA ERP
echo ========================================
echo.

set BACKUP_DIR=C:\inovexa-erp\backup
set DATE=%DATE:~6,4%%DATE:~3,2%%DATE:~0,2%
set TIME=%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%
set TIMESTAMP=%DATE%_%TIME%

echo ?? Cr?ation du dossier de backup...
mkdir "%BACKUP_DIR%\%TIMESTAMP%" 2>nul

echo ??? Backup de la base de donn?es...
pg_dump -U postgres -d inovexa_erp > "%BACKUP_DIR%\%TIMESTAMP%\inovexa_backup.sql"

echo ?? Backup des fichiers de configuration...
xcopy "C:\inovexa-erp\backend\.env" "%BACKUP_DIR%\%TIMESTAMP%\" /Y
xcopy "C:\inovexa-erp\frontend\.env.local" "%BACKUP_DIR%\%TIMESTAMP%\" /Y

echo ? Backup termin? !
echo ?? Dossier: %BACKUP_DIR%\%TIMESTAMP%
pause
