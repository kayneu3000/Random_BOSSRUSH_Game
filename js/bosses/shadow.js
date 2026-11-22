import { state } from "../state.js";
import { MAP, SHADOW_HP } from "../config.js";
import { damageBoss, damagePlayer, duelTargetOf, particle } from "../entities.js";
import { showGameMessage } from "../ui.js";
import { createTowers } from "./dragon.js";

export function createShadow(x,y){
 state.bosses.push({id:++state.spawnId,type:'shadow',x,y,r:66,hp:SHADOW_HP,maxHp:SHADOW_HP,alive:true,flash:0,wobble:0,mode:'stalking',phase:1,sprintTimer:0,sprintDx:0,sprintDy:0,fireCooldown:1.2,throwTimer:0,vulnerTimer:0,attackCooldown:0})
}

function shadowPhaseOf(b){
 if(b.hp<=150)return 3;
 if(b.hp<=300)return 2;
 return 1
}

export function exhaustShadow(){
 const sh=state.bosses.find(b=>b.type==='shadow'&&b.alive);
 if(!sh)return;
 sh.mode='vulnerable';sh.vulnerTimer=15;sh.sprintTimer=0;
 showGameMessage('ALLE T\u00dcRME ZERST\u00d6RT \u2014 15 SEKUNDEN ANGREIFEN!',2.6);
 for(let i=0;i<45;i++)particle(sh.x,sh.y,'#9d7bff',Math.random()*6+2)
}

function throwShurikens(b,count){
 const T=duelTargetOf(b);
 const base=Math.atan2(T.y-b.y,T.x-b.x);
 for(let i=0;i<count;i++){
  const a=base+(Math.random()-.5)*.55;
  state.enemyProjectiles.push({x:b.x+Math.cos(a)*70,y:b.y+Math.sin(a)*70,vx:Math.cos(a)*430,vy:Math.sin(a)*430,r:9,life:4,damage:9,type:'shuriken',age:0})
 }
}

function spawnShadowTowers(){
 state.infernoTowers=state.infernoTowers.filter(t=>!t.destroyed);
 createTowers()
}

function clampArena(b){
 b.x=Math.max(120,Math.min(MAP.w-120,b.x));b.y=Math.max(120,Math.min(MAP.h-120,b.y))
}

export function updateShadow(b,dt){
 b.wobble+=dt*3;b.flash=Math.max(0,b.flash-dt);
 b.fireCooldown=Math.max(0,b.fireCooldown-dt);b.attackCooldown=Math.max(0,b.attackCooldown-dt);
 const phase=shadowPhaseOf(b);
 if(phase!==b.phase){
  b.phase=phase;
  if(phase===2){b.mode='throwing';b.throwTimer=5;b.fireCooldown=.4;showGameMessage('PHASE 2 \u2014 W\u00c4HREND ER WIRFT, IST ER UNVERWUNDBAR! DANACH 10 SEKUNDEN ANGREIFEN!',4)}
  else{b.mode='guarded';spawnShadowTowers();showGameMessage('PHASE 3 \u2014 ZERST\u00d6RE ALLE 4 T\u00dcRME! SOLANGE SIE STEHEN, IST ER UNVERWUNDBAR!',4)}
 }
 const T=duelTargetOf(b);
 b.angle=Math.atan2(T.y-b.y,T.x-b.x);
 if(b.mode==='stalking'){
  const dx=T.x-b.x,dy=T.y-b.y,d=Math.hypot(dx,dy)||1;
  if(b.sprintTimer>0){
   b.sprintTimer-=dt;b.x+=b.sprintDx*540*dt;b.y+=b.sprintDy*540*dt;
   if(b.fireCooldown<=0){throwShurikens(b,1);b.fireCooldown=1.3}
  }else{
   b.x+=dx/d*135*dt;b.y+=dy/d*135*dt;
   if(Math.random()<dt*.45&&d>140){b.sprintDx=dx/d;b.sprintDy=dy/d;b.sprintTimer=1.05;b.fireCooldown=1.1}
   else if(b.fireCooldown<=0&&d<640){throwShurikens(b,1);b.fireCooldown=1.6}
  }
  clampArena(b)
 }else if(b.mode==='throwing'){
  b.throwTimer-=dt;
  if(b.fireCooldown<=0){throwShurikens(b,3);b.fireCooldown=.3}
  if(b.throwTimer<=0){b.mode='vulnerable';b.vulnerTimer=10;showGameMessage('VERWUNDBAR \u2014 10 SEKUNDEN ANGREIFEN!',2.2)}
  clampArena(b);
  return
 }else if(b.mode==='guarded'){
  const dx=T.x-b.x,dy=T.y-b.y,d=Math.hypot(dx,dy)||1;
  if(d>420){b.x+=dx/d*110*dt;b.y+=dy/d*110*dt}
  if(b.fireCooldown<=0){throwShurikens(b,5);b.fireCooldown=.22}
  clampArena(b);
  return
 }else if(b.mode==='vulnerable'){
  b.vulnerTimer-=dt;clampArena(b);
  if(b.vulnerTimer<=0){
   if(b.phase>=3){b.mode='guarded';spawnShadowTowers();showGameMessage('DIE SCHATTENT\u00dcRME ERWACHEN WIEDER',2)}
   else{b.mode='throwing';b.throwTimer=5;showGameMessage('WIEDERWURF \u2014 UNVERWUNDBAR!',1.8)}
  }
  return
 }
 const tr=T===state.player?state.player.r:T.r;
 if(Math.hypot(T.x-b.x,T.y-b.y)<tr+b.r*.7&&b.attackCooldown<=0){
  const dmg=b.sprintTimer>0?18:12;
  T===state.player?damagePlayer(dmg):damageBoss(T,dmg,true);
  b.attackCooldown=.9
 }
}
