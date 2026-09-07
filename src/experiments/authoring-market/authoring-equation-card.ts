import { compileKpEquationSeriesLogarithmBaseDraft, createKpEquationSeriesLogarithmBaseDraft } from "../../authoring/equation-series-logarithm-base-draft.ts";
import { validateKpEquationTransformSeriesRequest } from "../../authoring/equation-transform-series-request.ts";
import { KP_EDITOR_ANIMATION_SURFACE_READINESS_EVENT } from "../../editor/animation-surface-readiness.ts";
import { sampleKpEquationSeriesRuntime } from "../../authoring/equation-series-runtime.ts";
import { createKpLogarithmChangeOfBaseExemplarAsset } from "../../animation/logarithm-change-of-base-exemplar.ts";
import { createKpEditorAnimationLibrary } from "../../editor/animation-library.ts";
import { renderKpEditorAnimationPlayerShell } from "../../editor/animation-player-shell.ts";
import { hydrateKpPreparedEditorAnimationPlayer, disposeKpEditorAnimationPlayer, disposeKpEditorAnimationPlayers, dispatchKpEditorAnimationPlaybackAction, KP_EDITOR_ANIMATION_FRAME_EVENT } from "../../editor/animation-player-controller.ts";
import type { KpEditorAnimationPlayerState } from "../../editor/animation-player-state.ts";
import { createKpEditorAnimationSurfaceAdapterRegistry, hydrateKpEditorAnimationSurfaces } from "../../editor/animation-surface-adapter-registry.ts";
import { registerKpEditorLogarithmChangeOfBaseSurfaceCapability } from "../../editor/logarithm-change-of-base-surface-capability.ts";
import { renderKpFocusDeckScaffold, readKpFocusDeckScrubberKeyTarget } from "../../tutorial/focus-deck-scaffold.ts";
import { compileKpArticleMarkdownFragmentHtml } from "../../article/kp-article-static-html.ts";
import "./authoring-equation-card.css";

/** One verified adjacency, composed into the shared card; not a new equation renderer. */
export function mountKpAuthoringEquationCard(root: HTMLElement) {
  const example = createKpEquationSeriesLogarithmBaseDraft();
  let compilation = compileKpEquationSeriesLogarithmBaseDraft(example);
  if (compilation.active === undefined) throw new Error("Bound equation example failed validation.");
  const animation = createKpLogarithmChangeOfBaseExemplarAsset();
  const descriptor = createKpEditorAnimationLibrary().find(item => item.animationId === animation.id);
  if (descriptor === undefined) throw new Error("Missing governed change-of-base descriptor.");
  const initialText = `${JSON.stringify(example, null, 2)}\n`;
  let displayedText = initialText;
  let disposed = false;
  let progress = 0;
  let expectedScroll = 0;
  let pending: AbortController | undefined;
  const lifetime = new AbortController();
  root.dataset["kpAuthoringEquation"] = "preparing";
  root.innerHTML = `<h2>Equation authoring · change of base</h2>
    <p>Edit the numeric base and argument in both LaTeX states, then compile. The base must be positive and not one; the argument must be positive. Leave semanticArguments empty: the compiler verifies and binds the deduction. Motion uses the canonical native-KaTeX renderer.</p>
    <details open><summary>Edit the equation request</summary><label>Equation request JSON<textarea spellcheck="false" rows="12"></textarea></label>
    <button type="button" data-kp-equation-compile>Compile equation draft</button>
    <button type="button" data-kp-equation-restore>Restore displayed request</button></details>
    <p role="status" data-kp-equation-status>Preparing verified equation.</p>
    ${renderKpFocusDeckScaffold({ id: "focus-deck.authoring.log-base.v1", ariaLabel: "Authored change-of-base Focus Card",
      activeBeatSlug: example.states[0]!.id, replayHidden: false,
      stageHtml: `<figure class="kp-focus-deck__stage">${renderKpEditorAnimationPlayerShell({ descriptor, chrome: "catalogue" })}</figure>`,
      beats: example.states.map((state, index) => ({ slug: state.id, title: index === 0 ? "Original logarithm" : "Natural-log quotient", html: "" })) })}`;
  const textarea = root.querySelector("textarea")!;
  textarea.value = initialText;
  const status = root.querySelector<HTMLElement>("[data-kp-equation-status]")!;
  const deck = root.querySelector<HTMLElement>("[data-kp-focus-deck]")!;
  let player = deck.querySelector<HTMLElement>("[data-kp-editor-animation-player]")!;
  const viewport = deck.querySelector<HTMLElement>("[data-kp-focus-deck-viewport]")!;
  const scrubber = deck.querySelector<HTMLInputElement>("[data-kp-focus-deck-scrubber]")!;
  const previous = deck.querySelector<HTMLButtonElement>("[data-kp-focus-deck-previous]")!;
  const next = deck.querySelector<HTMLButtonElement>("[data-kp-focus-deck-next]")!;
  const replay = deck.querySelector<HTMLButtonElement>("[data-kp-focus-deck-replay]")!;
  const pages = [...deck.querySelectorAll<HTMLElement>("[data-kp-focus-deck-beat]")];
  // A host-local registry avoids exclusive adapter collisions when the market
  // preview retires and remounts its own sibling cards after a source edit.
  const registry = createKpEditorAnimationSurfaceAdapterRegistry();
  let unregister = registerKpEditorLogarithmChangeOfBaseSurfaceCapability(registry);
  hydrateKpEditorAnimationSurfaces(deck, registry);
  player.tabIndex = -1;
  player.removeAttribute("aria-keyshortcuts");
  const controls = player.querySelector<HTMLElement>(".editor-animation-player__controls")!;
  controls.hidden = true;
  const updatePassages = (candidate = compilation) => {
    // Prepare every passage before committing any paint or active request.
    const fragments = candidate.active!.request.states.map((state, index) => compileKpArticleMarkdownFragmentHtml(
      state.narration ?? (index === 0 ? "Read the original logarithm and identify its base and argument." : "Express the same value as the natural log of the argument divided by the natural log of the base.")));
    fragments.forEach((html, index) => {
      pages[index]!.dataset["kpFocusDeckBeat"] = candidate.active!.request.states[index]!.id;
      pages[index]!.querySelector(".kp-focus-deck__passage-page")!.innerHTML = html;
    });
  };
  updatePassages();
  const project = (state: KpEditorAnimationPlayerState) => {
    const frame = sampleKpEquationSeriesRuntime(compilation.active!.runtime, state.runtimeFrame.clock);
    progress = frame.presentationProgress;
    deck.dataset["kpEquationSeriesRuntime"] = frame.runtimeId;
    deck.dataset["kpEquationSeriesProgress"] = String(progress);
    const index = Math.round(progress);
    deck.dataset["kpFocusDeckActiveBeat"] = compilation.active!.request.states[index]!.id;
    pages.forEach((page, pageIndex) => {
      page.dataset["kpFocusDeckBeatActive"] = String(pageIndex === index);
      if (pageIndex === index) page.setAttribute("aria-current", "page"); else page.removeAttribute("aria-current");
    });
    scrubber.value = String(progress);
    const label = `Step ${index + 1} of 2: ${index === 0 ? "Original logarithm" : "Natural-log quotient"}`;
    scrubber.setAttribute("aria-valuetext", label);
    deck.querySelector("[data-kp-focus-deck-position]")!.textContent = label;
    previous.disabled = progress <= 0;
    next.disabled = progress >= 1;
    // Continuous passage motion is a projection of this player clock. Native
    // swipes feed the same clock below; they never start a second animation.
    expectedScroll = progress * viewport.clientWidth;
    if (Math.abs(viewport.scrollLeft - expectedScroll) > 1) viewport.scrollLeft = expectedScroll;
  };
  viewport.dataset["kpFocusDeckSnapDisabled"] = "true";
  const onFrame = (event: Event) => { if (event instanceof CustomEvent) project(event.detail); };
  player.addEventListener(KP_EDITOR_ANIMATION_FRAME_EVENT, onFrame);
  const seek = (position: number) => dispatchKpEditorAnimationPlaybackAction(player, {
    type: "seek", progress: player.dataset["kpEditorAnimationDirection"] === "rewind" ? 1 - position : position
  });
  const navigate = (target: number) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) seek(target);
    else dispatchKpEditorAnimationPlaybackAction(player, { type: target === 0 ? "rewind" : "forward", nowMs: performance.now() });
  };
  previous.addEventListener("click", () => navigate(0));
  next.addEventListener("click", () => navigate(1));
  replay.addEventListener("click", () => { seek(0); navigate(1); });
  scrubber.addEventListener("input", () => seek(Number(scrubber.value)));
  deck.addEventListener("keydown", event => {
    const target = readKpFocusDeckScrubberKeyTarget(event, progress, 2);
    if (target === undefined) return;
    event.preventDefault(); event.stopPropagation(); navigate(target);
  });
  viewport.addEventListener("scroll", () => {
    if (Math.abs(viewport.scrollLeft - expectedScroll) <= 1) return;
    seek(Math.max(0, Math.min(1, viewport.scrollLeft / Math.max(1, viewport.clientWidth))));
  }, { passive: true });
  const resize = new ResizeObserver(() => {
    expectedScroll = progress * viewport.clientWidth;
    viewport.scrollLeft = expectedScroll;
  });
  resize.observe(viewport);
  textarea.addEventListener("input", () => {
    pending?.abort();
    root.dataset["kpAuthoringEquation"] = "dirty";
    status.textContent = "Uncompiled draft. Last valid equation remains displayed; compile before including it in an edition.";
  });
  root.querySelector("[data-kp-equation-compile]")!.addEventListener("click", async () => {
    pending?.abort();
    const attempt = new AbortController();
    pending = attempt;
    const draftText = textarea.value;
    let replacement: HTMLElement | undefined;
    let staging: HTMLElement | undefined;
    let release: (() => void) | undefined;
    try {
      const value: unknown = JSON.parse(draftText);
      const candidate = compileKpEquationSeriesLogarithmBaseDraft(value, compilation);
      if (candidate.status !== "compiled") {
        root.dataset["kpAuthoringEquation"] = "repair-required";
        status.textContent = `Last valid equation retained. ${candidate.repairs.map(repair => `${repair.path}: ${repair.message} [${repair.sourceCode}] Repair: ${JSON.stringify(repair.action)}`).join("\n")}`;
        return;
      }
      // Validate prose before preparing paint. A failed request must not partially
      // replace the card, and compiler-owned pins must not leak into the draft.
      candidate.active!.request.states.forEach(state => compileKpArticleMarkdownFragmentHtml(state.narration ?? ""));
      if (JSON.stringify(candidate.semantic) !== JSON.stringify(compilation.semantic)) {
        root.dataset["kpAuthoringEquation"] = "preparing";
        status.textContent = "Preparing verified replacement; the last valid equation remains displayed.";
        staging = document.createElement("div");
        staging.className = "kp-authoring-equation-staging";
        staging.setAttribute("aria-hidden", "true");
        staging.inert = true;
        staging.innerHTML = renderKpEditorAnimationPlayerShell({ descriptor, chrome: "catalogue" });
        player.parentElement!.append(staging);
        replacement = staging.querySelector<HTMLElement>("[data-kp-editor-animation-player]")!;
        replacement.tabIndex = -1;
        replacement.removeAttribute("aria-keyshortcuts");
        replacement.querySelector<HTMLElement>(".editor-animation-player__controls")!.hidden = true;
        const candidateRegistry = createKpEditorAnimationSurfaceAdapterRegistry();
        release = registerKpEditorLogarithmChangeOfBaseSurfaceCapability(candidateRegistry, candidate.semantic);
        hydrateKpEditorAnimationSurfaces(staging, candidateRegistry);
        await hydrateKpPreparedEditorAnimationPlayer({ player: replacement,
          animation: createKpLogarithmChangeOfBaseExemplarAsset(candidate.semantic), descriptor });
        await waitForSurface(replacement, attempt.signal);
        if (disposed || attempt.signal.aborted) return;
        const position = progress;
        player.removeEventListener(KP_EDITOR_ANIMATION_FRAME_EVENT, onFrame);
        disposeKpEditorAnimationPlayer(player);
        unregister();
        unregister = release;
        release = undefined;
        player.replaceWith(replacement);
        player = replacement;
        replacement = undefined;
        compilation = candidate;
        player.addEventListener(KP_EDITOR_ANIMATION_FRAME_EVENT, onFrame);
        seek(position);
      }
      updatePassages(candidate);
      compilation = candidate;
      displayedText = draftText;
      root.dataset["kpAuthoringEquation"] = "compiled";
      status.textContent = "Draft compiled and displayed. Verified change-of-base semantics; author narration is preserved, not certified as pedagogically correct. Review wording after numeric edits.";
    } catch (error) {
      if (disposed || attempt.signal.aborted) return;
      root.dataset["kpAuthoringEquation"] = "repair-required";
      const code = error instanceof SyntaxError ? "equation-series.request.json" : "equation-series.preview.failed";
      status.textContent = `Last valid equation retained. $.request [${code}]: ${error instanceof Error ? error.message : String(error)}. Repair the request and compile again.`;
    } finally {
      if (replacement !== undefined) disposeKpEditorAnimationPlayer(replacement);
      staging?.remove();
      release?.();
      if (pending === attempt) pending = undefined;
    }
  });
  root.querySelector("[data-kp-equation-restore]")!.addEventListener("click", () => {
    pending?.abort();
    textarea.value = displayedText;
    root.dataset["kpAuthoringEquation"] = "compiled";
    status.textContent = "Restored the displayed valid request into the editor; no source file changed.";
  });
  const initialPlayer = player;
  void hydrateKpPreparedEditorAnimationPlayer({ player: initialPlayer, animation, descriptor }).then(async () => {
    await waitForSurface(initialPlayer, lifetime.signal);
    if (disposed) { disposeKpEditorAnimationPlayers(deck); return; }
    if (root.dataset["kpAuthoringEquation"] === "preparing") {
      root.dataset["kpAuthoringEquation"] = "compiled";
      status.textContent = "Verified example displayed. Edit numeric operands or narration and compile; source files are unchanged.";
    }
  }).catch(error => {
    if (disposed) return;
    root.dataset["kpAuthoringEquation"] = "unavailable";
    status.textContent = `Equation player unavailable: ${String(error)}`;
  });
  return {
    reviewedRequest() {
      if (disposed || root.dataset["kpAuthoringEquation"] !== "compiled" || textarea.value !== displayedText ||
          deck.querySelector<HTMLElement>("[data-kp-logarithm-change-of-base-stage]")?.dataset["kpLogarithmChangeOfBaseStage"] !== "ready") {
        throw new Error("Compile and inspect a valid equation before including it in the selected edition.");
      }
      const authored = validateKpEquationTransformSeriesRequest(JSON.parse(displayedText));
      if (authored.status !== "accepted") throw new Error("Displayed request is invalid.");
      return structuredClone(authored.request);
    },
    dispose() {
      if (disposed) return;
      disposed = true; lifetime.abort(); pending?.abort(); resize.disconnect();
      player.removeEventListener(KP_EDITOR_ANIMATION_FRAME_EVENT, onFrame);
      disposeKpEditorAnimationPlayers(deck); unregister(); root.replaceChildren();
    }
  };
}

function waitForSurface(player: HTMLElement, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const finish = (error?: Error) => {
      clearTimeout(timeout);
      player.removeEventListener(KP_EDITOR_ANIMATION_SURFACE_READINESS_EVENT, check);
      signal.removeEventListener("abort", abort);
      if (error === undefined) resolve(); else reject(error);
    };
    const abort = () => finish(new Error("Equation preparation superseded."));
    const check = () => {
      if (signal.aborted) { abort(); return; }
      const readiness = player.dataset["kpEditorAnimationSurfaceReadiness"];
      if (readiness === "ready") finish();
      else if (readiness === "failed") finish(new Error(player.dataset["kpEditorAnimationSurfaceError"] ?? "Equation surface failed."));
    };
    // This bounds resource preparation only; motion remains owned by the player.
    const timeout = setTimeout(() => finish(new Error("Equation preparation timed out.")), 15_000);
    player.addEventListener(KP_EDITOR_ANIMATION_SURFACE_READINESS_EVENT, check);
    signal.addEventListener("abort", abort, { once: true });
    check();
  });
}
