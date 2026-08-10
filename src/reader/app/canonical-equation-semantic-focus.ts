import type { KpReaderFocusSnapshot } from "../runtime/public-api.ts";

export interface KpCanonicalEquationSemanticFocusProjection {
  readonly activeSource?: string | undefined;
  readonly visualFocusRefs: readonly string[];
}

/**
 * Narrative equation ids establish story scope; only selector-level refs ask
 * the renderer to paint focus. This rule must remain identical across hosts.
 */
export function projectKpCanonicalEquationSemanticFocus(input: {
  readonly snapshot: KpReaderFocusSnapshot;
  readonly equationObjectRefs: ReadonlySet<string>;
}): KpCanonicalEquationSemanticFocusProjection {
  const visualFocusRefs = input.snapshot.activeSource === "story"
    ? input.snapshot.objectRefs.filter(
        (ref) => !input.equationObjectRefs.has(ref)
      )
    : input.snapshot.objectRefs;
  return Object.freeze({
    ...(input.snapshot.activeSource === undefined
      ? {}
      : { activeSource: input.snapshot.activeSource }),
    visualFocusRefs: Object.freeze([...visualFocusRefs])
  });
}

/** Applies one semantic focus projection to equation paint and prose links. */
export function applyKpCanonicalEquationSemanticFocus(input: {
  readonly stage: HTMLElement;
  readonly linkRoot: ParentNode;
  readonly projection: KpCanonicalEquationSemanticFocusProjection;
}): void {
  if (input.projection.activeSource === undefined) {
    delete input.stage.dataset["kpReaderFocusSource"];
  } else {
    input.stage.dataset["kpReaderFocusSource"] = input.projection.activeSource;
  }
  const matches = (selectorId: string): boolean =>
    input.projection.visualFocusRefs.some(
      (ref) => selectorId === ref || selectorId.startsWith(`${ref}.`)
    );
  for (const element of input.stage.querySelectorAll<HTMLElement>(
    "[data-kp-reader-selector-id]"
  )) {
    element.classList.toggle(
      "kp-reader-semantic-focus",
      matches(requiredData(element, "kpReaderSelectorId"))
    );
  }
  for (const link of input.linkRoot.querySelectorAll<HTMLElement>(
    ".kp-semantic-link"
  )) {
    link.classList.toggle(
      "kp-reader-semantic-focus",
      dataRefs(link).some((ref) =>
        input.projection.visualFocusRefs.includes(ref)
      )
    );
  }
}

function dataRefs(element: HTMLElement): readonly string[] {
  return (element.dataset["kpFocus"] ?? "").split(/\s+/).filter(Boolean);
}

function requiredData(element: HTMLElement, key: string): string {
  const value = element.dataset[key];
  if (value === undefined || value === "") {
    throw new Error(`Missing data-${key}.`);
  }
  return value;
}
