import * as THREE from 'three';

// ----------------------------------------------------------------------------
// Texturen (Canvas)
// ----------------------------------------------------------------------------
export function canvasTextur(w, h, zeichnen, wiederholen) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  zeichnen(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (wiederholen) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.userData.canvas = c;
  return t;
}
export const TEX = {
  // Hallenboden: versiegelter Industriebeton, matt; eine Kachel = 6 × 6 m mit Schnittfugen am Rand,
  // Körnung, wolkige Tönung und einzelne Flecken (Öl, Abrieb). Dunkel genug als Kontrast zur hellen Anlage.
  boden: canvasTextur(1024, 1024, (g, w, h) => {
    g.fillStyle = '#5b5d5c'; g.fillRect(0, 0, w, h);
    const wolke = (anzahl, rMin, rMax, staerke) => {
      for (let i = 0; i < anzahl; i++) {
        const x = Math.random() * w, y = Math.random() * h, r = rMin + Math.random() * (rMax - rMin);
        const gr = g.createRadialGradient(x, y, 0, x, y, r), v = Math.random() < 0.5 ? '255,255,255' : '0,0,0';
        gr.addColorStop(0, `rgba(${v},${staerke})`); gr.addColorStop(1, `rgba(${v},0)`);
        g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
      }
    };
    wolke(120, 80, 260, 0.06);                                   // Tönung der Betonfläche
    wolke(14, 20, 70, 0.12);                                     // Flecken
    for (let i = 0; i < 40000; i++) {                            // Körnung (Zuschlag)
      const v = Math.random() < 0.5 ? 255 : 0;
      g.fillStyle = `rgba(${v},${v},${v},${0.04 + Math.random() * 0.08})`;
      g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }
    g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(0, 0, w, 2); g.fillRect(0, 0, 2, h);   // Schnittfugen
  }, true),
  // Rauheit: gebürstetes Aluminium (Riefen in Längsrichtung = v)
  gebuerstet: canvasTextur(256, 256, (g, w, h) => {
    g.fillStyle = '#7a7a7a'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x++) { const v = 90 + Math.random() * 90 | 0; g.fillStyle = `rgba(${v},${v},${v},0.55)`; g.fillRect(x, 0, 1, h); }
  }, true),
  // Pulverbeschichtung: feine Orangenhaut (als Bump)
  pulver: canvasTextur(256, 256, (g, w, h) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) {
      const x = Math.random() * w, y = Math.random() * h, r = 1 + Math.random() * 2.5;
      g.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
      g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
  }, true),
  warnband: canvasTextur(256, 32, (g, w, h) => {
    g.fillStyle = '#f2b705'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1b1b1b';
    for (let x = -h; x < w + h; x += 32) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 16, h); g.lineTo(x + 16 + h, 0); g.lineTo(x + h, 0); g.fill(); }
  }, true),
  band: canvasTextur(64, 256, (g, w, h) => {
    g.fillStyle = '#25292d'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 8) { g.fillStyle = y % 16 ? '#2c3136' : '#1f2327'; g.fillRect(0, y, w, 4); }
  }, true),
  gitter: canvasTextur(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#ffffff'; g.lineWidth = 3;
    for (let i = 0; i <= w; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); }
  }, true),
  zinn: canvasTextur(256, 256, (g, w, h) => {
    g.fillStyle = '#c9cfd5'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      const x = Math.random() * w, y = Math.random() * h, r = 6 + Math.random() * 30;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      const v = Math.random() < 0.5 ? 255 : 150;
      gr.addColorStop(0, `rgba(${v},${v},${v},0.16)`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
  }, true),
  rauch: canvasTextur(64, 64, (g, w, h) => {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(235,235,235,0.55)'); gr.addColorStop(1, 'rgba(235,235,235,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }),
  heiss: canvasTextur(128, 112, (g) => {
    g.fillStyle = '#f2b705'; g.strokeStyle = '#111'; g.lineWidth = 8; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(64, 8); g.lineTo(122, 106); g.lineTo(6, 106); g.closePath(); g.fill(); g.stroke();
    g.lineWidth = 5;
    for (const x of [46, 64, 82]) { g.beginPath(); g.moveTo(x, 92); g.bezierCurveTo(x - 10, 80, x + 10, 70, x, 52); g.stroke(); }
    g.beginPath(); g.moveTo(34, 96); g.lineTo(94, 96); g.stroke();
  }),
  schild: (text, bg = '#e9ecef', fg = '#1b232c', w = 256, h = 64) => canvasTextur(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = fg; g.font = `600 ${Math.round(h * 0.5)}px "IBM Plex Sans Condensed", Arial, sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 1);
  }),
};
export const HALLE = { b: 22000, t: 18000, h: 8500, z: 1500 };
TEX.boden.repeat.set(HALLE.b / 6000, HALLE.t / 6000);
TEX.gebuerstet.repeat.set(0.004, 0.004);
TEX.pulver.repeat.set(2, 2);
TEX.zinn.repeat.set(1.2, 1.2);

