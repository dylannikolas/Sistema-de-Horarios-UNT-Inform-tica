@echo off
echo ============================================
echo INSTALADOR DE BASE DE DATOS
echo Sistema de Gestion de Horarios Academicos
echo ============================================
echo.

REM Configuracion
set DB_USER=root
if "%DB_PASSWORD%"=="" set /p DB_PASSWORD="Ingresa tu contrasena de MySQL (o presiona Enter si no tiene): "
set SCHEMA_FILE=database_complete_schema.sql

echo [1/3] Verificando archivo de schema...
if not exist "%SCHEMA_FILE%" (
    echo ERROR: No se encuentra el archivo %SCHEMA_FILE%
    pause
    exit /b 1
)
echo OK - Archivo encontrado

echo.
echo [2/3] Conectando a MySQL...
echo Usuario: %DB_USER%
echo.

echo [3/3] Ejecutando schema...
echo IMPORTANTE: Se te pedira la contrasena de MySQL
echo.

mysql -u %DB_USER% -p%DB_PASSWORD% < %SCHEMA_FILE%

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo INSTALACION COMPLETADA EXITOSAMENTE
    echo ============================================
    echo.
    echo Base de datos: sistema_horarios
    echo Tablas creadas: 7
    echo Datos de ejemplo: SI
    echo.
    echo Credenciales de prueba:
    echo - Admin: admin / admin123
    echo - Director: director / director123
    echo - Docente: juan.perez / docente123
    echo.
) else (
    echo.
    echo ============================================
    echo ERROR EN LA INSTALACION
    echo ============================================
    echo.
    echo Verifica:
    echo 1. MySQL esta corriendo
    echo 2. Usuario y contrasena son correctos
    echo 3. Tienes permisos suficientes
    echo.
)

pause
