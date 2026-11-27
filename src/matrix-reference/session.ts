import { readMatrixSnapshot, MathResourceGap, type MatrixVectorDocument } from '../math-resources/data-api.ts';
import { newId, type UUID } from '../notebook/model.ts';
import { cardName, replaceShelf, selectedCard, shelfGap, type ReferenceCard, type ReferenceShelf } from './shelf.ts';

export interface ReferenceStore {
  change(change: (current: ReferenceShelf) => ReferenceShelf): Promise<void>;
  close(): void;
}
export interface ReferencePresentation { reveal(): void; pause(): void; dispose(): void }
export type MountReference = (card: ReferenceCard, settled: (progress: number) => void) => ReferencePresentation;
export interface PendingImport { readonly source: MatrixVectorDocument; readonly filename: string }
export type ImportChoice = { readonly kind: 'copy' } | { readonly kind: 'update'; readonly cardId: UUID };

/** Only the active presentation may save playback. Shelf writes are serialized
 * with revision checks; late file reads and cancelled decisions have no authority. */
export function createReferenceSession(store: ReferenceStore, initial: ReferenceShelf, mount: MountReference,
  changed: (shelf: ReferenceShelf) => void, failed: (error: unknown) => void,
  offerImport: (pending: PendingImport | undefined, matches: readonly ReferenceCard[]) => void) {
  let shelf = initial, disposed = false, request = 0, tail = Promise.resolve();
  let pending: PendingImport | undefined;
  interface Active { view: ReferencePresentation; id: UUID }
  let active: Active | undefined;
  const enqueue = (work: () => Promise<void>) => {
    const result = tail.then(async () => { if (!disposed) await work(); });
    tail = result.catch(() => {}); return result;
  };
  const report = (error: unknown) => { if (!disposed) failed(error); };
  const cancelImport = () => { ++request; pending = undefined; offerImport(undefined, []); };
  const save = async (next: ReferenceShelf, currentRequest?: number) => {
    let committed: ReferenceShelf | undefined;
    await store.change(current => {
      if (disposed || (currentRequest !== undefined && currentRequest !== request)) throw new Error('Operation cancelled.');
      return committed = replaceShelf(current, shelf.revision, next);
    });
    if (!committed) throw new Error('The shelf was not committed.');
    shelf = committed;
  };
  const prepare = (card: ReferenceCard): Active => {
    let owner: Active | undefined;
    const view = mount(card, progress => {
      if (disposed || !owner || active !== owner) return;
      const id = owner.id;
      void enqueue(async () => {
        // Pause settles before the replacement is queued. Later callbacks from
        // the retired presentation must not write into an updated source.
        if (active !== owner) return;
        const current = shelf.cards.find(card => card.id === id);
        if (!current || progress === current.view.progress) return;
        await save({ ...shelf, cards: shelf.cards.map(card => card.id === id ? { ...card, view: { ...card.view, progress } } : card) });
        if (!disposed) changed(shelf);
      }).catch(report);
    });
    owner = { id: card.id, view }; return owner;
  };
  const replace = async (next: ReferenceShelf, ticket: number) => {
    if (ticket !== request) return;
    const candidate = prepare(selectedCard(next));
    try {
      await save(next, ticket);
      if (disposed) { candidate.view.dispose(); return; }
      active?.view.dispose(); active = candidate; candidate.view.reveal(); changed(shelf);
    } catch (error) { candidate.view.dispose(); throw error; }
  };
  const commitImport = (incoming: PendingImport, choice: ImportChoice, ticket: number) => {
    active?.view.pause(); // Queue its final position before replacing anything.
    return enqueue(async () => {
      if (ticket !== request) return;
      let card: ReferenceCard;
      if (choice.kind === 'update') {
        const previous = shelf.cards.find(card => card.id === choice.cardId);
        if (!previous || previous.source.id !== incoming.source.id) return shelfGap('Choose a saved card with this source ID to update.');
        if ((['matrix', 'vector', 'result'] as const).some(kind => previous.source[kind].id !== incoming.source[kind].id))
          throw new MathResourceGap('reference-identity-conflict', 'source', 'This file changes the matrix, vector or result identity. Save it as a separate card instead.');
        card = { ...previous, source: incoming.source, view: { ...previous.view, filename: incoming.filename } };
      } else card = { id: newId(), name: incoming.filename.replace(/\.json$/i, '').slice(0, 120) || 'Matrix explanation',
        source: incoming.source, view: { filename: incoming.filename, progress: 0 } };
      const cards = choice.kind === 'update' ? shelf.cards.map(c => c.id === card.id ? card : c) : [...shelf.cards, card];
      await replace({ ...shelf, selected: card.id, cards }, ticket);
    });
  };
  active = prepare(selectedCard(shelf)); active.view.reveal(); changed(shelf);
  return {
    snapshot: () => shelf,
    cancelImport,
    async importFile(file: { name: string; size: number; text(): Promise<string> }) {
      if (disposed) return;
      cancelImport(); const ticket = request;
      try {
        if (file.size > 64 * 1024) throw new MathResourceGap('snapshot-too-large', 'file', 'A matrix snapshot must be at most 64 KiB.');
        const text = await file.text(); if (disposed || ticket !== request) return;
        const incoming = { source: readMatrixSnapshot(JSON.parse(text)), filename: file.name.slice(0, 255) };
        const matches = shelf.cards.filter(card => card.source.id === incoming.source.id);
        if (matches.length) { pending = incoming; offerImport(incoming, matches); }
        else await commitImport(incoming, { kind: 'copy' }, ticket);
      } catch (error) { if (ticket === request) report(error); }
    },
    async confirmImport(choice: ImportChoice) {
      if (disposed || !pending) return;
      const incoming = pending, ticket = request;
      pending = undefined; offerImport(undefined, []);
      try { await commitImport(incoming, choice, ticket); } catch (error) { if (ticket === request) report(error); }
    },
    async select(id: UUID) {
      if (disposed) return;
      cancelImport(); const ticket = request; active?.view.pause();
      try { await enqueue(async () => {
        if (ticket !== request || shelf.selected === id) return;
        if (!shelf.cards.some(card => card.id === id)) return shelfGap('That card is no longer on the shelf.');
        await replace({ ...shelf, selected: id }, ticket);
      }); } catch (error) { if (ticket === request) report(error); }
    },
    async rename(id: UUID, name: string) {
      try { await enqueue(async () => {
        if (!shelf.cards.some(card => card.id === id)) return shelfGap('That card is no longer on the shelf.');
        const clean = cardName(name);
        await save({ ...shelf, cards: shelf.cards.map(card => card.id === id ? { ...card, name: clean } : card) });
        if (!disposed) changed(shelf);
      }); } catch (error) { report(error); }
    },
    idle: () => tail,
    dispose() { if (disposed) return; disposed = true; ++request; pending = undefined; active?.view.dispose(); active = undefined; store.close(); }
  };
}
