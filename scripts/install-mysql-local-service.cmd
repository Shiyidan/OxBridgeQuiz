@echo off
REM Run this file in an Administrator terminal to register MySQL as a Windows service.
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --install QuizTestDemoMySQL84 --defaults-file="%~dp0..\.mysql\my.ini"
