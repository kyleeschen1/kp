import test from "node:test";
import assert from "node:assert/strict";
import bayes from "../content/authoring/r4a-urn-prior.bayes.json" with { type: "json" };
import { checkAuthorTask } from "../scripts/author-check-owner-dispatch.ts";
import { runAuthorCheckCli } from "../scripts/author-check.ts";
import { createFractionChainAuthorExample } from "../src/authoring/fraction-chain-author-check.ts";
import { checkMomentumEnergyDerivation, momentumEnergyDerivationSource } from "../domains/physics/momentum-energy-derivation.ts";

test("algebra, Bayes and mechanics keep distinct source and assumption authority", async () => {
  const algebra = createFractionChainAuthorExample();
  assert.equal((await checkAuthorTask("equation.fraction-chain", JSON.stringify(algebra))).status, "checked");
  assert.equal((await checkAuthorTask("bayes.binary", JSON.stringify(bayes))).status, "checked");
  assert.equal(checkMomentumEnergyDerivation(momentumEnergyDerivationSource).status, "checked");
  for (const foreign of [bayes, momentumEnergyDerivationSource])
    assert.equal((await checkAuthorTask("equation.fraction-chain", JSON.stringify(foreign))).status, "repair-gap");
  for (const foreign of [algebra, momentumEnergyDerivationSource])
    assert.equal((await checkAuthorTask("bayes.binary", JSON.stringify(foreign))).status, "repair-gap");
  for (const foreign of [algebra, bayes]) assert.equal(checkMomentumEnergyDerivation(foreign).status, "repair-required");
  for (const [field, value] of [["mass", "real"], ["velocity", "real-scalar"], ["momentum", "independent-vector"]]) {
    const result = checkMomentumEnergyDerivation({ ...momentumEnergyDerivationSource, [field!]: value });
    assert.equal(result.status, "repair-required");
    if (result.status === "repair-required") {
      assert.equal(result.code, "physics.derivation.unsupported-source");
      assert.equal(result.path, `$.${field}`);
    }
  }
  for (const model of [{ ...bayes.model, prior: "4/3" }, { ...bayes.model, likelihoods: ["0", "0"] }]) {
    const result = await checkAuthorTask("bayes.binary", JSON.stringify({ ...bayes, model }));
    assert.equal(result.status, "repair-gap");
    assert.ok(!JSON.stringify(result.result).includes("fraction-chain"));
  }
});

test("missing mechanics discovery is an explicit invocation gap, never an algebra fallback", async () => {
  const result = await runAuthorCheckCli(["--task", "mechanics.momentum-energy", "--request", "unused"],
    () => { throw new Error("Unknown task must not read or reroute source"); });
  assert.ok(result && typeof result === "object" && "kind" in result);
  assert.equal(result.kind, "author-invocation-gap");
});
