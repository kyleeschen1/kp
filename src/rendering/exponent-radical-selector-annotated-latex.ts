import {
  createKpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatexSegment
} from "./selector-annotated-latex.ts";
import type { KpSemanticAssetObject } from "../semantic/asset.ts";

export interface KpExponentRadicalSelectorState {
  readonly objectId: string;
  readonly selectors: readonly {
    readonly id: string;
    readonly label?: string | undefined;
  }[];
}

export interface KpExponentRadicalSelectorAnnotatedLatex
  extends KpSelectorAnnotatedLatex {
  readonly structuralSelectorIds: readonly string[];
}

export type KpExponentRadicalStructuralRole =
  | "fraction-rule"
  | "radical-hook"
  | "radical-overbar";

export interface KpExponentRadicalStructuralBinding {
  readonly selectorId: string;
  readonly role: KpExponentRadicalStructuralRole;
}

const structuralSuffixes = new Set([
  "exponent-fraction-line",
  "radical-hook",
  "radical-overbar"
]);

/**
 * Pure shared projection for editor, experiment, and reader consumers. KaTeX
 * produces fraction/radical structure, so those selector IDs are returned for
 * post-render DOM binding rather than encoded as fake semantic glyph spans.
 */
export function createKpExponentRadicalSelectorAnnotatedLatex(
  state: KpExponentRadicalSelectorState
): KpExponentRadicalSelectorAnnotatedLatex | undefined {
  const exponent = state.objectId.startsWith("expression.generated.exponent.");
  const radical = state.objectId.startsWith("expression.generated.radical.");
  if (!exponent && !radical) return undefined;

  const structuralSelectors = state.selectors.filter(
    (selector) => structuralSuffixes.has(suffix(state, selector.id))
  );
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

  const annotated = createKpSelectorAnnotatedLatex({
    id: `exponent-radical.${state.objectId}`,
    expectedSelectorIds: semanticSelectors.map((selector) => selector.id),
    segments
  });
  return {
    ...annotated,
    structuralSelectorIds: structuralSelectors.map(({ id }) => id)
  };
}

export function projectKpExponentRadicalStructuralBindings(
  state: KpExponentRadicalSelectorState
): readonly KpExponentRadicalStructuralBinding[] {
  const annotated = createKpExponentRadicalSelectorAnnotatedLatex(state);
  if (annotated === undefined) return [];
  return Object.freeze(annotated.structuralSelectorIds.map((selectorId) =>
    Object.freeze({
      selectorId,
      role: structuralRole(state, selectorId)
    })
  ));
}

export function bindKpExponentRadicalStructuralAnchors(input: {
  readonly root: ParentNode;
  readonly state: KpSemanticAssetObject;
}): void {
  for (const binding of resolveStructuralElements({
    root: input.root,
    state: {
      objectId: input.state.id,
      selectors: input.state.selectors
    }
  })) {
    binding.element.dataset["kpReaderEquationAnchorId"] =
      `anchor.${binding.selectorId}`;
    binding.element.dataset["kpReaderSelectorId"] = binding.selectorId;
  }
}

export function resolveKpExponentRadicalStructuralElements(input: {
  readonly root: ParentNode;
  readonly state: KpExponentRadicalSelectorState;
}): readonly (KpExponentRadicalStructuralBinding & {
  readonly element: HTMLElement;
})[] {
  return resolveStructuralElements(input);
}

function suffix(
  state: KpExponentRadicalSelectorState,
  selectorId: string
): string {
  return selectorId.slice(state.objectId.length + 1);
}

function gap(): KpSelectorAnnotatedLatexSegment {
  return { kind: "latex", latex: "\\;" };
}

function structuralRole(
  state: KpExponentRadicalSelectorState,
  selectorId: string
): KpExponentRadicalStructuralRole {
  switch (suffix(state, selectorId)) {
    case "exponent-fraction-line":
      return "fraction-rule";
    case "radical-hook":
      return "radical-hook";
    case "radical-overbar":
      return "radical-overbar";
    default:
      throw new Error(
        `${state.objectId} has unsupported structural selector ${selectorId}.`
      );
  }
}

function resolveStructuralElements(input: {
  readonly root: ParentNode;
  readonly state: KpExponentRadicalSelectorState;
}): readonly (KpExponentRadicalStructuralBinding & {
  readonly element: HTMLElement;
})[] {
  const bindings = projectKpExponentRadicalStructuralBindings(input.state);
  const radicalFragments = bindings.some(({ role }) =>
    role === "radical-hook" || role === "radical-overbar"
  )
    ? ensureRadicalFragmentElements(input.root)
    : undefined;
  const fractionRules = [
    ...input.root.querySelectorAll<HTMLElement>(".frac-line")
  ];
  const fractionBindings = bindings.filter(
    ({ role }) => role === "fraction-rule"
  );
  if (fractionRules.length !== fractionBindings.length) {
    throw new Error(
      `State ${input.state.objectId} expected ${fractionBindings.length} ` +
      `fraction rules, received ${fractionRules.length}.`
    );
  }
  let fractionIndex = 0;
  return Object.freeze(bindings.map((binding) => {
    const element = binding.role === "fraction-rule"
      ? fractionRules[fractionIndex++]
      : binding.role === "radical-hook"
        ? radicalFragments?.hook
        : radicalFragments?.overbar;
    if (element === undefined) {
      throw new Error(
        `State ${input.state.objectId} is missing ${binding.role} structure.`
      );
    }
    return Object.freeze({ ...binding, element });
  }));
}

function ensureRadicalFragmentElements(root: ParentNode): {
  readonly hook: HTMLElement;
  readonly overbar: HTMLElement;
} | undefined {
  const existingHook = root.querySelector<HTMLElement>(
    '[data-kp-radical-structural-fragment="hook"]'
  );
  const existingOverbar = root.querySelector<HTMLElement>(
    '[data-kp-radical-structural-fragment="overbar"]'
  );
  if (existingHook !== null && existingOverbar !== null) {
    return { hook: existingHook, overbar: existingOverbar };
  }
  const hideTail = root.querySelector<HTMLElement>(".hide-tail");
  if (hideTail === null || hideTail.parentElement === null) return undefined;

  // KaTeX emits the hook and overbar as one SVG. The two inert anchors expose
  // compiler-owned structural lineage without replacing the native SVG ink.
  const stack = hideTail.ownerDocument.createElement("span");
  stack.className = "kp-radical-structural-fragment-stack";
  stack.style.display = "inline-block";
  stack.style.position = "relative";
  stack.style.minWidth = hideTail.style.minWidth;
  stack.style.width = hideTail.style.width || "100%";
  stack.style.height = hideTail.style.height;
  stack.style.overflow = "visible";

  hideTail.parentElement.replaceChild(stack, hideTail);
  hideTail.dataset["kpRadicalNativeVisual"] = "true";
  hideTail.style.position = "absolute";
  hideTail.style.inset = "0";
  hideTail.style.display = "inline-block";
  const hook = radicalFragmentAnchor(hideTail.ownerDocument, "hook");
  const overbar = radicalFragmentAnchor(hideTail.ownerDocument, "overbar");
  stack.append(hideTail, hook, overbar);
  return { hook, overbar };
}

function radicalFragmentAnchor(
  ownerDocument: Document,
  role: "hook" | "overbar"
): HTMLElement {
  const anchor = ownerDocument.createElement("span");
  anchor.className =
    `kp-radical-structural-fragment kp-radical-structural-fragment--${role}`;
  anchor.dataset["kpRadicalStructuralFragment"] = role;
  anchor.style.position = "absolute";
  anchor.style.inset = "0";
  anchor.style.display = "inline-block";
  anchor.style.pointerEvents = "none";
  anchor.style.overflow = "hidden";
  return anchor;
}
