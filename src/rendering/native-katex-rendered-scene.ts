import {
  measureKpStageRelativeRectDelta,
  normalizeKpStageRelativeRect,
  type KpStageRelativeRect
} from "./native-katex-fragment-observer.ts";
import type {
  KpEquationFontReadiness
} from "./equation-font-readiness.ts";
import {
  kpEquationSettlementTolerancePx
} from "../animation/equation-shared-presentation-policy.ts";

export type KpNativeKatexPaintKind =
  | "glyph"
  | "rule"
  | "path"
  | "delimiter"
  | "accent";

export interface KpNativeKatexPaintAtomObservation {
  readonly kind: "native-katex-paint-atom-observation";
  readonly lifecycle: "renderer-session";
  readonly id: string;
  readonly endpoint: "source" | "target";
  readonly semanticEntityId: string;
  readonly presentationGroupId: string;
  readonly paintKind: KpNativeKatexPaintKind;
  readonly visualKey: string;
  readonly sourceElement: HTMLElement;
  readonly rect: KpStageRelativeRect;
  readonly styleFingerprint: string;
  readonly zOrder: number;
  readonly fontRevision: number;
}

export interface KpNativeKatexPresentationGroupObservation {
  readonly id: string;
  readonly semanticEntityId: string;
  readonly parentGroupId?: string | undefined;
  readonly atomIds: readonly string[];
  readonly rect: KpStageRelativeRect;
}

export interface KpNativeKatexRenderedSceneObservation {
  readonly kind: "native-katex-rendered-scene-observation";
  readonly lifecycle: "renderer-session";
  readonly endpoint: "source" | "target";
  readonly stage: HTMLElement;
  readonly root: HTMLElement;
  readonly atoms: readonly KpNativeKatexPaintAtomObservation[];
  readonly groups: readonly KpNativeKatexPresentationGroupObservation[];
  readonly fontRevision: number;
  readonly viewportKey: string;
}

export type KpNativeKatexHandoffSide =
  | "native-source"
  | "material"
  | "native-target";

export interface KpNativeKatexRuleGeometry {
  readonly axis: "horizontal" | "vertical";
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly thickness: number;
}

export interface KpNativeKatexHandoffPaintObservation {
  readonly kind: "native-katex-handoff-paint-observation";
  readonly lifecycle: "renderer-session";
  readonly id: string;
  readonly side: KpNativeKatexHandoffSide;
  readonly paintAtomId: string;
  readonly semanticEntityId: string;
  readonly presentationGroupId: string;
  readonly paintKind: KpNativeKatexPaintKind;
  readonly element: HTMLElement;
  readonly rect: KpStageRelativeRect;
  readonly baselineY: number | null;
  readonly wrapperTransform: string;
  readonly wrapperFingerprint: string;
  readonly clipPath: string;
  readonly paintFingerprint: string;
  readonly styleFingerprint: string;
  readonly opacity: number;
  readonly ruleGeometry?: KpNativeKatexRuleGeometry | undefined;
  readonly fontRevision: number;
}

export interface KpNativeKatexHandoffTelemetry {
  readonly kind: "native-katex-handoff-telemetry";
  readonly lifecycle: "renderer-session";
  readonly stage: HTMLElement;
  readonly progress: number;
  readonly observations: readonly KpNativeKatexHandoffPaintObservation[];
  readonly fontRevision: number;
  readonly viewportKey: string;
}

export function createKpNativeKatexHandoffTelemetry(input: {
  readonly stage: HTMLElement;
  readonly progress: number;
  readonly observations: readonly KpNativeKatexHandoffPaintObservation[];
  readonly fontRevision: number;
  readonly viewportKey: string;
}): KpNativeKatexHandoffTelemetry {
  if (!Number.isFinite(input.progress) || input.progress < 0 || input.progress > 1) {
    throw new Error("Native KaTeX handoff progress must be between zero and one.");
  }
  if (!Number.isInteger(input.fontRevision) || input.fontRevision < 0) {
    throw new Error("Native KaTeX handoff font revision must be non-negative.");
  }
  if (input.viewportKey.trim() === "") {
    throw new Error("Native KaTeX handoff telemetry requires a viewport key.");
  }
  assertUnique(input.observations.map(({ id }) => id), "handoff observation");
  for (const observation of input.observations) {
    if (observation.element.ownerDocument !== input.stage.ownerDocument) {
      throw new Error(
        `Handoff observation ${observation.id} belongs to another document.`
      );
    }
    for (const [label, value] of [
      ["paint atom", observation.paintAtomId],
      ["semantic entity", observation.semanticEntityId],
      ["presentation group", observation.presentationGroupId],
      ["wrapper transform", observation.wrapperTransform],
      ["wrapper fingerprint", observation.wrapperFingerprint],
      ["clip path", observation.clipPath],
      ["paint fingerprint", observation.paintFingerprint],
      ["style fingerprint", observation.styleFingerprint]
    ] as const) {
      if (value.trim() === "") {
        throw new Error(`Handoff observation ${observation.id} requires ${label}.`);
      }
    }
    assertRect(observation.rect, `Handoff observation ${observation.id}`);
    if (
      observation.baselineY !== null &&
      !Number.isFinite(observation.baselineY)
    ) {
      throw new Error(
        `Handoff observation ${observation.id} requires a finite baseline.`
      );
    }
    if (
      !Number.isFinite(observation.opacity) ||
      observation.opacity < 0 ||
      observation.opacity > 1
    ) {
      throw new Error(
        `Handoff observation ${observation.id} requires bounded opacity.`
      );
    }
    if (!Number.isInteger(observation.fontRevision) || observation.fontRevision < 0) {
      throw new Error(
        `Handoff observation ${observation.id} requires a valid font revision.`
      );
    }
    if (observation.paintKind === "rule") {
      if (observation.ruleGeometry === undefined) {
        throw new Error(
          `Rule handoff observation ${observation.id} requires rule geometry.`
        );
      }
      assertRuleGeometry(observation.ruleGeometry, observation.id);
    } else if (observation.ruleGeometry !== undefined) {
      throw new Error(
        `Non-rule handoff observation ${observation.id} cannot carry rule geometry.`
      );
    }
  }
  return Object.freeze({
    kind: "native-katex-handoff-telemetry",
    lifecycle: "renderer-session",
    stage: input.stage,
    progress: input.progress,
    observations: Object.freeze(input.observations.map((observation) =>
      Object.freeze({
        ...observation,
        rect: Object.freeze({ ...observation.rect }),
        ...(observation.ruleGeometry === undefined
          ? {}
          : { ruleGeometry: Object.freeze({ ...observation.ruleGeometry }) })
      })
    )),
    fontRevision: input.fontRevision,
    viewportKey: input.viewportKey
  });
}

export async function settleAndObserveKpNativeKatexRenderedScene(input: {
  readonly endpoint: "source" | "target";
  readonly stage: HTMLElement;
  readonly root: HTMLElement;
  readonly semanticEntityId: string;
  readonly presentationGroupId: string;
  readonly fontReadiness: KpEquationFontReadiness;
  readonly geometryTolerancePx?: number | undefined;
}): Promise<KpNativeKatexRenderedSceneObservation> {
  await input.fontReadiness.whenReady();
  await nextSceneLayoutFrame(input.stage.ownerDocument);
  const first = observeKpNativeKatexRenderedScene(input);
  await nextSceneLayoutFrame(input.stage.ownerDocument);
  const second = observeKpNativeKatexRenderedScene(input);
  const tolerance = input.geometryTolerancePx ?? kpEquationSettlementTolerancePx;
  if (first.atoms.length !== second.atoms.length) {
    throw new Error("Rendered scene paint inventory changed between layout frames.");
  }
  first.atoms.forEach((atom, index) => {
    const settled = second.atoms[index]!;
    if (
      atom.id !== settled.id ||
      atom.visualKey !== settled.visualKey ||
      atom.styleFingerprint !== settled.styleFingerprint ||
      measureKpStageRelativeRectDelta(atom.rect, settled.rect) > tolerance
    ) {
      throw new Error(`Rendered scene atom ${atom.id} did not settle.`);
    }
  });
  return second;
}

type KpNativeKatexPaintObservationInput = {
  readonly endpoint: "source" | "target";
  readonly stage: HTMLElement;
  readonly root: HTMLElement;
  readonly semanticEntityId: string;
  readonly presentationGroupId: string;
  readonly fontRevision: number;
  readonly includeHiddenPaint?: boolean | undefined;
};

export function observeKpNativeKatexGlyphPaintAtoms(
  input: KpNativeKatexPaintObservationInput
): readonly KpNativeKatexPaintAtomObservation[] {
  const stageRect = input.stage.getBoundingClientRect();
  const stageLayoutWidth = input.stage.offsetWidth || stageRect.width;
  const stageLayoutHeight = input.stage.offsetHeight || stageRect.height;
  const candidates = [input.root, ...input.root.querySelectorAll<HTMLElement>("*")]
    .filter((element) => {
      if (
        element.closest(".katex-mathml") !== null ||
        element.tagName.toLowerCase() === "annotation"
      ) {
        return false;
      }
      return directPaintText(element) !== "";
    });
  return Object.freeze(candidates.flatMap((sourceElement, ordinal) => {
    const computed = getComputedStyle(sourceElement);
    const clientRect = sourceElement.getBoundingClientRect();
    if (
      computed.display === "none" ||
      (computed.visibility === "hidden" && input.includeHiddenPaint !== true) ||
      Number(computed.opacity) === 0 ||
      clientRect.width <= 0 ||
      clientRect.height <= 0
    ) {
      return [];
    }
    const text = directPaintText(sourceElement);
    return [Object.freeze({
      kind: "native-katex-paint-atom-observation" as const,
      lifecycle: "renderer-session" as const,
      id: `${input.endpoint}.paint.glyph.${ordinal}`,
      endpoint: input.endpoint,
      semanticEntityId: input.semanticEntityId,
      presentationGroupId: input.presentationGroupId,
      paintKind: "glyph" as const,
      visualKey: `glyph:${text}`,
      sourceElement,
      rect: normalizeKpStageRelativeRect({
        stageClientRect: stageRect,
        stageLayoutWidth,
        stageLayoutHeight,
        fragmentClientRect: clientRect
      }),
      styleFingerprint: fingerprintKpNativeKatexPaintStyle(computed),
      zOrder: ordinal,
      fontRevision: input.fontRevision
    })];
  }));
}

export function observeKpNativeKatexPaintAtoms(input:
  KpNativeKatexPaintObservationInput & {
  readonly requireExplicitOwnership?: boolean | undefined;
}): readonly KpNativeKatexPaintAtomObservation[] {
  const glyphs = observeKpNativeKatexGlyphPaintAtoms(input);
  const stageRect = input.stage.getBoundingClientRect();
  const stageLayoutWidth = input.stage.offsetWidth || stageRect.width;
  const stageLayoutHeight = input.stage.offsetHeight || stageRect.height;
  const structural = [
    input.root,
    ...input.root.querySelectorAll<HTMLElement>("*")
  ].flatMap((sourceElement, ordinal) => {
    if (
      sourceElement.closest(".katex-mathml") !== null ||
      sourceElement.tagName.toLowerCase() === "annotation"
    ) {
      return [];
    }
    const computed = getComputedStyle(sourceElement);
    const paintKind = structuralPaintKind(sourceElement, computed);
    const clientRect = sourceElement.getBoundingClientRect();
    if (
      paintKind === undefined ||
      computed.display === "none" ||
      (computed.visibility === "hidden" && input.includeHiddenPaint !== true) ||
      Number(computed.opacity) === 0 ||
      clientRect.width <= 0 ||
      clientRect.height <= 0
    ) {
      return [];
    }
    return [Object.freeze({
      kind: "native-katex-paint-atom-observation" as const,
      lifecycle: "renderer-session" as const,
      id: `${input.endpoint}.paint.${paintKind}.${ordinal}`,
      endpoint: input.endpoint,
      semanticEntityId: input.semanticEntityId,
      presentationGroupId: input.presentationGroupId,
      paintKind,
      visualKey: structuralVisualKey(sourceElement, paintKind),
      sourceElement,
      rect: normalizeKpStageRelativeRect({
        stageClientRect: stageRect,
        stageLayoutWidth,
        stageLayoutHeight,
        fragmentClientRect: clientRect
      }),
      styleFingerprint: fingerprintKpNativeKatexPaintStyle(computed),
      zOrder: glyphs.length + ordinal,
      fontRevision: input.fontRevision
    })];
  });
  return Object.freeze([...glyphs, ...structural].map((atom) => {
    const owner = atom.sourceElement.closest<HTMLElement>(
      "[data-kp-semantic-entity-id], [data-kp-presentation-group-id]"
    );
    const semanticEntityId = owner?.dataset["kpSemanticEntityId"];
    const presentationGroupId = owner?.dataset["kpPresentationGroupId"];
    if (
      input.requireExplicitOwnership === true &&
      (
        owner === null ||
        !input.root.contains(owner) ||
        semanticEntityId === undefined ||
        presentationGroupId === undefined
      )
    ) {
      throw new Error(
        `Paint atom ${atom.id} has no explicit semantic presentation owner.`
      );
    }
    return Object.freeze({
      ...atom,
      semanticEntityId: semanticEntityId ?? input.semanticEntityId,
      presentationGroupId:
        presentationGroupId ?? input.presentationGroupId
    });
  }));
}

export function createKpNativeKatexRenderedSceneObservation(input: {
  readonly endpoint: "source" | "target";
  readonly stage: HTMLElement;
  readonly root: HTMLElement;
  readonly atoms: readonly KpNativeKatexPaintAtomObservation[];
  readonly groups: readonly KpNativeKatexPresentationGroupObservation[];
  readonly fontRevision: number;
  readonly viewportKey: string;
}): KpNativeKatexRenderedSceneObservation {
  if (
    input.root.ownerDocument !== input.stage.ownerDocument ||
    input.atoms.some(({ sourceElement }) =>
      sourceElement.ownerDocument !== input.stage.ownerDocument
    )
  ) {
    throw new Error("Rendered scene elements must share one renderer document.");
  }
  if (!Number.isInteger(input.fontRevision) || input.fontRevision < 0) {
    throw new Error("Rendered scene font revision must be a non-negative integer.");
  }
  if (input.viewportKey.trim() === "") {
    throw new Error("Rendered scene requires a viewport cache key.");
  }
  assertUnique(input.atoms.map(({ id }) => id), "paint atom");
  assertUnique(input.groups.map(({ id }) => id), "presentation group");
  const groupIds = new Set(input.groups.map(({ id }) => id));
  const atomIds = new Set(input.atoms.map(({ id }) => id));
  for (const atom of input.atoms) {
    if (atom.endpoint !== input.endpoint) {
      throw new Error(`Paint atom ${atom.id} belongs to the wrong endpoint.`);
    }
    if (!groupIds.has(atom.presentationGroupId)) {
      throw new Error(`Paint atom ${atom.id} has no presentation group.`);
    }
    assertRect(atom.rect, `Paint atom ${atom.id}`);
  }
  for (const group of input.groups) {
    assertRect(group.rect, `Presentation group ${group.id}`);
    if (
      group.parentGroupId !== undefined &&
      !groupIds.has(group.parentGroupId)
    ) {
      throw new Error(`Presentation group ${group.id} has no parent group.`);
    }
    for (const atomId of group.atomIds) {
      if (!atomIds.has(atomId)) {
        throw new Error(`Presentation group ${group.id} references unknown atom ${atomId}.`);
      }
    }
  }
  return Object.freeze({
    kind: "native-katex-rendered-scene-observation",
    lifecycle: "renderer-session",
    endpoint: input.endpoint,
    stage: input.stage,
    root: input.root,
    atoms: Object.freeze(input.atoms.map((atom) => Object.freeze({
      ...atom,
      rect: Object.freeze({ ...atom.rect })
    }))),
    groups: Object.freeze(input.groups.map((group) => Object.freeze({
      ...group,
      atomIds: Object.freeze([...group.atomIds]),
      rect: Object.freeze({ ...group.rect })
    }))),
    fontRevision: input.fontRevision,
    viewportKey: input.viewportKey
  });
}

export function fingerprintKpNativeKatexPaintStyle(
  computed: CSSStyleDeclaration
): string {
  return [
    "font-family",
    "font-size",
    "font-style",
    "font-weight",
    "color",
    "letter-spacing",
    "line-height",
    "transform",
    "vertical-align"
  ].map((property) =>
    `${property}:${computed.getPropertyValue(property)}`
  ).join("|");
}

function directPaintText(element: HTMLElement): string {
  // KaTeX uses zero-width vlist text as layout scaffolding; its wrapper can
  // have geometry even though the text contributes no visible paint.
  return [...element.childNodes]
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent ?? "")
    .join("")
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .trim();
}

export function observeKpNativeKatexRenderedScene(input: {
  readonly endpoint: "source" | "target";
  readonly stage: HTMLElement;
  readonly root: HTMLElement;
  readonly semanticEntityId: string;
  readonly presentationGroupId: string;
  readonly fontReadiness: KpEquationFontReadiness;
  readonly includeHiddenPaint?: boolean | undefined;
}): KpNativeKatexRenderedSceneObservation {
  const atoms = observeKpNativeKatexPaintAtoms({
    endpoint: input.endpoint,
    stage: input.stage,
    root: input.root,
    semanticEntityId: input.semanticEntityId,
    presentationGroupId: input.presentationGroupId,
    fontRevision: input.fontReadiness.revision,
    requireExplicitOwnership: true,
    includeHiddenPaint: input.includeHiddenPaint
  });
  const groupElements = new Map<string, HTMLElement>();
  for (const atom of atoms) {
    let owner = atom.sourceElement.closest<HTMLElement>(
      "[data-kp-presentation-group-id]"
    );
    while (owner !== null && input.root.contains(owner)) {
      const groupId = owner.dataset["kpPresentationGroupId"];
      if (groupId !== undefined) groupElements.set(groupId, owner);
      owner = owner.parentElement?.closest<HTMLElement>(
        "[data-kp-presentation-group-id]"
      ) ?? null;
    }
  }
  const groups = [...groupElements].map(([groupId, owner]) => {
    const groupAtoms = atoms.filter(({ sourceElement }) =>
      owner.contains(sourceElement)
    );
    const parent = owner?.parentElement?.closest<HTMLElement>(
      "[data-kp-presentation-group-id]"
    );
    return {
      id: groupId,
      semanticEntityId:
        owner.dataset["kpSemanticEntityId"] ?? groupAtoms[0]!.semanticEntityId,
      ...(parent?.dataset["kpPresentationGroupId"] === undefined
        ? {}
        : { parentGroupId: parent.dataset["kpPresentationGroupId"] }),
      atomIds: groupAtoms.map(({ id }) => id),
      rect: unionKpStageRelativeRects(groupAtoms.map(({ rect }) => rect))
    };
  });
  const stageRect = input.stage.getBoundingClientRect();
  const dpr = input.stage.ownerDocument.defaultView?.devicePixelRatio ?? 1;
  return createKpNativeKatexRenderedSceneObservation({
    endpoint: input.endpoint,
    stage: input.stage,
    root: input.root,
    atoms,
    groups,
    fontRevision: input.fontReadiness.revision,
    viewportKey:
      `${input.endpoint}:${stageRect.width}x${stageRect.height}` +
      `@${dpr}:font-${input.fontReadiness.revision}`
  });
}

export function unionKpStageRelativeRects(
  rects: readonly KpStageRelativeRect[]
): KpStageRelativeRect {
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.top + rect.height));
  return { left, top, width: right - left, height: bottom - top };
}

export { measureKpStageRelativeRectDelta };

function nextSceneLayoutFrame(document: Document): Promise<void> {
  const view = document.defaultView;
  if (view === null) {
    throw new Error("Rendered scene observation requires a browser window.");
  }
  return new Promise((resolve) => view.requestAnimationFrame(() => resolve()));
}

function structuralPaintKind(
  element: HTMLElement,
  computed: CSSStyleDeclaration
): Exclude<KpNativeKatexPaintKind, "glyph"> | undefined {
  const tagName = element.tagName.toLowerCase();
  if (tagName === "svg" && element.parentElement?.closest("svg") === null) {
    const classes = element.getAttribute("class") ?? "";
    if (classes.includes("accent")) return "accent";
    if (classes.includes("delim")) return "delimiter";
    return "path";
  }
  const hasVisibleBorder = [
    ["border-top-width", "border-top-style"],
    ["border-right-width", "border-right-style"],
    ["border-bottom-width", "border-bottom-style"],
    ["border-left-width", "border-left-style"]
  ].some(([width, style]) =>
    Number.parseFloat(computed.getPropertyValue(width!)) > 0 &&
    !["none", "hidden"].includes(computed.getPropertyValue(style!))
  );
  if (hasVisibleBorder) return "rule";
  const classes = element.className;
  if (typeof classes === "string") {
    if (classes.includes("accent-body")) return "accent";
    if (classes.includes("delimsizing") || classes.includes("delim-size")) {
      return "delimiter";
    }
  }
  return undefined;
}

function structuralVisualKey(
  element: HTMLElement,
  paintKind: Exclude<KpNativeKatexPaintKind, "glyph">
): string {
  if (paintKind === "rule") return "rule";
  const viewBox = element.getAttribute("viewBox") ?? "";
  const pathData = [...element.querySelectorAll("path")]
    .map((path) => path.getAttribute("d") ?? "")
    .join("|");
  return `${paintKind}:${viewBox}:${pathData}`;
}

function assertUnique(values: readonly string[], label: string): void {
  if (values.some((value) => value.trim() === "")) {
    throw new Error(`Rendered scene ${label} IDs must be non-empty.`);
  }
  if (new Set(values).size !== values.length) {
    throw new Error(`Rendered scene ${label} ID is duplicated.`);
  }
}

function assertRect(rect: KpStageRelativeRect, label: string): void {
  if (
    ![rect.left, rect.top, rect.width, rect.height].every(Number.isFinite) ||
    rect.width <= 0 ||
    rect.height <= 0
  ) {
    throw new Error(`${label} requires positive finite geometry.`);
  }
}

function assertRuleGeometry(
  geometry: KpNativeKatexRuleGeometry,
  observationId: string
): void {
  if (
    ![
      geometry.left,
      geometry.top,
      geometry.width,
      geometry.thickness
    ].every(Number.isFinite) ||
    geometry.width <= 0 ||
    geometry.thickness <= 0
  ) {
    throw new Error(
      `Rule handoff observation ${observationId} requires positive finite geometry.`
    );
  }
}
