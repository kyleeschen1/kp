import type {
  KpExactQuantityOpaquePaintBinding
} from "../../src/animation/exact-fraction-quantity-paint-contract.ts";

const opaque: KpExactQuantityOpaquePaintBinding = {
  sourceSelectionIds: ["selection.before"],
  targetSelectionIds: ["selection.after"],
  atomicPartIds: ["part.unit-sixth.0"],
  lifecycle: "persist",
  paintOpacity: 1,
  ownership: "continuous-owned-paint"
};

void opaque;

const fading: KpExactQuantityOpaquePaintBinding = {
  sourceSelectionIds: ["selection.before"],
  targetSelectionIds: ["selection.after"],
  atomicPartIds: ["part.unit-sixth.0"],
  lifecycle: "persist",
  // @ts-expect-error Exact-quantity material has no fractional opacity state.
  paintOpacity: 0.5,
  ownership: "continuous-owned-paint"
};

void fading;

const novelLifecycle: KpExactQuantityOpaquePaintBinding = {
  sourceSelectionIds: ["selection.before"],
  targetSelectionIds: ["selection.after"],
  atomicPartIds: ["part.unit-sixth.0"],
  // @ts-expect-error Renderers cannot add a quantity-specific lifecycle.
  lifecycle: "crossfade",
  paintOpacity: 1,
  ownership: "atomic-exclusive-handoff"
};

void novelLifecycle;
