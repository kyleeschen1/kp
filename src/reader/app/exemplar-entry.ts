import { createLinearSolveAnimationAsset } from "../../animation/linear-solve-adapter.ts";
import {
  applyKpReaderEquationResponsiveFit,
  compileKpReaderEquationMaterialPlan,
  createKpReaderEquationFrameScheduler,
  createKpReaderEquationMaterialLayer,
  measureKpReaderEquationLayoutSnapshot,
  planKpReaderEquationPerceptualAlignment,
  planKpReaderEquationResponsiveFit,
  projectKpReaderEquationRenderPlan,
  sampleKpReaderEquationSymbolMotion,
  type KpReaderEquationLayoutSnapshot,
  type KpReaderEquationMaterialLayer,
  type KpReaderEquationMaterialOwnerFrame,
  type KpReaderEquationMaterialPlan,
  type KpReaderEquationPerceptualAlignmentPlan,
  type KpReaderEquationResponsiveFitPlan
} from "../renderers/public-api.ts";
import {
  createKpReaderClockSample,
  createKpReaderContinuousScrollClock,
  createKpReaderSemanticFocusService,
  createKpReaderSessionSnapshot,
  decodeKpReaderSessionUrl,
  encodeKpReaderSessionUrl,
  sampleKpReaderAnimationFrame,
  type KpReaderClockSample,
  type KpReaderContinuousScrollClock
} from "../runtime/public-api.ts";

interface TransitionContext {
  readonly id: string;
  readonly element: HTMLElement;
  readonly fitSurface: HTMLElement;
  readonly measurementRoot: HTMLElement;
  readonly materialPlan: KpReaderEquationMaterialPlan;
  readonly materialLayer: KpReaderEquationMaterialLayer;
  readonly anchorElements: ReadonlyMap<string, HTMLElement>;
  readonly layout: KpReaderEquationLayoutSnapshot;
  readonly alignment: KpReaderEquationPerceptualAlignmentPlan;
  readonly fit: KpReaderEquationResponsiveFitPlan;
}

interface LayoutState {
  readonly contexts: ReadonlyMap<string, TransitionContext>;
}

const documentId = "lesson.solve-x.x-plus-3";
const documentVersion = "1";
const animation = createLinearSolveAnimationAsset();
const story = requireElement<HTMLElement>("[data-kp-asset]");
const staticSurface = requireElement<HTMLElement>("[data-kp-animation-static]");
const template = requireElement<HTMLTemplateElement>("template[data-kp-reader-exemplar-template]");
const templateContent = template.content.cloneNode(true);
staticSurface.append(templateContent);
document.body.dataset["kpReaderHydrated"] = "true";

const stage = requireElement<HTMLElement>("[data-kp-reader-equation-stage]");
const viewport = requireElement<HTMLElement>("[data-kp-reader-equation-viewport]");
const status = requireElement<HTMLOutputElement>("[data-kp-reader-stage-status]");
const progressBar = requireElement<HTMLElement>("[data-kp-reader-progress-bar]");
const shareLink = requireElement<HTMLAnchorElement>("[data-kp-reader-share]");
const beats = [...story.querySelectorAll<HTMLElement>("[data-kp-beat]")];
const transitionElements = [
  ...stage.querySelectorAll<HTMLElement>("[data-kp-reader-transition]")
];
const allowedFocusRefs = animation.bundle.objects.flatMap((object) => [
  object.id,
  ...object.selectors.map((selector) => selector.id)
]);
const focus = createKpReaderSemanticFocusService(allowedFocusRefs);
let activeBeat = beats[0];
let scrollClock = createScrollClock();
let settleTimer: number | undefined;
let scrollFrame: number | undefined;

const staticPlans = new Map(animation.transformations.map((transformation, index) => {
  const progress = (index + 0.5) / animation.transformations.length;
  const clock = createKpReaderClockSample({ source: "scroll", progress });
  const runtimeFrame = sampleKpReaderAnimationFrame({ animation, clock });
  const renderPlan = projectKpReaderEquationRenderPlan({ animation, runtimeFrame });
  return [transformation.id, compileKpReaderEquationMaterialPlan(renderPlan)] as const;
}));
const materialLayers = new Map(transitionElements.map((element) => {
  const id = requiredData(element, "kpReaderTransition");
  const layer = requireDescendant<HTMLElement>(
    element,
    "[data-kp-reader-equation-material-layer]"
  );
  return [id, createKpReaderEquationMaterialLayer(layer)] as const;
}));

const scheduler = createKpReaderEquationFrameScheduler<
  KpReaderClockSample,
  LayoutState,
  LayoutState,
  { readonly sample: KpReaderClockSample; readonly layout: LayoutState }
>({
  readLayout: ({ revision }) => measureLayout(revision),
  planLayout: (layout) => layout,
  planFrame: ({ input, layout }) => ({ sample: input, layout }),
  writeFrame: ({ sample, layout }) => renderSample(sample, layout)
});

const unsubscribeFocus = focus.subscribe((snapshot) => {
  applyFocus(snapshot.objectRefs);
  updateShareLink(lastSample());
});
const resizeObserver = new ResizeObserver(() => {
  updateScrollGeometry();
  scheduler.invalidate("resize");
  scheduleScrollSample();
});
resizeObserver.observe(viewport);

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", updateScrollGeometry, { passive: true });
window.addEventListener("scrollend", settleLocation, { passive: true });
document.addEventListener("pointerover", onSemanticEnter);
document.addEventListener("pointerout", onSemanticLeave);
document.addEventListener("focusin", onSemanticEnter);
document.addEventListener("focusout", onSemanticLeave);
window.addEventListener("pagehide", dispose, { once: true });

void document.fonts.ready.then(() => scheduler.invalidate("fonts"));
updateScrollGeometry();
restoreUrlLocation();
scheduleScrollSample();

function createScrollClock(): KpReaderContinuousScrollClock {
  const geometry = scrollGeometry();
  return createKpReaderContinuousScrollClock({
    id: "clock.reader.solve-x.scroll",
    geometry,
    initialPositionPx: readerPosition(),
    checkpoints: beats.map((beat) => ({
      id: requiredData(beat, "kpBeat"),
      progressPermille: Number(requiredData(beat, "kpCheckpoint"))
    }))
  });
}

function updateScrollGeometry(): void {
  const geometry = scrollGeometry();
  if (scrollClock === undefined) return;
  scrollClock.updateGeometry(geometry);
}

function scrollGeometry(): { readonly startPx: number; readonly endPx: number } {
  const first = beats[0];
  const last = beats.at(-1);
  if (first === undefined || last === undefined) {
    throw new Error("The semantic reader exemplar requires explanation beats.");
  }
  const firstRect = first.getBoundingClientRect();
  const lastRect = last.getBoundingClientRect();
  const startPx = window.scrollY + firstRect.top + firstRect.height * 0.36;
  const endPx = window.scrollY + lastRect.top + lastRect.height * 0.64;
  return endPx > startPx ? { startPx, endPx } : { startPx, endPx: startPx + 1 };
}

function readerPosition(): number {
  return window.scrollY + window.innerHeight * 0.48;
}

function onScroll(): void {
  scheduleScrollSample();
  if (settleTimer !== undefined) window.clearTimeout(settleTimer);
  settleTimer = window.setTimeout(settleLocation, 180);
}

function scheduleScrollSample(): void {
  if (scrollFrame !== undefined) return;
  scrollFrame = window.requestAnimationFrame(() => {
    scrollFrame = undefined;
    scheduler.render(scrollClock.samplePosition(readerPosition()));
  });
}

function measureLayout(revision: number): LayoutState {
  const contexts = new Map<string, TransitionContext>();
  for (const element of transitionElements) {
    const id = requiredData(element, "kpReaderTransition");
    const materialPlan = staticPlans.get(id);
    const materialLayer = materialLayers.get(id);
    if (materialPlan === undefined || materialLayer === undefined) {
      throw new Error(`Equation transition ${id} is missing its reader plan.`);
    }
    const measurementRoot = requireDescendant<HTMLElement>(
      element,
      "[data-kp-reader-equation-measurement]"
    );
    const fitSurface = requireDescendant<HTMLElement>(
      element,
      "[data-kp-reader-fit-surface]"
    );
    fitSurface.style.transform = "none";
    const layout = measureKpReaderEquationLayoutSnapshot({
      materialPlan,
      transitionId: id,
      measurementRoot,
      revision
    });
    const alignment = planKpReaderEquationPerceptualAlignment({
      materialPlan,
      layout
    });
    const fit = planKpReaderEquationResponsiveFit({
      alignment,
      viewportWidth: viewport.clientWidth,
      horizontalPadding: 18,
      minScale: 0.68
    });
    applyKpReaderEquationResponsiveFit(fitSurface, fit);
    contexts.set(id, {
      id,
      element,
      fitSurface,
      measurementRoot,
      materialPlan,
      materialLayer,
      anchorElements: anchorElementIndex(measurementRoot),
      layout,
      alignment,
      fit
    });
  }
  stage.dataset["kpReaderLayoutReads"] = String(scheduler.inspect().readCount + 1);
  return { contexts };
}

function renderSample(sample: KpReaderClockSample, layout: LayoutState): void {
  const forwardClock = { ...sample, direction: "forward" as const };
  const runtimeFrame = sampleKpReaderAnimationFrame({ animation, clock: forwardClock });
  const transitionId = runtimeFrame.activeTransformationIds[0];
  if (transitionId === undefined) return;
  const context = layout.contexts.get(transitionId);
  if (context === undefined) throw new Error(`No measured transition ${transitionId}.`);
  const phaseProgress = localPhaseProgress(
    sample.progress,
    runtimeFrame.phase.phaseIndex,
    animation.transformations.length
  );
  const motion = sampleKpReaderEquationSymbolMotion({
    materialPlan: context.materialPlan,
    alignment: context.alignment,
    progress: phaseProgress
  });
  const focusedRefs = focus.getSnapshot().objectRefs;

  for (const candidate of layout.contexts.values()) {
    const active = candidate.id === transitionId;
    candidate.element.hidden = !active;
    candidate.element.dataset["kpReaderTransitionActive"] = String(active);
    if (!active) candidate.materialLayer.clear();
  }
  for (const element of context.anchorElements.values()) element.style.opacity = "0";
  const frames = motion.owners.map((owner): KpReaderEquationMaterialOwnerFrame => {
    setAnchorOpacity(context, owner.sourceAnchorIds, owner.sourceNativeOpacity);
    setAnchorOpacity(context, owner.targetAnchorIds, owner.targetNativeOpacity);
    const visualIds = owner.visualAnchorIds;
    const rawBounds = unionAnchorRects(context.layout, visualIds);
    const fragments = visualIds.map((anchorId) => {
      const element = context.anchorElements.get(anchorId);
      const anchor = context.layout.anchors.find((candidate) => candidate.id === anchorId);
      if (element === undefined || anchor === undefined) {
        throw new Error(`Equation visual anchor ${anchorId} is not measurable.`);
      }
      return {
        id: anchorId,
        visualRevision: `${transitionId}.${anchorId}`,
        sourceElement: element,
        rect: anchor.rect
      };
    });
    return {
      ownerId: owner.ownerId,
      rect: rawBounds,
      translateX: owner.currentBounds.left - rawBounds.left,
      translateY: owner.currentBounds.top - rawBounds.top,
      scaleX: owner.currentBounds.width / rawBounds.width,
      scaleY: owner.currentBounds.height / rawBounds.height,
      opacity: owner.materialOpacity,
      focused: owner.focusStrength > 0 || ownerMatchesFocus(owner, focusedRefs),
      fragments
    };
  });
  context.materialLayer.sync(frames);
  applyFocus(focusedRefs);
  progressBar.style.transform = `scaleX(${sample.progress})`;
  document.body.dataset["kpReaderProgress"] = String(sample.progressPermille);
  document.body.dataset["kpReaderTransition"] = transitionId;
  document.body.dataset["kpReaderFramePlans"] = String(scheduler.inspect().framePlanCount + 1);
  updateActiveBeat(sample.progressPermille);
}

function localPhaseProgress(progress: number, phaseIndex: number, phaseCount: number): number {
  if (progress === 1) return 1;
  return Math.max(0, Math.min(1, progress * phaseCount - phaseIndex));
}

function setAnchorOpacity(
  context: TransitionContext,
  anchorIds: readonly string[],
  opacity: number
): void {
  for (const anchorId of anchorIds) {
    const element = context.anchorElements.get(anchorId);
    if (element !== undefined) element.style.opacity = String(opacity);
  }
}

function unionAnchorRects(
  layout: KpReaderEquationLayoutSnapshot,
  ids: readonly string[]
): { readonly left: number; readonly top: number; readonly width: number; readonly height: number } {
  const rects = ids.map((id) => {
    const anchor = layout.anchors.find((candidate) => candidate.id === id);
    if (anchor === undefined) throw new Error(`Missing measured anchor ${id}.`);
    return anchor.rect;
  });
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.top + rect.height));
  return { left, top, width: right - left, height: bottom - top };
}

function updateActiveBeat(progressPermille: number): void {
  activeBeat = [...beats].sort((left, right) =>
    Math.abs(Number(requiredData(left, "kpCheckpoint")) - progressPermille) -
    Math.abs(Number(requiredData(right, "kpCheckpoint")) - progressPermille)
  )[0];
  if (activeBeat === undefined) return;
  for (const beat of beats) {
    const active = beat === activeBeat;
    beat.dataset["kpBeatActive"] = String(active);
    if (active) beat.setAttribute("aria-current", "step");
    else beat.removeAttribute("aria-current");
  }
  status.value = activeBeat.querySelector("h2")?.textContent?.trim() ?? "Follow the symbols";
  focus.set("story", dataRefs(activeBeat));
}

function onSemanticEnter(event: Event): void {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const link = target.closest<HTMLElement>(".kp-semantic-link");
  if (link === null) return;
  focus.set(event.type === "focusin" ? "keyboard" : "pointer", dataRefs(link));
}

function onSemanticLeave(event: Event): void {
  const target = event.target;
  if (!(target instanceof Element) || target.closest(".kp-semantic-link") === null) return;
  focus.clear(event.type === "focusout" ? "keyboard" : "pointer");
}

function applyFocus(refs: readonly string[]): void {
  const matches = (selectorId: string): boolean => refs.some(
    (ref) => selectorId === ref || selectorId.startsWith(`${ref}.`)
  );
  for (const element of stage.querySelectorAll<HTMLElement>("[data-kp-reader-selector-id]")) {
    element.classList.toggle(
      "kp-reader-semantic-focus",
      matches(requiredData(element, "kpReaderSelectorId"))
    );
  }
  for (const link of document.querySelectorAll<HTMLElement>(".kp-semantic-link")) {
    link.classList.toggle(
      "kp-reader-semantic-focus",
      dataRefs(link).some((ref) => refs.includes(ref))
    );
  }
}

function ownerMatchesFocus(
  owner: { readonly sourceAnchorIds: readonly string[]; readonly targetAnchorIds: readonly string[] },
  refs: readonly string[]
): boolean {
  return [...owner.sourceAnchorIds, ...owner.targetAnchorIds].some((anchorId) => {
    const selectorId = anchorId.replace(/^anchor\./, "");
    return refs.some((ref) => selectorId === ref || selectorId.startsWith(`${ref}.`));
  });
}

function settleLocation(): void {
  const sample = lastSample();
  const href = readerHref(sample);
  window.history.replaceState(null, "", href);
  shareLink.href = href;
}

function updateShareLink(sample: KpReaderClockSample): void {
  shareLink.href = readerHref(sample);
}

function readerHref(sample: KpReaderClockSample): string {
  const base = new URL(window.location.href);
  if (activeBeat !== undefined) base.hash = requiredData(activeBeat, "kpBeat");
  return encodeKpReaderSessionUrl(base, createKpReaderSessionSnapshot({
    documentId,
    documentVersion,
    checkpointId: sample.checkpointId,
    progressPermille: sample.progressPermille,
    projectionId: "equation.symbolic",
    focusRefs: focus.getSnapshot().objectRefs
  }));
}

function restoreUrlLocation(): void {
  const session = decodeKpReaderSessionUrl(window.location.href, {
    documentId,
    documentVersion
  });
  if (session === undefined) return;
  if (session.location.focusRefs.length > 0) {
    focus.set("url", session.location.focusRefs);
  }
  const progress = session.location.progressPermille;
  if (progress === undefined) return;
  const geometry = scrollGeometry();
  const scrollPosition = geometry.startPx + (geometry.endPx - geometry.startPx) * progress / 1_000;
  window.scrollTo({ top: scrollPosition - window.innerHeight * 0.48 });
}

function lastSample(): KpReaderClockSample {
  return scrollClock.getSnapshot();
}

function anchorElementIndex(root: HTMLElement): ReadonlyMap<string, HTMLElement> {
  return new Map([...root.querySelectorAll<HTMLElement>(
    "[data-kp-reader-equation-anchor-id]"
  )].map((element) => [requiredData(element, "kpReaderEquationAnchorId"), element]));
}

function dataRefs(element: HTMLElement): readonly string[] {
  return (element.dataset["kpFocus"] ?? "").split(/\s+/).filter(Boolean);
}

function requiredData(element: HTMLElement, key: string): string {
  const value = element.dataset[key];
  if (value === undefined || value === "") throw new Error(`Missing data-${key}.`);
  return value;
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) throw new Error(`Expected ${selector}.`);
  return element;
}

function requireDescendant<T extends Element>(root: Element, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (element === null) throw new Error(`Expected ${selector}.`);
  return element;
}

function dispose(): void {
  if (scrollFrame !== undefined) window.cancelAnimationFrame(scrollFrame);
  if (settleTimer !== undefined) window.clearTimeout(settleTimer);
  resizeObserver.disconnect();
  scheduler.dispose();
  scrollClock.dispose();
  focus.dispose();
  unsubscribeFocus();
  for (const layer of materialLayers.values()) layer.dispose();
}
