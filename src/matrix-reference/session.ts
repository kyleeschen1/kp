import { readMatrixSnapshot, MathResourceGap } from '../math-resources/data-api.ts';
import { replaceReference, type ReferenceRecord } from './record.ts';

export interface ReferenceStore {
  change(change: (current: ReferenceRecord) => ReferenceRecord): Promise<void>;
  close(): void;
}
export interface ReferencePresentation { reveal(): void; pause(): void; dispose(): void }
export type MountReference = (record: ReferenceRecord, settled: (progress: number) => void) => ReferencePresentation;

/** Serialize durable writes, but admit file reads by latest request. A candidate
 * proves it can render before storage or the visible valid card is replaced. */
export function createReferenceSession(store: ReferenceStore, initial: ReferenceRecord, mount: MountReference,
  changed: (record: ReferenceRecord) => void, failed: (error: unknown) => void) {
  let record = initial, disposed = false, request = 0, tail = Promise.resolve();
  interface Card { view: ReferencePresentation; record: ReferenceRecord }
  let active: Card | undefined;
  const enqueue = (work: () => Promise<void>) => {
    const result = tail.then(async () => { if (!disposed) await work(); });
    tail = result.catch(() => {}); return result;
  };
  const prepare = (next: ReferenceRecord): Card => {
    let card: Card | undefined;
    const view = mount(next, progress => {
      if (disposed || !card || active !== card) return;
      void enqueue(async () => {
        if (active !== card || progress === record.view.progress) return;
        const saved = { ...record, view: { ...record.view, progress } };
        let committed: ReferenceRecord | undefined;
        await store.change(current => committed = replaceReference(current, record.revision, saved));
        if (committed) { record = committed; if (!disposed) changed(record); }
      }).catch(error => { if (!disposed) failed(error); });
    });
    card = { record: next, view };
    return card;
  };
  // Mount invokes settled synchronously; no candidate can save until activated.
  active = prepare(record); active.view.reveal(); changed(record);
  return {
    async importFile(file: { name: string; size: number; text(): Promise<string> }) {
      if (disposed) return;
      const ticket = ++request;
      try {
        if (file.size > 64 * 1024) throw new MathResourceGap('snapshot-too-large', 'file', 'A matrix snapshot must be at most 64 KiB.');
        const text = await file.text();
        if (disposed || ticket !== request) return;
        const source = readMatrixSnapshot(JSON.parse(text));
        await enqueue(async () => {
          if (ticket !== request) return;
          const next: ReferenceRecord = { ...record, source, view: { progress: 0, filename: file.name.slice(0, 255) } };
          const candidate = prepare(next);
          try {
            active?.view.pause();
            let committed: ReferenceRecord | undefined;
            await store.change(current => {
              if (disposed || ticket !== request) throw new Error('Import superseded.');
              return committed = replaceReference(current, record.revision, next);
            });
            if (!committed) throw new Error('The snapshot was not committed.');
            record = committed;
            if (disposed) { candidate.view.dispose(); return; }
            active?.view.dispose(); active = candidate; candidate.view.reveal(); changed(record);
          } catch (error) { candidate.view.dispose(); throw error; }
        });
      } catch (error) { if (!disposed && ticket === request) failed(error); }
    },
    idle: () => tail,
    dispose() { if (disposed) return; disposed = true; ++request; active?.view.dispose(); active = undefined; store.close(); }
  };
}
