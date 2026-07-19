import type { IncomingMessage, ServerResponse } from "node:http";

import canonicalArtifactSource from "../content/generated/artifacts/mathematics.linear-equations.solve-with-balance--1.0.0.ts";
import { canonicalLinearProblem } from "../providers/linear-problems/public-api.ts";
import type {
  LinearEquationDto,
  LinearProblemProviderV1
} from "../protocols/public-api.ts";
import { publishLinearEquationConceptReview } from "../src/app-adapters/public-api.ts";
import { publishedConceptArtifactSchema } from "../src/authoring/public-api.ts";
import { mapLinearProblemToKpTrace } from "../src/integrations/public-api.ts";

export interface KpConceptReviewHttpAdapter {
  readonly canonicalPath: string;
  handle(request: IncomingMessage, response: ServerResponse, url: URL): boolean;
}

export function createCanonicalConceptReviewHttpAdapter(
  provider: LinearProblemProviderV1
): KpConceptReviewHttpAdapter {
  const artifact = publishedConceptArtifactSchema.parse(canonicalArtifactSource);
  const trace = canonicalReviewTrace(provider);
  const publication = publishLinearEquationConceptReview({
    artifact,
    trace,
    diagramSemanticId: "diagram.balance"
  });
  const paths = new Set([
    publication.canonicalPath,
    ...artifact.manifest.route.legacyAliases
  ]);
  const adapter: KpConceptReviewHttpAdapter = {
    canonicalPath: publication.canonicalPath,
    handle(request, response, url) {
      if (request.method !== "GET" || !paths.has(url.pathname)) return false;
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-length": Buffer.byteLength(publication.html),
        "content-type": "text/html; charset=utf-8",
        "x-kp-artifact-integrity": artifact.integrity
      });
      response.end(publication.html);
      return true;
    }
  };
  return Object.freeze(adapter);
}

function canonicalReviewTrace(provider: LinearProblemProviderV1) {
  const problem = canonicalLinearProblem();
  const afterSubtract = equation(2, 0, 0, 5);
  const solved = equation(1, 0, 0, 5, 2);
  const subtractRequest = {
    schemaVersion: "linear-problem.verify-step.request.v1" as const,
    problem,
    previous: problem.equation,
    candidate: afterSubtract
  };
  const divideRequest = {
    schemaVersion: "linear-problem.verify-step.request.v1" as const,
    problem,
    previous: afterSubtract,
    candidate: solved
  };
  const solutionRequest = {
    schemaVersion: "linear-problem.verify-solution.request.v1" as const,
    problem,
    candidate: problem.solution
  };
  return mapLinearProblemToKpTrace({
    generation: { schemaVersion: "linear-problem.generate.response.v1", problem },
    steps: [
      {
        request: subtractRequest,
        response: provider.verifyStep(subtractRequest),
        semanticIds: { operation: "operation.subtract-three", equation: "equation.after-subtract" }
      },
      {
        request: divideRequest,
        response: provider.verifyStep(divideRequest),
        semanticIds: { operation: "operation.divide-two", equation: "equation.solved" }
      }
    ],
    solutionVerification: {
      request: solutionRequest,
      response: provider.verifySolution(solutionRequest)
    },
    initialSemanticIds: {
      equation: "equation.initial",
      leftVariable: "term.two-x",
      leftConstant: "term.add-three",
      rightVariable: "term.zero-x",
      rightConstant: "term.eight"
    }
  });
}

function equation(
  leftCoefficient: number,
  leftConstant: number,
  rightCoefficient: number,
  rightNumerator: number,
  rightDenominator = 1
): LinearEquationDto {
  return {
    left: {
      variable: "x",
      coefficient: { numerator: String(leftCoefficient), denominator: "1" },
      constant: { numerator: String(leftConstant), denominator: "1" }
    },
    right: {
      variable: "x",
      coefficient: { numerator: String(rightCoefficient), denominator: "1" },
      constant: { numerator: String(rightNumerator), denominator: String(rightDenominator) }
    }
  };
}
