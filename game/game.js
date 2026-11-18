// DUNGEON DELVER — Top-down action roguelike for best-game-01
// Built for make.fun — Node 22 static game, no network, no libraries

const W=640,H=480,TS=32; // canvas size, tile size
const COLS=W/TS,ROWS=H/TS;

// ── Canvas setup ──
const c=document.getElementById('c');
c.width=W;c.height=H;
const ctx=c.getContext('2d');
ctx.imageSmoothingEnabled=false;

// ── Input ──
const keys={};
document.addEventListener('keydown',e=>{keys[e.key]=true;e.preventDefault()});
document.addEventListener('keyup',e=>{keys[e.key]=false;e.preventDefault()});

// Mobile controls
let touchDir={x:0,y:0},touchAttack=false;
c.addEventListener('touchstart',e=>{
  e.preventDefault();
  const r=c.getBoundingClientRect();
  for(const t of e.changedTouches){
    const tx=t.clientX-r.left,ty=t.clientY-r.top;
    if(tx<W/3)touchDir.x=-1;else if(tx>2*W/3)touchDir.x=1;else touchDir.x=0;
    if(ty<H/2)touchDir.y=-1;else touchDir.y=1;
    if(tx>W/2&&ty>H/2)touchAttack=true;
  }
});
c.addEventListener('touchend',()=>{touchDir.x=0;touchDir.y=0;touchAttack=false});

// ── Game state ──
let game={hp:10,maxHp:10,coins:0,floor:1,enemiesLeft:0,state:'title',tick:0,damageFlash:0,shakeX:0,shakeY:0};
let player,enemies,particles,items,map,roomInfo;

function resetGame(){
  game.hp=game.maxHp;game.coins=0;game.floor=1;game.state='playing';
  player={x:W/2,y:H/2,vx:0,vy:0,speed:3,size:14,attackCd:0,w:16,h:20};
  enemies=[];particles=[];items=[];
  map=new Uint8Array(COLS*ROWS);
  generateFloor();
  updateHUD();
}

// ── Dungeon generation ──
function generateFloor(){
  map.fill(0);
  // Border walls
  for(let x=0;x<COLS;x++)map[x]=map[x+(ROWS-1)*COLS]=1;
  for(let y=0;y<ROWS;y++)map[y*COLS]=map[y*COLS+COLS-1]=1;
  // Pillars / obstacles
  const pillarCount=8+game.floor*2;
  for(let i=0;i<pillarCount;i++){
    const px=2+Math.floor(Math.random()*(COLS-4));
    const py=2+Math.floor(Math.random()*(ROWS-4));
    if(px>COLS/3&&px<2*COLS/3&&py>ROWS/3&&py<2*ROWS/3)continue; // clear center
    map[py*COLS+px]=1;
    // make 2x2 pillars sometimes
    if(Math.random()<0.3&&px<COLS-2&&py<ROWS-2){
      map[py*COLS+px+1]=1;map[(py+1)*COLS+px]=1;map[(py+1)*COLS+px+1]=1;
    }
  }
  // Enemies scale with floor
  const eCount=3+game.floor*2;
  for(let i=0;i<eCount;i++)spawnEnemy();
  game.enemiesLeft=enemies.length;
  updateHUD();
}

function spawnEnemy(){
  let ex,ey;
  do{ex=2+Math.floor(Math.random()*(COLS-4));ey=2+Math.floor(Math.random()*(ROWS-4));}
  while(map[ey*COLS+ex]||dist(player.x,player.y,ex*TS+TS/2,ey*TS+TS/2)<100);
  const types=game.floor<=3?['slime','slime','skeleton']:['skeleton','skeleton','mage'];
  const type=types[Math.floor(Math.random()*types.length)];
  const hp=type==='slime'?2+game.floor:(type==='skeleton'?4+game.floor:3+Math.floor(game.floor/2));
  enemies.push({x:ex*TS+TS/2,y:ey*TS+TS/2,type,hp,maxHp:hp,size:12,cd:0,dir:0,flash:0});
}

function spawnItem(x,y){
  const r=Math.random();
  if(r<0.3)items.push({x,y,type:'coin',val:1});
  else if(r<0.5)items.push({x,y,type:'heart',val:1});
  else if(r<0.55)items.push({x,y,type:'bigCoin',val:5});
}

// ── Update ──
function update(){
  if(game.state!=='playing')return;
  game.tick++;if(game.damageFlash>0)game.damageFlash--;
  if(game.shakeX!==0){game.shakeX*=-0.6;if(Math.abs(game.shakeX)<0.5)game.shakeX=0;}
  if(game.shakeY!==0){game.shakeY*=-0.6;if(Math.abs(game.shakeY)<0.5)game.shakeY=0;}

  // Player movement
  let mx=0,my=0;
  if(keys['ArrowLeft']||keys['a']||touchDir.x<0)mx=-1;
  if(keys['ArrowRight']||keys['d']||touchDir.x>0)mx=1;
  if(keys['ArrowUp']||keys['w']||touchDir.y<0)my=-1;
  if(keys['ArrowDown']||keys['s']||touchDir.y>0)my=1;
  if(mx&&my){mx*=0.707;my*=0.707;}
  player.vx=mx*player.speed;player.vy=my*player.speed;

  // Collision
  const nx=player.x+player.vx,ny=player.y+player.vy;
  const psize=player.size;
  if(!wallAt(nx-psize,player.y-psize)&&!wallAt(nx+psize,player.y-psize)&&!wallAt(nx-psize,player.y+psize)&&!wallAt(nx+psize,player.y+psize))player.x=nx;
  if(!wallAt(player.x-psize,ny-psize)&&!wallAt(player.x+psize,ny-psize)&&!wallAt(player.x-psize,ny+psize)&&!wallAt(player.x+psize,ny+psize))player.y=ny;
  player.x=Math.max(psize,Math.min(W-psize,player.x));
  player.y=Math.max(psize,Math.min(H-psize,player.y));

  // Attack
  if(player.attackCd>0)player.attackCd--;
  if((keys[' ']||keys['j']||touchAttack)&&player.attackCd<=0){
    player.attackCd=12;
    const ax=player.x+(mx?mx*30:30)*Math.cos(game.tick*0.1)*0;
    for(let i=enemies.length-1;i>=0;i--){
      const e=enemies[i];
      if(dist(player.x,player.y,e.x,e.y)<42){
        e.hp--;e.flash=8;
        spawnParticles(e.x,e.y,4,'#f44');
        if(e.hp<=0){killEnemy(i);}
      }
    }
    spawnParticles(player.x,player.y,3,'#ff6');
  }

  // Enemies
  for(const e of enemies){
    if(e.flash>0)e.flash--;
    const d=dist(player.x,player.y,e.x,e.y);
    if(d<200){
      const dx=(player.x-e.x)/d,dy=(player.y-e.y)/d;
      const sp=e.type==='skeleton'?1.8:(e.type==='mage'?1.2:1.2);
      const nx2=e.x+dx*sp,ny2=e.y+dy*sp;
      if(!wallAt(nx2,e.y))e.x=nx2;
      if(!wallAt(e.x,ny2))e.y=ny2;
      e.dir=Math.atan2(dy,dx);
      if(d<28&&e.cd<=0){damagePlayer(1);e.cd=40;}
    }else if(e.type==='mage'&&d<300&&e.cd<=0){
      e.cd=80;
      spawnMageProjectile(e);
    }
    if(e.cd>0)e.cd--;
  }

  // Items
  for(let i=items.length-1;i>=0;i--){
    const it=items[i];
    if(dist(player.x,player.y,it.x,it.y)<24){
      if(it.type==='coin')game.coins+=it.val;
      else if(it.type==='bigCoin')game.coins+=it.val;
      else if(it.type==='heart')game.hp=Math.min(game.maxHp,game.hp+it.val);
      items.splice(i,1);
      spawnParticles(it.x,it.y,5,it.type==='heart'?'#f88':'#ff6');
      updateHUD();
    }
  }

  // Particles
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];p.x+=p.vx;p.y+=p.vy;p.life--;
    if(p.life<=0)particles.splice(i,1);
  }

  // Floor clear check
  if(enemies.length===0){
    game.floor++;
    player.x=W/2;player.y=H/2;
    enemies=[];particles=[];
    game.hp=Math.min(game.maxHp,game.hp+2);
    game.maxHp=Math.min(20,game.maxHp+1);
    generateFloor();
    spawnParticles(W/2,H/2,20,'#ff6');
  }
}

function spawnMageProjectile(e){
  const dx=(player.x-e.x)/50,dy=(player.y-e.y)/50;
  const d=Math.sqrt(dx*dx+dy*dy);
  enemies.push({x:e.x,y:e.y,type:'bullet',hp:1,maxHp:1,size:5,cd:0,dir:0,flash:0,vx:dx/d*4,vy:dy/d*4});
}

function damagePlayer(dmg){
  if(game.damageFlash>0)return;
  game.hp-=dmg;game.damageFlash=20;
  game.shakeX=(Math.random()-0.5)*10;game.shakeY=(Math.random()-0.5)*10;
  spawnParticles(player.x,player.y,10,'#f44');
  updateHUD();
  if(game.hp<=0)game.state='gameover';
}

function killEnemy(i){
  const e=enemies[i];
  spawnParticles(e.x,e.y,8,'#f80');spawnParticles(e.x,e.y,4,'#fff');
  spawnItem(e.x,e.y);
  enemies.splice(i,1);
  game.enemiesLeft=enemies.length;
  updateHUD();
}

function spawnParticles(x,y,n,color){
  for(let i=0;i<n;i++){
    const a=Math.random()*Math.PI*2,s=0.5+Math.random()*2;
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:15+Math.random()*15,color,size:2+Math.random()*3});
  }
}

// ── Render ──
function render(){
  ctx.fillStyle='#0d0d1a';ctx.fillRect(0,0,W,H);

  const sx=game.shakeX,sy=game.shakeY;
  ctx.save();ctx.translate(sx,sy);

  // Grid floor
  ctx.strokeStyle='#1a1a2e';ctx.lineWidth=0.5;
  for(let x=0;x<W;x+=TS)for(let y=0;y<H;y+=TS)ctx.strokeRect(x,y,TS,TS);

  // Walls
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    if(map[y*COLS+x]){
      ctx.fillStyle='#2a2a3e';ctx.fillRect(x*TS,y*TS,TS,TS);
      ctx.fillStyle='#3a3a4e';ctx.fillRect(x*TS+2,y*TS+2,TS-4,TS-4);
      // Brick lines
      ctx.strokeStyle='#1a1a2e';ctx.lineWidth=1;
      ctx.strokeRect(x*TS+4,y*TS+4,TS-8,TS/2-2);
      ctx.strokeRect(x*TS+TS/2+2,y*TS+TS/2,TS/2-6,TS/2-6);
    }
  }

  // Items
  for(const it of items){
    const flicker=Math.sin(game.tick*0.1)*2;
    if(it.type==='coin'){ctx.fillStyle='#fa0';ctx.beginPath();ctx.arc(it.x,it.y+flicker,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ff6';ctx.beginPath();ctx.arc(it.x,it.y+flicker,4,0,Math.PI*2);ctx.fill()}
    else if(it.type==='bigCoin'){ctx.fillStyle='#fa0';ctx.beginPath();ctx.arc(it.x,it.y+flicker,10,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ff6';ctx.beginPath();ctx.arc(it.x,it.y+flicker,6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.fillText('5',it.x,it.y+4+flicker)}
    else if(it.type==='heart'){ctx.fillStyle='#f44';ctx.beginPath();ctx.arc(it.x,it.y+flicker,8,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(it.x,it.y+flicker,3,0,Math.PI*2);ctx.fill()}
  }

  // Enemies
  for(const e of enemies){
    ctx.fillStyle=e.flash>0?'#fff':(e.type==='skeleton'?'#8af':(e.type==='mage'?'#a6f':(e.type==='bullet'?'#f0f':'#4a4')));
    ctx.beginPath();ctx.arc(e.x,e.y,e.size,0,Math.PI*2);ctx.fill();
    // Eyes/enemy detail
    if(e.type!=='bullet'){
      ctx.fillStyle='#fff';
      const ed=e.dir||0;
      ctx.beginPath();ctx.arc(e.x+Math.cos(ed-0.5)*4,e.y+Math.sin(ed-0.5)*4,3,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(e.x+Math.cos(ed+0.5)*4,e.y+Math.sin(ed+0.5)*4,3,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#000';ctx.beginPath();ctx.arc(e.x+Math.cos(ed-0.5)*5,e.y+Math.sin(ed-0.5)*5,1.2,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(e.x+Math.cos(ed+0.5)*5,e.y+Math.sin(ed+0.5)*5,1.2,0,Math.PI*2);ctx.fill();
    }
    // HP bar for non-bullet
    if(e.type!=='bullet'&&e.hp<e.maxHp){
      ctx.fillStyle='#333';ctx.fillRect(e.x-10,e.y-16,20,3);
      ctx.fillStyle='#f44';ctx.fillRect(e.x-10,e.y-16,20*(e.hp/e.maxHp),3);
    }
  }

  // Player
  const pi=Math.floor(game.tick/4)%4;
  const isMoving=player.vx!==0||player.vy!==0;
  ctx.fillStyle=game.damageFlash>0?(game.damageFlash%4<2?'#fff':'#48f'):'#48f';
  ctx.beginPath();ctx.arc(player.x,player.y,player.size,0,Math.PI*2);ctx.fill();
  // Helmet
  ctx.fillStyle='#6af';ctx.beginPath();ctx.arc(player.x,player.y-4,player.size-3,Math.PI,0);ctx.fill();
  // Eyes
  ctx.fillStyle='#fff';
  ctx.beginPath();ctx.arc(player.x-4,player.y-3,4,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(player.x+4,player.y-3,4,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#000';
  ctx.beginPath();ctx.arc(player.x-4,player.y-3,2,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(player.x+4,player.y-3,2,0,Math.PI*2);ctx.fill();
  // Sword effect during attack
  if(player.attackCd>6){
    ctx.strokeStyle='#ff6';ctx.lineWidth=2;ctx.beginPath();
    ctx.arc(player.x,player.y,player.size+12,(player.attackCd-6)*-0.6,(player.attackCd-6)*-0.6+1.2);ctx.stroke();
  }

  // Particles
  for(const p of particles){
    ctx.globalAlpha=p.life/30;
    ctx.fillStyle=p.color;ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);
    ctx.globalAlpha=1;
  }

  ctx.restore();

  // Title screen
  if(game.state==='title'){
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#ff6';ctx.font='bold 36px monospace';ctx.textAlign='center';ctx.fillText('DUNGEON DELVER',W/2,H/2-60);
    ctx.fillStyle='#fff';ctx.font='14px monospace';ctx.fillText('⚔️ Clear each floor to descend deeper ⚔️',W/2,H/2-10);
    ctx.fillText('WASD/Arrow keys + SPACE to attack',W/2,H/2+25);
    ctx.fillText('Touch left/right + bottom half to attack',W/2,H/2+50);
    ctx.fillStyle='#ff6';ctx.font='bold 18px monospace';
    const pulse=1+Math.sin(Date.now()*0.003)*0.2;
    ctx.fillText('PRESS ANY KEY TO START',W/2,H/2+95);ctx.font=`bold ${18*pulse}px monospace`;
  }

  // Game over
  if(game.state==='gameover'){
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#f44';ctx.font='bold 32px monospace';ctx.textAlign='center';ctx.fillText('GAME OVER',W/2,H/2-30);
    ctx.fillStyle='#fff';ctx.font='16px monospace';ctx.fillText(`Floor: ${game.floor}  |  Coins: ${game.coins}`,W/2,H/2+15);
    ctx.fillStyle='#ff6';ctx.font='14px monospace';ctx.fillText('Press any key to retry',W/2,H/2+50);
  }
}

// ── Helpers ──
function wallAt(x,y){
  const cx=Math.floor(x/TS),cy=Math.floor(y/TS);
  return cx<0||cy<0||cx>=COLS||cy>=ROWS||map[cy*COLS+cx];
}
function dist(x1,y1,x2,y2){return Math.sqrt((x2-x1)**2+(y2-y1)**2)}
function updateHUD(){
  document.getElementById('hp').textContent=game.hp;
  document.getElementById('maxhp').textContent=game.maxHp;
  document.getElementById('coins').textContent=game.coins;
  document.getElementById('enemies').textContent=game.enemiesLeft;
  document.getElementById('floor').textContent=game.floor;
}

// ── Game loop ──
function loop(){
  update();render();requestAnimationFrame(loop);
}
updateHUD();

// Title / restart
document.addEventListener('keydown',function start(e){
  if(game.state==='title'||game.state==='gameover'){resetGame();}
},{once:false});
c.addEventListener('touchstart',function startT(e){
  if(game.state==='title'||game.state==='gameover'){resetGame();}
},{once:false});

loop();