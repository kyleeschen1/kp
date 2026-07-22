import type { KpReaderEquationIdentityMode } from "../document/public-api.ts";

export interface KpReaderEquationIdentityWitnessProjection {
  readonly state: "omitted" | "waiting" | "held" | "settled";
  readonly latex?: "0" | "1" | undefined;
  readonly opacity: 0 | 1;
  readonly readable: boolean;
}

/**
 * Identity display is atomic: Explain holds a certified witness once readable,
 * while Standard and Fluent never leak a partial-opacity witness.
 */
export function projectKpReaderEquationIdentityWitness(input: {
  readonly mode: KpReaderEquationIdentityMode;
  readonly witness?: {
    readonly latex: "0" | "1";
    readonly readable: boolean;
    readonly ready: boolean;
    readonly progress: number;
  } | undefined;
}): KpReaderEquationIdentityWitnessProjection {
  if (input.mode === "omit-transient-v1") {
    return { state: "omitted", opacity: 0, readable: false };
  }
  if (input.witness === undefined || !input.witness.readable || !input.witness.ready) {
    return { state: "waiting", opacity: 0, readable: false };
  }
  if (input.witness.progress >= 1) {
    return { state: "settled", opacity: 0, readable: false };
  }
  return {
    state: "held",
    latex: input.witness.latex,
    opacity: 1,
    readable: true
  };
}
