import type {
  KpLinearEquationFrame,
  KpLinearEquationOperation,
  KpLinearEquationTrace
} from "../../domains/public-api.ts";

export interface KpLinearEquationSample {
  readonly frame: KpLinearEquationFrame;
  readonly frameIndex: number;
  readonly enteringOperation: KpLinearEquationOperation | undefined;
}

export function sampleLinearEquationTrace(
  trace: KpLinearEquationTrace,
  progressPermille: number
): KpLinearEquationSample {
  if (!Number.isInteger(progressPermille) || progressPermille < 0 || progressPermille > 1000) {
    throw new RangeError("Linear-equation projection progress must be an integer from 0 through 1000.");
  }
  if (trace.frames.length === 0) throw new Error("Cannot project an empty linear-equation trace.");
  // Both views consume this sampler so a room-owned clock cannot select divergent semantic frames.
  const frameIndex = Math.min(
    trace.frames.length - 1,
    Math.floor(progressPermille * trace.frames.length / 1001)
  );
  const frame = trace.frames[frameIndex]!;
  const enteringOperation = trace.operations.find((operation) => operation.toFrameId === frame.id);
  return Object.freeze({ frame, frameIndex, enteringOperation });
}
