import { SCHALT_AUS, SCHALT_EIN, st } from './zustand.js';
import { ereignis } from '../ui/ereignisse.js';
import { wirksam } from './eingaenge.js';

// ----------------------------------------------------------------------------
// Pneumatik-Modell: 5/2-Ventil bistabil, Schaltverzug + Druckaufbau,
// Beschleunigung, Endlagendämpfung, Last, Nutsensoren mit Hysterese
// ----------------------------------------------------------------------------
export function zylinderBewegen(c, dt, { xMax = c.hub, gesperrt = false, sperrText = '', last = 1 } = {}) {
  const y14 = c.mono ? c.befehl() : wirksam(c.aus), y12 = c.mono ? !y14 : wirksam(c.ein);   // monostabil: Feder schaltet zurück
  let neu = c.ventil;
  if (y14 && !y12) neu = 1;
  else if (y12 && !y14) neu = -1;                 // beide/keine Spule: Ventil bleibt (bistabil)
  if (neu !== c.ventil) { c.ventil = neu; c.verz = 0.035 + 0.02 * Math.random(); }
  const dir = c.ventil;
  if (c.verz > 0) { c.verz -= dt; c.v *= 0.6; }
  else {
    const ziel = dir > 0 ? c.hub : 0;
    const rest = Math.abs(ziel - c.x);
    const vNenn = c.hub / c.zeit * st.speed * last;
    const daempf = Math.min(25, c.hub * 0.15);
    const vMax = rest < daempf ? vNenn * Math.max(0.18, rest / daempf) : vNenn;
    const vZiel = rest < 0.01 ? 0 : dir * vMax;
    const a = vNenn / 0.09;                       // ca. 90 ms bis zur Nenngeschwindigkeit
    c.v += Math.max(-a * dt, Math.min(a * dt, vZiel - c.v));
    if (gesperrt && c.v * dir > 0) { if (rest > 0.5) ereignis(sperrText, 'err', sperrText); c.v = 0; }
  }
  c.x += c.v * dt;
  if (c.x <= 0) { c.x = 0; if (c.v < 0) c.v = 0; }
  if (c.x >= c.hub) { c.x = c.hub; if (c.v > 0) c.v = 0; }
  if (c.x > xMax) {
    if (c.v > 0 && dir > 0) ereignis(sperrText, 'err', sperrText);
    c.x = Math.max(xMax, c.x - c.v * dt); c.v = 0;
  }
  c.an0 = c.an0 ? c.x <= SCHALT_AUS : c.x <= SCHALT_EIN;
  c.an1 = c.an1 ? c.hub - c.x <= SCHALT_AUS : c.hub - c.x <= SCHALT_EIN;
}

