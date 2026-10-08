// Kurz-Checks der Übung L15: ein = Eingangs-Check in Phase 1 (nur Vorwissen aus den vor-Übungen), aus = Abschluss-Check in Phase 6.
// Frage: [Frage, [Antwort 0, Antwort 1, Antwort 2], Index der richtigen Antwort, Begründung]
{ein:[
   ["Was meldet der Ausgang homePosition deines FC StartRelease aus L12?",["Alle Endlagen der Grundstellung sind erreicht.","Die Automatik läuft.","Ein Not-Halt ist gedrückt."],0,"homePosition ist eine reine Verknüpfung der gemeldeten Endlagen. Ein FC hat keinen Instanz-DB, seine Daten gelten nur während des Aufrufs. Für eine reine Verknüpfung genügt das."],
   ["Worauf verriegelst du in L14 eine Bewegung?",["auf die gemeldete Endlage, z. B. −BG3","auf den zuletzt gegebenen Befehl","auf eine feste Wartezeit"],0,"Nur die Endlage meldet, wo der Zylinder wirklich steht."]],
  aus:[
   ["−SA3 steht auf HAND. Wer darf Ventile bewegen?",["nur der Handbetrieb, die Automatik ruht","Handbetrieb und Schrittkette","nur die Schrittkette"],0,"Betriebsarten schließen sich aus. In HAND ruht die Automatik."],
   ["Du schaltest von HAND auf AUTO. Was darf dabei passieren?",["Die Anlage startet sofort den Zyklus.","Nichts bewegt sich. AUTO wartet auf Grundstellung und START.","Alle Zylinder fahren sofort in Grundstellung."],1,"Ein Betriebsartenwechsel ist kein Startbefehl."],
   ["Ein weiterer Baustein soll wissen, ob AUTO aktiv ist. Wie bekommt er das?",["über einen Eingang, den du im OB1 mit dem Ausgang modeAuto von ModeSelect verschaltest","er liest #statModeAuto im Instanz-DB von ModeSelect","er fragt −SA3 selbst ab"],0,"Der Siemens-Styleguide erlaubt den Datenaustausch nur über die Bausteinschnittstellen. So steht die Regel für AUTO an genau einer Stelle."]]}
