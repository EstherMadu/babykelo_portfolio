// Babykelo groove engine — every sound here is synthesised live with the Web Audio API.
// No samples, no copyrighted recordings: kick, snare, talking drum, cowbell, keys and bass are built from oscillators + noise.

const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);

// 16-step patterns. x = accent, o = normal, g = ghost, . = rest
export const STYLES = {
  afrobeats: {
    name: 'Afro Pocket', bpm: 104, swing: 0.1,
    kick:   ['x.....o...x.....', 'x.....o...x...o.'],
    snare:  ['...o..o....o..g.', '...o..o....o..o.'],
    clap:   ['....x.......x...'],
    hat:    ['o.oxo.oxo.oxo.ox'],
    shaker: ['gogggoggxoggggog'],
    bell:   ['x..o..o...o.o...'],
    talk:   ['................', '................', '................', '..........x.o.x.'],
    conga:  ['.......o.....o..', '.....o.o.......o'],
    chords: [[57, 60, 64, 67, 71], [53, 57, 60, 64, 67], [50, 53, 57, 60, 64], [52, 56, 59, 62, 66]],
    bass:   [[45, 0, 3], [45, 6, 2], [48, 10, 2], [45, 13, 3]], // [note, step, len] relative to chord root shift
    bassShift: [0, -4, -7, -5],
  },
  highlife: {
    name: 'Highlife', bpm: 124, swing: 0.04,
    kick:   ['x.......o.......'],
    snare:  ['....g.......o...'],
    clap:   ['................'],
    hat:    ['o.o.o.o.o.o.o.o.'],
    shaker: ['xgogxgogxgogxgog'],
    bell:   ['x.o.xo.o.x.o.o..'],
    talk:   ['................', '................', '............x.o.', '................'],
    conga:  ['..o...ox..o...ox'],
    chords: [[60, 64, 67, 72], [65, 69, 72, 77], [67, 71, 74, 77], [60, 64, 67, 72]],
    bass:   [[48, 0, 2], [55, 4, 2], [48, 8, 2], [52, 12, 2]],
    bassShift: [0, 5, 7, 0],
    pluck: true,
  },
  kompa: {
    name: 'Kompa', bpm: 116, swing: 0,
    kick:   ['x..o..o.x..o..o.'],
    snare:  ['................'],
    clap:   ['....o.......o...'],
    hat:    ['..o...o...o...o.'],
    shaker: ['ogogogogogogogog'],
    bell:   ['x.ox.oxox.ox.oxo'],
    talk:   ['................', '................', '................', '........x.x.o.x.'],
    conga:  ['...o..x....o..x.'],
    chords: [[62, 65, 69, 72], [67, 71, 74, 77], [60, 64, 67, 71], [57, 60, 64, 67]],
    bass:   [[38, 0, 3], [38, 3, 1], [45, 6, 2], [38, 8, 3], [41, 11, 1], [43, 14, 2]],
    bassShift: [0, 5, -2, -5],
  },
  praise: {
    name: 'Praise Break', bpm: 148, swing: 0.06,
    kick:   ['x...x...x...x...', 'x...x...x...x.o.'],
    snare:  ['..g.x.g...g.x.gg', '..g.x.g...g.x.xx'],
    clap:   ['....x.......x...'],
    hat:    ['x.x.x.x.x.x.x.x.'],
    shaker: ['................'],
    bell:   ['................'],
    talk:   ['................'],
    conga:  ['................'],
    crash:  ['x...............', '................', '................', '................'],
    chords: [[58, 62, 65, 69], [58, 62, 65, 69], [63, 67, 70, 74], [65, 69, 72, 75]],
    bass:   [[46, 0, 1], [46, 2, 1], [46, 4, 1], [46, 6, 1], [46, 8, 1], [46, 10, 1], [46, 12, 1], [46, 14, 1]],
    bassShift: [0, 0, 5, 7],
    organ: true,
  },
  shed: {
    name: 'Gospel Shed', bpm: 92, swing: 0.16,
    kick:   ['x.....o.x.o.....', 'x.....o.x.o...o.'],
    snare:  ['....x..g.g..x.gg', '..g.x..g.g..x.g.'],
    clap:   ['................'],
    hat:    [],
    ride:   ['x.oxx.oxx.oxx.ox'],
    shaker: ['................'],
    bell:   ['................'],
    talk:   ['................'],
    conga:  ['................'],
    chords: [[63, 67, 70, 74, 77], [62, 65, 69, 72], [60, 63, 67, 70, 74], [58, 62, 65, 68, 72]],
    bass:   [[39, 0, 3], [39, 6, 1], [46, 8, 2], [39, 12, 2], [41, 14, 1]],
    bassShift: [0, -1, -3, -5],
  },
  amapiano: {
    name: 'Amapiano', bpm: 113, swing: 0.08,
    kick:   ['x...x...x...x...'],
    snare:  ['................'],
    clap:   ['....o.......o...'],
    hat:    ['..o...o...o...o.'],
    shaker: ['gogggoggxoggggog'],
    bell:   ['................'],
    talk:   ['................'],
    conga:  ['......o.......o.', '...o..o.......o.'],
    chords: [[57, 60, 64, 67, 71], [50, 53, 57, 60, 64], [55, 59, 62, 66], [48, 52, 55, 59, 62]],
    bass:   [[45, 3, 2], [45, 6, 1], [52, 10, 2], [45, 13, 2]],
    bassShift: [0, -7, -2, -9],
    log: true,
  },
};

const VEL = { x: 1, o: 0.72, g: 0.32 };

// Fills for the last beats of every 4-bar phrase. Each entry is one 16th step: a list of [instrument, velocity, pitch] strokes
const FILLS = {
  afrobeats: [[['talk', 0.8, 180]], [['talk', 0.9, 200], ['talk', 0.6, 170]], [['tom', 0.8, 200]], [['tom', 0.9, 150], ['tom', 1, 110]]],
  highlife: [[['conga', 0.7, 340]], [['conga', 0.8, 300]], [['tom', 0.8, 180], ['tom', 0.7, 160]], [['tom', 1, 120]]],
  kompa: [[['tom', 0.7, 180]], [['tom', 0.8, 180]], [['tom', 0.9, 130]], [['tom', 1, 110], ['kick', 0.9]]],
  shed: [[['snare', 0.7], ['snare', 0.5], ['snare', 0.6]], [['tom', 0.8, 210], ['tom', 0.7, 210], ['snare', 0.8]], [['tom', 0.9, 170], ['tom', 0.8, 170], ['kick', 0.9]],
    [['snare', 0.9], ['tom', 0.9, 140], ['tom', 0.9, 140]], [['tom', 1, 110], ['tom', 0.9, 110], ['kick', 1]], [['snare', 1], ['snare', 0.8], ['snare', 0.9], ['snare', 1]],
    [['tom', 1, 200], ['tom', 1, 160], ['tom', 1, 130], ['tom', 1, 105]], [['kick', 1], ['snare', 1]]],
  amapiano: [[['conga', 0.7, 300]], [['conga', 0.8, 260], ['conga', 0.6, 300]], [['tom', 0.8, 160]], [['kick', 0.9], ['clap', 0.7]]],
  praise: [[['snare', 0.6], ['snare', 0.7]], [['snare', 0.75], ['snare', 0.85]], [['tom', 0.9, 200], ['tom', 0.9, 170]], [['tom', 1, 130], ['tom', 1, 100]],
    [['snare', 0.9], ['snare', 0.9], ['snare', 1]], [['kick', 1], ['snare', 1]], [['tom', 1, 110], ['kick', 1]], [['snare', 1], ['snare', 1], ['snare', 1], ['snare', 1]]],
};

export class Groove {
  constructor() {
    this.ctx = null;
    this.playing = false;
    this.style = 'afrobeats';
    this.step = 0;
    this.bar = 0;
    this.listeners = new Set();
    this.volume = 0.8;
  }

  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }

  emit(type, time, vel = 1) {
    const delay = Math.max(0, (time - this.ctx.currentTime) * 1000);
    setTimeout(() => this.listeners.forEach(fn => fn(type, vel)), delay);
  }

  init() {
    if (this.ctx) return this.ctx.resume();
    const ctx = this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    this.master = ctx.createGain();
    this.master.gain.value = this.volume;
    this.comp = ctx.createDynamicsCompressor();
    this.comp.threshold.value = -14; this.comp.ratio.value = 4;
    this.comp.attack.value = 0.004; this.comp.release.value = 0.2;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.78;
    this.freq = new Uint8Array(this.analyser.frequencyBinCount);

    // A global filter lets us "open up" the mix for the drop
    this.tone = ctx.createBiquadFilter();
    this.tone.type = 'lowpass'; this.tone.frequency.value = 18000; this.tone.Q.value = 0.7;

    this.bus = ctx.createGain();
    this.bus.connect(this.tone).connect(this.comp).connect(this.master).connect(this.analyser).connect(ctx.destination);

    this.verb = ctx.createConvolver();
    this.verb.buffer = this.impulse(2.4, 2.6);
    this.verbSend = ctx.createGain(); this.verbSend.gain.value = 0.22;
    this.verbSend.connect(this.verb).connect(this.tone);

    this.noise = this.makeNoise();
    return ctx.resume();
  }

  impulse(seconds, decay) {
    const ctx = this.ctx, len = ctx.sampleRate * seconds;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  makeNoise() {
    const ctx = this.ctx, buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  out(node, send = 0) {
    node.connect(this.bus);
    if (send) { const s = this.ctx.createGain(); s.gain.value = send; node.connect(s).connect(this.verbSend); }
  }

  env(g, t, peak, attack, decay) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  noiseSrc(t, dur) {
    const n = this.ctx.createBufferSource();
    n.buffer = this.noise;
    n.start(t, Math.random() * 1.5); n.stop(t + dur);
    return n;
  }

  // ─── Instruments ──────────────────────────────────────────────
  kick(t, v = 1) {
    // Three layers: sub thump, shell body and the beater click on the batter head
    const ctx = this.ctx;
    const sub = ctx.createOscillator(), sg = ctx.createGain();
    sub.frequency.setValueAtTime(120, t); sub.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    this.env(sg, t, 1.05 * v, 0.002, 0.45);
    sub.connect(sg); this.out(sg); sub.start(t); sub.stop(t + 0.55);
    const body = ctx.createOscillator(), bg = ctx.createGain();
    body.type = 'triangle'; body.frequency.setValueAtTime(190, t); body.frequency.exponentialRampToValueAtTime(70, t + 0.05);
    this.env(bg, t, 0.45 * v, 0.001, 0.09);
    body.connect(bg); this.out(bg, 0.08); body.start(t); body.stop(t + 0.15);
    const c = this.noiseSrc(t, 0.02), cf = ctx.createBiquadFilter(), cg = ctx.createGain();
    cf.type = 'bandpass'; cf.frequency.value = 3200; cf.Q.value = 0.9;
    this.env(cg, t, 0.3 * v, 0.001, 0.012);
    c.connect(cf).connect(cg); this.out(cg);
    this.emit('kick', t, v);
  }

  snare(t, v = 1) {
    // Head (two drum modes) + crack + snare wires that ring a little longer
    const ctx = this.ctx;
    [[185, 0.5], [330, 0.28]].forEach(([fq, amp]) => {
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = 'triangle'; o.frequency.setValueAtTime(fq * 1.25, t); o.frequency.exponentialRampToValueAtTime(fq, t + 0.03);
      this.env(og, t, amp * v, 0.001, 0.11);
      o.connect(og); this.out(og, 0.2); o.start(t); o.stop(t + 0.2);
    });
    const crack = this.noiseSrc(t, 0.06), cf = ctx.createBiquadFilter(), cg = ctx.createGain();
    cf.type = 'bandpass'; cf.frequency.value = 4200; cf.Q.value = 0.7;
    this.env(cg, t, 0.45 * v, 0.001, 0.05);
    crack.connect(cf).connect(cg); this.out(cg, 0.25);
    const wires = this.noiseSrc(t, 0.35), wf = ctx.createBiquadFilter(), wg = ctx.createGain();
    wf.type = 'highpass'; wf.frequency.value = 1900;
    this.env(wg, t, 0.32 * v, 0.004, 0.2 + v * 0.06);
    wires.connect(wf).connect(wg); this.out(wg, 0.3);
    this.emit('snare', t, v);
  }

  // Ride: stick "ping" + a long, soft wash (the jazz/gospel drummer's timekeeper)
  ride(t, v = 1) {
    const ctx = this.ctx, bp = ctx.createBiquadFilter(), g = ctx.createGain();
    bp.type = 'bandpass'; bp.frequency.value = 5200; bp.Q.value = 0.8;
    this.env(g, t, 0.12 * v, 0.001, 0.9);
    [300, 452, 530, 612, 815].forEach(fq => { const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = fq * 2.3; o.connect(bp); o.start(t); o.stop(t + 1); });
    bp.connect(g); this.out(g, 0.25);
    const ping = ctx.createOscillator(), pg = ctx.createGain();
    ping.frequency.value = 3150; this.env(pg, t, 0.05 * v, 0.001, 0.25);
    ping.connect(pg); this.out(pg); ping.start(t); ping.stop(t + 0.3);
    this.emit('ride', t, v);
  }

  // Log drum (amapiano): pitched, round, slightly overdriven
  logdrum(t, note, dur, v = 1) {
    const ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain(), sh = ctx.createWaveShaper();
    if (!this.curve) { const c = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; c[i] = Math.tanh(x * 2.2); } this.curve = c; }
    sh.curve = this.curve;
    const f = NOTE(note);
    o.frequency.setValueAtTime(f * 1.9, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.035);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.6 * v, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(0.6, dur + 0.15));
    o.connect(sh).connect(g); this.out(g, 0.12);
    o.start(t); o.stop(t + 0.8);
    this.emit('tom', t, v * 0.6);
  }

  rim(t, v = 1) {
    const ctx = this.ctx, o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'square'; o.frequency.value = 1700;
    f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 6;
    this.env(g, t, 0.35 * v, 0.001, 0.035);
    o.connect(f).connect(g); this.out(g, 0.35);
    o.start(t); o.stop(t + 0.06);
    this.emit('rim', t, v);
  }

  clap(t, v = 1) {
    const ctx = this.ctx, f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 1.2;
    g.gain.setValueAtTime(0.0001, t);
    [0, 0.011, 0.022].forEach(o => {
      g.gain.setValueAtTime(0.6 * v, t + o);
      g.gain.exponentialRampToValueAtTime(0.08 * v, t + o + 0.01);
    });
    g.gain.setValueAtTime(0.45 * v, t + 0.033);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
    this.noiseSrc(t, 0.3).connect(f).connect(g); this.out(g, 0.5);
    this.emit('clap', t, v);
  }

  hat(t, v = 1, open = false) {
    // Six detuned square partials (like a real pair of hats) through a bright band-pass
    const ctx = this.ctx, bp = ctx.createBiquadFilter(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
    bp.type = 'bandpass'; bp.frequency.value = 10000; bp.Q.value = 0.6;
    hp.type = 'highpass'; hp.frequency.value = 7000;
    this.env(g, t, 0.2 * v, 0.001, open ? 0.34 : 0.05);
    [263, 400, 421, 474, 587, 845].forEach(fq => { const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = fq * 1.7; o.connect(bp); o.start(t); o.stop(t + (open ? 0.4 : 0.08)); });
    bp.connect(hp).connect(g); this.out(g, 0.08);
    this.emit(open ? 'openhat' : 'hat', t, v);
  }

  shaker(t, v = 1) {
    const ctx = this.ctx, f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'bandpass'; f.frequency.value = 6500; f.Q.value = 1.5;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.1 * v, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    this.noiseSrc(t, 0.1).connect(f).connect(g); this.out(g);
  }

  crash(t, v = 1) {
    const ctx = this.ctx, hp = ctx.createBiquadFilter(), g = ctx.createGain();
    hp.type = 'highpass'; hp.frequency.value = 5000;
    this.env(g, t, 0.28 * v, 0.002, 1.6);
    // metallic partials (808-style) + noise
    [263, 400, 421, 474, 587, 845].forEach(fq => {
      const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = fq * 2.1;
      o.connect(hp); o.start(t); o.stop(t + 1.7);
    });
    const ng = ctx.createGain(); ng.gain.value = 0.6;
    this.noiseSrc(t, 1.7).connect(ng).connect(hp);
    hp.connect(g); this.out(g, 0.4);
    this.emit('crash', t, v);
  }

  tom(t, v = 1, fq = 140) {
    const ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(fq * 1.6, t); o.frequency.exponentialRampToValueAtTime(fq, t + 0.08);
    this.env(g, t, 0.7 * v, 0.002, 0.36);
    o.connect(g); this.out(g, 0.3);
    o.start(t); o.stop(t + 0.45);
    this.emit('tom', t, v);
  }

  // Talking drum (gángan): a pitched membrane whose pitch bends as the player squeezes the strings
  talk(t, v = 1, from = 190, to = 310) {
    const ctx = this.ctx, o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o2.type = 'triangle';
    o.frequency.setValueAtTime(from, t); o.frequency.exponentialRampToValueAtTime(to, t + 0.09);
    o.frequency.exponentialRampToValueAtTime(to * 0.86, t + 0.3);
    o2.frequency.setValueAtTime(from * 2.02, t); o2.frequency.exponentialRampToValueAtTime(to * 2.02, t + 0.09);
    const g2 = ctx.createGain(); g2.gain.value = 0.18;
    this.env(g, t, 0.75 * v, 0.004, 0.32);
    o.connect(g); o2.connect(g2).connect(g); this.out(g, 0.35);
    o.start(t); o2.start(t); o.stop(t + 0.4); o2.stop(t + 0.4);
    this.emit('talk', t, v);
  }

  conga(t, v = 1, fq = 330) {
    const ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(fq * 1.25, t); o.frequency.exponentialRampToValueAtTime(fq, t + 0.03);
    this.env(g, t, 0.45 * v, 0.002, 0.18);
    o.connect(g); this.out(g, 0.25);
    o.start(t); o.stop(t + 0.25);
    this.emit('conga', t, v);
  }

  bell(t, v = 1) {
    const ctx = this.ctx, g = ctx.createGain(), f = ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 2;
    this.env(g, t, 0.16 * v, 0.001, 0.14);
    [800, 540].forEach(fq => {
      const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = fq;
      o.connect(f); o.start(t); o.stop(t + 0.2);
    });
    f.connect(g); this.out(g, 0.2);
    this.emit('bell', t, v);
  }

  bass(t, note, dur, v = 1) {
    const ctx = this.ctx, o = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sine'; o2.type = 'triangle';
    o.frequency.value = NOTE(note); o2.frequency.value = NOTE(note + 12);
    f.type = 'lowpass'; f.frequency.value = 900;
    const g2 = ctx.createGain(); g2.gain.value = 0.25;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5 * v, t + 0.01);
    g.gain.setTargetAtTime(0.0001, t + dur * 0.8, 0.05);
    o.connect(f); o2.connect(g2).connect(f); f.connect(g); this.out(g);
    o.start(t); o2.start(t); o.stop(t + dur + 0.3); o2.stop(t + dur + 0.3);
  }

  // Rhodes-ish electric piano: sine + soft FM bell, with a slow tremolo
  keys(t, notes, dur, v = 1) {
    const ctx = this.ctx, g = ctx.createGain(), f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 2600;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09 * v, t + 0.015);
    g.gain.setTargetAtTime(0.0001, t + dur * 0.9, 0.18);
    const trem = ctx.createOscillator(), tg = ctx.createGain();
    trem.frequency.value = 4.6; tg.gain.value = 0.025;
    trem.connect(tg).connect(g.gain);
    trem.start(t); trem.stop(t + dur + 1);
    notes.forEach(n => {
      const car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain();
      car.frequency.value = NOTE(n); mod.frequency.value = NOTE(n) * 14;
      mg.gain.setValueAtTime(NOTE(n) * 1.4, t); mg.gain.exponentialRampToValueAtTime(1, t + 0.4);
      mod.connect(mg).connect(car.frequency);
      car.connect(f);
      car.start(t); mod.start(t); car.stop(t + dur + 1); mod.stop(t + dur + 1);
    });
    f.connect(g); this.out(g, 0.5);
    this.emit('keys', t, v);
  }

  pluck(t, note, v = 1) {
    const ctx = this.ctx, o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = NOTE(note);
    f.type = 'lowpass'; f.frequency.setValueAtTime(3200, t); f.frequency.exponentialRampToValueAtTime(500, t + 0.2);
    this.env(g, t, 0.07 * v, 0.003, 0.25);
    o.connect(f).connect(g); this.out(g, 0.45);
    o.start(t); o.stop(t + 0.3);
  }

  organ(t, notes, dur, v = 1) {
    const ctx = this.ctx, g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05 * v, t + 0.01);
    g.gain.setTargetAtTime(0.0001, t + dur, 0.06);
    notes.forEach(n => [1, 2, 3].forEach((h, i) => {
      const o = ctx.createOscillator(); o.frequency.value = NOTE(n) * h;
      const hg = ctx.createGain(); hg.gain.value = [1, 0.5, 0.25][i];
      o.connect(hg).connect(g); o.start(t); o.stop(t + dur + 0.4);
    }));
    this.out(g, 0.4);
    this.emit('keys', t, v);
  }

  // ─── Sequencer ────────────────────────────────────────────────
  setStyle(name) {
    if (!STYLES[name]) return;
    this.style = name;
    if (this.playing && this.ctx) this.crash(this.ctx.currentTime + 0.02, 0.7);
  }

  setVolume(v) {
    this.volume = v;
    if (this.master) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  duck(on) {
    if (!this.master) return;
    this.master.gain.setTargetAtTime(on ? 0.0001 : this.volume, this.ctx.currentTime, on ? 0.25 : 0.6);
  }

  async start() {
    await this.init();
    if (this.playing) return;
    this.playing = true;
    this.step = 0; this.bar = 0; this.phrases = 0;
    this.next = this.ctx.currentTime + 0.08;
    // "the drop" — sweep the mix open
    this.tone.frequency.cancelScheduledValues(this.ctx.currentTime);
    this.tone.frequency.setValueAtTime(380, this.ctx.currentTime);
    this.tone.frequency.exponentialRampToValueAtTime(18000, this.ctx.currentTime + 2.6);
    this.crash(this.next, 0.8);
    this.timer = setInterval(() => this.tick(), 25);
    this.listeners.forEach(fn => fn('state', 1));
  }

  stop() {
    this.playing = false;
    clearInterval(this.timer);
    this.listeners.forEach(fn => fn('state', 0));
  }

  toggle() { return this.playing ? (this.stop(), false) : (this.start(), true); }

  tick() {
    const S = STYLES[this.style];
    const spb = 60 / S.bpm / 4;
    while (this.next < this.ctx.currentTime + 0.12) {
      const swing = this.step % 2 ? S.swing * spb : 0;
      this.play(S, this.step, this.bar, this.next + swing, spb);
      this.next += spb;
      if (++this.step === 16) { this.step = 0; this.bar = (this.bar + 1) % 4; }
      this.listeners.forEach(fn => fn('step', this.step));
    }
  }

  play(S, s, bar, t0, spb) {
    // Humanise: tiny timing drift (a drummer, not a grid) + velocity breathing across the bar
    const t = t0 + (Math.random() - 0.5) * 0.008;
    const breathe = 0.9 + 0.1 * Math.sin((s / 16) * Math.PI * 2 + bar);
    const pick = (arr, b = bar) => arr && arr.length ? arr[b % arr.length][s] : '.';
    const hit = (arr, fn) => { const c = pick(arr); if (c !== '.') fn(VEL[c] * breathe * (0.88 + Math.random() * 0.12)); };

    // Phrase start: land the crash with the kick after every 4-bar turnaround
    if (bar === 0 && s === 0 && this.phrases++ > 0 && this.style !== 'kompa') this.crash(t, 0.55);

    // Last beat of every 4th bar → a fill in the style's own language
    const FILL = FILLS[this.style];
    if (bar === 3 && s >= 16 - FILL.length) {
      const f = FILL[s - (16 - FILL.length)];
      f.forEach(([inst, v, arg], k) => {
        const tt = t + k * spb / f.length;
        if (inst === 'kick') this.kick(tt, v);
        else if (inst === 'snare') this.snare(tt, v);
        else if (inst === 'tom') this.tom(tt, v, arg);
        else if (inst === 'talk') this.talk(tt, v, arg, arg * 1.6);
        else if (inst === 'conga') this.conga(tt, v, arg);
        else if (inst === 'clap') this.clap(tt, v);
      });
      this.hat(t, 0.4);
      this.keysAndBass(S, s, bar, t, spb);
      return;
    }

    // Ghost notes: the little in-between strokes that make a groove feel alive
    if (pick(S.snare) === '.' && s % 2 === 1 && Math.random() < 0.14 && this.style !== 'highlife') this.rim(t, 0.18);
    hit(S.kick, v => this.kick(t, v));
    hit(S.snare, v => (this.style === 'afrobeats' || this.style === 'kompa') ? this.rim(t, v) : v < 0.4 ? this.snare(t, v * 0.55) : this.snare(t, v));
    hit(S.clap, v => this.clap(t, v));
    hit(S.hat, v => this.hat(t, v * 0.8, s === 14 && bar % 2 === 1));
    hit(S.ride, v => this.ride(t, v));
    hit(S.shaker, v => this.shaker(t, v));
    hit(S.bell, v => this.bell(t, v));
    hit(S.talk, v => this.talk(t, v, 170 + Math.random() * 40, 260 + Math.random() * 90));
    hit(S.conga, v => this.conga(t, v, s % 4 === 3 ? 260 : 340));
    hit(S.crash, v => this.crash(t, v * 0.7));
    this.keysAndBass(S, s, bar, t, spb);
  }

  keysAndBass(S, s, bar, t, spb) {
    const chord = S.chords[bar % S.chords.length];
    if (S.organ) {
      if (s === 0 || s === 6 || s === 10) this.organ(t, chord, spb * (s === 0 ? 5 : 3));
    } else if (S.pluck) {
      if (s % 2 === 0) this.pluck(t, chord[(s / 2) % chord.length] + ((s / 2) % 4 === 3 ? 12 : 0), s % 4 === 0 ? 1 : 0.6);
      if (s === 0) this.keys(t, chord, spb * 14, 0.5);
    } else if (s === 0 || (s === 10 && bar % 2 === 1)) {
      this.keys(t, chord, spb * (s === 0 ? 10 : 6));
    }

    const shift = S.bassShift[bar % S.bassShift.length];
    S.bass.forEach(([n, at, len]) => { if (at === s) S.log ? this.logdrum(t, n + shift, len * spb) : this.bass(t, n + shift, len * spb); });
  }

  // Single hits for the playable kit
  trigger(name) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.005;
    ({
      kick: () => this.kick(t),
      snare: () => this.snare(t),
      hat: () => this.hat(t),
      openhat: () => this.hat(t, 1, true),
      clap: () => this.clap(t),
      rim: () => this.rim(t),
      tomhi: () => this.tom(t, 1, 200),
      tomlo: () => this.tom(t, 1, 110),
      ride: () => this.ride(t),
      crash: () => this.crash(t),
      talkup: () => this.talk(t, 1, 170, 330),
      talkdown: () => this.talk(t, 1, 330, 180),
      conga: () => this.conga(t),
      bell: () => this.bell(t),
    })[name]?.();
  }

  level() {
    if (!this.analyser) return { low: 0, mid: 0, high: 0, bins: null };
    this.analyser.getByteFrequencyData(this.freq);
    const f = this.freq, avg = (a, b) => { let s = 0; for (let i = a; i < b; i++) s += f[i]; return s / (b - a) / 255; };
    return { low: avg(0, 6), mid: avg(6, 30), high: avg(30, 90), bins: f };
  }
}

export const groove = new Groove();
