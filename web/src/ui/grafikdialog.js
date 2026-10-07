import { $, renderer, UMGEBUNG, spiegelungSetzen } from '../core/szene.js';
import { Q, qualitaetSetzen } from '../core/grafik.js';
import { TS, tiefenschattenSetzen } from '../core/tiefenschatten.js';
import { t } from '../core/sprache.js';

// ----------------------------------------------------------------------------
// Grafik-Fenster: Der Knopf „Grafik“ in der unteren Leiste öffnet alle Grafikeinstellungen
// (Qualität, Spiegelungen, Tiefenschatten) und zeigt, auf welcher Grafikkarte der Browser rechnet.
// ----------------------------------------------------------------------------
const fenster = $('grafik-fenster'), knopf = $('btn-grafik');

// Grafikkarte aus der WebGL-Kennung, z. B. „ANGLE (NVIDIA, NVIDIA RTX 2000 … Direct3D11 …)“
function grafikkarte() {
  const gl = renderer.getContext(), info = gl.getExtension('WEBGL_debug_renderer_info');
  const kennung = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : '';
  const name = (kennung.match(/ANGLE \([^,]+, (.+?)(?: \(0x| Direct3D|,)/)?.[1] ?? kennung).replace(/\((R|TM)\)/g, '');
  const onboard = /Intel(?!.*Arc)|Microsoft Basic|SwiftShader|llvmpipe/i.test(kennung);
  return { name: name || t('unbekannt'), onboard };
}
function grafikkarteZeigen() {
  const { name, onboard } = grafikkarte(), feld = $('gf-gpu');
  feld.textContent = t`Grafikkarte: ${name}`;
  feld.classList.toggle('warnung', onboard);
  if (onboard) feld.textContent += ' – ' + t('Das ist die Onboard-Grafik. Hat der Rechner zusätzlich eine NVIDIA- oder AMD-Karte: Windows-Einstellungen → System → Anzeige → Grafik → Browser auf „Hohe Leistung“ stellen und den Browser neu starten.');
}

function anzeigen() {
  for (const b of $('gf-qualitaet').querySelectorAll('button')) b.setAttribute('aria-checked', b.dataset.modus === Q.modus);
  $('gf-spiegelung').checked = UMGEBUNG.spiegelung;
  $('gf-tiefenschatten').checked = TS.an;
}
// Über dem Knopf, linksbündig mit ihm, aber nie über den Fensterrand hinaus
function platzieren() {
  const r = knopf.getBoundingClientRect(), breite = fenster.offsetWidth;
  fenster.style.left = Math.max(8, Math.min(r.left, innerWidth - breite - 8)) + 'px';
  fenster.style.bottom = (innerHeight - r.top + 8) + 'px';
}
function oeffnen() {
  anzeigen(); grafikkarteZeigen();
  fenster.hidden = false; platzieren();
  knopf.setAttribute('aria-expanded', 'true');
}
function schliessen() {
  fenster.hidden = true;
  knopf.setAttribute('aria-expanded', 'false');
}

knopf.onclick = () => (fenster.hidden ? oeffnen() : schliessen());
$('grafik-zu').onclick = schliessen;
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !fenster.hidden) schliessen(); });
document.addEventListener('pointerdown', (e) => { if (!fenster.hidden && !fenster.contains(e.target) && !knopf.contains(e.target)) schliessen(); });
for (const b of $('gf-qualitaet').querySelectorAll('button')) b.onclick = () => { qualitaetSetzen(b.dataset.modus); anzeigen(); };
$('gf-spiegelung').onchange = (e) => spiegelungSetzen(e.target.checked);
$('gf-tiefenschatten').onchange = (e) => tiefenschattenSetzen(e.target.checked);
