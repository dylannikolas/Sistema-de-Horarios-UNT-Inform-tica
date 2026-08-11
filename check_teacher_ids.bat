@echo off
echo ========================================
echo   VERIFICANDO IDs DE DOCENTES
echo ========================================
echo.
cd server
npx ts-node check_teacher_ids.ts
cd ..
pause
