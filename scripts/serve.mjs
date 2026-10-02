// Servidor estático mínimo para desarrollo: node scripts/serve.mjs [puerto]
// Se comporta como GitHub Pages en lo que importa: /carpeta → /carpeta/ y 404.html para lo que no existe.
// Si package.json tiene "siteUrl" con ruta (p. ej. https://usuario.github.io/repo), también sirve bajo /repo/.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const PORT = Number(process.argv[2] || process.env.PORT || 4173);
const ROOT = process.cwd();
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
  '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json',
};
const PRIVADO = /[\\/](_src|node_modules|docs|scripts|\.git|\.claude)([\\/]|$)/;

const pkg = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8'));
const base = pkg.siteUrl ? new URL(pkg.siteUrl).pathname.replace(/\/?$/, '/') : '/';

createServer(async (req, res) => {
  let url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (base !== '/' && (url + '/').startsWith(base)) url = '/' + url.slice(base.length);
  const file = normalize(join(ROOT, url));
  if (!file.startsWith(ROOT) || PRIVADO.test(file.slice(ROOT.length))) { res.writeHead(403).end(); return; }
  try {
    let f = file;
    if ((await stat(f)).isDirectory()) {
      if (!req.url.split('?')[0].endsWith('/')) { res.writeHead(301, { Location: req.url.split('?')[0] + '/' }).end(); return; }
      f = join(f, 'index.html');
    }
    const body = await readFile(f);
    res.writeHead(200, { 'Content-Type': TYPES[extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(body);
  } catch {
    const body = await readFile(join(ROOT, '404.html')).catch(() => 'No encontrado');
    res.writeHead(404, { 'Content-Type': TYPES['.html'], 'Cache-Control': 'no-store' }).end(body);
  }
}).listen(PORT, () => console.log(`El Pegolí en http://localhost:${PORT}${base}`));
