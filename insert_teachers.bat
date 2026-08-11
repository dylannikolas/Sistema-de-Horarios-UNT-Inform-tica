@echo off
echo ========================================
echo   INSERTANDO DOCENTES EN LA BASE DE DATOS
echo ========================================
echo.

cd server
echo Compilando TypeScript...
call npx tsc insert_teachers.ts --module commonjs --esModuleInterop --resolveJsonModule --skipLibCheck

if %ERRORLEVEL% NEQ 0 (
    echo Error al compilar TypeScript
    pause
    exit /b 1
)

echo.
echo Ejecutando script...
node insert_teachers.js

if %ERRORLEVEL% NEQ 0 (
    echo Error al ejecutar el script
    pause
    exit /b 1
)

echo.
echo Limpiando archivos temporales...
del insert_teachers.js 2>nul

echo.
echo ========================================
echo   PROCESO COMPLETADO
echo ========================================
pause
