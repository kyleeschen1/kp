import assert from "node:assert/strict";
import test from "node:test";
import {
  compileKpLlmAnimationDraft
} from "../src/animation/llm-animation-draft-compiler.ts";
import {
  kpLlmAnimationDraftSchemaVersion,
  type KpLlmAnimationDraft
} from "../src/animation/llm-animation-draft.ts";

function additiveZeroDraft(): KpLlmAnimationDraft {
  return {
    schemaVersion: kpLlmAnimationDraftSchemaVersion,
    id: "animation.generated.add-zero",
    title: "Remove additive zero",
    renderTarget: { id: "render.generated.add-zero", kind: "equation" },
    objects: [
      {
        id: "equation.add-zero.before",
        title: "Before",
        latex: "x + 0 = 4",
        selectors: [
          { id: "before.x", kind: "term", label: "x" },
          { id: "before.zero", kind: "term", label: "0" },
          { id: "before.equals", kind: "relation", label: "=" },
          { id: "before.four", kind: "term", label: "4" }
        ]
      },
      {
        id: "equation.add-zero.after",
        title: "After",
        latex: "x = 4",
        selectors: [
          { id: "after.x", kind: "term", label: "x" },
          { id: "after.equals", kind: "relation", label: "=" },
          { id: "after.four", kind: "term", label: "4" }
        ]
      }
    ],
    transformations: [{
      id: "transform.add-zero.remove",
      transformType: "simplify-additive-identity",
      title: "Remove additive zero",
      sourceObjectIds: ["equation.add-zero.before"],
      targetObjectIds: ["equation.add-zero.after"],
      preserves: ["identity", "value"],
      correspondenceMap: {
        id: "correspondence.add-zero",
        records: [
          relation("x", "identity", ["before.x"], ["after.x"]),
          relation("zero", "removal", ["before.zero"], []),
          relation("equals", "identity", ["before.equals"], ["after.equals"]),
          relation("four", "identity", ["before.four"], ["after.four"])
        ]
      }
    }],
    sequence: ["transform.add-zero.remove"],
    timeline: { id: "timeline.add-zero", durationMs: 1200, beatCount: 24 }
  };
}

test("validated LLM draft compiles to AnimationAsset and semantic transition IR", () => {
  const result = compileKpLlmAnimationDraft(additiveZeroDraft());
  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") return;

  assert.equal(result.animation.id, "animation.generated.add-zero");
  assert.equal(result.animation.bundle.objects[0]?.value instanceof Object, true);
  assert.equal(result.animation.renderTargets[0]?.kind, "equation");
  assert.deepEqual(result.transitionIrs[0]?.relations.map((item) => item.lifecycle), [
    "persist",
    "exit",
    "persist",
    "persist"
  ]);
  assert.equal(result.transitionIrs[0]?.source[0]?.latex, "x + 0 = 4");
  assert.equal(result.transitionIrs[0]?.target[0]?.latex, "x = 4");
});

test("LLM draft compiler rejects incomplete selector lifecycles instead of fading", () => {
  const draft = additiveZeroDraft();
  const incomplete: KpLlmAnimationDraft = {
    ...draft,
    transformations: [{
      ...draft.transformations[0]!,
      correspondenceMap: {
        ...draft.transformations[0]!.correspondenceMap,
        records: draft.transformations[0]!.correspondenceMap.records.slice(0, 2)
      }
    }]
  };

  const result = compileKpLlmAnimationDraft(incomplete);
  assert.equal(result.status, "rejected");
  assert.ok(result.diagnostics.some((issue) => issue.code === "draft.incomplete-lifecycle"));
});

test("LLM draft compiler rejects unresolved object and sequence references", () => {
  const draft = additiveZeroDraft();
  const unresolved: KpLlmAnimationDraft = {
    ...draft,
    transformations: [{
      ...draft.transformations[0]!,
      targetObjectIds: ["equation.missing"]
    }],
    sequence: ["transform.missing"]
  };

  const result = compileKpLlmAnimationDraft(unresolved);
  assert.equal(result.status, "rejected");
  assert.ok(result.diagnostics.some((issue) => issue.path.endsWith("targetObjectIds[0]")));
  assert.ok(result.diagnostics.some((issue) => issue.path === "$.sequence[0]"));
});

function relation(
  id: string,
  relationId: "identity" | "removal",
  sourceSelectorIds: readonly string[],
  targetSelectorIds: readonly string[]
) {
  return {
    id: `relation.${id}`,
    relation: relationId,
    sourceSelectorIds,
    targetSelectorIds,
    summary: `${id} lifecycle.`
  };
}
