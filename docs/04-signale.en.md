[Deutsch](04-signale.md) · **English**

# Signals and TIA Connection

The twin knows **186 signals**: 121 inputs (including 6 analog values and 8 telegram words) and
65 outputs (including 1 analog value and 8 telegram words). They are the
only interface between your program and the model: no proprietary protocol, no
block library, no license file.

[◀ Back to overview](../README.en.md)

![Signal monitor](bilder/08-signalmonitor.jpg)

## One file, one source of truth: `signale.csv`

```
Name;Adresse;Kommentar
SF1_Start;%I0.0;Taster START (Schliesser)
MB1_Einhaengen;%Q0.0;Einhaengezylinder -MM1: Korb einhaengen
BT1_Temperatur;%IW64;Zinntemperatur analog 0...27648 = 0...400 Grad C
```

- **Names stay as supplied.** The twin identifies each signal by its name in this
  file. This applies only to `signale.csv`: you are free to name the tags in your TIA project as you like,
  because the bridge writes and reads the PLC via the addresses.
- **Addresses are free.** If the addresses do not match your hardware configuration, you only change
  the middle column. Neither the bridge nor the browser has to be rebuilt.
- **Editing in Excel works:** No comment starts with `-`, `+`, `=` or `@` (Excel would read it
  as a formula and turn it into `#NAME?`), and no comment contains a semicolon. In your own
  comments, therefore, place the device tag after the term ("Tauchzylinder -MM2: senken", i.e. "dip cylinder -MM2: lower").
  Save as *CSV (Comma delimited)*, without umlauts.
- The bridge reads the file at startup and sends the list to the browser. If the twin cannot find
  an expected name, it reports this in the event log instead of silently running incorrectly.

## Address assignment

| Area | Addresses | Content |
|---|---|---|
| Digital inputs | `%I0.0 … %I11.7` | End positions, light barriers, pushbuttons, selector and key switches, motor protection auxiliary contacts, E-stop signaling contacts, safety relay feedback |
| Thumbwheel switch −SF48 | `%I12.0 … %I13.7` (word `%IW12`) | Dip time 000…999 s in BCD, contacts 8-4-2-1 per decade; 4th module DI 32x24VDC HF from `%I12.0`, configure it in TIA with start address 12 |
| Digital outputs | `%Q0.0 … %Q5.4` | Solenoid coils, reversing contactors, heating, pump, vibratory chute, inspection conveyor, blow-off nozzle, refill valve, indicator lamps and illuminated pushbuttons |
| BCD display −PG1 | `%Q6.0 … %Q7.7` (word `%QW6`) | Three-digit display on the operator panel, 8-4-2-1 per digit; a nibble above 9 stays dark. The demo PLC shows the number of tinned baskets |
| Analog inputs | `%IW64 … %IW74` | Tin temperature −BT1 (0…400 °C), fill level −BL1 (0…100 %), basket temperature −BT2 (0…400 °C), speed potentiometer −SF47 on −S50 (0…100 %), cooling water tank fill level −BL2 (0…100 %), position feedback of control valve −MB18 (0…100 %), each 0…27648 |
| Analog outputs | `%QW80` | Manipulated variable of control valve −MB18 (0…27648 = 0…100 %) |
| Inverters −TA2…−TA5 (telegram 1) | `%QW256…270` / `%IW256…270` | Per inverter, STW1 and NSOLL_A out, ZSW1 and NIST_A back; only when the drive is set to "Drive" (frequency inverter) |

## What the bridge does

```
Browser  ──WebSocket──►  ZwillingBridge.exe  ──Runtime API──►  virtual S7-1500
   Inputs as a block                            WriteInputArea
   Outputs as a block  ◄──────────────────────  ReadOutputArea
```

- Process image **block by block** instead of signal by signal: one pass per CPU cycle.
- `start.bat` sets the **minimum cycle time** of the virtual CPU (default 10 ms). The TIA default of
  100 ms turns every button press into a delay of up to 200 ms; with 10 ms the line responds immediately.
- Several open browser tabs: only the **most recently opened one in PLCSIM mode** writes inputs,
  the others observe. Otherwise two twins would overwrite each other and every bit would
  flicker. A tab in demo mode never takes over control.
- Only the twin itself may connect (opened via `http://localhost:<Port>` or by
  double-click). The bridge rejects other web pages in the browser and reports this in the console.

## Inverters and technology object

![Drive window: operator panel, telegram 1 and ramps live](bilder/11-umrichter.jpg)

Four conveyors run either on their contactors or on a **frequency inverter** (SINAMICS
G120 on PROFINET). You switch over per drive in the sidebar under *Exercise scope → Drives*.
The inverters are located in control cabinet −A1 at the bottom right (each a PM240-2 FSA with CU240E-2 PN and
IOP-2 operator panel, display and LEDs live, clickable).

| Inverter | Drive | Contactors in contactor mode | STW1 / NSOLL_A | ZSW1 / NIST_A | 16#4000 = 1500 rpm = |
|---|---|---|---|---|---|
| −TA2 | Conveyor 1 −MA1 | −QA1/−QA2 | `%QW256` / `%QW258` | `%IW256` / `%IW258` | 100 mm/s |
| −TA3 | Conveyor 2 −MA2 | −QA5/−QA6 | `%QW260` / `%QW262` | `%IW260` / `%IW262` | 120 mm/s |
| −TA4 | Roller curve −MA6 | −QA10/−QA11 | `%QW264` / `%QW266` | `%IW264` / `%IW266` | 110 mm/s |
| −TA5 | Inspection conveyor −MA5 | −QA9 | `%QW268` / `%QW270` | `%IW268` / `%IW270` | 150 mm/s, forward only (p1110) |

In each case, 100 % corresponds to the speed on the mains with a contactor. On the inspection conveyor the negative
direction of rotation is inhibited; a negative setpoint acts like 0 there.

Who controls an inverter depends on the exercise scope:

- *Conveyor: Conveyor module automatic* (also in the demo): the conveyor module provides the telegram itself.
- *Conveyor: PLC controls*: your program. The twin reads the control word and setpoint from the
  output image and responds in the input image with the status word and actual value. This lets a
  **technology object `TO_SpeedAxis`** (or `SinaSpeed` from the DriveLib) run the conveyor exactly as it
  would run a real G120.
- **HAND** on the operator panel: the panel has control, the PLC telegram has no effect (ZSW1.9 = 0).

**Telegram:** SIEMENS standard telegram 1, PZD-2/2, four words per inverter (example −TA2):

| Word | Direction | Content |
|---|---|---|
| `TA2_STW1` | PLC → inverter | Control word 1, typical for operation `16#047F`, OFF1 `16#047E` |
| `TA2_NSOLL_A` | PLC → inverter | Speed setpoint, `16#4000` = 100 % = 1500 rpm, negative = reverse |
| `TA2_ZSW1` | Inverter → PLC | Status word 1 |
| `TA2_NIST_A` | Inverter → PLC | Actual speed value, same scaling |

**What is simulated:**

- State machine according to PROFIdrive: S1 Switching on inhibited → S2 Ready for switching on (OFF1 = 0) →
  S3 Ready for operation (OFF1 = 1) → S4 Operation (STW1.3). You only leave Switching on inhibited with
  OFF1 = 0, as on the real device.
- OFF1 with ramp-down, OFF2 = pulse inhibit (conveyor coasts down), OFF3 = quick stop,
  ramp-function generator (STW1.4…6), setpoint inversion (STW1.11), control by PLC (STW1.10 = 0 →
  telegram is ignored).
- Drive parameters: reference speed p2000 = 1500 rpm, maximum speed p1082 = 2250 rpm (150 %),
  ramp-up and ramp-down time 0.3 s, OFF3 ramp 0.1 s. The actual motion profile comes from the technology object.
- **Emergency stop** selects **STO** via −KF2: pulses inhibited immediately, LED SAFE flashes, then
  Switching on inhibited. The reversing contactors −QA1/−QA2 remain de-energized in this operating mode.
- **Faults** in the "Drive" window: *Overload fault* (F30005, can be acknowledged immediately) and
  *Motor overheated* (alarm A07910 with ZSW1.7 = 1 and ZSW1.13 = 0, plus fault F07011, which can only be
  acknowledged after cooling down). You acknowledge with an edge on STW1.7; with the technology object, use `MC_Reset`.
- **Fieldbus monitoring:** If PLCSIM goes to STOP or the bridge loses its connection, every inverter that
  receives its telegram from the PLC reports **F01910** (fieldbus setpoint timeout) and stops with OFF3.
  It can only be acknowledged once data arrives again. LED BF flashes red as long as there is no data exchange.
- **STW1.10 = 0:** The inverter ignores the telegram and keeps working with the last accepted control word
  and setpoint. A control word `16#0000` therefore does not stop a running drive.

**"Drive" window** (click an inverter in the control cabinet, or Exercise scope →
*Open drives and telegrams*, then select −TA2…−TA5 at the top): on the left, the device front with the
IOP-2 operator panel; on the right, both telegram directions bit by bit with their meaning; at the bottom, **Ramps live**:
setpoint NSOLL_A (dashed), effective setpoint at the input of the ramp-function generator (0 without operation,
limited to p1082) and actual speed over 10, 20 or 60 s. This shows ramp-up and ramp-down,
OFF1/OFF3 and coasting down after STO. The display shows the same as the device in the control cabinet.
You operate the panel as follows:

| Key | Effect |
|---|---|
| HAND/AUTO (hand symbol) | Switch control between panel (HAND) and PROFINET (AUTO), bumpless |
| I / O | In HAND: switch on or OFF1 |
| Wheel | In HAND: speed setpoint (30 rpm per detent), otherwise scroll through the status pages (status, actual values, telegram); mouse wheel, arrow keys or click on the rim |
| INFO | Faults and warnings; there, **OK** (center of the wheel) = acknowledge |
| ESC | Back to the status display |

LEDs of the CU240E-2 PN: **RDY** green = ready, red = fault; **BF** off = data exchange via
PROFINET, red flashing = no data exchange (no connection or CPU in STOP); **SAFE** yellow = STO configured, yellow flashing =
STO selected. The operator panel is modeled on the IOP-2; the menus are simplified.

### Configuration in TIA

1. **Insert inverters:** In the network view, attach one SINAMICS G120 with a
   PROFINET Control Unit (e.g. CU240E-2 PN) to the CPU for each drive you use, and assign device names (`ta2`…`ta5`;
   PROFINET device names only allow lowercase letters, digits, hyphen and dot, so no "−TA2").
2. **Telegram:** In the device view of each inverter, under *Telegram configuration*, select
   **Standard telegram 1, PZD-2/2**, with I/O addresses as in the table above (−TA2 256…259,
   −TA3 260…263, −TA4 264…267, −TA5 268…271). Other addresses work too; in that case adjust the
   `TA…_` lines in `signale.csv` and restart the bridge.
3. **Create the technology object:** *Technology objects → Add new object → Motion Control →
   TO_SpeedAxis*. Under *Configuration → Hardware interface → Drive*, select the G120 or its telegram 1.
   **Do not activate simulation / virtual axis**; otherwise the technology object writes no
   telegram and the twin has nothing to see.
4. **Enter drive data manually:** reference speed 1500 rpm, maximum speed 2250 rpm
   (on inspection conveyor −TA5 positive direction only).
   Under *Hardware interface → Data exchange with drive*, switch off the automatic online transfer of the drive values, because there is no real
   drive they could come from.
5. **Program:** `MC_Power` (Enable, StartMode = 1), `MC_MoveVelocity` (Velocity in rpm,
   1500 rpm = 100 mm/s conveyor speed), `MC_Halt` to stop, `MC_Reset` to acknowledge.
   The state of the axis is in the technology object DB (`StatusWord`, `ErrorWord`, `ActualSpeed`).

The bridge needs nothing new for this: it has always read and written words. It only has to be started with
the current `signale.csv`, otherwise it does not know the telegram words.

> **Note on PLCSIM Advanced:** The bridge writes the telegram directly into the process image of the
> virtual CPU. The technology object works in the cycle of OB MC-Servo, the twin responds in the
> bridge cycle (default 10 ms). That is perfectly adequate for a speed axis. For position control
> it would be too slow.

## Cooling water tank: fill level and refilling

![Cooling water tank with Micropilot −BL2, Liquiphant −BG38/−BG39, solenoid valve −MB17 and control valve −MB18](bilder/14-kuehlwassertank.jpg)

The spray cooling tank (approx. 17 l) loses water during quenching: spray mist and wet baskets
carry it out, and hot baskets additionally evaporate it. Refilling takes place via a fresh water down pipe
with **solenoid valve −MB17** (2/2 NC, shut-off, downstream of −KF2) and **control valve −MB18** in series. Water
only flows when −MB17 is open; −MB18 determines the flow rate (up to 1.5 %/s at 100 %). The actuator
needs 8 s for 0…100 % and reports its position back.

| Device | Signal | Function |
|---|---|---|
| −BL2 Endress+Hauser **Micropilot FMR20B** (radar 80 GHz, 4…20 mA) in the lid | `BL2_Wasserstand` %IW72 | Continuous fill level, 0…27648 = 0…100 % |
| −BG38 Endress+Hauser **Liquiphant FTL31** (vibronic, PNP, MIN safety) | `BG38_Wasser_Min` %I11.5 | 1 = fork covered (above 25 %), dry-run protection of pump −MA3 |
| −BG39 Endress+Hauser **Liquiphant FTL31** (vibronic, PNP, MAX safety) | `BG39_Wasser_Max_frei` %I11.6 | 1 = fork free (below 90 %), 0 = full *or* wire break |
| −MB17 fresh water solenoid valve | `MB17_Nachspeisen` %Q5.4 | Shut-off (closed when de-energized) |
| −MB18 fresh water control valve | `MB18_Regelventil` %QW80, `MB18_Stellung` %IW74 | Manipulated variable and position feedback, 0…27648 = 0…100 % |

Both point level switches work on the closed-circuit principle, as in practice: a wire break signals
"empty" at −BG38 and "full" at −BG39; both are the safe side. Below 8 % the pump draws air,
and then no more spray water comes out. The **drain valve** on the tank (sidebar *Process* or click in
the 3D view) is a disturbance of approx. 1 %/s for testing the control loop.

In the exercise scope *Level controller automatic*, the tank refills itself between 55 and 75 % and
inhibits the pump below −BG38. With *PLC controls*, your program does both. The demo PLC shows
one solution: PI controller to 70 % via −MB18, −MB17 open as long as the controller demands water and
−BG39 is free, pump −QA7 only with −BG38.

## Signal monitor in the browser

The sidebar shows every signal with name, address and live state. You can **force** any digital input
to **0** or **1**: this lets you test interlocks and fault paths without moving the line into
the matching position. **A** returns the signal to the model. Analog values cannot be forced. You create
a wire break on −BT1, −BL1, −BT2 or −BL2 under *Process*, and the module then reports 7FFF (32767). In
operation the analog inputs deliver 0…27648, with overrange up to 32511 above that.

The field next to the filter shows words and bytes as **Dec**, **Hex** (`16#…`) or **Bin** (`2#…`).
With **Show bytes**, a line `%IBn` or `%QBn` with the byte value appears above the bits of each byte,
forced bits included. This lets you see the thumbwheel switch in `%IB12`/`%IB13` directly as BCD.

## NO and NC contacts

Wired fail-safe against wire break, i.e. **1 = not actuated**:

| Signal | Device |
|---|---|
| `SF2_Stop` | STOP operator panel −SF2 |
| `SF7_Band_Halt`, `SF25_B2_Halt`, `SF32_Kurve_Halt`, `SF35_Pruef_Halt`, `SF46_Pruefband_Aus` | Halt pushbuttons of the local control stations |
| `SF0/SF8/SF9/SF10/SF33_NotHalt_frei` | Signaling contacts of the E-stop pushbuttons (1 = released) |
| `FA1/FA5/FA7/FA8_Motorschutz` | Auxiliary contacts of the motor protection circuit breakers (1 = OK) |
| `KF2_NotHalt_OK` | Safety relay feedback (1 = enable) |
| `BG20_Lichtvorhang_frei` | Safety light curtain (1 = protective field clear) |
| `BG38_Wasser_Min`, `BG39_Wasser_Max_frei` | Liquiphant point level switches on the cooling water tank (1 = above minimum or below maximum) |

If your program expects an NO contact for STOP, clear the check box
"STOP −SF2 wired as NC contact" in the operator panel.

## Demo without PLC

Without the bridge and without PLCSIM Advanced, a step sequence runs in the browser and operates the line
on its own. It is not part of your task but a benchmark: at any time you can see
how the line *should* behave: operating modes, interlocks, handshakes at the
transfer points, emergency stop and acknowledgment. Switch over in the sidebar under *Connection*.

If the line is not in its home position at START (after manual mode, a change of operating mode
or an aborted cycle), the step sequence first moves back: steps 11–14 raise,
travel to the conveyor and close the bath, lower and release. A basket set down in the process is conveyed away.

## Tag table

Two tag tables with the same 186 signals and the same addresses, for import into TIA
(PLC tags → right-click → *Import*):

| File | Names and comments | Example |
|---|---|---|
| `TIA/PLC_Variablen_Zinnbad.xlsx` | German, table "Zinnbad" | `MB1_Einhaengen`, `BG11_Korb`, `SF0_NotHalt_frei` |
| `TIA/PLC_Tags_Tinning_EN.xlsx` | English, table "Tinning" | `MB1_HookIn`, `BG11_Basket`, `SF0_EStop_Released` |

The device tag comes first in both languages, so the circuit diagram, twin and
TIA project match. The German → English mapping is in `web/src/sprache/en-signalnamen.js`;
in the English UI the signal monitor shows the English names (the internal name from
`signale.csv` appears in the tooltip, and the search finds both).
