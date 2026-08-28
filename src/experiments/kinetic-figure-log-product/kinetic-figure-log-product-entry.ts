import "katex/dist/katex.min.css";
import "../../styles.css";
import "./kinetic-figure-log-product.css";

import { createKpEditorAnimationLibrary } from
  "../../editor/animation-library.ts";
import {
  dispatchKpEditorAnimationPlaybackAction,
  disposeKpEditorAnimationPlayers,
  hydrateKpEditorAnimationPlayers,
  KP_EDITOR_ANIMATION_FRAME_EVENT
} from "../../editor/animation-player-controller.ts";
import { renderKpEditorAnimationPlayerShell } from
  "../../editor/animation-player-shell.ts";
import {
  hydrateKpEditorAnimationSurfaces,
  kpEditorAnimationSurfaceAdapterRegistry
} from "../../editor/animation-surface-adapter-registry.ts";
import { registerKpEditorLogProductSurfaceCapability } from
  "../../editor/log-product-surface-capability.ts";
import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";
import { kpCanonicalLogProductNativeEndpoints } from
  "../../rendering/log-product-native-endpoints.ts";
import { kpCanonicalLogProductFamily } from
  "../../semantic/log-product-states.ts";
import {
  kpLogProductKineticFigureStates,
  readKpLogProductKineticFigureState,
  type KpLogProductKineticFigurePose,
  type KpLogProductKineticFigureState,
  type KpLogProductKineticFigureStateId
} from "./kinetic-figure-log-product-model.ts";

const descriptorId =
  "editor-animation.animation.algebra.log-product.product-to-sum";
const poseProgress: Record<KpLogProductKineticFigurePose, number> = {
  source: 0,
  // This is the canonical log-product handoff's legible transformation pose:
  // factors have left the shared wrapper but the target has not yet settled.
  transformation: 0.48,
  target: 1
};
const progressTolerance = 0.004;

export interface KpLogProductKineticFigureSession {
  dispose(): void;
}

export function mountKpLogProductKineticFigure(input: {
  readonly root: HTMLElement;
}): KpLogProductKineticFigureSession {
  const descriptor = createKpEditorAnimationLibrary().find(
    ({ id }) => id === descriptorId
  );
  if (descriptor === undefined) {
    throw new Error(`Missing Kinetic Figure descriptor ${descriptorId}.`);
  }

  input.root.innerHTML = renderPage(descriptor);
  const article = requiredElement<HTMLElement>(
    input.root,
    "[data-kp-kinetic-figure]"
  );
  const player = requiredElement<HTMLElement>(
    article,
    "[data-kp-editor-animation-player]"
  );
  const surface = requiredElement<HTMLElement>(
    player,
    "[data-kp-editor-animation-surface-slot=\"equation\"]"
  );
  surface.innerHTML = kpCanonicalLogProductNativeEndpoints[0].nativeHtmlAndMathml;
  player.tabIndex = -1;
  player.removeAttribute("aria-keyshortcuts");

  const unregisterCapability = registerKpEditorLogProductSurfaceCapability(
    kpEditorAnimationSurfaceAdapterRegistry
  );
  hydrateKpEditorAnimationSurfaces(article);

  let active = readKpLogProductKineticFigureState(
    window.location.hash.slice(1)
  );
  let pendingTargetProgress: number | undefined;
  let disposed = false;

  const select = (
    stateId: KpLogProductKineticFigureStateId,
    options: { readonly replay?: boolean; readonly updateHash?: boolean } = {}
  ): void => {
    const next = readKpLogProductKineticFigureState(stateId);
    const replay = options.replay === true && next.id === active.id;
    active = next;
    projectReadingState(article, active);
    if (options.updateHash !== false) {
      history.replaceState(null, "", `#${active.id}`);
    }
    movePlayerToState(player, active, replay);
  };

  const movePlayerToState = (
    owner: HTMLElement,
    state: KpLogProductKineticFigureState,
    replay: boolean
  ): void => {
    if (owner.dataset["kpEditorAnimationHydrated"] !== "true") return;
    const target = poseProgress[state.pose];
    let current = Number(owner.dataset["kpEditorAnimationProgress"] ?? 0);
    if (replay && target > 0) {
      current = state.pose === "target"
        ? poseProgress.transformation
        : poseProgress.source;
      dispatchKpEditorAnimationPlaybackAction(owner, {
        type: "seek",
        progress: current
      });
    }
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      current > target ||
      Math.abs(current - target) <= progressTolerance
    ) {
      pendingTargetProgress = undefined;
      dispatchKpEditorAnimationPlaybackAction(owner, {
        type: "seek",
        progress: target
      });
      markSettled(article, state);
      return;
    }
    pendingTargetProgress = target;
    article.dataset["kpKineticFigureSettledState"] = "moving";
    dispatchKpEditorAnimationPlaybackAction(owner, {
      type: "forward",
      nowMs: performance.now()
    });
  };

  const handleFrame = (): void => {
    projectFigureAttention(player, active);
    const current = Number(player.dataset["kpEditorAnimationProgress"] ?? 0);
    if (
      pendingTargetProgress !== undefined &&
      current + progressTolerance >= pendingTargetProgress
    ) {
      const target = pendingTargetProgress;
      pendingTargetProgress = undefined;
      dispatchKpEditorAnimationPlaybackAction(player, {
        type: "seek",
        progress: target
      });
      markSettled(article, active);
      return;
    }
    if (
      pendingTargetProgress === undefined &&
      player.dataset["kpEditorAnimationHydrated"] === "true"
    ) {
      const target = poseProgress[active.pose];
      if (Math.abs(current - target) <= progressTolerance) {
        markSettled(article, active);
      } else {
        movePlayerToState(player, active, false);
      }
    }
  };
  const handleClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>(
          "[data-kp-kinetic-figure-state], [data-kp-kinetic-figure-prose-link]"
        )
      : null;
    if (target === null) return;
    const stateId = target.dataset["kpKineticFigureState"] ??
      target.dataset["kpKineticFigureProseLink"];
    if (!isStateId(stateId)) return;
    select(stateId, { replay: stateId === active.id });
  };
  const handlePointerOver = (event: PointerEvent): void => {
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>(
          "[data-kp-kinetic-figure-prose-link]"
        )
      : null;
    const stateId = target?.dataset["kpKineticFigureProseLink"];
    if (!isStateId(stateId) || stateId === active.id) return;
    select(stateId);
  };
  const handleHashChange = (): void => {
    const state = readKpLogProductKineticFigureState(
      window.location.hash.slice(1)
    );
    select(state.id, { updateHash: false });
  };

  player.addEventListener(KP_EDITOR_ANIMATION_FRAME_EVENT, handleFrame);
  article.addEventListener("click", handleClick);
  article.addEventListener("pointerover", handlePointerOver);
  window.addEventListener("hashchange", handleHashChange);
  projectReadingState(article, active);
  hydrateKpEditorAnimationPlayers(article, {
    descriptorOverrides: [descriptor]
  });

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      player.removeEventListener(KP_EDITOR_ANIMATION_FRAME_EVENT, handleFrame);
      article.removeEventListener("click", handleClick);
      article.removeEventListener("pointerover", handlePointerOver);
      window.removeEventListener("hashchange", handleHashChange);
      disposeKpEditorAnimationPlayers(article);
      unregisterCapability();
    }
  };
}

function projectReadingState(
  article: HTMLElement,
  state: KpLogProductKineticFigureState
): void {
  article.dataset["kpKineticFigureActiveState"] = state.id;
  article.querySelectorAll<HTMLElement>("[data-kp-kinetic-figure-state]")
    .forEach((button) => {
      const active = button.dataset["kpKineticFigureState"] === state.id;
      button.toggleAttribute("aria-current", active);
    });
  article.querySelectorAll<HTMLElement>("[data-kp-kinetic-figure-prose-link]")
    .forEach((phrase) => {
      const focused = phrase.dataset["kpKineticFigureProseLink"] === state.id;
      phrase.dataset["kpSemanticSalienceLevel"] = focused
        ? "focus"
        : "context";
      phrase.setAttribute("aria-pressed", String(focused));
    });
  const status = requiredElement<HTMLElement>(
    article,
    "[data-kp-kinetic-figure-state-label]"
  );
  status.replaceChildren(document.createTextNode(
    `${state.ordinal} · ${state.label}`
  ));
}

function projectFigureAttention(
  player: HTMLElement,
  state: KpLogProductKineticFigureState
): void {
  player.querySelectorAll<HTMLElement>("[data-kp-kinetic-figure-attention]")
    .forEach((element) => delete element.dataset["kpKineticFigureAttention"]);
  const semanticId = state.attentionTargetId ===
      "semantic.log-product.product"
    ? kpCanonicalLogProductFamily.sourceProductSemanticId
    : state.attentionTargetId === "semantic.log-product.sum"
      ? kpCanonicalLogProductFamily.targetSumSemanticId
      : undefined;
  if (semanticId === undefined) return;
  player.querySelectorAll<HTMLElement>(
    `[data-kp-semantic-identity-id="${CSS.escape(semanticId)}"]`
  ).forEach((element) => {
    element.dataset["kpKineticFigureAttention"] = "focus";
  });
}

function markSettled(
  article: HTMLElement,
  state: KpLogProductKineticFigureState
): void {
  article.dataset["kpKineticFigureSettledState"] = state.id;
}

function renderPage(
  descriptor: ReturnType<typeof createKpEditorAnimationLibrary>[number]
): string {
  const inline = (latex: string): string => renderLatexToHtml(latex, {
    displayMode: false,
    output: "htmlAndMathml"
  });
  return `
    <main class="kp-kinetic-figure-page">
      <article class="kp-kinetic-figure-article">
        <header class="kp-kinetic-figure-article__header">
          <p class="kp-kinetic-figure-article__eyebrow">Kinetic Figure study</p>
          <h1>Reading a logarithm law</h1>
          <p>One paragraph holds the explanation. The figure below acts as a local microscope for the part you are reading.</p>
        </header>
        <section class="kp-kinetic-figure" data-kp-kinetic-figure data-kp-kinetic-figure-model="paragraph-stateful.v1">
          <p class="kp-kinetic-figure__paragraph">
            <button type="button" data-kp-kinetic-figure-prose-link="whole">Logarithms turn multiplication into addition.</button>
            In ${inline("\\ln(xy)")},
            <button type="button" data-kp-kinetic-figure-prose-link="product">the two factors initially occur together</button>
            inside the logarithm. The product law
            <button type="button" data-kp-kinetic-figure-prose-link="transform">separates them</button>,
            <button type="button" data-kp-kinetic-figure-prose-link="result">giving ${inline("\\ln(x)+\\ln(y)")}.</button>
          </p>
          <figure class="kp-kinetic-figure__figure" aria-labelledby="kinetic-figure-caption">
            <figcaption id="kinetic-figure-caption" class="kp-kinetic-figure__caption">
              <span data-kp-kinetic-figure-state-label aria-live="polite">1 · See the whole expression</span>
              <span>Product law</span>
            </figcaption>
            <div class="kp-kinetic-figure__stage">
              ${renderKpEditorAnimationPlayerShell({ descriptor, chrome: "catalogue" })}
            </div>
            <nav class="kp-kinetic-figure__states" aria-label="Conceptual states">
              ${kpLogProductKineticFigureStates.map((state) => `
                <button type="button" data-kp-kinetic-figure-state="${state.id}" aria-label="State ${state.ordinal}: ${state.label}">${state.ordinal}</button>
              `).join("")}
            </nav>
          </figure>
        </section>
        <p class="kp-kinetic-figure-article__afterword">
          The numbered states are reading positions, not timestamps. You can return to the paragraph without losing the surrounding argument.
        </p>
      </article>
    </main>
  `;
}

function isStateId(
  value: string | undefined
): value is KpLogProductKineticFigureStateId {
  return kpLogProductKineticFigureStates.some(({ id }) => id === value);
}

function requiredElement<T extends Element>(
  root: ParentNode,
  selector: string
): T {
  const element = root.querySelector<T>(selector);
  if (element === null) throw new Error(`Missing Kinetic Figure ${selector}.`);
  return element;
}
