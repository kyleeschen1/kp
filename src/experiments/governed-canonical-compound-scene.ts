import katex from "katex";

import {
  createKpGovernedCanonicalCompoundConstruction
} from "../authoring/governed-canonical-compound-construction.ts";
import {
  createKpGovernedCanonicalConstructionCohort,
  type KpGovernedCanonicalConstructionCohortMember
} from "../authoring/governed-canonical-construction-cohort.ts";
import {
  bindKpExponentRadicalStructuralMotionIds
} from "../editor/exponent-radical-semantic-latex.ts";
import {
  createKpExponentRadicalSelectorAnnotatedLatex
} from "../rendering/exponent-radical-selector-annotated-latex.ts";
import { createKpEquationFontReadiness } from "../rendering/equation-font-readiness.ts";
import {
  createKpNativeKatexCompoundScenePlan
} from "../rendering/native-katex-compound-scene-plan.ts";
import {
  createKpNativeKatexRendererSession
} from "../rendering/native-katex-scene-compositor.ts";
import {
  compileKpNativeKatexHierarchicalScenePlan,
  compileKpNativeKatexSceneTracks,
  projectKpNativeKatexSemanticPaintRelations,
  reconcileKpNativeKatexScenes
} from "../rendering/native-katex-base-scene-plan.ts";
import {
  settleAndObserveKpNativeKatexRenderedScene
} from "../rendering/native-katex-rendered-scene.ts";
import {
  bindKpNumeratorSplitMergeStructuralAnchors,
  createKpNumeratorSplitMergeSelectorAnnotatedLatex
} from "../rendering/numerator-split-merge-selector-annotated-latex.ts";
import type { KpSemanticAssetObject } from "../semantic/asset.ts";

export async function initializeKpGovernedCanonicalCompoundScene(
  panel: HTMLElement
): Promise<void> {
  const construction = createKpGovernedCanonicalCompoundConstruction();
  const cohort = createKpGovernedCanonicalConstructionCohort();
  const sceneRoot = required<HTMLElement>(panel, "[data-compound-scene]");
  const stage = required<HTMLElement>(sceneRoot, "[data-compound-stage]");
  const materialLayer = required<HTMLElement>(
    stage,
    "[data-kp-editor-equation-material-layer]"
  );
  const slider = required<HTMLInputElement>(
    sceneRoot,
    "[data-compound-progress]"
  );
  const sceneStatus = required<HTMLOutputElement>(
    sceneRoot,
    "[data-compound-scene-status]"
  );
  const traceStatus = required<HTMLOutputElement>(
    panel,
    "[data-trace-status]"
  );
  const play = required<HTMLButtonElement>(panel, "[data-trace-play]");
  const inspect = required<HTMLButtonElement>(panel, "[data-trace-inspect]");
  const laneByChildId = new Map<string, HTMLElement>();
  const rootByObjectId = new Map<string, HTMLElement>();

  stage.classList.add("glyph-exemplar__compound-stage--governed");
  for (const member of cohort) {
    const lane = document.createElement("section");
    lane.className = "glyph-exemplar__governed-compound-lane";
    lane.dataset["governedCompoundLane"] = member.id;
    const label = document.createElement("strong");
    label.textContent = readableChild(member.id);
    const equation = document.createElement("div");
    equation.className = "glyph-exemplar__governed-compound-equation";
    lane.append(label, equation);
    stage.insertBefore(lane, materialLayer);
    laneByChildId.set(member.id, equation);
    for (const objectId of childObjectIds(member)) {
      const state = requireObject(member, objectId);
      const root = document.createElement("span");
      root.className = "glyph-exemplar__compound-equation";
      root.dataset["compoundStateId"] = state.id;
      root.dataset["kpEditorEquationObjectId"] = state.id;
      root.dataset["kpSemanticEntityId"] = state.id;
      root.dataset["kpPresentationGroupId"] = `group.compound.${state.id}`;
      root.setAttribute("role", "math");
      root.setAttribute("aria-label", state.id);
      renderState(root, state);
      equation.append(root);
      rootByObjectId.set(state.id, root);
    }
  }
  bindStructuralOwners(stage, cohort, rootByObjectId);
  updateTraceChrome(panel, construction.operations);
  sceneRoot.hidden = false;
  inspect.hidden = true;
  const fontReadiness = createKpEquationFontReadiness(document);
  await fontReadiness.whenReady();
  await nextFrame();
  await nextFrame();

  const entries = await Promise.all(construction.operations.map(
    async (compoundOperation) => {
      const member = requireMember(cohort, compoundOperation.childId);
      const operation = member.compilation.construction.operations.find(
        ({ stepId }) => stepId === compoundOperation.stepId
      );
      if (operation === undefined) {
        throw new Error(`Missing compound operation ${compoundOperation.stepId}.`);
      }
      const sourceRoot = requiredRoot(
        rootByObjectId,
        operation.sourceObjectIds[0]!
      );
      const targetRoot = requiredRoot(
        rootByObjectId,
        operation.targetObjectIds[0]!
      );
      const [source, target] = await Promise.all([
        settleAndObserveKpNativeKatexRenderedScene({
          endpoint: "source",
          stage,
          root: sourceRoot,
          semanticEntityId: operation.sourceObjectIds[0]!,
          presentationGroupId:
            `group.compound.${operation.sourceObjectIds[0]!}`,
          fontReadiness
        }),
        settleAndObserveKpNativeKatexRenderedScene({
          endpoint: "target",
          stage,
          root: targetRoot,
          semanticEntityId: operation.targetObjectIds[0]!,
          presentationGroupId:
            `group.compound.${operation.targetObjectIds[0]!}`,
          fontReadiness
        })
      ]);
      const relations = [
        ...projectKpNativeKatexSemanticPaintRelations({
          groups: operation.lineage.map((lineage) => ({
            id: lineage.id,
            kind: lineageKind(
              lineage.sourceEntityIds.length,
              lineage.targetEntityIds.length
            ),
            sourceEntityIds: lineage.sourceEntityIds,
            targetEntityIds: lineage.targetEntityIds
          }))
        }),
        {
          id: `compound-root.${operation.stepId}`,
          relation: "persist" as const,
          sourceEntityIds: operation.sourceObjectIds,
          targetEntityIds: operation.targetObjectIds
        }
      ];
      const reconciliation = reconcileKpNativeKatexScenes({
        source,
        target,
        relations
      });
      const tracks = compileKpNativeKatexSceneTracks(
        compileKpNativeKatexHierarchicalScenePlan(reconciliation)
      );
      return {
        scene: {
          id: `governed-compound-scene.${compoundOperation.semanticRank}`,
          operationId: compoundOperation.transformationId,
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
    }
  ));
  const plan = createKpNativeKatexCompoundScenePlan({
    timeline: {
      operationIds: construction.operations.map(
        ({ transformationId }) => transformationId
      ),
      compressedDurationMs: construction.clock.totalDurationMs,
      segments: construction.clock.segments.map((segment) => ({
        operationId: segment.canonicalOperationId,
        startMs: segment.startMs,
        durationMs: segment.durationMs,
        endMs: segment.endMs
      }))
    },
    scenes: entries.map(({ scene }) => scene)
  });
  let current = normalizedProgressFromUrl();
  let animationFrame: number | undefined;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const render = (progress: number): void => {
    current = Math.max(0, Math.min(1, progress));
    const frame = plan.sample(current);
    entries.forEach((entry, index) => {
      if (index === frame.activeSceneIndex) return;
      entry.playback.apply(index < frame.activeSceneIndex ? 1 : 0);
    });
    entries[frame.activeSceneIndex]!.playback.apply(frame.localProgress);
    rootByObjectId.forEach((root) => {
      root.setAttribute(
        "aria-hidden",
        root.style.opacity === "0" ? "true" : "false"
      );
    });
    slider.value = String(Math.round(current * 1_000));
    sceneStatus.value =
      `Operation ${frame.activeSceneIndex + 1} of ${plan.segments.length}: ` +
      readableOperation(frame.operationId);
    panel.dataset["governedCompoundReady"] = "true";
    panel.dataset["governedCompoundProgress"] =
      String(Math.round(current * 1_000));
    panel.dataset["governedCompoundIndex"] =
      String(frame.activeSceneIndex);
    panel.dataset["governedCompoundLocalProgress"] =
      String(frame.localProgress);
    panel.dataset["governedCompoundVisualOwner"] = frame.visualOwner;
    panel.dataset["governedCompoundOperationId"] = frame.operationId;
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
  slider.addEventListener("input", () => {
    render(Number(slider.value) / 1_000);
  });
  play.addEventListener("click", () => {
    if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
    const start = current;
    const target = start >= 1 ? 0 : 1;
    const complete = (): void => {
      animationFrame = undefined;
      play.disabled = false;
      play.textContent = target === 1 ? "Rewind compound" : "Play compound";
      traceStatus.value = target === 1
        ? "All four verified operations remain visible and complete."
        : "Every lane restored to its native source.";
    };
    if (reducedMotion) {
      render(target);
      complete();
      return;
    }
    const startedAt = performance.now();
    const durationMs =
      plan.totalDurationMs * Math.abs(target - start);
    play.disabled = true;
    const tick = (now: number): void => {
      const elapsed = Math.min(durationMs, now - startedAt);
      const local = durationMs === 0 ? 1 : elapsed / durationMs;
      render(start + (target - start) * local);
      if (elapsed < durationMs) {
        animationFrame = requestAnimationFrame(tick);
      } else {
        complete();
      }
    };
    animationFrame = requestAnimationFrame(tick);
  });
  render(current);
}

function renderState(root: HTMLElement, state: KpSemanticAssetObject): void {
  const fraction = createKpNumeratorSplitMergeSelectorAnnotatedLatex(state);
  const annotated = fraction?.annotated ??
    createKpExponentRadicalSelectorAnnotatedLatex({
      objectId: state.id,
      selectors: state.selectors
    });
  if (annotated === undefined) {
    throw new Error(`No compound KaTeX projection for ${state.id}.`);
  }
  katex.render(annotated.annotatedLatex, root, {
    displayMode: true,
    output: "html",
    throwOnError: true,
    strict: false,
    trust: ({ command }) => command === "\\htmlData"
  });
  for (const annotation of annotated.annotations) {
    const element = root.querySelector<HTMLElement>(
      `[data-kp-motion-id="${CSS.escape(annotation.motionId)}"]`
    );
    if (element === null) {
      throw new Error(`Compound rendering omitted ${annotation.selectorId}.`);
    }
    bindOwner(element, annotation.selectorId);
  }
  if (fraction !== undefined) {
    bindKpNumeratorSplitMergeStructuralAnchors({ root, state });
    root.querySelectorAll<HTMLElement>("[data-kp-reader-selector-id]")
      .forEach((element) => {
        const selectorId = element.dataset["kpReaderSelectorId"];
        if (selectorId !== undefined) bindOwner(element, selectorId);
      });
  }
}

function bindStructuralOwners(
  stage: HTMLElement,
  cohort: readonly KpGovernedCanonicalConstructionCohortMember[],
  rootByObjectId: ReadonlyMap<string, HTMLElement>
): void {
  const states = cohort.flatMap((member) =>
    childObjectIds(member).map((objectId) => requireObject(member, objectId))
  ).filter((state) => state.id.startsWith("expression.generated."));
  const motionIds = bindKpExponentRadicalStructuralMotionIds({
    root: stage,
    states: states.map((state) => ({
      objectId: state.id,
      selectors: state.selectors
    }))
  });
  for (const state of states) {
    const root = requiredRoot(rootByObjectId, state.id);
    for (const selector of state.selectors) {
      const motionId = motionIds[selector.id];
      if (motionId === undefined) continue;
      const element = root.querySelector<HTMLElement>(
        `[data-kp-motion-id="${CSS.escape(motionId)}"]`
      );
      if (element !== null) bindOwner(element, selector.id);
    }
  }
}

function updateTraceChrome(
  panel: HTMLElement,
  operations: readonly {
    readonly transformationId: string;
  }[]
): void {
  required<HTMLElement>(panel, "[data-trace-metrics]").textContent =
    `${operations.length} verified operations · one shared clock · three lanes`;
  const track = required<HTMLElement>(panel, "[data-trace-track]");
  const detail = required<HTMLOListElement>(panel, "[data-trace-detail]");
  track.replaceChildren(...operations.map((operation, index) => {
    const item = document.createElement("span");
    item.setAttribute("role", "listitem");
    item.dataset["traceOperation"] = String(index);
    item.dataset["canonicalOperationId"] = operation.transformationId;
    item.title = operation.transformationId;
    item.textContent = String(index + 1);
    return item;
  }));
  detail.replaceChildren(...operations.map((operation, index) => {
    const item = document.createElement("li");
    item.dataset["traceDetailOperation"] = String(index);
    item.textContent = `Step ${index + 1}: ${
      readableOperation(operation.transformationId)
    }`;
    return item;
  }));
}

function childObjectIds(
  member: KpGovernedCanonicalConstructionCohortMember
): readonly string[] {
  return unique(member.compilation.construction.operations.flatMap(
    (operation) => [
      ...operation.sourceObjectIds,
      ...operation.targetObjectIds
    ]
  ));
}

function requireObject(
  member: KpGovernedCanonicalConstructionCohortMember,
  objectId: string
): KpSemanticAssetObject {
  const state = member.authority.animation.bundle.objects.find(
    ({ id }) => id === objectId
  );
  if (state === undefined) throw new Error(`Missing compound state ${objectId}.`);
  return state;
}

function requireMember(
  cohort: readonly KpGovernedCanonicalConstructionCohortMember[],
  childId: string
): KpGovernedCanonicalConstructionCohortMember {
  const member = cohort.find(({ id }) => id === childId);
  if (member === undefined) throw new Error(`Missing compound child ${childId}.`);
  return member;
}

function requiredRoot(
  roots: ReadonlyMap<string, HTMLElement>,
  objectId: string
): HTMLElement {
  const root = roots.get(objectId);
  if (root === undefined) throw new Error(`Missing compound root ${objectId}.`);
  return root;
}

function bindOwner(element: HTMLElement, semanticEntityId: string): void {
  element.dataset["kpSemanticEntityId"] = semanticEntityId;
  element.dataset["kpPresentationGroupId"] =
    `group.compound.selector.${semanticEntityId}`;
}

function lineageKind(
  sourceCount: number,
  targetCount: number
):
  | "one-to-one"
  | "many-to-one"
  | "one-to-many"
  | "introduction"
  | "removal" {
  if (sourceCount === 0) return "introduction";
  if (targetCount === 0) return "removal";
  if (sourceCount > 1 && targetCount === 1) return "many-to-one";
  if (sourceCount === 1 && targetCount > 1) return "one-to-many";
  return "one-to-one";
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

function readableChild(childId: string): string {
  return childId.replaceAll("-", " ");
}

function required<T extends Element>(root: ParentNode, selector: string): T {
  const result = root.querySelector<T>(selector);
  if (result === null) throw new Error(`Missing governed compound ${selector}.`);
  return result;
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function unique<T>(values: readonly T[]): readonly T[] {
  return [...new Set(values)];
}
