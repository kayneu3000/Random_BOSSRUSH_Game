import { state } from "../state.js";
import { MAP, PLANT_SHIELD_HITS, PLANT_VULN_TIME, MINI_PLANT_LIFE, ACID_POOL_LIFE } from "../config.js";
import { damagePlayer, particle, damageBoss } from "../entities.js";
import { showGameMessage } from "../ui.js";
import { sfx } from "../audio.js";
import { pointSegmentDistance, rayMapLength } from "../utils.js";

/* PLANT — DIE FRESSPFLANZE (Hugo, Level 2 Boss #2; Feedback-Runde #48)
   Wurzelt fest (bewegt sich NIE freiwillig):
   - RANKEN fliegen auf dich — und LANDEN irgendwann als Giftpfuetzen!
   - BISS wenn du zu nah an die Wurzeln kommst
   - SAEURE-SPUCKE -> Pfuetzen bleiben liegen
   - SAMEN -> Mini-Fresspflanzen (unsterblich, 10 Sekunden)
   - ZUNGE: schneller geworden, bis zum Maprand, schwingt die Wand entlang —
     wer klebt, wird zur anderen Mapseite geschleudert
   - SAEURE-STRAHL: VORGEWARNT (Auflade-Ring + Ziel-Linie) und laenger feuernd
   - VERGRABEN + woanders Auftauchen
   - SCHREI: Schallwelle — drueber dashen!
   SCHILD (Hugo #48, GEDREHT): DU musst 12 ihrer Angriffe UEBERLEBEN —
   erst dann ist sie 8 Sekunden lang angreifbar. Vorher nimmt sie NIX. */

function clampArena(o){
 o.x=Math.max(90,Math.min(MAP.w-90,o.x));
 o.y=Math.max(90,Math.min(MAP.h-90,o.y))
}

/* Schild-Zaehler: ein UEBERLEBTER Angriff der Pflanze (der Schaden wirklich
   gezogen hat — nicht geblockt durch invuln/Dash) zaehlt hoch. */
export function plantSurviveHit(b){
 if(!b||b.type!=='plant'||!b.alive||b.vulnerable)return;
 if(state.invuln>0||state.invincible||state.peace||state.finished)return;
 b.shieldHits++;
 if(b.shieldHits>=PLANT_SHIELD_HITS){
  b.vulnerable=true;b.vulnTimer=PLANT_VULN_TIME;
  if(b.tongue.active){b.tongue.active=false;state.player.stuckTimer=0}
  sfx('sling');state.screenShake=8;
  showGameMessage('SCHILD OFFEN — JETZT ANGRIFF!',2)
 }else showGameMessage('UEBERLEBT '+b.shieldHits+'/'+PLANT_SHIELD_HITS,1)
}

/* Schaden einer Plant-Attacke + Ueberlebens-Zaehler in einem Rutsch */
function plantAttackDamage(b,dmg){
 plantSurviveHit(b); /* vor damagePlayer: invuln noch 0 = Treffer zaehlt */
 damagePlayer(dmg)
}

export function createPlant(x,y){
 state.bosses.push({id:++state.spawnId,type:'plant',x,y,r:62,hp:700,maxHp:700,alive:true,flash:0,wobble:0,
  attackCooldown:0,shieldHits:0,vulnerable:false,vulnTimer:0,burrowed:false,burrowSub:0,mouthOpen:0,chew:0,
  vineTimer:1.4,acidSpitTimer:3.5,seedTimer:3.5,tongueTimer:6,beamTimer:8,burrowTimer:13,screamTimer:8,biteTimer:0,
  beamCharge:0,beamFire:0,beamAngle:0,
  tongue:{active:false,mode:'out',t:0,x:0,y:0,ex:0,ey:0,dir:1,edge:'',caught:false},
  faceAngle:0})
}

/* ---------- Mini-Fresspflanzen (Samen) ---------- */
export function createMiniPlant(x,y){
 state.miniPlants.push({x,y,r:15,life:MINI_PLANT_LIFE,biteCd:.4,wobble:Math.random()*6.28})
 sfx('seed');
 showGameMessage('MINI-FRESSPFLANZEN — UNSTERBLICH, ABER NUR 10s!',1.8)
}

function livingPlant(){
 return state.bosses.find(b=>b.alive&&b.type==='plant')||null
}

export function updateMiniPlants(dt){
 const p=state.player;
 for(let i=state.miniPlants.length-1;i>=0;i--){
  const a=state.miniPlants[i];
  a.life-=dt;a.wobble+=dt*5;a.biteCd-=dt;
  if(a.life<=0){ /* nach 10 Sekunden sind sie einfach weg */
   for(let k=0;k<10;k++)particle(a.x,a.y,'#9be15d',3);
   state.miniPlants.splice(i,1);continue
  }
  const dx=p.x-a.x,dy=p.y-a.y,d=Math.hypot(dx,dy)||1;
  a.x+=dx/d*118*dt;a.y+=dy/d*118*dt;
  if(d<a.r+p.r+4&&a.biteCd<=0){
   a.biteCd=1.15;
   const pb=livingPlant();if(pb)plantSurviveHit(pb); /* ihr Biss zaehlt */
   damagePlayer(8);sfx('bite');
   for(let k=0;k<8;k++)particle(p.x,p.y,'#9be15d',3)
  }
 }
}

/* ---------- Saeure-Pfuetzen (auch von gelandeten Ranken!) ---------- */
export function updateAcidPools(dt){
 const p=state.player;
 for(let i=state.acidPools.length-1;i>=0;i--){
  const a=state.acidPools[i];
  a.life-=dt;a.tick=(a.tick||0)-dt;
  if(a.life<=0){state.acidPools.splice(i,1);continue}
  if(a.tick<=0&&Math.hypot(p.x-a.x,p.y-a.y)<a.r+p.r*.4){
   const pb=livingPlant();if(pb)plantSurviveHit(pb);
   damagePlayer(a.dmg||9);a.tick=a.tickRate||.55
  }
 }
}

/* ---------- Schallwellen (Schrei) ---------- */
export function updateShockwaves(dt){
 const p=state.player;
 for(let i=state.shockwaves.length-1;i>=0;i--){
  const w=state.shockwaves[i];
  w.r+=w.speed*dt;w.life-=dt;
  if(w.life<=0){state.shockwaves.splice(i,1);continue}
  /* Drueber dashen! (Dash = invuln) — sonst Volltreffer + Rueckschlag */
  if(!w.hit&&state.invuln<=0&&p.dashDuration<=0){
   const d=Math.hypot(p.x-w.x,p.y-w.y);
   if(Math.abs(d-w.r)<26){
    w.hit=true;
    const pb=livingPlant();if(pb)plantSurviveHit(pb);
    damagePlayer(25);sfx('sling');
    const ang=Math.atan2(p.y-w.y,p.x-w.x);
    p.x+=Math.cos(ang)*90;p.y+=Math.sin(ang)*90;
    state.screenShake=10
   }
  }
 }
}

/* ---------- Zunge (schneller: #48) ---------- */
function nearestEdgePoint(x,y){
 const dl=x,dr=MAP.w-x,dt2=y,db=MAP.h-y;
 const m=Math.min(dl,dr,dt2,db);
 if(m===dl)return{ex:0,ey:y,edge:'left'};
 if(m===dr)return{ex:MAP.w,ey:y,edge:'right'};
 if(m===dt2)return{ex:x,ey:0,edge:'top'};
 return{ex:x,ey:MAP.h,edge:'bottom'}
}

function updateTongue(b,dt){
 const t=b.tongue,p=state.player;
 if(!t.active)return;
 t.t-=dt;
 const hx=b.x,hy=b.y-30; /* Kopf der Pflanze */
 if(t.mode==='out'){
  const k=Math.min(1,1-t.t/.4);
  t.x=hx+(t.ex-hx)*k;t.y=hy+(t.ey-hy)*k;
  if(t.t<=0){t.mode='sweep';t.t=2.2}
 }else if(t.mode==='sweep'){
  const sp=520*dt*t.dir; /* SCHNELLER (Hugo #48) */
  if(t.edge==='left'||t.edge==='right')t.ey+=sp;else t.ex+=sp;
  /* an der Ecke umkehren */
  if(t.edge==='top'||t.edge==='bottom'){if(t.ex<40||t.ex>MAP.w-40)t.dir*=-1}
  else{if(t.ey<40||t.ey>MAP.h-40)t.dir*=-1}
  t.x=t.ex;t.y=t.ey;
  if(t.t<=0){
   /* SWING-ENDE: Wer klebt, wird zur anderen Map-Seite geschleudert + viel Schaden */
   if(t.caught){
    p.stuckTimer=0;t.caught=false;
    plantSurviveHit(b);
    if(t.edge==='top'||t.edge==='bottom')p.x=MAP.w-p.x;else p.y=MAP.h-p.y;
    clampArena(p);
    damagePlayer(35);state.invuln=1;sfx('sling');state.screenShake=14;
    showGameMessage('WEGMITDIR!',1.2)
   }
   t.mode='back';t.t=.35
  }
 }else{ /* back */
  const k=Math.max(0,t.t/.35);
  t.x=hx+(t.ex-hx)*k;t.y=hy+(t.ey-hy)*k;
  if(t.t<=0){t.active=false;if(t.caught){t.caught=false;p.stuckTimer=0}}
  return
 }
 /* Fang-Check: wer die Zunge beruehrt, KLEBT drauf */
 if(!t.caught&&state.invuln<=0&&p.stuckTimer<=0&&pointSegmentDistance(p.x,p.y,hx,hy,t.x,t.y)<p.r+16){
  t.caught=true;p.stuckTimer=.85;sfx('tongue');
  showGameMessage('AN DER ZUNGE — FESTGEKLEBT!',1.4)
 }
 if(t.caught){
  p.x=t.x;p.y=t.y /* an der Zunge entlanggeschleift */
 }
}

/* ---------- Haupt-Update ---------- */
export function updatePlant(b,dt){
 b.wobble+=dt*2.4;b.flash=Math.max(0,b.flash-dt);
 b.mouthOpen=Math.max(0,b.mouthOpen-dt*2);b.chew=Math.max(0,b.chew-dt);
 if(b.vulnerable){
  /* Schild-Fenster: sie ruht sich aus und greift NICHT an (wie Gunball) */
  b.vulnTimer-=dt;
  if(b.vulnTimer<=0){
   b.vulnerable=false;b.shieldHits=0;
   b.vineTimer=1.6;b.acidSpitTimer=3;b.seedTimer=4;b.beamTimer=7;b.screamTimer=6;b.burrowTimer=9;
   showGameMessage('DIE PFLANZE HAT WIEDER ZU!',1.6)
  }
  return
 }
 updateTongue(b,dt);

 if(b.burrowed){
  b.burrowSub-=dt;
  if(Math.random()<.35)particle(b.x+(Math.random()-.5)*70,b.y+30,'#7a5230',4);
  if(b.burrowSub<=0){
   /* woanders wieder auftauchen (weit weg vom Spieler) */
   for(let tries=0;tries<12;tries++){
    const nx=200+Math.random()*(MAP.w-400),ny=200+Math.random()*(MAP.h-400);
    if(Math.hypot(nx-state.player.x,ny-state.player.y)>330){b.x=nx;b.y=ny;break}
   }
   b.burrowed=false;sfx('burrow');state.screenShake=9;
   showGameMessage('DIE PFLANZE KOMMT WIEDER RAUS!',1.4);
   for(let k=0;k<26;k++)particle(b.x+(Math.random()-.5)*120,b.y+40,'#7a5230',4+Math.random()*4)
  }
  return
 }

 const p=state.player;
 const dx=p.x-b.x,dy=p.y-b.y,dist=Math.hypot(dx,dy)||1;
 b.faceAngle=Math.atan2(dy,dx);

 /* SAEURE-STRAHL: VORGEWARNT (Auflade-Ring + Ziel-Linie, sichtbar in render.js)
    und laenger am Stueck (Hugo #48) */
 b.beamTimer-=dt;
 if(b.beamCharge>0){
  b.beamCharge-=dt;b.mouthOpen=1;
  if(b.beamCharge<=0){b.beamFire=3.2;b.beamTick=0;b.beamAngle=b.faceAngle;sfx('acid')}
 }else if(b.beamFire>0){
  b.beamFire-=dt;b.mouthOpen=1;
  b.beamTick-=dt;
  const length=rayMapLength(b.x,b.y-30,b.beamAngle),ex=b.x+Math.cos(b.beamAngle)*length,ey=b.y-30+Math.sin(b.beamAngle)*length;
  if(b.beamTick<=0){
   b.beamTick=.35;
   if(pointSegmentDistance(p.x,p.y,b.x,b.y-30,ex,ey)<p.r+30)plantAttackDamage(b,30);
   for(let k=0;k<6;k++){const dd=Math.random()*Math.min(length,520);particle(b.x+Math.cos(b.beamAngle)*dd,b.y-30+Math.sin(b.beamAngle)*dd,'#c8f75a',4+Math.random()*5)}
  }
  if(b.beamFire<=0)b.beamTimer=10+Math.random()*4
 }else if(b.beamTimer<=0&&dist<720){
  b.beamCharge=.9;b.mouthOpen=1;sfx('venom');
  showGameMessage('SAEURE-STRAHL KOMMT — AUSSER WEICHUNG!',1.6)
 }

 /* RANKEN: 3 Schuesse nach dir — sie LANDEN und werden zu Giftpfuetzen */
 b.vineTimer-=dt;
 if(b.vineTimer<=0){
  b.vineTimer=1.8+Math.random()*1.2;b.mouthOpen=1;
  for(let k=-1;k<=1;k++){
   const a=b.faceAngle+k*.22,sp=310;
   state.enemyProjectiles.push({type:'vine',plant:true,x:b.x,y:b.y-30,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:.8+Math.random()*.35,damage:10,r:9,pool:true,poolR:24,poolLife:5,poolDmg:6,poolTickRate:.5})
  }
  sfx('slash')
 }

 /* BISS (jetzt frueher + weiter sichtbar, Hugo #48) */
 b.biteTimer-=dt;
 if(dist<240&&b.biteTimer<=0){
  b.biteTimer=1.7;b.biteWind=.4;b.mouthOpen=1;sfx('bite');
  showGameMessage('BISS!',.9)
 }
 if(b.biteWind>0){
  b.biteWind-=dt;
  if(b.biteWind<=0&&Math.hypot(p.x-b.x,p.y-b.y)<270)plantAttackDamage(b,22)
 }

 /* SAEURE-SPUCKE: Pfuetze bleibt auf dem Boden */
 b.acidSpitTimer-=dt;
 if(b.acidSpitTimer<=0){
  b.acidSpitTimer=3.5+Math.random()*2;b.mouthOpen=1;sfx('acid');
  const fl=dist; /* auf die aktuelle Spielerposition zielen */
  state.enemyProjectiles.push({type:'acid',plant:true,x:b.x,y:b.y-30,vx:dx/dist*260,vy:dy/dist*260,life:fl/260+.02,damage:0,r:11,pool:true,poolR:34,poolLife:ACID_POOL_LIFE,poolDmg:9,poolTickRate:.55})
 }

 /* SAMEN -> Mini-Fresspflanzen (jetzt OEFFTER + mit Ansage, Hugo #48) */
 b.seedTimer-=dt;
 if(b.seedTimer<=0){
  b.seedTimer=4.5+Math.random()*2.5;b.mouthOpen=1;sfx('seed');
  showGameMessage('SAMEN! MINI-FRESSPFLANZEN KOMMEN!',1.6);
  for(let k=0;k<2;k++){
   const a=Math.random()*6.28,sp=240;
   state.enemyProjectiles.push({type:'seed',x:b.x,y:b.y-30,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1.1,damage:0,r:10,pool:false,mini:true})
  }
 }

 /* ZUNGE (bis zum Maprand, schwingt die Wand entlang) */
 b.tongueTimer-=dt;
 if(b.tongueTimer<=0&&!b.tongue.active){
  b.tongueTimer=7+Math.random()*3;
  const e=nearestEdgePoint(b.x,b.y);
  b.tongue={active:true,mode:'out',t:.4,x:b.x,y:b.y-30,ex:e.ex,ey:e.ey,dir:Math.random()<.5?1:-1,edge:e.edge,caught:false};
  sfx('tongue');showGameMessage('DIE ZUNGE!',1.6)
 }

 /* VERGRABEN */
 b.burrowTimer-=dt;
 if(b.burrowTimer<=0){
  b.burrowTimer=12+Math.random()*6;
  b.burrowed=true;b.burrowSub=1.4;sfx('burrow');
  showGameMessage('SIE VERGRABT SICH!',1.6);
  for(let k=0;k<26;k++)particle(b.x+(Math.random()-.5)*120,b.y+40,'#7a5230',4+Math.random()*4)
 }

 /* SCHREI + SCHALLWELLE (drueber dashen!) */
 b.screamTimer-=dt;
 if(b.screamTimer<=0){
  b.screamTimer=8+Math.random()*3;
  state.shockwaves.push({x:b.x,y:b.y,r:50,speed:430,life:2.6,hit:false});
  sfx('scream');b.mouthOpen=1;
  showGameMessage('SCHREI! UEBER DIE WELLE DASHEN!',1.8)
 }
}
