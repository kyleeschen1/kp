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
  let preview: KpLogProductKineticFigureState | undefined;
  let pendingTargetProgress: number | undefined;
  let initialProjectionPending = true;
  let disposed = false;

  const select = (
    stateId: KpLogProductKineticFigureStateId,
    options: {
      readonly animate?: boolean;
      readonly replayTransition?: boolean;
      readonly updateHash?: boolean;
    } = {}
  ): void => {
    const next = readKpLogProductKineticFigureState(stateId);
    active = next;
    preview = undefined;
    projectPreviewState(article);
    projectReadingState(article, active);
    if (options.updateHash !== false) {
      history.replaceState(null, "", `#${active.id}`);
    }
    movePlayerToState(player, active, {
      animate: options.animate !== false,
      replayTransition: options.replayTransition === true
    });
  };

  const movePlayerToState = (
    owner: HTMLElement,
    state: KpLogProductKineticFigureState,
    options: {
      readonly animate: boolean;
      readonly replayTransition: boolean;
    }
  ): void => {
    if (owner.dataset["kpEditorAnimationHydrated"] !== "true") return;
    const target = poseProgress[state.pose];
    let current = Number(owner.dataset["kpEditorAnimationProgress"] ?? 0);
    if (options.replayTransition && state.entryTransitionId !== undefined) {
      current = poseProgress.source;
      dispatchKpEditorAnimationPlaybackAction(owner, {
        type: "seek",
        progress: current
      });
    }
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !options.animate ||
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
    projectFigureAttention(player, resolveAttentionState(active, preview));
    const current = Number(player.dataset["kpEditorAnimationProgress"] ?? 0);
    if (
      initialProjectionPending &&
      player.dataset["kpEditorAnimationHydrated"] === "true"
    ) {
      initialProjectionPending = false;
      const target = poseProgress[active.pose];
      dispatchKpEditorAnimationPlaybackAction(player, {
        type: "seek",
        progress: target
      });
      markSettled(article, active);
      return;
    }
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
        movePlayerToState(player, active, {
          animate: true,
          replayTransition: false
        });
      }
    }
  };
  const handleClick = (event: MouseEvent): void => {
    const ruleToggle = event.target instanceof Element
      ? event.target.closest<HTMLButtonElement>(
          "[data-kp-kinetic-figure-rule-toggle]"
        )
      : null;
    if (ruleToggle !== null) {
      toggleRuleDisclosure(article, ruleToggle);
      return;
    }
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>(
          "[data-kp-kinetic-figure-state], [data-kp-kinetic-figure-prose-link]"
        )
      : null;
    if (target === null) return;
    const stateId = target.dataset["kpKineticFigureState"] ??
      target.dataset["kpKineticFigureProseLink"];
    if (!isStateId(stateId)) return;
    select(stateId, {
      replayTransition: stateId === "transform"
    });
  };
  const handlePointerOver = (event: PointerEvent): void => {
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>(
          "[data-kp-kinetic-figure-prose-link]"
        )
      : null;
    const stateId = target?.dataset["kpKineticFigureProseLink"];
    if (!isStateId(stateId)) return;
    preview = readKpLogProductKineticFigureState(stateId);
    projectPreviewState(article, preview);
    projectFigureAttention(player, resolveAttentionState(active, preview));
  };
  const handlePointerOut = (event: PointerEvent): void => {
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>(
          "[data-kp-kinetic-figure-prose-link]"
        )
      : null;
    if (target === null) return;
    if (
      event.relatedTarget instanceof Node &&
      target.contains(event.relatedTarget)
    ) return;
    preview = undefined;
    projectPreviewState(article);
    projectFigureAttention(player, active);
  };
  const handleFocusIn = (event: FocusEvent): void => {
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>(
          "[data-kp-kinetic-figure-prose-link]"
        )
      : null;
    if (target === null || !target.matches(":focus-visible")) return;
    const stateId = target.dataset["kpKineticFigureProseLink"];
    if (!isStateId(stateId) || stateId === active.id) return;
    select(stateId, {
      replayTransition: stateId === "transform"
    });
  };
  const handleHashChange = (): void => {
    const state = readKpLogProductKineticFigureState(
      window.location.hash.slice(1)
    );
    select(state.id, { animate: false, updateHash: false });
  };

  player.addEventListener(KP_EDITOR_ANIMATION_FRAME_EVENT, handleFrame);
  article.addEventListener("click", handleClick);
  article.addEventListener("pointerover", handlePointerOver);
  article.addEventListener("pointerout", handlePointerOut);
  article.addEventListener("focusin", handleFocusIn);
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
      article.removeEventListener("pointerout", handlePointerOut);
      article.removeEventListener("focusin", handleFocusIn);
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

function projectPreviewState(
  article: HTMLElement,
  state?: KpLogProductKineticFigureState | undefined
): void {
  if (state === undefined) {
    delete article.dataset["kpKineticFigurePreviewState"];
  } else {
    article.dataset["kpKineticFigurePreviewState"] = state.id;
  }
  article.querySelectorAll<HTMLElement>(
    "[data-kp-kinetic-figure-state], [data-kp-kinetic-figure-prose-link]"
  ).forEach((element) => {
    const stateId = element.dataset["kpKineticFigureState"] ??
      element.dataset["kpKineticFigureProseLink"];
    if (stateId === state?.id) {
      element.dataset["kpKineticFigurePreview"] = "true";
    } else {
      delete element.dataset["kpKineticFigurePreview"];
    }
  });
}

function resolveAttentionState(
  active: KpLogProductKineticFigureState,
  preview?: KpLogProductKineticFigureState | undefined
): KpLogProductKineticFigureState {
  // Preview never moves the semantic playhead. It may borrow figure salience
  // only when the linked entity already exists at the active endpoint.
  return preview?.pose === active.pose ? preview : active;
}

function projectFigureAttention(
  player: HTMLElement,
  state: KpLogProductKineticFigureState
): void {
  player.querySelectorAll<HTMLElement>("[data-kp-kinetic-figure-attention]")
    .forEach((element) => delete element.dataset["kpKineticFigureAttention"]);
  const semanticIds = state.attentionTargetId ===
      "semantic.log-product.product"
    ? [kpCanonicalLogProductFamily.sourceProductSemanticId]
    : state.attentionTargetId === "semantic.log-product.introduced-structure"
      ? [
          ...kpCanonicalLogProductFamily.factors.flatMap(({ targetWrapper }) => [
            targetWrapper.operator,
            targetWrapper.open,
            targetWrapper.close
          ]),
          ...kpCanonicalLogProductFamily.connectorSemanticIds
        ]
      : state.attentionTargetId === "semantic.log-product.sum"
        ? [kpCanonicalLogProductFamily.targetSumSemanticId]
        : [];
  for (const semanticId of semanticIds) {
    player.querySelectorAll<HTMLElement>(
      `[data-kp-semantic-identity-id="${CSS.escape(semanticId)}"]`
    ).forEach((element) => {
      element.dataset["kpKineticFigureAttention"] = "focus";
    });
  }
}

function toggleRuleDisclosure(
  article: HTMLElement,
  button: HTMLButtonElement
): void {
  const disclosure = requiredElement<HTMLElement>(
    article,
    "[data-kp-kinetic-figure-rule-disclosure]"
  );
  const expanded = button.getAttribute("aria-expanded") === "true";
  button.setAttribute("aria-expanded", String(!expanded));
  button.replaceChildren(document.createTextNode(
    expanded ? "Show product law" : "Hide product law"
  ));
  disclosure.hidden = expanded;
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
          <p class="kp-kinetic-figure-article__eyebrow">Algebra · Logarithms</p>
          <h1>Multiplicative structure inside logarithms</h1>
          <p class="kp-kinetic-figure-article__lede">Logarithm laws let us choose a form that exposes the structure we need. The value remains fixed while the notation changes.</p>
        </header>
        <section class="kp-kinetic-figure-lesson-section" aria-labelledby="products-heading">
          <h2 id="products-heading">From a product to a sum</h2>
          <p class="kp-kinetic-figure-article__body">Suppose ${inline("x>0")} and ${inline("y>0")}. When a logarithm contains a product, we can rewrite it as a sum of logarithms. This is useful when the factors are easier to reason about separately.</p>
          <section class="kp-kinetic-figure" data-kp-kinetic-figure data-kp-kinetic-figure-model="paragraph-stateful.v2">
            <p class="kp-kinetic-figure__paragraph">
              <button type="button" data-kp-kinetic-figure-prose-link="whole">Consider ${inline("\\ln(xy)")}.</button>
              Here,
              <button type="button" data-kp-kinetic-figure-prose-link="product">the factors ${inline("x")} and ${inline("y")} form one product inside a single logarithm.</button>
              Applying the product law
              <button type="button" data-kp-kinetic-figure-prose-link="transform">separates that multiplicative structure into two logarithms</button>.
              <button type="button" data-kp-kinetic-figure-prose-link="result">The rewritten form is ${inline("\\ln(x)+\\ln(y)")}.</button>
            </p>
            <figure class="kp-kinetic-figure__figure" aria-labelledby="kinetic-figure-caption">
              <figcaption id="kinetic-figure-caption" class="kp-kinetic-figure__caption">
                <span data-kp-kinetic-figure-state-label aria-live="polite">1 · Read the expression</span>
                <button type="button" data-kp-kinetic-figure-rule-toggle aria-expanded="false" aria-controls="kinetic-figure-product-law">Show product law</button>
              </figcaption>
              <div id="kinetic-figure-product-law" class="kp-kinetic-figure__rule-disclosure" data-kp-kinetic-figure-rule-disclosure hidden>
                <span>Reference</span>
                <div>${inline("\\ln(uv)=\\ln(u)+\\ln(v)")}</div>
                <p>for ${inline("u>0")} and ${inline("v>0")}</p>
              </div>
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
          <p class="kp-kinetic-figure-article__body">The rewrite does not approximate ${inline("\\ln(xy)")}; it names the same quantity in a different form. The two logarithms make each factor available for later algebraic work.</p>
        </section>
        <section class="kp-kinetic-figure-lesson-section kp-kinetic-figure-lesson-section--boundary" aria-labelledby="boundary-heading">
          <h2 id="boundary-heading">A boundary worth noticing</h2>
          <p class="kp-kinetic-figure-article__body">The product law responds to multiplication, not to every operation inside a logarithm. In general, ${inline("\\ln(x+y)\\ne\\ln(x)+\\ln(y)")}. Reading the internal structure correctly is what determines whether the rewrite is available.</p>
        </section>
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
