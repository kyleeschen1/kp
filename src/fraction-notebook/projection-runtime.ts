import { prepareProjection } from '../projection-explanation/model.ts';
import { readProjectionResources, validProjectionDraft, type ProjectionResource } from '../projection-explanation/resource.ts';

/** Cache by admitted values, not revision: undo can revisit a revision and an
 * invalid draft must neither recalculate nor relabel the last valid geometry. */
export function createProjectionRuntime(initial: readonly ProjectionResource[]) {
  let resources = readProjectionResources(initial), disposed = false, compilations = 0;
  const cache = new Map<string, { key: string; source: ReturnType<typeof prepareProjection> }>();
  const active = () => { if (disposed) throw new Error('The projection notebook has closed.'); };
  return {
    update(next: readonly ProjectionResource[]) {
      active(); resources = readProjectionResources(next);
      for (const id of cache.keys()) if (!resources.some(r => r.id === id)) cache.delete(id);
    },
    read(id: string) {
      active(); const resource = resources.find(r => r.id === id);
      if (!resource) throw new Error('Restore the vector pair referenced by this view.');
      const key = JSON.stringify(resource.admitted), old = cache.get(id);
      const sample = old?.key === key ? old : { key, source: prepareProjection(resource.admitted, resource.id) };
      if (old !== sample) { cache.set(id, sample); compilations++; }
      return { resource, source: sample.source, valid: validProjectionDraft(resource.draft) };
    },
    inspect: () => ({ compilations, cached: cache.size, disposed }),
    dispose() { disposed = true; cache.clear(); }
  };
}
export type ProjectionRuntime = ReturnType<typeof createProjectionRuntime>;
