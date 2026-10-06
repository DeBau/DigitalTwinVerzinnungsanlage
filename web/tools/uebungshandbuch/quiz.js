// Kurz-Checks je Übung. Wird von build.mjs in vorlage.html eingesetzt (Platzhalter __QUIZ__).
// ein = Eingangs-Check in Phase 1 (nur Vorwissen aus den vor-Übungen), aus = Abschluss-Check in Phase 6 (Transfer, darf Stoff der Übung abfragen)
// Frage: [Frage, [Antwort 0, Antwort 1, Antwort 2], Index der richtigen Antwort, Begründung]
({
 L01:{ein:[
   ["STOP −SF2 ist als Öffner verdrahtet. Welchen Pegel sieht die SPS, solange niemand drückt?",["0","1","hängt von der Betriebsart ab"],1,"Öffner sind unbetätigt geschlossen: 1 = nicht betätigt. Ein Drahtbruch wirkt wie Drücken. Das ist die sichere Seite."],
   ["Was bewirkt das Forcen eines Eingangs im Signalmonitor des Zwillings?",["Der Eingang wird unabhängig vom Prozess fest auf 0 oder 1 gesetzt.","Die SPS geht in STOP.","Der zugehörige Ausgang wird gesperrt."],0,"Mit „A“ gibst du das Signal wieder an das Modell zurück."]],
  aus:[]},
 L02:{ein:[
   ["−PF2 soll leuchten, wenn −BG9 UND −BG10 melden. Welche Verknüpfung in KOP?",["zwei Schließer in Reihe","zwei Schließer parallel","ein Öffner und ein Schließer parallel"],0,"Reihenschaltung = UND, Parallelschaltung = ODER."],
   ["−BG14 und −BG15 melden beide 1. Was zeigt XOR an?",["1: alles in Ordnung","0: unplausibel, ein Sensor stimmt nicht","1: Zylinder fährt"],1,"Ein Zylinder kann nicht gleichzeitig in beiden Endlagen stehen."]],
  aus:[]},
 L03:{ein:[
   ["START und STOP werden gleichzeitig gedrückt. Was muss die Anlage tun?",["einschalten","ausgeschaltet bleiben (rücksetzdominant)","den letzten Zustand halten"],1,"Bei Maschinen hat Aus immer Vorrang: rücksetzdominanter Speicher (in TIA die Box SR mit R1) bzw. STOP in Reihe vor der Selbsthaltung."],
   ["Wo speicherst du die Betriebsbereitschaft in einem modernen TIA-Programm?",["in einem globalen Merker","als statische Variable im FB (Instanz-DB)","in einer temporären Variable"],1,"Statische Variablen behalten ihren Wert über Zyklen und gehören zur Instanz. So bleibt der FB wiederverwendbar. Temporäre Variablen verlieren ihren Wert nach jedem Aufruf."]],
  aus:[]},
 L04:{ein:[
   ["Welche Zeit verzögert das Einschalten, z. B. die Tauchzeit?",["TON","TOF","TP"],0,"TON: Q wird erst nach PT 1, solange IN 1 bleibt."],
   ["−SF1 wird 5 s gehalten, TP hat PT = 2 s. Wie lange ist Q = 1?",["5 s","2 s","7 s"],1,"Der Impuls ist immer PT lang, unabhängig von der Dauer des Eingangs."]],
  aus:[]},
 L05:{ein:[
   ["Du zählst Körbe selbst: #statKoerbe := #statKoerbe + 1. Warum brauchst du dafür eine Flanke an −BG40?",["Sonst zählt das Programm in jedem Zyklus weiter, solange der Korb anliegt.","Weil −BG40 ein Öffner ist.","Weil Int-Variablen nur Flanken zählen."],0,"Ohne Flanke wird die Addition jeden Zyklus ausgeführt. Der IEC-Zähler CTU wertet CU bereits selbst flankengesteuert aus."],
   ["Welcher Zähler eignet sich für die Zahl der Körbe im Puffer?",["CTU","CTD","CTUD"],2,"Körbe kommen hinzu und gehen ab: Es wird vorwärts und rückwärts gezählt."]],
  aus:[]},
 L06:{ein:[
   ["27648 × 400 wird in Int gerechnet. Was passiert?",["Das Ergebnis stimmt.","Überlauf, denn der Bereich von Int endet bei 32767.","Es wird automatisch Real."],1,"11 059 200 passt nur in DInt oder Real."],
   ["Welcher Rohwert entspricht 200 °C bei 0 … 27648 = 0 … 400 °C?",["13824","20000","27648"],0,"Die Hälfte des Bereichs."]],
  aus:[]},
 L07:{ein:[
   ["Wie benennst du nach Siemens-Styleguide die statische Variable für die aktuelle Schrittnummer?",["#statStep","#M_Schritt","#Schritt_Akt"],0,"Präfix stat für Static, englisch, camelCase, ohne Unterstrich."],
   ["−PF3 soll leuchten, wenn …",["die Füllhöhe ausreicht.","die Füllhöhe unterschritten ist.","die Temperatur erreicht ist."],1,"−BG10 meldet 1 = in Ordnung. Die Leuchte zeigt den Mangel, also die Negation."],
   ["Welche Endlagen bilden die Grundstellung des Portals?",["−BG1, −BG3, −BG5, −BG7","−BG2, −BG4, −BG5, −BG8","−BG2, −BG3, −BG6, −BG8"],1,"−MM1 gelöst, −MM2 unten, −MM3 über dem Band, −MM4 abgedeckt."]],
  aus:[]},
 L08:{ein:[
   ["Warum braucht der Handtaster für −MM5 eine Selbsthaltung?",["Das 5/2-Ventil ist monostabil und fällt ohne Signal zurück.","Der Zylinder ist doppeltwirkend.","Wegen des Not-Halts."],0,"Bistabile Ventile (−MM1 bis −MM4) halten ihre Stellung auch ohne Signal."],
   ["−SF13 senken und −SF14 anheben werden gleichzeitig gedrückt. Was soll passieren?",["Keine Spule wird angesteuert.","Senken hat Vorrang.","Die zuletzt gedrückte Taste gewinnt."],0,"Gegenbefehle heben sich auf. Ein bistabiles Ventil bleibt dann einfach in seiner Stellung."]],
  aus:[]},
 L09:{ein:[
   ["Wann darf −MM3 verfahren werden?",["nur mit angehobenem Korb (−BG3)","nur bei offenem Bad","in HAND immer"],0,"Ein abgesenkter Korb würde gegen Band oder Badrand fahren."],
   ["Warum verriegelst du auf die Endlage −BG3 statt auf den letzten Befehl „anheben“?",["Der Befehl sagt nur, was gewollt war. Die Endlage meldet, was wirklich ist.","Weil Befehle nur einen Zyklus lang anstehen.","Das ist gleichwertig."],0,"Klemmt der Zylinder oder fehlt Druck, steht der Befehl an, aber der Korb ist nicht oben."]],
  aus:[]},
 L10:{ein:[
   ["−SA3 steht auf HAND. Wer darf Ventile bewegen?",["nur der Handbetrieb (über die Befehlsausgabe)","Handbetrieb und Schrittkette","nur die Schrittkette"],0,"Betriebsarten schließen sich aus. In HAND ruht die Automatik."],
   ["Du schaltest von HAND auf AUTO. Was darf dabei passieren?",["Die Anlage startet sofort den Zyklus.","Nichts bewegt sich. AUTO wartet auf Grundstellung und START.","Alle Zylinder fahren sofort in Grundstellung."],1,"Ein Betriebsartenwechsel ist kein Startbefehl."]],
  aus:[]},
 L11:{ein:[
   ["Derselbe Ausgang wird im Handbetrieb und in der Schrittkette zugewiesen. Was passiert?",["Die SPS meldet einen Fehler.","Die letzte Zuweisung im Zyklus gewinnt, die andere ist wirkungslos.","Beide werden ODER-verknüpft."],1,"Die SPS arbeitet das Programm von oben nach unten ab. Erst am Zyklusende wird das Prozessabbild ausgegeben, und zwar mit dem zuletzt geschriebenen Wert."],
   ["Wo gehört die Verriegelung „−MM3 nur mit angehobenem Korb“ hin?",["in die Befehlsausgabe, dann gilt sie für HAND und AUTO","nur in den Handbetrieb","in jeden Schritt der Kette"],0,"An einer Stelle gepflegt, wirkt sie für jede Betriebsart."]],
  aus:[]},
 L12:{ein:[
   ["Was gehört laut Siemens-Styleguide in jede CASE-Anweisung?",["ein ELSE-Zweig, der unerwartete Werte meldet","ein EXIT","ein Kommentar in jeder Zeile"],0,"Nur so fällt ein ungültiger Schrittwert auf, statt dass die Kette stillschweigend hängt."],
   ["Ab wann läuft die Tauchzeit in Schritt 6?",["mit dem Schrittwechsel","ab Erreichen von −BG4","ab dem Öffnen des Bades"],1,"Sonst frisst die Fahrzeit des Zylinders die Tauchzeit auf, und der Zwilling meldet dann „Korb mangelhaft“."],
   ["Was ist in GRAFCET eine Transition?",["eine Aktion, die im Schritt ausgeführt wird","die Bedingung für den Übergang zum nächsten Schritt","ein Speicherbaustein"],1,"Schritt, Transition, Schritt: immer im Wechsel."]],
  aus:[]},
 L13:{ein:[
   ["Warum wird START als Flanke ausgewertet?",["Damit ein gehaltenes START im Einzelzyklus nicht mehrere Zyklen auslöst.","Weil START ein Öffner ist.","Damit der Not-Halt schneller wirkt."],0,"Die Flanke ist genau einen Zyklus lang 1, egal wie lange jemand drückt."],
   ["STOP im Dauerbetrieb während Schritt 6: Was soll passieren?",["sofortiger Halt aller Zylinder","Der laufende Korb wird fertig, dann Halt in Schritt 1.","Wechsel in den Handbetrieb"],1,"Ein halb verzinnter Korb wäre Ausschuss. Das sofortige Stillsetzen ist Aufgabe des Not-Halts."]],
  aus:[]},
 L14:{ein:[
   ["Was schaltet die Anlage bei Not-Halt ab?",["das SPS-Programm über die Meldekontakte","das Sicherheitsrelais −KF2, unabhängig vom Programm","der Umrichter"],1,"Die Meldekontakte dienen nur der Diagnose. Abgeschaltet wird hart über −KF2."],
   ["Was ist ein Erstwert?",["die zuerst aufgetretene von mehreren Störungen","der erste Wert einer Messreihe","der Startwert eines Zählers"],0,"Folgemeldungen verdecken sonst die eigentliche Ursache."]],
  aus:[]},
 L15:{ein:[
   ["Warum eine programmierte Verriegelung, obwohl die Schütze mechanisch verriegelt sind?",["Die SPS soll nie beide Richtungen gleichzeitig ansteuern; die elektrische Verriegelung ergänzt die mechanische.","Die mechanische Verriegelung wirkt nur in HAND.","Die programmierte Verriegelung ist überflüssig."],0,"Mehrere unabhängige Ebenen sind ein Grundsatz jeder Wendeschaltung."],
   ["Was meldet −FA1 = 0?",["Der Motorschutz hat ausgelöst, oder die Leitung ist unterbrochen.","Das Band läuft.","Die Vor-Ort-Steuerstelle ist aktiv."],0,"Hilfskontakte melden 1 = OK, also auch hier drahtbruchsicher."]],
  aus:[]},
 L16:{ein:[
   ["Worauf schaltet die Kette am Übergabeplatz weiter?",["auf eine Wartezeit nach −BG11","auf −BG40 „Korb liegt an“","auf −BG12"],1,"Eine Wartezeit passt nur für genau eine Bandgeschwindigkeit."],
   ["Wann darf der Vereinzeler den nächsten Korb freigeben?",["sobald −BG11 frei ist","erst wenn der Anschlag geschlossen ist (−BG14)","sofort nach dem Anheben"],1,"Sonst läuft der nächste Korb durch den offenen Anschlag."]],
  aus:[]},
 L17:{ein:[
   ["Eine Drossel steht auf 0 %. Was passiert?",["Der Zylinder fährt doppelt so schnell.","Der Zylinder steht.","Nichts."],1,"Ideal, um Überwachungszeiten zu testen. 50 % ist die Nennzeit."],
   ["Eine zu knapp gewählte Überwachungszeit führt zu …",["Fehlalarmen bei normalen Schwankungen.","späterer Fehlererkennung.","höherer Taktzeit."],0,"Eine zu lange Zeit erkennt Fehler dagegen spät. Deshalb gilt: Fahrzeit mal Sicherheitsfaktor."]],
  aus:[]},
 L18:{ein:[
   ["Wann bewegt sich ein Korb an einer Übergabe?",["wenn der aufnehmende Förderer läuft","nur wenn beide Förderer in dieselbe Richtung laufen","wenn die Lichtschranke frei ist"],1,"Der Korb liegt an der Stoßstelle auf beiden Förderern."],
   ["Wie überbrückst du die Lücke zwischen zwei Lichtschranken am robustesten?",["mit einem gespeicherten Übergabe-Zustand: gesetzt am abgebenden, zurückgesetzt am aufnehmenden Sensor","mit einer längeren Bandlaufzeit","gar nicht"],0,"Ein gespeicherter Zustand ist unabhängig von der Geschwindigkeit."]],
  aus:[]},
 L19:{ein:[
   ["Wie viel Bandweg entspricht ein Impuls von −BG18?",["10 mm","24,5 mm","245 mm"],1,"10 Impulse je Umdrehung, 245 mm je Umdrehung."],
   ["Woran erkennst du die Drehrichtung?",["an der Pulsfrequenz","am Pegel von Spur B bei steigender Flanke von A","am Nullimpuls"],1,"Vorwärts: B = 1 bei steigender Flanke A."]],
  aus:[]},
 L20:{ein:[
   ["Warum läuft die Pumpe vor dem Sprühventil an?",["Das Ventil wirkt nur bei laufender Pumpe. So steht Druck an, wenn es öffnet.","Um Strom zu sparen.","Wegen des Luftmessers."],0,"Reihenfolge der Aggregate: erst Versorgung, dann Verbraucher."],
   ["27648 am Analogeingang −BT2 entspricht …",["100 °C","400 °C","27,6 °C"],1,"0 bis 27648 = 0 bis 400 °C."]],
  aus:[]},
 L21:{ein:[
   ["Wie lange ist das Prüfergebnis −BG28 / −BG29 gültig?",["0,3 s","3 s","bis zum nächsten Trigger"],0,"Wer zu spät liest, verliert das Ergebnis."],
   ["Wozu ein FIFO für die Ausblaszeitpunkte?",["Mehrere Teile können gleichzeitig zwischen Kamera und Düse liegen.","Die Kamera ist langsam.","Die Düse ist monostabil."],0,"Jedes Teil braucht seinen eigenen Ausblaszeitpunkt."]],
  aus:[]},
 L22:{ein:[
   ["−BG39 meldet 0. Was kann das bedeuten?",["Tank voll oder Drahtbruch","Tank leer","Pumpe läuft"],0,"Ruhestromprinzip: Beides führt zur sicheren Seite, also nicht nachspeisen."],
   ["Wozu gibt −BG38 die Pumpe frei?",["Trockenlaufschutz","Überlaufschutz","Frostschutz"],0,"Unter 8 % zieht die Pumpe Luft."]],
  aus:[]},
 L23:{ein:[
   ["Was verhindert die Hysterese beim Zweipunktregler?",["ständiges Ein- und Ausschalten um einen Schaltpunkt","eine bleibende Regelabweichung","einen Überlauf"],0,"Ohne Hysterese flattert das Ventil."],
   ["Welche Bausteine rechnen 0 bis 27648 in Prozent um?",["NORM_X und SCALE_X","TON und TOF","MOVE und CONV"],0,"NORM_X normiert auf 0,0 bis 1,0, SCALE_X skaliert auf den Bereich."]],
  aus:[]},
 L24:{ein:[
   ["Wie viel Heizleistung braucht das Bad ungefähr für 280 °C?",["50 %","76 %","100 %"],1,"100 % ergeben 360 °C im Beharrungszustand."],
   ["Was beschreibt ein PT1-Glied?",["eine Strecke erster Ordnung mit Verzögerung","eine reine Totzeit","eine integrierende Strecke"],0,"Hier hintereinander: Heizelement 6 s, Bad 150 s."]],
  aus:[]},
 L25:{ein:[
   ["Der Kühlwassertank ist eine … Strecke.",["integrierende (ohne Ausgleich)","PT1-","PT2-"],0,"Der Pegel ändert sich, solange Zu- und Abfluss ungleich sind."],
   ["Warum bleibt beim P-Regler mit offenem Ablasshahn eine Abweichung?",["Er braucht eine Regelabweichung, um den Zulauf für den Abfluss zu liefern.","Der Sensor ist ungenau.","Die Stellzeit ist zu lang."],0,"Der I-Anteil liefert diesen Zulauf auch bei Abweichung null."]],
  aus:[]},
 L26:{ein:[
   ["Wie lange braucht −MB18 für 0 bis 100 %?",["1 s","8 s","15 s"],1,"Daraus folgt eine Überwachungszeit deutlich über 8 s."],
   ["Wozu dient die Stellungsrückmeldung %IW74?",["zum Vergleich mit dem Stellwert, um ein klemmendes Ventil zu erkennen","als Istwert der Regelung","zur Füllstandsmessung"],0,"Stellwert und Rückmeldung müssen nach der Stellzeit übereinstimmen."]],
  aus:[]},
 L27:{ein:[
   ["Was darf im TO_SpeedAxis für den Zwilling nicht aktiviert sein?",["Simulation / virtuelle Achse","Rampen","MC_Reset"],0,"Sonst schreibt das Technologieobjekt kein Telegramm."],
   ["16#4000 im NSOLL_A von −TA2 entspricht …",["100 % = 1500 1/min = 100 mm/s","50 %","der Maximaldrehzahl 2250 1/min"],0,"Bezugsdrehzahl p2000 = 1500 1/min."]],
  aus:[]},
 L28:{ein:[
   ["Welches Steuerwort holt den Antrieb aus der Einschaltsperre?",["16#047F","16#047E (AUS1 = 0)","16#0000"],1,"Erst danach führt 16#047F in den Betrieb."],
   ["Was bewirkt AUS2?",["Halt mit Rampe","Impulssperre, der Antrieb trudelt aus","Schnellhalt"],1,"AUS1 = Rampe, AUS3 = Schnellhalt."]],
  aus:[]},
 L29:{ein:[
   ["Das Poti −SF47 steht auf 27648. Welcher NSOLL_A?",["16#2000","16#4000","27648"],1,"27648 = 100 %, und 100 % sind beim Telegramm 16#4000 = 16384."],
   ["Warum NIST_A für die Ausblaszeit?",["Die tatsächliche Geschwindigkeit bestimmt die Laufzeit, auch während der Rampen.","NSOLL_A ist nicht lesbar.","NIST_A ist genauer skaliert."],0,"Sollwert und Istwert unterscheiden sich beim Hoch- und Rücklauf."]],
  aus:[]},
 L30:{ein:[
   ["Welches ZSW1-Bit meldet eine Störung?",["Bit 3","Bit 6","Bit 9"],0,"Bit 6 = Einschaltsperre, Bit 9 = Führung gefordert."],
   ["Warum lässt sich F07011 nicht sofort quittieren?",["Der Motor muss erst abkühlen.","STO ist aktiv.","Das Telegramm fehlt."],0,"Eine thermische Störung bleibt, bis die Ursache weg ist."]],
  aus:[]},
 L31:{ein:[
   ["Welche Reihenfolge entspricht systematischer Fehlersuche?",["Symptom → Hypothese → Test → Ursache","Ursache → Test → Symptom","Tauschen, bis es geht"],0,"Jeder Test soll eine Hypothese bestätigen oder ausschließen."],
   ["Womit belegst du eine kürzere Taktzeit?",["mit den Messlinien von Schrittwechsel 2 bis Schrittwechsel 1","mit dem Eindruck beim Zuschauen","mit der CPU-Zykluszeit"],0,"Messen statt schätzen."]],
  aus:[]},
 L32:{ein:[
   ["Wohin gehören globale Daten im Abschlussprojekt?",["in einen Schnittstellen-DB","als globale Merker quer durchs Programm","in den OB1"],0,"So bleiben die Bausteine austauschbar und testbar."],
   ["Wer macht die Anlage sicher?",["das SPS-Programm","die Sicherheitstechnik (−KF2, STO)","das HMI"],1,"Das Programm macht sie bedienbar und diagnostizierbar."]],
  aus:[]}
})
