@echo off
setlocal
if "%EXECUTA_HOME%"=="" set "EXECUTA_HOME=%~dp0.."
if not "%ANNA_NODE_EXECUTABLE%"=="" (
  "%ANNA_NODE_EXECUTABLE%" "%EXECUTA_HOME%\bead_studio_plugin.js" %*
  exit /b %errorlevel%
)
node "%EXECUTA_HOME%\bead_studio_plugin.js" %*
