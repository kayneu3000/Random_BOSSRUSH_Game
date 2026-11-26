import { state } from "../state.js";
import { MAP, SNAKE_START_SEGMENTS, SNAKE_MAX_SEGMENTS, SNAKE_SEGMENT_HP, SMALL_SNAKE_HP, SMALL_SNAKE_MAX } from "../config.js";
import { particle } from "../entities.js";
import { showGameMessage, endGame } from "../ui.js";
import { $ } from "../utils.js";
import { createSnakeSkin } from "./snakeSkin.js";

export function headRadiusOf(snake){
 return 34+snake.segments*2
}

export function createSnake(x,y){
 // HUGO-SKALA: Bossleiste in Zehnteln — maxHp ist IMMER 10 Segment-Schritte,
 // hp ist Segmente*100. Ein verlorenes Segment = -1/10 Leiste, eine gegessene
 // kleine Schlange = +1/10 Leiste.
 const segments=SNAKE_START_SEGMENTS, maxHp=SNAKE_MAX_SEGMENTS*SNAKE_SEGMENT_HP;
 state.bosses.push({id:++state.spawnId,type:'snake',x,y,r:headRadiusOf({segments}),hp:segments*SNAKE_SEGMENT_HP,maxHp,alive:true,flash:0,wobble:0,segments,trail:[],appleTimer:.5,hungerTimer:0,skinRespawn:-1,attackCooldown:0,faceAngle:Math.random()*Math.PI*2,faceTarget:0,faceTimer:1,wanderAngle:Math.random()*Math.PI*2});
 createSnakeSkin(x+320,y);
 showGameMessage('SNAKE H\u00c4UTET SICH \u2014 DIE HAUT JAGT DICH! ZERST\u00d6RE DIE KLEINEN SCHLANGEN!',3.4)
}

function normAng(a){return Math.atan2(Math.sin(a),Math.cos(a))}

function clampArena(b){
 b.x=Math.max(120,Math.min(MAP.w-120,b.x));b.y=Math.max(120,Math.min(MAP.h-120,b.y))
}

export function spawnSmallSnake(){
 let ax=0,ay=0,ok=false;
 const snake=state.bosses.find(b=>b.type==='snake'&&b.alive);
 for(let tries=0;tries<25&&!ok;tries++){
  ax=140+Math.random()*(MAP.w-280);ay=140+Math.random()*(MAP.h-280);
  ok=!snake||Math.hypot(ax-snake.x,ay-snake.y)>300
 }
 if(ok)state.smallSnakes.push({x:ax,y:ay,r:20,hp:SMALL_SNAKE_HP,maxHp:SMALL_SNAKE_HP,wobble:Math.random()*6.28,dir:Math.random()*Math.PI*2,turnTimer:1+Math.random()*2,destroyed:false})
}

export function updateSmallSnakes(dt){
 const snake=state.bosses.find(b=>b.type==='snake'&&b.alive);
 state.smallSnakes=state.smallSnakes.filter(a=>!a.destroyed);
 for(const a of state.smallSnakes){
  a.wobble+=dt*6;
  a.turnTimer-=dt;
  if(a.turnTimer<=0){a.dir+=(Math.random()-.5)*1.6;a.turnTimer=1+Math.random()*2}
  a.x+=Math.cos(a.dir)*46*dt;a.y+=Math.sin(a.dir)*46*dt;
  if(a.x<100||a.x>MAP.w-100||a.y<100||a.y>MAP.h-100){a.x=Math.max(100,Math.min(MAP.w-100,a.x));a.y=Math.max(100,Math.min(MAP.h-100,a.y));a.dir+=Math.PI}
 }
 if(!snake)return;
 snake.appleTimer-=dt;
 if(state.smallSnakes.length<SMALL_SNAKE_MAX&&snake.appleTimer<=0){
  spawnSmallSnake();
  snake.appleTimer=3+Math.random()
 }
}

function snakeEatsSmall(snake){
 for(const a of state.smallSnakes){
  if(a.destroyed)continue;
  if(Math.hypot(a.x-snake.x,a.y-snake.y)<snake.r+a.r){
   a.destroyed=true;
   if(snake.segments<SNAKE_MAX_SEGMENTS)snake.segments+=1;
   snake.hp=snake.segments*SNAKE_SEGMENT_HP /* +1/10 Leiste pro Fang */;
   snake.hungerTimer=0 /* Fang resettet den Hunger-Timer */;
   snake.r=headRadiusOf(snake);
   for(let i=0;i<22;i++)particle(a.x,a.y,'#9be15d',3+Math.random()*4);
   showGameMessage('SNAKE HAT EINE KLEINE SCHLANGE GEGESSEN \u2014 ER W\u00c4CHST!',2)
  }
 }
 for(let i=0;i<4;i++)particle(snake.x+(Math.random()-.5)*snake.r,snake.y+(Math.random()-.5)*snake.r,'#7dff3f',2)
}

function hungryDamage(snake){
 snake.segments-=1;
 snake.hp=snake.segments*SNAKE_SEGMENT_HP /* -1/10 Leiste pro Hunger-Schlag */;
 snake.r=headRadiusOf(snake);
 snake.flash=.15;
 for(let i=0;i<20;i++)particle(snake.x,snake.y,Math.random()<.5?'#7dff3f':'#b6ff4e',3+Math.random()*4);
 state.screenShake=8;
 if(snake.segments<=0){
  snake.segments=0;snake.hp=0;snake.alive=false;state.kills++;
  $('kills').textContent=state.kills+' besiegt';
  showGameMessage('NUR NOCH DER KOPF \u2014 SNAKE IST BESIEGT!',2.6);
  for(let i=0;i<60;i++)particle(snake.x,snake.y,Math.random()<.5?'#3fae4a':'#7dff3f',3+Math.random()*6);
  state.screenShake=14;
  endGame(true)
 }else{
  showGameMessage('HUNGER! SNAKE SCHRUMPFT \u2014 '+snake.segments+' SEGMENTE \u00dcBRIG',1.6)
 }
}

export function damageSmallSnake(a,amount){
 if(a.destroyed)return;
 a.hp-=amount*(state.dmgMultiplier||1);
 for(let i=0;i<3;i++)particle(a.x,a.y,'#9be15d',2+Math.random()*3);
 if(a.hp<=0){
  a.hp=0;a.destroyed=true;
  for(let i=0;i<16;i++)particle(a.x,a.y,'#9be15d',3+Math.random()*4);
  const snake=state.bosses.find(b=>b.type==='snake'&&b.alive);
  if(snake)hungryDamage(snake);
  else showGameMessage('KLEINE SCHLANGE BESIEGT!',1.2)
 }
}

export function updateSnake(b,dt){
 b.wobble+=dt*3;b.flash=Math.max(0,b.flash-dt);
 updateSmallSnakes(dt);
 snakeEatsSmall(b);
 /* HUNGER-DRUCK (Hugo #43): 7 Sekunden nichts gefressen -> Snake verliert
   ein Zehntel (1 Segment) — derselbe Weg wie beim Hunger-Schlag. */
 b.hungerTimer=(b.hungerTimer||0)+dt;
 if(b.hungerTimer>=7){b.hungerTimer=0;hungryDamage(b)}

 let target=null,dist=Infinity;
 for(const a of state.smallSnakes){if(a.destroyed)continue;const d=Math.hypot(a.x-b.x,a.y-b.y);if(d<dist){dist=d;target=a}}

 if(target){
  const dx=target.x-b.x,dy=target.y-b.y,d=Math.hypot(dx,dy)||1;
  b.x+=dx/d*130*dt;b.y+=dy/d*130*dt /* HuGo: Snake etwas langsamer */
 }else{
  b.wanderAngle+=(Math.random()-.5)*.7;
  b.x+=Math.cos(b.wanderAngle)*45*dt;b.y+=Math.sin(b.wanderAngle)*45*dt
 }
 clampArena(b);

 const last=b.trail[0];
 if(!last||Math.hypot(b.x-last.x,b.y-last.y)>22)b.trail.unshift({x:b.x,y:b.y});
 if(b.trail.length>(b.segments+2)*3)b.trail.length=(b.segments+2)*3;

 if(b.skinRespawn>=0){
  b.skinRespawn-=dt;
  if(b.skinRespawn<=0&&!state.bosses.some(q=>q.type==='snakeSkin'&&q.alive)){
   createSnakeSkin(b.x+(Math.random()-.5)*240,b.y+(Math.random()-.5)*240);
   showGameMessage('DIE HAUT IST ZUR\u00dcCK \u2014 SIE JAGT DICH!',2.2);
   b.skinRespawn=-1
  }
 }

 b.faceTimer-=dt;
 if(b.faceTimer<=0){
  const faceNow=target?Math.atan2(target.y-b.y,target.x-b.x):b.wanderAngle;
  if(Math.random()<.32)b.faceTarget=Math.random()*Math.PI*2;
  else b.faceTarget=faceNow;
  b.faceTimer=1.6+Math.random()*2.4
 }
 const dAng=normAng(b.faceTarget-b.faceAngle);
 b.faceAngle+=Math.max(-3*dt,Math.min(3*dt,dAng))
}
