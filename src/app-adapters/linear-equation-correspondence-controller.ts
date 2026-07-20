import {
  createConceptRoomCorrespondenceIndex,
  projectConceptRoomFocus,
  type KpConceptRoomCorrespondenceSurface,
  type KpConceptRoomCorrespondenceTarget
} from "../projections/public-api.ts";

export interface KpLinearEquationCorrespondenceController {
  refresh(pinnedSemanticIds: readonly string[]): void;
  dispose(): void;
}

const definitions: Readonly<Record<string, string>> = Object.freeze({
  "equation.initial": "The starting equality, 2x + 3 = 8.",
  "equation.after-subtract": "The equivalent equation after three is removed from both sides.",
  "equation.solved": "The exact solution, x = 5/2.",
  "term.two-x": "Two copies of the unknown x.",
  "term.add-three": "Three added on the left side.",
  "term.eight": "The right-side quantity, carried through the verified steps.",
  "term.zero-x": "No variable term on the right side.",
  "operation.subtract-three": "Subtract the same three from both sides to preserve equality.",
  "operation.divide-two": "Divide both sides into two equal groups.",
  "diagram.balance": "The balance is a geometric view of the same equality."
});

export function createLinearEquationCorrespondenceController(input: {
  readonly root: HTMLElement;
  readonly onPin: (semanticId: string) => void;
}): KpLinearEquationCorrespondenceController {
  let disposed = false;
  let pinnedSemanticIds: readonly string[] = [];
  let hoveredSemanticId: string | undefined;
  let keyboardSemanticId: string | undefined;
  let stickyDefinitionSemanticId: string | undefined;

  const onPointerOver = (event: PointerEvent) => {
    const target = correspondenceElement(input.root, event.target);
    if (target === undefined || target.dataset["kpCorrespondenceSemanticId"] === hoveredSemanticId) return;
    hoveredSemanticId = target.dataset["kpCorrespondenceSemanticId"];
    project();
  };
  const onPointerOut = (event: PointerEvent) => {
    const leaving = correspondenceElement(input.root, event.target);
    if (leaving === undefined) return;
    const entering = correspondenceElement(input.root, event.relatedTarget);
    if (entering?.dataset["kpCorrespondenceSemanticId"] === leaving.dataset["kpCorrespondenceSemanticId"]) return;
    hoveredSemanticId = entering?.dataset["kpCorrespondenceSemanticId"];
    project();
  };
  const onFocusIn = (event: FocusEvent) => {
    keyboardSemanticId = correspondenceElement(input.root, event.target)
      ?.dataset["kpCorrespondenceSemanticId"];
    project();
  };
  const onFocusOut = (event: FocusEvent) => {
    keyboardSemanticId = correspondenceElement(input.root, event.relatedTarget)
      ?.dataset["kpCorrespondenceSemanticId"];
    project();
  };
  const onClick = (event: MouseEvent) => {
    const target = correspondenceElement(input.root, event.target);
    const semanticId = target?.dataset["kpCorrespondenceSemanticId"];
    if (target === undefined || semanticId === undefined) return;
    stickyDefinitionSemanticId = semanticId;
    if (target.closest("a[data-kp-concept-room-link]") === null) input.onPin(semanticId);
    project();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const target = correspondenceElement(input.root, event.target);
    const semanticId = target?.dataset["kpCorrespondenceSemanticId"];
    if (target === undefined || semanticId === undefined || target.matches("a")) return;
    event.preventDefault();
    stickyDefinitionSemanticId = semanticId;
    input.onPin(semanticId);
    project();
  };

  input.root.addEventListener("pointerover", onPointerOver);
  input.root.addEventListener("pointerout", onPointerOut);
  input.root.addEventListener("focusin", onFocusIn);
  input.root.addEventListener("focusout", onFocusOut);
  input.root.addEventListener("click", onClick);
  input.root.addEventListener("keydown", onKeyDown);

  return {
    refresh(nextPinnedSemanticIds) {
      if (disposed) return;
      pinnedSemanticIds = [...new Set(nextPinnedSemanticIds)];
      if (stickyDefinitionSemanticId !== undefined && !pinnedSemanticIds.includes(stickyDefinitionSemanticId)) {
        stickyDefinitionSemanticId = undefined;
      }
      decorateTargets(input.root);
      project();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      input.root.removeEventListener("pointerover", onPointerOver);
      input.root.removeEventListener("pointerout", onPointerOut);
      input.root.removeEventListener("focusin", onFocusIn);
      input.root.removeEventListener("focusout", onFocusOut);
      input.root.removeEventListener("click", onClick);
      input.root.removeEventListener("keydown", onKeyDown);
    }
  };

  function project(): void {
    if (disposed) return;
    const elements = [...input.root.querySelectorAll<HTMLElement | SVGElement>("[data-kp-correspondence-target]")];
    const targets = elements.map((element) => targetRecord(element));
    const index = createConceptRoomCorrespondenceIndex(targets);
    const focus = projectConceptRoomFocus(index, {
      ...(hoveredSemanticId === undefined ? {} : { hoveredSemanticId }),
      ...(keyboardSemanticId === undefined ? {} : { keyboardSemanticId }),
      pinnedSemanticIds
    });
    const channels = new Map(focus.targets.map((target) => [target.id, target.channels]));
    elements.forEach((element) => {
      const activeChannels = channels.get(element.dataset["kpCorrespondenceTargetId"] ?? "") ?? [];
      element.classList.toggle("kp-role-focus-primary", activeChannels.length > 0);
      if (activeChannels.length === 0) delete element.dataset["kpFocusChannels"];
      else element.dataset["kpFocusChannels"] = activeChannels.join(" ");
    });
    updateDefinition(input.root, keyboardSemanticId ?? hoveredSemanticId ?? stickyDefinitionSemanticId);
  }
}

function decorateTargets(root: HTMLElement): void {
  const elements = [...root.querySelectorAll<HTMLElement | SVGElement>([
    "[data-kp-concept-semantic-link]",
    "[data-kp-symbolic-equation][data-kp-semantic-id]",
    "[data-kp-symbolic-token][data-kp-semantic-id]",
    "[data-kp-balance-scene][data-kp-semantic-id]",
    "[data-kp-balance-scene] [data-kp-semantic-id]"
  ].join(","))];
  const keyboardTargets = new Set<string>();
  elements.forEach((element, index) => {
    const semanticId = element instanceof HTMLAnchorElement
      ? element.dataset["kpConceptSemanticLink"]
      : element.dataset["kpSemanticId"];
    if (semanticId === undefined) return;
    const surface = correspondenceSurface(element);
    element.dataset["kpCorrespondenceTarget"] = "true";
    element.dataset["kpCorrespondenceTargetId"] = `${surface}.${semanticId}.${index}`;
    element.dataset["kpCorrespondenceSemanticId"] = semanticId;
    element.dataset["kpCorrespondenceSurface"] = surface;
    element.setAttribute("title", definitionFor(semanticId));
    element.setAttribute("aria-describedby", "kp-linear-equation-semantic-definition");
    if (!(element instanceof HTMLAnchorElement) && element.getAttribute("aria-hidden") !== "true") {
      const keyboardKey = `${surface}.${semanticId}`;
      if (!keyboardTargets.has(keyboardKey)) {
        keyboardTargets.add(keyboardKey);
        element.dataset["kpCorrespondenceKeyboardTarget"] = "true";
        element.setAttribute("tabindex", "0");
        if (!element.hasAttribute("aria-label")) {
          element.dataset["kpCorrespondenceGeneratedLabel"] = "true";
          element.setAttribute("aria-label", definitionFor(semanticId));
        }
      } else {
        delete element.dataset["kpCorrespondenceKeyboardTarget"];
        element.removeAttribute("tabindex");
        if (element.dataset["kpCorrespondenceGeneratedLabel"] === "true") {
          delete element.dataset["kpCorrespondenceGeneratedLabel"];
          element.removeAttribute("aria-label");
        }
      }
    }
  });
}

function targetRecord(element: HTMLElement | SVGElement): KpConceptRoomCorrespondenceTarget {
  return {
    id: element.dataset["kpCorrespondenceTargetId"]!,
    semanticId: element.dataset["kpCorrespondenceSemanticId"]!,
    surface: element.dataset["kpCorrespondenceSurface"] as KpConceptRoomCorrespondenceSurface
  };
}

function correspondenceSurface(element: Element): KpConceptRoomCorrespondenceSurface {
  if (element.hasAttribute("data-kp-concept-semantic-link")) return "prose";
  return element.closest("[data-kp-balance-scene]") === null ? "symbolic" : "balance";
}

function correspondenceElement(root: HTMLElement, target: EventTarget | null): HTMLElement | SVGElement | undefined {
  if (!(target instanceof Element)) return undefined;
  const element = target.closest<HTMLElement | SVGElement>("[data-kp-correspondence-target]");
  return element !== null && root.contains(element) ? element : undefined;
}

function updateDefinition(root: HTMLElement, semanticId: string | undefined): void {
  const tooltip = root.querySelector<HTMLElement>("[data-kp-concept-semantic-definition]");
  if (tooltip === null) return;
  tooltip.dataset["kpConceptSemanticDefinitionActive"] = String(semanticId !== undefined);
  tooltip.textContent = semanticId === undefined
    ? "Select a linked idea to trace it through the equation and balance."
    : definitionFor(semanticId);
}

function definitionFor(semanticId: string): string {
  return definitions[semanticId] ?? `The same ${semanticId.split(".").slice(1).join(" ")} across each representation.`;
}
