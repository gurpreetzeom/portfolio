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
  launcher.innerHTML = '<span class="destruction-gun-art" aria-hidden="true"></span>';
  const canvas = document.createElement('canvas');
  canvas.className = 'destruction-canvas';
  canvas.hidden = true;
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas, launcher, toolbar);
  const ctx = canvas.getContext('2d');
  const weapons = {
    fire: { name: 'FLAMETHROWER', color: '#ff7926', rate: 58, speed: 630, nozzle: [105, 26] },
    ice: { name: 'FREEZE RAY', color: '#72dcff', rate: 68, speed: 930, nozzle: [110, 24] },
    shot: { name: 'PISTOL', color: '#ffdc82', rate: 250, speed: 1300, nozzle: [103, 27] },
    machine: { name: 'MACHINE GUN', color: '#ffda71', rate: 65, speed: 1250, nozzle: [108, 27] },
    rocket: { name: 'ROCKET LAUNCHER', color: '#ff9b39', rate: 680, speed: 480, nozzle: [111, 28] }
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
  const impactElements = new Set();
  let lastVisual = 0;
  function resize() {
    // 100vh can be taller than the visible mobile viewport when browser chrome is shown.
    // Match the bitmap and its displayed CSS box to the same measured viewport.
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    canvas.width = Math.round(innerWidth * devicePixelRatio);
    canvas.height = Math.round(innerHeight * devicePixelRatio);
    ctx.setTransform(canvas.width / innerWidth, 0, 0, canvas.height / innerHeight, 0, 0);
  }
  function toCanvas(x, y) {
    const rect = canvas.getBoundingClientRect();
    return { x: (x - rect.left) * innerWidth / rect.width, y: (y - rect.top) * innerHeight / rect.height };
  }
  function toViewport(x, y) {
    const rect = canvas.getBoundingClientRect();
    return { x: rect.left + x * rect.width / innerWidth, y: rect.top + y * rect.height / innerHeight };
  }
  function muzzle() {
    const marker = launcher.querySelector('.destruction-muzzle-anchor');
    const rect = marker.getBoundingClientRect();
    return toCanvas(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }
  function updateFacing() {
    const rect = launcher.getBoundingClientRect();
    launcher.dataset.facing = rect.left + rect.width / 2 > innerWidth / 2 ? 'left' : 'right';
    updateAim();
  }
  function updateAim() {
    const art = launcher.querySelector('.destruction-gun-art');
    // The grip remains anchored while the barrel tracks the pointer.
    // Use the untransformed launcher box, as the art's rect expands when tilted.
    const base = launcher.getBoundingClientRect();
    const pivotX = base.left + base.width * .39;
    const pivotY = base.top + base.height * .65;
    const dx = aim.x - pivotX, dy = aim.y - pivotY;
    if (Math.hypot(dx, dy) < 12) return;
    const left = dx < 0;
    launcher.dataset.facing = left ? 'left' : 'right';
    let angle = Math.atan2(dy, dx) - (left ? Math.PI : 0);
    if (angle < -Math.PI) angle += Math.PI * 2;
    art.style.setProperty('--aim-angle', angle + 'rad');
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
    const [nx, ny] = weapons[type].nozzle;
    launcher.querySelector('.destruction-gun-art').innerHTML = '<svg viewBox="0 0 116 64" role="img" aria-label="' + weapons[type].name + '"><path d="M6 40h103" stroke="#122a3b" stroke-width="2"/>' + gunShapes[type] + '<circle class="destruction-muzzle-anchor" cx="' + nx + '" cy="' + ny + '" r="1" fill="transparent"/></svg>';
    launcher.setAttribute('aria-label', weapons[type].name + '. Drag to reposition, or use arrow keys.');
    launcher.dataset.tool = type;
    toolbar.querySelectorAll('[data-tool]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.tool === type)));
    lastShot = 0;
    updateAim();
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
    const target = node.closest('h1, h2, h3, h4, p, li, a, button, img, svg, .metric, .tag, .stat, .career-stop, .case, .card, .desk-note, .contact-positioning, .contact-action, .section-head, .quote, .skill, section');
    if (!target || target === launcher || toolbar.contains(target)) return null;
    const rect = target.getBoundingClientRect();
    return rect.width && rect.height ? target : null;
  }
  function visualImpact(x, y, type, radius, target) {
    const effect = document.createElement('div');
    effect.className = 'destruction-impact destruction-impact-' + type;
    effect.style.left = x + 'px'; effect.style.top = y + 'px';
    effect.style.setProperty('--impact-size', radius * (type === 'fire' ? 3 : 2) + 'px');
    if (type === 'fire') {
      for (let i = 0; i < 4; i++) {
        const flame = document.createElement('b');
        flame.className = 'destruction-flame';
        flame.style.setProperty('--offset', (i - 1.5) * 12 + 'px');
        flame.style.setProperty('--delay', i * -0.11 + 's');
        effect.append(flame);
      }
      for (let i = 0; i < 5; i++) {
        const smoke = document.createElement('span');
        smoke.className = 'destruction-smoke';
        smoke.style.setProperty('--drift', (i - 2) * 17 + 'px');
        smoke.style.setProperty('--delay', i * .16 + 's');
        effect.append(smoke);
      }
    } else if (type === 'shot' || type === 'machine' || type === 'rocket') {
      const color = getComputedStyle(target).backgroundColor;
      effect.style.setProperty('--tile-color', color === 'rgba(0, 0, 0, 0)' || color === 'transparent' ? '#d9e4eb' : color);
      for (let i = 0; i < (type === 'rocket' ? 16 : 9); i++) {
        const shard = document.createElement('i');
        const angle = Math.PI * 2 * i / (type === 'rocket' ? 16 : 9);
        shard.style.setProperty('--dx', Math.round(Math.cos(angle) * (25 + Math.random() * radius)) + 'px');
        shard.style.setProperty('--dy', Math.round(45 + Math.random() * (radius + 65)) + 'px');
        shard.style.setProperty('--turn', Math.round((Math.random() - .5) * 260) + 'deg');
        shard.style.left = (Math.random() * 60 - 30) + '%';
        shard.style.top = (Math.random() * 50 - 25) + '%';
        effect.append(shard);
      }
    }
    document.body.append(effect);
    impactElements.add(effect);
    setTimeout(() => { effect.remove(); impactElements.delete(effect); }, type === 'fire' ? 1950 : 950);
  }
  function punchHole(target, localX, localY, radius, type) {
    if (!active || !target.isConnected) return;
    let state = masks.get(target);
    if (!state) {
      state = { holes: [], original: target.style.maskImage, composite: target.style.maskComposite, webkit: target.style.webkitMaskImage };
      masks.set(target, state);
    }
    if (state.holes.some(h => Math.hypot(h.x - localX, h.y - localY) < radius * .45)) return;
    state.holes.push({ x: localX, y: localY, radius });
    if (type === 'fire') {
      // Uneven ash edges read more like scorched material than a circular punch-out.
      for (let i = 0; i < 4; i++) {
        const angle = i * Math.PI / 2 + .35;
        state.holes.push({ x: localX + Math.cos(angle) * radius * .72, y: localY + Math.sin(angle) * radius * .72, radius: radius * (.36 + i % 2 * .1) });
      }
    }
    const gradients = state.holes.map(h => `radial-gradient(circle ${h.radius}px at ${h.x}px ${h.y}px, transparent 90%, #000 100%)`);
    target.style.maskImage = gradients.join(',');
    target.style.webkitMaskImage = gradients.join(',');
    target.style.maskComposite = gradients.map(() => 'intersect').join(',');
    changed.add(target);
  }
  function impact(projectile) {
    const { x, y, type } = projectile;
    burst(x, y, type);
    if (type === 'rocket') sound(type, true);
    const point = toViewport(x, y);
    const target = targetAt(point.x, point.y);
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const localX = point.x - rect.left, localY = point.y - rect.top;
    const radius = type === 'rocket' ? 75 : type === 'fire' ? 22 : type === 'ice' ? 26 : type === 'shot' ? 15 : 10;
    if (performance.now() - lastVisual > (type === 'fire' || type === 'ice' ? 100 : 35)) {
      visualImpact(point.x, point.y, type, radius, target);
      lastVisual = performance.now();
    }
    setTimeout(() => punchHole(target, localX, localY, radius, type), type === 'fire' ? 800 : type === 'ice' ? 470 : 170);
  }
  function shoot(now) {
    if (now - lastShot < weapons[mode].rate) return;
    lastShot = now;
    const startPoint = muzzle();
    const target = toCanvas(aim.x, aim.y);
    const distance = Math.hypot(target.x - startPoint.x, target.y - startPoint.y);
    if (distance < 20) return;
    const duration = Math.max(130, distance / weapons[mode].speed * 1000);
    projectiles.push({ sx: startPoint.x, sy: startPoint.y, x: startPoint.x, y: startPoint.y, tx: target.x, ty: target.y, progress: 0, duration, type: mode, trail: [] });
    // The first visible flash is anchored to the actual barrel tip.
    sparks.push({ x: startPoint.x, y: startPoint.y, vx: 0, vy: 0, life: 5, max: 5, size: mode === 'rocket' ? 8 : 4, color: weapons[mode].color });
    launcher.classList.remove('firing'); void launcher.offsetWidth; launcher.classList.add('firing');
    sound(mode);
  }
  function drawFlameStream(p) {
    const length = Math.hypot(p.x - p.sx, p.y - p.sy);
    if (length < 3) return;
    const time = performance.now() * .017;
    const width = Math.min(innerWidth < 620 ? 18 : 30, 7 + length * .065);
    ctx.save();
    ctx.translate(p.sx, p.sy);
    ctx.rotate(Math.atan2(p.y - p.sy, p.x - p.sx));
    // Three uneven, flowing silhouettes form a hot core inside a turbulent outer jet.
    for (const layer of [
      { scale: 1.25, start: '#b8270d', middle: '#f25a16', end: '#ed4a13', alpha: .62, blur: 16 },
      { scale: .83, start: '#ff9b25', middle: '#ffb328', end: '#ff771a', alpha: .92, blur: 9 },
      { scale: .38, start: '#fff5ba', middle: '#ffe16b', end: '#ffad33', alpha: .88, blur: 5 }
    ]) {
      const gradient = ctx.createLinearGradient(0, 0, length, 0);
      gradient.addColorStop(0, layer.start);
      gradient.addColorStop(.55, layer.middle);
      gradient.addColorStop(1, layer.end);
      ctx.fillStyle = gradient;
      ctx.globalAlpha = layer.alpha;
      ctx.shadowColor = layer.middle;
      ctx.shadowBlur = layer.blur;
      ctx.beginPath();
      const steps = Math.max(8, Math.ceil(length / 13));
      for (let side = 1; side >= -1; side -= 2) {
        for (let i = side === 1 ? 0 : steps; side === 1 ? i <= steps : i >= 0; i += side) {
          const t = i / steps;
          const envelope = Math.min(1, .25 + t * 1.65) * Math.pow(1 - t, .43);
          const flicker = Math.sin(t * 30 - time * 2 + side) * .22 + Math.sin(t * 67 + time * 1.3) * .12;
          const edge = width * layer.scale * envelope * (1 + flicker);
          const drift = Math.sin(t * 18 - time) * width * .13 * t;
          const y = drift + side * Math.max(i === 0 ? 3 : 0, edge);
          if (side === 1 && i === 0) ctx.moveTo(0, y);
          else ctx.lineTo(length * t, y);
        }
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    for (let i = 0; i < Math.min(10, length / 24); i++) {
      const t = (i / 10 + time * .025) % 1;
      const y = Math.sin(i * 5.2 + time) * width * t;
      ctx.globalAlpha = .7 * (1 - t);
      ctx.fillStyle = i % 2 ? '#ffaf35' : '#ffdc69';
      ctx.beginPath(); ctx.arc(length * t, y, 1.5 + 2.5 * t, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  function drawProjectile(p) {
    const config = weapons[p.type];
    ctx.save();
    ctx.strokeStyle = config.color;
    ctx.fillStyle = config.color;
    ctx.lineCap = 'round';
    // Keep the visible trail connected to the SVG barrel throughout flight.
    ctx.beginPath(); ctx.arc(p.sx, p.sy, p.type === 'rocket' ? 6 : 3, 0, Math.PI * 2); ctx.fill();
    if (p.type === 'ice') {
      ctx.globalAlpha = .65; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(p.sx, p.sy); ctx.lineTo(p.x, p.y); ctx.stroke();
      ctx.strokeStyle = '#e5fbff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (p.type === 'fire') {
      drawFlameStream(p);
    } else if (p.type === 'rocket') {
      ctx.strokeStyle = '#ff9b39'; ctx.globalAlpha = .35; ctx.lineWidth = 5;
      ctx.setLineDash([10, 7]);
      ctx.beginPath(); ctx.moveTo(p.sx, p.sy); ctx.lineTo(p.x, p.y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1; ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.ty - p.sy, p.tx - p.sx));
      ctx.fillStyle = '#243949'; ctx.fillRect(-18, -6, 23, 12);
      ctx.fillStyle = '#f6a230'; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(2, -7); ctx.lineTo(2, 7); ctx.fill();
      ctx.fillStyle = '#ffdd68'; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-30, -5); ctx.lineTo(-30, 5); ctx.fill();
    } else {
      ctx.lineWidth = p.type === 'machine' ? 2 : 3;
      ctx.globalAlpha = .5; ctx.beginPath(); ctx.moveTo(p.sx, p.sy); ctx.lineTo(p.x, p.y); ctx.stroke();
      ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(p.x, p.y, p.type === 'machine' ? 4 : 6, 0, Math.PI * 2); ctx.fill();
    }
    if (p.type === 'ice') {
      ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  function animate(now) {
    const dt = Math.min(50, now - (previous || now)); previous = now;
    if (!active) { frame = 0; return; }
    if (firing) shoot(now);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    let flameDrawn = false;
    projectiles = projectiles.filter(p => {
      // A beam remains visually attached if the visitor drags the gun while firing.
      const origin = muzzle();
      p.sx = origin.x; p.sy = origin.y;
      p.progress = Math.min(1, p.progress + dt / p.duration);
      p.x = p.sx + (p.tx - p.sx) * p.progress;
      p.y = p.sy + (p.ty - p.sy) * p.progress;
      if (p.progress >= 1) { impact(p); return false; }
      if (p.type !== 'fire' || !flameDrawn) {
        drawProjectile(p);
        if (p.type === 'fire') flameDrawn = true;
      }
      return true;
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
    impactElements.forEach(effect => effect.remove()); impactElements.clear();
    if (frame) cancelAnimationFrame(frame); frame = 0; previous = 0;
    ctx.clearRect(0, 0, innerWidth, innerHeight); start.focus();
  }
  start.addEventListener('click', () => {
    active = true; resize(); toolbar.hidden = launcher.hidden = canvas.hidden = false;
    aim = { x: innerWidth - 20, y: innerHeight - 18 };
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
    pointerId = event.pointerId; aim = { x: event.clientX, y: event.clientY }; updateAim(); firing = true;
    shoot(performance.now());
  }, true);
  document.addEventListener('pointermove', event => {
    if (active && firing && event.pointerId === pointerId) {
      aim = { x: event.clientX, y: event.clientY };
      updateAim();
    } else if (active && !dragging && event.pointerType === 'mouse' && !toolbar.contains(event.target) && !launcher.contains(event.target)) {
      aim = { x: event.clientX, y: event.clientY };
      updateAim();
    }
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
