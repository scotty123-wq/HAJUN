@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  ==========================================
echo    하준이 포켓몬 게임 - 업데이트
echo  ==========================================
echo.
echo  [1/3] 게임 파일 만드는 중...
call node build.js
if errorlevel 1 goto err

echo  [2/3] 바뀐 내용 확인...
git add -A
git diff --cached --quiet
if not errorlevel 1 goto nochange
echo.
echo   바뀐 파일:
git -c core.quotepath=false diff --cached --name-only
echo.
set "MSG=게임 업데이트"
set /p "MSG=  무엇을 바꿨나요? (그냥 엔터 쳐도 됩니다): "
git commit -q -m "%MSG%"
if errorlevel 1 goto err

echo.
echo  [3/3] 깃헙에 올리는 중...
git push -q origin main
if errorlevel 1 goto err

echo.
echo  ==========================================
echo    올렸습니다!
echo.
echo    1~2분 뒤 폰에서 새 버전이 열립니다.
echo    https://scotty123-wq.github.io/HAJUN/
echo.
echo    폰에서는 그냥 아이콘을 누르면 됩니다.
echo    다시 설치할 필요 없습니다.
echo  ==========================================
goto done

:nochange
echo.
echo   바뀐 게 없습니다. 올릴 것이 없어요.
goto done

:err
echo.
echo   [!] 문제가 생겼습니다.
echo       위에 나온 메시지를 그대로 클로드에게 보여주세요.

:done
echo.
pause
