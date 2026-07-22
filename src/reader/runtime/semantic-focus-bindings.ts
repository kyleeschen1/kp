export type KpReaderSemanticLinkFocusSource = "pointer" | "keyboard";

export interface KpReaderSemanticLinkBindings {
  dispose(): void;
}

/** Reads the semantic refs emitted by the static reader compiler. */
export function readKpReaderSemanticFocusRefs(element: HTMLElement): readonly string[] {
  return (element.dataset["kpFocus"] ?? "").split(/\s+/).filter(Boolean);
}

/**
 * Owns delegated pointer and keyboard bindings without prescribing how a
 * renderer projects semantic focus onto its visual surface.
 */
export function bindKpReaderSemanticLinks(input: {
  readonly root: Document | HTMLElement;
  readonly selector: string;
  readonly setFocus: (
    source: KpReaderSemanticLinkFocusSource,
    refs: readonly string[]
  ) => void;
  readonly clearFocus: (source: KpReaderSemanticLinkFocusSource) => void;
}): KpReaderSemanticLinkBindings {
  const semanticOwner = (target: EventTarget | null): HTMLElement | null => {
    if (!(target instanceof Element)) return null;
    const owner = target.closest<HTMLElement>(input.selector);
    return owner !== null && input.root.contains(owner) ? owner : null;
  };
  const relatedTarget = (event: Event): EventTarget | null => (
    "relatedTarget" in event
      ? (event as Event & { readonly relatedTarget: EventTarget | null }).relatedTarget
      : null
  );
  const enter = (source: KpReaderSemanticLinkFocusSource, event: Event): void => {
    const owner = semanticOwner(event.target);
    if (owner === null || owner === semanticOwner(relatedTarget(event))) return;
    input.setFocus(source, readKpReaderSemanticFocusRefs(owner));
  };
  const leave = (source: KpReaderSemanticLinkFocusSource, event: Event): void => {
    const owner = semanticOwner(event.target);
    if (owner === null || owner === semanticOwner(relatedTarget(event))) return;
    input.clearFocus(source);
  };
  const onPointerOver = (event: Event): void => enter("pointer", event);
  const onPointerOut = (event: Event): void => leave("pointer", event);
  const onFocusIn = (event: Event): void => enter("keyboard", event);
  const onFocusOut = (event: Event): void => leave("keyboard", event);

  input.root.addEventListener("pointerover", onPointerOver);
  input.root.addEventListener("pointerout", onPointerOut);
  input.root.addEventListener("focusin", onFocusIn);
  input.root.addEventListener("focusout", onFocusOut);

  return {
    dispose() {
      input.root.removeEventListener("pointerover", onPointerOver);
      input.root.removeEventListener("pointerout", onPointerOut);
      input.root.removeEventListener("focusin", onFocusIn);
      input.root.removeEventListener("focusout", onFocusOut);
    }
  };
}
