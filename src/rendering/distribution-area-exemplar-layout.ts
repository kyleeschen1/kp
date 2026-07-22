import type { KpEquationVisualRect } from "./equation-visual-frame.ts";

export type KpDistributionAreaLayoutMode = "side-by-side" | "stacked";

export interface KpDistributionAreaExemplarLayout {
  readonly mode: KpDistributionAreaLayoutMode;
  readonly container: KpEquationVisualRect;
  readonly algebra: KpEquationVisualRect;
  readonly area: KpEquationVisualRect;
  readonly requiredHeightPx: number;
  readonly overflow: "page-flow";
}

const wideBreakpointPx = 760;

/** The phone envelope grows the document; it never creates an internal scroll rail. */
export function planKpDistributionAreaExemplarLayout(input: {
  readonly widthPx: number;
  readonly topPx?: number | undefined;
}): KpDistributionAreaExemplarLayout {
  if (!Number.isFinite(input.widthPx) || input.widthPx < 280) {
    throw new Error("Distribution area layout requires at least 280px of width.");
  }
  const top = input.topPx ?? 0;
  if (!Number.isFinite(top)) {
    throw new Error("Distribution area layout top must be finite.");
  }
  const wide = input.widthPx >= wideBreakpointPx;
  const padding = wide ? 24 : 16;
  const gap = wide ? 28 : 20;
  const contentWidth = input.widthPx - padding * 2;

  if (wide) {
    const algebraWidth = Math.max(280, Math.floor(contentWidth * 0.4));
    const areaWidth = contentWidth - gap - algebraWidth;
    const contentHeight = 300;
    const requiredHeightPx = contentHeight + padding * 2;
    return {
      mode: "side-by-side",
      container: rect(0, top, input.widthPx, requiredHeightPx),
      algebra: rect(padding, top + padding, algebraWidth, contentHeight),
      area: rect(padding + algebraWidth + gap, top + padding, areaWidth, contentHeight),
      requiredHeightPx,
      overflow: "page-flow"
    };
  }

  const algebraHeight = 112;
  const areaHeight = Math.max(210, Math.min(260, contentWidth * 0.68));
  const requiredHeightPx = padding * 2 + algebraHeight + gap + areaHeight;
  return {
    mode: "stacked",
    container: rect(0, top, input.widthPx, requiredHeightPx),
    algebra: rect(padding, top + padding, contentWidth, algebraHeight),
    area: rect(
      padding,
      top + padding + algebraHeight + gap,
      contentWidth,
      areaHeight
    ),
    requiredHeightPx,
    overflow: "page-flow"
  };
}

function rect(
  left: number,
  top: number,
  width: number,
  height: number
): KpEquationVisualRect {
  return { left, top, width, height };
}
