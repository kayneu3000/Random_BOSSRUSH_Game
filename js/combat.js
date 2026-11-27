import { state } from "./state.js";
import { classes, MAP } from "./config.js";
import { damageBoss, damageTower, damagePlayer, particle } from "./entities.js";
import { damageSmallSnake } from "./bosses/snake.js";
import { getInput } from "./input.js";
import { showGameMessage } from "./ui.js";
import { sfx } from "./audio.js";
import { pointSegmentDistance, rayMapLength } from "./utils.js";

function pickRangedTarget(){
 let target=null,dist=Infinity,isSnakeFood=false;
 for(const a of state.smallSnakes){if(a.destroyed)continue;const d=Math.hypot(a.x-state.player.x,a.y-state.player.y);if(d<dist){dist=d;target=a;isSnakeFood=true}}
 for(const t of state.infernoTowers){if(t.destroyed)continue;const d=Math.hypot(t.x-state.player.x,t.y-state.player.y);if(d<dist){dist=d;target=t;isSnakeFood=false}}
 for(const b of state.bosses){if(!b.alive||(b.type==='dragon'&&b.mode!=='exhausted')||(b.type==='gunball'&&b.mode!=='vulnerable')||(b.type==='shadow'&&(b.mode==='throwing'||b.mode==='guarded'))||b.type==='snake')continue;const d=Math.hypot(b.x-state.player.x,b.y-state.player.y);if(d<dist){dist=d;target=b;isSnakeFood=false}}
 return { target, isSnakeFood }
}

/* PEITSCHE (Hugo): schmaler Korridor vor dem Spieler — trifft nur, was in der Linie liegt */
const WHIP_DIFF=.34;
function inWhipLine(x,y,maxD){
 const dx=x-state.player.x,dy=y-state.player.y,d=Math.hypot(dx,dy);
 if(!(d<=maxD))return false;
 const a=Math.atan2(dy,dx),diff=Math.atan2(Math.sin(a-state.player.angle),Math.cos(a-state.player.angle));
 return Math.abs(diff)<=WHIP_DIFF
}

function pickMeleeTarget(c){
 let target=null,dist=Infinity,isTower=true,isSnakeFood=false;
 for(const a of state.smallSnakes){
  if(a.destroyed)continue;
  const dx=a.x-state.player.x,dy=a.y-state.player.y,d=Math.hypot(dx,dy),ang=Math.atan2(dy,dx),diff=Math.atan2(Math.sin(ang-state.player.angle),Math.cos(ang-state.player.angle));
  if(Math.abs(diff)>.85||d>c.range+a.r)continue;if(d<dist){dist=d;target=a;isTower=false;isSnakeFood=true}
 }
 for(const t of state.infernoTowers){
  if(t.destroyed)continue;
  const dx=t.x-state.player.x,dy=t.y-state.player.y,d=Math.hypot(dx,dy),a=Math.atan2(dy,dx),diff=Math.atan2(Math.sin(a-state.player.angle),Math.cos(a-state.player.angle));
  if(Math.abs(diff)>.85||d>c.range+t.r)continue;if(d<dist){dist=d;target=t;isTower=true;isSnakeFood=false}
 }
 for(const b of state.bosses){
  if(!b.alive||(b.type==='dragon'&&b.mode!=='exhausted')||(b.type==='gunball'&&b.mode!=='vulnerable')||(b.type==='shadow'&&(b.mode==='throwing'||b.mode==='guarded'))||b.type==='snake')continue;
  const dx=b.x-state.player.x,dy=b.y-state.player.y,d=Math.hypot(dx,dy),a=Math.atan2(dy,dx),diff=Math.atan2(Math.sin(a-state.player.angle),Math.cos(a-state.player.angle));
  if(Math.abs(diff)>.85||d>c.range+b.r)continue;if(d<dist){dist=d;target=b;isTower=false;isSnakeFood=false}
 }
 return { target, isTower, isSnakeFood }
}

function shootGunner(){
 if(state.gunnerReload>0||state.gunnerAmmo<=0||state.gunnerShotTimer>0)return;
 const a=state.player.angle;
 sfx('gun');
 state.projectiles.push({x:state.player.x+Math.cos(a)*25,y:state.player.y+Math.sin(a)*25,vx:Math.cos(a)*950,vy:Math.sin(a)*950,life:1.2,damage:40,r:7,gunner:true});
 state.effects.push({type:'weapon',x:state.player.x,y:state.player.y,angle:a,life:.22,weapon:'gun'});
 state.gunnerAmmo--;state.gunnerShotTimer=.2;
 if(state.gunnerAmmo<=0){state.gunnerAmmo=0;state.gunnerReload=5;showGameMessage('GUNNER — NACHLADEN!')}
}

export function attack(){
 if(!state.gameRunning||state.paused||state.finished)return;
 if(state.selected==='ember'){
  if(state.emberBeamTimer>0||state.emberCooldown>0)return;
  state.emberBeamTimer=5;state.emberTick=.3;state.emberBeamAngle=state.player.angle;showGameMessage('EMBER — FEUERSTRAHL!');return
 }
 if(state.selected==='healer')return;
 if(state.selected==='gunner'){shootGunner();return}
 if(state.attackTimer>0)return;
 const c=classes[state.selected];state.attackTimer=state.cooldownOverride>0?state.cooldownOverride:c.cool;
 sfx(c.line?'whip':'slash');
 if(state.selected==='archer'){
  const { target, isSnakeFood }=pickRangedTarget();
  if(!target)return;
  const a=Math.atan2(target.y-state.player.y,target.x-state.player.x);state.player.angle=a;state.player.weaponAngle=a;
  sfx('bow');
  state.projectiles.push({x:state.player.x+Math.cos(a)*25,y:state.player.y+Math.sin(a)*25,vx:Math.cos(a)*760,vy:Math.sin(a)*760,life:.9,damage:c.damage,r:6});
  state.effects.push({type:'weapon',x:state.player.x,y:state.player.y,angle:a,life:.22,weapon:'bow'});return
 }
 if(c.line){
  /* PEITSCHE: trifft ALLES im Linien-Korridor (kleine Schlangen, Tuerme, Bosse) */
  state.effects.push({type:'slash',x:state.player.x,y:state.player.y,angle:state.player.angle,life:.2,r:c.range,weapon:'whip'});
  const hits=[];
  for(const a of state.smallSnakes){if(!a.destroyed&&inWhipLine(a.x,a.y,c.range+a.r))hits.push({t:a,k:'food'})}
  for(const t of state.infernoTowers){if(!t.destroyed&&inWhipLine(t.x,t.y,c.range+t.r))hits.push({t,k:'tower'})}
  for(const b of state.bosses){if(!b.alive||(b.type==='dragon'&&b.mode!=='exhausted')||(b.type==='gunball'&&b.mode!=='vulnerable')||(b.type==='shadow'&&(b.mode==='throwing'||b.mode==='guarded'))||b.type==='snake')continue;if(inWhipLine(b.x,b.y,c.range+b.r))hits.push({t:b,k:'boss'})}
  for(const h of hits){if(h.k==='food')damageSmallSnake(h.t,c.damage);else if(h.k==='tower')damageTower(h.t,c.damage);else damageBoss(h.t,c.damage)}
  return
 }
 if(c.pull){
  /* SAUGER (Hugo #47): die Fresspflanze in der Hand SAUGT den Gegner an.
     - Statue/Wurzel-Boss (z.B. PFLANZE, kann sich nicht bewegen): nur Schaden.
     - Beweglicher Gegner: wird angezogen — bei Beruehrung ist er kurz
       kampfunfaehig (kein Schaden von ihm) UND nimmt selbst Schaden, dann
       wird er nach hinten geschleudert und nimmt NOCHMAL Schaden. 2s Cooldown. */
  const pullPick = pickMeleeTarget(c);
  state.effects.push({type:'slash',x:state.player.x,y:state.player.y,angle:state.player.angle,life:.2,r:c.range,weapon:'sauger'});
  if(!pullPick.target)return;
  if(pullPick.isSnakeFood){damageSmallSnake(pullPick.target,c.damage);return}
  if(pullPick.isTower){damageTower(pullPick.target,c.damage);return}
  const b=pullPick.target;
  if(b.type==='plant'||b.saugerPull){damageBoss(b,c.damage);return} /* unbeweglich → nur Schaden */
  b.saugerPull={t:.55};sfx('tongue');
  showGameMessage('ANGESAUGT!',.9);
  return
 }
 const { target, isTower, isSnakeFood } = pickMeleeTarget(c);
 state.effects.push({type:'slash',x:state.player.x,y:state.player.y,angle:state.player.angle,life:.2,r:c.range,weapon:state.selected});
 if(target){if(isSnakeFood)damageSmallSnake(target,c.damage);else if(isTower)damageTower(target,c.damage);else damageBoss(target,c.damage)}
}

/* SAUGER-ANZIEHEN (Hugo #47): markierte Gegner werden zur Spielerin gezogen,
   Beruehrung = Stun + Schaden, Schleudern nach hinten + nochmal Schaden. */
export function updatePulls(dt){
 const p=state.player;
 for(const b of state.bosses){
  if(!b.alive||!b.saugerPull)continue;
  b.saugerPull.t-=dt;
  const dx=p.x-b.x,dy=p.y-b.y,d=Math.hypot(dx,dy)||1;
  if(d<b.r+p.r+2){
   delete b.saugerPull;
   b.stunTimer=1.2; /* kurz keinen Schaden machen */
   damageBoss(b,25);sfx('bite');
   const a=Math.atan2(b.y-p.y,b.x-p.x);
   b.x+=Math.cos(a)*230;b.y+=Math.sin(a)*230;
   b.x=Math.max(40,Math.min(MAP.w-40,b.x));b.y=Math.max(40,Math.min(MAP.h-40,b.y));
   damageBoss(b,15);state.screenShake=8; /* Schleudern + nochmal Schaden */
   for(let k=0;k<14;k++)particle(b.x,b.y,'#9be15d',3+Math.random()*3);
   continue
  }
  if(b.saugerPull&&b.saugerPull.t<=0){delete b.saugerPull;continue}
  /* ANZIEHEN: 430 px/s Richtung Spieler */
  const sp=430*dt;
  b.x+=dx/d*sp;b.y+=dy/d*sp;
  if(Math.random()<.5)particle(b.x-dx/d*b.r,b.y-dy/d*b.r,'#9be15d',3)
 }
}

export function dash(){
 if(!state.gameRunning||state.paused||state.finished||state.dashTimer>0)return;
 sfx('dash');
 let v=getInput(),x=v.x,y=v.y;if(Math.hypot(x,y)<.1){x=Math.cos(state.player.angle);y=Math.sin(state.player.angle)}
 const l=Math.hypot(x,y)||1;state.player.dashX=x/l;state.player.dashY=y/l;state.dashDuration=.22;state.dashTimer=1.15;state.invuln=.3
}

export function updateEmber(dt){
 if(state.emberBeamTimer>0){
  state.emberBeamTimer-=dt;state.emberBeamAngle=state.player.angle;state.emberTick-=dt;
  if(state.emberTick<=0){
   state.emberTick+=.3;const length=rayMapLength(state.player.x,state.player.y,state.emberBeamAngle),ex=state.player.x+Math.cos(state.emberBeamAngle)*length,ey=state.player.y+Math.sin(state.emberBeamAngle)*length;
   for(const t of state.infernoTowers){if(!t.destroyed&&pointSegmentDistance(t.x,t.y,state.player.x,state.player.y,ex,ey)<t.r+22)damageTower(t,20)}
   for(const a of state.smallSnakes){if(!a.destroyed&&pointSegmentDistance(a.x,a.y,state.player.x,state.player.y,ex,ey)<a.r+22)damageSmallSnake(a,20)}
   for(const b of state.bosses){if(!b.alive)continue;if(b.type==='dragon'&&b.mode!=='exhausted')continue;if(b.type==='gunball'&&b.mode!=='vulnerable')continue;if(b.type==='shadow'&&(b.mode==='throwing'||b.mode==='guarded'))continue;if(b.type==='snake')continue;if(pointSegmentDistance(b.x,b.y,state.player.x,state.player.y,ex,ey)<b.r+25)damageBoss(b,20)}
   for(let i=0;i<7;i++){const distance=Math.random()*Math.min(length,500),px=state.player.x+Math.cos(state.emberBeamAngle)*distance,py=state.player.y+Math.sin(state.emberBeamAngle)*distance;particle(px,py,Math.random()<.5?'#ffb52e':'#ff4b12',3+Math.random()*6)}
  }
  if(state.emberBeamTimer<=0){state.emberBeamTimer=0;state.emberCooldown=4;showGameMessage('EMBER — AUFLADEN')}
 }else state.emberCooldown=Math.max(0,state.emberCooldown-dt)
}
