[Deutsch](03-bedienung.md) · **English**

# Operation

Every command device exists twice: as a clickable component in the 3D scene and as a replica in the
sidebar. Both show the same state and write the same inputs.

[◀ Back to overview](../README.en.md)

![Operator panel](bilder/02-bedienpult.jpg)


## Command devices and control stations

- **Operator panel** (3D panel in the scene and in the sidebar): E-STOP −SF0, Acknowledge −SF4 (blue, lamp −PF5 flashes when acknowledgment is required), selector switch −SA1 **AUTO / SINGLE** (AUTO / EINZEL), START −SF1, STOP −SF2 (NC contact), indicator lamps, BCD display −PG1 (%QW6) and thumbwheel switch −SF48 for the dip time (%IW12, + and − per decade).
  - **AUTO:** START → the line runs cycle after cycle until STOP is pressed. The basket in progress is completed.
  - **SINGLE:** every START runs exactly one cycle.
- **Control cabinet −A1 (double door):** on the left the manual mode panel, on the right a **SIMATIC HMI TP1200 Comfort** (−PF10, PROFINET to CPU X1 P2) with a process screen (operating mode, step, tin bath, end positions MM1…MM6, conveyor, message line). Inside: contact blocks, door duct and corrugated-conduit door transition for each door.
- **Manual mode panel (left door):** selector switch −SA3 **AUTO / MANUAL** (AUTO / HAND), lamp −PF7 and one pushbutton per cylinder movement (−SF11…−SF18 for MM1…MM4 in jog mode, −SF19…−SF22 for MM5/MM6 and −SF28/−SF29 for MM8 with latching, since these are monostable valves). This lets you move every cylinder by hand; the roller curve −MA6 stays idle in MANUAL and is operated only from local control station −S30. In MANUAL the step sequence is suspended, and the pushbuttons drive the solenoid coils in jog mode with interlocks (e.g. −MM3 only with the basket lifted, release only when lowered above the conveyor).
- **Local control station −S10** at the rear of the conveyor start next to drive −MA1 (outside the enclosure): key switch −SA2, Left −SF6 / Stop −SF7 / Right −SF5, lamp −PF6, E-STOP −SF8, Acknowledge −SF41 (lamp −PF12).
- **Local control station −S30** at the roller curve: key switch −SA5, Left −SF31 / Stop −SF32 (NC contact) / Right −SF30, lamp −PF9, E-STOP −SF10, Acknowledge −SF43 (lamp −PF14). Right/Left with latching, mutually interlocked.
- **Local control station −S40** at the emptying and inspection station (operator side between tipper and reject bin, facing trough, vibratory chute and inspection conveyor): key switch −SA6 (1 = local, the station's automatic mode is suspended), lamp −PF11, Inspection ON −SF34 / OFF −SF35 (NC contact) for vibratory chute + inspection conveyor with latching, trough rollers ◀ −SF37 / ▶ −SF36 in jog mode (only with the tipper down), TIP −SF38 / TIPPER BACK −SF39 (5/2 monostable valve, hence latching as on the door panel; tipping only with a basket at end stop −BG33 or without a basket at the transfer), E-STOP −SF33, Acknowledge −SF44 (lamp −PF15). The cable runs in steel conduit on the floor under the inspection conveyor to the cable tray of the inspection station and along the cable route to the control cabinet.
- **Local control station −S50** at the inspection conveyor (operator side between reject bin and KLT): key switch −SA7 (1 = local, takes priority over −S40), lamp −PF16, Inspection conveyor ON −SF45 / OFF −SF46 (NC contact) with latching, **speed potentiometer −SF47** (0…100 %, analog on %IW70). The speed only takes effect when the inspection conveyor runs on inverter −TA5; on contactor −QA9 it runs at rated speed. In the 3D model you turn the knob by dragging (up or right = more) or with the mouse wheel in 5 % steps; the value is shown next to the mouse pointer. The sidebar has a slider. E-stop and acknowledge are at −S40 next to it.

  ![Local control station −S50 inspection conveyor](bilder/13-vorort-pruefband.jpg)

- **E-stop:** −SF0 (operator panel), −SF8 (−S10), −SF9 (−S20), −SF10 (−S30) and −SF33 (−S40) act via safety relay −KF2. It de-energizes the valves, the contactors and the heater, even if the PLC still sets outputs. The line is enabled again only after releasing **and** acknowledging: −KF2 enables when the acknowledge button is **let go** (monitored start). The conveyor module and gantry control then only restart with **START −SF1**. −KF2_NotHalt_OK reports the state to the PLC.
  - **Signaling contacts:** Each E-stop pushbutton also has an auxiliary contact (NC, wire-break proof) on a standard PLC input: `SF0_NotHalt_frei`, `SF8_NotHalt_frei`, `SF9_NotHalt_frei`, `SF10_NotHalt_frei`, `SF33_NotHalt_frei` (%I9.1…%I9.5, **1 = released**, 0 = actuated). Shutdown remains hard-wired via −KF2. The event log and the HMI message line name the pushbutton, e.g. "E-STOP −SF9 (conveyor 2) – release and acknowledge (−SF42)".
  - **Acknowledge pushbuttons:** −SF4 (operator panel), −SF41 (−S10), −SF42 (−S20), −SF43 (−S30), −SF44 (−S40) are wired in parallel to the reset input of −KF2, so any of them acknowledges. Each has its own input (`SF4_Quittieren`, `SF41_Quittieren_S10` … `SF44_Quittieren_S40`), so the PLC sees where the acknowledgment came from ("E-stop acknowledged at −S20 (−SF42)"), and its own indicator lamp (−PF5, −PF12…−PF15) that flashes when acknowledgment is required.
- **Light curtain −BG20:** Clicking a light curtain column (or the "Reach into the light curtain" button) makes an arm reach into the protective field. −KF2 shuts down; restart only once the protective field is clear and you acknowledge with −SF4. Input BG20_Lichtvorhang_frei %I4.7.
- **3D view:** left-drag = orbit, right-drag (or Shift + left) = pan, mouse wheel = zoom, double-click a component = set the pivot there. The **Controls** button shows and hides the legend. **View** flies the camera to preset views: Overview, Subprocesses (transfer point, gantry, tin bath, pneumatics, roller curve, cooling, cooling water tank, tipper, inspection, KLT) and Control stations (operator panel, −S10, −S30, −S20, −S40).
- All command devices can be clicked in the 3D scene: pushbuttons stay pressed while held, E-stops and selector switches latch.



## Displacement-time diagram and throttles

- **Sidebar:** The displacement-time diagram shows the last 60 s of all seven cylinders (−MM1…−MM6, −MM8),
  in the demo with the step numbers. Position 1 = piston rod extended.
- **Open large:** The button below the diagram (or a click on a flow control valve in the 3D view)
  opens a separate window. You can move it by its title bar and resize it at the bottom right
  corner; Esc closes it.
  - **Time window** 5…120 s, **Pause** freezes the display, the mouse wheel then scrolls back.
  - **Cursors:** One click sets cursor 1, a second click cursor 2, Δt is shown at the top. The cursors snap to
    the edges of the end-position sensors of the cylinder under the pointer (hold Alt for free
    placement), can be dragged and pause the diagram automatically.

![Displacement-time diagram with cursors and throttles](bilder/09-weg-zeit-diagramm.jpg)

- **One-way flow control valves:** There is one at every cylinder port (exhaust-air throttling: the valve at
  port B slows extension, the one at A slows retraction). In the window you can set each direction of each
  cylinder individually: 50 % = nominal time, 100 % = twice as fast, **0 % = closed, the cylinder
  stops** (useful for testing monitoring times). Next to it you see a guide value and the last
  **measured travel time**, from leaving one end-position sensor to reaching the other one,
  which is exactly the time your PLC program sees. The setting is stored in the browser;
  "All to 50 %" restores the default setting. The "Speed of all cylinders" slider under *Process*
  additionally acts on all of them together.

![One-way flow control valves on stop −MM5](bilder/10-drosselventile.jpg)



## Switching the exercise scope

| Switch | "automatic" | "PLC" |
|---|---|---|
| **Tinning: gantry −MM1…−MM4** (default: PLC) | The gantry control runs the step sequence of the demo PLC: hook in, lift, to the bath, cover open, dip, drain, back, set down, release. Independent of −SA1, it runs as soon as −KF2 is enabled and a basket rests against −BG40, after an E-stop only again after START −SF1; −SA3 MANUAL switches to the jog pushbuttons on the door panel. The outputs −MB1…−MB8 of your PLC have no effect (signal monitor: source "Gantry"). | Your program switches −MB1…−MB8, end positions −BG1…−BG8. |
| **Conveyor, stop, separator** (with roller curve and Conveyor 2) | The conveyor module conveys, stops at the stop, separates and transfers via the roller curve to Conveyor 2 on its own. | Your program controls −QA1/−QA2 (forward/reverse), −MB9 stop, −MB10 separator, the roller curve −QA10/−QA11, Conveyor 2 (−QA5/−QA6, cooling), the trough rollers −QA12/−QA13 and the inspection station. Inputs: −BG11…−BG13, −BG35/−BG36, −BG21…−BG24, −BG37/−BG33 (tipping trough), local control stations, −FA1/−FA5/−FA7/−FA8. |
| **Tin bath: temperature and fill level** | The controller on the bath holds 280 °C, refill by button. | Your program switches −TB1 heater and −MB11 refill. Actual values −BT1/−BL1 analog. On/off, pulse/PWM or PID_Compact: your program decides. |
| **Cooling water tank: refill** | The level controller on the tank refills between 55 and 75 % and locks pump −MA3 below −BG38. | Your program switches −MB17 and sets −MB18 (%QW80). Actual values −BL2 (%IW72) and −MB18 (%IW74) analog, point level switches −BG38/−BG39. On/off or PID_Compact, and you also take care of the pump's dry-run protection. |

**Gantry automatic, conveyor from your program:** The gantry control lifts and lowers at the transfer point only
with the stop open (−BG15). Your program stops the conveyor when −BG40 responds, opens −MB9 at the latest when −BG1
reports "hooked in", and keeps the stop open until the finished basket has been set down, released (−BG2) and has left
(−BG11 clear). Only then close the stop and open the separator. As long as the hook is in the basket, the conveyor must stand still.

**Recipe: dipping and draining time** are set under *Process* (2…30 s, default 10 s each). The demo PLC
and the gantry in "automatic" keep these times. If your program controls the gantry, they are the setpoints
against which the twin checks every basket: dipped or drained for less (0.5 s tolerance) → "basket defective" and
more rejects at the inspection station.

Tin bath controlled system: heating element PT1 (6 s) → bath PT1 (150 s), 100 % heating power gives 360 °C in steady state, 280 °C needs approx. 76 %. Each dip cools the bath by 5 K and consumes 4 % tin. Analog values: 0…27648 = 0…400 °C or 0…100 %.

Cooling water tank controlled system: integrating (no self-regulation). Inflow up to 1.5 %/s with −MB17 open and −MB18 at 100 %, control valve with 8 s actuating time. Consumption during spraying approx. 0.3 %/s plus evaporation on hot baskets, drain valve approx. 1 %/s (decreasing as the level falls). Under *Process* you see fill level, valve positions, inflow and consumption live; the *Open drain valve* button switches the disturbance. More disturbances below it: *Trip motor protection −FA1/−FA5/−FA7/−FA8* (the motor really stops, the auxiliary contact reports 0) and *Wire break −BT1/−BL1/−BT2/−BL2* (the analog module reports 7FFF = 32767).



## Sidebar

The sidebar lies over the right edge of the 3D view. Showing and hiding it (**Sidebar** button at the bottom
or × at the top) does not change the 3D picture. **Detach** at the top of the sidebar moves it into a separate
window, which can be dragged to a second screen, for example; the 3D view then uses the full width. Everything
in the sidebar remains usable (control panel, forcing, diagram). **Dock** or closing the window brings it
back. If the browser blocks the window, allow pop-ups for the page.

## Language

At the top of the sidebar, **EN / DE** switches between the English and German user interface; the
page reloads. Without a saved choice, the language follows the browser. Signal names,
addresses and device tags (−MM1, −BG5 …) stay the same in both languages so that they
match the TIA project.



## Graphics and performance

- **"Graphics"** button at the bottom of the 3D view (shows the current level, e.g. "Graphics: Auto (Medium)"). It opens the window with all graphics settings: quality, reflections, ambient occlusion and the graphics card the browser is currently using. Settings are remembered in the browser.
- **Quality:** *Auto* continuously measures how many frames miss the display refresh and drops one level as soon as the picture stutters (target: a steady 60 frames/s). The level found is saved, and the next time you open the twin it starts with it right away. *High*, *Medium* and *Low* are fixed levels.

| Level | Rendering |
|---|---|
| High | full materials, moving shadows |
| Medium | simple lighting, shadows of fixed parts precomputed once, 85 % resolution |
| Low | like Medium, 70 % resolution |
| (Auto only) Minimal | no shadows, 55 % resolution |

- **Reflections:** metal parts reflect a photo of a real workshop hall (applies at level *High*). Switched off, the brightness stays the same and metal looks matt.
- **Ambient occlusion:** ambient occlusion (GTAO) shades corners, grooves, gaps and
  the areas under conveyors and devices, giving a much more three-dimensional look. It costs roughly a second scene render per frame
  (frame rate roughly halved); *Graphics: Auto* then drops one level if necessary. Default: off, the
  state is remembered in the browser. Transparent panels (enclosure, light curtain) cast no occlusion.

- For the best rendering in the browser, use the powerful graphics card, instructions for Windows 10 and 11: [Commissioning](01-inbetriebnahme.en.md#set-the-browser-to-the-powerful-graphics-card-important-on-laptops). If the browser is running on the integrated graphics, the graphics window points this out. On laptops with an additional NVIDIA or AMD card, this is the most important step against stuttering.

[◀ Back to overview](../README.en.md)
