@echo off
title Sistema de Horarios UNT (SHARPEI + EPI Solver) - Iniciando...
color 0A

echo.
echo ========================================================
echo   SISTEMA DE HORARIOS UNT - ESCUELA DE INFORMATICA
echo   SHARPEI + EPI Scheduler (CP-SAT OR-Tools)
echo ========================================================
echo.

REM Verificar que Node.js este instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js no esta instalado.
    echo Por favor instala Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)

REM Configurar server\.env si no existe
if not exist "server\.env" (
    echo [CONFIGURACION INICIAL DE MYSQL]
    set /p MYSQL_PASS="Ingresa la contrasena de tu usuario root de MySQL (deja vacio si no tiene): "
    (
        echo DB_HOST=localhost
        echo DB_USER=root
        echo DB_PASSWORD=%MYSQL_PASS%
        echo DB_NAME=sistema_horarios
        echo PORT=3001
        echo JWT_SECRET=secret-key-change-me
        echo SOLVER_URL=http://localhost:5000
    ) > "server\.env"
    echo [OK] Archivo server\.env creado.
    echo.
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
echo [1/4] Iniciando microservicio CP-SAT Solver (Python FastAPI - Puerto 5000)...
start "Solver CP-SAT - Puerto 5000" cmd /k "cd solver_service && python -m uvicorn main:app --port 5000"

timeout /t 2 /nobreak >nul

echo.
echo [2/4] Iniciando servidor backend Node/Express (Puerto 3001)...
start "Backend - Puerto 3001" cmd /k "cd server && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo [3/4] Iniciando frontend React/Vite (Puerto 5173)...
start "Frontend - Puerto 5173" cmd /k "npm run dev"

timeout /t 4 /nobreak >nul

echo.
echo [4/4] Abriendo navegador...
start http://localhost:5173

echo.
echo ========================================================
echo   PROYECTO INICIADO CORRECTAMENTE
echo ========================================================
echo.
echo Solver CP-SAT: http://localhost:5000/health
echo Backend API:   http://localhost:3001
echo Frontend Web:  http://localhost:5173
echo.
echo Credenciales de Director:
echo   Usuario:  director   (Password: director123)
echo   Usuario:  admin      (Password: admin123)
echo.
echo Credenciales de Docente (ejemplo):
echo   Usuario:  jgutierrez (Password: DOC-01)
echo.
echo ========================================================
echo.
pause
