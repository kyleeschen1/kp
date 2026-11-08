import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";

interface Reference { readonly consumer: string; readonly line: number; readonly literal: string; readonly kind: "css-import" | "source-literal" }
interface RuleLocation { readonly path: string; readonly line: number; readonly selector: string }
interface DeclarationGroup { readonly context: readonly string[]; readonly declarations: readonly string[]; readonly locations: RuleLocation[] }

/** Literal references are evidence of consumers, not a reachability/dead-code proof.
 * Generated URLs and computed imports still need a named consumer investigation. */
export function stylesheetReferences(source: string): readonly { literal: string; line: number }[] {
  const references = [];
  for (const match of source.matchAll(/["'`]([^"'`\s<>]+\.css(?:\?[^"'`\s<>]*)?)["'`]/g)) {
    references.push({ literal: match[1]!, line: source.slice(0, match.index).split("\n").length });
  }
  return references;
}

export function stylesheetDeclarationGroups(source: string, path: string): readonly DeclarationGroup[] {
  const groups: DeclarationGroup[] = [];
  postcss.parse(source, { from: path }).walkRules(rule => {
    const declarations = rule.nodes.filter(node => node.type === "decl")
      .map(node => `${node.prop}:${node.value}${node.important ? "!important" : ""}`);
    // Single-property repetitions are too weak a signal for consolidation.
    if (declarations.length < 2) return;
    const context: string[] = [];
    for (let parent = rule.parent; parent && parent.type !== "root"; parent = parent.parent) {
      if (parent.type === "atrule") context.unshift(`@${parent.name} ${parent.params}`);
      else if (parent.type === "rule") context.unshift(parent.selector);
    }
    groups.push({ context, declarations, locations: [{ path, line: rule.source?.start?.line ?? 1, selector: rule.selector }] });
  });
  return groups;
}

export function auditStylesheetOwnership(root: string) {
  // Include uncommitted new owners during a conversion; exclude removed files.
  const files = [...new Set(execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard", "--",
    "src", "scripts", "experiments", "reader", "tutorials", "learn", "studio", "examples",
    ":(glob)**/*.css", ":(top)*.html", ":(top)*.json"],
    { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean))].filter(path => existsSync(resolve(root, path))).sort();
  const cssFiles = files.filter(path => path.endsWith(".css"));
  const known = new Set(cssFiles);
  const references = new Map<string, Reference[]>();
  const unresolved: Reference[] = [];
  const active = files.filter(path => !/\.(?:test|spec)\.[cm]?[jt]s$/.test(path) && /\.(?:[cm]?[jt]sx?|svelte|html|json|css)$/.test(path) &&
    (/^(?:src|scripts|experiments|reader|tutorials|learn|studio|examples)\//.test(path) || !path.includes("/")));
  for (const consumer of active) {
    const source = readFileSync(resolve(root, consumer), "utf8");
    const literals = consumer.endsWith(".css") ? (() => {
      const imports: { literal: string; line: number }[] = [];
      postcss.parse(source, { from: consumer }).walkAtRules("import", rule => {
        const match = /^(?:url\(\s*)?["']?([^"'\s)]+)/.exec(rule.params);
        if (match) imports.push({ literal: match[1]!, line: rule.source?.start?.line ?? 1 });
      });
      return imports;
    })() : stylesheetReferences(source);
    for (const reference of literals) {
      const literal = reference.literal.split(/[?#]/)[0]!;
      const candidates = literal.startsWith("/") ? [literal.slice(1)] : [
        relative(root, resolve(root, dirname(consumer), literal)), literal,
        `src/${literal}`, `src/experiments/${literal}`
      ];
      const target = candidates.find(candidate => known.has(candidate));
      const entry: Reference = { ...reference, consumer, kind: consumer.endsWith(".css") ? "css-import" : "source-literal" };
      if (target) references.set(target, [...(references.get(target) ?? []), entry]);
      else unresolved.push(entry);
    }
  }
  const groups = new Map<string, DeclarationGroup>();
  const stylesheets = cssFiles.map(path => {
    const source = readFileSync(resolve(root, path), "utf8");
    let declarations = 0;
    postcss.parse(source, { from: path }).walkDecls(() => { declarations++; });
    for (const group of stylesheetDeclarationGroups(source, path)) {
      const key = JSON.stringify([group.context, group.declarations]);
      const previous = groups.get(key);
      if (previous) previous.locations.push(...group.locations);
      else groups.set(key, group);
    }
    return { path, owner: path.startsWith("src/") && path.split("/").length > 2 ? path.split("/")[1]! : "foundation",
      bytes: Buffer.byteLength(source), lines: source.split("\n").length - 1, declarations,
      references: references.get(path) ?? [] };
  });
  const duplicateGroups = [...groups.values()].filter(group => group.locations.length > 1)
    .sort((a, b) => (b.locations.length - 1) * b.declarations.length - (a.locations.length - 1) * a.declarations.length);
  const owners: Record<string, { files: number; bytes: number; declarations: number }> = {};
  for (const sheet of stylesheets) {
    const owner = owners[sheet.owner] ??= { files: 0, bytes: 0, declarations: 0 };
    owner.files++; owner.bytes += sheet.bytes; owner.declarations += sheet.declarations;
  }
  return { scope: "Working-tree source CSS; literal consumer inventory; exact ordered multi-declaration candidates within the same at-rule context. No unused-code or shipped-byte claim.",
    owners, stylesheets, duplicateGroups, unresolvedReferences: unresolved };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(import.meta.dirname, "..");
  const report = auditStylesheetOwnership(root);
  const output = process.argv[2] ?? "tmp/codex/stylesheet-ownership.json";
  mkdirSync(dirname(resolve(root, output)), { recursive: true });
  writeFileSync(resolve(root, output), JSON.stringify(report, null, 2) + "\n");
  console.log(`Stylesheets: ${report.stylesheets.length}; source bytes: ${report.stylesheets.reduce((sum, sheet) => sum + sheet.bytes, 0)}; duplicate candidates: ${report.duplicateGroups.length}.`);
  console.table(report.owners);
  console.log(`Complete consumers, unresolved literal references and duplicate locations: ${output}`);
}
