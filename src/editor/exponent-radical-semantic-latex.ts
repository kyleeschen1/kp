import type {
  KpExponentRadicalSelectorState
} from "../rendering/exponent-radical-selector-annotated-latex.ts";

export {
  createKpExponentRadicalSelectorAnnotatedLatex
} from "../rendering/exponent-radical-selector-annotated-latex.ts";

export function bindKpExponentRadicalStructuralMotionIds(input: {
  readonly root: HTMLElement;
  readonly states: readonly KpExponentRadicalSelectorState[];
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
  // KaTeX stretches this SVG to the complete radical box. Preserve that
  // percentage contract so the wrapper does not clip the overbar to the hook.
  stack.style.width = hideTail.style.width || "100%";
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

function suffix(
  state: KpExponentRadicalSelectorState,
  selectorId: string
): string {
  return selectorId.slice(state.objectId.length + 1);
}
