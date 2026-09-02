import type { KpMathProvenance } from "../typed-semantic-math.ts";
import type { KpScalarSystem } from "../algebra/algebraic-structures.ts";
import { createKpFloatingPointScalars } from "../algebra/standard-spaces.ts";

export interface KpMathAuthoringNotation {
  readonly derivative: string;
  readonly jacobian: string;
  readonly hessian: string;
}

export interface KpMathAuthoringDefaults {
  readonly scalars: KpScalarSystem<number>;
  readonly notation: KpMathAuthoringNotation;
}

export interface KpSemanticAuthoringRef {
  readonly kind: "semantic-authoring-ref";
  readonly id: string;
  readonly semanticPath: readonly string[];
  readonly provenance: KpMathProvenance;
}

type NonEmptyPath = readonly [string, ...string[]];

export interface KpMathAuthoringContext {
  readonly kind: "math-authoring-context";
  readonly namespace: string;
  readonly path: readonly string[];
  readonly defaults: KpMathAuthoringDefaults;
  readonly id: (...segments: NonEmptyPath) => string;
  readonly ref: (...segments: NonEmptyPath) => KpSemanticAuthoringRef;
  readonly at: (...segments: NonEmptyPath) => KpMathAuthoringContext;
}

export function createKpMathAuthoringContext(input: {
  readonly namespace: string;
  readonly defaults?: Readonly<{
    readonly scalars?: KpScalarSystem<number> | undefined;
    readonly notation?: Partial<KpMathAuthoringNotation> | undefined;
  }> | undefined;
}): KpMathAuthoringContext {
  requireNamespace(input.namespace);
  const defaults = Object.freeze({
    scalars: input.defaults?.scalars ?? createKpFloatingPointScalars(),
    notation: Object.freeze({
      derivative: requireNotation(
        input.defaults?.notation?.derivative ?? "D",
        "Derivative notation"
      ),
      jacobian: requireNotation(
        input.defaults?.notation?.jacobian ?? "J",
        "Jacobian notation"
      ),
      hessian: requireNotation(
        input.defaults?.notation?.hessian ?? "H",
        "Hessian notation"
      )
    })
  });
  return createContext(input.namespace, Object.freeze([]), defaults);
}

function createContext(
  namespace: string,
  path: readonly string[],
  defaults: KpMathAuthoringDefaults
): KpMathAuthoringContext {
  const resolvePath = (segments: NonEmptyPath): readonly string[] => {
    segments.forEach((segment, index) => requireSegment(segment, index));
    return Object.freeze([...path, ...segments]);
  };
  const id = (...segments: NonEmptyPath): string =>
    semanticPathId(namespace, resolvePath(segments));
  const ref = (...segments: NonEmptyPath): KpSemanticAuthoringRef => {
    const semanticPath = resolvePath(segments);
    const entityId = semanticPathId(namespace, semanticPath);
    return Object.freeze({
      kind: "semantic-authoring-ref" as const,
      id: entityId,
      semanticPath,
      provenance: Object.freeze({
        kind: "authored" as const,
        sourceId: entityId
      })
    });
  };
  const at = (...segments: NonEmptyPath): KpMathAuthoringContext =>
    createContext(namespace, resolvePath(segments), defaults);
  return Object.freeze({
    kind: "math-authoring-context" as const,
    namespace,
    path,
    defaults,
    id,
    ref,
    at
  });
}

function semanticPathId(namespace: string, path: readonly string[]): string {
  // Encoding dots as well as URI delimiters makes segment boundaries injective.
  return `${namespace}.${path.map(encodeSegment).join(".")}`;
}

function encodeSegment(segment: string): string {
  return encodeURIComponent(segment).replaceAll(".", "%2E");
}

function requireNamespace(value: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value)) {
    throw new Error(
      "Authoring context namespace must be a non-empty dotted identifier."
    );
  }
}

function requireSegment(value: string, index: number): void {
  if (value.length === 0 || value.trim() !== value) {
    throw new Error(
      `Authoring semantic path segment ${index} must be non-empty and trimmed.`
    );
  }
}

function requireNotation(value: string, label: string): string {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
  return value;
}
