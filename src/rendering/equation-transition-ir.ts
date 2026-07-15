import {
  cloneCorrespondenceMap,
  validateCorrespondenceMap,
  type CorrespondenceMap,
  type SelectorCorrespondenceRelationId
} from "../semantic/correspondence.ts";

export type KpEquationTransitionLifecycleKind =
  | "persist"
  | "role-change"
  | "enter"
  | "exit"
  | "cancel"
  | "merge"
  | "split"
  | "artifact"
  | "focus";

export interface KpEquationTransitionIrSelector {
  readonly id: string;
  readonly kind: "semantic" | "artifact" | "annotation";
  readonly semanticKind?: string | undefined;
  readonly label?: string | undefined;
}

export interface KpEquationTransitionIrState {
  readonly objectId: string;
  readonly latex: string;
  readonly selectors: readonly KpEquationTransitionIrSelector[];
}

export interface KpEquationTransitionIrRelation {
  readonly recordId: string;
  readonly relation: SelectorCorrespondenceRelationId;
  readonly lifecycle: KpEquationTransitionLifecycleKind;
  readonly sourceSelectorIds: readonly string[];
  readonly targetSelectorIds: readonly string[];
  readonly summary: string;
}

export interface KpEquationTransitionIr {
  readonly id: string;
  readonly kind: "equation-transition-ir";
  readonly transformationId: string;
  readonly transformType: string;
  readonly title: string;
  readonly source: readonly KpEquationTransitionIrState[];
  readonly target: readonly KpEquationTransitionIrState[];
  readonly correspondenceMap: CorrespondenceMap;
  readonly relations: readonly KpEquationTransitionIrRelation[];
}

export interface CreateKpEquationTransitionIrInput {
  readonly id: string;
  readonly transformationId: string;
  readonly transformType: string;
  readonly title: string;
  readonly source: readonly KpEquationTransitionIrState[];
  readonly target: readonly KpEquationTransitionIrState[];
  readonly correspondenceMap: CorrespondenceMap;
}

export function createKpEquationTransitionIr(
  input: CreateKpEquationTransitionIrInput
): KpEquationTransitionIr {
  assertNonEmpty(input.id, "Equation transition IR id");
  assertNonEmpty(input.transformationId, `Equation transition IR ${input.id} transformation id`);
  assertNonEmpty(input.transformType, `Equation transition IR ${input.id} transform type`);
  assertNonEmpty(input.title, `Equation transition IR ${input.id} title`);
  if (input.source.length === 0 || input.target.length === 0) {
    throw new Error(`Equation transition IR ${input.id} requires source and target equation states.`);
  }

  const source = input.source.map(cloneState);
  const target = input.target.map(cloneState);
  validateUniqueSelectorIds(input.id, "source", source);
  validateUniqueSelectorIds(input.id, "target", target);

  const correspondenceMap = cloneCorrespondenceMap(input.correspondenceMap);
  const correspondenceIssues = validateCorrespondenceMap(correspondenceMap);
  if (correspondenceIssues.length > 0) {
    throw new Error(
      `Equation transition IR ${input.id} has invalid correspondence: ${correspondenceIssues[0]!.message}`
    );
  }
  validateCorrespondenceClosure(input.id, correspondenceMap, source, target);

  return {
    id: input.id,
    kind: "equation-transition-ir",
    transformationId: input.transformationId,
    transformType: input.transformType,
    title: input.title,
    source,
    target,
    correspondenceMap,
    relations: correspondenceMap.records.map((record) => ({
      recordId: record.id,
      relation: record.relation,
      lifecycle: lifecycleForRelation(record.relation),
      sourceSelectorIds: [...record.sourceSelectorIds],
      targetSelectorIds: [...record.targetSelectorIds],
      summary: record.summary
    }))
  };
}

function cloneState(state: KpEquationTransitionIrState): KpEquationTransitionIrState {
  assertNonEmpty(state.objectId, "Equation transition state object id");
  assertNonEmpty(state.latex, `Equation transition state ${state.objectId} LaTeX`);
  return {
    objectId: state.objectId,
    latex: state.latex,
    selectors: state.selectors.map((selector) => ({
      id: selector.id,
      kind: selector.kind,
      ...(selector.semanticKind === undefined ? {} : { semanticKind: selector.semanticKind }),
      ...(selector.label === undefined ? {} : { label: selector.label })
    }))
  };
}

function validateUniqueSelectorIds(
  irId: string,
  side: "source" | "target",
  states: readonly KpEquationTransitionIrState[]
): void {
  const ids = new Set<string>();
  for (const selector of states.flatMap((state) => state.selectors)) {
    assertNonEmpty(selector.id, `Equation transition IR ${irId} ${side} selector id`);
    if (ids.has(selector.id)) {
      throw new Error(`Equation transition IR ${irId} repeats ${side} selector ${selector.id}.`);
    }
    ids.add(selector.id);
  }
}

function validateCorrespondenceClosure(
  irId: string,
  map: CorrespondenceMap,
  source: readonly KpEquationTransitionIrState[],
  target: readonly KpEquationTransitionIrState[]
): void {
  const sourceIds = new Set(source.flatMap((state) => state.selectors.map((selector) => selector.id)));
  const targetIds = new Set(target.flatMap((state) => state.selectors.map((selector) => selector.id)));
  for (const record of map.records) {
    for (const selectorId of record.sourceSelectorIds) {
      if (!sourceIds.has(selectorId)) {
        throw new Error(`Equation transition IR ${irId} correspondence references missing source selector ${selectorId}.`);
      }
    }
    for (const selectorId of record.targetSelectorIds) {
      if (!targetIds.has(selectorId)) {
        throw new Error(`Equation transition IR ${irId} correspondence references missing target selector ${selectorId}.`);
      }
    }
  }
}

function lifecycleForRelation(
  relation: SelectorCorrespondenceRelationId
): KpEquationTransitionLifecycleKind {
  switch (relation) {
    case "identity": return "persist";
    case "role-change": return "role-change";
    case "introduction": return "enter";
    case "removal": return "exit";
    case "cancelation": return "cancel";
    case "fan-in": return "merge";
    case "fan-out": return "split";
    case "artifact": return "artifact";
    case "focus": return "focus";
  }
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) throw new Error(`${label} must not be empty.`);
}
