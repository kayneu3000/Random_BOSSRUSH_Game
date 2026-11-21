import { state } from "../state.js";
import { SLIME_DASH, SLIME_DMG, SLIME_HP, SLIME_R, SLIME_SPEED } from "../config.js";
import { damageBoss, damagePlayer, duelTargetOf } from "../entities.js";

export function createSlime(x,y,tier){
 const hp=SLIME_HP[tier],r=SLIME_R[tier];
 state.bosses.push({id:++state.spawnId,x,y,r,hp,maxHp:hp,tier,vx:0,vy:0,angle:0,wait:Math.random()*1.2,dash:0,flash:0,attackCooldown:0,wobble:Math.random()*6.28,alive:true,type:'slime'})
}

export function updateSlime(b,dt){
 b.wobble+=dt*5;b.flash=Math.max(0,b.flash-dt);b.attackCooldown=Math.max(0,b.attackCooldown-dt);
 const T=duelTargetOf(b);
 const dx=T.x-b.x,dy=T.y-b.y,d=Math.hypot(dx,dy)||1;b.angle=Math.atan2(dy,dx);
 if(b.dash>0){b.x+=b.vx*dt;b.y+=b.vy*dt;b.vx*=Math.pow(.38,dt);b.vy*=Math.pow(.38,dt);b.dash=Math.max(0,b.dash-dt);if(b.dash===0)b.wait=2}
 else if(b.wait>0){b.wait=Math.max(0,b.wait-dt);b.vx=b.vy=0}
 else{const speed=SLIME_SPEED[b.tier];b.vx=dx/d*speed;b.vy=dy/d*speed;b.dash=SLIME_DASH[b.tier]}
 const contact=Math.hypot(T.x-b.x,T.y-b.y),tr=T===state.player?state.player.r:T.r;
 if(contact<tr+b.r-3){
  if(b.dash>0&&b.attackCooldown<=0){T===state.player?damagePlayer(SLIME_DMG[b.tier]):damageBoss(T,SLIME_DMG[b.tier],true);b.attackCooldown=1}
  if(T===state.player){const push=state.player.r+b.r-contact;if(push>0){state.player.x+=(state.player.x-b.x)/(contact||1)*(push+5);state.player.y+=(state.player.y-b.y)/(contact||1)*(push+5)}}
 }
}
