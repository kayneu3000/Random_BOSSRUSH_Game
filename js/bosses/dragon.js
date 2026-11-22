import { state } from "../state.js";
import { DRAGON_HP, MAP, TOWER_HP } from "../config.js";
import { damageBoss, damagePlayer, duelTargetOf, particle } from "../entities.js";
import { showGameMessage } from "../ui.js";
import { pointSegmentDistance, rayMapLength } from "../utils.js";

export function createDragon(x,y){
 state.bosses.push({id:++state.spawnId,type:'dragon',x,y,r:78,hp:DRAGON_HP,maxHp:DRAGON_HP,vx:0,vy:0,angle:0,alive:true,flash:0,wobble:0,mode:'guarded',exhaustedTimer:0,dashTimer:0,dashDirX:0,dashDirY:0,dashAttackTime:0,fireCooldown:1.5,attackCooldown:0,infernoCooldown:5,beamCharge:0,beamTimer:0,beamAngle:0,beamHitCooldown:0})
}

export function createTowers(){
 const positions=[[110,110],[MAP.w-110,110],[110,MAP.h-110],[MAP.w-110,MAP.h-110]];
 positions.forEach((p,i)=>state.infernoTowers.push({id:i,x:p[0],y:p[1],r:35,hp:TOWER_HP,maxHp:TOWER_HP,destroyed:false,eyeOn:true,beamTimer:0,hitCooldown:0,wobble:Math.random()*6}))
}

export function exhaustDragon(){
 const d=state.bosses.find(b=>b.type==='dragon'&&b.alive);if(!d)return;
 d.mode='exhausted';d.exhaustedTimer=10;d.dashTimer=0;d.dashAttackTime=0;d.vx=d.vy=0;
 showGameMessage('DRACHE ERSCHÖPFT — 10 SEKUNDEN!',1.8);
 for(let i=0;i<55;i++)particle(d.x,d.y,'#ffb65c',Math.random()*7+2)
}

function dragonFireball(b){
 const T=duelTargetOf(b);
 const a=Math.atan2(T.y-b.y,T.x-b.x);
 state.enemyProjectiles.push({x:b.x+Math.cos(a)*75,y:b.y+Math.sin(a)*75,vx:Math.cos(a)*620,vy:Math.sin(a)*620,r:46,life:5.5,damage:32,type:'fireball',age:0})
}

function startDragonDash(b){
 const T=duelTargetOf(b);
 const dx=T.x-b.x,dy=T.y-b.y,l=Math.hypot(dx,dy)||1;
 b.dashDirX=dx/l;b.dashDirY=dy/l;b.dashTimer=4;b.dashAttackTime=0;b.mode='fireDash';showGameMessage('DRACHEN ATEM!')
}

function startInfernoBeam(b){
 const T=duelTargetOf(b);
 b.mode='beamCharge';b.beamCharge=1.45;b.beamAngle=Math.atan2(T.y-b.y,T.x-b.x);b.beamTimer=2.1;b.beamHitCooldown=0;showGameMessage('INFERNO STRAHL — AUFLADEN!')
}

export function updateDragon(b,dt){
 b.wobble+=dt*3;b.flash=Math.max(0,b.flash-dt);
 b.fireCooldown=Math.max(0,b.fireCooldown-dt);b.attackCooldown=Math.max(0,b.attackCooldown-dt);b.infernoCooldown=Math.max(0,b.infernoCooldown-dt);
 if(b.mode==='exhausted'){
  b.exhaustedTimer-=dt;
  if(b.exhaustedTimer<=0){b.mode='guarded';createTowers();showGameMessage('DIE INFERNO-TÜRME ERWACHEN WIEDER')}
  return
 }
 if(b.mode==='guarded'){
  const T=duelTargetOf(b);
  b.angle=Math.atan2(T.y-b.y,T.x-b.x);
  const noAttack=state.peace&&T===state.player, dx=T.x-b.x,dy=T.y-b.y,d=Math.hypot(dx,dy)||1,desiredDistance=310,movementSpeed=125;
  if(d>desiredDistance+35){b.x+=dx/d*movementSpeed*dt;b.y+=dy/d*movementSpeed*dt}
  else if(d<desiredDistance-35){b.x-=dx/d*movementSpeed*.65*dt;b.y-=dy/d*movementSpeed*.65*dt}
  else{const orbit=Math.sin(state.elapsed*1.1)*.45;b.x+=Math.cos(b.angle+Math.PI/2)*movementSpeed*.45*orbit*dt;b.y+=Math.sin(b.angle+Math.PI/2)*movementSpeed*.45*orbit*dt}
  b.x=Math.max(100,Math.min(MAP.w-100,b.x));b.y=Math.max(100,Math.min(MAP.h-100,b.y));
  if(!noAttack&&b.infernoCooldown<=0){startInfernoBeam(b);b.infernoCooldown=9;return}
  if(!noAttack&&b.fireCooldown<=0){dragonFireball(b);b.fireCooldown=1.65}
  if(!noAttack&&Math.random()<dt*.15)startDragonDash(b);return
 }
 if(b.mode==='beamCharge'){b.beamCharge-=dt;b.angle=b.beamAngle;if(b.beamCharge<=0){b.mode='beamActive';b.beamTimer=2.1;showGameMessage('INFERNO STRAHL!')}return}
 if(b.mode==='beamActive'){
  b.beamTimer-=dt;b.beamHitCooldown-=dt;
  if(b.beamHitCooldown<=0){const length=rayMapLength(b.x,b.y,b.beamAngle),ex=b.x+Math.cos(b.beamAngle)*length,ey=b.y+Math.sin(b.beamAngle)*length,T=duelTargetOf(b);if(pointSegmentDistance(T.x,T.y,b.x,b.y,ex,ey)<48+(T===state.player?state.player.r:T.r)){T===state.player?damagePlayer(24):damageBoss(T,24,true);b.beamHitCooldown=.45}}
  if(b.beamTimer<=0){b.mode='guarded';b.fireCooldown=1.1}return
 }
 if(b.mode==='fireDash'){
  b.dashTimer-=dt;b.dashAttackTime-=dt;b.x+=b.dashDirX*470*dt;b.y+=b.dashDirY*470*dt;b.angle=Math.atan2(b.dashDirY,b.dashDirX);
  b.x=Math.max(100,Math.min(MAP.w-100,b.x));b.y=Math.max(100,Math.min(MAP.h-100,b.y));
  if(b.dashAttackTime<=0){state.fireTrails.push({x:b.x,y:b.y,r:115,life:8,maxLife:8,damage:20,cooldown:0});for(let i=0;i<20;i++)particle(b.x+(Math.random()-.5)*100,b.y+(Math.random()-.5)*100,'#ff5b26',4+Math.random()*9);b.dashAttackTime=.075}
  if(b.dashTimer<=0){b.mode='guarded';b.fireCooldown=1.5}
 }
 const T=duelTargetOf(b);
 const contact=Math.hypot(T.x-b.x,T.y-b.y),tr=T===state.player?state.player.r:T.r;
 if(contact<tr+b.r*.65&&b.attackCooldown<=0){T===state.player?damagePlayer(25):damageBoss(T,25,true);b.attackCooldown=1}
}

export function updateTowerBeams(dt){
 const dragon=state.bosses.find(b=>b.type==='dragon'&&b.alive), shadowB=state.bosses.find(b=>b.type==='shadow'&&b.alive), hero=dragon||shadowB;
 if(!hero)return;
 for(const t of state.infernoTowers){
  if(t.destroyed)continue;
  t.wobble+=dt*2;t.beamTimer-=dt;t.hitCooldown-=dt;if(t.beamTimer<=0)t.beamTimer=.08;
  const d=pointSegmentDistance(state.player.x,state.player.y,t.x,t.y,hero.x,hero.y);
  if(d<13+state.player.r&&t.hitCooldown<=0){damagePlayer(12);t.hitCooldown=.65}
 }
}
