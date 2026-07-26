import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  compileKpGovernedCanonicalConstruction,
  createKpGovernedCanonicalConstructionCohort,
  findKpForbiddenPresentationAuthority,
  kpGovernedCanonicalConstructionCohortPolicy
} from "../src/authoring/public-api.ts";
import {
  compileKpNativeKatexHierarchicalScenePlan,
  compileKpNativeKatexSceneTracks,
  createKpNativeKatexRendererSession,
  projectKpNativeKatexSemanticPaintRelations,
  reconcileKpNativeKatexScenes
} from "../src/rendering/native-katex-scene-compositor.ts";
import {
  createKpNativeKatexRenderedSceneObservation,
  type KpNativeKatexPaintAtomObservation
} from "../src/rendering/native-katex-rendered-scene.ts";

const ownerDocument = {};
const stage = { ownerDocument } as HTMLElement;
const sourceRoot = { ownerDocument } as HTMLElement;
const targetRoot = { ownerDocument } as HTMLElement;

test("governed variation cohort has one request and compiler contract", () => {
  const cohort = createKpGovernedCanonicalConstructionCohort();
  const policy = kpGovernedCanonicalConstructionCohortPolicy;

  assert.deepEqual(cohort.map(({ id }) => id), [
    "fraction-split-merge",
    "exponent-absorption",
    "radical-succession"
  ]);
  assert.ok(cohort.every(({ request }) =>
    request.schemaVersion === policy.requestSchemaVersion
  ));
  assert.ok(cohort.every(({ compilation }) =>
    compilation.kind === policy.compilationKind &&
    compilation.construction.kind === policy.constructionKind
  ));
  for (const member of cohort) {
    assert.deepEqual(
      compileKpGovernedCanonicalConstruction({
        request: member.request,
        authority: member.authority
      }),
      member.compilation
    );
  }
  assert.deepEqual(
    cohort.flatMap(({ compilation }) =>
      compilation.construction.operations.map(
        ({ transformationId }) => transformationId
      )
    ),
    [
      "transform.fraction-variation-three-y-nine-thirds.split-sum",
      "transform.fraction-variation-three-y-nine-thirds.merge-sum",
      "transform.generated.exponent.square-as-product.unwrap-unit-exponent",
      "transform.generated.radical.square-root-as-power.rewrite-power-as-root"
    ]
  );
});

test("governed variation cohort reaches one renderer session contract", () => {
  const cohort = createKpGovernedCanonicalConstructionCohort();
  const sessionKinds = cohort.flatMap(({ compilation }) =>
    compilation.construction.operations.map((operation) => {
      const relations = projectKpNativeKatexSemanticPaintRelations({
        groups: operation.lineage.map((lineage) => ({
          id: lineage.id,
          kind: lineageKind(
            lineage.sourceEntityIds.length,
            lineage.targetEntityIds.length
          ),
          sourceEntityIds: lineage.sourceEntityIds,
          targetEntityIds: lineage.targetEntityIds
        }))
      });
      const source = scene(
        "source",
        unique(operation.lineage.flatMap(
          ({ sourceEntityIds }) => sourceEntityIds
        ))
      );
      const target = scene(
        "target",
        unique(operation.lineage.flatMap(
          ({ targetEntityIds }) => targetEntityIds
        ))
      );
      const reconciliation = reconcileKpNativeKatexScenes({
        source,
        target,
        relations
      });
      const tracks = compileKpNativeKatexSceneTracks(
        compileKpNativeKatexHierarchicalScenePlan(reconciliation)
      );
      const session = createKpNativeKatexRendererSession({
        stage,
        sourceRoot,
        targetRoot,
        reconciliation,
        tracks
      });
      const sample = session.sample(0.41);
      session.sample(0.86);

      assert.deepEqual(session.sample(0.41), sample);
      assert.ok(session.sample(0).every(finiteFrame));
      assert.ok(session.sample(1).every(finiteFrame));
      return session.kind;
    })
  );

  assert.equal(sessionKinds.length, 4);
  assert.ok(sessionKinds.every((kind) =>
    kind === kpGovernedCanonicalConstructionCohortPolicy.rendererSessionKind
  ));
});

test("providers retain no presentation authority in cohort payloads", () => {
  const cohort = createKpGovernedCanonicalConstructionCohort();

  for (const { request, compilation } of cohort) {
    assert.deepEqual(findKpForbiddenPresentationAuthority(request), []);
    assert.deepEqual(
      findKpForbiddenPresentationAuthority(compilation.construction),
      []
    );
  }
});

test("governed variation cohort stays within source and payload ceilings",
  async () => {
    const policy = kpGovernedCanonicalConstructionCohortPolicy;
    const sources = await Promise.all(policy.fixtureSourceFiles.map(
      async (path) => ({
        path,
        source: await readFile(path, "utf8")
      })
    ));
    const sourceBytes = sources.reduce(
      (total, { source }) => total + Buffer.byteLength(source),
      0
    );

    assert.equal(sources.length, policy.maximumFixtureModules);
    assert.ok(sourceBytes <= policy.maximumFixtureSourceBytes);
    for (const { path, source } of sources) {
      assert.equal(
        (source.match(/compileKpGovernedCanonicalConstruction\(\{/g) ?? [])
          .length,
        1,
        `${path} must call the one governed trace compiler exactly once.`
      );
    }

    const payloadBytes = createKpGovernedCanonicalConstructionCohort().map(
      ({ request, compilation }) =>
        Buffer.byteLength(JSON.stringify({ request, compilation }))
    );
    assert.ok(payloadBytes.every(
      (bytes) => bytes <= policy.maximumMemberPayloadBytes
    ));
    assert.ok(
      payloadBytes.reduce((total, bytes) => total + bytes, 0) <=
        policy.maximumCohortPayloadBytes
    );
  });

function scene(
  endpoint: "source" | "target",
  semanticEntityIds: readonly string[]
) {
  const root = endpoint === "source" ? sourceRoot : targetRoot;
  const atoms = semanticEntityIds.map((semanticEntityId, index) => {
    const atom: KpNativeKatexPaintAtomObservation = {
      kind: "native-katex-paint-atom-observation",
      lifecycle: "renderer-session",
      id: `atom.${endpoint}.${index}`,
      endpoint,
      semanticEntityId,
      presentationGroupId: `group.${endpoint}.${index}`,
      paintKind: "glyph",
      visualKey: "glyph:governed-cohort",
      sourceElement: { ownerDocument } as HTMLElement,
      rect: {
        left: (endpoint === "source" ? 10 : 90) + index * 18,
        top: 20,
        width: 12,
        height: 24
      },
      styleFingerprint: "font:KaTeX_Main",
      zOrder: index,
      fontRevision: 1
    };
    return atom;
  });
  return createKpNativeKatexRenderedSceneObservation({
    endpoint,
    stage,
    root,
    atoms,
    groups: atoms.map((atom) => ({
      id: atom.presentationGroupId,
      semanticEntityId: atom.semanticEntityId,
      atomIds: [atom.id],
      rect: atom.rect
    })),
    fontRevision: 1,
    viewportKey: "governed-cohort"
  });
}

function lineageKind(
  sourceCount: number,
  targetCount: number
):
  | "one-to-one"
  | "many-to-one"
  | "one-to-many"
  | "introduction"
  | "removal" {
  if (sourceCount === 0) return "introduction";
  if (targetCount === 0) return "removal";
  if (sourceCount > 1 && targetCount === 1) return "many-to-one";
  if (sourceCount === 1 && targetCount > 1) return "one-to-many";
  return "one-to-one";
}

function finiteFrame(frame: {
  readonly rect: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  };
  readonly opacity: number;
}): boolean {
  return [
    frame.rect.left,
    frame.rect.top,
    frame.rect.width,
    frame.rect.height,
    frame.opacity
  ].every(Number.isFinite);
}

function unique<T>(values: readonly T[]): readonly T[] {
  return [...new Set(values)];
}
