import type { IncomingMessage, ServerResponse } from 'node:http';
import { readChatAction } from '../../src/editor-chat/protocol.ts';
import { ChatConflict, type ChatService } from './service.ts';

/** Local-only capability boundary, independent of the editor UI. JSON POSTs
 * require both browser origin and an unreadable-cross-origin process token. */
export function chatHttp(service: ChatService) {
  return async (request: IncomingMessage, response: ServerResponse) => {
    const json = (status: number, value: unknown) => { response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); response.end(JSON.stringify(value)); };
    try {
      const host = request.headers.host ?? '';
      if (!/^(127\.0\.0\.1|localhost|\[::1\]):\d+$/.test(host)) { json(403, { error: 'Chat is available only on the local editor server.' }); return; }
      if (request.headers['sec-fetch-site'] === 'cross-site') { json(403, { error: 'Open Chat in the local KP editor.' }); return; }
      if (request.method === 'GET') {
        if (request.headers['if-none-match'] === service.etag) { response.writeHead(304, { 'Cache-Control': 'no-store' }).end(); return; }
        const snapshot = await service.snapshot(); response.setHeader('ETag', service.etag); json(200, snapshot); return;
      }
      if (request.method !== 'POST') { json(405, { error: 'Unsupported chat method.' }); return; }
      if (request.headers.origin !== `http://${host}` || request.headers['content-type'] !== 'application/json') { json(403, { error: 'Use the same-origin KP editor.' }); return; }
      const before = await service.snapshot();
      if (request.headers['x-kp-chat-token'] !== before.token) { json(403, { error: 'Chat server changed. Reconnect the panel before sending; your draft is retained.' }); return; }
      const chunks: Buffer[] = []; let bytes = 0;
      for await (const chunk of request) { const buffer = Buffer.from(chunk); bytes += buffer.length; if (bytes > 262144) { json(413, { error: 'Chat request is too large.' }); return; } chunks.push(buffer); }
      const action = readChatAction(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      json(200, await service.action(action));
    } catch (error) { json(error instanceof ChatConflict ? 409 : 422, { error: error instanceof Error ? error.message : String(error) }); }
  };
}
