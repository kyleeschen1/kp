export interface KpRendererThemeReference {
  readonly id: string;
}

export function defineKpRendererThemeReference<const Id extends string>(
  reference: { readonly id: Id }
): Readonly<{ readonly id: Id }> {
  if (reference.id.trim().length === 0) {
    throw new Error("Renderer theme references require a stable non-empty id.");
  }
  return Object.freeze({ id: reference.id });
}

/**
 * Renderers own only this stable identity. Application adapters may attach a
 * richer token set without making portable scene construction depend on it.
 */
export const kpLinearEquationExemplarThemeReference =
  defineKpRendererThemeReference({
    id: "kp.concept-room.linear-equation-exemplar.v1"
  });
