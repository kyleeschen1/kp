import katex from "katex";

import {
  createExponentRadicalRepresentationalLineageFixture
} from "../animation/exponent-radical-adapter.ts";
import {
  createKpGovernedRadicalSuccessionFixture
} from "../authoring/governed-radical-succession-fixture.ts";
import {
  bindKpExponentRadicalStructuralMotionIds
} from "../editor/exponent-radical-semantic-latex.ts";
import {
  bindKpExponentRadicalStructuralAnchors,
  createKpExponentRadicalSelectorAnnotatedLatex
} from "../rendering/exponent-radical-selector-annotated-latex.ts";
import { createKpEquationFontReadiness } from "../rendering/equation-font-readiness.ts";
import {
  compileKpCanonicalNativeKatexScenePlan,
  createKpCanonicalNativeKatexSceneSession
} from "../rendering/native-katex-scene-compositor.ts";
import {
  projectKpNativeKatexSemanticPaintRelations,
  reconcileKpNativeKatexScenes,
  reverseKpNativeKatexSemanticPaintRelations
} from "../rendering/native-katex-base-scene-plan.ts";
import {
  settleAndObserveKpNativeKatexRenderedScene
} from "../rendering/native-katex-rendered-scene.ts";
import {
  resolveDefaultEquationTransformVisualMotifRule
} from "../animation/motifs/equation-visual-motif-defaults.ts";
import {
  compileKpEquationStructuralSuccessionIntent
} from "../animation/structural-succession-presentation.ts";

const panel = document.querySelector<HTMLElement>("[data-radical-inventory]");
const enabled =
  new URL(location.href).searchParams.get("radicalInventory") === "1";

if (panel !== null && enabled) {
  await initializeRadicalInventory(panel);
}

async function initializeRadicalInventory(panel: HTMLElement): Promise<void> {
  const governed = createKpGovernedRadicalSuccessionFixture();
  const representationFixture =
    createExponentRadicalRepresentationalLineageFixture();
  const representation =
    representationFixture.vocabulary.representationalLineages[0];
  if (representation === undefined) {
    throw new Error("Canonical radical representation lineage is unavailable.");
  }
  const operation = governed.compilation.construction.operations[0]!;
  const animation = governed.authority.animation;
  const transformation = animation.transformations.find(
    ({ transformType }) => transformType === "rewritePowerAsRoot"
  );
  if (transformation === undefined) {
    throw new Error("Canonical radical transformation is unavailable.");
  }
  const sourceObject = operation.sourceObjectIds[0];
  const targetObject = operation.targetObjectIds[0];
  const sourceState = animation.bundle.objects.find(
    ({ id }) => id === sourceObject
  );
  const targetState = animation.bundle.objects.find(
    ({ id }) => id === targetObject
  );
  if (sourceState === undefined || targetState === undefined) {
    throw new Error("Canonical radical endpoint objects are unavailable.");
  }

  panel.hidden = false;
  const stage = required<HTMLElement>(panel, "[data-radical-stage]");
  const sourceEquation = required<HTMLElement>(
    panel,
    "[data-radical-source]"
  );
  const targetEquation = required<HTMLElement>(
    panel,
    "[data-radical-target]"
  );
  const sourceRoot = required<HTMLElement>(
    panel,
    "[data-radical-source-object]"
  );
  const targetRoot = required<HTMLElement>(
    panel,
    "[data-radical-target-object]"
  );
  renderEndpoint({
    root: sourceRoot,
    state: sourceState,
    representationEntityId: representation.sourceRepresentation.entityId,
    groupId: "group.radical.source"
  });
  renderEndpoint({
    root: targetRoot,
    state: targetState,
    representationEntityId: representation.targetRepresentation.entityId,
    groupId: "group.radical.target"
  });
  const structuralStates = [sourceState, targetState].map((state) => ({
    objectId: state.id,
    selectors: state.selectors
  }));
  const structuralMotionIds = bindKpExponentRadicalStructuralMotionIds({
    root: panel,
    states: structuralStates
  });
  bindStructuralOwners({
    panel,
    states: structuralStates,
    structuralMotionIds
  });
  bindKpExponentRadicalStructuralAnchors({
    root: sourceRoot,
    state: sourceState
  });
  bindKpExponentRadicalStructuralAnchors({
    root: targetRoot,
    state: targetState
  });

  const fontReadiness = createKpEquationFontReadiness(document);
  const [source, target, reverseSource, reverseTarget] = await Promise.all([
    settleAndObserveKpNativeKatexRenderedScene({
      endpoint: "source",
      stage,
      root: sourceRoot,
      semanticEntityId: representation.sourceRepresentation.entityId,
      presentationGroupId: "group.radical.source",
      fontReadiness
    }),
    settleAndObserveKpNativeKatexRenderedScene({
      endpoint: "target",
      stage,
      root: targetRoot,
      semanticEntityId: representation.targetRepresentation.entityId,
      presentationGroupId: "group.radical.target",
      fontReadiness
    }),
    settleAndObserveKpNativeKatexRenderedScene({
      endpoint: "source",
      stage,
      root: targetRoot,
      semanticEntityId: representation.targetRepresentation.entityId,
      presentationGroupId: "group.radical.target",
      fontReadiness
    }),
    settleAndObserveKpNativeKatexRenderedScene({
      endpoint: "target",
      stage,
      root: sourceRoot,
      semanticEntityId: representation.sourceRepresentation.entityId,
      presentationGroupId: "group.radical.source",
      fontReadiness
    })
  ]);
  const relations = projectKpNativeKatexSemanticPaintRelations({
    groups: operation.lineage.map((lineage) => ({
      id: lineage.id,
      kind: lineageKind(
        lineage.sourceEntityIds.length,
        lineage.targetEntityIds.length
      ),
      sourceEntityIds: lineage.sourceEntityIds,
      targetEntityIds: lineage.targetEntityIds
    }))
  });
  const motifRule = resolveDefaultEquationTransformVisualMotifRule(
    transformation.transformType
  );
  if (motifRule === undefined) {
    throw new Error("Canonical radical visual motif is unavailable.");
  }
  const motif = {
    kind: motifRule.descriptor.kind,
    motionPrimitiveIds: motifRule.descriptor.motionPrimitiveIds,
    phaseIds: motifRule.descriptor.phaseIds,
    summary: motifRule.summary ?? motifRule.descriptor.summary
  };
  const structuralSuccession =
    compileKpEquationStructuralSuccessionIntent({
      transformation,
      motif,
      direction: "forward"
    });
  const reverseStructuralSuccession =
    compileKpEquationStructuralSuccessionIntent({
      transformation,
      motif,
      direction: "rewind"
    });
  if (
    structuralSuccession === undefined ||
    reverseStructuralSuccession === undefined
  ) {
    throw new Error("Canonical radical structural succession is unavailable.");
  }
  const canonical = createKpCanonicalNativeKatexSceneSession(
    compileKpCanonicalNativeKatexScenePlan({
      source,
      target,
      relations,
      structuralSuccession
    })
  );
  const reconciliation = canonical.reconciliation;
  const permutedReconciliation = reconcileKpNativeKatexScenes({
    source: { ...source, atoms: [...source.atoms].reverse() },
    target: { ...target, atoms: [...target.atoms].reverse() },
    relations
  });
  const reverseRelations =
    reverseKpNativeKatexSemanticPaintRelations(relations);
  const reverseCanonical = createKpCanonicalNativeKatexSceneSession(
    compileKpCanonicalNativeKatexScenePlan({
      source: reverseSource,
      target: reverseTarget,
      relations: reverseRelations,
      structuralSuccession: reverseStructuralSuccession
    })
  );
  const reverseReconciliation = reverseCanonical.reconciliation;
  const plan = canonical.hierarchy;
  const reversePlan = reverseCanonical.hierarchy;
  const tracks = canonical.session.tracks;
  const reverseTracks = reverseCanonical.session.tracks;
  const playback = canonical.session;
  const reversePlayback = reverseCanonical.session;
  await waitForStructuralSuccession(stage, playback);
  panel.dataset["kpRadicalInventoryReady"] = "true";
  panel.dataset["kpRadicalSourceAtomCount"] = String(source.atoms.length);
  panel.dataset["kpRadicalTargetAtomCount"] = String(target.atoms.length);
  panel.dataset["kpRadicalSourceGroupCount"] = String(source.groups.length);
  panel.dataset["kpRadicalTargetGroupCount"] = String(target.groups.length);
  const headerStatus = required<HTMLElement>(
    panel,
    "[data-radical-inventory-status]"
  );
  const status = required<HTMLOutputElement>(
    panel,
    "[data-radical-status]"
  );
  const ownerLabel = required<HTMLElement>(panel, "[data-radical-owner]");
  const phaseLabel = required<HTMLElement>(panel, "[data-radical-phase]");
  const slider = required<HTMLInputElement>(panel, "[data-radical-progress]");
  const playButton = required<HTMLButtonElement>(panel, "[data-radical-play]");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sourceSelectors = [
    ...sourceEquation.querySelectorAll<HTMLElement>(
      "[data-kp-semantic-selector-id]"
    )
  ];
  const targetSelectors = [
    ...targetEquation.querySelectorAll<HTMLElement>(
      "[data-kp-semantic-selector-id]"
    )
  ];
  let animationFrame: number | undefined;

  const render = (progress: number) => {
    const bounded = Math.max(0, Math.min(1, progress));
    const frame = playback.apply(bounded);
    const sourceActive = frame.visualOwner === "source-native";
    const targetActive = frame.visualOwner === "target-native";
    sourceEquation.setAttribute("aria-hidden", String(!sourceActive));
    targetEquation.setAttribute("aria-hidden", String(!targetActive));
    sourceEquation.toggleAttribute("inert", !sourceActive);
    targetEquation.toggleAttribute("inert", !targetActive);
    syncSelectorFocus(sourceSelectors, sourceActive);
    syncSelectorFocus(targetSelectors, targetActive);
    stage.dataset["kpRadicalSemanticOwner"] =
      sourceActive ? "source-native" :
      targetActive ? "target-native" :
      "stage-description";
    panel.dataset["kpRadicalVisualOwner"] = frame.visualOwner;
    panel.dataset["kpRadicalProgress"] = String(Math.round(bounded * 1_000));
    slider.value = String(Math.round(bounded * 1_000));
    status.value = `${Math.round(bounded * 100)}%`;
    ownerLabel.textContent =
      sourceActive ? "Native exponent notation owns the ink" :
      targetActive ? "Native radical notation owns the ink" :
      "Inert compositor atoms own the paint";
    phaseLabel.textContent =
      sourceActive ? "Exact native rational-exponent endpoint" :
      targetActive ? "Exact native square-root endpoint" :
      "Compiled solid-mask representation succession";
    headerStatus.textContent =
      sourceActive ? "Rational exponent" :
      targetActive ? "Square root" :
      "Representational succession";
    playButton.textContent = bounded >= 1 ? "Rewind" : "Play";
    return frame;
  };
  const stopPlayback = () => {
    if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
    animationFrame = undefined;
    playButton.textContent =
      Number(slider.value) >= 1_000 ? "Rewind" : "Play";
  };
  slider.addEventListener("input", () => {
    stopPlayback();
    render(Number(slider.value) / 1_000);
  });
  playButton.addEventListener("click", () => {
    if (animationFrame !== undefined) {
      stopPlayback();
      return;
    }
    const start = Number(slider.value) / 1_000;
    const targetProgress = start >= 1 ? 0 : 1;
    if (reducedMotion) {
      render(targetProgress);
      return;
    }
    const startedAt = performance.now();
    const durationMs = 1_600 * Math.abs(targetProgress - start);
    playButton.textContent = "Pause";
    const tick = (now: number): void => {
      const elapsed = Math.min(1, (now - startedAt) / durationMs);
      render(start + (targetProgress - start) * elapsed);
      if (elapsed < 1) {
        animationFrame = requestAnimationFrame(tick);
      } else {
        animationFrame = undefined;
      }
    };
    animationFrame = requestAnimationFrame(tick);
  });
  const requestedProgress = Number(
    new URL(location.href).searchParams.get("progress") ?? "0"
  ) / 1_000;
  render(requestedProgress);
  if (import.meta.env.DEV) {
    Object.assign(window, {
      __kpApplyRadicalSceneFrame: render,
      __kpRadicalSceneInventory: Object.freeze({
        governedFixtureId: governed.id,
        governedRequestId: governed.request.id,
        constructionKind: governed.compilation.kind,
        source,
        target,
        relations,
        reconciliation,
        permutedReconciliation,
        plan,
        tracks,
        playback,
        reverseRelations,
        structuralSuccession,
        reverseStructuralSuccession,
        reverseReconciliation,
        reversePlan,
        reverseTracks,
        reversePlayback
      })
    });
  }
}

function renderEndpoint(input: {
  readonly root: HTMLElement;
  readonly state: {
    readonly id: string;
    readonly selectors: readonly {
      readonly id: string;
      readonly label?: string | undefined;
    }[];
  };
  readonly representationEntityId: string;
  readonly groupId: string;
}): void {
  const annotated = createKpExponentRadicalSelectorAnnotatedLatex({
    objectId: input.state.id,
    selectors: input.state.selectors
  });
  if (annotated === undefined) {
    throw new Error(`Radical endpoint ${input.state.id} has no KaTeX projection.`);
  }
  input.root.dataset["kpEditorEquationObjectId"] = input.state.id;
  input.root.dataset["kpSemanticEntityId"] = input.representationEntityId;
  input.root.dataset["kpPresentationGroupId"] = input.groupId;
  katex.render(annotated.annotatedLatex, input.root, {
    output: "html",
    throwOnError: true,
    strict: false,
    trust: (context) => context.command === "\\htmlData"
  });
  for (const annotation of annotated.annotations) {
    const element = input.root.querySelector<HTMLElement>(
      `[data-kp-motion-id="${CSS.escape(annotation.motionId)}"]`
    );
    if (element === null) {
      throw new Error(`KaTeX omitted radical selector ${annotation.selectorId}.`);
    }
    element.dataset["kpSemanticEntityId"] = annotation.selectorId;
    element.dataset["kpPresentationGroupId"] =
      `${input.groupId}.selector.${annotation.selectorId}`;
    element.dataset["kpSemanticSelectorId"] = annotation.selectorId;
    const label = input.state.selectors.find(
      ({ id }) => id === annotation.selectorId
    )?.label ?? annotation.selectorId;
    element.dataset["kpAnnotation"] = label;
    element.title = label;
    if (element.textContent?.trim() !== "") element.tabIndex = -1;
  }
}

function bindStructuralOwners(input: {
  readonly panel: HTMLElement;
  readonly states: readonly {
    readonly objectId: string;
    readonly selectors: readonly { readonly id: string }[];
  }[];
  readonly structuralMotionIds: Readonly<Record<string, string>>;
}): void {
  for (const state of input.states) {
    const side = state.objectId.endsWith(".power") ? "source" : "target";
    for (const selector of state.selectors) {
      const motionId = input.structuralMotionIds[selector.id];
      if (motionId === undefined) continue;
      const element = input.panel.querySelector<HTMLElement>(
        `[data-kp-motion-id="${CSS.escape(motionId)}"]`
      );
      if (element === null) {
        throw new Error(`KaTeX omitted radical structure ${selector.id}.`);
      }
      element.dataset["kpSemanticEntityId"] = selector.id;
      element.dataset["kpPresentationGroupId"] =
        `group.radical.${side}.selector.${selector.id}`;
    }
  }
}

function required<T extends Element>(
  root: ParentNode,
  selector: string
): T {
  const result = root.querySelector<T>(selector);
  if (result === null) throw new Error(`Missing radical inventory ${selector}.`);
  return result;
}

function syncSelectorFocus(
  selectors: readonly HTMLElement[],
  active: boolean
): void {
  selectors.forEach((selector) => {
    if (selector.hasAttribute("tabindex")) {
      selector.tabIndex = active ? 0 : -1;
    }
  });
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

async function waitForStructuralSuccession(
  stage: HTMLElement,
  session: { apply(progress: number): unknown }
): Promise<void> {
  for (let frame = 0; frame < 120; frame += 1) {
    session.apply(0);
    const status = stage.dataset["kpNativeKatexStructuralSuccessionStatus"];
    if (status === "ready" || status === "unavailable") return;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve())
    );
  }
  throw new Error("Experiment structural succession paint did not settle.");
}
