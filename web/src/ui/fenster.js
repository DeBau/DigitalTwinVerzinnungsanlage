// Fenster am Kopf verschieben (bleibt im sichtbaren Bereich), Esc schließt
export function fensterVerschiebbar(fenster, kopf) {
  let start = null;
  kopf.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, select, label')) return;
    const r = fenster.getBoundingClientRect();
    start = { x: e.clientX - r.left, y: e.clientY - r.top };
    kopf.setPointerCapture(e.pointerId);
  });
  kopf.addEventListener('pointermove', (e) => {
    if (!start) return;
    const r = fenster.getBoundingClientRect();
    fenster.style.left = Math.max(0, Math.min(innerWidth - 120, e.clientX - start.x)) + 'px';
    fenster.style.top = Math.max(0, Math.min(innerHeight - 40, e.clientY - start.y)) + 'px';
    fenster.style.width = r.width + 'px'; fenster.style.height = r.height + 'px';
  });
  kopf.addEventListener('pointerup', () => { start = null; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !fenster.hidden) fenster.hidden = true; });
}
