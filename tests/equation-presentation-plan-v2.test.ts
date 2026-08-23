import assert from "node:assert/strict";
import test from "node:test";
import {
  compileKpEquationPresentationPlanV2,
  consumeKpEquationPresentationPlanV2,
  isKpCompiledEquationPresentationPlanV2,
  type KpEquationPresentationDomainPayloadV2
} from "../src/domain-ir/equation-presentation-plan-v2.ts";
import {
  compileKpEquationGovernanceV2GrammarFixture,
  kpEquationGovernanceV2RouteFixtureIntent
} from "./helpers/equation-governance-v2-route-fixture.ts";

interface LogPayload extends KpEquationPresentationDomainPayloadV2 {
  readonly kind: "equation-domain.log-homomorphism.v2";
  readonly factorEntityIds: readonly string[];
  readonly retainedRelationEntityId: string;
}

const payload: LogPayload = {
  kind: "equation-domain.log-homomorphism.v2",
  transitionId: "transition.0",
  authorityId: "law.log-product",
  factorEntityIds: ["entity.x"],
  retainedRelationEntityId: "entity.equals"
};

test("one nominal plan retains exact operation identity across every authority", () => {
  const result = compileKpEquationPresentationPlanV2({
    grammar: compileKpEquationGovernanceV2GrammarFixture().grammar,
    transitIntents: [kpEquationGovernanceV2RouteFixtureIntent],
    domainPayloads: [payload]
  });
  assert.equal(result.status, "compiled");
  if (result.status !== "compiled") return;
  assert.equal(isKpCompiledEquationPresentationPlanV2(result.plan), true);
  const transition = result.plan.transitions[0]!;
  assert.strictEqual(
    transition.semanticOperation,
    transition.projection.semanticOperation
  );
  assert.strictEqual(
    transition.semanticOperation,
    transition.transit.semanticOperation
  );
  assert.equal(transition.evaluationAuthority, undefined);
  assert.strictEqual(transition.domainPayloads[0], payload);
  assert.equal(result.plan.clockAuthority, "kp.shared-normalized-clock.v1");
  assert.equal(JSON.stringify(result.plan).includes("pose"), false);
});

test("generic and domain-specialized adapters consume the same plan", () => {
  const result = compileKpEquationPresentationPlanV2({
    grammar: compileKpEquationGovernanceV2GrammarFixture().grammar,
    transitIntents: [kpEquationGovernanceV2RouteFixtureIntent],
    domainPayloads: [payload]
  });
  assert.equal(result.status, "compiled");
  if (result.status !== "compiled") return;
  const generic = consumeKpEquationPresentationPlanV2({
    plan: result.plan,
    adapter: {
      id: "adapter.equation.generic.v2",
      kind: "generic-equation-adapter-v2",
      compile: (transition) => transition.id
    }
  });
  const specialized = consumeKpEquationPresentationPlanV2({
    plan: result.plan,
    adapter: {
      id: "adapter.equation.log-homomorphism.v2",
      kind: "specialized-equation-adapter-v2",
      accepts: (candidate): candidate is LogPayload =>
        candidate.kind === "equation-domain.log-homomorphism.v2",
      compile: (_transition, payloads) => payloads[0]!.factorEntityIds
    }
  });
  assert.deepEqual(generic, ["transition.0"]);
  assert.deepEqual(specialized, [["entity.x"]]);
  assert.throws(() => consumeKpEquationPresentationPlanV2({
    plan: { ...result.plan },
    adapter: {
      id: "adapter.equation.generic.v2",
      kind: "generic-equation-adapter-v2",
      compile: (transition) => transition.id
    }
  }), /nominal presentation plan/);
});

test("domain payloads may add semantics but cannot smuggle presentation", () => {
  const result = compileKpEquationPresentationPlanV2({
    grammar: compileKpEquationGovernanceV2GrammarFixture().grammar,
    transitIntents: [kpEquationGovernanceV2RouteFixtureIntent],
    domainPayloads: [{
      ...payload,
      path: "M0 0"
    } as LogPayload]
  });
  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.equal(result.diagnostics[0]?.code,
    "presentation-plan.payload-presentation");
});
