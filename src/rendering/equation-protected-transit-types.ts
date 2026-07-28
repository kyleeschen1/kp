declare const kpEquationProtectedTransitCertificateBrand: unique symbol;

export interface KpEquationProtectedTransitCertificate {
  readonly kind: "equation-protected-transit-certificate";
  readonly geometryAuthority:
    | "certified-stage-layout"
    | "measured-visible-paint";
  readonly measurementIdentity?: {
    readonly revision: number;
    readonly coordinateSpaceId: string;
  } | undefined;
  readonly sampleCount: number;
  readonly inspectedPairCount: number;
  readonly opacityScheduledTrackIds: readonly string[];
  readonly rescheduledComponentIds: readonly string[];
  readonly routedComponentIds: readonly string[];
  readonly routedTrackIds: readonly string[];
  readonly [kpEquationProtectedTransitCertificateBrand]: true;
}
