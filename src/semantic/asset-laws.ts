import {
  reparameterizeKpBehavior,
  sampleKpBehavior,
  sampleKpBehaviorAtProgress,
  type KpBehavior
} from "./asset-behavior.ts";
import {
  kpSemanticDiagramForwardPhases,
  kpSemanticDiagramRewindPhases,
  type KpSemanticDiagram
} from "./asset-diagram.ts";
import {
  runKpExternalPort,
  type KpExternalPort,
  type KpExternalPortRunResult
} from "./asset-port.ts";

export interface KpLawFailure {
  readonly path: string;
  readonly message: string;
}

export interface KpLawCheckResult {
  readonly lawId: string;
  readonly passed: boolean;
  readonly failures: readonly KpLawFailure[];
}

export function checkKpBehaviorDeterminism<TFrame>(
  behavior: KpBehavior<TFrame>,
  timesMs: readonly number[]
): KpLawCheckResult {
  const failures: KpLawFailure[] = [];

  timesMs.forEach((timeMs, index) => {
    const first = sampleKpBehavior(behavior, timeMs);
    const second = sampleKpBehavior(behavior, timeMs);

    if (!framesEqual(first, second)) {
      failures.push({
        path: `samples[${index}]`,
        message: `Behavior ${behavior.id} produced different frames for time ${timeMs}.`
      });
    }
  });

  return lawResult("behavior.determinism", failures);
}

export function checkKpBehaviorReparameterization<TFrame>(
  behavior: KpBehavior<TFrame>,
  durationMs: number,
  progressSamples: readonly number[]
): KpLawCheckResult {
  const reparameterized = reparameterizeKpBehavior(behavior, {
    id: `${behavior.id}.reparameterized`,
    durationMs
  });
  const failures: KpLawFailure[] = [];

  progressSamples.forEach((progress, index) => {
    const originalFrame = sampleKpBehaviorAtProgress(behavior, progress);
    const reparameterizedFrame = sampleKpBehaviorAtProgress(
      reparameterized,
      progress
    );

    if (!framesEqual(originalFrame, reparameterizedFrame)) {
      failures.push({
        path: `progressSamples[${index}]`,
        message: `Behavior ${behavior.id} changed semantic frame at progress ${progress}.`
      });
    }
  });

  return lawResult("behavior.reparameterization", failures);
}

export function checkKpDiagramRewindLaw(
  diagram: KpSemanticDiagram
): KpLawCheckResult {
  const forward = kpSemanticDiagramForwardPhases(diagram);
  const expectedRewind = [...forward].reverse();
  const actualRewind = kpSemanticDiagramRewindPhases(diagram);
  const failures: KpLawFailure[] = [];

  if (!framesEqual(actualRewind, expectedRewind)) {
    failures.push({
      path: "rewindPhases",
      message: `Diagram ${diagram.id} rewind phases must be exact reverse forward phases.`
    });
  }

  return lawResult("diagram.rewind", failures);
}

export function checkKpPortDeterminism<TInput>(
  port: KpExternalPort<TInput>,
  input: TInput
): KpLawCheckResult {
  const first = runKpExternalPort(port, input);
  const second = runKpExternalPort(port, input);
  const failures: KpLawFailure[] = [];

  if (!framesEqual(first, second)) {
    failures.push({
      path: "runs",
      message: `Port ${port.id} produced different imports for the same input.`
    });
  }

  return lawResult("port.determinism", failures);
}

export function checkKpPortLossDiagnostics(
  result: KpExternalPortRunResult
): KpLawCheckResult {
  const failures: KpLawFailure[] = [];

  if (result.preservation !== "strict" && result.diagnostics.length === 0) {
    failures.push({
      path: "diagnostics",
      message: `Port ${result.portId} must report diagnostics when preservation is ${result.preservation}.`
    });
  }

  result.diagnostics.forEach((diagnostic, index) => {
    if (
      (diagnostic.severity === "warning" || diagnostic.severity === "error") &&
      diagnostic.lossKind === undefined
    ) {
      failures.push({
        path: `diagnostics[${index}].lossKind`,
        message: `Port ${result.portId} diagnostic ${diagnostic.code} must name the loss kind.`
      });
    }
  });

  if (
    result.preservation === "strict" &&
    result.diagnostics.some((diagnostic) => diagnostic.lossKind !== undefined)
  ) {
    failures.push({
      path: "preservation",
      message: `Port ${result.portId} cannot claim strict preservation while reporting loss diagnostics.`
    });
  }

  return lawResult("port.loss-reporting", failures);
}

function lawResult(
  lawId: string,
  failures: readonly KpLawFailure[]
): KpLawCheckResult {
  return {
    lawId,
    passed: failures.length === 0,
    failures: [...failures]
  };
}

function framesEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
