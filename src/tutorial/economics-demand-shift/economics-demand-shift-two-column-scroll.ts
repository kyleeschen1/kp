import type {
  KpEconomicsDemandShiftLessonPassage,
  KpEconomicsDemandShiftPassageRole
} from "./economics-demand-shift-lesson-compiler.ts";
import {
  renderKpEconomicsDemandShiftInlineMarkdown
} from "./economics-demand-shift-lesson-compiler.ts";
import type {
  KpEconomicsMotionBlockId
} from "./economics-demand-shift-motion-blocks.ts";

export const kpEconomicsTwoColumnCards:
  readonly KpEconomicsDemandShiftLessonPassage[] = Object.freeze([
    card({
      id: "graph-at-rest",
      role: "regular",
      sourceText:
        "Begin with the graph at rest. Price, $P$, is vertical and quantity, $Q$, is horizontal. The blue supply schedule, $S$, rises while the red demand schedule, $D_0$, falls. Their shared point is the initial market-clearing state, $E_0=(6,8)$."
    }),
    card({
      id: "follow-shift",
      role: "transition",
      motionBlockId: "demand-shift",
      sourceText:
        "Now suppose strawberries become more desirable while supply remains fixed. Watch the red demand curve and the intersection it determines with blue $S$. As this paragraph approaches the top, demand shifts from $D_0$ to $D_1$, and equilibrium follows the changing intersection."
    }),
    card({
      id: "new-equilibrium",
      role: "interpretation",
      sourceText:
        "The completed shift carries the intersection up and to the right. At the old price of $8$, quantity demanded now exceeds quantity supplied. A higher price reduces quantity demanded along $D_1$ and increases quantity supplied along unchanged $S$, until the market clears at $E_1=(8,10)$."
    }),
    card({
      id: "shift-versus-movement",
      role: "transition",
      motionBlockId: "supply-movement",
      sourceText:
        "Hold the completed graph in view and look now at the blue supply curve. Its relationship is still $P=2+Q$; it did not shift when demand changed. As this paragraph approaches the top, the trace moves from $E_0$ to $E_1$ along that same curve. This is movement along supply, not a shift of supply."
    })
  ]);

function card(input: {
  readonly id: string;
  readonly role: KpEconomicsDemandShiftPassageRole;
  readonly motionBlockId?: KpEconomicsMotionBlockId | undefined;
  readonly sourceText: string;
}): KpEconomicsDemandShiftLessonPassage {
  return Object.freeze({
    id: input.id,
    role: input.role,
    ...(input.motionBlockId === undefined
      ? {}
      : { motionBlockId: input.motionBlockId }),
    paragraphs: Object.freeze([Object.freeze({
      sourceText: input.sourceText,
      html: renderKpEconomicsDemandShiftInlineMarkdown(input.sourceText)
    })])
  });
}
