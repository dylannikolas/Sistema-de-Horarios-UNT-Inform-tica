@echo off
REM Sube todos los cambios locales a GitHub (commit + push). Doble clic o ejecutar desde la carpeta del proyecto.
cd /d "%~dp0.."
set /p MSG=Describe el cambio (Enter = "Actualizacion"): 
if "%MSG%"=="" set MSG=Actualizacion
git add -A
git commit -m "%MSG%"
git pull --rebase origin main
git push -u origin main
echo.
echo Listo. Revisa tu repositorio en GitHub.
pause
