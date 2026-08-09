import {
  KpArticleDirectiveSyntaxError,
  scanKpArticleDirectives,
  type KpArticleDirective,
  type KpArticleDirectiveAttribute
} from "./kp-article-directives.ts";
import {
  KpArticleFrontmatterSyntaxError,
  kpArticleRc1Schema,
  parseKpArticleFrontmatter,
  type KpArticleFrontmatter
} from "./kp-article-frontmatter.ts";
import {
  createKpArticleSourceSpan,
  sliceKpArticleSource,
  type KpArticleSource,
  type KpArticleSourceSpan
} from "./kp-article-source.ts";

export interface KpArticleDiagnostic {
  readonly severity: "error";
  readonly code: string;
  readonly message: string;
  readonly span: KpArticleSourceSpan;
}

interface KpValidatedDirectiveBase {
  readonly id: string;
  readonly source: KpArticleDirective;
}

export interface KpValidatedStageDirective extends KpValidatedDirectiveBase {
  readonly kind: "stage";
  readonly use: string;
  readonly preset?: string;
  readonly params?: string;
  readonly label?: string;
}

export interface KpValidatedPassageDirective extends KpValidatedDirectiveBase {
  readonly kind: "passage";
  readonly intent?: string;
  readonly claims: readonly string[];
}

export interface KpValidatedFocusDirective extends KpValidatedDirectiveBase {
  readonly kind: "focus";
  readonly stage: string;
  readonly targets: readonly string[];
  readonly context: readonly string[];
  readonly intent?: string;
}

export interface KpValidatedMotionDirective extends KpValidatedDirectiveBase {
  readonly kind: "motion";
  readonly stage: string;
  readonly run?: string;
  readonly range?: Readonly<{ from: string; to: string }>;
  readonly intent?: string;
}

export type KpValidatedArticleDirective =
  | KpValidatedStageDirective
  | KpValidatedPassageDirective
  | KpValidatedFocusDirective
  | KpValidatedMotionDirective;

export interface KpArticleRc1ValidationResult {
  readonly valid: boolean;
  readonly frontmatter?: KpArticleFrontmatter;
  readonly directives: readonly KpValidatedArticleDirective[];
  readonly diagnostics: readonly KpArticleDiagnostic[];
}

const documentIdPattern = /^lesson\.[a-z0-9]+(?:[.-][a-z0-9]+)*$/u;
const localIdPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;
const importPattern = /^vignette\.[a-z0-9]+(?:[.-][a-z0-9]+)*@[1-9][0-9]*$/u;

export function validateKpArticleRc1(
  source: KpArticleSource
): KpArticleRc1ValidationResult {
  const diagnostics: KpArticleDiagnostic[] = [];
  let frontmatter: KpArticleFrontmatter;
  try {
    frontmatter = parseKpArticleFrontmatter(source);
  } catch (error) {
    if (error instanceof KpArticleFrontmatterSyntaxError) {
      return result(undefined, [], [diagnostic(error.code, error.message, error.span)]);
    }
    throw error;
  }

  if (frontmatter.schema !== kpArticleRc1Schema) {
    diagnostics.push(diagnostic(
      "schema-unsupported",
      `Unsupported KP article schema: ${frontmatter.schema}.`,
      frontmatter.span
    ));
  }
  if (!documentIdPattern.test(frontmatter.id)) {
    diagnostics.push(diagnostic(
      "document-id-invalid",
      "KP article IDs must begin with lesson. and use lowercase dot or hyphen segments.",
      frontmatter.span
    ));
  }
  for (const [alias, reference] of Object.entries(frontmatter.imports)) {
    if (!importPattern.test(reference)) {
      diagnostics.push(diagnostic(
        "import-reference-invalid",
        `Import ${alias} must reference a major-versioned vignette such as vignette.domain.name@1.`,
        frontmatter.span
      ));
    }
  }
  diagnostics.push(...rawHtmlDiagnostics(source, frontmatter.bodySpan));

  let scanned: readonly KpArticleDirective[];
  try {
    scanned = scanKpArticleDirectives(source, frontmatter.bodySpan);
  } catch (error) {
    if (error instanceof KpArticleDirectiveSyntaxError) {
      diagnostics.push(diagnostic(error.code, error.message, error.span));
      return result(frontmatter, [], diagnostics);
    }
    throw error;
  }

  const directives: KpValidatedArticleDirective[] = [];
  for (const directive of scanned) {
    const validated = validateDirective(source, directive, diagnostics);
    if (validated !== undefined) directives.push(validated);
  }
  const firstIdentity = new Map<string, KpValidatedArticleDirective>();
  for (const directive of directives) {
    const previous = firstIdentity.get(directive.id);
    if (previous === undefined) {
      firstIdentity.set(directive.id, directive);
      continue;
    }
    const idAttribute = directive.source.attributes.find(({ kind }) => kind === "id")!;
    diagnostics.push(diagnostic(
      "directive-id-collision",
      `Article-local identity ${directive.id} is already declared by ${previous.source.name}.`,
      idAttribute.span
    ));
  }
  return result(frontmatter, directives, diagnostics);
}

function validateDirective(
  source: KpArticleSource,
  directive: KpArticleDirective,
  diagnostics: KpArticleDiagnostic[]
): KpValidatedArticleDirective | undefined {
  if (directive.recognizedKind === undefined) {
    diagnostics.push(diagnostic(
      "directive-unknown",
      `Unknown KP article directive: ${directive.name}.`,
      directive.headerSpan
    ));
    return undefined;
  }

  const beforeCount = diagnostics.length;
  const ids = directive.attributes.filter(({ kind }) => kind === "id");
  if (ids.length !== 1) {
    diagnostics.push(diagnostic(
      ids.length === 0 ? "directive-id-required" : "directive-id-duplicate",
      `${directive.name} must declare exactly one #id.`,
      directive.headerSpan
    ));
  }
  const id = ids[0]?.value ?? "";
  if (id.length > 0 && !localIdPattern.test(id)) {
    diagnostics.push(diagnostic(
      "directive-id-invalid",
      "Directive IDs must be lowercase readable slugs separated by hyphens.",
      ids[0]!.span
    ));
  }

  const properties = new Map<string, KpArticleDirectiveAttribute>();
  for (const attribute of directive.attributes) {
    if (attribute.kind !== "property") continue;
    const name = attribute.name!;
    if (properties.has(name)) {
      diagnostics.push(diagnostic(
        "directive-attribute-duplicate",
        `${directive.name} repeats attribute ${name}.`,
        attribute.span
      ));
    } else {
      properties.set(name, attribute);
    }
  }

  const allowed = allowedAttributes(directive.recognizedKind);
  for (const attribute of properties.values()) {
    if (!allowed.has(attribute.name!)) {
      diagnostics.push(diagnostic(
        "directive-attribute-unknown",
        `${directive.name} does not accept attribute ${attribute.name}.`,
        attribute.span
      ));
    }
  }

  const requireProperty = (name: string): string => {
    const attribute = properties.get(name);
    if (attribute !== undefined && attribute.value.length > 0) return attribute.value;
    diagnostics.push(diagnostic(
      "directive-attribute-required",
      `${directive.name} requires attribute ${name}.`,
      directive.headerSpan
    ));
    return "";
  };
  const optional = (name: string): string | undefined => properties.get(name)?.value;
  const body = sliceKpArticleSource(source, directive.bodySpan).trim();

  let validated: KpValidatedArticleDirective;
  switch (directive.recognizedKind) {
    case "kp-stage": {
      const use = requireProperty("use");
      if (body.length > 0 || directive.afterSpan !== undefined) {
        diagnostics.push(diagnostic(
          "stage-body-forbidden",
          "kp-stage marks the fallback position and cannot contain prose.",
          directive.bodySpan
        ));
      }
      validated = Object.freeze({
        kind: "stage" as const,
        id,
        use,
        ...optionalFields(properties, ["preset", "params", "label"]),
        source: directive
      });
      break;
    }
    case "kp-passage": {
      const intent = optional("intent");
      requireBody(directive, body, diagnostics);
      validated = Object.freeze({
        kind: "passage" as const,
        id,
        ...(intent === undefined ? {} : { intent }),
        claims: Object.freeze(words(optional("claims"))),
        source: directive
      });
      break;
    }
    case "kp-focus": {
      const stage = requireProperty("stage");
      const targets = words(requireProperty("target"));
      const intent = optional("intent");
      requireBody(directive, body, diagnostics);
      validated = Object.freeze({
        kind: "focus" as const,
        id,
        stage,
        targets: Object.freeze(targets),
        context: Object.freeze(words(optional("context"))),
        ...(intent === undefined ? {} : { intent }),
        source: directive
      });
      break;
    }
    case "kp-motion": {
      const stage = requireProperty("stage");
      const run = optional("run");
      const rangeSource = optional("range");
      const intent = optional("intent");
      if ((run === undefined) === (rangeSource === undefined)) {
        diagnostics.push(diagnostic(
          "motion-transition-exclusive",
          "kp-motion requires exactly one of run or range.",
          directive.headerSpan
        ));
      }
      const range = rangeSource === undefined
        ? undefined
        : parseRange(rangeSource, properties.get("range")!, diagnostics);
      requireBody(directive, body, diagnostics);
      if (directive.afterSpan !== undefined && sliceKpArticleSource(source, directive.afterSpan).trim().length === 0) {
        diagnostics.push(diagnostic(
          "motion-after-empty",
          "A present ::after slot must contain Markdown.",
          directive.afterSpan
        ));
      }
      validated = Object.freeze({
        kind: "motion" as const,
        id,
        stage,
        ...(run === undefined ? {} : { run }),
        ...(range === undefined ? {} : { range }),
        ...(intent === undefined ? {} : { intent }),
        source: directive
      });
      break;
    }
  }

  return diagnostics.length === beforeCount ? validated : undefined;
}

function allowedAttributes(kind: NonNullable<KpArticleDirective["recognizedKind"]>): ReadonlySet<string> {
  switch (kind) {
    case "kp-stage": return new Set(["use", "preset", "params", "label"]);
    case "kp-passage": return new Set(["intent", "claims"]);
    case "kp-focus": return new Set(["stage", "target", "context", "intent"]);
    case "kp-motion": return new Set(["stage", "run", "range", "intent"]);
  }
}

function optionalFields(
  properties: ReadonlyMap<string, KpArticleDirectiveAttribute>,
  names: readonly string[]
): Readonly<Record<string, string>> {
  return Object.freeze(Object.fromEntries(names.flatMap((name) => {
    const value = properties.get(name)?.value;
    return value === undefined ? [] : [[name, value]];
  })));
}

function parseRange(
  value: string,
  attribute: KpArticleDirectiveAttribute,
  diagnostics: KpArticleDiagnostic[]
): Readonly<{ from: string; to: string }> | undefined {
  const [from, to, ...rest] = value.split("..");
  if (from === undefined || from.length === 0 || to === undefined || to.length === 0 || rest.length > 0) {
    diagnostics.push(diagnostic(
      "motion-range-invalid",
      "Motion ranges use from..to checkpoint syntax.",
      attribute.span
    ));
    return undefined;
  }
  return Object.freeze({ from, to });
}

function requireBody(
  directive: KpArticleDirective,
  body: string,
  diagnostics: KpArticleDiagnostic[]
): void {
  if (body.length > 0) return;
  diagnostics.push(diagnostic(
    "directive-body-required",
    `${directive.name} needs searchable Markdown body text.`,
    directive.bodySpan
  ));
}

function words(value: string | undefined): string[] {
  return value?.trim().split(/\s+/u).filter(Boolean) ?? [];
}

function rawHtmlDiagnostics(
  source: KpArticleSource,
  bodySpan: KpArticleSourceSpan
): readonly KpArticleDiagnostic[] {
  const diagnostics: KpArticleDiagnostic[] = [];
  let fence: { marker: string; length: number } | undefined;

  for (let index = 0; index < source.lineStarts.length; index += 1) {
    const start = source.lineStarts[index]!;
    if (start < bodySpan.start.offset || start >= bodySpan.end.offset) continue;
    const next = source.lineStarts[index + 1] ?? source.text.length;
    const raw = source.text.slice(start, next).replace(/\r?\n$/u, "");
    const fenceRun = raw.match(/^ {0,3}(`{3,}|~{3,})/u)?.[1];
    if (fence !== undefined) {
      if (fenceRun?.[0] === fence.marker && fenceRun.length >= fence.length) fence = undefined;
      continue;
    }
    if (fenceRun !== undefined) {
      fence = { marker: fenceRun[0]!, length: fenceRun.length };
      continue;
    }

    const match = raw.match(/<!--|<\/?[A-Za-z][A-Za-z0-9-]*(?=\s|\/?>)/u);
    if (match?.index === undefined) continue;
    diagnostics.push(diagnostic(
      "raw-html-forbidden",
      "RC1 articles use Markdown and typed KP directives rather than raw HTML.",
      createKpArticleSourceSpan(
        source,
        start + match.index,
        start + match.index + match[0].length
      )
    ));
  }
  return diagnostics;
}

function result(
  frontmatter: KpArticleFrontmatter | undefined,
  directives: readonly KpValidatedArticleDirective[],
  diagnostics: readonly KpArticleDiagnostic[]
): KpArticleRc1ValidationResult {
  return Object.freeze({
    valid: diagnostics.length === 0,
    ...(frontmatter === undefined ? {} : { frontmatter }),
    directives: Object.freeze([...directives]),
    diagnostics: Object.freeze([...diagnostics])
  });
}

function diagnostic(
  code: string,
  message: string,
  span: KpArticleSourceSpan
): KpArticleDiagnostic {
  return Object.freeze({ severity: "error" as const, code, message, span });
}
