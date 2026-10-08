// Kurz-Checks der Übung L18: ein = Eingangs-Check in Phase 1 (nur Vorwissen aus den vor-Übungen), aus = Abschluss-Check in Phase 6.
// Frage: [Frage, [Antwort 0, Antwort 1, Antwort 2], Index der richtigen Antwort, Begründung]
{ein:[
   ["Was liefert ein R_TRIG (L03) an seinem Ausgang Q?",["für genau einen Zyklus 1, wenn CLK von 0 auf 1 wechselt","1, solange CLK 1 ist","1, wenn CLK von 1 auf 0 wechselt"],0,"R_TRIG erkennt die steigende Flanke. Für die fallende Flanke gibt es F_TRIG."],
   ["Ein SR-Speicher in TIA (L03): S und R1 sind gleichzeitig 1. Was passiert?",["Er wird zurückgesetzt, R1 hat Vorrang.","Er wird gesetzt.","Er behält seinen bisherigen Wert."],0,"Beim SR ist der Rücksetzeingang dominant."]],
  aus:[
   ["Warum wird START als Flanke ausgewertet?",["Damit ein gehaltenes START im Einzelzyklus nicht mehrere Zyklen auslöst.","Weil START ein Öffner ist.","Damit der Not-Halt schneller wirkt."],0,"Die Flanke ist genau einen Zyklus lang 1, egal wie lange jemand drückt."],
   ["STOP im Dauerbetrieb während Schritt 6: Was soll passieren?",["sofortiger Halt aller Zylinder","Der laufende Korb wird fertig, dann Halt in Schritt 1.","Wechsel in den Handbetrieb"],1,"Ein halb verzinnter Korb wäre Ausschuss. Das sofortige Stillsetzen ist Aufgabe des Not-Halts."],
   ["Warum löschst du #statContinuous bei −KF2 = 0?",["Damit die Anlage nach dem Quittieren nicht von selbst wieder anläuft.","Damit −KF2 schneller freigibt.","Weil −SA1 sonst nicht mehr wirkt."],0,"Das Rücksetzen eines Not-Halts darf keinen Wiederanlauf einleiten. Weiter geht es erst mit einer neuen START-Flanke."]]}
