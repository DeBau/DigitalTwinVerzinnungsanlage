// Kurz-Checks der Übung L02: ein = Eingangs-Check in Phase 1 (nur Vorwissen aus den vor-Übungen), aus = Abschluss-Check in Phase 6.
// Frage: [Frage, [Antwort 0, Antwort 1, Antwort 2], Index der richtigen Antwort, Begründung]
{ein:[
  ["Was bedeutet die Adresse %I1.0?",["Eingang, Byte 1, Bit 0","Ausgang 10","Eingang Nummer 10"],0,"I steht für Eingang, dann folgen Byte und Bit (L01). %I1.0 ist −BG9."],
  ["Wo legst du fest, dass %I1.0 den Namen BG9_Temperatur trägt?",["in der PLC-Variablentabelle","im Signalmonitor des Zwillings","in der Forcetabelle"],0,"Die PLC-Variablentabelle ordnet jeder Adresse Namen, Datentyp und Kommentar zu (L01)."]],
 aus:[
  ["−PF2 soll leuchten, wenn −BG9 UND −BG10 melden. Welche Schaltung in KOP?",["zwei Schließer in Reihe","zwei Schließer parallel","ein Öffner und ein Schließer parallel"],0,"Reihenschaltung = UND, Parallelschaltung = ODER."],
  ["−BG14 und −BG15 melden beide 1. Was liefert XOR?",["1: alles in Ordnung","0: unplausibel, ein Sensor stimmt nicht","1: Zylinder fährt"],1,"Ein Zylinder kann nicht gleichzeitig in beiden Endlagen stehen."],
  ["Neue Stilregel: Ein Ausgang wird an zwei Stellen geschrieben. Was erreicht die Leuchte?",["der Wert der letzten Zuweisung im Zyklus","der Wert der ersten Zuweisung","das ODER beider Zuweisungen"],0,"Am Zyklusende zählt nur, was zuletzt im Prozessabbild steht. Deshalb gehört alles in eine Zuweisung."],
  ["Neue Stilregel: Warum schreibst du \"BG9_Temperatur\" statt %I1.0?",["Der Name sagt, was das Signal bedeutet, und eine geänderte Adresse änderst du nur in der Variablentabelle.","Adressen sind in TIA verboten.","Namen werden schneller bearbeitet."],0,"Symbolische Namen machen das Programm lesbar und wartbar."],
  ["Neue Stilregel: Was gehört in den Bausteinkopf?",["Zweck, Autor, Version und Änderungen","die Zykluszeit der CPU","die Adressen aller Eingänge"],0,"Der Kopf beschreibt den Baustein für den nächsten Leser."]]}
