import { defineKpSemanticStateDerivation } from
  "../../../src/semantic-state/authoring-derived-definition.ts";
import { compileKpSemanticStateSchema } from
  "../../../src/semantic-state/authoring-schema-compiler.ts";
import {
  kpStateDerived,
  kpStateGroup,
  kpStateOptional,
  kpStateValue
} from "../../../src/semantic-state/authoring-schema.ts";
import { createKpSemanticStateHandleSet } from
  "../../../src/semantic-state/authoring-state-handles.ts";
import { materializeKpSemanticStateInitialSnapshot } from
  "../../../src/semantic-state/authoring-state-materializer.ts";
import { defineKpSemanticStateTransform } from
  "../../../src/semantic-state/authoring-state-transform.ts";
import { evaluateKpSemanticDerivedValue } from
  "../../../src/semantic-state/derived-evaluator.ts";
import {
  compileKpSemanticDerivedGraph,
  KpSemanticDerivedGraphValidationError,
  normalizeKpSemanticDerivedGraphInput
} from "../../../src/semantic-state/derived-graph.ts";

export interface KpLlmShapedTypeRepairCase {
  readonly id: string;
  readonly channel: "typecheck";
  readonly code:
    | "derived-write-not-allowed"
    | "invalid-lifecycle-operation"
    | "value-type-mismatch";
  readonly path: string;
  readonly repair: string;
}

export const kpLlmShapedTypeRepairInventory:
readonly KpLlmShapedTypeRepairCase[] = Object.freeze([
  Object.freeze({
    id: "invalid-value-update",
    channel: "typecheck",
    code: "value-type-mismatch",
    path: "market.supply",
    repair: "Return the declared SupplyCurve value from update."
  }),
  Object.freeze({
    id: "invalid-required-removal",
    channel: "typecheck",
    code: "invalid-lifecycle-operation",
    path: "market.supply",
    repair: "Declare an optional leaf before using remove."
  }),
  Object.freeze({
    id: "invalid-derived-write",
    channel: "typecheck",
    code: "derived-write-not-allowed",
    path: "outcomes.total",
    repair: "Declare a derivation and keep the derived handle read-only."
  })
]);

// These fixed handwritten packets measure surface determinism, not model quality.
export function runKpLlmShapedSemanticStateCorpus() {
  // llm-shaped-authoring:start
  const updateSchema = kpStateGroup({ count: kpStateValue<number>(1) });
  const updateCompiled = compileKpSemanticStateSchema(
    "corpus.valid.update",
    updateSchema
  );
  const updateHandles = createKpSemanticStateHandleSet(updateCompiled);
  const updateInitial = materializeKpSemanticStateInitialSnapshot(
    updateCompiled
  );
  const increment = defineKpSemanticStateTransform({
    compiled: updateCompiled,
    handles: updateHandles,
    id: "increment",
    author(state) {
      state.count.update(previous => previous + 2);
    }
  });
  const updated = increment.apply(updateInitial, "first");

  const optionalSchema = kpStateGroup({
    note: kpStateOptional<string>()
  });
  const optionalCompiled = compileKpSemanticStateSchema(
    "corpus.valid.optional",
    optionalSchema
  );
  const optionalHandles = createKpSemanticStateHandleSet(optionalCompiled);
  const optionalInitial = materializeKpSemanticStateInitialSnapshot(
    optionalCompiled
  );
  const introduce = defineKpSemanticStateTransform({
    compiled: optionalCompiled,
    handles: optionalHandles,
    id: "introduce-note",
    author(state) {
      state.note.introduce("ready");
    }
  });
  const introduced = introduce.apply(optionalInitial, "first");

  const derivedSchema = kpStateGroup({
    left: kpStateValue<number>(3),
    right: kpStateValue<number>(4),
    total: kpStateDerived<number>()
  });
  const derivedCompiled = compileKpSemanticStateSchema(
    "corpus.valid.derived",
    derivedSchema
  );
  const derivedHandles = createKpSemanticStateHandleSet(derivedCompiled);
  const total = defineKpSemanticStateDerivation({
    compiled: derivedCompiled,
    target: derivedHandles.refs.total,
    dependencies: [derivedHandles.refs.left, derivedHandles.refs.right],
    compute: ([left, right]) => left + right
  });
  const derivedInitial = materializeKpSemanticStateInitialSnapshot(
    derivedCompiled,
    { derivations: [total] }
  );
  const derivedGraph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(derivedCompiled, [total])
  );
  const derivedValue = evaluateKpSemanticDerivedValue({
    graph: derivedGraph,
    snapshot: derivedInitial,
    target: derivedHandles.refs.total
  });
  // llm-shaped-authoring:end

  return Object.freeze([
    Object.freeze({
      id: "valid-update",
      status: "accepted",
      value: updated.after.count.read()
    }),
    Object.freeze({
      id: "valid-optional-introduction",
      status: "accepted",
      value: introduced.after.note.read()
    }),
    Object.freeze({
      id: "valid-explicit-derivation",
      status: "accepted",
      value: derivedValue
    }),
    duplicateDefinitionRepair(),
    cycleRepair(),
    missingDefinitionRepair(),
    ...kpLlmShapedTypeRepairInventory
  ]);
}

function duplicateDefinitionRepair() {
  const compiled = compileKpSemanticStateSchema(
    "corpus.invalid.duplicate",
    kpStateGroup({
      base: kpStateValue<number>(2),
      alternate: kpStateValue<number>(3),
      total: kpStateDerived<number>()
    })
  );
  const handles = createKpSemanticStateHandleSet(compiled);
  const first = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.total,
    dependencies: [handles.refs.base],
    compute: ([base]) => base
  });
  const second = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.total,
    dependencies: [handles.refs.alternate],
    compute: ([alternate]) => alternate
  });
  return captureGraphRepair("invalid-duplicate-definition", () =>
    compileKpSemanticDerivedGraph(
      normalizeKpSemanticDerivedGraphInput(compiled, [first, second])
    )
  );
}

function cycleRepair() {
  const compiled = compileKpSemanticStateSchema(
    "corpus.invalid.cycle",
    kpStateGroup({
      first: kpStateDerived<number>(),
      second: kpStateDerived<number>()
    })
  );
  const handles = createKpSemanticStateHandleSet(compiled);
  const first = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.first,
    dependencies: [handles.refs.second],
    compute: ([second]) => second
  });
  const second = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.second,
    dependencies: [handles.refs.first],
    compute: ([firstValue]) => firstValue
  });
  return captureGraphRepair("invalid-derived-cycle", () =>
    compileKpSemanticDerivedGraph(
      normalizeKpSemanticDerivedGraphInput(compiled, [first, second])
    )
  );
}

function missingDefinitionRepair() {
  const compiled = compileKpSemanticStateSchema(
    "corpus.invalid.missing",
    kpStateGroup({
      base: kpStateValue<number>(2),
      declared: kpStateDerived<number>(),
      missing: kpStateDerived<number>()
    })
  );
  const handles = createKpSemanticStateHandleSet(compiled);
  const declared = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.declared,
    dependencies: [handles.refs.base],
    compute: ([base]) => base
  });
  return captureGraphRepair("invalid-missing-definition", () =>
    compileKpSemanticDerivedGraph(
      normalizeKpSemanticDerivedGraphInput(compiled, [declared])
    )
  );
}

function captureGraphRepair(id: string, compile: () => unknown) {
  try {
    compile();
  } catch (error) {
    if (!(error instanceof KpSemanticDerivedGraphValidationError)) throw error;
    const diagnostic = error.diagnostics[0];
    if (diagnostic === undefined) {
      throw new Error(`Corpus case ${id} returned no repair diagnostic.`);
    }
    return Object.freeze({
      id,
      status: "repair",
      channel: "runtime",
      code: diagnostic.code,
      path: diagnostic.targetPath?.join(".") ?? null,
      dependencyPath: diagnostic.dependencyPath?.join(".") ?? null
    });
  }
  throw new Error(`Corpus case ${id} unexpectedly compiled.`);
}
