import {
  acceptedGeneratedSubstitutionDraft
} from "./llm-animation-draft-examples.ts";
import {
  readKpVersionedLlmAnimationDraft,
  type KpLlmAnimationDraftV2
} from "./llm-animation-draft-v2.ts";
import {
  compileKpLlmAnimationDraftV2,
  type KpLlmAnimationDraftV2CompileResult
} from "./llm-animation-draft-v2-compiler.ts";
import {
  createKpCanonicalOperationProjectPins
} from "../semantic/canonical-operation-pack.ts";
import {
  resolveKpCanonicalOperation
} from "../semantic/canonical-operation-registry.ts";

export interface KpGeneratedSemanticProofExample {
  readonly id: string;
  readonly title: string;
  readonly editorAnimationId: string;
  readonly canonicalOperationId: "kp.core.wrap" | "kp.core.fan-out" | "kp.core.substitute";
  readonly operationPack: "kp.core@1.0.0";
  readonly visualMotif: "wrap" | "copy-fan-out" | "substitute";
}

export interface KpGeneratedSemanticProofCohort {
  readonly kind: "generated-semantic-proof-cohort";
  readonly id: "cohort.generated.semantic-animation.v1";
  readonly examples: readonly KpGeneratedSemanticProofExample[];
  readonly substitutionDraft: KpLlmAnimationDraftV2;
  readonly substitutionFingerprint: string;
  readonly intentionalInvalidDraft: KpLlmAnimationDraftV2;
  readonly intentionalInvalidFingerprint: string;
  readonly rejectedTypedGap: Extract<KpLlmAnimationDraftV2CompileResult, { readonly status: "repair-required" }>;
  readonly diagnostics: readonly string[];
}

const corePins = createKpCanonicalOperationProjectPins([
  { packId: "kp.core", version: "1.0.0" }
]);

const examples: readonly KpGeneratedSemanticProofExample[] = [
  {
    id: "proof.generated.wrap",
    title: "Wrap x with f(–)",
    editorAnimationId: "animation.generated.function-wrap.apply-f",
    canonicalOperationId: "kp.core.wrap",
    operationPack: "kp.core@1.0.0",
    visualMotif: "wrap"
  },
  {
    id: "proof.generated.distribution",
    title: "Distribute a across b + c",
    editorAnimationId: "animation.generated.distribution.expand-a-sum",
    canonicalOperationId: "kp.core.fan-out",
    operationPack: "kp.core@1.0.0",
    visualMotif: "copy-fan-out"
  },
  {
    id: "proof.generated.substitution",
    title: "Substitute 3 for x",
    editorAnimationId: "animation.generated.substitute-three",
    canonicalOperationId: "kp.core.substitute",
    operationPack: "kp.core@1.0.0",
    visualMotif: "substitute"
  }
];

export function createKpGeneratedSemanticProofCohort(): KpGeneratedSemanticProofCohort {
  // The cohort is an executable boundary check: no accepted example may name an
  // operation without resolving it through the exact project pack pins first.
  for (const example of examples) {
    const resolution = resolveKpCanonicalOperation({
      pins: corePins,
      operationId: example.canonicalOperationId
    });
    if (resolution.status !== "resolved") {
      throw new Error(`${example.id}: ${resolution.message}`);
    }
  }

  const substitutionDraft = createSubstitutionDraftV2();
  const substitution = requireAccepted(
    "generated substitution",
    compileKpLlmAnimationDraftV2(substitutionDraft)
  );
  const intentionalInvalidDraft = createIntentionalInvalidDraft(substitutionDraft);
  const intentionalInvalid = requireAccepted(
    "intentional invalid state",
    compileKpLlmAnimationDraftV2(intentionalInvalidDraft)
  );
  const unresolvedDraft = withOperationId(
    substitutionDraft,
    "model.proposed.teleport-value"
  );
  const rejectedTypedGap = compileKpLlmAnimationDraftV2(unresolvedDraft);
  if (rejectedTypedGap.status !== "repair-required") {
    throw new Error("An unresolved generated operation must produce a typed repair gap.");
  }

  return {
    kind: "generated-semantic-proof-cohort",
    id: "cohort.generated.semantic-animation.v1",
    examples: examples.map((example) => ({ ...example })),
    substitutionDraft,
    substitutionFingerprint: substitution.fingerprint,
    intentionalInvalidDraft,
    intentionalInvalidFingerprint: intentionalInvalid.fingerprint,
    rejectedTypedGap,
    diagnostics: [
      ...examples.map((example) =>
        `${example.title}: resolved ${example.canonicalOperationId} from ${example.operationPack}; editor asset ${example.editorAnimationId}.`
      ),
      "Intentional invalid state: accepted with invalid status and on-request disclosure.",
      ...rejectedTypedGap.diagnostics.map((diagnostic) =>
        `${diagnostic.path}: ${diagnostic.message} Repair with ${diagnostic.repair.allowedPatchKinds.join(" or ")}.`
      )
    ]
  };
}

function createSubstitutionDraftV2(): KpLlmAnimationDraftV2 {
  const migrated = readKpVersionedLlmAnimationDraft(
    acceptedGeneratedSubstitutionDraft
  );
  if (migrated.status !== "migrated-v1") {
    throw new Error("Generated substitution v1 draft must migrate before canonical compilation.");
  }
  const derivation = migrated.draft.derivations[0]!;
  return {
    ...migrated.draft,
    derivations: [{
      ...derivation,
      operations: [
        {
          id: "operation.generated.substitute-three",
          operationId: "kp.core.substitute",
          roleBindings: {
            value: ["generated.substitute-three.before.value"],
            replaced: ["generated.substitute-three.before.x"],
            replacement: ["generated.substitute-three.after.replacement"]
          },
          lineageBindings: [
            {
              relation: "role-change",
              sourceEntityIds: ["generated.substitute-three.before.value"],
              targetEntityIds: ["generated.substitute-three.after.replacement"]
            },
            {
              relation: "removal",
              sourceEntityIds: ["generated.substitute-three.before.x"],
              targetEntityIds: []
            }
          ],
          ownershipMode: "replacement",
          explanationDepth: "expanded"
        },
        persistentOperation("arrow"),
        persistentOperation("plus"),
        persistentOperation("two")
      ],
      epistemic: {
        ...derivation.epistemic,
        status: "valid",
        rationale: "The registered substitution binds the source value, replaced occupant, and replacement."
      }
    }],
    saliencePlan: {
      id: "salience.generated.substitute-three",
      kind: "animation-salience-plan",
      intents: [{
        id: "salience.generated.substitute-three.transmit",
        kind: "transmit",
        sourceEntityIds: ["generated.substitute-three.before.value"],
        targetEntityIds: ["generated.substitute-three.after.replacement"],
        summary: "Track the supplied value into the position occupied by x."
      }]
    }
  };
}

function persistentOperation(id: "arrow" | "plus" | "two") {
  return {
    id: `operation.generated.substitute-three.persist-${id}`,
    operationId: "kp.core.persist",
    roleBindings: {
      before: [`generated.substitute-three.before.${id}`],
      after: [`generated.substitute-three.after.${id}`]
    },
    lineageBindings: [{
      relation: "identity" as const,
      sourceEntityIds: [`generated.substitute-three.before.${id}`],
      targetEntityIds: [`generated.substitute-three.after.${id}`]
    }],
    ownershipMode: "continuant" as const,
    explanationDepth: "standard" as const
  };
}

function createIntentionalInvalidDraft(
  draft: KpLlmAnimationDraftV2
): KpLlmAnimationDraftV2 {
  const target = draft.states[1]!;
  const derivation = draft.derivations[0]!;
  return {
    ...draft,
    id: "animation.generated.intentional-invalid-substitution",
    title: "Generated: reveal an incorrect substitution on request",
    authoringContext: {
      ...draft.authoringContext,
      historicalReplayRequested: true
    },
    states: [draft.states[0]!, {
      ...target,
      title: "Intentionally incorrect learner proposal: replace x and 2 with 3",
      content: { latex: "3 \\Rightarrow 3 + 3" },
      epistemic: {
        ...target.epistemic,
        status: "invalid",
        rationale: "Only x is bound to 3; changing the constant 2 is an intentional misconception.",
        disclosure: { trigger: { kind: "on-request" }, announce: true }
      }
    }],
    derivations: [{
      ...derivation,
      epistemic: {
        ...derivation.epistemic,
        status: "invalid",
        rationale: "The transition preserves a deliberately incorrect learner state for later discussion.",
        disclosure: { trigger: { kind: "on-request" }, announce: true }
      }
    }]
  };
}

function withOperationId(
  draft: KpLlmAnimationDraftV2,
  operationId: string
): KpLlmAnimationDraftV2 {
  const derivation = draft.derivations[0]!;
  return {
    ...draft,
    derivations: [{
      ...derivation,
      operations: [{ ...derivation.operations[0]!, operationId }, ...derivation.operations.slice(1)]
    }]
  };
}

function requireAccepted(
  label: string,
  result: KpLlmAnimationDraftV2CompileResult
): Extract<KpLlmAnimationDraftV2CompileResult, { readonly status: "accepted" }> {
  if (result.status !== "accepted") {
    throw new Error(`${label} failed: ${result.diagnostics[0]?.message ?? "unknown diagnostic"}`);
  }
  return result;
}
