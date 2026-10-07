[Deutsch](05-uebungen.md) · **English**

# Exercises

The twin can be switched in levels: you decide which part of the line your program
takes over and which part the model runs by itself. This way a beginner starts with the step sequence,
while an advanced learner programs handshakes, closed-loop control and reject handling on the same line.

For fully worked-out exercises with task descriptions, background knowledge, tiered hints, sketch
templates and test records, see the [PLC Exercise Handbook](07-uebungshandbuch.en.md).

[◀ Back to overview](../README.en.md)

## Levels ("Exercise scope" switches in the sidebar)

| Level | Your program does | The model does |
|---|---|---|
| **0 – Conveyor line only** | Conveyor 1, stop, separator, roller curve, Conveyor 2, tipping trough, inspection station (exercise scope *Gantry automatic*, *Conveyor: PLC controls*) | Tinning (step sequence −MM1…−MM4), temperature control |
| **1 – Tinning only** | Step sequence −MM1…−MM4, operating modes, indicator lamps | Conveyor, roller curve, Conveyor 2, cooling, inspection station, temperature control |
| **2 – + conveyor line** | additionally Conveyor 1, stop, separator, roller curve, Conveyor 2, tipping trough, inspection station, local control stations; Conveyor 1, Conveyor 2, roller curve and inspection conveyor optionally via contactor or inverter (telegram 1) | Temperature control, cooling water refill |
| **3 – + tin bath and cooling water** | additionally heater −TB1 and refill −MB11 from analog values, refill of the cooling water tank −MB17/−MB18 | nothing: the entire line depends on your program |

You can also set the cooling water tank refill to *PLC controls* on its own, which makes a good
standalone control exercise alongside a line running automatically (exercises 21–24).

## Exercises by difficulty

### Getting started

1. **Home position and enable.** Start the line only when all cylinders are in home position
   (−BG2, −BG4, −BG5, −BG8), temperature (−BG9) and fill level (−BG10) are OK and
   −KF2 reports enable. Drive indicator lamps −PF1…−PF4.
2. **Tinning step sequence.** Hook in the basket, lift, traverse to the bath, open the bath, dip,
   drain, cover the bath, back, set down, release.
3. **Operating modes.** −SA1 AUTO (cycle after cycle until STOP, the basket in progress is completed) and
   SINGLE (one cycle per START).

### Intermediate

4. **Manual mode.** −SA3 to MANUAL: the step sequence is suspended, pushbuttons on the door panel move the cylinders in
   jog mode, with interlocks (−MM3 only with the basket lifted, release only when lowered above the conveyor).
5. **E-stop diagnostics.** Use the signaling contacts `SFx_NotHalt_frei` to capture the first-out: which
   pushbutton tripped, where was it acknowledged? Make illuminated pushbuttons −PF5, −PF12…−PF15 flash.
6. **Conveyor with local control station.** −SA2 switches to local, Right/Left/Stop with
   latching and mutual interlocking, lamp −PF6, evaluate motor protection −FA1.
7. **Stop and separator.** Accumulate baskets, release them one at a time, convey the next basket to the
   transfer point. −BG11 only reports "basket approaching" (55 mm before the stop), only −BG40 reports
   "basket in position": advance the sequence on −BG40, not on a waiting time after −BG11
   (that only works for one conveyor speed). Infeed monitoring: if −BG40 does not respond
   within 3 s after −BG11, report the fault "basket jammed" and stop the conveyor.
   Pickup at the transfer point: **stop the conveyor, open stop −MM5 (−BG15), only then
   hook in and lift**; the finished basket is lowered with the stop open, then it
   leaves, the stop closes (−BG14) and only then does the separator release the next basket.
   If you lift with the stop closed, you see the basket hang by its buffer under the lever
   and tilt, and you tear off the stop (out of action until "Reset line", although the
   end positions on the rotary actuator still report "closed"). If you lower onto the closed stop,
   the basket sits askew; −MM2 does not reach −BG4.

### Advanced

8. **Transfer handshake.** Conveyor 1 → roller curve → Conveyor 2 → tipping trough. At each joint the
   basket rests on both conveyors and only moves when both run in the same direction. Between
   the light barriers of a transfer there is a gap of 22…35 mm: bridge it with a run-on time or a bit
   memory.
9. **Positioning via the incremental encoder.** Evaluate −BG18 (Conveyor 1) or −BG27 (Conveyor 2) with a
   high-speed counter instead of light barriers: 10 pulses/revolution, 24.5 mm per pulse,
   track A/B for direction, zero pulse as reference.
10. **Quenching.** Pump −QA7 before valve −MB13, wait at the cooling station until pyrometer −BT2 reports below
    60 °C, then air knife −MB14 only while the basket is in the zone.
11. **Temperature control.** Control heater −TB1 from −BT1: on/off with hysteresis, pulse/PWM or
    `PID_Compact`. Process: heating element PT1 6 s → bath PT1 150 s, 100 % gives 360 °C, 280 °C
    needs about 76 %. Each dip cools the bath by 5 K.
12. **Reject handling.** Trigger camera −KF10 (−BG32), accept the OK/NOK result within 0.3 s,
    blow off the NOK part with −MB16 after the travel time, change the KLT at −BG34.

### Diagnostics and faults

13. In the signal monitor, **force −BG7 to 0** → the program must wait in step "open bath" and
    report a fault once the monitoring time expires.
14. **Designing monitoring times.** In the displacement-time diagram ("Open large"), measure the travel time of each
    cylinder with the cursors and derive the monitoring times of the step sequence from them.
    Then close the flow control valve of one cylinder (0 % = cylinder stops) or throttle it
    heavily → your program must report the fault with cylinder and direction.
15. Trip a **motor protection device**, interrupt **light curtain −BG20** (let a person walk through),
    **heater off** → below 250 °C −BG9 drops out, no new start.
16. **Optimizing the cycle time.** Set the flow control valves so that the cycle time decreases without any
    cylinder hitting its end position hard or movements overlapping. Prove the result with the
    cursors (step change 2 to step change 1).

### Drive technology

17. **Conveyor line on inverters.** Under *Exercise scope → Drives*, set Conveyor 1, roller curve and Conveyor 2
    to *Drive* and run each conveyor via a `TO_SpeedAxis` with standard telegram 1
    (configuration in [Signals and TIA connection](04-signale.en.md#inverters-and-technology-object)):
    `MC_Power`, `MC_MoveVelocity`, `MC_Halt`. At the transfers a basket only moves as fast as
    the slower conveyor: match the speeds, reverse via negative
    velocity. Check the ramps in the *Drive* window under *Ramps live*.
18. **Telegram by hand.** The same without a technology object: build STW1 and NSOLL_A yourself, evaluate ZSW1
    (switching-on inhibited → `16#047E`, then `16#047F`). Follow along bit by bit in the *Drive*
    window.
20. **Inspection conveyor with variable speed.** Evaluate local control station −S50: key −SA7,
    ON/OFF with latching, speed from potentiometer −SF47 (%IW70, 0…27648) as NSOLL_A to
    −TA5 (`16#4000` = 100 %). Calculate the blow-off time of the NOK parts from NIST_A instead of from a
    fixed travel time (200 mm from the camera to the nozzle).
19. **Drive faults.** In the *Drive* window, trigger *Overload fault* and *Motor overheated*,
    press the E-stop (STO) and switch to HAND on the operator panel (ZSW1.9 drops out). Your program reports the fault (ZSW1.3) and switching-on inhibited
    (ZSW1.6) and acknowledges with `MC_Reset` or STW1.7; F07011 only once the motor has cooled down.

### Cooling water tank level control

Exercise scope *Cooling water tank: refill → PLC controls*. Device data and controlled system in
[Signals and TIA connection](04-signale.en.md#cooling-water-tank-fill-level-and-refilling). Use the drain valve
as a disturbance so that the control loop has something to do.

21. **On/off control with point level switches.** Open −MB17 as soon as −BG38 drops out, close it when −BG39
    drops out (0 = full); set −MB18 to a fixed 100 % for this (`27648` on %QW80). Enable pump −QA7 only with −BG38
    (dry-run protection). Check for wire break: force −BG39 to 0 in the signal monitor; your
    program must then stop refilling and report a fault.
22. **Analog value and hysteresis.** Convert −BL2 to percent with `NORM_X`/`SCALE_X`, on/off controller
    with 60/80 % hysteresis on the analog value. The point level switches remain on top as an independent
    safety layer. Plausibility: −BL2 above 95 % but −BG39 still clear (or −BL2 below
    20 % and −BG38 covered) → measurement faulty, output a message (test by forcing −BL2).
23. **Continuous control with PID_Compact.** Setpoint 70 %, actual value −BL2, manipulated variable `Output_PER` to
    −MB18 (%QW80); −MB17 as enable (closed at −BG39 = 0 or E-stop). First run with the P component only
    and observe the steady-state error with the drain valve open, then add the I component. The
    process is integrating: why is a P controller sufficient without a disturbance? Try out the pretuning.
24. **Monitoring valve and inflow.** Compare the position feedback −MB18 (%IW74) with the manipulated
    variable: deviation above 10 % for longer than 15 s → "control valve stuck". If −MB17 is open and
    the level does not rise by 1 % within 20 s, fresh water is missing → message and switch off the refill.

## What the twin reports by itself

The event log in the sidebar is a corrective, not a logbook: it names faulty behavior in
plain language: basket stuck at a transfer (>4 s), good part blown off, NOK part in the KLT,
KLT overfull, basket not blown dry, tin not at temperature, pump running dry, cooling water tank
overflowing, −MB17 open with the control valve closed. The displacement-time diagram records all
seven cylinders with step numbers and measures the travel time between the end-position sensors
for each cylinder and direction.
