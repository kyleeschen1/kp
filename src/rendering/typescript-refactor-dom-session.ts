import type { KpTypeScriptRefactorMotionFrame } from
  "../animation/typescript-refactor-motion-frame.ts";
import type {
  KpTypeScriptRefactorTokenTheaterFrame,
  KpTypeScriptTheaterToken
} from "../animation/typescript-refactor-token-theater.ts";

export interface KpTypeScriptRefactorDomFrame {
  readonly motion: KpTypeScriptRefactorMotionFrame;
  readonly theater: KpTypeScriptRefactorTokenTheaterFrame;
}

/**
 * Native TypeScript source owns settled text on every host. This renderer
 * session only applies sampled paint and transit tokens, so catalogue and
 * public projections cannot drift into separate DOM animation engines.
 */
export function renderKpTypeScriptRefactorDomFrame(
  shell: HTMLElement,
  frame: KpTypeScriptRefactorDomFrame,
  accessibleTitle: string
): void {
  const { motion, theater } = frame;
  shell.dataset["kpTypeScriptRefactorStage"] = motion.stage.stageId;
  shell.dataset["kpTypescriptActiveProjection"] =
    motion.accessibleProjectionId;
  shell.dataset["kpTypescriptMotionMode"] =
    motion.reducedMotion ? "reduced" : "full";
  shell.dataset["kpTypescriptTokenTheaterActive"] = String(theater.active);
  if (theater.activeTrackId === undefined) {
    delete shell.dataset["kpTypescriptMotionTrack"];
  } else {
    shell.dataset["kpTypescriptMotionTrack"] = theater.activeTrackId;
  }
  shell.querySelectorAll<HTMLElement>("[data-kp-typescript-projection-id]")
    .forEach((node) => {
      const projection = motion.projections.find(
        ({ id }) => id === node.dataset["kpTypescriptProjectionId"]
      );
      if (projection === undefined) return;
      const current = projection.id === motion.accessibleProjectionId;
      node.dataset["kpTypescriptProjectionCurrent"] = String(current);
      node.dataset["kpTypescriptProjectionVisible"] =
        String(projection.opacity > 0);
      node.style.setProperty(
        "--kp-typescript-revision-opacity",
        String(theater.active ? 0 : projection.opacity)
      );
      node.style.setProperty(
        "--kp-typescript-revision-scale",
        String(projection.scale)
      );
      node.style.pointerEvents = current ? "auto" : "none";
      node.toggleAttribute("inert", !current);
      if (current) node.removeAttribute("aria-hidden");
      else node.setAttribute("aria-hidden", "true");
    });
  syncTokenTheater(shell, theater);
  const focus = new Set(motion.stage.focusSelectorIds);
  shell.querySelectorAll<HTMLElement>("[data-kp-typescript-selector-id]")
    .forEach((node) => {
      const focused = focus.has(
        node.dataset["kpTypescriptSelectorId"] ?? ""
      );
      node.dataset["kpTypescriptFocus"] = String(focused);
      node.style.setProperty(
        "--kp-typescript-focus-strength",
        String(focused ? motion.focusStrength : 0)
      );
      node.style.setProperty(
        "--kp-typescript-focus-percent",
        `${focused ? motion.focusStrength * 100 : 0}%`
      );
      node.style.setProperty(
        "--kp-typescript-focus-shadow-alpha",
        String(focused ? motion.focusStrength * 0.18 : 0)
      );
    });
  shell.querySelector<HTMLElement>("[data-kp-typescript-narration]")
    ?.replaceChildren(shell.ownerDocument.createTextNode(
      motion.stage.narration
    ));
  const description = `${accessibleTitle}. ${motion.stage.narration}`;
  shell.setAttribute("aria-label", description);
  shell.querySelector<HTMLElement>("[data-kp-typescript-accessible-state]")
    ?.replaceChildren(shell.ownerDocument.createTextNode(description));
}

function syncTokenTheater(
  shell: HTMLElement,
  theater: KpTypeScriptRefactorTokenTheaterFrame
): void {
  const layer = shell.querySelector<HTMLElement>(
    "[data-kp-typescript-token-theater]"
  );
  if (layer === null) return;
  layer.dataset["kpTypescriptTokenTheaterActive"] = String(theater.active);
  layer.style.setProperty(
    "--kp-typescript-theater-lines",
    String(theater.maxLineCount)
  );
  if (!theater.active) {
    layer.replaceChildren();
    return;
  }
  const nodes = new Map(
    [...layer.querySelectorAll<HTMLElement>("[data-kp-typescript-token-id]")]
      .map((node) => [node.dataset["kpTypescriptTokenId"] ?? "", node] as const)
  );
  const retained = new Set<string>();
  theater.tokens.forEach((token) => {
    let node = nodes.get(token.id);
    if (node === undefined) {
      node = createTokenNode(layer.ownerDocument, token);
      layer.append(node);
    }
    retained.add(token.id);
    syncTokenNode(node, token);
  });
  nodes.forEach((node, id) => {
    if (!retained.has(id)) node.remove();
  });
}

function createTokenNode(
  document: Document,
  token: KpTypeScriptTheaterToken
): HTMLElement {
  const node = document.createElement("span");
  node.dataset["kpTypescriptTokenId"] = token.id;
  node.textContent = token.text;
  return node;
}

function syncTokenNode(
  node: HTMLElement,
  token: KpTypeScriptTheaterToken
): void {
  node.dataset["kpTypescriptTokenKind"] = token.kind;
  node.dataset["kpTypescriptTokenRole"] = token.role;
  node.dataset["kpTypescriptTokenEntityId"] = token.entityId;
  node.style.setProperty("--kp-typescript-token-x", `${token.xCh}ch`);
  node.style.setProperty(
    "--kp-typescript-token-y",
    `${token.yLine * 1.75}em`
  );
  node.style.setProperty(
    "--kp-typescript-token-opacity",
    String(token.opacity)
  );
  node.style.setProperty("--kp-typescript-token-scale", String(token.scale));
}
