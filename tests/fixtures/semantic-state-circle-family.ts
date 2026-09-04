import { createKpStandardMathAuthoringContext } from
  "../../src/math/authoring/algebra.ts";
import {
  createKpUnitDescriptor,
  createKpUnitValue,
  type KpUnitValue
} from "../../src/math/authoring/units.ts";
import { defineKpSemanticStateDerivation } from
  "../../src/semantic-state/authoring-derived-definition.ts";
import { compileKpSemanticStateSchema } from
  "../../src/semantic-state/authoring-schema-compiler.ts";
import { createKpSemanticStateHandleSet } from
  "../../src/semantic-state/authoring-state-handles.ts";
import { materializeKpSemanticStateInitialSnapshot } from
  "../../src/semantic-state/authoring-state-materializer.ts";
import {
  kpStateDerived,
  kpStateGroup,
  kpStateValue
} from "../../src/semantic-state/authoring-schema.ts";
import {
  compileKpSemanticDerivedGraph,
  normalizeKpSemanticDerivedGraphInput
} from "../../src/semantic-state/derived-graph.ts";
import type { KpSemanticProgress } from
  "../../src/semantic-state/semantic-progress.ts";
import {
  defineKpSemanticStateFamily,
  kpStateFamilyParameters
} from "../../src/semantic-state/state-family-definition.ts";
import { declareKpSemanticStateInterpolation } from
  "../../src/semantic-state/state-family-transition.ts";
import { createKpCircleMeasurement } from
  "./typed-circle-measurement.ts";

export const kpCircleRadiusUnit = createKpUnitDescriptor({
  id: "kp.unit.pressure.meter",
  symbol: "m"
});
export const kpCircleAreaUnit = createKpUnitDescriptor({
  id: "kp.unit.pressure.square-meter",
  symbol: "m²"
});

export interface KpCircleStateFamilyParameters {
  readonly finalRadius: KpUnitValue<typeof kpCircleRadiusUnit.id>;
}

export function createKpSemanticStateCircleFamilyFixture() {
  const measurement = createKpCircleMeasurement({
    author: createKpStandardMathAuthoringContext({
      namespace: "lesson.circle-measurement"
    }),
    key: "garden",
    units: { radius: kpCircleRadiusUnit, area: kpCircleAreaUnit }
  });
  const initialRadius = createKpUnitValue(kpCircleRadiusUnit, 2);
  const radiusChange = createKpUnitValue(kpCircleRadiusUnit, 0.5);

  // circle-state-family-authoring:start
  const schema = kpStateGroup({
    source: kpStateGroup({
      radiusChange: kpStateValue(radiusChange)
    }),
    measurement: kpStateGroup({
      radius: kpStateValue(initialRadius),
      area: kpStateDerived<KpUnitValue<typeof kpCircleAreaUnit.id>>(),
      response:
        kpStateDerived<KpUnitValue<typeof kpCircleAreaUnit.id>>()
    })
  });
  const compiled = compileKpSemanticStateSchema(
    "lesson.circle-measurement.state-family",
    schema
  );
  const handles = createKpSemanticStateHandleSet(compiled);
  const area = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.measurement.area,
    dependencies: [handles.refs.measurement.radius],
    compute: ([radius]) => measurement.areaAtRadius.evaluate(radius)
  });
  const response = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.measurement.response,
    dependencies: [
      handles.refs.measurement.radius,
      handles.refs.source.radiusChange
    ],
    compute: ([radius, change]) =>
      measurement.areaAtRadius.derivativeAt(radius).apply(change)
  });
  const derivations = Object.freeze([area, response]);
  const initial = materializeKpSemanticStateInitialSnapshot(compiled, {
    derivations
  });
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(compiled, derivations)
  );
  const radiusTransition = declareKpSemanticStateInterpolation({
    id: "radius-interpolation",
    sourceId: "lesson.circle-measurement.state-family.radius",
    target: handles.refs.measurement.radius
  });
  const family = defineKpSemanticStateFamily({
    compiled,
    handles,
    id: "change-radius",
    sourceId: "lesson.circle-measurement.state-family.change-radius",
    parameters: kpStateFamilyParameters<KpCircleStateFamilyParameters>(),
    transitions: builder => [builder.interpolate(
      radiusTransition,
      ({ before, after, progress }) => interpolateApproximateRadiusMagnitude(
        before,
        after,
        progress
      )
    )] as const,
    author(parameters, state) {
      measurement.areaAtRadius.evaluate(parameters.finalRadius);
      state.measurement.radius.update(() => parameters.finalRadius);
    }
  });
  const application = family.apply(initial, {
    applicationId: "canonical",
    parameters: {
      finalRadius: createKpUnitValue(kpCircleRadiusUnit, 4)
    },
    sourceId: "lesson.circle-measurement.state-family.application.canonical"
  });
  // circle-state-family-authoring:end

  return Object.freeze({
    measurement,
    initialRadius,
    radiusChange,
    schema,
    compiled,
    handles,
    derivations: Object.freeze({ area, response }),
    graph,
    initial,
    radiusTransition,
    family,
    application
  });
}

function interpolateApproximateRadiusMagnitude(
  before: KpUnitValue<typeof kpCircleRadiusUnit.id>,
  after: KpUnitValue<typeof kpCircleRadiusUnit.id>,
  progress: KpSemanticProgress
): KpUnitValue<typeof kpCircleRadiusUnit.id> {
  // The existing circle map owns number-valued magnitudes. Exact progress is
  // approximated only at this caller boundary and never labels its output exact.
  const approximateProgress =
    Number(progress.numerator) / Number(progress.denominator);
  return createKpUnitValue(
    kpCircleRadiusUnit,
    before.magnitude +
      (after.magnitude - before.magnitude) * approximateProgress
  );
}
