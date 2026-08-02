import type {
  KpAnimationCatalogueOverlay
} from "./animation-catalogue-host-view-model.ts";

export type KpAnimationCatalogueFocusSnapshot = Readonly<{
  element: HTMLElement;
  target:
    | { kind: "player" }
    | { kind: "inspector-view" }
    | { kind: "tuning"; tuning: string }
    | { kind: "row"; animationId: string };
}>;

export function toggleKpAnimationCatalogueOverlay(
  button: HTMLButtonElement
): KpAnimationCatalogueOverlay | undefined {
  const shell = button.closest<HTMLElement>("[data-kp-animation-catalogue]");
  const target = button.dataset["kpAnimationCatalogueOverlayTarget"];
  if (shell === null || (target !== "rail" && target !== "inspector")) return;
  const next = shell.dataset["kpAnimationCatalogueOverlay"] === target
    ? undefined
    : target;
  if (next === undefined) delete shell.dataset["kpAnimationCatalogueOverlay"];
  else shell.dataset["kpAnimationCatalogueOverlay"] = next;
  syncOverlayButtons(shell, next);
  if (next !== undefined) {
    const panel = shell.querySelector<HTMLElement>(
      next === "rail" ? "#kp-animation-catalogue-rail" :
        "#kp-animation-catalogue-inspector"
    );
    setTimeout(() => panel?.querySelector<HTMLElement>(
      "input, select, button, a"
    )?.focus(), 0);
  }
  return next;
}

export function closeKpAnimationCatalogueOverlay(
  target: EventTarget | null
): boolean {
  if (!(target instanceof Element)) return false;
  const shell = target.closest<HTMLElement>("[data-kp-animation-catalogue]");
  if (shell === null ||
    shell.dataset["kpAnimationCatalogueOverlay"] === undefined) return false;
  const openTarget = shell.dataset["kpAnimationCatalogueOverlay"];
  delete shell.dataset["kpAnimationCatalogueOverlay"];
  syncOverlayButtons(shell, undefined);
  shell.querySelector<HTMLButtonElement>(
    `[data-kp-animation-catalogue-overlay-target="${openTarget}"]`
  )?.focus();
  return true;
}

export function captureKpAnimationCatalogueFocus(
  shell: HTMLElement
): KpAnimationCatalogueFocusSnapshot | undefined {
  const element = document.activeElement;
  if (!(element instanceof HTMLElement) || !shell.contains(element)) return;
  if (element.closest("[data-kp-editor-animation-player]") !== null) {
    return { element, target: { kind: "player" } };
  }
  if (element.dataset["action"] === "select-animation-catalogue-inspector") {
    return { element, target: { kind: "inspector-view" } };
  }
  const tuning = element.dataset["kpAnimationCatalogueTuning"];
  if (tuning !== undefined) {
    return { element, target: { kind: "tuning", tuning } };
  }
  const row = element.closest<HTMLElement>("[data-kp-animation-catalogue-row]");
  const animationId = row?.dataset["kpAnimationCatalogueRow"];
  return animationId === undefined
    ? undefined
    : { element, target: { kind: "row", animationId } };
}

export function restoreKpAnimationCatalogueFocus(
  shell: HTMLElement,
  snapshot: KpAnimationCatalogueFocusSnapshot | undefined
): void {
  if (snapshot === undefined || document.activeElement === snapshot.element) {
    return;
  }
  if (
    document.activeElement !== document.body &&
    document.activeElement !== shell.closest("#app")
  ) return;
  // Svelte can preserve a keyed row while the browser temporarily drops its
  // focus during surrounding reactive updates. Prefer that live node before
  // resolving a replacement for imperative full-shell rerenders.
  if (snapshot.element.isConnected) {
    snapshot.element.focus({ preventScroll: true });
    return;
  }
  const target = snapshot.target.kind === "player"
    ? shell.querySelector<HTMLElement>("[data-kp-editor-animation-player]")
    : snapshot.target.kind === "inspector-view"
      ? shell.querySelector<HTMLElement>(
          '[data-action="select-animation-catalogue-inspector"]'
        )
      : snapshot.target.kind === "tuning"
        ? shell.querySelector<HTMLElement>(
            `[data-kp-animation-catalogue-tuning="${snapshot.target.tuning}"]`
          )
        : shell.querySelector<HTMLElement>(
            `[data-kp-animation-catalogue-row="${snapshot.target.animationId}"] a`
          );
  target?.focus({ preventScroll: true });
}

export function readKpAnimationCatalogueRailScroll(
  shell: ParentNode
): number | undefined {
  return shell.querySelector<HTMLElement>(
    "[data-kp-animation-catalogue-results]"
  )?.scrollTop;
}

export function restoreKpAnimationCatalogueRailScroll(
  shell: ParentNode,
  scrollTop: number | undefined
): void {
  if (scrollTop === undefined) return;
  const viewport = shell.querySelector<HTMLElement>(
    "[data-kp-animation-catalogue-results]"
  );
  if (viewport !== null) viewport.scrollTop = scrollTop;
}

function syncOverlayButtons(
  shell: ParentNode,
  active: KpAnimationCatalogueOverlay | undefined
): void {
  shell.querySelectorAll<HTMLButtonElement>(
    '[data-action="toggle-animation-catalogue-overlay"]'
  ).forEach((button) => button.setAttribute(
    "aria-expanded",
    String(button.dataset["kpAnimationCatalogueOverlayTarget"] === active)
  ));
}
