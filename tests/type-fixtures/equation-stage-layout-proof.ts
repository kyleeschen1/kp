import type {
  KpAppliedEquationStageLayout,
  KpCertifiedEquationStageLayout,
  KpEquationStagePhaseIntent,
  KpMeasuredEquationStageInput
} from "../../src/reader/runtime/equation-stage-layout.ts";

declare const measured: KpMeasuredEquationStageInput;
declare const certified: KpCertifiedEquationStageLayout;
declare const applied: KpAppliedEquationStageLayout;

function consumeMeasured(_input: KpMeasuredEquationStageInput): void {}
function consumeCertified(_layout: KpCertifiedEquationStageLayout): void {}
function consumeApplied(_layout: KpAppliedEquationStageLayout): void {}

consumeMeasured(measured);
consumeCertified(certified);
consumeApplied(applied);

const intent: KpEquationStagePhaseIntent = {
  nodeId: "phase.fixture",
  policy: "single-row",
  rows: [{
    id: "row.fixture",
    envelopeIds: ["envelope.fixture"],
    role: "equation"
  }]
};

// @ts-expect-error Declared row intent is not measured native geometry.
consumeMeasured(intent);
// @ts-expect-error Measured geometry has not passed layout certification.
consumeCertified(measured);
// @ts-expect-error A certificate is not proof that its DOM transforms were applied.
consumeApplied(certified);
// @ts-expect-error The private proof authority prevents structural fabrication.
const fabricatedMeasured: KpMeasuredEquationStageInput = {
  schemaVersion: "kp.measured-equation-stage-input.v1",
  executionState: "measured",
  measurementIdentity: {
    revision: 1,
    coordinateSpaceId: "fixture.stage"
  },
  intent,
  envelopes: []
};

void fabricatedMeasured;
