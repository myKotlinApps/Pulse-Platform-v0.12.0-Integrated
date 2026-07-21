@echo off
setlocal
set "ROOT=%~dp0"
set "VER=9.5.0"
set "BOOT=%ROOT%.gradle-bootstrap"
set "GRADLE=%BOOT%\gradle-%VER%\bin\gradle.bat"
if not exist "%GRADLE%" (
  echo Downloading Gradle %VER% for the first build...
  if not exist "%BOOT%" mkdir "%BOOT%"
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $zip='%BOOT%\gradle-%VER%-bin.zip'; Invoke-WebRequest 'https://services.gradle.org/distributions/gradle-%VER%-bin.zip' -OutFile $zip; Expand-Archive -Force $zip '%BOOT%'; Remove-Item $zip"
  if errorlevel 1 exit /b 1
)
call "%GRADLE%" %*
exit /b %ERRORLEVEL%
