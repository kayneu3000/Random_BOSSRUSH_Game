import { $ } from "./utils.js";
import { ADMIN_UNLOCK_CODE } from "./config.js";
import { state } from "./state.js";

const SAVE_KEY = 'bossrushUnlocks';

function saveUnlocks() {
 try { localStorage.setItem(SAVE_KEY, JSON.stringify(state.unlocks)) } catch (e) { /* Speicher nicht verfügbar */ }
}

export function loadUnlocks() {
 try {
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw) Object.assign(state.unlocks, JSON.parse(raw))
 } catch (e) { /* kaputte Daten ignorieren */ }
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
 if (state.unlocks.gunner) $('gunnerCard').classList.add('gunnerUnlocked')
}

export function showScreen(id) {
 document.querySelectorAll('.screen').forEach(x => x.classList.remove('active'));
 $('game').style.display = 'none';
 $(id).classList.add('active');
 if (id === 'classScreen') {
  $('classScreen').classList.toggle('slimeTheme', state.selectedBoss === 'slime');
  $('classScreen').classList.toggle('dragonTheme', state.selectedBoss === 'dragon');
  $('classScreen').classList.toggle('gunballTheme', state.selectedBoss === 'gunball')
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
 if (win && state.selectedBoss === 'slime') {
  state.unlocks.healer = true;
  $('overlayText').textContent = 'Alle Slime-Formen besiegt! Healer freigeschaltet!'
 } else if (win && state.selectedBoss === 'dragon') {
  state.unlocks.ember = true;
  $('overlayText').textContent = 'Der Drache wurde besiegt! EMBER FREIGESCHALTET! Der Drachenkopf als Hand kann einen 5 Sekunden langen Feuerstrahl schießen. Danach lädt er 4 Sekunden auf.'
 } else if (win && state.selectedBoss === 'gunball') {
  state.unlocks.gunner = true;
  $('overlayText').textContent = 'Gunball wurde besiegt! GUNNER FREIGESCHALTET! 200 HP, fünf Patronen und 40 Schaden pro Schuss. Nach fünf Schüssen lädt er fünf Sekunden nach.'
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

 const living = s.bosses.filter(b => b.alive), total = living.reduce((sum, b) => sum + b.hp, 0), max = living.reduce((sum, b) => sum + b.maxHp, 0);
 $('bossHPFill').style.width = (max ? total / max * 100 : 0) + '%';
 if (s.selectedBoss === 'dragon') {
  const d = living.find(b => b.type === 'dragon');
  if (d) $('bossCount').textContent = d.mode === 'exhausted' ? 'ERSCHÖPFT — ' + Math.ceil(d.exhaustedTimer) + 's VERWUNDBAR' : d.mode === 'fireDash' ? 'DRACHEN ATEM!' : d.mode === 'beamCharge' ? 'INFERNO STRAHL — AUFLADEN' : d.mode === 'beamActive' ? 'INFERNO STRAHL!' : 'UNVERWUNDBAR — ' + s.infernoTowers.filter(t => !t.destroyed).length + ' TÜRME AKTIV'
 } else if (s.selectedBoss === 'gunball') {
  const b = living.find(q => q.type === 'gunball');
  if (b) $('bossCount').textContent = b.mode === 'vulnerable' ? 'VERWUNDBAR — ' + Math.ceil(b.phaseTimer) + 's' : `ANGRIFF — ${Math.ceil(b.phaseTimer)}s · ${b.attackName || 'WAFFEN BEREIT'}`
 } else $('bossCount').textContent = living.length + ' Schleim' + (living.length === 1 ? '' : 'e') + ' verbleibend'
}

export function attachUI({ startGame }) {
 $('selectBoss').onclick = () => { state.selectedBoss = 'slime'; showScreen('classScreen') };
 $('selectDragon').onclick = () => { state.selectedBoss = 'dragon'; showScreen('classScreen') };
 $('selectGunball').onclick = () => { state.selectedBoss = 'gunball'; showScreen('classScreen') };
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
   saveUnlocks(); applyUnlocksToUI()
  }
  if (dc !== 'admin') { state.adminBaseClass = dc; state.isAdmin = false }
  state.selected = dc;
  document.querySelectorAll('.classCard').forEach(c => c.classList.toggle('selected', c === card))
 });

 $('startGame').onclick = startGame;
 $('pauseBtn').onclick = () => setPause(true);
 $('resume').onclick = () => setPause(false);
 $('restart').onclick = startGame;
 $('toLobby').onclick = backToLobby;
}
