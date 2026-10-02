// Fija la URL pública del sitio: URLs SEO absolutas, <base> del 404, sitemap.xml y robots.txt.
// Uso:
//   node scripts/set-domain.mjs https://www.ejemplo.es              → dominio definitivo (indexable)
//   node scripts/set-domain.mjs https://usuario.github.io/repo --preview
//       → vista previa: noindex + robots Disallow, para que la demo no compita en Google
// Se puede repetir: la URL anterior se guarda en package.json ("siteUrl") y se sustituye.
import { readFile, writeFile } from 'node:fs/promises';

const args = process.argv.slice(2);
const preview = args.includes('--preview');
const site = (args.find((a) => !a.startsWith('--')) || '').replace(/\/$/, '');
if (!/^https:\/\/[^/\s]+(\/[^\s]*)?$/.test(site)) {
  console.error('Indica la URL con https:// y sin barra final. Ej.: node scripts/set-domain.mjs https://www.ejemplo.es [--preview]');
  process.exit(1);
}
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const anterior = pkg.siteUrl || '';
const prefijo = esc(anterior);

const pages = [['index.html', '/'], ['en/index.html', '/en/']];
const NOINDEX = '<meta name="robots" content="noindex, nofollow">';
for (const [file] of pages) {
  let html = await readFile(file, 'utf8');
  html = html
    .replace(new RegExp(`(<link rel="(?:canonical|alternate)"[^>]*href=")${prefijo}(/[^"]*)"`, 'g'), `$1${site}$2"`)
    .replace(new RegExp(`(<meta property="og:image" content=")${prefijo}(/[^"]*)"`, 'g'), `$1${site}$2"`)
    .replace(new RegExp(`("(?:@id|url|image)": ")${prefijo}(/[^"]*)"`, 'g'), `$1${site}$2"`);
  html = html.replace(`\n  ${NOINDEX}`, '');
  if (preview) html = html.replace('<meta name="theme-color"', `${NOINDEX}\n  <meta name="theme-color"`);
  await writeFile(file, html);
}

// 404.html se sirve en cualquier ruta: su <base> apunta a la raíz del sitio publicado.
const ruta = new URL(site).pathname.replace(/\/?$/, '/');
let e404 = await readFile('404.html', 'utf8');
e404 = e404.replace(/<base href="[^"]*">/, `<base href="${ruta}">`);
await writeFile('404.html', e404);

const today = new Date().toISOString().slice(0, 10);
const urls = pages.map(([, p]) => `  <url>
    <loc>${site}${p}</loc>
    <lastmod>${today}</lastmod>
    <xhtml:link rel="alternate" hreflang="es" href="${site}/"/>
    <xhtml:link rel="alternate" hreflang="en" href="${site}/en/"/>
  </url>`).join('\n');
await writeFile('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`);
await writeFile('robots.txt', preview
  ? `# Vista previa: no indexar hasta publicar en el dominio definitivo.\nUser-agent: *\nDisallow: /\n`
  : `User-agent: *\nAllow: /\nSitemap: ${site}/sitemap.xml\n`);

pkg.siteUrl = site;
await writeFile('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log(`Sitio: ${site}${preview ? ' (vista previa, noindex)' : ''}. SEO, 404, sitemap.xml y robots.txt actualizados.`);
