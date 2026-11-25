import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { record, text } from '../../src/editor-chat/protocol.ts';

export interface ChatTransport {
  request(method: string, params: object): Promise<unknown>;
  notify(method: string, params: object): void;
  close(): void;
}
export type TransportCallbacks = { event: (method: string, params: unknown) => void; lost: (reason: string) => void };
export type TransportFactory = (callbacks: TransportCallbacks) => ChatTransport;
export class RpcRejection extends Error {}

/** Port of the workbench's bounded JSONL/process ownership rules. Only this
 * server-side adapter chooses the executable; browser requests cannot spawn it. */
export class CodexTransport implements ChatTransport {
  private child: ChildProcessWithoutNullStreams;
  private pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  private nextId = 0;
  private bytes: Buffer = Buffer.alloc(0);
  private diagnostics = '';
  private ended = false;
  private callbacks: TransportCallbacks;
  constructor(executable: string, cwd: string, callbacks: TransportCallbacks, args = ['app-server']) {
    this.callbacks = callbacks;
    this.child = spawn(executable, args, { cwd, stdio: ['pipe', 'pipe', 'pipe'], detached: process.platform !== 'win32' });
    this.child.on('error', error => this.fail(error.message));
    this.child.stdin.on('error', error => this.fail(error.message));
    this.child.stderr.on('data', (chunk: Buffer) => { this.diagnostics = (this.diagnostics + chunk.toString()).slice(-4000); });
    this.child.stdout.on('data', (chunk: Buffer) => this.receive(chunk));
    // Node emits close after stdout drains: a fast exit must not discard its final reply.
    this.child.on('close', code => this.fail(`Codex connection closed (${code ?? 'signal'}). ${this.diagnostics}`));
  }
  request(method: string, params: object): Promise<unknown> {
    if (this.ended) return Promise.reject(new Error('Codex is disconnected.'));
    if (this.pending.size >= 16) return Promise.reject(new Error('Too many pending Codex requests.'));
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`Codex ${method} acknowledgement timed out. Delivery may be uncertain.`)); }, 30000);
      this.pending.set(id, { resolve, reject, timer });
      try { this.write({ id, method, params }); } catch (error) { clearTimeout(timer); this.pending.delete(id); reject(error); }
    });
  }
  notify(method: string, params: object) { this.write({ method, params }); }
  private write(value: object) {
    if (this.ended) throw new Error('Codex is disconnected.');
    const line = JSON.stringify(value) + '\n';
    if (Buffer.byteLength(line) > 262144 || this.child.stdin.writableLength > 524288) throw new Error('Codex input queue is full.');
    this.child.stdin.write(line);
  }
  private receive(chunk: Buffer) {
    if (this.ended) return;
    this.bytes = Buffer.concat([this.bytes, chunk]);
    if (this.bytes.length > 16 * 1024 * 1024) { this.fail('Codex output exceeded the bounded frame limit.'); return; }
    let end: number;
    while ((end = this.bytes.indexOf(10)) !== -1) {
      const line = this.bytes.subarray(0, end); this.bytes = this.bytes.subarray(end + 1);
      if (!line.length) continue;
      try {
        const message = record(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(line)));
        if (typeof message['method'] === 'string') {
          if (message['id'] !== undefined) {
            // Discussion mode cannot silently approve native effects or unknown requests.
            this.write({ id: message['id'], error: { code: -32601, message: 'KP chat does not authorize this server request.' } });
            this.callbacks.event('kp/unsupportedRequest', { method: message['method'] });
          } else this.callbacks.event(message['method'], message['params']);
        } else if (typeof message['id'] === 'number') {
          const waiting = this.pending.get(message['id']); if (!waiting) continue;
          clearTimeout(waiting.timer); this.pending.delete(message['id']);
          if (message['error']) {
            const error = record(message['error']); waiting.reject(new RpcRejection(text(error['message'], 32768)));
          } else waiting.resolve(message['result']);
        }
      } catch (error) { this.fail(`Invalid Codex protocol: ${String(error)}`); return; }
    }
  }
  private fail(reason: string) {
    if (this.ended) return;
    this.close(); this.callbacks.lost(reason);
  }
  close() {
    if (this.ended) return; this.ended = true;
    for (const waiting of this.pending.values()) { clearTimeout(waiting.timer); waiting.reject(new Error('Codex disconnected; request delivery may be uncertain.')); }
    this.pending.clear(); this.child.stdin.end();
    const child = this.child;
    const stop = (signal: NodeJS.Signals) => {
      if (!child.pid) return;
      try { if (process.platform !== 'win32') process.kill(-child.pid, signal); else child.kill(signal); } catch { /* Already reaped. */ }
    };
    stop('SIGTERM');
    const timer = setTimeout(() => stop('SIGKILL'), 1000); timer.unref();
    child.once('close', () => clearTimeout(timer));
  }
}
