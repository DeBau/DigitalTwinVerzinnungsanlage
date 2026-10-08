// Kurz-Checks der Übung L08: ein = Eingangs-Check in Phase 1 (nur Vorwissen aus den vor-Übungen), aus = Abschluss-Check in Phase 6.
// Frage: [Frage, [Antwort 0, Antwort 1, Antwort 2], Index der richtigen Antwort, Begründung]
{ein:[
  ["Welche Hex-Zahl hat das Bitmuster 2#0000_1100?",["16#0C","16#12","16#C0"],0,"0000 = 0, 1100 = C. Das hast du in L06 geübt."],
  ["Welcher Datentyp passt für das Bitbild der acht Handtaster?",["Byte","Int","Real"],0,"Bitmuster legst du als Byte oder Word an (Stilregel aus L07)."],
  ["Wie lange ist der Ausgang Q eines R_TRIG nach einer steigenden Flanke an CLK 1?",["genau einen Zyklus","solange CLK 1 ist","eine Sekunde"],0,"Das hast du in L03 gelernt. Im Lauflicht schiebst du nur bei dieser Flanke."]],
 aus:[
  ["%IB3 = 16#8D. Was liefert %IB3 AND 16#0C?",["16#0C","16#8D","16#81"],0,"AND lässt nur die Bits durch, die in der Maske 1 sind: Bit 2 und Bit 3 sind in 16#8D gesetzt."],
  ["Was liefert ROL 16#81 um eine Stelle?",["16#03","16#02","16#C0"],0,"Bit 7 fällt links heraus und kommt rechts wieder herein: 2#0000_0011."],
  ["Wie löschst du in einem Byte Bit 2 und Bit 3 und lässt alle anderen Bits stehen?",["Wert AND 16#F3","Wert OR 16#0C","Wert XOR 16#F3"],0,"16#F3 ist die umgedrehte Maske 16#0C (INVERT). AND mit 0 löscht ein Bit, AND mit 1 lässt es stehen."],
  ["Mit welcher Schreibweise liest du Bit 1 der Byte-Variablen #handButtons?",["#handButtons.%X1","#handButtons[1]","#handButtons AND 1"],0,"Das ist der Slice-Zugriff. Die Nummer 0 meint das niederwertigste Bit, .%X1 ist also das Bit von −SF12."],
  ["Warum schreibst du das Lauflicht nicht mit einer Maske direkt auf %QB1?",["Weil −PF1 bis −PF5 dann zwei Schreibstellen hätten: ihre Zuweisung in Indication und die Byte-Zuweisung.","Weil TIA keine Byte-Ausgänge kennt.","Weil AND auf Ausgänge nicht erlaubt ist."],0,"Eine Zuweisung an %QB1 schreibt alle acht Ausgänge. Die Maske bestimmt nur den Wert, nicht, wer schreibt."],
  ["Neue Stilregel: Wie schreibst du die Maske für Bit 0 bis Bit 3 einer Word-Variable?",["15","16#F","16#000F"],2,"Bitmuster schreibst du als Hex-Konstante mit allen Stellen. Ein Word hat vier Hex-Ziffern."]]}
