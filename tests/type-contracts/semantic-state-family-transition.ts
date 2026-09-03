import {
  compileKpSemanticStateSchema
} from "../../src/semantic-state/authoring-schema-compiler.ts";
import {
  kpStateDerived,
  kpStateGroup,
  kpStateValue
} from "../../src/semantic-state/authoring-schema.ts";
import {
  createKpSemanticStateHandleSet
} from "../../src/semantic-state/authoring-state-handles.ts";
import { createKpSemanticProgress } from
  "../../src/semantic-state/semantic-progress.ts";
import {
  declareKpSemanticStateDiscreteTransition,
  declareKpSemanticStateInterpolation,
  declareKpSemanticStatePresentationTransition,
  type KpSemanticStateTransitionDeclaration
} from "../../src/semantic-state/state-family-transition.ts";

const compiled = compileKpSemanticStateSchema(
  "type.state-family-transition",
  kpStateGroup({
    amount: kpStateValue(0),
    outcome: kpStateDerived<number>()
  })
);
const handles = createKpSemanticStateHandleSet(compiled);

declareKpSemanticStateInterpolation({
  id: "amount",
  sourceId: "type.state-family-transition.amount",
  target: handles.refs.amount,
  // @ts-expect-error semantic interpolation cannot carry discrete points
  changePoints: []
});

declareKpSemanticStateDiscreteTransition({
  id: "amount-discrete",
  sourceId: "type.state-family-transition.amount-discrete",
  target: handles.refs.amount,
  changePoints: [{
    id: "changed",
    // @ts-expect-error discrete points require validated semantic progress
    at: { numerator: 1n, denominator: 2n },
    valueSourceId: "type.state-family-transition.amount.changed"
  }]
});

declareKpSemanticStateDiscreteTransition({
  id: "missing-points",
  sourceId: "type.state-family-transition.missing-points",
  target: handles.refs.amount,
  // @ts-expect-error discrete declarations require explicit change points
  changePoints: undefined
});

declareKpSemanticStatePresentationTransition({
  id: "outcome-presentation",
  sourceId: "type.state-family-transition.outcome",
  target: handles.refs.outcome,
  // @ts-expect-error presentation-only declarations cannot carry discrete points
  changePoints: [{
    id: "changed",
    at: createKpSemanticProgress(1n, 2n),
    valueSourceId: "type.state-family-transition.outcome.changed"
  }]
});

declareKpSemanticStateInterpolation({
  id: "derived-driver",
  sourceId: "type.state-family-transition.derived-driver",
  // @ts-expect-error derived values cannot become semantic interpolation drivers
  target: handles.refs.outcome
});

function exhaustiveMode(declaration: KpSemanticStateTransitionDeclaration) {
  switch (declaration.transitionMode) {
    case "semantic-interpolation":
      return declaration.target;
    case "discrete":
      return declaration.changePoints;
    case "presentation-only":
      return declaration.source;
    default: {
      const unreachable: never = declaration;
      return unreachable;
    }
  }
}
void exhaustiveMode;
