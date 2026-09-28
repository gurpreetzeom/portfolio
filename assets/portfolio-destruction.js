(() => {
  const start = document.getElementById('destruction-start');
  if (!start) return;
  const toolbar = document.createElement('div');
  toolbar.className = 'destruction-toolbar';
  toolbar.hidden = true;
  toolbar.setAttribute('role', 'group');
  toolbar.setAttribute('aria-label', 'Portfolio destruction controls');
  toolbar.innerHTML = '<span class="destruction-instruction">Aim at the page · hold to fire</span><div class="destruction-weapons"><button type="button" data-tool="fire" aria-pressed="true">🔥 Fire</button><button type="button" data-tool="ice" aria-pressed="false">❄️ Freeze ray</button><button type="button" data-tool="shot" aria-pressed="false">🔫 Pistol</button><button type="button" data-tool="machine" aria-pressed="false">⚙️ Machine gun</button><button type="button" data-tool="rocket" aria-pressed="false">🚀 Rocket launcher</button></div><button type="button" class="destruction-sound" aria-pressed="true" aria-label="Mute weapon sounds">♪ On</button><button type="button" class="destruction-exit">Restore site ✕</button>';
  const launcher = document.createElement('div');
  launcher.className = 'destruction-launcher';
  launcher.hidden = true;
  launcher.tabIndex = 0;
  launcher.setAttribute('role', 'button');
  launcher.setAttribute('aria-label', 'Drag weapon to reposition it. Arrow keys also move it.');
  launcher.innerHTML = '<span class="destruction-gun-art" aria-hidden="true"></span><span class="destruction-launcher-name">FIRE</span><span class="destruction-drag-hint">DRAG TO MOVE</span>';
  const canvas = document.createElement('canvas');
  canvas.className = 'destruction-canvas';
  canvas.hidden = true;
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas, launcher, toolbar);
  const ctx = canvas.getContext('2d');
  const weapons = {
    fire: { name: 'FLAMETHROWER', color: '#ff7926', rate: 58, speed: 630 },
    ice: { name: 'FREEZE RAY', color: '#72dcff', rate: 68, speed: 930 },
    shot: { name: 'PISTOL', color: '#ffdc82', rate: 250, speed: 1300 },
    machine: { name: 'MACHINE GUN', color: '#ffda71', rate: 65, speed: 1250 },
    rocket: { name: 'ROCKET LAUNCHER', color: '#ff9b39', rate: 680, speed: 480 }
  };
  const gunShapes = {
    fire: '<rect x="5" y="23" width="23" height="24" rx="8" fill="#c84e35"/><path d="M20 24V14h18l9 11" fill="none" stroke="#ffa64b" stroke-width="5"/><path d="M22 25h45l12-6h20v13H78l-12-4H22z" fill="#526b77"/><rect x="88" y="21" width="17" height="9" rx="2" fill="#eeb443"/><path d="M43 30 36 55h17l8-23" fill="#294353"/><circle cx="15" cy="35" r="7" fill="#ffaf50"/>',
    ice: '<path d="M12 25h64l10-9h16v16H85l-10-5H12z" fill="#447386"/><path d="M40 30 36 56h17l8-26" fill="#27445a"/><rect x="15" y="17" width="35" height="9" rx="4" fill="#71dfff"/><circle cx="67" cy="26" r="7" fill="#a8f1ff"/><path d="m99 15 10 9-10 9" fill="#e7fbff"/>',
    shot: '<path d="M15 19h56l7 7h22v9H75l-5-6H51L43 56H28l5-27H15z" fill="#394d5b"/><rect x="22" y="17" width="44" height="5" rx="2" fill="#99aeb8"/><rect x="83" y="23" width="20" height="7" fill="#1b313f"/><path d="M43 31h16l-5 8H40z" fill="#d1a758"/>',
    machine: '<path d="M8 24h68v11H8z" fill="#425b6a"/><rect x="77" y="22" width="31" height="4" rx="2" fill="#a1b3b8"/><rect x="77" y="29" width="31" height="4" rx="2" fill="#a1b3b8"/><path d="M28 34 19 55h18l10-21" fill="#2c404d"/><path d="M49 34 55 57h18l-6-23" fill="#677c87"/><rect x="12" y="17" width="21" height="7" rx="2" fill="#8399a5"/>',
    rocket: '<rect x="7" y="17" width="87" height="22" rx="9" fill="#617984"/><rect x="24" y="19" width="56" height="18" rx="6" fill="#354d5b"/><path d="M92 16 111 28 92 40z" fill="#e9a750"/><path d="M35 39 30 56h18l7-17" fill="#2b434f"/><rect x="14" y="12" width="28" height="6" rx="2" fill="#9aaeb5"/><path d="M4 19v18" stroke="#d9a651" stroke-width="7"/>'
  };
  let audioContext, noiseBuffer, soundOn = true;
  function audio() {
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') audioContext.resume();
      if (!noiseBuffer) {
        noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * .5, audioContext.sampleRate);
        const channel = noiseBuffer.getChannelData(0);
        for (let i = 0; i < channel.length; i++) channel[i] = Math.random() * 2 - 1;
      }
      return audioContext;
    } catch { return null; }
  }
  function sound(type, hit = false) {
    if (!soundOn || !audioContext) return;
    const ac = audioContext, now = ac.currentTime;
    const gain = ac.createGain(); gain.connect(ac.destination);
    const length = hit ? .25 : type === 'rocket' ? .44 : type === 'fire' ? .13 : type === 'ice' ? .19 : .11;
    const volume = hit ? .045 : type === 'machine' ? .023 : type === 'fire' ? .012 : .04;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(.0001, now + length);
    if (type === 'fire' || type === 'machine' || hit) {
      const noise = ac.createBufferSource(); noise.buffer = noiseBuffer;
      const filter = ac.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.setValueAtTime(hit ? 330 : type === 'fire' ? 850 : 2200, now);
      noise.connect(filter).connect(gain); noise.start(now); noise.stop(now + length);
    } else {
      const oscillator = ac.createOscillator(); oscillator.type = type === 'ice' ? 'sine' : 'sawtooth';
      oscillator.frequency.setValueAtTime(type === 'ice' ? 780 : type === 'rocket' ? 180 : 260, now);
      oscillator.frequency.exponentialRampToValueAtTime(type === 'ice' ? 240 : type === 'rocket' ? 55 : 75, now + length);
      oscillator.connect(gain); oscillator.start(now); oscillator.stop(now + length);
    }
  }
  let mode = 'fire', active = false, firing = false, pointerId = null, aim = { x: 0, y: 0 };
  let dragging = null;
  let projectiles = [], sparks = [], lastShot = 0, previous = 0, frame = 0;
  const changed = new Set();
  const masks = new Map();
  function resize() {
    canvas.width = Math.round(innerWidth * devicePixelRatio);
    canvas.height = Math.round(innerHeight * devicePixelRatio);
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }
  function muzzle() {
    const rect = launcher.getBoundingClientRect();
    return { x: launcher.dataset.facing === 'left' ? rect.left + 4 : rect.right - 4, y: rect.top + rect.height * .37 };
  }
  function updateFacing() {
    const rect = launcher.getBoundingClientRect();
    launcher.dataset.facing = rect.left + rect.width / 2 > innerWidth / 2 ? 'left' : 'right';
  }
  function moveLauncher(x, y) {
    const rect = launcher.getBoundingClientRect();
    launcher.style.left = Math.max(4, Math.min(innerWidth - rect.width - 4, x)) + 'px';
    launcher.style.top = Math.max(4, Math.min(innerHeight - rect.height - 4, y)) + 'px';
    launcher.style.bottom = 'auto';
    updateFacing();
  }
  function setWeapon(type) {
    mode = type;
    launcher.querySelector('.destruction-gun-art').innerHTML = '<svg viewBox="0 0 116 64" role="img" aria-label="' + weapons[type].name + '"><path d="M6 40h103" stroke="#122a3b" stroke-width="2"/>' + gunShapes[type] + '</svg>';
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
    const target = node.closest('h1, h2, h3, h4, p, li, a, button, img, svg, .metric, .tag, .stat, .career-stop, .case, .card, .desk-note, .contact-positioning, .contact-action, .section-head');
    if (!target || target === launcher || toolbar.contains(target)) return null;
    const rect = target.getBoundingClientRect();
    return rect.width && rect.height ? target : null;
  }
  function impact(projectile) {
    const { x, y, type } = projectile;
    burst(x, y, type);
    if (type === 'rocket') sound(type, true);
    const target = targetAt(x, y);
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const radius = type === 'rocket' ? 75 : type === 'fire' ? 22 : type === 'ice' ? 26 : type === 'shot' ? 15 : 10;
    let state = masks.get(target);
    if (!state) {
      state = { holes: [], original: target.style.maskImage, composite: target.style.maskComposite, webkit: target.style.webkitMaskImage };
      masks.set(target, state);
    }
    state.holes.push({ x: x - rect.left, y: y - rect.top, radius });
    // Each transparent circle punches a local hole. Intersecting masks preserve earlier hits.
    const gradients = state.holes.map(h => `radial-gradient(circle ${h.radius}px at ${h.x}px ${h.y}px, transparent 90%, #000 100%)`);
    target.style.maskImage = gradients.join(',');
    target.style.webkitMaskImage = gradients.join(',');
    target.style.maskComposite = gradients.map(() => 'intersect').join(',');
    changed.add(target);
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
    sound(mode);
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
      // A short, flickering jet keeps the flame attached to the nozzle.
      for (let i = 0; i < 9; i++) {
        const t = p.progress * (i + 1) / 9;
        const fx = p.sx + (p.tx - p.sx) * t, fy = p.sy + (p.ty - p.sy) * t;
        ctx.globalAlpha = .18 + .48 * i / 9;
        ctx.fillStyle = i % 3 ? '#ff7a25' : '#ffe16b';
        ctx.beginPath(); ctx.arc(fx + (Math.random() - .5) * 12, fy + (Math.random() - .5) * 12, 4 + i * .55, 0, Math.PI * 2); ctx.fill();
      }
    } else if (p.type === 'rocket') {
      ctx.strokeStyle = '#ff9b39'; ctx.globalAlpha = .4; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(p.sx + (p.x-p.sx)*.78, p.sy + (p.y-p.sy)*.78); ctx.lineTo(p.x, p.y); ctx.stroke();
      ctx.globalAlpha = 1; ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.ty - p.sy, p.tx - p.sx));
      ctx.fillStyle = '#243949'; ctx.fillRect(-18, -6, 23, 12);
      ctx.fillStyle = '#f6a230'; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(2, -7); ctx.lineTo(2, 7); ctx.fill();
      ctx.fillStyle = '#ffdd68'; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-30, -5); ctx.lineTo(-30, 5); ctx.fill();
    } else {
      ctx.lineWidth = p.type === 'machine' ? 2 : 3;
      ctx.globalAlpha = .55; ctx.beginPath(); ctx.moveTo(p.x-(p.x-p.sx)*.22, p.y-(p.y-p.sy)*.22); ctx.lineTo(p.x, p.y); ctx.stroke();
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
    for (const node of changed) {
      const state = masks.get(node);
      node.style.maskImage = state.original;
      node.style.webkitMaskImage = state.webkit;
      node.style.maskComposite = state.composite;
    }
    changed.clear(); masks.clear(); projectiles = []; sparks = [];
    if (frame) cancelAnimationFrame(frame); frame = 0; previous = 0;
    ctx.clearRect(0, 0, innerWidth, innerHeight); start.focus();
  }
  start.addEventListener('click', () => {
    active = true; resize(); toolbar.hidden = launcher.hidden = canvas.hidden = false;
    document.body.classList.add('destruction-active'); setWeapon('fire'); updateFacing(); audio();
    toolbar.querySelector('[data-tool]').focus();
    frame = requestAnimationFrame(animate);
  });
  toolbar.addEventListener('click', event => {
    if (event.target.closest('.destruction-exit')) return restore();
    if (event.target.closest('.destruction-sound')) {
      soundOn = !soundOn;
      const button = toolbar.querySelector('.destruction-sound');
      button.textContent = soundOn ? '♪ On' : '♪ Off';
      button.setAttribute('aria-pressed', String(soundOn));
      button.setAttribute('aria-label', soundOn ? 'Mute weapon sounds' : 'Enable weapon sounds');
      if (soundOn) audio();
      return;
    }
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
