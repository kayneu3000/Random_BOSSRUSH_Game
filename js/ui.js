import { $ } from "./utils.js";
import { ADMIN_UNLOCK_CODE } from "./config.js";
import { toggleMute, sfx } from "./audio.js";
import { state } from "./state.js";
import { replayDiscard, refreshReplayUI, replayClose } from "./replay.js";

const SAVE_KEY = 'bossrushUnlocks';

function saveUnlocks() {
 try {
  const persist = { ...state.unlocks };
  delete persist.admin;
  localStorage.setItem(SAVE_KEY, JSON.stringify(persist))
 } catch (e) { /* Speicher nicht verfügbar */ }
}

export function loadUnlocks() {
 try {
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw) Object.assign(state.unlocks, JSON.parse(raw))
 } catch (e) { /* kaputte Daten ignorieren */ }
 state.unlocks.admin = false
}

export function applyUnlocksToUI() {
 const labels = { healer: ['healerCard', 'Healer ' + String.fromCodePoint(0x1F49A)], ember: ['emberCard', 'Ember ' + String.fromCodePoint(0x1F432,0x1F525)], gunner: ['gunnerCard', 'Gunner ' + String.fromCodePoint(0x1F52B)], admin: ['adminCard', 'ADMIN ' + String.fromCodePoint(0x1F5A5,0xFE0F)] };
 for (const cls of Object.keys(labels)) {
  if (!state.unlocks[cls]) continue;
  const card = $(labels[cls][0]);
  card.classList.remove('locked');
  card.querySelector('h3').textContent = labels[cls][1]
 }
 const whipLabels = { whip: ['whipCard', 'Peitsche ' + String.fromCodePoint(0x1F512)], sauger: ['saugerCard', 'Sauger ' + String.fromCodePoint(0x1F331)] };
 for (const cls of Object.keys(whipLabels)) {
  if (!state.unlocks[cls]) continue;
  const wcard = $(whipLabels[cls][0]);
  wcard.classList.remove('locked');
  wcard.querySelector('h3').textContent = whipLabels[cls][1]
 }
 if (state.unlocks.whip) $('whipCard').classList.add('whipUnlocked');
 if (state.unlocks.healer) $('healerCard').classList.add('healerUnlocked'); /* HEALER BLAU (Hugo #57) */
 if (state.unlocks.ember) $('emberCard').classList.add('emberUnlocked');
 if (state.unlocks.gunner) $('gunnerCard').classList.add('gunnerUnlocked');
 $('selectSnake').classList.toggle('snakeLocked', !(state.unlocks.healer && state.unlocks.ember && state.unlocks.gunner));
}

export function showScreen(id) {
 document.querySelectorAll('.screen').forEach(x => x.classList.remove('active'));
 $('game').style.display = 'none';
 $(id).classList.add('active');
 if (id === 'lobby') refreshReplayUI(); /* Siege-Videos (Hugo #57) */
 if (id === 'classScreen') {
  $('classScreen').classList.toggle('slimeTheme', state.selectedBoss === 'slime');
  $('classScreen').classList.toggle('dragonTheme', state.selectedBoss === 'dragon');
  $('classScreen').classList.toggle('gunballTheme', state.selectedBoss === 'gunball');
  $('classScreen').classList.toggle('plantTheme', state.selectedBoss === 'plant');
  document.querySelectorAll('.classCard').forEach(c => c.classList.toggle('selected', c.dataset.class === (state.adminMode ? 'admin' : state.selected)))
 }
}

export function setPause(v) {
 if (state.finished) return;
 state.paused = v;
 $('overlay').style.display = v ? 'flex' : 'none';
 $('overlayTitle').textContent = 'PAUSE';
 $('overlayText').textContent = 'Der Kampf ist pausiert.'
}

export function showGameMessage(text, durationSeconds = Infinity) {
 state.message = { text, until: state.elapsed + durationSeconds };
 $('gameMessage').textContent = text
}

/* ---------- TUTORIAL-PAUSE (Hugo #57) ----------
   Bei jeder neuen Tutorial-Phase stoppt das Spiel und ein Overlay erklaert
   in EINZELNEN ZEILEN (nichts laeuft aus dem Bildschirm) mit kleiner Skizze,
   was zu tun ist. FORTSETZEN-Button startet den Kampf weiter. */
export function showTutorialPause(title, lines, sketch) {
 if (state.finished) return;
 try {
  state.paused = true;
  const box = $('tutPause'); if (!box) { state.paused = false; return }
  setText($('tutPauseTitle'), title || 'PHASE');
  const linesEl = $('tutPauseLines');
  while (linesEl.firstChild) linesEl.removeChild(linesEl.firstChild);
  for (const ln of (lines || [])) {
   const d = document.createElement('div'); d.className = 'tutLine'; d.textContent = ln; linesEl.appendChild(d)
  }
  drawTutorialSketch($('tutSketch'), sketch || 'move');
  box.style.display = 'flex'
 } catch (e) { state.paused = false } /* Overlay darf nie den Kampf einfrieren */
}

export function hideTutorialPause() {
 const box = $('tutPause');
 if (box) box.style.display = 'none';
 state.paused = false
}

/* Kleine Skizzen (Stichwort-Bilder) fuer die Tutorial-Pause */
function drawTutorialSketch(cv, kind) {
 try {
  if (!cv || typeof cv.getContext !== 'function') return;
  const g = cv.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
  g.fillStyle = '#0a1420'; g.fillRect(0, 0, cv.width, cv.height);
  g.strokeStyle = '#9fd8ff'; g.fillStyle = '#9fd8ff'; g.lineWidth = 2.5; g.lineCap = 'round';
  const P = (x, y) => [x * cv.width / 180, y * cv.height / 90];
  const stick = (x, y) => {
   g.beginPath(); g.arc(x, y - 12, 6, 0, Math.PI * 2); g.stroke(); /* Kopf */
   g.beginPath(); g.moveTo(x, y - 6); g.lineTo(x, y + 8); g.stroke(); /* Koerper */
   g.beginPath(); g.moveTo(x - 7, y); g.lineTo(x + 7, y); g.stroke(); /* Arme */
   g.beginPath(); g.moveTo(x, y + 8); g.lineTo(x - 6, y + 18); g.moveTo(x, y + 8); g.lineTo(x + 6, y + 18); g.stroke() /* Beine */
  };
  const [cx, cy] = P(90, 48);
  if (kind === 'move') {
   stick(cx - 34, cy + 6);
   for (const [ax, ay] of [[-8, -10], [8, -10], [0, -16], [-14, 2], [14, 2]]) {
    const [axx, ayy] = P(cx + ax, cy + ay);
    g.beginPath(); g.moveTo(axx - 4, ayy); g.lineTo(axx + 4, ayy); g.lineTo(axx, ayy - 5); g.closePath(); g.fill()
   }
  } else if (kind === 'throw') {
   stick(cx - 40, cy + 8); g.fillStyle = '#b79aff';
   for (let k = 0; k < 3; k++) { const [sx, sy] = P(cx - 20 + k * 16, cy - 6 - k * 6); g.save(); g.translate(sx, sy); g.rotate(k); g.fillRect(-3, -3, 7, 7); g.restore() }
   g.fillStyle = '#9fd8ff'; g.font = 'bold 11px Arial'; g.fillText('WURF = UNVERWUNDBAR', P(18, 16)[0], P(18, 16)[1]); g.fillText('DANACH ANGREIFEN!', P(52, 80)[0], P(52, 80)[1])
  } else if (kind === 'towers') {
   g.fillStyle = '#8f6dff';
   for (const tx of [26, 66, 114, 154]) { const [txx, tyy] = P(tx, 22); g.fillRect(txx - 5, tyy, 10, 14); g.beginPath(); g.arc(txx, tyy - 3, 5, 0, Math.PI * 2); g.fill() }
   stick(cx, cy + 14);
   g.fillStyle = '#9fd8ff'; g.font = 'bold 11px Arial'; g.fillText('ALLE 4 TUERME ZERSTOEREN', P(14, 82)[0], P(14, 82)[1])
  } else { /* fallback: Pfeil */
   g.beginPath(); g.moveTo(cx - 30, cy); g.lineTo(cx + 30, cy); g.lineTo(cx + 20, cy - 8); g.moveTo(cx + 30, cy); g.lineTo(cx + 20, cy + 8); g.stroke()
  }
 } catch (e) { /* Skizze ist Deko */ }
}

/* ---------- LOBBY-TEXTE IN ZEILEN (Hugo #57) ----------
   Lange Boss-Beschreibungen werden an Wortgrenzen in Zeilen geteilt, damit
   nichts aus dem Bildschirm laeuft. */
export function wrapLines(txt, max = 95) {
 const words = String(txt || '').split(' '), lines = [];
 let cur = '';
 for (const w of words) {
  if (!cur) { cur = w; continue }
  if ((cur + ' ' + w).length <= max) cur += ' ' + w;
  else { lines.push(cur); cur = w }
 }
 if (cur) lines.push(cur);
 return lines
}

export function splitBossTexts(max = 95) {
 try {
  document.querySelectorAll('.bossInfo p').forEach(p => {
   const txt = (p.textContent || '').trim();
   if (p.dataset.split || txt.length < 120) return;
   p.dataset.split = '1';
   const lines = wrapLines(txt, max);
   p.textContent = '';
   for (const ln of lines) {
    const d = document.createElement('div'); d.className = 'lobbyLine'; d.textContent = ln; p.appendChild(d)
   }
  })
 } catch (e) { /* Zeilenumbruch ist Kosmetik */ }
}

export function endGame(win) {
 /* REPLAY (Hugo #57): Niederlage → Aufnahme verwerfen (Sieg wurde schon
    in main.js via replayWin gesichert) */
 if (!win) replayDiscard();
 state.finished = true; state.paused = true; $('overlay').style.display = 'flex';
 $('overlayTitle').textContent = win ? 'SIEG!' : 'BESIEGT';
 sfx(win ? 'victory' : 'defeat');
 state.kills = 0; $('kills').textContent = '0 besiegt';
 if (win && state.selectedBoss === 'shadow') { try { localStorage.setItem('bossrushTutorial', 'done') } catch (e) { } $('overlayText').textContent = 'Tutorial geschafft! Ab jetzt warten alle Bosse in der Lobby auf dich!' }
 if (win && state.selectedBoss === 'slime') {
  state.unlocks.healer = true;
  $('overlayText').textContent = 'Alle Slime-Formen besiegt! Healer freigeschaltet!'
 } else if (win && state.selectedBoss === 'dragon') {
  state.unlocks.ember = true;
  $('overlayText').textContent = 'Der Drache wurde besiegt! EMBER FREIGESCHALTET! Der Drachenkopf als Hand kann einen 5 Sekunden langen Feuerstrahl schießen. Danach lädt er 4 Sekunden auf.'
 } else if (win && state.selectedBoss === 'gunball') {
  state.unlocks.gunner = true;
  $('overlayText').textContent = 'Gunball wurde besiegt! GUNNER FREIGESCHALTET! 200 HP, fünf Patronen und 40 Schaden pro Schuss. Nach fünf Schüssen lädt er fünf Sekunden nach.'
 } else if (win && state.selectedBoss === 'snake') {
  state.unlocks.whip = true;
  $('overlayText').textContent = 'SNAKE ist besiegt! Hunger hat ihn erwischt — Level 2 geschafft! PEITSCHE FREIGESCHALTET: 220 HP, 40 Schaden, langer Linien-Peitschenschlag!'
 } else if (win && state.selectedBoss === 'plant') {
  state.unlocks.sauger = true;
  $('overlayText').textContent = 'Die Fresspflanze ist besiegt! SAUGER FREIGESCHALTET: 250 HP, grün mit Stacheln und eine Fresspflanze in der Hand, die Gegner anzieht!'
 } else $('overlayText').textContent = win ? 'Der Boss wurde besiegt!' : 'Der Boss hat dich besiegt. Versuche es erneut!';
 applyUnlocksToUI();
 saveUnlocks();
 $('resume').style.display = 'none'
}

export function backToLobby() {
 state.gameRunning = false; $('overlay').style.display = 'none';
 state.kills = 0; $('kills').textContent = '0 besiegt';
 showScreen('lobby')
}

// Schreibt einen Text nur, wenn er sich wirklich geaendert hat (kein DOM-Churn).
function setText(el, val) {
 if (el && el.textContent !== val) el.textContent = val
}

// Cooldown-Zeile des Spieler-HUDs.
function getCooldownEl(s) { return $('attackCooldownText') }
function getCooldownText(s) {
 if (s.selected === 'ember') return s.emberBeamTimer > 0 ? 'FEUERSTRAHL ' + Math.max(0, s.emberBeamTimer).toFixed(1) + 's' : s.emberCooldown > 0 ? 'AUFLADEN ' + s.emberCooldown.toFixed(1) + 's' : 'FEUERSTRAHL BEREIT';
 if (s.selected === 'healer') return s.healerHealCooldown > 0 ? 'HEILUNG IN ' + s.healerHealCooldown.toFixed(1) + 's' : 'HEILUNG BEREIT';
 if (s.selected === 'gunner') return s.gunnerReload > 0 ? 'NACHLADEN ' + s.gunnerReload.toFixed(1) + 's' : 'PATRONEN: ' + s.gunnerAmmo + '/5';
 return s.attackTimer > 0 ? 'ANGRIFF IN ' + s.attackTimer.toFixed(1) + 's' : 'ANGRIFF BEREIT'
}

// Cache der Bossleisten: bleibt zwischen den Frames bestehen, wird nur bei
// Aenderung der Boss-Menge (Spawn/Tod) neu aufgebaut.
let barCache = []; // { boss, row, label, fill }

export function updateHUD() {
 const s = state, p = s.player;
 if (p) {
  const pw = p.hp / p.maxHp * 100 + '%';
  if ($('playerHPFill').style.width !== pw) $('playerHPFill').style.width = pw;
  setText($('playerHPText'), Math.ceil(p.hp) + ' / ' + p.maxHp + ' HP');
 }

 const msg = $('gameMessage');
 if (s.message.until !== Infinity && s.elapsed >= s.message.until && msg.textContent !== '') msg.textContent = '';

 setText(getCooldownEl(s), getCooldownText(s));

 const living = s.bosses.filter(b => b.alive);
 const BOSS_NAMES = { slime: 'SLIME', dragon: 'DRACHE', gunball: 'GUNBALL', shadow: 'SCHATTEN', snake: 'Snake', snakeSkin: 'DIE HAUT', plant: 'PFLANZE' };
 const barsArea = $('bossBars');
 // HAUT-HUD (Hugo-Fix 'unsterbliche Haut'): Die Haut bekommt ihre EIGENE Leiste,
 // damit ihr Schaden sichtbar ist — vorher wirkte sie unsterblich, weil ihre 500
 // HP nirgends angezeigt wurden.
 const barBosses = living;
 // SAFARI-SCHUTZ: Die Leisten werden NICHT mehr jeden Frame neu gebaut (60
 // DOM-Rueckbaeue pro Sekunde waren der prime-Verdaechtige fuer den schwarzen
 // Bildschirm auf dem iPad). Neu bauen NUR, wenn sich die Menge der lebenden
 // Boss-Objekte aendert (Spawn/Tod) — sonst nur Breite + Label aktualisieren.
 const sameSet = barCache.length === barBosses.length && barBosses.every((b, i) => barCache[i] && barCache[i].boss === b);
 if (!sameSet) {
  while (barsArea.firstChild) barsArea.removeChild(barsArea.firstChild);
  barCache = barBosses.map(b => {
   const row = document.createElement('div'); row.className = 'bossBarRow';
   const label = document.createElement('div'); label.className = 'bossBarLabel'; label.textContent = BOSS_NAMES[b.type] || b.type.toUpperCase();
   const bar = document.createElement('div'); bar.className = 'bossHP';
   const fill = document.createElement('div'); fill.className = 'bossHPFill'; fill.style.width = (b.maxHp ? b.hp / b.maxHp * 100 : 0) + '%';
   bar.appendChild(fill); row.appendChild(label); row.appendChild(bar);
   barsArea.appendChild(row);
   return { boss: b, row, label, fill };
  });
 }
 for (let i = 0; i < barBosses.length && i < barCache.length; i++) {
  const c = barCache[i], b = barBosses[i];
  if (!c || c.boss !== b) continue;
  const w = (b.maxHp ? b.hp / b.maxHp * 100 : 0) + '%';
  if (c.fill.style.width !== w) c.fill.style.width = w;
  const name = BOSS_NAMES[b.type] || b.type.toUpperCase();
  if (c.label.textContent !== name) c.label.textContent = name;
 }
 const bossTypes = [...new Set(living.map(b => b.type))];
 if (bossTypes.length > 1) {
  setText($('bossName'), bossTypes.map(t => BOSS_NAMES[t]).join(' + '));
  setText($('bossCount'), living.length + ' BOSSE AKTIV')
 } else if (bossTypes.length === 1) {
  setText($('bossName'), BOSS_NAMES[bossTypes[0]]);
  const d = living.find(b => b.type === 'dragon'), g = living.find(q => q.type === 'gunball'), sh = living.find(q => q.type === 'shadow'), sn = living.find(q => q.type === 'snake'), sk = living.find(q => q.type === 'snakeSkin'), pl = living.find(q => q.type === 'plant');
  if (pl) setText($('bossCount'), pl.burrowed ? 'VERGRABEN' : 'ANGRIFF — IMMER ANGREIFBAR!'); /* Schild entfernt (Hugo #55) */
  else if (d) setText($('bossCount'), d.mode === 'exhausted' ? 'ERSCHÖPFT — ' + Math.ceil(d.exhaustedTimer) + 's VERWUNDBAR' : d.mode === 'fireDash' ? 'DRACHEN ATEM!' : d.mode === 'beamCharge' ? 'INFERNO STRAHL — AUFLADEN' : d.mode === 'beamActive' ? 'INFERNO STRAHL!' : 'UNVERWUNDBAR — ' + s.infernoTowers.filter(t => !t.destroyed).length + ' TÜRME AKTIV');
  else if (g) setText($('bossCount'), g.mode === 'vulnerable' ? 'VERWUNDBAR — ' + Math.ceil(g.phaseTimer) + 's' : `ANGRIFF — ${Math.ceil(g.phaseTimer)}s · ${g.attackName || 'WAFFEN BEREIT'}`);
  else if (sh) setText($('bossCount'), sh.mode === 'throwing' ? 'WIRFT — UNVERWUNDBAR · ' + Math.ceil(sh.throwTimer) + 's' : sh.mode === 'guarded' ? 'UNVERWUNDBAR — ' + s.infernoTowers.filter(t => !t.destroyed).length + ' TÜRME AKTIV' : sh.mode === 'vulnerable' ? 'VERWUNDBAR — ' + Math.ceil(sh.vulnerTimer) + 's' : 'PHASE ' + sh.phase);
  else if (sk) setText($('bossCount'), sk.mode === 'sprint' ? 'SPRINT!' : sk.mode === 'circle' ? 'UMKREIST DICH — ' + Math.ceil(sk.hp) + ' HP' : 'JAGT DICH — ' + Math.ceil(sk.hp) + ' HP');
  else if (sn) setText($('bossCount'), sn.segments + (sn.segments === 1 ? ' SEGMENT ÜBRIG' : ' SEGMENTE ÜBRIG'));
 else setText($('bossCount'), living.length + ' Schleim' + (living.length === 1 ? '' : 'e') + ' verbleibend')
 }
}

export function attachUI({ startGame }) {
 splitBossTexts(); /* Lobby-Texte in Zeilen (Hugo #57) */
 $('tutResume').onclick = hideTutorialPause; /* Tutorial-Phase fortsetzen */
 $('replayClose').onclick = replayClose; /* Video-Anzeige schliessen */
 $('selectBoss').onclick = () => { state.selectedBoss = 'slime'; showScreen('classScreen') };
 $('selectDragon').onclick = () => { state.selectedBoss = 'dragon'; showScreen('classScreen') };
 $('selectGunball').onclick = () => { state.selectedBoss = 'gunball'; showScreen('classScreen') };
 $('selectShadow').onclick = () => { state.selectedBoss = 'shadow'; showScreen('classScreen') };
 $('selectSnake').onclick = () => {
  if (!(state.unlocks.healer && state.unlocks.ember && state.unlocks.gunner)) return;
  state.selectedBoss = 'snake'; showScreen('classScreen')
 };
 $('selectPlant').onclick = () => {
  /* PLANT = Level 2 Boss #2: erst nach dem SNAKE-Sieg (Peitsche) waehlbar */
  if (!state.unlocks.whip) return;
  state.selectedBoss = 'plant'; showScreen('classScreen')
 };
 $('muteBtn').onclick = () => { $('muteBtn').textContent = toggleMute() ? '\U0001F507' : '\U0001F50A' };
 $('tutStart').onclick = () => { state.selectedBoss = 'shadow'; state.selected = 'faust'; state.adminMode = false; state.isAdmin = false; startGame() };
 $('tutSkip').onclick = () => { try { localStorage.setItem('bossrushTutorial', 'done') } catch (e) { } showScreen('lobby') };
 $('backLobby').onclick = () => showScreen('lobby');

 document.querySelectorAll('.classCard').forEach(card => card.onclick = () => {
  const dc = card.dataset.class;
  if (dc === 'healer' && !state.unlocks.healer) return;
  if (dc === 'ember' && !state.unlocks.ember) return;
  if (dc === 'gunner' && !state.unlocks.gunner) return;
  if (dc === 'whip' && !state.unlocks.whip) return;
  if (dc === 'sauger' && !state.unlocks.sauger) return;
  if (dc === 'admin' && !state.unlocks.admin) {
   const code = prompt("ADMIN-CODE EINGEBEN:");
   if (!code || code.trim().toUpperCase() !== ADMIN_UNLOCK_CODE) return;
   state.unlocks.admin = true;
   applyUnlocksToUI()
  }
  if (dc === 'admin') state.adminMode = true;
  else { state.adminMode = false; state.adminBaseClass = dc; state.isAdmin = false }
  state.selected = dc;
  document.querySelectorAll('.classCard').forEach(c => c.classList.toggle('selected', c === card))
 });

 $('startGame').onclick = startGame;
 $('pauseBtn').onclick = () => setPause(true);
 $('resume').onclick = () => setPause(false);
 $('restart').onclick = startGame;
 $('toLobby').onclick = backToLobby;

 if (!localStorage.getItem('bossrushTutorial')) showScreen('tutScreen');
}

// Diagnose-Banner: zeigt JS-Fehler ALLES visible an (auch wenn Safari e.message
// leer laesst oder #gameMessage weggetimed wird). Hilft Hugo beim Melden.
export function showErrBox(err) {
 try {
  const box = $('errBox'); if (!box) return;
  const msg = err && err.message ? String(err.message) : String(err);
  const stack = err && err.stack ? String(err.stack).split('\n').slice(0, 3).join(' | ') : '';
  box.textContent = 'BUG-INFO ' + msg + (stack ? '   ' + stack : '');
  box.style.display = 'block'
 } catch (e) { /* Banner darf niemals Probleme machen */ }
}
