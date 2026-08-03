import {
  createKpAssetBundle,
  createKpSemanticAssetObject,
  type KpAssetBundle
} from "./asset.ts";
import {
  createKpSemanticLineageGraph,
  type KpSemanticLineageGraph
} from "./semantic-lineage-graph.ts";
import {
  createKpSemanticTransformation,
  type KpSemanticTransformation
} from "./asset-transformation.ts";
import type { CorrespondenceMap } from "./correspondence.ts";
import {
  createKpLispLambdaApplicationFixture,
  type KpLispLambdaApplicationFixture
} from "./lisp-lambda-application-fixture.ts";

export type KpLispMaterialReason =
  | "persists"
  | "gathers"
  | "emerges"
  | "exits-after-substitution";

export interface KpLispMaterialLedgerEntry {
  readonly id: string;
  readonly sourceIds: readonly string[];
  readonly targetIds: readonly string[];
  readonly reason: KpLispMaterialReason;
  readonly explanation: string;
}

export interface KpLispAnimationCheckpoint {
  readonly id:
    | "application-ready"
    | "binding-established"
    | "body-reconstructed"
    | "result-settled";
  readonly progress: number;
  readonly label: string;
  readonly focusSelectorIds: readonly string[];
}

export interface KpLispLambdaApplicationAsset {
  readonly id: "animation.programming.lisp-lambda-application";
  readonly fixture: KpLispLambdaApplicationFixture;
  readonly bundle: KpAssetBundle;
  readonly transformations: readonly KpSemanticTransformation[];
  readonly lineage: readonly KpSemanticLineageGraph[];
  readonly materialLedger: readonly KpLispMaterialLedgerEntry[];
  readonly checkpoints: readonly KpLispAnimationCheckpoint[];
  readonly accessibility: {
    readonly title: string;
    readonly description: string;
    readonly settledCode: "5";
  };
}

export function createKpLispLambdaApplicationAsset(): KpLispLambdaApplicationAsset {
  const fixture = createKpLispLambdaApplicationFixture();
  const bundle = createKpAssetBundle({
    id: "asset.programming.lisp-lambda-application",
    title: "Lisp function application",
    objects: [
      object("object.lisp.input", "lisp-s-expression", "Function application", fixture.semantic, [
        selector("selector.lisp.input.application", "application", "Complete application"),
        selector("selector.lisp.input.lambda", "lambda", "Lambda expression"),
        selector("selector.lisp.input.binder-x", "binder", "Parameter x"),
        selector("selector.lisp.input.body-plus", "operator", "Addition operator"),
        selector("selector.lisp.input.body-reference-x", "reference", "Reference to x"),
        selector("selector.lisp.input.body-one", "integer", "Literal one"),
        selector("selector.lisp.input.argument-four", "argument", "Argument four")
      ], "authored", [fixture.id]),
      object("object.lisp.environment", "lisp-environment", "Application environment", fixture.semantic.environments[0], [
        selector("selector.lisp.environment.binding-x", "binding", "x is bound"),
        selector("selector.lisp.environment.value-four", "bound-value", "Bound value four"),
        selector("selector.lisp.environment.destination-x", "substitution-destination", "Reference destination")
      ], "derived", ["binding.x", "occurrence.argument.four"]),
      object("object.lisp.reconstructed", "lisp-derived-s-expression", "Reconstructed body", fixture.evaluation.reconstructed, [
        selector("selector.lisp.reconstructed.body", "s-expression", "Reconstructed body"),
        selector("selector.lisp.reconstructed.plus", "operator", "Preserved addition operator"),
        selector("selector.lisp.reconstructed.four", "substituted-value", "Argument four in the body"),
        selector("selector.lisp.reconstructed.one", "integer", "Preserved literal one")
      ], "transformed", ["expr.body", "occurrence.argument.four"]),
      object("object.lisp.result", "lisp-integer-value", "Evaluation result", fixture.evaluation.result, [
        selector("selector.lisp.result.five", "integer-value", "Result five")
      ], "derived", [fixture.evaluation.reconstructed.id])
    ]
  });
  const transformations = Object.freeze([
    createKpSemanticTransformation({
      id: "transform.lisp.bind-argument",
      transformType: "bindLispArgument",
      title: "Bind four to x",
      sourceObjectIds: ["object.lisp.input"],
      targetObjectIds: ["object.lisp.environment"],
      preserves: ["identity", "value", "role"],
      correspondenceMap: bindingCorrespondence(),
      assumptions: ["The certified fixture has one lexical parameter and one argument."],
      lawRefs: [{ id: "kp.lisp.binding-provenance", level: "strict" }]
    }),
    createKpSemanticTransformation({
      id: "transform.lisp.substitute-body",
      transformType: "substituteLispBinding",
      title: "Reconstruct the body with four",
      sourceObjectIds: ["object.lisp.input", "object.lisp.environment"],
      targetObjectIds: ["object.lisp.reconstructed"],
      preserves: ["identity", "structure", "value"],
      correspondenceMap: substitutionCorrespondence(),
      assumptions: ["Substitution targets the certified reference occurrence, not matching text."],
      lawRefs: [{ id: "kp.lisp.substitution-identity", level: "strict" }]
    }),
    createKpSemanticTransformation({
      id: "transform.lisp.evaluate-addition",
      transformType: "evaluateLispPrimitiveAddition",
      title: "Evaluate reconstructed addition",
      sourceObjectIds: ["object.lisp.reconstructed"],
      targetObjectIds: ["object.lisp.result"],
      preserves: ["value"],
      correspondenceMap: evaluationCorrespondence(),
      assumptions: ["The bounded evaluator certifies integer addition 4 + 1 = 5."],
      lawRefs: [{ id: "kp.lisp.exact-result", level: "strict" }]
    })
  ]);
  const lineage = Object.freeze([
    createKpSemanticLineageGraph({
      id: "lineage.lisp.substitution",
      sourceEntityIds: [
        "occurrence.plus",
        "occurrence.argument.four",
        "occurrence.x.reference",
        "occurrence.body.one"
      ],
      targetEntityIds: ["derived.plus", "derived.argument.four", "derived.body.one"],
      edges: [
        edge("lineage.plus-persists", "persist", ["occurrence.plus"], ["derived.plus"], "The operator persists."),
        edge("lineage.argument-gathers", "merge", ["occurrence.argument.four", "occurrence.x.reference"], ["derived.argument.four"], "The argument gathers into the reference destination."),
        edge("lineage.one-persists", "persist", ["occurrence.body.one"], ["derived.body.one"], "The literal one persists.")
      ]
    }),
    createKpSemanticLineageGraph({
      id: "lineage.lisp.evaluation",
      sourceEntityIds: ["derived.plus", "derived.argument.four", "derived.body.one"],
      targetEntityIds: ["value.result.five"],
      edges: [
        edge("lineage.result-gathers", "merge", ["derived.plus", "derived.argument.four", "derived.body.one"], ["value.result.five"], "The evaluated form gathers into its exact value.")
      ]
    })
  ]);

  return Object.freeze({
    id: "animation.programming.lisp-lambda-application",
    fixture,
    bundle,
    transformations,
    lineage,
    materialLedger: Object.freeze([
      material("material.plus", ["occurrence.plus"], ["derived.plus"], "persists", "The plus operator retains its semantic role."),
      material("material.argument", ["occurrence.argument.four", "occurrence.x.reference"], ["derived.argument.four"], "gathers", "Four enters the exact destination named by the x reference."),
      material("material.literal", ["occurrence.body.one"], ["derived.body.one"], "persists", "The literal one remains part of the body."),
      material("material.lambda-shell", ["expr.lambda"], [], "exits-after-substitution", "The application shell exits after its body and environment determine the reconstructed form."),
      material("material.result", ["derived.plus", "derived.argument.four", "derived.body.one"], ["value.result.five"], "gathers", "The reconstructed form evaluates into five.")
    ]),
    checkpoints: Object.freeze([
      checkpoint("application-ready", 0, "Read the application", ["selector.lisp.input.application"]),
      checkpoint("binding-established", 0.34, "Bind four to x", ["selector.lisp.input.binder-x", "selector.lisp.input.argument-four", "selector.lisp.environment.binding-x"]),
      checkpoint("body-reconstructed", 0.7, "Reconstruct the body", ["selector.lisp.reconstructed.body"]),
      checkpoint("result-settled", 1, "Settle as five", ["selector.lisp.result.five"])
    ]),
    accessibility: Object.freeze({
      title: "Applying a Lisp function to four",
      description: "The argument four binds to x, replaces the reference in plus x one, and the reconstructed form plus four one evaluates to five.",
      settledCode: "5"
    })
  });
}

function object(
  id: string,
  objectType: string,
  title: string,
  value: unknown,
  selectors: readonly ReturnType<typeof selector>[],
  kind: "authored" | "derived" | "transformed",
  sourceIds: readonly string[]
) {
  return createKpSemanticAssetObject({
    id,
    objectType,
    title,
    value,
    selectors,
    provenance: { kind, sourceIds, summary: `${title} for the certified Lisp fixture.` }
  });
}

function selector(id: string, kind: string, label: string) {
  return Object.freeze({ id, kind, label });
}

function edge(
  id: string,
  relation: "persist" | "merge",
  sourceEntityIds: readonly string[],
  targetEntityIds: readonly string[],
  summary: string
) {
  return { id, relation, sourceEntityIds, targetEntityIds, summary };
}

function material(
  id: string,
  sourceIds: readonly string[],
  targetIds: readonly string[],
  reason: KpLispMaterialReason,
  explanation: string
): KpLispMaterialLedgerEntry {
  return Object.freeze({ id, sourceIds: Object.freeze([...sourceIds]), targetIds: Object.freeze([...targetIds]), reason, explanation });
}

function checkpoint(
  id: KpLispAnimationCheckpoint["id"],
  progress: number,
  label: string,
  focusSelectorIds: readonly string[]
): KpLispAnimationCheckpoint {
  return Object.freeze({ id, progress, label, focusSelectorIds: Object.freeze([...focusSelectorIds]) });
}

function bindingCorrespondence(): CorrespondenceMap {
  return map("correspondence.lisp.binding", [
    record("binding-x", "role-change", ["selector.lisp.input.binder-x"], ["selector.lisp.environment.binding-x"], "The parameter becomes a lexical binding."),
    record("argument-four", "role-change", ["selector.lisp.input.argument-four"], ["selector.lisp.environment.value-four"], "Four becomes the bound value."),
    record("reference-destination", "role-change", ["selector.lisp.input.body-reference-x"], ["selector.lisp.environment.destination-x"], "The reference becomes an explicit destination.")
  ]);
}

function substitutionCorrespondence(): CorrespondenceMap {
  return map("correspondence.lisp.substitution", [
    record("plus-persists", "identity", ["selector.lisp.input.body-plus"], ["selector.lisp.reconstructed.plus"], "Plus persists."),
    record("four-enters", "role-change", ["selector.lisp.environment.value-four"], ["selector.lisp.reconstructed.four"], "Four enters the body."),
    record("one-persists", "identity", ["selector.lisp.input.body-one"], ["selector.lisp.reconstructed.one"], "One persists."),
    record("reference-consumed", "removal", ["selector.lisp.input.body-reference-x"], [], "The reference exits because its bound value occupies the destination.")
  ]);
}

function evaluationCorrespondence(): CorrespondenceMap {
  return map("correspondence.lisp.evaluation", [
    record("form-evaluates", "fan-in", [
      "selector.lisp.reconstructed.plus",
      "selector.lisp.reconstructed.four",
      "selector.lisp.reconstructed.one"
    ], ["selector.lisp.result.five"], "The complete reconstructed form derives five.")
  ]);
}

function map(id: string, records: readonly CorrespondenceMap["records"][number][]): CorrespondenceMap {
  return Object.freeze({ id, records: Object.freeze(records) });
}

function record(
  id: string,
  relation: CorrespondenceMap["records"][number]["relation"],
  sourceSelectorIds: readonly string[],
  targetSelectorIds: readonly string[],
  summary: string
): CorrespondenceMap["records"][number] {
  return Object.freeze({ id, relation, sourceSelectorIds: Object.freeze([...sourceSelectorIds]), targetSelectorIds: Object.freeze([...targetSelectorIds]), summary });
}
