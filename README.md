# Fitnessplaner

Persönliche Trainings-App (Web-App/PWA) für das Galaxy S24 Ultra.
Live: <https://salihclaude.github.io/fitnessplaner/>

## Plan per Fragebogen

Beim ersten Start (oder unter *Plan → Neuen Plan erstellen*) fragt die App:
Ziel, Erfahrung, Tage pro Woche, Aufteilung, Dauer, Trainingsort, Cardio, Beschwerden,
Fokus-Bereiche, Körperdaten und Pausen-Timer. Daraus baut `data.js` den Plan:

- **Aufteilung:** 2–3 Tage Ganzkörper (oder PPL), 4 Tage Ober-/Unterkörper, 5 Tage OK/UK + PPL, 6 Tage PPL ×2
- **Übungen** aus einer Datenbank mit Alternativen. Sie werden nach Gerät gefiltert, belastende Übungen bei
  Beschwerden ersetzt und an verschiedenen Tagen variiert.
- **Sätze/Wiederholungen/Pausen** je nach Ziel; zu lange Einheiten werden auf die gewählte Dauer gekürzt
- **Startgewichte** werden aus Körpergewicht, Geschlecht und Erfahrung geschätzt und lassen sich anpassen.

Der Verlauf bleibt beim Neuerstellen erhalten. Einzelne Übungen lassen sich im Plan gegen Alternativen tauschen.

## So funktioniert die automatische Anpassung

Nach jeder Übung tippst du an, wie sie sich angefühlt hat (**Leicht / Passend / Sehr schwer**).
Am Ende gibst du an, wie erschöpft du bist (**1–5**). Daraus rechnet die App die Werte fürs nächste Mal,
also für denselben Tag in der nächsten Woche:

| Situation | Nächstes Mal |
|---|---|
| Alle Sätze geschafft, „Passend“ | +1 Wiederholung |
| Alle geschafft, „Leicht“ (Erschöpfung ≤ 3) | +2 Wiederholungen |
| Oberes Ende des Wdh.-Bereichs erreicht | Gewicht + Schritt (z. B. +2,5 kg), Wdh. zurück aufs Minimum |
| … dabei „Leicht“ und Erschöpfung ≤ 2 | doppelter Gewichtssprung |
| „Sehr schwer“ oder Erschöpfung 5 | Werte halten |
| Unter dem Wdh.-Bereich | gleiches Ziel nochmal; beim 2. Mal in Folge −10 % |

**Deload:** Alle 6 Wochen oder wenn du 3 Trainings in Folge sehr erschöpft warst (Ø ≥ 4,3), kommt automatisch eine
leichte Woche mit 3 Trainings: ca. 85 % Gewicht und ein Satz weniger. Danach geht es mit den normalen Werten weiter.

Bei Langhantelübungen zeigt die App die Scheiben pro Seite an (Stangengewicht in den Einstellungen, Standard 20 kg).

## Aufs Handy bringen

Eine Web-App lässt sich nur über **HTTPS** installieren, deshalb müssen die Dateien einmal online gestellt werden.
Kostenlose Möglichkeiten:

- **GitHub Pages:** Repository anlegen, alle Dateien hochladen, unter *Settings → Pages* den Branch `main` auswählen.
- **Netlify Drop:** Ordner auf <https://app.netlify.com/drop> ziehen.

Danach auf dem S24 Ultra in **Chrome** die Adresse öffnen → Menü ⋮ → **Zum Startbildschirm hinzufügen / App installieren**.
Die App läuft dann im Vollbild und auch offline.

> Hinweis: Deine Trainingsdaten liegen **nur lokal auf dem Handy**. Unter *Plan → Datensicherung* regelmäßig ein Backup
> exportieren (z. B. nach Google Drive). Auf dem Server liegt nur der Programmcode, keine Daten.

## Updates

Nach Änderungen an der App in `sw.js` die Cache-Version erhöhen (`fitplan-v1` → `fitplan-v2`).
Das Handy lädt die neue Version im Hintergrund und zeigt sie beim nächsten Öffnen an.

## Lokal am PC testen

```bash
node tools/serve.js
```

Dann <http://localhost:8080> öffnen (offline-Cache ist lokal deaktiviert).
Icons neu erzeugen: `node tools/make-icons.js`.
