import { state } from "./state.js";
import { MAP, classes } from "./config.js";
import { $ } from "./utils.js";
import { showGameMessage } from "./ui.js";
import { createSlime } from "./bosses/slime.js";
import { createDragon, createTowers } from "./bosses/dragon.js";
import { createGunball } from "./bosses/gunball.js";
import { createShadow } from "./bosses/shadow.js";
import { createSnake } from "./bosses/snake.js";
import { createPlant } from "./bosses/plant.js";

const ARENA_MIN_W=600, ARENA_MIN_H=450, ARENA_MAX_W=5000, ARENA_MAX_H=3600;

let open=false, prevPaused=false, history=[], histIdx=-1;

export function consoleIsOpen(){return open}

export function openConsole(){
 if(!state.gameRunning||state.finished)return;
 open=true;prevPaused=state.paused;state.paused=true;
 $('commandBar').style.display='flex';$('commandInput').value='';
 requestAnimationFrame(()=>$('commandInput').focus())
}

export function attachConsole(startGame){
 const bar=$('commandBar'), input=$('commandInput');
 const cmdBtn=$('cmdBtn'), sendBtn=$('commandSend');
 cmdBtn.addEventListener('pointerdown',e=>{e.preventDefault();openConsole()});
 const submit=()=>{
  const cmd=input.value.trim();
  input.value='';histIdx=-1;
  if(cmd){history.unshift(cmd);runCommand(cmd,startGame)}
  closeConsole()
 };
 sendBtn.addEventListener('pointerdown',e=>{e.preventDefault();submit()});
 window.addEventListener('keydown', e=>{
  if(e.target===input)return;
  if(e.code!=='Enter')return;
  if(!state.gameRunning||state.finished||!state.isAdmin)return;
  e.preventDefault();
  open=true;prevPaused=state.paused;state.paused=true;
  bar.style.display='flex';input.value='';
  requestAnimationFrame(()=>input.focus())
 });
 input.addEventListener('keydown', e=>{
  e.stopPropagation();
  if(e.code==='Enter'){
   e.preventDefault();
   submit()
  }else if(e.code==='Escape'){closeConsole()}
  else if(e.code==='ArrowUp'){if(history.length){histIdx=Math.min(histIdx+1,history.length-1);input.value=history[histIdx];e.preventDefault()}}
  else if(e.code==='ArrowDown'){histIdx=Math.max(histIdx-1,-1);input.value=histIdx<0?'':history[histIdx];e.preventDefault()}
 })
}

export function closeConsole(){
 open=false;
 $('commandBar').style.display='none';
 state.paused=prevPaused;
 $('commandInput').blur()
}

function fmt(n){return Number.isInteger(n)?n:n.toFixed(1)}

export function runCommand(text, startGame){
 const s=state, cmd=text.trim().toLowerCase();
 if(!cmd){showGameMessage('KONSOLE \u2014 TIPPE "HELP"',1.6);return}
 if(cmd.includes(' vs ')){
  return cmdDuel(cmd,startGame)
 }
 if(cmd==='friendly fire'){s.friendlyFire=!s.friendlyFire;showGameMessage('FRIENDLY FIRE '+(s.friendlyFire?'AN':'AUS'));return}
 if(cmd==='not me'){s.notMe=!s.notMe;showGameMessage(s.notMe?'NOT ME \u2014 DIE GEGNER ZIELEN NICHT MEHR AUF DICH':'DICH WIEDER IM VISIER');return}
 const parts=cmd.split(/\s+/), c=parts[0], a1=parts[1];
 if(classes[c])return cmdClass(c);
 if(c==='help')return cmdHelp(a1);
 if(c==='hp'){
  const n=Number(a1);
  if(n>0){s.player.maxHp=Math.round(n);s.player.hp=Math.round(n);showGameMessage('HP AUF '+Math.round(n)+' GESETZT')}
  else showGameMessage('HP: '+Math.ceil(s.player.hp)+' / '+s.player.maxHp);
  return
 }
 if(c==='dmg'){
  const n=Number(a1);
  if(n>0){s.dmgMultiplier=n;showGameMessage('SCHADEN \u00d7'+fmt(n))}
  else showGameMessage('SCHADEN: \u00d7'+fmt(s.dmgMultiplier));
  return
 }
 if(c==='speed'){
  const n=Number(a1);
  if(n>0&&s.player){s.player.speed=n;showGameMessage('TEMPO: '+n)}
  else showGameMessage(s.player&&s.player.speed?'TEMPO: '+Math.round(s.player.speed):'USAGE: speed 300');
  return
 }
 if(c==='cooldown'){
  const n=Number(a1);
  if(n>0){s.cooldownOverride=n;showGameMessage('COOLDOWN: '+n+'s')}
  else {s.cooldownOverride=0;showGameMessage('COOLDOWN: KLASSEN-STANDARD ('+(classes[s.selected]?classes[s.selected].cool+'s':'-')+')')}
  return
 }
 if(c==='peace'){
  s.peace=!s.peace;
  if(s.peace)s.brutal=false;
  showGameMessage(s.peace?'PEACE \u2014 NIEMAND GREIFT DICH AN':'KAMPF WIEDER AKTIV');
  return
 }
 if(c==='brutal'){
  s.brutal=!s.brutal;
  if(s.brutal){s.peace=false;s.friendlyFire=true}
  showGameMessage(s.brutal?'BRUTAL \u2014 ALLE GREIFEN ALLE AN (+50% SCHADEN)':'BRUTAL AUS');
  return
 }
 if(c==='invincible'){
  s.invincible=!s.invincible;
  showGameMessage(s.invincible?'UNSTERBLICH':'WIEDER STERBLICH');
  return
 }
 if(c==='time'){
  if(a1==='freeze'){s.timeFreeze=true;showGameMessage('ZEIT EINGEFROREN')}
  else if(a1==='normal'){s.timeFreeze=false;showGameMessage('ZEIT L\u00c4UFT WIEDER')}
  else if(a1==='speed'){
   /* ZEIT-TEMPO (Hugo #65): "time speed 2" = 2x so schnell, "time speed -3" = 3x
      langsamer, "time speed" oder "time speed 0" = wieder normal (1x) */
   const n=Number(parts[2]);
   if(parts[2]===undefined||n===0){s.timeScale=1;showGameMessage('ZEIT-TEMPO NORMAL (1x)')}
   else if(n>0){s.timeScale=Math.min(5,Math.max(.2,n));showGameMessage('ZEIT-TEMPO: '+s.timeScale+'x SCHNELL')}
   else {s.timeScale=Math.max(.15,1/Math.abs(n));showGameMessage('ZEIT-TEMPO: '+s.timeScale.toFixed(2)+'x LANGSAM')}
  }
  else showGameMessage('USAGE: time freeze / time normal / time speed 2|-3');
  return
 }
 if(c==='arena')return cmdArena(a1,startGame);
 if(c==='slime')return cmdSpawn('slime');
 if(c==='dragon'){cmdSpawn('dragon');return}
 if(c==='gunball')return cmdSpawn('gunball');
 if(c==='shadow')return cmdSpawn('shadow');
 if(c==='snake')return cmdSpawn('snake');
 if(c==='plant')return cmdSpawn('plant');
 if(c==='bossrush')return cmdBossRush(startGame);
 showGameMessage('UNBEKANNT: "'+cmd+'" \u2014 TIPPE "HELP"',2.2)
}

function cmdHelp(page){
 const pages=[
  'KOMMANDOS: slime dragon gunball shadow snake plant  \u00b7  "a vs b vs c" oder TEAMS "slime dragon vs gunball plant", auch mit "me"  \u00b7  klassen: faust ember gunner sword archer tank assassin healer  \u00b7  help 2',
  'ARENA: arena slime|dragon|gunball|shrink|grow|infinite|reset  \u00b7  hp 500  \u00b7  dmg 2  \u00b7  speed 300  \u00b7  cooldown 0.5  \u00b7  help 3',
  'MODUS: peace  \u00b7  brutal  \u00b7  friendly fire  \u00b7  not me  \u00b7  invincible  \u00b7  time freeze / time normal / time speed 2|-3  \u00b7  bossrush'
 ];
 const p=Math.max(0,Math.min(pages.length-1,(Number(page)||1)-1));
 showGameMessage(pages[p],2.6)
}

function cmdClass(name){
 const s=state, c=classes[name];
 if(!s.player)return;
 const ratio=s.player.hp/s.player.maxHp;
 s.adminBaseClass=name;
 s.selected=name;
 s.player.maxHp=c.hp;s.player.hp=Math.max(1,Math.round(c.hp*ratio));
 s.gunnerAmmo=5;s.gunnerReload=0;s.gunnerShotTimer=0;
 s.attackTimer=0;
 $('className').textContent=c.name;
 $('attackIcon').textContent=name==='ember'?'\ud83d\udc32':name==='gunner'?'\ud83d\udd2b':c.icon;
 $('attackLabel').textContent=name==='ember'?'FEUERSTRAHL':name==='gunner'?'SCHUSS':'ANGRIFF';
 $('attackBtn').style.display=name==='healer'?'none':'flex';
 $('healBtn').style.display=name==='healer'?'flex':'none';
 showGameMessage('KLASSE: '+c.name.toUpperCase())
}

function cmdArena(arg,startGame){
 const s=state;
 if(arg==='slime'||arg==='dragon'||arg==='gunball'||arg==='snake'||arg==='plant'){s.selectedBoss=arg;startGame();return}
 if(arg==='reset'||arg==='normal'){s.arena={w:MAP.w,h:MAP.h};s.player.x=Math.min(s.player.x,s.arena.w-30);s.player.y=Math.min(s.player.y,s.arena.h-30);showGameMessage('ARENA ZUR\u00dcCKGESETZT');return}
 if(arg==='shrink'){s.arena={w:Math.max(ARENA_MIN_W,Math.round(s.arena.w*.65)),h:Math.max(ARENA_MIN_H,Math.round(s.arena.h*.65))};s.player.x=Math.min(s.player.x,s.arena.w-30);s.player.y=Math.min(s.player.y,s.arena.h-30);showGameMessage('ARENA SCHRUMPFEN: '+s.arena.w+'\u00d7'+s.arena.h);return}
 if(arg==='grow'){s.arena={w:Math.min(ARENA_MAX_W,Math.round(s.arena.w/.65)),h:Math.min(ARENA_MAX_H,Math.round(s.arena.h/.65))};showGameMessage('ARENA W\u00c4CHST: '+s.arena.w+'\u00d7'+s.arena.h);return}
 if(arg==='infinite'){s.arena={w:ARENA_MAX_W,h:ARENA_MAX_H};showGameMessage('UNENDLICHE ARENA');return}
 showGameMessage('USAGE: arena slime|dragon|gunball|snake|shrink|grow|infinite|reset',2.4)
}

function spawnSpot(){
 const s=state;
 const a=Math.random()*Math.PI*2;
 let x=s.player.x+Math.cos(a)*520,y=s.player.y+Math.sin(a)*520;
 x=Math.max(160,Math.min(s.arena.w-160,x));y=Math.max(160,Math.min(s.arena.h-160,y));
 if(Math.hypot(x-s.player.x,y-s.player.y)<240){x=s.arena.w/2;y=Math.max(160,s.player.y-520)}
 return {x,y}
}

function cmdSpawn(kind){
 const s=state, spot=spawnSpot();
 if(kind==='slime')createSlime(spot.x,spot.y,0);
 else if(kind==='dragon')createDragon(spot.x,spot.y);
 else if(kind==='gunball')createGunball(spot.x,spot.y);
 else if(kind==='shadow')createShadow(spot.x,spot.y);
 else if(kind==='snake')createSnake(spot.x,spot.y);
 else if(kind==='plant')createPlant(spot.x,spot.y);
 showGameMessage('BOSS BESCHWOREN: '+kind.toUpperCase())
}

function spawnRushBoss(kind){
 const s=state, x=s.arena.w/2, y=Math.max(200,s.player.y-420);
 if(kind==='slime')createSlime(x,y,0);
 else if(kind==='dragon'){createDragon(x,y);createTowers()}
 else if(kind==='gunball')createGunball(x,y);
 else if(kind==='shadow')createShadow(x,y);
 else if(kind==='snake')createSnake(x,y);
 else if(kind==='plant')createPlant(x,y);
 showGameMessage('BOSS RUSH: '+kind.toUpperCase()+'!')
}

export function spawnNextBossRush(){
 const kind=state.bossRushQueue.shift();
 if(kind)spawnRushBoss(kind)
}

function cmdBossRush(startGame){
 const s=state;
 s.selectedBoss='slime';
 startGame();
 s.bossRushQueue=['slime','dragon','gunball','shadow','snake','plant'];
 s.bosses=[];s.enemyProjectiles=[];s.fireTrails=[];s.infernoTowers=[];
 spawnNextBossRush()
}

/* VS — TEAMS (Hugo #65): "slime vs dragon vs gunball" = alle gegen alle,
   "slime dragon vs gunball plant" = TEAMS (beliebig viele, bis 4 pro Team),
   "me" = DU spielst in einem Team mit. Gesamt-Maximum: 8 Kaempfer.
   Stirbt das Ziel eines Bosses, greift er das naechste lebende FEIND-Ziel an
   (duelTargetOf waehlt aus duelEnemies) — nie das eigene Team. */
function cmdDuel(spec,startGame){
 const s=state,kinds=['slime','dragon','gunball','shadow','snake','plant'];
 const teams=spec.split(' vs ').map(x=>x.trim().split(/\s+/)).filter(t=>t.length&&t[0]);
 if(teams.length<2){showGameMessage('VS: "slime vs dragon" \u00b7 Teams: "slime dragon vs gunball plant" \u00b7 DU: "me vs slime"',2.8);return}
 let total=0;
 for(const t of teams){
  if(t.length>4||t.some(m=>m!=='me'&&!kinds.includes(m))){showGameMessage('VS: Bosse = slime/dragon/gunball/shadow/snake/plant + "me" \u00b7 max 4 pro Team',2.8);return}
  total+=t.length
 }
 if(total>8){showGameMessage('VS: maximal 8 Kaempfer!',2.2);return}
 const flat=teams.flat().filter(m=>m!=='me');
 s.selectedBoss=flat[0]||'slime';
 startGame();
 s.bosses=[];s.enemyProjectiles=[];s.fireTrails=[];s.infernoTowers=[];s.miniPlants=[];s.acidPools=[];s.vineSweeps=[];
 const W=s.arena.w,H=s.arena.h,R=Math.min(W,H)*.3;
 const teamPos=teams.map((t,ti)=>{const ang=ti*(Math.PI*2/teams.length)-Math.PI/2;return{x:W/2+Math.cos(ang)*R,y:H/2+Math.sin(ang)*R}});
 const fighters=[];
 teams.forEach((t,ti)=>{
  t.forEach((m,mi)=>{
   if(m==='me'){fighters.push({team:ti,me:true});return}
   const pos=teamPos[ti],px=pos.x+(mi-(t.length-1)/2)*150,py=pos.y+(mi%2?100:-100);
   if(m==='slime')createSlime(px,py,0);
   else if(m==='dragon')createDragon(px,py);
   else if(m==='gunball')createGunball(px,py);
   else if(m==='shadow')createShadow(px,py);
   else if(m==='snake')createSnake(px,py);
   else createPlant(px,py);
   const b=s.bosses[s.bosses.length-1];b.duelTeam=ti;
   fighters.push({team:ti,boss:b})
  })
 });
 for(const f of fighters){
  if(!f.boss)continue;
  f.boss.duelEnemies=fighters.filter(e=>e.team!==f.team).map(e=>e.me?s.player:e.boss);
  f.boss.duelTarget=f.boss.duelEnemies[0]
 }
 const meTeam=fighters.find(f=>f.me);
 if(meTeam){const pos=teamPos[meTeam.team];s.player.x=pos.x;s.player.y=pos.y}
 else{s.player.x=170;s.player.y=H/2}
 s.peace=true;s.friendlyFire=true;
 showGameMessage(teams.map(t=>t.map(m=>m==='me'?'DU':m.toUpperCase()).join('+')).join(' VS '),3)
}
