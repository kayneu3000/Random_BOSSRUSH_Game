import { state } from "../state.js";
import { MAP, MINI_PLANT_HP, MINI_PLANT_RANGE, ACID_POOL_LIFE } from "../config.js";
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
 /* SCHILD ENTFERNT (Hugo #55): Plant ist JETZT IMMER angreifbar (dafuer 1300 HP)
    und greift DIE GANZE ZEIT an. Kein Zaehlen, keine K.O.-Phase mehr.
    Die Funktion bleibt als no-op erhalten (wird an mehreren Stellen gerufen). */
}

/* Schaden einer Plant-Attacke + Ueberlebens-Zaehler in einem Rutsch */
function plantAttackDamage(b,dmg){
 plantSurviveHit(b); /* vor damagePlayer: invuln noch 0 = Treffer zaehlt */
 damagePlayer(dmg)
}

export function createPlant(x,y){
 state.bosses.push({id:++state.spawnId,type:'plant',x,y,r:62,hp:1300,maxHp:1300,alive:true,flash:0,wobble:0, /* 1300 HP, IMMER angreifbar (Hugo #55) */
  attackCooldown:0,burrowed:false,burrowSub:0,mouthOpen:0,chew:0, /* Schild-Felder entfernt (Hugo #55) */
  vineTimer:7,acidSpitTimer:5.5,seedTimer:5.5,tongueTimer:9,beamTimer:12,burrowTimer:18,screamTimer:12,biteTimer:0, /* Ranken 7s! (Hugo #53), Rest #52 */
  beamCharge:0,beamFire:0,beamAngle:0,
  tongue:{active:false,mode:'out',t:0,x:0,y:0,ex:0,ey:0,dir:1,edge:'',caught:false},
  faceAngle:0})
}

/* ---------- Mini-Fresspflanzen (Samen)
   HUGO #49: bleiben AUF DER STELLE, GROSSE Reichweite, JE 60 HP (toetbar!)
   und bleiben UNENDLICH lange da (kein Ablauf-Timer mehr). ---------- */
export function createMiniPlant(x,y){
 state.miniPlants.push({x,y,r:15,hp:MINI_PLANT_HP,maxHp:MINI_PLANT_HP,biteCd:.4,flash:0,wobble:Math.random()*6.28})
 sfx('seed');
 showGameMessage('MINI-FRESSPFLANZEN — JE 60 HP, GROSSE REICHWEITE!',1.8)
}

export function damageMiniPlant(a,dmg){
 a.hp-=dmg;a.flash=.14;
 if(a.hp<=0){
  for(let k=0;k<14;k++)particle(a.x,a.y,'#9be15d',3+Math.random()*3);
  a.dead=true
 }
}

function livingPlant(){
 return state.bosses.find(b=>b.alive&&b.type==='plant')||null
}

export function updateMiniPlants(dt){
 const p=state.player;
 for(let i=state.miniPlants.length-1;i>=0;i--){
  const a=state.miniPlants[i];
  a.wobble+=dt*5;a.biteCd-=dt;a.flash=Math.max(0,a.flash-dt);
  if(a.dead||a.hp<=0){state.miniPlants.splice(i,1);continue}
  /* STATIONAER: sie ruehrt sich nicht von der Stelle — aber GROSSE Reichweite */
  const d=Math.hypot(p.x-a.x,p.y-a.y)||1;
  if(d<MINI_PLANT_RANGE&&a.biteCd<=0){
   a.biteCd=1.15;
   const pb=livingPlant();if(pb)plantSurviveHit(pb); /* ihr Biss zaehlt */
   damagePlayer(6);sfx('bite'); /* Mini-Biss 8->6 (Hugo #53) */
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
   damagePlayer(a.dmg||7);a.tick=a.tickRate||.55 /* Pfuetzen-Tick 9->7 (Hugo #53) */
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
  /* Drueber dashen! (Dash = invuln) — sonst Volltreffer + Rueckschlag.
     HUGO-BUG #49: p.dashDuration gab es auf dem Spieler NIE (dashDuration liegt
     auf STATE) — undefined<=0 ist immer false, deshalb hat die Schallwelle
     NIE Schaden gemacht! */
  if(!w.hit&&state.invuln<=0&&state.dashDuration<=0){
   const d=Math.hypot(p.x-w.x,p.y-w.y);
   if(Math.abs(d-w.r)<26){
    w.hit=true;
    const pb=livingPlant();if(pb)plantSurviveHit(pb);
    damagePlayer(18);sfx('sling'); /* Schallwelle 25->18 (Hugo #53) */
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
 if(t.mode==='warn'){
  /* VORWARNUNG (Hugo #54): die Ziel-Linie blinkt in render.js — die Zunge
     schiesst erst LOS, wenn die Warnung abgelaufen ist */
  t.warnT-=dt;t.x=b.x;t.y=b.y-30;
  if(t.warnT<=0){t.mode='out';t.t=.4;sfx('tongue')}
  return;
 }
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
   /* SWING-ENDE: Wer klebt, wird WEGGESCHLEUDERT — wie bei Sauger (Hugo #50):
      kein Spiegel-Teleport mehr, sondern echter Physik-Flug mit Reibung! */
   if(t.caught){
    p.stuckTimer=0;t.caught=false;
    plantSurviveHit(b);
    const fa=Math.atan2(p.y-hy,p.x-hx),FLING=1400;
    p.flingX=Math.cos(fa)*FLING;p.flingY=Math.sin(fa)*FLING;p.flingT=1.1;
    damagePlayer(25);state.invuln=1;sfx('sling');state.screenShake=14; /* Zungen-Schleuder 35->25 (Hugo #53) */
    showGameMessage('WEGMITDIR!',1.2)
   }
   t.mode='back';t.t=.35
  }
 }else{ /* back */
  const k=Math.max(0,t.t/.35);
  t.x=hx+(t.ex-hx)*k;t.y=hy+(t.ey-hy)*k;
  if(t.t<=0){t.active=false;if(t.caught){t.caught=false;p.stuckTimer=0}}
 }
 /* Fang-Check: die GESAMTE Zunge faengt (Hugo #49) — nicht nur die Spitze!
   Wer klebt, bleibt an SEINEM Punkt auf der Zunge haengen und schwingt mit. */
 if(!t.caught&&t.active&&t.mode!=='warn'&&state.invuln<=0&&(p.stuckTimer||0)<=0&&pointSegmentDistance(p.x,p.y,hx,hy,t.x,t.y)<p.r+26){
  t.caught=true;p.stuckTimer=.85;sfx('tongue');
  const vx=t.x-hx,vy=t.y-hy,vl=Math.hypot(vx,vy)||1;
  t.u=Math.max(.12,Math.min(1,((p.x-hx)*vx+(p.y-hy)*vy)/(vl*vl))); /* Klebe-Punkt */
  showGameMessage('AN DER ZUNGE — FESTGEKLEBT!',1.4)
 }
 if(t.caught&&t.active){
  const u=t.u||1;
  p.x=hx+(t.x-hx)*u;p.y=hy+(t.y-hy)*u /* am Klebe-Punkt mitgeschwungen */
 }
}

/* ---------- Ranken-SCHWAENGE (Hugo #49): keine Projektile mehr — die Ranken
   SCHWINGEN und SCHLAGEN wie Peitschen und reichen BIS ZUM MAPRAND ---------- */
export function updateVineSweeps(dt){
 const p=state.player,pb=livingPlant();
 for(let i=state.vineSweeps.length-1;i>=0;i--){
  const v=state.vineSweeps[i];
  if(v.delay>0){v.delay-=dt;continue} /* VORWARNUNG (Hugo #50): Ziel-Linien blinken in render.js */
  v.t+=dt;
  if(v.t>=v.dur){state.vineSweeps.splice(i,1);continue}
  const k=v.t/v.dur,ang=v.a0+(v.a1-v.a0)*k;
  v.curAng=ang;v.len=rayMapLength(v.x,v.y,ang); /* bis zum MAPRAND */
  /* Treffer entlang der GANZEN Ranke */
  if(!v.hit&&pb&&!pb.burrowed&&state.invuln<=0&&state.dashDuration<=0&&
     pointSegmentDistance(p.x,p.y,v.x,v.y,v.x+Math.cos(ang)*v.len,v.y+Math.sin(ang)*v.len)<p.r+22){
   v.hit=true;plantAttackDamage(pb,v.dmg);state.screenShake=7;
   for(let q=0;q<10;q++)particle(p.x,p.y,'#8cf838',3+Math.random()*3)
  }
 }
}

/* ---------- Haupt-Update ---------- */
export function updatePlant(b,dt){
 b.wobble+=dt*2.4;b.flash=Math.max(0,b.flash-dt);
 b.mouthOpen=Math.max(0,b.mouthOpen-dt*2);b.chew=Math.max(0,b.chew-dt);
 /* IMMER ANGREIFBAR + greift DIE GANZE ZEIT an (Hugo #55) */
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
   if(pointSegmentDistance(p.x,p.y,b.x,b.y-30,ex,ey)<p.r+30)plantAttackDamage(b,22); /* Saeurestrahl 30->22 (Hugo #53) */
   for(let k=0;k<6;k++){const dd=Math.random()*Math.min(length,520);particle(b.x+Math.cos(b.beamAngle)*dd,b.y-30+Math.sin(b.beamAngle)*dd,'#c8f75a',4+Math.random()*5)}
  }
  if(b.beamFire<=0)b.beamTimer=15+Math.random()*5 /* groesser (Hugo #52) */
 }else if(b.beamTimer<=0&&dist<720){
  b.beamCharge=.9;b.mouthOpen=1;sfx('venom');
  showGameMessage('SAEURE-STRAHL KOMMT — AUSSER WEICHUNG!',1.6)
 }

 /* RANKEN (Hugo #49, LANGSAMER + VORGEWARNT: Hugo #50): sie SCHWINGEN und
    SCHLAGEN wie Peitschen bis zum Maprand — erst blinkende Ziel-Linien! */
 b.vineTimer-=dt;
 if(b.vineTimer<=0){
  b.vineTimer=7+Math.random()*2;b.mouthOpen=1;sfx('slash'); /* 7 SEKUNDEN! (Hugo #53) */
  showGameMessage('RANKEN — ACHTUNG!',.8);
  for(let k=0;k<2;k++){
   const a=b.faceAngle+(k?1:-1)*(.35+Math.random()*.5);
   state.vineSweeps.push({x:b.x,y:b.y-6,a0:a-.55,a1:a+.55,t:0,dur:1.8,delay:.6+k*.3,hit:false,dmg:10,curAng:a,len:0}) /* 1.8s langsam (#50), Schaden 14->10 (Hugo #53) */
  }
 }

 /* BISS (jetzt frueher + weiter sichtbar, Hugo #48) */
 b.biteTimer-=dt;
 if(dist<240&&b.biteTimer<=0){
  b.biteTimer=3;b.biteWind=.4;b.mouthOpen=1;sfx('bite'); /* groesser (Hugo #52) */
  showGameMessage('BISS!',.9)
 }
 if(b.biteWind>0){
  b.biteWind-=dt;
  if(b.biteWind<=0&&Math.hypot(p.x-b.x,p.y-b.y)<270)plantAttackDamage(b,16) /* Schaden 22->16 (Hugo #53) */
 }

 /* SAEURE-SPUCKE: Pfuetze bleibt auf dem Boden */
 b.acidSpitTimer-=dt;
 if(b.acidSpitTimer<=0){
  b.acidSpitTimer=5.5+Math.random()*2.5;b.mouthOpen=1;sfx('acid'); /* groesser (Hugo #52) */
  const fl=dist; /* auf die aktuelle Spielerposition zielen */
  state.enemyProjectiles.push({type:'acid',plant:true,x:b.x,y:b.y-30,vx:dx/dist*260,vy:dy/dist*260,life:fl/260+.02,damage:0,r:11,pool:true,poolR:34,poolLife:ACID_POOL_LIFE,poolDmg:7,poolTickRate:.55}) /* poolDmg 9->7 (Hugo #53) */
 }

 /* SAMEN -> Mini-Fresspflanzen (jetzt OEFFTER + mit Ansage, Hugo #48) */
 b.seedTimer-=dt;
 if(b.seedTimer<=0){
  b.seedTimer=7+Math.random()*3;b.mouthOpen=1;sfx('seed'); /* groesser (Hugo #52) */
  showGameMessage('SAMEN! MINI-FRESSPFLANZEN KOMMEN!',1.6);
  for(let k=0;k<2;k++){
   const a=Math.random()*6.28,sp=240;
   state.enemyProjectiles.push({type:'seed',x:b.x,y:b.y-30,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1.1,damage:0,r:10,pool:false,mini:true})
  }
 }

 /* ZUNGE (bis zum Maprand, schwingt die Wand entlang)
    HUGO #50: sie jagt DICH — der Strahl zielt DURCH DICH bis zum Maprand,
    dann schwingt sie von dort die Wand entlang */
 b.tongueTimer-=dt;
 if(b.tongueTimer<=0&&!b.tongue.active){
  b.tongueTimer=11+Math.random()*4; /* groesser (Hugo #52) */
  const hx2=b.x,hy2=b.y-30;
  const ang=Math.atan2(p.y-hy2,p.x-hx2),L=rayMapLength(hx2,hy2,ang);
  const ex2=hx2+Math.cos(ang)*L,ey2=hy2+Math.sin(ang)*L;
  const e2=ey2<=1?'top':ey2>=MAP.h-1?'bottom':ex2<=1?'left':'right';
  b.tongue={active:true,mode:'warn',warnT:.7,x:hx2,y:hy2,ex:ex2,ey:ey2,dir:Math.random()<.5?1:-1,edge:e2,caught:false};
  sfx('venom');showGameMessage('DIE ZUNGE KOMMT!',1.6) /* VORWARNUNG (Hugo #54) */
 }

 /* VERGRABEN */
 b.burrowTimer-=dt;
 if(b.burrowTimer<=0){
  b.burrowTimer=18+Math.random()*7; /* groesser (Hugo #52) */
  b.burrowed=true;b.burrowSub=1.4;sfx('burrow');
  showGameMessage('SIE VERGRABT SICH!',1.6);
  for(let k=0;k<26;k++)particle(b.x+(Math.random()-.5)*120,b.y+40,'#7a5230',4+Math.random()*4)
 }

 /* SCHREI + SCHALLWELLE (drueber dashen!) */
 b.screamTimer-=dt;
 if(b.screamTimer<=0){
  b.screamTimer=13+Math.random()*4; /* groesser (Hugo #52) */
  state.shockwaves.push({x:b.x,y:b.y,r:50,speed:430,life:2.6,hit:false});
  sfx('scream');b.mouthOpen=1;
  showGameMessage('SCHREI! UEBER DIE WELLE DASHEN!',1.8)
 }
}
