import type { KpAnimationAsset } from "./asset.ts";
import {
  compileKpLlmAnimationDraft,
  type KpLlmAnimationDraftCompileDiagnosticCode
} from "./llm-animation-draft-compiler.ts";
import {
  kpLlmAnimationDraftSchemaVersion,
  type KpLlmAnimationDraft
} from "./llm-animation-draft.ts";

export const acceptedGeneratedAddZeroDraft: KpLlmAnimationDraft = {
  schemaVersion: kpLlmAnimationDraftSchemaVersion,
  id: "animation.generated.add-zero",
  title: "Generated: remove additive zero",
  renderTarget: { id: "render.generated.add-zero", kind: "equation" },
  objects: [
    {
      id: "equation.generated.add-zero.before",
      title: "Before removing zero",
      latex: "x + 0 = 4",
      selectors: [
        { id: "generated.add-zero.before.x", kind: "term", label: "x" },
        { id: "generated.add-zero.before.zero", kind: "term", label: "0" },
        { id: "generated.add-zero.before.equals", kind: "relation", label: "=" },
        { id: "generated.add-zero.before.four", kind: "term", label: "4" }
      ]
    },
    {
      id: "equation.generated.add-zero.after",
      title: "After removing zero",
      latex: "x = 4",
      selectors: [
        { id: "generated.add-zero.after.x", kind: "term", label: "x" },
        { id: "generated.add-zero.after.equals", kind: "relation", label: "=" },
        { id: "generated.add-zero.after.four", kind: "term", label: "4" }
      ]
    }
  ],
  transformations: [{
    id: "transform.generated.add-zero.remove",
    transformType: "simplify-additive-identity",
    title: "Remove additive identity",
    sourceObjectIds: ["equation.generated.add-zero.before"],
    targetObjectIds: ["equation.generated.add-zero.after"],
    preserves: ["identity", "value"],
    correspondenceMap: {
      id: "correspondence.generated.add-zero",
      records: [
        record("x", "identity", ["generated.add-zero.before.x"], ["generated.add-zero.after.x"]),
        record("zero", "removal", ["generated.add-zero.before.zero"], []),
        record("equals", "identity", ["generated.add-zero.before.equals"], ["generated.add-zero.after.equals"]),
        record("four", "identity", ["generated.add-zero.before.four"], ["generated.add-zero.after.four"])
      ]
    }
  }],
  sequence: ["transform.generated.add-zero.remove"],
  timeline: { id: "timeline.generated.add-zero", durationMs: 1400, beatCount: 28 }
};

export const acceptedGeneratedSubstitutionDraft: KpLlmAnimationDraft = {
  schemaVersion: kpLlmAnimationDraftSchemaVersion,
  id: "animation.generated.substitute-three",
  title: "Generated: substitute 3 for x",
  renderTarget: { id: "render.generated.substitute-three", kind: "equation" },
  objects: [
    {
      id: "equation.generated.substitute-three.before",
      title: "Input value and expression before substitution",
      latex: "3 \\Rightarrow x + 2",
      selectors: [
        { id: "generated.substitute-three.before.value", kind: "value", label: "3" },
        { id: "generated.substitute-three.before.arrow", kind: "relation", label: "\\Rightarrow" },
        { id: "generated.substitute-three.before.x", kind: "variable", label: "x" },
        { id: "generated.substitute-three.before.plus", kind: "operator", label: "+" },
        { id: "generated.substitute-three.before.two", kind: "value", label: "2" }
      ]
    },
    {
      id: "equation.generated.substitute-three.after",
      title: "Input value transmitted into the expression",
      latex: "3 \\Rightarrow 3 + 2",
      selectors: [
        { id: "generated.substitute-three.after.value", kind: "value", label: "3" },
        { id: "generated.substitute-three.after.arrow", kind: "relation", label: "\\Rightarrow" },
        { id: "generated.substitute-three.after.replacement", kind: "value", label: "3" },
        { id: "generated.substitute-three.after.plus", kind: "operator", label: "+" },
        { id: "generated.substitute-three.after.two", kind: "value", label: "2" }
      ]
    }
  ],
  transformations: [{
    id: "transform.generated.substitute-three",
    transformType: "substituteValue",
    title: "Carry 3 into the position occupied by x",
    sourceObjectIds: ["equation.generated.substitute-three.before"],
    targetObjectIds: ["equation.generated.substitute-three.after"],
    preserves: ["identity", "value", "structure"],
    correspondenceMap: {
      id: "correspondence.generated.substitute-three",
      records: [
        {
          id: "relation.generated.substitute-three.value-lineage",
          relation: "fan-out",
          sourceSelectorIds: ["generated.substitute-three.before.value"],
          targetSelectorIds: [
            "generated.substitute-three.after.value",
            "generated.substitute-three.after.replacement"
          ],
          summary: "The input stays visible while a lineage-bearing copy replaces x."
        },
        {
          id: "relation.generated.substitute-three.replace-x",
          relation: "removal",
          sourceSelectorIds: ["generated.substitute-three.before.x"],
          targetSelectorIds: [],
          summary: "x exits only after the supplied value arrives."
        },
        substitutionPersistentRecord("arrow"),
        substitutionPersistentRecord("plus"),
        substitutionPersistentRecord("two")
      ]
    }
  }],
  sequence: ["transform.generated.substitute-three"],
  timeline: { id: "timeline.generated.substitute-three", durationMs: 1800, beatCount: 36 }
};

export interface KpRejectedLlmAnimationDraftExample {
  readonly id: string;
  readonly draft: unknown;
  readonly expectedCode: KpLlmAnimationDraftCompileDiagnosticCode;
  readonly repair: string;
}

export const rejectedGeneratedAnimationDraftExamples:
  readonly KpRejectedLlmAnimationDraftExample[] = [
  {
    id: "rejected.renderer-keyframes",
    draft: {
      ...acceptedGeneratedAddZeroDraft,
      keyframes: [{ opacity: 0 }, { opacity: 1 }]
    },
    expectedCode: "draft.unknown-field",
    repair:
      "Remove renderer instructions; describe selector lifecycles through correspondenceMap records."
  },
  {
    id: "rejected.incomplete-lifecycle",
    draft: {
      ...acceptedGeneratedAddZeroDraft,
      transformations: [{
        ...acceptedGeneratedAddZeroDraft.transformations[0],
        correspondenceMap: {
          ...acceptedGeneratedAddZeroDraft.transformations[0]!.correspondenceMap,
          records: acceptedGeneratedAddZeroDraft.transformations[0]!
            .correspondenceMap.records.slice(0, 2)
        }
      }]
    },
    expectedCode: "draft.incomplete-lifecycle",
    repair:
      "Add one lifecycle relation for every visible source and target selector."
  }
];

export function createAcceptedGeneratedAddZeroAnimationAsset(): KpAnimationAsset {
  const result = compileKpLlmAnimationDraft(acceptedGeneratedAddZeroDraft);
  if (result.status !== "accepted") {
    throw new Error(
      `Accepted generated draft failed compilation: ${result.diagnostics[0]?.message ?? "unknown error"}`
    );
  }
  return result.animation;
}

export function createAcceptedGeneratedSubstitutionAnimationAsset(): KpAnimationAsset {
  const result = compileKpLlmAnimationDraft(acceptedGeneratedSubstitutionDraft);
  if (result.status !== "accepted") {
    throw new Error(
      `Accepted generated substitution draft failed compilation: ${result.diagnostics[0]?.message ?? "unknown error"}`
    );
  }
  return result.animation;
}

function record(
  id: string,
  relation: "identity" | "removal",
  sourceSelectorIds: readonly string[],
  targetSelectorIds: readonly string[]
) {
  return {
    id: `relation.generated.add-zero.${id}`,
    relation,
    sourceSelectorIds,
    targetSelectorIds,
    summary: `${id} semantic lifecycle.`
  };
}

function substitutionPersistentRecord(id: "arrow" | "plus" | "two") {
  return {
    id: `relation.generated.substitute-three.persist-${id}`,
    relation: "identity" as const,
    sourceSelectorIds: [`generated.substitute-three.before.${id}`],
    targetSelectorIds: [`generated.substitute-three.after.${id}`],
    summary: `${id} persists while the value is substituted.`
  };
}
