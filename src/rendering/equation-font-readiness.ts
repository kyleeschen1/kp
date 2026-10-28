export type KpEquationFontInvalidationReason = "ready" | "loading-done";

export interface KpEquationFontReadiness {
  readonly status: "waiting" | "ready" | "unavailable";
  readonly revision: number;
  whenReady(): Promise<void>;
  subscribe(listener: (reason: KpEquationFontInvalidationReason) => void): () => void;
  dispose(): void;
}

export function createKpEquationFontReadiness(
  ownerDocument: Document,
  fontScope?: Element
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
  const onLoadingDone = (event: Event): void => {
    if (status !== 'ready' || affectsFontScope(event, fontScope)) publish("loading-done");
  };
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

/** A font event is evidence of stale metrics only for its consumers. Unknown
 * events and unusual family syntax remain conservative; never guess them away. */
function affectsFontScope(event: Event, scope: Element | undefined): boolean {
  if (!scope || !scope.isConnected || !('fontfaces' in event) || !Array.isArray(event.fontfaces)
    || event.fontfaces.length === 0) return true;
  const families = new Set<string>();
  const normalize = (family: string) => family.trim().replace(/^["']|["']$/g, '').toLowerCase();
  const faces: readonly unknown[] = event.fontfaces;
  for (const face of faces) {
    if (typeof face !== 'object' || face === null || !('family' in face) || typeof face.family !== 'string'
      || /[,\\]/.test(face.family)) return true;
    const family = normalize(face.family);
    if (!family) return true;
    families.add(family);
  }
  const view = scope.ownerDocument.defaultView;
  if (!view) return true;
  // Read current declarations only on font events, not every frame. This also
  // covers new font families introduced after the scope was first prepared.
  return [scope, ...scope.querySelectorAll('*')].some(element => {
    const family = view.getComputedStyle(element).fontFamily;
    return family.includes('\\') || family.split(',').some(value => families.has(normalize(value)));
  });
}
