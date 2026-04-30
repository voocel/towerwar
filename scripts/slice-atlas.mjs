import fs from 'node:fs';
import zlib from 'node:zlib';

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

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
    off += 4; // crc

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
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

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

function cropResize(src, sx, sy, sw, sh, size, key) {
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    const py = Math.min(src.height - 1, Math.floor(sy + (y + 0.5) * sh / size));
    for (let x = 0; x < size; x++) {
      const px = Math.min(src.width - 1, Math.floor(sx + (x + 0.5) * sw / size));
      const si = (py * src.width + px) * 4;
      const di = (y * size + x) * 4;
      const r = src.pixels[si];
      const g = src.pixels[si + 1];
      const b = src.pixels[si + 2];
      const a = src.pixels[si + 3];
      const dist = Math.max(Math.abs(r - key[0]), Math.abs(g - key[1]), Math.abs(b - key[2]));
      const keyDominance = key[0] > 200 && key[2] > 200 && r > 180 && b > 180 && g < 90;
      const alpha = dist < 38 || keyDominance ? 0 : a;
      out[di] = r;
      out[di + 1] = g;
      out[di + 2] = b;
      out[di + 3] = alpha;
    }
  }
  return out;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) args[argv[i].replace(/^--/, '')] = argv[i + 1];
  return args;
}

const args = parseArgs(process.argv.slice(2));
const names = args.names.split(',');
const cols = Number(args.cols);
const rows = Number(args.rows);
const size = Number(args.size ?? 96);
const key = (args.key ?? 'ff00ff').match(/[0-9a-f]{2}/gi).map(v => parseInt(v, 16));
const src = readPng(args.input);
fs.mkdirSync(args.outDir, { recursive: true });

const cellW = src.width / cols;
const cellH = src.height / rows;
for (let i = 0; i < names.length; i++) {
  const col = i % cols;
  const row = Math.floor(i / cols);
  const img = cropResize(src, col * cellW, row * cellH, cellW, cellH, size, key);
  const outPath = `${args.outDir}/${names[i]}.png`;
  fs.mkdirSync(outPath.split('/').slice(0, -1).join('/'), { recursive: true });
  writePng(outPath, size, size, img);
}
