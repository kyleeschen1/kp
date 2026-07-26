import { strict as assert } from "node:assert";
import test from "node:test";
import {
  kpLlmAnimationDraftSchemaVersion,
  validateKpLlmAnimationDraftSchema,
  type KpLlmAnimationDraft
} from "../src/animation/llm-animation-draft.ts";
import {
  kpLlmAuthorCompilerBoundaryVersion,
  kpLlmAnimationDraftV2SchemaVersion,
  readKpVersionedLlmAnimationDraft,
  validateKpLlmAnimationDraftV2,
  type KpLlmAnimationDraftV2
} from "../src/animation/llm-animation-draft-v2.ts";

const validDraft: KpLlmAnimationDraft = {
  schemaVersion: kpLlmAnimationDraftSchemaVersion,
  id: "animation.generated.add-zero",
  title: "Remove an additive zero",
  renderTarget: {
    id: "render.generated.add-zero.equation",
    kind: "equation"
  },
  objects: [
    {
      id: "equation.generated.add-zero.source",
      title: "Expression with zero",
      latex: "x + 0 = 4",
      selectors: [
        { id: "source.x", kind: "term", label: "x" },
        { id: "source.zero", kind: "term", label: "0" },
        { id: "source.equals", kind: "relation", label: "=" },
        { id: "source.four", kind: "term", label: "4" }
      ]
    },
    {
      id: "equation.generated.add-zero.target",
      title: "Expression without zero",
      latex: "x = 4",
      selectors: [
        { id: "target.x", kind: "term", label: "x" },
        { id: "target.equals", kind: "relation", label: "=" },
        { id: "target.four", kind: "term", label: "4" }
      ]
    }
  ],
  transformations: [
    {
      id: "transform.generated.add-zero",
      transformType: "simplify-additive-identity",
      title: "Remove additive identity",
      sourceObjectIds: ["equation.generated.add-zero.source"],
      targetObjectIds: ["equation.generated.add-zero.target"],
      preserves: ["identity", "value"],
      correspondenceMap: {
        id: "correspondence.generated.add-zero",
        records: [
          {
            id: "identity.x",
            relation: "identity",
            sourceSelectorIds: ["source.x"],
            targetSelectorIds: ["target.x"],
            summary: "The variable persists."
          },
          {
            id: "remove.zero",
            relation: "removal",
            sourceSelectorIds: ["source.zero"],
            targetSelectorIds: [],
            summary: "The additive identity exits."
          },
          {
            id: "identity.equals",
            relation: "identity",
            sourceSelectorIds: ["source.equals"],
            targetSelectorIds: ["target.equals"],
            summary: "The equality persists."
          },
          {
            id: "identity.four",
            relation: "identity",
            sourceSelectorIds: ["source.four"],
            targetSelectorIds: ["target.four"],
            summary: "The right value persists."
          }
        ]
      }
    }
  ],
  sequence: ["transform.generated.add-zero"],
  timeline: {
    id: "timeline.generated.add-zero",
    durationMs: 1200,
    beatCount: 24
  }
};

test("constrained LLM animation draft schema accepts semantic equation intent", () => {
  assert.deepEqual(validateKpLlmAnimationDraftSchema(validDraft), []);
});

test("constrained LLM animation draft schema rejects renderer-authored instructions", () => {
  const unsafeDraft = {
    ...validDraft,
    keyframes: [{ opacity: 0 }],
    renderTarget: {
      ...validDraft.renderTarget,
      html: "<span>x</span>"
    },
    transformations: [
      {
        ...validDraft.transformations[0],
        pixels: [{ x: 12, y: 24 }]
      }
    ]
  };

  const issues = validateKpLlmAnimationDraftSchema(unsafeDraft);
  assert.deepEqual(
    issues.filter((issue) => issue.code === "draft.unknown-field").map((issue) => issue.path),
    ["$.keyframes", "$.renderTarget.html", "$.transformations[0].pixels"]
  );
});

test("constrained LLM animation draft schema reports version and relation errors by path", () => {
  const invalidDraft = structuredClone(validDraft) as unknown as Record<string, unknown>;
  invalidDraft["schemaVersion"] = "kp.llm-animation-draft.v2";
  const transformations = invalidDraft["transformations"] as Array<Record<string, unknown>>;
  const map = transformations[0]!["correspondenceMap"] as Record<string, unknown>;
  const records = map["records"] as Array<Record<string, unknown>>;
  records[0]!["relation"] = "teleport";

  const issues = validateKpLlmAnimationDraftSchema(invalidDraft);
  assert.ok(issues.some((issue) => issue.path === "$.schemaVersion"));
  assert.ok(
    issues.some(
      (issue) =>
        issue.path ===
        "$.transformations[0].correspondenceMap.records[0].relation"
    )
  );
});

test("draft v2 requires pinned registered operations, roles, provenance, salience, and epistemic status", () => {
  const migrated = readKpVersionedLlmAnimationDraft(validDraft);
  assert.equal(migrated.status, "migrated-v1");
  if (migrated.status !== "migrated-v1") return;
  assert.equal(migrated.draft.schemaVersion, kpLlmAnimationDraftV2SchemaVersion);
  assert.equal(
    migrated.draft.authorCompilerBoundaryVersion,
    kpLlmAuthorCompilerBoundaryVersion
  );
  assert.deepEqual(migrated.draft.operationPacks, [{ packId: "kp.core", version: "1.0.0" }]);
  assert.deepEqual(migrated.draft.authoringContext, {
    source: "uploaded-material",
    targetMathAuthority: "requires-validation",
    historicalReplayRequested: false
  });
  assert.ok(migrated.draft.derivations[0]?.operations.every((operation) => operation.operationId.startsWith("kp.core.")));
  assert.equal(migrated.draft.states[0]?.entities[0]?.provenance.kind, "authored");
  assert.equal(migrated.draft.states[0]?.epistemic.status, "valid");
  assert.equal(migrated.draft.derivations[0]?.epistemic.status, "unverified");
  assert.equal(migrated.draft.saliencePlan.kind, "animation-salience-plan");
  assert.ok(migrated.draft.derivations[0]?.operations.every((operation) =>
    operation.lineageBindings.length > 0 &&
    operation.ownershipMode.length > 0 &&
    operation.explanationDepth === "standard"
  ));
  assert.deepEqual(validateKpLlmAnimationDraftV2(migrated.draft), []);
});

test("legacy v2 drafts receive an explicit authority-boundary diagnostic", () => {
  const migrated = readKpVersionedLlmAnimationDraft(validDraft);
  assert.equal(migrated.status, "migrated-v1");
  if (migrated.status !== "migrated-v1") return;
  const legacy = structuredClone(migrated.draft) as unknown as Record<string, unknown>;
  delete legacy["authorCompilerBoundaryVersion"];
  const issues = validateKpLlmAnimationDraftV2(legacy);
  assert.ok(issues.some((issue) =>
    issue.code === "draft-v2.compatibility" &&
    issue.path === "$.authorCompilerBoundaryVersion" &&
    /lineageBindings, ownershipMode, and explanationDepth/.test(issue.message)
  ));
  const read = readKpVersionedLlmAnimationDraft(legacy);
  assert.equal(read.status, "rejected");
  assert.ok(read.status === "rejected" && read.issues.some(
    (issue) => issue.code === "draft-v2.compatibility"
  ));
});

test("draft v2 rejects unregistered rewrites and renderer-authored motion", () => {
  const migrated = readKpVersionedLlmAnimationDraft(validDraft);
  assert.notEqual(migrated.status, "rejected");
  if (migrated.status === "rejected") return;
  const firstDerivation = migrated.draft.derivations[0]!;
  const invalid = {
    ...migrated.draft,
    derivations: [{
      ...firstDerivation,
      operations: [{
        ...firstDerivation.operations[0]!,
        operationId: "kp.core.teleport"
      }, ...firstDerivation.operations.slice(1)]
    }],
    keyframes: [{ x: 10, y: 20 }],
    motionPrimitive: "teleport",
    easing: "spring(2)",
    opacity: 0,
    durationMs: 40,
    fragments: [{ paint: "glyph" }],
    geometry: { rect: { left: 4 } },
    timingTable: [{ progress: 0.5 }],
    style: { font: "KaTeX_Main" },
    renderer: "native-katex"
  } as unknown as KpLlmAnimationDraftV2;
  const issues = validateKpLlmAnimationDraftV2(invalid);
  assert.ok(issues.some((issue) => issue.code === "draft-v2.operation" && /Unknown canonical operation/.test(issue.message)));
  assert.ok(issues.some((issue) => issue.code === "draft-v2.unsafe" && /keyframes/.test(issue.message)));
  for (const field of [
    "motionPrimitive",
    "easing",
    "opacity",
    "durationMs",
    "fragments",
    "paint",
    "geometry",
    "rect",
    "timingTable",
    "style",
    "font",
    "renderer"
  ]) {
    assert.ok(issues.some((issue) =>
      issue.code === "draft-v2.unsafe" && issue.path.endsWith(field)
    ));
  }
});
