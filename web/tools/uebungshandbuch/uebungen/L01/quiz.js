// Kurz-Checks der Übung L01: ein = Eingangs-Check in Phase 1 (nur Vorwissen aus den vor-Übungen), aus = Abschluss-Check in Phase 6.
// Frage: [Frage, [Antwort 0, Antwort 1, Antwort 2], Index der richtigen Antwort, Begründung]
{ein:[
  ["Wie viele Bits hat ein Byte?",["4","8","16"],1,"Ein Byte hat acht Bits. %I0.0 bis %I0.7 sind die acht Bits von Byte 0."],
  ["Ein Schließer ist nicht betätigt. Ist sein Kontakt offen oder geschlossen?",["offen","geschlossen","das hängt von der Spannung ab"],0,"Schließer schließen erst beim Betätigen. Unbetätigt sind sie offen."]],
 aus:[
  ["STOP −SF2 ist als Öffner verdrahtet. Welchen Pegel sieht die SPS, solange niemand drückt?",["0","1","hängt von der Betriebsart ab"],1,"Öffner sind unbetätigt geschlossen: 1 = nicht betätigt. Ein Drahtbruch wirkt wie Drücken, das ist die sichere Seite."],
  ["Was bewirkt das Forcen eines Eingangs im Signalmonitor des Zwillings?",["Der Eingang wird unabhängig vom Prozess fest auf 0 oder 1 gesetzt.","Die SPS geht in STOP.","Der zugehörige Ausgang wird gesperrt."],0,"Der Wert bleibt, bis du ihn mit A zurückgibst."],
  ["Was bedeutet die Adresse %I1.3?",["Eingang, Byte 1, Bit 3","Ausgang, Bit 13","Eingang Nummer 13"],0,"I = Eingang, dann Byte und Bit. Bei dieser Anlage ist %I1.3 der Taster START −SF1."]]}
