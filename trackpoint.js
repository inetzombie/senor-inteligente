// Invisible TrackPoint-style touch sticks. makeTP(zone) -> analog stick bound to touches that START inside zone(x,y).
// Anchor at touch start; displacement -> rate (deadzone, accel curve, capped). Release recenters.
(function(){function makeTP(zone){const tp={ax:0,ay:0,mag:0,active:false,id:null,x0:0,y0:0,DZ:6,RANGE:70,EXP:1.6,onstart:null};
  const curve=d=>{const a=Math.abs(d);if(a<tp.DZ)return 0;const n=Math.min(1,(a-tp.DZ)/tp.RANGE);return Math.sign(d)*Math.pow(n,tp.EXP)};
  const skip=e=>e.target.closest&&e.target.closest('button,a,input');
  addEventListener('touchstart',e=>{if(skip(e))return;for(const t of e.changedTouches){if(tp.id===null&&zone(t.clientX,t.clientY)){tp.id=t.identifier;tp.x0=t.clientX;tp.y0=t.clientY;tp.active=true;tp.ax=tp.ay=tp.mag=0;tp.onstart&&tp.onstart()}}if(e.cancelable)e.preventDefault()},{passive:false});
  addEventListener('touchmove',e=>{for(const t of e.changedTouches)if(t.identifier===tp.id){const dx=t.clientX-tp.x0,dy=t.clientY-tp.y0;tp.ax=curve(dx);tp.ay=curve(dy);tp.mag=Math.min(1,Math.hypot(tp.ax,tp.ay));tp.rawA=Math.atan2(dy,dx);tp.rawD=Math.hypot(dx,dy)}if(e.cancelable)e.preventDefault()},{passive:false});
  const end=e=>{for(const t of e.changedTouches)if(t.identifier===tp.id){tp.id=null;tp.active=false;tp.ax=tp.ay=tp.mag=0;tp.rawD=0}};
  addEventListener('touchend',end);addEventListener('touchcancel',end);tp.curve=curve;return tp}
 window.makeTP=makeTP;
 // default single full-screen stick (back-compat for other games)
 if(!window.TP_SPLIT)window.TP=makeTP(()=>true);
 else{window.TP=makeTP(x=>x<innerWidth/2);window.TA=makeTP(x=>x>=innerWidth/2)}
})();
