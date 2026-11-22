import { state } from "../state.js";
import { BULLET_STATS, GUNBALL_HP, gunballMedium, gunballStrong, gunballWeak, MAP } from "../config.js";
import { damageBoss, damagePlayer, duelTargetOf, particle } from "../entities.js";
import { showGameMessage } from "../ui.js";

export function createGunball(x,y){
 state.bosses.push({id:++state.spawnId,type:'gunball',x,y,r:82,hp:GUNBALL_HP,maxHp:GUNBALL_HP,alive:true,angle:0,rotation:0,flash:0,mode:'attacking',phaseTimer:10,weaponIndex:0,weaponTimer:0,fireTimer:0,attackCooldown:0,attackName:'',wobble:0})
}

function chooseGunballBullet(){
 const roll=Math.random()*100;
 const pool=roll<50?gunballWeak:roll<85?gunballMedium:gunballStrong;
 return pool[Math.floor(Math.random()*pool.length)]
}

function fireGunballBullet(b,type){
 const T=duelTargetOf(b);
 const a=Math.atan2(T.y-b.y,T.x-b.x);
 const s=BULLET_STATS[type],spread=(Math.random()-.5)*.32;
 const angle=a+spread;
 if(type==='rain'){
  const side=Math.floor(Math.random()*4),x=side===0?Math.random()*MAP.w:side===1?Math.random()*MAP.w:side===2?0:MAP.w;
  const y=side===0?0:side===1?MAP.h:Math.random()*MAP.h;
  const tx=T.x,ty=T.y;
  const aa=Math.atan2(ty-y,tx-x);
  state.enemyProjectiles.push({x,y,vx:Math.cos(aa)*390,vy:Math.sin(aa)*390,r:s.r,life:s.life,damage:s.damage,type,age:0});
  return
 }
 state.enemyProjectiles.push({x:b.x+Math.cos(angle)*90,y:b.y+Math.sin(angle)*90,vx:Math.cos(angle)*s.speed,vy:Math.sin(angle)*s.speed,r:s.r,life:s.life,damage:s.damage,type,age:0,baseAngle:angle,originX:b.x,originY:b.y,phase:Math.random()*6.28,split:false,teleported:false,initialSpeed:s.speed,orbit:Math.random()*6.28})
 if(type==='mirror'){
  const aa=a-spread;
  state.enemyProjectiles.push({x:b.x+Math.cos(aa)*90,y:b.y+Math.sin(aa)*90,vx:Math.cos(aa)*s.speed,vy:Math.sin(aa)*s.speed,r:s.r,life:s.life,damage:s.damage,type:'mirror',age:0,baseAngle:aa,phase:0})
 }
 if(type==='chain'){
  for(let i=1;i<=3;i++)state.enemyProjectiles.push({x:b.x+Math.cos(angle)*90-i*25*Math.cos(angle),y:b.y+Math.sin(angle)*90-i*25*Math.sin(angle),vx:Math.cos(angle)*s.speed,vy:Math.sin(angle)*s.speed,r:9,life:s.life,damage:12,type:'chainLink',age:0,baseAngle:angle})
 }
 if(type==='planet'){
  for(let i=0;i<3;i++)state.enemyProjectiles.push({x:b.x+Math.cos(angle)*90,y:b.y+Math.sin(angle)*90,vx:Math.cos(angle)*s.speed,vy:Math.sin(angle)*s.speed,r:8,life:s.life,damage:10,type:'planetMoon',age:0,orbit:i*2.094,orbitParent:state.enemyProjectiles[state.enemyProjectiles.length-1]})
 }
 if(type==='fusion'){
  state.enemyProjectiles.push({x:b.x-Math.cos(angle)*90,y:b.y-Math.sin(angle)*90,vx:Math.cos(angle+.3)*s.speed,vy:Math.sin(angle+.3)*s.speed,r:17,life:s.life,damage:24,type:'fusion',age:0,baseAngle:angle+.3})
 }
}

export function updateGunball(b,dt){
 b.rotation+=dt*2.8;b.wobble+=dt*3;b.flash=Math.max(0,b.flash-dt);
 const T=duelTargetOf(b);
 b.angle=Math.atan2(T.y-b.y,T.x-b.x);
 b.phaseTimer-=dt;
 if(b.mode==='attacking'){
  b.weaponTimer-=dt;
  if(b.weaponTimer<=0){b.weaponIndex=(b.weaponIndex+1)%4;b.weaponTimer=2.5}
  b.fireTimer-=dt;
  if(b.fireTimer<=0&&!(state.peace&&T===state.player)){
   const type=chooseGunballBullet();
   fireGunballBullet(b,type);
   b.attackName=type;
   b.fireTimer=.03;
  }
  if(b.phaseTimer<=0){
   b.mode='vulnerable';b.phaseTimer=5;
   showGameMessage('GUNBALL — VERWUNDBAR!');
   for(let i=0;i<35;i++)particle(b.x,b.y,'#c4a0ff',4+Math.random()*5)
  }
 }else{
  if(b.phaseTimer<=0){
   b.mode='attacking';b.phaseTimer=10;b.fireTimer=.15;
   showGameMessage('GUNBALL — WAFFEN AKTIV!');
  }
 }
 const targetDistance=b.mode==='attacking'?320:250;
 const dx=T.x-b.x,dy=T.y-b.y,d=Math.hypot(dx,dy)||1;
 if(d>targetDistance+50){b.x+=dx/d*90*dt;b.y+=dy/d*90*dt}
 else if(d<targetDistance-50){b.x-=dx/d*75*dt;b.y-=dy/d*75*dt}
 b.x=Math.max(130,Math.min(MAP.w-130,b.x));b.y=Math.max(130,Math.min(MAP.h-130,b.y));
 if(d<(T===state.player?state.player.r:T.r)+b.r*.7&&b.attackCooldown<=0){T===state.player?damagePlayer(22):damageBoss(T,22,true);b.attackCooldown=1.1}
 b.attackCooldown=Math.max(0,b.attackCooldown-dt)
}
