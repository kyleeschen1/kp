export interface KpEquationNativeFitInput {
  readonly baselineFontPx: number;
  readonly availableWidth: number;
  readonly naturalWidth: number;
  readonly minimumFontPx?: number | undefined;
  readonly safetyRatio?: number | undefined;
}

export interface KpEquationNativeFitFrame {
  readonly transitionId: string;
  readonly baselineFontPx: number;
  readonly fittedFontPx: number;
  readonly scale: number;
  readonly constrained: boolean;
}

export interface KpEquationNativeFitResult {
  readonly kind: "equation-native-fit-result";
  readonly changed: boolean;
  readonly frames: readonly KpEquationNativeFitFrame[];
}

interface KpEquationNativeFitCacheEntry {
  readonly signature: string;
  readonly frames: readonly KpEquationNativeFitFrame[];
}

const nativeFitCache = new WeakMap<HTMLElement, KpEquationNativeFitCacheEntry>();

export function computeKpEquationNativeFitFont(
  input: KpEquationNativeFitInput
): Omit<KpEquationNativeFitFrame, "transitionId"> {
  const minimumFontPx = input.minimumFontPx ?? 10;
  const safetyRatio = input.safetyRatio ?? 0.985;
  for (const [label, value] of [
    ["baseline font", input.baselineFontPx],
    ["available width", input.availableWidth],
    ["natural width", input.naturalWidth],
    ["minimum font", minimumFontPx],
    ["safety ratio", safetyRatio]
  ] as const) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(`Equation native fit ${label} must be positive and finite.`);
    }
  }
  if (safetyRatio > 1) {
    throw new Error("Equation native fit safety ratio cannot exceed one.");
  }

  const requiredScale = Math.min(1, input.availableWidth / input.naturalWidth);
  const safeScale = requiredScale < 1
    ? requiredScale * safetyRatio
    : 1;
  const fittedFontPx = Math.min(
    input.baselineFontPx,
    Math.max(minimumFontPx, input.baselineFontPx * safeScale)
  );
  const scale = fittedFontPx / input.baselineFontPx;

  return {
    baselineFontPx: input.baselineFontPx,
    fittedFontPx: roundFitValue(fittedFontPx),
    scale: roundFitValue(scale),
    constrained: fittedFontPx === minimumFontPx && safeScale < scale
  };
}

export function syncKpEquationNativeFit(
  stage: HTMLElement
): KpEquationNativeFitResult {
  const signature = [
    stage.dataset["kpEditorEquationContentKey"] ?? "unknown",
    stage.clientWidth,
    document.fonts?.status ?? "font-status-unavailable"
  ].join(":");
  const cached = nativeFitCache.get(stage);
  if (cached?.signature === signature) {
    return {
      kind: "equation-native-fit-result",
      changed: false,
      frames: cached.frames
    };
  }

  const transitions = [
    ...stage.querySelectorAll<HTMLElement>(
      ".editor-equation-stage__transition"
    )
  ];
  const previousFonts = new Map(transitions.map((transition) => [
    transition,
    transition.style.getPropertyValue("--kp-editor-equation-fit-font-size")
  ]));
  transitions.forEach((transition) => {
    transition.style.removeProperty("--kp-editor-equation-fit-font-size");
  });
  const frames = transitions.flatMap<KpEquationNativeFitFrame>((transition) => {
    const objects = [
      ...transition.querySelectorAll<HTMLElement>(
        ".editor-equation-stage__object"
      )
    ];
    if (objects.length === 0) return [];
    const baselineFontPx = Math.max(...objects.map((object) =>
      Number.parseFloat(getComputedStyle(object).fontSize)
    ));
    const ratios = objects.map((object) => {
      const style = getComputedStyle(object);
      const horizontalPadding =
        Number.parseFloat(style.paddingLeft) +
        Number.parseFloat(style.paddingRight);
      const renderedLines = [
        ...object.querySelectorAll<HTMLElement>(".katex-display > .katex")
      ];
      // Visible overflow makes the grid item's scrollWidth collapse to its
      // allocated track; the inline KaTeX line retains the natural ink width.
      const renderedLineWidth = Math.max(
        0,
        ...renderedLines.map((line) => line.getBoundingClientRect().width)
      );
      return {
        availableWidth: Math.max(1, object.clientWidth - horizontalPadding),
        naturalWidth: Math.max(
          1,
          object.scrollWidth - horizontalPadding,
          renderedLineWidth
        )
      };
    });
    const mostConstrained = ratios.reduce((selected, candidate) =>
      candidate.availableWidth / candidate.naturalWidth <
        selected.availableWidth / selected.naturalWidth
        ? candidate
        : selected
    );
    const fit = computeKpEquationNativeFitFont({
      baselineFontPx,
      ...mostConstrained
    });
    transition.style.setProperty(
      "--kp-editor-equation-fit-font-size",
      `${fit.fittedFontPx}px`
    );
    transition.dataset["kpEditorEquationNativeFitScale"] = String(fit.scale);
    transition.dataset["kpEditorEquationNativeFitMode"] = fit.constrained
      ? "minimum-constrained"
      : fit.scale < 1
        ? "fitted"
        : "native";
    return [{
      transitionId:
        transition.dataset["kpEditorEquationTransitionId"] ?? "unknown",
      ...fit
    }];
  });
  const changed = transitions.some((transition) =>
    previousFonts.get(transition) !==
      transition.style.getPropertyValue("--kp-editor-equation-fit-font-size")
  );

  nativeFitCache.set(stage, { signature, frames });
  return {
    kind: "equation-native-fit-result",
    changed,
    frames
  };
}

export function invalidateKpEquationNativeFit(stage: HTMLElement): void {
  nativeFitCache.delete(stage);
}

function roundFitValue(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
