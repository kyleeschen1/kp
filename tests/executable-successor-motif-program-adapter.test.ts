import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  compileKpFissionFusionPlan
} from "../src/animation/fission-fusion.ts";
import {
  createKpFractionCompositionEquationAnimationAsset
} from "../src/animation/fraction-composition-equation-adapter.ts";
import {
  compileKpRegisteredSuccessorSynthesisPresentation
} from "../src/animation/successor-synthesis-presentation-plan.ts";
import {
  validateAndMintKpExecutableSuccessorMotifProgram
} from "../src/animation/motifs/executable-successor-motif-program-validator.ts";
import {
  createKpEquationSuccessorSynthesisBindings
} from "../src/rendering/equation-linear-rearrangement-bindings.ts";
import {
  compileKpExecutableSuccessorMotifProgramAdapter,
  isKpExecutableSuccessorMotifProgramRoute,
  resolveKpExecutableSuccessorMotifProgramRoute,
  type KpExecutableSuccessorMotifProgramAdapterInput
} from "../src/reader/renderers/executable-successor-motif-program-adapter.ts";
import {
  createKpSemanticLineageGraph
} from "../src/semantic/semantic-lineage-graph.ts";

const commonProgramFields = {
  schemaVersion: "kp.executable-successor-motif-program.v1",
  programVersion: "1.0.0",
  context: {
    policy: "preserve-unclaimed-context",
    role: "continuant-context"
  },
  accessibility: {
    narration: "semantic-phase-and-role-summary",
    reducedMotion: "native-checkpoints-with-phase-summary"
  },
  rewind: {
    policy: "exact-phase-reversal",
    restores: "source-roles-lineage-and-context"
  },
  continuity: {
    minimumVisibleInk: "motif-specific",
    intentionalVanish: "forbidden",
    endpointSettlement: "exact-native-source-and-target"
  }
} as const;

function operationInput() {
  const animation = createKpFractionCompositionEquationAnimationAsset();
  const transformation = animation.transformations.find(
    ({ transformType }) => transformType === "simplifyConstantProduct"
  )!;
  const binding = createKpEquationSuccessorSynthesisBindings({
    animation,
    transformation
  })[0]!;
  const compiled = compileKpRegisteredSuccessorSynthesisPresentation({
    transformationId: transformation.id,
    transformationKind: transformation.transformType,
    binding
  });
  assert.equal(compiled.status, "compiled");
  if (compiled.status !== "compiled") {
    throw new Error("Operation fixture did not compile.");
  }
  assert.equal(compiled.executableProgram.kind, "operation-evaluation");
  if (compiled.executableProgram.kind !== "operation-evaluation") {
    throw new Error("Operation fixture resolved the wrong program.");
  }
  return {
    kind: "operation-evaluation" as const,
    program: compiled.executableProgram,
    direction: "forward" as const,
    primitive: {
      kind: "native-katex-successor-synthesis" as const,
      intents: [{
        binding: {
          ...binding,
          operationPresentationPlan: compiled.operationPresentationPlan,
          paintContinuityPlan: compiled.paintContinuityPlan
        },
        direction: "forward" as const,
        motion: "full" as const
      }] as const
    }
  };
}

function identityFissionInput() {
  const minted = validateAndMintKpExecutableSuccessorMotifProgram({
    draft: {
      ...commonProgramFields,
      id: "kp.executable-program.identity-fission.test",
      kind: "identity-fission",
      allowedRoles: [
        "source-identity",
        "descendant-identity",
        "continuant-context"
      ],
      phases: [
        {
          id: "orient-source-identity",
          effect: "orient",
          requiredRoles: ["source-identity", "continuant-context"]
        },
        {
          id: "branch-identity",
          effect: "branch-identity",
          requiredRoles: ["source-identity", "descendant-identity"]
        },
        {
          id: "establish-descendants",
          effect: "establish-descendants",
          requiredRoles: ["descendant-identity"]
        },
        {
          id: "settle-descendants",
          effect: "settle",
          requiredRoles: ["descendant-identity", "continuant-context"]
        }
      ],
      lineage: {
        identity: "one-source-to-many-exact-descendants",
        descendantCardinality: "two-or-more",
        context: "identity-preserving"
      }
    }
  });
  assert.equal(minted.status, "verified");
  if (
    minted.status !== "verified" ||
    minted.program.kind !== "identity-fission"
  ) {
    throw new Error("Fission fixture did not mint.");
  }
  const plan = compileKpFissionFusionPlan({
    id: "motion.identity-fission.test",
    mode: "fission",
    lineageGraph: createKpSemanticLineageGraph({
      id: "lineage.identity-fission.test",
      sourceEntityIds: ["identity.origin"],
      targetEntityIds: ["identity.child-a", "identity.child-b"],
      edges: [{
        id: "edge.identity-fission.test",
        relation: "split",
        sourceEntityIds: ["identity.origin"],
        targetEntityIds: ["identity.child-a", "identity.child-b"],
        summary: "One exact identity establishes two descendants."
      }]
    })
  });
  if (plan.mode !== "fission") throw new Error("Expected fission plan.");
  return {
    kind: "identity-fission" as const,
    program: minted.program,
    direction: "forward" as const,
    primitive: {
      kind: "fission-fusion" as const,
      plan: plan as typeof plan & { readonly mode: "fission" }
    }
  };
}

function identityFusionInput() {
  const minted = validateAndMintKpExecutableSuccessorMotifProgram({
    draft: {
      ...commonProgramFields,
      id: "kp.executable-program.identity-fusion.test",
      kind: "identity-fusion",
      allowedRoles: [
        "contributor-identity",
        "result-identity",
        "continuant-context"
      ],
      phases: [
        {
          id: "orient-contributor-identities",
          effect: "orient",
          requiredRoles: ["contributor-identity", "continuant-context"]
        },
        {
          id: "gather-identities",
          effect: "gather-identities",
          requiredRoles: ["contributor-identity", "result-identity"]
        },
        {
          id: "establish-ancestor",
          effect: "establish-ancestor",
          requiredRoles: ["contributor-identity", "result-identity"]
        },
        {
          id: "settle-ancestor",
          effect: "settle",
          requiredRoles: ["result-identity", "continuant-context"]
        }
      ],
      lineage: {
        identity: "many-contributors-to-one-exact-ancestor",
        contributorCardinality: "two-or-more",
        context: "identity-preserving"
      }
    }
  });
  assert.equal(minted.status, "verified");
  if (
    minted.status !== "verified" ||
    minted.program.kind !== "identity-fusion"
  ) {
    throw new Error("Fusion fixture did not mint.");
  }
  const plan = compileKpFissionFusionPlan({
    id: "motion.identity-fusion.test",
    mode: "fusion",
    lineageGraph: createKpSemanticLineageGraph({
      id: "lineage.identity-fusion.test",
      sourceEntityIds: ["identity.child-a", "identity.child-b"],
      targetEntityIds: ["identity.origin"],
      edges: [{
        id: "edge.identity-fusion.test",
        relation: "merge",
        sourceEntityIds: ["identity.child-a", "identity.child-b"],
        targetEntityIds: ["identity.origin"],
        summary: "Two exact contributors establish one ancestor."
      }]
    })
  });
  if (plan.mode !== "fusion") throw new Error("Expected fusion plan.");
  return {
    kind: "identity-fusion" as const,
    program: minted.program,
    direction: "forward" as const,
    primitive: {
      kind: "fission-fusion" as const,
      plan: plan as typeof plan & { readonly mode: "fusion" }
    }
  };
}

test("one exhaustive adapter selects only existing compositor primitives", () => {
  const operationAdapterInput = operationInput();
  const operation = compileKpExecutableSuccessorMotifProgramAdapter(
    operationAdapterInput
  );
  const fission = compileKpExecutableSuccessorMotifProgramAdapter(
    identityFissionInput()
  );
  const fusion = compileKpExecutableSuccessorMotifProgramAdapter(
    identityFusionInput()
  );

  assert.equal(operation.primitive.kind, "native-katex-successor-synthesis");
  assert.equal(fission.primitive.kind, "fission-fusion");
  assert.equal(fusion.primitive.kind, "fission-fusion");
  assert.equal(fission.primitive.plan.mode, "fission");
  assert.equal(fusion.primitive.plan.mode, "fusion");
  assert.equal(
    operation.route,
    resolveKpExecutableSuccessorMotifProgramRoute(
      operationAdapterInput.program
    )
  );
  assert.equal(
    operation.route.primitiveRoute,
    "native-katex-successor-synthesis"
  );
  assert.equal(fission.route.primitiveRoute, "fission-fusion:fission");
  assert.equal(fusion.route.primitiveRoute, "fission-fusion:fusion");
  assert.equal(isKpExecutableSuccessorMotifProgramRoute(operation.route), true);
  assert.equal(
    isKpExecutableSuccessorMotifProgramRoute(
      JSON.parse(JSON.stringify(operation.route))
    ),
    false
  );
});

test("program identity and phase telemetry are deterministic and reversible", () => {
  const forward = compileKpExecutableSuccessorMotifProgramAdapter(
    operationInput()
  );
  const reverse = compileKpExecutableSuccessorMotifProgramAdapter({
    ...operationInput(),
    direction: "rewind",
    primitive: {
      ...operationInput().primitive,
      intents: [{
        ...operationInput().primitive.intents[0],
        direction: "rewind"
      }]
    }
  });

  assert.equal(forward.programId, "kp.executable-program.operation-evaluation");
  assert.equal(forward.programVersion, "1.0.0");
  assert.deepEqual(reverse.phaseOrder, [...forward.phaseOrder].reverse());
  assert.deepEqual(
    forward.samplePhaseTelemetry(0.42),
    forward.samplePhaseTelemetry(0.42)
  );
  assert.equal(
    forward.samplePhaseTelemetry(0.2).activePhaseId,
    reverse.samplePhaseTelemetry(0.8).activePhaseId
  );
  assert.equal(forward.samplePhaseTelemetry(0).progress, 0);
  assert.equal(forward.samplePhaseTelemetry(1).progress, 1);
});

test("variant and primitive mismatches fail before compositor work", () => {
  const fission = identityFissionInput();
  const fusion = identityFusionInput();
  assert.throws(
    () => compileKpExecutableSuccessorMotifProgramAdapter({
      ...fission,
      primitive: fusion.primitive
    } as unknown as KpExecutableSuccessorMotifProgramAdapterInput),
    /requires the existing fission primitive/
  );
  assert.throws(
    () => compileKpExecutableSuccessorMotifProgramAdapter({
      ...fission,
      kind: "identity-fusion"
    } as unknown as KpExecutableSuccessorMotifProgramAdapterInput),
    /matching minted authority/
  );
});

test("adapter exhaustiveness adds no renderer lifecycle or clock", async () => {
  const source = await readFile(
    "src/reader/renderers/executable-successor-motif-program-adapter.ts",
    "utf8"
  );
  const cases = [...source.matchAll(/case "([^"]+)"/g)]
    .map((match) => match[1])
    .sort();
  assert.deepEqual(cases, [
    "identity-fission",
    "identity-fission",
    "identity-fusion",
    "identity-fusion",
    "operation-evaluation",
    "operation-evaluation"
  ]);
  assert.match(source, /default:\s*[\s\S]*unreachableProgram/);
  for (const forbidden of [
    "createKpCanonicalNativeKatexSceneSession",
    "requestAnimationFrame",
    "setTimeout",
    "document.",
    "querySelector",
    "durationMs"
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});
