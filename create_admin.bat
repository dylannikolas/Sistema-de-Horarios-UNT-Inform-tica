@echo off
echo ========================================
echo   CREANDO USUARIO ADMINISTRADOR
echo ========================================
echo.
cd server
npx ts-node create_admin.ts
cd ..
echo.
pause
