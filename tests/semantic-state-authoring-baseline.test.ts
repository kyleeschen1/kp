import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createRawMarketAuthoringBaseline
} from "./fixtures/semantic-state-authoring/raw-market.ts";

const RAW_MARKET_FIXTURE =
  "tests/fixtures/semantic-state-authoring/raw-market.ts";

test("the raw market packet freezes the pre-facade authoring burden", () => {
  const source = readFileSync(RAW_MARKET_FIXTURE, "utf8");
  const authoring = source.split("// authoring-baseline:start")[1]
    ?.split("// authoring-baseline:end")[0];
  assert.notEqual(authoring, undefined);
  if (authoring === undefined) return;

  const metrics = Object.freeze({
    manualIdentityCalls: countMatches(
      authoring,
      /identities\.(?:slot|entity|derivation|initialSnapshot|transformation|appliedTransformation)\(/gu
    ),
    lowLevelConstructionCalls: countMatches(
      authoring,
      /(?:createKpSemanticStateIdentityScope|createKpSemanticEntityVersionStore|createKpSemanticSlotAbsence|createKpSemanticDerivedBindingDeclaration|createKpAggregateSemanticSnapshot|beginKpSemanticTransaction)\(/gu
    ),
    manualOperationMetadataFields: countMatches(
      authoring,
      /\b(?:id|sourceId|revisionId):\s*"/gu
    ),
    manualPersistentValueNarrowings: countMatches(
      authoring,
      /readRawMarketCurve\(/gu
    ),
    authoredSetupLines: authoring.split("\n")
      .filter(line => line.trim().length > 0)
      .length
  });

  assert.deepEqual(metrics, {
    manualIdentityCalls: 10,
    lowLevelConstructionCalls: 7,
    manualOperationMetadataFields: 7,
    manualPersistentValueNarrowings: 1,
    authoredSetupLines: 69
  });
});

test("the raw market packet remains executable foundation evidence", () => {
  const fixture = createRawMarketAuthoringBaseline();
  assert.equal(fixture.committed.before.id, fixture.identities.initialSnapshot());
  assert.notEqual(fixture.committed.after.id, fixture.committed.before.id);
  assert.equal(fixture.committed.after.derivedBindings.length, 1);
  assert.equal(fixture.committed.after.absences.length, 1);
  assert.equal(fixture.committed.journal[0]?.operation.kind, "update");
});

function countMatches(source: string, pattern: RegExp): number {
  return [...source.matchAll(pattern)].length;
}
