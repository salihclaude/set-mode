# SET Mode

**SET Mode** ist eine mehrsprachige Trainings-App (Web-App/PWA), optimiert für Smartphones wie das Galaxy S24 Ultra.
Ein Fragebogen erstellt den passenden Trainingsplan, die App steigert die Gewichte danach automatisch. Jede Übung
lässt sich per Animation und Tipps erklären.

Live: <https://salihclaude.github.io/set-mode/>

## Funktionen

- **Plan per Fragebogen:** Ziel, Erfahrung, Tage pro Woche, Aufteilung, Dauer, Trainingsort, Cardio, Beschwerden,
  Fokus-Bereiche, Körperdaten und Pausen-Timer. Daraus entsteht der Plan mit Startgewichten.
- **Automatische Progression:** Die App wertet geschaffte Wiederholungen, Gefühl („Leicht / Passend / Sehr schwer“) und
  Erschöpfung (1–5) aus und plant automatische Deload-Wochen ein.
- **Übung erklären:** Jede Übung zeigt eine animierte Figur (Start → Ausführung → Endposition, startet nur auf Tippen)
  sowie Ausführung, Tipps, häufige Fehler, beanspruchte Muskeln und Atmung.
- **4 Sprachen:** Deutsch 🇩🇪, Englisch 🇬🇧, Spanisch 🇪🇸 und Türkisch 🇹🇷. Die Sprache wechselt sofort ohne Neuladen und
  wird gespeichert. Beim ersten Start gilt die Gerätesprache, sonst Deutsch.
- **SET-Mode-Schalter:** Der Regler in der Wortmarke (Tippen oder Ziehen) schaltet zwischen dem Standarddesign
  (rechts, ON) und einem monochromen Graphit-Design (links, OFF). Die Einstellung wird gespeichert.
- **Voiceover:** Die Erklärung wird in der App-Sprache mitgesprochen, synchron zur Animation (siehe [VOICEOVER.md](VOICEOVER.md)).
- **Bottom Sheets** lassen sich nach unten wegwischen; Scrollen im Inhalt bleibt unberührt.
- **Verlauf:** Wochenvolumen, Körpergewicht, Fortschritt pro Übung, Rekorde und Serien.
- **Offline-fähig**, alle Daten bleiben lokal auf dem Gerät. Backup per Export/Import.

## Aufbau

| Datei | Inhalt |
|---|---|
| `index.html` | Einstieg, lädt die Skripte in fester Reihenfolge |
| `i18n.js` | Sprachkern: `t(key, params)`, Rückfall auf Deutsch, Spracherkennung |
| `lang/*.js` | Ein Wörterbuch pro Sprache (Oberfläche + Übungstexte unter `ex.<id>`) |
| `data.js` | Übungsdatenbank (IDs, Muskeln, Atemmuster) und Plan-Generator |
| `anim.js` | Eigene SVG-Animations-Engine (2D-Figur mit IK), eine Pose-Funktion pro Übung |
| `voice.js` | Voiceover: Sprechtexte, Aufnahmen aus `audio/` oder Gerätestimme, satzweise Wiedergabe |
| `audio/` | `manifest.json` + Aufnahmen `audio/<sprache>/<id>/<satz>.mp3` (siehe VOICEOVER.md) |
| `app.js` | Oberfläche, Trainingslogik, Speicherung, Migration älterer Daten |
| `styles.css` | Design; Theme-Tokens für SET Mode ON/OFF (`html[data-setmode]`) |
| `sw.js` | Offline-Cache |

### Weitere Sprache hinzufügen

1. `lang/de.js` nach `lang/<code>.js` kopieren, `I18N.add('<code>', { name, flag, locale }, …)` anpassen und übersetzen.
2. `<script src="lang/<code>.js">` in `index.html` und die Datei in `sw.js` (`FILES`) eintragen.
3. Optional eine SVG-Flagge in `FLAGS` (`app.js`) ergänzen.
4. `node tools/check-i18n.js` ausführen. Das Skript meldet fehlende oder überzählige Schlüssel.

### Neue Übung hinzufügen

Eintrag in `EX` (`data.js`), Texte unter `ex.<id>` in allen Sprachdateien, optional eine Animation in `anim.js`.
Ohne Animation zeigt die App einen sauberen Platzhalter „Animation folgt“.

## Daten & Updates

- Gespeichert wird im `localStorage` unter dem Schlüssel `fitplan.v1` (aus Kompatibilitätsgründen unverändert).
  Ältere Daten werden beim Start automatisch übernommen, eigene Übungs- und Tagesnamen bleiben erhalten.
- Nach Änderungen die Cache-Version in `sw.js` erhöhen (`setmode-v5` → `setmode-v6`). Geräte laden die neue Version
  im Hintergrund und zeigen sie beim nächsten Öffnen.

## Aufs Handy bringen

Die Adresse oben in **Chrome** öffnen → Menü ⋮ → **App installieren**.

## Entwicklung

```bash
node tools/serve.js
```

Danach <http://localhost:8080> öffnen; der Offline-Cache ist lokal deaktiviert.

- `node tools/test.js`: alle Tests (Sprachen, Plan-Generator, Animationen, Voiceover, Theme)
- `node tools/check-i18n.js`: prüft alle Sprachen auf Vollständigkeit
- `node tools/generate-voiceover.js`: erzeugt Voiceover-Aufnahmen (siehe VOICEOVER.md)
- `http://localhost:8080/tools/anim-gallery.html`: zeigt alle Animationen (Start / Mitte / Ende)
- `node tools/make-icons.js`: erzeugt die App-Icons neu
