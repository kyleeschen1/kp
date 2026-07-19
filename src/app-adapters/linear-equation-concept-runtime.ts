import type { KpLinearEquationTrace } from "../../domains/public-api.ts";
import {
  projectLinearEquationBalanceExemplar,
  projectLinearEquationTrace
} from "../projections/public-api.ts";
import {
  createLinearProblemClient,
  type KpLinearProblemClient
} from "../integrations/public-api.ts";

import {
  canonicalLinearEquationGenerationRequest,
  canonicalLinearEquationRequests,
  mapCanonicalLinearEquationTrace
} from "./linear-equation-canonical-provider.ts";
import type { KpConceptRoomArtifactLike } from "./concept-room-artifact.ts";
import {
  KpConceptRoomRuntimeError,
  type KpConceptRoomRuntime,
  type KpConceptRoomRuntimeSession
} from "./concept-room-runtime.ts";

interface SymbolicRendererModule {
  renderSymbolicEquation: typeof import("./symbolic-equation-dom.ts")["renderSymbolicEquation"];
}

interface BalanceRendererModule {
  renderBalanceScene: typeof import("./linear-equation-balance-svg.ts")["renderBalanceScene"];
}

export function createLinearEquationConceptRuntime(options: {
  readonly client?: KpLinearProblemClient;
  readonly loadSymbolicRenderer?: () => Promise<SymbolicRendererModule>;
  readonly loadBalanceRenderer?: () => Promise<BalanceRendererModule>;
} = {}): KpConceptRoomRuntime {
  const client = options.client ?? createLinearProblemClient();
  const loadSymbolic = options.loadSymbolicRenderer ?? (async () => import("./symbolic-equation-dom.ts"));
  const loadBalance = options.loadBalanceRenderer ?? (async () => import("./linear-equation-balance-svg.ts"));
  const runtime: KpConceptRoomRuntime = {
    async prepare(artifact, { signal }) {
      requireLinearEquationArtifact(artifact);
      let trace: KpLinearEquationTrace;
      try {
        const generation = await client.generate(canonicalLinearEquationGenerationRequest(), { signal });
        const requests = canonicalLinearEquationRequests(generation);
        const [subtractResponse, divideResponse, solutionResponse] = await Promise.all([
          client.verifyStep(requests.subtract, { signal }),
          client.verifyStep(requests.divide, { signal }),
          client.verifySolution(requests.solution, { signal })
        ]);
        trace = mapCanonicalLinearEquationTrace({
          requests,
          subtractResponse,
          divideResponse,
          solutionResponse
        });
      } catch (error) {
        throw new KpConceptRoomRuntimeError(
          "provider-unavailable",
          "The verified linear-problem provider is unavailable.",
          { cause: error }
        );
      }
      if (trace.preservation !== "strict" || !trace.solutionVerified) {
        throw new KpConceptRoomRuntimeError(
          "provider-unavailable",
          "The provider did not return a strict verified concept trace."
        );
      }
      return runtimeSession(trace, loadSymbolic, loadBalance);
    }
  };
  return Object.freeze(runtime);
}

function runtimeSession(
  trace: KpLinearEquationTrace,
  loadSymbolic: () => Promise<SymbolicRendererModule>,
  loadBalance: () => Promise<BalanceRendererModule>
): KpConceptRoomRuntimeSession {
  let disposed = false;
  return {
    async render(root, state) {
      if (disposed) throw new Error("Linear-equation concept runtime is disposed.");
      try {
        if (state.projection === "symbolic") {
          const renderer = await loadSymbolic();
          renderer.renderSymbolicEquation(root, projectLinearEquationTrace(trace, state.timePermille), {
            focusSemanticIds: state.focus
          });
          return;
        }
        if (state.projection === "balance") {
          const renderer = await loadBalance();
          renderer.renderBalanceScene(
            root,
            projectLinearEquationBalanceExemplar(trace, state.timePermille, {
              diagramSemanticId: "diagram.balance"
            }),
            { focusSemanticIds: state.focus }
          );
          return;
        }
        throw new KpConceptRoomRuntimeError(
          "projection-unavailable",
          `Projection ${String(state.projection)} is unavailable.`
        );
      } catch (error) {
        if (error instanceof KpConceptRoomRuntimeError) throw error;
        throw new KpConceptRoomRuntimeError(
          "renderer-unavailable",
          `The ${state.projection} renderer is unavailable.`,
          { cause: error }
        );
      }
    },
    dispose() {
      disposed = true;
    }
  };
}

function requireLinearEquationArtifact(artifact: KpConceptRoomArtifactLike): void {
  const equationCapability = artifact.manifest.capabilities.some((capability) =>
    capability.id === "kp.equation" && capability.major === 1
  ) && artifact.manifest.styleRoles.includes("equation.expression") &&
    artifact.manifest.projections.includes("symbolic");
  const balanceProjection = artifact.manifest.styleRoles.includes("diagram.balance") &&
    artifact.manifest.projections.includes("balance");
  if (!equationCapability || !balanceProjection) {
    throw new KpConceptRoomRuntimeError(
      "capability-unavailable",
      "The published artifact does not declare the linear-equation projection contract."
    );
  }
}
