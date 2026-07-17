import {
  createKpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatexSegment
} from "../rendering/selector-annotated-latex.ts";

interface ExponentRadicalState {
  readonly objectId: string;
  readonly selectors: readonly {
    readonly id: string;
    readonly label?: string | undefined;
  }[];
}

export function createKpExponentRadicalSelectorAnnotatedLatex(
  state: ExponentRadicalState
): KpSelectorAnnotatedLatex | undefined {
  const exponent = state.objectId.startsWith("expression.generated.exponent.");
  const radical = state.objectId.startsWith("expression.generated.radical.");
  if (!exponent && !radical) return undefined;

  const structuralSuffixes = new Set([
    "exponent-fraction-line",
    "radical-hook",
    "radical-overbar"
  ]);
  const semanticSelectors = state.selectors.filter(
    (selector) => !structuralSuffixes.has(suffix(state, selector.id))
  );
  const bySuffix = new Map(
    semanticSelectors.map((selector) => [suffix(state, selector.id), selector])
  );
  const segment = (name: string): KpSelectorAnnotatedLatexSegment => {
    const selector = bySuffix.get(name);
    if (selector === undefined || selector.label === undefined) {
      throw new Error(`${state.objectId} is missing labeled selector ${name}.`);
    }
    return { kind: "selector", selectorId: selector.id, latex: selector.label };
  };

  let segments: readonly KpSelectorAnnotatedLatexSegment[];
  if (state.objectId.endsWith(".initial")) {
    segments = [
      segment("base"),
      { kind: "latex", latex: "^{" },
      segment("exponent"),
      { kind: "latex", latex: "}" }
    ];
  } else if (state.objectId.endsWith(".lowered")) {
    segments = [
      segment("factor-1"), gap(), segment("times-1"), gap(),
      segment("residual-base"),
      { kind: "latex", latex: "^{" },
      segment("residual-exponent"),
      { kind: "latex", latex: "}" }
    ];
  } else if (state.objectId.endsWith(".expanded")) {
    segments = state.selectors.flatMap((selector, index) => [
      ...(index === 0 ? [] : [gap()]),
      segment(suffix(state, selector.id))
    ]);
  } else if (state.objectId.endsWith(".power")) {
    segments = [
      segment("base"),
      { kind: "latex", latex: "^{\\frac{" },
      segment("exponent-numerator"),
      { kind: "latex", latex: "}{" },
      segment("exponent-denominator"),
      { kind: "latex", latex: "}}" }
    ];
  } else if (state.objectId.endsWith(".radical")) {
    const rootIndex = bySuffix.get("root-index");
    const radicandExponent = bySuffix.get("radicand-exponent");
    segments = [
      { kind: "latex", latex: rootIndex === undefined ? "\\sqrt{" : "\\sqrt[" },
      ...(rootIndex === undefined
        ? []
        : [segment("root-index"), { kind: "latex" as const, latex: "]{" }]),
      segment("radicand"),
      ...(radicandExponent === undefined
        ? []
        : [
            { kind: "latex" as const, latex: "^{" },
            segment("radicand-exponent"),
            { kind: "latex" as const, latex: "}" }
          ]),
      { kind: "latex", latex: "}" }
    ];
  } else {
    return undefined;
  }

  return createKpSelectorAnnotatedLatex({
    id: `exponent-radical.${state.objectId}`,
    expectedSelectorIds: semanticSelectors.map((selector) => selector.id),
    segments
  });
}

export function bindKpExponentRadicalStructuralMotionIds(input: {
  readonly root: HTMLElement;
  readonly states: readonly ExponentRadicalState[];
}): Readonly<Record<string, string>> {
  const motionIds: Record<string, string> = {};
  for (const state of input.states) {
    const object = input.root.querySelector<HTMLElement>(
      `[data-kp-editor-equation-object-id="${CSS.escape(state.objectId)}"]`
    );
    if (object === null) continue;
    const radicalFragments = state.objectId.endsWith(".radical")
      ? ensureRadicalFragmentElements(object)
      : undefined;
    for (const selector of state.selectors) {
      const name = suffix(state, selector.id);
      const element = name === "exponent-fraction-line"
        ? object.querySelector<HTMLElement>(".frac-line")
        : name === "radical-hook"
          ? radicalFragments?.hook ?? null
          : name === "radical-overbar"
            ? radicalFragments?.overbar ?? null
          : null;
      if (element === null) continue;
      const motionId = `exponent-radical.${state.objectId}.${selector.id}`;
      element.dataset["kpMotionId"] = motionId;
      motionIds[selector.id] = motionId;
    }
  }
  return motionIds;
}

function ensureRadicalFragmentElements(object: HTMLElement): {
  readonly hook: HTMLElement;
  readonly overbar: HTMLElement;
} | undefined {
  const existingHook = object.querySelector<HTMLElement>(
    '[data-kp-radical-structural-fragment="hook"]'
  );
  const existingOverbar = object.querySelector<HTMLElement>(
    '[data-kp-radical-structural-fragment="overbar"]'
  );
  if (existingHook !== null && existingOverbar !== null) {
    return { hook: existingHook, overbar: existingOverbar };
  }
  const hideTail = object.querySelector<HTMLElement>(".hide-tail");
  if (hideTail === null || hideTail.parentElement === null) return undefined;

  // KaTeX emits the hook and overbar as one SVG, so split visual owners here
  // while keeping the native inline box and each semantic fragment addressable.
  const stack = document.createElement("span");
  stack.className = "kp-radical-structural-fragment-stack";
  stack.style.display = "inline-block";
  stack.style.position = "relative";
  stack.style.minWidth = hideTail.style.minWidth;
  stack.style.width = hideTail.style.minWidth;
  stack.style.height = hideTail.style.height;
  stack.style.overflow = "visible";

  hideTail.parentElement.replaceChild(stack, hideTail);
  hideTail.dataset["kpRadicalNativeVisual"] = "true";
  hideTail.style.position = "absolute";
  hideTail.style.inset = "0";
  hideTail.style.display = "inline-block";
  const hook = radicalFragmentAnchor("hook");
  const overbar = radicalFragmentAnchor("overbar");
  stack.append(hideTail, hook, overbar);
  return { hook, overbar };
}

function radicalFragmentAnchor(role: "hook" | "overbar"): HTMLElement {
  const anchor = document.createElement("span");
  anchor.className =
    `kp-radical-structural-fragment kp-radical-structural-fragment--${role}`;
  anchor.dataset["kpRadicalStructuralFragment"] = role;
  anchor.style.position = "absolute";
  anchor.style.inset = "0";
  anchor.style.display = "inline-block";
  anchor.style.pointerEvents = "none";
  // Fragment anchors inherit the radical's structural-crop contract even
  // though the native KaTeX SVG remains the visual source for exact ink.
  anchor.style.overflow = "hidden";
  return anchor;
}

function suffix(state: ExponentRadicalState, selectorId: string): string {
  return selectorId.slice(state.objectId.length + 1);
}

function gap(): KpSelectorAnnotatedLatexSegment {
  return { kind: "latex", latex: "\\;" };
}
