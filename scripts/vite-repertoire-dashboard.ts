import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { compileRepertoire } from './repertoire-dashboard.ts';

export function kpViteRepertoireDashboard(projectRoot: string): Plugin {
  const directory = resolve(projectRoot, 'docs/project/repertoire');
  return {
    name: 'kp-repertoire-dashboard',
    transformIndexHtml(html, context) {
      if (context.filename !== resolve(projectRoot, 'experiments/repertoire/index.html')) return html;
      return html.replace('<!-- kp:repertoire -->', compileRepertoire(projectRoot).html);
    },
    configureServer(server) {
      server.watcher.add(directory);
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/experiments/repertoire/evidence/')) return next();
        try {
          const path = decodeURIComponent(req.url.split('?')[0]!).slice(1);
          const text = compileRepertoire(projectRoot).assets.get(path);
          if (text === undefined) { res.statusCode = 404; res.end('Evidence not found'); return; }
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.end(text);
        } catch (error) { next(error); }
      });
    },
    handleHotUpdate(context) {
      if (context.file.startsWith(directory + '/')) context.server.ws.send({ type: 'full-reload', path: '/experiments/repertoire/' });
    },
    generateBundle() {
      for (const [fileName, source] of compileRepertoire(projectRoot).assets) this.emitFile({ type: 'asset', fileName, source });
    }
  };
}
