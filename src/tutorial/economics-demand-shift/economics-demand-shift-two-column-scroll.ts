import type {
  KpEconomicsDemandShiftLessonPassage,
  KpEconomicsDemandShiftPassageRole
} from "./economics-demand-shift-lesson-compiler.ts";
import {
  renderKpEconomicsDemandShiftInlineMarkdown
} from "./economics-demand-shift-inline-markdown.ts";
import type {
  KpEconomicsMotionBlockId
} from "./economics-demand-shift-motion-blocks.ts";

export const kpEconomicsTwoColumnParagraphs:
  readonly KpEconomicsDemandShiftLessonPassage[] = Object.freeze([
    card({
      id: "graph-at-rest",
      role: "regular",
      sourceText:
        "Begin with the graph at rest. Price, [$P$](kp-ref:price-axis-inline), is vertical and quantity, $Q$, is horizontal. The blue supply schedule, $S$, rises while the red demand schedule, $D_0$, falls."
    }),
    card({
      id: "initial-equilibrium",
      role: "interpretation",
      sourceText:
        "The two schedules meet at $E_0=(6,8)$. This point is equilibrium because buyers and sellers choose the same quantity at the same price."
    }),
    card({
      id: "follow-shift",
      role: "transition",
      motionBlockId: "demand-shift",
      sourceText:
        "Hold blue $S$ fixed. Follow red demand and its intersection with supply as $D_0$ shifts to $D_1$."
    }),
    card({
      id: "new-equilibrium",
      role: "interpretation",
      sourceText:
        "The curves now meet at $E_1=(8,10)$, above and to the right of $E_0$. Both equilibrium price and equilibrium quantity are higher."
    }),
    card({
      id: "shift-versus-movement",
      role: "transition",
      motionBlockId: "supply-movement",
      sourceText:
        "Now ignore red demand and watch blue $S$. Follow the trace from $E_0$ to $E_1$ without changing the curve itself."
    }),
    card({
      id: "movement-along-supply",
      role: "interpretation",
      sourceText:
        "Sellers supply more because the higher clearing price selects a new point on unchanged $S$. Quantity supplied moved; the supply curve did not shift."
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
