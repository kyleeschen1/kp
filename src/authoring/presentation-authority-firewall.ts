export type KpForbiddenPresentationAuthority =
  | "accessibility"
  | "backend"
  | "dom"
  | "export"
  | "geometry"
  | "math-truth"
  | "renderer"
  | "style"
  | "timing";

export interface KpPresentationAuthorityFirewallIssue {
  readonly path: string;
  readonly key: string;
  readonly authority: KpForbiddenPresentationAuthority;
  readonly message: string;
}

const forbiddenKeys = new Map<string, KpForbiddenPresentationAuthority>();

register("dom", [
  "aria",
  "attribute",
  "attributes",
  "class",
  "className",
  "dataAttributes",
  "dataset",
  "document",
  "dom",
  "domFragment",
  "element",
  "elements",
  "eventHandler",
  "eventHandlers",
  "fragment",
  "fragments",
  "html",
  "htmlFragment",
  "markup",
  "node",
  "nodes",
  "querySelector",
  "selector",
  "selectorId",
  "selectors",
  "shadowRoot",
  "tabIndex",
  "template"
]);
register("math-truth", [
  "equationText",
  "expression",
  "expressionText",
  "formula",
  "latex",
  "math",
  "mathematics",
  "mathml",
  "sourceLatex",
  "sourceMath",
  "targetLatex",
  "targetMath",
  "targetMathematics",
  "targetMathTruth",
  "mathTruth"
]);
register("geometry", [
  "baseline",
  "bounds",
  "breakpoint",
  "coordinates",
  "geometry",
  "geometryPlan",
  "height",
  "layout",
  "layoutHint",
  "layoutPlan",
  "mediaQuery",
  "motionPath",
  "path",
  "pixels",
  "position",
  "rect",
  "rotate",
  "rotation",
  "scale",
  "transform",
  "translate",
  "trajectory",
  "viewBox",
  "viewport",
  "width",
  "x",
  "y",
  "z"
]);
register("timing", [
  "animationFrame",
  "animation",
  "bezier",
  "clock",
  "delay",
  "delayMs",
  "duration",
  "durationMs",
  "easing",
  "endMs",
  "framePlan",
  "keyframe",
  "keyframes",
  "motionPlan",
  "motionPrimitive",
  "motion",
  "motionTiming",
  "primitiveId",
  "spring",
  "staggerMs",
  "startMs",
  "timeline",
  "timing",
  "timingTable",
  "schedule",
  "schedulePlan",
  "operationSchedule"
]);
register("style", [
  "color",
  "computedStyle",
  "css",
  "cssText",
  "fill",
  "filter",
  "font",
  "fontFamily",
  "fontSize",
  "inlineStyle",
  "opacity",
  "shadow",
  "stroke",
  "style",
  "styles",
  "styleRecipe",
  "styleTokens",
  "typography",
  "presentation",
  "presentationHint",
  "presentationPlan",
  "presentationRecipe",
  "visual",
  "visualHint",
  "visualRecipe",
  "zIndex"
]);
register("renderer", [
  "backendPlan",
  "canvas",
  "glyph",
  "glyphs",
  "materialLayer",
  "materialPlan",
  "paint",
  "paintPlan",
  "renderMode",
  "renderer",
  "rendererMode",
  "rendering",
  "renderingHints",
  "renderTarget",
  "shader",
  "svg",
  "svgPath",
  "visualAtom",
  "visualAtoms",
  "visualFragments",
  "webgl"
]);
register("accessibility", [
  "accessibility",
  "accessibilityMarkup",
  "cloze",
  "focus",
  "interaction",
  "keyboard",
  "role"
]);
register("export", [
  "export",
  "exportCode",
  "exportTarget",
  "iframe",
  "serializationCode",
  "staticStep"
]);
register("backend", [
  "backend",
  "backendConfig",
  "backendInstruction",
  "backendInstructions"
]);

/**
 * Provider and durable construction data share this deny boundary because
 * either one would become a second presentation authority if visual recipes
 * could be smuggled through aliases or nested extension objects.
 */
export function findKpForbiddenPresentationAuthority(
  value: unknown
): readonly KpPresentationAuthorityFirewallIssue[] {
  const issues: KpPresentationAuthorityFirewallIssue[] = [];
  visit(value, "$", issues, new WeakSet<object>());
  return Object.freeze(issues);
}

function visit(
  value: unknown,
  path: string,
  issues: KpPresentationAuthorityFirewallIssue[],
  visited: WeakSet<object>
): void {
  if (typeof value !== "object" || value === null) return;
  if (visited.has(value)) return;
  visited.add(value);
  if (Array.isArray(value)) {
    value.forEach((child, index) =>
      visit(child, `${path}[${index}]`, issues, visited)
    );
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    const authority = forbiddenKeys.get(normalize(key));
    if (authority !== undefined) {
      issues.push(Object.freeze({
        path: `${path}.${key}`,
        key,
        authority,
        message:
          `${key} would give durable or provider-authored data ` +
          `${authority} authority.`
      }));
    }
    visit(child, `${path}.${key}`, issues, visited);
  }
}

function register(
  authority: KpForbiddenPresentationAuthority,
  keys: readonly string[]
): void {
  for (const key of keys) forbiddenKeys.set(normalize(key), authority);
}

function normalize(key: string): string {
  return key.replace(/[^a-z0-9]/gi, "").toLowerCase();
}
