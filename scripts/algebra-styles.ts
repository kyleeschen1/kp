// Preview HTML and immutable editions must use the same ordered stylesheet
// owners as the browser entries. The ownership test checks those static imports.
export const authoredCardStyle = "experiments/authored-focus-card.css";
export const authoredEquationCardStyles = [authoredCardStyle, "rendering/authored-algebra-card.css"] as const;
export const reasoningCardStyle = "reader/presentation/reasoning-card.css";
export const reasoningCardStyles = [...authoredEquationCardStyles, reasoningCardStyle] as const;
export const commonFactorReadingStyle = "reader/presentation/common-factor-reading.css";
export const composedAlgebraReadingStyle = "reader/presentation/composed-algebra-reading.css";
export const commonFactorCardStyles = [...reasoningCardStyles, commonFactorReadingStyle] as const;
export const composedAlgebraCardStyles = [...commonFactorCardStyles, composedAlgebraReadingStyle] as const;
