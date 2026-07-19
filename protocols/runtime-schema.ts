export interface ProtocolSchemaIssue {
  readonly path: string;
  readonly message: string;
}

export interface ProtocolSchema<T> {
  parse(input: unknown): T;
  safeParse(input: unknown):
    | { readonly success: true; readonly value: T }
    | { readonly success: false; readonly issues: readonly ProtocolSchemaIssue[] };
}

export type InferProtocolSchema<Schema extends ProtocolSchema<unknown>> =
  Schema extends ProtocolSchema<infer Value> ? Value : never;

export class ProtocolSchemaError extends Error {
  readonly issues: readonly ProtocolSchemaIssue[];

  constructor(issues: readonly ProtocolSchemaIssue[]) {
    super(issues.map((issue) => `${issue.path}: ${issue.message}`).join("; "));
    this.name = "ProtocolSchemaError";
    this.issues = issues;
  }
}

type Parser<T> = (input: unknown, path: string) => T;

export function protocolSchema<T>(parser: Parser<T>): ProtocolSchema<T> {
  return {
    parse(input) {
      return parser(input, "$");
    },
    safeParse(input) {
      try {
        return { success: true, value: parser(input, "$") };
      } catch (error) {
        if (error instanceof ProtocolSchemaError) {
          return { success: false, issues: error.issues };
        }
        throw error;
      }
    }
  };
}

export function protocolString(options: {
  readonly pattern?: RegExp;
  readonly minLength?: number;
} = {}): ProtocolSchema<string> {
  return protocolSchema((input, path) => {
    if (typeof input !== "string") fail(path, "expected string");
    if (options.minLength !== undefined && input.length < options.minLength) {
      fail(path, `expected at least ${options.minLength} character(s)`);
    }
    if (options.pattern !== undefined && !options.pattern.test(input)) {
      fail(path, `expected string matching ${options.pattern}`);
    }
    return input;
  });
}

export function protocolInteger(options: {
  readonly min?: number;
  readonly max?: number;
} = {}): ProtocolSchema<number> {
  return protocolSchema((input, path) => {
    if (typeof input !== "number" || !Number.isInteger(input)) fail(path, "expected integer");
    if (options.min !== undefined && input < options.min) fail(path, `expected value >= ${options.min}`);
    if (options.max !== undefined && input > options.max) fail(path, `expected value <= ${options.max}`);
    return input;
  });
}

export function protocolBoolean(): ProtocolSchema<boolean> {
  return protocolSchema((input, path) => {
    if (typeof input !== "boolean") fail(path, "expected boolean");
    return input;
  });
}

export function protocolLiteral<const Value extends string | number | boolean>(
  value: Value
): ProtocolSchema<Value> {
  return protocolSchema((input, path) => {
    if (input !== value) fail(path, `expected literal ${JSON.stringify(value)}`);
    return value;
  });
}

export function protocolEnum<const Values extends readonly [string, ...string[]]>(
  values: Values
): ProtocolSchema<Values[number]> {
  const allowed = new Set<string>(values);
  return protocolSchema((input, path) => {
    if (typeof input !== "string" || !allowed.has(input)) {
      fail(path, `expected one of ${values.join(", ")}`);
    }
    return input as Values[number];
  });
}

export function protocolArray<Item>(schema: ProtocolSchema<Item>): ProtocolSchema<readonly Item[]> {
  return protocolSchema((input, path) => {
    if (!Array.isArray(input)) fail(path, "expected array");
    return input.map((item, index) => parseAt(schema, item, `${path}[${index}]`));
  });
}

type ProtocolSchemaShape = Readonly<Record<string, ProtocolSchema<unknown>>>;
type InferProtocolShape<Shape extends ProtocolSchemaShape> = {
  readonly [Key in keyof Shape]: InferProtocolSchema<Shape[Key]>;
};

export function protocolObject<const Shape extends ProtocolSchemaShape>(
  shape: Shape
): ProtocolSchema<InferProtocolShape<Shape>> {
  return protocolSchema((input, path) => {
    if (!isRecord(input)) fail(path, "expected object");
    const expectedKeys = Object.keys(shape);
    const unknownKeys = Object.keys(input).filter((key) => !(key in shape));
    if (unknownKeys.length > 0) fail(path, `unexpected key(s): ${unknownKeys.join(", ")}`);

    const result: Record<string, unknown> = {};
    for (const key of expectedKeys) {
      const schema = shape[key];
      if (schema === undefined) continue;
      result[key] = parseAt(schema, input[key], `${path}.${key}`);
    }
    return result as InferProtocolShape<Shape>;
  });
}

export function protocolRefine<Value>(
  schema: ProtocolSchema<Value>,
  predicate: (value: Value) => boolean,
  message: string
): ProtocolSchema<Value> {
  return protocolSchema((input, path) => {
    const value = parseAt(schema, input, path);
    if (!predicate(value)) fail(path, message);
    return value;
  });
}

function parseAt<T>(schema: ProtocolSchema<T>, input: unknown, path: string): T {
  const result = schema.safeParse(input);
  if (result.success) return result.value;
  throw new ProtocolSchemaError(result.issues.map((issue) => ({
    ...issue,
    path: issue.path === "$" ? path : `${path}${issue.path.slice(1)}`
  })));
}

function fail(path: string, message: string): never {
  throw new ProtocolSchemaError([{ path, message }]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

