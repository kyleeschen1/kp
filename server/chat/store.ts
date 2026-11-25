import { mkdir, readFile, open, rename, unlink, realpath, lstat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { emptyChat, readChatRecord, type ChatRecord } from '../../src/editor-chat/protocol.ts';

export interface ChatStore { load(): Promise<ChatRecord>; save(value: ChatRecord): Promise<void>; close(): Promise<void> }
const missing = (error: unknown) => error instanceof Error && 'code' in error && error.code === 'ENOENT';
/** One live local service owns recovery. Atomic replacement plus an expected
 * byte check preserves manually changed/corrupt records instead of overwriting. */
export class FileChatStore implements ChatStore {
  private directory: string;
  private previous: string | null = null;
  private lock: string | undefined;
  private closing: Promise<void> | undefined;
  constructor(directory: string) { this.directory = resolve(directory); }
  private async regular(path: string) {
    try { if (!(await lstat(path)).isFile()) throw new Error('Chat recovery must use regular files. Original preserved.'); }
    catch (error) { if (!missing(error)) throw error; }
  }
  private async raw() {
    await this.regular(join(this.directory, 'conversation.json'));
    try { const bytes = await readFile(join(this.directory, 'conversation.json')); if (bytes.length > 8 * 1024 * 1024) throw new Error('Chat recovery file is oversized. Original preserved.'); return bytes.toString('utf8'); }
    catch (error) { if (missing(error)) return null; throw error; }
  }
  async load() {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    if (await realpath(this.directory) !== this.directory) throw new Error('Chat storage cannot be redirected through a symlink.');
    const path = join(this.directory, 'owner.json');
    await this.regular(path);
    try {
      const owner = JSON.parse(await readFile(path, 'utf8'));
      if (!Number.isSafeInteger(owner.pid) || owner.pid < 1) throw new Error('Invalid chat owner. Preserve and inspect owner.json.');
      let alive = true;
      try { process.kill(owner.pid, 0); } catch (error) { if (error instanceof Error && 'code' in error && error.code === 'ESRCH') alive = false; else throw error; }
      if (alive) throw new Error('Another local server owns this conversation. Use its editor or stop that server first.');
      await unlink(path);
    } catch (error) { if (!missing(error)) throw error; }
    const lock = JSON.stringify({ pid: process.pid, id: randomUUID() });
    const handle = await open(path, 'wx', 0o600);
    try { await handle.writeFile(lock); } finally { await handle.close(); }
    this.lock = lock;
    try { this.previous = await this.raw(); return this.previous === null ? emptyChat() : readChatRecord(JSON.parse(this.previous)); }
    catch (error) { await this.close(); throw error; }
  }
  async save(value: ChatRecord) {
    if (!this.lock || await readFile(join(this.directory, 'owner.json'), 'utf8') !== this.lock) throw new Error('Chat storage ownership changed. Original preserved.');
    if (await this.raw() !== this.previous) throw new Error('Chat recovery changed outside this server. Original preserved; reload after reconciliation.');
    const next = JSON.stringify(readChatRecord(value));
    if (Buffer.byteLength(next) > 8 * 1024 * 1024) throw new Error('Chat recovery is full. Original saved data retained.');
    const path = join(this.directory, `conversation.${randomUUID()}.tmp`);
    const handle = await open(path, 'wx', 0o600);
    try { await handle.writeFile(next); await handle.sync(); } finally { await handle.close(); }
    try { await rename(path, join(this.directory, 'conversation.json')); this.previous = next; }
    finally { await unlink(path).catch(error => { if (!missing(error)) throw error; }); }
  }
  close() { return this.closing ??= this.release(); }
  private async release() {
    // Vite shutdown hooks may overlap. Retire ownership before yielding, so an
    // old second hook cannot remove the next server's newly acquired lock.
    const lock = this.lock; this.lock = undefined;
    if (!lock) return;
    try { const path = join(this.directory, 'owner.json'); if (await readFile(path, 'utf8') === lock) await unlink(path); }
    catch (error) { if (!missing(error)) throw error; }
  }
}
