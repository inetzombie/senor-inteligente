'use strict';
// Señor Inteligente v2 — vector cartoon renderer. World is 320x180 logical units, drawn at native resolution.
const cv=document.getElementById('c'),g=cv.getContext('2d'),W=320,H=180,GY=152,DEBUG=/[?&]debug=1/.test(location.search);
let S=3;
let LOW=+(localStorage.getItem('siLow')||0)||(/[?&]lowfx=1/.test(location.search)?2:0);
function fit(){const tch='ontouchstart'in window||navigator.maxTouchPoints>0,port=innerHeight>innerWidth,iw=innerWidth,ih=innerHeight;
  // touch: keep JUMP/GRAB out of the play area — right gutter in landscape, strip below in portrait
  let gw=0,gh=0;if(tch){if(port)gh=120;else{const free=iw-ih*W/H;gw=free/2>=84?0:88}}
  const s=Math.min((iw-gw*1)/W,(ih-gh)/H),cw=W*s,ch=H*s;cv.style.width=cw+'px';cv.style.height=ch+'px';
  const wr=document.getElementById('wrap');wr.style.right=gw+'px';wr.style.bottom=gh+'px';document.body.classList.toggle('gut',!!gw);document.body.classList.toggle('port',!!gh);
  const dpr=LOW>=2?.75:LOW?1:Math.min(2,window.devicePixelRatio||1);cv.width=Math.min(LOW?960:1920,Math.round(cw*dpr));cv.height=Math.round(cv.width*H/W);S=cv.width/W}
addEventListener('resize',fit);fit();
// ---------- audio ----------
let AC=null;function au(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(AC&&AC.state==='suspended')AC.resume()}
function tone(f,d,ty='square',v=.06,sl=0){if(!AC)return;const o=AC.createOscillator(),gn=AC.createGain(),t=AC.currentTime;o.type=ty;o.frequency.setValueAtTime(f,t);if(sl)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+sl),t+d);gn.gain.setValueAtTime(v,t);gn.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(gn).connect(AC.destination);o.start(t);o.stop(t+d)}
function noise(d,v=.15){if(!AC)return;const b=AC.createBuffer(1,AC.sampleRate*d|0,AC.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/a.length,2);const s=AC.createBufferSource(),gn=AC.createGain();gn.gain.value=v;s.buffer=b;s.connect(gn).connect(AC.destination);s.start()}
const arp=(fs,dt=70,ty='square')=>fs.forEach((f,i)=>setTimeout(()=>tone(f,.1,ty),i*dt));
let sfxN=0;const SFX={shot:()=>{if(sfxN++%2)return;tone(900,.05,'square',.03,-600)},laser:()=>{if(sfxN++%2)return;tone(1500,.12,'sawtooth',.035,-1200)},jump:()=>tone(300,.1,'square',.05,400),boom:()=>{noise(.45,.25);tone(80,.4,'sawtooth',.08,-50)},small:()=>noise(.12,.1),hurt:()=>tone(160,.3,'sawtooth',.1,-100),flip:()=>arp([523,784,1047]),pow:()=>arp([659,880,1175,1568],50,'triangle'),grab:()=>tone(200,.08,'square',.06,100),throw:()=>tone(500,.15,'triangle',.06,-300),boss:()=>arp([110,104,98,92,87],150,'sawtooth'),win:()=>arp([523,659,784,1047,784,1047,1319,1568],90),start:()=>arp([392,523,659,784],80),car:()=>arp([262,392,523,784],60,'sawtooth')};
let mT=0,mI=0;const SONG=[[110,440],[110,0],[131,523],[110,587],[147,659],[147,0],[131,587],[98,523],[110,440],[110,0],[131,659],[110,784],[165,880],[147,784],[131,659],[123,587]];
function music(dt){if(!AC||state!=='play')return;if((mT-=dt)>0)return;mT=boss?.11:.13;const[b,l]=SONG[mI%16];tone(b*(boss?.94:1),.1,'triangle',.07);if(l&&mI%2==0)tone(l*(lvl===2?1.122:1),.08,'square',.022);if(mI%4==2)noise(.04,.05);mI++}
// ---------- input ----------
const K={},pr={};
const map={KeyA:'left',KeyD:'right',KeyW:'up',KeyS:'down',ArrowLeft:'aL',ArrowRight:'aR',ArrowUp:'aU',ArrowDown:'aD',KeyJ:'aL',KeyL:'aR',KeyI:'aU',KeyK:'aD',Space:'jump',KeyZ:'jump',KeyX:'shoot',KeyC:'grab',KeyE:'grab',ShiftLeft:'grab',ShiftRight:'grab',KeyV:'crt',Enter:'start',KeyP:'pause',Escape:'pause'};
addEventListener('keydown',e=>{const k=map[e.code];if(k){e.preventDefault();if(!K[k])pr[k]=1;K[k]=1;lastInput='kb'}au()});addEventListener('keyup',e=>{const k=map[e.code];if(k)K[k]=0});
const M={x:0,y:0,down:false,active:false,t:0};
function mpos(e){const r=cv.getBoundingClientRect();M.x=(e.clientX-r.left)/r.width*W;M.y=(e.clientY-r.top)/r.height*H}
cv.addEventListener('mousemove',e=>{mpos(e);M.active=true;M.t=performance.now();lastInput='mouse'});
cv.addEventListener('mousedown',e=>{mpos(e);au();M.active=true;M.t=performance.now();if(e.button===2){pr.grab=1}else M.down=true;pr.start=1;lastInput='mouse'});
addEventListener('mouseup',e=>{if(e.button!==2)M.down=false});cv.addEventListener('contextmenu',e=>e.preventDefault());
const isTouch='ontouchstart'in window||navigator.maxTouchPoints>0;
if(isTouch){const tb=document.getElementById('touch');tb.style.display='block';tb.querySelectorAll('button').forEach(b=>{const k=b.dataset.k;b.addEventListener('touchstart',e=>{e.preventDefault();au();pr[k]=1;K[k]=1;if(state!=='play')pr.start=1;lastInput='touch'},{passive:false});const up=e=>{e.preventDefault();K[k]=0};b.addEventListener('touchend',up,{passive:false});b.addEventListener('touchcancel',up,{passive:false})})}
const TPm=window.TP||{ax:0,ay:0,mag:0},TPa=window.TA||{ax:0,ay:0,mag:0,active:false};
TPm.onstart=()=>{au();pr.start=1;lastInput='touch'};if(window.TA)TA.onstart=()=>{au();pr.start=1;lastInput='touch'};
let lastInput='kb',GP={lx:0,ly:0,rx:0,ry:0,fire:false},gpPrev=[];
function pollPad(){const pads=navigator.getGamepads?navigator.getGamepads():[];let p=null;for(const q of pads)if(q&&q.connected){p=q;break}if(!p){GP={lx:0,ly:0,rx:0,ry:0,fire:false};return}
  const dz=v=>Math.abs(v)<.2?0:v;const b=i=>p.buttons[i]&&p.buttons[i].pressed;
  GP.lx=dz(p.axes[0]||0)+(b(15)?1:0)-(b(14)?1:0);GP.ly=dz(p.axes[1]||0)+(b(13)?1:0)-(b(12)?1:0);GP.rx=dz(p.axes[2]||0);GP.ry=dz(p.axes[3]||0);GP.fire=b(7)||b(5);
  const edge=(i,k)=>{if(b(i)&&!gpPrev[i]){pr[k]=1;au();lastInput='pad'}gpPrev[i]=b(i)};edge(0,'jump');edge(1,'grab');edge(2,'grab');edge(9,'start');edge(9,'pause');if(Math.hypot(GP.lx,GP.ly,GP.rx,GP.ry)>.3)lastInput='pad';if(state!=='play'&&b(0))pr.start=1}
function moveInput(){const x=Math.max(-1,Math.min(1,(K.right?1:0)-(K.left?1:0)+TPm.ax+GP.lx)),y=Math.max(-1,Math.min(1,(K.down?1:0)-(K.up?1:0)+TPm.ay+GP.ly));return{x,y}}
// returns aim angle (or null for "facing") and firing flag
function aimInput(){
  if(Math.hypot(GP.rx,GP.ry)>.35)return{a:Math.atan2(GP.ry,GP.rx),fire:true};
  if(TPa.active&&TPa.rawD>8)return{a:TPa.rawA,fire:true};
  const kx=(K.aR?1:0)-(K.aL?1:0),ky=(K.aD?1:0)-(K.aU?1:0);if(kx||ky)return{a:Math.atan2(ky,kx),fire:true};
  if(M.active&&lastInput==='mouse'){const px=P.x-camX,py=P.y-(P.ride?10:13);return{a:Math.atan2(M.y-py,M.x-px),fire:M.down||K.shoot||GP.fire}}
  return{a:null,fire:K.shoot||GP.fire}}
// ---------- state ----------
let state='title',lvl=1,P,E,B,FX,pops,camX,lockX,t=0,score=0,hi=+(localStorage.senorHi||0),shake=0,boss=null,spawnQ,banner=null,flash=0,stateT=0,aimA=0;
const LEN={1:2600,2:3000};
function genLevel(n){const q=[],L=LEN[n];let x=280;
  while(x<L-340){const r=Math.random();
    if(r<.32)q.push({x,k:'suit'});else if(r<.46)q.push({x,k:'bot'});else if(r<.6)q.push({x,k:'drone'});else if(r<.77)q.push({x,k:'sign'});else if(r<.9)q.push({x,k:'crate'});else{q.push({x,k:'suit'});q.push({x:x+24,k:'suit'})}
    if(n===2&&Math.random()<.25)q.push({x:x+30,k:'drone'});x+=(n===1?75:62)+Math.random()*60}
  q.push({x:n===1?900:700,k:'roadster'});if(n===2)q.push({x:2000,k:'roadster'});
  for(let i=0;i<6;i++)q.push({x:400+i*L/7,k:'plat',y:GY-30-Math.random()*25,w:44+Math.random()*30});
  return q.sort((a,b)=>a.x-b.x)}
function newPlayer(x){return{w:14,h:22,x,y:GY-40,vx:0,vy:0,face:1,on:false,hp:4,inv:90,cd:0,held:null,ride:0,stomp:false,speed:0,spread:0,rapid:0,jumps:0,sq:0,dead:0,recoil:0}}
function startLevel(n){lvl=n;camX=0;lockX=null;E=[];B=[];FX=[];pops=[];boss=null;spawnQ=genLevel(n);const lives=P?P.lives:3;const hp=P?Math.max(P.hp,3):4;P=newPlayer(40);P.lives=lives;P.hp=hp;banner={s:n===1?'LEVEL 1: AI DOWNTOWN':'LEVEL 2: THE TEST TRACK',l:150}}
function newGame(){score=0;P=null;startLevel(1);P.lives=3;state='play';SFX.start()}
function pop(x,y,s,c='#ffe14d'){pops.push({x,y,s,c,l:60})}
const DEB=['bolt','gear','plate','tie','shades','spring'];
function boom(x,y,r=1,n=10){if(LOW)n=n>>1;if(FX.length>(LOW?60:160))return;FX.push({k:'kaboom',x,y,r:2,mr:16*r,l:22,ml:22,seed:Math.random()*99});for(let i=0;i<n;i++){const a=Math.random()*6.3,s=(1+Math.random()*2.5)*r;FX.push({k:'deb',d:DEB[Math.random()*4|0],x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,rot:Math.random()*6,vr:(Math.random()-.5)*.5,l:60+Math.random()*30,sz:2+Math.random()*2*r,g:.22,bounce:1})}
  for(let i=0;i<3*r;i++)smoke(x+(Math.random()-.5)*14*r,y+(Math.random()-.5)*10*r,1,.6);for(let i=0;i<6;i++){const a=Math.random()*6.3;FX.push({k:'spark',x,y,vx:Math.cos(a)*5*r,vy:Math.sin(a)*5*r,l:10,g:0})}shake=Math.max(shake,4*r);if(r>1.4)flash=3}
function debris(x,y,set){for(let i=0;i<8;i++)FX.push({k:'deb',d:set[i%set.length],x,y,vx:(Math.random()-.5)*5,vy:-2-Math.random()*4,rot:Math.random()*6,vr:(Math.random()-.5)*.6,l:70,sz:2.5+Math.random()*2,g:.25,bounce:1})}
function smoke(x,y,big,up=.3){FX.push({k:'smoke',x,y,vx:(Math.random()-.5)*1.4,vy:-Math.random()*up,l:40+Math.random()*30,ml:70,sz:big?5+Math.random()*5:3+Math.random()*2,g:-.01,grow:big?.22:.12,seed:Math.random()*99})}
function spawn(s){const base={x:s.x,y:GY,vx:0,vy:0,f:-1,cd:1.5+Math.random()*2,seed:Math.random()*99};
  if(s.k==='suit')E.push({...base,k:'suit',w:12,h:24,hp:3,pts:150});
  else if(s.k==='bot')E.push({...base,k:'bot',w:16,h:20,hp:5,pts:250});
  else if(s.k==='drone')E.push({...base,k:'drone',w:16,h:10,y:50+Math.random()*40,hp:2,pts:200,ph:Math.random()*6});
  else if(s.k==='sign')E.push({...base,k:'sign',w:46,h:30,y:GY-30-(Math.random()*18|0),hp:4,si:0,flip:0,pts:500,static:1});
  else if(s.k==='crate')E.push({...base,k:'crate',w:14,h:14,hp:2,pts:50,static:1});
  else if(s.k==='roadster')E.push({...base,k:'car',w:40,h:14,y:GY,static:1,hp:1e9});
  else if(s.k==='plat')E.push({...base,k:'plat',y:s.y,w:s.w,h:6,static:1,hp:1e9})}
function mkBoss(){const big=lvl===2;boss={k:'boss',x:camX+W-60,y:GY-120,w:big?62:46,h:big?90:66,hp:big?80:40,max:big?80:40,ph:0,t:0,cd:2.2,vx:0,vy:0,f:-1,big,pts:0,name:big?'GIANT AI MECH':'AI CEO-BOT 9000',si:0,seed:7};E.push(boss);banner={s:'WARNING: '+boss.name,l:120,c:'#ff4040'};SFX.boss()}
function hurtP(){if(P.inv>0||P.dead||window.__god)return;if(P.ride){P.ride=Math.max(1,P.ride-180);P.inv=50;shake=6;SFX.hurt();return}P.hp--;P.inv=90;shake=6;SFX.hurt();P.sq=8;if(P.held){P.held.held=0;P.held=null}if(P.hp<=0){P.dead=100;debris(P.x,P.y-12,['hat','ball','ball']);boom(P.x,P.y-12,1.3);P.lives--}}
function damage(e,d){if(e.dead||e.k==='car'||e.k==='plat')return;e.sq=6;if(e.k==='sign'){if(e.si)return;e.hp-=d;e.hit=4;if(e.hp<=0){e.si=1;e.flip=1;score+=e.pts;pop(e.x,e.y-e.h-6,'AI → SI! +500','#5dff9a');SFX.flip();if(Math.random()<.45)drop(e.x,e.y-20)}return}
  e.hp-=d;e.hit=4;if(e.hp<=0){e.dead=1;score+=e.pts;
    if(e===boss){boss.si=1;const bx=e.x,by=e.y,bw=e.w,bh=e.h;for(let i=0;i<12;i++)setTimeout(()=>{boom(bx+(Math.random()-.5)*bw,by-Math.random()*bh,2,8);SFX.boom()},i*130);FX.push({k:'bossdead',x:bx,y:by,big:e.big,w:bw,h:bh,l:120,ml:120});score+=5000;pop(bx,by-bh-10,'BOSS → SI! +5000','#5dff9a');boss=null;setTimeout(()=>{if(state==='play'){if(lvl===1)startLevel(2);else{state='win';stateT=0;SFX.win();saveHi()}}},3400)}
    else{boom(e.x,e.y-e.h/2,e.k==='bot'?1.3:1);SFX.boom();if(e.k==='suit')debris(e.x,e.y-14,['tie','shades','plate','bolt']);if(e.k==='crate')debris(e.x,e.y-6,['plank','plank','plank']);if(e.k==='crate'||Math.random()<.2)drop(e.x,e.y-8);pop(e.x,e.y-e.h-4,'+'+e.pts)}}else SFX.small()}
const PW={taco:['TACO: SPEED!','#ffc93c'],elote:['ELOTE: SPREAD SHOT!','#fff27a'],churro:['CHURRO: +1 HEART','#e0a060'],horchata:['HORCHATA: RAPID FIRE!','#ffffff']};
function drop(x,y){const ks=Object.keys(PW);const k=P&&P.hp<=1&&Math.random()<.5?'churro':ks[Math.random()*4|0];E.push({k:'pow',p:k,x,y,vx:0,vy:-3,w:12,h:12,hp:1e9,l:660})}
function saveHi(){if(score>hi){hi=score;localStorage.senorHi=hi}}
function overlap(a,b){return Math.abs(a.x-b.x)<(a.w+b.w)/2&&Math.abs((a.y-a.h/2)-(b.y-b.h/2))<(a.h+b.h)/2}
function shoot(a){const sp=P.ride?7:5.5,ox=P.x+Math.cos(a)*12,oy=P.y-(P.ride?10:13)+Math.sin(a)*12;
  const mk=x=>B.push({x:ox,y:oy,vx:Math.cos(x)*sp,vy:Math.sin(x)*sp,me:1,l:70,d:P.ride?2:1,laser:!!P.ride,a:x});mk(a);if(P.spread>0){mk(a-.22);mk(a+.22)}
  P.cd=P.ride?6:(P.rapid>0?4:9);P.recoil=3;FX.push({k:'muzzle',x:ox,y:oy,a,l:4});P.ride?SFX.laser():SFX.shot()}
// ---------- update ----------
function update(dt){t++;pollPad();if(pr.crt)document.getElementById('crt').classList.toggle('on');
  if(state==='pause'){if(pr.pause||pr.start)state='play';clr();return}
  if(state!=='play'){stateT++;if((pr.start||pr.jump)&&(state==='title'||stateT>40)){newGame();stateT=0}clr();return}
  if(pr.pause){state='pause';clr();return}
  music(dt);if(banner&&--banner.l<=0)banner=null;if(flash)flash--;
  while(spawnQ.length&&spawnQ[0].x<camX+W+30)spawn(spawnQ.shift());
  if(!boss&&!lockX&&camX>=LEN[lvl]-W-1){lockX=LEN[lvl]-W;mkBoss()}
  if(P.dead){if(--P.dead<=0){if(P.lives<0){state='over';stateT=0;saveHi();SFX.boom()}else{const l=P.lives;P=newPlayer(camX+40);P.lives=l}}}
  else{const mv=moveInput(),ix=mv.x,acc=P.speed>0?1.35:1;const AI=aimInput();
    if(AI.a!==null){aimA=AI.a}else{aimA=P.face>0?0:Math.PI}
    if(P.ride){P.ride--;P.vx+=(ix*3.2*acc-P.vx)*.15;if(!P.stomp)P.vy+=(mv.y*2.6-P.vy)*.15;else P.vy=Math.min(9,P.vy+.8);
      if(pr.grab&&!P.stomp&&P.y<GY-10){P.stomp=true;P.vy=4;SFX.jump()}
      if(t%2==0){const d=GY-P.y;if(d<80)smoke(P.x+(Math.random()-.5)*40,GY-3,d<45,.5)}
      if(P.ride<=0){P.ride=0;P.stomp=false;P.vy=-4;pop(P.x,P.y-30,'ROADSTER PARKED','#9be8ff');boom(P.x,P.y,.8,4)}}
    else{P.vx+=(ix*1.7*acc-P.vx)*.25;P.vy+=.32;const jp=pr.jump||(pr.up&&!TPm.active);if(jp&&(P.on||P.jumps<1)){if(!P.on)P.jumps++;P.vy=-5.6;P.on=false;P.sq=-6;SFX.jump()}
      if(!K.jump&&!K.up&&P.vy<-2)P.vy+=.3}
    if(AI.a!==null)P.face=Math.cos(aimA)>=0?1:-1;else if(ix)P.face=Math.sign(ix);
    P.x+=P.vx;P.y+=P.vy;
    const minX=camX+8,maxX=(lockX!=null?lockX+W:LEN[lvl])-8;P.x=Math.max(minX,Math.min(maxX,P.x));
    if(P.ride&&P.y<24)P.y=24,P.vy=Math.max(0,P.vy);
    const wasOn=P.on;P.on=false;if(P.y>=GY){P.y=GY;if(!wasOn&&P.vy>2)P.sq=7;P.vy=0;P.on=true;P.jumps=0;if(P.stomp){P.stomp=false;boom(P.x,GY,1.8,8);SFX.boom();for(const e of E)if(Math.abs(e.x-P.x)<55&&e.y>GY-60)damage(e,e===boss?6:8);pop(P.x,GY-40,'STOMP!','#ff6bd6')}}
    if(!P.ride&&P.vy>=0)for(const e of E)if(e.k==='plat'&&P.x>e.x-e.w/2&&P.x<e.x+e.w/2&&P.y>=e.y&&P.y-P.vy<=e.y+2){if(!wasOn&&P.vy>2)P.sq=7;P.y=e.y;P.vy=0;P.on=true;P.jumps=0}
    ['inv','cd','speed','spread','rapid','recoil'].forEach(k=>{if(P[k]>0)P[k]--});if(P.sq>0)P.sq--;else if(P.sq<0)P.sq++;
    if(AI.fire&&P.cd<=0&&!P.held)shoot(aimA);
    if(P.held&&(pr.shoot||(M.down&&lastInput==='mouse'&&!P.justGrabbed)))throwHeld();
    if(pr.grab&&!P.ride){if(P.held)throwHeld();else{let best=null,bd=24;for(const e of E)if((e.k==='suit'||e.k==='bot'||e.k==='drone')&&!e.dead&&!e.thrown){const d=Math.abs(e.x-(P.x+P.face*6));if(d<bd&&Math.abs(e.y-P.y)<28){bd=d;best=e}}if(best){P.held=best;best.held=1;P.justGrabbed=1;SFX.grab();pop(P.x,P.y-38,'GOTCHA!','#fff')}}}
    if(!M.down)P.justGrabbed=0;
    if(P.held){const h=P.held;h.x=P.x;h.y=P.y-22;if(t%14==0){damage(h,1);score+=10;FX.push({k:'spark',x:h.x,y:h.y-h.h/2,vx:0,vy:-1,l:8,g:0})}if(h.dead)P.held=null}
    if(!P.ride)for(const e of E)if(e.k==='car'&&!e.dead&&overlap(P,e)){e.dead=1;P.ride=15*60;if(P.held){P.held.held=0;P.held=null}P.y-=10;SFX.car();banner={s:'ROADSTER! FLY · AIM · STOMP (GRAB)',l:120,c:'#9be8ff'}}}
  for(const e of E){if(e.hit)e.hit--;if(e.sq)e.sq--;if(e.flip>0)e.flip=Math.max(0,e.flip-.04);if(e.held)continue;
    const dx=P.x-e.x,ad=Math.abs(dx);if(!e.static)e.f=Math.sign(dx)||1;const diff=lvl===1?1:1.25;
    if(e.k==='suit'){if(ad>80)e.x+=e.f*.6;else if(ad<40)e.x-=e.f*.35;e.walk=(e.walk||0)+(ad>80||ad<40?.25:0);if((e.cd-=dt)<=0&&ad<200&&!P.dead){e.cd=(2.4+Math.random()*1.6)/diff;e.aimT=12;const a=Math.atan2((P.y-12)-(e.y-15),dx);setTimeout(()=>{if(!e.dead&&!e.held&&state==='play')B.push({x:e.x+e.f*9,y:e.y-15,vx:Math.cos(a)*2.3*diff,vy:Math.sin(a)*2.3*diff,me:0,l:140})},200)}if(e.aimT)e.aimT--}
    else if(e.k==='bot'){if(ad<170){e.x+=e.f*(.9+lvl*.25);e.walk=(e.walk||0)+.35}}
    else if(e.k==='drone'){e.ph+=.05;e.x+=Math.sin(e.ph)*.8+(ad>40?e.f*.5:0);e.y+=Math.cos(e.ph*1.3)*.4;if((e.cd-=dt)<=0&&ad<110){e.cd=(2.6+Math.random())/diff;B.push({x:e.x,y:e.y,vx:0,vy:1.6,me:0,l:90,bomb:1})}}
    else if(e.k==='pow'){e.vy+=.2;e.y+=e.vy;if(e.y>GY)e.y=GY,e.vy=0;if(--e.l<=0)e.dead=1;if(overlap(P,e)&&!P.dead){e.dead=1;SFX.pow();const[s,c]=PW[e.p];pop(e.x,e.y-20,s,c);score+=100;if(e.p==='taco')P.speed=600;if(e.p==='elote')P.spread=600;if(e.p==='churro')P.hp=Math.min(5,P.hp+1);if(e.p==='horchata')P.rapid=600}}
    else if(e===boss)bossAI(e,dt);
    if(e.thrown){e.vy+=.3;e.x+=e.vx;e.y+=e.vy;e.spin=(e.spin||0)+.35;let hit=e.y>=GY;for(const o of E)if(o!==e&&!o.static&&o.k!=='pow'&&!o.dead&&overlap(e,o)){hit=true;damage(o,o===boss?5:6)}if(hit){e.dead=1;boom(e.x,e.y-6,1.5,10);SFX.boom();score+=e.pts;for(const o of E)if(o!==e&&Math.abs(o.x-e.x)<40&&Math.abs(o.y-e.y)<40)damage(o,3);pop(e.x,e.y-20,'YEET! +'+e.pts,'#ff6bd6')}}
    else if(!e.static&&e.k!=='pow'&&e.k!=='drone'&&e!==boss)e.y=GY;
    if(!e.static&&e.k!=='pow'&&!e.thrown&&!P.dead&&overlap(P,e)){if(P.stomp)damage(e,4);else{hurtP();if(e===boss){P.vx=-4;P.x-=6;if(P.on)P.vy=-4}}}
    if(e.x<camX-60&&e!==boss)e.dead=1}
  for(const b of B){b.x+=b.vx;b.y+=b.vy;b.l--;if(b.bomb)b.vy+=.05;
    if(b.me){for(const e of E){if(e.dead||e.held||e.k==='pow'||e.k==='car'||e.k==='plat'||(e.k==='sign'&&e.si))continue;if(Math.abs(b.x-e.x)<e.w/2+2&&b.y>e.y-e.h&&b.y<e.y){damage(e,b.d);FX.push({k:'spark',x:b.x,y:b.y,vx:0,vy:0,l:6,g:0});if(!b.laser||e===boss)b.l=0;break}}if(b.y>GY){b.l=0;FX.push({k:'spark',x:b.x,y:GY,vx:0,vy:-1,l:6,g:0})}}
    else{if(!P.dead&&Math.abs(b.x-P.x)<7&&b.y>P.y-(P.ride?18:22)&&b.y<P.y+2){b.l=0;hurtP()}if(b.y>GY){b.l=0;if(b.bomb){boom(b.x,GY,.6,3);if(Math.abs(b.x-P.x)<14&&P.y>GY-12)hurtP()}}}}
  B=B.filter(b=>b.l>0&&b.x>camX-10&&b.x<camX+W+10&&b.y>-10);E=E.filter(e=>!e.dead);
  for(const f of FX){f.x+=f.vx||0;f.y+=f.vy||0;f.vy=(f.vy||0)+(f.g||0);f.l--;if(f.grow)f.sz+=f.grow;if(f.vr)f.rot+=f.vr;if(f.k==='kaboom')f.r+=(f.mr-f.r)*.35;if(f.bounce&&f.y>GY){f.y=GY;f.vy*=-.4;f.vx*=.7;f.vr*=.6}}FX=FX.filter(f=>f.l>0);if(FX.length>400)FX.splice(0,FX.length-400);
  pops.forEach(p=>{p.l--;p.y-=.4});pops=pops.filter(p=>p.l>0);if(shake>0)shake=Math.max(0,shake-1);
  const target=Math.max(camX,P.x-W*.4);camX=Math.min(lockX!=null?lockX:LEN[lvl]-W,camX+(target-camX)*.15);clr()}
function throwHeld(){const h=P.held;P.held=null;h.held=0;h.thrown=1;const a=aimA;h.vx=Math.cos(a)*5+P.vx;h.vy=Math.min(-1.5,Math.sin(a)*5-2);h.y=P.y-16;P.sq=5;SFX.throw()}
function bossAI(e,dt){e.t+=dt;const big=e.big,ax0=camX+W*.5,ax1=camX+W-e.w/2-6;
  if(e.y<GY||e.vy<0){e.vy+=.35;e.y+=e.vy;if(e.y>=GY){e.y=GY;e.vy=0;e.sq=10;boom(e.x,GY,1.4,4);SFX.boom();if(Math.abs(P.x-e.x)<e.w*.8&&P.y>GY-14)hurtP()}}
  e.x+=e.vx;e.vx*=.94;e.x=Math.max(ax0,Math.min(ax1,e.x));
  if((e.cd-=dt)<=0){const m=(e.ph++)%(big?4:3);const rage=e.hp<e.max/2;e.cd=(rage?1.5:2.2)+Math.random()*.6;
    if(m===0){for(let i=0;i<(big?4:3);i++)B.push({x:e.x-e.w/3,y:e.y-e.h*.8,vx:-1.2-Math.random()*2.6,vy:-3-Math.random()*2,me:0,l:200,bomb:1})}
    else if(m===1){for(let i=0;i<(rage?3:2);i++)setTimeout(()=>{if(state==='play'&&!e.dead)B.push({x:e.x-e.w/2,y:e.y-(i%2?12:e.h*.45),vx:-2.8,vy:0,me:0,l:160,big:1})},i*300)}
    else if(m===2){e.vy=-7;e.vx=(Math.max(ax0,Math.min(ax1,P.x))-e.x)*.035}
    else{const n=7;for(let i=0;i<n;i++){const a=Math.PI*(.6+i/n*.8);B.push({x:e.x,y:e.y-e.h*.6,vx:Math.cos(a)*2.2,vy:Math.sin(a)*2.2*-1+.6,me:0,l:160})}}}
  if(e.hp<e.max/3&&t%14==0)smoke(e.x+(Math.random()-.5)*e.w,e.y-e.h*Math.random(),0,.6)}
function clr(){for(const k in pr)delete pr[k]}
// ================= VECTOR CARTOON RENDERER =================
const INK='#16121c';const boil=()=>t>>3;
function rnd(i){const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x)}
function blob(x,y,rx,ry,seed=0,amt=.05,n=14,rot=0){const pts=[];const b=boil();for(let i=0;i<n;i++){const a=i/n*Math.PI*2,r=1+(rnd(seed*31+i*7+b*13)-.5)*2*amt;pts.push([Math.cos(a)*rx*r,Math.sin(a)*ry*r])}
  g.beginPath();const c=Math.cos(rot),s=Math.sin(rot),T=p=>[x+p[0]*c-p[1]*s,y+p[0]*s+p[1]*c];let m=T([(pts[0][0]+pts[n-1][0])/2,(pts[0][1]+pts[n-1][1])/2]);g.moveTo(m[0],m[1]);
  for(let i=0;i<n;i++){const p=T(pts[i]),q=pts[(i+1)%n],mm=T([(pts[i][0]+q[0])/2,(pts[i][1]+q[1])/2]);g.quadraticCurveTo(p[0],p[1],mm[0],mm[1])}g.closePath()}
function rr(x,y,w,h,r){r=Math.min(r,w/2,h/2);g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
function ink(lw=1.3,seed=0){g.lineWidth=lw*(.85+.3*rnd(seed+boil()));g.strokeStyle=INK;g.lineJoin='round';g.lineCap='round';g.stroke()}
function fillInk(fill,lw=1.3,seed=0){g.fillStyle=fill;g.fill();ink(lw,seed)}
// cel-shaded blob: base + shade crescent (bottom-right) + highlight + uneven outline
function celBlob(x,y,rx,ry,base,shade,seed=0,hl=true,lw=1.4,rot=0){blob(x,y,rx,ry,seed,.05,14,rot);g.fillStyle=base;g.fill();g.save();g.clip();g.fillStyle=shade;g.beginPath();g.ellipse(x+rx*.6,y+ry*.65,rx*1.0,ry*.95,0,0,7);g.fill();if(hl){g.fillStyle='rgba(255,255,255,.75)';g.beginPath();g.ellipse(x-rx*.42,y-ry*.45,rx*.22,ry*.14,-.6,0,7);g.fill()}g.restore();blob(x,y,rx,ry,seed,.05,14,rot);ink(lw,seed)}
function celBox(x,y,w,h,r,base,shade,lw=1.3,seed=0){rr(x,y,w,h,r);g.fillStyle=base;g.fill();g.save();g.clip();g.fillStyle=shade;g.fillRect(x+w*.62,y,w,h);g.fillRect(x,y+h*.72,w,h);g.restore();rr(x,y,w,h,r);ink(lw,seed)}
function line(pts,lw=1.3,col=INK){g.beginPath();g.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)g.lineTo(pts[i],pts[i+1]);g.strokeStyle=col;g.lineWidth=lw;g.lineCap='round';g.lineJoin='round';g.stroke()}
function T(s,x,y,c,sz=8,al='center'){g.font=`900 ${sz}px "Arial Black","Impact",system-ui,sans-serif`;g.textAlign=al;g.textBaseline='middle';g.lineJoin='round';g.lineWidth=sz*.28;g.strokeStyle=INK;g.strokeText(s,x,y);g.fillStyle=c;g.fillText(s,x,y);g.textAlign='left'}
function shadow(x,y,w){g.fillStyle='rgba(0,0,0,.28)';g.beginPath();g.ellipse(x,y+1,w,w*.22,0,0,7);g.fill()}
// ---------- backgrounds ----------
const BL=[...Array(70)].map((_,i)=>({x:i*44+rnd(i)*14,w:34+rnd(i+9)*16,h:50+rnd(i+3)*70,c:['#3b2a63','#2c3d6b','#552a5c','#2a4b5c'][i%4],s:i,roof:rnd(i+5)}));
const FAR=[...Array(40)].map((_,i)=>({x:i*30,h:30+rnd(i+40)*40,w:24+rnd(i+41)*14}));
function bg(){if(lvl===1){let gr=g.createLinearGradient(0,0,0,GY);gr.addColorStop(0,'#1c0f3d');gr.addColorStop(.6,'#7a2f7a');gr.addColorStop(1,'#ff8a5c');g.fillStyle=gr;g.fillRect(-2,-2,W+4,GY+2);
    celBlob(258,30,14,14,'#fff6c8','#f0d890',3,false,1.2);g.fillStyle='rgba(255,246,200,.12)';g.beginPath();g.arc(258,30,26,0,7);g.fill();
    for(const f of FAR){const x=((f.x-camX*.15)%1200+1200)%1200-40;if(x>W+30)continue;rr(x,GY-f.h-20,f.w,f.h+20,2);g.fillStyle='#4a2a6a';g.fill()}
    for(const b of BL){const x=b.x-camX*.4;if(x<-60||x>W+10)continue;const top=GY-b.h;celBox(x,top,b.w,b.h+4,2,b.c,'rgba(0,0,0,.25)',1.2,b.s);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(x+b.w*.62,top,b.w*.38,b.h);
      if(b.roof>.6){line([x+b.w*.3,top,x+b.w*.3,top-8],1);g.fillStyle='#f33';g.beginPath();g.arc(x+b.w*.3,top-8,1.4,0,7);g.fill()}else if(b.roof<.25){rr(x+4,top-6,10,6,1);fillInk('#665',1)}
      for(let wy=top+6;wy<GY-8;wy+=9)for(let wx=x+4;wx<x+b.w-6;wx+=8){const on=rnd(b.s*100+wx*3+wy)>.4;rr(wx,wy,4.5,5.5,1);g.fillStyle=on?(rnd(wx+wy)>.3?'#ffd56b':'#7ff0ff'):'#1a1430';g.fill()}}
    // street
    g.fillStyle='#4b4552';g.fillRect(-2,GY,W+4,H-GY+2);g.fillStyle='#8a8494';g.fillRect(-2,GY-1,W+4,5);line([-2,GY-1,W+2,GY-1],1.3);line([-2,GY+4,W+2,GY+4],1);
    for(let x=-(camX%40);x<W;x+=40){rr(x,GY+15,18,2.4,1.2);fillInk('#f2d24b',.8)}for(let x=-(camX*1%60);x<W;x+=60)line([x+5,GY+8,x+12,GY+11,x+9,GY+14],.6,'#2f2a36')}
  else{let gr=g.createLinearGradient(0,0,0,GY);gr.addColorStop(0,'#05040e');gr.addColorStop(1,'#1d1530');g.fillStyle=gr;g.fillRect(-2,-2,W+4,GY+2);
    for(let i=0;i<40;i++){const x=((i*53-camX*.05)%W+W)%W,y=(i*37)%100;g.fillStyle=i%5?'#99a':'#fff';g.fillRect(x,y,.8,.8)}
    // distant grandstands
    for(let i=0;i<20;i++){const x=((i*90-camX*.2)%1800+1800)%1800-60;if(x>W+20)continue;rr(x,GY-34,70,30,2);fillInk('#241d36',1);for(let j=0;j<6;j++){g.fillStyle='rgba(255,60,60,.6)';g.fillRect(x+4+j*11,GY-30,5,1.4)}}
    // curved ramp wall (like the reference)
    for(let k=0;k<3;k++){const bx=((k*700+460-camX*.6)%2100+2100)%2100-220;if(bx>W+60)continue;g.beginPath();g.moveTo(bx,GY);g.bezierCurveTo(bx+30,GY,bx+52,GY-60,bx+56,GY-138);g.lineTo(bx+70,GY-138);g.bezierCurveTo(bx+66,GY-58,bx+48,GY-8,bx+26,GY);g.closePath();
      g.fillStyle='#d8dbe6';g.fill();g.save();g.clip();g.fillStyle='#a4a8b8';g.fillRect(bx+48,0,40,GY);for(let s=0;s<14;s++){g.fillStyle='rgba(0,0,0,.08)';g.fillRect(bx,GY-s*10,90,1)}g.restore();ink(1.5,k);g.fillStyle=t>>4&1?'#ff3030':'#801010';g.beginPath();g.arc(bx+63,GY-140,2,0,7);g.fill()}
    // track
    g.fillStyle='#2a2630';g.fillRect(-2,GY,W+4,H-GY+2);g.fillStyle='#120f16';g.fillRect(-2,GY-7,W+4,7);line([-2,GY-7,W+2,GY-7],1);
    for(let x=-(camX%24);x<W;x+=24){const on=((x+camX)/24|0)%2==(t>>4&1);g.fillStyle=on?'#ff2a2a':'#5a0c0c';rr(x,GY-5,6,2.4,1.2);g.fill();if(on){g.fillStyle='rgba(255,40,40,.25)';g.beginPath();g.ellipse(x+3,GY-4,9,3,0,0,7);g.fill()}}
    g.fillStyle='#ff2a2a';g.fillRect(-2,GY,W+4,1.6);for(let x=-(camX%40);x<W;x+=40){rr(x,GY+16,20,1.6,.8);g.fillStyle='#6a6470';g.fill()}}}
// ---------- characters ----------
function drawHero(x,y,face,aim,sq,riding){// sombrero ball, Alien-Hominid style squash
  const s=sq||0;const sx=1+s*.035,sy=1-s*.035;g.save();g.translate(x,y);g.scale(sx,sy);
  if(!riding){const run=P.on&&Math.abs(P.vx)>.3?Math.sin(t*.45)*3:0,air=!P.on;
    for(const[fx,ph]of[[-4,run],[4,-run]]){g.beginPath();g.ellipse(fx+ph*.6,air?-1:-1.2,3.4,2,0,0,7);fillInk('#e9e6ef',1.1)}}
  const by=-12;celBlob(0,by,10.5,10,'#fbfbff','#c9c6d6',11,true,1.6);
  // eyes (look toward aim)
  const ex=Math.cos(aim)*1.6,ey=Math.sin(aim)*1.2;for(const o of[-3.2,3.6]){g.beginPath();g.ellipse(o+ex+face*.8,by-1.5+ey,1.6,3.2,face*.08,0,7);g.fillStyle=INK;g.fill()}
  // arm + blaster rotated to aim
  g.save();g.translate(face*3,by+3);g.rotate(aim);const rc=-(P.recoil||0)*.6;rr(4+rc,-2.2,11,4.4,1.5);fillInk('#5d6470',1.1);rr(12+rc,-1.4,3.5,2.8,1);fillInk('#ff4a4a',.9);g.beginPath();g.ellipse(4+rc,0,3,3,0,0,7);fillInk('#fbfbff',1.1);g.restore();
  // sombrero
  g.save();g.translate(0,by-9.5);g.rotate(-face*.05+(P.on?0:-P.vy*.012));
  g.beginPath();g.ellipse(0,0,17,4.2,0,0,7);g.fillStyle='#f2b927';g.fill();g.save();g.clip();g.fillStyle='#1b9a45';g.fillRect(-18,-5,36,2.4);g.fillStyle='#d42a2a';g.fillRect(-18,1.6,36,1.4);
  g.fillStyle='#d42a2a';for(let i=-15;i<15;i+=4.5){g.beginPath();g.moveTo(i,1);g.lineTo(i+2.2,-1.6);g.lineTo(i+4.4,1);g.fill()}g.restore();g.beginPath();g.ellipse(0,0,17,4.2,0,0,7);ink(1.4,3);
  g.beginPath();g.moveTo(-7,-1);g.bezierCurveTo(-7,-8,-4,-13,0,-13.5);g.bezierCurveTo(4,-13,7,-8,7,-1);g.closePath();g.fillStyle='#d42a2a';g.fill();g.save();g.clip();g.fillStyle='#1b9a45';g.fillRect(-8,-15,16,6);g.fillStyle='#fff';g.fillRect(-8,-9,16,1.6);g.fillStyle='rgba(0,0,0,.18)';g.fillRect(2,-15,8,15);g.restore();
  g.beginPath();g.moveTo(-7,-1);g.bezierCurveTo(-7,-8,-4,-13,0,-13.5);g.bezierCurveTo(4,-13,7,-8,7,-1);ink(1.4,4);g.restore();g.restore()}
function drawCar(x,y,flying,tilt=0){// white Roadster with 4 downward blue-white thrusters
  g.save();g.translate(x,y);g.rotate(tilt);
  if(flying){for(const o of[-17,-7,7,17]){const L=10+(t%3)*2.5+Math.random()*2;let gr=g.createLinearGradient(0,1,0,L+2);gr.addColorStop(0,'#ffffff');gr.addColorStop(.35,'#a8f0ff');gr.addColorStop(1,'rgba(80,170,255,0)');g.fillStyle=gr;g.beginPath();g.moveTo(o-2.6,1);g.quadraticCurveTo(o,L*1.2,o+2.6,1);g.fill();g.fillStyle='#fff';g.beginPath();g.moveTo(o-1,1);g.quadraticCurveTo(o,L*.7,o+1,1);g.fill();rr(o-3,-1.5,6,3,1);fillInk('#6c7486',1)}}
  // body
  g.beginPath();g.moveTo(-25,-2);g.quadraticCurveTo(-26,-8,-20,-9);g.lineTo(-10,-10);g.quadraticCurveTo(-4,-17,6,-16);g.quadraticCurveTo(14,-15,18,-10);g.quadraticCurveTo(25,-9,26,-5);g.quadraticCurveTo(26,0,22,0);g.lineTo(-22,0);g.closePath();
  g.fillStyle='#f4f6fb';g.fill();g.save();g.clip();g.fillStyle='#c4c9d8';g.fillRect(-30,-4,60,6);g.fillStyle='rgba(255,255,255,.9)';g.fillRect(-18,-8.6,30,1);g.restore();
  g.beginPath();g.moveTo(-25,-2);g.quadraticCurveTo(-26,-8,-20,-9);g.lineTo(-10,-10);g.quadraticCurveTo(-4,-17,6,-16);g.quadraticCurveTo(14,-15,18,-10);g.quadraticCurveTo(25,-9,26,-5);g.quadraticCurveTo(26,0,22,0);g.lineTo(-22,0);g.closePath();ink(1.5,8);
  g.beginPath();g.moveTo(-7,-10);g.quadraticCurveTo(-2,-15,5,-14.5);g.quadraticCurveTo(11,-14,14,-10);g.closePath();fillInk('#1f2733',1);g.fillStyle='rgba(160,220,255,.5)';g.fillRect(-2,-13.5,4,2);
  line([2,-14.5,2,-10],1);rr(22,-7,4,2,1);fillInk('#fffbe0',.7);rr(-26,-6,3,2,1);fillInk('#ff3a3a',.7);
  for(const wx of[-15,15]){g.beginPath();g.ellipse(wx,0,4.2,3.4,0,0,7);fillInk('#26232b',1.2);g.beginPath();g.ellipse(wx,0,1.8,1.5,0,0,7);g.fillStyle='#aab';g.fill()}
  g.restore()}
function drawSuit(e,x,y,h){// AI agent (FBI-style): black suit, shades, earpiece, robo head
  const wk=Math.sin((e.walk||0))*2.5,sq=(e.sq||0)*.04;g.save();g.translate(x,y);g.scale(e.f*(1+sq),1-sq);if(e.thrown)g.rotate(e.spin);
  for(const o of[-1,1]){rr(o*2.6-1.8+wk*o*.4,-9,3.6,9,1);fillInk('#1d1d26',1.1);rr(o*2.6-2.6+wk*o*.4,-1.8,5,2.4,1);fillInk('#0a0a0e',1)}
  rr(-6,-21,12,13,3);g.fillStyle=h?'#fff':'#23232e';g.fill();g.save();g.clip();g.fillStyle='#f3f3f7';g.beginPath();g.moveTo(-2,-21);g.lineTo(0,-14);g.lineTo(2,-21);g.fill();g.fillStyle='#d42a2a';g.beginPath();g.moveTo(-.9,-20);g.lineTo(.9,-20);g.lineTo(.6,-13);g.lineTo(0,-12);g.lineTo(-.6,-13);g.fill();g.fillStyle='rgba(255,255,255,.12)';g.fillRect(-6,-21,3,13);g.restore();rr(-6,-21,12,13,3);ink(1.3,e.seed);
  rr(-3,-15,4,2.4,.6);g.fillStyle='#ffd23c';g.fill();g.save();g.translate(-1,0);g.scale(e.f,1);g.font='900 2.2px sans-serif';g.fillStyle=INK;g.textAlign='center';g.fillText('AI',0,-13.6);g.textAlign='left';g.restore();
  // arm with pistol
  g.save();g.translate(3,-18);g.rotate(e.aimT?-.15:.5);rr(-1.5,-1.6,9,3.4,1.4);fillInk(h?'#fff':'#23232e',1.1);rr(7,-2,4,2.6,.8);fillInk('#555b66',1);g.restore();
  celBox(-5,-31,10,10,3.5,h?'#fff':'#a9afbd','#7d8394',1.3,e.seed+1);rr(-5,-27.5,10,3,1.4);fillInk('#0b0b10',1);g.fillStyle='rgba(120,200,255,.6)';g.fillRect(-3.5,-27,2,.8);line([-5.5,-26,-6.8,-23,-5.8,-21],.6);
  g.restore()}
function drawBot(e,x,y,h){const wk=Math.sin(e.walk||0)*2.5,sq=(e.sq||0)*.05;g.save();g.translate(x,y);g.scale(e.f*(1+sq),1-sq);if(e.thrown)g.rotate(e.spin);
  for(const o of[-1,1]){rr(o*4-2,-8+(o>0?wk:-wk)*.3,4,8,1.4);fillInk('#5a5d6e',1.1);rr(o*4-3,-1.8,6,2.6,1);fillInk('#33343e',1)}
  celBlob(0,-13,9,7,h?'#fff':'#8c90a8','#636781',e.seed,true,1.4);
  rr(-4,-15,8,5,1.5);fillInk('#1a0a10',1);g.save();g.scale(e.f,1);T('AI',0,-12.4,'#ff4040',4);g.restore();
  celBox(-6,-27,12,9,3,h?'#fff':'#9da2bb','#73778f',1.3,e.seed+2);rr(-4.5,-25,9,4,1.4);fillInk('#200',1);g.fillStyle='#ff3b3b';g.beginPath();g.arc(-1.8,-23,1,0,7);g.arc(2,-23,1,0,7);g.fill();
  line([0,-27,0,-31],1);g.beginPath();g.arc(0,-32,1.4,0,7);g.fillStyle=t>>3&1?'#ff3b3b':'#802020';g.fill();ink(.8);g.restore()}
function drawDrone(e,x,y,h){g.save();g.translate(x,y-5);if(e.thrown)g.rotate(e.spin);const p=t%4<2;
  line([-9,-3,9,-3],1.2);for(const o of[-9,9]){g.beginPath();g.ellipse(o,-4,p?6:2,1,0,0,7);g.fillStyle='rgba(220,220,230,.8)';g.fill();ink(.6)}
  celBlob(0,0,6.5,4.6,h?'#fff':'#7b7f90','#575a6a',e.seed,true,1.3);rr(-3.5,-1,7,2.6,1);fillInk('#200',.8);g.fillStyle=t>>2&1?'#ff3030':'#702020';g.beginPath();g.arc(0,.3,1,0,7);g.fill();T('AI',0,-6.5,'#ff4040',3);g.restore()}
function drawSign(e,x,y,h){const sc=e.flip>0?Math.abs(Math.cos(e.flip*Math.PI)):1;const show=e.flip>.5?!e.si:e.si;const col=show?'#4dff94':'#ff3b3b';
  rr(x-2,y,4,GY-y,1);fillInk('#6e6878',1.1);celBox(x-23,y-31,46,31,3,'#1d1a26','#14121b',1.6,e.seed);rr(x-21,y-29,42,27,2);g.fillStyle=show?'#0a2a1a':'#2a0a0e';g.fill();
  for(let i=0;i<8;i++){g.fillStyle=col;g.beginPath();g.arc(x-20+i*5.7,y-30.5,.8,0,7);g.arc(x-20+i*5.7,y-.8,.8,0,7);g.fill()}
  if(h){rr(x-21,y-29,42,27,2);g.fillStyle='rgba(255,255,255,.35)';g.fill()}
  g.save();g.translate(x,y-15.5);g.scale(1,sc);T(show?'SI':'AI',0,0,col,19);g.restore();if(e.si&&!e.flip&&t%40<20)T('✓',x+18,y-26,'#4dff94',6)}
function drawPow(e,x,y){const yy=y-5+Math.sin(t*.15)*2;if(e.l<120&&t>>2&1)return;shadow(x,y,5);g.save();g.translate(x,yy);g.rotate(Math.sin(t*.1)*.15);
  if(e.p==='taco'){g.beginPath();g.moveTo(-7,1);g.quadraticCurveTo(0,-11,7,1);g.closePath();fillInk('#ffcc45',1.2);g.beginPath();g.moveTo(-5.5,-1);g.quadraticCurveTo(-3,-5,0,-6);g.quadraticCurveTo(3,-5,5.5,-1);g.strokeStyle='#4dc24d';g.lineWidth=2;g.stroke();g.fillStyle='#e8322a';g.beginPath();g.arc(-2,-4,1.1,0,7);g.arc(2.2,-4.2,1.1,0,7);g.fill()}
  else if(e.p==='elote'){celBlob(0,-4,3,7,'#ffe45a','#e0b830',5,true,1.2);for(let i=0;i<4;i++)line([-2,-9+i*3,2,-9+i*3],.4,'#b8901a');g.beginPath();g.moveTo(-3,2);g.lineTo(-6,6);g.lineTo(0,3);g.lineTo(6,6);g.lineTo(3,2);fillInk('#6fc23d',1)}
  else if(e.p==='churro'){g.rotate(.5);rr(-2,-9,4,18,2);fillInk('#d79250',1.2);for(let i=-7;i<8;i+=3)line([-2,i,2,i+1],.5,'#9a5a28');g.fillStyle='#fff6';g.fillRect(-1.6,-8,1,15)}
  else{rr(-3.5,-9,7,10,1.5);fillInk('#fff6e6',1.2);rr(-3.5,-5,7,2,0);g.fillStyle='#e9dcc4';g.fill();line([1,-9,3,-14],1,'#ff6aa8')}
  g.restore()}
function drawBoss(e,x,y,h){const big=e.big,w=e.w,H2=e.h,sq=(e.sq||0)*.02,base=h?'#fff':big?'#7a7f98':'#3a3a4c',shade=big?'#545870':'#26263a';g.save();g.translate(x,y);g.scale(1+sq,1-sq);const s=Math.sin(t*.1)*2;
  if(big){for(const o of[-1,1]){celBox(o*16-8,-26,16,26,4,'#5a5e74','#40435a',1.6,o);rr(o*16-11,-5,22,6,2);fillInk('#33364a',1.4)}
    celBox(-w/2,-H2,w,H2-22,10,base,shade,2,9);for(const o of[-1,1]){g.save();g.translate(o*(w/2+5),-H2+18+(o<0?s:-s));celBox(-7,0,14,36,6,base,shade,1.7,o+3);celBlob(0,40,8,7,'#ff8a2a','#d0601a',o+5,true,1.4);g.restore()}
    celBox(-14,-H2-20,28,22,7,base,shade,1.8,4);rr(-11,-H2-14,22,8,3);fillInk('#200',1.2);g.fillStyle='#ff3b3b';g.fillRect(-8,-H2-12,6,4);g.fillRect(2,-H2-12,6,4);line([-6,-H2-20,-9,-H2-28],1.4);line([6,-H2-20,9,-H2-28],1.4)}
  else{for(const o of[-1,1]){rr(o*10-5,-18,10,18,3);fillInk('#1d1d28',1.4)}celBox(-w/2,-H2,w,H2-16,8,base,shade,1.9,9);g.fillStyle='#f3f3f7';g.beginPath();g.moveTo(-6,-H2);g.lineTo(0,-H2+16);g.lineTo(6,-H2);g.fill();rr(-2.5,-H2+1,5,26,2);fillInk('#d42a2a',1.1);
    for(const o of[-1,1]){g.save();g.translate(o*(w/2+3),-H2+10+(o<0?s:-s));rr(-4,0,8,26,3);fillInk(base,1.5);g.restore()}
    celBox(-11,-H2-19,22,19,6,'#b3b9c8','#878d9e',1.7,5);rr(-10,-H2-13,20,5,2);fillInk('#0b0b10',1.2);rr(-13,-H2-23,26,5,2);fillInk('#16161e',1.3);rr(-7,-H2-27,14,5,2);fillInk('#16161e',1.3)}
  rr(-15,-H2*.66,30,20,4);fillInk('#101018',1.6);T(e.si?'SI':'AI',0,-H2*.66+10.5,e.si?'#4dff94':(t>>3&1?'#ff3b3b':'#ff9a2a'),15);g.restore()}
function drawEnemy(e){const x=e.x-camX,y=e.y,h=e.hit&&e.hit%2;
  if(e.k==='suit'){if(!e.held&&!e.thrown)shadow(x,GY,7);drawSuit(e,x,y,h)}else if(e.k==='bot'){if(!e.held&&!e.thrown)shadow(x,GY,9);drawBot(e,x,y,h)}else if(e.k==='drone'){shadow(x,GY,6);drawDrone(e,x,y,h)}
  else if(e.k==='sign')drawSign(e,x,y,h);
  else if(e.k==='crate'){shadow(x,y,8);celBox(x-7,y-14,14,14,1.5,h?'#fff':'#c9843e','#9a5f28',1.4,e.seed);line([x-6,y-13,x+6,y-1],1,'#7a4a1a');line([x+6,y-13,x-6,y-1],1,'#7a4a1a');T('?',x,y-7,'#ffe14d',8)}
  else if(e.k==='car'){shadow(x,GY,24);drawCar(x,y-4,false);if(t>>4&1)T('RIDE ME!',x,y-28,'#9be8ff',7)}
  else if(e.k==='plat'){rr(x-e.w/2,y,e.w,6,2);g.fillStyle=lvl===1?'#6a6080':'#c8ccd8';g.fill();g.save();g.clip();g.fillStyle='rgba(0,0,0,.25)';g.fillRect(x-e.w/2,y+3.5,e.w,3);g.restore();rr(x-e.w/2,y,e.w,6,2);ink(1.3,e.seed);line([x-e.w/2+4,y+6,x-e.w/2+4,y+14],1.2);line([x+e.w/2-4,y+6,x+e.w/2-4,y+14],1.2)}
  else if(e.k==='pow')drawPow(e,x,y);
  else if(e===boss){shadow(x,GY,e.w*.6);drawBoss(e,x,y,h)}}
function drawPlayer(){if(P.dead)return;if(P.inv>0&&t>>2&1)return;const x=P.x-camX,y=P.y;
  if(P.ride){shadow(x,GY,22*Math.max(.4,1-(GY-y)/120));const tilt=P.vx*.04;drawHero(x+tilt*-4,y-8,P.face,aimA,0,true);drawCar(x,y,true,tilt)}
  else{shadow(x,P.on?y:GY,10);drawHero(x,y,P.face,aimA,P.sq,false)}}
function drawDeb(f){const x=f.x-camX;g.save();g.translate(x,f.y);g.rotate(f.rot);const s=f.sz;
  if(f.d==='bolt'){rr(-s*.4,-s,s*.8,s*2,s*.3);fillInk('#9aa0ae',.8)}else if(f.d==='gear'){blob(0,0,s,s,f.rot*10|0,.18,10);fillInk('#c0c4cf',.8);g.beginPath();g.arc(0,0,s*.35,0,7);g.fillStyle=INK;g.fill()}
  else if(f.d==='plate'){rr(-s,-s*.6,s*2,s*1.2,s*.3);fillInk('#7d8394',.8)}else if(f.d==='tie'){g.beginPath();g.moveTo(-s*.4,-s);g.lineTo(s*.4,-s);g.lineTo(s*.3,s);g.lineTo(0,s*1.3);g.lineTo(-s*.3,s);g.closePath();fillInk('#d42a2a',.8)}
  else if(f.d==='shades'){rr(-s,-s*.3,s*.9,s*.6,s*.2);fillInk('#111',.6);rr(s*.1,-s*.3,s*.9,s*.6,s*.2);fillInk('#111',.6)}else if(f.d==='plank'){rr(-s*1.4,-s*.4,s*2.8,s*.8,.3);fillInk('#c9843e',.8)}
  else if(f.d==='hat'){g.beginPath();g.ellipse(0,0,s*2.4,s*.7,0,0,7);fillInk('#f2b927',.9);g.beginPath();g.ellipse(0,-s*.6,s*.9,s*.9,0,Math.PI,0);fillInk('#d42a2a',.9)}else if(f.d==='ball'){g.beginPath();g.arc(0,0,s,0,7);fillInk('#fbfbff',.9)}
  else{line([-s,0,-s*.5,-s*.5,0,0,s*.5,-s*.5,s,0],1,'#c0c4cf')}g.restore()}
function drawFX(){for(const f of FX){const x=f.x-camX;
  if(f.k==='smoke'){const a=Math.min(1,f.l/30);g.globalAlpha=a;celBlob(x,f.y,f.sz,f.sz*.85,'#eceaf2','#c2bfcc',f.seed,false,.9);g.globalAlpha=1}
  else if(f.k==='kaboom'){const p=1-f.l/f.ml,r=f.r;if(p<.75){g.globalAlpha=1;blob(x,f.y,r*1.15,r,f.seed,.22,12);fillInk('#ff7a1a',1.6,f.seed);blob(x,f.y-r*.08,r*.8,r*.7,f.seed+1,.2,10);g.fillStyle='#ffd23a';g.fill();blob(x,f.y-r*.15,r*.45,r*.4,f.seed+2,.2,9);g.fillStyle='#fffbe0';g.fill()}
    else{g.globalAlpha=(1-p)*4;blob(x,f.y-p*6,r*1.1,r*.9,f.seed,.2,12);fillInk('#6b6474',1.2);g.globalAlpha=1}}
  else if(f.k==='deb')drawDeb(f);
  else if(f.k==='spark'){line([x,f.y,x-(f.vx||0)*1.5,f.y-(f.vy||0)*1.5-1],1.6,'#fff3a0')}
  else if(f.k==='muzzle'){g.save();g.translate(x,f.y);g.rotate(f.a);blob(2,0,4,2.6,t,.3,8);fillInk('#fff36a',.9);g.restore()}
  else if(f.k==='bossdead'){const tt=1-f.l/f.ml;g.globalAlpha=Math.max(0,1-tt*1.2);debrisHull(f,x,tt);g.globalAlpha=1}}}
function debrisHull(f,x,tt){g.save();g.translate(x,f.y+tt*20);g.rotate(tt*.4);rr(-f.w/2,-f.h*.8,f.w,f.h*.6,8);fillInk('#3d3d50',1.6);rr(-15,-f.h*.66,30,20,4);fillInk('#101018',1.4);T('SI',0,-f.h*.66+10.5,'#4dff94',15);g.restore()}
function drawBullets(){for(const b of B){const x=b.x-camX;
  if(b.me){if(b.laser){g.save();g.translate(x,b.y);g.rotate(b.a);rr(-8,-1.8,16,3.6,1.8);fillInk('#9be8ff',.9);rr(-6,-.6,12,1.2,.6);g.fillStyle='#fff';g.fill();g.restore()}else{g.save();g.translate(x,b.y);g.rotate(b.a);blob(0,0,3.6,2.2,7,.1,8);fillInk('#ffe14d',.9);g.fillStyle='#fff';g.beginPath();g.ellipse(.6,-.3,1.2,.8,0,0,7);g.fill();g.restore()}}
  else if(b.bomb){g.beginPath();g.arc(x,b.y,2.8,0,7);fillInk('#2d2b33',1);line([x,b.y-2.8,x+1.4,b.y-4.6],.8,'#a08060');g.fillStyle=t&2?'#ff9a2a':'#fff36a';g.beginPath();g.arc(x+1.6,b.y-5,1,0,7);g.fill()}
  else if(b.big){blob(x,b.y,6,3.6,3,.2,10);fillInk('#ff5a1a',1.1);blob(x,b.y,3.4,2,4,.2,8);g.fillStyle='#fff36a';g.fill()}
  else{g.beginPath();g.ellipse(x,b.y,3,1.8,Math.atan2(b.vy,b.vx),0,7);fillInk(t&2?'#ff4040':'#ff9a2a',.8)}}}
function heart(x,y,s,c){g.beginPath();g.moveTo(x,y+s*.9);g.bezierCurveTo(x-s*1.3,y,x-s*.8,y-s*.9,x,y-s*.3);g.bezierCurveTo(x+s*.8,y-s*.9,x+s*1.3,y,x,y+s*.9);fillInk(c,1)}
function hud(){T('SCORE '+score,6,10,'#ffe14d',8,'left');T('HI '+hi,W-6,10,'#7ff0ff',7,'right');
  for(let i=0;i<Math.min(6,Math.max(P.hp,0));i++)heart(10+i*10,21,3.4,'#ff4a5a');T('×'+Math.max(0,P.lives),70,21,'#fff',7,'left');T('LV'+lvl,90,21,'#9be8ff',7,'left');
  let px=114;for(const[k,c,l]of[['speed','#ffc93c','TACO'],['spread','#fff27a','ELOTE'],['rapid','#fff','HORCHATA']])if(P[k]>0){T(l,px,21,c,5.5,'left');px+=l.length*4.5+6}
  if(P.ride){rr(W/2-40,27,80,5,2.5);fillInk('#0a1a2a',1);rr(W/2-40,27,80*P.ride/900,5,2.5);g.fillStyle='#9be8ff';g.fill();T('ROADSTER',W/2,24,'#9be8ff',6)}
  if(boss){rr(60,H-13,200,7,3.5);fillInk('#3a0a10',1.2);if(boss.hp>0){rr(60,H-13,200*boss.hp/boss.max,7,3.5);g.fillStyle='#ff3b3b';g.fill()}T(boss.name,W/2,H-17,'#fff',7)}
  else if(!lockX){const p=Math.min(1,camX/(LEN[lvl]-W));rr(110,H-8,100,4,2);fillInk('#333',.8);rr(110,H-8,100*p,4,2);g.fillStyle='#4dff94';g.fill()}
  if(banner&&(banner.l>100||t>>3&1))T(banner.s,W/2,58,banner.c||'#ffe14d',10);for(const p of pops)T(p.s,p.x-camX,p.y,p.c,6.5);
  if(lastInput==='mouse'&&M.active){g.save();g.translate(M.x,M.y);g.beginPath();g.arc(0,0,4,0,7);g.strokeStyle='#fff';g.lineWidth=1.4;g.stroke();line([-7,0,-3,0],1.2,'#fff');line([3,0,7,0],1.2,'#fff');line([0,-7,0,-3],1.2,'#fff');line([0,3,0,7],1.2,'#fff');g.restore()}}
function dim(){g.fillStyle='rgba(8,4,20,.6)';g.fillRect(-2,-2,W+4,H+4)}
function render(){g.setTransform(S,0,0,S,0,0);g.clearRect(0,0,W,H);
  if(state==='title'){lvl=1;camX=(t*.5)%2000;P=P||newPlayer(0);bg();dim();const by=124+Math.sin(t*.08)*3;g.save();g.translate(W/2,by);g.scale(1.6,1.6);P.on=true;P.vx=0;drawHero(0,0,1,Math.sin(t*.03)*.6-.3,Math.sin(t*.16)*2,false);g.restore();
    T('SEÑOR',W/2,28,'#fff',20);T('INTELIGENTE',W/2,50,'#4dff94',22);T('flip every AI to SI',W/2,66,'#ffe14d',8);
    T(isTouch?'LEFT: drag to move · RIGHT: drag to aim & fire':'WASD move · MOUSE aim/click fire · ARROWS/IJKL aim+fire',W/2,143,'#eee',6);T(isTouch?'JUMP / GRAB buttons':'SPACE/Z jump · C/E/Shift/right-click grab · gamepad OK',W/2,152,'#eee',6);
    if(t>>5&1)T(isTouch?'TAP TO START':'PRESS ENTER / CLICK TO START',W/2,166,'#fff',9);T('HI '+hi,W/2,176,'#ff6bd6',6);return}
  g.save();if(shake>0)g.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
  bg();for(const e of E)if(!e.held&&e.k!=='pow')drawEnemy(e);for(const e of E)if(e.k==='pow')drawEnemy(e);drawPlayer();for(const e of E)if(e.held)drawEnemy(e);drawBullets();drawFX();g.restore();
  if(flash){g.fillStyle='rgba(255,255,255,.5)';g.fillRect(0,0,W,H)}hud();
  if(state==='over'){dim();T('GAME OVER',W/2,70,'#ff3b3b',24);T('SCORE '+score,W/2,94,'#ffe14d',10);T('the AI won this round...',W/2,108,'#bbb',7);if(t>>5&1)T(isTouch?'TAP TO RETRY':'PRESS ENTER / CLICK TO RETRY',W/2,145,'#fff',9)}
  if(state==='win'){dim();T('¡VICTORIA!',W/2,62,'#4dff94',24);T('ALL AI → SI',W/2,84,'#ffe14d',12);T('SCORE '+score,W/2,102,'#fff',10);if(t>>5&1)T(isTouch?'TAP TO PLAY AGAIN':'PRESS ENTER / CLICK TO PLAY AGAIN',W/2,145,'#fff',9)}
  if(state==='pause'){dim();T('PAUSED',W/2,90,'#fff',16)}}
let last=performance.now(),pfT=0,pfN=0,pfS=0;function loop(n){const raw=(n-last)/1000,dt=Math.min(.05,raw);last=n;
  if(document.visibilityState==='visible'&&raw<.25&&LOW<2){pfT+=raw;pfN++;if(raw>.024)pfS++;if(pfT>3){if(pfS/pfN>.5){LOW++;try{localStorage.setItem('siLow',LOW)}catch(e){}fit();banner={s:LOW>1?'PERFORMANCE MODE+':'PERFORMANCE MODE',l:90,c:'#9cf'}}pfT=pfN=pfS=0}}
try{update(dt)}catch(err){console.error(err);clr()}render();requestAnimationFrame(loop)}requestAnimationFrame(loop);
if(DEBUG)window.__game={get state(){return state},get score(){return score},get lvl(){return lvl},P:()=>P,E:()=>E,boss:()=>boss,warp(x){camX=x;P.x=x+60},god(){P.hp=4;P.lives=9;window.__god=1},hurt(){hurtP()},killBoss(){if(boss)damage(boss,9999)},aim:()=>aimA};
