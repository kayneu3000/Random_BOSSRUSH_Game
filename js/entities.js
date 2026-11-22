import { state } from "./state.js";
import { createSlime } from "./bosses/slime.js";
import { exhaustDragon } from "./bosses/dragon.js";
import { exhaustShadow } from "./bosses/shadow.js";
import { endGame } from "./ui.js";
import { $ } from "./utils.js";

export function createHealerSlimes(){
 for(let i=0;i<2;i++)state.companions.push({x:state.player.x+(i===0?-55:55),y:state.player.y+35,r:20,hp:Infinity,maxHp:Infinity,side:i===0?-1:1,attackCooldown:2,wobble:Math.random()*6.28,type:'healerCompanion'})
}

export function updateCompanions(dt){
 if(state.selected!=='healer'||state.companions.length===0)return;
 for(const comp of state.companions){
  comp.wobble+=dt*4;
  const targetX=state.player.x+Math.cos(state.player.angle+Math.PI/2)*comp.side*48-Math.cos(state.player.angle)*45;
  const targetY=state.player.y+Math.sin(state.player.angle+Math.PI/2)*comp.side*48-Math.sin(state.player.angle)*45;
  const dx=targetX-comp.x,dy=targetY-comp.y;
  comp.x+=dx*Math.min(1,dt*5.5);comp.y+=dy*Math.min(1,dt*5.5);
  comp.attackCooldown-=dt;if(comp.attackCooldown>0)continue;
  let target=null,dist=Infinity;
  for(const b of state.bosses){if(!b.alive||(b.type==='dragon'&&b.mode!=='exhausted')||(b.type==='gunball'&&b.mode!=='vulnerable')||(b.type==='shadow'&&(b.mode==='throwing'||b.mode==='guarded')))continue;const td=Math.hypot(b.x-comp.x,b.y-comp.y);if(td<dist){dist=td;target=b}}
  for(const t of state.infernoTowers){if(t.destroyed)continue;const td=Math.hypot(t.x-comp.x,t.y-comp.y);if(td<dist){dist=td;target=t}}
  if(target&&dist<650){
   if(target.type==='dragon'||target.type==='slime'||target.type==='gunball'||target.type==='shadow')damageBoss(target,10);else damageTower(target,10);
   state.effects.push({type:'companionHit',x:comp.x,y:comp.y,tx:target.x,ty:target.y,life:.22});comp.attackCooldown=2
  }else comp.attackCooldown=.25
 }
}

export function splitSlime(b){
 if(b.tier>=4)return;
 for(let i=0;i<2;i++){const a=Math.PI*i+Math.random()*.3;createSlime(b.x+Math.cos(a)*b.r*.65,b.y+Math.sin(a)*b.r*.65,b.tier+1)}
 if(b.duelTarget)for(const kid of state.bosses.slice(-2))kid.duelTarget=b.duelTarget;
 for(let i=0;i<30;i++)particle(b.x,b.y,'#55dfff',Math.random()*5+2);
 state.screenShake=8
}

let dummyTarget = null;
export function duelTargetOf(b){
 const t=b.duelTarget;
 if(t&&t.alive)return t;
 if(state.notMe){
  if(!dummyTarget)dummyTarget={type:'dummy',r:60,hp:999999,maxHp:999999,alive:true,x:0,y:0};
  dummyTarget.x=state.arena.w/2;dummyTarget.y=state.arena.h/2;
  return dummyTarget
 }
 return state.player
}

export function particle(x,y,color,size){
 state.particles.push({x,y,vx:(Math.random()-.5)*240,vy:(Math.random()-.5)*240,life:.4+Math.random()*.6,max:.8,color,size})
}

export function damageBoss(b,amount,ignoreGuard){
 if(!b.alive)return;
 if(!ignoreGuard){if(b.type==='dragon'&&b.mode!=='exhausted')return;if(b.type==='gunball'&&b.mode!=='vulnerable')return;if(b.type==='shadow'&&(b.mode==='throwing'||b.mode==='guarded'))return}
 b.hp-=amount*(state.dmgMultiplier||1);b.flash=.13;
 for(let i=0;i<3;i++)particle(b.x,b.y,b.type==='dragon'?'#ffad55':b.type==='gunball'?'#c7a2ff':'#a7f7ff',3+Math.random()*3);
 if(b.hp<=0){
  b.hp=0;b.alive=false;state.kills++;
  if(b.type==='slime')splitSlime(b);
  $('kills').textContent=state.kills+' besiegt'
 }
}

export function damageTower(t,amount){
 if(t.destroyed)return;t.hp-=amount*(state.dmgMultiplier||1);
 for(let i=0;i<5;i++)particle(t.x,t.y,'#ff4d24',4+Math.random()*4);
 if(t.hp<=0){t.hp=0;t.destroyed=true;t.eyeOn=false;state.screenShake=10;for(let i=0;i<30;i++)particle(t.x,t.y,'#ff632d',Math.random()*8+2);state.effects.push({type:'towerDestroy',x:t.x,y:t.y,life:1});if(state.infernoTowers.every(q=>q.destroyed)){if(state.bosses.some(b=>b.type==='dragon'&&b.alive))exhaustDragon();if(state.bosses.some(b=>b.type==='shadow'&&b.alive))exhaustShadow()}}
}

export function damagePlayer(amount){
 if(state.invincible||state.peace||state.invuln>0||state.finished)return;
 if(state.brutal)amount*=1.5;
 if(state.selected==='tank')amount*=.5;
 state.player.hp-=amount;state.invuln=.65;state.screenShake=9;
 for(let i=0;i<12;i++)particle(state.player.x,state.player.y,'#ff725f',4);
 if(state.player.hp<=0){state.player.hp=0;endGame(false)}
}

export function updateVisualEffects(dt){
 for(const e of state.effects)e.life-=dt;
 state.effects=state.effects.filter(e=>e.life>0);
 for(const p of state.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.pow(.08,dt);p.vy*=Math.pow(.08,dt);p.life-=dt}
 state.particles=state.particles.filter(p=>p.life>0)
}
