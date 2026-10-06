// Signalliste signale.csv lesen: {Kennzeichen: [{n: Name, a: Adresse, k: Kommentar}]}. Genutzt von build.mjs und den Tests.
import { readFileSync } from 'node:fs';
import path from 'node:path';

// signale.csv ist bewusst ohne Umlaute (Excel-fest); für die Anzeige werden die vorkommenden Wörter zurückgewandelt.
export const UM = {"Ausblasduese": "Ausblasdüse", "Ausschussbehaelter": "Ausschussbehälter", "Buegel": "Bügel", "Einhaengezylinder": "Einhängezylinder", "Foerderband": "Förderband", "Foerderrichtung": "Förderrichtung", "Fuellhoehe": "Füllhöhe", "Fuellstand": "Füllstand", "Kuehlplatz": "Kühlplatz", "Kuehlwassertank": "Kühlwassertank", "Oeffner": "Öffner", "Pruefband": "Prüfband", "Pruefstation": "Prüfstation", "Rueckmeldung": "Rückmeldung", "Schaltschranktuer": "Schaltschranktür", "Schliesser": "Schließer", "Schluesselschalter": "Schlüsselschalter", "Schuetz": "Schütz", "Spruehkuehlung": "Sprühkühlung", "Spruehventil": "Sprühventil", "Stellungsrueckmeldung": "Stellungsrückmeldung", "Uebergabe": "Übergabe", "Uebergabeplatz": "Übergabeplatz", "Umwaelzpumpe": "Umwälzpumpe", "Wendeschuetz": "Wendeschütz", "Zinn-Nachfuelleinrichtung": "Zinn-Nachfülleinrichtung", "betaetigt": "betätigt", "blaest": "bläst", "buendig": "bündig", "eingehaengt": "eingehängt", "einhaengen": "einhängen", "faehrt": "fährt", "geloest": "gelöst", "gueltig": "gültig", "laeuft": "läuft", "loesen": "lösen", "oeffnen": "öffnen", "oeffnet": "öffnet", "schliessen": "schließen", "schliesst": "schließt", "ueber": "über", "uebernommen": "übernommen", "vorwaerts": "vorwärts", "zurueck": "zurück", "Loesen": "Lösen", "Oeffnen": "Öffnen", "Schliessen": "Schließen", "Einhaengen": "Einhängen"};
export const umlaut = (t) => t.replace(/[A-Za-zÄÖÜäöüß-]+/g, (w) => UM[w] || w).replace(/ Grad C/g, ' °C').replace(/\.\.\./g, '…');

export function leseSignale(repo) {
  const sig = {};
  for (const line of readFileSync(path.join(repo, 'signale.csv'), 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || line.startsWith('Name;')) continue;
    const [n, a, ...k] = line.split(';');
    if (!a) continue;
    (sig[n.split('_')[0]] ||= []).push({ n, a, k: umlaut(k.join(';')) });
  }
  return sig;
}

