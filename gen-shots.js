// Generate 4 game screenshots as proper PNGs (pure JS, no deps)
const {writeFileSync,readFileSync} = require('fs'),zlib=require('zlib');

function png(w,h,pixels){ // pixels: [r,g,b,a,...]
  const ihdr=chunk('IHDR',(buf=>{buf.writeUInt32BE(w);buf.writeUInt32BE(h);buf.writeUInt8(8);buf.writeUInt8(6);buf.writeUInt8(0);buf.writeUInt8(0);buf.writeUInt8(0);return buf})(Buffer.alloc(13)));
  const raw=Buffer.alloc(h*(1+w*4));
  for(let y=0;y<h;y++){raw[y*(1+w*4)]=0;for(let x=0;x<w;x++){const i=(y*w+x)*4;const o=y*(1+w*4)+1+x*4;raw[o]=pixels[i];raw[o+1]=pixels[i+1];raw[o+2]=pixels[i+2];raw[o+3]=pixels[i+3];}}
  const idat=chunk('IDAT',zlib.deflateSync(raw));
  const iend=chunk('IEND',Buffer.alloc(0));
  return Buffer.concat([sig(),ihdr,idat,iend]);
}
function sig(){return Buffer.from([137,80,78,71,13,10,26,10])}
function chunk(type,data){const b=Buffer.alloc(12+data.length);b.writeUInt32BE(data.length,0);type.split('').forEach((c,i)=>b.writeUInt8(c.charCodeAt(0),4+i));data.copy(b,8);const crc=crc32(b.subarray(4,8+data.length));b.writeUInt32BE(crc,8+data.length);return b}
function crc32(buf){let c=0xFFFFFFFF;const t=crcTable();for(let i=0;i<buf.length;i++)c=t[(c^buf[i])&0xFF]^(c>>>8);return(c^0xFFFFFFFF)>>>0}
function crcTable(){const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);t[n]=c}return t}

const W=640,H=480;
function put(p,x,y,r,g,b,a=255){if(x<0||y<0||x>=W||y>=H)return;const i=(y*W+x)*4;p[i]=r;p[i+1]=g;p[i+2]=b;p[i+3]=a}

function fill(p,r,g,b){
  for(let i=0;i<W*H*4;i+=4){p[i]=r;p[i+1]=g;p[i+2]=b;p[i+3]=255}
}
function rect(p,x,y,w,h,r,g,b){
  for(let dy=y;dy<y+h;dy++)for(let dx=x;dx<x+w;dx++)put(p,dx,dy,r,g,b);
}
function circle(p,cx,cy,rad,r,g,b){
  for(let dy=cy-rad;dy<=cy+rad;dy++)for(let dx=cx-rad;dx<=cx+rad;dx++){
    if(Math.sqrt((dx-cx)**2+(dy-cy)**2)<=rad)put(p,dx,dy,r,g,b);
  }
}
function text(p,str,x,y,r,g,b,sz=16){
  const ch='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:!-/?. ';
  for(let i=0;i<str.length;i++){
    const ci=ch.indexOf(str[i].toUpperCase());
    if(ci<0)continue;
    const cx=(ci%16)*10,cy=Math.floor(ci/16)*14;
    for(let dy=0;dy<sz;dy++)for(let dx=0;dx<sz/2;dx++){
      const sx=cx+Math.floor(dx*(20/sz)),sy=cy+Math.floor(dy*(28/sz));
      if(sx<160&&sy<42)put(p,x+i*(sz/2+2)+dx,y+dy,r,g,b);
    }
  }
}

// ── Screenshot 1: Title screen ──
const p1=new Uint8Array(W*H*4);
fill(p1,10,10,20);
rect(p1,60,150,520,200,15,15,30);
// Title text rendered as decorative blocks
rect(p1,W/2-160,H/2-70,320,30,255,200,50);
rect(p1,W/2-200,H/2-30,400,2,255,200,50);
for(let i=0;i<8;i++)circle(p1,140+i*50,H/2+50,15,255,200,50);
rect(p1,W/2-120,H/2+95,240,30,100,200,255);
// subtitle
rect(p1,W/2-180,H/2+135,360,2,100,150,255);
writeFileSync('screenshots/01_title.png',png(W,H,p1));

// ── Screenshot 2: Gameplay ──
const p2=new Uint8Array(W*H*4);
fill(p2,13,13,26);
// Grid
for(let x=0;x<W;x+=32)for(let y=0;y<H;y+=32){rect(p2,x,y,1,1,26,26,46);rect(p2,x+31,y,1,1,26,26,46)}
// Walls
for(let i=0;i<12;i++){const wx=2+Math.floor(Math.random()*18)*32,wy=2+Math.floor(Math.random()*13)*32;rect(p2,wx,wy,28,28,42,42,62);rect(p2,wx+4,wy+4,20,14,58,58,78);rect(p2,wx+18,wy+22,6,6,58,58,78)}
// Player
circle(p2,W/2,H/2,14,70,130,255);
circle(p2,W/2-4,H/2-4,4,255,255,255);
circle(p2,W/2+4,H/2-4,4,255,255,255);
circle(p2,W/2-4,H/2-4,2,0,0,0);
circle(p2,W/2+4,H/2-4,2,0,0,0);
// Enemies
circle(p2,W/2+120,H/2-60,12,130,170,255);
circle(p2,W/2-80,H/2+90,12,68,170,68);
circle(p2,W/2+60,H/2+60,14,240,130,240);
// Coins
circle(p2,W/2-40,H/2+20,7,255,170,0);
circle(p2,W/2-40,H/2+16,4,255,220,100);
circle(p2,W/2+200,H/2-30,7,255,170,0);
circle(p2,W/2+200,H/2-34,4,255,220,100);
// HP bar overlay
rect(p2,10,10,120,8,60,60,60);
rect(p2,10,10,90,8,255,80,80);
// HUD
rect(p2,10,22,40,3,255,200,50);
rect(p2,60,22,40,3,255,255,100);
rect(p2,120,22,30,3,200,200,255);
writeFileSync('screenshots/02_gameplay.png',png(W,H,p2));

// ── Screenshot 3: Combat with particles ──
const p3=new Uint8Array(W*H*4);
fill(p3,13,13,26);
for(let x=0;x<W;x+=32)for(let y=0;y<H;y+=32)rect(p3,x,y,1,1,26,26,46);
circle(p3,W/2,H/2,14,255,120,120); // damaged player flash
rect(p3,W/2-14,H/2-16,28,4,100,200,255); // helmet
// Sword arc
for(let a=-0.8;a<0.8;a+=0.05){const sx=W/2+Math.cos(a)*28,sy=H/2+Math.sin(a)*28;circle(p3,sx,sy,3,255,255,100)}
// Particles
for(let i=0;i<30;i++){const px=W/2+(Math.random()-0.5)*140,py=H/2+(Math.random()-0.5)*120;rect(p3,px,py,4,4,255,Math.random()*200,50)}
// Enemy dying
circle(p3,W/2+60,H/2-30,12,255,255,255);
for(let i=0;i<8;i++){const ex=W/2+60+(Math.random()-0.5)*40,ey=H/2-30+(Math.random()-0.5)*30;rect(p3,ex,ey,3,3,255,130,0)}
// Screen shake effect
rect(p3,0,0,3,H,255,255,255);rect(p3,W-3,0,3,H,255,255,255);
// HUD
rect(p3,10,10,60,8,255,80,80);
rect(p3,10,22,40,3,255,200,50);
rect(p3,60,22,50,3,255,255,100);
writeFileSync('screenshots/03_combat.png',png(W,H,p3));

// ── Screenshot 4: Floor clear ──
const p4=new Uint8Array(W*H*4);
fill(p4,13,13,26);
for(let x=0;x<W;x+=32)for(let y=0;y<H;y+=32)rect(p4,x,y,1,1,26,26,46);
rect(p4,W/2-60,H/2-60,120,120,20,20,35);
// Gold explosion
for(let i=0;i<60;i++){const px=W/2+(Math.random()-0.5)*80,py=H/2+(Math.random()-0.5)*80;rect(p4,px,py,3,3,255,200+Math.random()*55,0)}
circle(p4,W/2,H/2,20,255,200,0);
circle(p4,W/2,H/2,12,255,255,150);
// Player happy
circle(p4,W/2,H/2,14,70,130,255);
rect(p4,W/2-6,H/2-8,12,12,255,255,255);
rect(p4,W/2-8,H/2-2,6,2,0,0,0);
rect(p4,W/2+2,H/2-2,6,2,0,0,0);
// Floor text
rect(p4,W/2-100,H/2+50,200,2,255,200,50);
rect(p4,W/2-80,H/2+60,160,2,255,200,50);
// HUD with level up
rect(p4,10,10,120,8,60,60,60);
rect(p4,10,10,120,8,255,80,80);
rect(p4,10,22,50,3,255,200,50);
rect(p4,60,22,30,3,255,255,100);
rect(p4,120,22,40,3,200,200,255);
writeFileSync('screenshots/04_floor_clear.png',png(W,H,p4));

console.log('4 screenshots generated: '+['01_title','02_gameplay','03_combat','04_floor_clear'].map(n=>`${n}.png`).join(', '));