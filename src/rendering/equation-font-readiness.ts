export type KpEquationFontInvalidationReason = "ready" | "loading-done";

export interface KpEquationFontReadiness {
  readonly status: "waiting" | "ready" | "unavailable";
  readonly revision: number;
  whenReady(): Promise<void>;
  subscribe(listener: (reason: KpEquationFontInvalidationReason) => void): () => void;
  dispose(): void;
}

export function createKpEquationFontReadiness(
  ownerDocument: Document
): KpEquationFontReadiness {
  const fonts = ownerDocument.fonts;
  const listeners = new Set<(reason: KpEquationFontInvalidationReason) => void>();
  let disposed = false;
  let status: KpEquationFontReadiness["status"] = fonts === undefined
    ? "unavailable"
    : fonts.status === "loaded" ? "ready" : "waiting";
  let revision = 0;

  const publish = (reason: KpEquationFontInvalidationReason): void => {
    if (disposed) return;
    status = "ready";
    revision += 1;
    for (const listener of listeners) listener(reason);
  };
  const onLoadingDone = (): void => publish("loading-done");
  fonts?.addEventListener("loadingdone", onLoadingDone);
  const ready = fonts === undefined
    ? Promise.resolve()
    : fonts.ready.then(() => {
        if (status !== "ready") publish("ready");
      });

  return {
    get status() { return status; },
    get revision() { return revision; },
    whenReady() { return ready; },
    subscribe(listener) {
      if (disposed) throw new Error("Equation font readiness is disposed.");
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      fonts?.removeEventListener("loadingdone", onLoadingDone);
      listeners.clear();
    }
  };
}
