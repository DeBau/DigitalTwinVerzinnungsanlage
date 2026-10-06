// Einstieg für esbuild. Die Importe legen die Ladereihenfolge fest (Schichten): Ein Modul darf nur aus Modulen
// importieren, die hier vor ihm stehen. Danach starten die Seiteneffekte (Listener, Migrationen, route()).
import './app/daten.js';
import './app/basis.js';
import './app/fortschritt.js';
import './editor/svg.js';
import './editor/status.js';
import './editor/registry.js';
import './editor/vorlagen-svg.js';
import './editor/bauteile.js';
import './editor/bausteine.js';
import './editor/zeichnen.js';
import './editor/blaetter.js';
import './app/start.js';
import './app/skizzen-kacheln.js';
import './app/variablen.js';
import './app/uebung.js';
import './editor/auswahl.js';
import './editor/eigenschaften.js';
import './editor/anzeige.js';
import './editor/verlauf.js';
import './editor/beschriften.js';
import './editor/werkzeuge.js';
import './editor/bearbeiten.js';
import './editor/andocken.js';
import './editor/zeiger.js';
import './editor/oeffnen.js';
import './app/druck.js';
import './app/seiten.js';
// Vorlagen zuletzt: Sie melden sich nur in der Registry an und dürfen dafür alles aus dem Kern benutzen.
import './editor/vorlagen/alt.js';
import { init as init_app_tooltip } from './app/tooltip.js';
import { init as init_app_router } from './app/router.js';
import { init as init_app_ereignisse } from './app/ereignisse.js';
import { init as init_editor_ereignisse } from './editor/ereignisse.js';

init_editor_ereignisse();
init_app_ereignisse();
init_app_tooltip();
init_app_router();
