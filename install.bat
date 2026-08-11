@echo off
title Sistema de Horarios UNT - Instalacion Completa
color 0B

echo.
echo ========================================
echo   SISTEMA DE HORARIOS UNT
echo   Instalacion Completa
echo ========================================
echo.
echo Este script instalara y configurara
echo todo el proyecto automaticamente.
echo.
echo Asegurate de tener:
echo   - Node.js instalado
echo   - MySQL corriendo
echo.
pause
echo.

REM Paso 1: Instalar dependencias
echo ========================================
echo [1/6] Instalando dependencias...
echo ========================================
echo.

echo Instalando dependencias del frontend...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo la instalacion del frontend
    pause
    exit /b 1
)

echo.
echo Instalando dependencias del backend...
cd server
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo la instalacion del backend
    pause
    exit /b 1
)
cd ..

echo.
echo [OK] Dependencias instaladas correctamente
echo.
timeout /t 2 /nobreak >nul

REM Paso 2: Crear base de datos
echo ========================================
echo [2/6] Creando base de datos...
echo ========================================
echo.
call install_database.bat
echo.
timeout /t 2 /nobreak >nul

REM Paso 3: Insertar docentes
echo ========================================
echo [3/6] Insertando docentes...
echo ========================================
echo.
call insert_teachers.bat
echo.
timeout /t 2 /nobreak >nul

REM Paso 4: Insertar cursos
echo ========================================
echo [4/6] Insertando cursos...
echo ========================================
echo.
call insert_courses.bat
echo.
timeout /t 2 /nobreak >nul

REM Paso 5: Insertar aulas
echo ========================================
echo [5/6] Insertando aulas...
echo ========================================
echo.
call insert_classrooms.bat
echo.
timeout /t 2 /nobreak >nul

REM Paso 6: Crear usuarios
echo ========================================
echo [6/6] Creando usuarios...
echo ========================================
echo.

echo Creando usuario administrador...
call create_admin.bat
echo.

echo Creando usuarios para docentes...
call create_teacher_users.bat
echo.

REM Resumen final
echo.
echo ========================================
echo   INSTALACION COMPLETADA
echo ========================================
echo.
echo El proyecto esta listo para usar!
echo.
echo Para iniciar el proyecto, ejecuta:
echo   start_project.bat
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
pause
