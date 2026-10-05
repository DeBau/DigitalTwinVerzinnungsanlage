// Englische Texte – Prozess und Demo-SPS: Ereignismeldungen, Verriegelungen, Störungen.
// Schlüssel = deutscher Text wie im Quelltext (Leerraum egal), Werte in Vorlagen als {0}, {1} …
export default {
  // --- Orte der Not-Halt- und Quittiertaster (logik/zustand.js: NOT_HALT, QUITT) ---
  'Bedienpult': 'Operator panel',
  'Band 1': 'Conveyor 1',
  'Band 2': 'Conveyor 2',
  'Rollenkurve': 'Roller curve',
  'Prüfstation': 'Inspection station',
  'am Bedienpult': 'at the operator panel',
  'an −S10': 'at −S10',
  'an −S20': 'at −S20',
  'an −S30': 'at −S30',
  'an −S40': 'at −S40',

  // --- Not-Halt, Sicherheitsrelais −KF2, Lichtvorhang (logik/prozess.js) ---
  'Lichtvorhang −BG20 unterbrochen: −KF2 hat Ventile, Schütze und Heizung abgeschaltet': 'Light curtain −BG20 interrupted: −KF2 has switched off valves, contactors and heater',
  'NOT-HALT {0}: Sicherheitsrelais −KF2 hat Ventile, Schütze und Heizung abgeschaltet': 'E-STOP {0}: safety relay −KF2 has switched off valves, contactors and heater',
  'NOT-HALT {0} betätigt (−KF2 hat bereits abgeschaltet)': 'E-STOP {0} pressed (−KF2 has already switched off)',
  'Not-Halt quittiert {0} ({1}): −KF2 gibt wieder frei': 'E-stop acknowledged {0} ({1}): −KF2 enables again',
  'Quittieren nicht möglich: Not-Halt {0} ist noch verriegelt': 'Cannot acknowledge: E-stop {0} still latched',
  'Quittieren nicht möglich: Schutzfeld des Lichtvorhangs ist nicht frei': 'Cannot acknowledge: protective field of the light curtain is not clear',

  // --- Zylinder: Verriegelungen und Kollisionen ---
  'Kollision: −MM2 senkt auf die geschlossene Badabdeckung (−BG7 fehlt)': 'Collision: −MM2 lowers onto the closed bath cover (−BG7 missing)',
  'Kollision: −MM2 senkt auf den Badrand (−MM3 nicht in Endlage)': 'Collision: −MM2 lowers onto the bath rim (−MM3 not in end position)',
  'Verriegelung: −MM3 fährt nicht, Tauchzylinder −MM2 ist nicht oben (−BG3)': 'Interlock: −MM3 does not move, dip cylinder −MM2 is not up (−BG3)',
  'Kollision: Abdeckung −MM4 stößt an den abgesenkten Korb': 'Collision: cover −MM4 hits the lowered basket',
  'Kippen gesperrt: Korb steht nicht am Endanschlag der Mulde (−BG33)': 'Tipping blocked: basket is not at the end stop of the trough (−BG33)',

  // --- Zinnbad und Körbe am Tauchplatz ---
  'Zinnbad überfüllt: Nachfüllen −MB11 nicht rechtzeitig beendet': 'Tin bath overfilled: refill −MB11 not stopped in time',
  'Korb {0} unverzinnt abgelegt': 'Basket {0} set down untinned',
  'Korb {0} verzinnt · Tauchzeit {1} s · Abtropfzeit {2} s': 'Basket {0} tinned · dip time {1} s · drip time {2} s',
  'Korb {0} mangelhaft · Tauchzeit {1} s · Abtropfzeit {2} s': 'Basket {0} defective · dip time {1} s · drip time {2} s',
  'Korb {0} ist ins Zinnbad gefallen (−MM1 über dem Bad gelöst)': 'Basket {0} fell into the tin bath (−MM1 released above the bath)',
  'Korb {0} abgeworfen (−MM1 nicht über dem Band gelöst)': 'Basket {0} dropped (−MM1 not released above the conveyor)',
  'Bandanfang belegt, Korb später auflegen': 'Conveyor start occupied, place the basket later',

  // --- Förderer: Wendeschütze und Übergaben ---
  'Wendeschütz: Rechts- und Linkslauf gleichzeitig angesteuert (mechanisch verriegelt)': 'Reversing contactor: forward and reverse energized simultaneously (mechanically interlocked)',
  'Wendeschütz Band 2: Rechts- und Linkslauf gleichzeitig angesteuert': 'Reversing contactor conveyor 2: forward and reverse energized simultaneously',
  'Wendeschütz Rollenkurve: Rechts- und Linkslauf gleichzeitig angesteuert (mechanisch verriegelt)': 'Reversing contactor roller curve: forward and reverse energized simultaneously (mechanically interlocked)',
  'Wendeschütz Muldenrollen: Vor- und Rücklauf gleichzeitig angesteuert (mechanisch verriegelt)': 'Reversing contactor trough rollers: forward and backward energized simultaneously (mechanically interlocked)',
  'Korb {0} kommt mit {1} °C zum Kipper (nicht ausreichend abgeschreckt)': 'Basket {0} reaches the tipper at {1} °C (not sufficiently quenched)',
  'Korb {0} hängt an der Übergabe Band 2 → Kippmulde: Band 2 (−QA5) und Muldenrollen (−QA12) müssen laufen': 'Basket {0} stuck at transfer conveyor 2 → tipping trough: conveyor 2 (−QA5) and trough rollers (−QA12) must both run',
  'Korb {0} hängt an der Übergabe Rollenkurve → Band 2: Band 2 (−QA5) läuft nicht mit': 'Basket {0} stuck at transfer roller curve → conveyor 2: conveyor 2 (−QA5) is not running',
  'Korb {0} hängt an der Übergabe Band 1 → Rollenkurve: beide Förderer (−QA1 und −QA10) müssen laufen': 'Basket {0} stuck at transfer conveyor 1 → roller curve: both conveyors (−QA1 and −QA10) must run',

  // --- Entleer- und Prüfstation ---
  'Leerkorb {0} vom Kipper abgenommen': 'Empty basket {0} removed from the tipper',
  'Kamera −KF10 ausgelöst, aber kein Teil im Bild': 'Camera −KF10 triggered, but no part in view',
  'KLT mit {0} i.O.-Teilen getauscht': 'KLT bin with {0} OK parts replaced',
  'Teil neben den Trichter gefallen': 'Part fell beside the hopper',
  'Gutteil ausgeblasen (Ausblasen zur falschen Zeit)': 'Good part blown off (blow-off at the wrong time)',
  'KLT übervoll: −BG34 nicht beachtet': 'KLT bin overfull: −BG34 ignored',
  'n.i.O.-Teil im i.O.-KLT (nicht ausgeblasen)': 'NOK part in the OK KLT bin (not blown off)',
  'Korb {0} geprüft: {1} i.O. im KLT, {2} n.i.O. ausgeschleust': 'Basket {0} inspected: {1} OK in KLT bin, {2} NOK rejected',
  ', {0} neben den Trichter gefallen': ', {0} fell beside the hopper',
  // --- Umrichter −TA2 ---
  // --- Umrichter −TA2…−TA5 ---
  '{0} jetzt am Umrichter −{1} (PROFINET, Standardtelegramm 1)': '{0} now on drive −{1} (PROFINET, standard telegram 1)',
  '{0} jetzt an den Schützen {1}': '{0} now on contactors {1}',
  'Umrichter −{0}: Störung F30005 Leistungsteil Überlast I2t': 'Drive −{0}: fault F30005 power unit overload I2t',
  'Umrichter −{0}: Kaltleiter im Motor {1} hat angesprochen (F07011)': 'Drive −{0}: PTC in motor {1} has responded (F07011)',
  'Motor {0} abgekühlt: F07011 lässt sich quittieren': 'Motor {0} cooled down: F07011 can be acknowledged',
  'Umrichter −{0}: HAND – das Bedienpanel führt, das Telegramm der SPS ist ohne Wirkung': 'Drive −{0}: HAND – the operator panel is in control, the PLC telegram has no effect',
  'Umrichter −{0}: AUTO – Führung wieder über PROFINET': 'Drive −{0}: AUTO – control via PROFINET again',
};
