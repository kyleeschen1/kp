import assert from "node:assert/strict";
import test from "node:test";

import { createKpSemanticStateSupplyTaxFamilyAuthoring } from
  "../src/experiments/typed-linear-supply-demand/semantic-state-supply-tax-family.ts";
import {
  declareKpSemanticStateComposition,
  declareKpSemanticStateCompositionGroup,
  declareKpSemanticStateCompositionIndependent,
  declareKpSemanticStateCompositionMember,
  declareKpSemanticStateCompositionSequence,
  type KpSemanticStateCompositionDeclaration,
  type KpSemanticStateCompositionNodeDeclaration
} from "../src/semantic-state/state-family-composition-declaration.ts";
import {
  validateKpSemanticStateComposition,
  type KpSemanticStateCompositionDiagnosticCode,
  type KpSemanticStateCompositionValidationError
} from "../src/semantic-state/state-family-composition-validation.ts";

function fixture() {
  const family = createKpSemanticStateSupplyTaxFamilyAuthoring();
  const prepared = (name: string) => family.family.prepareApplication({
    applicationId: name,
    parameters: { finalTaxAmount: { numerator: "2", denominator: "1" } },
    sourceId: `test.application.${name}`
  });
  const member = (name: string) => declareKpSemanticStateCompositionMember({
    name,
    sourceId: `test.member.${name}`,
    application: prepared(name)
  });
  return { family, prepared, member };
}

test("whole-tree validation closes valid nested source and family authority", () => {
  const { family, member } = fixture();
  const declaration = declareKpSemanticStateComposition({
    namespace: family.compiled.namespace,
    localId: "market-policy",
    sourceId: "test.composition.market-policy",
    root: declareKpSemanticStateCompositionSequence({
      name: "timeline",
      sourceId: "test.timeline",
      members: [
        declareKpSemanticStateCompositionGroup({
          name: "market",
          sourceId: "test.market",
          body: declareKpSemanticStateCompositionIndependent({
            name: "policy",
            sourceId: "test.policy",
            evidence: { id: "disjoint", sourceId: "test.evidence.disjoint" },
            members: [member("tax"), member("demand")]
          })
        }),
        member("settle")
      ]
    })
  });
  const validated = validateKpSemanticStateComposition({
    identities: family.compiled.identityScope,
    declaration,
    definitions: [family.family.declaration]
  });

  assert.equal(validated.id, family.compiled.identityScope.composition("market-policy"));
  assert.equal(validated.memberCount, 3);
  assert.equal(new Set(validated.scopePaths).size, validated.scopePaths.length);
  assert.equal(
    validated.scopePaths.some((path) => path.includes("timeline.market.policy")),
    true
  );
  assert.equal(Object.isFrozen(validated), true);
  assert.equal(Object.isFrozen(validated.scopePaths), true);
});

test("duplicate scope and application identities are diagnosed together", () => {
  const { family, prepared } = fixture();
  const application = prepared("tax");
  const repeated = () => declareKpSemanticStateCompositionMember({
    name: "tax",
    sourceId: "test.member.tax",
    application
  });
  const declaration = declareKpSemanticStateComposition({
    namespace: family.compiled.namespace,
    localId: "duplicates",
    sourceId: "test.duplicates",
    root: declareKpSemanticStateCompositionSequence({
      name: "timeline",
      sourceId: "test.timeline",
      members: [repeated(), repeated()]
    })
  });

  assert.deepEqual(captureCodes(() => validateKpSemanticStateComposition({
    identities: family.compiled.identityScope,
    declaration,
    definitions: [family.family.declaration]
  })), ["duplicate-scoped-name", "duplicate-application-identity"]);
});

test("foreign schemas unknown definitions and transition-plan drift fail", () => {
  const { family, member } = fixture();
  const original = member("tax");
  const unknown = {
    ...original,
    application: {
      ...original.application,
      definitionId: family.compiled.identityScope.transformation("unknown")
    }
  } as typeof original;
  const foreignPlan = {
    ...original,
    name: "foreign",
    application: {
      ...original.application,
      applicationId: "foreign",
      transformationId: family.compiled.identityScope.appliedTransformation(
        original.application.definitionId,
        "foreign"
      ),
      transitionPlan: {
        ...original.application.transitionPlan,
        namespace: "economics.foreign"
      }
    }
  } as typeof original;
  const declaration = declareKpSemanticStateComposition({
    namespace: family.compiled.namespace,
    localId: "invalid-families",
    sourceId: "test.invalid-families",
    root: declareKpSemanticStateCompositionSequence({
      name: "timeline",
      sourceId: "test.timeline",
      members: [unknown, foreignPlan]
    })
  });

  assert.deepEqual(captureCodes(() => validateKpSemanticStateComposition({
    identities: family.compiled.identityScope,
    declaration,
    definitions: [family.family.declaration]
  })), [
    "unknown-family-definition",
    "foreign-family-schema",
    "family-definition-mismatch"
  ]);
});

test("reconstructed cycles and missing source metadata fail before exposure", () => {
  const { family, member } = fixture();
  const cyclic = {
    schemaVersion: "kp.semantic-state-composition-node.v1",
    kind: "group",
    name: "cycle",
    sourceId: "test.cycle"
  } as unknown as {
    schemaVersion: "kp.semantic-state-composition-node.v1";
    kind: "group";
    name: string;
    sourceId: string;
    body: KpSemanticStateCompositionNodeDeclaration;
  };
  cyclic.body = cyclic;
  const declaration = {
    schemaVersion: "kp.semantic-state-composition-declaration.v1",
    kind: "semantic-state-composition-declaration",
    namespace: family.compiled.namespace,
    localId: "reconstructed",
    sourceId: "",
    root: cyclic
  } as KpSemanticStateCompositionDeclaration;

  assert.deepEqual(captureCodes(() => validateKpSemanticStateComposition({
    identities: family.compiled.identityScope,
    declaration,
    definitions: [family.family.declaration]
  })), ["missing-source-metadata", "recursive-composition"]);

  const missingMemberSource = {
    ...member("tax"),
    sourceId: ""
  } as KpSemanticStateCompositionNodeDeclaration;
  assert.deepEqual(captureCodes(() => validateKpSemanticStateComposition({
    identities: family.compiled.identityScope,
    declaration: {
      ...declaration,
      sourceId: "test.reconstructed",
      root: missingMemberSource
    },
    definitions: [family.family.declaration]
  })), ["missing-source-metadata"]);
});

function captureCodes(run: () => unknown):
  readonly KpSemanticStateCompositionDiagnosticCode[] {
  try {
    run();
  } catch (error) {
    return (error as KpSemanticStateCompositionValidationError).diagnostics
      .map(({ code }) => code);
  }
  throw new Error("Expected structural composition diagnostics.");
}
