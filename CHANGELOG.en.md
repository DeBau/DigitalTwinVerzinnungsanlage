[Deutsch](CHANGELOG.md) · **English**

# Changelog

All notable changes to the twin and the bridge. The version is shown in the twin at the top of the
sidebar and in the header of the bridge console. The twin and the bridge should have the same
major and minor version (e.g. 1.4.x); otherwise the twin reports it in the event log.

[◀ Back to overview](README.en.md)

## 1.11.0 – 2026-10-06

Rebuild the bridge (`Bridge\build.bat`): the bridge code has not changed, but it carries the
new minor version. The signal list and TIA tag tables stay the same (port assignment of −XD3 unchanged).

**Why**
Between Conveyor 1 and the tin bath, cables and hoses hung loose in the air and lay on the floor, valve terminal −QM2 and
field distributor −XD3 were mounted at the back and hard to reach, and several cables ran down from above through the cover
of the cable bridge.

**Added**
- **Cable tray between Conveyor 1 and the tin bath:** perforated cable tray (pre-galvanized steel) at the bottom of the conveyor frame,
  100 × 60 next to the bath, 150 × 60 in front of it via a reducer; wall brackets on the conveyor supports, floor support
  in front of the enclosure rear wall, end piece, divider (motor cable −MA1 separated). Cross tray 60 × 60 with add-on tee
  under the conveyor to the gantry column for the compressed air supply of −QM2. It carries the cables −BG14…−BG17/
  −BG40, the trunk cable of −XD3, the multipole cable and hoses of −QM2, and −MA1; no cable crosses another.
- **−QM2 and −XD3 at the front** of the conveyor frame (toward the enclosure front, freely accessible).
- **Bending radius of sensor cables 2 × D** (PUR, highly flexible); all other cables still at least 5 × D.

**Changed**
- The sensor cables of the rotary actuators drop vertically below their outlet into their layer of the tray and rise
  vertically to the connector at −XD3.
- All cables go down to the floor next to the cable bridge and enter from the side under the ramp (duct at the
  conveyor end, tray, −BG35 at the roller curve); the bridge has 22 instead of 20 layers.

**Documentation**
- `docs/02-anlage.md`: cable tray, cable bridge, bending radii, location of −XD3.

## 1.10.1 – 2026-10-06

Twin only (3D model). Bridge, signal list and TIA tag tables stay the same.

**Why**
When opening and closing, the cover −MM4 would in reality have run into sensors, cables and attachments on the
tin bath.

**Changed**
- **−BG9 thermocouple and −BG10 level electrode** horizontally through the rear wall of the bath instead of from
  above; heads, M12 connectors and cables sit at the back below the rim.
- **Rim extraction** as a slot duct behind the rear guide rail (it used to stand on the bath rim in the
  travel path of rail and lid), brackets on the rear wall, collecting hood to the exhaust duct.
- **Cover guide:** rails and end stops matching the 320 mm stroke (in the "closed" end position the carriages
  stood next to the rail, and an end stop was in the travel path); driver on a bracket in front of the
  lid edge (in the "closed" end position it was stuck in the bath wall), short adapter piece.
- **−XD2** on the bath-side face of the right gantry column: the cables −BG7…−BG10 rose
  through the plane of the open lid in front of the distributor.

## 1.10.0 – 2026-10-06

Rebuild the bridge (`Bridge\build.bat`): the bridge code has not changed, but it carries the
new minor version. The signal list and TIA tag tables stay the same.

**Why**
If you only wanted to program the conveyor line, you still had to write the entire step sequence of the gantry
(without tinning, no finished basket reaches the conveyor). Also, the dipping time and draining time were
fixed at 10 s.

**Added**
- **Exercise scope "Tinning: gantry −MM1…−MM4"** with *Gantry automatic* / *PLC controls*
  (default: PLC controls, existing programs run unchanged). In automatic, the gantry
  control runs the step sequence of the demo PLC (without START and independently of −SA1) as soon as −KF2 is enabled
  and a basket is resting against −BG40; −SA3 MANUAL switches to the jog buttons on the door panel. The
  PLC outputs −MB1…−MB8 then have no effect (signal monitor: source "Gantry"; the DQ LEDs
  still show what the CPU writes). The HMI lamp "Gantry auto", the step number and the displacement-time diagram
  keep running.
- **Recipe: dipping time and draining time** adjustable under *Process* (2…30 s, default 10 s each). The
  demo PLC and the gantry in "automatic" keep to them; if your program controls the gantry, the
  twin measures every basket against them (shorter than setpoint − 0.5 s → "basket defective", more rejects).

**Documentation**
- `docs/03-bedienung.md`: gantry selector, handover conveyor ↔ gantry (−BG40, −BG1, −BG15, −BG2), recipe.
- `docs/05-uebungen.md`: level 0 "Conveyor line only".

## 1.9.0 – 2026-10-06

Rebuild the bridge (`Bridge\build.bat`) and start it with the new `signale.csv`: the bridge code
has not changed, but it carries the new minor version. Re-import the TIA tag tables
(comments of −BG15 and −BG40 changed, addresses unchanged).

**Why**
The spring-loaded stop bar from 1.8.0 could not be built like that: when the gantry lifts the basket, the
bar springs forward and blocks the basket as it is lowered. In addition, with the stop closed, the PU buffer stops at the bottom of the
basket sit under the lever, so the basket cannot be lifted at the transfer point at all while the
stop is closed, not even at the 49° of the old lever. And the rear
buffer stop was 5 mm below the separator lever.

**Added**
- **Stop and separator with 90° pneumatic rotary actuator** (rotary vane, like Festo DSM-16)
  instead of a compact cylinder with slotted link: the lever swings vertically upward and then stands completely
  clear of the basket. End positions −BG14…−BG17 via two inductive M8 sensors on a switching cam on the
  shaft, one-way flow control valves directly on the actuator, aluminum bracket on the profile slot.
- **Fixed stop bar** (UHMW-PE on an aluminum carrier, no damper), **−BG40 as an inductive M12 sensor
  mounted flush in the stop face** in front of the basket's corner post. Address and name stay the same.
- **Separator moved back 10 mm** (stop face z = −105, waiting basket at −160): when lifted, the rear
  buffer stop of the basket at the transfer point clears the separator lever.
- **Collision made visible:** lifting with −MM5 closed: the front buffer stop catches under the lever,
  the basket tilts forward on the hook; from 10° it tears off the stop (lever bent and folded up,
  out of order until "Reset line"; the end positions on the actuator still report "closed"), after which
  the basket swings freely. Lowering onto the closed −MM5: the basket lands with its buffer stop on the
  lever and sits askew on the belt; −MM2 does not reach −BG4. Both with a message.

**Changed**
- Sequence at the transfer point (demo PLC and conveyor module): basket at −BG40 → **stop conveyor → open
  stop (−BG15) → hook in and lift**. The finished basket is lowered with the stop open and
  moves off; only when −MM5 is closed again (−BG14) does the separator release the next basket.
  As long as the hook is in the basket at the transfer point, the conveyor stays stopped.
- Nominal swivel time of −MM5/−MM6 in the displacement-time diagram 0.3 s.

**Documentation**
- `docs/02-anlage.md`: swing lever stopper with rotary actuator, buffer stops and separator spacing.
- `docs/05-uebungen.md`: exercise 7 extended with the takeover at the transfer point and the collisions.
- New image `10-drosselventile` (flow control valves on the rotary actuator).

## 1.8.0 – 2026-10-06

Rebuild the bridge (`Bridge\build.bat`) and start it with the new `signale.csv`: the bridge code
has not changed, but it carries the new minor version, and only with the new signal list
does it know −BG40. Re-import the TIA tag tables (162 signals).

**Added**
- **"Basket resting against stop" sensing −BG40** (`BG40_Korb_am_Anschlag` %I8.0): light barrier
  −BG11 already detects a basket 55 mm before stop −MM5. How long it takes to reach the stop
  depends on the conveyor speed, so a wait time after −BG11 never fits all
  speeds. The stop bar is now spring-loaded: the basket pushes it through the remaining stroke of
  3 mm against the shock absorber, and a switching flag on the aluminum carrier moves in front of an inductive M8 sensor
  (flush, sn 1.5 mm) in the mounting bracket on the lever. −BG40 only signals when the basket is really
  resting against the stop.
- The bar of stop −MM5 and separator −MM6 visibly moves along, and the nuts of the
  guide bolts lift off the lever. Cable of −BG40 on the lever to the pivot axis and from there
  to field distributor −XD3, port X4.
- HMI screen in the control cabinet: lamp −BG40 next to −BG11; "Basket at transfer point" now shows −BG40.

**Changed**
- In the signal list, −BG11 is now called "Light barrier infeed transfer point (basket arriving)". Address and name
  stay the same.
- The demo PLC starts the cycle and stops the conveyor with −BG40 instead of 1.5 s after −BG11. As long as
  −BG11 is occupied and −BG40 does not yet signal, the conveyor keeps running. Indicator lamp −PF4 shows −BG40.
- **TIA programs that start the cycle with −BG11** keep working, but the gantry may approach
  a basket that is still rolling. Switch to −BG40.

**Documentation**
- `docs/02-anlage.md`: stop bar with −BG40, sensor table, assignment of −XD3.
- `docs/05-uebungen.md`: exercise 7 extended with −BG11/−BG40 and an infeed monitoring.
- `docs/01-inbetriebnahme.md`, `docs/04-signale.md`, `README.md`: −BG40, 162 signals.

## 1.7.0 – 2026-10-06

Rebuild the bridge (`Bridge\build.bat`) and start it with the new `signale.csv`: the bridge code
has not changed, but it carries the new minor version, and only with the new signal list
does it know the signals of the cooling water tank. Re-import the TIA tag tables (161 signals).

**Added**
- **Level measurement and refill of the cooling water tank** of the spray cooling: quenching
  consumes water (spray mist, wet baskets, evaporation on hot baskets); below 8 % the
  pump −MA3 runs dry and no spray water comes out.
- Sensors from Endress+Hauser: radar **Micropilot FMR20B** −BL2 in the lid (continuous level,
  `BL2_Wasserstand` %IW72) and two vibronic point level switches **Liquiphant FTL31** on the rear wall:
  −BG38 MIN 25 % (`BG38_Wasser_Min` %I11.5, dry-run protection) and −BG39 MAX 90 %
  (`BG39_Wasser_Max_frei` %I11.6, 1 = free, closed-circuit principle). Plus a sight glass standpipe with a
  water column.
- Fresh water downpipe with ball valve, **solenoid valve −MB17** (`MB17_Nachspeisen` %Q5.4, downstream of
  −KF2) and **control valve −MB18** in series (`MB18_Regelventil` %QW80, actuating time 8 s,
  position feedback `MB18_Stellung` %IW74, position indicator on the yoke).
- New module **AQ 4xU/I ST** in the control cabinet, AI 8 with labeled channels BT1…MB18.
- Exercise scope **Cooling water tank: refill**: *Level controller automatic* (55…75 %, pump locked below
  −BG38) or *PLC controls*. The demo PLC controls the level to 70 % with a PI controller.
- **Drain valve** as a disturbance (sidebar *Process* or click in 3D), display Cooling water −BL2
  with min/max marks, valve positions, inflow and consumption live; cooling water on the HMI screen.
- Messages: pump running dry, dry-run protection has locked, tank overflowing, −MB17 open with
  control valve at 0 %.
- New view "Cooling water tank · refill".

**Documentation**
- `docs/04-signale.md`: section "Kühlwassertank: Füllstand und Nachspeisung" (cooling water tank: fill level and refilling), address assignment.
- `docs/05-uebungen.md`: exercises 21–24 on level control (two-position control with point level switches,
  hysteresis on the analog value with plausibility check, PID_Compact, valve and inflow monitoring).
- `docs/02-anlage.md`, `docs/03-bedienung.md`: tank, signals, AQ module, exercise scope, controlled system.
- Images: new cooling water tank, control cabinet recaptured (AQ 4).

## 1.6.0 – 2026-10-05

Rebuild the bridge (`Bridge\build.bat`) and start it with the new `signale.csv`: the bridge code
has not changed, but it carries the new minor version, and only with the new signal list
does it know the telegram words of the inverters.

**Added**
- Conveyor 1, Conveyor 2, roller curve and inspection conveyor optionally on **frequency inverters −TA2…−TA5**
  (SINAMICS G120, PROFINET, standard telegram 1) instead of their contactors: selector per drive under
  *Exercise scope → Drives*. A technology object `TO_SpeedAxis` runs each conveyor like a
  real G120. On the inspection conveyor, the negative direction of rotation is inhibited (p1110).
- Inverter model with PROFIdrive state machine (S1…S5), OFF1/OFF2/OFF3, ramp-function generator,
  setpoint inversion, STO via E-stop −KF2, and the faults F30005 and F07011 with acknowledgment.
- Four inverters in the control cabinet (each PM240-2 FSA, CU240E-2 PN, IOP-2 operator panel) with live display,
  RDY/BF/SAFE LEDs and identification label, clickable.
- **Drive** window (−TA2…−TA5 selectable): device front with an operable operator panel (HAND/AUTO,
  I/O, rotary knob, ESC, INFO, acknowledge), STW1/ZSW1 bit by bit, NSOLL_A/NIST_A in hex, percent and
  rpm, plus **live ramps** (setpoint, effective setpoint, actual speed over 10/20/60 s).
- The inverter runs in every exercise scope: with *Conveyor module automatic* (and in the demo) the
  conveyor module drives it via the same telegram, with *PLC controls* your program does, in MANUAL the panel does.
- Signals `TA2_…` to `TA5_…` (STW1, NSOLL_A, ZSW1, NIST_A at `%QW/%IW256…270`) in
  `signale.csv` and in both TIA tag tables. The demo PLC also runs all four conveyors via
  the inverters.
- **Local control station −S50** at the inspection conveyor: key switch −SA7, ON −SF45 / OFF −SF46, speed
  potentiometer −SF47 (%IW70, 0…100 %, acts on inverter −TA5), indicator lamp −PF16; operable in 3D and in the
  sidebar, takes priority over −S40. The demo PLC evaluates it.
- The signal monitor shows word outputs, and control and status words in hex.
- **Ambient occlusion** (GTAO from three.js r170) can be switched on with the button at the bottom of the
  3D view; the setting is remembered in the browser, off by default.

**Changed**
- Pipes, hoses and cables: triangles with correct winding order, so you now see the outside
  (previously the inside of the rear wall), and cables appear in their real color.
- Rotary potentiometers in 3D: drag or use the mouse wheel (5 %); the value is shown next to the mouse pointer.
- Bottom bar slightly more compact to make room for the new button.
- New view "Local −S50 inspection conveyor".

**Documentation**
- `docs/04-signale.md`: section "Umrichter und Technologieobjekt" (inverters and technology object) with configuration in TIA.
- `docs/05-uebungen.md`: exercises 17–20 on drive technology.
- `docs/02-anlage.md`: inverters −TA2…−TA5 in the control cabinet assignment, signals of −S50.
- `docs/03-bedienung.md`: local control station −S50.
- New images: entire line, control cabinet, inspection station; plus the *Drive* window, inverters in the cabinet
  and −S50. A new tool `node tools\doku-bilder.mjs` recaptures them.

## 1.5.0 – 2026-10-05

Rebuild the bridge (`Bridge\build.bat`): it has not changed, but it carries the new
minor version; otherwise the twin reports a version mismatch when connecting.

**Added**
- Cables and hoses are routed round: every corner is a real bend of at least 5 × outer
  diameter instead of a kink, the cross section is round, and short offsets run as a flat S.
- At field distributors −XD1, −XD2, −XD3 and −XD5, the sensor cables run as an orderly bundle
  vertically in front of the distributor, and each one bends straight into its connector in its own layer: no more
  loops or crossings.
- Angled M12 connectors where there is no room for a bend behind the connector (light barriers,
  rotary encoders, −BG37, multipole −QM4).
- Carriage and lifting unit reworked: carriage plate, bracket and Z base plate as a closed
  box, upright lifting energy chain in a channel on the base plate, driver blade on the hook.

**Changed**
- Cable routes rerouted: chain cables through a cable grommet in the tray floor to −XD1,
  −MM3/−MM4 hoses without short offsets, compressed air downpipes aligned with the service unit,
  valve terminal −QM4 30 mm higher, cable duct on the right gantry column ends above −XD2, hoses to the
  air knife Ø8.

**Documentation**
- `docs/06-entwicklung.md`: section "Leitungen verlegen" (routing cables); new check tool
  `node tools\biegung.mjs` lists bends below the minimum bending radius.

## 1.4.0 – 2026-10-05

Rebuild the bridge (`Bridge\build.bat`): the minor version has changed, and the bridge now reads
comments containing semicolons completely.

**Added**
- English user interface: DE/EN selector at the top of the sidebar (reloads the page). Translated
  are the sidebar, windows, messages, 3D labels, HMI screen and signal comments. Without a
  saved choice, the language follows the browser.
- English TIA tag table `TIA/PLC_Tags_Tinning_EN.xlsx`: the same 134 signals and addresses
  with English names (device tag first, e.g. `MB1_HookIn`, `BG11_Basket`) and comments.
- In the English user interface, the signal monitor shows the English tag names; the internal
  name from `signale.csv` appears in the tooltip, and the search finds both.

**Fixed**
- `signale.csv` is Excel-safe: comments no longer start with `-` (Excel turned them into
  `#NAME?`); the device tag now follows the term ("Tauchzylinder -MM2: senken").
  Semicolons in comments replaced with commas.
- Bridge: a semicolon in a comment used to cut off everything before it (e.g. for −BG20).

**Documentation**
- Clarified: only the names in `signale.csv` are fixed; the names in the TIA project are free, because
  the bridge couples via the addresses.

## 1.3.1 – 2026-10-05

**Changed**
- Travel times and cursors refer to the end-position sensors (leaving one sensor until reaching the other
  sensor), exactly the time the PLC program sees as well. Previously, the cursors snapped
  shortly before the end of stroke, which comes noticeably later because of the end-position cushioning.
- The version warning only appears when the major or minor version of the twin and the bridge
  differ; bug fixes (x.y.**z**) do not require a rebuilt bridge.
- Documentation: displacement-time diagram, throttles and two new exercises (dimensioning monitoring times,
  optimizing cycle time), images 09 and 10.

## 1.3.0 – 2026-10-05

**Added**
- Displacement-time diagram with all seven cylinders (−MM1…−MM6, −MM8) instead of only −MM1…−MM4.
- Large diagram window (movable, resizable): time window 5…120 s, pause and
  scroll back, two cursors with Δt that snap to the start and end of a movement
  (from 1.3.1 to the end-position sensors).
- One-way flow control valves on every cylinder, extending and retracting adjustable separately
  (0…100 %, 0 % = cylinder stopped), with guide value and measured travel time per direction. The valves
  are visible at the cylinder ports; clicking one opens its setting.

**Changed**
- The slider "Cylinder speed" is now called "Speed of all cylinders" and also acts on
  −MM5/−MM6.

## 1.2.2 – 2026-10-05

**Added**
- The line keeps running when the browser window is minimized or hidden. This lets you watch
  TIA Portal on a single monitor while the twin sets the inputs of the virtual CPU
  in the background.
- Homing run of the demo step sequence: if the line is not in its home position at START
  (after manual mode, a change of operating mode or an aborted cycle), it first moves back
  (steps 11–14) and then continues normally.
- A clear message instead of a gray area when the browser or graphics driver does not provide WebGL 2
  or startup fails for another reason. After a graphics driver reset, the
  3D view restores itself; the line keeps calculating in the meantime.
- Version number in the twin and in the bridge; warning if the two do not match.

**Fixed**
- The demo step sequence stayed stuck in step 1 after manual mode or after switching from PLCSIM to demo.
  In addition, when switching to manual mode, separator −MM6 opened immediately and let the
  next basket roll under the occupied hook.
- Forced inputs were no longer marked in the signal monitor after each reconnection of the bridge,
  but remained in effect.
- Multiple tabs: a tab in demo mode could take over control without
  sending inputs. Now the most recently opened tab in PLCSIM mode always has control.
- At fewer than 20 frames per second, the line ran slower than the PLC clock, so monitoring times
  in the PLC program expired too early. It now keeps pace down to about 4 frames per second.
- Resetting with a worker in the light curtain immediately triggered an emergency stop again.
- If a part fell next to the hopper, the inspection message for that basket never arrived.
- Removed baskets did not release their graphics memory; at graphics levels Medium and below,
  the line therefore became slower over hours.

**Security**
- The bridge now only accepts WebSocket connections from the twin (opened via `http://localhost:<Port>`
  or by double-click). Other web pages open in the same browser can no longer write
  inputs to the PLC. Messages over 1 MB close the connection.

**Changed**
- Fonts (IBM Plex) are embedded in `web/index.html` instead of being loaded from Google Fonts: the
  twin looks the same without internet access and makes no outbound connections.
