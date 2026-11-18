// DUNGEON DELVER — Sound engine (Web Audio API, oscillator-based, no external files)
const SOUND={ctx:null,enabled:true};
function ensureCtx(){if(!SOUND.ctx)try{SOUND.ctx=new(window.AudioContext||window.webkitAudioContext)()}catch(e){SOUND.enabled=false}} 
function play(freq,len,type='square',vol=0.08){
  ensureCtx();if(!SOUND.enabled)return;
  const o=SOUND.ctx.createOscillator(),g=SOUND.ctx.createGain();
  o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(vol,SOUND.ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001,SOUND.ctx.currentTime+len);
  o.connect(g);g.connect(SOUND.ctx.destination);o.start();o.stop(SOUND.ctx.currentTime+len);
}
function sfxHit(){play(200,0.08,'square',0.06);setTimeout(()=>play(80,0.1,'sawtooth',0.04),40)}
function sfxKill(){play(600,0.05,'square',0.05);setTimeout(()=>play(900,0.08,'square',0.05),50);setTimeout(()=>play(1200,0.1,'square',0.04),100)}
function sfxCoin(){play(880,0.06,'square',0.05);setTimeout(()=>play(1320,0.08,'square',0.04),60)}
function sfxHurt(){play(150,0.15,'sawtooth',0.08);play(100,0.2,'triangle',0.06)}
function sfxFloorClear(){play(440,0.1,'square',0.06);setTimeout(()=>play(660,0.1,'square',0.06),100);setTimeout(()=>play(880,0.15,'square',0.06),200)}
function sfxStart(){play(330,0.1,'triangle',0.05);setTimeout(()=>play(440,0.12,'triangle',0.05),100);setTimeout(()=>play(550,0.15,'triangle',0.05),200)}