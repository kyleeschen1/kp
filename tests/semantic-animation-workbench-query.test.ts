import assert from "node:assert/strict";
import test from "node:test";

import type {
  KpSemanticAnimationWorkbenchIndex
} from "../src/editor/semantic-animation-workbench-index.ts";
import {
  queryKpSemanticAnimationWorkbench
} from "../src/editor/semantic-animation-workbench-query.ts";

const index = {
  schemaVersion: "kp.semantic-animation-workbench-index.v1",
  valid: true,
  diagnostics: [],
  entries: [
    entry({
      animationId: "animation.generated.radical.square-root-as-power",
      title: "Power to radical",
      aliases: ["square root", "rational exponent"],
      familyIds: ["family.algebra.exponent-log-laws"],
      tags: ["radical", "algebra"],
      maturity: "promoted",
      playability: "playable",
      representationLabel: "Radical rewrite sample"
    }),
    entry({
      animationId: "animation.derivative-rules.tangent-graph",
      title: "Difference quotient converging to a tangent",
      aliases: ["secant to tangent"],
      familyIds: ["family.calculus.derivative-rules"],
      tags: ["calculus", "graph"],
      maturity: "approved",
      playability: "playable",
      representationLabel: "Tangent graph sample"
    }),
    entry({
      animationId: "animation.algebra.quadratic.solution-branching",
      title: "Quadratic solution branching",
      aliases: [],
      familyIds: [],
      tags: ["quadratic", "branch"],
      maturity: "proposed",
      playability: "planned-only"
    })
  ]
} satisfies KpSemanticAnimationWorkbenchIndex;

test("Workbench query ranks title alias family and typo matches", () => {
  assert.equal(
    queryKpSemanticAnimationWorkbench(index, "radicl")[0]!.entry.identity
      .animationId,
    "animation.generated.radical.square-root-as-power"
  );
  assert.equal(
    queryKpSemanticAnimationWorkbench(index, "secant")[0]!.entry.identity
      .animationId,
    "animation.derivative-rules.tangent-graph"
  );
  assert.equal(
    queryKpSemanticAnimationWorkbench(index, "exponent log")[0]!.entry.identity
      .animationId,
    "animation.generated.radical.square-root-as-power"
  );
});

test("Workbench query searches lifecycle and nested representations", () => {
  assert.equal(
    queryKpSemanticAnimationWorkbench(index, "planned quadratic")[0]!.entry
      .identity.animationId,
    "animation.algebra.quadratic.solution-branching"
  );
  assert.equal(
    queryKpSemanticAnimationWorkbench(index, "tangent sample")[0]!.entry
      .identity.animationId,
    "animation.derivative-rules.tangent-graph"
  );
});

test("Workbench query has deterministic ties and empty ordering", () => {
  const first = queryKpSemanticAnimationWorkbench(index, "");
  const second = queryKpSemanticAnimationWorkbench(index, "");

  assert.deepEqual(first, second);
  assert.deepEqual(
    first.map((result) => result.entry.identity.title),
    [
      "Difference quotient converging to a tangent",
      "Power to radical",
      "Quadratic solution branching"
    ]
  );
});

function entry(input: {
  readonly animationId: string;
  readonly title: string;
  readonly aliases: readonly string[];
  readonly familyIds: readonly string[];
  readonly tags: readonly string[];
  readonly maturity: "proposed" | "approved" | "promoted";
  readonly playability: "playable" | "planned-only";
  readonly representationLabel?: string;
}): KpSemanticAnimationWorkbenchIndex["entries"][number] {
  return {
    schemaVersion: "kp.semantic-animation-workbench-index-entry.v1",
    identity: {
      schemaVersion: "kp.canonical-animation-identity.v1",
      animationId: input.animationId,
      title: input.title,
      aliases: input.aliases,
      familyIds: input.familyIds,
      provenance:
        input.playability === "playable"
          ? { kind: "catalog", descriptorId: `editor.${input.animationId}` }
          : { kind: "approved-plan", sourcePath: "plan.md" },
      availability:
        input.playability === "playable" ? "concrete" : "planned"
    },
    summary: input.title,
    tags: input.tags,
    representations:
      input.representationLabel === undefined
        ? []
        : [
            {
              schemaVersion:
                "kp.animation-representation-relationship.v1",
              id: `representation.${input.animationId}.card`,
              animationId: input.animationId,
              representationId: `sample.${input.animationId}`,
              kind: "card",
              label: input.representationLabel,
              playable: true
            }
          ],
    lifecycle: {
      schemaVersion: "kp.animation-lifecycle-facets.v1",
      roadmap: input.playability === "planned-only" ? "next" : "now",
      execution:
        input.playability === "planned-only" ? "not-scheduled" : "complete",
      maturity: input.maturity,
      approval: input.maturity === "proposed" ? "unapproved" : "approved",
      review: "unreviewed",
      verification: "unknown",
      playability: input.playability
    },
    controlIds: [],
    diagnostics: []
  };
}
