import {
  createKpFoldableDistributionAnnotatedEndpoints
} from "../../rendering/foldable-distribution-selector-annotated-latex.ts";
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

export function applyKpFoldableDistributionPhaseStageLayout(input: {
  readonly phaseIntent: KpEquationStagePhaseIntent;
  readonly sourceObjectIds: readonly string[];
  readonly targetObjectIds: readonly string[];
  readonly measurementRoot: HTMLElement;
  readonly measurementIdentity: KpEquationStageMeasurementIdentity;
}): KpAppliedEquationStageLayout<KpCorridorCertifiedEquationStageLayout> {
  const endpointById = new Map(
    createKpFoldableDistributionAnnotatedEndpoints().map((endpoint) => [
      endpoint.objectId,
      endpoint
    ])
  );
  const objectIds = [...input.sourceObjectIds, ...input.targetObjectIds];
  const stateRoots = new Map(objectIds.map((objectId) => {
    if (!endpointById.has(objectId)) {
      throw new Error(
        `Foldable stage layout has no endpoint specification ${objectId}.`
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
        `Foldable stage envelope ${envelopeId} must resolve to one phase endpoint.`
      );
    }
    const { endpoint, envelope } = owners[0]!;
    const stateRoot = stateRoots.get(endpoint.objectId)!;
    const envelopeElement = requireDescendant(
      stateRoot,
      `[data-kp-foldable-envelope-id="${CSS.escape(envelope.id)}"]`
    );
    const rect = measureKpNativeKatexSubtreePaintRect(
      input.measurementRoot,
      envelopeElement
    );
    if (rect === undefined) {
      throw new Error(
        `Foldable stage envelope ${envelope.id} has no measured native paint.`
      );
    }
    const definition = Object.freeze({
      id: envelope.id,
      transitionId: input.phaseIntent.nodeId,
      endpointObjectId: endpoint.objectId,
      memberOwnerIds: Object.freeze([...envelope.memberSelectorIds])
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
    for (const ownerId of envelope.memberSelectorIds) {
      const element = requireDescendant(
        stateRoot,
        `[data-kp-foldable-layout-member-id="${CSS.escape(ownerId)}"]`
      );
      const previous = memberElements.get(ownerId);
      if (previous !== undefined && previous !== element) {
        throw new Error(
          `Foldable stage member ${ownerId} resolves to multiple native elements.`
        );
      }
      memberElements.set(ownerId, element);
    }
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
      `Foldable stage ${label} must resolve to exactly one semantic envelope.`
    );
  }
  return matches[0]!;
}

function measuredEmSize(element: HTMLElement): number {
  const fontSize = Number.parseFloat(getComputedStyle(element).fontSize);
  if (!(fontSize > 0)) {
    throw new Error("Foldable stage envelope has no positive native em size.");
  }
  return fontSize;
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function requireDescendant(
  root: ParentNode,
  selector: string
): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);
  if (element === null) throw new Error(`Expected ${selector}.`);
  return element;
}
