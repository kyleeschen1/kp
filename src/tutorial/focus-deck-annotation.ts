export type KpFocusDeckTextRole = "label" | "support" | "meta";

export interface KpFocusDeckAnnotation {
  readonly entityId: string;
  readonly text: string;
  readonly detail?: string;
  readonly role?: KpFocusDeckTextRole;
}

/** Renderer-facing plain-language annotation. Source identity and wording come
 * from the caller; shared CSS owns type, and the renderer separately owns the
 * anchor. Mathematical labels must keep their native math renderer. No raw HTML,
 * font, size, scale or timing escape hatch is part of this input. */
export function renderKpFocusDeckAnnotation(input: KpFocusDeckAnnotation): string {
  if (!input.entityId.trim() || !input.text.trim()) {
    throw new Error("Focus Deck annotations require an entity and readable text.");
  }
  const role = input.role ?? "label";
  if (!["label", "support", "meta"].includes(role)) {
    throw new Error(`Unknown Focus Deck text role: ${role}.`);
  }
  return `<span class="kp-focus-deck__annotation" data-kp-focus-deck-annotation="${escape(input.entityId)}" data-kp-focus-deck-type="${role}">${escape(input.text)}${input.detail === undefined ? "" : `<span data-kp-focus-deck-type="support">${escape(input.detail)}</span>`}</span>`;
}

function escape(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
