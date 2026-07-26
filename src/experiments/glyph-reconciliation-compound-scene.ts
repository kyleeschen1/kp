import katex from "katex";

import {
  createKpGlyphReconciliationCompoundTrace
} from "../animation/semantic-glyph-reconciliation-compound-trace.ts";
import {
  createKpCompletingSquareKatexProjection,
  type KpQuadraticKatexTransition
} from "../projections/quadratic-completing-square-katex.ts";
import { createKpEquationFontReadiness } from "../rendering/equation-font-readiness.ts";
import {
  createKpNativeKatexCompoundScenePlan
} from "../rendering/native-katex-compound-scene-plan.ts";
import {
  compileKpNativeKatexHierarchicalScenePlan,
  compileKpNativeKatexSceneTracks,
  createKpNativeKatexRendererSession,
  reconcileKpNativeKatexScenes,
  type KpNativeKatexSemanticPaintRelation
} from "../rendering/native-katex-scene-compositor.ts";
import {
  settleAndObserveKpNativeKatexRenderedScene
} from "../rendering/native-katex-rendered-scene.ts";
import {
  createKpQuadraticSelectorAnnotatedLatex
} from "../rendering/quadratic-selector-annotated-latex.ts";

export interface KpGlyphReconciliationCompoundSceneController {
  readonly render: (progress: number) => void;
  readonly currentProgress: () => number;
  readonly setScrubberDisabled: (disabled: boolean) => void;
}

export async function initializeKpGlyphReconciliationCompoundScene(
  panel: HTMLElement
): Promise<KpGlyphReconciliationCompoundSceneController> {
  const sceneRoot = required<HTMLElement>(panel, "[data-compound-scene]");
  const stage = required<HTMLElement>(sceneRoot, "[data-compound-stage]");
  const progressInput = required<HTMLInputElement>(
    sceneRoot,
    "[data-compound-progress]"
  );
  const status = required<HTMLOutputElement>(
    sceneRoot,
    "[data-compound-scene-status]"
  );
  const projection = createKpCompletingSquareKatexProjection();
  const trace = createKpGlyphReconciliationCompoundTrace();
  const stateRoots = projection.states.map((state, index) => {
    const root = document.createElement("span");
    root.className = "glyph-exemplar__compound-equation";
    root.dataset["compoundStateIndex"] = String(index);
    root.dataset["compoundStateId"] = state.id;
    root.dataset["kpSemanticEntityId"] = state.semanticStateId;
    root.dataset["kpPresentationGroupId"] = `group.compound.state.${index}`;
    root.setAttribute("role", "math");
    root.setAttribute("aria-label", state.spoken);
    root.setAttribute("aria-hidden", "true");
    const annotated = createKpQuadraticSelectorAnnotatedLatex(state);
    katex.render(annotated.annotatedLatex, root, {
      output: "html",
      throwOnError: true,
      strict: false,
      trust: (context) => context.command === "\\htmlData"
    });
    for (const annotation of annotated.annotations) {
      const selector = root.querySelector<HTMLElement>(
        `[data-kp-motion-id="${CSS.escape(annotation.motionId)}"]`
      );
      if (selector === null) {
        throw new Error(
          `Compound scene omitted native selector ${annotation.motionId}.`
        );
      }
      selector.dataset["kpSemanticEntityId"] = annotation.motionId;
      selector.dataset["kpPresentationGroupId"] =
        `group.compound.state.${index}.selector.${annotation.selectorId}`;
      selector.dataset["kpSemanticSelectorId"] = annotation.motionId;
      selector.dataset["kpAnnotation"] = annotation.selectorId;
      selector.title = annotation.selectorId;
    }
    stage.append(root);
    return root;
  });
  sceneRoot.hidden = false;
  const fontReadiness = createKpEquationFontReadiness(document);
  await fontReadiness.whenReady();
  await nextFrame();

  const sceneEntries = await Promise.all(
    projection.transitions.map(async (transition, index) => {
      const sourceRoot = stateRoots[index]!;
      const targetRoot = stateRoots[index + 1]!;
      const [source, target] = await Promise.all([
        settleAndObserveKpNativeKatexRenderedScene({
          endpoint: "source",
          stage,
          root: sourceRoot,
          semanticEntityId: projection.states[index]!.semanticStateId,
          presentationGroupId: `group.compound.state.${index}`,
          fontReadiness
        }),
        settleAndObserveKpNativeKatexRenderedScene({
          endpoint: "target",
          stage,
          root: targetRoot,
          semanticEntityId: projection.states[index + 1]!.semanticStateId,
          presentationGroupId: `group.compound.state.${index + 1}`,
          fontReadiness
        })
      ]);
      const reconciliation = reconcileKpNativeKatexScenes({
        source,
        target,
        relations: relationsFor(transition)
      });
      const tracks = compileKpNativeKatexSceneTracks(
        compileKpNativeKatexHierarchicalScenePlan(reconciliation)
      );
      return {
        scene: {
          id: `compound-scene.${index}`,
          operationId: transition.presentation!.operationRef,
          tracks
        },
        playback: createKpNativeKatexRendererSession({
          stage,
          sourceRoot,
          targetRoot,
          reconciliation,
          tracks
        })
      };
    })
  );
  const plan = createKpNativeKatexCompoundScenePlan({
    timeline: trace,
    scenes: sceneEntries.map(({ scene }) => scene)
  });
  let current = normalizedProgressFromUrl();

  const render = (progress: number): void => {
    current = Math.max(0, Math.min(1, progress));
    const frame = plan.sample(current);
    stateRoots.forEach((root) => {
      root.style.opacity = "0";
      root.setAttribute("aria-hidden", "true");
    });
    sceneEntries[frame.activeSceneIndex]!.playback.apply(frame.localProgress);
    const semanticStateIndex = frame.localProgress === 1
      ? frame.activeSceneIndex + 1
      : frame.activeSceneIndex;
    if (frame.visualOwner !== "material-scene") {
      stateRoots[semanticStateIndex]!.setAttribute("aria-hidden", "false");
    }
    stage.setAttribute(
      "aria-label",
      frame.visualOwner === "material-scene"
        ? `Transforming step ${frame.activeSceneIndex + 1} of ${plan.segments.length}`
        : projection.states[semanticStateIndex]!.spoken
    );
    progressInput.value = String(Math.round(current * 1_000));
    status.value =
      `Step ${frame.activeSceneIndex + 1} of ${plan.segments.length}: ` +
      readableOperation(frame.operationId);
    panel.dataset["compoundSceneReady"] = "true";
    panel.dataset["compoundSceneProgress"] = String(
      Math.round(current * 1_000)
    );
    panel.dataset["compoundSceneIndex"] = String(frame.activeSceneIndex);
    panel.dataset["compoundSceneLocalProgress"] = String(frame.localProgress);
    panel.dataset["compoundSceneVisualOwner"] = frame.visualOwner;
    panel.dataset["compoundSceneOperationId"] = frame.operationId;
    panel.querySelectorAll<HTMLElement>("[data-trace-operation]")
      .forEach((operation, index) => {
        operation.dataset["traceState"] =
          current === 1 || index < frame.activeSceneIndex
            ? "complete"
            : index === frame.activeSceneIndex
              ? "active"
              : "pending";
      });
  };
  progressInput.addEventListener("input", () => {
    render(Number(progressInput.value) / 1_000);
  });
  render(current);
  bindCompoundControls({
    panel,
    trace,
    render,
    currentProgress: () => current,
    setScrubberDisabled: (disabled) => {
      progressInput.disabled = disabled;
    }
  });
  return Object.freeze({
    render,
    currentProgress: () => current,
    setScrubberDisabled: (disabled: boolean) => {
      progressInput.disabled = disabled;
    }
  });
}

function bindCompoundControls(input: {
  readonly panel: HTMLElement;
  readonly trace: ReturnType<typeof createKpGlyphReconciliationCompoundTrace>;
  readonly render: (progress: number) => void;
  readonly currentProgress: () => number;
  readonly setScrubberDisabled: (disabled: boolean) => void;
}): void {
  const play = required<HTMLButtonElement>(input.panel, "[data-trace-play]");
  const inspect = required<HTMLButtonElement>(
    input.panel,
    "[data-trace-inspect]"
  );
  const detail = required<HTMLOListElement>(
    input.panel,
    "[data-trace-detail]"
  );
  const status = required<HTMLOutputElement>(
    input.panel,
    "[data-trace-status]"
  );
  const hostSliders = [
    ...document.querySelectorAll<HTMLInputElement>("[data-progress]")
  ];
  const hostPlayButtons = [
    ...document.querySelectorAll<HTMLButtonElement>("[data-play]")
  ];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let animationFrame: number | undefined;
  let parentProgress = input.currentProgress();

  const stop = (): void => {
    if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
    animationFrame = undefined;
  };
  play.addEventListener("click", () => {
    stop();
    const start = input.currentProgress();
    const target = start >= 1 ? 0 : 1;
    const complete = (): void => {
      play.disabled = false;
      play.textContent =
        target === 1 ? "Rewind compressed work" : "Play compressed work";
      input.panel.dataset["traceCompletedCycles"] = String(
        Number(input.panel.dataset["traceCompletedCycles"] ?? "0") + 1
      );
      status.value = target === 1
        ? `All ${input.trace.operationIds.length} canonical operations depicted.`
        : "Native starting equation restored.";
    };
    if (reducedMotion) {
      input.render(target);
      complete();
      return;
    }
    const startedAt = performance.now();
    const durationMs =
      input.trace.compressedDurationMs * Math.abs(target - start);
    play.disabled = true;
    play.textContent = "Playing…";
    const tick = (now: number): void => {
      const elapsed = Math.min(durationMs, now - startedAt);
      const local = durationMs === 0 ? 1 : elapsed / durationMs;
      input.render(start + (target - start) * local);
      if (elapsed < durationMs) {
        animationFrame = requestAnimationFrame(tick);
        return;
      }
      animationFrame = undefined;
      complete();
    };
    animationFrame = requestAnimationFrame(tick);
  });
  inspect.addEventListener("click", () => {
    const opening = inspect.getAttribute("aria-expanded") !== "true";
    stop();
    if (opening) {
      parentProgress = input.currentProgress();
      const liveTrace = createKpGlyphReconciliationCompoundTrace({
        parentProgress
      });
      inspect.setAttribute("aria-expanded", "true");
      inspect.textContent = "Return to exact overview frame";
      detail.hidden = false;
      hostSliders.forEach((slider) => {
        slider.disabled = true;
      });
      hostPlayButtons.forEach((button) => {
        button.disabled = true;
      });
      play.disabled = true;
      input.setScrubberDisabled(true);
      input.panel.dataset["traceMode"] = "full-detail";
      input.panel.dataset["traceParentProgress"] =
        String(liveTrace.drillDown.parentClock.progress);
      input.panel.dataset["traceRestoreExact"] = "pending";
      status.value =
        `Parent paused at ${Math.round(parentProgress * 100)}%; ` +
        `${(liveTrace.fullDurationMs / 1_000).toFixed(1)} s full trace exposed.`;
      return;
    }
    inspect.setAttribute("aria-expanded", "false");
    inspect.textContent = "Inspect all operations";
    detail.hidden = true;
    hostSliders.forEach((slider) => {
      slider.disabled = false;
    });
    hostPlayButtons.forEach((button) => {
      button.disabled = false;
    });
    play.disabled = false;
    input.setScrubberDisabled(false);
    input.render(parentProgress);
    input.panel.dataset["traceMode"] = "compressed";
    input.panel.dataset["traceRestoreExact"] =
      input.currentProgress() === parentProgress ? "true" : "false";
    status.value =
      `Exact ${Math.round(parentProgress * 100)}% overview frame restored.`;
  });
}

function relationsFor(
  transition: KpQuadraticKatexTransition
): readonly KpNativeKatexSemanticPaintRelation[] {
  return transition.correspondence.map((binding, index) => ({
    id: `compound.${transition.id}.${index}`,
    relation: "persist",
    sourceEntityIds: [binding.sourceSelectorId],
    targetEntityIds: [binding.targetSelectorId]
  }));
}

function normalizedProgressFromUrl(): number {
  const raw = Number(
    new URL(location.href).searchParams.get("compoundProgress") ?? "0"
  );
  return Number.isFinite(raw)
    ? Math.max(0, Math.min(1, raw / 1_000))
    : 0;
}

function readableOperation(operationId: string): string {
  return operationId.split(".").at(-1)!.replaceAll("-", " ");
}

function required<T extends Element>(root: ParentNode, selector: string): T {
  const result = root.querySelector<T>(selector);
  if (result === null) throw new Error(`Missing compound scene ${selector}.`);
  return result;
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
