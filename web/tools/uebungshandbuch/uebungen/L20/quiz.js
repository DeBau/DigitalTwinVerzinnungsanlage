// Kurz-Checks der Übung L20: ein = Eingangs-Check in Phase 1 (nur Vorwissen aus den vor-Übungen), aus = Abschluss-Check in Phase 6.
// Frage: [Frage, [Antwort 0, Antwort 1, Antwort 2], Index der richtigen Antwort, Begründung]
{ein:[
   ["Was meldet −FA1 = 0?",["Der Motorschutz hat ausgelöst, oder die Leitung ist unterbrochen.","Das Band läuft.","Die Vor-Ort-Steuerstelle ist aktiv."],0,"Hilfskontakte melden 1 = OK, also drahtbruchsicher wie die Öffner aus L01."],
   ["In L16 schreibt CommandOutput die Ventile. Was liefert Manual?",["nur Handbefehle, die CommandOutput zusammenführt","eigene Ventilausgänge","nur Freigaben"],0,"Jeder Ausgang hat genau eine Schreibstelle in der Befehlsausgabe."]],
  aus:[
   ["Warum eine programmierte Verriegelung, obwohl die Schütze mechanisch verriegelt sind?",["Die SPS soll nie beide Richtungen gleichzeitig ansteuern; die Programmverriegelung ergänzt die mechanische.","Die mechanische Verriegelung wirkt nur in HAND.","Die programmierte Verriegelung ist überflüssig."],0,"Die Verriegelung im Programm ersetzt die mechanische und die elektrische Verriegelung (Hilfsöffner) nicht, sie verhindert aber, dass die SPS überhaupt einen widersprüchlichen Befehl ausgibt."],
   ["Halt −SF7 ist ein Öffner. Welchen KOP-Kontakt setzt du für „Halt nicht betätigt“?",["einen Schließerkontakt −| |−","einen Öffnerkontakt −|/|−","eine Spule"],0,"Im KOP fragst du den Signalzustand ab: nicht betätigt heißt Eingang 1, also Schließerkontakt."]]}
