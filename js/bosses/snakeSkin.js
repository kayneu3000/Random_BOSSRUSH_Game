import { state } from "../state.js";
import { MAP, SKIN_HP, VENOM } from "../config.js";
import { damagePlayer, duelTargetOf, particle } from "../entities.js";
import { showGameMessage } from "../ui.js";

export function createSnakeSkin(x,y){
 state.bosses.push({id:++state.spawnId,type:'snakeSkin',x,y,r:42,hp:SKIN_HP,maxHp:SKIN_HP,alive:true,flash:0,wobble:0,mode:'circle',sprintTimer:0,sprintDx:0,sprintDy:0,sprintCooldown:2,venomCooldown:1.2,attackCooldown:0,orbitDir:Math.random()<.5?1:-1,angle:0})
}

function clampArena(b){
 b.x=Math.max(120,Math.min(MAP.w-120,b.x));b.y=Math.max(120,Math.min(MAP.h-120,b.y))
}

function fireVenom(b){
 const T=duelTargetOf(b);
 const base=Math.atan2(T.y-b.y,T.x-b.x);
 for(const off of [-.1,.1]){
  const a=base+off;
  state.enemyProjectiles.push({x:b.x+Math.cos(a)*b.r,y:b.y+Math.sin(a)*b.r,vx:Math.cos(a)*VENOM.speed,vy:Math.sin(a)*VENOM.speed,r:VENOM.r,life:VENOM.life,damage:VENOM.damage,type:'venom',age:0})
 }
}

export function updateSnakeSkin(b,dt){
 b.wobble+=dt*4;b.flash=Math.max(0,b.flash-dt);
 b.attackCooldown=Math.max(0,b.attackCooldown-dt);
 b.venomCooldown-=dt;
 const T=duelTargetOf(b);
 b.angle=Math.atan2(T.y-b.y,T.x-b.x);
 if(b.venomCooldown<=0){fireVenom(b);b.venomCooldown=1.5}
 const dx=T.x-b.x,dy=T.y-b.y,d=Math.hypot(dx,dy)||1;
 if(b.mode==='sprint'){
  b.sprintTimer-=dt;
  b.x+=b.sprintDx*470*dt;b.y+=b.sprintDy*470*dt; /* Hugo: Haut etwas langsamer */
  if(b.sprintTimer<=0){b.mode='circle';b.sprintCooldown=2.1}
 }else{
  b.sprintCooldown-=dt;
  const wantD=240,ux=dx/d,uy=dy/d;
  const vx=ux*(d-wantD)*1.0-uy*b.orbitDir*175;
  const vy=uy*(d-wantD)*1.0+ux*b.orbitDir*175;
  b.x+=vx*dt;b.y+=vy*dt;
  if(b.sprintCooldown<=0&&d<620){
   b.mode='sprint';b.sprintTimer=.7;
   b.sprintDx=ux;b.sprintDy=uy;
   if(Math.random()<.3)b.orbitDir*=-1
  }
 }
 clampArena(b);
 const tr=T===state.player?state.player.r:T.r;
 const contact=Math.hypot(T.x-b.x,T.y-b.y)<tr+b.r*.9;
 if(contact&&b.attackCooldown<=0){
  if(T===state.player){
   damagePlayer(22);
   showGameMessage('SCHWANZSCHLAG!',1);
   b.attackCooldown=1
  }else if(T.alive&&T.type!=='snake'){
   b.attackCooldown=1
  }
 }
}
