import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import { createKpEditorAnimationLibrary } from "../src/editor/animation-library.ts";
import { createKpEditorAnimationPlayerState } from "../src/editor/animation-player-state.ts";
import {
  createKpEditorAnimationSurfaceAdapterRegistry,
  type KpEditorAnimationSurfaceAdapter
} from "../src/editor/animation-surface-adapter-registry.ts";

function solveXState() {
  const catalog = createKpAnimationAssets();
  const descriptor = createKpEditorAnimationLibrary().find(
    (candidate) => candidate.animationId === "animation.linear-solve.solve-x"
  );
  const animation = catalog.find(
    (candidate) => candidate.id === descriptor?.animationId
  );

  assert.ok(descriptor);
  assert.ok(animation);
  return createKpEditorAnimationPlayerState({ descriptor, animation, catalog });
}

function adapter(
  id: string,
  priority: number,
  supports: KpEditorAnimationSurfaceAdapter["supports"] = () => true
): KpEditorAnimationSurfaceAdapter {
  return {
    id,
    slotKind: "equation",
    priority,
    supports,
    render() {}
  };
}

test("editor animation surface registry resolves the highest-priority compatible adapter", () => {
  const generic = adapter("adapter.equation.generic", 0);
  const solveX = adapter(
    "adapter.equation.solve-x",
    10,
    (state) => state.animationId === "animation.linear-solve.solve-x"
  );
  const registry = createKpEditorAnimationSurfaceAdapterRegistry([
    generic,
    solveX
  ]);

  assert.equal(registry.resolve("equation", solveXState())?.id, solveX.id);
  assert.equal(registry.resolve("graph", solveXState()), undefined);
  assert.deepEqual(registry.list().map((candidate) => candidate.id), [
    solveX.id,
    generic.id
  ]);
});

test("editor animation surface registry unregisters adapters and rejects duplicate ids", () => {
  const registry = createKpEditorAnimationSurfaceAdapterRegistry();
  const generic = adapter("adapter.equation.generic", 0);
  const unregister = registry.register(generic);

  assert.throws(() => registry.register(generic), /Duplicate editor animation surface adapter id/);
  unregister();
  assert.equal(registry.resolve("equation", solveXState()), undefined);
});
