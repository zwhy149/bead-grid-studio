@echo off
setlocal
if not "%ANNA_NODE_EXECUTABLE%"=="" (
  "%ANNA_NODE_EXECUTABLE%" "%~dp0..\bead_studio_plugin.js" %*
  exit /b %errorlevel%
)
node "%~dp0..\bead_studio_plugin.js" %*
