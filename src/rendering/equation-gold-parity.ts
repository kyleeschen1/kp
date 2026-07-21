export type KpGoldEquationParityFrameId =
  | "start"
  | "subtraction-entry"
  | "subtraction-settled"
  | "cancellation-meet"
  | "zero-witness-dwell"
  | "cancellation-settled"
  | "successor-synthesis"
  | "final"
  | "reverse-cancellation";

export interface KpGoldEquationParityFrame {
  readonly id: KpGoldEquationParityFrameId;
  readonly direction: "forward" | "rewind";
  readonly progress: number;
  readonly progressPermille: number;
  readonly requiredEvidence: readonly KpGoldEquationParityEvidence[];
}

export type KpGoldEquationParityEvidence =
  | "stable-katex-typography"
  | "paired-subtraction-entry"
  | "persistent-token-reflow"
  | "witnessed-cancellation"
  | "independent-zero-witness"
  | "successor-synthesis"
  | "exact-native-handoff"
  | "exact-reverse-seek";

// These named instants are the review vocabulary shared by capture tooling,
// browser conformance, and the reader adapter. Keeping them renderer-neutral
// prevents either the editor or reader from becoming the parity authority.
export const kpGoldEquationParityFrames: readonly KpGoldEquationParityFrame[] = [
  frame("start", "forward", 0, ["stable-katex-typography", "exact-native-handoff"]),
  frame("subtraction-entry", "forward", 0.167, [
    "stable-katex-typography",
    "paired-subtraction-entry",
    "persistent-token-reflow"
  ]),
  frame("subtraction-settled", "forward", 0.333, [
    "stable-katex-typography",
    "paired-subtraction-entry",
    "exact-native-handoff"
  ]),
  frame("cancellation-meet", "forward", 0.5, [
    "stable-katex-typography",
    "witnessed-cancellation",
    "persistent-token-reflow"
  ]),
  frame("zero-witness-dwell", "forward", 0.62, [
    "stable-katex-typography",
    "witnessed-cancellation",
    "independent-zero-witness"
  ]),
  frame("cancellation-settled", "forward", 0.667, [
    "stable-katex-typography",
    "witnessed-cancellation",
    "exact-native-handoff"
  ]),
  frame("successor-synthesis", "forward", 0.833, [
    "stable-katex-typography",
    "successor-synthesis",
    "persistent-token-reflow"
  ]),
  frame("final", "forward", 1, [
    "stable-katex-typography",
    "successor-synthesis",
    "exact-native-handoff"
  ]),
  frame("reverse-cancellation", "rewind", 0.5, [
    "stable-katex-typography",
    "witnessed-cancellation",
    "exact-reverse-seek"
  ])
];

export function kpGoldEquationParityFrame(
  id: KpGoldEquationParityFrameId
): KpGoldEquationParityFrame {
  const result = kpGoldEquationParityFrames.find((candidate) => candidate.id === id);
  if (result === undefined) throw new Error(`Unknown gold equation parity frame ${id}.`);
  return result;
}

function frame(
  id: KpGoldEquationParityFrameId,
  direction: KpGoldEquationParityFrame["direction"],
  progress: number,
  requiredEvidence: readonly KpGoldEquationParityEvidence[]
): KpGoldEquationParityFrame {
  return { id, direction, progress, progressPermille: Math.round(progress * 1_000), requiredEvidence };
}
