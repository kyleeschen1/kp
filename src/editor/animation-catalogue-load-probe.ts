import {
  loadKpAnimationAsset,
  type KpLoadedAnimationAsset
} from "../animation/catalog-loader.ts";
import {
  createKpAnimationCatalogueLoadFailure,
  type KpAnimationCatalogueLoadFailure
} from "./animation-catalogue-host-outcome.ts";
import {
  createKpAnimationCatalogueProjection,
  type KpAnimationCatalogueProjection
} from "./animation-catalogue-projection.ts";
import {
  readKpAnimationCatalogueRoute,
  writeKpAnimationCatalogueRoute
} from "./animation-catalogue-route.ts";
import {
  resolveKpAnimationCatalogueSelection
} from "./animation-catalogue-selection.ts";
import {
  createKpEditorAnimationLibrary
} from "./animation-library.ts";
import type {
  KpEditorAnimationDescriptor
} from "./animation-descriptor.ts";

export type KpAnimationCatalogueLoadProbeResult =
  | Readonly<{
      readonly schemaVersion: "kp.animation-catalogue-load-probe.v1";
      readonly kind: "animation-catalogue-load-probe";
      readonly status: "loaded";
      readonly animationId: string;
      readonly descriptorId: string;
      readonly packId: KpLoadedAnimationAsset["packId"];
      readonly route: string;
      readonly packAssetCount: number;
    }>
  | Readonly<{
      readonly schemaVersion: "kp.animation-catalogue-load-probe.v1";
      readonly kind: "animation-catalogue-load-probe";
      readonly status: "load-failure";
      readonly animationId: string;
      readonly descriptorId: string;
      readonly packId: KpLoadedAnimationAsset["packId"];
      readonly route: string;
      readonly outcome: KpAnimationCatalogueLoadFailure;
    }>;

export async function probeKpAnimationCatalogueLoads(input: {
  readonly projection?: KpAnimationCatalogueProjection | undefined;
  readonly descriptors?: readonly KpEditorAnimationDescriptor[] | undefined;
  readonly loadAsset?:
    ((animationId: string) => Promise<KpLoadedAnimationAsset>) | undefined;
} = {}): Promise<readonly KpAnimationCatalogueLoadProbeResult[]> {
  const projection = input.projection ??
    createKpAnimationCatalogueProjection();
  const descriptors = new Map(
    (input.descriptors ?? createKpEditorAnimationLibrary()).map(
      (descriptor) => [descriptor.id, descriptor]
    )
  );
  const loadAsset = input.loadAsset ?? loadKpAnimationAsset;

  return Object.freeze(await Promise.all(projection.entries.map(
    async (entry): Promise<KpAnimationCatalogueLoadProbeResult> => {
      const route = writeKpAnimationCatalogueRoute("", {
        artifactId: entry.animationId
      });
      try {
        const routeState = readKpAnimationCatalogueRoute(route);
        const selection = resolveKpAnimationCatalogueSelection({
          projection,
          artifactId: routeState.artifactId
        });
        if (
          selection.status !== "selected" ||
          selection.entry.animationId !== entry.animationId
        ) {
          throw new Error(
            `Catalogue route did not select ${entry.animationId}.`
          );
        }
        const descriptor = descriptors.get(entry.primaryDescriptorId);
        if (
          descriptor === undefined ||
          descriptor.animationId !== entry.animationId
        ) {
          throw new Error(
            `Catalogue row ${entry.animationId} is missing descriptor ` +
            `${entry.primaryDescriptorId}.`
          );
        }
        const loaded = await loadAsset(entry.animationId);
        if (
          loaded.animation.id !== entry.animationId ||
          loaded.packId !== entry.packId
        ) {
          throw new Error(
            `Loaded ${loaded.animation.id} from ${loaded.packId}; expected ` +
            `${entry.animationId} from ${entry.packId}.`
          );
        }
        return Object.freeze({
          schemaVersion: "kp.animation-catalogue-load-probe.v1" as const,
          kind: "animation-catalogue-load-probe" as const,
          status: "loaded" as const,
          animationId: entry.animationId,
          descriptorId: descriptor.id,
          packId: loaded.packId,
          route,
          packAssetCount: loaded.catalog.length
        });
      } catch (error: unknown) {
        return Object.freeze({
          schemaVersion: "kp.animation-catalogue-load-probe.v1" as const,
          kind: "animation-catalogue-load-probe" as const,
          status: "load-failure" as const,
          animationId: entry.animationId,
          descriptorId: entry.primaryDescriptorId,
          packId: entry.packId,
          route,
          outcome: createKpAnimationCatalogueLoadFailure({ entry, error })
        });
      }
    }
  )));
}
