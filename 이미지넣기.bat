@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  sprites 폴더의 이미지를 게임에 넣고 있습니다...
node build.js
if errorlevel 1 (
  echo.
  echo  [!] node 가 설치되어 있지 않습니다. https://nodejs.org 에서 받으세요.
)
pause
