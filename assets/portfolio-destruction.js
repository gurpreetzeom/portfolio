(() => {
  const start = document.getElementById('destruction-start');
  if (!start) return;
  const toolbar = document.createElement('div');
  toolbar.className = 'destruction-toolbar';
  toolbar.hidden = true;
  toolbar.setAttribute('role', 'group');
  toolbar.setAttribute('aria-label', 'Portfolio destruction controls');
  toolbar.innerHTML = '<span>Pick a tool, then tap the page</span><button type="button" data-tool="fire" aria-pressed="true">🔥 Burn</button><button type="button" data-tool="ice" aria-pressed="false">❄️ Freeze</button><button type="button" data-tool="shot" aria-pressed="false">🎯 Shoot</button><button type="button" class="destruction-exit">Restore site ✕</button>';
  const canvas = document.createElement('canvas');
  canvas.className = 'destruction-canvas';
  canvas.hidden = true;
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(toolbar, canvas);
  const ctx = canvas.getContext('2d');
  let mode = 'fire', active = false, particles = [], frame = 0;
  const changed = new Set();
  function resize() { canvas.width = innerWidth * devicePixelRatio; canvas.height = innerHeight * devicePixelRatio; ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); }
  function animate() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    particles = particles.filter(p => p.life > 0);
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.life--;
      ctx.globalAlpha = Math.min(1, p.life / 22);
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    frame = particles.length ? requestAnimationFrame(animate) : 0;
  }
  function burst(x, y) {
    const colors = mode === 'fire' ? ['#ffbd39','#f06427','#d12f19','#34302e'] : mode === 'ice' ? ['#e9fbff','#8ce2ff','#3e9ec9'] : ['#172e3e','#6f8797','#fff5d7'];
    for (let i = 0; i < 45; i++) {
      const a = Math.random() * Math.PI * 2, speed = 1 + Math.random() * 7;
      particles.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-(mode==='fire'?2:0),gravity:mode==='fire' ? -.025 : .15,life:22+Math.random()*30,size:1+Math.random()*4,color:colors[Math.floor(Math.random()*colors.length)]});
    }
    if (!frame) frame = requestAnimationFrame(animate);
  }
  function targetFrom(node) {
    const root = node.closest('main, header');
    if (!root) return null;
    const target = node.closest('article, .card, .hero-panel, .career-stop, .skill, .contact-positioning, .contact-action, .section-head, .hero-copy, .hero-metrics, .current-chapter, h1, h2, h3, p, li, a, button, img');
    if (!target || target === root || target.classList.contains('destruction-hit')) return null;
    const box = target.getBoundingClientRect();
    return box.width > 0 && box.height > 0 ? target : null;
  }
  function hit(event) {
    if (!active || toolbar.contains(event.target)) return;
    const target = targetFrom(event.target);
    if (!target) return;
    event.preventDefault(); event.stopPropagation();
    const box = target.getBoundingClientRect();
    burst(event.clientX, event.clientY);
    target.dataset.effect = mode;
    target.classList.add('destruction-hit');
    changed.add(target);
    setTimeout(() => { if (active && target.classList.contains('destruction-hit')) target.style.visibility = 'hidden'; }, 850);
  }
  function restore() {
    active = false; document.body.classList.remove('destruction-active');
    toolbar.hidden = canvas.hidden = true;
    for (const node of changed) { node.style.visibility = ''; node.classList.remove('destruction-hit'); delete node.dataset.effect; }
    changed.clear(); particles = []; ctx.clearRect(0, 0, innerWidth, innerHeight);
    start.focus();
  }
  start.addEventListener('click', () => { active = true; resize(); toolbar.hidden = canvas.hidden = false; document.body.classList.add('destruction-active'); toolbar.querySelector('[data-tool]').focus(); });
  toolbar.addEventListener('click', event => {
    if (event.target.closest('.destruction-exit')) return restore();
    const button = event.target.closest('[data-tool]'); if (!button) return;
    mode = button.dataset.tool;
    toolbar.querySelectorAll('[data-tool]').forEach(el => el.setAttribute('aria-pressed', String(el === button)));
  });
  document.addEventListener('click', hit, true);
  document.addEventListener('keydown', event => { if (active && event.key === 'Escape') restore(); });
  addEventListener('resize', () => { if (active) resize(); });
})();
