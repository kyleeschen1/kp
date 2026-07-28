import {
  isKpVerifiedCancellationPresentationAuthoring,
  type KpVerifiedCancellationPresentationAuthoring
} from "./cancellation-presentation-authoring.ts";
import {
  kpCoreOperationPresentationLawIds
} from "./operation-presentation-law-types.ts";
import {
  runKpOperationPresentationLaws
} from "./operation-presentation-laws.ts";
import type {
  KpVerifiedOperationPresentationPlan
} from "./operation-presentation-plan-types.ts";
import {
  validateAndMintKpOperationPresentationPlan
} from "./operation-presentation-plan-validator.ts";
import {
  createKpOperationPresentationBundle,
  createKpOperationPresentationGroup,
  createKpOperationPresentationRoles
} from "./operation-presentation-roles.ts";

export function compileKpCancellationOperationPresentationPlan(
  authoring: KpVerifiedCancellationPresentationAuthoring
): KpVerifiedOperationPresentationPlan {
  if (!isKpVerifiedCancellationPresentationAuthoring(authoring)) {
    throw new Error(
      "Cancellation plan compilation requires verified semantic authoring."
    );
  }
  const inverseBundle = (
    bundle: KpVerifiedCancellationPresentationAuthoring[
      "inverseBundles"
    ][number]
  ) =>
    createKpOperationPresentationBundle({
      id: bundle.id,
      role: "source-material",
      semanticEntityIds: bundle.selectorIds
    });
  const inverseBundles = [
    inverseBundle(authoring.inverseBundles[0]),
    inverseBundle(authoring.inverseBundles[1])
  ] as const;
  const catalystBundles = authoring.catalysts.map((bundle) =>
    createKpOperationPresentationBundle({
      id: bundle.id,
      role: "catalyst",
      semanticEntityIds: bundle.selectorIds
    })
  );
  const artifactBundles = authoring.artifacts.map((bundle) =>
    createKpOperationPresentationBundle({
      id: bundle.id,
      role: "artifact",
      semanticEntityIds: bundle.selectorIds
    })
  );
  const continuantBundles = authoring.survivors.map((survivor) =>
    createKpOperationPresentationBundle({
      id: survivor.id,
      role: "continuant",
      semanticEntityIds: unique([
        ...survivor.sourceSelectorIds,
        ...survivor.targetSelectorIds
      ])
    })
  );
  const contactGroup = createKpOperationPresentationGroup({
    id: `${authoring.id}.group.contact`,
    groupKind: "contact",
    bundleIds: inverseBundles.map(({ id }) => id)
  });
  const sourceSelectorIds = [
    ...authoring.inverseBundles.flatMap(({ selectorIds }) => selectorIds),
    ...authoring.catalysts.flatMap(({ selectorIds }) => selectorIds),
    ...authoring.artifacts.flatMap(({ selectorIds }) => selectorIds),
    ...authoring.survivors.flatMap(
      ({ sourceSelectorIds }) => sourceSelectorIds
    )
  ];
  const targetSelectorIds = authoring.survivors.flatMap(
    ({ targetSelectorIds }) => targetSelectorIds
  );
  const validation = validateAndMintKpOperationPresentationPlan({
    draft: {
      schemaVersion: "kp.verified-operation-presentation-plan.v1",
      id: `operation-presentation.${authoring.id}`,
      transformationId: authoring.transformationId,
      planKind: "inverse-cancellation",
      roles: createKpOperationPresentationRoles({
        bundles: [
          ...inverseBundles,
          ...catalystBundles,
          ...artifactBundles,
          ...continuantBundles
        ],
        groups: [contactGroup]
      }),
      contactGroupId: contactGroup.id,
      inverseBundleIds: [
        inverseBundles[0].id,
        inverseBundles[1].id
      ]
    },
    expectedSelectorIds: unique([
      ...sourceSelectorIds,
      ...targetSelectorIds
    ])
  });
  if (validation.status !== "verified") {
    throw new Error(
      validation.issues.map(({ path, message }) =>
        `${path}: ${message}`
      ).join("\n")
    );
  }
  const diagnostics = runKpOperationPresentationLaws({
    plan: validation.plan,
    lawIds: kpCoreOperationPresentationLawIds,
    context: {
      sourceSelectorIds,
      targetSelectorIds,
      scheduledGroupIds: [contactGroup.id],
      endpointSettlement: "native-source-and-target",
      rewind: "exact-semantic-inverse"
    }
  });
  if (diagnostics.length > 0) {
    throw new Error(
      diagnostics.map(({ lawId, message }) =>
        `${lawId}: ${message}`
      ).join("\n")
    );
  }
  return validation.plan;
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}
