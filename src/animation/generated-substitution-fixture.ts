import {
  compileKpSubstitutionChoreography,
  type KpSubstitutionChoreographyPlan
} from "./substitution-choreography.ts";
import { createKpDiagramScene } from "../semantic/diagram-scene.ts";
import {
  composeKpSemanticScenes,
  createKpSemanticSceneTransition,
  projectKpDiagramSceneToSemanticScene,
  projectKpEquationTransitionStateToSemanticScene,
  type KpSemanticScene,
  type KpSemanticSceneTransition
} from "../semantic/semantic-scene-protocol.ts";
import { createKpSemanticLineageGraph } from "../semantic/semantic-lineage-graph.ts";
import { createKpEquationTransitionIr } from "../domain-ir/public-api.ts";

export interface KpGeneratedSubstitutionFixture {
  readonly kind: "generated-substitution-fixture";
  readonly id: string;
  readonly prompt: string;
  readonly source: KpSemanticScene;
  readonly target: KpSemanticScene;
  readonly transition: KpSemanticSceneTransition;
  readonly choreography: KpSubstitutionChoreographyPlan;
}

export function createKpGeneratedSubstitutionFixture(): KpGeneratedSubstitutionFixture {
  const equation = createEquationIr();
  const source = composeKpSemanticScenes({
    id: "scene.generated.substitution.source",
    title: "Use the input value in the expression",
    scenes: [
      projectKpDiagramSceneToSemanticScene(inputDiagram("source")),
      projectKpEquationTransitionStateToSemanticScene({ ir: equation, side: "source" })
    ]
  });
  const target = composeKpSemanticScenes({
    id: "scene.generated.substitution.target",
    title: "Input value substituted into the expression",
    scenes: [
      projectKpDiagramSceneToSemanticScene(inputDiagram("target")),
      projectKpEquationTransitionStateToSemanticScene({ ir: equation, side: "target" })
    ]
  });
  const correspondenceMap = {
    id: "correspondence.generated.substitution",
    records: [
      {
        id: "generated.substitution.value-lineage",
        relation: "fan-out" as const,
        sourceSelectorIds: ["generated.substitution.input.value"],
        targetSelectorIds: [
          "generated.substitution.input.value.after",
          "generated.substitution.after.three"
        ],
        summary: "The input remains visible while a lineage-bearing copy replaces x."
      },
      {
        id: "generated.substitution.replace-x",
        relation: "removal" as const,
        sourceSelectorIds: ["generated.substitution.before.x"],
        targetSelectorIds: [],
        summary: "The bound variable occupant exits after the value arrives."
      },
      persistentRecord("plus"),
      persistentRecord("two")
    ]
  };
  const transition = createKpSemanticSceneTransition({
    id: "scene-transition.generated.substitution",
    source,
    target,
    correspondenceMap,
    lineageGraph: createKpSemanticLineageGraph({
      id: "lineage.generated.substitution",
      sourceEntityIds: source.registry.entities.map((entity) => entity.id),
      targetEntityIds: target.registry.entities.map((entity) => entity.id),
      edges: [
        {
          id: "generated.substitution.persist-input",
          relation: "persist",
          sourceEntityIds: ["generated.substitution.input.value"],
          targetEntityIds: ["generated.substitution.input.value.after"],
          summary: "The source input remains available as context."
        },
        {
          id: "generated.substitution.transmit-value",
          relation: "copy",
          sourceEntityIds: ["generated.substitution.input.value"],
          targetEntityIds: ["generated.substitution.after.three"],
          summary: "A value-identical copy travels into the bound occurrence."
        },
        {
          id: "generated.substitution.remove-x",
          relation: "removal",
          sourceEntityIds: ["generated.substitution.before.x"],
          targetEntityIds: [],
          summary: "The replaced variable occupant leaves the expression."
        },
        persistentLineage("plus"),
        persistentLineage("two")
      ]
    })
  });
  const choreography = compileKpSubstitutionChoreography({
    id: "choreography.generated.substitution",
    source,
    target,
    transition,
    valueEntityId: "generated.substitution.input.value",
    replacedEntityId: "generated.substitution.before.x",
    replacementEntityId: "generated.substitution.after.three"
  });

  return {
    kind: "generated-substitution-fixture",
    id: "generated.substitution.input-into-expression",
    prompt: "Given x = 3, show how x + 2 becomes 3 + 2 without teleporting the value.",
    source,
    target,
    transition,
    choreography
  };
}

function createEquationIr() {
  return createKpEquationTransitionIr({
    id: "equation-transition.generated.substitution",
    transformationId: "transform.generated.substitution",
    transformType: "substituteValue",
    title: "Substitute 3 for x",
    source: [{
      objectId: "equation.generated.substitution.before",
      latex: "x + 2",
      selectors: [
        selector("before", "x", "x"),
        selector("before", "plus", "+", "operator"),
        selector("before", "two", "2")
      ]
    }],
    target: [{
      objectId: "equation.generated.substitution.after",
      latex: "3 + 2",
      selectors: [
        selector("after", "three", "3"),
        selector("after", "plus", "+", "operator"),
        selector("after", "two", "2")
      ]
    }],
    correspondenceMap: {
      id: "correspondence.generated.substitution.equation",
      records: [
        {
          id: "generated.substitution.equation.remove-x",
          relation: "removal",
          sourceSelectorIds: ["generated.substitution.before.x"],
          targetSelectorIds: [],
          summary: "x is replaced by the supplied value."
        },
        {
          id: "generated.substitution.equation.introduce-three",
          relation: "introduction",
          sourceSelectorIds: [],
          targetSelectorIds: ["generated.substitution.after.three"],
          summary: "3 appears from the external value source."
        },
        persistentRecord("plus"),
        persistentRecord("two")
      ]
    }
  });
}

function inputDiagram(side: "source" | "target") {
  return createKpDiagramScene({
    id: `diagram.generated.substitution.input.${side}`,
    title: side === "source" ? "Input x = 3" : "Input x = 3 remains available",
    width: 240,
    height: 100,
    nodes: [{
      id: `node.generated.substitution.input.${side}`,
      selectorId: side === "source"
        ? "generated.substitution.input.value"
        : "generated.substitution.input.value.after",
      shape: "circle",
      x: 80,
      y: 20,
      width: 56,
      height: 56,
      label: "3"
    }],
    edges: [],
    groups: [],
    labels: []
  });
}

function selector(
  side: "before" | "after",
  id: string,
  label: string,
  semanticKind: "term" | "operator" = "term"
) {
  return {
    id: `generated.substitution.${side}.${id}`,
    kind: "semantic" as const,
    semanticKind,
    label
  };
}

function persistentRecord(id: "plus" | "two") {
  return {
    id: `generated.substitution.persist-${id}`,
    relation: "identity" as const,
    sourceSelectorIds: [`generated.substitution.before.${id}`],
    targetSelectorIds: [`generated.substitution.after.${id}`],
    summary: `${id} persists during substitution.`
  };
}

function persistentLineage(id: "plus" | "two") {
  return {
    id: `generated.substitution.lineage-${id}`,
    relation: "persist" as const,
    sourceEntityIds: [`generated.substitution.before.${id}`],
    targetEntityIds: [`generated.substitution.after.${id}`],
    summary: `${id} persists during substitution.`
  };
}
