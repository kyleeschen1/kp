import {
  measureKpNativeKatexBaselineY,
  measureKpNativeKatexSubtreePaintRect
} from "../../rendering/native-katex-paint-geometry.ts";
import {
  applyKpCertifiedEquationStageLayout,
  certifyKpSingleRowEquationStageLayout,
  certifyKpTwoRowEquationStageLayout,
  compileKpMeasuredEquationStageInput,
  type KpAppliedEquationStageLayout,
  type KpEquationStageEnvelopeDefinition,
  type KpEquationStageEnvelopeObservation,
  type KpEquationStageMeasurementIdentity,
  type KpEquationStagePhaseIntent
} from "../runtime/public-api.ts";
import {
  certifyKpEquationStageTransitCorridor,
  type KpCorridorCertifiedEquationStageLayout
} from "../runtime/public-api.ts";

export interface KpSemanticEnvelopeStageEndpoint {
  readonly objectId: string;
  readonly groupEnvelopes: readonly {
    readonly id: string;
    readonly memberSelectorIds: readonly string[];
    readonly structuralAnchorIds?: readonly string[] | undefined;
  }[];
}

/**
 * This is the only DOM application path for semantic equation-stage layouts.
 * Lesson adapters identify envelopes; native paint measurement and the
 * certified row/corridor laws retain all geometry authority.
 */
export function applyKpSemanticEnvelopeEquationStageLayout(input: {
  readonly phaseIntent: KpEquationStagePhaseIntent;
  readonly sourceObjectIds: readonly string[];
  readonly targetObjectIds: readonly string[];
  readonly measurementRoot: HTMLElement;
  readonly measurementIdentity: KpEquationStageMeasurementIdentity;
  readonly endpoints: readonly KpSemanticEnvelopeStageEndpoint[];
  readonly envelopeDataKey:
    | "kpFoldableEnvelopeId"
    | "kpEquationStageEnvelopeId";
  readonly memberDataKey:
    | "kpFoldableLayoutMemberId"
    | "kpEquationStageMemberId";
  readonly envelopeObservation: "wrapped" | "member-paint-union";
  readonly diagnosticLabel: string;
}): KpAppliedEquationStageLayout<KpCorridorCertifiedEquationStageLayout> {
  const endpointById = new Map(
    input.endpoints.map((endpoint) => [endpoint.objectId, endpoint])
  );
  const objectIds = [...input.sourceObjectIds, ...input.targetObjectIds];
  const stateRoots = new Map(objectIds.map((objectId) => {
    if (!endpointById.has(objectId)) {
      throw new Error(
        `${input.diagnosticLabel} stage layout has no endpoint ${objectId}.`
      );
    }
    return [
      objectId,
      requireDescendant(
        input.measurementRoot,
        `[data-kp-reader-equation-state="${CSS.escape(objectId)}"]`
      )
    ] as const;
  }));
  const definitions: KpEquationStageEnvelopeDefinition[] = [];
  const observations: KpEquationStageEnvelopeObservation[] = [];
  const memberElements = new Map<string, HTMLElement>();
  const requestedEnvelopeIds = input.phaseIntent.rows.flatMap(
    ({ envelopeIds }) => envelopeIds
  );
  for (const envelopeId of requestedEnvelopeIds) {
    const owners = objectIds.flatMap((objectId) => {
      const endpoint = endpointById.get(objectId)!;
      const envelope = endpoint.groupEnvelopes.find(
        ({ id }) => id === envelopeId
      );
      return envelope === undefined ? [] : [{ endpoint, envelope }];
    });
    if (owners.length !== 1) {
      throw new Error(
        `${input.diagnosticLabel} stage envelope ${envelopeId} must resolve to one endpoint.`
      );
    }
    const { endpoint, envelope } = owners[0]!;
    const stateRoot = stateRoots.get(endpoint.objectId)!;
    const ownerIds = [
      ...envelope.memberSelectorIds,
      ...(envelope.structuralAnchorIds ?? [])
    ];
    const ownerElements = ownerIds.map((ownerId) =>
      requireDescendant(
        stateRoot,
        dataSelector(input.memberDataKey, ownerId)
      )
    );
    const envelopeElement = input.envelopeObservation === "wrapped"
      ? requireDescendant(
          stateRoot,
          dataSelector(input.envelopeDataKey, envelope.id)
        )
      : stateRoot;
    const rect = input.envelopeObservation === "wrapped"
      ? measureKpNativeKatexSubtreePaintRect(
          input.measurementRoot,
          envelopeElement
        )
      : unionPaintRects(
          ownerElements.map((element) =>
            measureKpNativeKatexSubtreePaintRect(
              input.measurementRoot,
              element
            )
          )
        );
    if (rect === undefined) {
      throw new Error(
        `${input.diagnosticLabel} stage envelope ${envelope.id} has no native paint.`
      );
    }
    const definition = Object.freeze({
      id: envelope.id,
      transitionId: input.phaseIntent.nodeId,
      endpointObjectId: endpoint.objectId,
      memberOwnerIds: Object.freeze(ownerIds)
    });
    definitions.push(definition);
    observations.push({
      ...definition,
      rect,
      baselineY: measureKpNativeKatexBaselineY(
        input.measurementRoot,
        envelopeElement
      ),
      emSizePx: measuredEmSize(envelopeElement),
      measurementIdentity: input.measurementIdentity
    });
    ownerIds.forEach((ownerId, index) => {
      const element = ownerElements[index]!;
      const previous = memberElements.get(ownerId);
      if (previous !== undefined && previous !== element) {
        throw new Error(
          `${input.diagnosticLabel} stage member ${ownerId} resolves to multiple elements.`
        );
      }
      memberElements.set(ownerId, element);
    });
  }
  const measured = compileKpMeasuredEquationStageInput({
    intent: input.phaseIntent,
    measurementIdentity: input.measurementIdentity,
    definitions,
    observations
  });
  const rowCertificate = input.phaseIntent.policy === "single-row"
    ? certifyKpSingleRowEquationStageLayout(measured)
    : certifyKpTwoRowEquationStageLayout(measured);
  const sourceObjectIds = new Set(input.sourceObjectIds);
  const targetObjectIds = new Set(input.targetObjectIds);
  const certificate = certifyKpEquationStageTransitCorridor({
    layout: rowCertificate,
    transits: rowCertificate.rows.map((row) => {
      const source = exactlyOneEndpointEnvelope(
        row.envelopeIds,
        measured.envelopes,
        sourceObjectIds,
        `${row.id} source`
      );
      const target = exactlyOneEndpointEnvelope(
        row.envelopeIds,
        measured.envelopes,
        targetObjectIds,
        `${row.id} target`
      );
      return {
        id: `${input.phaseIntent.nodeId}.${row.id}.transit`,
        sourceRowId: row.id,
        targetRowId: row.id,
        sourceRect: source.rect,
        targetRect: target.rect
      };
    })
  });
  return applyKpCertifiedEquationStageLayout({
    certificate,
    measurementIdentity: input.measurementIdentity,
    rows: certificate.rows.map((row) => ({
      rowId: row.id,
      members: unique(row.envelopeIds.flatMap((envelopeId) => {
        const envelope = measured.envelopes.find(
          ({ id }) => id === envelopeId
        )!;
        return envelope.memberOwnerIds;
      })).map((ownerId) => ({
        ownerId,
        element: memberElements.get(ownerId)!
      }))
    }))
  });
}

function exactlyOneEndpointEnvelope(
  envelopeIds: readonly string[],
  envelopes: readonly KpEquationStageEnvelopeObservation[],
  endpointObjectIds: ReadonlySet<string>,
  label: string
): KpEquationStageEnvelopeObservation {
  const matches = envelopeIds
    .map((id) => envelopes.find((envelope) => envelope.id === id)!)
    .filter(({ endpointObjectId }) => endpointObjectIds.has(endpointObjectId));
  if (matches.length !== 1) {
    throw new Error(
      `Equation stage ${label} must resolve to exactly one semantic envelope.`
    );
  }
  return matches[0]!;
}

function measuredEmSize(element: HTMLElement): number {
  const fontSize = Number.parseFloat(getComputedStyle(element).fontSize);
  if (!(fontSize > 0)) {
    throw new Error("Equation stage envelope has no positive native em size.");
  }
  return fontSize;
}

function unionPaintRects(
  rects: readonly (
    KpEquationStageEnvelopeObservation["rect"] | undefined
  )[]
): KpEquationStageEnvelopeObservation["rect"] | undefined {
  const visible = rects.filter(
    (rect): rect is KpEquationStageEnvelopeObservation["rect"] =>
      rect !== undefined
  );
  if (visible.length === 0) return undefined;
  const left = Math.min(...visible.map((rect) => rect.left));
  const top = Math.min(...visible.map((rect) => rect.top));
  const right = Math.max(...visible.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...visible.map((rect) => rect.top + rect.height));
  return {
    left,
    top,
    width: right - left,
    height: bottom - top
  };
}

function dataSelector(key: string, value: string): string {
  const attribute = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  return `[data-${attribute}="${CSS.escape(value)}"]`;
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function requireDescendant(root: ParentNode, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);
  if (element === null) throw new Error(`Expected ${selector}.`);
  return element;
}
