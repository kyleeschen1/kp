import {
  renderKpEconomicsDemandShiftInlineMarkdown
} from "./economics-demand-shift-lesson-compiler.ts";

export interface KpEconomicsTwoColumnCue {
  readonly passageId: string;
  readonly sourceText: string;
  readonly html: string;
}

const cueSourceByPassage = Object.freeze({
  "follow-shift":
    "Watch the red demand curve. As this card rises, $D_0$ shifts to $D_1$ while $S$ stays fixed.",
  "new-equilibrium":
    "The intersection finishes up and to the right at $E_1=(8,10)$.",
  "shift-versus-movement":
    "Now watch blue $S$. The trace moves from $E_0$ to $E_1$ along the unchanged supply curve."
} satisfies Readonly<Record<string, string>>);

export const kpEconomicsTwoColumnCues: readonly KpEconomicsTwoColumnCue[] =
  Object.freeze(Object.entries(cueSourceByPassage).map(
    ([passageId, sourceText]) => Object.freeze({
      passageId,
      sourceText,
      html: renderKpEconomicsDemandShiftInlineMarkdown(sourceText)
    })
  ));

export function findKpEconomicsTwoColumnCue(
  passageId: string
): KpEconomicsTwoColumnCue | undefined {
  return kpEconomicsTwoColumnCues.find((cue) => cue.passageId === passageId);
}
