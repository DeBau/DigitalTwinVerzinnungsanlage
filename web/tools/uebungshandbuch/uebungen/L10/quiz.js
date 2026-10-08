// Kurz-Checks der Übung L10: ein = Eingangs-Check in Phase 1 (nur Vorwissen aus den vor-Übungen), aus = Abschluss-Check in Phase 6.
// Frage: [Frage, [Antwort 0, Antwort 1, Antwort 2], Index der richtigen Antwort, Begründung]
{ein:[
  ["Ein Übungszähler vom Typ Int steht auf 32767 und wird mit ADD um 1 erhöht. Woran erkennst du den Fehler in FUP?",["ENO der ADD-Box ist 0","Die CPU geht in STOP","Der Zähler bleibt bei 32767 stehen"],0,"Das hast du in L07 mit dem Übungszähler ausprobiert."],
  ["Was zeigt der Ausgang ET einer TON-Zeit?",["die bisher abgelaufene Zeit","die eingestellte Zeit PT","die Uhrzeit"],0,"ET ist die abgelaufene Zeit (L04). ET wird 0, sobald IN 0 wird."]],
 aus:[
  ["Der Tageszähler steht auf 23, ein Wartungshinweis kommt alle 10 Körbe. Was liefert 23 MOD 10?",["2","3","2,3"],1,"MOD liefert den Rest der Ganzzahldivision. Bis zum nächsten Hinweis sind es also noch 7 Körbe."],
  ["Warum rechnest du den Füllgrad als Belegung × 100 / 5 und nicht als Belegung / 5 × 100?",["Weil die Ganzzahldivision den Rest abschneidet und 4 / 5 schon 0 ergibt.","Weil MUL schneller ist als DIV.","Weil TIA die Reihenfolge sonst nicht übersetzt."],0,"Erst multiplizieren, dann teilen, und dafür einen Datentyp wählen, in den das Zwischenergebnis passt."],
  ["ROUND(2.5) ergibt in TIA …",["2","3","2.5"],0,"Genau in der Mitte rundet ROUND zur geraden Zahl."],
  ["Eine DIV-Box vom Typ Int teilt 3600 durch 0. Was liefert sie laut TIA-Hilfe?",["OUT = 0 und ENO = 1, also keine Warnung","ENO = 0","Die CPU geht in STOP."],0,"Die Box warnt nicht. Deshalb prüfst du den Teiler vorher mit IF, z. B. IF (#statCycleNumber &gt; 0) THEN."],
  ["Was rechnet SCL bei <code>#MAINT_INTERVAL - #dayCount MOD #MAINT_INTERVAL</code> zuerst?",["MOD, denn MOD hat Rang 4 und wird vor der Subtraktion (Rang 5) gerechnet","die Subtraktion, denn sie steht links","beides gleichzeitig"],0,"*, / und MOD kommen vor + und -. Eine Klammer macht es trotzdem für jeden Leser klar."],
  ["Wie prüfst du, ob die mittlere Taktzeit (Real) passt?",["mit einem Bereich: zwischen der unteren und der oberen Grenze","mit = 50.0","mit &lt;&gt; 0.0"],0,"Real-Werte sind fast nie genau gleich. Die TIA-Hilfe empfiehlt für Real IN_RANGE statt CMP ==."],
  ["Neue Stilregel: Wie schreibst du die Zahl der Plätze auf Band 1 im Code?",["als lokale Konstante #BUFFER_PLACES","als Zahl 5","als globaler Merker"],0,"Ein Name erklärt die Zahl, der Wert steht an einer Stelle im Baustein."]]}
