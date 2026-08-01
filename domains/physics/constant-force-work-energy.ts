import type { ExactRationalDto } from "../../protocols/public-api.ts";

export const kpConstantForceWorkEnergySchemaVersion =
  "kp.physics.constant-force-work-energy.v1" as const;

export const kpConstantForceWorkEnergyPreservation = [
  "object-identity",
  "net-force-vector-identity",
  "displacement-interval-identity",
  "constant-force-segment-identity",
  "work-area-identity",
  "kinetic-energy-change-role",
  "work-energy-equality",
  "net-force-parameter",
  "narrative-claim-lineage"
] as const;

export type KpConstantForceWorkEnergyPreservation =
  typeof kpConstantForceWorkEnergyPreservation[number];

export interface KpSiDimensionV1 {
  readonly mass: number;
  readonly length: number;
  readonly time: number;
}

export interface KpPhysicsUnitContractV1 {
  readonly id: string;
  readonly symbolLatex: string;
  readonly label: string;
  readonly siDimension: KpSiDimensionV1;
}

export interface KpPhysicsExactQuantityV1 {
  readonly value: ExactRationalDto;
  readonly unitId: string;
}

export interface KpPhysicsGraphAxisContractV1 {
  readonly id: string;
  readonly symbolLatex: "x" | "F_x";
  readonly label: "Position" | "Horizontal net force";
  readonly orientation: "horizontal" | "vertical";
  readonly unitId: string;
  readonly minimum: ExactRationalDto;
  readonly maximum: ExactRationalDto;
  readonly tickStep: ExactRationalDto;
}

export interface KpConstantForceParameterContractV1 {
  readonly id: string;
  readonly minimum: ExactRationalDto;
  readonly maximum: ExactRationalDto;
  readonly step: ExactRationalDto;
  readonly default: ExactRationalDto;
}

export interface KpConstantForceWorkEnergyModelInputV1 {
  readonly schemaVersion: typeof kpConstantForceWorkEnergySchemaVersion;
  readonly id: string;
  readonly title: string;
  readonly assumptions: readonly [
    "one-dimensional-horizontal-motion",
    "constant-net-force",
    "force-parallel-to-displacement",
    "frictionless-horizontal-surface",
    "vertical-forces-cancel"
  ];
  readonly units: {
    readonly meter: KpPhysicsUnitContractV1;
    readonly newton: KpPhysicsUnitContractV1;
    readonly joule: KpPhysicsUnitContractV1;
  };
  readonly motion: {
    readonly object: {
      readonly id: string;
      readonly initialKineticEnergy: KpPhysicsExactQuantityV1;
    };
    readonly interval: {
      readonly id: string;
      readonly axis: "positive-x";
      readonly start: ExactRationalDto;
      readonly end: ExactRationalDto;
      readonly unitId: string;
    };
    readonly netForce: {
      readonly id: string;
      readonly componentId: string;
      readonly direction: "positive-x";
      readonly magnitude: ExactRationalDto;
      readonly unitId: string;
      readonly parameter: KpConstantForceParameterContractV1;
    };
  };
  readonly forcePositionGraph: {
    readonly id: string;
    readonly positionAxis: KpPhysicsGraphAxisContractV1;
    readonly forceAxis: KpPhysicsGraphAxisContractV1;
    readonly constantForceSegmentId: string;
    readonly workAreaId: string;
  };
  readonly canonicalResults: {
    readonly work: KpPhysicsExactQuantityV1;
    readonly kineticEnergyChange: KpPhysicsExactQuantityV1;
    readonly finalKineticEnergy: KpPhysicsExactQuantityV1;
  };
  readonly laws: {
    readonly kineticEnergyLatex: "K=\\frac{1}{2}mv^2";
    readonly workIntegralLatex: "W_{\\mathrm{net}}=\\int_{x_0}^{x_1}F_x\\,dx";
    readonly constantForceWorkLatex: "W_{\\mathrm{net}}=F_x\\Delta x";
    readonly workEnergyLatex: "W_{\\mathrm{net}}=\\Delta K=K_1-K_0";
    readonly unitIdentity: "newton-meter-equals-joule";
  };
  readonly preservation: readonly KpConstantForceWorkEnergyPreservation[];
}

const exact = (numerator: string, denominator = "1"): ExactRationalDto => ({
  numerator,
  denominator
});

const unit = (
  id: string,
  symbolLatex: string,
  label: string,
  siDimension: KpSiDimensionV1
): KpPhysicsUnitContractV1 => ({ id, symbolLatex, label, siDimension });

// The values keep work and both kinetic-energy states exact. The exemplar
// intentionally teaches cross-view correspondence, not a configurable
// mechanics solver for mass, acceleration, or endpoint speed.
export const kpConstantForceWorkEnergyExemplarInput = {
  schemaVersion: kpConstantForceWorkEnergySchemaVersion,
  id: "physics.work-energy.constant-horizontal-net-force",
  title: "Constant force and kinetic-energy change",
  assumptions: [
    "one-dimensional-horizontal-motion",
    "constant-net-force",
    "force-parallel-to-displacement",
    "frictionless-horizontal-surface",
    "vertical-forces-cancel"
  ],
  units: {
    meter: unit("unit.si.meter", "\\mathrm{m}", "meter", {
      mass: 0,
      length: 1,
      time: 0
    }),
    newton: unit("unit.si.newton", "\\mathrm{N}", "newton", {
      mass: 1,
      length: 1,
      time: -2
    }),
    joule: unit("unit.si.joule", "\\mathrm{J}", "joule", {
      mass: 1,
      length: 2,
      time: -2
    })
  },
  motion: {
    object: {
      id: "object.physics.work-energy.block",
      initialKineticEnergy: {
        value: exact("4"),
        unitId: "unit.si.joule"
      }
    },
    interval: {
      id: "interval.physics.work-energy.displacement",
      axis: "positive-x",
      start: exact("0"),
      end: exact("4"),
      unitId: "unit.si.meter"
    },
    netForce: {
      id: "vector.physics.work-energy.net-force",
      componentId: "quantity.physics.work-energy.force-x",
      direction: "positive-x",
      magnitude: exact("3"),
      unitId: "unit.si.newton",
      parameter: {
        id: "parameter.physics.work-energy.net-force-newtons",
        minimum: exact("1"),
        maximum: exact("5"),
        step: exact("1"),
        default: exact("3")
      }
    }
  },
  forcePositionGraph: {
    id: "graph.physics.work-energy.force-position",
    positionAxis: {
      id: "axis.physics.work-energy.position",
      symbolLatex: "x",
      label: "Position",
      orientation: "horizontal",
      unitId: "unit.si.meter",
      minimum: exact("0"),
      maximum: exact("5"),
      tickStep: exact("1")
    },
    forceAxis: {
      id: "axis.physics.work-energy.force-x",
      symbolLatex: "F_x",
      label: "Horizontal net force",
      orientation: "vertical",
      unitId: "unit.si.newton",
      minimum: exact("0"),
      maximum: exact("6"),
      tickStep: exact("1")
    },
    constantForceSegmentId: "segment.physics.work-energy.constant-force",
    workAreaId: "area.physics.work-energy.accumulated-work"
  },
  canonicalResults: {
    work: { value: exact("12"), unitId: "unit.si.joule" },
    kineticEnergyChange: {
      value: exact("12"),
      unitId: "unit.si.joule"
    },
    finalKineticEnergy: {
      value: exact("16"),
      unitId: "unit.si.joule"
    }
  },
  laws: {
    kineticEnergyLatex: "K=\\frac{1}{2}mv^2",
    workIntegralLatex: "W_{\\mathrm{net}}=\\int_{x_0}^{x_1}F_x\\,dx",
    constantForceWorkLatex: "W_{\\mathrm{net}}=F_x\\Delta x",
    workEnergyLatex: "W_{\\mathrm{net}}=\\Delta K=K_1-K_0",
    unitIdentity: "newton-meter-equals-joule"
  },
  preservation: kpConstantForceWorkEnergyPreservation
} as const satisfies KpConstantForceWorkEnergyModelInputV1;
