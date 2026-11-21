import { state } from "../state.js";
import { SLIME_DASH, SLIME_DMG, SLIME_HP, SLIME_R, SLIME_SPEED } from "../config.js";
import { damagePlayer } from "../entities.js";

export function createSlime(x,y,tier){
 const hp=SLIME_HP[tier],r=SLIME_R[tier];
 state.bosses.push({id:++state.spawnId,x,y,r,hp,maxHp:hp,tier,vx:0,vy:0,angle:0,wait:Math.random()*1.2,dash:0,flash:0,attackCooldown:0,wobble:Math.random()*6.28,alive:true,type:'slime'})
}

export function updateSlime(b,dt){
 b.wobble+=dt*5;b.flash=Math.max(0,b.flash-dt);b.attackCooldown=Math.max(0,b.attackCooldown-dt);
 const dx=state.player.x-b.x,dy=state.player.y-b.y,d=Math.hypot(dx,dy)||1;b.angle=Math.atan2(dy,dx);
 if(b.dash>0){b.x+=b.vx*dt;b.y+=b.vy*dt;b.vx*=Math.pow(.38,dt);b.vy*=Math.pow(.38,dt);b.dash=Math.max(0,b.dash-dt);if(b.dash===0)b.wait=2}
 else if(b.wait>0){b.wait=Math.max(0,b.wait-dt);b.vx=b.vy=0}
 else{const speed=SLIME_SPEED[b.tier];b.vx=dx/d*speed;b.vy=dy/d*speed;b.dash=SLIME_DASH[b.tier]}
 const contact=Math.hypot(state.player.x-b.x,state.player.y-b.y);
 if(contact<state.player.r+b.r-3){
  if(b.dash>0&&b.attackCooldown<=0){damagePlayer(SLIME_DMG[b.tier]);b.attackCooldown=1}
  const push=state.player.r+b.r-contact;if(push>0){state.player.x+=(state.player.x-b.x)/(contact||1)*(push+5);state.player.y+=(state.player.y-b.y)/(contact||1)*(push+5)}
 }
}
