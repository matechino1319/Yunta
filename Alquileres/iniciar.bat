@echo off
cd /d "%~dp0"
start "" http://localhost:666
python server.py
pause
