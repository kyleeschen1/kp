// Geometry consumers must not import the legacy DOM measurement/choreography
// implementation merely to name points, rectangles, or a measured layout plan.
export interface KpEquationLayoutRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface KpEquationLayoutPoint {
  readonly x: number;
  readonly y: number;
}

export interface KpEquationLayoutTokenSnapshot {
  readonly motionId: string;
  readonly text: string;
  readonly bounds: KpEquationLayoutRect;
}

export interface KpEquationLayoutSnapshot {
  readonly side: "source" | "target";
  readonly tokens: readonly KpEquationLayoutTokenSnapshot[];
}

export interface KpEquationLayoutReservation {
  readonly id: string;
  readonly kind: "destination" | "transit";
  readonly relationRecordId: string;
  readonly motionId?: string | undefined;
  readonly bounds: KpEquationLayoutRect;
}

export interface KpEquationSemanticWaypoint {
  readonly id: string;
  readonly relationRecordId: string;
  readonly role: "source" | "clearance" | "target";
  readonly ordinal: number;
  readonly point: KpEquationLayoutPoint;
}

export interface KpEquationLayoutPlan {
  readonly kind: "equation-layout-plan";
  readonly id: string;
  readonly transitionId: string;
  readonly revision: number;
  readonly source: KpEquationLayoutSnapshot;
  readonly target: KpEquationLayoutSnapshot;
  readonly reservations: readonly KpEquationLayoutReservation[];
  readonly waypoints: readonly KpEquationSemanticWaypoint[];
  readonly geometryPolicy: "measure-once-per-step";
}
