export function cloneElementWithComputedStyles<TElement extends HTMLElement>(
  source: TElement
): TElement {
  const clone = source.cloneNode(true);
  if (!(clone instanceof HTMLElement)) {
    throw new Error("Computed-style visuals must clone to HTMLElements.");
  }
  inlineElementComputedStyles(source, clone);
  return clone as TElement;
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
