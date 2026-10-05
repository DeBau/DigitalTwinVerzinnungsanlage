
// ----------------------------------------------------------------------------
// Bandförderer
//  Band 1 (Zuführung, läuft in +z, Übergabeplatz zum Haken bei z = 0, Bandende vorn an der Rollenkurve)
//  Rollenkurve −MA6 (angetriebene 90°-Kurvenrollenbahn mit konischen Rollen, Übergabe Band 1 → Band 2)
//  Band 2 (Abtransport, läuft in +x nach rechts, Kühlstrecke, Kamera-Prüfplatz, Entnahme)
// Im Übungsumfang „automatisch“ steuert sich das Bandmodul selbst, sonst die SPS.
// ----------------------------------------------------------------------------
export const BAND_Y = 300, TROMMEL_R = 36;
// Rollenkurve: Mittellinie mit Radius R um den Punkt (R, zA); Anfang (0, zA) in +z, Ende (R, zA + R) in +x.
// Bahn 254 mm zwischen den Seitenwangen, Innenradius ca. 300 mm, Länge der Mittellinie L = R·π/2
export const KURVE = { R: 420, zA: 1100, L: 0, v: 0, vSoll: 110, a: 300, wende: 0, fu: false, weg: 0, vorOrt: { r: false, l: false }, rollen: [] };
KURVE.L = KURVE.R * Math.PI / 2;
export const B1 = { z0: -850, z1: KURVE.zA - 20 }; B1.L = B1.z1 - B1.z0; B1.zm = (B1.z0 + B1.z1) / 2;
export const B2 = { x0: KURVE.R + 5, x1: 2820, z: KURVE.zA + KURVE.R }; B2.L = B2.x1 - B2.x0; B2.xm = (B2.x0 + B2.x1) / 2;
// Gurtweg in mm (Obertrum, + = Förderrichtung): BAND.weg / BAND2.weg
export const BAND = { weg: 0, v: 0, vSoll: 100, a: 250, wende: 0, fu: false, sensorAus: {}, vorOrt: { r: false, l: false }, trommeln: [], anschlag: null, vereinzeler: null, anschlagPos: 1, vereinzelerPos: 0, stecker: {} };
export const BAND2 = { weg: 0, v: 0, vSoll: 120, a: 300, wende: 0, fu: false, vorOrt: { r: false, l: false }, trommeln: [], halt: 0, pruefT: 0, ergebnis: null, ergebnisT: 0, triggerAlt: false, pumpe: 0, spruehen: 0, blasen: 0 };

export const BAND_ENDE = 720, KORB_TEILUNG = 150;
// Strahlpositionen der Lichtschranken (Korbmitte unter dem Strahl; das Signal ist 1, solange der Korbkörper ±55 mm den Strahl
// unterbricht). Band 1: z, Rollenkurve: Bogenlänge s, Band 2: x. An jeder Übergabe eine Lichtschranke kurz vor dem Ende des
// abgebenden und eine kurz nach dem Anfang des aufnehmenden Förderers; an der Kurve zwischen zwei Tragrollen (Teilung π/2 / 14).
export const LS_POS = {
  BG12_Bandanfang: -700, BG11_Korb: 0, BG13_Bandende: 1005,
  BG35_Kurve_Anfang: KURVE.R * Math.PI / 28, BG36_Kurve_Ende: KURVE.L - KURVE.R * Math.PI / 28,
  BG21_B2_Anfang: 505, BG22_B2_Kuehlung: 1300, BG24_B2_Ende: 2740,
};
