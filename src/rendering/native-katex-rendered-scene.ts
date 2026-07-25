import type { KpStageRelativeRect } from "./native-katex-fragment-observer.ts";

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
