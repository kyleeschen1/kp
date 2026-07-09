import { strict as assert } from "node:assert";
import test from "node:test";

import {
  findNotationTransformDefinition,
  notationTransformDefinitions
} from "../src/semantic/notation-transform.ts";

test("notation transform definitions preserve semantic object identity", () => {
  assert.deepEqual(
    notationTransformDefinitions.map((definition) => [
      definition.id,
      definition.geometryFamily,
      definition.identityPolicy,
      definition.renderArtifactRoles
    ]),
    [
      [
        "notation-inline-to-stacked-fraction",
        "fraction",
        "preserve-semantic-object",
        ["fraction-bar"]
      ],
      [
        "notation-radical-to-exponent",
        "radical",
        "preserve-semantic-object",
        ["radical", "radical-line"]
      ],
      [
        "notation-implicit-to-explicit-multiply",
        "multiplication",
        "preserve-semantic-object",
        ["explicit-operator"]
      ]
    ]
  );

  assert.equal(
    findNotationTransformDefinition("notation-inline-to-stacked-fraction")
      .sourceNotation,
    "inline-slash"
  );
  assert.throws(
    () => findNotationTransformDefinition("notation-missing"),
    /Unknown notation transform: notation-missing/
  );
});
