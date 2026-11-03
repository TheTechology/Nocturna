// NOCTURNA 0071 – motorul prezentării: slide-uri, animații, cerul viu și peisajul sonor de toamnă spre iarnă.
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const qs = new URLSearchParams(location.search);
  const stage = $('#stage');
  const slides = $$('.slide');
  const N = slides.length;
  const FILE = location.protocol === 'file:' || qs.has('blob');
  const STATIC = qs.has('static');
  if (STATIC) document.documentElement.classList.add('static');
  let cur = -1;
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* fără stocare */ } } };
  const R = Math.random, pick = a => a[Math.floor(R() * a.length)];
  // tabla smart, telefonul sau PC-ul: atingere, putere de calcul și claritatea ecranului
  const mm = q => !!(window.matchMedia && matchMedia(q).matches);
  const TOUCH = mm('(any-pointer: coarse)') || 'ontouchstart' in window;
  const LOW = (navigator.hardwareConcurrency || 4) <= 2 || (navigator.deviceMemory && navigator.deviceMemory <= 2) || mm('(prefers-reduced-motion: reduce)');
  const DPR = window.devicePixelRatio || 1;
  const K = Math.min(2, Math.max(1, Math.min(innerWidth / 1920, innerHeight / 1080) * DPR));   // pe o tablă 4K, cerul și graficele se desenează la rezoluție dublă
  if (TOUCH) document.documentElement.classList.add('touch');

  // ---------- scena se potrivește pe orice ecran ----------
  function fit() {
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);
    stage.style.left = (innerWidth - 1920 * s) / 2 + 'px';
    stage.style.top = (innerHeight - 1080 * s) / 2 + 'px';
    stage.style.transform = `scale(${s})`;
    checkRotate();
    const ib = $('.intro-band .band');
    if (ib) {   // pe telefon vertical, banda de pe ecranul de start se așază pe rânduri, ca logo-urile să rămână lizibile
      const compact = innerWidth < 700 && innerHeight > innerWidth, k = innerWidth / 1920;
      ib.parentElement.classList.toggle('compact', compact);
      ib.style.transform = compact ? 'none' : `scale(${k})`; ib.parentElement.style.height = compact ? 'auto' : 190 * k + 'px';
    }
  }

  // pe telefon ținut vertical, prezentarea (16:9) iese prea mică: îl rugăm să-l întoarcă
  let rotateOff = false;
  function checkRotate() {
    const el = $('#rotate'); if (!el) return;
    const show = !rotateOff && Math.min(innerWidth, innerHeight) < 600 && innerHeight > innerWidth * 1.15 && document.getElementById('intro').classList.contains('gone');
    el.hidden = !show;
  }

  // ---------- titlurile: fiecare cuvânt intră separat ----------
  $$('.tx.ti > span').forEach(span => {
    let k = 0;
    [...span.childNodes].forEach(node => {
      if (node.nodeType !== 3) return;
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        const w = document.createElement('span'); w.className = 'w';
        const i = document.createElement('i'); i.style.setProperty('--k', k++); i.textContent = part;
        w.appendChild(i); frag.appendChild(w);
      });
      node.replaceWith(frag);
    });
  });

  // ---------- cifrele numără până la valoarea lor ----------
  $$('.tx.cnt > span').forEach(el => { el.dataset.v = el.textContent; });
  function count(slide) {
    $$('.tx.cnt > span', slide).forEach(el => {
      const m = /^(\d[\d.]*)(.*)$/.exec(el.dataset.v); if (!m) return;
      const target = +m[1].replace(/\./g, ''), pad = m[1].startsWith('0') ? m[1].length : 0, rest = m[2];
      const fmt = v => { let s = String(v).padStart(pad, '0'); if (!pad && v >= 1000) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); return s + rest; };
      el.textContent = fmt(0);
      const d = parseFloat(getComputedStyle(el.parentElement).getPropertyValue('--d')) || 0;
      const t0 = performance.now() + d, dur = 1500;
      const step = now => {
        if (!slide.classList.contains('active')) { el.textContent = el.dataset.v; return; }
        const p = Math.min(1, Math.max(0, (now - t0) / dur));
        el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - p, 4))));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  // ---------- codul se scrie singur, literă cu literă ----------
  $$('.tx.mono > span').forEach(el => { el.dataset.code = el.textContent; });
  function typeCode(slide) {
    const lines = $$('.tx.mono > span', slide); if (!lines.length) return;
    lines.forEach(el => { el.textContent = ''; });
    let li = 0, ci = 0; const caret = document.createElement('span'); caret.className = 'cur';
    const step = () => {
      if (!slide.classList.contains('active')) { lines.forEach(el => { el.textContent = el.dataset.code; }); return; }
      if (li >= lines.length) return;
      const el = lines[li], full = el.dataset.code;
      ci += 2; el.textContent = full.slice(0, ci); el.appendChild(caret);
      if (ci >= full.length) { li++; ci = 0; if (li < lines.length) { caret.remove(); setTimeout(step, 160); } else setTimeout(() => caret.remove(), 2500); return; }
      setTimeout(step, 28);
    };
    setTimeout(step, 1100);
  }

  // =====================================================================
  // PEISAJUL SONOR: un fond permanent (vânt prin copaci + pârâul), straturi pe capitole
  // și întâmplări care trec prin difuzoare (gâște, cocori, cucuvea). Toamna trece încet în iarnă.
  // =====================================================================
  const SND = {
    ctx: null, bus: null, out: null, an: null, tracks: {}, muted: false, scene: null, timer: 0, rate: 1,
    blobs: {},
    url(name) {
      if (FILE && window.SUNETE && window.SUNETE[name]) return this.blobs[name] || (this.blobs[name] = URL.createObjectURL(new Blob([Uint8Array.from(atob(window.SUNETE[name]), c => c.charCodeAt(0))], { type: 'audio/mp4' })));
      return `media/audio/${name}.m4a`;
    },
    init(muted) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC || this.ctx) return;
      const c = this.ctx = new AC();
      this.bus = c.createGain();
      const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 70;            // fără huruit de microfon
      const comp = c.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 3; comp.attack.value = .02; comp.release.value = .3;
      this.an = c.createAnalyser(); this.an.fftSize = 2048; this.an.smoothingTimeConstant = .55;
      this.out = c.createGain();
      this.bus.connect(hp); hp.connect(comp); comp.connect(this.an); this.an.connect(this.out); this.out.connect(c.destination);
      this.freq = new Uint8Array(this.an.frequencyBinCount); this.time = new Uint8Array(this.an.fftSize);
      this.setMuted(muted, true);
    },
    track(name) {
      if (this.tracks[name]) return this.tracks[name];
      const el = new Audio(); el.loop = true; el.preload = 'auto'; el.src = this.url(name);
      const g = this.ctx.createGain(); g.gain.value = 0;
      this.ctx.createMediaElementSource(el).connect(g); g.connect(this.bus);
      return (this.tracks[name] = { el, g, stop: 0, started: false });
    },
    ramp(t, v, sec) { const now = this.ctx.currentTime; t.g.gain.cancelScheduledValues(now); t.g.gain.setValueAtTime(t.g.gain.value, now); t.g.gain.linearRampToValueAtTime(v, now + sec); },
    // mixajul unui slide: fiecare strat primește volumul lui; ce nu e în listă se stinge
    mix(layers) {
      if (!this.ctx) return;
      for (const [name, v] of Object.entries(layers)) {
        const t = this.track(name); clearTimeout(t.stop);
        if (v > 0 && t.el.paused) { if (!t.started) { t.el.currentTime = R() * 15; t.started = true; } t.el.play().catch(() => {}); }
        this.ramp(t, v, 2.6);
      }
      for (const [name, t] of Object.entries(this.tracks)) if (!(name in layers)) {
        this.ramp(t, 0, 2.6); clearTimeout(t.stop); t.stop = setTimeout(() => t.el.pause(), 2800);
      }
    },
    // o întâmplare sonoră: un fragment dintr-o înregistrare, cu volum și poziție stânga–dreapta care se mișcă
    oneShot(name, { from = 0, len = 6, vol = .6, pan0 = 0, pan1 = pan0, delay = 0 } = {}) {
      if (!this.ctx) return;
      const c = this.ctx, el = new Audio(this.url(name));
      const src = c.createMediaElementSource(el), g = c.createGain(), p = c.createStereoPanner ? c.createStereoPanner() : null;
      src.connect(g); if (p) { g.connect(p); p.connect(this.bus); } else g.connect(this.bus);
      g.gain.value = 0;
      el.addEventListener('loadedmetadata', () => {
        el.currentTime = Math.min(from, Math.max(0, el.duration - len));
        setTimeout(() => {
          const now = c.currentTime;
          g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(vol, now + Math.min(1.2, len * .25)); g.gain.setValueAtTime(vol, now + len * .7); g.gain.linearRampToValueAtTime(0, now + len);
          if (p) { p.pan.setValueAtTime(pan0, now); p.pan.linearRampToValueAtTime(pan1, now + len); }
          el.play().catch(() => {});
          setTimeout(() => { el.pause(); src.disconnect(); g.disconnect(); if (p) p.disconnect(); }, len * 1000 + 300);
        }, delay);
      }, { once: true });
    },
    EVENTS: {
      gaste() { const d = R() < .5 ? 1 : -1; SND.oneShot('gaste', { from: R() * 6, len: 10, vol: .55, pan0: -.9 * d, pan1: .9 * d }); },   // stolul trece de la o margine la alta
      cocori() { const d = R() < .5 ? 1 : -1; SND.oneShot('cocori', { from: 5 + R() * 80, len: 9, vol: .62, pan0: -.6 * d, pan1: .5 * d }); },
      cucuvea() { SND.oneShot('cucuvea', { from: pick([5.2, 16.5, 26.5, 35.2]), len: 2.8, vol: .7, pan0: R() < .5 ? -.6 : .6 }); SND.oneShot('cucuvea', { from: pick([5.2, 16.5, 26.5]), len: 2.8, vol: .35, pan0: R() < .5 ? .7 : -.7, delay: 4200 }); },
    },
    loop() { // la fiecare 9–20 s, ceva se întâmplă în pădure
      clearTimeout(this.timer);
      const pool = this.scene && this.scene.events || [];
      if (pool.length && !this.muted) this.EVENTS[pick(pool)]();
      this.timer = setTimeout(() => this.loop(), (9000 + R() * 11000) / this.rate);
    },
    // ce se aude pe fiecare slide: depinde de capitol, de zi/noapte și de cât am înaintat (toamna → iarna)
    play(slide, idx) {
      if (!this.ctx) return;
      const p = idx / Math.max(1, N - 1), night = slide.classList.contains('night'), ch = slide.dataset.ch;
      const L = { vant_toamna: .42 * (1 - .55 * p), parau: .26 };
      if (p > .35) L.iarna_zi = .34 * Math.min(1, (p - .35) / .4);
      let events = ['gaste'];
      if (night) { L.iarna_noapte = .5; L.parau = .2; events = ['cocori', 'cucuvea', 'gaste']; }
      else if (ch === '1' || ch === '0') { L.frunze = .3; }
      else if (ch === '2') { L.frunze = .26; events = ['gaste', 'cocori']; }
      else if (ch === '3' || ch === '4') { L.ciori = .22; L.frunze = .12; }
      else if (ch === '5') { L.ploaie = .3; L.frunze = .1; }
      const first = !this.scene;
      this.rate = $('.spectro-live', slide) ? 2.8 : 1;   // pe spectrogramă, păsările trec mai des
      this.scene = { events };
      this.mix(L);
      if (slide.dataset.div && !this.muted) this.EVENTS.cucuvea();
      if (this.rate > 1 && !this.muted) setTimeout(() => this.EVENTS.cocori(), 1600);
      if (first) this.timer = setTimeout(() => this.loop(), 6000);
      else if (this.rate > 1) { clearTimeout(this.timer); this.timer = setTimeout(() => this.loop(), 5000); }
    },
    noise(dur) { const b = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = R() * 2 - 1; const s = this.ctx.createBufferSource(); s.buffer = b; return s; },
    tick() { // un clic moale, de lemn, la fiecare slide
      if (!this.ctx) return; const now = this.ctx.currentTime;
      const s = this.noise(.06), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
      f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 6; g.gain.setValueAtTime(.0001, now); g.gain.exponentialRampToValueAtTime(.16, now + .004); g.gain.exponentialRampToValueAtTime(.0001, now + .06);
      s.connect(f); f.connect(g); g.connect(this.out); s.start(now); s.stop(now + .07);
    },
    whoosh() { // un fâșâit de aripi la începutul unui capitol
      if (!this.ctx) return; const now = this.ctx.currentTime;
      const s = this.noise(1.1), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
      f.type = 'bandpass'; f.Q.value = 1.4; f.frequency.setValueAtTime(260, now); f.frequency.exponentialRampToValueAtTime(2600, now + .55); f.frequency.exponentialRampToValueAtTime(500, now + 1.05);
      g.gain.setValueAtTime(.0001, now); g.gain.exponentialRampToValueAtTime(.13, now + .35); g.gain.exponentialRampToValueAtTime(.0001, now + 1.05);
      s.connect(f); f.connect(g); g.connect(this.out); s.start(now); s.stop(now + 1.1);
    },
    setMuted(m, instant) {
      this.muted = m; document.body.classList.toggle('muted', m); $('#bSound').setAttribute('aria-pressed', String(!m)); store.set('nocturna-sunet', m ? '0' : '1');
      if (!this.ctx) return; const now = this.ctx.currentTime;
      this.out.gain.cancelScheduledValues(now); this.out.gain.setValueAtTime(instant ? (m ? 0 : 1) : this.out.gain.value, now); if (!instant) this.out.gain.linearRampToValueAtTime(m ? 0 : 1, now + .5);
      if (!m && this.ctx.state === 'suspended') this.ctx.resume();
    },
    read() { if (!this.an || !this.scene) return false; this.an.getByteFrequencyData(this.freq); this.an.getByteTimeDomainData(this.time); return true; },
  };

  // ---------- cerul viu: stele, stele căzătoare, primii fulgi și stoluri care migrează ----------
  function Sky(canvas, w, h, opts = {}) {
    const k = opts.k || 1, x = canvas.getContext('2d'); canvas.width = Math.round(w * k); canvas.height = Math.round(h * k); x.setTransform(k, 0, 0, k, 0, 0);
    const stars = Array.from({ length: Math.round((opts.stars || 240) * (LOW ? .5 : 1)) }, () => ({ x: R() * w, y: R() * h * .78, r: R() < .07 ? 1.9 + R() : .5 + R() * 1.1, p: R() * 6.3, s: .6 + R() * 1.8 }));
    const flakes = Array.from({ length: Math.round((opts.flakes != null ? opts.flakes : 70) * (LOW ? .4 : 1)) }, () => ({ x: R() * w, y: R() * h, r: .6 + R() * 1.8, v: .012 + R() * .03, p: R() * 6.3 }));
    let shoot = null, nextShoot = 2500, flocks = [], nextFlock = 1200, last = performance.now();
    function flock() {
      const n = 5 + Math.floor(R() * 7), y = h * (.1 + R() * .38), sc = .6 + R() * .9, sp = (.05 + R() * .04) * (w / 1920);
      const birds = Array.from({ length: n }, (_, i) => { const side = i % 2 ? 1 : -1, k = Math.ceil(i / 2); return { dx: k * 34 * sc, dy: side * k * 20 * sc + (R() - .5) * 8, ph: R() * 6.3 }; });
      flocks.push({ x: w + 60, y, sc, sp, birds });
    }
    function bird(bx, by, s, ph) { // pasărea: două aripi care bat
      const a = Math.sin(ph) * 7 * s; x.beginPath(); x.moveTo(bx - 13 * s, by - a); x.quadraticCurveTo(bx - 6 * s, by - 4 * s - a * .4, bx, by); x.quadraticCurveTo(bx + 6 * s, by - 4 * s - a * .4, bx + 13 * s, by - a); x.stroke();
    }
    return {
      flock,
      // light = slide alb: doar stoluri discrete, în culorile NOCTURNA (teracotă și salvie)
      frame(now, lvl, light) {
        const dt = Math.min(64, now - last); last = now;
        x.clearRect(0, 0, w, h);
        if (light) {
          if ((nextFlock -= dt) < 0) { flock(); nextFlock = 9000 + R() * 9000; }
          x.lineCap = 'round';
          flocks = flocks.filter((f, n) => { f.x -= f.sp * dt; f.y += Math.sin(now * .0006 + f.sc) * .05;
            x.strokeStyle = n % 2 ? 'rgba(114,129,87,.30)' : 'rgba(198,113,57,.28)'; x.lineWidth = 2 * f.sc;
            for (const b of f.birds) bird(f.x + b.dx, f.y + b.dy, f.sc * .85, now * .012 + b.ph);
            return f.x > -400; });
          return;
        }
        x.fillStyle = '#f5ead8';
        for (const s of stars) { const a = .35 + .65 * (.5 + .5 * Math.sin(now * .001 * s.s + s.p)); x.globalAlpha = a; x.beginPath(); x.arc(s.x, s.y, s.r * (1 + lvl * .6), 0, 6.3); x.fill(); }
        for (const f of flakes) { f.y += f.v * dt; f.x += Math.sin(now * .0008 + f.p) * .25; if (f.y > h) { f.y = -5; f.x = R() * w; } x.globalAlpha = .5; x.beginPath(); x.arc(f.x, f.y, f.r, 0, 6.3); x.fill(); }
        x.globalAlpha = 1;
        if ((nextShoot -= dt) < 0) { shoot = { x: R() * w * .7 + w * .2, y: R() * h * .3, vx: -(0.9 + R() * .6) * (w / 1920), vy: (.35 + R() * .2) * (w / 1920), life: 1 }; nextShoot = 4500 + R() * 6000; }
        if (shoot) { shoot.x += shoot.vx * dt; shoot.y += shoot.vy * dt; shoot.life -= dt / 900;
          const g = x.createLinearGradient(shoot.x, shoot.y, shoot.x - shoot.vx * 140, shoot.y - shoot.vy * 140); g.addColorStop(0, `rgba(255,244,220,${Math.max(0, shoot.life)})`); g.addColorStop(1, 'rgba(255,244,220,0)');
          x.strokeStyle = g; x.lineWidth = 2.2; x.beginPath(); x.moveTo(shoot.x, shoot.y); x.lineTo(shoot.x - shoot.vx * 140, shoot.y - shoot.vy * 140); x.stroke(); if (shoot.life <= 0) shoot = null; }
        if ((nextFlock -= dt) < 0) { flock(); nextFlock = 7000 + R() * 7000; }
        x.strokeStyle = 'rgba(245,234,216,.85)'; x.lineCap = 'round';
        flocks = flocks.filter(f => { f.x -= f.sp * dt; f.y += Math.sin(now * .0006 + f.sc) * .05;
          x.lineWidth = 2.2 * f.sc;
          for (const b of f.birds) bird(f.x + b.dx, f.y + b.dy, f.sc, now * .012 + b.ph);
          return f.x > -400; });
      },
    };
  }
  const sky = Sky($('#sky'), 1920, 1080, { k: K });
  const introCanvas = $('#introSky');
  let introSky = null;
  function sizeIntro() { introSky = Sky(introCanvas, innerWidth, innerHeight, { stars: Math.round(innerWidth * innerHeight / 7000), flakes: 50, k: Math.min(2, DPR) }); }

  // ---------- orizontul de sunet: unde care respiră deasupra benzii ----------
  const hz = $('#horizon'), hx = hz.getContext('2d'); hz.width = 1920 * K; hz.height = 70 * K; hx.setTransform(K, 0, 0, K, 0, 0);
  const eqBars = $$('#bSound .eq i');
  let lvl = 0;
  function drawHorizon(now, night, has) {
    hx.clearRect(0, 0, 1920, 70);
    const n = 120, bw = 1920 / n;
    const g = hx.createLinearGradient(0, 0, 0, 70);
    if (night) { g.addColorStop(0, 'rgba(246,160,107,0)'); g.addColorStop(1, 'rgba(246,160,107,.55)'); } else { g.addColorStop(0, 'rgba(114,129,87,0)'); g.addColorStop(1, 'rgba(114,129,87,.38)'); }
    hx.fillStyle = g;
    for (let i = 0; i < n; i++) {
      const c = Math.abs(i - n / 2) / (n / 2);
      let v = has ? SND.freq[Math.floor(3 + (1 - c) * 160)] / 255 : 0;
      v = Math.max(v * v * 1.4, .06 + .05 * Math.sin(now * .002 + i * .35));
      const hgt = Math.min(66, v * 66);
      hx.beginPath(); if (hx.roundRect) hx.roundRect(i * bw + bw * .25, 70 - hgt, bw * .5, hgt, 3); else hx.rect(i * bw + bw * .25, 70 - hgt, bw * .5, hgt); hx.fill();
    }
    eqBars.forEach((b, i) => { const v = has && !SND.muted ? SND.freq[6 + i * 22] / 255 : .15 + .1 * Math.sin(now * .004 + i); b.style.height = (3 + v * 17) + 'px'; });
  }

  // =====================================================================
  // SPECTROGRAMA VIE (slide-ul „Un strigăt de pasăre arată așa”): fără fundal, direct pe cerul de noapte,
  // cu axe în kHz, unda sunetului, frecvența dominantă și chenare „strigăt”, ca în programele de analiză.
  // =====================================================================
  let spec = null;
  function mountSpectro() {
    const im = $('.im.spectro'); if (!im) return;
    const W = Math.round(parseFloat(im.style.width)), H = Math.round(parseFloat(im.style.height));
    const wrap = document.createElement('div'); wrap.className = 'spectro-live'; wrap.dataset.fx = 'f';
    wrap.style.cssText = im.style.cssText;
    wrap.innerHTML = `<canvas class="sp-img" width="${W}" height="${H}"></canvas><canvas class="sp-ov" width="${Math.round(W * K)}" height="${Math.round(H * K)}"></canvas>`
      + '<div class="sp-head"><span class="live"><i></i>ASCULTĂM ACUM</span><span>frecvența dominantă <b class="peak">–</b></span><span>strigăte detectate <b class="nb">0</b></span></div>';
    im.replaceWith(wrap);
    const img = $('.sp-img', wrap).getContext('2d'), ov = $('.sp-ov', wrap).getContext('2d'); ov.setTransform(K, 0, 0, K, 0, 0);
    const AX = 80, PB = 38, PT = 8;                     // loc pentru axa de frecvență (stânga) și de timp (jos)
    const PW = W - AX, PH = H - PB - PT, FMAX = 10000, STEP = 2;
    const pal = v => { // salvie → teracotă → crem: zgomotul rămâne transparent, strigătele strălucesc
      const s = [[114, 129, 87], [198, 113, 57], [246, 160, 107], [255, 238, 210]]; const p = Math.min(.999, v) * (s.length - 1), i = Math.floor(p), f = p - i;
      return s[i].map((a, k) => Math.round(a + (s[i + 1][k] - a) * f));
    };
    const col = img.createImageData(STEP, PH), nf = new Float32Array(PH).fill(.3);
    let boxes = [], open = null, total = 0, fake = null, call = null, nextCall = 0, lastPeak = 0;
    const peakEl = $('.peak', wrap), nbEl = $('.nb', wrap);
    const rr = (c, x0, y0, w, h, r) => { c.beginPath(); if (c.roundRect) c.roundRect(x0, y0, w, h, r); else c.rect(x0, y0, w, h); };
    function axes() {
      ov.clearRect(0, 0, W, H);
      ov.font = '600 18px Figtree, sans-serif'; ov.textBaseline = 'middle'; ov.lineWidth = 1;
      for (let k = 0; k <= 10; k += 2) {
        const y = Math.round(PT + PH - (k / 10) * PH) + .5;
        ov.strokeStyle = k === 0 ? 'rgba(245,234,216,.35)' : 'rgba(245,234,216,.08)';
        ov.beginPath(); ov.moveTo(AX, y); ov.lineTo(W, y); ov.stroke();
        ov.fillStyle = 'rgba(245,234,216,.6)'; ov.textAlign = 'right'; ov.fillText(k === 10 ? '10 kHz' : String(k), AX - 12, y);
      }
      const pxs = 60 * STEP; ov.textAlign = 'center'; ov.textBaseline = 'top';     // o gradație pe secundă (~60 de cadre)
      for (let s = 0; s * pxs < PW; s++) {
        const xx = W - s * pxs - .5; ov.strokeStyle = 'rgba(245,234,216,.3)'; ov.beginPath(); ov.moveTo(xx, PT + PH); ov.lineTo(xx, PT + PH + 6); ov.stroke();
        ov.fillStyle = 'rgba(245,234,216,.5)'; ov.fillText(s === 0 ? 'acum' : `−${s} s`, Math.min(W - 20, xx), PT + PH + 10);
      }
      for (const b of boxes) {
        const x0 = W - (b.age + b.len) * STEP, w = b.len * STEP;
        if (x0 + w < AX + 10) continue;
        const y0 = PT + PH - (b.fhi / FMAX) * PH - 8, y1 = PT + PH - (b.flo / FMAX) * PH + 8;
        const a = Math.min(1, (b.age + 1) / 6) * Math.max(0, Math.min(1, (x0 - AX) / 140));
        ov.strokeStyle = `rgba(246,160,107,${.95 * a})`; ov.lineWidth = 1.6; ov.setLineDash([5, 4]); rr(ov, x0 - 7, y0, w + 14, y1 - y0, 6); ov.stroke(); ov.setLineDash([]);
        const label = `strigăt · ${(b.len / 60).toFixed(1).replace('.', ',')} s`;
        ov.font = '700 16px Figtree, sans-serif'; const tw = ov.measureText(label).width + 16;
        ov.fillStyle = `rgba(198,113,57,${.95 * a})`; rr(ov, x0 - 7, y0 - 28, tw, 24, 12); ov.fill();
        ov.fillStyle = `rgba(255,255,255,${a})`; ov.textAlign = 'left'; ov.textBaseline = 'middle'; ov.fillText(label, x0 + 1, y0 - 16);
      }
      if (SND.scene) { ov.strokeStyle = 'rgba(245,234,216,.4)'; ov.lineWidth = 1.2; ov.beginPath();      // unda sunetului
        for (let i = 0; i < 480; i++) { const xx = AX + i * PW / 480, yy = PT + PH - 20 + (SND.time[i * 4] - 128) / 128 * 16; i ? ov.lineTo(xx, yy) : ov.moveTo(xx, yy); } ov.stroke(); }
    }
    spec = { wrap, frame(has, now) {
      img.globalCompositeOperation = 'copy'; img.drawImage(img.canvas, -STEP, 0); img.globalCompositeOperation = 'source-over';
      const binHz = (SND.ctx ? SND.ctx.sampleRate : 48000) / 2048;
      fake = null;
      if (!has) { // fără sunet: desenăm strigăte scurte de zbor, ca să se vadă cum arată
        if (!call && now > nextCall) call = { t: 0, n: 12 + R() * 16, f0: 2400 + R() * 3200, df: (R() < .6 ? -1 : .7) * (900 + R() * 1800) };
        if (call) { const q = call.t / call.n; fake = { f: call.f0 + call.df * q * q }; if (++call.t > call.n) { call = null; nextCall = now + 400 + R() * 1500; } } }
      let eSum = 0, eMax = 0, fMax = 0, fLo = FMAX, fHi = 0;
      for (let y = 0; y < PH; y++) {
        const f = (1 - y / PH) * FMAX, bin = Math.max(1, Math.round(f / binHz));
        let raw = has ? (SND.freq[bin] + SND.freq[bin + 1]) / 510 : R() * .05;
        // scăderea zgomotului: fiecare frecvență își învață nivelul de fond (vânt, pârâu) și îl scade
        nf[y] += (raw - nf[y]) * (raw > nf[y] ? .004 : .05);
        let v = Math.max(0, raw - nf[y] - .075) * 2.6;
        if (fake) { const d = Math.abs(f - fake.f); if (d < 380) v = Math.max(v, .92 - d / 520); }
        if (f > 800 && f < 9000) { eSum += v; if (v > eMax) { eMax = v; fMax = f; } if (v > .35) { fLo = Math.min(fLo, f); fHi = Math.max(fHi, f); } }
        v = Math.min(1, v); v = Math.pow(v, 1.15);
        const [r, g, b] = pal(v), a = Math.round(Math.min(1, v * 1.7) * 255);
        for (let k = 0; k < STEP; k++) { const o = (y * STEP + k) * 4; col.data[o] = r; col.data[o + 1] = g; col.data[o + 2] = b; col.data[o + 3] = a; }
      }
      img.putImageData(col, W - STEP, PT);
      img.clearRect(0, 0, AX, H);
      // detecția: în banda păsărilor (1,2–9 kHz) apare un vârf mult peste nivelul obișnuit
      const hit = eMax > .42 && fHi > fLo;
      for (const b of boxes) b.age++;
      if (hit) { if (!open) open = { age: 0, len: 0, flo: fLo, fhi: fHi, miss: 0 }; open.len += 1 + open.miss; open.miss = 0; open.flo = Math.min(open.flo, fLo); open.fhi = Math.max(open.fhi, fHi); }
      else if (open && ++open.miss > 8) { if (open.len >= 5 && open.fhi > open.flo) { open.age = open.miss; boxes.push(open); nbEl.textContent = ++total; } open = null; }
      boxes = boxes.filter(b => (b.age + b.len) * STEP < PW + 60);
      if (eMax > .35 && now - lastPeak > 250) { peakEl.textContent = (fMax / 1000).toFixed(1).replace('.', ',') + ' kHz'; lastPeak = now; }
      axes();
    } };
  }
  mountSpectro();
  // =====================================================================
  // HARTA (ROSPA0071 Lunca Siretului Inferior): lunca împădurită, Siretul care curge, culoarul de migrație,
  // noaptea 17:00 → 07:00 și stațiile care „prind” strigătele stolurilor. Strigătele sunt o simulare.
  // =====================================================================
  let map = null;
  const SPECII = [['Stârc de noapte', 'Nycticorax nycticorax'], ['Lebădă de iarnă', 'Cygnus cygnus'], ['Gâscă cu gât roșu', 'Branta ruficollis'],
    ['Codalb', 'Haliaeetus albicilla'], ['Nagâț', 'Vanellus vanellus'], ['Rață mică', 'Anas crecca']];
  function mountMap() {
    const el = $('.map-live'), D = window.HARTA; if (!el || !D) return;
    const BW = parseFloat(el.style.width), BH = parseFloat(el.style.height);
    const sc = BH / D.H, MW = Math.round(D.W * sc), MH = Math.round(BH), km = D.kmpx * sc, SW = BW - MW - 56;
    const XY = p => [p[0] * sc, p[1] * sc];
    el.innerHTML = `<div class="mp-map" style="width:${MW}px;height:${MH}px">
        <canvas class="mp-c" width="${Math.round(MW * K)}" height="${Math.round(MH * K)}"></canvas><div class="mp-pins"></div>
        <div class="mp-legend"><span><i class="lg-st"></i>stație NOCTURNA (2 pe punct)</span><span><i class="lg-am"></i>AudioMoth</span><span><i class="lg-mg"></i>culoar de migrație</span><span><i class="lg-ln"></i>lunca Siretului · ROSPA0071</span></div>
      </div>
      <aside class="mp-side" style="width:${SW}px">
        <div class="mp-live"><span class="dot"></span>Simulare · o noapte de migrație<span class="clock">21:40</span></div>
        <div class="mp-night"><i></i><span>17:00</span><span>miezul nopții</span><span>07:00</span></div>
        <section class="mp-sel"></section>
        <div class="mp-nums"><div><b>10</b>puncte</div><div><b>20</b>stații</div><div><b>3</b>AudioMoth</div><div class="tot"><b class="mp-total">0</b>strigăte captate</div></div>
        <section class="mp-site"><small>SITUL NATURA 2000</small><h4>ROSPA0071 · Lunca Siretului Inferior</h4>
          <p>Arie de protecție specială pentru păsări. Aici sunt ocrotite prin lege 47 de specii, multe dintre ele în trecere toamna și iarna:</p>
          <ul>${SPECII.map(([r, l]) => `<li><b>${r}</b><i>${l}</i></li>`).join('')}</ul></section>
        <p class="mp-note">Amplasare propusă, orientativă; conturul luncii e aproximativ. Punctele finale se stabilesc cu DJM Vrancea și cu proprietarii terenurilor. Strigătele sunt o simulare. Hartă © OpenStreetMap · specii: Planul de management ROSPA0071 (MMAP, 2015).</p>
      </aside>`;
    const cv = $('.mp-c', el), x = cv.getContext('2d'); x.setTransform(K, 0, 0, K, 0, 0);
    const pinsEl = $('.mp-pins', el), selEl = $('.mp-sel', el), clockEl = $('.clock', el), nightBar = $('.mp-night i', el), totalEl = $('.mp-total', el);
    let rs = 11; const rnd = () => (rs = (rs * 16807) % 2147483647) / 2147483647;
    const siret = D.siret.map(XY);
    const dist2seg = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
    const dRiver = p => { let m = 1e9; for (let i = 1; i < siret.length; i++) m = Math.min(m, dist2seg(p, siret[i - 1], siret[i])); return m; };
    const riverX = yy => { let rx = siret[0][0], bd = 1e9; for (const p of siret) { const d = Math.abs(p[1] - yy); if (d < bd) { bd = d; rx = p[0]; } } return rx; };

    // ---- stratul fix (desenat o singură dată): relief discret, lunca, pădurea, râurile, satele, rețeaua de coordonate
    const st = document.createElement('canvas'); st.width = cv.width; st.height = cv.height; const y = st.getContext('2d'); y.setTransform(K, 0, 0, K, 0, 0);
    const bg = y.createLinearGradient(0, 0, MW, MH); bg.addColorStop(0, '#16222a'); bg.addColorStop(1, '#0e151b'); y.fillStyle = bg; y.fillRect(0, 0, MW, MH);
    for (let i = 0; i < 70; i++) { const px = rnd() * MW, py = rnd() * MH, r = 60 + rnd() * 160, g = y.createRadialGradient(px, py, 0, px, py, r);   // dealuri spre vest, câmpie spre est
      g.addColorStop(0, `rgba(160,180,170,${(.035 * (1 - px / MW)).toFixed(3)})`); g.addColorStop(1, 'rgba(160,180,170,0)'); y.fillStyle = g; y.fillRect(px - r, py - r, 2 * r, 2 * r); }
    const path = pts => { y.beginPath(); pts.forEach((p, i) => i ? y.lineTo(p[0], p[1]) : y.moveTo(p[0], p[1])); };
    y.lineCap = y.lineJoin = 'round';
    y.save(); y.shadowColor = 'rgba(110,150,90,.5)'; y.shadowBlur = 30 * sc;
    [[4.6, 'rgba(70,98,62,.20)'], [3.2, 'rgba(78,108,66,.26)'], [1.9, 'rgba(92,124,76,.30)']].forEach(([w, c]) => { y.strokeStyle = c; y.lineWidth = w * km; path(siret); y.stroke(); });
    y.restore();
    // conturul orientativ al luncii: o linie punctată fină de o parte și de alta
    y.save(); y.setLineDash([2, 6]); y.strokeStyle = 'rgba(204,219,178,.35)'; y.lineWidth = 1;
    [-1, 1].forEach(sgn => { y.beginPath(); siret.forEach((p, i) => { const q = siret[Math.min(siret.length - 1, i + 1)], o = siret[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], n = Math.hypot(dx, dy) || 1, ox = -dy / n * 2.3 * km * sgn, oy = dx / n * 2.3 * km * sgn; i ? y.lineTo(p[0] + ox, p[1] + oy) : y.moveTo(p[0] + ox, p[1] + oy); }); y.stroke(); });
    y.restore();
    const trees = [];
    for (let i = 0; i < 3200 && trees.length < 1100; i++) { const p = [rnd() * MW, rnd() * MH], d = dRiver(p); if (d < 2.2 * km && rnd() > d / (2.5 * km)) trees.push({ p, s: .6 + rnd() * .5, f: rnd() < .5 }); }
    trees.sort((a, b) => a.p[1] - b.p[1]);
    for (const t of trees) { const [tx, ty] = t.p, s = t.s * 3.6 * sc;
      if (t.f) { y.fillStyle = '#183021'; y.beginPath(); y.moveTo(tx, ty - s * 2.2); y.lineTo(tx + s, ty); y.lineTo(tx - s, ty); y.closePath(); y.fill(); y.fillStyle = 'rgba(150,190,140,.16)'; y.beginPath(); y.moveTo(tx, ty - s * 2.2); y.lineTo(tx + s * .3, ty - s * .4); y.lineTo(tx, ty); y.closePath(); y.fill(); }
      else { y.fillStyle = '#1f3526'; y.beginPath(); y.arc(tx, ty - s * .8, s * .9, 0, 6.3); y.fill(); y.fillStyle = 'rgba(160,190,130,.12)'; y.beginPath(); y.arc(tx - s * .3, ty - s * 1.05, s * .4, 0, 6.3); y.fill(); } }
    for (const segs of Object.values(D.rivers)) segs.forEach(sg => { y.strokeStyle = 'rgba(140,180,205,.32)'; y.lineWidth = 1.3; path(sg.map(XY)); y.stroke(); });
    y.save(); y.shadowColor = 'rgba(150,200,230,.55)'; y.shadowBlur = 10; y.strokeStyle = 'rgba(165,205,228,.75)'; y.lineWidth = 2.6; path(siret); y.stroke(); y.restore();
    // rețeaua de coordonate: gradații fine pe margini, ca pe o hartă tipărită
    y.font = '600 11px Figtree, sans-serif'; y.fillStyle = 'rgba(245,234,216,.38)'; y.strokeStyle = 'rgba(245,234,216,.07)'; y.lineWidth = 1;
    D.grid.lat.forEach(([v, py]) => { py *= sc; y.beginPath(); y.moveTo(0, py); y.lineTo(MW, py); y.stroke(); y.textAlign = 'left'; y.fillText(String(v).replace('.', ',') + '° N', 8, py - 7); });
    D.grid.lon.forEach(([v, px]) => { px *= sc; y.beginPath(); y.moveTo(px, 0); y.lineTo(px, MH); y.stroke(); y.textAlign = 'center'; y.fillText(String(v).replace('.', ',') + '° E', px, 14); });
    // localitățile: orașele în litere mari, satele discret; eticheta pe partea dinspre exterior a râului
    D.towns.forEach(t => { const [tx, ty] = XY(t.xy); if (tx < 10 || tx > MW - 10 || ty < 18 || ty > MH - 10) return;
      const right = tx >= riverX(ty);
      y.fillStyle = t.town ? '#f5ead8' : 'rgba(245,234,216,.55)'; y.beginPath(); y.arc(tx, ty, t.town ? 3.6 : 2.2, 0, 6.3); y.fill();
      if (t.town) { y.strokeStyle = 'rgba(245,234,216,.5)'; y.lineWidth = 1; y.beginPath(); y.arc(tx, ty, 6.5, 0, 6.3); y.stroke(); }
      y.textAlign = right ? 'left' : 'right'; y.textBaseline = 'middle';
      if (t.town) { y.font = '800 15px Figtree, sans-serif'; y.fillStyle = 'rgba(245,234,216,.95)'; y.fillText(t.name.toUpperCase(), tx + (right ? 12 : -12), ty); }
      else { y.font = '600 12.5px Figtree, sans-serif'; y.fillStyle = 'rgba(245,234,216,.55)'; y.fillText(t.name, tx + (right ? 8 : -8), ty); } });
    y.font = 'italic 600 13px Figtree, sans-serif'; y.fillStyle = 'rgba(170,210,232,.8)'; y.textAlign = 'left';
    const lab = siret[Math.floor(siret.length * .74)]; y.save(); y.translate(lab[0] + 14, lab[1]); y.fillText('Siret', 0, 0); y.restore();
    // scara și nordul
    y.strokeStyle = y.fillStyle = 'rgba(245,234,216,.75)'; y.lineWidth = 1.5; const sx = MW - 26 - 5 * km, sy = MH - 26;
    y.fillRect(sx, sy - 3, 2.5 * km, 3); y.strokeRect(sx + .5, sy - 3, 5 * km, 3);
    y.font = '600 11px Figtree, sans-serif'; y.textAlign = 'left'; y.fillText('0', sx - 2, sy - 12); y.textAlign = 'right'; y.fillText('5 km', sx + 5 * km + 4, sy - 12);
    const nx = MW - 30, ny = 46; y.beginPath(); y.moveTo(nx, ny - 18); y.lineTo(nx + 7, ny + 4); y.lineTo(nx, ny - 1); y.closePath(); y.fill(); y.globalAlpha = .4; y.beginPath(); y.moveTo(nx, ny - 18); y.lineTo(nx - 7, ny + 4); y.lineTo(nx, ny - 1); y.closePath(); y.fill(); y.globalAlpha = 1;
    y.font = '800 12px Figtree, sans-serif'; y.textAlign = 'center'; y.fillText('N', nx, ny + 16);
    const vg = y.createRadialGradient(MW / 2, MH / 2, Math.min(MW, MH) * .45, MW / 2, MH / 2, Math.max(MW, MH) * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)'); y.fillStyle = vg; y.fillRect(0, 0, MW, MH);

    // ---- punctele: butoane reale (se pot atinge pe tablă și pe telefon)
    const P = D.pts.map(q => Object.assign({}, q, { x: q.xy[0] * sc, y: q.xy[1] * sc, n2: 0, cool: 0, ph: rnd() }));
    let sel = P[3];
    P.forEach(q => { const b = document.createElement('button'); b.className = 'mp-pin' + (q.moth ? ' moth' : '') + (q.x > riverX(q.y) ? ' r' : ' l');
      b.style.left = q.x + 'px'; b.style.top = q.y + 'px'; b.setAttribute('aria-label', `Punctul ${q.n}, zona ${q.sat}`);
      b.innerHTML = `<span class="d">${q.n}</span><span class="t">${String(q.n).padStart(2, '0')} · ${q.sat}</span>`; q.btn = b;
      b.addEventListener('click', e => { e.stopPropagation(); select(q, true); }); pinsEl.appendChild(b); });
    function show() {
      selEl.innerHTML = `<small>PUNCTUL ${String(sel.n).padStart(2, '0')} DIN 10</small><h3>Zona ${sel.sat}</h3>
        <p>Două stații NOCTURNA pe același copac, la 3–4 m înălțime${sel.moth ? ', alături de un aparat profesional AudioMoth, ca să comparăm ce aud' : ''}.</p>
        <div class="mp-meta"><span>${sel.lat.toFixed(3).replace('.', ',')}° N · ${sel.lon.toFixed(3).replace('.', ',')}° E</span><span><b>${sel.n2}</b> strigăte captate aici</span></div>`;
      P.forEach(q => q.btn.classList.toggle('on', q === sel));
    }
    function call(q, len) { if (SND.ctx && !SND.muted) { const pan = (q.x / MW * 2 - 1) * .85; SND.oneShot(R() < .65 ? 'cocori' : 'gaste', { from: 5 + R() * 60, len, vol: .5, pan0: pan, pan1: pan }); } }
    function select(q, sound) { sel = q; show(); if (sound) call(q, 5); }
    show();

    // culoarul de migrație: trei curbe care urmează valea, de la nord la sud
    const lanes = [-1.6, 0, 1.6].map(o => siret.filter((p, i) => i % 2 === 0).map(p => [p[0] + o * km + 1.2 * km, p[1]]));
    let flocks = [], next = 500, last = performance.now(), t0 = performance.now(), bursts = [], total = 0, lastSnd = 0;
    map = { el, frame(now) {
      const dt = Math.min(64, now - last); last = now;
      x.drawImage(st, 0, 0, MW, MH);
      for (let i = 0; i < 3; i++) { const fx = ((now * .005 * (i + 1) + i * 340) % (MW + 400)) - 200, fy = MH * (.22 + i * .27);   // ceața peste luncă
        const g = x.createRadialGradient(fx, fy, 0, fx, fy, 190); g.addColorStop(0, 'rgba(205,220,230,.06)'); g.addColorStop(1, 'rgba(205,220,230,0)'); x.fillStyle = g; x.fillRect(fx - 190, fy - 190, 380, 380); }
      x.save(); x.lineCap = 'round';
      x.setLineDash([2, 12]); x.lineDashOffset = -now * .018; x.strokeStyle = 'rgba(210,235,248,.6)'; x.lineWidth = 1.4; x.beginPath(); siret.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke();
      x.setLineDash([10, 16]); x.lineDashOffset = -now * .03; x.strokeStyle = 'rgba(246,160,107,.18)'; x.lineWidth = 1.2;
      lanes.forEach(l => { x.beginPath(); l.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke(); });
      x.restore();
      const m = ((now - t0) / 120000 % 1) * 840, hh = (17 + Math.floor(m / 60)) % 24, mm = Math.floor(m % 60 / 10) * 10;
      clockEl.textContent = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0'); nightBar.style.width = (m / 840 * 100).toFixed(2) + '%';
      if ((next -= dt) < 0) { const l = pick(lanes); flocks.push({ l, k: 0, sp: .00006 + R() * .00004, n: 4 + Math.floor(R() * 6), s: .75 + R() * .45, ph: R() * 6 }); next = 2400 + R() * 3000; }
      x.strokeStyle = 'rgba(245,234,216,.9)'; x.lineCap = 'round'; x.lineWidth = 1.5;
      flocks = flocks.filter(f => { f.k += f.sp * dt; if (f.k >= 1) return false;
        const fi = f.k * (f.l.length - 1), i0 = Math.floor(fi), a = f.l[i0], b = f.l[Math.min(f.l.length - 1, i0 + 1)], u = fi - i0, fx = a[0] + (b[0] - a[0]) * u, fy = a[1] + (b[1] - a[1]) * u;
        for (let i = 0; i < f.n; i++) { const side = i % 2 ? 1 : -1, k = Math.ceil(i / 2), bx = fx + side * k * 8 * f.s, by = fy - k * 10 * f.s, w = Math.sin(now * .014 + f.ph + i) * 3 * f.s;
          x.beginPath(); x.moveTo(bx - 6 * f.s, by - w); x.quadraticCurveTo(bx - 3 * f.s, by - 2 - w * .4, bx, by); x.quadraticCurveTo(bx + 3 * f.s, by - 2 - w * .4, bx + 6 * f.s, by - w); x.stroke(); }
        for (const q of P) if (now > q.cool && Math.hypot(fx - q.x, fy - q.y) < 2.2 * km) {
          q.cool = now + 3000; q.n2++; total++; totalEl.textContent = total; bursts.push({ x: q.x, y: q.y, t: now }); if (q === sel) show();
          if (now - lastSnd > 4500) { lastSnd = now; call(q, 4.5); } }
        return true; });
      for (const q of P) for (let r = 0; r < 2; r++) { const ph = ((now / 2800 + q.ph + r / 2) % 1); x.strokeStyle = `rgba(246,160,107,${((1 - ph) * (q === sel ? .5 : .22)).toFixed(3)})`; x.lineWidth = 1; x.beginPath(); x.arc(q.x, q.y, 9 + ph * 1.5 * km, 0, 6.3); x.stroke(); }
      bursts = bursts.filter(b => { const k = (now - b.t) / 1500; if (k > 1) return false;
        x.strokeStyle = `rgba(255,214,170,${(1 - k).toFixed(3)})`; x.lineWidth = 2; x.beginPath(); x.arc(b.x, b.y, 10 + k * 2.4 * km, 0, 6.3); x.stroke();
        x.fillStyle = `rgba(255,226,190,${(1 - k).toFixed(3)})`; x.font = '800 13px Figtree, sans-serif'; x.textAlign = 'center'; x.fillText('+1', b.x, b.y - 20 - k * 20); return true; });
    } };
  }
  const mapSlide = ($('.map-live') || { closest: () => null }).closest('.slide');
  if (qs.has('debug')) window.SND = SND;

  // ---------- încărcarea leneșă: imaginile și posterele se descarcă doar pentru slide-urile din jur ----------
  function hydrate(slide) {
    if (!slide || slide.dataset.h) return; slide.dataset.h = '1';
    $$('img[data-src]', slide).forEach(im => { im.src = im.dataset.src; im.removeAttribute('data-src'); });
    $$('video[data-poster]', slide).forEach(v => { v.poster = v.dataset.poster; v.removeAttribute('data-poster'); });
  }

  // ---------- videoclipurile ----------
  function loadVideos(slide, play) {
    $$('video', slide).forEach(v => {
      if (!v.src) { v.preload = play || !TOUCH ? 'auto' : 'metadata'; v.src = v.dataset.src; }   // pe telefon, următorul clip doar se pregătește
      if (play) { v.currentTime = 0; v.play().catch(() => {}); }
    });
  }
  function stopVideos(slide) { $$('video', slide).forEach(v => v.pause()); }

  // rotirea pieselor cu mouse-ul sau cu degetul
  $$('.vid[data-scrub]').forEach(box => {
    const v = $('video', box); let sx = 0, st = 0, on = false, resume = 0;
    box.addEventListener('pointerdown', e => { on = true; sx = e.clientX; st = v.currentTime; v.pause(); box.classList.add('drag', 'used'); box.setPointerCapture(e.pointerId); clearTimeout(resume); e.stopPropagation(); });
    box.addEventListener('pointermove', e => { if (!on || !v.duration) return; const dx = (e.clientX - sx) / box.getBoundingClientRect().width; let t = (st - dx * v.duration * 1.1) % v.duration; if (t < 0) t += v.duration; v.currentTime = t; });
    const end = () => { if (!on) return; on = false; box.classList.remove('drag'); resume = setTimeout(() => { if (box.closest('.slide.active')) v.play().catch(() => {}); }, 2500); };
    box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end);
    box.addEventListener('click', e => e.stopPropagation());
  });

  // ---------- trecerea între slide-uri ----------
  const progI = $('#progress i'), progB = $('#progress svg'), countEl = $('#count');
  function go(i, quiet) {
    i = Math.max(0, Math.min(N - 1, i)); if (i === cur) return;
    const old = slides[cur], nw = slides[i];
    // obiectele care alunecă dintr-un slide în altul (ca Morph în PowerPoint): luna, logo-ul, pătrățelele
    const from = {};
    if (old) $$('[data-morph]', old).forEach(el => { from[el.dataset.morph] = { l: el.style.left, t: el.style.top, w: el.style.width, h: el.style.height }; });
    nw.classList.add('reset'); nw.classList.remove('in', 'leaving'); void nw.offsetWidth; nw.classList.remove('reset');
    $$('[data-morph]', nw).forEach(el => {
      const f = from[el.dataset.morph]; if (!f) return;
      const to = { l: el.style.left, t: el.style.top, w: el.style.width, h: el.style.height };
      if (f.l === to.l && f.t === to.t && f.w === to.w) return;
      el.style.transition = 'none'; Object.assign(el.style, { left: f.l, top: f.t, width: f.w, height: f.h }); void el.offsetWidth;
      el.style.transition = 'left 1.2s var(--ease), top 1.2s var(--ease), width 1.2s var(--ease), height 1.2s var(--ease)';
      Object.assign(el.style, { left: to.l, top: to.t, width: to.w, height: to.h });
    });
    if (old) { old.classList.remove('active', 'in'); old.classList.add('leaving'); stopVideos(old); setTimeout(() => { if (slides[cur] !== old) old.classList.remove('leaving'); }, 800); }
    nw.classList.add('active');
    requestAnimationFrame(() => requestAnimationFrame(() => nw.classList.add('in')));
    const night = nw.classList.contains('night');
    stage.classList.toggle('is-night', night); document.body.classList.toggle('light-bg', !night);
    if (night && nw.dataset.div) sky.flock();
    cur = i;
    hydrate(nw); hydrate(slides[i + 1]); hydrate(slides[i - 1]); setTimeout(() => hydrate(slides[i + 2]), 1500);
    if (!map && mapSlide && Math.abs(slides.indexOf(mapSlide) - i) <= 1) mountMap();   // harta se desenează abia când ajungi lângă ea
    curMoon = $('.im.moon', nw);
    loadVideos(nw, true); if (slides[i + 1]) loadVideos(slides[i + 1], false);
    if (!STATIC) { count(nw); typeCode(nw); }
    if (!quiet) { SND.play(nw, i); if (nw.dataset.div) SND.whoosh(); else SND.tick(); }
    const p = N > 1 ? i / (N - 1) : 1; progI.style.width = p * 100 + '%'; progB.style.left = `calc(${p * 100}% ${p > .98 ? '- 16px' : p < .02 ? '+ 16px' : ''})`;
    countEl.textContent = `${i + 1} / ${N}`;
    $$('#menuList button').forEach(b => b.classList.toggle('cur', +b.dataset.i === i));
    history.replaceState(null, '', location.pathname + location.search + '#' + (i + 1));
  }
  const next = () => go(cur + 1), prev = () => go(cur - 1);

  // ---------- cuprinsul ----------
  const ml = $('#menuList');
  slides.forEach((s, i) => {
    if (s.dataset.div) { const li = document.createElement('li'); li.className = 'ch'; li.textContent = (($('.tx.cnt', s) || {}).textContent || '').trim() + ' · ' + s.dataset.title; ml.appendChild(li); }
    const li = document.createElement('li'), b = document.createElement('button');
    b.dataset.i = i; b.innerHTML = `<span>${i + 1}</span>`; b.appendChild(document.createTextNode(s.dataset.title || (i === 0 ? 'Coperta' : 'Slide ' + (i + 1))));
    b.addEventListener('click', () => { closeMenu(); go(i); }); li.appendChild(b); ml.appendChild(li);
  });
  const menu = $('#menu');
  const openMenu = () => { menu.hidden = false; const b = $('#menuList button.cur'); if (b) b.focus(); };
  const closeMenu = () => { menu.hidden = true; };
  $('#menuClose').addEventListener('click', closeMenu);
  menu.addEventListener('click', e => { if (e.target === menu) closeMenu(); });

  // ---------- comenzile ----------
  const full = () => { const d = document; if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d); else { const el = d.documentElement; const fn = el.requestFullscreen || el.webkitRequestFullscreen; const r = fn ? fn.call(el) : null; if (r && r.catch) r.catch(() => {}); } };
  const toggleSound = () => { if (!SND.ctx) { SND.init(false); SND.play(slides[cur], cur); return; } SND.setMuted(!SND.muted); };
  $('#bPrev').addEventListener('click', e => { e.stopPropagation(); prev(); });
  $('#bNext').addEventListener('click', e => { e.stopPropagation(); next(); });
  $('#bSound').addEventListener('click', e => { e.stopPropagation(); toggleSound(); });
  $('#bMenu').addEventListener('click', e => { e.stopPropagation(); openMenu(); });
  $('#bFull').addEventListener('click', e => { e.stopPropagation(); full(); });
  const intro = $('#intro');
  addEventListener('keydown', e => {
    if (!intro.classList.contains('gone')) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); start(false); } return; }
    if (!menu.hidden) { if (e.key === 'Escape' || e.key.toLowerCase() === 'o') closeMenu(); return; }
    const k = e.key;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(k)) { e.preventDefault(); next(); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); prev(); }
    else if (k === 'Home') go(0); else if (k === 'End') go(N - 1);
    else if (k.toLowerCase() === 'f') full();
    else if (k.toLowerCase() === 's' || k.toLowerCase() === 'm') toggleSound();
    else if (k.toLowerCase() === 'o' || k === 'Escape') openMenu();
  });
  // logo-ul NOCTURNA duce înapoi la început, ca pe orice site
  $$('[data-morph="noc"]').forEach(el => { el.setAttribute('role', 'link'); el.setAttribute('aria-label', 'Înapoi la început'); el.title = 'Înapoi la început'; });
  $('.menu-h img').style.cursor = 'pointer'; $('.menu-h img').addEventListener('click', () => { closeMenu(); go(0); });
  let swiped = 0;
  stage.addEventListener('click', e => { if (Date.now() - swiped < 500) return; if (e.target.closest('[data-morph="noc"]')) { go(0); return; } if (e.target.closest('button, a, .vid[data-scrub], .map-live')) return; if (e.clientX < innerWidth * .25) prev(); else next(); });
  let tx0 = 0, ty0 = 0;
  addEventListener('touchstart', e => { tx0 = e.touches[0].clientX; ty0 = e.touches[0].clientY; }, { passive: true });
  addEventListener('touchend', e => { if (e.target.closest('.vid[data-scrub], #menu, #bar, .map-live')) return; const dx = e.changedTouches[0].clientX - tx0, dy = e.changedTouches[0].clientY - ty0; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { swiped = Date.now(); (dx < 0 ? next : prev)(); }
    else if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx)) { swiped = Date.now(); (dy < 0 ? next : prev)(); } }, { passive: true });   // glisare în sus = mai departe
  // rotița mouse-ului și trackpad-ul: scroll în jos = slide-ul următor, în sus = cel anterior (un slide pe gest)
  let wheelAcc = 0, wheelLock = 0, wheelIdle = 0;
  addEventListener('wheel', e => {
    if (!intro.classList.contains('gone') || !menu.hidden) return;
    e.preventDefault();
    const now = Date.now(); clearTimeout(wheelIdle); wheelIdle = setTimeout(() => { wheelAcc = 0; }, 180);
    if (now < wheelLock) return;
    wheelAcc += Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (Math.abs(wheelAcc) > 40) { (wheelAcc > 0 ? next : prev)(); wheelAcc = 0; wheelLock = now + 850; }
  }, { passive: false });
  let idle = 0;
  const wake = () => { document.body.classList.remove('idle'); clearTimeout(idle); idle = setTimeout(() => document.body.classList.add('idle'), TOUCH ? 4500 : 2600); };
  addEventListener('pointerdown', wake);
  addEventListener('pointermove', e => {
    wake();
    if (e.pointerType === 'mouse' && !LOW) { stage.style.setProperty('--mx', (e.clientX / innerWidth - .5) * 2); stage.style.setProperty('--my', (e.clientY / innerHeight - .5) * 2); }
  });
  $('#sideL').addEventListener('click', e => { e.stopPropagation(); prev(); });
  $('#sideR').addEventListener('click', e => { e.stopPropagation(); next(); });
  $('#rotateGo').addEventListener('click', () => { rotateOff = true; checkRotate(); });
  addEventListener('resize', () => { fit(); if (!intro.classList.contains('gone')) sizeIntro(); });
  addEventListener('orientationchange', () => setTimeout(fit, 250));
  addEventListener('hashchange', () => { const n = parseInt(location.hash.slice(1)); if (n) go(n - 1); });

  // ---------- bucla de animație ----------
  let frameN = 0, curMoon = null, lastLvl = -1;
  function loop(now) {
    const has = SND.read();
    let rms = 0; if (has) { for (let i = 0; i < SND.time.length; i += 8) { const v = (SND.time[i] - 128) / 128; rms += v * v; } rms = Math.sqrt(rms / (SND.time.length / 8)); }
    lvl += (Math.min(1, rms * 5) - lvl) * .12;
    if (curMoon && Math.abs(lvl - lastLvl) > .01) { curMoon.style.setProperty('--lvl', lvl.toFixed(2)); lastLvl = lvl; }
    const night = stage.classList.contains('is-night');
    if (!(LOW || TOUCH) || (frameN++ & 1)) sky.frame(now, lvl, !night);
    drawHorizon(now, night, has);
    if (spec && slides[cur] && slides[cur].contains(spec.wrap)) spec.frame(has, now);
    if (map && slides[cur] && slides[cur].contains(map.el)) map.frame(now);
    if (introSky && !intro.classList.contains('gone')) introSky.frame(now, 0);
    requestAnimationFrame(loop);
  }

  // ---------- pornirea ----------
  const band = $('.band'); if (band) $('.intro-band').appendChild(band.cloneNode(true));
  function start(muted) {
    if (intro.classList.contains('gone')) return;
    SND.init(muted);
    document.body.classList.add('started');
    intro.classList.add('gone'); setTimeout(() => { intro.hidden = true; introSky = null; }, 1300);
    if (!qs.has('nofs') && (innerWidth > 900 || TOUCH)) {
      full();
      try { if (screen.orientation && screen.orientation.lock && Math.min(innerWidth, innerHeight) < 600) screen.orientation.lock('landscape').catch(() => {}); } catch (e) { /* nu se poate bloca */ }
    }
    setTimeout(checkRotate, 50);
    const n = cur; cur = -1; go(n < 0 ? 0 : n);
  }
  $('#go').addEventListener('click', () => start(false));
  $('#goMute').addEventListener('click', () => start(true));
  if (FILE) { const s = document.createElement('script'); s.src = 'media/audio/sunete.js'; document.head.appendChild(s); }

  fit(); sizeIntro();
  go(Math.max(0, (parseInt(location.hash.slice(1)) || 1) - 1), true);
  if (qs.has('direct')) { intro.classList.add('gone'); intro.hidden = true; document.body.classList.add('started'); }
  if (qs.has('autostart')) setTimeout(() => { intro.classList.remove('gone'); intro.hidden = false; start(false); }, 300);   // doar pentru verificare
  requestAnimationFrame(loop);
  setTimeout(() => document.body.classList.add('idle'), 3000);
})();
