import { prepareComposition } from '../composition-explanation/model.ts';
import { readCompositionResources, validCompositionDraft, type CompositionResource } from '../composition-explanation/resource.ts';

/** Cache by admitted values, not revision: undo can revisit a revision and an
 * invalid draft must neither recalculate nor relabel the last valid geometry. */
export function createCompositionRuntime(initial: readonly CompositionResource[]) {
  let resources = readCompositionResources(initial), disposed = false, compilations = 0;
  const cache = new Map<string, { key: string; source: ReturnType<typeof prepareComposition> }>();
  const active = () => { if (disposed) throw new Error('The composition notebook has closed.'); };
  return {
    update(next: readonly CompositionResource[]) {
      active(); resources = readCompositionResources(next);
      for (const id of cache.keys()) if (!resources.some(r => r.id === id)) cache.delete(id);
    },
    read(id: string) {
      active(); const resource = resources.find(r => r.id === id);
      if (!resource) throw new Error('Restore the matrix pair referenced by this view.');
      const key = JSON.stringify(resource.admitted), old = cache.get(id);
      const sample = old?.key === key ? old : { key, source: prepareComposition(resource.admitted, resource.id) };
      if (old !== sample) { cache.set(id, sample); compilations++; }
      return { resource, source: sample.source, valid: validCompositionDraft(resource.draft) };
    },
    inspect: () => ({ compilations, cached: cache.size, disposed }),
    dispose() { disposed = true; cache.clear(); }
  };
}
export type CompositionRuntime = ReturnType<typeof createCompositionRuntime>;
