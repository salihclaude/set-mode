# SET Mode – Voiceover

Jede Übungserklärung kann gesprochen werden, in der aktuell eingestellten App-Sprache
(Deutsch, Englisch, Spanisch, Türkisch). Der Text bleibt sichtbar; das Voiceover ist eine Ergänzung.

## Was gesprochen wird

Der Sprechtext entsteht automatisch aus den vorhandenen Erklärungstexten der Sprache (`lang/<code>.js` → `ex.<id>`):

1. Name der Übung
2. Ausführung (`exec`), Satz für Satz
3. „Wichtiger Tipp: …“ (`cue`)
4. „Häufiger Fehler: …“ (`mistake`)

Abkürzungen werden vorher aussprechbar gemacht (z. B. „Wdh.“ → „Wiederholungen“, „8–10“ → „8 bis 10“).
Die Regeln stehen pro Sprache unter `voice.abbr` und `voice.range`.

## Zuordnung Übung ↔ Video ↔ Text ↔ Audio ↔ Sprache

| Baustein | Quelle |
|---|---|
| Übungs-ID | `data.js` (`EX`) |
| „Video“ (Animation) | `anim.js` (eine Pose-Funktion je ID) |
| Erklärungstext | `lang/<sprache>.js` → `ex.<id>` |
| Voiceover-Datei | `audio/<sprache>/<id>.mp3` (eine Datei pro Übung) |
| Verzeichnis | `audio/manifest.json` → `files.<sprache>.<id> = { hash, n, file, marks, dur, voice, model }` |

`marks` sind die Satzanfänge in Sekunden. Daran schaltet die Animation von der Startposition in die Bewegung.

Die App wählt die Quelle so (`voice.js` → `VOICE.source`):

1. **Studioaufnahme**, wenn das Manifest für Sprache + Übung einen Eintrag hat **und** der Hash zum aktuellen Text passt.
   Ändert sich ein Text, gilt die alte Aufnahme automatisch als veraltet. Kann die Datei nicht geladen werden
   (z. B. offline und noch nie abgespielt), spricht ab dem aktuellen Satz die Gerätestimme weiter.
2. **Sonst die Sprachausgabe des Geräts** (Web Speech API), aber **nur mit einer Stimme der gewählten Sprache**.
   Bevorzugt werden hochwertige Stimmen (z. B. Google- oder „Natural“-Stimmen).
3. **Gibt es keine passende Stimme**, zeigt die App einen Hinweis und spielt die Animation ohne Ton. Sie spricht nie in
   einer anderen Sprache.

## Synchronisierung

Gesprochen wird Satz für Satz. Während Name und Startposition beschrieben werden, steht die Figur in der Startposition.
Ab dem Bewegungssatz laufen Wiederholungen, bis der Text zu Ende ist; die letzte Wiederholung wird sauber beendet.
Pause und Fortsetzen steuern Stimme und Animation gemeinsam. Schließen (Button, Wischen, Escape), eine andere Übung
öffnen, die Sprache wechseln oder die App in den Hintergrund legen stoppt bzw. pausiert die Stimme.

## Aktueller Stand

- **Alle 61 Übungen × 4 Sprachen sind als Studioaufnahme vorhanden** (244 Dateien, zusammen etwa 81 MB),
  erzeugt mit **ElevenLabs** (Modell `eleven_v4`). Stimmen:

  | Sprache | Stimme (ElevenLabs-Bibliothek) |
  |---|---|
  | Deutsch | Hans – Calm German Explainer |
  | Englisch | Justin Harris – Elite Protocols |
  | Spanisch | Leandro – Training, Narrative |
  | Türkisch | Enes – Conversational & Friendly |

- Die Dateien werden nicht vorab geladen. Jede Aufnahme wird beim ersten Abspielen geladen und danach offline
  gespeichert (eigener Cache `setmode-audio-v1` im Service Worker).
- Die Gerätestimme ist nur noch Rückfall (offline ohne gespeicherte Aufnahme oder bei geändertem Text).

## ElevenLabs-Aufnahmen neu erzeugen (z. B. nach Textänderungen)

Für die Aufnahmen gibt es keinen API-Schlüssel im Projekt. Erzeugt wurde über die ElevenLabs-Oberfläche (bzw. den
ElevenLabs-Connector in Claude). Der Ablauf ist so gebaut, dass wenige lange Aufnahmen reichen:

1. `node tools/vo-batches.js --max 2400 --skip sq_bb` schreibt pro Sprache Sammeltexte nach `audio/_raw/<sprache>_b<n>.txt`
   (6–8 Übungen je Text, zwischen Sätzen `[pause]`, zwischen Übungen `[long pause]`) und `audio/_raw/batches.json`.
   Mit `--skip` angegebene Übungen werden einzeln als `audio/_raw/<sprache>_<id>.mp3` erwartet.
2. Jeden Text mit der Stimme der Sprache (`batches.json` → `voices`) und Modell `eleven_v4` vertonen und als
   `audio/_raw/<schlüssel>.mp3` speichern. Nur geänderte Übungen? Dann reicht eine Einzelaufnahme pro Übung.
3. `node tools/serve.js`, dann `http://localhost:8080/tools/vo-align.html` öffnen und in der Konsole für alle Batches
   `alignBatch()` ausführen; das Ergebnis per `PUT /audio/_raw/align.json` speichern (der lokale Server erlaubt das nur
   für `audio/_raw/` und nur von diesem PC). Die Ausrichtung sucht die Satzpausen per dynamischer Programmierung
   (Satzdauer passend zur Textlänge, lange Pausen bevorzugt). Denkpausen mitten im Satz stören deshalb nicht.
4. `node tools/vo-split.js` schneidet verlustfrei an MP3-Frame-Grenzen (ohne Neukodierung) in
   `audio/<sprache>/<id>.mp3` und schreibt Hash und Satzmarken ins Manifest.
5. `node tools/test.js` prüft u. a., dass jede Übung in jeder Sprache eine **aktuelle** Aufnahme hat.
   Danach die Cache-Version in `sw.js` erhöhen und veröffentlichen.

`audio/_raw/` ist in `.gitignore` (Rohaufnahmen, Arbeitsdateien).

## Alternative: Google Cloud Text-to-Speech

Benötigt: ein Google-Cloud-Projekt mit aktivierter **Cloud Text-to-Speech API** und einen **API-Schlüssel**
(Google Cloud Console → APIs & Dienste → Anmeldedaten → API-Schlüssel, am besten auf die Text-to-Speech-API beschränken).
Der Schlüssel wird nur lokal beim Erzeugen gebraucht und landet **nicht** in der App oder im Repository.

```bash
# alle Sprachen, alle Übungen (61 × 4)
GOOGLE_TTS_API_KEY=dein-schlüssel node tools/generate-voiceover.js

# nur eine Sprache / einzelne Übungen
GOOGLE_TTS_API_KEY=dein-schlüssel node tools/generate-voiceover.js --lang tr
GOOGLE_TTS_API_KEY=dein-schlüssel node tools/generate-voiceover.js --lang de --ids sq_bb,dl
```

Unter Windows (PowerShell): `$env:GOOGLE_TTS_API_KEY="dein-schlüssel"; node tools/generate-voiceover.js`

Danach die Cache-Version in `sw.js` erhöhen und veröffentlichen. Unveränderte Texte werden beim nächsten Lauf
übersprungen (`--force` erzwingt Neu-Erzeugung).

**Stimmen:** Voreingestellt sind ruhige Stimmen (`de-DE-Neural2-B`, `en-GB-Neural2-B`, `es-ES-Neural2-B`,
`tr-TR-Wavenet-B`). Bitte vorher in der Google-Konsole anhören; ändern per `VOICE_DE`, `VOICE_EN`, `VOICE_ES`,
`VOICE_TR`. Umfang: 61 Übungen × 4 Sprachen = 1 212 kurze Dateien (ein Satz je Datei), insgesamt rund 70 000 Zeichen.

## Aufnahmen mit echten Sprecher:innen

```bash
node tools/generate-voiceover.js --export
```

Das schreibt die Sprechtexte nach `audio/scripts/<sprache>.txt` (nummeriert pro Satz). Aufnahmen als
`audio/<sprache>/<id>/<satz>.mp3` ablegen und im Manifest eintragen (`hash` aus dem Generator übernehmen,
`n` = Anzahl Sätze).

## Tests

`node tools/test.js` prüft unter anderem:
- Jede Übung hat in jeder Sprache einen vollständigen Sprechtext.
- Kein Sprechtext fällt auf Deutsch zurück.
- Die Stimmenwahl nimmt nie eine fremde Sprache.
- Veraltete Aufnahmen werden ignoriert.
- Das Manifest verweist nur auf vorhandene Dateien, Satzmarken sind gültig, es gibt keine Test-Töne.
- Jede Übung hat in jeder Sprache eine Aufnahme, die zum aktuellen Text passt.
