import type { KpSuccessorSynthesisBinding } from "../animation/successor-synthesis.ts";

declare const kpExactFractionLegacySuccessorAuthority: unique symbol;

/** The nominal binding is shared without importing the publication projection. */
export type KpExactOpaqueSuccessorSynthesisBinding =
  KpSuccessorSynthesisBinding & {
    readonly motif: "successor-synthesis";
    readonly [kpExactFractionLegacySuccessorAuthority]: true;
  };
