// Central color palette.
// Aesthetic: cool neutral ink base with semantic, multi-hue accents.
// Principles:
//   1. Background is cool neutral (not warm brown) so warm elements pop.
//   2. Accents are split by role (currency gold, information teal, reward rose,
//      positive mint, danger rust). No more "gold on everything".
//   3. Elements sit at ~65% saturation with distinct hue families so they
//      read instantly without fighting each other.
//   4. One family per element (fire=warm red-orange, ice=cool sky, thunder=amber,
//      poison=moss), with a brighter 'accent' variant for the heavier tower
//      of that element and a dark 'base' for its hex plate.

export const PALETTE = {
  // ── Backgrounds (cool-neutral ink, slight blue bias — not brown) ──
  bg0: '#0a0c10',       // deepest — outer vignette
  bg1: '#12151b',       // base fill
  bg2: '#1b1f26',       // panel
  bg3: '#262b34',       // panel interior
  bg4: '#343b47',       // hover / selected

  // ── Text (cool neutral) ──
  textBright: '#e4e8ef',  // cool ivory
  text:       '#adb4c1',  // soft blue-gray
  textDim:    '#6c7484',  // muted
  textFaint:  '#3d4553',  // most dim

  // ── Accents (DIVERSIFIED by function — no more single brass everywhere) ──
  accent:      '#d4a445',  // warm gold — RESERVED for currency only
  accentHot:   '#efc163',  // brighter gold — jackpot / big reward
  accentCool:  '#5eb0c5',  // teal — information, selection rings, arrows
  accentRose:  '#e38266',  // rose-gold — wave highlights, BOSS aura
  accentMint:  '#7ac49a',  // mint — positive / success / HP full

  // ── Semantic ──
  danger:   '#c44a3a',  // brick red
  positive: '#7ac49a',

  // ── Elements (~65% saturation, distinct hue families) ──
  fire:         '#df5e37',  // coral red
  fireAccent:   '#f08a5a',  // lighter ember
  fireDark:     '#3e1408',
  fireGlow:     '#ffd7b5',

  ice:          '#5fa8d4',  // sky blue
  iceAccent:    '#82c1e6',  // frost
  iceDark:      '#0e2430',
  iceGlow:      '#d4ecf8',

  thunder:      '#e6b43d',  // amber
  thunderAccent:'#f3cc68',
  thunderDark:  '#3a2a10',
  thunderGlow:  '#fff0c0',

  poison:       '#80b058',  // vivid moss
  poisonAccent: '#a3c472',  // pale moss
  poisonDark:   '#1a2410',
  poisonGlow:   '#d4e0a8',

  // ── Play-field: grass + dirt road ──
  grassBase:  '#2f4226',   // main meadow green (deep, yellow-leaning)
  grassLight: '#3e5230',   // lighter patches (sunlit)
  grassDark:  '#1f2c17',   // shadow patches
  grassBlade: '#576e3a',   // blade-tuft color
  grassFlower: '#d4b85c',  // rare flower speck (warm yellow)

  pathDirt:      '#7a5c32',   // warm earth
  pathDirtLight: '#a48147',   // dusty sand highlight
  pathDirtDark:  '#4a3620',   // shadow edge
  pathRut:       '#8e6d3d',   // wheel-track lighter

  // ── Path (legacy names kept for existing references) ──
  pathBase:   '#7a5c32',
  pathTop:    '#8e6d3d',
  pathEdge:   '#4a3620',
  pathCenter: '#a48147',
  pathArrow:  'rgba(232,220,180,0.38)',   // warm ivory travel hint
  spawnMark:  '#5fb3c4',                  // bright cyan (reads on green)
  exitMark:   '#c44a3a',                  // brick red

  // ── HP bar ──
  hpHigh: '#7ac49a',
  hpMid:  '#e6b43d',
  hpLow:  '#c44a3a',

  // ── UI buttons (distinct hues per function) ──
  btnUpgrade:     '#3e6a82',  // teal steel
  btnUpgradeHot:  '#568aa3',
  btnSell:        '#8a3f2f',  // rust
  btnSellHot:     '#a8554a',
  btnStart:       '#5c8744',  // fresh olive
  btnStartHot:    '#78a25c',
  btnVoucher:     '#6d4e8a',  // dusk violet
  btnDisabled:    '#252a33',

  // ── Reactions ──
  steamColor:     '#c6d3de',  // misty slate
  overloadColor:  '#f0a048',  // flare amber
  detonateColor:  '#e05a3a',  // sulfur orange
  frostarcColor:  '#a8c8e0',  // arctic
  toxiciceColor:  '#7fa686',  // sea-foam
  plagueColor:    '#b0a840',  // bile gold

  // ── Grid/lines ──
  gridDot:  'rgba(228,233,239,0.045)',
  divider:  '#2a303a',
  scroll:   '#4a5362',
} as const;

export function withAlpha(hex: string, a: number): string {
  if (hex.startsWith('rgba')) return hex;
  if (hex.length === 7) {
    const ai = Math.round(Math.max(0, Math.min(1, a)) * 255);
    return hex + ai.toString(16).padStart(2, '0');
  }
  return hex;
}

/** Look up the hover/hot variant of a known button color, fall back to bg4. */
export function brighten(hex: string): string {
  const map: Record<string, string> = {
    [PALETTE.btnStart]:   PALETTE.btnStartHot,
    [PALETTE.btnUpgrade]: PALETTE.btnUpgradeHot,
    [PALETTE.btnSell]:    PALETTE.btnSellHot,
  };
  return map[hex] ?? PALETTE.bg4;
}

