import assert from "node:assert/strict";
import test from "node:test";

import {
  createRadicalArtifactHierarchyFixture,
  projectKpChoreographyHierarchyOwnership,
  validateKpChoreographyHierarchyPlan,
  type KpChoreographyHierarchyPlan
} from "../src/animation/choreography-hierarchy.ts";

const radical = createRadicalArtifactHierarchyFixture();

test("radical succession declares group, token, and temporary fragment layers", () => {
  assert.deepEqual(validateKpChoreographyHierarchyPlan(radical), []);
  assert.equal(
    radical.groups[0]?.cohesion.anchorTokenIds[0],
    "radical.rewrite-power-as-root.source.exponent"
  );
  assert.deepEqual(
    radical.fragments.map((fragment) => ({
      medium: fragment.medium,
      semanticAuthority: fragment.semanticAuthority,
      provenance: fragment.provenance.kind
    })),
    [
      {
        medium: "dom-clone",
        semanticAuthority: false,
        provenance: "temporary-render-fragment"
      },
      {
        medium: "dom-clone",
        semanticAuthority: false,
        provenance: "temporary-render-fragment"
      }
    ]
  );
});

test("temporary fragments own presentation only during the act phase", () => {
  const acting = projectKpChoreographyHierarchyOwnership(radical, "act");
  const settled = projectKpChoreographyHierarchyOwnership(radical, "settle");

  assert.deepEqual(acting.semanticAuthorityEntityIds,
    settled.semanticAuthorityEntityIds);
  assert.equal(acting.activeTemporaryFragmentIds.length, 2);
  assert.deepEqual(acting.nativePresentationTokenIds, []);
  assert.deepEqual(settled.activeTemporaryFragmentIds, []);
  assert.deepEqual(
    settled.nativePresentationTokenIds,
    radical.settlement.nativeTokenIds
  );
});

test("texture and mesh fragments retain token provenance without semantic authority", () => {
  const withGeneratedMedia: KpChoreographyHierarchyPlan = {
    ...structuredClone(radical),
    fragments: [
      {
        ...radical.fragments[0]!,
        medium: "texture-tile"
      },
      {
        ...radical.fragments[1]!,
        medium: "mesh-fragment"
      }
    ]
  };

  assert.deepEqual(validateKpChoreographyHierarchyPlan(withGeneratedMedia), []);
  assert.ok(
    withGeneratedMedia.fragments.every(
      (fragment) =>
        fragment.provenance.sourceTokenId === fragment.tokenId &&
        fragment.semanticAuthority === false
    )
  );
});

test("fragments are rejected when promoted to semantic authority", () => {
  const invalid = structuredClone(radical) as unknown as {
    fragments: Array<{ semanticAuthority: boolean }>;
  };
  invalid.fragments[0]!.semanticAuthority = true;

  assert.deepEqual(
    validateKpChoreographyHierarchyPlan(
      invalid as unknown as KpChoreographyHierarchyPlan
    ).filter((issue) => issue.path.endsWith("semanticAuthority")),
    [
      {
        path: "fragments[0].semanticAuthority",
        message: "Temporary render fragments cannot carry semantic authority."
      }
    ]
  );
});

test("cohesion anchors must be native tokens in their semantic group", () => {
  const invalid: KpChoreographyHierarchyPlan = {
    ...structuredClone(radical),
    groups: [
      {
        ...radical.groups[0]!,
        cohesion: {
          ...radical.groups[0]!.cohesion,
          anchorTokenIds: [radical.fragments[0]!.id]
        }
      }
    ]
  };

  assert.ok(
    validateKpChoreographyHierarchyPlan(invalid).some(
      (issue) =>
        issue.path === "groups[0].cohesion.anchorTokenIds[0]" &&
        issue.message.includes("Unknown token reference")
    )
  );
});

test("settlement restores every native token and disposes every fragment", () => {
  const missingFragment: KpChoreographyHierarchyPlan = {
    ...structuredClone(radical),
    settlement: {
      ...radical.settlement,
      disposedFragmentIds: [radical.fragments[0]!.id]
    }
  };
  const missingToken: KpChoreographyHierarchyPlan = {
    ...structuredClone(radical),
    settlement: {
      ...radical.settlement,
      nativeTokenIds: [radical.tokens[0]!.id]
    }
  };

  assert.ok(
    validateKpChoreographyHierarchyPlan(missingFragment).some(
      (issue) =>
        issue.path === "settlement.disposedFragmentIds" &&
        issue.message.includes("dispose every temporary")
    )
  );
  assert.ok(
    validateKpChoreographyHierarchyPlan(missingToken).some(
      (issue) =>
        issue.path === "settlement.nativeTokenIds" &&
        issue.message.includes("every choreography token")
    )
  );
});
