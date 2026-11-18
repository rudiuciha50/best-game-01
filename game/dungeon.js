// DUNGEON.JS — Procedural dungeon generation
function generateDungeon(){
  maze.fill(1);
  // BSP-like room generation
  const rooms=[];
  for(let i=0;i<8+Math.floor(G.floor*0.5);i++){
    const rw=3+Math.floor(Math.random()*4),rh=3+Math.floor(Math.random()*3);
    const rx=1+Math.floor(Math.random()*(COLS-rw-2)),ry=1+Math.floor(Math.random()*(ROWS-rh-2));
    let overlap=false;
    for(const r of rooms){if(rx<r.x+r.w+1&&rx+rw+1>r.x&&ry<r.y+r.h+1&&ry+rh+1>r.y){overlap=true;break}}
    if(overlap)continue;
    for(let y=ry;y<ry+rh;y++)for(let x=rx;x<rx+rw;x++)maze[y*COLS+x]=0;
    rooms.push({x:rx,y:ry,w:rw,h:rh});
  }
  // Connect rooms with corridors
  for(let i=1;i<rooms.length;i++){
    const a=rooms[i-1],b=rooms[i];
    let x=a.x+a.w/2,y=a.y+a.h/2;
    while(x!==b.x+b.w/2){x+=x<b.x+b.w/2?1:-1;if(maze[Math.floor(y)*COLS+Math.floor(x)])maze[Math.floor(y)*COLS+Math.floor(x)]=0}
    while(y!==b.y+b.h/2){y+=y<b.y+b.h/2?1:-1;if(maze[Math.floor(y)*COLS+Math.floor(x)])maze[Math.floor(y)*COLS+Math.floor(x)]=0}
  }
  // Player starts in center room
  const start=rooms[Math.floor(rooms.length/2)];
  P.x=start.x*TS+start.w*TS/2;P.y=start.y*TS+start.h*TS/2;
  // Spawn enemies
  const count=3+Math.floor(G.floor*1.5);
  for(let i=0;i<count;i++)spawnEnemy();
  G.enemiesLeft=enemies.length;
  updateHUD();
  // Floor message
  G.floorMsgTimer=120;
  document.getElementById('floor-msg').textContent='FLOOR '+G.floor;document.getElementById('floor-msg').style.opacity=1;
  setTimeout(()=>{document.getElementById('floor-msg').style.opacity=0},1500);
}