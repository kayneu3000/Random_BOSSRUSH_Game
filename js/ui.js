import { $ } from "./utils.js";
import { canvas } from "./canvas.js";
import { drawStats } from "./render.js";
import { ADMIN_UNLOCK_CODE, VERSION } from "./config.js";
import { state } from "./state.js";

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
 if (state.unlocks.ember) $('emberCard').classList.add('emberUnlocked');
 if (state.unlocks.gunner) $('gunnerCard').classList.add('gunnerUnlocked');
 $('selectSnake').classList.toggle('snakeLocked', !(state.unlocks.healer && state.unlocks.ember && state.unlocks.gunner));
}

export function showScreen(id) {
 document.querySelectorAll('.screen').forEach(x => x.classList.remove('active'));
 $('game').style.display = 'none';
 $(id).classList.add('active');
 if (id === 'classScreen') {
  $('classScreen').classList.toggle('slimeTheme', state.selectedBoss === 'slime');
  $('classScreen').classList.toggle('dragonTheme', state.selectedBoss === 'dragon');
  $('classScreen').classList.toggle('gunballTheme', state.selectedBoss === 'gunball');
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

export function endGame(win) {
 state.finished = true; state.paused = true; $('overlay').style.display = 'flex';
 $('overlayTitle').textContent = win ? 'SIEG!' : 'BESIEGT';
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
  $('overlayText').textContent = 'SNAKE ist besiegt! Du hast ihn mit seinen eigenen Äpfeln ausgetrickst — Hunger! Level 2 geschafft!'
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

export function updateHUD() {
 const s = state, p = s.player;
 if (p) {
  $('playerHPFill').style.width = p.hp / p.maxHp * 100 + '%';
  $('playerHPText').textContent = Math.ceil(p.hp) + ' / ' + p.maxHp + ' HP';
 }

 const msg = $('gameMessage');
 if (s.message.until !== Infinity && s.elapsed >= s.message.until && msg.textContent !== '') msg.textContent = '';

 if (s.selected === 'ember') $('attackCooldownText').textContent = s.emberBeamTimer > 0 ? 'FEUERSTRAHL ' + Math.max(0, s.emberBeamTimer).toFixed(1) + 's' : s.emberCooldown > 0 ? 'AUFLADEN ' + s.emberCooldown.toFixed(1) + 's' : 'FEUERSTRAHL BEREIT';
 else if (s.selected === 'healer') $('attackCooldownText').textContent = s.healerHealCooldown > 0 ? 'HEILUNG IN ' + s.healerHealCooldown.toFixed(1) + 's' : 'HEILUNG BEREIT';
 else if (s.selected === 'gunner') $('attackCooldownText').textContent = s.gunnerReload > 0 ? 'NACHLADEN ' + s.gunnerReload.toFixed(1) + 's' : 'PATRONEN: ' + s.gunnerAmmo + '/5';
 else $('attackCooldownText').textContent = s.attackTimer > 0 ? 'ANGRIFF IN ' + s.attackTimer.toFixed(1) + 's' : 'ANGRIFF BEREIT';

 const living = s.bosses.filter(b => b.alive);
 const BOSS_NAMES = { slime: 'SLIME', dragon: 'DRACHE', gunball: 'GUNBALL', shadow: 'SCHATTEN', snake: 'SNAKE', snakeSkin: 'DIE HAUT' };
 const barsArea = $('bossBars');
 const barBosses = living.filter(b => b.type !== 'snakeSkin');
 while (barsArea.firstChild) barsArea.removeChild(barsArea.firstChild);
 for (const b of barBosses) {
  const row = document.createElement('div'); row.className = 'bossBarRow';
  const label = document.createElement('div'); label.className = 'bossBarLabel'; label.textContent = BOSS_NAMES[b.type] || b.type.toUpperCase();
  const bar = document.createElement('div'); bar.className = 'bossHP';
  const fill = document.createElement('div'); fill.className = 'bossHPFill'; fill.style.width = (b.maxHp ? b.hp / b.maxHp * 100 : 0) + '%';
  bar.appendChild(fill); row.appendChild(label); row.appendChild(bar);
  barsArea.appendChild(row);
 }
 const bossTypes = [...new Set(living.map(b => b.type))];
 if (bossTypes.length > 1) {
  $('bossName').textContent = bossTypes.map(t => BOSS_NAMES[t]).join(' + ');
  $('bossCount').textContent = living.length + ' BOSSE AKTIV'
 } else if (bossTypes.length === 1) {
  $('bossName').textContent = BOSS_NAMES[bossTypes[0]];
  const d = living.find(b => b.type === 'dragon'), g = living.find(q => q.type === 'gunball'), sh = living.find(q => q.type === 'shadow'), sn = living.find(q => q.type === 'snake'), sk = living.find(q => q.type === 'snakeSkin');
  if (d) $('bossCount').textContent = d.mode === 'exhausted' ? 'ERSCHÖPFT — ' + Math.ceil(d.exhaustedTimer) + 's VERWUNDBAR' : d.mode === 'fireDash' ? 'DRACHEN ATEM!' : d.mode === 'beamCharge' ? 'INFERNO STRAHL — AUFLADEN' : d.mode === 'beamActive' ? 'INFERNO STRAHL!' : 'UNVERWUNDBAR — ' + s.infernoTowers.filter(t => !t.destroyed).length + ' TÜRME AKTIV';
  else if (g) $('bossCount').textContent = g.mode === 'vulnerable' ? 'VERWUNDBAR — ' + Math.ceil(g.phaseTimer) + 's' : `ANGRIFF — ${Math.ceil(g.phaseTimer)}s · ${g.attackName || 'WAFFEN BEREIT'}`;
  else if (sh) $('bossCount').textContent = sh.mode === 'throwing' ? 'WIRFT — UNVERWUNDBAR · ' + Math.ceil(sh.throwTimer) + 's' : sh.mode === 'guarded' ? 'UNVERWUNDBAR — ' + s.infernoTowers.filter(t => !t.destroyed).length + ' TÜRME AKTIV' : sh.mode === 'vulnerable' ? 'VERWUNDBAR — ' + Math.ceil(sh.vulnerTimer) + 's' : 'PHASE ' + sh.phase;
  else if (sk) $('bossCount').textContent = sk.mode === 'sprint' ? 'SPRINT!' : sk.mode === 'circle' ? 'UMKREIST DICH — ' + Math.ceil(sk.hp) + ' HP' : 'JAGT DICH — ' + Math.ceil(sk.hp) + ' HP';
  else if (sn) $('bossCount').textContent = sn.segments + (sn.segments === 1 ? ' SEGMENT ÜBRIG' : ' SEGMENTE ÜBRIG');
 else $('bossCount').textContent = living.length + ' Schleim' + (living.length === 1 ? '' : 'e') + ' verbleibend'
 }
 updateDebugChip()
}

export function attachUI({ startGame }) {
 $('selectBoss').onclick = () => { state.selectedBoss = 'slime'; showScreen('classScreen') };
 $('selectDragon').onclick = () => { state.selectedBoss = 'dragon'; showScreen('classScreen') };
 $('selectGunball').onclick = () => { state.selectedBoss = 'gunball'; showScreen('classScreen') };
 $('selectShadow').onclick = () => { state.selectedBoss = 'shadow'; showScreen('classScreen') };
 $('selectSnake').onclick = () => {
  if (!(state.unlocks.healer && state.unlocks.ember && state.unlocks.gunner)) return;
  state.selectedBoss = 'snake'; showScreen('classScreen')
 };
 $('tutStart').onclick = () => { state.selectedBoss = 'shadow'; state.selected = 'faust'; state.adminMode = false; state.isAdmin = false; startGame() };
 $('tutSkip').onclick = () => { try { localStorage.setItem('bossrushTutorial', 'done') } catch (e) { } showScreen('lobby') };
 $('backLobby').onclick = () => showScreen('lobby');

 document.querySelectorAll('.classCard').forEach(card => card.onclick = () => {
  const dc = card.dataset.class;
  if (dc === 'healer' && !state.unlocks.healer) return;
  if (dc === 'ember' && !state.unlocks.ember) return;
  if (dc === 'gunner' && !state.unlocks.gunner) return;
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
  // Fehlerzaehler fuer den debug-Chip (auch wenn der Banner weggeklickt/timed ist)
  state.drawErrors = state.drawErrors || {};
  const key = msg.slice(0, 42);
  state.drawErrors[key] = (state.drawErrors[key] || 0) + 1;
  const stack = err && err.stack ? String(err.stack).split('\n').slice(0, 3).join(' | ') : '';
  box.textContent = 'BUG-INFO ' + msg + (stack ? '   ' + stack : '');
  box.style.display = 'block'
 } catch (e) { /* Banner darf niemals Probleme machen */ }
}

// DEBUG: kleiner Zahlen-Chip, per Konsolen-Befehl "debug" ein/aus.
// Zeigt selbst auf schwarzem Canvas die echten Werte (DOM, nicht Canvas!):
// Canvas-Groesse, Kamera, Spieler, Arena + ob Zeichnen-Abschnitte klemmen.
let debugOn = false, debugAutoTimer = 0;

// Chip notfalls per JS erzeugen — falls Safari eine alte index.html gecacht hat,
// fehlt das HTML-Element und der debug-Befehl waere wirkungslos.
function ensureDebugChip() {
 try {
  if (document.getElementById('debugChip')) return;
  const chip = document.createElement('div'); chip.id = 'debugChip';
  (document.getElementById('game') || document.body).appendChild(chip)
 } catch (e) { /* niemals Probleme machen */ }
}

function setChip(on) {
 debugOn = on;
 const chip = $('debugChip');
 if (chip) chip.style.display = on ? 'block' : 'none';
 updateDebugChip()
}

export function toggleDebugChip() {
 ensureDebugChip();
 clearTimeout(debugAutoTimer); // manuelle Schaltung stoppt die Auto-Abschaltung
 setChip(!debugOn);
 return debugOn
}

// Auto-Modus: beim Snake-Kampfstart schaltet sich der Chip SELBST ein und
// geht nach `seconds` wieder aus — Hugo muss nichts eintippen.
export function autoDebugChip(seconds = 25) {
 ensureDebugChip();
 if (debugOn) return;
 clearTimeout(debugAutoTimer);
 setChip(true);
 debugAutoTimer = setTimeout(() => { setChip(false) }, Math.max(3, seconds) * 1000)
}
export function updateDebugChip() {
 try {
  if (!debugOn) return;
  const chip = $('debugChip'); if (!chip) return;
  const s = state, p = s.player || { x: 0, y: 0 };
  const errs = Object.entries(drawStats.errors).map(([k, v]) => k + ':' + v).join(',');
  const browserErrs = Object.entries(state.drawErrors || {}).map(([k, v]) => k + ':' + (v > 1 ? v + 'x' : 'einmal')).join(',');
  chip.textContent = 'v' + VERSION +
   ' | W=' + s.W + ' H=' + s.H + ' dpr=' + s.dpr +
   ' canvas=' + (canvas ? canvas.width + 'x' + canvas.height : '?') +
   ' Kamera=' + Math.round(s.camera.x) + ',' + Math.round(s.camera.y) +
   ' Spieler=' + Math.round(p.x) + ',' + Math.round(p.y) +
   ' Arena=' + s.arena.w + 'x' + s.arena.h +
   ' Rettungen=' + (s.nanSaves||0) +
   ' Quelle=' + (s.lastNanSource||'-') +
   ' Quellen=' + (Object.entries(s.nanSources||{}).map(([k,v]) => k + ':' + v).join(',') || 'keine') +
   ' CanvasNeustarten=' + drawStats.restarts +
   ' Bild=' + (drawStats.black || '-') +
   ' Verdeckt=' + (drawStats.coveredBy || '-') +
   ' Flaeche=' + (drawStats.rect || '-') +
   ' Heilen=' + (drawStats.heal || 0) +
   ' Tief=' + (drawStats.tiefaustausch || 0) +
   ' ZeichnenOK=' + drawStats.ok +
   ' ZeichnenFehler=' + (errs || 'keine') +
   ' Abstuerze=' + (browserErrs || 'keine');
 } catch (e) { /* Chip darf niemals Probleme machen */ }
}
