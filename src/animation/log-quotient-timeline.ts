export interface KpLogQuotientFrame {
  readonly requestedProgress: number;
  readonly semanticProgress: number;
  readonly direction: "forward" | "rewind";
  readonly reducedMotion: boolean;
  readonly complete: boolean;
}

export function sampleKpLogQuotientFrame(input: {
  readonly progress: number;
  readonly direction?: "forward" | "rewind" | undefined;
  readonly reducedMotion?: boolean | undefined;
}): KpLogQuotientFrame {
  const requestedProgress = bounded(input.progress);
  const direction = input.direction ?? "forward";
  const directed = direction === "forward"
    ? requestedProgress
    : 1 - requestedProgress;
  const semanticProgress = input.reducedMotion === true
    ? (directed >= 0.5 ? 1 : 0)
    : directed;
  return Object.freeze({
    requestedProgress,
    semanticProgress: rounded(semanticProgress),
    direction,
    reducedMotion: input.reducedMotion === true,
    complete: semanticProgress >= 1
  });
}

function bounded(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Log-quotient timeline progress must be finite.");
  }
  return Math.max(0, Math.min(1, value));
}

function rounded(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
