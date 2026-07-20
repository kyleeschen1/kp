export type KpReaderFocusSource = "story" | "url" | "pointer" | "keyboard";

export interface KpReaderFocusSnapshot {
  readonly activeSource?: KpReaderFocusSource | undefined;
  readonly objectRefs: readonly string[];
  readonly revision: number;
}

export type KpReaderFocusListener = (snapshot: KpReaderFocusSnapshot) => void;

export interface KpReaderSemanticFocusService {
  getSnapshot(): KpReaderFocusSnapshot;
  set(source: KpReaderFocusSource, objectRefs: readonly string[]): void;
  clear(source: KpReaderFocusSource): void;
  subscribe(listener: KpReaderFocusListener): () => void;
  dispose(): void;
}

const precedence: readonly KpReaderFocusSource[] = [
  "keyboard",
  "pointer",
  "url",
  "story"
];

export function createKpReaderSemanticFocusService(
  allowedObjectRefs: readonly string[]
): KpReaderSemanticFocusService {
  const allowed = new Set(allowedObjectRefs);
  const layers = new Map<KpReaderFocusSource, readonly string[]>();
  const listeners = new Set<KpReaderFocusListener>();
  let disposed = false;
  let revision = 0;
  let snapshot: KpReaderFocusSnapshot = { objectRefs: [], revision };
  const requireActive = (): void => {
    if (disposed) throw new Error("reader semantic focus service is disposed");
  };
  const publish = (): void => {
    revision += 1;
    const activeSource = precedence.find((source) => (layers.get(source)?.length ?? 0) > 0);
    snapshot = activeSource === undefined
      ? { objectRefs: [], revision }
      : { activeSource, objectRefs: [...layers.get(activeSource)!], revision };
    listeners.forEach((listener) => listener(snapshot));
  };
  return {
    getSnapshot() {
      return snapshot;
    },
    set(source, objectRefs) {
      requireActive();
      const refs = [...new Set(objectRefs.map((ref) => ref.trim()))];
      for (const ref of refs) {
        if (ref === "" || !allowed.has(ref)) throw new Error(`unknown semantic focus ref ${ref}`);
      }
      if (refs.length === 0) layers.delete(source);
      else layers.set(source, refs);
      publish();
    },
    clear(source) {
      requireActive();
      layers.delete(source);
      publish();
    },
    subscribe(listener) {
      requireActive();
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose() {
      disposed = true;
      layers.clear();
      listeners.clear();
    }
  };
}
