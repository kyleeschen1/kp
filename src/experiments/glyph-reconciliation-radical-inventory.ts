import katex from "katex";

import {
  createExponentRadicalRepresentationalLineageFixture
} from "../animation/exponent-radical-adapter.ts";
import {
  createKpRadicalSuccessionGlyphReconciliationAudit
} from "../animation/semantic-glyph-reconciliation-radical.ts";
import {
  bindKpExponentRadicalStructuralMotionIds,
  createKpExponentRadicalSelectorAnnotatedLatex
} from "../editor/exponent-radical-semantic-latex.ts";
import { createKpEquationFontReadiness } from "../rendering/equation-font-readiness.ts";
import {
  settleAndObserveKpNativeKatexRenderedScene
} from "../rendering/native-katex-rendered-scene.ts";

const panel = document.querySelector<HTMLElement>("[data-radical-inventory]");
const enabled =
  new URL(location.href).searchParams.get("radicalInventory") === "1";

if (panel !== null && enabled) {
  await initializeRadicalInventory(panel);
}

async function initializeRadicalInventory(panel: HTMLElement): Promise<void> {
  const audit = createKpRadicalSuccessionGlyphReconciliationAudit();
  const representationFixture =
    createExponentRadicalRepresentationalLineageFixture();
  const representation =
    representationFixture.vocabulary.representationalLineages[0];
  if (representation === undefined) {
    throw new Error("Canonical radical representation lineage is unavailable.");
  }
  const sourceObject = audit.transformation.sourceObjectIds[0];
  const targetObject = audit.transformation.targetObjectIds[0];
  const animation = representationFixture.animation;
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
  const nativeRadical = targetRoot.querySelector<HTMLElement>(".hide-tail");
  if (nativeRadical === null) {
    throw new Error("Native KaTeX radical path is unavailable.");
  }
  nativeRadical.dataset["kpSemanticEntityId"] =
    representation.targetRepresentation.entityId;
  nativeRadical.dataset["kpPresentationGroupId"] =
    "group.radical.target.root-notation";

  const fontReadiness = createKpEquationFontReadiness(document);
  const [source, target] = await Promise.all([
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
    })
  ]);
  panel.dataset["kpRadicalInventoryReady"] = "true";
  panel.dataset["kpRadicalSourceAtomCount"] = String(source.atoms.length);
  panel.dataset["kpRadicalTargetAtomCount"] = String(target.atoms.length);
  panel.dataset["kpRadicalSourceGroupCount"] = String(source.groups.length);
  panel.dataset["kpRadicalTargetGroupCount"] = String(target.groups.length);
  required<HTMLElement>(
    panel,
    "[data-radical-inventory-status]"
  ).textContent = `${source.atoms.length} source + ${
    target.atoms.length
  } target atoms`;
  if (import.meta.env.DEV) {
    Object.assign(window, {
      __kpRadicalSceneInventory: Object.freeze({ source, target })
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
