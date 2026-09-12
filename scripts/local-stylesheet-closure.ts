import { lstatSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, posix } from "node:path";
import postcss from "postcss";

export type StylesheetClosureGap = "missing" | "unsafe-path" | "unsupported" | "cycle" | "collision";
export class StylesheetClosureError extends Error {
  readonly code: StylesheetClosureGap;
  constructor(code: StylesheetClosureGap, message: string) { super(message); this.code = code; }
}
export interface LocalStyleSource {
  readonly root: string;
  readonly path: string;
  readonly output: string;
}

/** Shared edition packaging policy: callers declare entry styles only. */
export function collectFocusCardEditionStyles(repo: string, familyStyle: string): ReadonlyMap<string, Buffer> {
  return collectLocalStylesheetClosure({
    entries: ["experiments/authored-focus-card.css", familyStyle].map(path => ({ root: resolve(repo, "src"), path, output: `styles/${path}` })),
    aliases: { "katex/dist/katex.min.css": { root: resolve(repo, "node_modules/katex/dist"), path: "katex.min.css", output: "katex.min.css" } }
  });
}

/** Build-time packaging only. The compiler still owns semantic publication and
 * the immutable writer still owns byte identity. No external resource fallback. */
export function collectLocalStylesheetClosure(input: {
  readonly entries: readonly LocalStyleSource[];
  readonly aliases?: Readonly<Record<string, LocalStyleSource>>;
}): ReadonlyMap<string, Buffer> {
  const files = new Map<string, Buffer>(), owners = new Map<string, string>(), active = new Set<string>(), parsed = new Set<string>();
  function gap(code: StylesheetClosureGap, message: string): never { throw new StylesheetClosureError(code, message); }
  const bounded = (name: string) => {
    if (!name || isAbsolute(name) || name.includes("\\") || name.split("/").some(p => !p || p === "." || p === ".."))
      gap("unsafe-path", `Expected bounded edition path: ${name}`);
  };
  function visit(source: LocalStyleSource, stylesheet: boolean): void {
    bounded(source.path); bounded(source.output);
    const root = resolve(source.root), path = resolve(root, source.path);
    let current = root;
    for (const part of ["", ...source.path.split("/")]) {
      if (part) current = resolve(current, part);
      const stat = lstatSync(current, { throwIfNoEntry: false });
      if (!stat) gap("missing", `Missing stylesheet dependency: ${current}`);
      if (stat.isSymbolicLink()) gap("unsafe-path", `Stylesheet dependency traverses symlink: ${current}`);
    }
    if (!lstatSync(path).isFile()) gap("unsupported", `Dependency is not a file: ${path}`);
    const key = `${path}\0${source.output}`;
    if (active.has(key)) gap("cycle", `Cyclic stylesheet import: ${source.output}`);
    const owner = owners.get(source.output);
    if (owner && owner !== path) gap("collision", `Conflicting edition dependency: ${source.output}`);
    // Asset byte deduplication cannot discharge a later stylesheet traversal.
    if (files.has(source.output) && (!stylesheet || parsed.has(key))) return;
    owners.set(source.output, path); active.add(key);
    const bytes = readFileSync(path);
    if (!stylesheet) { files.set(source.output, bytes); active.delete(key); return; }
    const css = postcss.parse(bytes.toString("utf8"), { from: path });
    function dependency(href: string, imported: boolean): string {
      if (!imported && (href.startsWith("#") || href.startsWith("data:"))) return href;
      if (!href || /[\\%\s]/.test(href) || href.startsWith("/") || /^[a-z][a-z0-9+.-]*:/i.test(href))
        return gap("unsupported", `Unsupported stylesheet reference: ${href}`);
      const alias = imported && Object.hasOwn(input.aliases ?? {}, href) ? input.aliases![href] : undefined;
      if (alias) {
        visit(alias, true);
        return posix.relative(posix.dirname(source.output), alias.output);
      }
      const local = href.split(/[?#]/)[0]!;
      const sourcePath = relative(root, resolve(dirname(path), local)).split("\\").join("/");
      const output = posix.normalize(posix.join(posix.dirname(source.output), local));
      // Preserve relative layout, but neither source nor edition may escape its root.
      bounded(sourcePath); bounded(output);
      visit({ root, path: sourcePath, output }, imported);
      return href;
    }
    css.walkAtRules("import", rule => {
      const match = /^(?:"([^"]+)"|'([^']+)'|url\(\s*(?:"([^"]+)"|'([^']+)'|([^\s)'";]+))\s*\))(.*)$/is.exec(rule.params);
      if (!match) gap("unsupported", `Unsupported CSS import: ${rule.params}`);
      const href = match![1] ?? match![2] ?? match![3] ?? match![4] ?? match![5]!;
      const resolved = dependency(href, true);
      if (resolved !== href) rule.params = `"${resolved}"${match![6]}`;
    });
    css.walkDecls(declaration => {
      // Skip quoted strings/comments before recognizing url(), so text content
      // that happens to say "url(...)" cannot become a filesystem dependency.
      const value = declaration.value;
      for (let i = 0; i < value.length;) {
        const char = value[i];
        if (char === '"' || char === "'") {
          const quote = char; i++;
          while (i < value.length) { if (value[i] === "\\") i += 2; else if (value[i++] === quote) break; }
          continue;
        }
        if (value.slice(i, i + 2) === "/*") { const end = value.indexOf("*/", i + 2); if (end < 0) gap("unsupported", "Unclosed CSS comment"); i = end + 2; continue; }
        const match = /^url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/i.exec(value.slice(i));
        if (match && (i === 0 || !/[\w-]/.test(value[i - 1]!))) {
          dependency((match[1] ?? match[2] ?? match[3]!).trim(), false); i += match[0].length;
        } else {
          if (/^url\(/i.test(value.slice(i))) gap("unsupported", `Malformed CSS URL: ${value.slice(i)}`);
          i++;
        }
      }
    });
    files.set(source.output, Buffer.from(css.toString())); parsed.add(key); active.delete(key);
  }
  for (const entry of input.entries) visit(entry, true);
  return new Map([...files].sort(([a], [b]) => a.localeCompare(b)));
}
