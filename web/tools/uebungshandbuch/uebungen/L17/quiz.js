// Kurz-Checks der Übung L17: ein = Eingangs-Check in Phase 1 (nur Vorwissen aus den vor-Übungen), aus = Abschluss-Check in Phase 6.
// Frage: [Frage, [Antwort 0, Antwort 1, Antwort 2], Index der richtigen Antwort, Begründung]
{ein:[
   ["Seit L16 liefert Manual nur noch Befehle. Wer schreibt die Ventile −MB1 bis −MB9?",["CommandOutput, als einzige Stelle","Manual und CommandOutput abwechselnd","jeder Baustein, der das Ventil braucht"],0,"Eine Schreibstelle je Ausgang: Alle Befehlsquellen laufen in der Befehlsausgabe zusammen."],
   ["Wann ist der Ausgang Q eines TON (L04) 1?",["wenn IN länger als PT ununterbrochen 1 ist","sofort, wenn IN 1 wird","wenn IN auf 0 fällt"],0,"Der TON ist eine Einschaltverzögerung. Fällt IN vorher ab, beginnt die Zeit von vorn."]],
  aus:[
   ["Neue Stilregel: Was gehört laut Siemens-Styleguide in jede CASE-Anweisung?",["ein ELSE-Zweig für unerwartete Werte","ein EXIT","ein Kommentar in jeder Zeile"],0,"Nur so landet die Kette bei einem ungültigen Schrittwert in einem festgelegten Zustand, statt stumm zu hängen."],
   ["Ab wann läuft die Tauchzeit in Schritt 6?",["mit dem Schrittwechsel","ab Erreichen von −BG4","ab dem Öffnen des Bades"],1,"Sonst frisst die Fahrzeit des Zylinders die Tauchzeit auf, und der Zwilling meldet „Korb mangelhaft“."],
   ["Was ist in GRAFCET eine Transition?",["eine Aktion, die im Schritt ausgeführt wird","die Bedingung für den Übergang zum nächsten Schritt","ein Speicherbaustein"],1,"Schritt, Transition, Schritt: immer im Wechsel."]]}
