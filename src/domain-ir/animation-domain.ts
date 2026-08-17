export const kpAnimationDomains = Object.freeze([
  "equation",
  "matrix",
  "code",
  "graph-2d",
  "graph-3d"
] as const);

export type KpAnimationDomain = (typeof kpAnimationDomains)[number];
