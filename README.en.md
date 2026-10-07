[Deutsch](README.md) · **English**

# Digital Twin: Tinning Line

**A complete industrial plant in your browser, coupled to a virtual S7-1500.**
Your TIA program controls it through ordinary inputs and outputs: no hardware, no risk,
no waiting for a free test rig.

*Bauer Automation Solutions · Dennis Bauer · free for vocational training and education*

![Complete plant](docs/bilder/01-gesamtanlage.jpg)

```
Browser (3D twin)  ⇄  WebSocket  ⇄  ZwillingBridge.exe  ⇄  PLCSIM Advanced API  ⇄  virtual S7-1500
   End positions, light barriers, pushbuttons, selector switches, BT1/BL1  ───────►  %I / %IW
   Solenoid coils, contactors, heating, indicator lamps                    ◄───────  %Q
```

---

## Up and running in three steps

```bat
1. Bridge\build.bat      :: locates the PLCSIM API, builds ZwillingBridge.exe
2. Bridge\start.bat      :: starts the bridge and web server, opens the browser
3. http://localhost:8181 :: set −SA1 to AUTO, press START −SF1
```

**Just want to take a look?** Double-click `web\index.html`. A single file: no server, no internet,
no installation. Without a PLC, the twin runs in **Demo without PLC** mode: a step sequence in the
browser controls the plant, and it runs on its own.

Full commissioning with TIA Portal and PLCSIM Advanced is described in
**[docs/01-inbetriebnahme.en.md](docs/01-inbetriebnahme.en.md)**.

---

## What is simulated

Small parts are tinned in a material basket. The plant consists of six interlinked stations,
and each basket travels all the way from the start of the conveyor into the bin:

| Station | Contents |
|---|---|
| **Infeed conveyor 1** | Belt conveyor with drive −MA1, incremental encoder, stop −MM5 and separator −MM6 (swing-lever stopper), local control station −S10 |
| **Gantry and tin bath** | Hook-in −MM1 (swivel hook), dip −MM2, traverse −MM3, strip-off −MM4; heated tin bath at 280 °C with fill level monitoring and refill unit |
| **90° roller curve −MA6** | Driven curved roller conveyor with 14 tapered carrying rollers and round belts, local control station −S30 |
| **Conveyor 2 with spray cooling** | Stainless-steel wire mesh belt, quench tunnel with circulation pump and spray pipes, pyrometer −BT2, air knife, local control station −S20 |
| **Basket tipper −MM8** | Driven tipping trough, 126° tipping angle, chute into the hopper, local control station −S40; at the inspection conveyor −S50 with speed potentiometer |
| **Inspection station** | Vibratory chute, inspection conveyor, Keyence camera per part, blow-off nozzle for NOK parts, small load carrier (KLT) with fill level monitoring |

On top of that: an **operator panel**, a walk-in **control cabinet −A1** with S7-1500, contactors,
terminals and HMI panel, a **safety circuit** with five emergency stop pushbuttons, safety relay −KF2
and light curtain, and an operator who removes the finished baskets.

<table>
<tr>
<td width="50%"><img src="docs/bilder/04-zinnbad.jpg" alt="Tin bath"></td>
<td width="50%"><img src="docs/bilder/05-rollenkurve.jpg" alt="Roller curve"></td>
</tr>
<tr>
<td><img src="docs/bilder/07-spruehkuehlung.jpg" alt="Spray cooling"></td>
<td><img src="docs/bilder/06-pruefstation.jpg" alt="Inspection station"></td>
</tr>
</table>

---

## Features

**162 signals at freely assignable addresses.** 109 inputs (6 of them analog) and 53 outputs (1 of them analog) at
`%I0.0…%I11.7`, `%Q0.0…%Q5.4`, `%IW64…74` and `%QW80`, plus the PROFINET telegrams of the four inverters
−TA2…−TA5 (Conveyor 1, Conveyor 2, roller curve, inspection conveyor) at `%IW256…270/%QW256…270`, for
`TO_SpeedAxis` technology objects just like on a real SINAMICS G120. Your program sees the same interface as on
the real plant: no proprietary protocol, no block library, no license file.

**A behavioral model, not an animation.** Cylinders move with switching delay, acceleration and
end-position cushioning; each one is fitted with one-way flow control valves, with extend and retract
adjustable separately all the way down to standstill. Sensors have a switching point and hysteresis, and
baskets queue up at their buffer stops with 150 mm spacing. The tin temperature follows a PT1 chain
(heating element 6 s → bath 150 s); 100 % heating power yields 360 °C, about 76 % is needed for 280 °C,
and each dip cools the bath by 5 K and consumes 4 % of the tin. A controller that works here also works on
the plant.

**Every control device can be operated.** Pushbuttons, emergency stops and selector switches can be clicked
in the 3D scene and are also replicated in the sidebar. The control cabinet can be opened: the channel LEDs
of the DI/DQ modules show the bits live, the contactors visibly pick up, and the CPU display shows
RUN/STOP.

**Exercise scope in stages.** You decide which part of the plant your program takes over: first
the step sequence, then the conveyor line with roller curve and inspection station, then the
temperature control. The model runs the rest by itself, so the plant is complete from day one.

**Diagnostics on board.** A signal monitor that lets you force every single input, and a displacement-time
diagram of all seven cylinders with step numbers, enlarged in its own window with cursors that
snap to the end-position sensors and the measured travel time per cylinder and direction. Plus a
plain-text event log ("conveyor 2 and trough rollers must both run", "Good part blown off",
"Basket stuck at transfer").

**German and English.** The user interface switches between German and English at the push of a button,
and the TIA tag table is available with German and with English names, at identical addresses,
because the bridge couples via the addresses.

**One file, no installation.** The twin is a single 5 MB HTML file: no server, no internet,
no runtime environment. The graphics level adjusts itself to the frame rate, from a training laptop
to a workstation; optional ambient occlusion adds even more realistic depth shading.

<table>
<tr>
<td width="50%"><img src="docs/bilder/03-schaltschrank.jpg" alt="Control cabinet"></td>
<td width="50%"><img src="docs/bilder/08-signalmonitor.jpg" alt="Signal monitor"></td>
</tr>
<tr>
<td><img src="docs/bilder/09-weg-zeit-diagramm.jpg" alt="Displacement-time diagram with cursors and throttles"></td>
<td><img src="docs/bilder/10-drosselventile.jpg" alt="One-way flow control valves on the cylinder"></td>
</tr>
<tr>
<td><img src="docs/bilder/11-umrichter.jpg" alt="Drive window: operator panel, telegram 1 bit by bit, live ramps"></td>
<td><img src="docs/bilder/12-umrichter-schrank.jpg" alt="Four SINAMICS G120 inverters in the control cabinet"></td>
</tr>
</table>

---

## PLC Exercise Handbook

**The course that goes with the twin, right in your browser.** In 37 exercises across four levels,
the handbook takes you from the first signals to a line that runs entirely on your program:
manual mode and interlocks first, then operating modes, command output and automatic mode, followed by emergency
stop diagnostics, the conveyor line, closed-loop control and drives. Every exercise follows the
same six steps from inform to evaluate, with background knowledge and references, tiered hints,
quick checks and a test record. You draw your planning documents in the built-in sketch editor:
GRAFCET, displacement-step diagram, electrical and pneumatic circuit diagrams, control loop and
trend. You fill in tables such as value tables or the hazard matrix in templates with a sample row.
The *My documents* folder collects all your documents, and the *Your project grows with you* page
shows how your TIA Portal project grows from exercise to exercise. It also includes the complete
circuit diagram of the line, ready to browse and search. One file, works offline, your
entries stay in your browser.
The handbook is currently available in German.

<table>
<tr>
<td width="50%"><img src="docs/bilder/15-uebungshandbuch-start.jpg" alt="Handbook start page with the learning path"></td>
<td width="50%"><img src="docs/bilder/16-uebungshandbuch-gefaehrdungsmatrix.jpg" alt="Hazard matrix with a sample row in the Plan step"></td>
</tr>
</table>

Open [`docs/uebungshandbuch.html`](docs/uebungshandbuch.html) in your browser.
Learn more in **[07 – Exercise Handbook](docs/07-uebungshandbuch.en.md)**.

---

## Who it is for

- **Vocational and further training:** electronics technicians for automation technology, mechatronics
  technicians, technician and master craftsman schools. One plant that carries you from a simple
  step sequence project all the way to a final thesis.
- **PLC training courses:** operating modes, safety engineering, handshakes, analog value processing and
  closed-loop control on one consistent example instead of five unconnected training boards.
- **Programmers:** test programs in advance, provoke faults and dimension monitoring times
  before the real plant is even built.

---

## Documentation

| Document | Contents |
|---|---|
| **[01 – Commissioning](docs/01-inbetriebnahme.en.md)** | Building the bridge, preparing the TIA project, starting PLCSIM Advanced, coupling, testing, troubleshooting |
| **[02 – The Plant](docs/02-anlage.en.md)** | Design of all stations, the line after tinning, cable routing, control cabinet |
| **[03 – Operation](docs/03-bedienung.en.md)** | Operator panel, manual-mode panel, local control stations, emergency stop, displacement-time diagram and throttles, 3D navigation, graphics levels |
| **[04 – Signals and TIA](docs/04-signale.en.md)** | `signale.csv`, address assignment, bridge, signal monitor, NC and NO contacts |
| **[05 – Exercises](docs/05-uebungen.en.md)** | 24 exercises from getting started to cycle time optimization, ordered by difficulty |
| **[06 – Development](docs/06-entwicklung.en.md)** | Build, source code structure, tools, conventions |
| **[07 – Exercise Handbook](docs/07-uebungshandbuch.en.md)** | Interactive course in the browser: 37 exercises in four levels, six steps per exercise, fill-in templates, My documents folder, background knowledge, tiered hints, quick checks, sketch editor with GRAFCET, electrical and pneumatic templates |
| **[Changelog](CHANGELOG.en.md)** | What changed in which version |

---

## Project structure

```
signale.csv                 Signal list, the only place where addresses are defined
Bridge/
  build.bat                 builds ZwillingBridge.exe (C# compiler included with Windows)
  start.bat                 instance name, port, CPU cycle time
  ZwillingBridge.cs         bridge source code
TIA/
  PLC_Variablen_Zinnbad.xlsx  all 162 signals for import (German names)
  PLC_Tags_Tinning_EN.xlsx    the same signals with English names
web/
  index.html                the finished twin: a single file, runs on double-click
  src/                      source code as ES modules
  build.mjs                 bundling with esbuild
  tools/                    screenshot and import cycle checks
docs/                       documentation and images
```

---

## System requirements

| | |
|---|---|
| **Viewing** | Windows, macOS or Linux, current browser with WebGL 2 |
| **With PLC** | Windows 10/11, S7-PLCSIM Advanced V3.0 or later, TIA Portal V16 or later |
| **Hardware** | Any graphics from Intel UHD upward; the graphics level adjusts automatically to the frame rate |
| **Not required** | Installation, internet connection, license file or runtime environment for the twin itself |

---

## License

© 2026 **Bauer Automation Solutions**, Dennis Bauer. See [LICENSE](LICENSE.en.md).

**Free for vocational training and education.** Use, adapt and share it in vocational schools, universities,
inter-company training centers and in-house training, free of charge.
A training course may cost money; the twin may not.

**Not permitted:** selling, renting or sublicensing the twin, either on its own or as
part of another product. When sharing, please credit:
*Digitaler Zwilling Verzinnungsanlage © Bauer Automation Solutions, Dennis Bauer.*
For anything beyond that, a license agreement is available. Just ask.

The twin uses [three.js](https://threejs.org) and
[three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh) under the MIT License, as well as the
[IBM Plex](https://github.com/IBM/plex) typeface under the SIL Open Font License; the license texts are located in
`web/src/lib/`. SIMATIC, TIA Portal, S7-1500 and PLCSIM are trademarks of Siemens AG;
Keyence, Festo, Rittal, Interroll and ifm are trademarks of their respective manufacturers. This project
is not affiliated with these companies. The equipment is replicated so that the
plant looks and behaves like a real machine.
