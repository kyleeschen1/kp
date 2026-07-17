import type { KpAnimationAsset } from "./asset.ts";

export interface KpEpistemicBranchRuntimeFrame {
  readonly branchId: string;
  readonly transitionId: string;
  readonly status: "provisional" | "committed" | "marked-invalid" | "retracted" | "historical-invalid";
  readonly trustedStateOpacity: number;
  readonly proposedStateOpacity: number;
  readonly targetSettlementProgress: number;
  readonly settlesAsValid: boolean;
  readonly cueStrength: number;
  readonly cue?: {
    readonly tone: "provisional" | "invalid" | "retracted";
    readonly label: string;
    readonly explanation: string;
  } | undefined;
}

export interface KpEpistemicBranchRuntime {
  readonly sample: (input: {
    readonly animation: KpAnimationAsset;
    readonly progress: number;
  }) => KpEpistemicBranchRuntimeFrame | undefined;
  readonly apply: (input: {
    readonly transitionElement: HTMLElement;
    readonly transitionId: string;
    readonly frame: KpEpistemicBranchRuntimeFrame | undefined;
  }) => void;
}

let runtime: KpEpistemicBranchRuntime | undefined;

export function registerKpEpistemicBranchRuntime(
  value: KpEpistemicBranchRuntime
): void {
  runtime = value;
}

export function sampleKpAnimationEpistemicBranch(input: {
  readonly animation: KpAnimationAsset;
  readonly progress: number;
}): KpEpistemicBranchRuntimeFrame | undefined {
  return runtime?.sample(input);
}

export function applyKpAnimationEpistemicBranch(input: {
  readonly transitionElement: HTMLElement;
  readonly transitionId: string;
  readonly frame: KpEpistemicBranchRuntimeFrame | undefined;
}): void {
  runtime?.apply(input);
}
