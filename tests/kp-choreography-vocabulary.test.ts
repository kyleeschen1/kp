import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpChoreographyVocabularyContract,
  type KpChoreographyVocabulary
} from "../src/animation/choreography-vocabulary.ts";

const radicalVocabulary: KpChoreographyVocabulary = {
  id: "choreography-vocabulary.radical-rewrite",
  continuants: [
    {
      id: "continuant.radical.x",
      meaning: "x remains the same value while changing from base to radicand.",
      relation: "role-change",
      source: {
        entityId: "expression.power.base.x",
        selectorIds: ["radical.rewrite-power-as-root.source.x"]
      },
      target: {
        entityId: "expression.radical.radicand.x",
        selectorIds: ["radical.rewrite-power-as-root.target.x"]
      },
      identityAuthority: {
        kind: "correspondence",
        transformationId: "transform.radical.rewrite-power-as-root",
        correspondenceRecordId:
          "radical.rewrite-power-as-root.role-change.base-to-radicand"
      }
    }
  ],
  representationalLineages: [
    {
      id: "lineage.radical.root-notation",
      meaning:
        "Fractional exponent and radical are successive notations for the root operation.",
      sourceRepresentation: {
        entityId: "representation.root.fractional-exponent",
        selectorIds: ["radical.rewrite-power-as-root.source.exponent"]
      },
      targetRepresentation: {
        entityId: "representation.root.radical",
        selectorIds: ["radical.rewrite-power-as-root.target.radical"]
      },
      cause: {
        kind: "canonical-operation",
        operationId: "kp.core.rewrite-power-as-root",
        bindingId: "binding.root-notation"
      }
    }
  ],
  objectConstancy: [
    {
      id: "object-constancy.radical.x",
      continuantId: "continuant.radical.x",
      mode: "ownership-handoff",
      preserveThrough: [
        "movement",
        "seek",
        "rewind",
        "renderer-handoff"
      ]
    }
  ],
  materialContinuity: [
    {
      id: "material-continuity.radical.root-notation",
      mode: "shared-reconciliation",
      sourceEntityIds: ["representation.root.fractional-exponent"],
      targetEntityIds: ["representation.root.radical"],
      authorityRef: {
        kind: "representational-lineage",
        lineageId: "lineage.radical.root-notation"
      },
      summary:
        "Exponent material collapses toward the region from which radical material unfolds."
    }
  ],
  motionClassifications: [
    {
      id: "motion.radical.x-reflow",
      entityIds: ["expression.power.base.x"],
      motionClass: "accommodation",
      reason: "x moves to reserve its radicand slot without changing value."
    },
    {
      id: "motion.radical.notation-transfer",
      entityIds: [
        "representation.root.fractional-exponent",
        "representation.root.radical"
      ],
      motionClass: "meaningful",
      reason: "The transfer communicates a change of notation."
    }
  ]
};

test("choreography vocabulary distinguishes continuants from representational lineage", () => {
  assert.deepEqual(checkKpChoreographyVocabularyContract(radicalVocabulary), {
    lawId: "animation.choreography-vocabulary",
    passed: true,
    failures: []
  });
  assert.equal(radicalVocabulary.continuants[0]?.relation, "role-change");
  assert.notEqual(
    radicalVocabulary.representationalLineages[0]?.sourceRepresentation.entityId,
    radicalVocabulary.representationalLineages[0]?.targetRepresentation.entityId
  );
});

test("continuant identity rejects glyph and DOM matching as authority", () => {
  const continuant = radicalVocabulary.continuants[0]!;
  const vocabulary: KpChoreographyVocabulary = {
    ...radicalVocabulary,
    continuants: [
      {
        ...continuant,
        identityAuthority: {
          kind: "glyph-match",
          glyph: "x"
        }
      } as unknown as typeof continuant
    ]
  };

  const result = checkKpChoreographyVocabularyContract(vocabulary);

  assert.equal(result.passed, false);
  assert.deepEqual(result.failures, [
    {
      path: "continuants[0].identityAuthority.kind",
      message:
        "Continuant identity must come from a canonical operation or explicit correspondence, never glyph, LaTeX, DOM, or geometry matching."
    }
  ]);
});

test("representational lineage cannot silently claim one entity is two representations", () => {
  const lineage = radicalVocabulary.representationalLineages[0]!;
  const vocabulary: KpChoreographyVocabulary = {
    ...radicalVocabulary,
    representationalLineages: [
      {
        ...lineage,
        targetRepresentation: {
          ...lineage.targetRepresentation,
          entityId: lineage.sourceRepresentation.entityId
        }
      }
    ]
  };

  const result = checkKpChoreographyVocabularyContract(vocabulary);

  assert.equal(result.passed, false);
  assert.deepEqual(result.failures, [
    {
      path: "representationalLineages[0]",
      message:
        "Representational lineage must connect distinct representations; use a semantic continuant for one entity."
    }
  ]);
});

test("object and material continuity require semantic authorities", () => {
  const vocabulary: KpChoreographyVocabulary = {
    ...radicalVocabulary,
    objectConstancy: [
      {
        ...radicalVocabulary.objectConstancy[0]!,
        continuantId: "continuant.missing"
      }
    ],
    materialContinuity: [
      {
        ...radicalVocabulary.materialContinuity[0]!,
        authorityRef: {
          kind: "representational-lineage",
          lineageId: "lineage.missing"
        }
      }
    ]
  };

  const result = checkKpChoreographyVocabularyContract(vocabulary);

  assert.equal(result.passed, false);
  assert.deepEqual(result.failures, [
    {
      path: "objectConstancy[0].continuantId",
      message: "Unknown semantic continuant continuant.missing."
    },
    {
      path: "materialContinuity[0].authorityRef.lineageId",
      message: "Unknown representational lineage lineage.missing."
    }
  ]);
});

test("motion classifications require named entities and a semantic reason", () => {
  const vocabulary: KpChoreographyVocabulary = {
    ...radicalVocabulary,
    motionClassifications: [
      ...radicalVocabulary.motionClassifications,
      {
        id: "motion.invalid",
        entityIds: [],
        motionClass: "meaningful",
        reason: ""
      }
    ]
  };

  const result = checkKpChoreographyVocabularyContract(vocabulary);

  assert.equal(result.passed, false);
  assert.deepEqual(result.failures.slice(-2), [
    {
      path: "motionClassifications[2].reason",
      message: "Expected non-empty text."
    },
    {
      path: "motionClassifications[2].entityIds",
      message: "Expected at least one entry."
    }
  ]);
});

test("runtime validation rejects unknown imported vocabulary classifications", () => {
  const classification = radicalVocabulary.motionClassifications[0]!;
  const vocabulary: KpChoreographyVocabulary = {
    ...radicalVocabulary,
    motionClassifications: [
      {
        ...classification,
        motionClass: "springy" as typeof classification.motionClass
      }
    ]
  };

  const result = checkKpChoreographyVocabularyContract(vocabulary);

  assert.equal(result.passed, false);
  assert.deepEqual(result.failures, [
    {
      path: "motionClassifications[0].motionClass",
      message: "Unknown choreography motion class springy."
    }
  ]);
});
