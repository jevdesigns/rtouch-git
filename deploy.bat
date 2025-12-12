@echo off
setlocal
echo ========================================
echo  Deploying RTOUCH Beta 2...
echo ========================================

REM Build frontend bundle
cd client
call npm run build
if %errorlevel% neq 0 exit /b %errorlevel%
cd ..

REM Destination path (override by passing destination as first arg)
set DEST=Z:\addons\local\rtouch\client\build
if not "%1"=="" set DEST=%1

REM Ensure build artifacts exist
if not exist "client\build\index.html" (
	echo Build output missing at client\build. Aborting.
	exit /b 1
)

REM Ensure destination exists
if not exist "%DEST%" (
	echo Creating destination %DEST%
	mkdir "%DEST%" >nul 2>&1
)

echo Copying files to %DEST% ...
REM Robocopy returns 0-7 for success/warnings; treat >=8 as failure
robocopy "client\build" "%DEST%" /MIR /Z /W:1 /R:2 /NFL /NDL /NP
set RC=%ERRORLEVEL%
if %RC% GEQ 8 (
	echo Deploy failed with code %RC%.
	exit /b %RC%
)

echo Checking deployed files integrity...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\verify_deploy.ps1" "client\build" "%DEST%"
set RC2=%ERRORLEVEL%
if %RC2% NEQ 0 (
	echo Verification failed with code %RC2%.
	exit /b %RC2%
)

echo All files copied and verified. Watcher will reload the UI.
endlocal
