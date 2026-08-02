import "../../styles.css";

import { mount, unmount } from "svelte";

import {
  createKpAnimationCatalogueSelectedHostViewModel
} from "../animation-catalogue-host-view-model.ts";
import {
  createKpAnimationCatalogueProjection
} from "../animation-catalogue-projection.ts";
import {
  readKpAnimationCatalogueRoute
} from "../animation-catalogue-route.ts";
import {
  resolveKpAnimationCatalogueSelection
} from "../animation-catalogue-selection.ts";
import {
  createKpAnimationCatalogueSelectionPreparationService
} from "../animation-catalogue-selection-preparation.ts";
import { createKpEditorAnimationLibrary } from "../animation-library.ts";
import KpSvelteCatalogueExemplar from "./KpSvelteCatalogueExemplar.svelte";

export async function mountKpSvelteCatalogueExemplar(input: {
  readonly root: HTMLElement;
  readonly search: string;
}): Promise<() => void> {
  const route = readKpAnimationCatalogueRoute(input.search);
  if (!route.active) {
    throw new Error("Svelte catalogue exemplar requires an active catalogue route.");
  }
  const descriptors = createKpEditorAnimationLibrary();
  const projection = createKpAnimationCatalogueProjection({ descriptors });
  const selection = resolveKpAnimationCatalogueSelection({
    projection,
    artifactId: route.artifactId
  });
  if (selection.status === "not-found") {
    throw new Error(
      `Svelte catalogue exemplar cannot find ${selection.requestedArtifactId}.`
    );
  }
  const prepared = await createKpAnimationCatalogueSelectionPreparationService({
    descriptors
  }).prepare({
    entry: selection.entry,
    search: input.search,
    playhead: route.playhead
  });
  const view = createKpAnimationCatalogueSelectedHostViewModel({
    entry: selection.entry,
    health: prepared.health,
    entries: projection.entries,
    descriptor: prepared.descriptor,
    player: prepared.player,
    economicsParameters: prepared.economicsParameters,
    physicsParameters: prepared.physicsParameters,
    readerCompanion: prepared.readerCompanion
  });
  const component = mount(KpSvelteCatalogueExemplar, {
    target: input.root,
    props: { view }
  });
  input.root.dataset["kpSvelteCatalogueExemplar"] = "mounted";

  return () => {
    delete input.root.dataset["kpSvelteCatalogueExemplar"];
    void unmount(component);
  };
}
