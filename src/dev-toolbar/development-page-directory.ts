import {
  defineKpDevelopmentPage,
  kpDevelopmentPageGroups,
  type KpDevelopmentPageDescriptor,
  type KpDevelopmentPageGroup
} from "./development-page-descriptor.ts";

export const kpDevelopmentPageGroupLabels:
  Readonly<Record<KpDevelopmentPageGroup, string>> = Object.freeze({
    studio: "Studio",
    tutorials: "Tutorials",
    readers: "Readers",
    diagnostics: "Diagnostics"
  });

export const kpDevelopmentPages: readonly KpDevelopmentPageDescriptor[] =
  Object.freeze([
    page("studio.catalogue", "Animation catalogue", "studio", "/", ["view"]),
    page("studio.editor", "Animation editor", "studio", "/?view=editor"),
    page("studio.dashboard", "Project dashboard", "studio", "/?view=dashboard"),
    page(
      "studio.animation-library-host",
      "Animation library host",
      "studio",
      "/?view=animation-library-host"
    ),
    page(
      "studio.animation-workbench",
      "Animation workbench",
      "studio",
      "/?view=animation-workbench"
    ),
    page("tutorial.ftc", "FTC tutorial", "tutorials", "/?view=ftc-tutorial"),
    page(
      "tutorial.linear-equation-concept",
      "Linear equation concept room",
      "tutorials",
      "/concepts/mathematics/linear-equations/solve-with-balance"
    ),
    page(
      "tutorial.economics-demand-shift",
      "Economics · demand shift",
      "tutorials",
      "/tutorials/economics/demand-shift/"
    ),
    page(
      "tutorial.algebra-fraction-composition",
      "Algebra · fraction composition",
      "tutorials",
      "/tutorials/algebra/fraction-composition/"
    ),
    page(
      "tutorial.lisp-function-application",
      "Programming · Lisp function application",
      "tutorials",
      "/tutorials/programming/lisp-function-application/"
    ),
    page(
      "tutorial.scheme-factorial",
      "Programming · Scheme factorial",
      "tutorials",
      "/tutorials/programming/scheme-factorial/"
    ),
    page(
      "tutorial.public-typescript-free-shipping",
      "Public · TypeScript free shipping",
      "tutorials",
      "/learn/code/free-shipping/"
    ),
    page(
      "tutorial.public-fraction-composition",
      "Public · Fraction composition",
      "tutorials",
      "/learn/math/fraction-composition/"
    ),
    page(
      "tutorial.public-normal-matrices",
      "Public · Normal matrix proof memory",
      "tutorials",
      "/learn/math/normal-matrices/"
    ),
    page("reader.solve-x", "Solve x", "readers", "/reader/solve-x/"),
    page(
      "reader.generated-solve-x",
      "Verified generated solve",
      "readers",
      "/reader/generated-solve-x/"
    ),
    page(
      "reader.solve-x-teacher-zero",
      "Solve x · explicit zero",
      "readers",
      "/reader/solve-x/teacher-zero/"
    ),
    page(
      "reader.solve-fractional-linear",
      "Fractional linear equation",
      "readers",
      "/reader/solve-fractional-linear/"
    ),
    page(
      "reader.divide-both-sides",
      "Divide both sides",
      "readers",
      "/reader/divide-both-sides/"
    ),
    page(
      "reader.split-merge-fractions",
      "Split and merge fractions",
      "readers",
      "/reader/split-merge-fractions/"
    ),
    page(
      "reader.radical-succession",
      "Half power to square root",
      "readers",
      "/reader/radical-succession/"
    ),
    page(
      "reader.fraction-composition",
      "Distribute and solve with a fraction",
      "readers",
      "/reader/fraction-composition/"
    ),
    page(
      "reader.foldable-distribution",
      "Distribute and collect like terms",
      "readers",
      "/reader/foldable-distribution/"
    ),
    page(
      "reader.fractional-transfer",
      "Fractional transfer comparison",
      "readers",
      "/reader/fractional-transfer/"
    ),
    page(
      "reader.distribution-area",
      "Distribution and area",
      "readers",
      "/reader/distribution-area/"
    ),
    page(
      "reader.quadratic-branching",
      "Quadratic branching",
      "readers",
      "/reader/quadratic-branching/"
    ),
    page(
      "diagnostic.canonical-animation-review",
      "Canonical animation review",
      "diagnostics",
      "/canonical-animation-review.html"
    ),
    page(
      "diagnostic.glyph-reconciliation",
      "Glyph reconciliation experiment",
      "diagnostics",
      "/glyph-reconciliation-experiment.html"
    )
  ]);

export function groupKpDevelopmentPages(): ReadonlyMap<
  KpDevelopmentPageGroup,
  readonly KpDevelopmentPageDescriptor[]
> {
  return new Map(kpDevelopmentPageGroups.map((group) => [
    group,
    Object.freeze(kpDevelopmentPages.filter((page) => page.group === group))
  ]));
}

function page(
  id: string,
  label: string,
  group: KpDevelopmentPageGroup,
  href: string,
  absentQuery?: readonly string[]
): KpDevelopmentPageDescriptor {
  return defineKpDevelopmentPage({
    id,
    label,
    group,
    href,
    ...(absentQuery === undefined ? {} : { absentQuery })
  });
}
