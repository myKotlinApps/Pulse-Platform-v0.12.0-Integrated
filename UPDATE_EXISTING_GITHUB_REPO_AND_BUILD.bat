@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"
title ECU Pulse v0.13 - Update Existing GitHub Repo and Build APK

set "REPO_FULL=myKotlinApps/ECU-Pulse-Platform-v0.12.0-Full-Integrated"
set "WORKFLOW_FILE=android-apk.yml"
set "BRANCH=main"
set "OUTPUT_DIR=%CD%\GitHub_APK_Artifacts"
set "TEMP_REPO=%TEMP%\ECU_Pulse_v013_push_%RANDOM%%RANDOM%"

echo ============================================================
echo ECU Pulse v0.13 - Update existing GitHub repo + Build APK
echo Repository: %REPO_FULL%
echo ============================================================
echo.

call :ensure_command git "Git.Git" "C:\Program Files\Git\cmd"
if errorlevel 1 goto :failed
call :ensure_command gh "GitHub.cli" "C:\Program Files\GitHub CLI"
if errorlevel 1 goto :failed

gh auth status -h github.com >nul 2>&1
if errorlevel 1 (
  gh auth login -h github.com -p https -w
  if errorlevel 1 goto :failed
)
gh auth setup-git >nul 2>&1

if exist "%TEMP_REPO%" rmdir /s /q "%TEMP_REPO%"
echo Cloning existing repository...
gh repo clone "%REPO_FULL%" "%TEMP_REPO%"
if errorlevel 1 goto :failed

rem Mirror the current v0.13 project into the clone while preserving .git.
echo Copying v0.13 project files...
robocopy "%CD%" "%TEMP_REPO%" /MIR /R:2 /W:2 /XD ".git" "GitHub_APK_Artifacts" /XF "*.sha256" >nul
set "RC=!ERRORLEVEL!"
if !RC! GEQ 8 (
  echo Robocopy failed with code !RC!.
  goto :failed
)

pushd "%TEMP_REPO%"
git config user.name "myKotlinApps"
git config user.email "myKotlinApps@users.noreply.github.com"
git branch -M %BRANCH%
git add -A
git diff --cached --quiet
if errorlevel 1 (
  git commit -m "ECU Pulse v0.13.0 - integrate vehicle logo PNG pack"
  if errorlevel 1 goto :failed_popd
) else (
  echo No changed files were detected; triggering a fresh build.
)

git push origin %BRANCH%
if errorlevel 1 goto :failed_popd
for /f "delims=" %%S in ('git rev-parse HEAD') do set "COMMIT_SHA=%%S"
popd

echo Waiting for GitHub Actions run...
set "RUN_ID="
for /L %%I in (1,1,90) do (
  for /f "delims=" %%R in ('gh run list -R "%REPO_FULL%" --workflow "%WORKFLOW_FILE%" --branch %BRANCH% --commit "!COMMIT_SHA!" --limit 1 --json databaseId --jq ".[0].databaseId" 2^>nul') do set "RUN_ID=%%R"
  if defined RUN_ID goto :run_found
  timeout /t 4 /nobreak >nul
)

echo No automatic workflow run found; dispatching one now...
gh workflow run "%WORKFLOW_FILE%" -R "%REPO_FULL%" --ref %BRANCH%
if errorlevel 1 goto :failed
for /L %%I in (1,1,60) do (
  for /f "delims=" %%R in ('gh run list -R "%REPO_FULL%" --workflow "%WORKFLOW_FILE%" --branch %BRANCH% --limit 1 --json databaseId --jq ".[0].databaseId" 2^>nul') do set "RUN_ID=%%R"
  if defined RUN_ID goto :run_found
  timeout /t 4 /nobreak >nul
)
goto :failed

:run_found
echo Workflow run ID: !RUN_ID!
gh run watch !RUN_ID! -R "%REPO_FULL%" --exit-status
if errorlevel 1 (
  echo Build failed; opening workflow log...
  gh run view !RUN_ID! -R "%REPO_FULL%" --web
  goto :failed
)

if exist "%OUTPUT_DIR%" rmdir /s /q "%OUTPUT_DIR%"
mkdir "%OUTPUT_DIR%"
gh run download !RUN_ID! -R "%REPO_FULL%" -D "%OUTPUT_DIR%"
if errorlevel 1 goto :failed

if exist "%TEMP_REPO%" rmdir /s /q "%TEMP_REPO%"
echo.
echo ============================================================
echo SUCCESS - APK files downloaded to:
echo %OUTPUT_DIR%
echo ============================================================
start "" "%OUTPUT_DIR%"
pause
exit /b 0

:failed_popd
popd
:failed
if exist "%TEMP_REPO%" rmdir /s /q "%TEMP_REPO%"
echo.
echo ============================================================
echo FAILED - read the error above.
echo ============================================================
pause
exit /b 1

:ensure_command
where %~1 >nul 2>&1
if not errorlevel 1 exit /b 0
if exist "%~3\%~1.exe" (
  set "PATH=%PATH%;%~3"
  where %~1 >nul 2>&1
  if not errorlevel 1 exit /b 0
)
where winget >nul 2>&1
if errorlevel 1 exit /b 1
winget install --id %~2 --exact --source winget --accept-package-agreements --accept-source-agreements
if errorlevel 1 exit /b 1
set "PATH=%PATH%;%~3"
where %~1 >nul 2>&1
if errorlevel 1 exit /b 1
exit /b 0
