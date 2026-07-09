@echo off
REM Stops the local MySQL 8.4 instance used by QuizTestDemo development.
powershell -ExecutionPolicy Bypass -File "%~dp0stop-mysql-local.ps1"
