@echo off
echo ========================================
echo   INSERTANDO AULAS Y LABORATORIOS
echo ========================================
echo.

cd server
echo Compilando TypeScript...
call npx tsc insert_classrooms.ts --module commonjs --esModuleInterop --resolveJsonModule --skipLibCheck

if %ERRORLEVEL% NEQ 0 (
    echo Error al compilar TypeScript
    pause
    exit /b 1
)

echo.
echo Ejecutando script...
node insert_classrooms.js

if %ERRORLEVEL% NEQ 0 (
    echo Error al ejecutar el script
    pause
    exit /b 1
)

echo.
echo Limpiando archivos temporales...
del insert_classrooms.js 2>nul

echo.
echo ========================================
echo   PROCESO COMPLETADO
echo ========================================
pause
