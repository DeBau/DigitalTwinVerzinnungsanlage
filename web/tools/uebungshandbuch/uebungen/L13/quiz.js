// Kurz-Checks der Übung L13: ein = Eingangs-Check in Phase 1 (nur Vorwissen aus den vor-Übungen), aus = Abschluss-Check in Phase 6.
// Frage: [Frage, [Antwort 0, Antwort 1, Antwort 2], Index der richtigen Antwort, Begründung]
{ein:[
  ["Wo speichert ein FB einen Zustand, der den Zyklus überleben soll?",["als statische Variable im Instanz-DB","in einer Temp-Variable","im Prozessabbild der Ausgänge"],0,"So hast du es in L03 gelernt."],
  ["Was zeigt dir die Querverweisliste zu einem Ausgang?",["jede Stelle, an der er gelesen oder geschrieben wird","seinen aktuellen Wert","seine Verdrahtung im Schaltschrank"],0,"Damit prüfst du, dass jeder Ausgang genau eine Schreibstelle hat (L02)."]],
 aus:[
  ["Warum speichert Manual die Stellung des Anschlags −MM5 in #statStopperOpen?",["Das 5/2-Ventil −MB9 ist monostabil und fällt ohne Signal in die Ruhestellung zurück.","Der Zylinder ist doppeltwirkend.","Wegen des Not-Halts."],0,"Bistabile Ventile (−MM1 bis −MM4) halten ihre Stellung auch ohne Signal."],
  ["−SF13 senken und −SF14 anheben werden gleichzeitig betätigt. Was soll passieren?",["Keine Spule wird angesteuert.","Senken hat Vorrang.","Die zuletzt gedrückte Taste gewinnt."],0,"Gegenbefehle heben sich auf. Ein bistabiles Ventil bleibt dann einfach in seiner Stellung."],
  ["Ein bistabiles Ventil wird kurz angetippt. Was macht der Zylinder?",["Er fährt bis in die Endlage.","Er bleibt sofort stehen, wenn du loslässt.","Er fährt zurück."],0,"Der Schieber bleibt nach dem Impuls in seiner Lage. Anhalten im Hub ginge nur mit einem 5/3-Ventil."]]}
