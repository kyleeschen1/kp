import { newId, uuid } from '../notebook/model.ts';
import { readNotebook, type FractionNotebook } from './model.ts';

/** A separately addressed notebook starts with independent seed identities.
 * Only UUID values from this fixed seed are remapped, never imported user data. */
export function freshMatrixNotebook(seed: FractionNotebook, id: string): FractionNotebook {
  const ids = new Map<string, string>();
  const collect = (value: unknown): void => {
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      if (key === 'id' && typeof child === 'string') ids.set(child, newId());
      collect(child);
    }
  };
  collect(seed); ids.set(seed.id, uuid(id));
  const remap = (value: unknown): unknown => typeof value === 'string' ? ids.get(value) ?? value
    : Array.isArray(value) ? value.map(remap)
    : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([key, child]) => [key, remap(child)])) : value;
  return readNotebook({ ...objectSeed(remap(seed)), revision: 0 });
}
function objectSeed(value: unknown): FractionNotebook { return readNotebook(value); }
