export type DocumentReadingAttention = { readonly kind: "prose" } | { readonly kind: "annotation"; readonly stateId: string };

/** An arrived annotation replaces outgoing prose. An incoming prose passage
 * reclaims reading attention before it becomes fully foregrounded. */
export function documentReadingAttention(input: {
  readonly states: readonly (string | undefined)[];
  readonly opacity: ReadonlyMap<number, number>;
  readonly readingDocument: boolean;
  readonly hasSelection: boolean;
}): DocumentReadingAttention {
  if (input.readingDocument || input.hasSelection) return { kind: "prose" };
  const candidate = [...input.opacity].find(([index, alpha]) => input.states[index] && alpha === 1)?.[0];
  if (candidate === undefined || [...input.opacity].some(([index, alpha]) => index > candidate && alpha > 0)) return { kind: "prose" };
  return { kind: "annotation", stateId: input.states[candidate]! };
}
