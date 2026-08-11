@echo off
echo ========================================
echo   INSERTANDO CURSOS EN LA BASE DE DATOS
echo ========================================
echo.

cd server
echo Compilando TypeScript...
call npx tsc insert_courses.ts --module commonjs --esModuleInterop --resolveJsonModule --skipLibCheck

if %ERRORLEVEL% NEQ 0 (
    echo Error al compilar TypeScript
    pause
    exit /b 1
)

echo.
echo Ejecutando script...
node insert_courses.js

if %ERRORLEVEL% NEQ 0 (
    echo Error al ejecutar el script
    pause
    exit /b 1
)

echo.
echo Limpiando archivos temporales...
del insert_courses.js 2>nul

echo.
echo ========================================
echo   PROCESO COMPLETADO
echo ========================================
pause
