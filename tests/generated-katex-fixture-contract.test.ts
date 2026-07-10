import { strict as assert } from "node:assert";
import test from "node:test";

import {
  GENERATED_KATEX_FIXTURE_CONTRACT_VERSION,
  createGeneratedKatexTransformFixtureFromSemanticTransformation,
  exportGeneratedKatexTransformFixture,
  importGeneratedKatexFixtureDocument,
  validateGeneratedKatexFixtureDocument,
  type GeneratedKatexTransformFixture
} from "../src/authoring/transform-fixture-contract.ts";
import { createSemanticTransformationRef } from "../src/semantic/animation.ts";
import { findKatexTransformFixture } from "../src/rendering/katex-transform-fixtures.ts";

function createGeneratedFixture(): GeneratedKatexTransformFixture {
  const fixture = findKatexTransformFixture("radical.rewrite-power-as-root");

  return {
    id: "generated.radical.rewrite-power-as-root",
    fixture,
    semanticTransformation: createSemanticTransformationRef({
      id: "transform.rewrite-power-as-root",
      kind: "rewritePowerAsRadical",
      sourceObjectIds: ["expr.power"],
      targetObjectIds: ["expr.radical"],
      preserves: ["identity", "role"],
      summary: "Rewrite a one-half power as a square root."
    }),
    correspondenceMap: {
      id: "correspondence.rewrite-power-as-root",
      records: [
        {
          id: "base-to-radicand",
          relation: "role-change",
          sourceSelectorIds: ["expr.power.base.x"],
          targetSelectorIds: ["expr.radical.radicand.x"],
          summary: "The base persists as the radicand."
        },
        {
          id: "radical-artifact",
          relation: "artifact",
          sourceSelectorIds: [],
          targetSelectorIds: ["expr.radical.artifact.sqrt"],
          summary: "The radical glyph is a target-only visual artifact."
        }
      ]
    },
    visualMotifTimeline: {
      id: "visual.rewrite-power-as-root",
      segments: [
        {
          id: "transform.rewrite-power-as-root.visual.wrap",
          transformationNodeId: "transform.rewrite-power-as-root",
          transformationKind: "rewritePowerAsRadical",
          motifKind: "wrap",
          sourceObjectIds: ["expr.power"],
          targetObjectIds: ["expr.radical"],
          motionPrimitiveIds: ["wrap"],
          phaseIds: ["wrapped-token-shift", "wrap-artifact-enter"],
          summary: "Move the base into the radical while the radical appears."
        }
      ],
      forwardPhases: [
        {
          id: "visual.rewrite-power-as-root.forward.0",
          direction: "forward",
          segmentIds: ["transform.rewrite-power-as-root.visual.wrap"],
          annotationIdsByPlacement: {
            before: [],
            during: [],
            after: []
          }
        }
      ],
      rewindPhases: [
        {
          id: "visual.rewrite-power-as-root.rewind.0",
          direction: "rewind",
          segmentIds: ["transform.rewrite-power-as-root.visual.wrap"],
          annotationIdsByPlacement: {
            before: [],
            during: [],
            after: []
          }
        }
      ],
      annotations: []
    },
    artifactExpectations: [
      {
        id: "artifact.radical-glyph",
        side: "target",
        selectorId: "expr.radical.artifact.sqrt",
        structuralTokenId: "structural:radical-svg",
        artifactKind: "radical"
      }
    ],
    geometryDiagnostics: [
      {
        id: "geometry.script-to-radicand",
        targetId: "expr.radical.radicand.x",
        metric: "role-change",
        severity: "required",
        summary: "Base-to-radicand motion must preserve x identity."
      }
    ],
    summary:
      "Generated fixture contract for rewriting a fractional power as a radical."
  };
}

test("generated KaTeX fixture generator derives radical fixture metadata from a semantic transformation", () => {
  const semanticTransformation = createSemanticTransformationRef({
    id: "transform.rewrite-power-as-root",
    kind: "rewritePowerAsRadical",
    sourceObjectIds: ["expr.power"],
    targetObjectIds: ["expr.radical"],
    preserves: ["identity", "role"],
    summary: "Rewrite a one-half power as a square root."
  });
  const generated =
    createGeneratedKatexTransformFixtureFromSemanticTransformation({
      fixtureId: "radical.rewrite-power-as-root",
      semanticTransformation
    });

  assert.equal(generated.id, "generated.radical.rewrite-power-as-root");
  assert.equal(generated.fixture.id, "radical.rewrite-power-as-root");
  assert.deepEqual(generated.semanticTransformation, semanticTransformation);
  assert.deepEqual(
    generated.correspondenceMap.records.map((record) => [
      record.relation,
      record.sourceSelectorIds,
      record.targetSelectorIds
    ]),
    [
      [
        "role-change",
        ["radical.rewrite-power-as-root.source.base.x"],
        ["radical.rewrite-power-as-root.target.radicand.x"]
      ],
      [
        "artifact",
        [],
        ["radical.rewrite-power-as-root.target.artifact.structural-hide-tail"]
      ],
      [
        "artifact",
        [],
        ["radical.rewrite-power-as-root.target.artifact.structural-sqrt-line"]
      ]
    ]
  );
  assert.deepEqual(
    generated.visualMotifTimeline.segments.map((segment) => [
      segment.id,
      segment.transformationKind,
      segment.motifKind,
      segment.motionPrimitiveIds,
      segment.phaseIds
    ]),
    [
      [
        "transform.rewrite-power-as-root.visual.wrap",
        "rewritePowerAsRadical",
        "wrap",
        ["wrap"],
        ["wrapped-token-shift", "wrap-artifact-enter"]
      ]
    ]
  );
  assert.deepEqual(
    generated.artifactExpectations.map((artifact) => [
      artifact.side,
      artifact.selectorId,
      artifact.structuralTokenId,
      artifact.artifactKind
    ]),
    [
      [
        "target",
        "radical.rewrite-power-as-root.target.artifact.structural-hide-tail",
        "structural:hide-tail",
        "radical"
      ],
      [
        "target",
        "radical.rewrite-power-as-root.target.artifact.structural-sqrt-line",
        "structural:sqrt-line",
        "radical"
      ]
    ]
  );
  assert.deepEqual(
    generated.geometryDiagnostics.map((diagnostic) => [
      diagnostic.metric,
      diagnostic.severity,
      diagnostic.targetId
    ]),
    [
      [
        "artifact-presence",
        "advisory",
        "radical.rewrite-power-as-root.target.artifact.structural-hide-tail"
      ],
      [
        "artifact-presence",
        "advisory",
        "radical.rewrite-power-as-root.target.artifact.structural-sqrt-line"
      ],
      [
        "role-change",
        "required",
        "radical.rewrite-power-as-root.target.radicand.x"
      ]
    ]
  );
  assert.deepEqual(
    validateGeneratedKatexFixtureDocument(
      exportGeneratedKatexTransformFixture(generated)
    ),
    []
  );
});

test("generated KaTeX fixture generator rejects mismatched semantic transformations", () => {
  assert.throws(
    () =>
      createGeneratedKatexTransformFixtureFromSemanticTransformation({
        fixtureId: "radical.rewrite-power-as-root",
        semanticTransformation: createSemanticTransformationRef({
          id: "transform.bad",
          kind: "wrapExpressionWithFunctionCall",
          sourceObjectIds: ["expr.x"],
          targetObjectIds: ["expr.f-of-x"],
          preserves: ["identity"]
        })
      }),
    /does not match fixture radical\.rewrite-power-as-root/
  );
});

test("generated KaTeX fixture contract round-trips semantic generation metadata", () => {
  const generatedFixture = createGeneratedFixture();
  const document = exportGeneratedKatexTransformFixture(generatedFixture);

  assert.equal(
    document.schemaVersion,
    GENERATED_KATEX_FIXTURE_CONTRACT_VERSION
  );
  assert.equal(document.kind, "generated-katex-transform-fixture");
  assert.deepEqual(JSON.parse(JSON.stringify(document)), document);

  const imported = importGeneratedKatexFixtureDocument(document);

  assert.equal(imported.ok, true);
  if (!imported.ok) {
    throw new Error("Expected exported generated fixture document to import.");
  }
  assert.deepEqual(imported.generated, generatedFixture);
});

test("generated KaTeX fixture contract reports invalid semantic fields", () => {
  const issues = validateGeneratedKatexFixtureDocument({
    schemaVersion: GENERATED_KATEX_FIXTURE_CONTRACT_VERSION,
    kind: "generated-katex-transform-fixture",
    generated: {
      id: "bad.generated-fixture",
      fixture: null,
      semanticTransformation: {
        id: "",
        kind: "",
        sourceObjectIds: ["expr.source"],
        targetObjectIds: ["expr.target"],
        preserves: ["unknown-preservation"]
      },
      correspondenceMap: {
        id: "bad.correspondence",
        records: [
          {
            id: "bad-record",
            relation: "unknown-relation",
            sourceSelectorIds: [],
            targetSelectorIds: [],
            summary: ""
          }
        ]
      },
      visualMotifTimeline: {
        id: "",
        segments: [],
        forwardPhases: [],
        rewindPhases: [],
        annotations: []
      },
      artifactExpectations: [
        {
          id: "",
          side: "middle",
          selectorId: "",
          structuralTokenId: "",
          artifactKind: "unknown-artifact"
        }
      ],
      geometryDiagnostics: [],
      summary: ""
    }
  });

  assert.ok(
    issues.some((issue) => issue.path === "generated.fixture"),
    "expected invalid nested fixture issue"
  );
  assert.ok(
    issues.some((issue) => issue.path === "generated.semanticTransformation.id")
  );
  assert.ok(
    issues.some(
      (issue) => issue.path === "generated.semanticTransformation.preserves[0]"
    )
  );
  assert.ok(
    issues.some(
      (issue) => issue.path === "generated.correspondenceMap.records[0].relation"
    )
  );
  assert.ok(
    issues.some(
      (issue) => issue.path === "generated.correspondenceMap.records[0]"
    ),
    "expected empty correspondence endpoint issue"
  );
  assert.ok(
    issues.some((issue) => issue.path === "generated.visualMotifTimeline.id")
  );
  assert.ok(
    issues.some(
      (issue) => issue.path === "generated.artifactExpectations[0].side"
    )
  );
  assert.ok(
    issues.some((issue) => issue.path === "generated.geometryDiagnostics")
  );
});
