[Deutsch](01-inbetriebnahme.md) · **English**

# Commissioning

From an empty hard disk to a running twin on the virtual S7-1500, in four steps.
For a first look without a PLC, step 1 is all you need.

[◀ Back to overview](../README.en.md)


## 1. Build the bridge and open the twin (without PLC)

1. Unpack the folder, e.g. to `C:\Zwilling_Zinnbad`.
2. Double-click `Bridge\build.bat`. The script locates the PLCSIM Advanced API DLL and builds `ZwillingBridge.exe`.
3. Double-click `Bridge\start.bat`. The browser opens `http://localhost:8181`.

To just look around without the bridge, double-clicking `web\index.html` is enough. Without a PLC, the twin runs in **Demo without PLC** mode: a step sequence in the browser controls the line, and automatic mode starts by itself.

### Set the browser to the powerful graphics card (important on laptops)

Many laptops have two graphics chips: power-saving integrated graphics (usually Intel) and a powerful graphics card (NVIDIA or AMD).
By default, Windows gives the browser the integrated graphics, and the twin then stutters even at low graphics levels.
Change this once for every browser in which the twin is opened:

| Browser | Program file |
|---|---|
| Google Chrome | `C:\Program Files\Google\Chrome\Application\chrome.exe` |
| Microsoft Edge | `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` |

**Windows 11**

1. Press Windows key + R, type `ms-settings:display-advancedgraphics`, press Enter.
   (Or: Settings → System → Display → at the very bottom **Graphics**.)
2. Under "Custom options for apps", find the browser. If it is missing: **Add an app → Browse** and select the program file from the table.
3. Click the browser and choose **High performance** under "GPU preference" (the NVIDIA or AMD card is shown there).

**Windows 10**

1. Settings → System → Display → at the very bottom **Graphics settings**.
2. Choose "Desktop app", **Browse**, select the program file from the table, **Add**.
3. Click the browser in the list, **Options → High performance → Save**.

Then **close the browser completely** (all windows, including the icon in the notification area at the bottom right) and start it again.

**Check:** In the twin, click **Graphics** at the bottom. The window shows the graphics card the browser is using at the bottom.
With integrated graphics, the note appears in red. Alternatively, `chrome://gpu` or `edge://gpu` shows the "GL_RENDERER" entry.

If the Windows setting has no effect: NVIDIA Control Panel (right-click the desktop) → Manage 3D settings →
Program settings → select the browser → **High-performance NVIDIA processor**. For AMD, do the same in AMD Software under Graphics.



## 2. Prepare the TIA project

1. **Allow simulation:** Project → Properties → *Protection* → *Support simulation during block compilation*.
2. **Hardware:** CPU 1516-3 PN/DP, DI 32x24VDC HF, DQ 32x24VDC/0.5A ST, AI 8xU/I/RTD/TC ST (channel 0/1 at %IW64/%IW66). Other addresses are no problem; just adapt `signale.csv`. For drives on a frequency inverter, add one SINAMICS G120 each with standard telegram 1 (−TA2…−TA5 at I/O 256…271), see [Inverters and technology object](04-signale.en.md#inverters-and-technology-object).
3. **Import tags:** PLC tags → right-click → *Import* → `TIA\PLC_Variablen_Zinnbad.xlsx` (German names) or `TIA\PLC_Tags_Tinning_EN.xlsx` (English names, same addresses). You are free to choose the names in the TIA project, because the bridge couples via the **addresses**. In the English UI, the signal monitor shows the English names.
4. **Write the program.** You define which part of the line your program handles in the sidebar under *Exercise scope*, see [Exercises](05-uebungen.en.md). The model runs the rest itself, so you can start with the step sequence and extend it later.
5. Compile.



## 3. Start PLCSIM Advanced and download

1. Open the *S7-PLCSIM Advanced Control Panel* and set *Online Access* to **PLCSIM**.
2. *Start Virtual S7-1500 PLC*: Instance name **`Zinnbad`** → *Start*.
3. In TIA: *Download to device* → interface **PLCSIM** → select the instance → download → **RUN**.



## 4. Couple and test

1. Start `Bridge\start.bat`. The console shows *Mit PLCSIM-Advanced-Instanz 'Zinnbad' verbunden* (connected to PLCSIM Advanced instance 'Zinnbad').
2. The twin switches automatically to **PLCSIM Advanced** (two green dots).
3. Set −SA1 to AUTO and press **START −SF1**. If a basket is resting against the stop (−BG40) and temperature and fill level are OK, the cycle runs.
4. Test ideas:
   - **E-STOP** while moving → everything stops, −PF5 and the illuminated pushbuttons of the local control stations flash, and the HMI and event log name the pushbutton. Release it, acknowledge at any station, START → the line continues.
   - **STOP** in automatic mode → the current basket is finished, then the line stops. **SINGLE** → one cycle per START.
   - **MANUAL** on the control cabinet door → move cylinders individually and check the interlocks.
   - **Heater off** (or exercise scope tin bath: PLC) → below 250 °C, −BG9 drops out and no new start is possible. Program the controller yourself: two-point, PWM, PID_Compact.
   - Exercise scope conveyor: PLC → program the conveyor with run-on time, the stop and the separator yourself, plus the local control station with key switch and the transfer via the roller curve −MA6 to Conveyor 2.
   - In the signal monitor, **force −BG7 to 0** → the program waits in step 5 (Open bath).
   - **Close the flow control valve** of a cylinder (click the one-way flow control valve in 3D or, in the displacement-time diagram, “Open large”) → longer travel time, or standstill at 0 %; useful for monitoring times. Use the cursors in the diagram to measure the travel times.



## Troubleshooting

| Message / symptom | Cause and remedy |
|---|---|
| `build.bat`: API DLL not found | Set the path: `set PLCSIMADV_API_DLL=C:\Program Files\Common Files\Siemens\PLCSIMADV\API\<Version>\Siemens.Simatic.Simulation.Runtime.Api.x64.dll`, then run `build.bat` in the same window. |
| `build.bat`: compiler error | Usually a different PLCSIM Advanced API version. Report the message and the API version (folder name under `…\PLCSIMADV\API\`) as an [issue](https://github.com/DeBau/DigitalTwinVerzinnungsanlage/issues). |
| Picture stutters, even at low graphics levels | The browser is running on the integrated graphics. See [Set the browser to the powerful graphics card](#set-the-browser-to-the-powerful-graphics-card-important-on-laptops). The **Graphics** button in the twin shows which graphics card is in use. |
| Page stays gray, message “3D view not available” | The browser or graphics driver does not provide WebGL 2. Use a current Chrome, Edge or Firefox, update the graphics driver, and enable hardware acceleration in the browser settings. |
| *PLCSIM Advanced Runtime Manager is not running* | Open the PLCSIM Advanced Control Panel. |
| *Instance 'Zinnbad' not found* | Check the instance name in the Control Panel or adapt it in `start.bat`. |
| Web server does not start | Port in use → change `PORT` in `start.bat`. On “Access denied”, run once as administrator: `netsh http add urlacl url=http://localhost:8181/ user=%USERNAME%` |
| Twin reports “names not found” | Names in `signale.csv` were changed. The names must stay as supplied; only the addresses are free. |
| Line does not move | E-stop latched or not acknowledged (−KF2_NotHalt_OK = 0)? −SA3 set to MANUAL? In the signal monitor, check whether MB1–MB8 arrive and whether the home position (BG2, BG4, BG5, BG8) as well as BG9, BG10 and BG40 are present. |
| Page opened by double-click, but no connection | The bridge must be running (`start.bat`). The page then connects to `localhost:8181` by itself, whether you opened it by double-click or via `http://localhost:8181`. |

[◀ Back to overview](../README.en.md)
