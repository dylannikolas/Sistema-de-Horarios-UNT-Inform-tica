@echo off
title Sistema de Horarios UNT - Iniciando...
color 0A

echo.
echo ========================================
echo   SISTEMA DE HORARIOS UNT
echo   Iniciando proyecto completo...
echo ========================================
echo.

REM Verificar que Node.js este instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js no esta instalado.
    echo Por favor instala Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar que las dependencias esten instaladas
if not exist "node_modules" (
    echo [AVISO] Instalando dependencias del frontend...
    call npm install
)

if not exist "server\node_modules" (
    echo [AVISO] Instalando dependencias del backend...
    cd server
    call npm install
    cd ..
)

echo.
echo [1/3] Iniciando servidor backend...
echo.

REM Iniciar el backend en una nueva ventana
start "Backend - Puerto 3001" cmd /k "cd server && npm run dev"

REM Esperar 3 segundos para que el backend inicie
timeout /t 3 /nobreak >nul

echo.
echo [2/3] Iniciando frontend...
echo.

REM Iniciar el frontend en una nueva ventana
start "Frontend - Puerto 5173" cmd /k "npm run dev"

REM Esperar 5 segundos para que el frontend compile
timeout /t 5 /nobreak >nul

echo.
echo [3/3] Abriendo navegador...
echo.

REM Abrir el navegador
start http://localhost:5173

echo.
echo ========================================
echo   PROYECTO INICIADO CORRECTAMENTE
echo ========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Credenciales de Administrador:
echo   Usuario: admin
echo   Password: admin123
echo.
echo Credenciales de Docente (ejemplo):
echo   Usuario: jgutierrez
echo   Password: DOC-01
echo.
echo ========================================
echo.
echo Para detener el proyecto:
echo   - Cierra las ventanas de Backend y Frontend
echo   - O presiona Ctrl+C en cada ventana
echo.
echo ========================================
echo.
pause
