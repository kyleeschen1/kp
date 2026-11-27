import type { UUID } from '../notebook/model.ts';
import { invalidResourceFields } from '../math-resources/data-api.ts';
import { readNotebook, type FractionNotebook } from './model.ts';
import { matrixNote, matrixSourceHash } from './matrix-reuse-data.ts';
import type { ContextualRevisionSnapshot, AnnotationRevisionChange } from '../editor-chat/contextual-revision.ts';
import { sha256 } from '../kernel/sha256.ts';

export function matrixRevisionSnapshot(notebook: FractionNotebook, resource: UUID, branchId: string, threadId: string): ContextualRevisionSnapshot {
  const source = notebook.matrixResources?.find(d => d.id === resource);
  if (!source || invalidResourceFields(source).length) throw new Error('Select a valid matrix source before requesting a revision.');
  if (notebook.matrixBindings?.some(b => b.resource === resource && b.kind === 'transclude')) throw new Error('Revise the original source note, or make an independent Copy.');
  const note = matrixNote(source, notebook.matrixNotes ?? []);
  return { objectId: `kp:matrix-note:${resource}`, objectTitle: 'Matrix column explanation', sourceRevision: matrixSourceHash(source),
    draftSource: JSON.stringify(notebook), branchId, threadId,
    annotation: { id: `${resource}.note`, title: note.title, content: note.content, focusRefs: [source.result.id] },
    availableTargets: [source.result.id], surroundingContext: `Matrix rows: ${JSON.stringify(source.matrix.entries)}. Input vector: ${JSON.stringify(source.vector.entries)}. The existing explanation weights each matrix column by the corresponding input coordinate and sums the contributions. Revise only its explanatory note; do not change values, identities, operations, or the animation.` };
}
export function revisedMatrixNote(notebook: FractionNotebook, resource: UUID, change: AnnotationRevisionChange) {
  const current = matrixRevisionSnapshot(notebook, resource, change.request.branchId, change.request.threadId);
  if (current.objectId !== change.request.objectId || current.sourceRevision !== change.request.sourceRevision || sha256(current.draftSource) !== change.request.draftRevision
    || JSON.stringify(current.annotation) !== JSON.stringify(change.before) || change.after.id !== current.annotation.id
    || JSON.stringify(change.after.focusRefs) !== JSON.stringify(current.availableTargets)) throw new Error('The matrix or selected note changed; prepare a new request.');
  return readNotebook({ ...notebook, revision: notebook.revision + 1, matrixNotes: [
    ...(notebook.matrixNotes ?? []).filter(n => n.resource !== resource), { resource, title: change.after.title, content: change.after.content }
  ] });
}
