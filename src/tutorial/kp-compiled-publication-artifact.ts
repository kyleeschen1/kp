export const kpCompiledPublicationArtifactSchema =
  "kp.compiled-publication-artifact.v1" as const;

export interface KpCompiledPublicationSourceIdentity {
  readonly path: string;
  readonly sha256: `sha256:${string}`;
}

export interface KpCompiledPublicationCompilerIdentity {
  readonly id: string;
  readonly version: string;
}

export interface KpCompiledPublicationMathManifest {
  readonly engine: "katex";
  readonly engineVersion: string;
  readonly rendering: "build-time";
  readonly output: "htmlAndMathml";
  readonly trust: false;
  readonly fragmentCount: number;
  readonly sourceLatex: readonly string[];
}

export interface KpCompiledPublicationArtifact<Payload> {
  readonly schemaVersion: typeof kpCompiledPublicationArtifactSchema;
  readonly kind: "compiled-publication-artifact";
  readonly artifactId: string;
  readonly source: KpCompiledPublicationSourceIdentity;
  readonly compiler: KpCompiledPublicationCompilerIdentity;
  readonly math: KpCompiledPublicationMathManifest;
  readonly payloadSha256: `sha256:${string}`;
  readonly payload: Payload;
}

export function createKpCompiledPublicationArtifact<Payload>(input: {
  readonly artifactId: string;
  readonly source: KpCompiledPublicationSourceIdentity;
  readonly compiler: KpCompiledPublicationCompilerIdentity;
  readonly math: KpCompiledPublicationMathManifest;
  readonly payloadSha256: `sha256:${string}`;
  readonly payload: Payload;
}): KpCompiledPublicationArtifact<Payload> {
  const artifact = {
    schemaVersion: kpCompiledPublicationArtifactSchema,
    kind: "compiled-publication-artifact" as const,
    artifactId: input.artifactId,
    source: Object.freeze({ ...input.source }),
    compiler: Object.freeze({ ...input.compiler }),
    math: Object.freeze({
      ...input.math,
      sourceLatex: Object.freeze([...input.math.sourceLatex])
    }),
    payloadSha256: input.payloadSha256,
    payload: input.payload
  };
  assertKpCompiledPublicationArtifact(artifact);
  return Object.freeze(artifact);
}

export function assertKpCompiledPublicationArtifact(
  value: unknown
): asserts value is KpCompiledPublicationArtifact<unknown> {
  if (!isRecord(value)) fail("artifact must be an object");
  if (value["schemaVersion"] !== kpCompiledPublicationArtifactSchema) {
    fail("schemaVersion is not supported");
  }
  if (value["kind"] !== "compiled-publication-artifact") {
    fail("kind is not compiled-publication-artifact");
  }
  requireText(value["artifactId"], "artifactId");
  requireDigest(value["payloadSha256"], "payloadSha256");

  const source = value["source"];
  if (!isRecord(source)) fail("source must be an object");
  requireText(source["path"], "source.path");
  requireDigest(source["sha256"], "source.sha256");

  const compiler = value["compiler"];
  if (!isRecord(compiler)) fail("compiler must be an object");
  requireText(compiler["id"], "compiler.id");
  requireText(compiler["version"], "compiler.version");

  const math = value["math"];
  if (!isRecord(math)) fail("math must be an object");
  if (
    math["engine"] !== "katex" ||
    math["rendering"] !== "build-time" ||
    math["output"] !== "htmlAndMathml" ||
    math["trust"] !== false
  ) {
    fail("math must be trusted-off build-time KaTeX HTML and MathML");
  }
  requireText(math["engineVersion"], "math.engineVersion");
  const sourceLatex = math["sourceLatex"];
  if (!Array.isArray(sourceLatex) ||
    !sourceLatex.every((entry) => typeof entry === "string")) {
    fail("math.sourceLatex must be a string array");
  }
  if (
    !Number.isInteger(math["fragmentCount"]) ||
    Number(math["fragmentCount"]) < sourceLatex.length
  ) {
    fail("math.fragmentCount must cover the source inventory");
  }
  if (new Set(sourceLatex).size !== sourceLatex.length) {
    fail("math.sourceLatex must contain unique source expressions");
  }
  if ([...sourceLatex].sort().some((entry, index) =>
    entry !== sourceLatex[index])) {
    fail("math.sourceLatex must be deterministically sorted");
  }
  if (!("payload" in value)) fail("payload is required");
}

function requireText(value: unknown, path: string): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    fail(`${path} must be non-empty text`);
  }
}

function requireDigest(
  value: unknown,
  path: string
): asserts value is `sha256:${string}` {
  if (typeof value !== "string" || !/^sha256:[a-f0-9]{64}$/.test(value)) {
    fail(`${path} must be a lowercase SHA-256 digest`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fail(message: string): never {
  throw new Error(`Invalid compiled publication artifact: ${message}.`);
}
