// ============================================================================
//  ZwillingBridge - Kopplung PLCSIM Advanced <-> Digitaler Zwilling (Browser)
// ----------------------------------------------------------------------------
//  - liest die Ausgaenge (%Q / %A) der virtuellen CPU ueber die PLCSIM-Advanced-API
//  - schreibt die Eingaenge (%I / %E) aus dem Zwilling direkt ins Prozessabbild
//  - stellt die Weboberflaeche (Ordner ..\web) und einen WebSocket unter /ws bereit
//
//  Bewusst C# 5 (kompilierbar mit dem csc.exe, das in jedem Windows mit
//  .NET Framework 4.x enthalten ist) - es muss kein Visual Studio installiert sein.
//
//  Aufruf:  ZwillingBridge.exe [Instanzname] [Port] [Mindestzykluszeit_ms]
//           Standard: Instanz "Zinnbad", Port 8181, 10 ms (0 = Projektwert lassen)
// ============================================================================
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.WebSockets;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Script.Serialization;

namespace ZwillingBridge
{
    // ------------------------------------------------------------------------
    // Einstieg: hier darf noch KEIN Siemens-Typ vorkommen, damit der
    // AssemblyResolve-Handler registriert ist, bevor die API-DLL gebraucht wird.
    // ------------------------------------------------------------------------
    static class Program
    {
        const string ApiDllName = "Siemens.Simatic.Simulation.Runtime.Api.x64";

        static int Main(string[] args)
        {
            Console.OutputEncoding = Encoding.UTF8;
            Console.Title = "Zwilling-Bridge";
            AppDomain.CurrentDomain.AssemblyResolve += ApiAufloesen;
            try
            {
                return Starten(args);
            }
            catch (Exception ex)
            {
                Log.Fehler("Unerwarteter Fehler: " + ex);
                Console.WriteLine("Taste druecken zum Beenden ...");
                Console.ReadKey();
                return 1;
            }
        }

        [MethodImpl(MethodImplOptions.NoInlining)]
        static int Starten(string[] args)
        {
            return Bridge.Run(args);
        }

        // Sucht die API-DLL im Installationsverzeichnis von PLCSIM Advanced
        // (hoechste vorhandene API-Version gewinnt).
        static Assembly ApiAufloesen(object sender, ResolveEventArgs e)
        {
            if (!e.Name.StartsWith(ApiDllName, StringComparison.OrdinalIgnoreCase)) return null;

            var kandidaten = new List<string>();
            var env = Environment.GetEnvironmentVariable("PLCSIMADV_API_DLL");
            if (!string.IsNullOrEmpty(env) && File.Exists(env)) kandidaten.Add(env);

            var basen = new[] {
                Environment.GetFolderPath(Environment.SpecialFolder.CommonProgramFiles),
                Environment.GetFolderPath(Environment.SpecialFolder.CommonProgramFilesX86)
            };
            foreach (var b in basen.Distinct())
            {
                var apiDir = Path.Combine(b, @"Siemens\PLCSIMADV\API");
                if (!Directory.Exists(apiDir)) continue;
                var versionen = Directory.GetDirectories(apiDir)
                    .Select(d => new { Dir = d, Ver = VersionAus(Path.GetFileName(d)) })
                    .OrderByDescending(x => x.Ver);
                foreach (var v in versionen)
                {
                    var f = Path.Combine(v.Dir, ApiDllName + ".dll");
                    if (File.Exists(f)) kandidaten.Add(f);
                }
            }
            foreach (var k in kandidaten)
            {
                try
                {
                    Log.Info("Lade PLCSIM-Advanced-API: " + k);
                    return Assembly.LoadFrom(k);
                }
                catch (Exception ex) { Log.Warnung("Konnte " + k + " nicht laden: " + ex.Message); }
            }
            Log.Fehler("PLCSIM-Advanced-API nicht gefunden. Ist S7-PLCSIM Advanced installiert? " +
                       "Pfad ggf. per Umgebungsvariable PLCSIMADV_API_DLL angeben.");
            return null;
        }

        static Version VersionAus(string s)
        {
            Version v;
            return Version.TryParse(s, out v) ? v : new Version(0, 0);
        }
    }

    // ------------------------------------------------------------------------
    static class Log
    {
        static readonly object sync = new object();
        static void Schreiben(ConsoleColor c, string prefix, string text)
        {
            lock (sync)
            {
                var alt = Console.ForegroundColor;
                Console.ForegroundColor = c;
                Console.WriteLine(DateTime.Now.ToString("HH:mm:ss") + " " + prefix + text);
                Console.ForegroundColor = alt;
            }
        }
        public static void Info(string t) { Schreiben(ConsoleColor.Gray, "    ", t); }
        public static void Ok(string t) { Schreiben(ConsoleColor.Green, "OK  ", t); }
        public static void Warnung(string t) { Schreiben(ConsoleColor.Yellow, "!   ", t); }
        public static void Fehler(string t) { Schreiben(ConsoleColor.Red, "XX  ", t); }
    }

    // ------------------------------------------------------------------------
    class Signal
    {
        public string Name;
        public string Adresse;      // wie in der CSV angegeben
        public string Kommentar;
        public bool IstAusgang;     // true = %Q/%A (SPS -> Zwilling), false = %I/%E (Zwilling -> SPS)
        public uint ByteAdr;
        public byte BitAdr;
        public bool Wert;           // letzter gelesener (Ausgang) bzw. gewuenschter (Eingang) Wert
        public bool IstWort;        // %IW/%QW (Int, 16 Bit, Big Endian wie in der S7)
        public short WortWert;
        public IoBlock Block;       // Puffer, in dem dieses Signal liegt
        public int Off;             // Lage im Puffer
    }

    // Ein zusammenhaengendes Stueck Prozessabbild. Die PLCSIM-Advanced-API braucht
    // fuer ein ganzes Byte-Stueck genauso lange wie fuer ein einzelnes Bit - deshalb
    // wird je Block genau ein Aufruf gemacht statt einer je Signal.
    class IoBlock
    {
        public uint Start;
        public byte[] Daten;
        public byte[] Zuletzt;      // zuletzt in die SPS geschriebener Stand (nur Eingaenge)

        public bool Geaendert()
        {
            if (Zuletzt == null) return true;
            for (int i = 0; i < Daten.Length; i++) if (Daten[i] != Zuletzt[i]) return true;
            return false;
        }
        public void Gemerkt()
        {
            if (Zuletzt == null) Zuletzt = new byte[Daten.Length];
            Buffer.BlockCopy(Daten, 0, Zuletzt, 0, Daten.Length);
        }
    }

    static class SignalListe
    {
        static readonly Regex AdrRegex = new Regex(@"^%?\s*([IQEA])\s*(\d+)\.([0-7])$", RegexOptions.IgnoreCase);
        static readonly Regex WortRegex = new Regex(@"^%?\s*([IQEA])W\s*(\d+)$", RegexOptions.IgnoreCase);

        // Kommentar = alles ab der dritten Spalte: ein Semikolon im Kommentartext gehoert zum Kommentar
        static string KommentarAus(string[] teile)
        {
            return teile.Length > 2 ? string.Join(";", teile, 2, teile.Length - 2).Trim() : "";
        }

        public static List<Signal> Laden(string datei)
        {
            var liste = new List<Signal>();
            var zeilen = File.ReadAllLines(datei, Encoding.UTF8);
            for (int i = 0; i < zeilen.Length; i++)
            {
                var z = zeilen[i].Trim();
                if (z.Length == 0 || z.StartsWith("#")) continue;
                var teile = z.Split(';');
                if (teile[0].Trim().Equals("Name", StringComparison.OrdinalIgnoreCase)) continue;
                if (teile.Length < 2) { Log.Warnung("signale.csv Zeile " + (i + 1) + ": zu wenige Spalten"); continue; }

                var w = WortRegex.Match(teile[1].Trim());
                if (w.Success)
                {
                    var b = char.ToUpperInvariant(w.Groups[1].Value[0]);
                    liste.Add(new Signal
                    {
                        Name = teile[0].Trim(),
                        Adresse = teile[1].Trim(),
                        Kommentar = KommentarAus(teile),
                        IstAusgang = b == 'Q' || b == 'A',
                        IstWort = true,
                        ByteAdr = uint.Parse(w.Groups[2].Value, CultureInfo.InvariantCulture)
                    });
                    continue;
                }
                var m = AdrRegex.Match(teile[1].Trim());
                if (!m.Success)
                {
                    Log.Warnung("signale.csv Zeile " + (i + 1) + ": Adresse '" + teile[1] +
                                "' nicht unterstuetzt (Bool z.B. %I0.0 / %Q1.3, Wort z.B. %IW64 / %QW64)");
                    continue;
                }
                var bereich = char.ToUpperInvariant(m.Groups[1].Value[0]);
                liste.Add(new Signal
                {
                    Name = teile[0].Trim(),
                    Adresse = teile[1].Trim(),
                    Kommentar = KommentarAus(teile),
                    IstAusgang = bereich == 'Q' || bereich == 'A',
                    ByteAdr = uint.Parse(m.Groups[2].Value, CultureInfo.InvariantCulture),
                    BitAdr = byte.Parse(m.Groups[3].Value, CultureInfo.InvariantCulture)
                });
            }
            return liste;
        }
    }

    // ------------------------------------------------------------------------
    // Sendeschlange je Zwilling. Wichtige Nachrichten (hallo/status) stehen in der
    // Reihe, der Ausgangsstand steht in einem einzelnen Fach: ist der Browser mal
    // langsam, wird der alte Stand verworfen statt aufzustauen. Der PLC-Thread
    // wartet dabei nie auf das Netz.
    class Client
    {
        public WebSocket Ws;
        public int Nr;              // laufende Nummer, die hoechste (im Modus PLCSIM) steuert
        public bool Sps = true;     // Betriebsart der Seite; aeltere Seiten melden keine und gelten als PLCSIM
        public bool Steuernd;
        public readonly object Sync = new object();
        public readonly Queue<string> Reihe = new Queue<string>();
        public string Stand;
        public bool Sendet;
    }

    // ------------------------------------------------------------------------
    static class Bridge
    {
        // gleich wie web/src/version.js - die Seite warnt, wenn Bridge und Zwilling nicht zusammenpassen
        public const string Version = "1.17.0";

        static string instanzName = "Zinnbad";
        static int port = 8181;
        static string webDir, docsDir;
        static List<Signal> signale = new List<Signal>();
        static readonly Dictionary<string, Signal> nachName = new Dictionary<string, Signal>(StringComparer.OrdinalIgnoreCase);
        static readonly List<Client> clients = new List<Client>();
        static int clientZaehler;
        static readonly object clientLock = new object();
        static readonly object signalLock = new object();
        static readonly JavaScriptSerializer json = new JavaScriptSerializer();

        static int minZyklusMs = 10;          // Mindestzykluszeit der CPU (0 = aus dem TIA-Projekt lassen)
        static readonly List<IoBlock> ausBloecke = new List<IoBlock>();
        static readonly List<IoBlock> einBloecke = new List<IoBlock>();

        static volatile bool plcVerbunden;
        static volatile string plcZustand = "getrennt";
        static volatile string plcText = "Noch keine Verbindung";

        public static int Run(string[] args)
        {
            if (args.Length > 0) instanzName = args[0];
            if (args.Length > 1) port = int.Parse(args[1], CultureInfo.InvariantCulture);
            if (args.Length > 2) minZyklusMs = int.Parse(args[2], CultureInfo.InvariantCulture);
            // Windows schlaeft sonst in 15,6-ms-Schritten - damit waere die Bridge
            // langsamer als die SPS. 1 ms Zeitgeberaufloesung fuer diesen Prozess.
            timeBeginPeriod(1);

            var basis = AppDomain.CurrentDomain.BaseDirectory;
            var wurzel = Path.GetFullPath(Path.Combine(basis, ".."));
            webDir = Path.Combine(wurzel, "web");
            docsDir = Path.Combine(wurzel, "docs");
            var csv = Path.Combine(wurzel, "signale.csv");

            Console.WriteLine("==============================================================");
            Console.WriteLine("  Zwilling-Bridge v" + Version + "  |  PLCSIM-Advanced-Instanz: " + instanzName);
            Console.WriteLine("==============================================================");

            if (!File.Exists(csv)) { Log.Fehler("signale.csv nicht gefunden: " + csv); Console.ReadKey(); return 1; }
            signale = SignalListe.Laden(csv);
            foreach (var s in signale) nachName[s.Name] = s;
            BloeckeBauen(signale.Where(x => x.IstAusgang), ausBloecke);
            BloeckeBauen(signale.Where(x => !x.IstAusgang), einBloecke);
            Log.Ok(signale.Count + " Signale geladen (" + signale.Count(s => !s.IstAusgang) + " Eingaenge, " +
                   signale.Count(s => s.IstAusgang) + " Ausgaenge) in " +
                   (ausBloecke.Count + einBloecke.Count) + " Bloecken");

            var plcThread = new Thread(PlcSchleife) { IsBackground = true, Name = "PLC" };
            plcThread.Start();

            var listener = new HttpListener();
            listener.Prefixes.Add("http://localhost:" + port + "/");
            try { listener.Start(); }
            catch (HttpListenerException ex)
            {
                Log.Fehler("Webserver konnte nicht starten (" + ex.Message + ").");
                Log.Info("Loesung: Port in start.bat aendern, oder einmalig als Administrator ausfuehren:");
                Log.Info("  netsh http add urlacl url=http://localhost:" + port + "/ user=%USERNAME%");
                Console.ReadKey();
                return 1;
            }
            var url = "http://localhost:" + port + "/";
            Log.Ok("Zwilling erreichbar unter " + url);
            try { Process.Start(url); } catch { }

            Console.WriteLine();
            Log.Info("Beenden mit Strg+C");
            Console.WriteLine();

            while (true)
            {
                HttpListenerContext ctx;
                try { ctx = listener.GetContext(); }
                catch (Exception ex) { Log.Fehler("Listener: " + ex.Message); continue; }
                var c = ctx;
                Task.Run(() => Bearbeiten(c));
            }
        }

        [System.Runtime.InteropServices.DllImport("winmm.dll")]
        static extern uint timeBeginPeriod(uint ms);

        // Fasst die benutzten Byte-Adressen zu wenigen zusammenhaengenden Bloecken
        // zusammen (Luecken bis 16 Byte werden mitgenommen, das ist billiger als
        // ein zweiter Aufruf) und merkt sich an jedem Signal seine Lage im Puffer.
        static void BloeckeBauen(IEnumerable<Signal> liste, List<IoBlock> ziel)
        {
            var sig = liste.ToList();
            if (sig.Count == 0) return;
            var bytes = new List<uint>();
            foreach (var s in sig) { bytes.Add(s.ByteAdr); if (s.IstWort) bytes.Add(s.ByteAdr + 1); }
            bytes.Sort();
            uint start = bytes[0], ende = bytes[0];
            foreach (var b in bytes)
            {
                if (b - ende <= 16) { ende = b; continue; }
                ziel.Add(new IoBlock { Start = start, Daten = new byte[ende - start + 1] });
                start = b; ende = b;
            }
            ziel.Add(new IoBlock { Start = start, Daten = new byte[ende - start + 1] });
            foreach (var s in sig)
            {
                var b = ziel.First(x => s.ByteAdr >= x.Start && s.ByteAdr < x.Start + x.Daten.Length);
                s.Block = b;
                s.Off = (int)(s.ByteAdr - b.Start);
            }
        }

        // ------------------------------------------------------------------ HTTP
        static async Task Bearbeiten(HttpListenerContext ctx)
        {
            try
            {
                if (ctx.Request.Url.AbsolutePath == "/ws" && ctx.Request.IsWebSocketRequest)
                {
                    // WebSockets kennen keine Sperre zwischen Webseiten: jede im Browser offene Seite
                    // koennte sich sonst verbinden und Eingaenge in die SPS schreiben.
                    var herkunft = ctx.Request.Headers["Origin"];
                    if (!HerkunftErlaubt(herkunft))
                    {
                        Log.Warnung("Verbindung abgewiesen: Seite von " + herkunft + " ist nicht der Zwilling");
                        ctx.Response.StatusCode = 403;
                        ctx.Response.Close();
                        return;
                    }
                    var modus = ctx.Request.QueryString["modus"];
                    var wsCtx = await ctx.AcceptWebSocketAsync(null);
                    await WebSocketClient(wsCtx.WebSocket, modus == null || modus == "sps");
                    return;
                }
                DateiAusliefern(ctx);
            }
            catch (Exception ex)
            {
                Log.Warnung("HTTP: " + ex.Message);
                try { ctx.Response.Abort(); } catch { }
            }
        }

        // Erlaubt: der Zwilling ueber http://localhost:<Port> und per Doppelklick geoeffnet (file://,
        // der Browser meldet dann "null"). Ohne Origin kommt die Verbindung nicht aus einem Browser.
        static bool HerkunftErlaubt(string herkunft)
        {
            if (string.IsNullOrEmpty(herkunft) || herkunft == "null") return true;
            return herkunft.Equals("http://localhost:" + port, StringComparison.OrdinalIgnoreCase)
                || herkunft.Equals("http://127.0.0.1:" + port, StringComparison.OrdinalIgnoreCase);
        }

        static void DateiAusliefern(HttpListenerContext ctx)
        {
            var pfad = Uri.UnescapeDataString(ctx.Request.Url.AbsolutePath).TrimStart('/');
            if (pfad == "") pfad = "index.html";
            // docs/... kommt aus dem Doku-Ordner (Uebungshandbuch), alles andere aus web/
            var basis = webDir;
            if (pfad.StartsWith("docs/", StringComparison.OrdinalIgnoreCase)) { basis = docsDir; pfad = pfad.Substring(5); }
            var voll = Path.GetFullPath(Path.Combine(basis, pfad.Replace('/', Path.DirectorySeparatorChar)));
            var resp = ctx.Response;
            if (!voll.StartsWith(Path.GetFullPath(basis) + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase) || !File.Exists(voll))
            {
                resp.StatusCode = 404;
                resp.Close();
                return;
            }
            var ext = Path.GetExtension(voll).ToLowerInvariant();
            var typen = new Dictionary<string, string> {
                { ".html", "text/html; charset=utf-8" }, { ".js", "text/javascript; charset=utf-8" },
                { ".css", "text/css; charset=utf-8" }, { ".json", "application/json" },
                { ".csv", "text/csv; charset=utf-8" }, { ".glb", "model/gltf-binary" },
                { ".gltf", "model/gltf+json" }, { ".png", "image/png" }, { ".svg", "image/svg+xml" },
                { ".jpg", "image/jpeg" }, { ".ico", "image/x-icon" }
            };
            string typ;
            resp.ContentType = typen.TryGetValue(ext, out typ) ? typ : "application/octet-stream";
            resp.AddHeader("Cache-Control", "no-cache");
            var daten = File.ReadAllBytes(voll);
            resp.ContentLength64 = daten.Length;
            resp.OutputStream.Write(daten, 0, daten.Length);
            resp.Close();
        }

        // ------------------------------------------------------------- WebSocket
        static async Task WebSocketClient(WebSocket ws, bool sps)
        {
            var client = new Client { Ws = ws, Sps = sps };
            lock (clientLock) { client.Nr = ++clientZaehler; clients.Add(client); }
            Log.Ok("Zwilling verbunden (" + clients.Count + " offen)");

            // Begruessung: Signalliste, Status und aktueller Stand der Ausgaenge
            Senden(client, HalloNachricht(), true);
            Senden(client, StatusNachricht(), true);
            Senden(client, AusgaengeNachricht(), true);
            RollenVergeben();

            var puffer = new byte[64 * 1024];
            var sb = new StringBuilder();
            try
            {
                while (ws.State == WebSocketState.Open)
                {
                    var r = await ws.ReceiveAsync(new ArraySegment<byte>(puffer), CancellationToken.None);
                    if (r.MessageType == WebSocketMessageType.Close) break;
                    sb.Append(Encoding.UTF8.GetString(puffer, 0, r.Count));
                    if (sb.Length > 1024 * 1024)
                    {
                        // Eingaenge sind wenige kB - alles darueber ist kein Zwilling
                        Log.Warnung("Nachricht zu gross, Verbindung getrennt");
                        await ws.CloseAsync(WebSocketCloseStatus.MessageTooBig, "zu gross", CancellationToken.None);
                        break;
                    }
                    if (!r.EndOfMessage) continue;
                    var text = sb.ToString();
                    sb.Clear();
                    NachrichtVerarbeiten(text, client);
                }
            }
            catch (Exception) { }
            finally
            {
                lock (clientLock) clients.Remove(client);
                try { ws.Dispose(); } catch { }
                Log.Info("Zwilling getrennt (" + clients.Count + " offen)");
                RollenVergeben();                 // der naechstaeltere uebernimmt
            }
        }

        static void NachrichtVerarbeiten(string text, Client von)
        {
            Dictionary<string, object> msg;
            try { msg = json.Deserialize<Dictionary<string, object>>(text); }
            catch { Log.Warnung("Ungueltige Nachricht: " + text); return; }

            object typ;
            if (!msg.TryGetValue("typ", out typ) || !(typ is string)) return;
            if ((string)typ == "modus")
            {
                // Seite hat zwischen Demo und PLCSIM umgeschaltet: Steuerung neu vergeben
                object m;
                von.Sps = msg.TryGetValue("modus", out m) && (m as string) == "sps";
                RollenVergeben();
                return;
            }
            if (!von.Steuernd) return;            // nur beobachtende Zwillinge schreiben nicht
            if ((string)typ == "eingaenge")
            {
                object werteObj;
                if (!msg.TryGetValue("werte", out werteObj)) return;
                var werte = werteObj as Dictionary<string, object>;
                if (werte == null) return;
                lock (signalLock)
                {
                    foreach (var kv in werte)
                    {
                        Signal s;
                        if (!nachName.TryGetValue(kv.Key, out s) || s.IstAusgang) continue;
                        if (s.IstWort)
                        {
                            try { s.WortWert = (short)Math.Max(-32768, Math.Min(32767, Convert.ToInt32(kv.Value, CultureInfo.InvariantCulture))); }
                            catch (Exception) { }
                        }
                        else if (kv.Value is bool) s.Wert = (bool)kv.Value;
                    }
                }
            }
        }

        // Legt die Nachricht ins Fach des Zwillings und startet bei Bedarf die Pumpe.
        // Kehrt sofort zurueck - der PLC-Thread darf nie auf das Netz warten.
        static void Senden(Client c, string text, bool wichtig)
        {
            bool starten;
            lock (c.Sync)
            {
                if (wichtig) c.Reihe.Enqueue(text); else c.Stand = text;   // alter Stand ist wertlos
                starten = !c.Sendet;
                if (starten) c.Sendet = true;
            }
            if (starten) Task.Run(() => Pumpe(c));
        }

        static async Task Pumpe(Client c)
        {
            while (true)
            {
                string text;
                lock (c.Sync)
                {
                    if (c.Reihe.Count > 0) text = c.Reihe.Dequeue();
                    else { text = c.Stand; c.Stand = null; }
                    if (text == null) { c.Sendet = false; return; }
                }
                try
                {
                    if (c.Ws.State != WebSocketState.Open) { lock (c.Sync) { c.Sendet = false; c.Stand = null; c.Reihe.Clear(); } return; }
                    var daten = Encoding.UTF8.GetBytes(text);
                    await c.Ws.SendAsync(new ArraySegment<byte>(daten), WebSocketMessageType.Text, true, CancellationToken.None);
                }
                catch { lock (c.Sync) { c.Sendet = false; c.Stand = null; c.Reihe.Clear(); } return; }
            }
        }

        static void AnAlle(string text, bool wichtig)
        {
            Client[] kopie;
            lock (clientLock) kopie = clients.ToArray();
            foreach (var c in kopie) Senden(c, text, wichtig);
        }

        // Genau ein Zwilling darf die Eingaenge stellen - sonst ueberschreiben sich
        // zwei offene Registerkarten gegenseitig und jedes Bit zappelt. Es steuert der
        // zuletzt verbundene im Modus PLCSIM (eine Seite im Demo-Modus sendet keine
        // Eingaenge), die uebrigen schauen zu.
        static void RollenVergeben()
        {
            Client[] kopie;
            lock (clientLock)
            {
                kopie = clients.ToArray();
                Client neuester = null;
                foreach (var c in kopie)
                    if (neuester == null || (c.Sps && !neuester.Sps) || (c.Sps == neuester.Sps && c.Nr > neuester.Nr)) neuester = c;
                foreach (var c in kopie) c.Steuernd = c == neuester;
            }
            foreach (var c in kopie) Senden(c, RollenNachricht(c, kopie.Length), true);
            var zahl = kopie.Length;
            if (zahl > 1) Log.Warnung(zahl + " Zwillinge offen - nur der zuletzt verbundene im Modus PLCSIM steuert, die anderen beobachten nur");
        }

        static string RollenNachricht(Client c, int offen)
        {
            return json.Serialize(new Dictionary<string, object> {
                { "typ", "rolle" }, { "steuernd", c.Steuernd }, { "offen", offen }
            });
        }

        static string HalloNachricht()
        {
            return json.Serialize(new Dictionary<string, object> {
                { "typ", "hallo" },
                { "version", Version },
                { "instanz", instanzName },
                { "signale", signale.Select(s => new Dictionary<string, object> {
                    { "name", s.Name }, { "adresse", s.Adresse },
                    { "richtung", s.IstAusgang ? "ausgang" : "eingang" }, { "kommentar", s.Kommentar }
                }).ToList() }
            });
        }

        static string StatusNachricht()
        {
            return json.Serialize(new Dictionary<string, object> {
                { "typ", "status" }, { "verbunden", plcVerbunden }, { "zustand", plcZustand },
                { "text", plcText }, { "instanz", instanzName }
            });
        }

        static string AusgaengeNachricht()
        {
            var werte = new Dictionary<string, object>();
            lock (signalLock)
                foreach (var s in signale) if (s.IstAusgang) werte[s.Name] = s.IstWort ? (object)(int)s.WortWert : s.Wert;
            return json.Serialize(new Dictionary<string, object> { { "typ", "ausgaenge" }, { "werte", werte } });
        }

        // ------------------------------------------------------------- PLC-Zyklus
        static void PlcSchleife()
        {
            var plc = new PlcZugriff(instanzName);
            string letzterStatus = "";
            var uhr = Stopwatch.StartNew();
            double letzteVollmeldung = 0, letzteDiag = 0, letzteAuffrischung = 0, zykSumme = 0, zykMax = 0;
            int zykAnzahl = 0;
            string letzterZustand = "";

            while (true)
            {
                bool geaendert = false;
                var jetzt = uhr.Elapsed.TotalMilliseconds;
                try
                {
                    if (!plc.IstVerbunden)
                    {
                        string grund;
                        if (plc.Verbinden(out grund))
                        {
                            Log.Ok("Mit PLCSIM-Advanced-Instanz '" + instanzName + "' verbunden");
                            // Mindestzykluszeit der CPU: steht sie im TIA-Projekt z. B. auf 100 ms,
                            // liest die CPU die Eingaenge nur zehnmal je Sekunde - das allein sind
                            // bis zu 200 ms zwischen Knopfdruck und Reaktion.
                            if (minZyklusMs > 0)
                            {
                                var vorher = plc.MindestZyklusMs;
                                if (Math.Abs(vorher - minZyklusMs) > 0.001)
                                {
                                    plc.MindestZyklusMs = minZyklusMs;
                                    Log.Info("Mindestzykluszeit der CPU: " + vorher.ToString("0.#", CultureInfo.InvariantCulture) +
                                             " ms -> " + minZyklusMs + " ms");
                                }
                            }
                            foreach (var b in einBloecke) { plc.LeseEingangBlock(b); b.Zuletzt = null; }   // fremde Bits erhalten
                            foreach (var b in ausBloecke) b.Zuletzt = null;
                        }
                        else
                        {
                            StatusSetzen(false, "getrennt", grund, ref letzterStatus);
                            Thread.Sleep(2000);
                            continue;
                        }
                    }

                    var zustand = plc.Betriebszustand();
                    // Nach STOP->RUN (oder Urloeschen) leert die CPU das Prozessabbild.
                    // Dann muessen alle Eingaenge einmal neu geschrieben werden, sonst
                    // bliebe der zuletzt gemerkte Stand stehen und nichts reagiert mehr.
                    if (zustand != letzterZustand)
                    {
                        letzterZustand = zustand;
                        foreach (var b in einBloecke) b.Zuletzt = null;
                    }
                    bool ioMoeglich = zustand != "Off" && zustand != "InvalidOperatingState" && zustand != "ShuttingDown";
                    StatusSetzen(true, zustand, ioMoeglich ? "Instanz '" + instanzName + "' - " + zustand
                                                           : "Instanz '" + instanzName + "' ist ausgeschaltet",
                                 ref letzterStatus);

                    if (ioMoeglich)
                    {
                        // Sicherheitsnetz gegen alles, was am Prozessabbild sonst noch dreht
                        // (Beobachtungstabelle, Steuern von Hand): einmal je Sekunde voll schreiben.
                        if (jetzt - letzteAuffrischung > 1000)
                        {
                            foreach (var b in einBloecke) b.Zuletzt = null;
                            letzteAuffrischung = jetzt;
                        }
                        foreach (var b in ausBloecke) plc.LeseAusgangBlock(b);
                        lock (signalLock)
                        {
                            foreach (var s in signale)
                            {
                                var d = s.Block.Daten;
                                if (s.IstAusgang)
                                {
                                    if (s.IstWort)
                                    {
                                        var w = (short)((d[s.Off] << 8) | d[s.Off + 1]);
                                        if (w != s.WortWert) { s.WortWert = w; geaendert = true; }
                                    }
                                    else
                                    {
                                        var w = (d[s.Off] & (1 << s.BitAdr)) != 0;
                                        if (w != s.Wert) { s.Wert = w; geaendert = true; }
                                    }
                                }
                                else if (s.IstWort)
                                {
                                    d[s.Off] = (byte)((s.WortWert >> 8) & 0xFF);
                                    d[s.Off + 1] = (byte)(s.WortWert & 0xFF);
                                }
                                else
                                {
                                    var maske = (byte)(1 << s.BitAdr);
                                    if (s.Wert) d[s.Off] |= maske; else d[s.Off] &= (byte)~maske;
                                }
                            }
                        }
                        // nur schreiben, wenn der Zwilling wirklich etwas geaendert hat
                        foreach (var b in einBloecke) if (b.Geaendert()) { plc.SchreibeEingangBlock(b); b.Gemerkt(); }
                    }
                }
                catch (Exception ex)
                {
                    Log.Warnung("Verbindung zur Instanz verloren: " + ex.Message);
                    plc.Trennen();
                    StatusSetzen(false, "getrennt", ex.Message, ref letzterStatus);
                    Thread.Sleep(2000);
                    continue;
                }

                // Aenderungen sofort, zusaetzlich jede Sekunde der vollstaendige Stand
                if (geaendert || jetzt - letzteVollmeldung > 1000)
                {
                    AnAlle(AusgaengeNachricht(), false);
                    letzteVollmeldung = jetzt;
                }

                // Zykluszeit mitschreiben und alle 10 s melden - damit sieht man sofort,
                // ob die Verzoegerung an der Bridge liegt oder woanders.
                var dauer = uhr.Elapsed.TotalMilliseconds - jetzt;
                zykSumme += dauer; zykAnzahl++;
                if (dauer > zykMax) zykMax = dauer;
                if (jetzt - letzteDiag > 10000)
                {
                    if (zykAnzahl > 0)
                        Log.Info("Bridge-Zyklus: " + (zykSumme / zykAnzahl).ToString("0.00", CultureInfo.InvariantCulture) +
                                 " ms im Mittel, " + zykMax.ToString("0.00", CultureInfo.InvariantCulture) + " ms max, " +
                                 zykAnzahl + " Durchlaeufe in 10 s");
                    zykSumme = 0; zykMax = 0; zykAnzahl = 0; letzteDiag = jetzt;
                }
                Thread.Sleep(1);
            }
        }

        static void StatusSetzen(bool verbunden, string zustand, string text, ref string letzter)
        {
            plcVerbunden = verbunden;
            plcZustand = zustand;
            plcText = text;
            var schluessel = verbunden + "|" + zustand + "|" + text;
            if (schluessel == letzter) return;
            letzter = schluessel;
            if (verbunden) Log.Info("PLC: " + text); else Log.Warnung("PLC: " + text);
            AnAlle(StatusNachricht(), true);
        }
    }

    // ------------------------------------------------------------------------
    //  Einzige Stelle, die die Siemens-API direkt benutzt.
    // ------------------------------------------------------------------------
    class PlcZugriff
    {
        readonly string name;
        Siemens.Simatic.Simulation.Runtime.IInstance instanz;

        public PlcZugriff(string instanzName) { name = instanzName; }

        public bool IstVerbunden { get { return instanz != null; } }

        public bool Verbinden(out string grund)
        {
            grund = "";
            try
            {
                if (!Siemens.Simatic.Simulation.Runtime.SimulationRuntimeManager.IsRuntimeManagerAvailable)
                {
                    grund = "PLCSIM-Advanced-Runtime-Manager laeuft nicht (Control Panel starten)";
                    return false;
                }
                instanz = Siemens.Simatic.Simulation.Runtime.SimulationRuntimeManager.CreateInterface(name);
                return true;
            }
            catch (Exception ex)
            {
                instanz = null;
                grund = "Instanz '" + name + "' nicht gefunden (" + ex.Message + ")";
                return false;
            }
        }

        public void Trennen()
        {
            instanz = null;
        }

        public string Betriebszustand()
        {
            return instanz.OperatingState.ToString();
        }

        // Mindestzykluszeit der CPU in Millisekunden (0 = Wert aus dem TIA-Projekt)
        public double MindestZyklusMs
        {
            get { return instanz.OverwrittenMinimalCycleTime_ns / 1e6; }
            set { instanz.OverwrittenMinimalCycleTime_ns = (long)(value * 1e6); }
        }

        // Blockzugriff: ein Aufruf je Block statt einer je Signal. Ein ganzes
        // Byte-Stueck kostet die API genauso viel wie ein einzelnes Bit.
        public void LeseAusgangBlock(IoBlock b)
        {
            var d = instanz.OutputArea.ReadBytes(b.Start, (uint)b.Daten.Length);
            Buffer.BlockCopy(d, 0, b.Daten, 0, b.Daten.Length);
        }

        public void LeseEingangBlock(IoBlock b)
        {
            var d = instanz.InputArea.ReadBytes(b.Start, (uint)b.Daten.Length);
            Buffer.BlockCopy(d, 0, b.Daten, 0, b.Daten.Length);
        }

        public void SchreibeEingangBlock(IoBlock b)
        {
            instanz.InputArea.WriteBytes(b.Start, b.Daten);
        }
    }
}
