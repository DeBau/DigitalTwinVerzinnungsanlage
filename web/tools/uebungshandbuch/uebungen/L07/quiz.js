// Kurz-Checks der Übung L07: ein = Eingangs-Check in Phase 1 (nur Vorwissen aus den vor-Übungen), aus = Abschluss-Check in Phase 6.
// Frage: [Frage, [Antwort 0, Antwort 1, Antwort 2], Index der richtigen Antwort, Begründung]
{ein:[
  ["Wie viele Bits hat ein Wort, zum Beispiel %IW2?",["8","16","32"],1,"Ein Wort besteht aus zwei Bytes, also 16 Bit. %IW2 enthält %IB2 und %IB3 (L06)."],
  ["Welchen Wert hat 16#FF dezimal?",["255","256","15"],0,"F = 15, also 15 × 16 + 15 = 255. Das ist der größte Wert eines Bytes (L06)."],
  ["Welche Zeitangabe hast du in L04 für eine Zeit von 3 Sekunden geschrieben?",["T#3S","3","16#3"],0,"Zeiten schreibst du in TIA mit dem Präfix T#."],
  ["Welche Zahl zeigt das Anzeigeformat Dez für das Bitmuster 16#9100 (Datentyp Word)?",["37120","9100","−28416"],0,"16#91 × 256 + 16#00 = 145 × 256 = 37120. Dez zeigt die Bits als Zahl ohne Vorzeichen (L06)."]],
 aus:[
  ["%IW2 zeigt als Word 16#9100. Was zeigt dieselbe Adresse als Int?",["eine negative Zahl","37120","16#9100"],0,"Bit 15 ist gesetzt. Bei Int ist das das Vorzeichen, die Zahl ist negativ (−28416)."],
  ["Ein Übungszähler vom Typ Int steht auf 32767 und zählt mit ADD um 1 weiter. Was gilt?",["Er zeigt 32768.","Die ADD-Box meldet ENO = 0, auf den Wert am Ausgang darfst du dich nicht verlassen.","Er bleibt wie ein CTU bei 32767 stehen."],1,"32768 passt nicht in Int. Die Box meldet den Überlauf über ENO, wenn du ENO mit Rechtsklick, ENO generieren, erzeugt hast. Nur IEC-Zähler bleiben an der Grenze stehen."],
  ["Neue Stilregel: Welcher Datentyp passt für die Zahl der Körbe im Puffer von Band 1?",["Byte","Word","Int"],2,"Die Zahl der Körbe ist eine Menge, mit der du zählst und vergleichst. Mengen legst du als Int, DInt oder Real an, Bitmuster als Byte, Word oder DWord."],
  ["Warum zählst du Stückzahlen nicht in Real?",["Real kann keine ganzen Zahlen speichern.","Real ist nur auf etwa 6 Stellen genau, ab 16777216 gehen Zählschritte verloren.","Real ist langsamer als Int."],1,"16777216.0 + 1.0 ergibt wieder 16777216.0, ohne Fehlermeldung und mit ENO = 1."],
  ["TypeLab hat die IEC-Prüfung eingeschaltet. Welche Zeile übersetzt TIA nicht?",["#statSclInt := #statCountDInt; (DInt in Int)","#statCountDInt := #statCountInt; (Int in DInt)","#statSclInt := DINT_TO_INT(#statCountDInt);"],0,"DInt nach Int kann Werte abschneiden. Mit IEC-Prüfung musst du das ausdrücklich mit DINT_TO_INT oder CONVERT schreiben. Int nach DInt ist immer sicher."],
  ["Du wandelst mit CONVERT das Tasterbild handButtons (Byte) in eine Int-Zahl. Welchen Quelltyp wählst du in der Box?",["USInt","Byte","Word"],0,"Byte und Word sind in der CONV-Box nicht auswählbar. USInt ist ebenfalls 8 Bit lang, die Box liest das Byte dann als Zahl ohne Vorzeichen."]]}
