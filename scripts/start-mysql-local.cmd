@echo off
REM Runs the local MySQL 8.4 instance used by QuizTestDemo development in this console.
set REPO_ROOT=%~dp0..
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --defaults-file="%REPO_ROOT%\.mysql\my.ini" --console
