// The floating kit — a persistent WebGL scene that listens to the groove engine.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { LOGO } from './logo.js';

const MOBILE = matchMedia('(max-width: 760px)').matches;
// Quality tier: low-end phones (common for much of his audience) get a lighter scene automatically
const LOW = (navigator.deviceMemory && navigator.deviceMemory <= 4) || (navigator.hardwareConcurrency || 8) <= 4 || (MOBILE && devicePixelRatio > 2.5 && (navigator.hardwareConcurrency || 8) <= 6);
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── Procedural textures ──────────────────────────────────────────
function lathed() {
  // Concentric tonal grooves for cymbals (lathe UV v runs from bell to edge)
  const c = document.createElement('canvas'); c.width = 8; c.height = 1024;
  const g = c.getContext('2d');
  for (let y = 0; y < 1024; y++) {
    const v = 128 + Math.sin(y * 1.9) * 40 + Math.sin(y * 0.37) * 30 + (Math.random() - 0.5) * 40;
    g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(0, y, 8, 1);
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function lacquer(base, stripe) {
  // Sparkle-lacquer shell wrap with a subtle vertical racing stripe
  const c = document.createElement('canvas'); c.width = 1024; c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, base[0]); grd.addColorStop(0.5, base[1]); grd.addColorStop(1, base[0]);
  g.fillStyle = grd; g.fillRect(0, 0, 1024, 256);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = `rgba(255,${180 + Math.random() * 60},${90 + Math.random() * 80},${Math.random() * 0.35})`;
    g.fillRect(Math.random() * 1024, Math.random() * 256, 1.4, 1.4);
  }
  g.fillStyle = stripe; g.fillRect(0, 118, 1024, 20);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping;
  return t;
}

function kickHead(logo) {
  const c = document.createElement('canvas'); c.width = c.height = 1024;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(512, 512, 60, 512, 512, 512);
  grd.addColorStop(0, '#1d140d'); grd.addColorStop(1, '#070504');
  g.fillStyle = grd; g.fillRect(0, 0, 1024, 1024);
  g.strokeStyle = 'rgba(217,164,65,.55)'; g.lineWidth = 3;
  [470, 440].forEach(r => { g.beginPath(); g.arc(512, 512, r, 0, Math.PI * 2); g.stroke(); });
  g.textAlign = 'center'; g.textBaseline = 'middle';
  // his signature, front and centre on the reso head
  if (logo) g.drawImage(logo, 512 - 380, 512 - 150, 760, 760 * logo.height / logo.width);
  g.fillStyle = 'rgba(243,233,216,.55)';
  g.font = '500 28px "JetBrains Mono", monospace';
  g.fillText('D R U M S  ·  P R O D U C E R  ·  M D', 512, 700);
  const txt = ' ARAMOGHO OGHENEKEVWE SAMUEL · DELTA STATE · NIGERIA ·';
  g.font = '600 26px "JetBrains Mono", monospace'; g.fillStyle = 'rgba(217,164,65,.8)';
  for (let i = 0; i < txt.length; i++) {
    const a = (i / txt.length) * Math.PI * 2 - Math.PI / 2;
    g.save(); g.translate(512 + Math.cos(a) * 400, 512 + Math.sin(a) * 400); g.rotate(a + Math.PI / 2);
    g.fillText(txt[i], 0, 0); g.restore();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

function loadLogo(svg) {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => res(img); img.onerror = () => res(null);
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace(/currentColor/g, '#f3e9d8').replace('<svg ', '<svg width="1800" height="571" '));
  });
}

// Soft sprite for haze/smoke
function puff() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  for (let i = 0; i < 30; i++) {
    const x = 128 + (Math.random() - 0.5) * 120, y = 128 + (Math.random() - 0.5) * 120, r = 30 + Math.random() * 70;
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, 'rgba(255,235,210,.08)'); rg.addColorStop(1, 'rgba(255,235,210,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 256, 256);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function coated() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#e9e1d2'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(120,100,80,${Math.random() * 0.08})`; g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
  const r = g.createRadialGradient(128, 128, 4, 128, 128, 40);
  r.addColorStop(0, 'rgba(90,70,50,.25)'); r.addColorStop(1, 'rgba(90,70,50,0)');
  g.fillStyle = r; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ─── Scene ────────────────────────────────────────────────────────
export function createScene(canvas, groove) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !MOBILE, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, LOW ? 1 : MOBILE ? 1.4 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.82;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0b0806');
  scene.fog = new THREE.FogExp2('#0b0806', 0.045);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.42;

  const camera = new THREE.PerspectiveCamera(MOBILE ? 52 : 38, 1, 0.1, 100);
  camera.position.set(0, 1.4, 9);

  // Lights: warm key, ember rim, cool fill
  const key = new THREE.SpotLight('#ffd9a0', 38, 30, 0.55, 0.6, 1.4);
  key.position.set(3, 8, 6); scene.add(key);
  const rim = new THREE.PointLight('#ff5a1f', 22, 18, 1.6); rim.position.set(-5, 2, -3); scene.add(rim);
  const rim2 = new THREE.PointLight('#ffb347', 12, 18, 1.6); rim2.position.set(5, 3, -4); scene.add(rim2);
  const fill = new THREE.HemisphereLight('#5a6b8a', '#1a0f08', 0.35); scene.add(fill);

  const kit = new THREE.Group(); scene.add(kit);
  const parts = {};

  // Materials
  const brass = new THREE.MeshPhysicalMaterial({
    color: '#d19a3c', metalness: 1, roughness: 0.3, clearcoat: 0.4, clearcoatRoughness: 0.25,
    bumpMap: lathed(), bumpScale: 1.2, side: THREE.DoubleSide,
  });
  const chrome = new THREE.MeshStandardMaterial({ color: '#e8e8ea', metalness: 1, roughness: 0.14 });
  const shellMat = new THREE.MeshPhysicalMaterial({
    map: lacquer(['#2a0c05', '#7a1f08'], 'rgba(217,164,65,.85)'), metalness: 0.35, roughness: 0.32,
    clearcoat: 1, clearcoatRoughness: 0.06, side: THREE.DoubleSide,
  });
  const headMat = new THREE.MeshStandardMaterial({ map: coated(), color: '#a89e8f', roughness: 0.92, metalness: 0 });
  const kickTex = kickHead(null);
  const kickMat = new THREE.MeshStandardMaterial({ map: kickTex, roughness: 0.55, metalness: 0.1, emissive: '#ffffff', emissiveMap: kickTex, emissiveIntensity: 0 });
  const wood = new THREE.MeshStandardMaterial({ color: '#d8b07a', roughness: 0.55 });

  // Rebuild the kick-head texture with the signature once fonts + logo are ready
  Promise.all([document.fonts?.ready, loadLogo(LOGO)]).then(([, img]) => {
    const tex = kickHead(img); kickMat.map = tex; kickMat.emissiveMap = tex; kickMat.needsUpdate = true;
  });

  function drum(r, depth, opts = {}) {
    const g = new THREE.Group();
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(r, r, depth, 64, 1, true), shellMat);
    g.add(shell);
    const top = new THREE.Mesh(new THREE.CircleGeometry(r * 0.985, 64), opts.front || headMat);
    top.rotation.x = -Math.PI / 2; top.position.y = depth / 2 + 0.002; g.add(top);
    const bottom = new THREE.Mesh(new THREE.CircleGeometry(r * 0.985, 48), headMat);
    bottom.rotation.x = Math.PI / 2; bottom.position.y = -depth / 2 - 0.002; g.add(bottom);
    [depth / 2, -depth / 2].forEach(y => {
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(r * 1.01, r * 0.035, 12, 72), chrome);
      hoop.rotation.x = Math.PI / 2; hoop.position.y = y; g.add(hoop);
    });
    const lugs = opts.lugs ?? 8;
    for (let i = 0; i < lugs; i++) {
      const a = (i / lugs) * Math.PI * 2;
      const lug = new THREE.Mesh(new THREE.CapsuleGeometry(r * 0.04, depth * 0.35, 4, 8), chrome);
      lug.position.set(Math.cos(a) * r * 1.04, 0, Math.sin(a) * r * 1.04);
      g.add(lug);
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.012, r * 0.012, depth * 1.02, 6), chrome);
      rod.position.set(Math.cos(a) * r * 1.03, 0, Math.sin(a) * r * 1.03);
      g.add(rod);
    }
    g.userData.head = top;
    return g;
  }

  // Cymbal cross-section: domed bell, then a gently sloping bow out to the edge
  const cymbalY = (x, r) => {
    const bell = r * 0.2;
    return x < bell ? 0.11 * r * Math.cos((x / bell) * Math.PI / 2) + 0.03 * r : 0.03 * r * (1 - (x - bell) / (r - bell)) - 0.02 * r * Math.pow((x - bell) / (r - bell), 2);
  };

  // Centent Cymbals & Gongs logo, printed in dark ink on the bow like their real cymbals
  const cententTex = new THREE.TextureLoader().load('assets/centent-logo.png', t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); });
  const cententMat = new THREE.MeshStandardMaterial({
    map: cententTex, color: '#1f1208', transparent: true, alphaTest: 0.04, metalness: 0.35, roughness: 0.55, opacity: 0.92,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, depthWrite: false, side: THREE.DoubleSide,
  });
  function cententDecal(r) {
    const w = r * 0.74, h = w * 701 / 1112, cz = r * 0.56;
    const geo = new THREE.PlaneGeometry(w, h, 24, 16);
    geo.rotateX(-Math.PI / 2); // flat on the cymbal, logo top pointing toward the bell
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i) + cz;
      pos.setZ(i, z);
      pos.setY(i, cymbalY(Math.min(Math.hypot(x, z), r * 0.98), r) + 0.004); // hug the curve of the bow
    }
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, cententMat);
  }

  function cymbal(r) {
    const pts = [];
    const n = 40;
    for (let i = 0; i <= n; i++) {
      const x = (i / n) * r;
      pts.push(new THREE.Vector2(Math.max(x, 0.001), cymbalY(x, r)));
    }
    const geo = new THREE.LatheGeometry(pts, 96);
    const m = new THREE.Mesh(geo, brass);
    const g = new THREE.Group(); g.add(m);
    g.add(cententDecal(r));
    // felt + wing nut
    const felt = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 16), new THREE.MeshStandardMaterial({ color: '#8a1d10', roughness: 1 }));
    felt.position.y = 0.16 * r; g.add(felt);
    return g;
  }

  function talkingDrum() {
    // Gángan: an hourglass body laced with tension cords
    const pts = [];
    for (let i = 0; i <= 30; i++) {
      const y = (i / 30) * 1.3 - 0.65;
      pts.push(new THREE.Vector2(0.22 + 0.16 * Math.pow(Math.abs(y) / 0.65, 2.2), y));
    }
    const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 48), new THREE.MeshPhysicalMaterial({
      color: '#6b3a17', roughness: 0.55, clearcoat: 0.5, side: THREE.DoubleSide,
    }));
    const g = new THREE.Group(); g.add(body);
    [0.65, -0.65].forEach(y => {
      const h = new THREE.Mesh(new THREE.CircleGeometry(0.38, 40), headMat);
      h.rotation.x = y > 0 ? -Math.PI / 2 : Math.PI / 2; h.position.y = y; g.add(h);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.385, 0.02, 8, 48), new THREE.MeshStandardMaterial({ color: '#2a170a', roughness: 0.9 }));
      ring.rotation.x = Math.PI / 2; ring.position.y = y; g.add(ring);
    });
    const cordMat = new THREE.LineBasicMaterial({ color: '#e8cfa0', transparent: true, opacity: 0.8 });
    const cords = [];
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2, b = a + Math.PI / 14;
      cords.push(new THREE.Vector3(Math.cos(a) * 0.385, 0.65, Math.sin(a) * 0.385), new THREE.Vector3(Math.cos(b) * 0.385, -0.65, Math.sin(b) * 0.385));
    }
    g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(cords), cordMat));
    g.userData.head = g.children[1];
    return g;
  }

  function stick() {
    const g = new THREE.Group();
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 1.7, 16), wood);
    s.position.y = 0.85; g.add(s);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.032, 16, 12), wood);
    tip.scale.y = 1.6; tip.position.y = 1.72; g.add(tip);
    // invisible, fatter hit area so the thin sticks are easy to tap
    const hitArea = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.8, 8), new THREE.MeshBasicMaterial({ visible: false }));
    hitArea.position.y = 0.88; g.add(hitArea);
    return g;
  }

  function place(name, obj, pos, rot = [0, 0, 0]) {
    obj.position.set(...pos); obj.rotation.set(...rot);
    obj.userData.base = new THREE.Vector3(...pos);
    obj.userData.rot = new THREE.Euler(...rot);
    obj.userData.phase = Math.random() * Math.PI * 2;
    obj.userData.hit = 0; obj.userData.wob = 0; obj.userData.wobV = 0;
    obj.userData.gear = name; // lets the pointer identify the piece (see pick())
    kit.add(obj); parts[name] = obj;
  }

  place('kick', drum(1.15, 1.0, { front: kickMat, lugs: 10 }), [0, 0.2, -0.4], [Math.PI / 2, 0, 0]);
  place('snare', drum(0.55, 0.26), [-1.55, 1.05, 0.9], [0.35, 0, 0.18]);
  place('tom1', drum(0.42, 0.36), [-0.6, 1.75, 0.35], [0.55, 0, 0.12]);
  place('tom2', drum(0.48, 0.4), [0.65, 1.8, 0.35], [0.55, 0, -0.12]);
  place('floor', drum(0.62, 0.62), [1.85, 0.55, 0.9], [0.25, 0, -0.1]);
  place('hat', cymbal(0.62), [-2.5, 1.65, 0.6], [0.2, 0, 0.1]);
  place('crash', cymbal(0.9), [-1.5, 2.75, -0.3], [0.45, 0, 0.25]);
  place('ride', cymbal(1.05), [2.45, 2.35, -0.25], [0.35, 0, -0.3]);
  place('splash', cymbal(0.45), [0.1, 3.15, -0.6], [0.6, 0, 0]);
  place('talk', talkingDrum(), [3.2, 0.3, 1.6], [0.2, 0, 0.9]);

  // Hi-hat bottom cymbal
  const hatBottom = cymbal(0.62); hatBottom.rotation.x = Math.PI; hatBottom.position.y = -0.09;
  parts.hat.add(hatBottom);

  // Sticks hovering over the snare and the hat
  const stickL = stick(), stickR = stick();
  place('stickL', stickL, [-1.95, 1.55, 1.9], [-1.05, 0.3, 0.55]);
  place('stickR', stickR, [-1.1, 1.6, 2.0], [-1.1, -0.2, -0.35]);

  // ─── Shockwave rings (kick) ───────────────────────────────
  const ringGeo = new THREE.RingGeometry(0.96, 1, 128);
  const rings = Array.from({ length: 10 }, () => {
    const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: '#ff7a33', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    m.userData.life = 0; m.visible = false; scene.add(m); return m;
  });
  let ringIdx = 0;
  function shock(color = '#ff7a33', from = parts.kick, scale = 1) {
    const r = rings[ringIdx++ % rings.length];
    r.material.color.set(color);
    from.getWorldPosition(r.position);
    r.position.z += 0.55;
    r.userData.life = 1; r.userData.scale = scale; r.visible = true;
  }

  // ─── Nebula particles ─────────────────────────────────────
  const COUNT = LOW ? 1200 : MOBILE ? 2600 : 7000;
  const pos = new Float32Array(COUNT * 3), seed = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const r = 5 + Math.pow(Math.random(), 0.6) * 16, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.cos(ph) * 0.55 + 1;
    pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th) - 3;
    seed[i] = Math.random();
  }
  const pgeo = new THREE.BufferGeometry();
  pgeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pgeo.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  const pmat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uLow: { value: 0 }, uHigh: { value: 0 }, uPix: { value: renderer.getPixelRatio() } },
    vertexShader: `
      attribute float seed; uniform float uTime, uLow, uHigh, uPix; varying float vSeed; varying float vGlow;
      void main(){
        vec3 p = position;
        float a = uTime * (0.03 + seed * 0.04);
        p.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * p.xz;
        p *= 1.0 + uLow * 0.09 * (0.5 + seed);
        p.y += sin(uTime * 0.6 + seed * 20.0) * 0.25;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vSeed = seed; vGlow = uHigh;
        gl_PointSize = (1.2 + seed * 2.8 + uLow * 3.0 * step(0.8, seed)) * uPix * (14.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying float vSeed; varying float vGlow;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        vec3 c = mix(vec3(1.0, 0.42, 0.13), vec3(1.0, 0.82, 0.5), vSeed);
        gl_FragColor = vec4(c, a * (0.25 + vSeed * 0.45 + vGlow * 0.4));
      }`,
  });
  scene.add(new THREE.Points(pgeo, pmat));

  // Glowing floor disc under the kit
  const floor = new THREE.Mesh(new THREE.CircleGeometry(7, 64), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: { uPulse: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `varying vec2 vUv; uniform float uPulse; void main(){ float d = length(vUv-.5)*2.; float r = smoothstep(1.,.0,d)*.22 + smoothstep(.02,.0,abs(d-.55-uPulse*.3))*.25*uPulse; gl_FragColor = vec4(vec3(1.,.45,.15)*r, r); }`,
  }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -1.03; scene.add(floor);

  // ─── Stage: drum riser, light beams, haze ─────────────────
  const riser = new THREE.Mesh(new THREE.CylinderGeometry(4.3, 4.5, 0.4, 72), new THREE.MeshStandardMaterial({ color: '#15100b', roughness: 0.85, metalness: 0.1 }));
  riser.position.y = -1.25; scene.add(riser);
  const edgeMat = new THREE.MeshBasicMaterial({ color: '#ff6a2b', transparent: true, opacity: 0.6 });
  const edge = new THREE.Mesh(new THREE.TorusGeometry(4.31, 0.025, 8, 160), edgeMat);
  edge.rotation.x = Math.PI / 2; edge.position.y = -1.05; scene.add(edge);
  const edge2 = new THREE.Mesh(new THREE.TorusGeometry(4.5, 0.015, 8, 160), new THREE.MeshBasicMaterial({ color: '#d9a441', transparent: true, opacity: 0.35 }));
  edge2.rotation.x = Math.PI / 2; edge2.position.y = -1.45; scene.add(edge2);

  const beamGeo = new THREE.ConeGeometry(1.5, 15, 40, 1, true);
  beamGeo.translate(0, -7.5, 0); beamGeo.rotateX(-Math.PI / 2); // tip at origin, beam runs along +Z
  const BEAM_COLORS = ['#ffe2b8', '#ff9a4d', '#ff6a2b', '#ff6a2b', '#ff9a4d', '#ffe2b8'];
  const beams = BEAM_COLORS.slice(0, LOW ? 4 : 6).map((c, i, arr) => {
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uColor: { value: new THREE.Color(c) }, uI: { value: 0.3 } },
      vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position,1.); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: `uniform vec3 uColor; uniform float uI; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        void main(){ float along = pow(vUv.y, 1.6); float side = pow(abs(dot(vN, vV)), 1.8); gl_FragColor = vec4(uColor * along * side * uI * .32, 1.); }`,
    });
    const pivot = new THREE.Object3D();
    const x = (i / (arr.length - 1) - 0.5) * 13;
    pivot.position.set(x, 9.5, -3.5 - Math.abs(x) * 0.15);
    pivot.add(new THREE.Mesh(beamGeo, m));
    pivot.userData = { phase: i * 1.3, speed: 0.25 + (i % 3) * 0.08, flash: 0, mat: m, side: x };
    scene.add(pivot);
    return pivot;
  });
  // Lamp heads at the top of each beam
  beams.forEach(b => {
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), new THREE.MeshBasicMaterial({ color: b.userData.mat.uniforms.uColor.value }));
    lamp.position.copy(b.position); scene.add(lamp);
  });

  const hazeTex = puff();
  const haze = Array.from({ length: LOW ? 6 : 14 }, (_, i) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: hazeTex, transparent: true, depthWrite: false, opacity: 0.55, color: i % 3 ? '#ffd9b0' : '#ff9a60' }));
    const sc = 6 + Math.random() * 6; sp.scale.set(sc, sc * 0.6, 1);
    sp.position.set((Math.random() - 0.5) * 14, -0.6 + Math.random() * 3.2, (Math.random() - 0.5) * 8 - 1);
    sp.userData = { x: sp.position.x, s: 0.05 + Math.random() * 0.08, p: Math.random() * 6 };
    scene.add(sp); return sp;
  });
  const beamTarget = new THREE.Vector3();

  // ─── Post ─────────────────────────────────────────────────
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.3, 0.6, 0.9);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ─── Groove → visuals ─────────────────────────────────────
  const hit = (name, amt = 1) => { const p = parts[name]; if (p) { p.userData.hit = Math.max(p.userData.hit, amt); p.userData.wobV += amt * 0.12; } };
  let kickPulse = 0, flash = 0, beamFlip = 0;
  groove.on((type, v) => {
    switch (type) {
      case 'kick': hit('kick', v); kickPulse = 1; shock('#ff7a33', parts.kick, 1 + v * 0.5); break;
      case 'snare': case 'clap': hit('snare', v); hit('stickL', v); flash = Math.max(flash, 0.5 * v); beams[beamFlip++ % beams.length].userData.flash = v; break;
      case 'rim': hit('snare', v * 0.5); hit('stickL', v * 0.8); break;
      case 'hat': hit('hat', v * 0.4); hit('stickR', v * 0.5); break;
      case 'openhat': hit('hat', v); hit('stickR', v); break;
      case 'crash': hit('crash', v * 1.4); hit('ride', v); hit('splash', v); flash = 1; shock('#ffd08a', parts.crash, 2.2); beams.forEach(b => { b.userData.flash = 1; }); break;
      case 'tom': hit(Math.random() > 0.5 ? 'tom1' : 'tom2', v); hit('floor', v * 0.6); break;
      case 'talk': hit('talk', v * 1.2); shock('#ffb347', parts.talk, 0.6); break;
      case 'conga': hit('floor', v * 0.6); break;
      case 'bell': hit('ride', v * 0.35); break;
      case 'ride': hit('ride', v * 0.6); hit('stickR', v * 0.5); break;
      case 'keys': hit('splash', 0.3); break;
    }
  });

  // ─── Camera path driven by scroll ─────────────────────────
  const shots = [
    { p: [0, 1.9, 11], l: [0, 0.9, 0] },      // hero
    { p: [-4.6, 2.2, 6.2], l: [0.8, 1.3, 0] },  // story
    { p: [-3.6, 3.9, 5.4], l: [-1.2, 2.1, 0] }, // roles (close to cymbals)
    { p: [4.8, 1.2, 5.5], l: [0.5, 1.2, 0] },  // journey
    { p: [0, 7, 11], l: [0, 0.5, 0] },         // vault (pulled back, top)
    { p: [0.2, 5.2, 6.4], l: [-0.2, 0.8, -0.4] }, // play the kit: drummer's-eye view over the snare
    { p: [5, 3.6, -9], l: [0, 1.2, 0] },       // contact (around the back)
  ];
  let progress = 0, target = 0;
  const curP = new THREE.CatmullRomCurve3(shots.map(s => new THREE.Vector3(...s.p)));
  const curL = new THREE.CatmullRomCurve3(shots.map(s => new THREE.Vector3(...s.l)));
  const mouse = new THREE.Vector2(), mouseS = new THREE.Vector2();
  addEventListener('pointermove', e => { mouse.set(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5); });

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false); composer.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    bloom.resolution.set(w, h);
  }
  addEventListener('resize', resize); resize();

  const clock = new THREE.Clock();
  let running = true, idle = 0, useBloom = !LOW, fpsFrames = 0, fpsTime = 0, degrade = 0;
  const lookV = new THREE.Vector3();

  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    const L = groove.level();

    // Gentle autoplay "breathing" when music is off, so the scene never feels dead
    if (!groove.playing) {
      idle += dt;
      if (idle > 2.4 && !REDUCED) { idle = 0; shock('#ff7a33', parts.kick, 0.6); hit('kick', 0.35); }
    }

    progress += (target - progress) * Math.min(1, dt * 3);
    const u = THREE.MathUtils.clamp(progress, 0, 1);
    curP.getPoint(u, camera.position);
    curL.getPoint(u, lookV);
    mouseS.lerp(mouse, dt * 2.5);
    camera.position.x += mouseS.x * 0.9; camera.position.y -= mouseS.y * 0.6;
    camera.lookAt(lookV);

    kit.rotation.y = Math.sin(t * 0.15) * 0.12 + mouseS.x * 0.15;

    for (const name in parts) {
      const o = parts[name], d = o.userData;
      const bob = REDUCED ? 0 : Math.sin(t * 0.8 + d.phase) * 0.06;
      o.position.copy(d.base); o.position.y += bob;
      // spring wobble (cymbals swing, drums punch)
      d.wobV += -d.wob * 0.18 - d.wobV * 0.12;
      d.wob += d.wobV;
      if (name.startsWith('stick')) {
        o.rotation.set(d.rot.x - d.hit * 0.55, d.rot.y, d.rot.z);
      } else if (['hat', 'crash', 'ride', 'splash'].includes(name)) {
        // gentle sway (not a full spin) so the Centent logo stays facing the audience
        o.rotation.set(d.rot.x + d.wob * 0.9, d.rot.y + Math.sin(t * 0.3 + d.phase) * 0.22, d.rot.z + d.wob * 0.4);
      } else {
        o.rotation.copy(d.rot);
        const s = 1 + d.hit * 0.045;
        o.scale.setScalar(s);
      }
      d.hit *= Math.pow(0.0008, dt); // fast decay
    }
    kickMat.emissiveIntensity = kickPulse * 0.35;
    edgeMat.opacity = 0.35 + kickPulse * 0.6;

    beams.forEach(b => {
      const d = b.userData;
      const sweep = REDUCED ? 0 : Math.sin(t * d.speed + d.phase);
      beamTarget.set(-d.side * 0.25 + sweep * 3.2, -1.1, 1 + Math.cos(t * d.speed * 0.7 + d.phase) * 2.2);
      b.lookAt(beamTarget);
      d.mat.uniforms.uI.value = 0.14 + L.low * 0.25 + d.flash * 0.9;
      d.flash *= Math.pow(0.015, dt);
    });
    haze.forEach(h => {
      const d = h.userData;
      h.position.x = d.x + Math.sin(t * d.s + d.p) * 1.5;
      h.material.opacity = 0.35 + Math.sin(t * d.s * 2 + d.p) * 0.12 + L.low * 0.15;
    });
    kickPulse *= Math.pow(0.002, dt);

    rings.forEach(r => {
      if (!r.visible) return;
      r.userData.life -= dt * 1.1;
      const k = 1 - r.userData.life;
      r.scale.setScalar(1.1 + k * 3.2 * r.userData.scale);
      r.material.opacity = Math.pow(Math.max(0, r.userData.life), 2) * 0.32;
      r.lookAt(camera.position);
      if (r.userData.life <= 0) r.visible = false;
    });

    pmat.uniforms.uTime.value = t;
    pmat.uniforms.uLow.value = L.low;
    pmat.uniforms.uHigh.value = L.high;
    floor.material.uniforms.uPulse.value = L.low;
    key.intensity = 34 + flash * 40;
    rim.intensity = 18 + L.low * 30;
    flash *= Math.pow(0.02, dt);
    bloom.strength = 0.28 + L.low * 0.25 + flash * 0.2;

    if (useBloom) composer.render(); else renderer.render(scene, camera);

    // Frame-rate governor: if a device struggles, drop resolution and bloom rather than stutter
    fpsFrames++; fpsTime += dt;
    if (fpsTime > 2.5) {
      const fps = fpsFrames / fpsTime; fpsFrames = 0; fpsTime = 0;
      if (fps < 38 && degrade === 0) { degrade = 1; renderer.setPixelRatio(1); resize(); }
      else if (fps < 30 && degrade === 1) { degrade = 2; useBloom = false; }
    }
  }
  frame();

  document.addEventListener('visibilitychange', () => {
    const was = running; running = !document.hidden;
    if (running && !was) { clock.getDelta(); frame(); }
  });

  // ─── Gear picking: which piece of the kit is under the pointer? ───
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), tmpV = new THREE.Vector3();
  ray.params.Line.threshold = 0.05;
  function pick(x, y) {
    ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    for (const h of ray.intersectObjects(kit.children, true)) {
      let o = h.object;
      while (o && !o.userData.gear) o = o.parent;
      if (o) return o.userData.gear;
    }
    return null;
  }
  function screenOf(name) {
    const p = parts[name]; if (!p) return null;
    p.getWorldPosition(tmpV).project(camera);
    return { x: (tmpV.x + 1) / 2 * innerWidth, y: (1 - tmpV.y) / 2 * innerHeight, visible: tmpV.z < 1 };
  }

  return {
    setProgress(p) { target = p; },
    pause(v) { const was = running; running = !v; if (running && !was) { clock.getDelta(); frame(); } },
    hit,
    pick,
    screenOf,
  };
}
