export type CompositionDraft = readonly [string, string, string, string, string, string, string, string];
/** Data admission stays independent of solvers and renderer imports. */
export const coordinate = (text: string) => text.length <= 12 && /^[+-]?\d+$/.test(text.trim()) && Math.abs(Number(text)) <= 5;
