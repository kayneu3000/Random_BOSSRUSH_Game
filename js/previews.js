import { beginPreviewCtx, endPreviewCtx } from "./canvas.js";
import { drawSnake, drawShadow, drawGunball, drawDragon } from "./render.js";

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
   {sel:'.gunballPreview',paint:g=>{g.translate(95,85);g.scale(.9,.9);drawGunball({type:'gunball',x:0,y:0,r:32,rotation:.5,mode:'attacking',phaseTimer:10,weaponIndex:0,weaponTimer:0,fireTimer:0,attackCooldown:0,wobble:0})}}
  ];
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
   beginPreviewCtx(g);
   try{spec.paint(g)}finally{endPreviewCtx()}
  }
 }catch(e){/* Lobby-Bilder sind dekorativ — niemals das Spiel blockieren */}
}
