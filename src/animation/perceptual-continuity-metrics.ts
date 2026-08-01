export const kpPerceptualContinuityEndpointMetrics = Object.freeze([
  "paint-geometry",
  "computed-style",
  "font",
  "baseline",
  "inner-paint",
  "structural-rule",
  "silhouette"
] as const);

export type KpPerceptualContinuityEndpointMetric =
  typeof kpPerceptualContinuityEndpointMetrics[number];
