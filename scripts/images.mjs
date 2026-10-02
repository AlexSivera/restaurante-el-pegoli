// Genera las imágenes optimizadas de /assets/img a partir de /_src/img.
// Uso: npm run images   (requiere la devDependency "sharp")
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const SRC = '_src/img';
const OUT = 'assets/img';
await mkdir(OUT, { recursive: true });

// trim: las fotos de Arabitere llevan un marco blanco que hay que recortar.
// crop: [left, top, width, height] en proporción (0–1) sobre la imagen ya recortada.
const photos = [
  { src: 'roques', out: 'rotes-roques', widths: [640, 1024, 1600] },
  { src: 'arco-rotes', out: 'rotes-arco', trim: true, widths: [480, 800, 1200] },
  { src: 'final-rotes', out: 'rotes-farallones', trim: true, widths: [640, 1024, 1600] },
  { src: 'polp3', out: 'rotes-pulpo-al-sol', crop: [0.34, 0, 0.62, 1], widths: [480, 800, 1200] },
  { src: 'zona', out: 'rotes-costa', widths: [640, 1024, 1600] },
];

for (const p of photos) {
  let base = sharp(`${SRC}/${p.src}.jpg`).rotate();
  if (p.trim) {
    // Quita el marco blanco y un margen de seguridad de 1 %.
    const buf = await base.trim({ background: '#ffffff', threshold: 40 }).toBuffer();
    const m = await sharp(buf).metadata();
    const inset = Math.round(Math.min(m.width, m.height) * 0.01);
    base = sharp(buf).extract({ left: inset, top: inset, width: m.width - inset * 2, height: m.height - inset * 2 });
  }
  if (p.crop) {
    const buf = await base.toBuffer();
    const m = await sharp(buf).metadata();
    const [l, t, w, h] = p.crop;
    base = sharp(buf).extract({
      left: Math.round(m.width * l), top: Math.round(m.height * t),
      width: Math.round(m.width * w), height: Math.round(m.height * h),
    });
  }
  const master = await base.toBuffer();
  const meta = await sharp(master).metadata();
  for (const w of p.widths) {
    const width = Math.min(w, meta.width);
    const r = sharp(master).resize({ width, withoutEnlargement: true });
    await r.clone().avif({ quality: 44, effort: 5 }).toFile(`${OUT}/${p.out}-${w}.avif`);
    await r.clone().webp({ quality: 70 }).toFile(`${OUT}/${p.out}-${w}.webp`);
    await r.clone().jpeg({ quality: 72, mozjpeg: true, progressive: true }).toFile(`${OUT}/${p.out}-${w}.jpg`);
  }
  console.log(`${p.out}: ${meta.width}x${meta.height}`);
}

// Grabado de Aristeus antennatus (1902, dominio público) → tinta roja con transparencia.
// El negro del grabado pasa a ser opacidad; el color es el rojo del rótulo.
for (const [name, ink] of [['gamba-grabado', { r: 0xae, g: 0x24, b: 0x19 }], ['gamba-grabado-tiza', { r: 0xf3, g: 0xec, b: 0xdf }]]) {
  for (const w of [700, 1200]) {
    const gray = await sharp(`${SRC}/aristeus.jpg`)
      .resize({ width: w }).grayscale().linear(1.35, -40).negate().toColourspace('b-w').raw().toBuffer({ resolveWithObject: true });
    const { width, height } = gray.info;
    const color = await sharp({ create: { width, height, channels: 3, background: ink } }).raw().toBuffer();
    const rgba = Buffer.alloc(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      rgba[i * 4] = color[i * 3]; rgba[i * 4 + 1] = color[i * 3 + 1]; rgba[i * 4 + 2] = color[i * 3 + 2];
      rgba[i * 4 + 3] = gray.data[i];
    }
    const img = sharp(rgba, { raw: { width, height, channels: 4 } });
    await img.clone().png({ compressionLevel: 9, palette: true, colours: 64 }).toFile(`${OUT}/${name}-${w}.png`);
  }
  console.log(`${name}: ok`);
}

// Imagen para compartir (Open Graph) 1200x630: roca y agua de Les Rotes.
await sharp(`${SRC}/roques.jpg`).resize(1200, 630, { fit: 'cover', position: 'centre' })
  .jpeg({ quality: 80, mozjpeg: true }).toFile(`${OUT}/og-el-pegoli.jpg`);
console.log('og: ok');
