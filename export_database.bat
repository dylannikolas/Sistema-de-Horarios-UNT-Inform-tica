@echo off
echo ============================================
echo EXPORTADOR DE BASE DE DATOS
echo Sistema de Gestion de Horarios Academicos
echo ============================================
echo.

REM Configuracion
set DB_USER=root
if "%DB_PASSWORD%"=="" set /p DB_PASSWORD="Ingresa tu contrasena de MySQL (o presiona Enter si no tiene): "
set DB_NAME=sistema_horarios
set BACKUP_FILE=backup_sistema_horarios_%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%.sql
set BACKUP_FILE=%BACKUP_FILE: =0%

echo [1/2] Preparando exportacion...
echo Base de datos: %DB_NAME%
echo Archivo destino: %BACKUP_FILE%
echo.

echo [2/2] Exportando base de datos...
echo IMPORTANTE: Se te pedira la contrasena de MySQL
echo.

mysqldump -u %DB_USER% -p%DB_PASSWORD% --databases %DB_NAME% --add-drop-database --complete-insert --routines --triggers > %BACKUP_FILE%

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo EXPORTACION COMPLETADA EXITOSAMENTE
    echo ============================================
    echo.
    echo Archivo creado: %BACKUP_FILE%
    echo.
    echo Este archivo contiene:
    echo - Estructura completa de la base de datos
    echo - Todos los datos actuales
    echo - Procedimientos almacenados
    echo - Triggers
    echo.
    echo Puedes usar este archivo para:
    echo 1. Restaurar la base de datos
    echo 2. Migrar a otro servidor
    echo 3. Hacer backup de seguridad
    echo.
) else (
    echo.
    echo ============================================
    echo ERROR EN LA EXPORTACION
    echo ============================================
    echo.
)

pause
