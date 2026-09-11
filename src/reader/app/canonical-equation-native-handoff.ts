import { isKpVerifiedEquationEndpointHandoff, type KpVerifiedEquationEndpointHandoff } from "../../semantic/equation-endpoint-handoff.ts";
import { observeKpNativeKatexPaintAtoms, type KpNativeKatexPaintAtomObservation } from "../../rendering/native-katex-rendered-scene.ts";
import { measureKpNativeKatexPaintAtomRect } from "../../rendering/native-katex-paint-geometry.ts";
import type { KpReaderEquationMeasuredAnchor, KpReaderEquationLayoutSnapshot } from "../renderers/public-api.ts";

const brand = Symbol("measured-canonical-equation-handoff");
const issued = new WeakMap<object, string>();
export interface KpMeasuredCanonicalEquationHandoff {
  readonly [brand]: true;
  readonly fromTransitionId: string;
  readonly toTransitionId: string;
  readonly authority: KpVerifiedEquationEndpointHandoff;
  readonly sourceMeasurementIdentity: KpReaderEquationLayoutSnapshot["measurementIdentity"];
  readonly targetMeasurementIdentity: KpReaderEquationLayoutSnapshot["measurementIdentity"];
  readonly sourceAnchors: ReadonlyMap<string, KpReaderEquationMeasuredAnchor>;
  readonly targetAnchors: ReadonlyMap<string, KpReaderEquationMeasuredAnchor>;
  readonly toJSON: () => never;
}

/** Separate native endpoint clones need realized leaf evidence, not an alias
 * waiver or bounding-box equivalence. The single-handle ownership seam remains
 * unchanged; this owner verifies the reader's independently rendered clones. */
export function measureKpCanonicalEquationNativeHandoff(input: {
  readonly authority: KpVerifiedEquationEndpointHandoff;
  readonly from: { readonly id: string; readonly measurementRoot: HTMLElement; readonly layout: KpReaderEquationLayoutSnapshot };
  readonly to: { readonly id: string; readonly measurementRoot: HTMLElement; readonly layout: KpReaderEquationLayoutSnapshot };
  readonly fontRevision: number;
}): KpMeasuredCanonicalEquationHandoff {
  const { authority, from, to } = input;
  if (!isKpVerifiedEquationEndpointHandoff(authority)) throw new TypeError("Native handoff requires issued semantic partition authority.");
  const sourceRoot = stateRoot(from.measurementRoot, authority.source.object.id);
  const targetRoot = stateRoot(to.measurementRoot, authority.target.object.id);
  const sourceAnchors = new Map<string, KpReaderEquationMeasuredAnchor>();
  const targetAnchors = new Map<string, KpReaderEquationMeasuredAnchor>();
  const sourceLeaves = new Set<Element>(), targetLeaves = new Set<Element>();
  const observe = (stage: HTMLElement, root: HTMLElement, endpoint: "source" | "target", occurrenceId: string) =>
    observeKpNativeKatexPaintAtoms({ stage, root, endpoint, semanticEntityId: occurrenceId, presentationGroupId: occurrenceId,
      fontRevision: input.fontRevision, includeHiddenPaint: true }).map(atom => ({ ...atom, rect: measureKpNativeKatexPaintAtomRect(stage, atom) }));
  for (const coverage of authority.coverage) {
    const sources = observe(from.measurementRoot, selectorRoot(sourceRoot, coverage.sourceSelectorId), "target", coverage.occurrenceId);
    const targets = coverage.targetSelectorIds.flatMap(selectorId => observe(to.measurementRoot, selectorRoot(targetRoot, selectorId), "source", coverage.occurrenceId)
      .map(atom => ({ atom, selectorId })));
    if (sources.length === 0 || sources.length !== targets.length) throw new Error("Native handoff changed complete leaf inventory.");
    sources.forEach((atom, index) => {
      const target = targets[index]!;
      if (sourceLeaves.has(atom.sourceElement) || targetLeaves.has(target.atom.sourceElement)) throw new Error("Native handoff has overlapping leaf owners.");
      sourceLeaves.add(atom.sourceElement); targetLeaves.add(target.atom.sourceElement);
      // Geometry translation is resolved by the canonical row solver below.
      // Paint, style and baseline within each leaf must already be identical.
      if (atom.paintKind !== target.atom.paintKind || atom.visualKey !== target.atom.visualKey || atom.styleFingerprint !== target.atom.styleFingerprint ||
          (atom.baselineY == null) !== (target.atom.baselineY == null) ||
          (atom.baselineY != null && target.atom.baselineY != null && Math.abs((atom.baselineY - atom.rect.top) - (target.atom.baselineY - target.atom.rect.top)) > .5))
        throw new Error(`Native handoff changed leaf paint, style or baseline at ${coverage.occurrenceId}:${index}.`);
      const key = `${coverage.occurrenceId}.leaf.${index}`;
      sourceAnchors.set(key, anchor(atom, authority.source.object.id, coverage.sourceSelectorId, index));
      targetAnchors.set(key, anchor(target.atom, authority.target.object.id, target.selectorId, index));
    });
  }
  const complete = (stage: HTMLElement, root: HTMLElement, endpoint: "source" | "target", leaves: Set<Element>) => {
    const all = observe(stage, root, endpoint, authority.semanticStateId);
    if (all.length !== leaves.size || all.some(atom => !leaves.has(atom.sourceElement))) throw new Error("Native handoff leaves paint outside the issued partition.");
  };
  complete(from.measurementRoot, sourceRoot, "target", sourceLeaves);
  complete(to.measurementRoot, targetRoot, "source", targetLeaves);
  const measured: KpMeasuredCanonicalEquationHandoff = Object.freeze({ [brand]: true as const, fromTransitionId: from.id, toTransitionId: to.id,
    authority, sourceMeasurementIdentity: from.layout.measurementIdentity, targetMeasurementIdentity: to.layout.measurementIdentity,
    sourceAnchors, targetAnchors, toJSON(): never { throw new Error("Native handoff measurements are renderer-session ephemeral."); } });
  issued.set(measured, snapshot(measured));
  return measured;
}
export function assertKpMeasuredCanonicalEquationHandoff(value: unknown): asserts value is KpMeasuredCanonicalEquationHandoff {
  if (!value || typeof value !== "object" || !issued.has(value)) throw new TypeError("Use a measured canonical native handoff.");
  if (issued.get(value) !== snapshot(value as KpMeasuredCanonicalEquationHandoff)) throw new TypeError("Native handoff measurement changed after issuance.");
}
function snapshot(value: KpMeasuredCanonicalEquationHandoff) { return JSON.stringify([[...value.sourceAnchors], [...value.targetAnchors]]); }
function stateRoot(root: HTMLElement, stateId: string): HTMLElement {
  const matches = [...root.querySelectorAll<HTMLElement>("[data-kp-reader-equation-state]")].filter(element => element.dataset["kpReaderEquationState"] === stateId);
  if (matches.length !== 1) throw new Error("Native handoff requires one exact endpoint clone.");
  return matches[0]!;
}
function selectorRoot(root: HTMLElement, selectorId: string): HTMLElement {
  const matches = [...root.querySelectorAll<HTMLElement>("[data-kp-reader-selector-id]")].filter(element => element.dataset["kpReaderSelectorId"] === selectorId);
  if (matches.length !== 1) throw new Error("Native handoff requires one exclusive selector root.");
  return matches[0]!;
}
function anchor(atom: KpNativeKatexPaintAtomObservation, objectId: string, selectorId: string, index: number): KpReaderEquationMeasuredAnchor {
  return Object.freeze({ id: `${selectorId}.leaf.${index}`, side: atom.endpoint, objectId, selectorId, selectorIndex: index,
    anchorKind: "ink-center", focused: false, rect: atom.rect, center: { x: atom.rect.left + atom.rect.width / 2, y: atom.rect.top + atom.rect.height / 2 } });
}
