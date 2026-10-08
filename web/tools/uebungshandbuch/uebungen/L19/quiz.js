// Kurz-Checks der Übung L19: ein = Eingangs-Check in Phase 1 (nur Vorwissen aus den vor-Übungen), aus = Abschluss-Check in Phase 6.
// Frage: [Frage, [Antwort 0, Antwort 1, Antwort 2], Index der richtigen Antwort, Begründung]
{ein:[
   ["Was bedeutet −KF2 = 0 für dein Programm aus L15?",["Not-Halt oder Schutzfeld verletzt: beide Betriebsarten sind 0.","Nur HAND ist aktiv.","Die Anlage soll starten."],0,"−KF2 meldet, ob das Sicherheitsrelais freigibt. Ohne Freigabe gibt es keine Betriebsart."],
   ["Wie lässt du eine Leuchte blinken, ohne einen Taktmerker zu verwenden (L04)?",["mit deinem FB Clock als Multiinstanz","mit dem Taktmerkerbyte der CPU","mit einem einzelnen TP-Impuls"],0,"Der Takt entsteht im Programm und wandert mit dem Baustein in jedes Projekt."]],
  aus:[
   ["Was schaltet die Anlage bei Not-Halt ab?",["das SPS-Programm über die Meldekontakte","das Sicherheitsrelais −KF2, unabhängig vom Programm","der Umrichter"],1,"Die Meldekontakte dienen nur der Diagnose. Abgeschaltet wird hart über −KF2."],
   ["Was ist ein Erstwert?",["die zuerst aufgetretene von mehreren Störungen","der erste Wert einer Messreihe","der Startwert eines Zählers"],0,"Folgemeldungen verdecken sonst die eigentliche Ursache."],
   ["Was ist nach DIN EN ISO 13850 das Rücksetzen des Not-Halt-Befehls am Gerät selbst?",["das Entriegeln des Tasters vor Ort","der nächste START","das Quittieren an −SF4"],0,"Entriegeln setzt den Not-Halt-Befehl zurück und darf nichts in Gang setzen. Das Quittieren an −KF2 ist die manuelle Rückstellung, danach braucht es noch einen Startbefehl."]]}
