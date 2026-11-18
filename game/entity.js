/**
 * make.fun shell linter skipped
 * ENTITY.JS — Player, enemies, particles, items system
 */
const W=640,H=480,TS=32,COLS=20,ROWS=15;
const TITLE='DUNGEON DELVER';

let G={hp:10,maxHp:10,coins:0,floor:1,enemiesLeft:0,state:'title',tick:0,damageFlash:0,shakeX:0,shakeY:0,floorMsgTimer:0};
let P,enemies,particles,items,maze;

const keys={};document.addEventListener('keydown',e=>{keys[e.key]=true;e.preventDefault()});
document.addEventListener('keyup',e=>{keys[e.key]=false;e.preventDefault()});

// Touch
let td={x:0,y:0},ta=false;
document.querySelector('canvas').addEventListener('touchstart',e=>{
  e.preventDefault();const r=e.target.getBoundingClientRect();
  for(const t of e.changedTouches){const tx=t.clientX-r.left,ty=t.clientY-r.top;
  if(tx<W/3)td.x=-1;else if(tx>2*W/3)td.x=1;else td.x=0;
  if(ty<H/2)td.y=-1;else td.y=1;if(tx>W/2&&ty>H/2)ta=true;}
});
document.querySelector('canvas').addEventListener('touchend',()=>{td.x=0;td.y=0;ta=false});

function dist(x1,y1,x2,y2){return Math.sqrt((x2-x1)**2+(y2-y1)**2)}
function wallAt(x,y){const cx=Math.floor(x/TS),cy=Math.floor(y/TS);return cx<0||cy<0||cx>=COLS||cy>=ROWS||maze[cy*COLS+cx]}

function resetGame(){
  G.hp=G.maxHp;G.coins=0;G.floor=1;G.state='playing';G.enemiesLeft=0;G.floorMsgTimer=0;
  P={x:W/2,y:H/2,vx:0,vy:0,speed:3,size:14,attackCd:0};
  enemies=[];particles=[];items=[];maze=new Uint8Array(COLS*ROWS);
  generateDungeon();sfxStart();updateHUD();
}

function spawnParticles(x,y,n,color){
  for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=0.5+Math.random()*2.5;
  particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:15+Math.random()*20,color,size:2+Math.random()*3})}
}

function spawnEnemy(){
  let ex,ey;do{ex=2+Math.floor(Math.random()*(COLS-4));ey=2+Math.floor(Math.random()*(ROWS-4))}
  while(maze[ey*COLS+ex]||dist(P.x,P.y,ex*TS+TS/2,ey*TS+TS/2)<120);
  const types=G.floor<=3?['slime','slime','skeleton']:['skeleton','skeleton','mage','slime'];
  const t=types[Math.floor(Math.random()*types.length)];
  const hp=t==='slime'?2+G.floor:(t==='skeleton'?4+G.floor:3+Math.floor(G.floor/2));
  enemies.push({x:ex*TS+TS/2,y:ey*TS+TS/2,type:t,hp,maxHp:hp,size:12,cd:0,dir:0,flash:0});
  G.enemiesLeft++;
}

function spawnItem(x,y){
  const r=Math.random();
  if(r<0.35)items.push({x,y,type:'coin',val:1});
  else if(r<0.55)items.push({x,y,type:'heart',val:1});
  else if(r<0.6)items.push({x,y,type:'bigCoin',val:5});
}

function damagePlayer(dmg){
  if(G.damageFlash>0)return;G.hp-=dmg;G.damageFlash=20;
  G.shakeX=(Math.random()-0.5)*12;G.shakeY=(Math.random()-0.5)*12;
  spawnParticles(P.x,P.y,12,'#f44');sfxHurt();updateHUD();
  if(G.hp<=0)G.state='gameover';
}

function killEnemy(i){
  const e=enemies[i];spawnParticles(e.x,e.y,10,'#f80');spawnParticles(e.x,e.y,5,'#fff');
  spawnItem(e.x,e.y);enemies.splice(i,1);G.enemiesLeft=enemies.length;sfxKill();updateHUD();
}

function updateHUD(){
  const hp=document.getElementById('hp'),mb=document.getElementById('maxhp'),bar=document.getElementById('hpbar');
  hp.textContent=G.hp;mb.textContent=G.maxHp;bar.style.width=(G.hp/G.maxHp*100)+'%';
  document.getElementById('coins').textContent=G.coins;
  document.getElementById('enemies').textContent=G.enemiesLeft;
  document.getElementById('floor').textContent=G.floor;
}

document.addEventListener('keydown',function start(e){
  if(G.state==='title'||G.state==='gameover'){resetGame();}
});
document.querySelector('canvas').addEventListener('touchstart',function(e){
  if(G.state==='title'||G.state==='gameover'){resetGame();}
});