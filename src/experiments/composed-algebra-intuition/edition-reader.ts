import { compile } from "../../authoring/algebra/compile.ts";
import { mountComposedAlgebraCardV2 } from "../composed-algebra/card.ts";
import { composedAlgebraSequenceV2 } from "../composed-algebra/sequence.ts";
import { algebraEditionHash, readAlgebraEditionLocation } from "./edition-location.ts";

const root = document.querySelector<HTMLElement>("[data-algebra-edition]");
if (root) void enhance(root);

async function enhance(root: HTMLElement) {
  const output = root.querySelector<HTMLElement>("[data-composed-error]")!;
  const display = root.querySelector<HTMLElement>("[data-composed-reader]")!;
  let disposed = false, restoring = false, locationValid = false;
  let surface: Awaited<ReturnType<typeof mountComposedAlgebraCardV2>> | undefined;
  let unsubscribe: (() => void) | undefined;
  let restore = () => {};
  const dispose = () => {
    if (disposed) return;
    disposed = true; unsubscribe?.(); surface?.dispose();
    window.removeEventListener("hashchange", restore);
    window.removeEventListener("pagehide", pagehide);
    root.dataset["composedStatus"] = "disposed";
  };
  const pagehide = (event: PageTransitionEvent) => {
    if (event.persisted) { surface?.cancel(); surface?.clock.pause(); } else dispose();
  };
  // Register before asynchronous native preparation: a departing page must not
  // acquire a live clock or listeners when preparation eventually resolves.
  window.addEventListener("pagehide", pagehide);
  try {
    const encoded = root.querySelector("[data-composed-initial-source]")?.textContent;
    if (!encoded) throw new Error("Missing embedded source. Read the complete verified explanation below.");
    const draft = compile(JSON.parse(encoded));
    if (root.dataset["algebraEdition"] !== draft.revisionId) throw new Error("Embedded source does not match this edition revision.");
    const sequence = composedAlgebraSequenceV2(draft);
    surface = await mountComposedAlgebraCardV2(display, draft);
    if (disposed) { surface.dispose(); return; }
    const active = surface;
    restore = () => {
      const result = readAlgebraEditionLocation(location.hash, draft.revisionId, sequence.checkpoints.last);
      locationValid = result.status === "ready";
      output.hidden = locationValid;
      output.textContent = result.status === "repair-gap" ? result.message : "";
      restoring = true;
      try { active.cancel(); active.clock.pause(); active.clock.seek(sequence.checkpoints.progressAt(result.status === "ready" ? result.step : 0)); }
      finally { restoring = false; }
    };
    restore();
    unsubscribe = active.clock.subscribe(() => {
      // Preserve an invalid incoming link for diagnosis until corrected. The
      // reader may still be explored; it never substitutes another source.
      if (disposed || restoring || !locationValid) return;
      const step = sequence.checkpoints.positionAt(active.clock.getSnapshot().progress);
      const url = new URL(location.href); url.hash = algebraEditionHash(draft.revisionId, step);
      if (url.href !== location.href) history.replaceState(history.state, "", url);
    });
    window.addEventListener("hashchange", restore);
    root.dataset["composedRevision"] = draft.revisionId;
    root.dataset["composedStatus"] = "ready";
    import.meta.hot?.dispose(dispose);
  } catch (error) {
    const departed = disposed;
    dispose();
    if (departed || !root.isConnected) return;
    root.dataset["composedStatus"] = "repair-gap";
    display.hidden = true;
    output.hidden = false; output.textContent = error instanceof Error ? error.message : String(error);
  }
}
