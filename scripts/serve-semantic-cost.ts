import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { gzipSync } from 'node:zlib';

// Loopback-only production fixture. Explicit compression/cache headers make
// transfer observations reproducible, without pretending to model deployment.
const mime: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
const server = createServer(async (request, response) => {
  try {
    let path = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
    const harness = path.startsWith('/cost/');
    if (harness) path = path.slice(5);
    if (path.endsWith('/')) path += 'index.html';
    const root = resolve(harness ? 'dist/semantic-cost' : 'dist/matrix-interpretations');
    const file = resolve(root, '.' + path);
    if (!file.startsWith(root + sep)) { response.writeHead(403).end(); return; }
    const extension = extname(file);
    const raw = await readFile(file);
    const compress = /gzip/.test(request.headers['accept-encoding'] ?? '') && ['.html', '.js', '.css', '.json'].includes(extension);
    const body = compress ? gzipSync(raw) : raw;
    response.writeHead(200, { 'content-type': mime[extension] ?? 'application/octet-stream',
      'cache-control': path.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-store',
      'content-length': body.length, ...(compress ? { 'content-encoding': 'gzip', vary: 'Accept-Encoding' } : {}),
    });
    response.end(body);
  } catch { response.writeHead(404).end('Not found'); }
});
server.listen(4196, '127.0.0.1', () => console.log('Semantic-cost production fixture: http://127.0.0.1:4196'));
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => server.close());
