# Random BOSSRUSH Game

Ein selbst programmiertes Boss-Rush-Spiel (HTML5 Canvas) von Hugo: Kämpfe gegen drei Bosse, schalte sieben Klassen frei, spiele am PC oder mobil.

## Bosse

| Boss | Mechanik |
|------|----------|
| **Slime** | Teilt sich bei jedem Besiegwerden in immer kleinere Schleime (5 Stufen) |
| **Feuerdrache** | 4 Inferno-Türme schützen ihn — zerstöre sie alle, um ihn 10 Sekunden verwundbar zu machen |
| **Gunball** | 15 verschiedene Projektil-Typen in 3 Angriffsstufen, alle 2,5 Sekunden eine neue Waffe |

## Klassen

Archer, Tank, Schwertkämpfer, Assassin, **Healer** (Siegespreis: Slime), **Ember** (Siegespreis: Drache), **Gunner** (Siegespreis: Gunball).

Freischaltungen werden automatisch im Browser (`localStorage`) gespeichert und bleiben beim nächsten Start erhalten.

## Steuerung

- **Bewegen:** WASD / Pfeiltasten oder Joystick (Touch)
- **Angreifen:** Leertaste / J / Angriffs-Button
- **Dash:** Shift / K / Dash-Button
- **Heilen (Healer):** Heil-Button
- **Pause:** Pause-Button oben rechts

## Projektstruktur

Das Spiel läuft als statische Seite ohne Build-Tools — einfach `index.html` öffnen oder via GitHub Pages ausliefern.

```
index.html          Markup + Module-Einbindung
css/style.css       alle Styles
js/main.js          Spielstart, Loop, Verdrahtung
js/config.js        Balancing-Daten (Klassen, HP, Projektile …)
js/state.js         zentraler Spielzustand
js/utils.js         Mathe-/DOM-Helfer
js/canvas.js        Canvas-Setup
js/ui.js            HUD, Menüs, Freischaltungen (localStorage)
js/input.js         Tastatur, Joystick, Buttons
js/combat.js        Angriffe, Dash, Ember-Strahl
js/projectiles.js   Spieler- & Gegner-Projektile
js/entities.js      Schaden, Partikel, Begleiter, Slime-Split
js/bosses/          Slime, Feuerdrache, Gunball
js/render.js        zeichnet die Spielszene
tests/              Node-Tests (`npm test`)
```

## Entwicklung

```bash
npm test   # Unit-Tests + Smoke-Tests (Node, keine Abhängigkeiten)
```
