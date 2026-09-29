#!/bin/bash
cd "$(dirname "$0")"
echo "===================================================="
echo " 🚨 Starting AI Incident Triage Assistant..."
echo " 🌐 Dashboard: http://localhost:3000"
echo "===================================================="
node dist/src/server.js
