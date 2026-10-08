// Kurz-Checks der Übung L22: ein = Eingangs-Check in Phase 1 (nur Vorwissen aus den vor-Übungen), aus = Abschluss-Check in Phase 6.
// Frage: [Frage, [Antwort 0, Antwort 1, Antwort 2], Index der richtigen Antwort, Begründung]
{ein:[
   ["Eine Drossel steht auf 0 %. Was passiert mit dem Zylinder?",["Er fährt doppelt so schnell.","Er steht.","Nichts ändert sich."],1,"Ideal, um Überwachungszeiten zu testen. 50 % ist die Nennzeit."],
   ["Was zeigt der Ausgang ET eines TON (L04)?",["die abgelaufene Zeit, solange IN 1 ist","die eingestellte Zeit PT","die Zeit seit dem letzten Zyklus"],0,"Mit ET kannst du die SPS Fahrzeiten selbst messen lassen."]],
  aus:[
   ["Eine zu knapp gewählte Überwachungszeit führt zu …",["Fehlalarmen bei normalen Schwankungen.","späterer Fehlererkennung.","höherer Taktzeit."],0,"Eine zu lange Zeit erkennt Fehler dagegen spät. Deshalb gilt: gemessene Fahrzeit mal Sicherheitsfaktor."],
   ["Welcher Schritt bekommt keine Laufzeitüberwachung?",["der Initialschritt, der auf START wartet","Schritt 4, zum Zinnbad fahren","Schritt 9, absenken"],0,"Warten ist keine Störung. Überwacht wird nur eine befohlene Bewegung."],
   ["Du drückst −SF4, um eine Laufzeitstörung zu quittieren. Was passiert zusätzlich?",["−SF4 setzt auch das Sicherheitsrelais −KF2 zurück, falls es abgeschaltet hatte.","Die Anlage startet sofort neu.","Nichts, −SF4 wirkt nur auf dein Programm."],0,"−SF4 ist parallel auf den Start von −KF2 verdrahtet. Danach läuft trotzdem nichts von selbst an."]]}
