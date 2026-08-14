import {
  kpEigenvectorBeatIds,
  type KpEigenvectorBeatId
} from "./eigenvector-endpoints.ts";

export interface KpEigenvectorPassage {
  readonly beatId: KpEigenvectorBeatId;
  readonly heading: string;
  readonly text: string;
  readonly spokenText: string;
}

export const kpEigenvectorTranscript = [
  passage(
    "most-vectors-turn",
    "Most directions change",
    "Most vectors change direction under a linear transformation."
  ),
  passage(
    "watch-the-fan",
    "Watch the whole fan",
    "Under A, nearly every arrow turns as the plane transforms."
  ),
  passage(
    "one-direction-survives",
    "One direction survives",
    "This vector v stretches, but it does not rotate."
  ),
  passage(
    "geometry-becomes-equation",
    "Say what the picture shows",
    "The transformation sends v to three copies of itself: Av = 3v."
  ),
  passage(
    "name-the-scale-factor",
    "Name the behavior",
    "Call that scale factor λ. An eigenvector satisfies Av = λv."
  ),
  passage(
    "predict-a-multiple",
    "Predict before watching",
    "If A sends v to 3v, where must it send 2v?"
  ),
  passage(
    "verify-the-multiple",
    "Linearity answers",
    "A(2v) = 2Av = 6v, so the doubled vector keeps the same direction too."
  ),
  passage(
    "reveal-the-eigenspace",
    "Move along the line",
    "Every nonzero multiple of v is an eigenvector. Together with zero, they form the eigenspace span(v)."
  ),
  passage(
    "compressed-recall",
    "Keep the small machine",
    "The line survives. λ records what A does along it."
  )
] as const satisfies readonly KpEigenvectorPassage[];

export const kpEigenvectorSearchableText = kpEigenvectorTranscript
  .flatMap(({ heading, text }) => [heading, text])
  .join("\n");

export function findKpEigenvectorPassage(
  beatId: KpEigenvectorBeatId
): KpEigenvectorPassage {
  const passage = kpEigenvectorTranscript.find((candidate) =>
    candidate.beatId === beatId
  );
  if (passage === undefined) {
    throw new Error(`Missing eigenvector passage ${beatId}.`);
  }
  return passage;
}

export function checkKpEigenvectorTranscript(): readonly string[] {
  const issues: string[] = [];
  if (kpEigenvectorTranscript.length !== kpEigenvectorBeatIds.length) {
    issues.push("Transcript and beat counts differ.");
  }
  for (const [index, beatId] of kpEigenvectorBeatIds.entries()) {
    const passage = kpEigenvectorTranscript[index];
    if (passage?.beatId !== beatId) {
      issues.push(`Beat ${beatId} is missing or out of order.`);
    }
    if ((passage?.text.split(/\s+/).length ?? 0) > 24) {
      issues.push(`Beat ${beatId} exceeds the austere passage budget.`);
    }
  }
  return issues;
}

function passage(
  beatId: KpEigenvectorBeatId,
  heading: string,
  text: string
): KpEigenvectorPassage {
  return { beatId, heading, text, spokenText: `${heading}. ${text}` };
}
