/* Nawabi Night — shared behaviour for every page */
(function () {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;

  /* ---------- tiny safe storage (scores, disclaimer) ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('rr:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('rr:' + k, JSON.stringify(v)); } catch (e) {} }
  };
  window.RR = { store, reduce };

  /* ---------- page transition: arch doors ---------- */
  const curtain = document.createElement('div');
  curtain.className = 'curtain opening';
  curtain.setAttribute('aria-hidden', 'true');
  curtain.innerHTML = '<i></i><i></i>';
  document.body.appendChild(curtain);
  setTimeout(() => curtain.classList.remove('opening'), 800);
  if (!reduce) {
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel')) return;
      e.preventDefault();
      curtain.classList.add('closing');
      setTimeout(() => { location.href = href; }, 520);
    });
    addEventListener('pageshow', ev => { if (ev.persisted) curtain.classList.remove('closing'); });
  }

  /* ---------- mobile nav ---------- */
  const nav = document.querySelector('.nav');
  const mb = document.querySelector('.menu-btn');
  if (nav && mb) mb.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    mb.setAttribute('aria-expanded', open);
    mb.textContent = open ? 'Close' : 'Menu';
  });

  /* ---------- scroll progress ---------- */
  const bar = document.createElement('div'); bar.className = 'progress'; document.body.appendChild(bar);
  const onScroll = () => { const h = root.scrollHeight - innerHeight; bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`; };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- lantern that follows the pointer ---------- */
  if (fine && !reduce) {
    const l = document.createElement('div'); l.className = 'lantern'; document.body.appendChild(l);
    let x = innerWidth / 2, y = innerHeight / 3, tx = x, ty = y;
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; });
    (function f() { x += (tx - x) * .12; y += (ty - y) * .12; l.style.transform = `translate(${x}px,${y}px)`; requestAnimationFrame(f); })();
  }

  /* ---------- split headline letters ---------- */
  let ci = 0;
  document.querySelectorAll('[data-split]').forEach(el => {
    const label = el.textContent.trim();
    el.setAttribute('aria-label', label);
    const nodes = [...el.childNodes]; el.textContent = '';
    nodes.forEach(n => {
      const wrapCls = n.nodeType === 1 ? n.className : '';
      const text = n.textContent;
      text.split(/(\s+)/).forEach(word => {
        if (!word) return;
        if (/^\s+$/.test(word)) { el.appendChild(document.createTextNode(' ')); return; }
        const w = document.createElement('span'); w.className = 'w ' + wrapCls; w.setAttribute('aria-hidden', 'true');
        [...word].forEach(ch => { const s = document.createElement('span'); s.className = 'c'; s.style.setProperty('--i', ci++); s.textContent = ch; w.appendChild(s); });
        el.appendChild(w);
      });
    });
    el.classList.add('split');
  });

  /* ---------- reveal on scroll (only for things below the fold) ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.remove('pending'); io.unobserve(e.target); } }), { threshold: .1 });
  document.querySelectorAll('.reveal').forEach((el, k) => {
    if (el.getBoundingClientRect().top > innerHeight * .95) { el.classList.add('pending'); el.style.transitionDelay = (k % 3) * 90 + 'ms'; io.observe(el); }
  });

  /* ---------- arch spotlight + tilt ---------- */
  document.querySelectorAll('.arch, .tilt').forEach(c => {
    c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      c.style.setProperty('--mx', px * 100 + '%'); c.style.setProperty('--my', py * 100 + '%');
      if (!reduce && fine) c.style.transform = `perspective(900px) rotateX(${(.5 - py) * 7}deg) rotateY(${(px - .5) * 9}deg) translateY(-6px)`;
    });
    c.addEventListener('pointerleave', () => { c.style.transform = ''; });
  });

  /* ---------- magnetic buttons ---------- */
  if (fine && !reduce) document.querySelectorAll('.magnet').forEach(b => {
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.setProperty('--x', (e.clientX - r.left - r.width / 2) * .25 + 'px'); b.style.setProperty('--y', (e.clientY - r.top - r.height / 2) * .35 + 'px'); });
    b.addEventListener('pointerleave', () => { b.style.setProperty('--x', '0px'); b.style.setProperty('--y', '0px'); });
  });

  /* ---------- scalloped arch dividers that draw on scroll ---------- */
  document.querySelectorAll('svg.arches-divider').forEach(svg => {
    const N = +(svg.dataset.n || 12), W = 1200, w = W / N; let html = '';
    for (let k = 0; k < N; k++) {
      const x = k * w, m = x + w / 2;
      const d = `M${x + 6} 120 V64 Q${x + 6} 34 ${m} 14 Q${x + w - 6} 34 ${x + w - 6} 64 V120`;
      html += `<path class="fill" d="${d} Z"/><path class="ln" d="${d}"/>`;
      html += `<path class="ln" style="opacity:.35" d="M${x + 20} 120 V76 Q${x + 20} 52 ${m} 36 Q${x + w - 20} 52 ${x + w - 20} 76 V120"/>`;
    }
    svg.setAttribute('viewBox', '0 0 1200 120'); svg.setAttribute('preserveAspectRatio', 'none'); svg.innerHTML = html;
    const ps = [...svg.querySelectorAll('.ln')];
    ps.forEach(p => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = reduce ? 0 : L; p.dataset.l = L; });
    if (reduce) return;
    const draw = () => {
      const r = svg.getBoundingClientRect(); const prog = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight * .6)));
      ps.forEach((p, k) => { const loc = Math.min(1, Math.max(0, prog * 1.5 - (k / ps.length) * .5)); p.style.strokeDashoffset = p.dataset.l * (1 - loc); });
    };
    addEventListener('scroll', draw, { passive: true }); draw();
  });

  /* ---------- Bar Council disclaimer (non-blocking bar) ---------- */
  const seen = (() => { try { return sessionStorage.getItem('rr:disc') === '1'; } catch (e) { return false; } })();
  if (!seen && !document.body.dataset.noDisclaimer) {
    const d = document.createElement('div'); d.className = 'disclaimer'; d.setAttribute('role', 'region'); d.setAttribute('aria-label', 'Disclaimer');
    d.innerHTML = '<p>Under the Bar Council of India rules, advocates may not advertise or solicit work. This site shares information about Rishabh Raj at your request and is not legal advice.</p><button class="btn small solid" type="button">I understand</button>';
    document.body.appendChild(d);
    d.querySelector('button').addEventListener('click', () => { try { sessionStorage.setItem('rr:disc', '1'); } catch (e) {} d.animate([{ transform: 'none' }, { transform: 'translateY(110%)' }], { duration: 400, easing: 'ease-in' }).onfinish = () => d.remove(); });
  }

  /* ---------- Lucknow night sky: skyline, kites, lanterns ---------- */
  document.querySelectorAll('canvas.sky').forEach(cv => skyline(cv));

  function skyline(cv) {
    const ctx = cv.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    let W = 0, H = 0, layers = [], stars = [], kites = [], embers = [];
    const variant = cv.dataset.variant || 'gate';
    let mx = 0, my = 0, sy = 0;

    function makeLayer(color, seed, fn) {
      const c = document.createElement('canvas'); c.width = (W + 160) * dpr; c.height = H * dpr;
      const g = c.getContext('2d'); g.scale(dpr, dpr); g.fillStyle = color; fn(g, seed); return c;
    }
    function rnd(s) { let x = Math.sin(s) * 10000; return x - Math.floor(x); }
    function dome(g, cx, base, r, drum) {
      g.fillRect(cx - r * .9, base - drum, r * 1.8, drum);
      g.beginPath(); g.moveTo(cx - r, base - drum);
      g.bezierCurveTo(cx - r * 1.15, base - drum - r * 1.1, cx - r * .2, base - drum - r * 1.35, cx, base - drum - r * 1.7);
      g.bezierCurveTo(cx + r * .2, base - drum - r * 1.35, cx + r * 1.15, base - drum - r * 1.1, cx + r, base - drum);
      g.fill();
      g.fillRect(cx - 1.2, base - drum - r * 1.7 - r * .55, 2.4, r * .55);
      g.beginPath(); g.arc(cx, base - drum - r * 1.7 - r * .25, r * .09 + 1, 0, 7); g.fill();
    }
    function minaret(g, cx, base, h, w) {
      g.fillRect(cx - w / 2, base - h, w, h);
      g.fillRect(cx - w * .8, base - h * .62, w * 1.6, 3);
      g.fillRect(cx - w * .8, base - h * .9, w * 1.6, 3);
      dome(g, cx, base - h, w * .75, 2);
    }
    function gate(g, cx, base, s) {
      // Rumi Darwaza-like gateway: wide body, tall central arch, crown kiosk
      const w = 260 * s, h = 170 * s;
      g.fillRect(cx - w / 2, base - h, w, h);
      // stepped flanks
      g.fillRect(cx - w / 2 - 50 * s, base - h * .55, 50 * s, h * .55);
      g.fillRect(cx + w / 2, base - h * .55, 50 * s, h * .55);
      minaret(g, cx - w / 2 - 50 * s, base, h * .85, 12 * s);
      minaret(g, cx + w / 2 + 50 * s, base, h * .85, 12 * s);
      // crown: cusped top
      g.beginPath(); g.moveTo(cx - w / 2, base - h);
      const n = 9; for (let i = 0; i <= n; i++) { const x = cx - w / 2 + (w / n) * i; const yy = base - h - Math.sin((i / n) * Math.PI) * 60 * s; g.lineTo(x, yy - (i % 2 ? 0 : 10 * s)); }
      g.lineTo(cx + w / 2, base - h); g.fill();
      // kiosk on top
      g.fillRect(cx - 18 * s, base - h - 90 * s, 36 * s, 30 * s);
      dome(g, cx, base - h - 90 * s, 20 * s, 4 * s);
      // cut the arch
      g.save(); g.globalCompositeOperation = 'destination-out';
      const aw = 92 * s, ah = 140 * s; g.beginPath(); g.moveTo(cx - aw / 2, base);
      g.lineTo(cx - aw / 2, base - ah * .55); g.quadraticCurveTo(cx - aw / 2, base - ah * .95, cx, base - ah);
      g.quadraticCurveTo(cx + aw / 2, base - ah * .95, cx + aw / 2, base - ah * .55); g.lineTo(cx + aw / 2, base); g.fill();
      // small side niches
      [-1, 1].forEach(sd => { const nx = cx + sd * 88 * s; g.beginPath(); g.moveTo(nx - 16 * s, base - 30 * s); g.lineTo(nx - 16 * s, base - 70 * s); g.quadraticCurveTo(nx, base - 96 * s, nx + 16 * s, base - 70 * s); g.lineTo(nx + 16 * s, base - 30 * s); g.fill(); });
      g.restore();
    }

    function build() {
      const r = cv.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height);
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const base = H;
      const s = Math.min(1.25, Math.max(.55, W / 1100));
      layers = [
        { k: .15, c: makeLayer('#2a1a3d', 3, (g) => { for (let x = -40; x < W + 160; x += 70 + rnd(x) * 70) { if (rnd(x + 1) > .5) dome(g, x, base - 40, 18 + rnd(x + 2) * 22, 20); else minaret(g, x, base - 30, 80 + rnd(x + 3) * 90, 6); g.fillRect(x - 40, base - 46, 120, 60); } }) },
        { k: .35, c: makeLayer('#1f1330', 7, (g) => {
            if (variant === 'gate') gate(g, W * .72 + 80, base - 10, s);
            else if (variant === 'domes') { dome(g, W * .62, base - 70, 70 * s, 50 * s); minaret(g, W * .62 - 120 * s, base - 20, 230 * s, 14 * s); minaret(g, W * .62 + 120 * s, base - 20, 230 * s, 14 * s); g.fillRect(W * .62 - 180 * s, base - 80, 360 * s, 90); }
            else { for (let i = 0; i < 5; i++) dome(g, W * (.45 + i * .12), base - 60, (26 + (i % 2) * 18) * s, 40 * s); g.fillRect(W * .4, base - 70, W * .7, 80); }
            for (let x = -40; x < W + 160; x += 40 + rnd(x + 9) * 50) g.fillRect(x, base - 22 - rnd(x) * 26, 30 + rnd(x + 5) * 40, 60);
          }) },
        { k: .6, c: makeLayer('#130a1c', 11, (g) => { g.beginPath(); g.moveTo(0, base); for (let x = 0; x <= W + 160; x += 20) g.lineTo(x, base - 14 - Math.sin(x * .02) * 6 - rnd(x) * 8); g.lineTo(W + 160, base); g.fill(); }) }
      ];
      stars = Array.from({ length: Math.round(W * H / 5000) }, (_, i) => ({ x: rnd(i + 1) * W, y: rnd(i + 99) * H * .7, r: rnd(i + 7) * 1.3 + .2, p: rnd(i + 3) * 6.28 }));
      kites = Array.from({ length: W < 600 ? 2 : 4 }, (_, i) => ({ x: rnd(i + 40) * W, y: 40 + rnd(i + 50) * H * .35, s: 12 + rnd(i + 60) * 10, p: rnd(i) * 6.28, v: .15 + rnd(i + 70) * .25, c: ['#f3a838', '#3cc4b2', '#e7638a', '#f5ead6'][i % 4] }));
      embers = [];
    }
    build();
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 150); });
    if (fine) addEventListener('pointermove', e => { mx = (e.clientX / innerWidth - .5); my = (e.clientY / innerHeight - .5); });
    addEventListener('scroll', () => { sy = scrollY; }, { passive: true });

    let t = 0, visible = true;
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(cv);
    function frame() {
      t += 1;
      if (visible) paint();
      if (!reduce) requestAnimationFrame(frame);
    }
    function paint() {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0f0718'); g.addColorStop(.55, '#22102f'); g.addColorStop(1, '#3b1c3f');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // moon
      const moonX = W * .86 - mx * 10, moonY = H * .2 - my * 6 + sy * .05;
      const mg = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 160);
      mg.addColorStop(0, '#ffe7b066'); mg.addColorStop(1, '#ffe7b000'); ctx.fillStyle = mg; ctx.fillRect(moonX - 160, moonY - 160, 320, 320);
      ctx.fillStyle = '#ffe9bf'; ctx.beginPath(); ctx.arc(moonX, moonY, 30, 0, 7); ctx.fill();
      ctx.fillStyle = '#1a0d26'; ctx.beginPath(); ctx.arc(moonX + 12, moonY - 6, 27, 0, 7); ctx.fill();
      // stars
      for (const s of stars) { const a = .35 + Math.sin(t * .03 + s.p) * .35; ctx.globalAlpha = Math.max(0, a); ctx.fillStyle = '#f5ead6'; ctx.fillRect(s.x - mx * 6, s.y - my * 4 + sy * .1, s.r, s.r); }
      ctx.globalAlpha = 1;
      // kites (patang)
      for (const k of kites) {
        k.x += k.v; if (k.x > W + 60) k.x = -60;
        const ky = k.y + Math.sin(t * .02 + k.p) * 14 + sy * .2, kx = k.x - mx * 30;
        const rot = Math.sin(t * .03 + k.p) * .35;
        ctx.save(); ctx.translate(kx, ky); ctx.rotate(rot);
        ctx.fillStyle = k.c; ctx.beginPath(); ctx.moveTo(0, -k.s); ctx.lineTo(k.s * .8, 0); ctx.lineTo(0, k.s); ctx.lineTo(-k.s * .8, 0); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#170d22'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -k.s); ctx.lineTo(0, k.s); ctx.moveTo(-k.s * .8, 0); ctx.lineTo(k.s * .8, 0); ctx.stroke();
        ctx.restore();
        ctx.strokeStyle = '#f5ead633'; ctx.beginPath(); ctx.moveTo(kx, ky + k.s); ctx.quadraticCurveTo(kx - 40, ky + 120, kx - 120 + Math.sin(t * .01 + k.p) * 30, H); ctx.stroke();
      }
      // skyline layers with parallax
      for (const L of layers) ctx.drawImage(L.c, -80 - mx * 80 * L.k, sy * L.k * .25 - my * 10 * L.k, W + 160, H);
      // the gateway arch glows
      if (variant === 'gate') {
        const s = Math.min(1.25, Math.max(.55, W / 1100)); const cx = W * .72 + 80 - 80 - mx * 80 * .35, by = H - 10 + sy * .35 * .25;
        const gg = ctx.createRadialGradient(cx, by - 60 * s, 0, cx, by - 60 * s, 120 * s);
        const pulse = .55 + Math.sin(t * .025) * .2;
        gg.addColorStop(0, `rgba(243,168,56,${pulse})`); gg.addColorStop(1, 'rgba(243,168,56,0)');
        ctx.fillStyle = gg; ctx.globalCompositeOperation = 'lighter'; ctx.fillRect(cx - 140 * s, by - 200 * s, 280 * s, 210 * s); ctx.globalCompositeOperation = 'source-over';
      }
      // rising lantern embers
      if (embers.length < 36 && Math.random() < .12) embers.push({ x: Math.random() * W, y: H + 10, v: .3 + Math.random() * .7, r: 1 + Math.random() * 2.4, w: Math.random() * 6.28 });
      ctx.globalCompositeOperation = 'lighter';
      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i]; e.y -= e.v; e.x += Math.sin(t * .02 + e.w) * .3;
        if (e.y < -10) { embers.splice(i, 1); continue; }
        const a = Math.min(1, (H - e.y) / 200) * Math.min(1, e.y / 120);
        const eg = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 5); eg.addColorStop(0, `rgba(255,190,90,${.8 * a})`); eg.addColorStop(1, 'rgba(255,190,90,0)');
        ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(e.x, e.y, e.r * 5, 0, 7); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    paint();
    if (!reduce) requestAnimationFrame(frame);
  }

  /* ---------- helpers for games ---------- */
  window.RR.floater = (parent, x, y, text, bad) => {
    const f = document.createElement('div'); f.className = 'floater' + (bad ? ' bad' : ''); f.textContent = text;
    f.style.left = x + 'px'; f.style.top = y + 'px'; parent.appendChild(f); setTimeout(() => f.remove(), 1000);
  };
  window.RR.confetti = (parent) => {
    if (reduce) return;
    const c = document.createElement('canvas'); c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:7';
    parent.appendChild(c); const r = parent.getBoundingClientRect(); c.width = r.width; c.height = r.height; const g = c.getContext('2d');
    const cols = ['#f3a838', '#3cc4b2', '#f5ead6', '#e7638a', '#ffcf73'];
    const ps = Array.from({ length: 140 }, () => ({ x: r.width / 2, y: r.height / 3, vx: (Math.random() - .5) * 12, vy: -Math.random() * 11 - 3, s: 4 + Math.random() * 6, a: Math.random() * 6.28, c: cols[(Math.random() * cols.length) | 0], m: Math.random() < .3 }));
    let n = 0; (function f() { g.clearRect(0, 0, c.width, c.height); ps.forEach(p => { p.vy += .3; p.x += p.vx; p.y += p.vy; p.a += .2; g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = p.c; if (p.m) { g.beginPath(); g.moveTo(0, -p.s); g.lineTo(p.s * .7, 0); g.lineTo(0, p.s); g.lineTo(-p.s * .7, 0); g.fill(); } else g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore(); }); if (++n < 140) requestAnimationFrame(f); else c.remove(); })();
  };
})();
