import "./style.css";
import { renderKpFocusDeckScaffold } from "../focus-deck-scaffold.ts";
import { restoreKpReaderAuthoringDistributionPreview } from "../../reader/app/authoring-distribution-preview.ts";
import { mountKpCanonicalEquationStageShell } from "../../reader/app/canonical-equation-stage-shell.ts";
import { createKpChromeFreeCanonicalEquationSession } from "../../reader/app/chrome-free-canonical-equation-session.ts";
import { bindKpReaderEquationLessonStructuralAnchors } from "../../reader/app/equation-lesson-descriptor.ts";
import { fractionCompositionDescriptor } from "../../reader/app/equation-lesson-descriptors/fraction-composition.ts";
import { resolveKpReaderEquationPresentationProfile } from "../../reader/document/equation-presentation.ts";
import { planKpFractionCompositionLayout } from "../../reader/runtime/fraction-composition-layout.ts";
import { createKpFractionCompositionSalienceReaderCapability } from "../../reader/app/fraction-composition-salience-adapter.ts";
import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import { compileKpAnimationTransformationPhaseCohorts } from "../../animation/transformation-phase-cohorts.ts";

const root = document.querySelector<HTMLElement>("#distribution-card")!;
const reportGap = (error: unknown) => {
  root.dataset["kpDistributionRepairGap"] = "true";
  const message = root.querySelector('[role="alert"]') ?? document.createElement("p");
  message.setAttribute("role", "alert");
  message.textContent = `Unable to render the authored distribution: ${error instanceof Error ? error.message : String(error)}`;
  root.append(message);
};
const beats = [
  { slug: "factored", title: "One factor, two terms", html: "<p>The fraction multiplies the whole sum. Follow the same factor as it reaches both terms.</p>" },
  { slug: "distributed", title: "Multiply both terms", html: "<p>Each term now has the factor two-thirds. Distribution changes the structure, not the value of the expression.</p>" }
] as const;

async function mount() {
  const response = await fetch("/api/dev/authoring-structural/distribution-focus-card", { cache: "no-store" });
  if (!response.ok) throw new Error("kp.authoring.distribution-card.preparation-gap");
  const data: unknown = await response.json();
  const { animation, beforeVersionId, afterVersionId } = restoreKpReaderAuthoringDistributionPreview(data);
  if (typeof (data as { stageTemplate?: unknown }).stageTemplate !== "string") throw new Error("kp.authoring.distribution-card.template-gap");
  const templateContainer = document.createElement("div");
  templateContainer.innerHTML = (data as { stageTemplate: string }).stageTemplate;
  const template = templateContainer.querySelector<HTMLTemplateElement>("template[data-kp-reader-exemplar-template]");
  if (!template) throw new Error("kp.authoring.distribution-card.template-gap");
  const cohorts = compileKpAnimationTransformationPhaseCohorts(animation);
  const durationMs = animation.timeline?.durationMs;
  if (cohorts[0]?.id !== "fraction-solve.step.distribute" || durationMs === undefined) throw new Error("kp.authoring.distribution-card.range-gap");
  // The card selects the first canonical operation window; it does not retime
  // the animation or reconstruct a replacement distribution asset.
  const end = 1 / cohorts.length;
  root.innerHTML = `<h1>Fraction distribution</h1><p class="source-label">Authoring-backed Focus Card · verified distribution</p>` +
    renderKpFocusDeckScaffold({ id: "authoring-distribution", ariaLabel: "Distribute a fractional factor", activeBeatSlug: "factored",
      headerTrailingHtml: "<span>One factor · two terms</span>", stageHtml: '<div class="kp-focus-deck__stage" data-distribution-stage></div>',
      beats, replayHidden: false, rootAttributes: { "data-kp-authoring-distribution-card": "preparing" } }) +
    '<p class="review-help">Next plays distribution. Previous rewinds. Drag the slider to inspect the motion.</p><details><summary>Authoring source and proof</summary><p>This card consumes the prepared structural authoring result through the canonical native renderer. It is not the logarithm example.</p><dl><dt>Before version</dt><dd data-before></dd><dt>After version</dt><dd data-after></dd></dl></details>';
  root.querySelector("[data-before]")!.textContent = beforeVersionId;
  root.querySelector("[data-after]")!.textContent = afterVersionId;
  const card = root.querySelector<HTMLElement>("[data-kp-focus-deck]")!;
  card.dataset["kpAuthoringStructuralBefore"] = beforeVersionId;
  card.dataset["kpAuthoringStructuralAfter"] = afterVersionId;
  const shell = mountKpCanonicalEquationStageShell({ target: card.querySelector<HTMLElement>("[data-distribution-stage]")!, template,
    bindStructuralAnchors: root => bindKpReaderEquationLessonStructuralAnchors({ root, animation, descriptor: fractionCompositionDescriptor }) });
  const salience = createKpFractionCompositionSalienceReaderCapability({ root: card, href: location.href, theme: "light" });
  // Reuse the renderer's existing source/target typography cache rather than
  // replacing computed-style clones on every late-transit sample.
  shell.transitions.forEach(transition => {
    transition.querySelector<HTMLElement>("[data-kp-reader-fit-surface]")!.dataset["kpEquationMaterialVisualCache"] = "dual-revision";
  });
  // Human-review opt-in: never change another distribution caller by asset ID.
  shell.transitions[0]!.querySelector<HTMLElement>("[data-kp-reader-fit-surface]")!.dataset["kpFractionCoherentTransportReview"] = "true";
  const session = await createKpChromeFreeCanonicalEquationSession({ shell, animation, descriptor: fractionCompositionDescriptor,
    prewarmAdjacentTransitions: false,
    equationPresentationProfile: resolveKpReaderEquationPresentationProfile("standard"), linkRoot: card,
    createStageLayoutIntent: planKpFractionCompositionLayout, renderSalience: frame => salience.render(frame) });
  const clock = createKpReaderTimelinePlaybackClock({ id: "reader.focus-card.authored-distribution", durationMs, ownerWindow: window });
  // Compile the bounded card's native endpoint and attention revisions before
  // opening interaction. Compilation must not consume the playback clock.
  let preparedRevision = "";
  let sampledRevision = "";
  const prepare = () => {
    for (const progress of [0, end / 2, end, 0]) {
      const sample = session.seek(progress);
      preparedRevision = `${sample.layoutRevision}:${sample.fontRevision}`;
    }
  };
  await document.fonts.ready;
  prepare();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const scrubber = card.querySelector<HTMLInputElement>("[data-kp-focus-deck-scrubber]")!;
  const viewport = card.querySelector<HTMLElement>("[data-kp-focus-deck-viewport]")!;
  const previous = card.querySelector<HTMLButtonElement>("[data-kp-focus-deck-previous]")!;
  const next = card.querySelector<HTMLButtonElement>("[data-kp-focus-deck-next]")!;
  let destination = 0;
  let passageIndex = -1;
  let disposed = false;
  const showPassage = (index: number) => {
    destination = index;
    if (passageIndex === index) return;
    passageIndex = index;
    card.dataset["kpFocusDeckActiveBeat"] = beats[index]!.slug;
    viewport.scrollLeft = index * viewport.clientWidth;
    card.querySelectorAll<HTMLElement>("[data-kp-focus-deck-beat]").forEach((node, i) => {
      node.dataset["kpFocusDeckBeatActive"] = String(i === index);
      if (i === index) node.setAttribute("aria-current", "page"); else node.removeAttribute("aria-current");
    });
    card.querySelector<HTMLOutputElement>("[data-kp-focus-deck-position]")!.value = beats[index]!.title;
    previous.disabled = index === 0;
    next.disabled = index === 1;
  };
  const render = () => {
    if (disposed) return;
    try {
      const sample = clock.getSnapshot();
      const result = session.sample({ clock: sample, motionMode: reduced.matches ? "essential" : "continuous" });
      sampledRevision = `${result.layoutRevision}:${result.fontRevision}`;
      card.dataset["kpDistributionProgress"] = String(sample.progress / end);
      card.dataset["kpDistributionState"] = result.accessibleEquationState;
      card.dataset["kpDistributionTransition"] = clock.getStatus() === "playing" ? "active" : "settled";
      scrubber.value = String(sample.progress / end);
      scrubber.setAttribute("aria-valuetext", `${Math.round(sample.progress / end * 100)}% distributed`);
    } catch (error) {
      clock.pause();
      card.dataset["kpAuthoringDistributionCard"] = "repair-gap";
      reportGap(error);
    }
  };
  const unsubscribe = clock.subscribe(render);
  const select = (index: number, animate: boolean) => {
    if (disposed) return;
    clock.pause();
    // Font/layout invalidation can arrive after the window resize callback.
    // Pay that setup cost before the wall-clock animation starts advancing.
    render();
    if (sampledRevision !== preparedRevision) { prepare(); render(); }
    showPassage(index);
    history.replaceState(null, "", `#beat.authoring-distribution.${beats[index]!.slug}`);
    if (!animate || reduced.matches) clock.seek(index * end);
    else clock.play({ direction: index === 1 ? "forward" : "rewind", stopAt: index * end });
  };
  previous.onclick = () => select(0, true);
  next.onclick = () => select(1, true);
  card.querySelector<HTMLButtonElement>("[data-kp-focus-deck-replay]")!.onclick = () => { clock.seek(0); select(1, true); };
  scrubber.oninput = () => { clock.seek(Number(scrubber.value) * end); showPassage(Number(scrubber.value) >= .5 ? 1 : 0); };
  // Passage navigation plays the same range as arrows; programmatic alignment must
  // not take the playhead back from the shared animation clock.
  viewport.onscroll = () => {
    const index = Math.round(viewport.scrollLeft / Math.max(1, viewport.clientWidth));
    if ((index === 0 || index === 1) && index !== destination) select(index, true);
  };
  const restore = () => select(location.hash.endsWith(".distributed") ? 1 : 0, false);
  const resize = () => { clock.pause(); session.invalidate(); prepare(); passageIndex = -1; showPassage(destination); render(); };
  const visibility = () => { if (!disposed && document.hidden) { clock.pause(); render(); } };
  const motionChange = () => { if (reduced.matches) clock.seek(destination * end); else render(); };
  window.addEventListener("hashchange", restore);
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", visibility);
  reduced.addEventListener("change", motionChange);
  // A persisted page keeps its session for browser back/forward restoration.
  const pagehide = (event: PageTransitionEvent) => { if (event.persisted) { clock.pause(); render(); } else dispose(); };
  const pageshow = (event: PageTransitionEvent) => { if (event.persisted) resize(); };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    window.removeEventListener("hashchange", restore); window.removeEventListener("resize", resize);
    window.removeEventListener("pagehide", pagehide); window.removeEventListener("pageshow", pageshow);
    document.removeEventListener("visibilitychange", visibility); reduced.removeEventListener("change", motionChange);
    unsubscribe(); clock.dispose(); session.dispose();
  };
  window.addEventListener("pagehide", pagehide);
  window.addEventListener("pageshow", pageshow);
  import.meta.hot?.dispose(dispose);
  restore();
  if (!root.dataset["kpDistributionRepairGap"]) card.dataset["kpAuthoringDistributionCard"] = "ready";
}

void mount().catch(reportGap);
