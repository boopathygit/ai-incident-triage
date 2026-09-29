@echo off
title AI Incident Triage Assistant
cd /d "%~dp0"
echo ====================================================
echo  🚨 Starting AI Incident Triage Assistant...
echo  🌐 Dashboard: http://localhost:3000
echo ====================================================
start http://localhost:3000
node dist/src/server.js
pause

