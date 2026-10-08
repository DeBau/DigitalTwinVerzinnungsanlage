// Kurz-Checks der Übung L14: ein = Eingangs-Check in Phase 1 (nur Vorwissen aus den vor-Übungen), aus = Abschluss-Check in Phase 6.
// Frage: [Frage, [Antwort 0, Antwort 1, Antwort 2], Index der richtigen Antwort, Begründung]
{ein:[
  ["Was passiert bei einem bistabilen Ventil, wenn du den Taster nach einem kurzen Tippen loslässt?",["Der Zylinder fährt bis in die Endlage weiter.","Der Zylinder bleibt sofort stehen.","Der Zylinder fährt zurück."],0,"Das bistabile Ventil bleibt geschaltet (L13)."],
  ["Welche Leuchte zeigt an, dass der Handbetrieb aktiv ist?",["−PF7","−PF1","−PF5"],0,"Manual schreibt −PF7 seit L13."]],
 aus:[
  ["Wann darf −MM3 verfahren werden?",["nur mit angehobenem Korb (−BG3)","nur bei offenem Bad","in HAND immer"],0,"Ein abgesenkter Korb würde gegen Band oder Badrand fahren."],
  ["Warum verriegelst du auf die Endlage −BG3 statt auf den letzten Befehl „anheben“?",["Der Befehl sagt nur, was gewollt war. Die Endlage meldet, was wirklich ist.","Weil Befehle nur einen Zyklus lang anstehen.","Das ist gleichwertig."],0,"Klemmt der Zylinder oder fehlt Druck, steht der Befehl an, aber der Korb ist nicht oben."],
  ["Die Freigabe für −MM4 abdecken lautet „Korb angehoben (−BG3) oder über dem Band (−BG5)“. Was passiert bei Drahtbruch an −BG3, während der Korb über dem Bad hängt?",["Die Freigabe fehlt, die Abdeckung fährt nicht.","Die Abdeckung fährt gegen den Korb.","Die CPU geht in STOP."],0,"Positiv formulierte Freigaben legen einen Sensorfehler auf die sichere Seite."],
  ["Warum ist Interlock ein FC?",["Er verknüpft nur die aktuellen Endlagen und muss sich nichts merken.","Weil Freigaben in FBs verboten sind.","Weil ein FC Merker nutzen darf."],0,"Faustregel aus L04: Ein FC hat keinen Instanz-DB, seine Daten liegen nur während des Aufrufs im temporären Speicher. Interlock braucht keine Werte aus dem letzten Zyklus, also genügt ein FC. Braucht ein Baustein solche Werte, nimmst du einen FB."]]}
