import { state } from "./state.js";

/* KLANG (Hugo-Update): prozedurale epische Kampfmusik + Geraeusche zu den
   Attacken — komplett per WebAudio synthetisiert, keine Sound-Dateien.
   Startet bewusst erst beim ersten Tap/Tastendruck (iOS-Safari verlangt
   eine Nutzergeste, bevor Audio laufen darf). Alles try/guarded: Klang darf
   das Spiel NIEMALS ins Wanken bringen. */

let ac = null, master = null, musicGain = null, sfxGain = null;
let musicTimer = null, step = 0, nextT = 0;
let muted = false;
const lastPlay = {};
let noiseBuf = null;

export function audioReady(){ return !!ac }
export function isMuted(){ return muted }

export function initAudio(){
 if (ac) { if (ac.state === 'suspended') ac.resume(); return }
 try{
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ac = new AC();
  master = ac.createGain(); master.gain.value = .9; master.connect(ac.destination);
  musicGain = ac.createGain(); musicGain.gain.value = .3; musicGain.connect(master);
  sfxGain = ac.createGain(); sfxGain.gain.value = .55; sfxGain.connect(master);
  nextT = ac.currentTime + .1;
  startMusicLoop();
 }catch(e){ ac = null }
}

export function toggleMute(){
 muted = !muted;
 try{ if (master) master.gain.value = muted ? 0 : .9 }catch(e){}
 return muted
}

/* ---------- SFX ---------- */

function noise(t, dur, fFrom, fTo, type, g0){
 if (!noiseBuf){
  noiseBuf = ac.createBuffer(1, ac.sampleRate | 0, ac.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
 }
 const src = ac.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
 const f = ac.createBiquadFilter(); f.type = type;
 f.frequency.setValueAtTime(fFrom, t);
 f.frequency.exponentialRampToValueAtTime(Math.max(40, fTo), t + dur);
 const g = ac.createGain();
 g.gain.setValueAtTime(g0, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
 src.connect(f); f.connect(g); g.connect(sfxGain);
 src.start(t); src.stop(t + dur + .05)
}

function tone(t, f0, f1, dur, type, g0, dest){
 const o = ac.createOscillator(); o.type = type;
 o.frequency.setValueAtTime(f0, t);
 o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
 const g = ac.createGain();
 g.gain.setValueAtTime(g0, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
 o.connect(g); g.connect(dest || sfxGain);
 o.start(t); o.stop(t + dur + .05)
}

export function sfx(name){
 if (!ac || muted) return;
 const now = performance.now();
 if (lastPlay[name] && now - lastPlay[name] < 60) return; /* Drossel */
 lastPlay[name] = now;
 try{
  const t = ac.currentTime;
  switch(name){
   case 'whip': /* PEITSCHE: knackender ScHLAG */
    noise(t, .14, 3600, 400, 'bandpass', .9); tone(t, 720, 90, .09, 'square', .22); break;
   case 'slash': noise(t, .12, 1600, 500, 'bandpass', .4); break;
   case 'bow': tone(t, 640, 240, .13, 'triangle', .3); break;
   case 'gun': noise(t, .1, 1400, 200, 'lowpass', .6); tone(t, 220, 60, .1, 'sawtooth', .22); break;
   case 'dash': noise(t, .22, 500, 2400, 'highpass', .3); break;
   case 'bossHit': tone(t, 160, 70, .12, 'triangle', .35); noise(t, .06, 900, 300, 'lowpass', .3); break;
   case 'playerHit': tone(t, 120, 60, .2, 'sawtooth', .3); noise(t, .12, 700, 150, 'lowpass', .35); break;
   case 'venom': tone(t, 300, 90, .25, 'sine', .25); noise(t, .2, 1200, 300, 'bandpass', .25); break;
   case 'victory': [523, 659, 784, 1046].forEach((f, i) => tone(t + i * .16, f, f, .3, 'triangle', .3)); break;
   case 'defeat': [392, 330, 262, 196].forEach((f, i) => tone(t + i * .22, f, f * .97, .4, 'triangle', .3)); break;
  }
 }catch(e){}
}

/* ---------- Musik: epische Moll-Sequenz (A-Moll, 128 BPM) ---------- */

const BASS = [0, 0, 7, 0, 0, 0, 5, 0, -2, -2, 3, -2, -4, 3, 5, 7];
const ARP = [0, 3, 7, 10, 12, 7, 3, 15];

function kick(t){
 tone(t, 130, 42, .15, 'sine', .5, musicGain)
}
function hat(t, g){
 tone(t, 6200, 6100, .04, 'square', g * .06, musicGain)
}
function bassNote(f, t, d){
 try{
  const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass';
  lp.frequency.setValueAtTime(340, t);
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.24, t + .01);
  g.gain.exponentialRampToValueAtTime(.001, t + d);
  o.connect(lp); lp.connect(g); g.connect(musicGain);
  o.start(t); o.stop(t + d + .05)
 }catch(e){}
}
function arpNote(f, t, d, g0){
 tone(t, f, f * 1.01, d, 'triangle', g0 * .2, musicGain)
}

function scheduleStep(i, t, d){
 const root = 110, n = BASS[i % 16];
 bassNote(root * Math.pow(2, n / 12), t, d * 3.2);
 if (i % 4 === 0) kick(t); else if (i % 4 === 2) hat(t, .5);
 const a = ARP[(i >> 1) % 8];
 arpNote(root * 2 * Math.pow(2, a / 12), t, d * 1.6, i % 4 === 1 ? .9 : .45)
}

function startMusicLoop(){
 if (musicTimer) return;
 const bpm = 128, stepDur = 60 / bpm / 4;
 musicTimer = setInterval(() => {
  try{
   if (!ac || muted || state.paused) return;
   /* Musik nur IM Kampf — nicht in Lobby/Pause */
   if (!state.gameRunning){ nextT = ac.currentTime + .1; step = 0; return }
   while (nextT < ac.currentTime + .3){
    if (nextT >= ac.currentTime - .05) scheduleStep(step % 16, nextT, stepDur);
    step++; nextT += stepDur
   }
  }catch(e){}
 }, 90);
}
