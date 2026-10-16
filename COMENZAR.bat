@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Para abrir MixLab se necesita Node.js instalado.
  echo Pide ayuda para instalarlo desde https://nodejs.org
  pause
  exit /b 1
)
echo MixLab esta abriendose. Deja esta ventana abierta mientras cantas.
node server.mjs --open
pause
