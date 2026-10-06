// Test des Schaltplans ohne Browser:
//   node web/tools/uebungshandbuch/pruefen/tests/schaltplan.mjs
// Prüft: jedes Signal aus signale.csv genau einmal im Plan, alle Querverweise zeigen auf vorhandene Seiten und Spalten,
// kein Text ragt aus der Zeichenfläche, jeder Kontakt eines Schützes oder Relais findet seine Spule,
// Klemmenplan vollständig, jede Versorgung definiert, Analogkanäle mit Hin- und Rückleiter.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { leseSignale } from '../../signale.mjs';
import { ladeSchaltplan } from '../../schaltplan-node.mjs';

const hier = path.dirname(fileURLToPath(import.meta.url));
const basis = path.resolve(hier, '../..'), repo = path.resolve(basis, '../../..');
const esbuild = createRequire(path.join(repo, 'web/package.json'))('esbuild');
const sp = await ladeSchaltplan(esbuild);

const fehler = [];
const pruefe = (bedingung, meldung) => { if (!bedingung) fehler.push(meldung); };

const sig = leseSignale(repo);
const modell = sp.aufbereiten(JSON.parse(readFileSync(path.join(basis, 'schaltplan.json'), 'utf8')), sig);
fehler.push(...sp.pruefe(modell, sp.SYM));
const { seiten, index } = sp.zeichnePlan(modell);
const anzahlSignale = Object.values(sig).flat().length;

pruefe(index.signale.size === anzahlSignale, `Index kennt ${index.signale.size} von ${anzahlSignale} Signalen`);
for (const s of seiten) {
  for (const m of s.svg.matchAll(/data-ref="(\d+)\.(\d+)"/g)) {
    pruefe(+m[1] >= 1 && +m[1] <= seiten.length && +m[2] <= 9, `Seite ${s.nr}: Verweis /${m[1]}.${m[2]} zeigt ins Leere`);
  }
  const inhalt = s.svg.slice(s.svg.indexOf('class="sp-zeichnung"'), s.svg.lastIndexOf('</g>'));
  for (const m of inhalt.matchAll(/<text x="([\d.-]+)" y="([\d.-]+)"/g)) {
    pruefe(+m[2] < 768 && +m[2] > 26 && +m[1] > 30 && +m[1] < 1178, `Seite ${s.nr} (${s.titel}): Text bei ${m[1]}/${m[2]} außerhalb der Fläche`);
  }
  pruefe(!/undefined|NaN|\? \w/.test(s.svg), `Seite ${s.nr}: undefined, NaN oder unbekanntes Zeichen im Bild`);
}
for (const [bmk, orte] of index.orte) {
  const hatKontakt = orte.some(e => e.rolle === 'kontakt'), istGeraet = /^−(QA|KF)\d/.test(bmk);
  if (hatKontakt && istGeraet) pruefe(orte.some(e => e.rolle === 'haupt'), `${bmk}: Kontakt ohne Spule im Plan`);
}

// Klemmenplan vollständig: jede gezeichnete Klemme steht in der Liste und umgekehrt
const imPlan = new Set(modell.klemmen.map(z => z.klemme));
const gezeichnet = new Set([...index.orte.keys()].filter(k => /^−X\d+:\d+$/.test(k)));
for (const a of modell.leistung) for (const g of a.glieder) {
  if (g.sym === 'klemme3') g.nummern.filter(Boolean).forEach(n => gezeichnet.add(`−X1:${n}`));
}
for (const seite of modell.pfadseiten) for (const p of seite.pfade) if (p.peKlemme) gezeichnet.add(p.peKlemme);
for (const k of gezeichnet) pruefe(imPlan.has(k), `Klemme ${k} gezeichnet, fehlt im Klemmenplan`);
for (const k of imPlan) pruefe(gezeichnet.has(k), `Klemme ${k} im Klemmenplan, aber nicht gezeichnet`);

// Versorgung: jeder Kanal hängt an einem Potenzial, das im Plan definiert ist
const fundstellen = (i, bmk) => i.orte.get(bmk) || [];
const definiert = name => fundstellen(index, name).some(e => e.rolle === 'haupt');
for (const k of modell.kanaele) pruefe(k.versorgung && definiert(k.versorgung), `${k.adr}: Versorgung ${k.versorgung} nicht definiert`);
for (const [bmk, pot] of Object.entries(modell.plan.speisung || {})) pruefe(definiert(pot), `${bmk}: Speisung ${pot} nicht definiert`);

// Analogkanäle: Hin- und Rückleiter mit eigener Klemme im Plan
for (const k of modell.kanaele.filter(k => k.analog)) {
  pruefe(k.klemme && k.klemmeSeite && k.klemme !== k.klemmeSeite, `${k.adr}: Hin- oder Rückleiter ohne eigene Klemme`);
  pruefe(index.orte.has(k.klemme) && index.orte.has(k.klemmeSeite), `${k.adr}: Klemme nicht gezeichnet`);
}

console.log(`Schaltplan: ${seiten.length} Seiten, ${index.orte.size} Kennzeichen, ${index.signale.size} Signale`);
if (fehler.length) { console.log(`${fehler.length} Fehler:\n  ` + fehler.slice(0, 60).join('\n  ')); process.exit(1); }
console.log('✓ alle Prüfungen bestanden');
