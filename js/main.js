import { groove, STYLES } from './audio.js';
import { VIDEOS, CHANNEL } from './data.js';
import { LOGO } from './logo.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
if (REDUCED) document.documentElement.classList.add('reduced');
$('#yr').textContent = new Date().getFullYear();
$$('[data-logo]').forEach(el => { el.innerHTML = LOGO; });

// ─── Title tidying ──────────────────────────────────────────
const KEEP = new Set(['DJ', 'TPX', 'BHW', 'YMMH', 'PST', 'VOK', 'HICC', 'MD', 'II', 'SMJ', 'VAS']);
function nice(t) {
  t = t.replace(/‼️|‼/g, '').replace(/\|/g, ' ').replace(/\s*·\s*\.+/g, ' · ')
    .replace(/\s*[·,]?\s*babyk(e|le)o sessions\s*/ig, ' ').replace(/babykelo sessions\s*·?/ig, '')
    .replace(/\s+x\s+/gi, ' × ').replace(/\s{2,}/g, ' ').replace(/^[\s·,]+|[\s·,.]+$/g, '').trim();
  const letters = t.replace(/[^a-z]/gi, ''), upper = t.replace(/[^A-Z]/g, '');
  if (letters.length && upper.replace(/@\w+/g, '').length / letters.length > 0.5) {
    const SMALL = new Set(['by', 'and', 'ft', 'feat', 'of', 'the', 'on', 'in', 'with', 'x', 'a', 'to']);
    t = t.split(' ').map((w, i) => {
      if (w.startsWith('@') || KEEP.has(w.replace(/[^A-Z]/g, ''))) return w;
      const lw = w.toLowerCase();
      return i && SMALL.has(lw) ? lw : w.charAt(0) + w.slice(1).toLowerCase();
    }).join(' ');
  }
  return t || 'Babykelo';
}
const fmt = n => n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.0', '') + 'K' : String(n);
const thumb = (id, q = 'hqdefault') => `https://i.ytimg.com/vi/${id}/${q}.jpg`;
VIDEOS.forEach(v => { v.nice = nice(v.t); v.search = (v.t + ' ' + v.nice + ' ' + v.tags.join(' ')).toLowerCase(); });
const LONG = VIDEOS.filter(v => !v.s);
const SHORTS = VIDEOS.filter(v => v.s);

// ─── 3D scene (loaded lazily so the page still works without WebGL) ───
let scene = null;
const loadEl = $('#load b');
let loadPct = 0;
const loadTick = setInterval(() => { loadPct = Math.min(loadPct + Math.random() * 9, scene ? 100 : 88); loadEl.textContent = Math.round(loadPct) + '%'; if (loadPct >= 100) { clearInterval(loadTick); $('#load').innerHTML = 'kit ready <b>✓</b>'; } }, 90);
import('./scene.js').then(m => { scene = m.createScene($('#stage'), groove); onScroll(); })
  .catch(err => { console.warn('3D disabled:', err); document.body.classList.add('no-webgl'); scene = { setProgress() {}, pause() {}, hit() {}, pick() { return null; }, screenOf() { return null; } }; });

// ─── Gate / count-in ────────────────────────────────────────
const gate = $('#gate');
async function countIn() {
  gate.classList.add('is-counting');
  await groove.init();
  const beat = 60 / STYLES[groove.style].bpm;
  const t0 = groove.ctx.currentTime + 0.1;
  for (let i = 0; i < 4; i++) {
    groove.rim(t0 + i * beat, i === 0 ? 1 : 0.8);
    setTimeout(() => { $('#count').innerHTML = `<span>${i + 1}</span>`; }, (0.1 + i * beat) * 1000);
  }
  setTimeout(() => { groove.start(); openSite(); }, (0.1 + 4 * beat) * 1000 - 60);
}
function openSite(restoring = false) {
  remember('entered', '1');
  $('#count').innerHTML = '';
  gate.classList.add('is-gone');
  document.body.classList.remove('is-locked');
  $('#dock').classList.add('is-in');
  lenis?.start();
  ScrollTrigger?.refresh();
  if (restoring) return;
  if (gsap && !REDUCED) gsap.from('#heroWord span', { yPercent: 110, rotate: 8, opacity: 0, stagger: 0.06, duration: 1.2, ease: 'expo.out' });
  if (gsap && !REDUCED) gsap.from('.hero__roles span, .hero__quote, .hero__meta', { y: 20, opacity: 0, stagger: 0.05, duration: 1, delay: 0.4, ease: 'expo.out' });
  if (location.hash && $(location.hash)) setTimeout(() => jumpTo($(location.hash), true), 400);
}

// ─── Session memory: a refresh (or coming back from the booking page) lands you where you were ───
function remember(k, v) { try { sessionStorage.setItem('bk-' + k, v); } catch {} }
function recall(k) { try { return sessionStorage.getItem('bk-' + k); } catch { return null; } }
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
const WAS_PLAYING = recall('playing') === '1', WAS_ENTERED = !!recall('entered');
$('#enter').addEventListener('click', countIn, { once: true });
$('#enterQuiet').addEventListener('click', () => { groove.init(); openSite(); }, { once: true });

// ─── Smooth scroll & scroll-linked camera ───────────────────
let lenis = null;
if (window.Lenis && !REDUCED) {
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  lenis.stop();
  if (gsap) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
  else { const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
}
function jumpTo(target, instant = false) {
  if (lenis) lenis.scrollTo(target, { offset: 0, duration: instant ? 0 : 1.6, immediate: instant, force: true });
  else if (typeof target === 'number') scrollTo({ top: target, behavior: instant ? 'auto' : 'smooth' });
  else target.scrollIntoView({ behavior: instant ? 'auto' : 'smooth' });
}
const depth = () => history.state?.depth || 0;
history.replaceState({ ...(history.state || {}), depth: depth(), y: scrollY }, '');
function goSection(id) {
  const el = $(id); if (!el) return;
  history.replaceState({ ...history.state, y: scrollY }, '');           // remember where we left from
  history.pushState({ depth: depth() + 1, section: id }, '', id);
  jumpTo(el); updateNavButtons();
}
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  if (!$(a.getAttribute('href'))) return;
  e.preventDefault(); closeMenu(); goSection(a.getAttribute('href'));
}));
addEventListener('popstate', e => {
  if (!modal.hidden) { closeVideo(true); updateNavButtons(); return; } // Back closes an open video first
  const st = e.state || {};
  if (st.section && $(st.section)) jumpTo($(st.section));
  else jumpTo(typeof st.y === 'number' ? st.y : 0);
  updateNavButtons();
});
let saveT = 0;
addEventListener('scroll', () => { clearTimeout(saveT); saveT = setTimeout(() => remember('y', String(Math.round(scrollY))), 150); }, { passive: true });
addEventListener('pagehide', () => remember('y', String(Math.round(scrollY))));

const shots = $$('[data-shot]');
const navLinks = $$('.nav__links a');
function onScroll() {
  const mid = scrollY + innerHeight * 0.5;
  let i = 0;
  const tops = shots.map(el => el.getBoundingClientRect().top + scrollY);
  for (let k = 0; k < shots.length; k++) if (tops[k] <= mid) i = k;
  const s = shots[i], frac = Math.min(1, Math.max(0, (mid - tops[i]) / s.offsetHeight));
  scene?.setProgress(Math.min(1, (i + frac) / (shots.length - 1)));
  navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + s.id));
}
addEventListener('scroll', onScroll, { passive: true });

// ─── Hero letters dance with the groove ─────────────────────
const letters = $$('#heroWord span');
const logoDot = $('.nav__logo i');
const padMap = {};
groove.on((type, v) => {
  if (type === 'step' && !REDUCED) {
    const L = letters[v % 8];
    L.classList.add('bump');
    L.animate([{ transform: 'translateY(0) scaleY(1)' }, { transform: 'translateY(-4%) scaleY(1.06)' }, { transform: 'translateY(0) scaleY(1)' }], { duration: 220, easing: 'ease-out' });
    setTimeout(() => L.classList.remove('bump'), 140);
  }
  if (type === 'kick') {
    logoDot.classList.add('pulse'); setTimeout(() => logoDot.classList.remove('pulse'), 90);
    if (!REDUCED) $('#heroWord').animate([{ transform: 'scale(1,1)' }, { transform: `scale(1.012, ${0.975 + (1 - v) * 0.01})` }, { transform: 'scale(1,1)' }], { duration: 180, easing: 'ease-out' });
  }
  if (type === 'step') stepEls.forEach((el, k) => el.classList.toggle('on', k === (v + 15) % 16));
  if (type === 'state') {
    if (!v) stepEls.forEach(el => el.classList.remove('on'));
    refreshDock();
  }
  const pad = padMap[type === 'talk' ? 'talkup' : type];
  if (pad) flash(pad);
});

// ─── Marquee ────────────────────────────────────────────────
const CREW = ['Wizkid', 'Ada Ehi', 'Tim Godfrey', 'Masterkraft', 'Victony', 'DJ Tunez', 'Ramoni', 'Dr. Eddy', 'Ccioma', 'Samuel Giveson', 'Blahktonez', 'SMJ', 'Hillsplay', 'Vickyiano', 'Spyro'];
const CREW2 = ['Voice of Karis', 'MaskTunes', 'VOK Ent', 'Flystickz', 'Centent Cymbals', 'Drum Quarters', 'Drum Session Lagos', 'Celebration Church Choir', 'Teni Entertainer', 'Lagos Bfingerz', 'Dvybz'];
const fill = (el, arr) => { const html = arr.map(n => `<span>${n}</span>`).join(''); el.innerHTML = html + html; };
fill($('#marquee'), CREW); fill($('#marquee2'), CREW2);

// ─── Journey ────────────────────────────────────────────────
const JOURNEY = [
  { y: 'Early', h: 'Drumming on everything', p: 'In Delta State a restless kid turns tables, pots and doors into a drum kit, with his mother\'s 1980s records playing in the background.' },
  { y: '2012', h: 'Star Quest 2012', p: 'He reaches the finals as part of a band and takes 3rd place nationally. The stage is officially home.' },
  { y: '2016', h: 'The channel goes live', p: 'Babykelo opens his YouTube channel. Everything that follows gets documented, one groove at a time.' },
  { y: '2020', h: 'Rehearsals with Samuel Giveson', p: 'A rehearsal clip becomes his most-watched video ever. The same year he plays “In Your Name” in Sierra Leone and tears up “On High” at The Outsider.', v: 'vO2_n375JVI' },
  { y: '2021', h: 'Ada Ehi · Daystar · Gatz Drum Show', p: 'A drum cam of “In Your Name” live with Ada Ehi at Daystar, and a headline moment at the Gatz Drum Show in Owerri. He goes on the road with Ada, as far as Cameroon 🇨🇲.', v: 'IMnLjP2Scm0' },
  { y: '2022', h: 'HICC with SMJ & Blahktonez', p: 'Worship at full voltage. He also takes a makossa vibe and a “Levels” cover past 14K views each.', v: 'Rdb02tVS8uM' },
  { y: '2023', h: 'Sabi Girl × Vickyiano', p: 'Ayra Starr\'s “Sabi Girl”, reworked with Vickyiano, climbs to 18K views and marks the start of a new era.', v: 'cxKxr7ORGP8' },
  { y: '2024', h: 'The Babykelo Sessions', p: 'Forty-plus sessions covering Burna, Flavour, Tems, Wizkid, Olamide, Ayra Starr and gospel anthems. There are Drum Quarters features, Drum Session Lagos, and the 16K-view “Terminator”.', v: '1BNu-CkzsU0' },
  { y: '2025', h: 'Centent Cymbals & Flystickz', p: 'He\'s unveiled as a Centent Cymbals & Gongs artist, and Flystickz launches the BabyKelo Signature Series 5B drumsticks, built for power and control. He also drops “Eze” with Masterkraft.', v: '6MnOI_fDZO8' },
  { y: '2026', h: 'Something Light', p: 'A new series with Kompa Madness, “Tension”, Chioma and Lagos Bfingerz. He\'s still pushing, still shedding, still getting louder.', v: 'q8ZH5ALAPK4' },
];
$('#timeline').innerHTML = '<span class="timeline__fill"></span>' + JOURNEY.map(j => `
  <li class="tl">
    <span class="tl__dot"></span>
    <div class="tl__year">${j.y}</div>
    <div class="tl__card">
      <div><h3>${j.h}</h3><p>${j.p}</p></div>
      ${j.v ? `<button class="tl__thumb" data-vid="${j.v}" aria-label="Watch: ${j.h}"><img src="${thumb(j.v, 'mqdefault')}" alt="" loading="lazy"></button>` : ''}
    </div>
  </li>`).join('');


// ─── Frames: photo strip ────────────────────────────────────
const FRAMES = [
  { id: '2Axu6hl_7n0', c: 'Game Changer · Flavour', y: 2024, shape: 'tall' },
  { img: 'assets/kelo.jpg', c: 'Flystickz artist shoot', y: 2024, shape: 'tall', pos: '50% 40%' },
  { id: 'jrped_loRGc', c: 'Terminator · Drum Quarters', y: 2024, shape: 'wide' },
  { id: 'B4DGsOrhECU', c: 'Apala Disco · Babykelo Sessions', y: 2024, shape: 'square' },
  { id: 'cxKxr7ORGP8', c: 'Sabi Girl × Vickyiano', y: 2023, shape: 'wide' },
  { id: 'AhtS_akH2SI', c: 'Celebration Church Choir', y: 2024, shape: 'tall' },
  { img: 'assets/avatar.jpg', c: 'On the kit, live', y: '', shape: 'square' },
  { id: 'Rdb02tVS8uM', c: 'HICC with SMJ & Blahktonez', y: 2022, shape: 'wide' },
  { id: 'Xf0vb8dmNxc', c: 'Beautiful Rain · Cavemen', y: 2024, shape: 'tall' },
  { id: 'iJm25JzbVL8', c: 'Flystickz Series 1 unveiling', y: 2025, shape: 'wide' },
  { id: 'eic8-jdyaI8', c: 'Commander', y: 2025, shape: 'square' },
  { id: 'q8ZH5ALAPK4', c: 'Tension', y: 2026, shape: 'tall' },
];
$('#framesStrip').innerHTML = FRAMES.map((f, i) => `
  <figure class="frame frame--${f.shape}" ${f.id ? `data-vid="${f.id}" role="button" tabindex="0" aria-label="Watch ${f.c}"` : ''}>
    <div class="frame__img"><img src="${f.img || thumb(f.id, 'maxresdefault')}" alt="Babykelo, ${f.c}" loading="lazy" decoding="async" style="${f.pos ? `object-position:${f.pos}` : ''}"></div>
    <figcaption><span class="mono">${String(i + 1).padStart(2, '0')}${f.y ? ' · ' + f.y : ''}</span>${f.c}${f.id ? '<i>▶</i>' : ''}</figcaption>
  </figure>`).join('');
const openFrame = el => { const v = VIDEOS.find(x => x.id === el.dataset.vid); if (v) openVideo(v, FRAMES.filter(f => f.id).map(f => VIDEOS.find(x => x.id === f.id)).filter(Boolean)); };
$('#framesStrip').addEventListener('click', e => { const f = e.target.closest('[data-vid]'); if (f) openFrame(f); });
$('#framesStrip').addEventListener('keydown', e => { const f = e.target.closest('[data-vid]'); if (f && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openFrame(f); } });

// ─── Flip-book previews: hovering a video cycles through its frames ───
let flipTimer = null;
document.addEventListener('pointerover', e => {
  if (!FINE) return;
  const c = e.target.closest('button.card, button.short'); if (!c || c._flip) return;
  const img = $('img', c), id = c.dataset.vid; c._flip = true;
  img.dataset.orig ||= img.src;
  const seq = ['hq1', 'hq2', 'hq3'].map(q => thumb(id, q));
  seq.forEach(u => { const i = new Image(); i.src = u; });
  let k = 0; clearInterval(flipTimer);
  flipTimer = setInterval(() => { img.src = seq[k++ % seq.length]; }, 650);
  c.classList.add('is-flipping');
  c.addEventListener('pointerleave', () => { c._flip = false; c.classList.remove('is-flipping'); clearInterval(flipTimer); img.src = img.dataset.orig; }, { once: true });
});

// ─── Vault: carousel ────────────────────────────────────────
const TOP = [...LONG].sort((a, b) => b.v - a.v).slice(0, 10);
const ring = $('#ring');
ring.innerHTML = TOP.map((v, i) => `<button class="slide" data-i="${i}" aria-label="${v.nice}"><img src="${thumb(v.id)}" alt="" loading="lazy"><span class="slide__views">${fmt(v.v)} views</span><span class="slide__play"></span></button>`).join('');
const slides = $$('.slide', ring);
let ringIdx = 0, ringAngle = 0, ringTarget = 0, dragging = false;
const step = 360 / TOP.length;
function layoutRing() {
  const w = ring.offsetWidth, r = Math.round((w / 2) / Math.tan(Math.PI / TOP.length)) + 40;
  slides.forEach((s, i) => { s.style.transform = `rotateY(${i * step}deg) translateZ(${r}px)`; });
  ring.style.setProperty('--r', r + 'px');
  ring.dataset.r = r;
}
function setRing(i) {
  ringIdx = (i % TOP.length + TOP.length) % TOP.length;
  // choose the shortest rotation to the target
  const want = -i * step;
  ringTarget = want;
  slides.forEach((s, k) => s.classList.toggle('is-front', k === ringIdx));
  $('#ringTitle').textContent = TOP[ringIdx].nice;
}
function ringLoop() {
  if (!dragging) ringAngle += (ringTarget - ringAngle) * 0.08;
  ring.style.transform = `translateZ(-${ring.dataset.r || 600}px) rotateY(${ringAngle}deg)`;
  requestAnimationFrame(ringLoop);
}
layoutRing(); addEventListener('resize', layoutRing);
let ringPos = 0; setRing(0); ringLoop();
$('#ringPrev').onclick = () => setRing(--ringPos);
$('#ringNext').onclick = () => setRing(++ringPos);
let auto = setInterval(() => { if (!dragging && !document.hidden) setRing(++ringPos); }, 4200);
const stage = $('.carousel__stage');
let dx0 = 0, a0 = 0, moved = 0;
stage.addEventListener('pointerdown', e => { dragging = true; dx0 = e.clientX; a0 = ringAngle; moved = 0; clearInterval(auto); });
addEventListener('pointermove', e => { if (!dragging) return; moved = e.clientX - dx0; ringAngle = a0 + moved * 0.25; });
addEventListener('pointerup', () => {
  if (!dragging) return; dragging = false;
  if (Math.abs(moved) > 6) { ringPos = Math.round(-ringAngle / step); setRing(ringPos); }
});
ring.addEventListener('click', e => {
  const s = e.target.closest('.slide'); if (!s || Math.abs(moved) > 6) return;
  const i = +s.dataset.i;
  if (i === ringIdx) openVideo(TOP[i], TOP);
  else { const diff = ((i - ringIdx + TOP.length + TOP.length / 2) % TOP.length) - TOP.length / 2; ringPos += diff; setRing(ringPos); }
});

// ─── Vault: grid ────────────────────────────────────────────
const CATS = [
  ['all', 'All'], ['sessions', 'Babykelo Sessions'], ['afro', 'Afrobeats & Covers'], ['gospel', 'Gospel & Worship'],
  ['live', 'Live & On Tour'], ['brands', 'Unveilings'], ['features', 'Features'],
];
let cat = 'all', query = '', sort = 'new', shown = 24;
function renderChips() {
  $('#chips').innerHTML = CATS.map(([k, n]) => `<button class="chip${k === cat ? ' is-on' : ''}" data-cat="${k}">${n}<sup>${k === 'all' ? LONG.length : LONG.filter(v => v.tags.includes(k)).length}</sup></button>`).join('');
}
renderChips();
$('#chips').addEventListener('click', e => {
  const b = e.target.closest('.chip'); if (!b) return;
  $$('.chip').forEach(c => c.classList.toggle('is-on', c === b));
  cat = b.dataset.cat; shown = 24; renderGrid();
});
$('#search').addEventListener('input', e => { query = e.target.value.trim().toLowerCase(); shown = 24; renderGrid(); });
$('#sort').addEventListener('change', e => { sort = e.target.value; renderGrid(); });
function renderCounts() {
  $('#vaultCount').textContent = VIDEOS.length;
  const st = $('.stat b[data-count]'); if (st) { st.dataset.count = VIDEOS.length; if (/^\d+$/.test(st.textContent) && +st.textContent > 0) st.textContent = VIDEOS.length; }
}
renderCounts();

let current = [];
function filtered() {
  let list = LONG.filter(v => (cat === 'all' || v.tags.includes(cat)) && (!query || v.search.includes(query)));
  // keep channel order (newest first) for 'new'; features have no exact date so sit with their year
  if (sort === 'views') list = [...list].sort((a, b) => b.v - a.v);
  if (sort === 'old') list = [...list].reverse();
  return list;
}
function card(v) {
  const tag = v.tags.includes('sessions') ? 'Session' : v.src !== 'Babykelo' ? v.src : v.tags.includes('gospel') ? 'Gospel' : v.tags.includes('live') ? 'Live' : '';
  return `<button class="card" data-vid="${v.id}">
    <div class="card__thumb"><img src="${thumb(v.id, 'mqdefault')}" alt="" loading="lazy" decoding="async">
      ${v.d ? `<span class="card__dur">${v.d}</span>` : ''}${v.y ? `<span class="card__yr">${v.y}</span>` : ''}<span class="card__play"></span></div>
    <h3 class="card__title">${v.nice}</h3>
    <div class="card__meta">${v.v ? `<span>${fmt(v.v)} views</span>` : ''}${tag ? `<i>${tag}</i>` : ''}</div>
  </button>`;
}
function renderGrid() {
  current = filtered();
  const grid = $('#grid');
  grid.innerHTML = current.slice(0, shown).map(card).join('') +
    (current.length > shown ? '' : '');
  $('#empty').hidden = current.length > 0;
  $('.more')?.remove();
  if (current.length > shown) {
    const b = document.createElement('button');
    b.className = 'shuffle more'; b.textContent = `Load ${Math.min(24, current.length - shown)} more · ${current.length - shown} left`;
    b.onclick = () => { shown += 24; renderGrid(); };
    grid.after(b);
  }
  if (gsap && !REDUCED) gsap.from('#grid .card', { y: 30, opacity: 0, duration: 0.7, stagger: 0.025, ease: 'expo.out', clearProps: 'all' });
  ScrollTrigger?.refresh();
}
renderGrid();
$('#grid').addEventListener('click', e => { const c = e.target.closest('.card'); if (c) openVideo(VIDEOS.find(v => v.id === c.dataset.vid), current); });
$('#shuffle').addEventListener('click', () => { const pool = current.length ? current : LONG; openVideo(pool[Math.floor(Math.random() * pool.length)], pool); });

// Shorts
function renderShorts() {
  $('#shortsCount').textContent = `${SHORTS.length} shorts`;
  $('#shorts').innerHTML = SHORTS.map(v => `<button class="short" data-vid="${v.id}">
    <div class="short__thumb"><img src="${thumb(v.id)}" alt="" loading="lazy" decoding="async">
    ${v.v ? `<span class="short__views">${fmt(v.v)}</span>` : ''}<span class="short__cap">${v.nice}</span></div></button>`).join('');
}
renderShorts();
$('#shorts').addEventListener('click', e => { const c = e.target.closest('.short'); if (c) openVideo(VIDEOS.find(v => v.id === c.dataset.vid), SHORTS); });
$('#endorsements').addEventListener('click', e => {
  const b = e.target.closest('[data-vid]'); if (!b) return;
  const v = VIDEOS.find(x => x.id === b.dataset.vid); if (v) openVideo(v, [v]);
});
$('#timeline').addEventListener('click', e => {
  const b = e.target.closest('[data-vid]'); if (!b) return;
  const v = VIDEOS.find(x => x.id === b.dataset.vid);
  openVideo(v, JOURNEY.filter(j => j.v).map(j => VIDEOS.find(x => x.id === j.v)).filter(Boolean));
});

// ─── Modal player ───────────────────────────────────────────
const modal = $('#modal');
let list = [], idx = 0, resumeGroove = false, lastFocus = null;
function openVideo(v, from) {
  if (!v) return;
  list = from; idx = list.indexOf(v);
  if (modal.hidden) {
    lastFocus = document.activeElement;
    resumeGroove = groove.playing;
    if (groove.playing) groove.stop();          // his video takes over: the groove stops
    modal.hidden = false;
    history.pushState({ depth: depth() + 1, modal: true, y: scrollY }, '');
    lenis?.stop();
    scene?.pause(true);
  }
  modal.classList.toggle('is-short', !!v.s);
  $('#frame').innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="${v.nice.replace(/"/g, '')}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  $('#modalTitle').textContent = v.nice;
  $('#modalMeta').textContent = [v.y, v.v ? fmt(v.v) + ' views' : '', v.d, v.src !== 'Babykelo' ? 'via ' + v.src : ''].filter(Boolean).join(' · ') || 'Babykelo';
  $('#ytLink').href = v.s ? `https://www.youtube.com/shorts/${v.id}` : `https://www.youtube.com/watch?v=${v.id}`;
  $('#prevVid').disabled = $('#nextVid').disabled = list.length < 2;
  $('[data-close].icon-btn', modal).focus();
}
function closeVideo(fromHistory = false) {
  if (modal.hidden) return;
  if (!fromHistory && history.state?.modal) { history.back(); return; } // keep history in sync; popstate finishes the close
  $('#frame').innerHTML = '';
  modal.hidden = true;
  lenis?.start();
  scene?.pause(false);
  if (resumeGroove) groove.start();
  lastFocus?.focus?.();
}
const nav = d => { if (list.length > 1) openVideo(list[(idx + d + list.length) % list.length], list); };
$('#prevVid').onclick = () => nav(-1);
$('#nextVid').onclick = () => nav(1);
$$('[data-close]', modal).forEach(el => el.addEventListener('click', closeVideo));

// ─── Play the kit ───────────────────────────────────────────
const PADS = [
  ['kick', 'Kick', 'Q', '#ff6a2b'], ['snare', 'Snare', 'W', '#f0c774'], ['hat', 'Hi-hat', 'E', '#d9a441'], ['openhat', 'Open hat', 'R', '#ffd9a0'],
  ['tomhi', 'Rack tom', 'A', '#ff8a4d'], ['tomlo', 'Floor tom', 'S', '#c2410c'], ['clap', 'Clap', 'D', '#fbbf24'], ['crash', 'Crash', 'F', '#fde68a'],
  ['talkup', 'Talking drum ↑', 'Z', '#ff9a4d'], ['talkdown', 'Talking drum ↓', 'X', '#ea580c'], ['conga', 'Conga', 'C', '#f59e0b'], ['bell', 'Agogo bell', 'V', '#fcd34d'],
];
$('#pads').innerHTML = PADS.map(([k, n, key, c]) => `<button class="pad" data-sound="${k}" style="--c:${c}"><b>${n}</b><kbd>${key}</kbd></button>`).join('');
const KEYMAP = Object.fromEntries(PADS.map(([k, , key]) => [key.toLowerCase(), k]));
$$('.pad').forEach(p => { padMap[p.dataset.sound] = p; });
padMap.tom = padMap.tomhi; padMap.rim = padMap.snare;
function flash(el) { el.classList.remove('is-hit'); void el.offsetWidth; el.classList.add('is-hit'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('is-hit'), 110); }
async function strike(name) { await groove.init(); groove.trigger(name); }
$('#pads').addEventListener('pointerdown', e => { const p = e.target.closest('.pad'); if (p) { e.preventDefault(); strike(p.dataset.sound); } });
addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeVideo(); closeMenu(); hideGear(); return; }
  if (!modal.hidden) { if (e.key === 'ArrowRight') nav(1); if (e.key === 'ArrowLeft') nav(-1); return; }
  if (e.target.matches('input, select, textarea') || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
  if (gate.classList.contains('is-gone') && KEYMAP[e.key.toLowerCase()]) strike(KEYMAP[e.key.toLowerCase()]);
  if (e.code === 'Space' && gate.classList.contains('is-gone')) { e.preventDefault(); groove.toggle(); }
});

// ─── Dock ───────────────────────────────────────────────────
const stepEls = [];
for (let i = 0; i < 16; i++) { const d = document.createElement('i'); $('#steps').append(d); stepEls.push(d); }
$('#styles').innerHTML = Object.entries(STYLES).map(([k, s]) => `<button data-style="${k}" class="${k === groove.style ? 'is-on' : ''}">${s.name}</button>`).join('');
const STYLE_KEYS = Object.keys(STYLES);
function pickStyle(k) {
  groove.setStyle(k); remember('style', k);
  $$('#styles button').forEach(x => x.classList.toggle('is-on', x.dataset.style === k));
  $('#styles button.is-on')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  refreshDock();
  if (!groove.playing) groove.start();
}
$('#styles').addEventListener('click', e => { const b = e.target.closest('button'); if (b) pickStyle(b.dataset.style); });
const stepStyle = d => pickStyle(STYLE_KEYS[(STYLE_KEYS.indexOf(groove.style) + d + STYLE_KEYS.length) % STYLE_KEYS.length]);
$('#prevTrack').onclick = () => stepStyle(-1);
$('#nextTrack').onclick = () => stepStyle(1);
function refreshDock() {
  const on = groove.playing, st = STYLES[groove.style];
  $('#dock').classList.toggle('is-playing', on);
  $('#play').setAttribute('aria-pressed', String(on));
  $('#play').setAttribute('aria-label', on ? 'Pause groove' : 'Play groove');
  $('#dockStyle').textContent = st.name; $('#dockBpm').textContent = st.bpm;
  $('#heroNowLabel').textContent = on ? 'Now playing' : 'Paused';
  $('#heroBpm').textContent = `${st.name} · ${st.bpm} BPM`;
  remember('playing', on ? '1' : '0');
}
$('#play').addEventListener('click', () => groove.toggle());
$('#vol').addEventListener('input', e => { groove.setVolume(+e.target.value); remember('vol', e.target.value); });
if (recall('vol')) { $('#vol').value = recall('vol'); groove.setVolume(+recall('vol')); }
if (recall('style') && STYLES[recall('style')]) { groove.style = recall('style'); $$('#styles button').forEach(x => x.classList.toggle('is-on', x.dataset.style === groove.style)); }
refreshDock();
const viz = $('#viz'), vctx = viz.getContext('2d');
(function drawViz() {
  requestAnimationFrame(drawViz);
  if (!groove.analyser || viz.offsetParent === null) return;
  const { bins } = groove.level();
  vctx.clearRect(0, 0, viz.width, viz.height);
  const n = 20, w = viz.width / n;
  for (let i = 0; i < n; i++) {
    const h = Math.max(2, (bins[i * 3] / 255) * viz.height);
    vctx.fillStyle = i < 5 ? '#ff6a2b' : '#d9a441';
    vctx.fillRect(i * w + 1, viz.height - h, w - 2, h);
  }
})();

// ─── Mobile menu ────────────────────────────────────────────
function closeMenu() { $('#menu').classList.remove('is-open'); $('#menuBtn').classList.remove('is-open'); }
$('#menuBtn').addEventListener('click', () => { $('#menu').classList.toggle('is-open'); $('#menuBtn').classList.toggle('is-open'); });
$$('#menu a').forEach(a => a.addEventListener('click', closeMenu));

// ─── Cursor, tilt & magnets ─────────────────────────────────
if (FINE && !REDUCED) {
  const cur = $('.cursor'); let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
  addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; });
  (function loop() { cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22; cur.style.transform = `translate(${cx}px, ${cy}px)`; requestAnimationFrame(loop); })();
  document.addEventListener('pointerover', e => cur.classList.toggle('is-big', !!e.target.closest('a, button, .card, .short, input, select')));
  addEventListener('pointerdown', () => { const r = document.createElement('span'); r.className = 'ripple'; cur.append(r); setTimeout(() => r.remove(), 600); });

  $$('[data-tilt]').forEach(el => {
    el.addEventListener('pointermove', e => {
      const b = el.getBoundingClientRect(), x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
      el.style.transform = `perspective(900px) rotateY(${(x - 0.5) * 10}deg) rotateX(${(0.5 - y) * 10}deg)`;
      el.style.setProperty('--mx', x * 100 + '%'); el.style.setProperty('--my', y * 100 + '%');
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
  $$('[data-magnetic]').forEach(el => {
    el.addEventListener('pointermove', e => {
      const b = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - b.left - b.width / 2) * 0.25}px, ${(e.clientY - b.top - b.height / 2) * 0.3}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

// ─── Scroll animations ──────────────────────────────────────
function splitWords(el) {
  const wrap = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(w => {
          if (!w) return;
          if (/^\s+$/.test(w)) { frag.append(w); return; }
          const o = document.createElement('span'); o.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.08em;margin-bottom:-.08em';
          const i = document.createElement('span'); i.className = 'w'; i.style.display = 'inline-block'; i.textContent = w;
          o.append(i); frag.append(o);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') wrap(n);
    });
  };
  wrap(el);
}

if (gsap && ScrollTrigger && !REDUCED) {
  gsap.registerPlugin(ScrollTrigger);
  $$('.h2, .contact__big').forEach(h => {
    splitWords(h);
    gsap.from($$('.w', h), { yPercent: 110, rotate: 4, duration: 1.1, ease: 'expo.out', stagger: 0.05, scrollTrigger: { trigger: h, start: 'top 85%' } });
  });
  $$('.reveal').forEach(el => gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } }));
  gsap.from('.story__photo', { clipPath: 'inset(100% 0 0 0 round 28px)', scale: 1.1, duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: '.story__photo', start: 'top 80%' } });
  gsap.to('.story__photo img', { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.story', start: 'top bottom', end: 'bottom top', scrub: true } });

  // Counters
  $$('[data-count]').forEach(el => {
    const end = +el.dataset.count, suf = el.dataset.suffix || '', o = { n: 0 };
    gsap.to(o, { n: end, duration: 2.2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' }, onUpdate: () => { el.textContent = Math.round(o.n) + suf; } });
  });

  // Timeline fill + dots
  gsap.to('.timeline__fill', { height: '100%', ease: 'none', scrollTrigger: { trigger: '#timeline', start: 'top 60%', end: 'bottom 60%', scrub: true } });
  $$('.tl').forEach(tl => {
    ScrollTrigger.create({ trigger: tl, start: 'top 62%', onEnter: () => tl.classList.add('is-in'), onLeaveBack: () => tl.classList.remove('is-in') });
    gsap.from($('.tl__card', tl), { x: innerWidth > 900 ? 60 : 0, y: innerWidth > 900 ? 0 : 30, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: tl, start: 'top 85%' } });
  });

  // Horizontal roles on desktop
  const mm = gsap.matchMedia();

  // Frames strip drifts sideways as you scroll past it
  mm.add('(min-width: 761px)', () => {
    const strip = $('#framesStrip');
    gsap.fromTo(strip, { x: () => innerWidth * 0.08 }, { x: () => -(strip.scrollWidth - innerWidth * 0.92), ease: 'none', scrollTrigger: { trigger: '.frames', start: 'top bottom', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true } });
  });
  mm.add('(min-width: 901px)', () => {
    const track = $('#rolesTrack');
    const dist = () => track.scrollWidth - innerWidth;
    gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.roles', pin: true, start: 'top top', end: () => '+=' + dist(), scrub: 0.8, invalidateOnRefresh: true } });
  });
  mm.add('(max-width: 900px)', () => {
    $$('.role').forEach(r => gsap.from(r, { y: 50, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: r, start: 'top 88%' } }));
  });

  gsap.from('.pad', { scale: 0.6, opacity: 0, duration: 0.8, ease: 'back.out(2)', stagger: { each: 0.04, from: 'center', grid: 'auto' }, scrollTrigger: { trigger: '#pads', start: 'top 85%' } });
  gsap.from('.brand, .band', { y: 50, opacity: 0, stagger: 0.1, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '#endorsements', start: 'top 75%' } });
  addEventListener('load', () => ScrollTrigger.refresh());
} else {
  $$('[data-count]').forEach(el => { el.textContent = el.dataset.count + (el.dataset.suffix || ''); });
  $$('.reveal').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
}

onScroll();
console.log(`%cBABYKELO %c${CHANNEL.count} videos · ${fmt(CHANNEL.views)} views · built with love and a talking drum`, 'color:#ff6a2b;font:800 16px sans-serif', 'color:#d9a441');

// ─── Back & top buttons ─────────────────────────────────────
const sameSiteRef = (() => { try { return document.referrer && new URL(document.referrer).origin === location.origin; } catch { return false; } })();
function updateNavButtons() {
  $('#backBtn').hidden = !(depth() > 0 || sameSiteRef);
}
$('#backBtn').addEventListener('click', () => { if (depth() > 0 || sameSiteRef) history.back(); else jumpTo(0); });
$('#topBtn').addEventListener('click', () => {
  history.replaceState({ ...history.state, y: scrollY }, '');
  history.pushState({ depth: depth() + 1, y: 0 }, '', location.pathname);
  jumpTo(0); updateNavButtons();
});
addEventListener('scroll', () => { $('#topBtn').hidden = scrollY < innerHeight * 1.5; }, { passive: true });
updateNavButtons();

// Returning visitor this session: skip the intro, restore position, resume sound on first touch
if (WAS_ENTERED) {
  gate.classList.add('no-anim');
  openSite(true);
  const target = location.hash && $(location.hash);
  const y = +recall('y') || 0;
  requestAnimationFrame(() => requestAnimationFrame(() => { ScrollTrigger?.refresh(); target ? jumpTo(target, true) : jumpTo(y, true); onScroll(); }));
  if (WAS_PLAYING) {
    const resume = () => { removeEventListener('pointerdown', resume, true); removeEventListener('keydown', resume, true); if (!groove.playing && modal.hidden) groove.start(); };
    addEventListener('pointerdown', resume, true); addEventListener('keydown', resume, true);
    $('#heroNowLabel').textContent = 'Tap anywhere to resume';
  }
}

// ─── Clickable 3D gear: tap a piece of the kit to hear it and learn what it is ───
const CENTENT = {
  tag: 'Endorsed · Centent Cymbals & Gongs',
  text: 'His cymbals of choice. Babykelo was unveiled as a Centent Cymbals & Gongs artist in 2025, and the Centent brass brings the shimmer, the wash and the crash.',
  actions: [{ label: '▶ Watch his unveiling', vid: '6MnOI_fDZO8' }, { label: '@cententcymbals ↗', href: 'https://www.instagram.com/cententcymbals/' }],
};
const STICKS = {
  title: 'BabyKelo Signature 5B', tag: 'Signature sticks · Flystickz', sound: 'rim',
  text: 'His own drumstick. Flystickz built the BabyKelo Signature Series 5B for drummers who love power and control: strong enough for heavy grooves, balanced for smooth chops and fills.',
  actions: [{ label: 'Get his sticks ↗', href: 'https://flystickz.com/' }, { label: '▶ The Flystickz series', vid: 'iJm25JzbVL8' }],
};
const TOMS = {
  title: 'Toms', tag: 'Fill territory', sound: 'tomhi',
  text: 'Where the fills roll round the kit. Play them yourself on the pads, or watch him go all the way in his solos.',
  actions: [{ label: 'Play the pads ↓', href: '#kit' }, { label: '▶ Solo from heaven', vid: '5MUVcXUzwEE' }],
};
const GEAR = {
  crash: { title: 'Crash cymbal', sound: 'crash', ...CENTENT },
  ride: { title: 'Ride cymbal', sound: 'ride', ...CENTENT },
  splash: { title: 'Splash cymbal', sound: 'crash', ...CENTENT },
  hat: { title: 'Hi-hats', sound: 'openhat', ...CENTENT },
  stickL: STICKS, stickR: STICKS,
  tom1: TOMS, tom2: TOMS, floor: { ...TOMS, title: 'Floor tom', sound: 'tomlo' },
  kick: {
    title: 'Kick drum', tag: 'The heartbeat', sound: 'kick',
    text: 'His signature on the front head, and the downbeat of every Babykelo groove. Want this pocket on your stage or your record?',
    actions: [{ label: 'Work with Babykelo →', href: 'contact.html' }],
  },
  snare: {
    title: 'Snare drum', tag: 'Where the ghost notes live', sound: 'snare',
    text: 'The backbeat, the ghost notes and the rolls. Hear what he does with it in “Terminator”, or play it yourself.',
    actions: [{ label: '▶ Watch Terminator', vid: '1BNu-CkzsU0' }, { label: 'Play the pads ↓', href: '#kit' }],
  },
  talk: {
    title: 'Gángan · Talking drum', tag: 'The voice of the kit', sound: 'talkup',
    text: 'The talking drum “speaks”: squeeze its cords and the pitch bends like a voice. It is the sound that runs through highlife and Afrobeats. Tap it again to hear it talk.',
    actions: [{ label: 'Play it on the pads ↓', href: '#kit' }],
  },
};
const gearEl = $('#gear'), gearLabel = $('#gearLabel');
const NOT_KIT = 'a, button, input, select, textarea, label, .card, .short, .frame, .pad, .role, .tl__card, .story__text, .story__photo, .brand, .band, .stat, .dock, .modal, .gear, .filters, .carousel, .facts, .socials, .featured, .grid, .shorts, .pads, .partners, .navbtn, .nav, .menu, p, h1, h2, h3, li, img, figure, #heroWord';
const canPick = e => gate.classList.contains('is-gone') && modal.hidden && !e.target.closest(NOT_KIT);
let hoverRaf = 0, hoverOn = null;
addEventListener('pointermove', e => {
  if (!FINE || hoverRaf) return;
  hoverRaf = requestAnimationFrame(() => {
    hoverRaf = 0;
    const g = canPick(e) ? scene?.pick(e.clientX, e.clientY) : null;
    if (g !== hoverOn) { hoverOn = g; document.body.classList.toggle('is-gear', !!(g && GEAR[g])); }
    if (g && GEAR[g]) { gearLabel.hidden = false; gearLabel.textContent = GEAR[g].title; gearLabel.style.transform = `translate(${e.clientX + 18}px, ${e.clientY + 16}px)`; }
    else gearLabel.hidden = true;
  });
}, { passive: true });
addEventListener('click', e => {
  if (e.target.closest('.gear')) return;
  const g = canPick(e) ? scene?.pick(e.clientX, e.clientY) : null;
  if (g && GEAR[g]) showGear(g, e.clientX, e.clientY);
  else if (!gearEl.hidden) hideGear();
});
function showGear(name, x, y) {
  const d = GEAR[name];
  groove.init().then(() => groove.trigger(d.sound));
  scene.hit(name, 1);
  $('#gearTag').textContent = d.tag;
  $('#gearTitle').textContent = d.title;
  $('#gearText').textContent = d.text;
  $('#gearActions').innerHTML = d.actions.map(a => a.vid
    ? `<button data-vid="${a.vid}">${a.label}</button>`
    : `<a href="${a.href}"${a.href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${a.label}</a>`).join('');
  gearEl.hidden = false;
  if (innerWidth > 640) {
    const w = gearEl.offsetWidth, h = gearEl.offsetHeight;
    gearEl.style.left = Math.min(innerWidth - w - 16, Math.max(16, x + 28)) + 'px';
    gearEl.style.top = Math.min(innerHeight - h - 110, Math.max(90, y - h / 2)) + 'px';
  }
  gearEl.classList.remove('pop'); void gearEl.offsetWidth; gearEl.classList.add('pop');
  remember('gearSeen', '1'); $('#gearHint').hidden = true;
}
function hideGear() { gearEl.hidden = true; }
$('#gearClose').addEventListener('click', hideGear);
gearEl.addEventListener('click', e => {
  const b = e.target.closest('[data-vid]');
  if (b) { const v = VIDEOS.find(x => x.id === b.dataset.vid); hideGear(); if (v) openVideo(v, [v]); return; }
  const a = e.target.closest('a[href^="#"]');
  if (a) { e.preventDefault(); hideGear(); goSection(a.getAttribute('href')); }
});
let gearScrollY = 0;
addEventListener('scroll', () => {
  if (!gearEl.hidden && Math.abs(scrollY - gearScrollY) > 120) hideGear();
  if (gearEl.hidden) gearScrollY = scrollY;
  $('#gearHint').hidden = !!recall('gearSeen') || scrollY > innerHeight * 0.5 || !gate.classList.contains('is-gone');
}, { passive: true });
setTimeout(() => { $('#gearHint').hidden = !!recall('gearSeen') || scrollY > innerHeight * 0.5; }, 2500);

// ─── Latest uploads: new videos on his channel show up here automatically ───
// Served by netlify/functions/videos.mjs (reads his YouTube feed). Locally, or if it fails, the built-in list is used.
const G_RE = /jesus|lord|praise|exalted|mighty god|jireh|proclaim|wait on|in your name|agallio|ada|chior|choir|hillsplay|worship|gospel|hallelujah|holy|fill the room|stand by you|on high|giveson/;
const L_RE = /live|show|rehearsal|concert|tour|church|hicc|daystar|drumsession/;
const B_RE = /flystickz|centent|unveiling|series|artist|endorse/;
function autoTags(t, short) {
  const tl = t.toLowerCase(), tags = [];
  if (short) tags.push('shorts');
  if (tl.includes('session')) tags.push('sessions');
  if (G_RE.test(tl)) tags.push('gospel');
  if (L_RE.test(tl)) tags.push('live');
  if (B_RE.test(tl)) tags.push('brands');
  if (!short && !tags.some(x => ['gospel', 'live', 'brands'].includes(x))) tags.push('afro');
  return tags;
}
(async function loadLatest() {
  try {
    let list = null;
    try { list = JSON.parse(recall('latest') || 'null'); } catch {}
    if (!list) {
      const r = await fetch('/api/videos', { headers: { accept: 'application/json' } });
      if (!r.ok || !(r.headers.get('content-type') || '').includes('json')) return;
      list = await r.json();
      remember('latest', JSON.stringify(list));
    }
    const fresh = list.filter(v => v.id && !VIDEOS.some(x => x.id === v.id));
    if (!fresh.length) return;
    fresh.slice().reverse().forEach(n => {
      const v = { id: n.id, t: n.title, v: n.views || 0, y: n.published ? new Date(n.published).getFullYear() : null, d: '', s: n.short ? 1 : 0, tags: autoTags(n.title, n.short), src: 'Babykelo', fresh: true };
      v.nice = nice(v.t); v.search = (v.t + ' ' + v.nice + ' ' + v.tags.join(' ')).toLowerCase();
      VIDEOS.unshift(v); (v.s ? SHORTS : LONG).unshift(v);
    });
    renderChips(); renderCounts(); renderShorts(); renderGrid();
    console.log(`Added ${fresh.length} new upload(s) from YouTube`);
  } catch (err) { /* offline or no function: keep the built-in catalogue */ }
})();
