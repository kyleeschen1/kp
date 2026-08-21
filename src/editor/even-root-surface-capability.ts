import "katex/dist/katex.min.css";
import "./root-rewrite-surface.css";

import {
  kpEditorEvenRootSurfaceAdapter
} from "./even-root-surface-adapter.ts";
import {
  kpEditorCompoundRootCarrierSurfaceAdapter
} from "./compound-root-carrier-surface-adapter.ts";
import type { KpEditorAnimationSurfaceAdapterRegistry } from
  "./animation-surface-adapter-registry.ts";

export function registerKpEditorEvenRootSurfaceCapability(
  registry: KpEditorAnimationSurfaceAdapterRegistry
): () => void {
  const unregister = [
    registry.register(kpEditorEvenRootSurfaceAdapter),
    registry.register(kpEditorCompoundRootCarrierSurfaceAdapter)
  ];
  return () => unregister.reverse().forEach((dispose) => dispose());
}
