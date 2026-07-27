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

declare const measuredEquationStageInputAuthority: unique symbol;
declare const certifiedEquationStageLayoutAuthority: unique symbol;
declare const appliedEquationStageLayoutAuthority: unique symbol;

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

// These states are deliberately opaque: later compiler, certifier, and DOM
// application functions own the only runtime paths that can create them.
