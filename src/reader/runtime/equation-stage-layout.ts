export type KpEquationStageLayoutPolicy =
  | "single-row"
  | "semantic-two-row-stage";

export interface KpEquationStageRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface KpEquationStageMeasurementIdentity {
  readonly revision: number;
  readonly coordinateSpaceId: string;
}

export function createKpEquationStageMeasurementIdentity(input: {
  readonly revision: number;
  readonly coordinateSpaceId: string;
}): KpEquationStageMeasurementIdentity {
  if (!Number.isInteger(input.revision) || input.revision < 0) {
    throw new Error("Equation stage measurement revision must be a non-negative integer.");
  }
  if (input.coordinateSpaceId.trim() === "") {
    throw new Error("Equation stage coordinate-space id must be non-empty.");
  }
  return Object.freeze({
    revision: input.revision,
    coordinateSpaceId: input.coordinateSpaceId
  });
}

export function assertKpEquationStageMeasurementIdentity(
  expected: KpEquationStageMeasurementIdentity,
  actual: KpEquationStageMeasurementIdentity,
  label: string
): void {
  if (
    expected.revision !== actual.revision ||
    expected.coordinateSpaceId !== actual.coordinateSpaceId
  ) {
    throw new Error(
      `${label} measurement identity mismatch: expected ` +
      `${expected.coordinateSpaceId}@${expected.revision}, received ` +
      `${actual.coordinateSpaceId}@${actual.revision}.`
    );
  }
}

export interface KpEquationStageRowIntent<
  TRole extends string = string
> {
  readonly id: string;
  readonly envelopeIds: readonly string[];
  readonly role: TRole;
}

export interface KpEquationStagePhaseIntent<
  TRow extends KpEquationStageRowIntent = KpEquationStageRowIntent
> {
  readonly nodeId: string;
  readonly policy: KpEquationStageLayoutPolicy;
  readonly rows: readonly TRow[];
  readonly lineChangeReason?: "viewport-semantic-staging" | undefined;
}

export interface KpEquationStageLayoutIntent<
  TPhase extends KpEquationStagePhaseIntent = KpEquationStagePhaseIntent
> {
  readonly executionState: "intent";
  readonly phases: readonly TPhase[];
  readonly geometryAuthority: "native-measurement";
  readonly operationSpecificCoordinates: false;
}

export interface KpEquationStageMeasuredEnvelope {
  readonly id: string;
  readonly transitionId: string;
  readonly endpointObjectId: string;
  readonly memberOwnerIds: readonly string[];
  readonly rect: KpEquationStageRect;
  readonly measurementIdentity: KpEquationStageMeasurementIdentity;
}

export interface KpEquationStageEnvelopeDefinition {
  readonly id: string;
  readonly transitionId: string;
  readonly endpointObjectId: string;
  readonly memberOwnerIds: readonly string[];
}

export interface KpEquationStageEnvelopeObservation {
  readonly id: string;
  readonly transitionId: string;
  readonly endpointObjectId: string;
  readonly memberOwnerIds: readonly string[];
  readonly rect: KpEquationStageRect;
  readonly measurementIdentity: KpEquationStageMeasurementIdentity;
}

export interface KpCertifiedEquationStageRow {
  readonly id: string;
  readonly envelopeIds: readonly string[];
  readonly rect: KpEquationStageRect;
  readonly translateX: number;
  readonly translateY: number;
}

const measuredEquationStageInputAuthority: unique symbol =
  Symbol("kp.measured-equation-stage-input");
const certifiedEquationStageLayoutAuthority: unique symbol =
  Symbol("kp.certified-equation-stage-layout");
const appliedEquationStageLayoutAuthority: unique symbol =
  Symbol("kp.applied-equation-stage-layout");

export interface KpMeasuredEquationStageInput {
  readonly schemaVersion: "kp.measured-equation-stage-input.v1";
  readonly executionState: "measured";
  readonly measurementIdentity: KpEquationStageMeasurementIdentity;
  readonly intent: KpEquationStagePhaseIntent;
  readonly envelopes: readonly KpEquationStageMeasuredEnvelope[];
  readonly [measuredEquationStageInputAuthority]: true;
}

export interface KpCertifiedEquationStageLayout {
  readonly schemaVersion: "kp.certified-equation-stage-layout.v1";
  readonly executionState: "certified";
  readonly measurementIdentity: KpEquationStageMeasurementIdentity;
  readonly measuredInput: KpMeasuredEquationStageInput;
  readonly rows: readonly KpCertifiedEquationStageRow[];
  readonly stageBounds: KpEquationStageRect;
  readonly [certifiedEquationStageLayoutAuthority]: true;
}

export interface KpAppliedEquationStageLayout {
  readonly schemaVersion: "kp.applied-equation-stage-layout.v1";
  readonly executionState: "applied";
  readonly measurementIdentity: KpEquationStageMeasurementIdentity;
  readonly certificate: KpCertifiedEquationStageLayout;
  readonly appliedRowIds: readonly string[];
  readonly [appliedEquationStageLayoutAuthority]: true;
}

export function compileKpMeasuredEquationStageInput(input: {
  readonly intent: KpEquationStagePhaseIntent;
  readonly measurementIdentity: KpEquationStageMeasurementIdentity;
  readonly definitions: readonly KpEquationStageEnvelopeDefinition[];
  readonly observations: readonly KpEquationStageEnvelopeObservation[];
}): KpMeasuredEquationStageInput {
  const measurementIdentity =
    createKpEquationStageMeasurementIdentity(input.measurementIdentity);
  assertNonEmptyId(input.intent.nodeId, "Equation stage phase");
  const rowIds = input.intent.rows.map(({ id }) => id);
  assertUniqueIds(rowIds, "Equation stage row");
  const requestedEnvelopeIds = input.intent.rows.flatMap((row) => {
    if (row.envelopeIds.length === 0) {
      throw new Error(`Equation stage row ${row.id} has no envelopes.`);
    }
    return row.envelopeIds;
  });
  assertUniqueIds(requestedEnvelopeIds, "Equation stage row envelope");
  const definitions = indexEnvelopes(input.definitions, "definition");
  const observations = indexEnvelopes(input.observations, "observation");
  const envelopes = requestedEnvelopeIds.map((id) => {
    const definition = definitions.get(id);
    if (definition === undefined) {
      throw new Error(`Equation stage envelope ${id} has no semantic definition.`);
    }
    const observation = observations.get(id);
    if (observation === undefined) {
      throw new Error(`Equation stage envelope ${id} has no native observation.`);
    }
    if (
      definition.transitionId !== input.intent.nodeId ||
      observation.transitionId !== input.intent.nodeId
    ) {
      throw new Error(
        `Equation stage envelope ${id} crosses transition ${input.intent.nodeId}.`
      );
    }
    if (definition.endpointObjectId !== observation.endpointObjectId) {
      throw new Error(`Equation stage envelope ${id} changed endpoint ownership.`);
    }
    const expectedMembers = validatedMemberIds(
      definition.memberOwnerIds,
      `Equation stage envelope ${id} definition`
    );
    const observedMembers = validatedMemberIds(
      observation.memberOwnerIds,
      `Equation stage envelope ${id} observation`
    );
    if (!sameMembers(expectedMembers, observedMembers)) {
      throw new Error(
        `Equation stage envelope ${id} is partially active or has foreign members.`
      );
    }
    assertKpEquationStageMeasurementIdentity(
      measurementIdentity,
      observation.measurementIdentity,
      `Equation stage envelope ${id}`
    );
    assertStageRect(observation.rect, `Equation stage envelope ${id}`);
    return Object.freeze({
      id,
      transitionId: input.intent.nodeId,
      endpointObjectId: definition.endpointObjectId,
      memberOwnerIds: Object.freeze([...expectedMembers]),
      rect: Object.freeze({ ...observation.rect }),
      measurementIdentity
    });
  });

  return Object.freeze({
    schemaVersion: "kp.measured-equation-stage-input.v1" as const,
    executionState: "measured" as const,
    measurementIdentity,
    intent: input.intent,
    envelopes: Object.freeze(envelopes),
    [measuredEquationStageInputAuthority]: true as const
  });
}

// These states are deliberately opaque: later compiler, certifier, and DOM
// application functions own the only runtime paths that can create them.

function indexEnvelopes<T extends { readonly id: string }>(
  values: readonly T[],
  kind: "definition" | "observation"
): ReadonlyMap<string, T> {
  const result = new Map<string, T>();
  for (const value of values) {
    assertNonEmptyId(value.id, `Equation stage envelope ${kind}`);
    if (result.has(value.id)) {
      throw new Error(`Equation stage envelope repeats ${kind} ${value.id}.`);
    }
    result.set(value.id, value);
  }
  return result;
}

function validatedMemberIds(
  values: readonly string[],
  label: string
): readonly string[] {
  if (values.length === 0) throw new Error(`${label} has no native members.`);
  for (const value of values) assertNonEmptyId(value, `${label} member`);
  assertUniqueIds(values, `${label} member`);
  return values;
}

function sameMembers(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const rightMembers = new Set(right);
  return left.every((member) => rightMembers.has(member));
}

function assertUniqueIds(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} ids must be unique.`);
  }
}

function assertNonEmptyId(value: string, label: string): void {
  if (value.trim() === "") throw new Error(`${label} id must be non-empty.`);
}

function assertStageRect(rect: KpEquationStageRect, label: string): void {
  if (
    ![rect.left, rect.top, rect.width, rect.height].every(Number.isFinite) ||
    rect.width <= 0 ||
    rect.height <= 0
  ) {
    throw new Error(`${label} must have finite positive native geometry.`);
  }
}
