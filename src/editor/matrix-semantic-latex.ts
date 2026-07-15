import {
  createKpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatexSegment
} from "../rendering/selector-annotated-latex.ts";

interface MatrixSelector {
  readonly id: string;
  readonly kind?: string | undefined;
  readonly semanticKind?: string | undefined;
  readonly label?: string | undefined;
}

interface MatrixState {
  readonly objectId: string;
  readonly selectors: readonly MatrixSelector[];
}

export function createKpMatrixSelectorAnnotatedLatex(
  state: MatrixState
): KpSelectorAnnotatedLatex | undefined {
  if (!state.objectId.startsWith("expression.generated.linear-algebra.matrix-")) {
    return undefined;
  }
  const entries = state.selectors.filter((selector) => !isArtifact(selector));
  const groups = groupEntries(state, entries);
  if (groups.length === 0) return undefined;
  return createKpSelectorAnnotatedLatex({
    id: `matrix.${state.objectId}`,
    expectedSelectorIds: entries.map((selector) => selector.id),
    segments: groups.flatMap(matrixSegments)
  });
}

export function bindKpMatrixStructuralMotionIds(input: {
  readonly root: HTMLElement;
  readonly states: readonly MatrixState[];
}): Readonly<Record<string, string>> {
  const motionIds: Record<string, string> = {};
  for (const state of input.states) {
    const object = input.root.querySelector<HTMLElement>(
      `[data-kp-editor-equation-object-id="${CSS.escape(state.objectId)}"]`
    );
    if (object === null) continue;
    bind(
      state.selectors.filter((selector) => selector.id.endsWith(".left-bracket")),
      [...object.querySelectorAll<HTMLElement>(".mopen")],
      state.objectId,
      motionIds
    );
    bind(
      state.selectors.filter((selector) => selector.id.endsWith(".right-bracket")),
      [...object.querySelectorAll<HTMLElement>(".mclose")],
      state.objectId,
      motionIds
    );
  }
  return motionIds;
}

function groupEntries(
  state: MatrixState,
  entries: readonly MatrixSelector[]
): readonly (readonly MatrixSelector[])[] {
  const groups = new Map<string, MatrixSelector[]>();
  for (const entry of entries) {
    const name = entry.id.slice(state.objectId.length + 1);
    const key = name.replace(/\.(?:entry\.\d+\.\d+|component\.\d+)$/, "");
    const group = groups.get(key) ?? [];
    group.push(entry);
    groups.set(key, group);
  }
  return [...groups.values()];
}

function matrixSegments(entries: readonly MatrixSelector[]): readonly KpSelectorAnnotatedLatexSegment[] {
  const coordinates = entries.map((entry, index) => {
    const match = entry.id.match(/\.entry\.(\d+)\.(\d+)$/);
    return { entry, row: match === null ? index : Number(match[1]) };
  });
  const segments: KpSelectorAnnotatedLatexSegment[] = [
    { kind: "latex", latex: "\\begin{bmatrix}" }
  ];
  coordinates.forEach(({ entry, row }, index) => {
    const previous = coordinates[index - 1];
    if (previous !== undefined) {
      segments.push({
        kind: "latex",
        latex: row === previous.row ? " & " : " \\\\ "
      });
    }
    if (entry.label === undefined) throw new Error(`Matrix entry ${entry.id} has no label.`);
    segments.push({ kind: "selector", selectorId: entry.id, latex: entry.label });
  });
  segments.push({ kind: "latex", latex: "\\end{bmatrix}" });
  return segments;
}

function bind(
  selectors: readonly MatrixSelector[],
  elements: readonly HTMLElement[],
  stateId: string,
  motionIds: Record<string, string>
): void {
  selectors.forEach((selector, index) => {
    const element = elements[index];
    if (element === undefined) return;
    const motionId = `matrix.${stateId}.${selector.id}`;
    element.dataset["kpMotionId"] = motionId;
    motionIds[selector.id] = motionId;
  });
}

function isArtifact(selector: MatrixSelector): boolean {
  return (selector.semanticKind ?? selector.kind) === "artifact";
}
