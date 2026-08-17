import "../../styles.css";
import "../animation-catalogue-shell.css";
import "katex/dist/katex.min.css";

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
import {
  prepareKpAnimationCatalogueChromeFonts
} from "../animation-catalogue-font-reservation.ts";
import { createKpEditorAnimationLibrary } from "../animation-library.ts";
import KpSvelteCatalogueExemplar from "./KpSvelteCatalogueExemplar.svelte";
import type {
  KpSvelteCatalogueHostState
} from "./svelte-catalogue-host-state.ts";

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
  const selectionPreparation =
    createKpAnimationCatalogueSelectionPreparationService({ descriptors });
  const selectionHost = Object.freeze({
    projection,
    prepare: selectionPreparation.prepare
  });
  const reviewHost = import.meta.env.DEV
    ? await import("../animation-catalogue-review-host.ts").then(
        ({ createKpAnimationCatalogueReviewHost }) =>
          createKpAnimationCatalogueReviewHost()
      )
    : undefined;
  const selection = resolveKpAnimationCatalogueSelection({
    projection,
    artifactId: route.artifactId
  });
  if (selection.status === "not-found") {
    return mountState(input.root, {
      status: "not-found",
      animationId: selection.requestedArtifactId
    });
  }
  await prepareKpAnimationCatalogueChromeFonts();
  let component: ReturnType<typeof mount> | undefined;
  component = mount(KpSvelteCatalogueExemplar, {
    target: input.root,
    props: {
      state: {
        status: "loading",
        animationId: selection.entry.animationId,
        title: selection.entry.title
      }
    }
  });
  input.root.dataset["kpSvelteCatalogueExemplar"] = "mounted";
  try {
    const prepared = await selectionPreparation.prepare({
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
    await unmount(component);
    component = mount(KpSvelteCatalogueExemplar, {
      target: input.root,
      props: {
        state: {
          status: "selected",
          view,
          animation: prepared.animation,
          hostability: prepared.hostability,
          selectionHost
        }
      }
    });
    void reviewHost?.mount();
  } catch (error: unknown) {
    const message = error instanceof Error
      ? error.message
      : "The selected catalogue asset failed to load.";
    if (component !== undefined) await unmount(component);
    component = mount(KpSvelteCatalogueExemplar, {
      target: input.root,
      props: {
        state: {
          status: "error",
          animationId: selection.entry.animationId,
          message
        }
      }
    });
  }

  return () => {
    reviewHost?.dispose();
    delete input.root.dataset["kpSvelteCatalogueExemplar"];
    if (component !== undefined) void unmount(component);
  };
}

function mountState(
  root: HTMLElement,
  state: KpSvelteCatalogueHostState
): () => void {
  const component = mount(KpSvelteCatalogueExemplar, {
    target: root,
    props: { state }
  });
  root.dataset["kpSvelteCatalogueExemplar"] = "mounted";
  return () => {
    delete root.dataset["kpSvelteCatalogueExemplar"];
    void unmount(component);
  };
}
