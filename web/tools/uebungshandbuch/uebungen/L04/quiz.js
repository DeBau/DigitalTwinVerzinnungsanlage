// Kurz-Checks der Übung L04: ein = Eingangs-Check in Phase 1 (nur Vorwissen aus den vor-Übungen), aus = Abschluss-Check in Phase 6.
// Frage: [Frage, [Antwort 0, Antwort 1, Antwort 2], Index der richtigen Antwort, Begründung]
{ein:[
  ["Wie lange liefert R_TRIG am Ausgang Q eine 1?",["einen Zyklus lang je steigender Flanke","solange CLK = 1 ist","bis zum Rücksetzen"],0,"R_TRIG meldet nur den Wechsel von 0 auf 1 (L03)."],
  ["Was bedeutet das Präfix inst in #instStartTrig?",["eine Instanz eines aufgerufenen FB im eigenen FB (Multiinstanz)","eine Eingangsvariable","eine globale Konstante"],0,"So hast du die Flanken in L03 benannt."],
  ["Wo behält ein FB Werte von einem Zyklus zum nächsten?",["in seinen statischen Variablen im Instanz-DB","in seinen Temp-Variablen","im Prozessabbild der Eingänge"],0,"Temp-Variablen gelten nur während des Aufrufs. Was den Zyklus überdauern muss, liegt unter Static im Instanz-DB (L03)."]],
 aus:[
  ["Welche Zeit verzögert das Einschalten, z. B. für die Tauchzeit?",["TON","TOF","TP"],0,"TON: Q wird erst nach PT 1, solange IN 1 bleibt."],
  ["Ein TOF mit PT = 5 s läuft nach, weil −BG40 abgefallen ist. Nach 2 s kommt ein neuer Korb. Was macht −PF4?",["bleibt durchgehend an","geht kurz aus und wieder an","geht nach weiteren 3 s aus"],0,"Wechselt IN vor Ablauf von PT wieder auf 1, wird die Zeit zurückgesetzt, und Q bleibt 1 (TIA-Hilfe TOF)."],
  ["Welche IEC-Zeit zählt Zeitabschnitte über Unterbrechungen hinweg zusammen?",["TONR","TON","TP"],0,"TONR (Zeit akkumulieren) behält ET, wenn IN 0 wird, und läuft beim nächsten IN = 1 weiter. Nur R setzt zurück."],
  ["Warum nimmst du für den Blinker nicht den Taktmerker der CPU?",["Er hängt an der Hardware-Konfiguration und läuft asynchron zum Zyklus; Siemens empfiehlt einen programmierten Taktgeber-Baustein.","Weil Taktmerker nur bei der S7-1200 gehen.","Weil ein Taktmerker nicht schneller als 0,5 Hz blinkt."],0,"Programmierleitfaden Kap. 4.3: programmierten Baustein als Taktgeber verwenden. Die TIA-Hilfe: Taktmerker laufen asynchron zum CPU-Zyklus."],
  ["Wie schreibst du eine halbe Sekunde als Konstante vom Datentyp Time?",["T#500ms","T#0,5","500"],0,"Time-Konstanten beginnen mit T#, dahinter Zahl und Einheit. Eine Zahl ohne Einheit ist kein Time-Wert."],
  ["−SF4 wird 5 s gehalten, der TP für den Lampentest hat PT = 2 s. Wie lange ist Q = 1?",["5 s","2 s","7 s"],1,"Der Impuls ist immer PT lang, unabhängig von der Dauer des Eingangs."],
  ["Ein TON läuft, IN wechselt auf 0. Was zeigt ET danach?",["0","den letzten Wert","PT"],0,"ET wird sofort zurückgesetzt. Wer messen will, kopiert ET vorher in eine statische Variable."],
  ["Neue Stilregel: Warum steht der Aufruf einer Zeit nicht in einer IF-Bedingung?",["Die Zeit bemerkt Änderungen an IN nur beim Aufruf und verpasst sonst Start oder Abbruch.","Weil IF in FUP nicht erlaubt ist.","Weil Zeiten sonst doppelt so schnell laufen."],0,"Rufe jede Zeit in jedem Zyklus auf und lege die Bedingung an IN."]]}
