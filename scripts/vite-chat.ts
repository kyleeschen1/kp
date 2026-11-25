import type { Plugin } from 'vite';
import { resolve, posix } from 'node:path';
import { ChatService } from '../server/chat/service.ts';
import { FileChatStore } from '../server/chat/store.ts';
import { CodexTransport } from '../server/chat/transport.ts';
import { chatHttp } from '../server/chat/http.ts';

export function kpViteChat(root: string): Plugin {
  let service: ChatService | undefined;
  return { name: 'kp-persistent-chat', apply: 'serve',
  configResolved(config) { config.server.fs.deny.push('**/.kp/chat/**'); },
  async closeBundle() { await service?.close(); },
  configureServer(server) {
    // Private recovery is not a watched source asset: saving a draft must never
    // reload the editor or appear through Vite's static file server.
    const directory = resolve(root, '.kp/chat'); server.watcher.unwatch([directory, `${directory}/**`]);
    const executable = process.env['KP_CODEX_EXECUTABLE'] ?? '/opt/homebrew/bin/codex';
    const owner = new ChatService(new FileChatStore(directory), callbacks => new CodexTransport(executable, root, callbacks), root);
    service = owner;
    const handle = chatHttp(owner);
    server.middlewares.use((request, response, next) => {
      let path = request.url?.split('?')[0] ?? '';
      try { path = posix.normalize(decodeURIComponent(path).replaceAll('\\', '/')); }
      catch { response.writeHead(400).end('Invalid URL.'); return; }
      if (path === '/api/dev/chat') { void handle(request, response); return; }
      if (path.toLowerCase().includes('/.kp/chat')) { response.writeHead(403).end('Private chat storage.'); return; }
      next();
    });
    const close = () => { void owner.close(); };
    server.httpServer?.once('close', close);
    server.watcher.on('close', close);
  } };
}
