/** View-local ownership transfer, not a global renderer cache. Taking removes
 * the idle owner before it can become active; eviction always disposes it. */
export function createDerivationScenePool<T extends {
  element: Pick<HTMLElement, 'hidden' | 'remove' | 'removeAttribute'>; session: { dispose(): void }; cacheKey: string
}>(capacity: number) {
  if (!Number.isInteger(capacity) || capacity < 1) throw new Error('Invalid scene pool capacity');
  const idle = new Map<string, T>();
  let closed = false;
  let revision = 0;
  const dispose = (scene: T) => { scene.session.dispose(); scene.element.remove(); };
  const clear = () => { revision++; for (const scene of idle.values()) dispose(scene); idle.clear(); };
  return {
    // Shared across disclosure views, unlike a mount-local font event count.
    // Late paint leases keep their old key after native geometry invalidates.
    get revision() { return revision; },
    take(key: string) { const scene = idle.get(key); idle.delete(key); return scene; },
    put(scene: T) {
      // A paint lease can return after the page's main owner has retired.
      if (closed) { dispose(scene); return; }
      const previous = idle.get(scene.cacheKey);
      if (previous === scene) throw new Error('Scene ownership was already returned');
      if (previous) dispose(previous);
      scene.element.hidden = true; scene.element.removeAttribute('data-derivation-stage'); scene.element.remove();
      idle.set(scene.cacheKey, scene);
      while (idle.size > capacity) { const first = idle.entries().next().value!; idle.delete(first[0]); dispose(first[1]); }
    },
    clear,
    close() { closed = true; clear(); }
  };
}
