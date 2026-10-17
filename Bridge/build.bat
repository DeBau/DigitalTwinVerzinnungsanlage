@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
echo ==============================================================
echo   Zwilling-Bridge kompilieren
echo ==============================================================

rem --- C#-Compiler aus dem .NET Framework (ist in Windows enthalten) ---
set CSC=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe
if not exist "%CSC%" (
  echo FEHLER: csc.exe nicht gefunden: %CSC%
  echo Bitte .NET Framework 4.8 installieren.
  pause & exit /b 1
)

rem --- API-DLL von PLCSIM Advanced suchen (oder vorher manuell setzen) ---
if not defined PLCSIMADV_API_DLL (
  for /f "usebackq delims=" %%P in (`powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0find_api.ps1"`) do set PLCSIMADV_API_DLL=%%P
)
if not defined PLCSIMADV_API_DLL (
  echo FEHLER: Siemens.Simatic.Simulation.Runtime.Api.x64.dll nicht gefunden.
  echo Ist S7-PLCSIM Advanced installiert? Pfad sonst manuell setzen, z.B.:
  echo   set PLCSIMADV_API_DLL=C:\Program Files\Common Files\Siemens\PLCSIMADV\API\7.0\Siemens.Simatic.Simulation.Runtime.Api.x64.dll
  pause & exit /b 1
)
echo API-DLL: %PLCSIMADV_API_DLL%

"%CSC%" /nologo /optimize+ /platform:x64 /target:exe /out:ZwillingBridge.exe ^
  /r:"%PLCSIMADV_API_DLL%" /r:System.Web.Extensions.dll ^
  ZwillingBridge.cs
if errorlevel 1 (
  echo.
  echo FEHLER beim Kompilieren - siehe Meldungen oben.
  echo Hinweise zur Fehlersuche: docs\01-inbetriebnahme.md
  pause & exit /b 1
)
echo.
echo Fertig: ZwillingBridge.exe  -^>  jetzt start.bat ausfuehren
pause
