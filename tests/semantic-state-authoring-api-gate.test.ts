import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createTypedMarketAuthoringApiGate
} from "./fixtures/semantic-state-authoring/typed-market.ts";

const TYPED_MARKET_FIXTURE =
  "tests/fixtures/semantic-state-authoring/typed-market.ts";

test("the typed market packet removes ordinary kernel authoring burden", () => {
  const authoring = readAuthoringRegion();
  const metrics = Object.freeze({
    manualIdentityFactoryCalls: countMatches(
      authoring,
      /identities\.(?:slot|entity|derivation|initialSnapshot|transformation|appliedTransformation)\(/gu
    ),
    lowLevelConstructionCalls: countMatches(
      authoring,
      /(?:createKpSemanticStateIdentityScope|createKpSemanticEntityVersionStore|createKpSemanticSlotAbsence|createKpSemanticDerivedBindingDeclaration|createKpAggregateSemanticSnapshot|beginKpSemanticTransaction)\(/gu
    ),
    manualKernelMetadataFields: countMatches(
      authoring,
      /\b(?:sourceId|revisionId|slotId|entityId):\s*["']/gu
    ),
    persistentValueNarrowings: countMatches(authoring, /readRawMarketCurve\(/gu),
    authorCasts: countMatches(authoring, /\bas\s+(?:Kp|Readonly|never)\b/gu),
    deferredDerivationSlotReferences: countMatches(authoring, /\.slotId\b/gu),
    authoredSetupLines: authoring.split("\n")
      .filter(line => line.trim().length > 0)
      .length
  });

  assert.deepEqual(metrics, {
    manualIdentityFactoryCalls: 0,
    lowLevelConstructionCalls: 0,
    manualKernelMetadataFields: 0,
    persistentValueNarrowings: 0,
    authorCasts: 0,
    deferredDerivationSlotReferences: 3,
    authoredSetupLines: 31
  });
});

test("the API-gate packet preserves exact callback values and kernel output", () => {
  const fixture = createTypedMarketAuthoringApiGate();
  assert.equal(fixture.applied.before.market.supply.read().intercept, 2);
  assert.deepEqual(fixture.applied.after.market.supply.read(), {
    intercept: 6,
    slope: 1
  });
  assert.equal(fixture.applied.commit.journal[0]?.operation.kind, "update");
  assert.equal(fixture.applied.commit.after.derivedBindings.length, 1);
  assert.equal(fixture.applied.commit.after.absences.length, 1);
});

function readAuthoringRegion(): string {
  const source = readFileSync(TYPED_MARKET_FIXTURE, "utf8");
  const authoring = source.split("// authoring-api-gate:start")[1]
    ?.split("// authoring-api-gate:end")[0];
  assert.notEqual(authoring, undefined);
  return authoring ?? "";
}

function countMatches(source: string, pattern: RegExp): number {
  return [...source.matchAll(pattern)].length;
}
