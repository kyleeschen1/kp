export type KpAnimationOverflowAxis = "x" | "y";

export interface KpAnimationOverflowSample {
  readonly elementRef: string;
  readonly axis: KpAnimationOverflowAxis;
  readonly overflowMode: string;
  readonly clientExtent: number;
  readonly scrollExtent: number;
}

export interface KpAnimationOverflowIssue extends KpAnimationOverflowSample {
  readonly kind: "nested-scrollbar" | "content-overflow";
  readonly overflowExtent: number;
}

export interface KpAnimationViewportOverflowReport {
  readonly kind: "animation-viewport-overflow-report";
  readonly tolerancePx: number;
  readonly samples: readonly KpAnimationOverflowSample[];
  readonly issues: readonly KpAnimationOverflowIssue[];
  readonly nestedScrollbarCount: number;
  readonly contentOverflowCount: number;
}

const animationLayoutSelector = [
  "[data-kp-editor-animation-surface-slot]",
  "[data-kp-editor-equation-stage]",
  ".editor-equation-stage__transition",
  ".editor-equation-stage__layer",
  ".editor-equation-stage__object",
  "[data-kp-editor-graph-stage]",
  "[data-kp-editor-diagram-svg]"
].join(",");

export function measureKpAnimationViewportOverflow(
  stage: HTMLElement,
  tolerancePx = 1
): KpAnimationViewportOverflowReport {
  const elements = [
    stage,
    ...stage.querySelectorAll<HTMLElement>(animationLayoutSelector)
  ];
  const samples = elements.flatMap((element) => {
    const style = getComputedStyle(element);
    const elementRef = kpAnimationOverflowElementRef(element);
    return [
      {
        elementRef,
        axis: "x" as const,
        overflowMode: style.overflowX,
        clientExtent: element.clientWidth,
        scrollExtent: element.scrollWidth
      },
      {
        elementRef,
        axis: "y" as const,
        overflowMode: style.overflowY,
        clientExtent: element.clientHeight,
        scrollExtent: element.scrollHeight
      }
    ];
  });

  return classifyKpAnimationOverflowSamples(samples, tolerancePx);
}

export function classifyKpAnimationOverflowSamples(
  samples: readonly KpAnimationOverflowSample[],
  tolerancePx = 1
): KpAnimationViewportOverflowReport {
  if (!Number.isFinite(tolerancePx) || tolerancePx < 0) {
    throw new Error("Animation overflow tolerance must be a finite non-negative number.");
  }
  const issues = samples.flatMap<KpAnimationOverflowIssue>((sample) => {
    const overflowExtent = Math.max(
      0,
      sample.scrollExtent - sample.clientExtent
    );
    const hasOverflow = overflowExtent > tolerancePx;
    const hasScrollbar =
      sample.overflowMode === "scroll" ||
      (sample.overflowMode === "auto" && hasOverflow);
    return [
      ...(hasScrollbar
        ? [{
            ...sample,
            kind: "nested-scrollbar" as const,
            overflowExtent
          }]
        : []),
      ...(hasOverflow
        ? [{
            ...sample,
            kind: "content-overflow" as const,
            overflowExtent
          }]
        : [])
    ];
  });

  return {
    kind: "animation-viewport-overflow-report",
    tolerancePx,
    samples: samples.map((sample) => ({ ...sample })),
    issues,
    nestedScrollbarCount: issues.filter(
      (issue) => issue.kind === "nested-scrollbar"
    ).length,
    contentOverflowCount: issues.filter(
      (issue) => issue.kind === "content-overflow"
    ).length
  };
}

function kpAnimationOverflowElementRef(element: HTMLElement): string {
  for (const attribute of [
    "data-kp-editor-animation-stage",
    "data-kp-editor-animation-surface-slot",
    "data-kp-editor-equation-stage",
    "data-kp-editor-graph-stage",
    "data-kp-editor-diagram-svg"
  ]) {
    if (element.hasAttribute(attribute)) {
      const value = element.getAttribute(attribute);
      return value === null || value === ""
        ? `[${attribute}]`
        : `[${attribute}="${value}"]`;
    }
  }

  const className = element.className.trim().split(/\s+/)[0];
  return className === ""
    ? element.tagName.toLowerCase()
    : `${element.tagName.toLowerCase()}.${className}`;
}
