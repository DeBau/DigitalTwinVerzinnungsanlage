@echo off
chcp 65001 >nul
cd /d "%~dp0"
rem Name der Instanz im PLCSIM-Advanced-Control-Panel und Port des Webservers
set INSTANZ=Zinnbad
set PORT=8181
rem Mindestzykluszeit der virtuellen CPU in ms. Steht sie im TIA-Projekt hoch
rem (Standard dort oft 100 ms), liest die CPU die Eingaenge nur zehnmal je
rem Sekunde - das sind allein schon bis zu 200 ms vom Knopfdruck bis zur
rem Reaktion. 10 ms ist fuer die Uebung ein guter Wert.
rem 0 = Wert aus dem TIA-Projekt unveraendert lassen.
set ZYKLUS=10

if not exist ZwillingBridge.exe (
  echo ZwillingBridge.exe fehlt - bitte zuerst build.bat ausfuehren.
  pause & exit /b 1
)
ZwillingBridge.exe %INSTANZ% %PORT% %ZYKLUS%
pause
