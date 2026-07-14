import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import {
  createKpExternalAnimationPort,
  type KpExternalAnimationPort,
  type KpExternalAnimationPortImportResult
} from "./external-port.ts";
import {
  createLinearSolveAnimationAsset
} from "./linear-solve-adapter.ts";
import {
  runKpExternalPort
} from "../semantic/asset-port.ts";
import {
  createLinearSolveAlgebraTracePort,
  type AlgebraTraceFixture
} from "../semantic/algebra-trace-port-fixture.ts";

const linearSolveAnimationPortId =
  "port.animation.fixture.algebra-trace.linear-solve";

export function createLinearSolveExternalAnimationPort():
  KpExternalAnimationPort<AlgebraTraceFixture> {
  return createKpExternalAnimationPort({
    id: linearSolveAnimationPortId,
    title: "Linear solve algebra trace animation port",
    sourceSystem: "fixture.algebra-trace",
    version: "0.1.0",
    preservation: "strict",
    importAnimation: importLinearSolveTraceAnimation
  });
}

function importLinearSolveTraceAnimation(
  trace: AlgebraTraceFixture
): KpExternalAnimationPortImportResult {
  const semanticPort = createLinearSolveAlgebraTracePort();
  const imported = runKpExternalPort(semanticPort, trace);
  const animation = createImportedTraceAnimation({
    base: createLinearSolveAnimationAsset(),
    bundle: imported.bundle,
    sourcePortId: imported.portId,
    sourceSystem: imported.sourceSystem,
    sourceTraceId: trace.id
  });

  return {
    animation,
    preservation: imported.preservation,
    diagnostics: imported.diagnostics
  };
}

interface CreateImportedTraceAnimationInput {
  readonly base: KpAnimationAsset;
  readonly bundle: KpAnimationAsset["bundle"];
  readonly sourcePortId: string;
  readonly sourceSystem: string;
  readonly sourceTraceId: string;
}

function createImportedTraceAnimation(
  input: CreateImportedTraceAnimationInput
): KpAnimationAsset {
  return createKpAnimationAsset({
    id: input.base.id,
    title: input.base.title,
    bundle: input.bundle,
    transformations: input.base.transformations,
    transformationTree: input.base.transformationTree,
    timeline: input.base.timeline,
    layout: input.base.layout,
    renderTargets: input.base.renderTargets,
    checks: input.base.checks,
    exportTargets: input.base.exportTargets,
    dashboard: input.base.dashboard,
    metadata: {
      ...(input.base.metadata ?? {}),
      sourcePortId: input.sourcePortId,
      sourceSystem: input.sourceSystem,
      sourceTraceId: input.sourceTraceId
    }
  });
}

