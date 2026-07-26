export function cloneElementWithComputedStyles<TElement extends Element>(
  source: TElement
): TElement {
  const clone = source.cloneNode(true);
  if (!(clone instanceof HTMLElement) && !(clone instanceof SVGElement)) {
    throw new Error(
      "Computed-style visuals must clone to HTML or SVG elements."
    );
  }
  inlineElementComputedStyles(source, clone);
  return clone as unknown as TElement;
}

const materialCloneAuthorityAttributes = new Set([
  "action",
  "autofocus",
  "contenteditable",
  "controls",
  "download",
  "draggable",
  "for",
  "form",
  "formaction",
  "href",
  "id",
  "name",
  "role",
  "srcdoc",
  "tabindex",
  "target",
  "usemap",
  "xlink:href"
]);

/**
 * Material clones carry paint only. Native DOM remains the sole owner of
 * identity, semantics, navigation, focus, form behavior, and interaction.
 */
export function stripKpMaterialCloneAuthority(root: Element): void {
  for (const element of [root, ...root.querySelectorAll<Element>("*")]) {
    for (const className of [...element.classList]) {
      // Computed paint is already inline; semantic-state classes would let an
      // inert clone impersonate native focus ownership.
      if (/^kp-.+-semantic-focus$/.test(className)) {
        element.classList.remove(className);
      }
    }
    for (const attribute of [...element.attributes]) {
      if (
        materialCloneAuthorityAttributes.has(attribute.name) ||
        attribute.name.startsWith("aria-") ||
        attribute.name.startsWith("data-kp-") ||
        attribute.name.startsWith("on")
      ) {
        element.removeAttribute(attribute.name);
      }
    }
  }
}

export function makeKpMaterialOwnerInert(owner: HTMLElement): void {
  owner.inert = true;
  owner.setAttribute("aria-hidden", "true");
  owner.style.pointerEvents = "none";
  owner.style.userSelect = "none";
}

export function inlineElementComputedStyles(source: Element, clone: Element): void {
  if (clone instanceof HTMLElement || clone instanceof SVGElement) {
    const computed = getComputedStyle(source);
    for (let index = 0; index < computed.length; index += 1) {
      const property = computed.item(index);
      clone.style.setProperty(
        property,
        computed.getPropertyValue(property),
        computed.getPropertyPriority(property)
      );
    }
  }
  const sourceChildren = [...source.children];
  const cloneChildren = [...clone.children];
  sourceChildren.forEach((sourceChild, index) => {
    const cloneChild = cloneChildren[index];
    if (cloneChild !== undefined) inlineElementComputedStyles(sourceChild, cloneChild);
  });
}
