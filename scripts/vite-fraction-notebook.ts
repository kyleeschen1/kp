import type { Plugin } from 'vite';
import { readFile } from 'node:fs/promises';
import type { compileFractionNotebook, fractionPreviewPage } from '../src/fraction-notebook/compile.ts';
import type * as ObjectCompiler from '../src/fraction-notebook/object-compile.ts';
import { notebookThemeBootstrap } from './notebook-theme-bootstrap.ts';

/** Development-only, read-only compilation; no authored paths or modules are
 * accepted, and no request can publish or overwrite a lesson. */
export function kpViteFractionNotebook(): Plugin {
  const theme = notebookThemeBootstrap();
  return { name: 'kp-fraction-notebook', apply: 'serve',
    transformIndexHtml: { order: 'post', handler(html, context) {
      const path = context.path.split('?')[0];
      return path === '/experiments/fraction-notebook/' || path === '/experiments/fraction-notebook/index.html'
        || path === '/experiments/fraction-notebook/math-preview.html'
        || path === '/reader/fraction-notebook-preview/' ? theme.inject(html) : html;
    } },
    handleHotUpdate(context) {
      if (/\/fraction-notebook\/(styles|style-catalog|theme-startup|palette)\.(ts|css)$/.test(context.file)) theme.invalidate();
    },
    configureServer(server) {
    server.middlewares.use((request, response, next) => {
      const path = request.url?.split('?')[0];
      if (path !== '/api/dev/fraction-notebook' && path !== '/api/dev/fraction-object' && path !== '/reader/fraction-notebook-preview/') return next();
      void (async () => {
        const json = (status: number, data: unknown) => response.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' }).end(JSON.stringify(data));
        try {
          const preview = path === '/reader/fraction-notebook-preview/';
          const object = path === '/api/dev/fraction-object';
          const describe = object && request.method === 'GET';
          if (!describe && request.method !== (preview ? 'GET' : 'POST')) { json(405, { error: 'Unsupported method.' }); return; }
          const origin = `${server.config.server.https ? 'https' : 'http'}://${request.headers.host}`;
          if (!preview && !describe && (request.headers['content-type'] !== 'application/json' || request.headers.origin !== origin)) {
            json(403, { error: 'Use the same-origin notebook editor.' }); return;
          }
          const canonical = await readFile(new URL('../content/authoring/algebra/fractional-linear-reasoning.article.md', import.meta.url), 'utf8');
          const objectCompiler = object ? await server.ssrLoadModule('/src/fraction-notebook/object-compile.ts') as typeof ObjectCompiler : undefined;
          if (describe && objectCompiler) { json(200, objectCompiler.fractionObject(canonical)); return; }
          const module = await server.ssrLoadModule('/src/fraction-notebook/compile.ts') as {
            compileFractionNotebook: typeof compileFractionNotebook; fractionPreviewPage: typeof fractionPreviewPage };
          if (preview) {
            const html = await server.transformIndexHtml(request.url!, module.fractionPreviewPage(canonical));
            response.writeHead(200, { 'content-type': 'text/html', 'cache-control': 'no-store' }).end(html); return;
          }
          let bytes = 0; const chunks: Buffer[] = [];
          for await (const chunk of request) { const buffer = Buffer.from(chunk); bytes += buffer.length; if (bytes > 300000) { json(413, { error: 'Notebook exceeds the preview limit.' }); return; } chunks.push(buffer); }
          const value: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          json(200, objectCompiler ? objectCompiler.previewFractionObject(value, canonical) : module.compileFractionNotebook(value, canonical));
        } catch (error) { json(422, { error: error instanceof Error ? error.message : String(error) }); }
      })();
    });
  } };
}
