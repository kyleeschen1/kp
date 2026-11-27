import { newId, uuid, type UUID } from '../notebook/model.ts';
import { MathResourceGap } from '../math-resources/data-api.ts';
import { readReferenceRecord, type ReferenceRecord } from './record.ts';

export interface ReferenceCard {
  readonly id: UUID;
  readonly name: string;
  readonly source: ReferenceRecord['source'];
  readonly view: ReferenceRecord['view'];
}
export interface ReferenceShelf {
  readonly schemaVersion: 1;
  readonly revision: number;
  readonly selected: UUID;
  readonly cards: readonly ReferenceCard[];
}
export const maxCards = 50;
export const shelfGap = (message: string): never => { throw new MathResourceGap('invalid-reference-shelf', 'shelf', message); };
function fields(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype
    || Object.keys(value).sort().join() !== [...keys].sort().join()) return shelfGap(`Expected exactly ${keys.join(', ')}.`);
  return value as Record<string, unknown>;
}
export function cardName(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 120)
    return shelfGap('Use a card name between 1 and 120 characters.');
  return value.trim();
}
export function readReferenceShelf(value: unknown): ReferenceShelf {
  const raw = fields(value, ['schemaVersion', 'revision', 'selected', 'cards']);
  if (raw['schemaVersion'] !== 1 || !Number.isSafeInteger(raw['revision']) || typeof raw['revision'] !== 'number' || raw['revision'] < 0)
    return shelfGap('Expected a version-1 shelf and a nonnegative safe revision.');
  if (!Array.isArray(raw['cards']) || raw['cards'].length < 1 || raw['cards'].length > maxCards)
    return shelfGap(`Keep between 1 and ${maxCards} cards on this local shelf.`);
  const ids = new Set<string>();
  const cards = Array.from(raw['cards'], value => {
    const c = fields(value, ['id', 'name', 'source', 'view']), id = uuid(c['id'], 'card.id');
    if (ids.has(id)) return shelfGap('Each saved card needs its own identity.'); ids.add(id);
    const record = readReferenceRecord({ schemaVersion: 1, revision: 0, source: c['source'], view: c['view'] });
    return Object.freeze({ id, name: cardName(c['name']), source: record.source, view: record.view });
  });
  const selected = uuid(raw['selected'], 'shelf.selected');
  if (!ids.has(selected)) return shelfGap('The selected card must belong to this shelf.');
  return Object.freeze({ schemaVersion: 1, revision: raw['revision'], selected, cards: Object.freeze(cards) });
}
export function migrateReference(record: ReferenceRecord): ReferenceShelf {
  const id = newId();
  return readReferenceShelf({ schemaVersion: 1, revision: 0, selected: id,
    cards: [{ id, name: record.view.filename.replace(/\.json$/i, '').slice(0, 120) || 'Matrix explanation', source: record.source, view: record.view }] });
}
export const selectedCard = (shelf: ReferenceShelf): ReferenceCard => shelf.cards.find(card => card.id === shelf.selected)!;
export function replaceShelf(current: ReferenceShelf, expected: number, next: ReferenceShelf): ReferenceShelf {
  if (current.revision !== expected)
    throw new MathResourceGap('reference-conflict', 'shelf', 'This shelf changed in another tab. Reload before saving more changes.');
  return readReferenceShelf({ ...next, revision: current.revision + 1 });
}
