// Kurz-Checks der Übung L06: ein = Eingangs-Check in Phase 1 (nur Vorwissen aus den vor-Übungen), aus = Abschluss-Check in Phase 6.
// Frage: [Frage, [Antwort 0, Antwort 1, Antwort 2], Index der richtigen Antwort, Begründung]
{ein:[
  ["Wie viele Bits hat ein Byte?",["8","4","16"],0,"Ein Byte hat acht Bits. %I0.0 bis %I2.7 sind deshalb drei Bytes mit 24 Eingängen (L01)."],
  ["Was bedeutet die Adresse %I3.5?",["Eingang, Byte 3, Bit 5","Eingang Nummer 35","Ausgang, Byte 3, Bit 5"],0,"I steht für Eingang, dann folgen Byte und Bit. Bei dieser Anlage ist %I3.5 der Handtaster −SF16 (L01)."],
  ["STOP −SF2 ist ein Öffner. Welchen Pegel sieht die SPS, solange niemand drückt?",["0","1","das hängt von der Betriebsart ab"],1,"Ein Öffner ist unbetätigt geschlossen und meldet 1. Das steht in deiner Wertetabelle aus L01."]],
 aus:[
  ["In der Beobachtungstabelle zeigt %IB3 den Wert 16#81. Welche Handtaster sind betätigt?",["−SF11 und −SF18","−SF11, −SF12 und −SF18","−SF12 und −SF17"],0,"16#81 = 2#1000_0001: Bit 7 (%I3.7 = −SF18) und Bit 0 (%I3.0 = −SF11)."],
  ["Welche Bytes enthält das Eingangswort %IW2, und welches steht vorn?",["%IB2 und %IB3, %IB2 vorn","%IB2 und %IB3, %IB3 vorn","%IB1 und %IB2, %IB2 vorn"],0,"Die Zahl hinter IW ist das erste Byte. Bei SIMATIC ist das Byte mit der kleineren Nummer das höherwertige und steht links."],
  ["Was ist 2#1100_1000 dezimal?",["200","192","72"],0,"128 + 64 + 8 = 200. In Hex ist das 16#C8."],
  ["Welche Schreibweise erkennt TIA als Hexadezimalzahl?",["16#53","2#53","H53"],0,"Das Präfix 16# steht für hexadezimal, 2# für binär. 2#53 gibt es nicht, denn binär gibt es nur die Ziffern 0 und 1."],
  ["Welches Byte haben %IW1 und %IW2 gemeinsam?",["%IB2","%IB1","keines"],0,"%IW1 belegt %IB1 und %IB2, %IW2 belegt %IB2 und %IB3. Deshalb ist −BG12 (%I2.5) in %IW1 Bit 5, in %IW2 aber Bit 13."],
  ["Welches Anzeigeformat stellt TIA in der Beobachtungstabelle für ein Byte von selbst ein?",["Hex","Dez","Bin"],0,"Bei BYTE steht Hex in der Liste der Anzeigeformate an erster Stelle, und das zuerst genannte Format ist voreingestellt."],
  ["Du steuerst %IB3 in der Beobachtungstabelle auf 16#FF. Was passiert?",["Die CPU liest im nächsten Zyklus die Eingänge neu ein, dein Wert ist sofort wieder weg.","Alle Handtaster bleiben auf 1, bis du den Wert zurücksetzt.","Die Handtaster am Zwilling leuchten auf."],0,"Eingänge kommen am Anfang jedes Zyklus neu ins Prozessabbild. Zum Testen forcst du deshalb im Signalmonitor, steuern kannst du nur Variablen wie labByte, die niemand schreibt."],
  ["Du willst labByte (Byte) mit 256 steuern. Was passiert?",["TIA nimmt den Wert nicht an, labByte behält seinen Wert.","labByte zeigt 0.","labByte zeigt 255."],0,"In 8 Bit passen nur 0 bis 255 (16#00 bis 16#FF). 256 braucht ein neuntes Bit."]]}
