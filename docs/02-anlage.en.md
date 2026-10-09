[Deutsch](02-anlage.md) · **English**

# The Line

What the twin contains: mechanical design, line layout, cable routing and control cabinet. Every component carries
its reference designation according to EN 81346, exactly as it is named in `signale.csv` and in the TIA project.

[◀ Back to overview](../README.en.md)

![Complete line](bilder/01-gesamtanlage.jpg)


## Mechanical design

- **Gantry:** 90×90 columns under the crossbeam, gusset plates front and rear, crossbeam with two profile rail guides, carriage with −MM3 (ISO 15552), end stops with shock absorbers, energy chain in the chain trough.
- **−MM2 dip:** Guide unit with two guide rods in linear bearings, piston rod connected to the yoke via a compensating coupling.
- **Basket pickup (swivel hooks):** Adapter plate on the yoke, two bearing blocks with plain bearings, supported hook shaft (pivot) with two J-hooks (seating recess and safety lug). A lever points upward; −MM1 (Ø25, stroke 25) is mounted with a swivel mounting on the bearing block and with a rod clevis on the lever. Retracting (−BG1) swings the hooks under the basket bail (Ø10), extending (−BG2) swings them clear. The hook angle and the cylinder inclination are calculated from the piston travel.
- **−MM4 strip-off:** Cover on two profile rail guides (size 15) on the bath rim, continued on a separate frame; rails and end stops match the 320 mm stroke, and the carriages stay on the rail in both end positions. The driver sits on a bracket in front of the cover edge and, in the "closed" end position, stands next to the bath housing. Nothing lies in the travel path of the cover: −BG9 (thermocouple) and −BG10 (level electrode) are installed horizontally through the rear wall, with their heads and cables at the rear below the rim; the rim extraction is a slot duct behind the rear guide rail and extracts across the bath rim.
- **Material basket:** Stainless steel wire basket 110 × 90 × 110 mm, open at the top: rim frame and corner posts in round steel Ø6, wire mesh Ø2.5 with 13 mm mesh size, skids of flat steel with PU buffer stops, carrying bail Ø10 at a height of 158 mm with support and diagonal struts. The perforated intermediate floor holds **36 copper tubular cable lugs** (tube Ø8, tab with Ø5 hole) in fixed positions on a 6 × 6 grid (15 mm pitch); drain holes between them let tin and water run off.
- **Belt conveyor:** Belt on a slider bed, drive pulley with shaft-mounted geared motor and torque arm, tail pulley, flange bearings, support rollers, side guides. Stop −MM5 and separator −MM6 are designed as **swing lever stoppers** mounted on the side at the drive end (+x): with the stainless steel wire belt, a lift stopper acting from below through the belt is not possible, so a lever (flat steel 16 × 12) reaches over the side guide and engages the basket end wall (48…64 mm above the belt). It swings in its own plane, transverse to the conveyor, **through 90° vertically upward** and then stands completely beside the basket. This is the only way the basket can be lifted and set down again at the transfer position, because its PU buffer stops at the bottom of the base frame protrude 20 mm beyond the end wall and lie under the lever when the stop is closed. The basket runs against a **fixed stop bar** (PE-UHMW on an aluminum carrier); at 0.1 m/s and about 5 kg no damper is needed. An M12 inductive sensor is mounted flush in the bar of −MM5, in front of the basket's corner post: **−BG40 signals when the basket is in contact with the stop**, regardless of the conveyor speed. Each stopper is driven by a **90° pneumatic rotary actuator** (vane type, like Festo DSM-16) in front of the lever on an aluminum bracket in the profile slot; the actuator shaft is the lever axis. The end positions are detected by two M8 inductive sensors on a switching cam on the shaft (−BG14/−BG15, −BG16/−BG17) via field distributor −XD3. They sense the actuator, not the lever. Valves −MB9/−MB10 are mounted on −QM2, the one-way flow control valves directly on the actuator. The basket is released only once the opening angle reaches 80 %. The separator holds the next basket 10 mm behind the basket at the transfer position (basket center z = −160), so that the rear buffer of that basket does not catch under the separator lever when it is lifted. In the exercise scope "automatic" they are operated by the conveyor module, otherwise by the PLC. End stops at both ends. The baskets have buffer stops on the base frame: when queued they stand at a 150 mm pitch, so the separator lever engages the 40 mm gap between the basket bodies. Incremental encoder −BG18 on the tail pulley: 10 pulses/revolution, tracks A/B offset by 90° (forward: B = 1 on rising edge of A), zero pulse N, 24.5 mm of belt travel per pulse. At the end of the conveyor the operator removes finished baskets after 4 s.



## Line after tinning (Conveyor 2)

- **Conveyor 1** protrudes from the front of the enclosure (drive −MA1 at the start of the conveyor, encoder −BG18 on the head pulley, −BG13 as a retroreflective light barrier just before the end of the conveyor, z = 1005) and transfers directly to the roller curve.
- **90° transfer: powered curved roller conveyor −MA6** (design similar to Interroll curve modules, scaled down for the small baskets): 14 tapered carrying rollers (Ø24 inside → Ø43 outside, cone apex at the curve center, giving the same angular velocity across the conveyor width), inner radius approx. 300 mm, conveyor width 254 mm, center line R = 420 mm (660 mm conveying distance, 110 mm/s). Drive: shaft-mounted geared motor −MA6 on the outside at the middle of the curve, round belt to the middle roller, and from there Ø5 PU round belts from roller to roller (round belt heads at the outer end). Curved side frames (galvanized steel), side guides (stainless steel) on brackets, two supports with crossbeam and leveling feet. Reversing contactor assembly **−QA10/−QA11** and motor protection **−FA7** in the control cabinet (row D), light barriers **−BG35** (curve start) and **−BG36** (curve end), local control station **−S30**. The basket follows the curve and rotates through 90° in the process.
- **Transfers:** At each joint (Conveyor 1 → curve, curve → Conveyor 2) the basket rests on both conveyors and moves only when both run in the same direction. The PLC therefore has to perform a handshake: Conveyor 1 keeps running while the curve takes over the basket (−BG13 or −BG35 occupied), and the basket at the curve end (−BG36) waits until Conveyor 2 is running and −BG21 is clear. If a basket hangs at a transfer for more than 4 s, the twin reports this in the event log. When queued, the baskets stand at a 150 mm pitch, also in the curve and on Conveyor 2 (skids now in the conveying direction).
- **Light barriers at the transfers:** At each transfer, one light barrier sits just before the end of the delivering conveyor ("basket at transfer"; the waiting basket reliably interrupts the beam) and one just after the start of the receiving conveyor ("basket taken over"). Keyence PZ-G61CN with R-2 reflector, both on stainless steel mounting brackets on the outside in the slot of the side profiles (on the curve, on the outside of the curved side frames, between two carrying rollers); nothing stands on the belt or in the basket path. The beam runs transverse to the conveying direction (in the curve, radially through the basket center) 50 mm above the belt or roller top: above the side guides (top edge 43 mm), within the wire basket (basket body 6…90 mm), below the rim and bail. The signal is 1 as long as the basket body (110 mm, basket center ±55 mm around the beam) is in the beam. Between the beams of a transfer there is a gap of 22…35 mm, which the program bridges with a short run-on time or a flag (set by the delivering sensor, reset by the receiving sensor).

| Light barrier | Signal / address | Beam (basket center) | Meaning |
|---|---|---|---|
| −BG12 | BG12_Bandanfang %I2.5 | Conveyor 1, z = −700 | Basket at conveyor start (infeed) |
| −BG11 | BG11_Korb %I1.2 | Conveyor 1, z = 0 | Basket arriving: entry to transfer position, already signals 55 mm before the stop |
| −BG40 | BG40_Korb_am_Anschlag %I8.0 | Stop bar −MM5 (inductive M12, flush) | Basket in contact with stop −MM5 |
| −BG13 | BG13_Bandende %I2.6 | Conveyor 1, z = 1005 (mounting bracket in front of the tail pulley flange bearing) | Basket at transfer to roller curve (waits at z ≈ 1040) |
| −BG35 | BG35_Kurve_Anfang %I6.0 | Curve, s = 47 mm (between rollers 1 and 2) | Basket taken over from Conveyor 1 |
| −BG36 | BG36_Kurve_Ende %I6.1 | Curve, s = L − 47 mm (between rollers 13 and 14) | Basket at transfer to Conveyor 2 (waits at s ≈ L − 60) |
| −BG21 | BG21_B2_Anfang %I5.4 | Conveyor 2, x = 505 (behind the tail pulley) | Basket taken over from roller curve |
| −BG22 | BG22_B2_Kuehlung %I5.5 | Conveyor 2, x = 1300 (in the cooling tunnel) | Basket at cooling position (pyrometer −BT2) |
| −BG24 | BG24_B2_Ende %I5.7 | Conveyor 2, x = 2740 (in front of the drive shaft flange bearing) | Basket at transfer to tipping trough (waits at x = 2710) |
| −BG37 | BG37_Kipper_Einlauf %I11.7 | Tipping trough, x = 2885 (45 mm behind the trough entry), swivels with the trough | Basket in the trough, stays 1 up to the end stop and during tipping |
| −BG33 | BG33_Kipper_Korb %I7.6 | Inductive, in the end stop, x = 2925 | Basket at end stop, tipping permitted |


| Signal | Address | Meaning |
|---|---|---|
| QA10_Kurve_Rechts / QA11_Kurve_Links | %Q3.0 / %Q4.2 | Reversing contactor roller curve −MA6 (mechanically interlocked, via −KF2) |
| PF9_VorOrt3 | %Q4.3 | Indicator lamp local control station −S30 |
| BG35_Kurve_Anfang / BG36_Kurve_Ende | %I6.0 / %I6.1 | Light barriers curve start / curve end |
| SA5_VorOrt3, SF30/SF31/SF32 | %I8.4…%I8.7 | Local −S30: key switch, forward, reverse, stop (NC contact) |
| FA7_Motorschutz3 | %I9.0 | Motor protection −FA7 (1 = OK) |

- **Conveyor 2** conveys to the right out of the line: drive −MA2 with reversing contactor assembly −QA5/−QA6 and motor protection −FA5, incremental encoder −BG27, Keyence light barriers −BG21 (start), −BG22 (cooling position), −BG24 (end, transfer to tipping trough), local control station **−S20** (key switch −SA4, reverse −SF24 / stop −SF25 / forward −SF23, E-stop −SF9, acknowledge).
- **Wire mesh belt:** Conveyor 2 has a stainless steel wire belt (heat- and water-resistant, water runs through).
- **Spray cooling (quenching):** Stainless steel tunnel with strip curtains, sight glass and spray pipes above and below. The water runs through the basket and belt into the drip tray and back into the tank with circulation pump **−MA3 (−QA7)**; spraying is via valve **−MB13**, only while the pump is running. Steam escapes through the vapor exhaust pipe. Pyrometer **−BT2** (%IW68) measures the basket temperature. In air, a full basket needs about 3 min, in the spray water a few seconds. The conveyor stops at the cooling position until the basket is below 60 °C.
- **Cooling water tank:** Continuous level measurement by radar sensor **−BL2** (Endress+Hauser Micropilot FMR20B, %IW72) in the lid, point levels by two vibronic point level switches Endress+Hauser Liquiphant FTL31 on the rear wall: **−BG38** min 25 % (dry-run protection) and **−BG39** max 90 % (1 = free). Next to them, a sight glass standpipe with marks at min and max. Refilling is via the fresh water downpipe with ball valve, **solenoid valve −MB17** and **control valve −MB18** (actuator with position indicator, %QW80/%IW74). The drain valve at the bottom of the end face is clickable. Details in [Signals and TIA connection](04-signale.en.md#cooling-water-tank-fill-level-and-refilling).
- **Air knife −MB14** at the tunnel exit blows off the water. Without blow-off, water spots remain.
- **Emptying and inspection station:** At the end of Conveyor 2, the basket runs over the powered roller conveyor of the tipping trough (5 carrying rollers Ø26, roller chain with worm geared motor **−MA7**, separate reversing contactor assembly **−QA12** forward / **−QA13** backward, motor protection **−FA8**), past light barrier **−BG37 trough entry**, up to the end stop (−BG33, inductive). −BG37 swivels with the trough: sensor on a mounting bracket on the outside of the front side plate, beam 50 mm above the carrying rollers through a Ø14 hole in the side plate, R-2 reflector on the inside of the rear side plate above the PE side guide (the roller drive is on the outside there). Handshake: basket at −BG24, trough down (−BG30) and empty (−BG37/−BG33 clear) → Conveyor 2 and trough rollers run until the basket passes −BG37 and arrives at −BG33. Tipping is only permitted with −BG33 and −BG37. The **basket tipper −MM8** is an aluminum profile base frame on leveling feet with two bearing blocks and UCP206 pillow block bearings; the tipping trough (steel side plates, PE side guides, hold-down above the basket rim, end stop with chute) is mounted on a continuous Ø30 shaft whose axis lies 10 mm above the top edge of the basket, behind the basket end wall. Gravity therefore presses the basket against the end stop and hold-down in every position, so it cannot fall out; the operator pulls the empty basket back 70 mm and lifts it off. Drive: ISO 15552 cylinder Ø50/stroke 200 (−MB15, 5/2 monostable, slot sensors −BG30/−BG31) with a rod eye in the bearing block on the rear longitudinal member and a rod clevis on the lever r = 113 on the shaft end. A pin center distance of 418 → 618 mm gives, from the geometry (table of distance → angle), a tipping angle of 126°, with a transmission angle ≥ 27° in both end positions. From about 100°, the parts slide over the chute into the **hopper** (separate frame, baffle plate, lateral deflector plates), which discharges onto the start of the vibratory chute. The **vibratory chute −MA4 (−QA8)** singulates them onto the **inspection conveyor −MA5 (−QA9)**. At the camera position, **light barrier −BG32** triggers the **Keyence CV-X (−KF10)** for each part individually (camera CA-H500C, ring light CA-DRW, controller in the cabinet). Result per part in 0.3 s: **OK −BG28 / NOK −BG29**. **Blow-off nozzle −MB16** blows NOK parts 200 mm further on into the red reject bin; OK parts drop into the **blue KLT** at the end of the conveyor (−BG34 full at 144 parts, the operator replaces it). The empty basket is removed after the trough has swung back.
- **Inspection station: mechanics and peripherals:** The vibratory chute −MA4 is an electromagnetic linear feeder (useful mass on leaf spring packs inclined at 20°, magnet with 8 mm air gap, counter-oscillating mass on rubber buffers, stainless steel trough with discharge lip above the conveyor start, controller on a column in front of it). The inspection conveyor −MA5 is a 100 mm belt conveyor with aluminum side profiles, slider bed, idler ends and side guides with gaps for light barrier −BG32 (retroreflective light barrier with reflector), blow-off nozzle −MB16 and reject chute into the red reject KLT. Camera −KF10 with ring light hangs from an anchored stand (45x90 profile, cantilever arm, cross clamp). The OK KLT 6147 (600x400x147.5) stands on a transport dolly at the marked buffer position; −BG34 is an ultrasonic sensor on the gallows above the discharge point. Peripherals: compressed air downpipe with ball valve → air service unit −AZ2 → valve terminal −QM4 (−MB15, −MB16, coil LEDs) on a mounting plate on the front bearing block; hoses to −MM8 run over the crossmember and longitudinal member with a drag loop at the swiveling cylinder and one-way flow control valves; the nozzle hose runs in the cable tray behind the station. Field distributor −XD5: X0 −BG30, X1 −BG31, X2 −BG33 (drag loop at the tipping axis), X3 −BG32, X4 −BG34, X5 −QM4, X6 −BG37 (separate drag loop next to −BG33). The local cables to −XD5 lie at the front of the cable tray behind the station; home run cable, trough drive −MA7, controller −MA4, motor −MA5, camera cable and the cables of local control stations −S40/−S50 (in steel conduit on the floor) run in the same tray along the cable route to the control cabinet. Moving cables are only recalculated when the angle changes.
- **Transfer Conveyor 2 → tipping trough:** In the transfer area, the basket rests on Conveyor 2 and the trough rollers and moves only when both run forward (handshake as at the roller curve). In the "automatic" setting, the conveyor module runs the trough rollers along during the transfer and up to −BG33. If a basket hangs for more than 4 s in the exercise scope "PLC", the event log reports "conveyor 2 (−QA5) and trough rollers (−QA12) must both run".

| Signal | Address | Meaning |
|---|---|---|
| QA12_Mulde_Vor / QA13_Mulde_Zurueck | %Q4.4 / %Q4.5 | Reversing contactor trough rollers −MA7 (mechanically interlocked, via −KF2) |
| PF11_VorOrt4 | %Q4.6 | Indicator lamp local control station −S40 |
| FA8_Motorschutz4 | %I10.5 | Motor protection −FA8 trough drive (1 = OK) |
| SA6_VorOrt4, SF34_Pruef_Ein, SF35_Pruef_Halt | %I9.6, %I9.7, %I10.0 | Local −S40: key switch, inspection ON, OFF (NC contact) |
| SF36_Mulde_Vor / SF37_Mulde_Zurueck | %I10.1 / %I10.2 | Local −S40: jog trough rollers |
| SF38_Kipper_Kippen / SF39_Kipper_Zurueck | %I10.3 / %I10.4 | Local −S40: tipper |
| SF0/SF8/SF9/SF10/SF33_NotHalt_frei | %I9.1…%I9.5 | E-stop signaling contacts (NC contact, 1 = released) |
| SF41…SF44_Quittieren_S10…S40 | %I10.6, %I10.7, %I11.0, %I11.1 | Acknowledge pushbuttons of the local control stations |
| BG37_Kipper_Einlauf | %I11.7 | Light barrier tipping trough entry (basket in the trough, swivels with it) |
| SA7_VorOrt5, SF45_Pruefband_Ein, SF46_Pruefband_Aus | %I11.2, %I11.3, %I11.4 | Local −S50 inspection conveyor: key switch, ON, OFF (NC contact) |
| SF47_Pruefband_Drehzahl | %IW70 | Local −S50: speed potentiometer 0…27648 = 0…100 % |
| PF16_VorOrt5 | %Q5.3 | Indicator lamp local control station −S50 |
| MB17_Nachspeisen | %Q5.4 | Solenoid valve fresh water cooling water tank (in series with −MB18) |
| MB18_Regelventil / MB18_Stellung | %QW80 / %IW74 | Control valve fresh water: setpoint and feedback 0…27648 = 0…100 % |
| BL2_Wasserstand | %IW72 | Cooling water tank level (radar) 0…27648 = 0…100 % |
| BG38_Wasser_Min / BG39_Wasser_Max_frei | %I11.5 / %I11.6 | Liquiphant point level switches: 1 = above 25 % / 1 = below 90 % |
| PF12…PF15_Quitt_S10…S40 | %Q4.7, %Q5.0…%Q5.2 | Illuminated acknowledge pushbuttons of the local control stations |

- Defect patterns: copper visible (not dipped or dipped too briefly), water spots (not blown off), uneven tin layer, occasional tin icicles. For each basket, the event log shows "x OK in KLT bin, y NOK rejected" and reports incorrect behavior: good part blown off, NOK part in KLT, KLT overfull.
- Exercise ideas: transfer handshake Conveyor 1 → roller curve → Conveyor 2 with light barriers and run-on times, quenching as a temperature wait condition (pump before valve, hysteresis), air knife only with a basket in range, positioning Conveyor 2 via the encoder instead of light barriers, reject handling for NOK.



## Cable routing

- Compressed air from the plant supply line via ball valve and air service unit to valve terminals −QM1 (gantry) and −QM2 (conveyor).
- Both ports of every cylinder are fitted with a one-way flow control valve (type GRLA, exhaust air flow control) with throttle screw and lock nut; the hose is plugged into the valve. Clicking a valve opens its settings, see [Operation](03-bedienung.en.md#displacement-time-diagram-and-throttles).
- Makes: field distributors ifm (orange PA housing), light barriers Keyence PZ-G with R-2 reflector, valve terminals Festo (with coil labels −MBx/coil 12/14), operator enclosures Rittal, controller Siemens.
- **Bending radii:** sensor cables (PUR, M8/M12, highly flexible) with 2 × outer diameter, all other cables and hoses with at least 5 × outer diameter.
- **Every limit switch wired individually:** sensor cable in the cylinder slot to the cylinder end cap, then fixed with cable ties along the profiles and connected with an M12 connector to its port on the passive field distributor:
  - −XD1 (left gantry column): X0 −BG1/−BG2 (via Y-splitter at the hook and coiled cable), X1 −BG3, X2 −BG4 (both through the energy chain), X3 −BG5, X4 −BG6, X5–X7 protective caps.
  - −XD2 (right gantry column, side face toward the bath, outside the travel path of the cover): X0 −BG7, X1 −BG8, X2 −BG9, X3 −BG10, X4–X7 protective caps.
  - −XD3 (conveyor frame +x, front): X0 −BG14, X1 −BG15, X2 −BG16, X3 −BG17, X4 −BG40, X5–X7 protective caps.
  - Light barriers −BG11…−BG13 and encoder −BG18 into the cable tray on the conveyor frame (operator side), along it to the rear above the cross tray to the control cabinet and down into it. At the front of this tray a vertical tray carries the cables of the control panel, −S30 and −BG35 up out of their conduits.
  - **Cable tray between Conveyor 1 and tin bath:** perforated cable tray (pre-galvanized steel) along the bottom of the conveyor frame, from the rear wall of the enclosure to just before the roller curve: 100 × 60 next to the bath, then 150 × 60 via a reducer in front of it. Wall brackets with hammer-head screws on the conveyor supports, floor supports (anchored) in front of the rear wall and in front of the conveyor end, end pieces at both ends. The cable route to the control cabinet lies at the bottom, the local cables on top. **−QM2 and −XD3 are mounted at the front** of the conveyor frame (toward the enclosure front, freely accessible), −XD3 at the very front. The cables −BG14…−BG17/−BG40 drop vertically below their outlets, each into its own layer, run to the front, run outward in front of −XD3 to below their port and rise vertically there to the connector. The hoses from −QM2 run to the rear to −MM5/−MM6 and rise between or behind the actuators. No cable crosses another in the tray. The compressed air supply for −QM2 comes from the air service unit at the gantry through a 60 × 60 cross tray (add-on tee, two floor supports) passing under the conveyor.
  - **Cable route to the control cabinet** (instead of a floor cable bridge): perforated cable trays 100 × 60, straight horizontal and vertical pieces only. Low at the inspection station (passing under the safety fence), vertical up to conveyor height in front of the tipper, behind Conveyor 2 past the cooling water tank to the conveyor start, vertical down there and flat on the inside of the roller curve into the cable tray between Conveyor 1 and tin bath. Along it to the rear, behind the gantry column through a cross tray to the left under Conveyor 1 and the fence, and through the brush strip in the plinth panel into the side of the control cabinet. Wherever cables pass over a sheet metal edge there is edge protection; the vertical trays stand offset by the bending radius on their own posts. Every cable has a fixed lane and layer (cables laid in farther from the cabinet lie at the bottom), the motor cables lie behind a divider. No cable crosses another.
  - Control stations in front of the plant (control panel, −S20, −S30, −S40, −S50), −S10 behind the fence and the cables at the roller curve (−BG35, −BG36, −MA6, encoder −BG27): in steel conduit on the floor with floor clamps to the nearest tray (−S10 into the cabinet): straight conduit pieces with grommets only; at direction changes and at the ends the cable passes freely in a bend. The light barriers −BG21, −BG22, −BG24 on Conveyor 2 run in horizontal steel conduit (bracket on the conveyor profile, clamp on the tray wall) across the gap into the tray.
- Home run cables of the field distributors run in PVC ducts on the columns and in the wire mesh tray above the gantry to the control cabinet.



## Control cabinet −A1 ("Open control cabinet")

![Control cabinet −A1](bilder/03-schaltschrank.jpg)

![Inverters −TA2…−TA5 in the control cabinet](bilder/12-umrichter-schrank.jpg)

| Row | Equipment |
|---|---|
| Incoming supply | −X0 incoming supply terminals, −FA1 motor protection 3RV2, −FA2 MCB C16 3-pole, −FA3/−FA4 MCB B6, −TA1 SITOP PSU8200 24 V/10 A, −XD9 service socket, −FA5/−FA6 motor protection Conveyor 2/pump, −FA8 motor protection trough drive, −QB1 main switch (shaft to side handle) |
| SIMATIC S7-1500 | PM 1507, −KF1 CPU 1516-3 PN/DP with display, DI 32 (%I0.0–%I3.7), DI 32 (%I4.0–%I7.7), DI 32 (%I8.0–%I11.7), DI 32 (%I12.0–%I15.7, thumbwheel switch −SF48), DQ 32 (%Q0.0–%Q3.7), DQ 32 (%Q4.0–%Q7.7), AI 8 (%IW64…%IW74: BT1, BL1, BT2, SF47, BL2, MB18), AQ 4 (%QW80 MB18), spare; to the right of the mounting rail −KF10 Keyence CV-X |
| Power | −QA1/−QA2 reversing contactor assembly conveyor (mechanically interlocked), −QA3 heater contactor, −TB1 solid-state relay 3RF2, −KF2 safety relay 3SK1, −KF3…−KF6 coupling relays, −QA5/−QA6 reversing contactor assembly Conveyor 2, −QA7 pump, −QA12/−QA13 reversing contactor assembly trough rollers |
| Terminals | −X1 400 V, −X2 24 V DC, −X3 inputs, −X4 outputs, −X5 field (8WH, spring-loaded); to the right −QA10/−QA11 reversing contactor assembly roller curve and −FA7 motor protection roller curve |
| Bottom | −XPE protective earth bar, to the right the inverters −TA2 Conveyor 1, −TA3 Conveyor 2, −TA4 roller curve, −TA5 inspection conveyor (each SINAMICS G120: PM240-2, CU240E-2 PN, IOP-2), shield clamp bar with strain relief |

The channel LEDs of the DI/DQ modules show the signals from `signale.csv` live. The CPU display shows RUN/STOP of PLCSIM Advanced or DEMO. The switching position indicators of the contactors and the LED of the solid-state relay follow the process.

Positions 0/1 as in the displacement-step diagram:

| Cylinder | 0 (sensor) | 1 (sensor) | Home position |
|---|---|---|---|
| −MM1 | hooked in (−BG1) | released (−BG2) | 1 |
| −MM2 | up (−BG3) | down (−BG4) | 1 |
| −MM3 | above conveyor (−BG5) | above tin bath (−BG6) | 0 |
| −MM4 | bath open (−BG7) | bath covered (−BG8) | 1 |
| −MM5 stop | open (−BG15) | closed (−BG14) | depends on basket position |
| −MM6 separator | open (−BG17) | closed (−BG16) | depends on basket position |
| −MM8 tipper | down (−BG30) | tipped (−BG31) | 0 |

**−SF2 STOP** is wired as an NC contact (not pressed = 1). If your program expects an NO contact, clear the check box "STOP −SF2 wired as NC contact" (German: "STOP als Öffner") in the line operator panel. **−SF7 Stop**, −SF25, −SF32 and **−SF35** are also NC contacts, as are the E-stop signaling contacts `SFx_NotHalt_frei` (1 = released).

[◀ Back to overview](../README.en.md)
