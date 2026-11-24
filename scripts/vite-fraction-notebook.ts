import type { Plugin } from 'vite';
import { readFile } from 'node:fs/promises';
import type { compileFractionNotebook, fractionPreviewPage } from '../src/fraction-notebook/compile.ts';

/** Development-only, read-only compilation; no authored paths or modules are
 * accepted, and no request can publish or overwrite a lesson. */
export function kpViteFractionNotebook(): Plugin {
  return { name: 'kp-fraction-notebook', apply: 'serve', configureServer(server) {
    server.middlewares.use((request, response, next) => {
      const path = request.url?.split('?')[0];
      if (path !== '/api/dev/fraction-notebook' && path !== '/reader/fraction-notebook-preview/') return next();
      void (async () => {
        const json = (status: number, data: unknown) => response.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' }).end(JSON.stringify(data));
        try {
          const preview = path === '/reader/fraction-notebook-preview/';
          if (request.method !== (preview ? 'GET' : 'POST')) { json(405, { error: 'Unsupported method.' }); return; }
          const origin = `${server.config.server.https ? 'https' : 'http'}://${request.headers.host}`;
          if (!preview && (request.headers['content-type'] !== 'application/json' || request.headers.origin !== origin)) {
            json(403, { error: 'Use the same-origin notebook editor.' }); return;
          }
          const canonical = await readFile(new URL('../content/authoring/algebra/fractional-linear-reasoning.article.md', import.meta.url), 'utf8');
          const module = await server.ssrLoadModule('/src/fraction-notebook/compile.ts') as {
            compileFractionNotebook: typeof compileFractionNotebook; fractionPreviewPage: typeof fractionPreviewPage };
          if (preview) {
            const html = await server.transformIndexHtml(request.url!, module.fractionPreviewPage(canonical));
            response.writeHead(200, { 'content-type': 'text/html', 'cache-control': 'no-store' }).end(html); return;
          }
          let bytes = 0; const chunks: Buffer[] = [];
          for await (const chunk of request) { const buffer = Buffer.from(chunk); bytes += buffer.length; if (bytes > 300000) { json(413, { error: 'Notebook exceeds the preview limit.' }); return; } chunks.push(buffer); }
          json(200, module.compileFractionNotebook(JSON.parse(Buffer.concat(chunks).toString('utf8')), canonical));
        } catch (error) { json(422, { error: error instanceof Error ? error.message : String(error) }); }
      })();
    });
  } };
}
