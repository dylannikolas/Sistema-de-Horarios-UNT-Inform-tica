@echo off
echo ============================================
echo IMPORTADOR DE BASE DE DATOS
echo Sistema de Gestion de Horarios Academicos
echo ============================================
echo.

REM Configuracion
set DB_USER=root
if "%DB_PASSWORD%"=="" set /p DB_PASSWORD="Ingresa tu contrasena de MySQL (o presiona Enter si no tiene): "

echo Archivos SQL disponibles:
echo.
dir /b *.sql
echo.

set /p IMPORT_FILE="Ingresa el nombre del archivo SQL a importar: "

if not exist "%IMPORT_FILE%" (
    echo.
    echo ERROR: El archivo %IMPORT_FILE% no existe
    pause
    exit /b 1
)

echo.
echo [1/2] Archivo seleccionado: %IMPORT_FILE%
echo.

echo [2/2] Importando base de datos...
echo IMPORTANTE: Se te pedira la contrasena de MySQL
echo ADVERTENCIA: Esto puede sobrescribir datos existentes
echo.

set /p CONFIRM="Estas seguro de continuar? (S/N): "
if /i not "%CONFIRM%"=="S" (
    echo Operacion cancelada
    pause
    exit /b 0
)

mysql -u %DB_USER% -p%DB_PASSWORD% < %IMPORT_FILE%

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo IMPORTACION COMPLETADA EXITOSAMENTE
    echo ============================================
    echo.
) else (
    echo.
    echo ============================================
    echo ERROR EN LA IMPORTACION
    echo ============================================
    echo.
)

pause
