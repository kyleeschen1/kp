export type KpEquationStageLayoutPolicy =
  | "single-row"
  | "semantic-two-row-stage";

export interface KpEquationStageRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
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
  readonly intent: KpEquationStagePhaseIntent;
  readonly envelopes: readonly KpEquationStageMeasuredEnvelope[];
  readonly [measuredEquationStageInputAuthority]: true;
}

export interface KpCertifiedEquationStageLayout {
  readonly schemaVersion: "kp.certified-equation-stage-layout.v1";
  readonly executionState: "certified";
  readonly measuredInput: KpMeasuredEquationStageInput;
  readonly rows: readonly KpCertifiedEquationStageRow[];
  readonly stageBounds: KpEquationStageRect;
  readonly [certifiedEquationStageLayoutAuthority]: true;
}

export interface KpAppliedEquationStageLayout {
  readonly schemaVersion: "kp.applied-equation-stage-layout.v1";
  readonly executionState: "applied";
  readonly certificate: KpCertifiedEquationStageLayout;
  readonly appliedRowIds: readonly string[];
  readonly [appliedEquationStageLayoutAuthority]: true;
}

// These states are deliberately opaque: later compiler, certifier, and DOM
// application functions own the only runtime paths that can create them.
