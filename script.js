const revealObserver=new IntersectionObserver((entries)=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');revealObserver.unobserve(e.target)}})},{threshold:.12});
document.querySelectorAll('.section,.mission-card,.screens,.skill-node,.achievement').forEach(el=>{el.style.opacity='0';el.style.transform='translateY(22px)';el.style.transition='opacity .65s ease, transform .65s ease';revealObserver.observe(el)});
const style=document.createElement('style');style.textContent='.visible{opacity:1!important;transform:none!important}';document.head.appendChild(style);

// Small game-like interaction: XP responds to scroll progress.
const xp=document.querySelector('.xp-bar i');
window.addEventListener('scroll',()=>{if(!xp)return;const max=document.documentElement.scrollHeight-window.innerHeight;const progress=max>0?window.scrollY/max:0;xp.style.width=Math.min(98,72+progress*26)+'%';},{passive:true});

// Keep the hero showreel silent/autoplay-friendly.
const heroVideo=document.querySelector('.hero-video video');
if(heroVideo){heroVideo.muted=true;heroVideo.play().catch(()=>{});}


// BUGFIX RUN — lightweight pseudo-3D side-scroller, no external libraries required.
(() => {
  const canvas = document.getElementById('devGame');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('gameOverlay');
  const start = document.getElementById('startGame');
  const status = document.getElementById('gameStatus');
  const W = canvas.width, H = canvas.height;
  const keys = {};
  let running = false, won = false, last = 0, distance = 0, spawn = 0;
  const player = {x:220,y:320,w:42,h:64,vy:0,onGround:true,run:0};
  let bugs = [];
  const gravity = 1700;
  const worldLength = 6500;
  const roadY = 388;

  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (['ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
    if (e.code === 'KeyR') reset(true);
  });
  window.addEventListener('keyup', e => keys[e.code] = false);
  start.addEventListener('click', () => reset(true));

  function reset(begin){
    distance = 0; spawn = .4; bugs = [];
    player.x=220; player.y=roadY-player.h; player.vy=0; player.onGround=true; player.run=0;
    won=false; running=!!begin; overlay.classList.toggle('hidden', begin); overlay.classList.remove('success');
    status.textContent='STATUS: IN DEVELOPMENT';
    last=performance.now(); if(begin) requestAnimationFrame(loop);
  }

  function jump(){ if(player.onGround){ player.vy=-690; player.onGround=false; } }
  function rand(a,b){return a+Math.random()*(b-a)}

  function spawnBug(){
    const types=['GLITCH','NULL','404','CRASH'];
    bugs.push({x:W+50,y:roadY-34,w:38,h:34,s:rand(300,420),type:types[Math.floor(Math.random()*types.length)],bob:Math.random()*6});
  }

  function update(dt){
    const left=keys.ArrowLeft||keys.KeyA, right=keys.ArrowRight||keys.KeyD;
    if(left) player.x-=330*dt;
    if(right) player.x+=330*dt;
    if(keys.Space||keys.ArrowUp||keys.KeyW) jump();
    player.x=Math.max(100,Math.min(W-180,player.x));
    player.vy+=gravity*dt; player.y+=player.vy*dt;
    if(player.y+player.h>=roadY){player.y=roadY-player.h;player.vy=0;player.onGround=true;}
    player.run+=dt*10;
    distance+=dt*290;
    spawn-=dt;
    if(spawn<=0){spawn=rand(.65,1.25);spawnBug();}
    bugs.forEach(b=>{b.x-=b.s*dt;b.bob+=dt*6});
    bugs=bugs.filter(b=>b.x>-100);
    for(const b of bugs){
      if(player.x+player.w-7>b.x+6 && player.x+8<b.x+b.w-6 && player.y+player.h-7>b.y+4 && player.y+7<b.y+b.h){
        running=false; overlay.classList.remove('hidden'); overlay.classList.remove('success');
        overlay.querySelector('.game-over-kicker').textContent='BUILD FAILED';
        overlay.querySelector('h3').textContent='BUG DETECTED';
        overlay.querySelector('p').textContent='A critical bug crashed the build. Hit R or restart the run.';
        start.textContent='RESTART BUILD  →'; status.textContent='STATUS: CRASHED'; return;
      }
    }
    if(distance>=worldLength){
      running=false; won=true; overlay.classList.remove('hidden'); overlay.classList.add('success');
      overlay.querySelector('.game-over-kicker').textContent='BUILD SUBMITTED';
      overlay.querySelector('h3').textContent='SHIP IT!';
      overlay.querySelector('p').textContent='You dodged the bugs and submitted the build. Achievement unlocked: DEADLINE SURVIVOR.';
      start.textContent='RUN IT AGAIN  →'; status.textContent='STATUS: SUBMITTED';
    }
  }

  function draw(){
    const g=ctx;
    g.clearRect(0,0,W,H);
    // sky gradient
    const sky=g.createLinearGradient(0,0,0,H); sky.addColorStop(0,'#0a0613'); sky.addColorStop(.6,'#12091d'); sky.addColorStop(1,'#050208'); g.fillStyle=sky; g.fillRect(0,0,W,H);
    // purple grid horizon
    g.strokeStyle='#6f36a744'; g.lineWidth=1;
    for(let y=220;y<roadY;y+=26){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}
    for(let x=-W;x<W*2;x+=70){let xx=x-((distance*.18)%70);g.beginPath();g.moveTo(W/2+(xx-W/2)*.15,220);g.lineTo(xx,roadY);g.stroke();}
    // distant skyline
    for(let i=0;i<15;i++){const x=i*90-(distance*.1%90);const h=40+(i%4)*22;g.fillStyle=i%2?'#140b20':'#100819';g.fillRect(x,roadY-h,54,h);}
    // road
    g.fillStyle='#09060d';g.fillRect(0,roadY,W,H-roadY);
    g.strokeStyle='#b56cff55';g.lineWidth=2;g.beginPath();g.moveTo(0,roadY);g.lineTo(W,roadY);g.stroke();
    // road lane marks
    for(let x=-80;x<W+100;x+=140){const xx=x-((distance*.8)%140);g.fillStyle='#b56cff66';g.fillRect(xx,roadY+55,70,4);}
    // terminal when near end
    const finishX=W-140-(Math.max(0,worldLength-distance)*.04);
    if(distance>worldLength-900){
      g.save(); g.translate(finishX,roadY-115); g.shadowBlur=25; g.shadowColor='#b56cff'; g.fillStyle='#b56cff'; g.fillRect(-12,0,80,105); g.shadowBlur=0; g.fillStyle='#130820'; g.fillRect(0,12,56,70); g.fillStyle='#d7b7ff'; g.font='800 11px Inter'; g.textAlign='center'; g.fillText('SUBMIT',28,52); g.fillStyle='#8a42ff';g.fillRect(15,64,26,5); g.restore();
    }
    // bugs
    bugs.forEach(b=>drawBug(g,b));
    drawPlayer(g);
    // progress
    const p=Math.min(1,distance/worldLength); g.fillStyle='#160c22';g.fillRect(22,22,W-44,6);g.fillStyle='#b56cff';g.fillRect(22,22,(W-44)*p,6);g.fillStyle='#d9c5ed';g.font='800 10px Inter';g.textAlign='left';g.fillText('BUILD PROGRESS',22,17);g.textAlign='right';g.fillText(Math.floor(p*100)+'%',W-22,17);
    g.textAlign='left';g.fillStyle='#80698f';g.font='700 9px Inter';g.fillText('DODGE THE BUGS // REACH THE SUBMIT TERMINAL',22,H-18);
  }
  function drawPlayer(g){
    g.save();g.translate(player.x,player.y);
    const bob=player.onGround?Math.sin(player.run)*2:0;
    g.translate(0,bob);
    // shadow
    g.fillStyle='#0008';g.beginPath();g.ellipse(22,68,28,6,0,0,Math.PI*2);g.fill();
    // legs
    g.fillStyle='#b56cff';g.fillRect(8,44,10,20);g.fillRect(26,44,10,20);
    // torso
    g.fillStyle='#191024';g.strokeStyle='#b56cff';g.lineWidth=2;g.fillRect(5,18,32,31);g.strokeRect(5,18,32,31);
    // head
    g.fillStyle='#e9dcf7';g.fillRect(10,0,22,21);g.fillStyle='#2a1739';g.fillRect(10,0,22,7);
    // laptop
    g.fillStyle='#8a42ff';g.fillRect(-7,25,13,9);g.strokeStyle='#d7b7ff';g.strokeRect(-7,25,13,9);
    g.restore();
  }
  function drawBug(g,b){
    g.save();g.translate(b.x,b.y+Math.sin(b.bob)*3);g.shadowBlur=14;g.shadowColor='#ff4d8d';g.fillStyle='#ff4d8d';g.fillRect(5,7,28,25);g.shadowBlur=0;g.fillStyle='#160713';g.fillRect(10,12,18,12);g.fillStyle='#fff';g.fillRect(12,15,4,4);g.fillRect(22,15,4,4);g.strokeStyle='#ff8ab5';g.lineWidth=2;g.beginPath();g.moveTo(10,7);g.lineTo(2,0);g.moveTo(28,7);g.lineTo(36,0);g.stroke();g.fillStyle='#ffd1e3';g.font='800 6px Inter';g.textAlign='center';g.fillText(b.type,19,31);g.restore();
  }
  function loop(t){if(!running)return;const dt=Math.min(.033,(t-last)/1000);last=t;update(dt);draw();if(running)requestAnimationFrame(loop);}
  reset(false); draw();
})();
