// Kurz-Checks der Übung L11: ein = Eingangs-Check in Phase 1 (nur Vorwissen aus den vor-Übungen), aus = Abschluss-Check in Phase 6.
// Frage: [Frage, [Antwort 0, Antwort 1, Antwort 2], Index der richtigen Antwort, Begründung]
{ein:[
  ["Welche Bytes belegt das Eingangswort %IW64?",["%IB64 und %IB65","nur %IB64","%IB63 und %IB64"],0,"Die Zahl hinter IW ist das erste Byte, ein Wort belegt zwei Bytes (L06)."],
  ["27648 × 400 wird in einer MUL-Box vom Typ Int gerechnet. Was passiert?",["Das Ergebnis stimmt.","Überlauf: ENO = 0, weil Int bei 32767 endet.","TIA rechnet automatisch in Real."],1,"So hast du es in L10 mit der Int-MUL-Box gesehen. 11 059 200 passt nur in DInt oder Real."]],
 aus:[
  ["Welcher Rohwert entspricht 200 °C bei 0 bis 27648 = 0 bis 400 °C?",["13824","20000","27648"],0,"200 °C ist die Hälfte des Bereichs, also die Hälfte von 27648."],
  ["−BT1 liefert plötzlich 32767. Was ist die wahrscheinlichste Ursache?",["Das Zinn ist 474 °C heiß.","Überlauf oder Drahtbruch, der Wert ist ungültig.","Die Heizung ist aus."],1,"32767 (16#7FFF) meldet die Baugruppe bei Überlauf, mit Diagnose bei 4 bis 20 mA auch bei Drahtbruch."],
  ["Warum brauchst du für −BT1 eine Testumschaltung im FB?",["Weil Analogwerte im Signalmonitor nicht forcebar sind und die Bridge gesteuerte Eingänge überschreibt.","Weil TIA keine Int-Werte steuern kann.","Weil der FB sonst nicht übersetzt wird."],0,"Mit #statTestMode und #statTestRaw testest du jeden Wert, auch außerhalb des Nennbereichs."],
  ["Für −PF2 „Bad bereit“ verknüpfst du −BG9 und bathTempOk mit …",["UND, denn eine Gutmeldung braucht beide Messwege","ODER, denn einer genügt","XOR"],0,"Für Gutmeldungen UND, für Warnungen ODER. So liegt ein Fehler in einem Messweg auf der sicheren Seite."]]}
