// Refined SVG art for the 3 reference towers (spark / frost / arc).
// Overwrites the simple placeholders so the in-game look matches the
// AI-prompt brief. Run with: node scripts/gen-tower-art.mjs
//
// 96×96, transparent, top-down. NO static barrel — Phaser draws a
// rotating barrel on top at runtime.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');

function write(rel, content) {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  console.log('wrote', rel);
}

// ── shared base: dark octagonal stone platform ──
function basePath() {
  // Octagon inscribed in 70px circle centred at (48,50)
  const cx = 48, cy = 50, r = 34;
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + (i / 8) * Math.PI * 2 + Math.PI / 8;
    pts.push(`${(cx + Math.cos(a) * r).toFixed(2)},${(cy + Math.sin(a) * r).toFixed(2)}`);
  }
  return pts.join(' ');
}

const SHARED_DEFS = `
  <radialGradient id="baseGrad" cx="50%" cy="35%" r="65%">
    <stop offset="0%" stop-color="#3a4250"/>
    <stop offset="60%" stop-color="#252a36"/>
    <stop offset="100%" stop-color="#13161e"/>
  </radialGradient>
  <radialGradient id="baseShadow" cx="50%" cy="50%" r="55%">
    <stop offset="0%" stop-color="#000" stop-opacity="0.55"/>
    <stop offset="100%" stop-color="#000" stop-opacity="0"/>
  </radialGradient>`;

// Stone-platform base shared by all towers.
const baseLayer = `
  <ellipse cx="48" cy="86" rx="36" ry="6" fill="url(#baseShadow)"/>
  <polygon points="${basePath()}" fill="url(#baseGrad)" stroke="#0c0e14" stroke-width="2"/>
  <polygon points="${basePath()}" fill="none" stroke="#5a6478" stroke-width="0.8" opacity="0.55"/>`;

// ── spark · 火花塔 (fire, basic) ──
// Brass cannon dome with glowing ember core + 4 tiny spike vents.
const sparkSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
  <defs>
    ${SHARED_DEFS}
    <radialGradient id="emberCore" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#fff4cc"/>
      <stop offset="35%" stop-color="#ffb35a"/>
      <stop offset="80%" stop-color="#c44a3a"/>
      <stop offset="100%" stop-color="#5a1810"/>
    </radialGradient>
    <linearGradient id="brass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#d8a263"/>
      <stop offset="100%" stop-color="#7a4828"/>
    </linearGradient>
  </defs>
  ${baseLayer}
  <!-- brass collar -->
  <circle cx="48" cy="48" r="24" fill="url(#brass)" stroke="#3c2616" stroke-width="1.5"/>
  <circle cx="48" cy="48" r="24" fill="none" stroke="#f0c890" stroke-width="0.8" opacity="0.5"/>
  <!-- 4 vent spikes -->
  <g fill="#3c2616" stroke="#1c0c08" stroke-width="0.6">
    <polygon points="48,18 50,30 46,30"/>
    <polygon points="48,78 50,66 46,66"/>
    <polygon points="18,48 30,46 30,50"/>
    <polygon points="78,48 66,46 66,50"/>
  </g>
  <!-- glowing ember core -->
  <circle cx="48" cy="48" r="14" fill="url(#emberCore)"/>
  <!-- inner flicker highlight -->
  <circle cx="44" cy="44" r="4" fill="#fff4cc" opacity="0.85"/>
  <!-- outer rim glow -->
  <circle cx="48" cy="48" r="26" fill="none" stroke="#ff7a3a" stroke-width="0.8" opacity="0.35"/>
</svg>`;

// ── frost · 霜针塔 (ice, basic) ──
// Six-sided ice crystal seated in a steel rim, 6 outward shards.
const frostSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
  <defs>
    ${SHARED_DEFS}
    <radialGradient id="iceCore" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="40%" stop-color="#a0e0f5"/>
      <stop offset="100%" stop-color="#2a5a78"/>
    </radialGradient>
    <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#9ab0c4"/>
      <stop offset="100%" stop-color="#445466"/>
    </linearGradient>
  </defs>
  ${baseLayer}
  <!-- steel rim -->
  <circle cx="48" cy="48" r="24" fill="url(#steel)" stroke="#1c2734" stroke-width="1.5"/>
  <circle cx="48" cy="48" r="24" fill="none" stroke="#cde0ec" stroke-width="0.8" opacity="0.55"/>
  <!-- 6 ice shards radiating outward -->
  <g fill="#cde9f5" stroke="#3a6a86" stroke-width="0.6">
    ${Array.from({ length: 6 }, (_, i) => {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const ox = 48 + Math.cos(a) * 30;
      const oy = 48 + Math.sin(a) * 30;
      const lx = 48 + Math.cos(a) * 22;
      const ly = 48 + Math.sin(a) * 22;
      const px = 48 + Math.cos(a + 0.18) * 24;
      const py = 48 + Math.sin(a + 0.18) * 24;
      const qx = 48 + Math.cos(a - 0.18) * 24;
      const qy = 48 + Math.sin(a - 0.18) * 24;
      return `<polygon points="${ox.toFixed(1)},${oy.toFixed(1)} ${px.toFixed(1)},${py.toFixed(1)} ${lx.toFixed(1)},${ly.toFixed(1)} ${qx.toFixed(1)},${qy.toFixed(1)}"/>`;
    }).join('\n    ')}
  </g>
  <!-- hexagonal crystal -->
  <polygon points="48,33 61,40.5 61,55.5 48,63 35,55.5 35,40.5"
           fill="url(#iceCore)" stroke="#4a8aa8" stroke-width="1.2"/>
  <!-- inner facet highlight -->
  <polygon points="48,38 56,42 48,48 40,42" fill="#ffffff" opacity="0.7"/>
  <!-- outer rim glow -->
  <circle cx="48" cy="48" r="32" fill="none" stroke="#a0e0f5" stroke-width="0.8" opacity="0.3"/>
</svg>`;

// ── arc · 电弧塔 (thunder, basic) ──
// Tesla coil: copper rings + 4 electrode posts + bright spark dot on top.
const arcSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
  <defs>
    ${SHARED_DEFS}
    <radialGradient id="sparkCore" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="40%" stop-color="#ffe680"/>
      <stop offset="100%" stop-color="#7a5a18"/>
    </radialGradient>
    <linearGradient id="copper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e8a458"/>
      <stop offset="100%" stop-color="#7a4218"/>
    </linearGradient>
  </defs>
  ${baseLayer}
  <!-- 4 electrode posts -->
  <g fill="url(#copper)" stroke="#3a1a0c" stroke-width="0.7">
    ${[0, 1, 2, 3].map(i => {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const x = 48 + Math.cos(a) * 22;
      const y = 48 + Math.sin(a) * 22;
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5"/>`;
    }).join('\n    ')}
  </g>
  <!-- coil ring outer -->
  <circle cx="48" cy="48" r="20" fill="none" stroke="url(#copper)" stroke-width="3"/>
  <circle cx="48" cy="48" r="20" fill="none" stroke="#3a1a0c" stroke-width="0.6"/>
  <!-- coil ring middle -->
  <circle cx="48" cy="48" r="14" fill="none" stroke="url(#copper)" stroke-width="2.5"/>
  <circle cx="48" cy="48" r="14" fill="none" stroke="#3a1a0c" stroke-width="0.5"/>
  <!-- arc traces between electrodes -->
  <g stroke="#ffe680" stroke-width="1" fill="none" opacity="0.7" stroke-linecap="round">
    <path d="M 31 31 Q 38 36 41 33"/>
    <path d="M 65 31 Q 58 36 55 33"/>
    <path d="M 31 65 Q 38 60 41 63"/>
    <path d="M 65 65 Q 58 60 55 63"/>
  </g>
  <!-- bright central spark -->
  <circle cx="48" cy="48" r="6" fill="url(#sparkCore)"/>
  <circle cx="48" cy="48" r="2.5" fill="#ffffff"/>
  <!-- outer rim glow -->
  <circle cx="48" cy="48" r="28" fill="none" stroke="#ffe680" stroke-width="0.8" opacity="0.35"/>
</svg>`;

write('towers/spark.svg', sparkSvg);
write('towers/frost.svg', frostSvg);
write('towers/arc.svg', arcSvg);

console.log('\nDone — 3 refined tower sprites written.');
