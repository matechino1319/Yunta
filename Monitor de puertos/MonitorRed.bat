@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Monitor de Red Pro - Mateo Martinez

set "BASE_DIR=%~dp0"
set "PS_SCRIPT=%BASE_DIR%monitor_ui.ps1"

if not exist "%PS_SCRIPT%" (
    echo No se encontro el archivo principal de PowerShell.
    pause
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%"
exit /b %errorlevel%
