import { $ } from "./utils.js";
import { ADMIN_UNLOCK_CODE } from "./config.js";
import { toggleMute, sfx } from "./audio.js";
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
 const whipLabels = { whip: ['whipCard', 'Peitsche ' + String.fromCodePoint(0x1F512)] };
 for (const cls of Object.keys(whipLabels)) {
  if (!state.unlocks[cls]) continue;
  const wcard = $(whipLabels[cls][0]);
  wcard.classList.remove('locked');
  wcard.querySelector('h3').textContent = whipLabels[cls][1]
 }
 if (state.unlocks.whip) $('whipCard').classList.add('whipUnlocked');
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
 const BOSS_NAMES = { slime: 'SLIME', dragon: 'DRACHE', gunball: 'GUNBALL', shadow: 'SCHATTEN', snake: 'Snake', snakeSkin: 'DIE HAUT' };
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
  const d = living.find(b => b.type === 'dragon'), g = living.find(q => q.type === 'gunball'), sh = living.find(q => q.type === 'shadow'), sn = living.find(q => q.type === 'snake'), sk = living.find(q => q.type === 'snakeSkin');
  if (d) setText($('bossCount'), d.mode === 'exhausted' ? 'ERSCHÖPFT — ' + Math.ceil(d.exhaustedTimer) + 's VERWUNDBAR' : d.mode === 'fireDash' ? 'DRACHEN ATEM!' : d.mode === 'beamCharge' ? 'INFERNO STRAHL — AUFLADEN' : d.mode === 'beamActive' ? 'INFERNO STRAHL!' : 'UNVERWUNDBAR — ' + s.infernoTowers.filter(t => !t.destroyed).length + ' TÜRME AKTIV');
  else if (g) setText($('bossCount'), g.mode === 'vulnerable' ? 'VERWUNDBAR — ' + Math.ceil(g.phaseTimer) + 's' : `ANGRIFF — ${Math.ceil(g.phaseTimer)}s · ${g.attackName || 'WAFFEN BEREIT'}`);
  else if (sh) setText($('bossCount'), sh.mode === 'throwing' ? 'WIRFT — UNVERWUNDBAR · ' + Math.ceil(sh.throwTimer) + 's' : sh.mode === 'guarded' ? 'UNVERWUNDBAR — ' + s.infernoTowers.filter(t => !t.destroyed).length + ' TÜRME AKTIV' : sh.mode === 'vulnerable' ? 'VERWUNDBAR — ' + Math.ceil(sh.vulnerTimer) + 's' : 'PHASE ' + sh.phase);
  else if (sk) setText($('bossCount'), sk.mode === 'sprint' ? 'SPRINT!' : sk.mode === 'circle' ? 'UMKREIST DICH — ' + Math.ceil(sk.hp) + ' HP' : 'JAGT DICH — ' + Math.ceil(sk.hp) + ' HP');
  else if (sn) setText($('bossCount'), sn.segments + (sn.segments === 1 ? ' SEGMENT ÜBRIG' : ' SEGMENTE ÜBRIG'));
 else setText($('bossCount'), living.length + ' Schleim' + (living.length === 1 ? '' : 'e') + ' verbleibend')
 }
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
