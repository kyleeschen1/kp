import {
  generatedConceptCatalog,
  type GeneratedConceptCatalogEntry
} from "../content/public-api.ts";

const conceptCatalog: readonly GeneratedConceptCatalogEntry[] = generatedConceptCatalog;

async function bootstrap(): Promise<void> {
  const root = document.querySelector<HTMLElement>("#app");
  if (root === null) throw new Error("Expected #app root element to exist.");
  const entry = conceptCatalog.find((candidate) =>
    candidate.canonicalPath === window.location.pathname ||
    candidate.legacyAliases.includes(window.location.pathname)
  );
  if (entry === undefined) {
    await import("./main.ts");
    return;
  }

  const { tryMountConceptRoomRoute } = await import("./app-adapters/concept-room-shell.ts");
  const handle = await tryMountConceptRoomRoute({ root, catalog: conceptCatalog });
  if (handle === null) {
    await import("./main.ts");
    return;
  }
  window.addEventListener("pagehide", () => handle.dispose(), { once: true });
}

void bootstrap();
