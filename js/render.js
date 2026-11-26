import { state } from "./state.js";
import { classes, MAP } from "./config.js";
import { ctx, forceCanvasRealloc, repairCanvas } from "./canvas.js";
import { rayMapLength } from "./utils.js";
import { headRadiusOf } from "./bosses/snake.js";

function drawBackground(){
 const s=state;
 if(s.selectedBoss==='dragon'){
  ctx.fillStyle='#1d0908';ctx.fillRect(0,0,s.arena.w,s.arena.h);
  for(let x=0;x<s.arena.w;x+=100)for(let y=0;y<s.arena.h;y+=100){ctx.fillStyle=((x/100+y/100)%2===0)?'#32120e':'#260d0b';ctx.fillRect(x,y,100,100);ctx.strokeStyle='#68251a';ctx.lineWidth=2;ctx.strokeRect(x,y,100,100)}
  for(let i=0;i<70;i++){const x=(i*317+83)%s.arena.w,y=(i*193+127)%s.arena.h;ctx.strokeStyle='#9b321b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+15,y+10);ctx.lineTo(x+23,y+3);ctx.stroke()}
  ctx.fillStyle='#5a1b12';ctx.fillRect(0,0,s.arena.w,25);ctx.fillRect(0,s.arena.h-25,s.arena.w,25);ctx.fillRect(0,0,25,s.arena.h);ctx.fillRect(s.arena.w-25,0,25,s.arena.h);ctx.strokeStyle='#ff512c';ctx.lineWidth=4;ctx.strokeRect(25,25,s.arena.w-50,s.arena.h-50)
 }else if(s.selectedBoss==='gunball'){
  ctx.fillStyle='#080510';ctx.fillRect(0,0,s.arena.w,s.arena.h);
  for(let x=0;x<s.arena.w;x+=100)for(let y=0;y<s.arena.h;y+=100){ctx.fillStyle=((x/100+y/100)%2===0)?'#171027':'#0e091a';ctx.fillRect(x,y,100,100);ctx.strokeStyle='#35234f';ctx.lineWidth=2;ctx.strokeRect(x,y,100,100)}
  for(let i=0;i<85;i++){const x=(i*317+83)%s.arena.w,y=(i*193+127)%s.arena.h;ctx.fillStyle='#a77aff55';ctx.beginPath();ctx.arc(x,y,2+(i%3),0,Math.PI*2);ctx.fill()}
  ctx.fillStyle='#24133e';ctx.fillRect(0,0,s.arena.w,25);ctx.fillRect(0,s.arena.h-25,s.arena.w,25);ctx.fillRect(0,0,25,s.arena.h);ctx.fillRect(s.arena.w-25,0,25,s.arena.h);ctx.strokeStyle='#b58aff';ctx.lineWidth=4;ctx.strokeRect(25,25,s.arena.w-50,s.arena.h-50)
 }else if(s.selectedBoss==='snake'){
  ctx.fillStyle='#0a1c0d';ctx.fillRect(0,0,s.arena.w,s.arena.h);
  for(let x=0;x<s.arena.w;x+=100)for(let y=0;y<s.arena.h;y+=100){ctx.fillStyle=((x/100+y/100)%2===0)?'#122b15':'#0b1e0e';ctx.fillRect(x,y,100,100);ctx.strokeStyle='#1f4223';ctx.lineWidth=2;ctx.strokeRect(x,y,100,100)}
  for(let i=0;i<80;i++){const x=(i*317+83)%s.arena.w,y=(i*193+127)%s.arena.h;ctx.strokeStyle='#2c5c31';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y+14);ctx.quadraticCurveTo(x+5,y,x+13,y+2);ctx.stroke()}
  for(let i=0;i<45;i++){const x=(i*271+41)%s.arena.w,y=(i*149+67)%s.arena.h;ctx.fillStyle='#3fae4a55';ctx.beginPath();ctx.ellipse(x,y,6+(i%3)*2,3,0.6,0,Math.PI*2);ctx.fill()}
  ctx.fillStyle='#122406';ctx.fillRect(0,0,s.arena.w,25);ctx.fillRect(0,s.arena.h-25,s.arena.w,25);ctx.fillRect(0,0,25,s.arena.h);ctx.fillRect(s.arena.w-25,0,25,s.arena.h);ctx.strokeStyle='#5fd44a';ctx.lineWidth=4;ctx.strokeRect(25,25,s.arena.w-50,s.arena.h-50)
 }else if(s.selectedBoss==='shadow'){
  ctx.fillStyle='#0b0714';ctx.fillRect(0,0,s.arena.w,s.arena.h);
  for(let x=0;x<s.arena.w;x+=100)for(let y=0;y<s.arena.h;y+=100){ctx.fillStyle=((x/100+y/100)%2===0)?'#161028':'#0d0819';ctx.fillRect(x,y,100,100);ctx.strokeStyle='#2c2047';ctx.lineWidth=2;ctx.strokeRect(x,y,100,100)}
  for(let i=0;i<80;i++){const x=(i*317+83)%s.arena.w,y=(i*193+127)%s.arena.h;ctx.fillStyle='#7b4dff44';ctx.beginPath();ctx.arc(x,y,2+(i%3),0,Math.PI*2);ctx.fill()}
  ctx.fillStyle='#1c1230';ctx.fillRect(0,0,s.arena.w,25);ctx.fillRect(0,s.arena.h-25,s.arena.w,25);ctx.fillRect(0,0,25,s.arena.h);ctx.fillRect(s.arena.w-25,0,25,s.arena.h);ctx.strokeStyle='#8f6dff';ctx.lineWidth=4;ctx.strokeRect(25,25,s.arena.w-50,s.arena.h-50)
 }else{
  ctx.fillStyle='#63dff5';ctx.fillRect(0,0,s.arena.w,s.arena.h);
  for(let x=0;x<s.arena.w;x+=100)for(let y=0;y<s.arena.h;y+=100){ctx.fillStyle=((x/100+y/100)%2===0)?'#83efff':'#55cce9';ctx.fillRect(x,y,100,100);ctx.strokeStyle='#36b5d9';ctx.lineWidth=2;ctx.strokeRect(x,y,100,100)}
  for(let i=0;i<95;i++){const x=(i*317+83)%s.arena.w,y=(i*193+127)%s.arena.h;ctx.fillStyle='#c5fbff88';ctx.beginPath();ctx.arc(x,y,2+(i%3),0,Math.PI*2);ctx.fill()}
  ctx.fillStyle='#2caacb';ctx.fillRect(0,0,s.arena.w,25);ctx.fillRect(0,s.arena.h-25,s.arena.w,25);ctx.fillRect(0,0,25,s.arena.h);ctx.fillRect(s.arena.w-25,0,25,s.arena.h);ctx.strokeStyle='#b8f7ff';ctx.lineWidth=4;ctx.strokeRect(25,25,s.arena.w-50,s.arena.h-50)
 }
}

function drawSlime(b){
 const x=b.x,y=b.y,r=b.r;ctx.save();ctx.translate(x,y);
 ctx.fillStyle='#06131d99';ctx.beginPath();ctx.ellipse(5,r*.55,r*1.02,r*.27,0,0,Math.PI*2);ctx.fill();
 const g=ctx.createLinearGradient(-r,-r,r,r);g.addColorStop(0,'#b8ffff');g.addColorStop(.3,'#41d9f4');g.addColorStop(.72,'#087fca');g.addColorStop(1,'#064775');ctx.fillStyle=g;
 ctx.beginPath();ctx.moveTo(-r,r*.42);ctx.bezierCurveTo(-r*1.12,-r*.1,-r*.65,-r*.93,0,-r*.9);ctx.bezierCurveTo(r*.75,-r*.98,r*1.13,-r*.2,r,r*.42);ctx.quadraticCurveTo(r*.7,r*.76,0,r*.67);ctx.quadraticCurveTo(-r*.7,r*.76,-r,r*.42);ctx.fill();
 ctx.fillStyle='#06314d';ctx.beginPath();ctx.ellipse(-r*.3,-r*.05,r*.12,r*.14,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(r*.3,-r*.05,r*.12,r*.14,0,0,Math.PI*2);ctx.fill();ctx.restore();
 if(b.type!=='healerCompanion'){ctx.fillStyle='#071622';ctx.fillRect(x-r*.65,y-r-15,r*1.3,5);ctx.fillStyle='#55eaff';ctx.fillRect(x-r*.65,y-r-15,r*1.3*Math.max(0,b.hp/b.maxHp),5)}
}

/* Gunball: dunkle Kriegsmaschine mit rotierendem Pistolenlauf-Kranz */
function drawGunball(b){
 const r=b.r,s=state,vuln=b.mode==='vulnerable',pulse=.55+Math.sin(s.elapsed*6)*.3;
 const pa=state.player?Math.atan2(state.player.y-b.y,state.player.x-b.x):0;
 ctx.save();ctx.translate(b.x,b.y);
 const halo=ctx.createRadialGradient(0,0,r*.5,0,0,r*2.3);
 halo.addColorStop(0,vuln?'rgba(130,90,200,'+(.26*pulse)+')':'rgba(255,46,16,'+(.32*pulse)+')');
 halo.addColorStop(1,'rgba(0,0,0,0)');
 ctx.fillStyle=halo;ctx.beginPath();ctx.arc(0,0,r*2.3,0,Math.PI*2);ctx.fill();
 ctx.restore();
 ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.rotation);
 for(let i=0;i<14;i++){
  ctx.save();ctx.rotate(i*Math.PI*2/14);
  const barrel=ctx.createLinearGradient(0,-9,0,9);
  barrel.addColorStop(0,'#4a5162');barrel.addColorStop(.45,'#191c26');barrel.addColorStop(1,'#05060b');
  ctx.fillStyle=barrel;ctx.strokeStyle='#3f4657';ctx.lineWidth=2;
  ctx.beginPath();ctx.roundRect(r*.84,-9,r*.48,18,4);ctx.fill();ctx.stroke();
  ctx.fillStyle='#10121b';ctx.fillRect(r*.94,-16,r*.28,7);
  ctx.fillStyle='#000';ctx.beginPath();ctx.arc(r*1.3,0,7,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=vuln?'#6a5a95':'#ff2c12';ctx.shadowColor=vuln?'#a58aff':'#ff2c12';ctx.shadowBlur=vuln?8:14;
  ctx.beginPath();ctx.arc(r*1.3,0,3+pulse*1.6,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  ctx.restore()
 }
 ctx.save();ctx.rotate(-b.rotation*1.6);
 for(let i=0;i<10;i++){
  ctx.save();ctx.rotate(i*Math.PI/5);
  ctx.fillStyle='#262a38';ctx.strokeStyle='#565d75';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.roundRect(r*.56,-5,r*.2,10,3);ctx.fill();ctx.stroke();
  ctx.fillStyle=vuln?'#8d7bc0':'#ff5a2e';ctx.beginPath();ctx.arc(r*.74,0,2.4,0,Math.PI*2);ctx.fill();
  ctx.restore()
 }
 ctx.restore();
 ctx.shadowColor=vuln?'#8f63d8':'#ff3814';ctx.shadowBlur=32;
 const metal=ctx.createRadialGradient(-r*.35,-r*.42,5,0,0,r);
 if(vuln){metal.addColorStop(0,'#9a93ad');metal.addColorStop(.25,'#6d6584');metal.addColorStop(.6,'#463f5c');metal.addColorStop(.85,'#282238');metal.addColorStop(1,'#120e1e')}
 else{metal.addColorStop(0,'#5f6678');metal.addColorStop(.22,'#3a3f4e');metal.addColorStop(.5,'#22252f');metal.addColorStop(.8,'#101219');metal.addColorStop(1,'#04040a')}
 ctx.fillStyle=metal;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 ctx.strokeStyle='#020308';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,r-2,0,Math.PI*2);ctx.stroke();
 if(!vuln){ctx.strokeStyle='rgba(255,64,30,'+(.3+pulse*.3)+')';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,r-4,-2.7,-.45);ctx.stroke()}
 ctx.strokeStyle='#31374a';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,r*.8,0,Math.PI*2);ctx.stroke();
 ctx.fillStyle='#171a26';ctx.strokeStyle='#454b60';ctx.lineWidth=2.5;
 ctx.beginPath();ctx.roundRect(-r*.5,-r*.36,r,r*.72,20);ctx.fill();ctx.stroke();
 ctx.fillStyle='#0d0f18';
 for(let k=0;k<3;k++){ctx.beginPath();ctx.roundRect(-r*.38+k*r*.16,-r*.28,r*.08,r*.12,2);ctx.fill()}
 for(let k=0;k<3;k++){ctx.beginPath();ctx.roundRect(-r*.38+k*r*.16,r*.16,r*.08,r*.12,2);ctx.fill()}
 ctx.fillStyle='#3a4054';
 for(const px of [-r*.42,r*.36])for(const py of [-r*.3,r*.3]){ctx.beginPath();ctx.arc(px,py,4,0,Math.PI*2);ctx.fill()}
 if(vuln){
  ctx.strokeStyle='#d88cff';ctx.lineWidth=2;ctx.globalAlpha=.9;
  ctx.beginPath();ctx.moveTo(-r*.55,-r*.2);ctx.lineTo(-r*.3,-r*.05);ctx.lineTo(-r*.45,r*.1);ctx.lineTo(-r*.15,r*.28);ctx.moveTo(r*.25,-r*.3);ctx.lineTo(r*.4,-r*.05);ctx.lineTo(r*.2,r*.12);ctx.stroke();
  ctx.globalAlpha=1
 }
 ctx.restore();
 ctx.save();ctx.translate(b.x+Math.cos(pa)*r*.14,b.y+Math.sin(pa)*r*.14);ctx.rotate(pa);
 if(!vuln){
  ctx.fillStyle='#0a0b12';
  ctx.beginPath();ctx.moveTo(r*.02,-r*.36);ctx.lineTo(r*.34,-r*.14);ctx.lineTo(r*.06,-r*.1);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(r*.02,r*.36);ctx.lineTo(r*.34,r*.14);ctx.lineTo(r*.06,r*.1);ctx.closePath();ctx.fill();
  ctx.shadowColor='#ff2410';ctx.shadowBlur=18;ctx.fillStyle='#ff3b1a';
  ctx.beginPath();ctx.moveTo(r*.08,-r*.26);ctx.lineTo(r*.3,-r*.15);ctx.lineTo(r*.08,-r*.16);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(r*.08,r*.26);ctx.lineTo(r*.3,r*.15);ctx.lineTo(r*.08,r*.16);ctx.closePath();ctx.fill();
  ctx.shadowBlur=0;ctx.fillStyle='#fff0c0';
  ctx.beginPath();ctx.arc(r*.12,-r*.2,2.5,0,Math.PI*2);ctx.arc(r*.12,r*.2,2.5,0,Math.PI*2);ctx.fill()
 }else{
  ctx.shadowColor='#6a4fa0';ctx.shadowBlur=10;ctx.fillStyle='#c9b2ff';
  ctx.beginPath();ctx.ellipse(r*.14,-r*.2,7,4.5,.25,0,Math.PI*2);ctx.ellipse(r*.14,r*.2,7,4.5,-.25,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle='#241a3a';ctx.beginPath();ctx.arc(r*.16,-r*.2,2,0,Math.PI*2);ctx.arc(r*.16,r*.2,2,0,Math.PI*2);ctx.fill()
 }
 ctx.fillStyle='#08090f';ctx.beginPath();ctx.roundRect(r*.18,-r*.1,r*.2,r*.2,4);ctx.fill();
 ctx.fillStyle=vuln?'#5a4a80':'#ff4318';
 for(let k=0;k<3;k++)ctx.fillRect(r*.21+k*r*.055,-r*.08,2.5,r*.16);
 ctx.restore();
 ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.rotation);
 for(let i=0;i<4;i++){
  const a=i*Math.PI/2;
  ctx.save();ctx.rotate(a);
  const active=b.weaponIndex===i&&b.mode==='attacking';
  ctx.translate(0,-r-16);
  ctx.fillStyle='#10121c';ctx.strokeStyle=active?'#ff5a36':'#3c4254';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.roundRect(-17,6,34,12,4);ctx.fill();ctx.stroke();
  ctx.fillStyle=active?'#c6371f':'#23273a';ctx.strokeStyle=active?'#ffd8c2':'#59607a';ctx.lineWidth=2.5;
  if(i===0){ctx.fillRect(-10,-14,20,29);ctx.fillRect(-6,10,12,16);ctx.fillStyle=active?'#ff8a5a':'#3f455c';ctx.fillRect(-6,-14,12,7)}
  if(i===1){ctx.beginPath();ctx.moveTo(-13,14);ctx.lineTo(-9,-13);ctx.lineTo(0,-24);ctx.lineTo(9,-13);ctx.lineTo(13,14);ctx.closePath();ctx.fill();ctx.stroke()}
  if(i===2){ctx.fillRect(-15,-15,30,30);for(let k=-1;k<=1;k++)ctx.fillRect(k*8-2,-26,4,13)}
  if(i===3){ctx.fillRect(-7,-27,14,48);ctx.fillRect(-12,-10,24,8)}
  if(active){ctx.shadowColor='#ff2c12';ctx.shadowBlur=18;ctx.fillStyle='#ff6a3a';ctx.beginPath();ctx.arc(0,-18,4,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0}
  ctx.restore()
 }
 ctx.restore();
 if(b.mode==='vulnerable'){
  ctx.strokeStyle='#d5b9ff';ctx.lineWidth=5;ctx.shadowColor='#a56aff';ctx.shadowBlur=25;ctx.beginPath();ctx.arc(b.x,b.y,r+18+Math.sin(s.elapsed*8)*4,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0
 }
 if(b.flash>0){ctx.fillStyle='#fff';ctx.globalAlpha=b.flash*4;ctx.beginPath();ctx.arc(b.x,b.y,r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
}

/* Der Unbekannte des Schattens: gehüllte Gestalt mit Aetherschleier */
function drawShadow(b){
 const r=b.r,s=state,vuln=b.mode==='vulnerable',pulse=.5+Math.sin(s.elapsed*5)*.3;
 ctx.save();ctx.translate(b.x,b.y);
 const aura=ctx.createRadialGradient(0,0,r*.4,0,0,r*2.2);
 aura.addColorStop(0,'rgba(120,80,220,'+(.3*pulse)+')');aura.addColorStop(1,'rgba(0,0,0,0)');
 ctx.fillStyle=aura;ctx.beginPath();ctx.arc(0,0,r*2.2,0,Math.PI*2);ctx.fill();
 for(let i=0;i<6;i++){
  const a=i*Math.PI/3+s.elapsed*.9,len=r*(1.1+Math.sin(s.elapsed*3+i*2)*.22);
  ctx.strokeStyle='rgba(90,60,170,.5)';ctx.lineWidth=7;
  ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.7,Math.sin(a)*r*.55);
  ctx.quadraticCurveTo(Math.cos(a+.5)*len*1.3,Math.sin(a+.5)*len,Math.cos(a)*len,Math.sin(a+.25)*len);ctx.stroke()
 }
 const cloak=ctx.createLinearGradient(0,-r,0,r);
 cloak.addColorStop(0,'#1c1c30');cloak.addColorStop(1,'#08080f');
 ctx.fillStyle=cloak;ctx.strokeStyle='#3a2f66';ctx.lineWidth=2.5;
 ctx.beginPath();ctx.moveTo(0,-r*.95);
 ctx.bezierCurveTo(-r*.9,-r*.7,-r*1.05,r*.5,-r*.72,r*.75);
 ctx.quadraticCurveTo(0,r*.95,r*.72,r*.75);
 ctx.bezierCurveTo(r*1.05,r*.5,r*.9,-r*.7,0,-r*.95);ctx.fill();ctx.stroke();
 ctx.fillStyle='#191930';ctx.strokeStyle='#4a3d85';ctx.lineWidth=2.5;
 ctx.beginPath();ctx.ellipse(0,-r*.5,r*.5,r*.42,0,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.fillStyle='#030308';ctx.beginPath();ctx.ellipse(0,-r*.46,r*.34,r*.26,0,0,Math.PI*2);ctx.fill();
 ctx.shadowColor=vuln?'#40345e':'#9d7bff';ctx.shadowBlur=vuln?8:20;ctx.fillStyle=vuln?'#40345e':'#c7b4ff';
 ctx.beginPath();ctx.ellipse(-r*.15,-r*.48,r*.075,r*.05,.2,0,Math.PI*2);ctx.fill();
 ctx.beginPath();ctx.ellipse(r*.15,-r*.48,r*.075,r*.05,-.2,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 if(!vuln){ctx.fillStyle='rgba(157,123,255,'+(.12+Math.sin(s.elapsed*7)*.07)+')';ctx.beginPath();ctx.arc(0,0,r*1.15,0,Math.PI*2);ctx.fill()}
 if(vuln){ctx.setLineDash([10,7]);ctx.strokeStyle='#ff9b40';ctx.lineWidth=4;ctx.shadowColor='#f26a0e';ctx.shadowBlur=16;ctx.beginPath();ctx.arc(0,0,r+20+Math.sin(s.elapsed*8)*4,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.shadowBlur=0}
 ctx.restore();
 if(b.flash>0){ctx.fillStyle='#fff';ctx.globalAlpha=b.flash*4;ctx.beginPath();ctx.arc(b.x,b.y,r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
}

/* Drachenkopf als Ember-Hand */
function drawEmberHand(){
 const p=state.player;
 ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);
 ctx.fillStyle='#4a1a0b';ctx.strokeStyle='#ff7c2c';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(11,-9,28,18,6);ctx.fill();ctx.stroke();
 const head=ctx.createLinearGradient(25,-24,66,24);head.addColorStop(0,'#ffb34c');head.addColorStop(.35,'#f05a1b');head.addColorStop(.7,'#a52610');head.addColorStop(1,'#4a0d08');
 ctx.fillStyle=head;ctx.strokeStyle='#ff8b35';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(20,-16);ctx.lineTo(42,-24);ctx.lineTo(55,-17);ctx.lineTo(70,-9);ctx.lineTo(77,0);ctx.lineTo(70,9);ctx.lineTo(55,17);ctx.lineTo(42,24);ctx.lineTo(20,16);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#681409';ctx.beginPath();ctx.moveTo(48,-8);ctx.lineTo(79,-4);ctx.lineTo(79,4);ctx.lineTo(48,8);ctx.closePath();ctx.fill();
 ctx.fillStyle='#ffce64';ctx.beginPath();ctx.arc(70,-3,2.3,0,Math.PI*2);ctx.arc(70,3,2.3,0,Math.PI*2);ctx.fill();
 ctx.shadowColor='#fff02b';ctx.shadowBlur=13;ctx.fillStyle='#fff34a';ctx.beginPath();ctx.ellipse(47,-12,5,3,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 ctx.fillStyle='#270905';ctx.beginPath();ctx.arc(48,-12,1.5,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#e5c49b';ctx.strokeStyle='#71321b';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(35,-18);ctx.lineTo(27,-35);ctx.lineTo(44,-22);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(52,-17);ctx.lineTo(61,-33);ctx.lineTo(59,-14);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#ffe9b8';for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(53+i*5,5);ctx.lineTo(55+i*5,11);ctx.lineTo(57+i*5,5);ctx.fill()}
 for(let i=0;i<6;i++){const fx=24+Math.random()*35,fy=(Math.random()-.5)*28;ctx.fillStyle=i%2?'#ff4a0b':'#ffd84b';ctx.globalAlpha=.65+Math.random()*.35;ctx.beginPath();ctx.ellipse(fx,fy,3+Math.random()*3,6+Math.random()*7,Math.random()-.5,0,Math.PI*2);ctx.fill()}
 ctx.globalAlpha=1;ctx.restore();
}

/* Inferno-Drache: klare Silhouette, Lava-Risse, gluehendes Maul */
function drawDragon(b){
 const r=b.r,s=state;
 const charging=b.mode==='beamCharge'||b.mode==='beamActive';
 const exhausted=b.mode==='exhausted';
 ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.angle);ctx.translate(0,Math.sin(b.wobble)*3);
 if(!exhausted){
  const aura=ctx.createRadialGradient(0,0,r*.3,0,0,r*2.1);
  aura.addColorStop(0,'rgba(255,90,20,'+(charging?.42:.2)+')');
  aura.addColorStop(.6,'rgba(220,40,10,.1)');
  aura.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=aura;ctx.beginPath();ctx.arc(0,0,r*2.1,0,Math.PI*2);ctx.fill()
 }
 const tail=ctx.createLinearGradient(-r*1.9,0,-r*.3,0);
 tail.addColorStop(0,'#2a060a');tail.addColorStop(.55,'#7c150f');tail.addColorStop(1,'#d0401c');
 ctx.fillStyle=tail;ctx.strokeStyle='#3f0a10';ctx.lineWidth=2.5;
 ctx.beginPath();ctx.moveTo(-r*.4,-r*.26);ctx.quadraticCurveTo(-r*1.2,-r*.28,-r*1.85,0);ctx.quadraticCurveTo(-r*1.2,r*.32,-r*.4,r*.26);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#e8622f';ctx.strokeStyle='#5d120e';ctx.lineWidth=1.5;
 for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(-r*1.7,side*r*.06);ctx.lineTo(-r*2.05,side*r*.3);ctx.lineTo(-r*1.82,side*r*.16);ctx.closePath();ctx.fill();ctx.stroke()}
 for(const side of [-1,1]){
  ctx.save();ctx.scale(1,side);
  const flap=Math.sin(b.wobble*1.5+side)*r*.08;
  const wing=ctx.createLinearGradient(-r*.2,-r*1.5,r*1.4,r*.2);
  wing.addColorStop(0,'#c53a20');wing.addColorStop(.45,'#7a180f');wing.addColorStop(1,'#220608');
  ctx.fillStyle=wing;ctx.strokeStyle='#ff5a2c';ctx.lineWidth=3;
  ctx.beginPath();
  ctx.moveTo(-r*.1,-r*.28);
  ctx.quadraticCurveTo(r*.3,-r*.85,r*1.5,-r*1.45+flap);
  ctx.quadraticCurveTo(r*.85,-r*.98,r*1.28,-r*.78+flap*.6);
  ctx.quadraticCurveTo(r*.7,-r*.5,r*.9,-r*.32+flap*.3);
  ctx.quadraticCurveTo(r*.45,-r*.18,-r*.1,-r*.28);
  ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle='#e0492a';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.moveTo(r*.05,-r*.2);ctx.lineTo(r*1.46,-r*1.42+flap);
  ctx.moveTo(r*.1,-r*.16);ctx.lineTo(r*1.24,-r*.76+flap*.6);
  ctx.moveTo(r*.1,-r*.1);ctx.lineTo(r*.86,-r*.3+flap*.3);ctx.stroke();
  ctx.restore()
 }
 ctx.fillStyle='#7c5a38';ctx.strokeStyle='#3a1c0e';ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(r*.5,-r*.3);ctx.quadraticCurveTo(r*.5,-r*.6,r*.2,-r*.82);ctx.quadraticCurveTo(r*.42,-r*.56,r*.62,-r*.28);ctx.closePath();ctx.fill();ctx.stroke();
 const body=ctx.createRadialGradient(-r*.25,-r*.25,r*.1,r*.05,r*.05,r);
 body.addColorStop(0,'#ffb95e');body.addColorStop(.2,'#f0672f');body.addColorStop(.5,'#c03420');body.addColorStop(.78,'#701114');body.addColorStop(1,'#260608');
 ctx.fillStyle=body;ctx.strokeStyle='#ff6a36';ctx.lineWidth=3;
 ctx.beginPath();ctx.ellipse(0,r*.06,r*.68,r*.52,0,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.save();ctx.strokeStyle='#ff8a24';ctx.shadowColor='#ff6a10';ctx.shadowBlur=12;ctx.lineWidth=2;ctx.globalAlpha=.9;
 ctx.beginPath();ctx.moveTo(-r*.4,r*.1);ctx.lineTo(-r*.2,r*.22);ctx.lineTo(-r*.3,r*.36);ctx.moveTo(r*.05,-r*.1);ctx.lineTo(r*.22,r*.02);ctx.lineTo(r*.14,r*.2);ctx.stroke();ctx.restore();
 for(let row=0;row<4;row++){
  const by=-r*.06+row*r*.19;
  if(row>0){ctx.save();ctx.strokeStyle='#ff9b3a';ctx.shadowColor='#ff7a1e';ctx.shadowBlur=8;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-r*.3,by-r*.03);ctx.quadraticCurveTo(0,by+r*.02,r*.3,by-r*.03);ctx.stroke();ctx.restore()}
  ctx.fillStyle=row%2?'#f2a057':'#e07f3e';ctx.strokeStyle='#7c1a12';ctx.lineWidth=1.4;
  ctx.beginPath();ctx.ellipse(r*.02,by,r*.42,r*.1,0,0,Math.PI*2);ctx.fill();ctx.stroke()
 }
 for(const side of [-1,1]){
  ctx.save();ctx.translate(-r*.2,side*r*.4);
  ctx.fillStyle='#6e1310';ctx.strokeStyle='#ff5b35';ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(0,0,r*.17,r*.2,side*.25,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle='#f1b37b';
  for(let claw=0;claw<3;claw++){const cx=r*.1,cy=side*(-r*.08+claw*r*.09);ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+r*.14,cy+side*r*.03);ctx.lineTo(cx+r*.07,cy+side*r*.08);ctx.closePath();ctx.fill()}
  ctx.restore()
 }
 for(let i=0;i<6;i++){
  const sx=-r*.5+i*r*.24,sy=-r*.4+Math.sin(i*.6)*r*.03;
  ctx.fillStyle=i%2?'#6e1116':'#98251a';ctx.strokeStyle='#ff8446';ctx.lineWidth=1.6;
  ctx.beginPath();ctx.moveTo(sx-r*.08,sy+r*.1);ctx.lineTo(sx+r*.02,sy-r*.22);ctx.lineTo(sx+r*.11,sy+r*.1);ctx.closePath();ctx.fill();ctx.stroke()
 }
 ctx.fillStyle='#b23222';ctx.strokeStyle='#ff5a2c';ctx.lineWidth=2.5;
 ctx.beginPath();ctx.moveTo(r*.25,-r*.42);ctx.quadraticCurveTo(r*.6,-r*.52,r*.85,-r*.38);ctx.lineTo(r*.88,-r*.02);ctx.quadraticCurveTo(r*.6,0,r*.3,r*.1);ctx.closePath();ctx.fill();ctx.stroke();
 const mouth=ctx.createRadialGradient(r*1.0,r*.05,2,r*1.0,r*.05,r*.4);
 mouth.addColorStop(0,'#fff3b0');mouth.addColorStop(.35,'#ffb020');mouth.addColorStop(.7,'#e63c0c');mouth.addColorStop(1,'#4d0a04');
 ctx.save();if(charging){ctx.shadowColor='#ff3a0a';ctx.shadowBlur=30}ctx.fillStyle=mouth;
 ctx.beginPath();ctx.moveTo(r*.7,-r*.02);ctx.lineTo(r*1.24,r*.02);ctx.lineTo(r*1.1,r*.16);ctx.lineTo(r*.74,r*.1);ctx.closePath();ctx.fill();ctx.restore();
 if(charging){ctx.save();ctx.shadowColor='#ff3a0a';ctx.shadowBlur=40;ctx.globalAlpha=.8;ctx.fillStyle='#ffd23a';ctx.beginPath();ctx.ellipse(r*1.0,r*.06,r*.4,r*.22,0,0,Math.PI*2);ctx.fill();ctx.restore()}
 const head=ctx.createLinearGradient(r*.7,-r*.4,r*1.35,r*.2);
 head.addColorStop(0,'#f57a35');head.addColorStop(.45,'#b42d1c');head.addColorStop(1,'#48101a');
 ctx.fillStyle=head;ctx.strokeStyle='#ff7540';ctx.lineWidth=2.5;
 ctx.beginPath();ctx.moveTo(r*.58,-r*.44);ctx.lineTo(r*.92,-r*.46);ctx.lineTo(r*1.22,-r*.22);ctx.lineTo(r*1.34,-r*.08);ctx.lineTo(r*1.16,-r*.03);ctx.lineTo(r*.62,-r*.02);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#8f2213';ctx.strokeStyle='#ff8446';ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(r*.66,0);ctx.lineTo(r*1.18,r*.16);ctx.lineTo(r*1.1,r*.24);ctx.lineTo(r*.66,r*.12);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#ffe9b8';
 for(let k=0;k<4;k++){const tx=r*.8+k*r*.12;
  ctx.beginPath();ctx.moveTo(tx,-r*.02);ctx.lineTo(tx+r*.035,r*.07);ctx.lineTo(tx+r*.07,-r*.02);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(tx+r*.02,r*.14);ctx.lineTo(tx+r*.06,r*.06);ctx.lineTo(tx+r*.1,r*.14);ctx.closePath();ctx.fill()}
 ctx.fillStyle='#e8d3ae';ctx.strokeStyle='#3a1c0e';ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(r*.62,-r*.4);ctx.quadraticCurveTo(r*.66,-r*.78,r*.34,-r*1.02);ctx.quadraticCurveTo(r*.52,-r*.7,r*.78,-r*.38);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.beginPath();ctx.moveTo(r*1.14,-r*.2);ctx.lineTo(r*1.2,-r*.36);ctx.lineTo(r*1.26,-r*.18);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.save();ctx.shadowColor=exhausted?'#4a3512':'#ff2a08';ctx.shadowBlur=18;ctx.fillStyle=exhausted?'#8f7a2a':'#ffd23a';
 ctx.beginPath();ctx.ellipse(r*.92,-r*.2,r*.1,r*.055,-.28,0,Math.PI*2);ctx.fill();ctx.restore();
 ctx.fillStyle='#2a0703';ctx.beginPath();ctx.ellipse(r*.95,-r*.2,r*.02,r*.05,-.28,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#1d0604';ctx.beginPath();ctx.arc(r*1.24,-r*.12,r*.022,0,Math.PI*2);ctx.fill();
 if(exhausted){
  for(let i=0;i<4;i++){
   const t2=(s.elapsed*.7+i*.25)%1;
   ctx.globalAlpha=.28*(1-t2);ctx.fillStyle='#8a8a92';
   ctx.beginPath();ctx.arc(r*.9+i*r*.12,t2*-r*1.2-i*r*.1,r*.08+t2*r*.1,0,Math.PI*2);ctx.fill()
  }
  ctx.globalAlpha=1
 }
 ctx.restore();
 if(b.flash>0){ctx.fillStyle='#fff';ctx.globalAlpha=b.flash*4;ctx.beginPath();ctx.arc(b.x,b.y,r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
 if(b.mode==='exhausted'){ctx.strokeStyle='#ffd27b';ctx.lineWidth=4;ctx.beginPath();ctx.arc(b.x,b.y,r+18,0,Math.PI*2);ctx.stroke()}
}

/* SNAKE: Cobra mit Schuppenpanzer, Goldringen, Kapuzenmuster und Gift-Augen */
function drawSnake(b){
 const s=state, segs=b.segments, headR=headRadiusOf(b);
 const pts=[{x:b.x,y:b.y}];
 for(const tp of b.trail)pts.push(tp);
 const pos=[{x:b.x,y:b.y}];
 let prev=pts[0],walked=0,ci=1;
 for(let i=1;i<=segs&&ci<pts.length;i++){
  const need=i*30;
  while(ci<pts.length){
   const d=Math.hypot(pts[ci].x-prev.x,pts[ci].y-prev.y);
   if(d<=0){prev=pts[ci];ci++;continue}
   if(walked+d>=need){
    const f=(need-walked)/d;
    prev={x:prev.x+(pts[ci].x-prev.x)*f,y:prev.y+(pts[ci].y-prev.y)*f};
    walked=need;
    pos.push({x:prev.x,y:prev.y});
    break
   }
   walked+=d;prev=pts[ci];ci++
  }
 }
 while(pos.length<=segs)pos.push({...pos[pos.length-1]});
 ctx.save();
 ctx.lineCap='round';
 for(let i=Math.min(pos.length-1,segs);i>=1;i--){
  const p=pos[i],pn=pos[i-1];
  const ang=Math.atan2(pn.y-p.y,pn.x-p.x);
  const sr=Math.max(14,headR*(.82-(i-1)/Math.max(1,segs)*.48));
  const wob=Math.sin(s.elapsed*7-i*.85)*3;
  const nx=p.x+wob*.25,ny=p.y+wob;
  ctx.save();ctx.translate(nx,ny);ctx.rotate(ang);
  ctx.fillStyle='#04100a99';ctx.beginPath();ctx.ellipse(2,sr*.55,sr*1.05,sr*.36,0,0,Math.PI*2);ctx.fill();
  const sg=ctx.createLinearGradient(0,-sr,0,sr);
  sg.addColorStop(0,'#8fd64f');sg.addColorStop(.35,'#4f9c2e');sg.addColorStop(.7,'#2c6b21');sg.addColorStop(1,'#153a12');
  ctx.fillStyle=sg;ctx.beginPath();ctx.ellipse(0,0,sr*1.12,sr,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#cfe98a59';ctx.beginPath();ctx.ellipse(-sr*.1,sr*.42,sr*.72,sr*.3,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#123a10aa';ctx.lineWidth=2.5;
  for(let k=0;k<3;k++){
   const ox=-sr*.42+k*sr*.4;
   ctx.beginPath();ctx.arc(ox,0,sr*.5,-.9,.9);ctx.stroke()
  }
  ctx.fillStyle='#123a1088';ctx.beginPath();ctx.moveTo(-sr*.22,0);ctx.lineTo(0,-sr*.3);ctx.lineTo(sr*.22,0);ctx.lineTo(0,sr*.3);ctx.closePath();ctx.fill();
  ctx.fillStyle='#d7a83e';ctx.beginPath();ctx.ellipse(-sr*.95,0,sr*.16,sr*.86,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#f7d47855';ctx.beginPath();ctx.ellipse(-sr*.95,0,sr*.07,sr*.6,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#0e2810';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,sr*1.12,sr,0,0,Math.PI*2);ctx.stroke();
  if(b.flash>0){ctx.fillStyle='#fff';ctx.globalAlpha=b.flash*3;ctx.beginPath();ctx.ellipse(0,0,sr*1.12,sr,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
  ctx.restore()
 }
 const fx=b.x,fy=b.y;
 ctx.save();ctx.translate(fx,fy);ctx.rotate(b.faceAngle);
 ctx.fillStyle='#04100a99';ctx.beginPath();ctx.ellipse(2,headR*.6,headR*1.15,headR*.4,0,0,Math.PI*2);ctx.fill();
 const hood=ctx.createRadialGradient(-headR*.2,0,4,0,0,headR*1.9);
 hood.addColorStop(0,'#5fae37');hood.addColorStop(.6,'#2e6b21');hood.addColorStop(1,'#122f10');
 ctx.fillStyle=hood;ctx.beginPath();ctx.ellipse(-headR*.35,0,headR*1.5,headR*1.12,0,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='#0e2810cc';ctx.lineWidth=4;
 for(let k=-2;k<=2;k++){
  if(k===0)continue;
  ctx.beginPath();ctx.moveTo(-headR*1.45,k*headR*.14);ctx.quadraticCurveTo(-headR*.4,k*headR*.44,headR*.25,k*headR*.15);ctx.stroke()
 }
 ctx.fillStyle='#d7a83e';ctx.beginPath();ctx.ellipse(-headR*1.15,0,headR*.16,headR*1.02,0,0,Math.PI*2);ctx.fill();
 const hg=ctx.createLinearGradient(0,-headR*.7,0,headR*.6);
 hg.addColorStop(0,'#9fe05a');hg.addColorStop(.4,'#57a639');hg.addColorStop(.8,'#2c6b21');hg.addColorStop(1,'#163a12');
 ctx.fillStyle=hg;ctx.strokeStyle='#0e2810';ctx.lineWidth=2.5;
 ctx.beginPath();ctx.ellipse(-headR*.18,0,headR*.75,headR*.66,0,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.fillStyle=hg;ctx.beginPath();ctx.ellipse(headR*.42,0,headR*.55,headR*.4,0,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.strokeStyle='#0e2810';ctx.lineWidth=3;
 ctx.beginPath();ctx.moveTo(-headR*.72,-headR*.3);ctx.quadraticCurveTo(headR*.2,-headR*.78,headR*.75,-headR*.34);ctx.stroke();
 ctx.beginPath();ctx.moveTo(-headR*.72,headR*.3);ctx.quadraticCurveTo(headR*.2,headR*.78,headR*.75,headR*.34);ctx.stroke();
 ctx.fillStyle='#123a10';ctx.beginPath();ctx.ellipse(headR*.7,-headR*.16,2.4,1.6,0,0,Math.PI*2);ctx.fill();
 ctx.beginPath();ctx.ellipse(headR*.7,headR*.16,2.4,1.6,0,0,Math.PI*2);ctx.fill();
 ctx.save();
 ctx.shadowColor='#ffe14d';ctx.shadowBlur=12;
 ctx.fillStyle='#ffe14d';
 ctx.beginPath();ctx.ellipse(headR*.18,-headR*.34,headR*.17,headR*.1,-.25,0,Math.PI*2);ctx.fill();
 ctx.beginPath();ctx.ellipse(headR*.18,headR*.34,headR*.17,headR*.1,.25,0,Math.PI*2);ctx.fill();
 ctx.shadowBlur=0;ctx.fillStyle='#0a0f08';
 ctx.beginPath();ctx.ellipse(headR*.24,-headR*.34,headR*.045,headR*.085,0,0,Math.PI*2);ctx.fill();
 ctx.beginPath();ctx.ellipse(headR*.24,headR*.34,headR*.045,headR*.085,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#ffffff99';
 ctx.beginPath();ctx.arc(headR*.13,-headR*.37,1.6,0,Math.PI*2);ctx.fill();
 ctx.beginPath();ctx.arc(headR*.13,headR*.37,1.6,0,Math.PI*2);ctx.fill();
 ctx.restore();
 ctx.strokeStyle='#0e2810';ctx.lineWidth=2.5;
 ctx.beginPath();ctx.moveTo(headR*.5,headR*.02);ctx.quadraticCurveTo(headR*.86,headR*.1,headR*1.0,headR*.02);ctx.stroke();
 ctx.fillStyle='#f4f9e4';
 ctx.beginPath();ctx.moveTo(headR*.78,-headR*.06);ctx.lineTo(headR*.86,-headR*.2);ctx.lineTo(headR*.94,-headR*.04);ctx.closePath();ctx.fill();
 ctx.beginPath();ctx.moveTo(headR*.5,headR*.02);ctx.lineTo(headR*.56,headR*.16);ctx.lineTo(headR*.64,headR*.02);ctx.closePath();ctx.fill();
 const flick=Math.max(0,Math.sin(s.elapsed*7))*headR*.55;
 if(flick>2){
  ctx.strokeStyle='#ff5638';ctx.shadowColor='#f26a0e';ctx.shadowBlur=10;ctx.lineWidth=3.5;
  ctx.beginPath();ctx.moveTo(headR*.95,0);ctx.lineTo(headR*.95+flick,0);ctx.stroke();
  ctx.lineWidth=2.5;
  ctx.beginPath();
  ctx.moveTo(headR*.95+flick,0);ctx.lineTo(headR*.95+flick+6,-4.5);
  ctx.moveTo(headR*.95+flick,0);ctx.lineTo(headR*.95+flick+6,4.5);
  ctx.stroke();ctx.shadowBlur=0
 }
 if(b.flash>0){ctx.fillStyle='#fff';ctx.globalAlpha=b.flash*4;ctx.beginPath();ctx.arc(0,0,headR*.95,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
 ctx.restore();
 ctx.restore()
}

/* DIE HAUT: die abgestreifte blasser Schlangenhaut, die lebt und den Spieler jagt */
function drawSkin(b){
 const s=state,r=b.r,sprint=b.mode==='sprint';
 const dir=b.angle||0;
 ctx.save();
 ctx.lineCap='round';
 ctx.save();ctx.translate(b.x,b.y);ctx.rotate(dir);
 for(let i=4;i>=1;i--){
  const dist=r*(1.1+i*.55);
  const side=Math.sin(s.elapsed*7-i*.9)*r*.35;
  const sr=Math.max(6,r*(.72-i*.12));
  ctx.save();ctx.translate(-dist,side);
  ctx.globalAlpha=.9;
  ctx.fillStyle='#04100a55';ctx.beginPath();ctx.ellipse(3,sr*.5,sr,sr*.35,0,0,Math.PI*2);ctx.fill();
  const sg=ctx.createLinearGradient(0,-sr,0,sr);
  sg.addColorStop(0,'#efe9d4');sg.addColorStop(.4,'#cfc4a0');sg.addColorStop(.8,'#a99d78');sg.addColorStop(1,'#7d7357');
  ctx.fillStyle=sg;ctx.strokeStyle='#6b6350';ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(0,0,sr*1.2,sr,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.strokeStyle='#8d8265aa';ctx.lineWidth=1.5;
  for(let k=0;k<3;k++){
   const ox=-sr*.5+k*sr*.45;
   ctx.beginPath();ctx.arc(ox,0,sr*.5,-.8,.8);ctx.stroke()
  }
  ctx.fillStyle='#c9b89188';ctx.beginPath();ctx.moveTo(-sr*.35,-sr*.2);ctx.lineTo(sr*.1,-sr*.3);ctx.lineTo(sr*.35,sr*.05);ctx.lineTo(-sr*.1,sr*.3);ctx.closePath();ctx.fill();
  ctx.globalAlpha=1;
  ctx.restore()
 }
 ctx.save();
 ctx.globalAlpha=.95;
 ctx.fillStyle='#04100a55';ctx.beginPath();ctx.ellipse(3,r*.55,r*1.15,r*.4,0,0,Math.PI*2);ctx.fill();
 const hg=ctx.createRadialGradient(-r*.2,-r*.2,4,0,0,r);
 hg.addColorStop(0,'#f7f2e0');hg.addColorStop(.4,'#d9cfad');hg.addColorStop(.75,'#b3a888');hg.addColorStop(1,'#857b5e');
 ctx.fillStyle=hg;ctx.strokeStyle='#6b6350';ctx.lineWidth=2.5;
 ctx.beginPath();ctx.ellipse(-r*.15,0,r*.85,r*.68,0,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.fillStyle=hg;ctx.beginPath();ctx.ellipse(r*.45,0,r*.6,r*.42,0,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.strokeStyle='#8d8265';ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(-r*.55,-r*.25);ctx.lineTo(-r*.15,-r*.42);
 ctx.moveTo(-r*.55,r*.25);ctx.lineTo(-r*.15,r*.42);
 ctx.moveTo(-r*.3,0);ctx.lineTo(r*.3,0);ctx.stroke();
 ctx.fillStyle='#1a1a14';
 ctx.beginPath();ctx.ellipse(r*.2,-r*.3,r*.12,r*.1,0,0,Math.PI*2);ctx.fill();
 ctx.beginPath();ctx.ellipse(r*.2,r*.3,r*.12,r*.1,0,0,Math.PI*2);ctx.fill();
 ctx.save();ctx.shadowColor='#f26a0e';ctx.shadowBlur=10;ctx.fillStyle='rgba(242,106,14,.65)';
 ctx.beginPath();ctx.arc(r*.2,-r*.3,r*.045,0,Math.PI*2);ctx.fill();
 ctx.beginPath();ctx.arc(r*.2,r*.3,r*.045,0,Math.PI*2);ctx.fill();ctx.restore();
 ctx.fillStyle='#b9ab7f';ctx.strokeStyle='#6b6350';ctx.lineWidth=1.5;
 for(const side2 of [-1,1]){
  ctx.beginPath();ctx.moveTo(r*.6,side2*r*.05);ctx.lineTo(r*.85,side2*r*.22);ctx.lineTo(r*.68,side2*r*.1);ctx.closePath();ctx.fill();ctx.stroke()
 }
 const flick=Math.max(0,Math.sin(s.elapsed*8))*r*.5;
 if(flick>2){
  ctx.strokeStyle='#d88a70';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.moveTo(r*.95,0);ctx.lineTo(r*.95+flick,0);ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(r*.95+flick,0);ctx.lineTo(r*.95+flick+5,-4);
  ctx.moveTo(r*.95+flick,0);ctx.lineTo(r*.95+flick+5,4);
  ctx.stroke()
 }
 ctx.globalAlpha=1;
 ctx.restore();
 if(sprint){
  for(let k=0;k<3;k++){
   ctx.globalAlpha=.28-k*.08;
   ctx.strokeStyle='#efe9d4';ctx.lineWidth=6;
   ctx.beginPath();ctx.arc(b.x,b.y,r+8+k*12,-.9,.9);ctx.stroke()
  }
  ctx.globalAlpha=1
 }
 if(b.flash>0){ctx.fillStyle='#fff';ctx.globalAlpha=b.flash*4;ctx.beginPath();ctx.arc(b.x,b.y,r*.9,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
 ctx.restore()
}

/* Kleine Schlangen: langsam unterwegs, SNAKE frisst sie */
function drawSmallSnake(a){
 const r=a.r;
 ctx.save();ctx.translate(a.x,a.y);
 ctx.rotate(a.dir);
 ctx.lineCap='round';
 ctx.fillStyle='#04100a66';ctx.beginPath();ctx.ellipse(2,r*.8,r*1.2,r*.3,0,0,Math.PI*2);ctx.fill();
 for(let i=3;i>=1;i--){
  const dist=r*(i*.75)+r;
  const side=Math.sin(a.wobble-i*.8)*r*.4;
  const sr=r*(.8-i*.14);
  const sg=ctx.createLinearGradient(0,-sr,0,sr);
  sg.addColorStop(0,'#a8e060');sg.addColorStop(.5,'#6cae38');sg.addColorStop(1,'#2e6b21');
  ctx.fillStyle=sg;
  ctx.beginPath();ctx.ellipse(-dist,side,sr*1.2,sr,a.wobble+i,0,Math.PI*2);ctx.fill();
 }
 ctx.fillStyle='#04100a55';ctx.beginPath();ctx.ellipse(r*.4,r*.5,r*1.1,r*.35,0,0,Math.PI*2);ctx.fill();
 const hg=ctx.createRadialGradient(-r*.2,-r*.2,2,0,0,r*1.15);
 hg.addColorStop(0,'#c6f07d');hg.addColorStop(.4,'#7fbe42');hg.addColorStop(.8,'#3f7a26');hg.addColorStop(1,'#1d4418');
 ctx.fillStyle=hg;ctx.strokeStyle='#0e2810';ctx.lineWidth=2;
 ctx.beginPath();ctx.ellipse(r*.35,0,r*1.05,r*.8,0,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.fillStyle='#ffe14d';ctx.shadowColor='#ffe14d';ctx.shadowBlur=6;
 ctx.beginPath();ctx.arc(r*.75,-r*.3,r*.13,0,Math.PI*2);ctx.fill();
 ctx.beginPath();ctx.arc(r*.75,r*.3,r*.13,0,Math.PI*2);ctx.fill();
 ctx.shadowBlur=0;ctx.fillStyle='#111';
 ctx.beginPath();ctx.arc(r*.78,-r*.3,r*.06,0,Math.PI*2);ctx.fill();
 ctx.beginPath();ctx.arc(r*.78,r*.3,r*.06,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='#0e2810';ctx.lineWidth=2;
 ctx.beginPath();ctx.arc(r*1.1,0,r*.4,-1.1,1.1);ctx.stroke();
 const hpFrac=Math.max(0,a.hp/a.maxHp);
 ctx.strokeStyle='#06130a';ctx.lineWidth=5;
 ctx.beginPath();ctx.arc(0,0,r+9,0,Math.PI*2);ctx.stroke();
 ctx.strokeStyle=hpFrac>.5?'#ff8a5a':'#ff4b3e';ctx.lineWidth=3.5;
 ctx.beginPath();ctx.arc(0,0,r+9,-Math.PI/2,-Math.PI/2+Math.PI*2*hpFrac);ctx.stroke();
 ctx.restore()
}

function drawSauronTower(t){
 const x=t.x,y=t.y,r=t.r;ctx.save();ctx.translate(x,y);ctx.fillStyle='#080504aa';ctx.beginPath();ctx.ellipse(0,37,40,13,0,0,Math.PI*2);ctx.fill();
 const armor=ctx.createLinearGradient(-r,-r,r,r);armor.addColorStop(0,'#514139');armor.addColorStop(.35,'#201714');armor.addColorStop(.7,'#090808');armor.addColorStop(1,'#3c2119');
 ctx.fillStyle=armor;ctx.beginPath();ctx.moveTo(-23,4);ctx.lineTo(-29,32);ctx.lineTo(-16,38);ctx.lineTo(16,38);ctx.lineTo(29,32);ctx.lineTo(23,4);ctx.closePath();ctx.fill();ctx.strokeStyle='#75432a';ctx.lineWidth=2;ctx.stroke();
 ctx.fillStyle='#1a1110';ctx.beginPath();ctx.moveTo(-23,8);ctx.lineTo(-27,-15);ctx.lineTo(-39,-37);ctx.lineTo(-22,-30);ctx.lineTo(-13,-49);ctx.lineTo(-5,-30);ctx.lineTo(0,-54);ctx.lineTo(7,-30);ctx.lineTo(18,-48);ctx.lineTo(21,-29);ctx.lineTo(39,-38);ctx.lineTo(26,-13);ctx.lineTo(23,8);ctx.closePath();ctx.fill();ctx.strokeStyle='#8d5637';ctx.stroke();
 ctx.fillStyle='#332019';ctx.beginPath();ctx.moveTo(-17,-24);ctx.lineTo(17,-24);ctx.lineTo(20,4);ctx.lineTo(0,14);ctx.lineTo(-20,4);ctx.closePath();ctx.fill();ctx.strokeStyle='#9a6038';ctx.stroke();
 if(!t.destroyed&&t.eyeOn){ctx.shadowColor='#ff3517';ctx.shadowBlur=30;ctx.fillStyle='#ff260b';ctx.beginPath();ctx.ellipse(0,-9,12,5,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff3a1';ctx.beginPath();ctx.ellipse(0,-9,5,2,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0}else{ctx.fillStyle='#050303';ctx.beginPath();ctx.ellipse(0,-9,10,3,0,0,Math.PI*2);ctx.fill()}
 ctx.restore();if(!t.destroyed){ctx.fillStyle='#140706';ctx.fillRect(x-32,y+47,64,7);ctx.fillStyle='#ff4b20';ctx.fillRect(x-32,y+47,64*(t.hp/t.maxHp),7)}
}

function drawWeapon(){
 const s=state,p=s.player;
 if(s.selected==='ember'){drawEmberHand();return}
 ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);
 const swing=s.attackTimer>0?Math.sin((s.attackTimer/classes[s.selected].cool)*Math.PI)*.8:0;
 if(s.selected==='gunner'){
  ctx.fillStyle='#282536';ctx.strokeStyle='#d7c4ff';ctx.lineWidth=2;
  ctx.beginPath();ctx.roundRect(12,-8,42,16,4);ctx.fill();ctx.stroke();
  ctx.fillStyle='#9994aa';ctx.fillRect(43,-5,19,10);
  ctx.fillStyle='#51406f';ctx.fillRect(20,7,12,15);
  ctx.fillStyle='#c9aaff';ctx.fillRect(51,-4,8,8)
 }else if(s.selected==='archer'){
  ctx.save();ctx.rotate(-swing*.25);ctx.strokeStyle='#7c431d';ctx.lineWidth=7;ctx.beginPath();ctx.arc(23,0,25,-1.42,1.42);ctx.stroke();ctx.strokeStyle='#d99a4c';ctx.lineWidth=3;ctx.beginPath();ctx.arc(23,0,22,-1.42,1.42);ctx.stroke();ctx.strokeStyle='#ffe8c7';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(29,-24);ctx.lineTo(29,24);ctx.stroke();ctx.fillStyle='#e5b66b';ctx.fillRect(18,-5,10,10);ctx.restore()
 }else if(s.selected==='tank'){
  ctx.save();ctx.rotate(-swing);ctx.fillStyle='#5e3519';ctx.fillRect(15,-5,48,10);ctx.fillStyle='#c38a4d';ctx.fillRect(20,-4,8,8);const hg=ctx.createLinearGradient(45,-23,70,23);hg.addColorStop(0,'#e0e3e7');hg.addColorStop(.35,'#87939c');hg.addColorStop(.65,'#4c5962');hg.addColorStop(1,'#252e35');ctx.fillStyle=hg;ctx.strokeStyle='#171e23';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(48,-24);ctx.lineTo(72,-19);ctx.lineTo(72,19);ctx.lineTo(48,24);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()
 }else if(s.selected==='sword'){
  ctx.save();ctx.rotate(-swing);const blade=ctx.createLinearGradient(15,-6,68,6);blade.addColorStop(0,'#8196a7');blade.addColorStop(.35,'#f4fbff');blade.addColorStop(.7,'#d9e7f0');blade.addColorStop(1,'#788d9e');ctx.fillStyle=blade;ctx.strokeStyle='#536b7e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(16,-6);ctx.lineTo(59,-4);ctx.lineTo(70,0);ctx.lineTo(59,4);ctx.lineTo(16,6);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#e8b65c';ctx.fillRect(14,-10,8,20);ctx.fillStyle='#59351c';ctx.fillRect(3,-4,12,8);ctx.restore()
 }else if(s.selected==='assassin'){
  ctx.save();ctx.rotate(-swing);for(const side of [-1,1]){ctx.save();ctx.translate(19,side*15);ctx.rotate(side*.23);const knife=ctx.createLinearGradient(0,-4,31,4);knife.addColorStop(0,'#657789');knife.addColorStop(.45,'#f1f5fa');knife.addColorStop(1,'#a8b8c7');ctx.fillStyle=knife;ctx.strokeStyle='#526576';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,-4);ctx.lineTo(25,-2);ctx.lineTo(34,0);ctx.lineTo(25,2);ctx.lineTo(0,4);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#542a20';ctx.fillRect(-8,-3,10,6);ctx.restore()}ctx.restore()
 }else if(s.selected==='faust'){
  ctx.save();ctx.rotate(-swing);ctx.fillStyle='#f0c9a0';ctx.strokeStyle='#8a5a34';ctx.lineWidth=2;
  ctx.beginPath();ctx.roundRect(12+swing*12,-19,19,16,7);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.roundRect(12-swing*6,3,19,16,7);ctx.fill();ctx.stroke();
  ctx.restore()
 }
 ctx.restore()
}

function drawPlayer(){
 const s=state,p=s.player;
 ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);
 if(s.invuln>0&&Math.floor(s.elapsed*18)%2===0)ctx.globalAlpha=.45;
 ctx.fillStyle='#07121e99';ctx.beginPath();ctx.ellipse(0,10,20,9,0,0,Math.PI*2);ctx.fill();
 if(s.selected==='tank'){ctx.fillStyle='#778b9c';ctx.fillRect(-13,-13,26,27);ctx.fillStyle='#c4d5dc';ctx.fillRect(-9,-10,18,13);ctx.strokeStyle='#465765';ctx.lineWidth=2;ctx.strokeRect(-13,-13,26,27)}
 else{ctx.fillStyle=s.selected==='archer'?'#28b78b':s.selected==='assassin'?'#7254bd':s.selected==='healer'?'#2bd58b':s.selected==='ember'?'#f16a21':s.selected==='gunner'?'#b58aff':s.selected==='faust'?'#e8b98a':'#c4d8e9';ctx.beginPath();ctx.arc(0,0,15,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e9f8ff';ctx.beginPath();ctx.arc(5,-4,5,0,Math.PI*2);ctx.fill()}
 ctx.restore();drawWeapon()
}

// Resilientes Zeichnen: ein kaputter Abschnitt darf nie den ganzen
// Bildschirm leeren — Hintergrund und Rest bleiben immer sichtbar.
// Fehler werden gezählt (der debug-Chip zeigt sie an) statt sie zu verstecken.
export const drawStats = { ok: 0, errors: {}, restarts: 0, heal: 0, black: 'unausgescannt', coveredBy: '-', rect: '-' };
function safeDraw(label, fn){
 try{fn();drawStats.ok++}catch(e){drawStats.errors[label]=(drawStats.errors[label]||0)+1;console.error('draw['+label+']',e)}
}
// CANVAS-WACHE: malt jedes Frame-Ende ein unsichtbares 1px-Testpixel und liest
// es im naechsten Frame zurueck. Antwortet es falsch, hat iPad-Safari die
// Zeichenflaeche stillgelegt — dann wird sie zwangsweise neu angelegt und das
// Spiel malt sofort weiter (Zaehler: CanvasNeustarten im debug-Chip).
let sentinelArmed=false,sentinelFrames=0,blackInRow=0;
// KOMPOSITING-NUDGE (v30): Der v29-Chip hat es bewiesen - die Backing-Store-
// Lesung klappt (Sentinel armiert, Bild=bunt), aber der BILDSCHIRM zeigt schwarz:
// iPad-Safari verliert die Kompositing-Schicht der Canvas. Detection ist unmoeglich
// (wir lesen nur den Store, nicht den Schirm) -> deshalb heilen wir ZEITGESTEUERT:
// alle 20 s einmal die Canvas still aus dem DOM nehmen und zurueckhaengen.
// Zwingt Safari, die GPU-Schicht neu zu bauen. Inhalt bleibt erhalten, kein Flackern.
let nudgeFrames=0;
function nudgeCompositing(){
 if(++nudgeFrames<1200)return;
 nudgeFrames=0;
 try{repairCanvas();drawStats.heal=(drawStats.heal||0)+1}catch(e){}
}
function canvasHealthCheck(){
 try{
  sentinelFrames++;
  const d=ctx.getImageData(0,0,1,1);
  if(!d||!d.data)return;
  const r=d.data[0];
  if(!sentinelArmed){if(r===255)sentinelArmed=true;return}
  if(sentinelFrames%45!==0)return;
  if(r!==255){forceCanvasRealloc();drawStats.restarts=(drawStats.restarts||0)+1}
  autopsyScreen();
  nudgeCompositing()
 }catch(e){/*Canvas-Wache darf niemals Probleme machen*/}
}
// SCHWARZ-AUTOPSIE: 9 Punkte uebers ganze Bild abtasten. Alle fast-schwarz
// obwohl das Spiel malt? -> Safari komponiert nicht mehr. Dann: Reparatur.
// 2 aufeinanderfolgende schwarze Scans noetig -> keine Fehlalarme bei dunklen
// Hintergrunden. Themen-Fuellungen (#0a1c0d co) sind alle heller als Schwelle 14.
function autopsyScreen(){
 try{
  const s=state,W=Math.max(1,s.W||1),H=Math.max(1,s.H||1),dpr=s.dpr||1;
  let black=0;
  for(let i=0;i<9;i++){
   const fx=i%3,fy=Math.floor(i/3);
   const px=Math.min(W-1,Math.floor(fx*W/2)),py=Math.min(H-1,Math.floor(fy*H/2));
   const d=ctx.getImageData(Math.floor(px*dpr),Math.floor(py*dpr),1,1);
   if(!d||!d.data||d.data.length<4){drawStats.black='unlesbar';blackInRow=0;return}
   const a=d.data[3],mx=Math.max(d.data[0],d.data[1],d.data[2]);
   if(a===0||mx<14)black++
  }
  drawStats.black=black===9?'schwarz':'bunt';
  domCheck();
  if(black===9){
   blackInRow++;
   // Nur heilen, wenn auch die Canvas-Flaeche und das Deckverhaeltnis normal sind
   const obendrauf=String(drawStats.coveredBy);
   const decktCanvas=obendrauf===''||obendrauf==='?'||/#?canvas/i.test(obendrauf)||obendrauf==='-';
   if(blackInRow>=2&&decktCanvas){repairCanvas();drawStats.heal=(drawStats.heal||0)+1;drawStats.restarts=(drawStats.restarts||0)+1}
  }else blackInRow=0
 }catch(e){drawStats.black='unlesbar';blackInRow=0}
}
// Verdeckt etwas die Leinwand? Wie gross ist sie sichtbar?
function domCheck(){
 try{
  const cv=document.getElementById&&document.getElementById('canvas');
  if(cv&&cv.getBoundingClientRect){
   const r=cv.getBoundingClientRect();
   drawStats.rect=Math.round(r.width)+'x'+Math.round(r.height);
   let f=null;
   try{f=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)}catch(e){}
   drawStats.coveredBy=f?(f.id?'#'+f.id:(f.tagName||'?')):'-'
  }
 }catch(e){drawStats.coveredBy='?'}
}

function themeFallback(){
 const b=state.selectedBoss;
 return b==='dragon'?'#1d0908':b==='gunball'?'#080510':b==='snake'?'#0a1c0d':b==='shadow'?'#0b0714':'#63dff5'
}

export function draw(){
 const s=state;
 canvasHealthCheck();
 ctx.clearRect(0,0,99999,99999);
 // Sicherheit: Canvas bekommt IMMER zuerst die Themen-Farbe voll gemalt —
 // selbst wenn danach alles andere fehlschlaegt, ist es nicht mehr "schwarz-leer".
 ctx.fillStyle=themeFallback();ctx.fillRect(0,0,Math.max(s.W,1),Math.max(s.H,1));
 ctx.save();ctx.translate(-s.camera.x+(s.screenShake>0?(Math.random()-.5)*s.screenShake:0),-s.camera.y+(s.screenShake>0?(Math.random()-.5)*s.screenShake:0));
 safeDraw('hintergrund',()=>drawBackground());
 if(s.arena.w<MAP.w||s.arena.h<MAP.h){ctx.fillStyle='#000000c6';if(s.arena.w<MAP.w)ctx.fillRect(s.arena.w,0,MAP.w-s.arena.w,MAP.h);if(s.arena.h<MAP.h)ctx.fillRect(0,s.arena.h,MAP.w,MAP.h-s.arena.h)}
 const dragon=s.bosses.find(b=>b.type==='dragon'&&b.alive), shadowB=s.bosses.find(b=>b.type==='shadow'&&b.alive), hero=dragon||shadowB;
 if(hero)for(const t of s.infernoTowers)if(!t.destroyed){const beamColor=hero.type==='shadow'?'#8f5cff':'#ff3219',beamGlow=hero.type==='shadow'?'#b79aff':'#ff3517',beamCore=hero.type==='shadow'?'#e2d6ff':'#ffbd58';ctx.save();ctx.strokeStyle=beamColor;ctx.shadowColor=beamGlow;ctx.shadowBlur=18;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(t.x,t.y-9);ctx.lineTo(hero.x,hero.y);ctx.stroke();ctx.strokeStyle=beamCore;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(t.x,t.y-9);ctx.lineTo(hero.x,hero.y);ctx.stroke();ctx.restore()}
 safeDraw('feuerspuren',()=>{for(const f of s.fireTrails){
  ctx.save();ctx.globalAlpha=Math.max(0,f.life/(f.maxLife||8));ctx.shadowColor='#ff3d13';ctx.shadowBlur=55;
  ctx.fillStyle='#8f1008';ctx.beginPath();ctx.ellipse(f.x,f.y,f.r*1.45,f.r*1.05,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#e92712';ctx.beginPath();ctx.ellipse(f.x,f.y,f.r*1.2,f.r*.85,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ff4a1b';ctx.beginPath();ctx.ellipse(f.x,f.y,f.r*.85,f.r*.65,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ffce51';ctx.beginPath();ctx.ellipse(f.x,f.y,f.r*.5,f.r*.4,0,0,Math.PI*2);ctx.fill();
  for(let flame=0;flame<15;flame++){const a=flame*Math.PI*2/15+s.elapsed*1.5,fx=f.x+Math.cos(a)*f.r*.8,fy=f.y+Math.sin(a)*f.r*.65;ctx.fillStyle=flame%3===0?'#ffe65a':'#ff7822';ctx.beginPath();ctx.ellipse(fx,fy,f.r*.13,f.r*.27,a,0,Math.PI*2);ctx.fill()}
  ctx.restore()
 }});
 safeDraw('bosse',()=>{for(const b of s.bosses)if(b.alive){if(b.type==='dragon')drawDragon(b);else if(b.type==='gunball')drawGunball(b);else if(b.type==='shadow')drawShadow(b);else if(b.type==='snake')drawSnake(b);else if(b.type==='snakeSkin')drawSkin(b);else drawSlime(b)}});
 safeDraw('tuerme',()=>{for(const t of s.infernoTowers)drawSauronTower(t)});
 safeDraw('schlangen',()=>{for(const a of s.smallSnakes)if(!a.destroyed)drawSmallSnake(a)});
 safeDraw('begleiter',()=>{for(const comp of s.companions){ctx.save();ctx.translate(comp.x,comp.y+Math.sin(comp.wobble)*3);ctx.globalAlpha=.95;ctx.strokeStyle='#aaffff';ctx.lineWidth=2;ctx.shadowColor='#35eaff';ctx.shadowBlur=12;ctx.beginPath();ctx.arc(0,0,comp.r+4,0,Math.PI*2);ctx.stroke();ctx.restore();drawSlime(comp)}});
 if(dragon&&dragon.mode==='beamCharge'){
  ctx.save();ctx.translate(dragon.x,dragon.y);ctx.rotate(dragon.beamAngle);const len=rayMapLength(dragon.x,dragon.y,dragon.beamAngle);ctx.globalAlpha=.35+Math.sin(s.elapsed*18)*.25;ctx.fillStyle='#ff321b';ctx.fillRect(0,-18,len,36);ctx.fillStyle='#ffb13b';ctx.fillRect(0,-5,len,10);ctx.restore()
 }
 if(dragon&&dragon.mode==='beamActive'){
  ctx.save();ctx.translate(dragon.x,dragon.y);ctx.rotate(dragon.beamAngle);const len=rayMapLength(dragon.x,dragon.y,dragon.beamAngle);ctx.shadowColor='#ff1600';ctx.shadowBlur=45;ctx.fillStyle='#9b0000';ctx.fillRect(0,-54,len,108);ctx.fillStyle='#ff2712';ctx.fillRect(0,-34,len,68);ctx.fillStyle='#ff8b28';ctx.fillRect(0,-18,len,36);ctx.fillStyle='#fff3a0';ctx.fillRect(0,-7,len,14);ctx.restore()
 }
 if(s.selected==='ember'&&s.emberBeamTimer>0){
  s.emberBeamAngle=s.player.angle;const len=rayMapLength(s.player.x,s.player.y,s.emberBeamAngle);ctx.save();ctx.translate(s.player.x,s.player.y);ctx.rotate(s.emberBeamAngle);const pulse=1+Math.sin(s.elapsed*25)*.12;ctx.shadowColor='#ff3c00';ctx.shadowBlur=45;ctx.fillStyle='#8b1604';ctx.fillRect(15,-36*pulse,len,72*pulse);ctx.fillStyle='#ff3a0a';ctx.fillRect(15,-25*pulse,len,50*pulse);ctx.fillStyle='#ff9d20';ctx.fillRect(15,-15*pulse,len,30*pulse);ctx.fillStyle='#fff1a0';ctx.fillRect(15,-6*pulse,len,12*pulse);ctx.restore();
  for(let i=0;i<18;i++){const d=Math.random()*Math.min(len,900),px=s.player.x+Math.cos(s.emberBeamAngle)*d,py=s.player.y+Math.sin(s.emberBeamAngle)*d,side=(Math.random()-.5)*48;ctx.save();ctx.translate(px-Math.sin(s.emberBeamAngle)*side,py+Math.cos(s.emberBeamAngle)*side);ctx.globalAlpha=.55+Math.random()*.4;ctx.fillStyle=Math.random()<.5?'#ffdf45':'#ff4b0a';ctx.beginPath();ctx.ellipse(0,0,4+Math.random()*5,10+Math.random()*12,Math.random()*Math.PI,0,Math.PI*2);ctx.fill();ctx.restore()}
 }
 safeDraw('spieler',()=>drawPlayer());
 safeDraw('projektile',()=>{for(const p of s.projectiles){
  if(!isFinite(p.x)||!isFinite(p.y))continue;
  if(p.gunner){ctx.fillStyle='#e2caff';ctx.shadowColor='#a66cff';ctx.shadowBlur=18;ctx.beginPath();ctx.ellipse(p.x,p.y,10,4,Math.atan2(p.vy,p.vx),0,Math.PI*2);ctx.fill();ctx.shadowBlur=0}
  else{ctx.fillStyle='#b9fbff';ctx.shadowColor='#36dfff';ctx.shadowBlur=14;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0}
 }});
 safeDraw('feind-projektile',()=>{for(const p of s.enemyProjectiles){
  if(!isFinite(p.x)||!isFinite(p.y))continue;
  ctx.save();
  if(p.type==='shuriken'){
   ctx.translate(p.x,p.y);ctx.rotate(s.elapsed*16);
   ctx.shadowColor='#aab8ff';ctx.shadowBlur=12;ctx.fillStyle='#dfe6ff';
   for(let k=0;k<4;k++){ctx.rotate(Math.PI/2);ctx.beginPath();ctx.moveTo(0,-p.r);ctx.lineTo(4,-4);ctx.lineTo(0,1);ctx.lineTo(-4,-4);ctx.closePath();ctx.fill()}
   ctx.shadowBlur=0;ctx.fillStyle='#454d7a';ctx.beginPath();ctx.arc(0,0,3,0,Math.PI*2);ctx.fill();
   ctx.restore();continue
  }
  const colors={venom:'#8cf838',snake:'#7ee0c2',boomerang:'#e0c7ff',growth:'#a4e87b',mirror:'#d6d0ff',teleport:'#b36bff',giant:'#ffb06c',splitter:'#ffcf75',planet:'#a9bfff',chain:'#d8aaff',time:'#79e6ff',rain:'#d2b3ff',fusion:'#ff8dce',magnet:'#ff5c8a',blackhole:'#28143f',core:'#ffdc75',shard:'#ffe5a3',chainLink:'#bfa4ff',planetMoon:'#b6d5ff'};
  const color=colors[p.type]||'#ff9c36';
  ctx.shadowColor=color;ctx.shadowBlur=p.type==='blackhole'?45:22;
  const g=ctx.createRadialGradient(p.x-p.r*.2,p.y-p.r*.2,2,p.x,p.y,p.r);
  g.addColorStop(0,'#ffffff');g.addColorStop(.25,color);g.addColorStop(1,'#1a1028');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
  if(p.type==='chainLink'){ctx.strokeStyle='#e2caff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,p.r+4,0,Math.PI*2);ctx.stroke()}
  if(p.type==='blackhole'){ctx.fillStyle='#080510';ctx.beginPath();ctx.arc(p.x,p.y,p.r*.65,0,Math.PI*2);ctx.fill()}
  ctx.restore()
 }});
 safeDraw('partikel',()=>{for(const p of s.particles){if(!isFinite(p.x)||!isFinite(p.y))continue;ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill()}});
 ctx.globalAlpha=1;
 safeDraw('effekte',()=>{for(const e of s.effects){
  if(e.type==='slash'){ctx.strokeStyle=e.weapon==='tank'?'#ff9c58':e.weapon==='assassin'?'#e0d2ff':'#ffbba0';ctx.lineWidth=e.weapon==='tank'?12:7;ctx.globalAlpha=e.life/.2;ctx.beginPath();ctx.arc(e.x,e.y,e.r,e.angle-.85,e.angle+.85);ctx.stroke()}
  if(e.type==='weapon'){ctx.globalAlpha=e.life/.22;ctx.strokeStyle='#ffbd91';ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y,35,e.angle-.4,e.angle+.4);ctx.stroke()}
  if(e.type==='towerDestroy'){ctx.globalAlpha=e.life;ctx.strokeStyle='#ff632d';ctx.lineWidth=7;ctx.beginPath();ctx.arc(e.x,e.y,60*(1-e.life)+15,0,Math.PI*2);ctx.stroke()}
  if(e.type==='companionHit'){ctx.globalAlpha=e.life/.22;ctx.strokeStyle='#70faff';ctx.shadowColor='#00dfff';ctx.shadowBlur=15;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.tx,e.ty);ctx.stroke();ctx.shadowBlur=0}
 }});
 ctx.globalAlpha=1;ctx.restore();
 // CANVAS-WACHEN-SENTINEL (v29-Fix): muss im IDENTITAETS-Raum gemalt werden!
 // Er haengte vorher am Ende von drawEmberHand - mitten im Kamera-Raum. Bei
 // Kamera=560,844 lag der Testpunkt 560 px ausser Sicht, die Lesung oben links
 // fand NIE Magenta, die Wache war vom 2. Frame an toter Code (deshalb
 // Neustarten=0 und Bild=unausgescannt). Jetzt: Device-Pixel (0,0) oben links.
 try{ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#ff00ff';ctx.fillRect(0,0,1,1);ctx.restore()}catch(e){}
}
