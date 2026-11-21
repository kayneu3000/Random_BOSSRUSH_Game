import { state } from "./state.js";
import { classes, MAP } from "./config.js";
import { ctx } from "./canvas.js";
import { rayMapLength } from "./utils.js";

function drawBackground(){
 const s=state;
 if(s.selectedBoss==='dragon'){
  ctx.fillStyle='#1d0908';ctx.fillRect(0,0,MAP.w,MAP.h);
  for(let x=0;x<MAP.w;x+=100)for(let y=0;y<MAP.h;y+=100){ctx.fillStyle=((x/100+y/100)%2===0)?'#32120e':'#260d0b';ctx.fillRect(x,y,100,100);ctx.strokeStyle='#68251a';ctx.lineWidth=2;ctx.strokeRect(x,y,100,100)}
  for(let i=0;i<70;i++){const x=(i*317+83)%MAP.w,y=(i*193+127)%MAP.h;ctx.strokeStyle='#9b321b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+15,y+10);ctx.lineTo(x+23,y+3);ctx.stroke()}
  ctx.fillStyle='#5a1b12';ctx.fillRect(0,0,MAP.w,25);ctx.fillRect(0,MAP.h-25,MAP.w,25);ctx.fillRect(0,0,25,MAP.h);ctx.fillRect(MAP.w-25,0,25,MAP.h);ctx.strokeStyle='#ff512c';ctx.lineWidth=4;ctx.strokeRect(25,25,MAP.w-50,MAP.h-50)
 }else if(s.selectedBoss==='gunball'){
  ctx.fillStyle='#080510';ctx.fillRect(0,0,MAP.w,MAP.h);
  for(let x=0;x<MAP.w;x+=100)for(let y=0;y<MAP.h;y+=100){ctx.fillStyle=((x/100+y/100)%2===0)?'#171027':'#0e091a';ctx.fillRect(x,y,100,100);ctx.strokeStyle='#35234f';ctx.lineWidth=2;ctx.strokeRect(x,y,100,100)}
  for(let i=0;i<85;i++){const x=(i*317+83)%MAP.w,y=(i*193+127)%MAP.h;ctx.fillStyle='#a77aff55';ctx.beginPath();ctx.arc(x,y,2+(i%3),0,Math.PI*2);ctx.fill()}
  ctx.fillStyle='#24133e';ctx.fillRect(0,0,MAP.w,25);ctx.fillRect(0,MAP.h-25,MAP.w,25);ctx.fillRect(0,0,25,MAP.h);ctx.fillRect(MAP.w-25,0,25,MAP.h);ctx.strokeStyle='#b58aff';ctx.lineWidth=4;ctx.strokeRect(25,25,MAP.w-50,MAP.h-50)
 }else{
  ctx.fillStyle='#63dff5';ctx.fillRect(0,0,MAP.w,MAP.h);
  for(let x=0;x<MAP.w;x+=100)for(let y=0;y<MAP.h;y+=100){ctx.fillStyle=((x/100+y/100)%2===0)?'#83efff':'#55cce9';ctx.fillRect(x,y,100,100);ctx.strokeStyle='#36b5d9';ctx.lineWidth=2;ctx.strokeRect(x,y,100,100)}
  for(let i=0;i<95;i++){const x=(i*317+83)%MAP.w,y=(i*193+127)%MAP.h;ctx.fillStyle='#c5fbff88';ctx.beginPath();ctx.arc(x,y,2+(i%3),0,Math.PI*2);ctx.fill()}
  ctx.fillStyle='#2caacb';ctx.fillRect(0,0,MAP.w,25);ctx.fillRect(0,MAP.h-25,MAP.w,25);ctx.fillRect(0,0,25,MAP.h);ctx.fillRect(MAP.w-25,0,25,MAP.h);ctx.strokeStyle='#b8f7ff';ctx.lineWidth=4;ctx.strokeRect(25,25,MAP.w-50,MAP.h-50)
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

/* Gunball: silberne, staendig rotierende Kugel mit Roboter-Gesicht und vier Waffen */
function drawGunball(b){
 const r=b.r,s=state;
 ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.rotation);
 ctx.shadowColor=b.mode==='vulnerable'?'#c6a4ff':'#8f63d8';ctx.shadowBlur=30;
 const metal=ctx.createRadialGradient(-r*.35,-r*.4,5,0,0,r);
 metal.addColorStop(0,'#ffffff');metal.addColorStop(.22,'#d8d9e5');metal.addColorStop(.52,'#85899b');metal.addColorStop(.8,'#45495d');metal.addColorStop(1,'#171827');
 ctx.fillStyle=metal;ctx.strokeStyle='#e0d6ff';ctx.lineWidth=4;
 ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
 ctx.strokeStyle='#29223b';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,r*.78,0,Math.PI*2);ctx.stroke();
 for(let i=0;i<12;i++){
  const a=i*Math.PI/6;
  ctx.save();ctx.rotate(a);
  ctx.fillStyle='#171421';ctx.strokeStyle='#b4a1d8';ctx.lineWidth=2;
  ctx.beginPath();ctx.roundRect(r*.72,-8,24,16,5);ctx.fill();ctx.stroke();
  ctx.fillStyle='#a987ed';ctx.beginPath();ctx.arc(r*.82,0,4,0,Math.PI*2);ctx.fill();
  ctx.restore()
 }
 ctx.fillStyle='#252035';ctx.strokeStyle='#d7c7ff';ctx.lineWidth=3;
 ctx.beginPath();ctx.roundRect(-r*.48,-r*.34,r*.96,r*.68,18);ctx.fill();ctx.stroke();
 ctx.fillStyle='#f0eaff';ctx.shadowColor='#b38aff';ctx.shadowBlur=15;
 ctx.beginPath();ctx.ellipse(-r*.2,-r*.07,10,15,-.2,0,Math.PI*2);ctx.ellipse(r*.2,-r*.07,10,15,.2,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 ctx.fillStyle='#17101f';ctx.beginPath();ctx.arc(-r*.2,-r*.07,4,0,Math.PI*2);ctx.arc(r*.2,-r*.07,4,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='#160d20';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-r*.22,r*.19);ctx.lineTo(-r*.08,r*.25);ctx.lineTo(r*.08,r*.25);ctx.lineTo(r*.22,r*.19);ctx.stroke();
 ctx.restore();

 ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.rotation);
 for(let i=0;i<4;i++){
  const a=i*Math.PI/2;
  ctx.save();ctx.rotate(a);
  const active=b.weaponIndex===i&&b.mode==='attacking';
  ctx.translate(0,-r-13);
  ctx.fillStyle=active?'#c69aff':'#343142';ctx.strokeStyle=active?'#f0dfff':'#9d91b5';ctx.lineWidth=3;
  if(i===0){ctx.fillRect(-10,-14,20,29);ctx.fillRect(-6,10,12,16)}
  if(i===1){ctx.beginPath();ctx.moveTo(-13,14);ctx.lineTo(-9,-13);ctx.lineTo(0,-24);ctx.lineTo(9,-13);ctx.lineTo(13,14);ctx.closePath();ctx.fill();ctx.stroke()}
  if(i===2){ctx.fillRect(-15,-15,30,30);for(let k=-1;k<=1;k++)ctx.fillRect(k*8-2,-26,4,13)}
  if(i===3){ctx.fillRect(-7,-27,14,48);ctx.fillRect(-12,-10,24,8)}
  ctx.restore()
 }
 ctx.restore();
 if(b.mode==='vulnerable'){
  ctx.strokeStyle='#d5b9ff';ctx.lineWidth=5;ctx.shadowColor='#a56aff';ctx.shadowBlur=25;ctx.beginPath();ctx.arc(b.x,b.y,r+18+Math.sin(s.elapsed*8)*4,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0
 }
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
 ctx.globalAlpha=1;ctx.restore()
}

/* Drachenzeichnung */
function drawDragon(b){
 const r=b.r;ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.angle);ctx.translate(0,Math.sin(b.wobble)*3);
 const tail=ctx.createLinearGradient(-r*1.7,0,-r*.4,0);tail.addColorStop(0,'#3a090c');tail.addColorStop(.6,'#8b1d19');tail.addColorStop(1,'#d43a20');
 ctx.fillStyle=tail;ctx.strokeStyle='#4a0c11';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-r*.55,r*.15);ctx.quadraticCurveTo(-r*1.25,r*.5,-r*1.8,r*.12);ctx.lineTo(-r*1.3,r*.55);ctx.lineTo(-r*1.42,r*.18);ctx.lineTo(-r*1.05,r*.3);ctx.lineTo(-r*.8,-r*.12);ctx.closePath();ctx.fill();ctx.stroke();
 for(let i=0;i<5;i++){const tx=-r*.7-i*r*.18,ty=r*.2+Math.sin(i*.7)*r*.08;ctx.strokeStyle='#e85a35';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(tx,ty-r*.07);ctx.lineTo(tx-r*.12,ty+r*.07);ctx.stroke()}
 for(const side of [-1,1]){
  ctx.save();ctx.scale(1,side);const wing=ctx.createLinearGradient(-r*.3,-r*1.2,r*1.3,0);wing.addColorStop(0,'#a92b1e');wing.addColorStop(.55,'#67151a');wing.addColorStop(1,'#26090e');
  ctx.fillStyle=wing;ctx.strokeStyle='#ff6236';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-r*.2,-r*.25);ctx.lineTo(r*.35,-r*.95);ctx.lineTo(r*1.35,-r*1.45);ctx.lineTo(r*1.15,-r*.55);ctx.lineTo(r*1.35,-r*.1);ctx.lineTo(r*.75,-r*.25);ctx.lineTo(r*.42,r*.12);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle='#d34a2b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-r*.1,-r*.2);ctx.lineTo(r*1.25,-r*1.4);ctx.moveTo(r*.35,-r*.4);ctx.lineTo(r*1.15,-r*.55);ctx.moveTo(r*.45,-r*.05);ctx.lineTo(r*1.35,-r*.1);ctx.stroke();
  ctx.strokeStyle='#ff8a50';ctx.lineWidth=1.3;ctx.globalAlpha=.8;ctx.beginPath();ctx.moveTo(r*.1,-r*.28);ctx.lineTo(r*.85,-r*.7);ctx.moveTo(r*.25,-r*.2);ctx.lineTo(r*1.12,-r*.25);ctx.stroke();ctx.restore()
 }
 const body=ctx.createRadialGradient(-r*.3,-r*.3,r*.1,0,r*.1,r);body.addColorStop(0,'#ffb35b');body.addColorStop(.2,'#f06b35');body.addColorStop(.48,'#c13a25');body.addColorStop(.76,'#72161a');body.addColorStop(1,'#28070c');
 ctx.fillStyle=body;ctx.strokeStyle='#ff7544';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,r*.10,r*.72,r*.55,0,0,Math.PI*2);ctx.fill();ctx.stroke();
 for(let row=0;row<4;row++)for(let col=0;col<5;col++){const sx=-r*.5+col*r*.22+(row%2)*r*.08,sy=-r*.22+row*r*.16;ctx.fillStyle=(row+col)%2?'#9f2b21':'#c84328';ctx.strokeStyle='#5d1418';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(sx-r*.07,sy-r*.06);ctx.lineTo(sx+r*.07,sy-r*.05);ctx.lineTo(sx+r*.11,sy+r*.04);ctx.lineTo(sx,sy+r*.1);ctx.lineTo(sx-r*.11,sy+r*.04);ctx.closePath();ctx.fill();ctx.stroke()}
 for(let row=0;row<4;row++){const by=r*.02+row*r*.17;ctx.fillStyle=row%2?'#ffb66d':'#f48a4a';ctx.strokeStyle='#852018';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(r*.02,by,r*.22,r*.09,0,0,Math.PI*2);ctx.fill();ctx.stroke()}
 for(let i=0;i<7;i++){const sx=-r*.52+i*r*.17,sy=-r*.38+Math.sin(i*.5)*r*.05;ctx.fillStyle=i%2?'#79151a':'#a52620';ctx.strokeStyle='#ff7544';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(sx-r*.06,sy+r*.12);ctx.lineTo(sx,sy-r*.17);ctx.lineTo(sx+r*.09,sy+r*.12);ctx.closePath();ctx.fill();ctx.stroke()}
 for(const side of [-1,1]){ctx.save();ctx.translate(-r*.2,side*r*.43);ctx.fillStyle='#7c1718';ctx.strokeStyle='#ff5b35';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,r*.19,r*.22,side*.25,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#f1b37b';for(let claw=0;claw<3;claw++){const cx=r*.1,cy=side*(-r*.1+claw*r*.1);ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+r*.15,cy+side*r*.035);ctx.lineTo(cx+r*.08,cy+side*r*.09);ctx.closePath();ctx.fill()}ctx.restore()}
 ctx.fillStyle='#a82b20';ctx.strokeStyle='#ff6d3d';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(r*.35,-r*.25);ctx.lineTo(r*.72,-r*.58);ctx.lineTo(r*.85,-r*.25);ctx.lineTo(r*.7,r*.05);ctx.lineTo(r*.4,r*.1);ctx.closePath();ctx.fill();ctx.stroke();
 const head=ctx.createLinearGradient(r*.5,-r*.7,r*1.3,-r*.1);head.addColorStop(0,'#f36a35');head.addColorStop(.5,'#a82a1e');head.addColorStop(1,'#451014');ctx.fillStyle=head;ctx.beginPath();ctx.ellipse(r*.9,-r*.42,r*.43,r*.33,0,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.fillStyle='#8f1e1a';ctx.strokeStyle='#ff7742';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(r*.65,-r*.56);ctx.lineTo(r*.48,-r*.95);ctx.lineTo(r*.78,-r*.67);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(r*.92,-r*.63);ctx.lineTo(r*1.18,-r*.92);ctx.lineTo(r*1.12,-r*.52);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#ffdf35';ctx.shadowColor='#ff260b';ctx.shadowBlur=22;ctx.beginPath();ctx.ellipse(r*.98,-r*.47,r*.13,r*.09,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 ctx.fillStyle='#270905';ctx.beginPath();ctx.ellipse(r*.99,-r*.47,r*.035,r*.09,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#310a08';ctx.beginPath();ctx.arc(r*1.18,-r*.34,r*.035,0,Math.PI*2);ctx.arc(r*1.18,-r*.25,r*.035,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#ffe6b1';ctx.beginPath();ctx.moveTo(r*.9,-r*.2);ctx.lineTo(r*.95,-r*.08);ctx.lineTo(r*1.01,-r*.2);ctx.fill();ctx.beginPath();ctx.moveTo(r*1.05,-r*.2);ctx.lineTo(r*1.1,-r*.08);ctx.lineTo(r*1.16,-r*.2);ctx.fill();
 ctx.strokeStyle='#ffb34b';ctx.lineWidth=1.5;ctx.globalAlpha=.65;ctx.beginPath();ctx.moveTo(-r*.35,r*.05);ctx.lineTo(-r*.2,r*.17);ctx.lineTo(-r*.3,r*.29);ctx.moveTo(r*.1,r*.16);ctx.lineTo(r*.2,r*.25);ctx.lineTo(r*.12,r*.34);ctx.stroke();ctx.globalAlpha=1;ctx.restore();
 if(b.mode==='exhausted'){ctx.strokeStyle='#ffd27b';ctx.lineWidth=4;ctx.beginPath();ctx.arc(b.x,b.y,r+18,0,Math.PI*2);ctx.stroke()}
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
 }
 ctx.restore()
}

function drawPlayer(){
 const s=state,p=s.player;
 ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);
 if(s.invuln>0&&Math.floor(s.elapsed*18)%2===0)ctx.globalAlpha=.45;
 ctx.fillStyle='#07121e99';ctx.beginPath();ctx.ellipse(0,10,20,9,0,0,Math.PI*2);ctx.fill();
 if(s.selected==='tank'){ctx.fillStyle='#778b9c';ctx.fillRect(-13,-13,26,27);ctx.fillStyle='#c4d5dc';ctx.fillRect(-9,-10,18,13);ctx.strokeStyle='#465765';ctx.lineWidth=2;ctx.strokeRect(-13,-13,26,27)}
 else{ctx.fillStyle=s.selected==='archer'?'#28b78b':s.selected==='assassin'?'#7254bd':s.selected==='healer'?'#2bd58b':s.selected==='ember'?'#f16a21':s.selected==='gunner'?'#b58aff':'#c4d8e9';ctx.beginPath();ctx.arc(0,0,15,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e9f8ff';ctx.beginPath();ctx.arc(5,-4,5,0,Math.PI*2);ctx.fill()}
 ctx.restore();drawWeapon()
}

export function draw(){
 const s=state;
 ctx.save();ctx.translate(-s.camera.x+(s.screenShake>0?(Math.random()-.5)*s.screenShake:0),-s.camera.y+(s.screenShake>0?(Math.random()-.5)*s.screenShake:0));
 drawBackground();
 const dragon=s.bosses.find(b=>b.type==='dragon'&&b.alive);
 if(dragon)for(const t of s.infernoTowers)if(!t.destroyed){ctx.save();ctx.strokeStyle='#ff3219';ctx.shadowColor='#ff3517';ctx.shadowBlur=18;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(t.x,t.y-9);ctx.lineTo(dragon.x,dragon.y);ctx.stroke();ctx.strokeStyle='#ffbd58';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(t.x,t.y-9);ctx.lineTo(dragon.x,dragon.y);ctx.stroke();ctx.restore()}
 for(const f of s.fireTrails){
  ctx.save();ctx.globalAlpha=Math.max(0,f.life/(f.maxLife||8));ctx.shadowColor='#ff3d13';ctx.shadowBlur=55;
  ctx.fillStyle='#8f1008';ctx.beginPath();ctx.ellipse(f.x,f.y,f.r*1.45,f.r*1.05,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#e92712';ctx.beginPath();ctx.ellipse(f.x,f.y,f.r*1.2,f.r*.85,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ff4a1b';ctx.beginPath();ctx.ellipse(f.x,f.y,f.r*.85,f.r*.65,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ffce51';ctx.beginPath();ctx.ellipse(f.x,f.y,f.r*.5,f.r*.4,0,0,Math.PI*2);ctx.fill();
  for(let flame=0;flame<15;flame++){const a=flame*Math.PI*2/15+s.elapsed*1.5,fx=f.x+Math.cos(a)*f.r*.8,fy=f.y+Math.sin(a)*f.r*.65;ctx.fillStyle=flame%3===0?'#ffe65a':'#ff7822';ctx.beginPath();ctx.ellipse(fx,fy,f.r*.13,f.r*.27,a,0,Math.PI*2);ctx.fill()}
  ctx.restore()
 }
 for(const b of s.bosses)if(b.alive){if(b.type==='dragon')drawDragon(b);else if(b.type==='gunball')drawGunball(b);else drawSlime(b)}
 for(const t of s.infernoTowers)drawSauronTower(t);
 for(const comp of s.companions){ctx.save();ctx.translate(comp.x,comp.y+Math.sin(comp.wobble)*3);ctx.globalAlpha=.95;ctx.strokeStyle='#aaffff';ctx.lineWidth=2;ctx.shadowColor='#35eaff';ctx.shadowBlur=12;ctx.beginPath();ctx.arc(0,0,comp.r+4,0,Math.PI*2);ctx.stroke();ctx.restore();drawSlime(comp)}
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
 drawPlayer();
 for(const p of s.projectiles){
  if(p.gunner){ctx.fillStyle='#e2caff';ctx.shadowColor='#a66cff';ctx.shadowBlur=18;ctx.beginPath();ctx.ellipse(p.x,p.y,10,4,Math.atan2(p.vy,p.vx),0,Math.PI*2);ctx.fill();ctx.shadowBlur=0}
  else{ctx.fillStyle='#b9fbff';ctx.shadowColor='#36dfff';ctx.shadowBlur=14;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0}
 }
 for(const p of s.enemyProjectiles){
  ctx.save();
  const colors={snake:'#7ee0c2',boomerang:'#e0c7ff',growth:'#a4e87b',mirror:'#d6d0ff',teleport:'#b36bff',giant:'#ffb06c',splitter:'#ffcf75',planet:'#a9bfff',chain:'#d8aaff',time:'#79e6ff',rain:'#d2b3ff',fusion:'#ff8dce',magnet:'#ff5c8a',blackhole:'#28143f',core:'#ffdc75',shard:'#ffe5a3',chainLink:'#bfa4ff',planetMoon:'#b6d5ff'};
  const color=colors[p.type]||'#ff9c36';
  ctx.shadowColor=color;ctx.shadowBlur=p.type==='blackhole'?45:22;
  const g=ctx.createRadialGradient(p.x-p.r*.2,p.y-p.r*.2,2,p.x,p.y,p.r);
  g.addColorStop(0,'#ffffff');g.addColorStop(.25,color);g.addColorStop(1,'#1a1028');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
  if(p.type==='chainLink'){ctx.strokeStyle='#e2caff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,p.r+4,0,Math.PI*2);ctx.stroke()}
  if(p.type==='blackhole'){ctx.fillStyle='#080510';ctx.beginPath();ctx.arc(p.x,p.y,p.r*.65,0,Math.PI*2);ctx.fill()}
  ctx.restore()
 }
 for(const p of s.particles){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill()}
 ctx.globalAlpha=1;
 for(const e of s.effects){
  if(e.type==='slash'){ctx.strokeStyle=e.weapon==='tank'?'#ff9c58':e.weapon==='assassin'?'#e0d2ff':'#ffbba0';ctx.lineWidth=e.weapon==='tank'?12:7;ctx.globalAlpha=e.life/.2;ctx.beginPath();ctx.arc(e.x,e.y,e.r,e.angle-.85,e.angle+.85);ctx.stroke()}
  if(e.type==='weapon'){ctx.globalAlpha=e.life/.22;ctx.strokeStyle='#ffbd91';ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y,35,e.angle-.4,e.angle+.4);ctx.stroke()}
  if(e.type==='towerDestroy'){ctx.globalAlpha=e.life;ctx.strokeStyle='#ff632d';ctx.lineWidth=7;ctx.beginPath();ctx.arc(e.x,e.y,60*(1-e.life)+15,0,Math.PI*2);ctx.stroke()}
  if(e.type==='companionHit'){ctx.globalAlpha=e.life/.22;ctx.strokeStyle='#70faff';ctx.shadowColor='#00dfff';ctx.shadowBlur=15;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.tx,e.ty);ctx.stroke();ctx.shadowBlur=0}
 }
 ctx.globalAlpha=1;ctx.restore()
}
