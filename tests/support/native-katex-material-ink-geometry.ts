export interface KpVisibleMaterialInkGeometry {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Browser-side test authority for transformed KaTeX ink. Wrapper rectangles
 * include baseline and strut space, so they cannot certify a visual pivot.
 */
export function measureVisibleKpMaterialInkGeometry(
  root: HTMLElement,
  expectedEntityIds: readonly string[]
): Record<string, KpVisibleMaterialInkGeometry> {
  const directText = (element: HTMLElement) =>
    [...element.childNodes]
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent ?? "")
      .join("")
      .replace(/[\s\u200b-\u200d\ufeff]+/g, "");
  const textInkRect = (element: HTMLElement) => {
    const text = directText(element);
    const range = element.ownerDocument.createRange();
    range.selectNodeContents(element);
    const rangeRect = range.getBoundingClientRect();
    const computed = getComputedStyle(element);
    const canvas = element.ownerDocument.createElement("canvas");
    const context = canvas.getContext("2d");
    if (context === null || text === "") return rangeRect;
    context.font = [
      computed.fontStyle,
      computed.fontWeight,
      computed.fontSize,
      computed.fontFamily
    ].join(" ");
    const metrics = context.measureText(text);
    const marker = element.ownerDocument.createElement("span");
    marker.style.cssText = [
      "display:inline-block",
      "width:0",
      "height:0",
      "padding:0",
      "margin:0",
      "border:0",
      "line-height:0",
      "vertical-align:baseline"
    ].join(";");
    element.append(marker);
    const baseline = marker.getBoundingClientRect().top;
    marker.remove();
    if (
      !(metrics.width > 0) ||
      !(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent > 0)
    ) return rangeRect;
    const scaleX = rangeRect.width / metrics.width;
    const lineHeight = Number.parseFloat(computed.lineHeight);
    const scaleY = Number.isFinite(lineHeight) && lineHeight > 0
      ? rangeRect.height / lineHeight
      : scaleX;
    return {
      left: rangeRect.left - metrics.actualBoundingBoxLeft * scaleX,
      top: baseline - metrics.actualBoundingBoxAscent * scaleY,
      width:
        (metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight) *
        scaleX,
      height:
        (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) *
        scaleY
    };
  };
  const result: Record<string, KpVisibleMaterialInkGeometry> = {};
  for (const entityId of expectedEntityIds) {
    const owners = [...root.querySelectorAll<HTMLElement>(
      `[data-kp-equation-material-semantic-entity-id="${CSS.escape(entityId)}"]`
    )].filter((owner) => Number(getComputedStyle(owner).opacity) > 0.01);
    const rects = owners.flatMap((owner) =>
      [owner, ...owner.querySelectorAll<HTMLElement>("*")]
        .filter((element) =>
          element.closest(".katex-mathml") === null &&
          directText(element) !== ""
        )
        .map(textInkRect)
    );
    if (rects.length === 0) {
      const available = [...root.querySelectorAll<HTMLElement>(
        "[data-kp-equation-material-semantic-entity-id]"
      )].map((owner) => ({
        id: owner.dataset["kpEquationMaterialSemanticEntityId"],
        opacity: getComputedStyle(owner).opacity,
        text: owner.textContent?.trim()
      }));
      throw new Error(
        `No visible material ink for ${entityId}; available=` +
        JSON.stringify(available)
      );
    }
    const left = Math.min(...rects.map((rect) => rect.left));
    const top = Math.min(...rects.map((rect) => rect.top));
    const right = Math.max(...rects.map((rect) => rect.left + rect.width));
    const bottom = Math.max(...rects.map((rect) => rect.top + rect.height));
    result[entityId] = {
      left,
      top,
      width: right - left,
      height: bottom - top
    };
  }
  return result;
}
