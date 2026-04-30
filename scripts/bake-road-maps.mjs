import fs from 'node:fs';
import zlib from 'node:zlib';

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const GRID_COLS = 25;
const GRID_ROWS = 15;

const CHAPTERS = [
  {
    id: 'ch1_meadow',
    waypoints: [[-1, 2], [7, 2], [7, 7], [18, 7], [18, 12], [25, 12]],
    road: {
      base: [102, 78, 45],
      light: [137, 112, 72],
      dark: [45, 35, 24],
      blend: [54, 72, 37],
      stone: [150, 139, 103],
    },
  },
  {
    id: 'ch2_forest',
    waypoints: [[-1, 13], [4, 13], [4, 4], [11, 4], [11, 10], [17, 10], [17, 2], [22, 2], [22, 14], [25, 14]],
    road: {
      base: [70, 49, 34],
      light: [111, 86, 57],
      dark: [32, 24, 18],
      blend: [56, 43, 27],
      stone: [123, 108, 78],
    },
  },
  {
    id: 'ch3_tundra',
    waypoints: [[25, 2], [3, 2], [3, 7], [21, 7], [21, 12], [3, 12], [3, 14], [25, 14]],
    road: {
      base: [74, 93, 104],
      light: [138, 164, 176],
      dark: [32, 47, 58],
      blend: [43, 59, 72],
      stone: [206, 222, 228],
    },
  },
  {
    id: 'ch4_volcano',
    waypoints: [[-1, 8], [5, 8], [5, 2], [12, 2], [12, 10], [18, 10], [18, 4], [22, 4], [22, 13], [25, 13]],
    road: {
      base: [54, 43, 37],
      light: [91, 67, 50],
      dark: [22, 16, 14],
      blend: [39, 32, 29],
      stone: [123, 85, 58],
    },
  },
  {
    id: 'ch5_void',
    waypoints: [[-1, 1], [23, 1], [23, 4], [2, 4], [2, 8], [23, 8], [23, 12], [2, 12], [2, 14], [25, 14]],
    road: {
      base: [38, 34, 58],
      light: [72, 61, 100],
      dark: [12, 12, 25],
      blend: [21, 26, 47],
      stone: [132, 110, 166],
    },
  },
];

function readPng(path) {
  const buf = fs.readFileSync(path);
  if (!buf.subarray(0, 8).equals(PNG_SIG)) throw new Error(`Not a PNG: ${path}`);
  let off = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];

  while (off < buf.length) {
    const len = buf.readUInt32BE(off); off += 4;
    const type = buf.subarray(off, off + 4).toString('ascii'); off += 4;
    const data = buf.subarray(off, off + len); off += len;
    off += 4;
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      if (bitDepth !== 8) throw new Error(`Unsupported bit depth: ${bitDepth}`);
      if (![2, 6].includes(colorType)) throw new Error(`Unsupported color type: ${colorType}`);
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }

  const channels = colorType === 6 ? 4 : 3;
  const stride = width * channels;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const pixels = Buffer.alloc(width * height * 4);
  let inOff = 0;
  let prev = Buffer.alloc(stride);

  for (let y = 0; y < height; y++) {
    const filter = raw[inOff++];
    const row = Buffer.from(raw.subarray(inOff, inOff + stride));
    inOff += stride;
    unfilter(row, prev, channels, filter);
    for (let x = 0; x < width; x++) {
      const si = x * channels;
      const di = (y * width + x) * 4;
      pixels[di] = row[si];
      pixels[di + 1] = row[si + 1];
      pixels[di + 2] = row[si + 2];
      pixels[di + 3] = channels === 4 ? row[si + 3] : 255;
    }
    prev = row;
  }
  return { width, height, pixels };
}

function unfilter(row, prev, bpp, filter) {
  for (let i = 0; i < row.length; i++) {
    const left = i >= bpp ? row[i - bpp] : 0;
    const up = prev[i] ?? 0;
    const upLeft = i >= bpp ? prev[i - bpp] : 0;
    let add = 0;
    if (filter === 1) add = left;
    else if (filter === 2) add = up;
    else if (filter === 3) add = Math.floor((left + up) / 2);
    else if (filter === 4) add = paeth(left, up, upLeft);
    else if (filter !== 0) throw new Error(`Unsupported PNG filter: ${filter}`);
    row[i] = (row[i] + add) & 255;
  }
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function writePng(path, width, height, pixels) {
  const scan = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowOff = y * (width * 4 + 1);
    scan[rowOff] = 0;
    pixels.copy(scan, rowOff + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const chunks = [
    PNG_SIG,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(scan, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ];
  fs.writeFileSync(path, Buffer.concat(chunks));
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  typeBuf.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 8 + data.length);
  return out;
}

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function bake(chapter) {
  const input = `assets/maps/${chapter.id}_bg.png`;
  const output = `assets/maps/${chapter.id}_bg_roads.png`;
  const img = readPng(input);
  const points = chapter.waypoints.map(([gx, gy]) => ({
    x: (gx + 0.5) * img.width / GRID_COLS,
    y: (gy + 0.5) * img.height / GRID_ROWS,
  }));
  const cell = Math.min(img.width / GRID_COLS, img.height / GRID_ROWS);
  const rand = seededRandom(chapter.id);

  const segments = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    const len = Math.sqrt(lenSq);
    if (len > 0) segments.push({ a, b, dx, dy, lenSq, len, nx: -dy / len, ny: dx / len });
  }

  const out = Buffer.from(img.pixels);
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const nearest = nearestPath(x, y, segments);
      const wobble = valueNoise(x * 0.018, y * 0.018, chapter.id);
      const fine = valueNoise(x * 0.085 + 31, y * 0.085 - 19, chapter.id);
      const half = cell * (0.66 + wobble * 0.18);
      const shoulder = cell * (0.30 + fine * 0.10);
      const d = nearest.dist;
      const idx = (y * img.width + x) * 4;

      if (d < half + shoulder) {
        const old = [out[idx], out[idx + 1], out[idx + 2]];
        let color = chapter.road.base;
        let alpha = 0.0;

        if (d < half) {
          const center = 1 - d / half;
          const grit = valueNoise(x * 0.19, y * 0.19, chapter.id);
          color = mix(chapter.road.base, chapter.road.light, Math.max(0, center - 0.58) * 0.46 + grit * 0.10);
          color = mix(color, old, 0.10 + grit * 0.12);
          alpha = 0.62 + center * 0.16;
        } else {
          const t = 1 - (d - half) / shoulder;
          color = mix(chapter.road.blend, old, 0.18 + (1 - t) * 0.22);
          alpha = smoothstep(t) * 0.44;
        }

        if (fine > 0.74 && d < half * 0.88) {
          color = mix(color, chapter.road.stone, 0.25);
          alpha = Math.min(0.82, alpha + 0.05);
        }

        const next = mix(old, color, alpha);
        out[idx] = next[0];
        out[idx + 1] = next[1];
        out[idx + 2] = next[2];
      }
    }
  }

  // Stamp larger edge chips after the base pass so the shoulder has natural
  // clumps instead of a mathematically perfect boundary.
  const samples = samplePath(segments, cell * 0.5);
  for (const s of samples) {
    if (rand() > 0.72) continue;
    const side = rand() < 0.5 ? -1 : 1;
    const radius = cell * (0.05 + rand() * 0.12);
    const dist = cell * (0.62 + rand() * 0.30);
    stamp(out, img.width, img.height, s.x + s.nx * side * dist, s.y + s.ny * side * dist, radius, chapter.road.blend, 0.18 + rand() * 0.18);
  }

  writePng(output, img.width, img.height, out);
  console.log(output);
}

function nearestPath(x, y, segments) {
  let best = { dist: Infinity, side: 0 };
  for (const s of segments) {
    const t = Math.max(0, Math.min(1, ((x - s.a.x) * s.dx + (y - s.a.y) * s.dy) / s.lenSq));
    const px = s.a.x + s.dx * t;
    const py = s.a.y + s.dy * t;
    const vx = x - px;
    const vy = y - py;
    const dist = Math.hypot(vx, vy);
    if (dist < best.dist) {
      best = { dist, side: vx * s.nx + vy * s.ny };
    }
  }
  return best;
}

function samplePath(segments, step) {
  const out = [];
  for (const s of segments) {
    const n = Math.max(1, Math.floor(s.len / step));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      out.push({ x: s.a.x + s.dx * t, y: s.a.y + s.dy * t, nx: s.nx, ny: s.ny });
    }
  }
  return out;
}

function stamp(pixels, width, height, cx, cy, radius, color, alpha) {
  const x0 = Math.max(0, Math.floor(cx - radius));
  const x1 = Math.min(width - 1, Math.ceil(cx + radius));
  const y0 = Math.max(0, Math.floor(cy - radius));
  const y1 = Math.min(height - 1, Math.ceil(cy + radius));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const d = Math.hypot(x - cx, y - cy) / radius;
      if (d > 1) continue;
      const a = alpha * (1 - smoothstep(d));
      const idx = (y * width + x) * 4;
      const next = mix([pixels[idx], pixels[idx + 1], pixels[idx + 2]], color, a);
      pixels[idx] = next[0];
      pixels[idx + 1] = next[1];
      pixels[idx + 2] = next[2];
    }
  }
}

function mix(a, b, t) {
  const k = Math.max(0, Math.min(1, t));
  return [
    Math.round(a[0] + (b[0] - a[0]) * k),
    Math.round(a[1] + (b[1] - a[1]) * k),
    Math.round(a[2] + (b[2] - a[2]) * k),
  ];
}

function smoothstep(v) {
  const x = Math.max(0, Math.min(1, v));
  return x * x * (3 - 2 * x);
}

function valueNoise(x, y, seedText) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const tx = x - xi;
  const ty = y - yi;
  const a = hash2(xi, yi, seedText);
  const b = hash2(xi + 1, yi, seedText);
  const c = hash2(xi, yi + 1, seedText);
  const d = hash2(xi + 1, yi + 1, seedText);
  const sx = smoothstep(tx);
  const sy = smoothstep(ty);
  return lerp(lerp(a, b, sx), lerp(c, d, sx), sy);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function hash2(x, y, seedText) {
  let h = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    h ^= seedText.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= Math.imul(x, 374761393);
  h ^= Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function seededRandom(seedText) {
  let seed = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    seed ^= seedText.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  return () => {
    seed += 0x6d2b79f5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

for (const chapter of CHAPTERS) bake(chapter);
