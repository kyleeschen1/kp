import {
  readKpAnimationCatalogueRoute
} from "../editor/animation-catalogue-route.ts";

type KpDevelopmentToolbarClient = typeof import(
  "../dev-toolbar/development-toolbar-bootstrap.ts"
);

const loadKpDevelopmentToolbar:
  | (() => Promise<KpDevelopmentToolbarClient>)
  | undefined = import.meta.env.DEV
    ? () => import("../dev-toolbar/development-toolbar-bootstrap.ts")
    : undefined;

export async function mountKpInternalStudio(input: {
  readonly root?: HTMLElement;
  readonly search?: string;
} = {}): Promise<() => void> {
  const root = input.root ?? document.querySelector<HTMLElement>("#app");
  if (root === null) throw new Error("Internal Studio requires an #app root.");
  const search = input.search ?? window.location.search;
  root.dataset["kpInternalStudioEntry"] = "mounted";
  const disposeToolbar = await mountDevelopmentToolbar();

  if (readKpAnimationCatalogueRoute(search).active) {
    const catalogue = await import(
      "../editor/svelte-catalogue/svelte-catalogue-exemplar-entry.ts"
    );
    const disposeCatalogue = await catalogue.mountKpSvelteCatalogueExemplar({
      root,
      search
    });
    return () => {
      disposeCatalogue();
      disposeToolbar();
    };
  }

  // The legacy Studio implementation remains the behavior authority while
  // this slice changes only its application entry and production graph.
  await import("../main.ts");
  return disposeToolbar;
}

async function mountDevelopmentToolbar(): Promise<() => void> {
  if (loadKpDevelopmentToolbar === undefined) return () => undefined;
  const client = await loadKpDevelopmentToolbar();
  return client.mountKpDevelopmentToolbar(window).dispose;
}

void mountKpInternalStudio().then((dispose) => {
  window.addEventListener("pagehide", dispose, { once: true });
});
