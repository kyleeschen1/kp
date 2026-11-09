/** Compiled endpoint notes carry references; each domain still owns their meaning. */
export class AnchoredAlgebraGap extends Error {
  readonly code = "kp.anchored-algebra.repair-gap";
  readonly path: string;
  constructor(path: string, expected: string) { super(`${path}: ${expected}`); this.path = path; }
}
export interface CommentaryNote {
  readonly id: string;
  readonly text: string;
  readonly detail: string;
  readonly side: "above" | "below";
  readonly views: Readonly<Record<string, readonly string[]>>;
}
export interface CommentaryStop {
  readonly stateId: string;
  readonly notes: readonly CommentaryNote[];
}

/** Serialized compiler output still crosses a data boundary. Native ownership
 * and exact selector realization are checked separately by the label adapter. */
export function readEndpointCommentary(value: unknown): readonly CommentaryStop[] {
  const object = (item: unknown): item is Record<string, unknown> => !!item && typeof item === 'object' && !Array.isArray(item);
  const nonempty = (item: unknown): item is string => typeof item === 'string' && item.trim().length > 0;
  const gap = () => new AnchoredAlgebraGap('reader.annotations', 'Require unique stops with named notes and explicit native selector views.');
  if (!Array.isArray(value)) throw gap();
  const states = new Set<string>();
  return value.map(stop => {
    if (!object(stop) || !nonempty(stop['stateId']) || states.has(stop['stateId']) || !Array.isArray(stop['notes']) || !stop['notes'].length) throw gap();
    states.add(stop['stateId']);
    const ids = new Set<string>();
    const notes = stop['notes'].map((note: unknown): CommentaryNote => {
      if (!object(note) || !nonempty(note['id']) || ids.has(note['id']) || !nonempty(note['text']) || typeof note['detail'] !== 'string'
        || (note['side'] !== 'above' && note['side'] !== 'below') || !object(note['views']) || !Object.keys(note['views']).length) throw gap();
      ids.add(note['id']);
      const views: Record<string, readonly string[]> = {};
      for (const [id, refs] of Object.entries(note['views'])) {
        if (!nonempty(id) || !Array.isArray(refs) || !refs.length || !refs.every(nonempty) || new Set(refs).size !== refs.length) throw gap();
        views[id] = refs;
      }
      return { id: note['id'], text: note['text'], detail: note['detail'], side: note['side'], views };
    });
    return { stateId: stop['stateId'], notes };
  });
}
