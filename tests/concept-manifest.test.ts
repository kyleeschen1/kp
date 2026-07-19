import assert from "node:assert/strict";
import test from "node:test";

import {
  createConceptDraft,
  draftConceptManifestSchema,
  publishedConceptManifestSchema
} from "../src/authoring/public-api.ts";

const draft = {
  schemaVersion: "kp.concept-manifest.v1",
  conceptId: "mathematics.linear-equations.solve-with-balance",
  version: "1.0.0",
  title: "Solve a linear equation",
  modes: ["watch", "touch", "review"],
  projections: ["symbolic", "balance"],
  styleRoles: ["equation.expression", "diagram.balance"],
  semanticRefs: [
    { id: "equation.initial", kind: "equation" },
    { id: "operation.subtract", kind: "operation" },
    { id: "equation.solved", kind: "equation" }
  ],
  checkpoints: [
    {
      id: "start",
      title: "Start",
      explanation: "Begin with both sides equal.",
      progressPermille: 0,
      semanticRefs: ["equation.initial"]
    },
    {
      id: "solved",
      title: "Solved",
      explanation: "The same value remains on both sides.",
      progressPermille: 1000,
      semanticRefs: ["equation.solved"]
    }
  ],
  capabilities: [{ id: "kp.equation", major: 1 }],
  providers: [{
    id: "linear-problems.exact-rational",
    protocol: "linear-problem.v1",
    version: "1.0.0"
  }],
  route: {
    canonicalPath: "/concepts/mathematics/linear-equations/solve-with-balance",
    legacyAliases: []
  },
  review: {
    title: "Solve 2x + 3 = 8",
    summary: "Subtract three, then divide by two.",
    searchableText: "2x + 3 = 8 subtract 3 divide 2 x = 5/2",
    checkpointAnchors: true
  },
  provenance: {
    sourcePath: "content/mathematics/linear-equations/solve-with-balance/concept.ts",
    authoredBy: "human",
    authoredAt: "2026-07-19T00:00:00.000Z",
    compilerVersion: "1.0.0"
  },
  publicationStatus: "draft"
} as const;

test("concept drafts are schema-validated mutable authoring values", () => {
  const mutable = createConceptDraft(draft);
  mutable.title = "Revised title";
  mutable.checkpoints[0]!.explanation = "Revised explanation";
  assert.equal(mutable.title, "Revised title");
  assert.equal(draftConceptManifestSchema.safeParse(mutable).success, true);
});

test("published concept manifests are deeply immutable", () => {
  const published = publishedConceptManifestSchema.parse({
    ...draft,
    publicationStatus: "published",
    integrity: `sha256:${"a".repeat(64)}`
  });
  assert.equal(Object.isFrozen(published), true);
  assert.equal(Object.isFrozen(published.checkpoints), true);
  assert.equal(Object.isFrozen(published.checkpoints[0]), true);
});

test("concept schemas reject duplicate, dangling, executable, and style-owned data", () => {
  assert.equal(draftConceptManifestSchema.safeParse({
    ...draft,
    semanticRefs: [...draft.semanticRefs, draft.semanticRefs[0]]
  }).success, false);
  assert.equal(draftConceptManifestSchema.safeParse({
    ...draft,
    checkpoints: [{ ...draft.checkpoints[0], semanticRefs: ["missing.ref"] }]
  }).success, false);
  assert.equal(draftConceptManifestSchema.safeParse({ ...draft, onEnter: () => undefined }).success, false);
  assert.equal(draftConceptManifestSchema.safeParse({ ...draft, rawColor: "#ff0000" }).success, false);
});
