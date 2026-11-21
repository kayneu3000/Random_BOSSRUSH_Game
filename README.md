# Random BOSSRUSH Game 🎮

Ein Boss-Rush-Spiel von Hugo – gebaut mit reinem HTML, CSS und JavaScript auf dem Canvas.
Kein Framework, keine Assets: alle Bosse sind vollständig im Code gezeichnet.

## Spielen

Einfach die Spiel-URL öffnen – läuft am PC (Tastatur) und am Handy (Touch):

**https://kayneu3000.github.io/Random_BOSSRUSH_Game/**

## Bosse

| Boss | HP | Besonderheit |
|------|-----|--------------|
| SLIME | 1.600 | Teilt sich beim Besiegen in kleinere Formen |
| FEUERDRACHE | 750 | Unverwundbar, bis alle 4 Inferno-Türme zerstört sind |
| GUNBALL | 1.000 | 15 verschiedene Patronen, wird in Phasen verwundbar |

## Klassen

Bogenschütze, Tank, Schwertkämpfer, Assassin – sowie drei Klassen, die durch
Besiegen der Bosse freigeschaltet werden: Healer, Ember und Gunner.

## Steurerung

- **PC:** WASD / Pfeiltasten bewegen · `Space` / `J` Angreifen · `Shift` / `K` Dash
- **Handy:** Joystick links · Knöpfe rechts für Angriff, Dash, Heilung

## Roadmap / Ideen

- Fortschritt (freigeschaltete Klassen) per `localStorage` speichern
- Spiellogik, Rendering und Eingaben in separate Dateien aufteilen
- Neuer 4. Boss

---

*Der Fortschritt (Freischaltungen) wird aktuell noch nicht gespeichert – jeder Neuladen startet bei null.*
