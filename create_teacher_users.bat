@echo off
echo ========================================
echo   CREANDO USUARIOS PARA DOCENTES
echo ========================================
echo.
echo Este script creara un usuario para cada docente
echo en la base de datos.
echo.
echo Usuario: email del docente (sin @dominio)
echo Contraseña temporal: codigo del docente
echo.
pause
echo.
cd server
npx ts-node create_teacher_users.ts
cd ..
echo.
pause
