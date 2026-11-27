import { beginPreviewCtx, endPreviewCtx } from "./canvas.js";
import { drawSnake, drawShadow, drawGunball, drawDragon, drawPlant } from "./render.js";
import { state } from "./state.js";

/* ECHTE BOSS-BILDER in der Lobby (Hugo-Wunsch): die Karten zeigen die
   Original-Texturen aus render.js auf Mini-Canvases statt CSS-Emojis. */

export function initBossPreviews(){
 try{
  const specs=[
   {sel:'.snakePreview',paint:g=>{
     const trail=[];for(let i=1;i<=8;i++)trail.push({x:-i*30,y:0});
     g.translate(122,86);g.scale(.5,.5);
     drawSnake({type:'snake',x:0,y:0,segments:6,trail,r:46,wobble:0,faceAngle:0,faceTarget:0,faceTimer:1,alive:true,hp:800,maxHp:1000})
   }},
   {sel:'.shadowPreview',paint:g=>{g.translate(95,78);drawShadow({type:'shadow',x:0,y:0,r:30,mode:'stalking',wobble:0,sprintTimer:0,phase:1})}},
   {sel:'.dragonPreview',paint:g=>{g.translate(102,88);g.scale(.92,.92);drawDragon({type:'dragon',x:0,y:0,r:34,angle:-.55,wobble:0,mode:'guarded',beamAngle:0,beamCharge:0,beamTimer:0,exhaustedTimer:0,fireCooldown:1,attackCooldown:0,infernoCooldown:5})}},
   {sel:'.gunballPreview',paint:g=>{g.translate(95,85);g.scale(.9,.9);drawGunball({type:'gunball',x:0,y:0,r:32,rotation:.5,mode:'attacking',phaseTimer:10,weaponIndex:0,weaponTimer:0,fireTimer:0,attackCooldown:0,wobble:0})}},
   {sel:'.plantPreview',paint:g=>{g.translate(95,118);g.scale(.85,.85);drawPlant({type:'plant',x:0,y:0,r:62,hp:700,maxHp:700,alive:true,flash:0,wobble:state.elapsed*2.4,mouthOpen:.4+Math.sin(state.elapsed*3)*.5,chew:0,shieldHits:4,vulnerable:false,vulnTimer:0,burrowed:false,tongue:{active:false},faceAngle:0})}}
  ];
  const live=[];
  for(const spec of specs){
   const el=document.querySelector(spec.sel);
   if(!el||!el.appendChild||!el.classList||!el.classList.add)continue; /* Test-Umgebung / fehlendes DOM */
   if(el.children&&el.children.some(x=>x&&x.className==='bossPreviewCanvas'))continue; /* Idempotenz: kein Doppel-Init */
   const c=document.createElement('canvas');
   if(!c||!c.getContext)continue;
   c.width=190;c.height=170;c.className='bossPreviewCanvas';
   el.appendChild(c);
   el.classList.add('realPreview');
   const g=c.getContext('2d');
   if(!g)continue;
   live.push({g,paint:spec.paint})
  }
  startLiveLoop(live)
 }catch(e){/* Lobby-Bilder sind dekorativ — niemals das Spiel blockieren */}
}

/* LIVE-Vorschau (Hugo): die Karten zeigen die Bosse so wie im Kampf —
   animiert ueber rAF, nur solange die Lobby sichtbar ist. */
let liveStarted=false;
function startLiveLoop(live){
 if(liveStarted||typeof requestAnimationFrame!=='function')return;
 liveStarted=true;
 const tick=()=>{
  requestAnimationFrame(tick);
  try{
   const lobby=document.getElementById('lobby');
   if(!lobby||!lobby.classList||!lobby.classList.contains('active'))return;
   const t=performance.now()/1000, old=state.elapsed;
   state.elapsed=t;
   try{
    for(const l of live){
     l.g.setTransform(1,0,0,1,0,0);
     l.g.clearRect(0,0,190,170);
     beginPreviewCtx(l.g);
     try{l.paint(l.g)}finally{endPreviewCtx()}
    }
   }finally{state.elapsed=old}
  }catch(e){}
 };
 tick()
}
