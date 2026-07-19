import type { IncomingMessage, ServerResponse } from "node:http";

import canonicalArtifactSource from "../content/generated/artifacts/mathematics.linear-equations.solve-with-balance--1.0.0.ts";
import type { LinearProblemProviderV1 } from "../protocols/public-api.ts";
import {
  canonicalLinearEquationGenerationRequest,
  canonicalLinearEquationRequests,
  mapCanonicalLinearEquationTrace,
  publishLinearEquationConceptReview
} from "../src/app-adapters/public-api.ts";
import { publishedConceptArtifactSchema } from "../src/authoring/public-api.ts";

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
  const generation = provider.generate(canonicalLinearEquationGenerationRequest());
  const requests = canonicalLinearEquationRequests(generation);
  return mapCanonicalLinearEquationTrace({
    requests,
    subtractResponse: provider.verifyStep(requests.subtract),
    divideResponse: provider.verifyStep(requests.divide),
    solutionResponse: provider.verifySolution(requests.solution)
  });
}
