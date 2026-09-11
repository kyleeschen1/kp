import assert from "node:assert/strict";
import test from "node:test";
import primary from "../src/authoring/examples/composed-algebra-intuition.json" with { type: "json" };
import transfer from "../src/authoring/examples/composed-algebra-intuition-transfer.json" with { type: "json" };
import { compileComposedAlgebraPublication, verifyComposedAlgebraPublication } from "../scripts/build-composed-algebra-edition.ts";
import { digestEditionBytes } from "../scripts/immutable-local-edition.ts";

test("extended static publication reproduces both lengths and independent questions without executable authority", () => {
  for (const source of [primary, transfer]) {
    const bytes = JSON.stringify(source), artifact = compileComposedAlgebraPublication(bytes, "source.json");
    assert.equal(artifact.compiler.version, "2");
    assert.equal(artifact.payload.checkpoints.length, source.states.length);
    assert.equal(artifact.payload.questions?.length, 2);
    assert.equal(artifact.math.fragmentCount, (artifact.payload.reading.html.match(/<math/g) ?? []).length);
    assert.doesNotMatch(artifact.payload.reading.html, /<script|type="module"|data-kp-focus-deck-scrubber/);
    verifyComposedAlgebraPublication(artifact, bytes, "source.json");
    const forged = structuredClone(artifact); forged.payload.full.facts.states[0]!.latex = "0";
    Object.assign(forged, { payloadSha256: digestEditionBytes(JSON.stringify(forged.payload)) });
    assert.throws(() => verifyComposedAlgebraPublication(forged, bytes, "source.json"), /does not reproduce/);
  }
  assert.throws(() => compileComposedAlgebraPublication('{"schemaVersion":"unknown"}', "source.json"), /no publication fallback/);
});
