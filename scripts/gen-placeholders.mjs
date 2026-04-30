// One-shot placeholder SVG generator. Run with: node scripts/gen-placeholders.mjs
// Output is committed; re-run only when adding new categories.
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

// ── tower sprites (96×96, transparent, top-down disc with element ring + label) ──
const TOWERS = [
  { id: 'spark',    label: 'spark',    color: '#c44a3a', accent: '#ffb35a' },
  { id: 'lava',     label: 'lava',     color: '#a83020', accent: '#ff7a3a' },
  { id: 'frost',    label: 'frost',    color: '#3a8fb0', accent: '#a0e0f5' },
  { id: 'blizzard', label: 'blizzard', color: '#5a7eb0', accent: '#d0e8ff' },
  { id: 'arc',      label: 'arc',      color: '#c4a432', accent: '#ffe680' },
  { id: 'magstorm', label: 'magstorm', color: '#7a55b0', accent: '#c8a0ff' },
  { id: 'toxin',    label: 'toxin',    color: '#88a830', accent: '#d4ff80' },
  { id: 'miasma',   label: 'miasma',   color: '#4a7040', accent: '#90c478' },
];

// Towers: base disc + element-colored body. NO static barrel — Phaser draws a
// rotating barrel on top at runtime, so a static one would double up.
const towerSvg = ({ label, color, accent }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
  <defs><radialGradient id="g" cx="50%" cy="40%" r="60%">
    <stop offset="0%" stop-color="${accent}"/><stop offset="100%" stop-color="${color}"/>
  </radialGradient></defs>
  <circle cx="48" cy="52" r="34" fill="#1c2230" opacity="0.55"/>
  <circle cx="48" cy="48" r="32" fill="url(#g)" stroke="#1c2230" stroke-width="2"/>
  <circle cx="48" cy="48" r="14" fill="${accent}" opacity="0.9"/>
  <text x="48" y="89" text-anchor="middle" font-family="sans-serif" font-size="9" font-weight="bold" fill="#fff">${label}</text>
</svg>`;

for (const t of TOWERS) write(`towers/${t.id}.svg`, towerSvg(t));

// ── enemy sprites ──
const ENEMIES = [
  { id: 'normal',   size: 64, color: '#7d8594', label: 'normal'   },
  { id: 'fast',     size: 64, color: '#6fb5c4', label: 'fast'     },
  { id: 'elite',    size: 96, color: '#c26a3a', label: 'elite'    },
  { id: 'flying',   size: 64, color: '#9474c0', label: 'flying'   },
  { id: 'defender', size: 64, color: '#a04f72', label: 'defender' },
  { id: 'support',  size: 64, color: '#76b28e', label: 'support'  },
  { id: 'boss1',    size: 128, color: '#c44a3a', label: 'BOSS · 兽王' },
  { id: 'boss2',    size: 128, color: '#b8648a', label: 'BOSS · 腐主' },
  { id: 'boss3',    size: 128, color: '#7a55b0', label: 'BOSS · 女皇' },
  { id: 'boss4',    size: 128, color: '#df5e37', label: 'BOSS · 暴君' },
  { id: 'boss5',    size: 128, color: '#a872c4', label: 'BOSS · 虚空' },
];

const enemySvg = ({ size, color, label }) => {
  const r = size * 0.34;
  const cx = size / 2;
  const cy = size / 2;
  const fontSize = Math.max(8, size / 8);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="#1a1c20" stroke-width="${size > 80 ? 3 : 2}"/>
  <circle cx="${cx - r * 0.3}" cy="${cy - r * 0.15}" r="${r * 0.13}" fill="#1a1c20"/>
  <circle cx="${cx + r * 0.3}" cy="${cy - r * 0.15}" r="${r * 0.13}" fill="#1a1c20"/>
  <text x="${cx}" y="${size - 4}" text-anchor="middle" font-family="sans-serif"
        font-size="${fontSize}" font-weight="bold" fill="#fff">${label}</text>
</svg>`;
};

for (const e of ENEMIES) write(`enemies/${e.id}.svg`, enemySvg(e));

// ── chapter thumbs (480×270) and bg (1280×720) ──
const CHAPTERS = [
  { id: 'ch1_meadow',  name: 'Meadow',  top: '#3f6e4a', bot: '#1a3324' },
  { id: 'ch2_forest',  name: 'Forest',  top: '#6b4a30', bot: '#3a2918' },
  { id: 'ch3_tundra',  name: 'Tundra',  top: '#5a7eb0', bot: '#1a2a40' },
  { id: 'ch4_volcano', name: 'Volcano', top: '#8a3020', bot: '#1f0a0a' },
  { id: 'ch5_void',    name: 'Void',    top: '#5a3070', bot: '#0f0820' },
];

const chapterThumbSvg = ({ name, top, bot }) => {
  const id = `gr_${name.toLowerCase()}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 270" width="480" height="270">
  <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${top}"/><stop offset="100%" stop-color="${bot}"/></linearGradient></defs>
  <rect width="480" height="270" fill="url(#${id})"/>
  <path d="M -20 90 Q 120 60 200 130 T 380 170 L 500 170" stroke="#a0763a" stroke-width="14"
        fill="none" stroke-linecap="round" opacity="0.55"/>
  <text x="240" y="38" text-anchor="middle" font-family="sans-serif"
        font-size="22" font-weight="bold" fill="#dce3ea">Ch · ${name}</text>
  <text x="240" y="250" text-anchor="middle" font-family="sans-serif"
        font-size="10" fill="#c5d2dd" opacity="0.7">placeholder · replace with real art</text>
</svg>`;
};

const chapterBgSvg = ({ name, top, bot }) => {
  const id = `bg_${name.toLowerCase()}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${top}"/><stop offset="100%" stop-color="${bot}"/></linearGradient></defs>
  <rect width="1280" height="720" fill="url(#${id})" opacity="0.6"/>
  <text x="640" y="380" text-anchor="middle" font-family="sans-serif"
        font-size="64" font-weight="bold" fill="#dce3ea" opacity="0.18">${name}</text>
</svg>`;
};

for (const c of CHAPTERS) {
  write(`maps/${c.id}_thumb.svg`, chapterThumbSvg(c));
  write(`maps/${c.id}_bg.svg`, chapterBgSvg(c));
}

// ── element marks (24×24) ──
const MARKS = [
  { id: 'fire',    color: '#ff7a3a', label: '🔥' },
  { id: 'ice',     color: '#a0e0f5', label: '❄' },
  { id: 'thunder', color: '#ffe680', label: '⚡' },
  { id: 'poison',  color: '#90c478', label: '☠' },
];

const markSvg = ({ color, label }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
  <circle cx="12" cy="12" r="10" fill="${color}" stroke="#1c2230" stroke-width="2"/>
  <text x="12" y="17" text-anchor="middle" font-family="sans-serif" font-size="13">${label}</text>
</svg>`;

for (const m of MARKS) write(`marks/${m.id}.svg`, markSvg(m));

// ── skill icon (meteor) ──
write('skills/meteor_icon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs><radialGradient id="m" cx="40%" cy="35%" r="60%"><stop offset="0%" stop-color="#ffe6b0"/><stop offset="100%" stop-color="#c44a3a"/></radialGradient></defs>
  <circle cx="32" cy="32" r="22" fill="url(#m)" stroke="#1c2230" stroke-width="2"/>
  <path d="M 32 6 L 28 24 L 36 24 Z" fill="#ffb35a" opacity="0.7"/>
  <text x="32" y="58" text-anchor="middle" font-family="sans-serif" font-size="9" font-weight="bold" fill="#fff">meteor</text>
</svg>`);

console.log('\nDone — total written: see counts above.');
