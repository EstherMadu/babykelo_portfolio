import { groove } from './audio.js';
import { LOGO } from './logo.js';

// ─── Booking contacts ───────────────────────────────────────
// Fill these in and the page lights up email + WhatsApp buttons automatically.
// whatsapp: international format, digits only, e.g. '2348012345678'
export const BOOKING = {
  email: '',
  whatsapp: '',
  instagram: 'babykelo',
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;

$('#yr').textContent = new Date().getFullYear();

// Back: return to wherever they came from on the site, otherwise to the home page
const fromSite = (() => { try { return document.referrer && new URL(document.referrer).origin === location.origin; } catch { return false; } })();
$('#backBtn').addEventListener('click', () => { if (fromSite && history.length > 1) history.back(); else location.href = 'index.html'; });
$$('[data-logo]').forEach(el => { el.innerHTML = LOGO; });

// Background stage (same kit, parked at the "around the back" camera shot)
import('./scene.js').then(m => { const sc = m.createScene($('#stage'), groove); sc.setProgress(0.96); }).catch(() => {});

// ─── Services ───────────────────────────────────────────────
const SERVICES = [
  { k: 'remote', t: 'Remote studio sessions', d: 'Wherever you are in the world, send him your song. He records real drums on it in his studio and sends back clean, mix-ready stems. No flights, no visas, just the groove.', tag: 'Worldwide', hot: true },
  { k: 'session', t: 'In-studio recording', d: 'Studio tracking for singles and albums in Lagos. Clean, musical takes that sit in the mix.', tag: 'Studio' },
  { k: 'live', t: 'Live drumming', d: 'Concerts, tours, festivals, weddings and corporate shows. Pocket first, fireworks when the moment calls.', tag: 'Stage' },
  { k: 'church', t: 'Church & worship', d: 'Praise breaks, worship nights and conferences. He has played with Ada Ehi, Tim Godfrey and choirs across Lagos.', tag: 'Gospel' },
  { k: 'md', t: 'Music direction', d: 'He leads the band for your artist or event, from rehearsals and set flow to cues and transitions. MD for Voice of Karis.', tag: 'MD' },
  { k: 'arrange', t: 'Live arrangement', d: 'He turns records into stage versions with intros, builds, medleys and endings that land.', tag: 'Arrange' },
  { k: 'produce', t: 'Production', d: 'Beats and records built from the rhythm up. Afrobeats, highlife, gospel, amapiano and more.', tag: 'Produce' },
  { k: 'mix', t: 'Mixing & mastering', d: 'Release-ready mixes and masters for your songs, handled by the same ears that tune the snare.', tag: 'Mix' },
  { k: 'clinic', t: 'Clinics & masterclasses', d: 'Workshops, drum clinics and mentoring for churches, schools and drum communities.', tag: 'Teach' },
];
$('#svcGrid').innerHTML = SERVICES.map((s, i) => `
  <article class="svc${s.hot ? ' svc--hot' : ''}" data-tilt>
    <span class="svc__n mono">${String(i + 1).padStart(2, '0')} · ${s.tag}${s.hot ? '<em>Available now</em>' : ''}</span>
    <h3>${s.t}</h3>
    <p>${s.d}</p>
    <button class="svc__btn" data-pick="${s.k}">Book this →</button>
  </article>`).join('');
$('#svcPills').innerHTML = SERVICES.map(s => `<label class="pill"><input type="checkbox" name="svc" value="${s.t}" data-k="${s.k}"><span>${s.t}</span></label>`).join('');
$('#svcGrid').addEventListener('click', e => {
  const b = e.target.closest('[data-pick]'); if (!b) return;
  const box = $(`#svcPills input[data-k="${b.dataset.pick}"]`); box.checked = true; syncRemote();
  $('#form').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => $('#bform [name=name]').focus({ preventScroll: true }), 700);
});

// Remote-session details appear only when that service is picked
const remoteBox = $('#remoteFields');
const syncRemote = () => { remoteBox.hidden = !$('#svcPills input[data-k="remote"]').checked; };
$('#svcPills').addEventListener('change', syncRemote);
$$('[data-remote]').forEach(b => b.addEventListener('click', () => { $('#svcPills input[data-k="remote"]').checked = true; syncRemote(); }));

// ─── Direct contact links (only shown when configured) ──────
if (BOOKING.email) { const a = $('#directEmail'); a.hidden = false; a.href = `mailto:${BOOKING.email}`; $('b', a).textContent = BOOKING.email; }
if (BOOKING.whatsapp) {
  const url = `https://wa.me/${BOOKING.whatsapp}`;
  const a = $('#directWa'); a.hidden = false; a.href = url; $('b', a).textContent = '+' + BOOKING.whatsapp;
  const h = $('#heroWa'); h.hidden = false; h.href = url;
}

// ─── Form → ready-to-send booking ───────────────────────────
const form = $('#bform'), sheet = $('#sheet');
function compose(d) {
  return [
    `Hi Babykelo! Booking enquiry from ${d.name}${d.org ? ` (${d.org})` : ''}.`,
    '',
    `Services: ${d.services.join(', ')}`,
    d.date ? `Date: ${new Date(d.date + 'T12:00').toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}` : '',
    d.venue ? `Venue: ${d.venue}` : '',
    d.budget ? `Budget: ${d.budget}` : '',
    d.services.includes('Remote studio sessions') ? [
      '', 'Remote session details:',
      d.song ? `Song link: ${d.song}` : '',
      d.bpm ? `Tempo / key: ${d.bpm}` : '',
      d.deliver ? `Deliverables: ${d.deliver}` : '',
      d.refs ? `Vibe / references: ${d.refs}` : '',
      d.deadline ? `Needed by: ${d.deadline}` : '',
    ].filter(Boolean).join('\n') : '',
    '',
    d.message,
    '',
    `Reply to: ${d.contact}`,
  ].filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n');
}
form.addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(form);
  const d = Object.fromEntries(f); d.services = f.getAll('svc');
  const err = !d.name?.trim() ? 'Please add your name.' : !d.contact?.trim() ? 'Add an email or phone so he can reply.' : !d.services.length ? 'Pick at least one service.' : !d.message?.trim() ? 'Tell him a little about the project.' : '';
  $$('.field', form).forEach(el => el.classList.remove('is-bad'));
  if (err) {
    const el = $('#formError'); el.textContent = err; el.hidden = false;
    const bad = !d.name?.trim() ? 'name' : !d.contact?.trim() ? 'contact' : !d.services.length ? null : 'message';
    if (bad) { const inp = $(`[name=${bad}]`, form); inp.closest('.field').classList.add('is-bad'); inp.focus(); }
    return;
  }
  $('#formError').hidden = true;
  const msg = compose(d);
  $('#sheetMsg').textContent = msg;
  const subject = `Booking enquiry: ${d.services[0]}${d.date ? ' · ' + d.date : ''}`;
  const acts = [];
  if (BOOKING.whatsapp) acts.push(`<a class="book-cta" href="https://wa.me/${BOOKING.whatsapp}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener"><span>Send on WhatsApp</span><i>→</i></a>`);
  if (BOOKING.email) acts.push(`<a class="ghost-btn" href="mailto:${BOOKING.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(msg)}">Send by email</a>`);
  acts.push(`<button class="${acts.length ? 'ghost-btn' : 'book-cta'}" id="igSend"><span>Copy & open Instagram DM</span>${acts.length ? '' : '<i>→</i>'}</button>`);
  acts.push(`<button class="ghost-btn" id="copyOnly">Copy message</button>`);
  $('#sheetActions').innerHTML = acts.join('');
  $('#sheetNote').textContent = BOOKING.whatsapp || BOOKING.email ? '' : 'Your message will be copied. Paste it into the Instagram chat that opens.';
  sheet.hidden = false;
  try { localStorage.removeItem('bk-draft'); } catch {}
});
async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch { const t = document.createElement('textarea'); t.value = text; document.body.append(t); t.select(); const ok = document.execCommand('copy'); t.remove(); return ok; }
}
sheet.addEventListener('click', async e => {
  if (e.target.closest('[data-close]')) { sheet.hidden = true; return; }
  if (e.target.closest('#igSend')) { await copy($('#sheetMsg').textContent); $('#sheetNote').textContent = 'Copied ✓ Paste it into the chat.'; window.open(`https://ig.me/m/${BOOKING.instagram}`, '_blank', 'noopener'); }
  if (e.target.closest('#copyOnly')) { await copy($('#sheetMsg').textContent); $('#sheetNote').textContent = 'Copied to clipboard ✓'; }
});
addEventListener('keydown', e => { if (e.key === 'Escape') sheet.hidden = true; });

// Keep an unsent draft in this browser only
try {
  const saved = JSON.parse(localStorage.getItem('bk-draft') || 'null');
  if (saved) Object.entries(saved).forEach(([k, v]) => { const el = form.elements[k]; if (el && typeof v === 'string' && el.type !== 'checkbox') el.value = v; });
} catch {}
form.addEventListener('input', () => {
  try { const d = Object.fromEntries(new FormData(form)); delete d.svc; localStorage.setItem('bk-draft', JSON.stringify(d)); } catch {}
});

// Copy bios
$$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
  await copy($('#' + b.dataset.copy).innerText.trim());
  b.textContent = 'Copied ✓'; setTimeout(() => { b.textContent = 'Copy'; }, 1600);
}));

// Menu
$('#menuBtn').addEventListener('click', () => { $('#menu').classList.toggle('is-open'); $('#menuBtn').classList.toggle('is-open'); });
$$('#menu a').forEach(a => a.addEventListener('click', () => { $('#menu').classList.remove('is-open'); $('#menuBtn').classList.remove('is-open'); }));

// Tilt + magnets
if (FINE) {
  $$('[data-tilt]').forEach(el => {
    el.addEventListener('pointermove', e => {
      const b = el.getBoundingClientRect(), x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
      el.style.transform = `perspective(900px) rotateY(${(x - 0.5) * 8}deg) rotateX(${(0.5 - y) * 8}deg)`;
      el.style.setProperty('--mx', x * 100 + '%'); el.style.setProperty('--my', y * 100 + '%');
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
  $$('[data-magnetic]').forEach(el => {
    el.addEventListener('pointermove', e => { const b = el.getBoundingClientRect(); el.style.transform = `translate(${(e.clientX - b.left - b.width / 2) * 0.2}px, ${(e.clientY - b.top - b.height / 2) * 0.25}px)`; });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

// Reveal on scroll
const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: 0.12 });
$$('.svc, .steps li, .bio, .assets-card, .facts-card, .bform, .booking__intro').forEach(el => { el.classList.add('rise'); io.observe(el); });

// ─── Remote sessions globe: songs flying into the Lagos studio ───
(function globe() {
  const cv = $('#globe'); if (!cv) return;
  const ctx = cv.getContext('2d');
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LAGOS = [6.52, 3.38];
  const CITIES = [
    ['London', 51.5, -0.12], ['New York', 40.7, -74], ['Houston', 29.76, -95.4], ['Toronto', 43.65, -79.4],
    ['Accra', 5.6, -0.19], ['Johannesburg', -26.2, 28.05], ['Dubai', 25.2, 55.27], ['Berlin', 52.52, 13.4],
    ['Nairobi', -1.29, 36.82], ['Atlanta', 33.75, -84.39], ['Paris', 48.85, 2.35], ['São Paulo', -23.55, -46.63], ['Sydney', -33.87, 151.2],
  ];
  const rad = d => d * Math.PI / 180;
  const vec = (lat, lon) => [Math.cos(rad(lat)) * Math.sin(rad(lon)), Math.sin(rad(lat)), Math.cos(rad(lat)) * Math.cos(rad(lon))];
  // Fibonacci dot sphere
  const DOTS = Array.from({ length: 900 }, (_, i) => {
    const y = 1 - (i / 899) * 2, r = Math.sqrt(1 - y * y), th = i * 2.39996;
    return [Math.cos(th) * r, y, Math.sin(th) * r];
  });
  const slerp = (a, b, t) => {
    const d = Math.acos(Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])), s = Math.sin(d) || 1;
    const k1 = Math.sin((1 - t) * d) / s, k2 = Math.sin(t * d) / s;
    return [a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2];
  };
  const home = vec(...LAGOS);
  const QUIET = new Set(['Paris', 'Berlin', 'Accra', 'Atlanta', 'Toronto']); // skip labels that would collide
  const flights = CITIES.map((c, i) => ({ name: c[0], label: !QUIET.has(c[0]), v: vec(c[1], c[2]), t: -i * 0.35 }));
  let W, H, R, rot = rad(-10);
  function size() {
    const b = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio, 2);
    W = cv.width = b.width * dpr; H = cv.height = b.height * dpr; R = Math.min(W, H) * 0.42;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  addEventListener('resize', size); size();
  const tilt = rad(-12);
  function proj(p) {
    // rotate around Y (spin) then X (tilt)
    const x = p[0] * Math.cos(rot) + p[2] * Math.sin(rot), z0 = -p[0] * Math.sin(rot) + p[2] * Math.cos(rot);
    const y = p[1] * Math.cos(tilt) - z0 * Math.sin(tilt), z = p[1] * Math.sin(tilt) + z0 * Math.cos(tilt);
    return [W / 2 + x * R, H / 2 - y * R, z];
  }
  let last = performance.now(), visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(cv);
  function draw(now) {
    requestAnimationFrame(draw);
    if (!visible) return;
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    // keep Lagos facing roughly toward the viewer: gentle sway around it
    const targetRot = -rad(LAGOS[1]) + Math.sin(now / 5000) * 0.9;
    rot += (targetRot - rot) * dt * 0.6;
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2 - R * 0.3, H / 2 - R * 0.3, R * 0.1, W / 2, H / 2, R * 1.15);
    g.addColorStop(0, 'rgba(255,106,43,.16)'); g.addColorStop(1, 'rgba(255,106,43,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(W / 2, H / 2, R * 1.15, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(217,164,65,.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(W / 2, H / 2, R, 0, 7); ctx.stroke();
    DOTS.forEach(p => {
      const [x, y, z] = proj(p); if (z < 0) return;
      ctx.fillStyle = `rgba(243,233,216,${0.08 + z * 0.35})`;
      ctx.fillRect(x, y, 1.6 + z * 1.2, 1.6 + z * 1.2);
    });
    // flights
    flights.forEach(f => {
      f.t += dt * 0.28; if (f.t > 1.6) f.t = -Math.random() * 1.2;
      const head = Math.max(0, Math.min(1, f.t)), tail = Math.max(0, Math.min(1, f.t - 0.35));
      const [cx, cy, cz] = proj(f.v);
      if (cz > 0) {
        ctx.fillStyle = 'rgba(240,199,116,.9)'; ctx.beginPath(); ctx.arc(cx, cy, 3 * devicePixelRatio, 0, 7); ctx.fill();
        if (cz > 0.35 && f.label) { ctx.fillStyle = 'rgba(243,233,216,.65)'; ctx.font = `${11 * Math.min(devicePixelRatio, 2)}px "JetBrains Mono", monospace`; ctx.fillText(f.name.toUpperCase(), cx + 8, cy - 6); }
      }
      if (head <= 0) return;
      ctx.beginPath();
      for (let k = 0; k <= 24; k++) {
        const t = tail + (head - tail) * (k / 24);
        const p = slerp(f.v, home, t), lift = 1 + Math.sin(t * Math.PI) * 0.22;
        const [x, y, z] = proj([p[0] * lift, p[1] * lift, p[2] * lift]);
        if (z < -0.1) { ctx.moveTo(x, y); continue; }
        k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.strokeStyle = 'rgba(255,106,43,.85)'; ctx.lineWidth = 2 * Math.min(devicePixelRatio, 2); ctx.lineCap = 'round'; ctx.stroke();
    });
    const [lx, ly, lz] = proj(home);
    if (lz > 0) {
      const pulse = (now / 1000) % 1.4 / 1.4;
      ctx.strokeStyle = `rgba(255,106,43,${1 - pulse})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(lx, ly, 6 + pulse * 26 * Math.min(devicePixelRatio, 2), 0, 7); ctx.stroke();
      ctx.fillStyle = '#ff6a2b'; ctx.beginPath(); ctx.arc(lx, ly, 6 * Math.min(devicePixelRatio, 2), 0, 7); ctx.fill();
      ctx.fillStyle = '#f3e9d8'; ctx.font = `700 ${13 * Math.min(devicePixelRatio, 2)}px "Syne", sans-serif`; ctx.fillText('LAGOS · BABYKELO', lx + 14, ly + 20);
    }
  }
  requestAnimationFrame(draw);
})();
