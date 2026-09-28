(() => {
  const start = document.getElementById('destruction-start');
  if (!start) return;
  const toolbar = document.createElement('div');
  toolbar.className = 'destruction-toolbar';
  toolbar.hidden = true;
  toolbar.setAttribute('role', 'group');
  toolbar.setAttribute('aria-label', 'Portfolio destruction controls');
  toolbar.innerHTML = '<span class="destruction-instruction">Aim at the page · hold to fire</span><div class="destruction-weapons"><button type="button" data-tool="fire" aria-pressed="true">🔥 Fire</button><button type="button" data-tool="ice" aria-pressed="false">❄️ Freeze ray</button><button type="button" data-tool="shot" aria-pressed="false">🔫 Pistol</button><button type="button" data-tool="machine" aria-pressed="false">⚙️ Machine gun</button><button type="button" data-tool="rocket" aria-pressed="false">🚀 Rocket launcher</button></div><button type="button" class="destruction-exit">Restore site ✕</button>';
  const launcher = document.createElement('div');
  launcher.className = 'destruction-launcher';
  launcher.hidden = true;
  launcher.tabIndex = 0;
  launcher.setAttribute('role', 'button');
  launcher.setAttribute('aria-label', 'Drag weapon to reposition it. Arrow keys also move it.');
  launcher.innerHTML = '<span class="destruction-launcher-icon">🔥</span><span class="destruction-launcher-name">FIRE</span><span class="destruction-drag-hint">DRAG TO MOVE</span>';
  const canvas = document.createElement('canvas');
  canvas.className = 'destruction-canvas';
  canvas.hidden = true;
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas, launcher, toolbar);
  const ctx = canvas.getContext('2d');
  const weapons = {
    fire: { icon: '🔥', name: 'FLAMETHROWER', color: '#ff7926', rate: 62, speed: 570, threshold: 4 },
    ice: { icon: '❄️', name: 'FREEZE RAY', color: '#72dcff', rate: 68, speed: 900, threshold: 4 },
    shot: { icon: '🔫', name: 'PISTOL', color: '#ffdc82', rate: 240, speed: 1100, threshold: 2 },
    machine: { icon: '⚙️', name: 'MACHINE GUN', color: '#ffda71', rate: 58, speed: 1050, threshold: 5 },
    rocket: { icon: '🚀', name: 'ROCKET LAUNCHER', color: '#ff9b39', rate: 600, speed: 410, threshold: 1 }
  };
  let mode = 'fire', active = false, firing = false, pointerId = null, aim = { x: 0, y: 0 };
  let dragging = null;
  let projectiles = [], sparks = [], damage = new WeakMap(), lastShot = 0, previous = 0, frame = 0;
  const changed = new Set();
  function resize() {
    canvas.width = Math.round(innerWidth * devicePixelRatio);
    canvas.height = Math.round(innerHeight * devicePixelRatio);
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }
  function muzzle() {
    const rect = launcher.getBoundingClientRect();
    return { x: rect.right - 12, y: rect.top + rect.height * .30 };
  }
  function moveLauncher(x, y) {
    const rect = launcher.getBoundingClientRect();
    launcher.style.left = Math.max(4, Math.min(innerWidth - rect.width - 4, x)) + 'px';
    launcher.style.top = Math.max(4, Math.min(innerHeight - rect.height - 4, y)) + 'px';
    launcher.style.bottom = 'auto';
  }
  function setWeapon(type) {
    mode = type;
    launcher.querySelector('.destruction-launcher-icon').textContent = weapons[type].icon;
    launcher.querySelector('.destruction-launcher-name').textContent = weapons[type].name;
    launcher.dataset.tool = type;
    toolbar.querySelectorAll('[data-tool]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.tool === type)));
    lastShot = 0;
  }
  function burst(x, y, type) {
    const palette = type === 'ice' ? ['#ecfdff','#9beaff','#35a8d6'] : type === 'fire' ? ['#ffdc57','#ff7426','#c93320','#34363b'] : type === 'rocket' ? ['#ffe27a','#ff782b','#dc3926','#37404b'] : ['#fff2bc','#8799a9','#263d4d'];
    const count = type === 'rocket' ? 85 : type === 'machine' ? 12 : 25;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2, speed = (type === 'rocket' ? 2 : 1) + Math.random() * (type === 'rocket' ? 11 : 5);
      sparks.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 18 + Math.random() * 24, max: 42, size: 1 + Math.random() * (type === 'rocket' ? 6 : 3), color: palette[Math.floor(Math.random() * palette.length)] });
    }
  }
  function targetAt(x, y) {
    const node = document.elementFromPoint(x, y);
    if (!node || !node.closest('main, header')) return null;
    const target = node.closest('article, .card, .case, .hero-panel, .career-stop, .skill, .contact-positioning, .contact-action, .section-head, .hero-copy, .hero-metrics, .desk-note, .stat, .career-chapter, h1, h2, h3, p, li, a, button, img');
    if (!target || target.classList.contains('destruction-hit')) return null;
    const rect = target.getBoundingClientRect();
    return rect.width && rect.height ? target : null;
  }
  function impact(projectile) {
    const { x, y, type } = projectile;
    burst(x, y, type);
    const target = targetAt(x, y);
    if (!target) return;
    const hits = (damage.get(target) || 0) + (type === 'rocket' ? 5 : 1);
    damage.set(target, hits);
    if (hits < weapons[type].threshold) {
      target.animate(type === 'ice' ? [{ filter: 'brightness(1)' }, { filter: 'brightness(1.6) drop-shadow(0 0 8px #69dafa)' }, { filter: 'brightness(1)' }] : [{ transform: 'translateX(0)' }, { transform: 'translateX(3px)' }, { transform: 'translateX(0)' }], { duration: 180 });
      return;
    }
    target.dataset.effect = type === 'ice' ? 'ice' : type === 'fire' ? 'fire' : 'shot';
    target.classList.add('destruction-hit');
    changed.add(target);
    setTimeout(() => { if (active && target.classList.contains('destruction-hit')) target.style.visibility = 'hidden'; }, 850);
  }
  function shoot(now) {
    if (now - lastShot < weapons[mode].rate) return;
    lastShot = now;
    const startPoint = muzzle();
    const target = { ...aim };
    const distance = Math.hypot(target.x - startPoint.x, target.y - startPoint.y);
    if (distance < 20) return;
    const duration = Math.max(130, distance / weapons[mode].speed * 1000);
    projectiles.push({ sx: startPoint.x, sy: startPoint.y, x: startPoint.x, y: startPoint.y, tx: target.x, ty: target.y, progress: 0, duration, type: mode, trail: [] });
    launcher.classList.remove('firing'); void launcher.offsetWidth; launcher.classList.add('firing');
  }
  function drawProjectile(p) {
    const config = weapons[p.type];
    ctx.save();
    ctx.strokeStyle = config.color;
    ctx.fillStyle = config.color;
    ctx.lineCap = 'round';
    if (p.type === 'ice') {
      ctx.globalAlpha = .65; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(p.sx, p.sy); ctx.lineTo(p.x, p.y); ctx.stroke();
      ctx.strokeStyle = '#e5fbff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (p.type === 'fire') {
      ctx.lineWidth = 12; ctx.globalAlpha = .28;
      ctx.beginPath(); ctx.moveTo(p.sx, p.sy); ctx.lineTo(p.x, p.y); ctx.stroke();
      ctx.globalAlpha = .85; ctx.lineWidth = 3; ctx.stroke();
    } else if (p.type === 'rocket') {
      ctx.strokeStyle = '#ff9b39'; ctx.globalAlpha = .55; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(p.sx, p.sy); ctx.lineTo(p.x, p.y); ctx.stroke();
      ctx.globalAlpha = 1; ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.ty - p.sy, p.tx - p.sx));
      ctx.fillStyle = '#243949'; ctx.fillRect(-18, -6, 23, 12);
      ctx.fillStyle = '#f6a230'; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(2, -7); ctx.lineTo(2, 7); ctx.fill();
      ctx.fillStyle = '#ffdd68'; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-30, -5); ctx.lineTo(-30, 5); ctx.fill();
    } else {
      ctx.lineWidth = p.type === 'machine' ? 2 : 3;
      ctx.globalAlpha = .55; ctx.beginPath(); ctx.moveTo(p.sx, p.sy); ctx.lineTo(p.x, p.y); ctx.stroke();
      ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(p.x, p.y, p.type === 'machine' ? 4 : 6, 0, Math.PI * 2); ctx.fill();
    }
    if (p.type === 'ice' || p.type === 'fire') {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.type === 'fire' ? 8 : 5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  function animate(now) {
    const dt = Math.min(50, now - (previous || now)); previous = now;
    if (!active) { frame = 0; return; }
    if (firing) shoot(now);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    projectiles = projectiles.filter(p => {
      p.progress = Math.min(1, p.progress + dt / p.duration);
      p.x = p.sx + (p.tx - p.sx) * p.progress;
      p.y = p.sy + (p.ty - p.sy) * p.progress;
      if (p.progress >= 1) { impact(p); return false; }
      drawProjectile(p); return true;
    });
    sparks = sparks.filter(p => p.life > 0);
    for (const p of sparks) {
      p.x += p.vx; p.y += p.vy; p.vy += .08; p.life--;
      ctx.globalAlpha = Math.min(1, p.life / 18); ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    frame = requestAnimationFrame(animate);
  }
  function stop() { firing = false; pointerId = null; launcher.classList.remove('firing'); }
  function restore() {
    stop(); active = false; document.body.classList.remove('destruction-active');
    dragging = null; launcher.classList.remove('dragging');
    toolbar.hidden = launcher.hidden = canvas.hidden = true;
    for (const node of changed) { node.style.visibility = ''; node.classList.remove('destruction-hit'); delete node.dataset.effect; }
    changed.clear(); damage = new WeakMap(); projectiles = []; sparks = [];
    if (frame) cancelAnimationFrame(frame); frame = 0; previous = 0;
    ctx.clearRect(0, 0, innerWidth, innerHeight); start.focus();
  }
  start.addEventListener('click', () => {
    active = true; resize(); toolbar.hidden = launcher.hidden = canvas.hidden = false;
    document.body.classList.add('destruction-active'); setWeapon('fire');
    toolbar.querySelector('[data-tool]').focus();
    frame = requestAnimationFrame(animate);
  });
  toolbar.addEventListener('click', event => {
    if (event.target.closest('.destruction-exit')) return restore();
    const button = event.target.closest('[data-tool]');
    if (button) { stop(); setWeapon(button.dataset.tool); }
  });
  launcher.addEventListener('pointerdown', event => {
    if (!active || !event.isPrimary) return;
    event.preventDefault(); stop();
    const rect = launcher.getBoundingClientRect();
    dragging = { id: event.pointerId, dx: event.clientX - rect.left, dy: event.clientY - rect.top };
    launcher.classList.add('dragging');
    launcher.setPointerCapture(event.pointerId);
  });
  launcher.addEventListener('pointermove', event => {
    if (dragging?.id === event.pointerId) moveLauncher(event.clientX - dragging.dx, event.clientY - dragging.dy);
  });
  function endDrag(event) {
    if (dragging?.id !== event.pointerId) return;
    dragging = null; launcher.classList.remove('dragging');
  }
  launcher.addEventListener('pointerup', endDrag);
  launcher.addEventListener('pointercancel', endDrag);
  launcher.addEventListener('lostpointercapture', endDrag);
  launcher.addEventListener('keydown', event => {
    const offsets = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] };
    if (!active || !offsets[event.key]) return;
    event.preventDefault();
    const rect = launcher.getBoundingClientRect(), [dx, dy] = offsets[event.key];
    moveLauncher(rect.left + dx, rect.top + dy);
  });
  document.addEventListener('pointerdown', event => {
    if (!active || !event.isPrimary || toolbar.contains(event.target) || launcher.contains(event.target) || !event.target.closest('main, header')) return;
    event.preventDefault(); event.stopPropagation();
    pointerId = event.pointerId; aim = { x: event.clientX, y: event.clientY }; firing = true;
    shoot(performance.now());
  }, true);
  document.addEventListener('pointermove', event => {
    if (active && firing && event.pointerId === pointerId) aim = { x: event.clientX, y: event.clientY };
  }, true);
  document.addEventListener('pointerup', event => { if (event.pointerId === pointerId) stop(); }, true);
  document.addEventListener('pointercancel', event => { if (event.pointerId === pointerId) stop(); }, true);
  addEventListener('blur', stop);
  document.addEventListener('click', event => {
    if (active && !toolbar.contains(event.target) && event.target !== start) { event.preventDefault(); event.stopPropagation(); }
  }, true);
  document.addEventListener('keydown', event => { if (active && event.key === 'Escape') restore(); });
  addEventListener('resize', () => {
    if (!active) return;
    resize();
    const rect = launcher.getBoundingClientRect();
    if (launcher.style.top) moveLauncher(rect.left, rect.top);
  });
})();
