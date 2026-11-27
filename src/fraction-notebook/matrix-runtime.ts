import { createMatrixVectorRuntime, type MatrixVectorRuntime, type MatrixVectorDocument } from '../math-resources/public-api.ts';
import type { MatrixObjectCell } from './types.ts';
import { matrixOccurrence, readMatrixResources } from './matrix-data.ts';

/** One evaluator per source closure, shared by all occurrences in this host.
 * Persistent history belongs to ProseMirror; removed owners release caches. */
export function createMatrixNotebookRuntime(initial: readonly MatrixVectorDocument[]) {
  let documents = readMatrixResources(initial), disposed = false;
  const runtimes = new Map<string, MatrixVectorRuntime>();
  const active = () => { if (disposed) throw new Error('The matrix notebook has closed.'); };
  const update = (next: readonly MatrixVectorDocument[]) => {
    active(); const admitted = readMatrixResources(next);
    // A source replacement is a new closure. Reject identity drift before
    // mutating any evaluator, so one bad update cannot partially refresh views.
    for (const d of admitted) {
      const previous = documents.find(old => old.id === d.id);
      if (previous && (previous.matrix.id !== d.matrix.id || previous.vector.id !== d.vector.id || previous.result.id !== d.result.id))
        throw new Error('A replacement matrix closure requires a new identity.');
    }
    documents = admitted;
    for (const [id, runtime] of runtimes) if (!documents.some(d => d.id === id)) { runtime.dispose(); runtimes.delete(id); }
    for (const d of documents) {
      const previous = runtimes.get(d.id);
      if (previous) previous.update(d); else runtimes.set(d.id, createMatrixVectorRuntime(d));
    }
  };
  update(documents);
  return { update, read(cell: MatrixObjectCell) { active(); return matrixOccurrence(documents, cell.resource, cell.occurrence); },
    sample(id: string) { active(); const runtime = runtimes.get(id); if (!runtime) throw new Error('The matrix resource was removed.'); return runtime.sample(); },
    explanation(id: string) { active(); const runtime = runtimes.get(id); if (!runtime) throw new Error('The matrix resource was removed.'); return runtime.explanation(); },
    inspect() { return [...runtimes].map(([id, runtime]) => ({ id, ...runtime.inspect() })); },
    dispose() { if (disposed) return; disposed = true; runtimes.forEach(r => r.dispose()); runtimes.clear(); }
  };
}
export type MatrixNotebookRuntime = ReturnType<typeof createMatrixNotebookRuntime>;
