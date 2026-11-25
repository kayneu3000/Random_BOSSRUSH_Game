import { state } from "./state.js";
import { damageBoss, damagePlayer, damageTower } from "./entities.js";
import { damageSmallSnake } from "./bosses/snake.js";

export function updatePlayerProjectiles(dt){
 for(const p of state.projectiles){
  if(!isFinite(p.x+p.y+p.vx+p.vy))p.life=0; // NaN-Feuerwehr
  p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;if(p.life<=0)continue;
  for(const t of state.infernoTowers){if(!t.destroyed&&Math.hypot(p.x-t.x,p.y-t.y)<p.r+t.r){damageTower(t,p.damage);p.life=0;break}}
  if(p.life<=0)continue;
  for(const a of state.smallSnakes){if(!a.destroyed&&Math.hypot(p.x-a.x,p.y-a.y)<p.r+a.r){damageSmallSnake(a,p.damage);p.life=0;break}}
  if(p.life<=0)continue;
  for(const b of state.bosses){if(!b.alive||(b.type==='dragon'&&b.mode!=='exhausted')||(b.type==='gunball'&&b.mode!=='vulnerable')||(b.type==='shadow'&&(b.mode==='throwing'||b.mode==='guarded'))||b.type==='snake')continue;if(Math.hypot(p.x-b.x,p.y-b.y)<p.r+b.r){damageBoss(b,p.damage);p.life=0;break}}
 }
 state.projectiles=state.projectiles.filter(p=>p.life>0)
}

function moveEnemyProjectile(p,dt){
 p.age=(p.age||0)+dt;
 if(p.type==='snake'){
  p.phase+=dt*5;p.vx+=Math.cos(p.phase)*180*dt;p.vy+=Math.sin(p.phase)*180*dt;
  const l=Math.hypot(p.vx,p.vy)||1;p.vx=p.vx/l*250;p.vy=p.vy/l*250
 }else if(p.type==='boomerang'){
  if(p.age>1.8){const b=state.bosses.find(q=>q.type==='gunball');if(b){const a=Math.atan2(b.y-p.y,b.x-p.x);p.vx+=Math.cos(a)*500*dt;p.vy+=Math.sin(a)*500*dt}}
 }else if(p.type==='growth'){p.r=Math.min(35,p.r+dt*4);p.vx*=1+dt*.08;p.vy*=1+dt*.08}
 else if(p.type==='teleport'&&p.age>1.2&&!p.teleported){p.x+=Math.cos(p.baseAngle+Math.PI/2)*100;p.y+=Math.sin(p.baseAngle+Math.PI/2)*100;p.teleported=true}
 else if(p.type==='splitter'&&p.age>1.5&&!p.split){
  p.split=true;
  for(let i=0;i<8;i++){const a=i*Math.PI/4;state.enemyProjectiles.push({x:p.x,y:p.y,vx:Math.cos(a)*310,vy:Math.sin(a)*310,r:8,life:3.5,damage:10,type:'shard',age:0})}
  p.life=0
 }else if(p.type==='time'){
  const factor=p.age<1.2?.38:p.age<2.2?1.7:1;
  p.x+=p.vx*factor*dt;p.y+=p.vy*factor*dt
 }else if(p.type==='blackhole'){
  const dx=p.x-state.player.x,dy=p.y-state.player.y,d=Math.hypot(dx,dy)||1;
  if(d<260){state.player.x+=dx/d*150*dt;state.player.y+=dy/d*150*dt}
  p.x+=p.vx*dt;p.y+=p.vy*dt
 }else if(p.type==='magnet'){
  const dx=state.player.x-p.x,dy=state.player.y-p.y,d=Math.hypot(dx,dy)||1;
  p.vx+=dx/d*70*dt;p.vy+=dy/d*70*dt;p.x+=p.vx*dt;p.y+=p.vy*dt
 }else if(p.type==='core'){
  if(p.age>2.5){p.r=Math.min(65,p.r+dt*24);p.vx*=1.02;p.vy*=1.02}
  p.x+=p.vx*dt;p.y+=p.vy*dt
 }else{p.x+=p.vx*dt;p.y+=p.vy*dt}
 if(p.type==='mirror'&&p.age>1.4&&!p.mirrored){p.mirrored=true;p.vy=-p.vy}
 if(p.type==='planetMoon'&&p.orbitParent&&p.orbitParent.life>0){
  p.x=p.orbitParent.x+Math.cos(p.orbit+p.age*4)*36;p.y=p.orbitParent.y+Math.sin(p.orbit+p.age*4)*36
 }
}

export function updateEnemyProjectiles(dt){
 for(const p of state.enemyProjectiles){
  if(!isFinite(p.x+p.y+p.vx+p.vy)&&p.type!=='planetMoon'){p.life=0;continue} // NaN-Feuerwehr
  if(p.type==='fireball'||!p.type){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt}
  else moveEnemyProjectile(p,dt);
  if(p.life>0&&Math.hypot(p.x-state.player.x,p.y-state.player.y)<p.r+state.player.r){damagePlayer(p.damage);p.life=0}
  if(p.life>0&&state.friendlyFire&&(p.age||0)>.35){
   for(const b of state.bosses){if(!b.alive)continue;if(Math.hypot(p.x-b.x,p.y-b.y)<p.r+b.r){damageBoss(b,p.damage,true);p.life=0;break}}
  }
 }
 state.enemyProjectiles=state.enemyProjectiles.filter(p=>p.life>0)
}

export function updateFireTrails(dt){
 for(const f of state.fireTrails){f.life-=dt;f.cooldown-=dt;if(Math.hypot(state.player.x-f.x,state.player.y-f.y)<f.r+state.player.r&&f.cooldown<=0){damagePlayer(f.damage);f.cooldown=.6}}
 state.fireTrails=state.fireTrails.filter(f=>f.life>0)
}
