import { state } from "./state.js";
import { attack, dash } from "./combat.js";
import { showGameMessage } from "./ui.js";
import { $ } from "./utils.js";

export function getInput(){
 let x=state.stick.x,y=state.stick.y;
 if(state.keys.KeyW||state.keys.ArrowUp)y--;
 if(state.keys.KeyS||state.keys.ArrowDown)y++;
 if(state.keys.KeyA||state.keys.ArrowLeft)x--;
 if(state.keys.KeyD||state.keys.ArrowRight)x++;
 const l=Math.hypot(x,y);if(l>1){x/=l;y/=l}return{x,y}
}

export function attachInput(){
 $('attackBtn').addEventListener('pointerdown',e=>{e.preventDefault();attack()});
 $('dashBtn').addEventListener('pointerdown',e=>{e.preventDefault();dash()});
 $('healBtn').addEventListener('pointerdown',e=>{
  e.preventDefault();
  if(state.selected==='healer'&&state.player.hp<state.player.maxHp&&state.healerHealCooldown<=0){
   state.player.hp=Math.min(state.player.maxHp,state.player.hp+75);state.healerHealCooldown=30;
   showGameMessage('+75 HP — HEILUNG AUFGELADEN',0.9)
  }
 });

 window.addEventListener('keydown',e=>{
  state.keys[e.code]=true;
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  if(e.code==='Space'||e.code==='KeyJ')attack();
  if(e.code==='ShiftLeft'||e.code==='KeyK')dash()
 });
 window.addEventListener('keyup',e=>state.keys[e.code]=false);

 const stickArea=$('stickArea'),knob=$('stickKnob');let stickPointer=null;
 function updateStick(e){
  const r=stickArea.getBoundingClientRect();
  let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),max=43,l=Math.hypot(dx,dy);
  if(l>max){dx=dx/l*max;dy=dy/l*max}
  state.stick.x=dx/max;state.stick.y=dy/max;knob.style.transform=`translate(${dx}px,${dy}px)`
 }
 stickArea.addEventListener('pointerdown',e=>{e.preventDefault();stickPointer=e.pointerId;stickArea.setPointerCapture(e.pointerId);updateStick(e)});
 stickArea.addEventListener('pointermove',e=>{if(e.pointerId===stickPointer)updateStick(e)});
 function resetStick(){stickPointer=null;state.stick.x=state.stick.y=0;knob.style.transform='translate(0px,0px)'}
 stickArea.addEventListener('pointerup',resetStick);stickArea.addEventListener('pointercancel',resetStick)
}
