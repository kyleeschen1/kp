export const kpDevelopmentPageGroups = [
  "studio",
  "tutorials",
  "readers",
  "diagnostics"
] as const;

export type KpDevelopmentPageGroup =
  typeof kpDevelopmentPageGroups[number];

export interface KpDevelopmentPageDescriptor {
  readonly id: string;
  readonly label: string;
  readonly group: KpDevelopmentPageGroup;
  readonly href: string;
  /**
   * Query keys that must be absent for this page to be current. This lets the
   * root catalogue coexist with query-addressed internal views while ordinary
   * article parameters remain incidental to page identity.
   */
  readonly absentQuery?: readonly string[];
}

export interface KpDevelopmentPageLocation {
  readonly pathname: string;
  readonly search: string;
}

export function defineKpDevelopmentPage(
  input: KpDevelopmentPageDescriptor
): KpDevelopmentPageDescriptor {
  if (!/^[a-z][a-z0-9.-]*$/u.test(input.id)) {
    throw new Error(`Invalid development page ID ${input.id}.`);
  }
  if (input.label.trim() === "") {
    throw new Error(`Development page ${input.id} must have a label.`);
  }
  if (!kpDevelopmentPageGroups.includes(input.group)) {
    throw new Error(`Development page ${input.id} has an invalid group.`);
  }
  const url = readLocalUrl(input.href, input.id);
  if (url.hash !== "") {
    throw new Error(`Development page ${input.id} cannot use a fragment.`);
  }
  const absentQuery = input.absentQuery?.map((name) => name.trim()) ?? [];
  if (
    absentQuery.some((name) => name === "")
    || new Set(absentQuery).size !== absentQuery.length
    || absentQuery.some((name) => url.searchParams.has(name))
  ) {
    throw new Error(`Development page ${input.id} has invalid absent query keys.`);
  }
  return Object.freeze({
    id: input.id,
    label: input.label.trim(),
    group: input.group,
    href: `${url.pathname}${url.search}`,
    ...(absentQuery.length === 0
      ? {}
      : { absentQuery: Object.freeze(absentQuery) })
  });
}

export function isKpDevelopmentPageCurrent(
  descriptor: KpDevelopmentPageDescriptor,
  location: KpDevelopmentPageLocation
): boolean {
  const expected = readLocalUrl(descriptor.href, descriptor.id);
  if (normalizePathname(expected.pathname) !==
    normalizePathname(location.pathname)) return false;
  const actualQuery = new URLSearchParams(location.search);
  for (const [name, value] of expected.searchParams) {
    if (actualQuery.get(name) !== value) return false;
  }
  return descriptor.absentQuery?.every((name) => !actualQuery.has(name))
    ?? true;
}

function readLocalUrl(href: string, id: string): URL {
  if (!href.startsWith("/") || href.startsWith("//")) {
    throw new Error(`Development page ${id} must use a root-relative href.`);
  }
  const url = new URL(href, "https://kp.invalid");
  if (url.origin !== "https://kp.invalid") {
    throw new Error(`Development page ${id} must stay on the KP origin.`);
  }
  return url;
}

function normalizePathname(pathname: string): string {
  if (pathname === "/" || pathname.endsWith(".html")) return pathname;
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}
