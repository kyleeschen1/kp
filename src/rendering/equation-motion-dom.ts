import type { KatexTokenRect } from "./katex-transition-types.ts";

export interface AnnotatedMotionToken {
  readonly motionId: string;
  readonly text: string;
  readonly rect: KatexTokenRect;
  readonly localRect: KatexTokenRect;
  readonly element: HTMLElement;
}

const toTokenRect = (rect: DOMRect): KatexTokenRect => ({
  left: rect.left,
  top: rect.top,
  width: rect.width,
  height: rect.height
});

const normalizeText = (text: string): string => text.replace(/\s+/g, " ").trim();

export function measureAnnotatedEquationMotionTokens(
  root: HTMLElement
): readonly AnnotatedMotionToken[] {
  const rootRect = root.getBoundingClientRect();
  const seenMotionIds = new Set<string>();
  const tokens: AnnotatedMotionToken[] = [];

  for (const element of root.querySelectorAll<HTMLElement>("[data-kp-motion-id]")) {
    const motionId = element.dataset["kpMotionId"]?.trim();
    if (motionId === undefined || motionId === "") {
      continue;
    }
    if (seenMotionIds.has(motionId)) {
      throw new Error(`Duplicate equation motion id ${motionId}`);
    }
    seenMotionIds.add(motionId);

    const elementRect = element.getBoundingClientRect();
    const rect = toTokenRect(elementRect);
    tokens.push({
      motionId,
      text: normalizeText(element.textContent ?? ""),
      rect,
      localRect: {
        left: elementRect.left - rootRect.left,
        top: elementRect.top - rootRect.top,
        width: elementRect.width,
        height: elementRect.height
      },
      element
    });
  }

  return tokens;
}
