// GAME.JS — Main game loop and logic
function update(){
  if(G.state!=='playing')return;
  G.tick++;if(G.damageFlash>0)G.damageFlash--;
  if(G.shakeX||G.shakeY){G.shakeX*=-0.65;G.shakeY*=-0.65;if(Math.abs(G.shakeX)<0.5)G.shakeX=0;if(Math.abs(G.shakeY)<0.5)G.shakeY=0}
  if(G.floorMsgTimer>0){G.floorMsgTimer--;if(G.floorMsgTimer===0)document.getElementById('floor-msg').style.opacity=0}

  // Movement
  let mx=0,my=0;
  if(keys['ArrowLeft']||keys['a']||td.x<0)mx=-1;if(keys['ArrowRight']||keys['d']||td.x>0)mx=1;
  if(keys['ArrowUp']||keys['w']||td.y<0)my=-1;if(keys['ArrowDown']||keys['s']||td.y>0)my=1;
  if(mx&&my){mx*=0.707;my*=0.707}
  P.vx=mx*P.speed;P.vy=my*P.speed;
  const nx=P.x+P.vx,ny=P.y+P.vy,s=P.size;
  if(!wallAt(nx-s,ny-s)&&!wallAt(nx+s,ny-s)&&!wallAt(nx-s,ny+s)&&!wallAt(nx+s,ny+s)){P.x=nx;P.y=ny}

  // Clamp
  P.x=Math.max(s,Math.min(W-s,P.x));P.y=Math.max(s,Math.min(H-s,P.y));

  // Attack
  if(P.attackCd>0)P.attackCd--;
  if((keys[' ']||keys['j']||ta)&&P.attackCd<=0){P.attackCd=16;
    for(let i=enemies.length-1;i>=0;i--){
      const e=enemies[i];if(dist(P.x,P.y,e.x,e.y)<45){e.hp--;e.flash=8;spawnParticles(e.x,e.y,5,'#f44');sfxHit();if(e.hp<=0){killEnemy(i)}}}
    spawnParticles(P.x,P.y,4,'#ffd700');
  }

  // Enemies
  for(let i=enemies.length-1;i>=0;i--){
    const e=enemies[i];if(e.flash>0)e.flash--;
    if(e.type==='bullet'){e.x+=e.vx;e.y+=e.vy;e.life=(e.life||120)-1;
      if(e.life<=0||wallAt(e.x,e.y)){enemies.splice(i,1);continue}
      if(dist(P.x,P.y,e.x,e.y)<16){damagePlayer(1);enemies.splice(i,1);continue}continue}
    const d=dist(P.x,P.y,e.x,e.y);
    if(d<220){
      const dx=(P.x-e.x)/d,dy=(P.y-e.y)/d;
      const sp=e.type==='skeleton'?1.7:(e.type==='mage'?1.1:1.2);
      const ex=e.x+dx*sp,ey=e.y+dy*sp;
      if(!wallAt(ex,e.y))e.x=ex;if(!wallAt(e.x,ey))e.y=ey;e.dir=Math.atan2(dy,dx);
      if(d<26&&e.cd<=0){damagePlayer(1);e.cd=45}
    }else if(e.type==='mage'&&d<320&&e.cd<=0){e.cd=90;
      const mx=(P.x-e.x)/d,my=(P.y-e.y)/d;
      enemies.push({x:e.x,y:e.y,type:'bullet',vx:mx*4,vy:my*4,life:120,size:5,hp:1,maxHp:1,flash:0,dir:0,cd:0})}
    if(e.cd>0)e.cd--;
  }

  // Items
  for(let i=items.length-1;i>=0;i--){
    const it=items[i];if(dist(P.x,P.y,it.x,it.y)<24){
      if(it.type==='coin')G.coins+=it.val;else if(it.type==='bigCoin')G.coins+=it.val;
      else if(it.type==='heart')G.hp=Math.min(G.maxHp,G.hp+it.val);
      items.splice(i,1);spawnParticles(it.x,it.y,6,it.type==='heart'?'#f88':'#ffd700');sfxCoin();updateHUD();
    }
  }

  // Particles
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx;p.y+=p.vy;p.life--;if(p.life<=0)particles.splice(i,1)}

  // Floor clear
  if(enemies.length===0&&G.state==='playing'){
    G.floor++;P.x=W/2;P.y=H/2;enemies=[];particles=[];G.hp=Math.min(G.maxHp,G.hp+2);G.maxHp=Math.min(25,G.maxHp+1);
    generateDungeon();sfxFloorClear();spawnParticles(W/2,H/2,30,'#ffd700');updateHUD();
  }
}

function loop(){update();render();requestAnimationFrame(loop)}
updateHUD();loop();