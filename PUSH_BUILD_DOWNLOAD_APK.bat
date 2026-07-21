@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"
title ECU Pulse - Push, Build and Download APK

set "WORKFLOW_FILE=android-apk.yml"
set "OUTPUT_DIR=%CD%\GitHub_APK_Artifacts"
set "BRANCH=main"

echo ============================================================
echo   ECU Pulse - GitHub Push + Android Build + APK Download
echo ============================================================
echo.

call :ensure_command git "Git.Git" "C:\Program Files\Git\cmd"
if errorlevel 1 goto :failed
call :ensure_command gh "GitHub.cli" "C:\Program Files\GitHub CLI"
if errorlevel 1 goto :failed

rem Authenticate once. Later runs reuse the saved login.
gh auth status -h github.com >nul 2>&1
if errorlevel 1 (
    echo GitHub login is required once. A browser window will open.
    gh auth login -h github.com -p https -w
    if errorlevel 1 goto :failed
)

gh auth setup-git >nul 2>&1

for /f "delims=" %%U in ('gh api user --jq .login 2^>nul') do set "GH_USER=%%U"
if not defined GH_USER (
    echo Could not read the authenticated GitHub username.
    goto :failed
)

if not exist ".git" (
    echo Initializing Git repository...
    git init
    if errorlevel 1 goto :failed
)

git branch -M %BRANCH% >nul 2>&1

for /f "delims=" %%N in ('git config --get user.name 2^>nul') do set "GIT_NAME=%%N"
if not defined GIT_NAME git config user.name "%GH_USER%"
for /f "delims=" %%E in ('git config --get user.email 2^>nul') do set "GIT_EMAIL=%%E"
if not defined GIT_EMAIL git config user.email "%GH_USER%@users.noreply.github.com"

rem Ensure CI files are included before the first commit.
if not exist ".github\workflows\%WORKFLOW_FILE%" (
    echo ERROR: .github\workflows\%WORKFLOW_FILE% was not found.
    goto :failed
)

rem Create a private repository automatically on first run.
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    for %%I in ("%CD%") do set "DEFAULT_REPO=%%~nxI"
    set "REPO_NAME="
    set /p "REPO_NAME=GitHub repository name [!DEFAULT_REPO!]: "
    if not defined REPO_NAME set "REPO_NAME=!DEFAULT_REPO!"

    set "VISIBILITY=private"
    set /p "VISIBILITY=Visibility private/public [private]: "
    if /I not "!VISIBILITY!"=="public" set "VISIBILITY=private"

    echo Creating GitHub repository !GH_USER!/!REPO_NAME!...
    if /I "!VISIBILITY!"=="public" (
        gh repo create "!REPO_NAME!" --public --source "." --remote origin
    ) else (
        gh repo create "!REPO_NAME!" --private --source "." --remote origin
    )
    if errorlevel 1 (
        echo Repository creation failed. It may already exist.
        set "REMOTE_URL=https://github.com/!GH_USER!/!REPO_NAME!.git"
        git remote add origin "!REMOTE_URL!" 2>nul
        if errorlevel 1 goto :failed
    )
)

for /f "delims=" %%R in ('git remote get-url origin') do set "REMOTE_URL=%%R"
echo Remote: !REMOTE_URL!

rem Stage and commit all current changes.
git add -A
if errorlevel 1 goto :failed

git diff --cached --quiet
if errorlevel 1 (
    for /f "delims=" %%T in ('powershell -NoProfile -Command "Get-Date -Format ''yyyy-MM-dd HH:mm:ss''"') do set "NOW=%%T"
    set "COMMIT_MSG="
    set /p "COMMIT_MSG=Commit message [ECU Pulse update !NOW!]: "
    if not defined COMMIT_MSG set "COMMIT_MSG=ECU Pulse update !NOW!"
    git commit -m "!COMMIT_MSG!"
    if errorlevel 1 goto :failed
    set "HAS_NEW_COMMIT=1"
) else (
    echo No changed files to commit.
    set "HAS_NEW_COMMIT=0"
)

rem Rebase only when the remote branch already exists.
git ls-remote --exit-code --heads origin %BRANCH% >nul 2>&1
if not errorlevel 1 (
    echo Updating local branch from GitHub...
    git pull --rebase origin %BRANCH%
    if errorlevel 1 (
        echo Rebase failed. Resolve the Git conflict, then run this file again.
        goto :failed
    )
)

echo Pushing to GitHub...
git push -u origin %BRANCH%
if errorlevel 1 goto :failed

for /f "delims=" %%S in ('git rev-parse HEAD') do set "COMMIT_SHA=%%S"

rem If nothing changed, explicitly dispatch a new build.
if "!HAS_NEW_COMMIT!"=="0" (
    echo Triggering a fresh GitHub Actions build...
    gh workflow run "%WORKFLOW_FILE%" --ref %BRANCH%
    if errorlevel 1 goto :failed
)

echo Waiting for the GitHub Actions run to appear...
set "RUN_ID="
for /L %%I in (1,1,90) do (
    for /f "delims=" %%R in ('gh run list --workflow "%WORKFLOW_FILE%" --branch %BRANCH% --commit "!COMMIT_SHA!" --limit 1 --json databaseId --jq ".[0].databaseId" 2^>nul') do set "RUN_ID=%%R"
    if defined RUN_ID goto :run_found
    timeout /t 4 /nobreak >nul
)

echo The workflow did not appear automatically.
echo Open the Actions page to inspect it manually.
gh browse actions
exit /b 1

:run_found
echo Workflow run ID: !RUN_ID!
echo Watching Android build...
gh run watch !RUN_ID! --exit-status
if errorlevel 1 (
    echo Build failed. Opening the workflow log...
    gh run view !RUN_ID! --web
    goto :failed
)

if exist "%OUTPUT_DIR%" rmdir /s /q "%OUTPUT_DIR%"
mkdir "%OUTPUT_DIR%"

echo Downloading all APK artifacts...
gh run download !RUN_ID! -D "%OUTPUT_DIR%"
if errorlevel 1 goto :failed

for /f "delims=" %%L in ('gh run view !RUN_ID! --json url --jq .url 2^>nul') do set "RUN_URL=%%L"
echo.
echo ============================================================
echo SUCCESS
echo APK artifacts: %OUTPUT_DIR%
if defined RUN_URL echo Workflow: !RUN_URL!
echo ============================================================
start "" "%OUTPUT_DIR%"
pause
exit /b 0

:ensure_command
where %~1 >nul 2>&1
if not errorlevel 1 exit /b 0

if exist "%~3\%~1.exe" (
    set "PATH=%PATH%;%~3"
    where %~1 >nul 2>&1
    if not errorlevel 1 exit /b 0
)

where winget >nul 2>&1
if errorlevel 1 (
    echo ERROR: %~1 is not installed and winget is unavailable.
    echo Install it manually, then run this file again.
    exit /b 1
)

echo Installing %~2 with winget...
winget install --id %~2 --exact --source winget --accept-package-agreements --accept-source-agreements
if errorlevel 1 exit /b 1
set "PATH=%PATH%;%~3"
where %~1 >nul 2>&1
if errorlevel 1 (
    echo Installation completed, but Windows has not refreshed PATH yet.
    echo Close this window and run the BAT file again.
    exit /b 1
)
exit /b 0

:failed
echo.
echo ============================================================
echo FAILED - read the error above.
echo ============================================================
pause
exit /b 1
