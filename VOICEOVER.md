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
| Voiceover-Datei | `audio/<sprache>/<id>/<satz>.mp3` |
| Verzeichnis | `audio/manifest.json` → `files.<sprache>.<id> = { hash, n, ext, voice }` |

Die App wählt die Quelle so (`voice.js` → `VOICE.source`):

1. **Aufnahme**, wenn das Manifest für Sprache + Übung einen Eintrag hat **und** der Hash zum aktuellen Text passt.
   Ändert sich ein Text, gilt die alte Aufnahme automatisch als veraltet.
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

- **Es gibt noch keine Audiodateien** (`audio/manifest.json` ist leer).
  Die App nutzt deshalb die Gerätestimmen, und das funktioniert sofort.
- Auf Android-Handys mit Google-Sprachausgabe sind Deutsch, Englisch, Spanisch und Türkisch normalerweise vorhanden.
  Fehlt eine Sprache: *Einstellungen → Allgemeine Verwaltung → Sprache → Text-in-Sprache* (Samsung) → Sprachdaten
  installieren.

## Studio-Aufnahmen erzeugen (empfohlen für gleichbleibende Qualität)

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
- Das Manifest verweist nur auf vorhandene Dateien und enthält keine Test-Töne.
