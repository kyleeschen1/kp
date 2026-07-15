import { strict as assert } from "node:assert";
import test from "node:test";
import {
  kpLlmAnimationDraftSchemaVersion,
  validateKpLlmAnimationDraftSchema,
  type KpLlmAnimationDraft
} from "../src/animation/llm-animation-draft.ts";

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
