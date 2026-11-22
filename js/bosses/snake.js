import { state } from "../state.js";
import { MAP, SNAKE_START_SEGMENTS, SNAKE_MAX_SEGMENTS, SNAKE_SEGMENT_HP, APPLE_HP, APPLE_MAX, VENOM } from "../config.js";
import { damagePlayer, duelTargetOf, particle } from "../entities.js";
import { showGameMessage } from "../ui.js";
import { $ } from "../utils.js";

export function headRadiusOf(snake){
 return 34+snake.segments*2
}

export function createSnake(x,y){
 const segments=SNAKE_START_SEGMENTS, maxHp=segments*SNAKE_SEGMENT_HP;
 state.bosses.push({id:++state.spawnId,type:'snake',x,y,r:headRadiusOf({segments}),hp:maxHp,maxHp,alive:true,flash:0,wobble:0,segments,trail:[],venomCooldown:1,whipCooldown:3.5,whipTimer:0,whipDx:0,whipDy:0,appleTimer:.5,attackCooldown:0})
}

function clampArena(b){
 b.x=Math.max(120,Math.min(MAP.w-120,b.x));b.y=Math.max(120,Math.min(MAP.h-120,b.y))
}

export function updateApples(dt){
 const snake=state.bosses.find(b=>b.type==='snake'&&b.alive);
 state.apples=state.apples.filter(a=>!a.destroyed);
 for(const a of state.apples)a.wobble+=dt*3;
 if(!snake)return;
 snake.appleTimer-=dt;
 if(state.apples.length<APPLE_MAX&&snake.appleTimer<=0){
  let ax=0,ay=0,ok=false;
  for(let tries=0;tries<25&&!ok;tries++){
   ax=140+Math.random()*(MAP.w-280);ay=140+Math.random()*(MAP.h-280);
   ok=Math.hypot(ax-snake.x,ay-snake.y)>300
  }
  if(ok)state.apples.push({x:ax,y:ay,r:26,hp:APPLE_HP,maxHp:APPLE_HP,wobble:Math.random()*6.28,destroyed:false});
  snake.appleTimer=3+Math.random()
 }
}

function snakeEats(snake){
 for(const a of state.apples){
  if(a.destroyed)continue;
  if(Math.hypot(a.x-snake.x,a.y-snake.y)<snake.r+a.r){
   a.destroyed=true;
   if(snake.segments<SNAKE_MAX_SEGMENTS)snake.segments+=1;
   snake.maxHp+=SNAKE_SEGMENT_HP;snake.hp=Math.min(snake.maxHp,snake.hp+SNAKE_SEGMENT_HP);
   snake.r=headRadiusOf(snake);
   for(let i=0;i<22;i++)particle(a.x,a.y,'#ff5a4a',3+Math.random()*4);
   showGameMessage('SNAKE HAT EINEN APFEL GEGESSEN \u2014 ER W\u00c4CHST UND WIRD ST\u00c4RKER!',2)
  }
 }
 for(let i=0;i<4;i++)particle(snake.x+(Math.random()-.5)*snake.r,snake.y+(Math.random()-.5)*snake.r,'#7dff3f',2)
}

function fireVenom(snake){
 const T=duelTargetOf(snake);
 const base=Math.atan2(T.y-snake.y,T.x-snake.x);
 for(const off of [-.09,.09]){
  const a=base+off;
  state.enemyProjectiles.push({x:snake.x+Math.cos(a)*snake.r,y:snake.y+Math.sin(a)*snake.r,vx:Math.cos(a)*VENOM.speed,vy:Math.sin(a)*VENOM.speed,r:VENOM.r,life:VENOM.life,damage:VENOM.damage,type:'venom',age:0})
 }
}

function hungryDamage(snake){
 snake.segments-=1;
 snake.maxHp=Math.max(SNAKE_SEGMENT_HP,snake.maxHp-SNAKE_SEGMENT_HP);
 snake.hp=Math.max(0,snake.hp-SNAKE_SEGMENT_HP);
 snake.r=headRadiusOf(snake);
 snake.flash=.15;
 for(let i=0;i<20;i++)particle(snake.x,snake.y,Math.random()<.5?'#7dff3f':'#b6ff4e',3+Math.random()*4);
 state.screenShake=8;
 if(snake.segments<=0){
  snake.segments=0;snake.hp=0;snake.alive=false;state.kills++;
  $('kills').textContent=state.kills+' besiegt';
  showGameMessage('NUR NOCH DER KOPF \u2014 SNAKE IST BESIEGT!',2.6);
  for(let i=0;i<60;i++)particle(snake.x,snake.y,Math.random()<.5?'#3fae4a':'#7dff3f',3+Math.random()*6);
  state.screenShake=14
 }else{
  showGameMessage('HUNGER! SNAKE SCHRUMPFT \u2014 '+snake.segments+' SEGMENTE \u00dcBRIG',1.6)
 }
}

export function damageApple(a,amount){
 if(a.destroyed)return;
 a.hp-=amount*(state.dmgMultiplier||1);
 for(let i=0;i<3;i++)particle(a.x,a.y,'#ffe9b0',2+Math.random()*3);
 if(a.hp<=0){
  a.hp=0;a.destroyed=true;
  for(let i=0;i<16;i++)particle(a.x,a.y,'#ff5a4a',3+Math.random()*4);
  const snake=state.bosses.find(b=>b.type==='snake'&&b.alive);
  if(snake)hungryDamage(snake);
  else showGameMessage('APFEL ZERST\u00d6RT!',1.2)
 }
}

function trailPoints(snake){
 const pts=[{x:snake.x,y:snake.y}];
 for(const t of snake.trail)pts.push(t);
 return pts
}

export function updateSnake(b,dt){
 b.wobble+=dt*3;b.flash=Math.max(0,b.flash-dt);
 b.attackCooldown=Math.max(0,b.attackCooldown-dt);
 b.venomCooldown-=dt;b.whipCooldown-=dt;
 const T=duelTargetOf(b);
 const TisPlayer=T===state.player;

 updateApples(dt);
 snakeEats(b);

 let target=null,dist=Infinity;
 for(const a of state.apples){if(a.destroyed)continue;const d=Math.hypot(a.x-b.x,a.y-b.y);if(d<dist){dist=d;target=a}}
 const speed=target?105:130;

 if(b.whipTimer>0){
  b.whipTimer-=dt;
  b.x+=b.whipDx*500*dt;b.y+=b.whipDy*500*dt;
  if(b.whipTimer<=0)clampArena(b)
 }else{
  if(target){
   const dx=target.x-b.x,dy=target.y-b.y,d=Math.hypot(dx,dy)||1;
   b.x+=dx/d*speed*dt;b.y+=dy/d*speed*dt
  }else{
   const dx=T.x-b.x,dy=T.y-b.y,d=Math.hypot(dx,dy)||1;
   b.x+=dx/d*speed*dt;b.y+=dy/d*speed*dt;
   if(b.whipCooldown<=0&&d>150){
    b.whipDx=dx/d;b.whipDy=dy/d;b.whipTimer=.6;b.whipCooldown=4;
    if(TisPlayer)showGameMessage('SNAKE PEITSCHT MIT SEINEM K\u00d6RPER ZU!',1.4)
   }
  }
 }
 clampArena(b);

 const last=b.trail[0];
 if(!last||Math.hypot(b.x-last.x,b.y-last.y)>22)b.trail.unshift({x:b.x,y:b.y});
 if(b.trail.length>(b.segments+2)*3)b.trail.length=(b.segments+2)*3;

 if(b.venomCooldown<=0){fireVenom(b);b.venomCooldown=1.1}

 const pts=trailPoints(b).slice(0,b.segments+1);
 for(let i=0;i<b.segments;i++){
  const p=pts[Math.min(pts.length-1,i+1)];
  if(!p)break;
  const sr=b.r*(1-(i/(b.segments+2))*.5);
  if(TisPlayer){
   if(Math.hypot(T.x-p.x,T.y-p.y)<T.r+sr*.75&&b.attackCooldown<=0){
    damagePlayer(b.whipTimer>0?30:25);
    b.attackCooldown=1.2;break
   }
  }else if(T.alive&&Math.hypot(T.x-p.x,T.y-p.y)<T.r+sr*.75&&b.attackCooldown<=0){
   b.attackCooldown=1.2;break
  }
 }
 if(TisPlayer&&Math.hypot(T.x-b.x,T.y-b.y)<T.r+b.r*.7&&b.attackCooldown<=0){
  damagePlayer(b.whipTimer>0?30:25);
  b.attackCooldown=1.2
 }
}
