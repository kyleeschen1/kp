import {
  measureKpNativeKatexBaselineY,
  measureKpNativeKatexSubtreePaintRect,
  measureKpNativeKatexTextInkRect
} from "./native-katex-paint-geometry.ts";
import {
  normalizeKpStageRelativeRect,
  type KpStageRelativeRect
} from "./native-katex-fragment-observer.ts";
import {
  fingerprintKpNativeKatexPaintStyle,
  type KpNativeKatexPaintAtomObservation,
  type KpNativeKatexPaintKind,
  type KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";

export type KpNativeKatexSuccessorEndpointCheckpoint =
  | "successor-one-minus-epsilon"
  | "native-target"
  | "post-settlement";

export type KpNativeKatexSuccessorEndpointOwner =
  | "successor-target-material"
  | "native-target";

export interface KpNativeKatexSuccessorEndpointAtomSnapshot {
  readonly paintAtomId: string;
  readonly semanticEntityId: string;
  readonly paintKind: KpNativeKatexPaintKind;
  readonly paintFingerprint: string;
  readonly owner: KpNativeKatexSuccessorEndpointOwner;
  readonly paintAlignment: "measured-ink" | "native";
  readonly layoutRect: KpStageRelativeRect;
  readonly paintRect: KpStageRelativeRect;
  readonly innerInset: {
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
  };
  readonly baselineY: number | null;
  readonly styleFingerprint: string;
  readonly fontFingerprint: string;
  readonly opacity: number;
  readonly ruleGeometry?: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly thickness: number;
  } | undefined;
}

export interface KpNativeKatexSuccessorEndpointSnapshot {
  readonly schemaVersion:
    "kp.native-katex-successor-endpoint-snapshot.v1";
  readonly lifecycle: "renderer-session";
  readonly checkpoint: KpNativeKatexSuccessorEndpointCheckpoint;
  readonly viewportKey: string;
  readonly deviceScaleFactor: number;
  readonly fontRevision: number;
  readonly atoms:
    readonly KpNativeKatexSuccessorEndpointAtomSnapshot[];
  readonly semanticAuthority:
    "successor-program-and-observed-atom-correlation";
}

export type KpNativeKatexSuccessorEndpointDiagnosticCode =
  | "endpoint.input.invalid"
  | "endpoint.environment.mismatch"
  | "endpoint.inventory.mismatch"
  | "endpoint.owner.mismatch"
  | "endpoint.paint.mismatch"
  | "endpoint.geometry.mismatch"
  | "endpoint.baseline.mismatch"
  | "endpoint.inner-paint.mismatch"
  | "endpoint.style.mismatch"
  | "endpoint.font.mismatch"
  | "endpoint.rule.mismatch"
  | "endpoint.opacity.mismatch"
  | "endpoint.silhouette.mismatch"
  | "endpoint.raster.mismatch"
  | "endpoint.post-settlement.mismatch";

export interface KpNativeKatexSuccessorEndpointDiagnostic {
  readonly code: KpNativeKatexSuccessorEndpointDiagnosticCode;
  readonly path: string;
  readonly message: string;
}

export interface KpNativeKatexSuccessorEndpointReport {
  readonly kind: "native-katex-successor-endpoint-report";
  readonly passed: boolean;
  readonly atomCount: number;
  readonly geometryToleranceCssPx: number;
  readonly maximumGeometryDeltaCssPx: number;
  readonly maximumBaselineDeltaCssPx: number;
  readonly maximumInnerInsetDeltaCssPx: number;
  readonly maximumRuleDeltaCssPx: number;
  readonly normalizedSilhouetteDelta: number;
  readonly normalizedRasterDelta: number;
  readonly postSettlementSilhouetteDelta: number;
  readonly postSettlementRasterDelta: number;
  readonly diagnostics:
    readonly KpNativeKatexSuccessorEndpointDiagnostic[];
}

/**
 * Captures either the successor-owned target clones or their exact native
 * target atoms. Explicit renderer-session atom IDs are the only correlation
 * authority; glyph text and spatial proximity are deliberately ignored.
 */
export function observeKpNativeKatexSuccessorEndpoint(input: {
  readonly checkpoint: KpNativeKatexSuccessorEndpointCheckpoint;
  readonly stage: HTMLElement;
  readonly targetScene: KpNativeKatexRenderedSceneObservation;
}): KpNativeKatexSuccessorEndpointSnapshot {
  if (
    input.targetScene.stage !== input.stage ||
    input.targetScene.endpoint !== "target"
  ) {
    throw new Error(
      "Successor endpoint microscope requires the exact target scene."
    );
  }
  const deviceScaleFactor =
    input.stage.ownerDocument.defaultView?.devicePixelRatio ?? 1;
  const atoms = input.checkpoint === "successor-one-minus-epsilon"
    ? observeSuccessorOwners(input.stage, input.targetScene)
    : input.targetScene.atoms.map((atom) =>
        observeAtom({
          stage: input.stage,
          atom,
          element: atom.sourceElement,
          owner: "native-target"
        })
      );
  if (atoms.length !== input.targetScene.atoms.length) {
    throw new Error(
      "Successor endpoint microscope requires total target atom coverage."
    );
  }
  return Object.freeze({
    schemaVersion:
      "kp.native-katex-successor-endpoint-snapshot.v1" as const,
    lifecycle: "renderer-session" as const,
    checkpoint: input.checkpoint,
    viewportKey: [
      input.targetScene.viewportKey,
      input.stage.offsetWidth,
      input.stage.offsetHeight,
      `dpr-${deviceScaleFactor}`
    ].join(":"),
    deviceScaleFactor,
    fontRevision: input.targetScene.fontRevision,
    atoms: Object.freeze([...atoms].sort((left, right) =>
      left.paintAtomId.localeCompare(right.paintAtomId)
    )),
    semanticAuthority:
      "successor-program-and-observed-atom-correlation" as const
  });
}

/**
 * Evaluates the last successor-owned paint, native handoff, and a later native
 * frame. Raster and silhouette observations are current-frame evidence only;
 * they cannot add atoms or change semantic correlation.
 */
export function evaluateKpNativeKatexSuccessorEndpoint(input: {
  readonly successor: KpNativeKatexSuccessorEndpointSnapshot;
  readonly nativeTarget: KpNativeKatexSuccessorEndpointSnapshot;
  readonly postSettlement: KpNativeKatexSuccessorEndpointSnapshot;
  readonly normalizedSilhouetteDelta: number;
  readonly normalizedRasterDelta: number;
  readonly postSettlementSilhouetteDelta: number;
  readonly postSettlementRasterDelta: number;
  readonly maximumNormalizedSilhouetteDelta?: number | undefined;
  readonly maximumNormalizedRasterDelta?: number | undefined;
  readonly geometryToleranceCssPxAtDpr1?: number | undefined;
}): KpNativeKatexSuccessorEndpointReport {
  const diagnostics: KpNativeKatexSuccessorEndpointDiagnostic[] = [];
  validateSnapshots(input, diagnostics);
  const dpr = input.nativeTarget.deviceScaleFactor;
  const geometryToleranceCssPx =
    (input.geometryToleranceCssPxAtDpr1 ?? 0.5) / Math.max(1, dpr);
  const metrics = {
    geometry: 0,
    baseline: 0,
    inset: 0,
    rule: 0
  };
  compareSnapshotPair({
    left: input.successor,
    right: input.nativeTarget,
    expectedLeftOwner: "successor-target-material",
    issuePrefix: "endpoint",
    tolerance: geometryToleranceCssPx,
    metrics,
    diagnostics
  });
  compareSnapshotPair({
    left: input.nativeTarget,
    right: input.postSettlement,
    expectedLeftOwner: "native-target",
    issuePrefix: "endpoint.post-settlement",
    tolerance: 0.01,
    metrics,
    diagnostics
  });

  const silhouetteBudget =
    input.maximumNormalizedSilhouetteDelta ?? 0.02;
  const rasterBudget = input.maximumNormalizedRasterDelta ?? 0.02;
  validateNormalizedDelta(
    input.normalizedSilhouetteDelta,
    silhouetteBudget,
    "endpoint.silhouette.mismatch",
    "normalizedSilhouetteDelta",
    diagnostics
  );
  validateNormalizedDelta(
    input.normalizedRasterDelta,
    rasterBudget,
    "endpoint.raster.mismatch",
    "normalizedRasterDelta",
    diagnostics
  );
  validateNormalizedDelta(
    input.postSettlementSilhouetteDelta,
    0,
    "endpoint.post-settlement.mismatch",
    "postSettlementSilhouetteDelta",
    diagnostics
  );
  validateNormalizedDelta(
    input.postSettlementRasterDelta,
    0,
    "endpoint.post-settlement.mismatch",
    "postSettlementRasterDelta",
    diagnostics
  );

  return Object.freeze({
    kind: "native-katex-successor-endpoint-report" as const,
    passed: diagnostics.length === 0,
    atomCount: input.nativeTarget.atoms.length,
    geometryToleranceCssPx,
    maximumGeometryDeltaCssPx: round(metrics.geometry),
    maximumBaselineDeltaCssPx: round(metrics.baseline),
    maximumInnerInsetDeltaCssPx: round(metrics.inset),
    maximumRuleDeltaCssPx: round(metrics.rule),
    normalizedSilhouetteDelta: input.normalizedSilhouetteDelta,
    normalizedRasterDelta: input.normalizedRasterDelta,
    postSettlementSilhouetteDelta:
      input.postSettlementSilhouetteDelta,
    postSettlementRasterDelta: input.postSettlementRasterDelta,
    diagnostics: Object.freeze(diagnostics)
  });
}

function observeSuccessorOwners(
  stage: HTMLElement,
  targetScene: KpNativeKatexRenderedSceneObservation
): readonly KpNativeKatexSuccessorEndpointAtomSnapshot[] {
  const atomsById = new Map(targetScene.atoms.map((atom) => [atom.id, atom]));
  const owners = [
    ...stage.querySelectorAll<HTMLElement>(
      "[data-kp-equation-material-fragment-role^='successor-target:']"
    )
  ];
  return owners.map((owner) => {
    const atomId =
      owner.dataset["kpEquationMaterialEndpointPaintAtomId"] ?? "";
    const atom = atomsById.get(atomId);
    const visual = owner.firstElementChild as HTMLElement | null;
    if (atom === undefined || visual === null) {
      throw new Error(
        `Successor endpoint owner lacks correlated target atom ${atomId}.`
      );
    }
    return observeAtom({
      stage,
      atom,
      element: visual,
      layoutElement: owner,
      owner: "successor-target-material"
    });
  });
}

function observeAtom(input: {
  readonly stage: HTMLElement;
  readonly atom: KpNativeKatexPaintAtomObservation;
  readonly element: HTMLElement;
  readonly layoutElement?: HTMLElement | undefined;
  readonly owner: KpNativeKatexSuccessorEndpointOwner;
}): KpNativeKatexSuccessorEndpointAtomSnapshot {
  const layoutElement = input.layoutElement ?? input.element;
  const layoutRect = stageRelativeRect(input.stage, layoutElement);
  const paintRect = paintRectForAtom(input.stage, input.element, input.atom);
  const computed = getComputedStyle(input.element);
  const baselineY = input.atom.paintKind === "glyph"
    ? measureKpNativeKatexBaselineY(input.stage, input.element)
    : null;
  const measuredInset = {
    left: paintRect.left - layoutRect.left,
    top: paintRect.top - layoutRect.top,
    right:
      layoutRect.left + layoutRect.width -
      (paintRect.left + paintRect.width),
    bottom:
      layoutRect.top + layoutRect.height -
      (paintRect.top + paintRect.height)
  };
  const expectedInset = input.owner === "successor-target-material"
    ? expectedPaintInset(layoutElement)
    : undefined;
  return Object.freeze({
    paintAtomId: input.atom.id,
    semanticEntityId: input.atom.semanticEntityId,
    paintKind: input.atom.paintKind,
    paintFingerprint: input.atom.visualKey,
    owner: input.owner,
    paintAlignment: input.owner === "successor-target-material"
      ? "measured-ink" as const
      : "native" as const,
    layoutRect: Object.freeze(layoutRect),
    paintRect: Object.freeze(paintRect),
    innerInset: Object.freeze(expectedInset ?? measuredInset),
    baselineY,
    styleFingerprint: fingerprintKpNativeKatexPaintStyle(computed),
    fontFingerprint: fontFingerprint(computed),
    opacity: effectiveOpacity(layoutElement, input.stage),
    ...(input.atom.paintKind === "rule"
      ? {
          ruleGeometry: Object.freeze({
            left: paintRect.left,
            top: paintRect.top,
            width: paintRect.width,
            thickness: paintRect.height
          })
        }
      : {})
  });
}

function expectedPaintInset(element: HTMLElement): {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
} {
  const values = [
    element.dataset["kpEquationMaterialExpectedPaintInsetX"],
    element.dataset["kpEquationMaterialExpectedPaintInsetY"],
    element.dataset["kpEquationMaterialExpectedPaintInsetRight"],
    element.dataset["kpEquationMaterialExpectedPaintInsetBottom"]
  ].map(Number);
  if (
    element.dataset["kpEquationMaterialPaintAlignment"] !== "measured-ink" ||
    values.some((value) => !Number.isFinite(value))
  ) {
    throw new Error(
      "Successor target endpoint lacks measured-ink alignment authority."
    );
  }
  return {
    left: values[0]!,
    top: values[1]!,
    right: values[2]!,
    bottom: values[3]!
  };
}

function paintRectForAtom(
  stage: HTMLElement,
  element: HTMLElement,
  atom: KpNativeKatexPaintAtomObservation
): KpStageRelativeRect {
  if (atom.paintKind === "glyph") {
    return measureKpNativeKatexTextInkRect(stage, element);
  }
  return measureKpNativeKatexSubtreePaintRect(stage, element) ??
    stageRelativeRect(stage, element);
}

function stageRelativeRect(
  stage: HTMLElement,
  element: HTMLElement
): KpStageRelativeRect {
  const stageRect = stage.getBoundingClientRect();
  return normalizeKpStageRelativeRect({
    stageClientRect: stageRect,
    stageLayoutWidth: stage.offsetWidth || stageRect.width,
    stageLayoutHeight: stage.offsetHeight || stageRect.height,
    fragmentClientRect: element.getBoundingClientRect()
  });
}

function effectiveOpacity(element: HTMLElement, stage: HTMLElement): number {
  let opacity = 1;
  let current: HTMLElement | null = element;
  while (current !== null) {
    opacity *= Number(getComputedStyle(current).opacity);
    if (current === stage) break;
    current = current.parentElement;
  }
  return opacity;
}

function fontFingerprint(computed: CSSStyleDeclaration): string {
  return [
    "font-family",
    "font-size",
    "font-style",
    "font-weight",
    "letter-spacing",
    "line-height"
  ].map((property) =>
    `${property}:${computed.getPropertyValue(property)}`
  ).join("|");
}

function validateSnapshots(
  input: {
    readonly successor: KpNativeKatexSuccessorEndpointSnapshot;
    readonly nativeTarget: KpNativeKatexSuccessorEndpointSnapshot;
    readonly postSettlement: KpNativeKatexSuccessorEndpointSnapshot;
  },
  diagnostics: KpNativeKatexSuccessorEndpointDiagnostic[]
): void {
  if (
    input.successor.checkpoint !== "successor-one-minus-epsilon" ||
    input.nativeTarget.checkpoint !== "native-target" ||
    input.postSettlement.checkpoint !== "post-settlement"
  ) {
    diagnostics.push(diagnostic(
      "endpoint.input.invalid",
      "checkpoint",
      "Endpoint microscope requires 1-epsilon, native, and post-settlement."
    ));
  }
  const snapshots = [
    input.successor,
    input.nativeTarget,
    input.postSettlement
  ];
  if (snapshots.some((snapshot) =>
    snapshot.schemaVersion !==
      "kp.native-katex-successor-endpoint-snapshot.v1" ||
    snapshot.lifecycle !== "renderer-session" ||
    snapshot.semanticAuthority !==
      "successor-program-and-observed-atom-correlation"
  )) {
    diagnostics.push(diagnostic(
      "endpoint.input.invalid",
      "snapshot",
      "Endpoint snapshots require renderer-session correlation authority."
    ));
  }
  if (snapshots.some((snapshot) =>
    snapshot.viewportKey !== input.nativeTarget.viewportKey ||
    snapshot.deviceScaleFactor !== input.nativeTarget.deviceScaleFactor ||
    snapshot.fontRevision !== input.nativeTarget.fontRevision
  )) {
    diagnostics.push(diagnostic(
      "endpoint.environment.mismatch",
      "snapshot.viewportKey",
      "Endpoint snapshots must share viewport, DPR, and font revision."
    ));
  }
}

function compareSnapshotPair(input: {
  readonly left: KpNativeKatexSuccessorEndpointSnapshot;
  readonly right: KpNativeKatexSuccessorEndpointSnapshot;
  readonly expectedLeftOwner: KpNativeKatexSuccessorEndpointOwner;
  readonly issuePrefix: string;
  readonly tolerance: number;
  readonly metrics: {
    geometry: number;
    baseline: number;
    inset: number;
    rule: number;
  };
  readonly diagnostics: KpNativeKatexSuccessorEndpointDiagnostic[];
}): void {
  const rightById = new Map(input.right.atoms.map((atom) =>
    [atom.paintAtomId, atom]
  ));
  if (
    input.left.atoms.length !== input.right.atoms.length ||
    new Set(input.left.atoms.map(({ paintAtomId }) => paintAtomId)).size !==
      input.left.atoms.length
  ) {
    input.diagnostics.push(diagnostic(
      "endpoint.inventory.mismatch",
      `${input.issuePrefix}.atoms`,
      "Endpoint atom inventory must be total and unique."
    ));
  }
  for (const left of input.left.atoms) {
    const path = `${input.issuePrefix}.atoms.${left.paintAtomId}`;
    const right = rightById.get(left.paintAtomId);
    if (right === undefined) {
      input.diagnostics.push(diagnostic(
        "endpoint.inventory.mismatch",
        path,
        `Endpoint atom ${left.paintAtomId} is missing.`
      ));
      continue;
    }
    if (
      left.owner !== input.expectedLeftOwner ||
      right.owner !== "native-target"
    ) {
      input.diagnostics.push(diagnostic(
        "endpoint.owner.mismatch",
        `${path}.owner`,
        "Endpoint paint must transfer from its declared owner to native target."
      ));
    }
    if (
      left.paintAlignment !== (
        input.expectedLeftOwner === "successor-target-material"
          ? "measured-ink"
          : "native"
      ) ||
      right.paintAlignment !== "native"
    ) {
      input.diagnostics.push(diagnostic(
        "endpoint.inner-paint.mismatch",
        `${path}.paintAlignment`,
        "Successor endpoint requires measured-ink alignment before native handoff."
      ));
    }
    if (
      left.paintKind !== right.paintKind ||
      left.paintFingerprint !== right.paintFingerprint ||
      left.semanticEntityId !== right.semanticEntityId
    ) {
      input.diagnostics.push(diagnostic(
        "endpoint.paint.mismatch",
        `${path}.paintFingerprint`,
        "Correlated endpoint atoms must preserve paint and semantic identity."
      ));
    }
    compareRect(
      left.paintRect,
      right.paintRect,
      input.tolerance,
      "endpoint.geometry.mismatch",
      `${path}.paintRect`,
      input.metrics,
      "geometry",
      input.diagnostics
    );
    const insetDelta = maximumObjectDelta(left.innerInset, right.innerInset);
    input.metrics.inset = Math.max(input.metrics.inset, insetDelta);
    if (insetDelta > input.tolerance) {
      input.diagnostics.push(diagnostic(
        "endpoint.inner-paint.mismatch",
        `${path}.innerInset`,
        `Inner paint inset changed by ${round(insetDelta)} CSS px.`
      ));
    }
    const baselineDelta = baselineDifference(left.baselineY, right.baselineY);
    input.metrics.baseline = Math.max(input.metrics.baseline, baselineDelta);
    if (baselineDelta > input.tolerance) {
      input.diagnostics.push(diagnostic(
        "endpoint.baseline.mismatch",
        `${path}.baselineY`,
        `Glyph baseline changed by ${round(baselineDelta)} CSS px.`
      ));
    }
    if (left.styleFingerprint !== right.styleFingerprint) {
      input.diagnostics.push(diagnostic(
        "endpoint.style.mismatch",
        `${path}.styleFingerprint`,
        "Computed paint style changed at native handoff."
      ));
    }
    if (left.fontFingerprint !== right.fontFingerprint) {
      input.diagnostics.push(diagnostic(
        "endpoint.font.mismatch",
        `${path}.fontFingerprint`,
        "Font fingerprint changed at native handoff."
      ));
    }
    if (left.opacity < 0.99 || right.opacity < 0.99) {
      input.diagnostics.push(diagnostic(
        "endpoint.opacity.mismatch",
        `${path}.opacity`,
        "Endpoint owner must remain opaque through atomic handoff."
      ));
    }
    const ruleDelta = ruleDifference(left.ruleGeometry, right.ruleGeometry);
    input.metrics.rule = Math.max(input.metrics.rule, ruleDelta);
    if (ruleDelta > input.tolerance) {
      input.diagnostics.push(diagnostic(
        "endpoint.rule.mismatch",
        `${path}.ruleGeometry`,
        `Structural rule changed by ${round(ruleDelta)} CSS px.`
      ));
    }
  }
}

function compareRect(
  left: KpStageRelativeRect,
  right: KpStageRelativeRect,
  tolerance: number,
  code: KpNativeKatexSuccessorEndpointDiagnosticCode,
  path: string,
  metrics: { geometry: number },
  metric: "geometry",
  diagnostics: KpNativeKatexSuccessorEndpointDiagnostic[]
): void {
  const delta = maximumObjectDelta(left, right);
  metrics[metric] = Math.max(metrics[metric], delta);
  if (delta > tolerance) {
    diagnostics.push(diagnostic(
      code,
      path,
      `Endpoint paint geometry changed by ${round(delta)} CSS px.`
    ));
  }
}

function maximumObjectDelta(
  left: object,
  right: object
): number {
  const leftValues = left as Readonly<Record<string, number>>;
  const rightValues = right as Readonly<Record<string, number>>;
  return Math.max(...Object.keys(leftValues).map((key) =>
    Math.abs(leftValues[key]! - rightValues[key]!)
  ));
}

function baselineDifference(
  left: number | null,
  right: number | null
): number {
  if (left === null && right === null) return 0;
  if (left === null || right === null) return Number.POSITIVE_INFINITY;
  return Math.abs(left - right);
}

function ruleDifference(
  left: KpNativeKatexSuccessorEndpointAtomSnapshot["ruleGeometry"],
  right: KpNativeKatexSuccessorEndpointAtomSnapshot["ruleGeometry"]
): number {
  if (left === undefined && right === undefined) return 0;
  if (left === undefined || right === undefined) {
    return Number.POSITIVE_INFINITY;
  }
  return maximumObjectDelta(left, right);
}

function validateNormalizedDelta(
  value: number,
  maximum: number,
  code: KpNativeKatexSuccessorEndpointDiagnosticCode,
  path: string,
  diagnostics: KpNativeKatexSuccessorEndpointDiagnostic[]
): void {
  if (!Number.isFinite(value) || value < 0 || value > maximum + 1e-12) {
    diagnostics.push(diagnostic(
      code,
      path,
      `Normalized paint delta ${value} exceeds ${maximum}.`
    ));
  }
}

function diagnostic(
  code: KpNativeKatexSuccessorEndpointDiagnosticCode,
  path: string,
  message: string
): KpNativeKatexSuccessorEndpointDiagnostic {
  return Object.freeze({ code, path, message });
}

function round(value: number): number {
  return Number.isFinite(value)
    ? Math.round(value * 1_000_000) / 1_000_000
    : value;
}
