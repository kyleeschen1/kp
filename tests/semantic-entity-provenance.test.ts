import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpSemanticDisplayFragment,
  createKpSemanticEntity,
  createKpSemanticEntityRegistry,
  listKpSemanticEntityFragments
} from "../src/semantic/semantic-entity-provenance.ts";

const expression = createKpSemanticEntity({
  id: "entity.expression.distribution",
  semanticKind: "expression",
  label: "a(b + c)",
  provenance: {
    kind: "parsed",
    sourceId: "source.lesson.latex",
    sourceKind: "latex",
    startOffset: 4,
    endOffset: 12,
    revisionId: "revision.3"
  }
});

const factor = createKpSemanticEntity({
  id: "entity.factor.a",
  semanticKind: "factor",
  label: "a",
  parentId: expression.id,
  provenance: {
    kind: "parsed",
    sourceId: "source.lesson.latex",
    sourceKind: "latex",
    startOffset: 4,
    endOffset: 5
  }
});

test("hierarchical semantic entities retain parsed source spans independently of display", () => {
  const registry = createKpSemanticEntityRegistry({
    entities: [expression, factor],
    displayFragments: [
      createKpSemanticDisplayFragment({
        id: "fragment.factor.source",
        semanticEntityId: factor.id,
        fragmentRole: "primary",
        ordinal: 0
      }),
      createKpSemanticDisplayFragment({
        id: "fragment.factor.distributed-copy",
        semanticEntityId: factor.id,
        fragmentRole: "copy",
        ordinal: 1
      })
    ]
  });

  assert.equal(registry.entities[1]?.parentId, expression.id);
  assert.equal(registry.entities[1]?.provenance.kind, "parsed");
  assert.deepEqual(
    listKpSemanticEntityFragments(registry, factor.id).map((fragment) => fragment.fragmentRole),
    ["primary", "copy"]
  );
});

test("inferred, authored, and pedagogical entities name their actual origins", () => {
  const inferred = createKpSemanticEntity({
    id: "entity.inferred.product",
    semanticKind: "product",
    label: "ab",
    provenance: {
      kind: "inferred",
      sourceEntityIds: [factor.id],
      methodId: "kp.algebra.distribute-multiplication"
    }
  });
  const authored = createKpSemanticEntity({
    id: "entity.authored.note",
    semanticKind: "annotation",
    label: "Distribute the factor",
    provenance: {
      kind: "authored",
      sourceId: "draft.lesson.12",
      authorId: "author.teacher"
    }
  });
  const pedagogical = createKpSemanticEntity({
    id: "entity.pedagogical.ghost-copy",
    semanticKind: "explanatory-copy",
    label: "a",
    provenance: {
      kind: "pedagogical",
      sourceEntityIds: [factor.id],
      rationale: "Make fan-out lineage visible before each product settles."
    }
  });
  const registry = createKpSemanticEntityRegistry({
    entities: [expression, factor, inferred, authored, pedagogical]
  });

  assert.deepEqual(
    registry.entities.slice(2).map((entity) => entity.provenance.kind),
    ["inferred", "authored", "pedagogical"]
  );
});

test("the registry rejects rendered-fragment authority and broken hierarchy", () => {
  assert.throws(() => createKpSemanticEntityRegistry({
    entities: [expression],
    displayFragments: [createKpSemanticDisplayFragment({
      id: "fragment.orphan",
      semanticEntityId: "entity.missing",
      fragmentRole: "primary",
      ordinal: 0
    })]
  }), /references missing entity/);

  const child = createKpSemanticEntity({
    id: "entity.child",
    semanticKind: "term",
    label: "x",
    parentId: "entity.missing-parent",
    provenance: { kind: "authored", sourceId: "draft.local" }
  });
  assert.throws(() => createKpSemanticEntityRegistry({ entities: [child] }), /missing parent/);
});

test("parsed and inferred provenance require inspectable source evidence", () => {
  assert.throws(() => createKpSemanticEntity({
    id: "entity.empty-span",
    semanticKind: "term",
    label: "x",
    provenance: {
      kind: "parsed",
      sourceId: "source.latex",
      sourceKind: "latex",
      startOffset: 2,
      endOffset: 2
    }
  }), /non-empty source span/);
  assert.throws(() => createKpSemanticEntity({
    id: "entity.unsourced-inference",
    semanticKind: "term",
    label: "x",
    provenance: {
      kind: "inferred",
      sourceEntityIds: [],
      methodId: "derive.x"
    }
  }), /requires source entities/);
});
