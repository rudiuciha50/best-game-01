// RENDER.JS — All drawing logic
const canvas=document.getElementById('c');
canvas.width=W;canvas.height=H;
const ctx=canvas.getContext('2d');
ctx.imageSmoothingEnabled=false;

function render(){
  ctx.fillStyle='#0d0d1a';ctx.fillRect(0,0,W,H);
  const sx=G.shakeX||0,sy=G.shakeY||0;
  ctx.save();ctx.translate(sx,sy);

  // Floor tiles with subtle pattern
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    if(!maze[y*COLS+x]){
      const px=x*TS,py=y*TS;
      ctx.fillStyle=(x+y)%2===0?'#1a1a2e':'#151528';
      ctx.fillRect(px,py,TS,TS);
      ctx.strokeStyle='#12121f';ctx.lineWidth=0.5;ctx.strokeRect(px,py,TS,TS);
    }
  }
  // Walls
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    if(maze[y*COLS+x]){
      const px=x*TS,py=y*TS;
      ctx.fillStyle='#2a2a3e';ctx.fillRect(px,py,TS,TS);
      ctx.fillStyle='#3a3a52';ctx.fillRect(px+3,py+3,TS-6,TS-6);
      ctx.fillStyle='#1a1a2e';ctx.fillRect(px+TS/2-1,py+3,2,TS-6);ctx.fillRect(px+3,py+TS/2-1,TS-6,2);
    }
  }

  // Items
  for(const it of items){
    const fl=Math.sin(G.tick*0.1)*2;
    if(it.type==='coin'){ctx.fillStyle='#ffaa00';ctx.beginPath();ctx.arc(it.x,it.y+fl,7,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ffdd44';ctx.beginPath();ctx.arc(it.x,it.y+fl,4,0,Math.PI*2);ctx.fill()}
    else if(it.type==='bigCoin'){ctx.fillStyle='#ffaa00';ctx.beginPath();ctx.arc(it.x,it.y+fl,10,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ffdd44';ctx.beginPath();ctx.arc(it.x,it.y+fl,6,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff';ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.fillText('5',it.x,it.y+4+fl)}
    else if(it.type==='heart'){ctx.fillStyle='#ff4466';ctx.beginPath();ctx.arc(it.x-3,it.y+fl,5,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(it.x+3,it.y+fl,5,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.moveTo(it.x-8,it.y+2+fl);ctx.lineTo(it.x+8,it.y+2+fl);ctx.lineTo(it.x,it.y+10+fl);ctx.closePath();ctx.fill()}
  }

  // Enemies
  for(const e of enemies){
    const flash=e.flash>0;const bob=Math.sin(G.tick*0.08+e.x*0.1)*1.5;
    if(e.type==='bullet'){
      ctx.fillStyle='#ff00ff';ctx.beginPath();ctx.arc(e.x,e.y,5,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#ff88ff';ctx.lineWidth=1;ctx.beginPath();ctx.arc(e.x,e.y,8,0,Math.PI*2);ctx.stroke();
    }else{
      ctx.fillStyle=flash?'#fff':(e.type==='skeleton'?'#88aaff':(e.type==='mage'?'#aa66ff':'#44aa44'));
      ctx.beginPath();ctx.arc(e.x,e.y+bob,e.size,0,Math.PI*2);ctx.fill();
      // Eyes
      if(!flash){ctx.fillStyle='#fff';
      ctx.beginPath();ctx.arc(e.x-4,e.y+bob-3,3,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(e.x+4,e.y+bob-3,3,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#000';ctx.beginPath();ctx.arc(e.x-4,e.y+bob-3,1.5,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(e.x+4,e.y+bob-3,1.5,0,Math.PI*2);ctx.fill()}
      // HP bar
      if(e.hp<e.maxHp){ctx.fillStyle='#333';ctx.fillRect(e.x-10,e.y-18,20,3);
        ctx.fillStyle='#f44';ctx.fillRect(e.x-10,e.y-18,20*(e.hp/e.maxHp),3)}
    }
  }

  // Player
  const ph=Math.sin(G.tick*0.1)*1;
  ctx.fillStyle=G.damageFlash>0?(G.damageFlash%4<2?'#fff':'#4488ff'):'#4488ff';
  ctx.beginPath();ctx.arc(P.x,P.y+ph,P.size,0,Math.PI*2);ctx.fill();
  // Helmet
  ctx.fillStyle='#66aaff';ctx.beginPath();ctx.arc(P.x,P.y-4+ph,P.size-3,Math.PI,0);ctx.fill();
  // Eyes
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(P.x-4,P.y-3+ph,4,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(P.x+4,P.y-3+ph,4,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#000';ctx.beginPath();ctx.arc(P.x-4,P.y-3+ph,2,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(P.x+4,P.y-3+ph,2,0,Math.PI*2);ctx.fill();
  // Sword arc during attack
  if(P.attackCd>6){
    ctx.strokeStyle='#ffdd44';ctx.lineWidth=3;
    const ang=(P.attackCd-6)*-0.7;ctx.beginPath();
    ctx.arc(P.x,P.y,P.size+14,ang,ang+1.3);ctx.stroke();
    ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.beginPath();
    ctx.arc(P.x,P.y,P.size+10,ang+0.2,ang+1.1);ctx.stroke();
  }

  // Particles
  for(const p of particles){
    ctx.globalAlpha=Math.min(1,p.life/25);ctx.fillStyle=p.color;
    ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);ctx.globalAlpha=1;
  }

  // Vignette
  const g=ctx.createRadialGradient(W/2,H/2,100,W/2,H/2,W*0.7);
  g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,0.4)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.restore();

  // Title screen
  if(G.state==='title'){
    ctx.fillStyle='rgba(5,5,15,0.8)';ctx.fillRect(0,0,W,H);
    ctx.textAlign='center';
    ctx.fillStyle='#ffd700';ctx.font='bold 42px monospace';
    const tp=1+Math.sin(Date.now()*0.003)*0.05;
    ctx.fillText(TITLE,W/2,H/2-60);
    ctx.font=`bold ${42*tp}px monospace`;ctx.fillStyle='#ffaa00';
    ctx.fillText(TITLE,W/2,H/2-60);
    ctx.fillStyle='#88ccff';ctx.font='14px monospace';
    ctx.fillText('⚔️ Clear each floor to descend deeper ⚔️',W/2,H/2-5);
    ctx.fillStyle='#d0d0f0';ctx.fillText('WASD / Arrow keys to move, SPACE to attack',W/2,H/2+25);
    ctx.fillText('Touch: left/right = move, bottom-right = attack',W/2,H/2+50);
    ctx.fillStyle='#ffd700';ctx.font='bold 16px monospace';
    if(Math.sin(Date.now()*0.005)>0)ctx.fillText('▶ PRESS ANY KEY TO START ◀',W/2,H/2+95);
  }

  // Game over
  if(G.state==='gameover'){
    ctx.fillStyle='rgba(5,5,15,0.85)';ctx.fillRect(0,0,W,H);
    ctx.textAlign='center';
    ctx.fillStyle='#ff4466';ctx.font='bold 36px monospace';ctx.fillText('GAME OVER',W/2,H/2-40);
    ctx.fillStyle='#fff';ctx.font='16px monospace';
    ctx.fillText(`Floor: ${G.floor}  |  Coins: ${G.coins}`,W/2,H/2+10);
    ctx.fillStyle='#ffd700';ctx.font='14px monospace';
    if(Math.sin(Date.now()*0.005)>0)ctx.fillText('▶ PRESS ANY KEY TO RETRY ◀',W/2,H/2+55);
  }
}