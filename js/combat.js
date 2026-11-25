import { state } from "./state.js";
import { classes } from "./config.js";
import { damageBoss, damageTower, damagePlayer, particle } from "./entities.js";
import { damageSmallSnake } from "./bosses/snake.js";
import { getInput } from "./input.js";
import { showGameMessage } from "./ui.js";
import { pointSegmentDistance, rayMapLength } from "./utils.js";

function pickRangedTarget(){
 let target=null,dist=Infinity,isSnakeFood=false;
 for(const a of state.smallSnakes){if(a.destroyed)continue;const d=Math.hypot(a.x-state.player.x,a.y-state.player.y);if(d<dist){dist=d;target=a;isSnakeFood=true}}
 for(const t of state.infernoTowers){if(t.destroyed)continue;const d=Math.hypot(t.x-state.player.x,t.y-state.player.y);if(d<dist){dist=d;target=t;isSnakeFood=false}}
 for(const b of state.bosses){if(!b.alive||(b.type==='dragon'&&b.mode!=='exhausted')||(b.type==='gunball'&&b.mode!=='vulnerable')||(b.type==='shadow'&&(b.mode==='throwing'||b.mode==='guarded'))||b.type==='snake')continue;const d=Math.hypot(b.x-state.player.x,b.y-state.player.y);if(d<dist){dist=d;target=b;isSnakeFood=false}}
 return { target, isSnakeFood }
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
 if(state.selected==='archer'){
  const { target, isSnakeFood }=pickRangedTarget();
  if(!target)return;
  const a=Math.atan2(target.y-state.player.y,target.x-state.player.x);state.player.angle=a;state.player.weaponAngle=a;
  state.projectiles.push({x:state.player.x+Math.cos(a)*25,y:state.player.y+Math.sin(a)*25,vx:Math.cos(a)*760,vy:Math.sin(a)*760,life:.9,damage:c.damage,r:6});
  state.effects.push({type:'weapon',x:state.player.x,y:state.player.y,angle:a,life:.22,weapon:'bow'});return
 }
 const { target, isTower, isSnakeFood } = pickMeleeTarget(c);
 state.effects.push({type:'slash',x:state.player.x,y:state.player.y,angle:state.player.angle,life:.2,r:c.range,weapon:state.selected});
 if(target){if(isSnakeFood)damageSmallSnake(target,c.damage);else if(isTower)damageTower(target,c.damage);else damageBoss(target,c.damage)}
}

export function dash(){
 if(!state.gameRunning||state.paused||state.finished||state.dashTimer>0)return;
 let v=getInput(),x=v.x,y=v.y;if(Math.hypot(x,y)<.1){x=Math.cos(state.player.angle);y=Math.sin(state.player.angle)}
 if(!isFinite(x))x=1;if(!isFinite(y))y=0; // NaN-Feuerwehr
 if(!isFinite(state.player.angle))state.player.angle=-Math.PI/2;
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
