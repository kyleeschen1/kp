import {
  applyKpArticleTextEdits,
  indexKpArticleIdentities,
  renameKpArticleIdentity,
  type KpArticleIdentity,
  type KpArticleTextEdit
} from "./kp-article-identity.ts";
import { scanKpArticleMarkdownLinks } from "./kp-article-markdown-links.ts";
import {
  resolveKpArticleSemanticReferences,
  type KpArticleSemanticReference
} from "./kp-article-semantic-references.ts";
import {
  createKpArticleSource,
  createKpArticleSourceSpan,
  sliceKpArticleSource,
  type KpArticleSource,
  type KpArticleSourceSpan
} from "./kp-article-source.ts";
import {
  validateKpArticle,
  type KpArticleDiagnostic,
  type KpArticleValidationResult,
  type KpValidatedArticleDirective
} from "./kp-article-validation.ts";

export interface KpArticleLanguageCompletion {
  readonly kind: "directive" | "attribute" | "identity" | "import" | "semantic";
  readonly label: string;
  readonly detail: string;
  readonly edit: KpArticleTextEdit;
}

export interface KpArticleLanguageFold {
  readonly kind: "frontmatter" | "directive";
  readonly summary: string;
  readonly span: KpArticleSourceSpan;
}

export interface KpArticleLanguageHover {
  readonly span: KpArticleSourceSpan;
  readonly title: string;
  readonly detail: string;
}

export interface KpArticleLanguageLocation {
  readonly role: "declaration" | "reference" | "stage-owner";
  readonly span: KpArticleSourceSpan;
}

export interface KpArticleSemanticCompletion {
  readonly address: string;
  readonly detail?: string | undefined;
}

export interface KpArticleLanguageService {
  readonly source: KpArticleSource;
  readonly diagnostics: readonly KpArticleDiagnostic[];
  readonly complete: (offset: number) => readonly KpArticleLanguageCompletion[];
  readonly folds: () => readonly KpArticleLanguageFold[];
  readonly hover: (offset: number) => KpArticleLanguageHover | undefined;
  readonly definition: (offset: number) => KpArticleLanguageLocation | undefined;
  readonly references: (offset: number) => readonly KpArticleLanguageLocation[];
  readonly rename: (offset: number, replacement: string) => readonly KpArticleTextEdit[];
  readonly formatDirective: (offset: number) => readonly KpArticleTextEdit[];
  readonly apply: (edits: readonly KpArticleTextEdit[]) => string;
}

const directiveAttributes = Object.freeze({
  "kp-stage": ["use", "preset", "params", "label"],
  "kp-passage": ["intent", "claims"],
  "kp-focus": ["stage", "target", "context", "intent"],
  "kp-motion": ["stage", "run", "range", "intent"]
} as const);

export function createKpArticleLanguageService(input: {
  readonly sourceId: string;
  readonly text: string;
  readonly semantic?: readonly KpArticleSemanticCompletion[] | undefined;
}): KpArticleLanguageService {
  const source = createKpArticleSource(input.sourceId, input.text);
  const validation = validateKpArticle(source);
  const semanticResolution = validation.valid
    ? resolveKpArticleSemanticReferences(source)
    : undefined;
  const diagnostics = freezeDiagnostics([
    ...validation.diagnostics,
    ...(semanticResolution?.diagnostics ?? [])
  ]);
  const identities = validation.valid
    ? indexKpArticleIdentities(source)
    : provisionalIdentities(source, validation);
  const semantic = Object.freeze([...(input.semantic ?? [])]);

  return Object.freeze({
    source,
    diagnostics,
    complete: (offset: number) => completions({
      source,
      validation,
      identities,
      semantic,
      offset
    }),
    folds: () => languageFolds(source, validation),
    hover: (offset: number) => languageHover({
      source,
      validation,
      identities,
      references: semanticResolution?.references ?? [],
      offset
    }),
    definition: (offset: number) => definitionAt({
      source,
      validation,
      identities,
      references: semanticResolution?.references ?? [],
      offset
    }),
    references: (offset: number) => referencesAt({
      source,
      validation,
      identities,
      references: semanticResolution?.references ?? [],
      offset
    }),
    rename: (offset: number, replacement: string) => {
      const symbol = symbolAt({
        source,
        validation,
        identities,
        references: semanticResolution?.references ?? [],
        offset
      });
      return symbol?.kind === "identity"
        ? renameKpArticleIdentity(source, symbol.id, replacement).edits
        : Object.freeze([]);
    },
    formatDirective: (offset: number) => formatDirectiveAt(source, validation, offset),
    apply: (edits: readonly KpArticleTextEdit[]) => applyKpArticleTextEdits(source, edits)
  });
}

function provisionalIdentities(
  source: KpArticleSource,
  validation: KpArticleValidationResult
): readonly KpArticleIdentity[] {
  const identities: KpArticleIdentity[] = [];
  const pattern = /^:::(kp-(stage|passage|focus|motion))\{[^}\n]*#([a-z][a-z0-9]*(?:-[a-z0-9]+)*)/gmu;
  for (const match of source.text.matchAll(pattern)) {
    const localId = match[3]!;
    const relative = match[0].indexOf(`#${localId}`);
    const start = match.index + relative;
    identities.push(Object.freeze({
      documentId: validation.frontmatter?.id ?? source.sourceId,
      localId,
      fullId: `${validation.frontmatter?.id ?? source.sourceId}#${localId}`,
      directiveKind: match[2]! as KpArticleIdentity["directiveKind"],
      span: createKpArticleSourceSpan(source, start, start + localId.length + 1)
    }));
  }
  return Object.freeze(identities);
}

function completions(input: {
  readonly source: KpArticleSource;
  readonly validation: KpArticleValidationResult;
  readonly identities: readonly KpArticleIdentity[];
  readonly semantic: readonly KpArticleSemanticCompletion[];
  readonly offset: number;
}): readonly KpArticleLanguageCompletion[] {
  assertOffset(input.source, input.offset);
  const lineStart = input.source.text.lastIndexOf("\n", Math.max(0, input.offset - 1)) + 1;
  const before = input.source.text.slice(lineStart, input.offset);
  const directive = before.match(/:::(kp-[a-z]*)$/u);
  if (directive !== null) {
    const prefix = directive[1]!;
    const start = input.offset - prefix.length;
    return Object.freeze(Object.keys(directiveAttributes)
      .filter((name) => name.startsWith(prefix))
      .map((name) => completion(
        input.source,
        "directive",
        name,
        "KP Article v1 directive",
        start,
        input.offset,
        name
      )));
  }

  const semanticLink = before.match(/kp-ref:([a-z0-9/-]*)$/u);
  if (semanticLink !== null) {
    const prefix = semanticLink[1]!;
    return semanticCompletions(
      input.source,
      input.semantic,
      prefix,
      input.offset - prefix.length,
      input.offset
    );
  }

  const header = before.match(/^:::(kp-(?:stage|passage|focus|motion))\{(.*)$/u);
  if (header === null) return Object.freeze([]);
  const kind = header[1]! as keyof typeof directiveAttributes;
  const attributeText = header[2]!;
  const value = attributeText.match(
    /([A-Za-z][A-Za-z0-9-]*)=(?:"([^"]*)|'([^']*)'|([^\s}]*))$/u
  );
  if (value !== null) {
    const name = value[1]!;
    const completeValue = value[2] ?? value[3] ?? value[4] ?? "";
    const rangeSeparator = completeValue.lastIndexOf("..");
    const wordStart = Math.max(
      completeValue.lastIndexOf(" ") + 1,
      rangeSeparator < 0 ? 0 : rangeSeparator + 2
    );
    const wordPrefix = completeValue.slice(wordStart);
    const start = input.offset - wordPrefix.length;
    if (name === "stage") {
      return identityCompletions(input.source, input.identities, "stage", wordPrefix, start, input.offset);
    }
    if (name === "use") {
      return importCompletions(input.source, input.validation, wordPrefix, start, input.offset);
    }
    if (["target", "context", "run", "range"].includes(name)) {
      return semanticCompletions(input.source, input.semantic, wordPrefix, start, input.offset);
    }
    return Object.freeze([]);
  }

  const token = attributeText.match(/(?:^|\s)([A-Za-z-]*)$/u)?.[1] ?? "";
  const used = new Set([...attributeText.matchAll(/([A-Za-z][A-Za-z0-9-]*)=/gu)]
    .map((match) => match[1]!));
  const start = input.offset - token.length;
  return Object.freeze(directiveAttributes[kind]
    .filter((name) => !used.has(name) && name.startsWith(token))
    .map((name) => completion(
      input.source,
      "attribute",
      name,
      `${kind} attribute`,
      start,
      input.offset,
      `${name}=`
    )));
}

function identityCompletions(
  source: KpArticleSource,
  identities: readonly KpArticleIdentity[],
  kind: KpArticleIdentity["directiveKind"],
  prefix: string,
  start: number,
  end: number
): readonly KpArticleLanguageCompletion[] {
  return Object.freeze(identities
    .filter((identity) => identity.directiveKind === kind && identity.localId.startsWith(prefix))
    .map((identity) => completion(
      source,
      "identity",
      identity.localId,
      `${identity.directiveKind} in this article`,
      start,
      end,
      identity.localId
    )));
}

function importCompletions(
  source: KpArticleSource,
  validation: KpArticleValidationResult,
  prefix: string,
  start: number,
  end: number
): readonly KpArticleLanguageCompletion[] {
  return Object.freeze(Object.entries(validation.frontmatter?.imports ?? {})
    .filter(([alias]) => alias.startsWith(prefix))
    .map(([alias, reference]) => completion(
      source,
      "import",
      alias,
      reference,
      start,
      end,
      alias
    )));
}

function semanticCompletions(
  source: KpArticleSource,
  semantic: readonly KpArticleSemanticCompletion[],
  prefix: string,
  start: number,
  end: number
): readonly KpArticleLanguageCompletion[] {
  return Object.freeze(semantic
    .filter(({ address }) => address.startsWith(prefix))
    .map(({ address, detail }) => completion(
      source,
      "semantic",
      address,
      detail ?? "Vignette semantic object",
      start,
      end,
      address
    )));
}

function completion(
  source: KpArticleSource,
  kind: KpArticleLanguageCompletion["kind"],
  label: string,
  detail: string,
  start: number,
  end: number,
  replacement: string
): KpArticleLanguageCompletion {
  return Object.freeze({
    kind,
    label,
    detail,
    edit: Object.freeze({
      span: createKpArticleSourceSpan(source, start, end),
      replacement
    })
  });
}

function languageFolds(
  source: KpArticleSource,
  validation: KpArticleValidationResult
): readonly KpArticleLanguageFold[] {
  if (validation.frontmatter === undefined) return Object.freeze([]);
  return Object.freeze([
    Object.freeze({
      kind: "frontmatter" as const,
      summary: `kp ${validation.frontmatter.id}`,
      span: validation.frontmatter.span
    }),
    ...validation.directives.map((directive) => Object.freeze({
      kind: "directive" as const,
      summary: `${directive.source.name} #${directive.id}`,
      span: createKpArticleSourceSpan(
        source,
        directive.source.headerSpan.end.offset,
        directive.source.span.end.offset
      )
    }))
  ]);
}

interface LanguageLookupInput {
  readonly source: KpArticleSource;
  readonly validation: KpArticleValidationResult;
  readonly identities: readonly KpArticleIdentity[];
  readonly references: readonly KpArticleSemanticReference[];
  readonly offset: number;
}

type LanguageSymbol =
  | Readonly<{ kind: "identity"; id: string; span: KpArticleSourceSpan }>
  | Readonly<{ kind: "semantic"; address: string; span: KpArticleSourceSpan }>;

function symbolAt(input: LanguageLookupInput): LanguageSymbol | undefined {
  assertOffset(input.source, input.offset);
  for (const identity of input.identities) {
    if (contains(identity.span, input.offset)) {
      return Object.freeze({ kind: "identity", id: identity.localId, span: identity.span });
    }
  }
  for (const directive of input.validation.directives) {
    const stage = propertyValueSpan(input.source, directive, "stage");
    if (stage !== undefined && contains(stage.span, input.offset)) {
      return Object.freeze({ kind: "identity", id: stage.value, span: stage.span });
    }
  }
  for (const link of scanKpArticleMarkdownLinks(input.source)) {
    if (!link.url.startsWith("#")) continue;
    const span = createKpArticleSourceSpan(
      input.source,
      link.destinationSpan.start.offset + 1,
      link.destinationSpan.end.offset
    );
    if (contains(span, input.offset)) {
      return Object.freeze({ kind: "identity", id: link.url.slice(1), span });
    }
  }
  for (const reference of input.references) {
    const stageSpan = createKpArticleSourceSpan(
      input.source,
      reference.span.start.offset,
      reference.span.start.offset + reference.stageId.length
    );
    if (contains(stageSpan, input.offset)) {
      return Object.freeze({ kind: "identity", id: reference.stageId, span: stageSpan });
    }
    if (contains(reference.span, input.offset)) {
      return Object.freeze({
        kind: "semantic",
        address: reference.address,
        span: reference.span
      });
    }
  }
  return undefined;
}

function languageHover(input: LanguageLookupInput): KpArticleLanguageHover | undefined {
  const symbol = symbolAt(input);
  if (symbol?.kind === "identity") {
    const identity = input.identities.find(({ localId }) => localId === symbol.id);
    return identity === undefined ? undefined : Object.freeze({
      span: symbol.span,
      title: `#${identity.localId}`,
      detail: `${identity.directiveKind} identity in ${identity.documentId}`
    });
  }
  if (symbol?.kind === "semantic") {
    return Object.freeze({
      span: symbol.span,
      title: symbol.address,
      detail: "Semantic attention target; prose does not own timeline state."
    });
  }
  const directive = input.validation.directives.find(({ source }) =>
    contains(source.headerSpan, input.offset)
  );
  return directive === undefined ? undefined : Object.freeze({
    span: directive.source.headerSpan,
    title: `${directive.source.name} #${directive.id}`,
    detail: directiveDetail(directive)
  });
}

function definitionAt(input: LanguageLookupInput): KpArticleLanguageLocation | undefined {
  const symbol = symbolAt(input);
  if (symbol === undefined) return undefined;
  const id = symbol.kind === "identity"
    ? symbol.id
    : symbol.address.split("/", 1)[0]!;
  const identity = input.identities.find(({ localId }) => localId === id);
  return identity === undefined ? undefined : Object.freeze({
    role: symbol.kind === "identity" ? "declaration" as const : "stage-owner" as const,
    span: identity.span
  });
}

function referencesAt(input: LanguageLookupInput): readonly KpArticleLanguageLocation[] {
  const symbol = symbolAt(input);
  if (symbol === undefined) return Object.freeze([]);
  if (symbol.kind === "semantic") {
    return uniqueLocations(input.references
      .filter(({ address }) => address === symbol.address)
      .map(({ span }) => Object.freeze({ role: "reference" as const, span })));
  }
  const identity = input.identities.find(({ localId }) => localId === symbol.id);
  if (identity === undefined) return Object.freeze([]);
  const rename = renameKpArticleIdentity(input.source, symbol.id, symbol.id);
  return uniqueLocations(rename.edits.map(({ span }) => Object.freeze({
    role: span.start.offset === identity.span.start.offset
      ? "declaration" as const
      : "reference" as const,
    span
  })));
}

function formatDirectiveAt(
  source: KpArticleSource,
  validation: KpArticleValidationResult,
  offset: number
): readonly KpArticleTextEdit[] {
  assertOffset(source, offset);
  const directive = validation.directives.find(({ source: scanned }) =>
    contains(scanned.headerSpan, offset)
  );
  if (directive === undefined) return Object.freeze([]);
  const attributes = directive.source.attributes;
  const id = attributes.find(({ kind }) => kind === "id")!;
  const properties = new Map(attributes
    .filter((attribute) => attribute.kind === "property")
    .map((attribute) => [attribute.name!, attribute.value] as const));
  const order = directiveAttributes[directive.source.name as keyof typeof directiveAttributes];
  const serialized = [
    `#${id.value}`,
    ...order.flatMap((name) => {
      const value = properties.get(name);
      return value === undefined ? [] : `${name}=${serializeAttributeValue(value)}`;
    })
  ].join(" ");
  const replacement = `:::${directive.source.name}{${serialized}}`;
  if (sliceKpArticleSource(source, directive.source.headerSpan) === replacement) {
    return Object.freeze([]);
  }
  return Object.freeze([Object.freeze({
    span: directive.source.headerSpan,
    replacement
  })]);
}

function propertyValueSpan(
  source: KpArticleSource,
  directive: KpValidatedArticleDirective,
  name: string
): Readonly<{ value: string; span: KpArticleSourceSpan }> | undefined {
  const attribute = directive.source.attributes.find((candidate) =>
    candidate.kind === "property" && candidate.name === name
  );
  if (attribute === undefined) return undefined;
  const equals = attribute.raw.indexOf("=");
  const quoted = attribute.raw[equals + 1] === '"' || attribute.raw[equals + 1] === "'";
  return Object.freeze({
    value: attribute.value,
    span: createKpArticleSourceSpan(
      source,
      attribute.span.start.offset + equals + 1 + (quoted ? 1 : 0),
      attribute.span.end.offset - (quoted ? 1 : 0)
    )
  });
}

function directiveDetail(directive: KpValidatedArticleDirective): string {
  switch (directive.kind) {
    case "stage": return `Stage using import ${directive.use}.`;
    case "passage": return "Reusable prose passage with no timeline authority.";
    case "focus": return `Attention instruction for stage ${directive.stage}.`;
    case "motion": return `Motion instruction for stage ${directive.stage}.`;
  }
}

function serializeAttributeValue(value: string): string {
  return /^[^\s{}"']+$/u.test(value) ? value : JSON.stringify(value);
}

function freezeDiagnostics(
  diagnostics: readonly KpArticleDiagnostic[]
): readonly KpArticleDiagnostic[] {
  const seen = new Set<string>();
  return Object.freeze(diagnostics.filter((diagnostic) => {
    const key = `${diagnostic.code}:${diagnostic.span.start.offset}:${diagnostic.span.end.offset}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }));
}

function uniqueLocations(
  locations: readonly KpArticleLanguageLocation[]
): readonly KpArticleLanguageLocation[] {
  const seen = new Set<string>();
  return Object.freeze(locations.filter(({ span }) => {
    const key = `${span.start.offset}:${span.end.offset}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }));
}

function contains(span: KpArticleSourceSpan, offset: number): boolean {
  return offset >= span.start.offset && offset < span.end.offset;
}

function assertOffset(source: KpArticleSource, offset: number): void {
  createKpArticleSourceSpan(source, offset, offset);
}
