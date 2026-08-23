import assert from "node:assert/strict";
import test from "node:test";

import {
  sampleKpSemanticMotionChoreography
} from "../src/domain-ir/semantic-motion-choreography-compiler.ts";
import {
  kpCanonicalCompiledLogProductSemanticMotion,
  kpCanonicalLogProductSemanticMotionRequest
} from "../src/semantic/log-product-semantic-motion.ts";
import {
  sampleKpLogProductMaterialDepthChoreography
} from "../src/animation/log-product-material-depth-choreography.ts";
import {
  kpCanonicalLogProductMaterialLineage
} from "../src/animation/log-product-material-depth-lineage.ts";
import {
  kpCanonicalLogProductMaterialRoleBindings
} from "../src/animation/log-product-material-depth-bindings.ts";
import {
  compileKpLogProductFunctionWrapInvocationGroup,
  createKpLogProductSemanticMotionProjectionPolicy
} from "../src/rendering/log-product-transit-session.ts";
import {
  createKpFunctionWrapInvocationGroupReception
} from "../src/animation/function-wrap-invocation.ts";
import {
  kpCanonicalCompiledLogProductOperation
} from "../src/semantic/log-product-transformation-compiler.ts";

function sample(progress: number) {
  return sampleKpSemanticMotionChoreography({
    choreography: kpCanonicalCompiledLogProductSemanticMotion,
    progress,
    direction: "forward"
  });
}

test("source application activates cohesively during orient", () => {
  const orient = kpCanonicalCompiledLogProductSemanticMotion.tracks.find(
    ({ eventId }) => eventId === "event.log-product.orient"
  )!;
  const midpoint = (orient.window.start + orient.window.end) / 2;
  const poses = sampleKpLogProductMaterialDepthChoreography({
    mode: "material",
    choreography: sample(midpoint)
  });

  assert.ok(
    poses["role.material.log-product.source-application"].normalizedDepth > 0
  );
  assert.ok(
    poses["role.material.log-product.source-application"].activity > 0
  );
  assert.deepEqual(
    poses["role.material.log-product.persistent-factor"],
    { plane: "surface", normalizedDepth: 0, activity: 0 }
  );
  assert.deepEqual(
    poses["role.material.log-product.target-application-syntax"],
    { plane: "subsurface", normalizedDepth: -1, activity: 0 }
  );
});

test("source application holds activation until source release begins", () => {
  const orient = kpCanonicalCompiledLogProductSemanticMotion.tracks.find(
    ({ eventId }) => eventId === "event.log-product.orient"
  )!;
  const release = kpCanonicalCompiledLogProductSemanticMotion.tracks.find(
    ({ eventId }) => eventId === "event.log-product.release-shells"
  )!;
  const between = (orient.window.end + release.window.start) / 2;
  const poses = sampleKpLogProductMaterialDepthChoreography({
    mode: "material",
    choreography: sample(between)
  });
  assert.deepEqual(
    poses["role.material.log-product.source-application"],
    { plane: "active", normalizedDepth: 1, activity: 1 }
  );
});

test("flat and no-depth choreography remain exact surface rest", () => {
  for (const mode of ["flat", "no-depth"] as const) {
    const poses = sampleKpLogProductMaterialDepthChoreography({
      mode,
      choreography: sample(0.5)
    });
    assert.ok(Object.values(poses).every((pose) =>
      pose.plane === "surface" &&
      pose.normalizedDepth === 0 &&
      pose.activity === 0
    ));
  }
});

test("operator penetration withdraws source before generated syntax rises", () => {
  const sourceReleaseTracks = kpCanonicalCompiledLogProductSemanticMotion.tracks
    .filter(({ eventId }) => [
      "event.log-product.release-shells",
      "event.log-product.depart"
    ].includes(eventId));
  const targetReception = kpCanonicalCompiledLogProductSemanticMotion.tracks
    .find(({ eventId }) => eventId === "event.log-product.attach-target")!;
  const afterSourceRelease = Math.min(
    targetReception.window.start,
    Math.max(...sourceReleaseTracks.map(({ window }) => window.end))
  );
  const latent = sampleKpLogProductMaterialDepthChoreography({
    mode: "material",
    choreography: sample(afterSourceRelease)
  });
  assert.deepEqual(
    latent["role.material.log-product.source-application"],
    { plane: "subsurface", normalizedDepth: -1, activity: 0 }
  );
  assert.deepEqual(
    latent["role.material.log-product.target-application-syntax"],
    { plane: "subsurface", normalizedDepth: -1, activity: 0 }
  );

  const receptionMidpoint =
    (targetReception.window.start + targetReception.window.end) / 2;
  const receiving = sampleKpLogProductMaterialDepthChoreography({
    mode: "material",
    choreography: sample(receptionMidpoint)
  });
  assert.equal(
    receiving["role.material.log-product.source-application"].activity,
    0
  );
  assert.ok(
    receiving["role.material.log-product.target-application-syntax"]
      .activity > 0
  );

  const lineage = kpCanonicalLogProductMaterialLineage.applicationDerivation;
  assert.equal(lineage.sourceIdentityEffect, "withdraw-source");
  assert.equal(lineage.targetIdentityEffect, "generate-successor");
  assert.ok(lineage.generatedTargetApplicationEntityIds.every((id) =>
    id !== lineage.sourceApplicationEntityId
  ));
});

test("persistent factors keep the accepted direct corridor while source syntax clears", () => {
  const transfer = kpCanonicalCompiledLogProductSemanticMotion.tracks.find(
    ({ eventId }) => eventId === "event.log-product.arrive"
  )!;
  const sourceReleaseEnd = Math.max(
    ...kpCanonicalCompiledLogProductSemanticMotion.tracks
      .filter(({ eventId }) => [
        "event.log-product.release-shells",
        "event.log-product.depart"
      ].includes(eventId))
      .map(({ window }) => window.end)
  );
  const midpoint = (
    Math.max(transfer.window.start, sourceReleaseEnd) + transfer.window.end
  ) / 2;
  const poses = sampleKpLogProductMaterialDepthChoreography({
    mode: "material",
    choreography: sample(midpoint)
  });
  const factors = poses["role.material.log-product.persistent-factor"];
  const sourceRelation = poses["role.material.log-product.source-relation"];

  assert.equal(factors.plane, "active");
  assert.ok(factors.normalizedDepth > 0.8);
  assert.equal(factors.activity, factors.normalizedDepth);
  assert.ok(sourceRelation.normalizedDepth < factors.normalizedDepth);
  assert.ok(sourceRelation.activity < factors.activity);

  const factorBinding = kpCanonicalLogProductMaterialRoleBindings.find(
    ({ roleId }) => roleId === "role.material.log-product.persistent-factor"
  )!;
  const lineage = kpCanonicalLogProductMaterialLineage.factorContinuities;
  assert.deepEqual(
    new Set(factorBinding.entityIds),
    new Set(lineage.flatMap(({ sourceEntityId, targetEntityId }) => [
      sourceEntityId,
      targetEntityId
    ]))
  );

  const policy = createKpLogProductSemanticMotionProjectionPolicy(
    kpCanonicalCompiledLogProductOperation
  );
  for (const factor of kpCanonicalCompiledLogProductOperation.contract.family
    .factors) {
    assert.equal(
      policy.routeByCorrespondenceRecordId[
        `correspondence.log-product.${factor.name}-argument-continuity`
      ]?.variant,
      "direct"
    );
  }
});

test("material enclosure reception decorates the canonical function-wrap plan", () => {
  const group = compileKpLogProductFunctionWrapInvocationGroup(
    kpCanonicalCompiledLogProductOperation
  );
  const reception = createKpFunctionWrapInvocationGroupReception({
    group,
    direction: "forward"
  });
  const targetEnclosures = kpCanonicalLogProductMaterialRoleBindings.find(
    ({ roleId }) => roleId === "role.material.log-product.target-enclosure"
  )!;
  assert.equal(group.synchronization, "together");
  assert.equal(reception.synchronization, "all-enclosures-together");
  assert.deepEqual(
    new Set(targetEnclosures.entityIds),
    new Set(group.branches.flatMap(({ enclosureEntityRoles }) =>
      enclosureEntityRoles.map(({ entityId }) => entityId)
    ))
  );

  const attachment = kpCanonicalCompiledLogProductSemanticMotion.tracks.find(
    ({ eventId }) => eventId === "event.log-product.attach-target"
  )!;
  const poses = sampleKpLogProductMaterialDepthChoreography({
    mode: "material",
    choreography: sample(
      (attachment.window.start + attachment.window.end) / 2
    )
  });
  assert.deepEqual(
    poses["role.material.log-product.target-enclosure"],
    poses["role.material.log-product.target-application-syntax"]
  );
  assert.equal(
    poses["role.material.log-product.target-enclosure"].plane,
    "active"
  );
});

test("generated logarithms enclosures and connector rise as one reception cohort", () => {
  const attachment = kpCanonicalCompiledLogProductSemanticMotion.tracks.find(
    ({ eventId }) => eventId === "event.log-product.attach-target"
  )!;
  for (const fraction of [0.25, 0.5, 0.75]) {
    const progress = attachment.window.start +
      (attachment.window.end - attachment.window.start) * fraction;
    const poses = sampleKpLogProductMaterialDepthChoreography({
      mode: "material",
      choreography: sample(progress)
    });
    const enclosure = poses["role.material.log-product.target-enclosure"];
    assert.deepEqual(
      poses["role.material.log-product.target-application-syntax"],
      enclosure
    );
    assert.deepEqual(
      poses["role.material.log-product.target-relation"],
      enclosure
    );
  }

  const byRole = new Map(kpCanonicalLogProductMaterialRoleBindings.map(
    (binding) => [binding.roleId, binding] as const
  ));
  const semanticRoles = kpCanonicalCompiledLogProductOperation.contract.family;
  assert.deepEqual(
    new Set(byRole.get(
      "role.material.log-product.target-application-syntax"
    )!.entityIds),
    new Set(semanticRoles.factors.map(({ targetWrapperOccurrenceId }) =>
      `${targetWrapperOccurrenceId}.operator`
    ))
  );
  assert.deepEqual(
    new Set(byRole.get("role.material.log-product.target-relation")!
      .entityIds),
    new Set([
      ...kpCanonicalLogProductSemanticMotionRequest.operation
        .roleBindings["target-sum"]!,
      ...kpCanonicalLogProductSemanticMotionRequest.operation
        .roleBindings["connector"]!
    ])
  );
});

test("persistent factors bridge source withdrawal into target reception", () => {
  const sourceReleaseEnd = Math.max(
    ...kpCanonicalCompiledLogProductSemanticMotion.tracks
      .filter(({ eventId }) => [
        "event.log-product.release-shells",
        "event.log-product.depart"
      ].includes(eventId))
      .map(({ window }) => window.end)
  );
  const attachment = kpCanonicalCompiledLogProductSemanticMotion.tracks.find(
    ({ eventId }) => eventId === "event.log-product.attach-target"
  )!;
  const bridgeSamples = [
    sourceReleaseEnd,
    attachment.window.start,
    (attachment.window.start + attachment.window.end) / 2
  ];

  for (const progress of bridgeSamples) {
    const poses = sampleKpLogProductMaterialDepthChoreography({
      mode: "material",
      choreography: sample(progress)
    });
    const factors = poses["role.material.log-product.persistent-factor"];
    assert.equal(factors.plane, "active");
    assert.equal(factors.activity, 1);
  }

  const receiving = sampleKpLogProductMaterialDepthChoreography({
    mode: "material",
    choreography: sample(
      (attachment.window.start + attachment.window.end) / 2
    )
  });
  assert.equal(
    receiving["role.material.log-product.source-application"].activity,
    0
  );
  assert.ok(
    receiving["role.material.log-product.target-application-syntax"]
      .activity > 0
  );
});

test("all visible target material roles land before native ownership", () => {
  const settle = kpCanonicalCompiledLogProductSemanticMotion.tracks.find(
    ({ eventId }) => eventId === "event.log-product.settle"
  )!;
  const nativeReady = kpCanonicalCompiledLogProductSemanticMotion.tracks.find(
    ({ eventId }) => eventId === "event.log-product.native-target-ready"
  )!;
  assert.ok(settle.window.end <= nativeReady.window.start);

  const landedRoleIds = [
    "role.material.log-product.persistent-factor",
    "role.material.log-product.target-enclosure",
    "role.material.log-product.target-application-syntax",
    "role.material.log-product.target-relation"
  ] as const;

  for (const progress of [settle.window.end, nativeReady.window.start, 0.99]) {
    const poses = sampleKpLogProductMaterialDepthChoreography({
      mode: "material",
      choreography: sample(progress)
    });
    assert.ok(landedRoleIds.map((roleId) => poses[roleId]).every((pose) =>
      pose.plane === "surface" &&
      pose.normalizedDepth === 0 &&
      pose.activity === 0
    ));
  }
});
