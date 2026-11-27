export type ProjectionDraft = readonly [string, string, string, string];
export const coordinate = (text: string) => /^[+-]?\d+$/.test(text.trim()) && Math.abs(Number(text)) <= 1000;
