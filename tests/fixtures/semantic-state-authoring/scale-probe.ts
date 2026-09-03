import {
  defineKpSemanticStateDerivation,
  type KpSemanticStateDerivationDefinitionSource
} from "../../../src/semantic-state/authoring-derived-definition.ts";
import { compileKpSemanticStateSchema } from
  "../../../src/semantic-state/authoring-schema-compiler.ts";
import {
  kpStateDerived,
  kpStateGroup,
  kpStateValue,
  type KpSemanticStateDerivedDescriptor,
  type KpSemanticStateGroupDescriptor,
  type KpSemanticStateValueDescriptor
} from "../../../src/semantic-state/authoring-schema.ts";
import {
  createKpSemanticStateHandleSet,
  type KpDerivedSemanticStateLeafHandle,
  type KpSemanticStateLeafHandle
} from "../../../src/semantic-state/authoring-state-handles.ts";
import { materializeKpSemanticStateInitialSnapshot } from
  "../../../src/semantic-state/authoring-state-materializer.ts";
import { defineKpSemanticStateTransform } from
  "../../../src/semantic-state/authoring-state-transform.ts";
import { createKpSemanticDerivedValueCache } from
  "../../../src/semantic-state/derived-cache.ts";
import {
  compileKpSemanticDerivedGraph,
  normalizeKpSemanticDerivedGraphInput
} from "../../../src/semantic-state/derived-graph.ts";
import type { KpAggregateSemanticSnapshot } from
  "../../../src/semantic-state/aggregate-snapshot.ts";

const CHAIN_COUNT = 8;
const CONCRETE_PER_CHAIN = 16;
const DERIVED_PER_CHAIN = 8;
const CHANGE_COUNT = 16;

type ConcreteGroup = KpSemanticStateGroupDescriptor<
  Record<string, KpSemanticStateValueDescriptor<number>>
>;
type DerivedGroup = KpSemanticStateGroupDescriptor<
  Record<string, KpSemanticStateDerivedDescriptor<number>>
>;

export interface KpSemanticStateScaleProbeClock {
  readonly now: () => number;
  readonly memoryBytes: () => number;
}

export function runKpSemanticStateScaleProbe(
  clock: KpSemanticStateScaleProbeClock = {
    now: () => 0,
    memoryBytes: () => 0
  }
) {
  const startedAt = clock.now();
  const startedMemory = clock.memoryBytes();
  const concreteGroups: Record<string, ConcreteGroup> = {};
  const derivedGroups: Record<string, DerivedGroup> = {};

  for (let chainIndex = 0; chainIndex < CHAIN_COUNT; chainIndex += 1) {
    const concreteMembers:
      Record<string, KpSemanticStateValueDescriptor<number>> = {};
    const derivedMembers:
      Record<string, KpSemanticStateDerivedDescriptor<number>> = {};
    for (let leafIndex = 0; leafIndex < CONCRETE_PER_CHAIN; leafIndex += 1) {
      concreteMembers[valueKey(leafIndex)] = kpStateValue(
        chainIndex * 100 + leafIndex
      );
    }
    for (let depth = 0; depth < DERIVED_PER_CHAIN; depth += 1) {
      derivedMembers[derivedKey(depth)] = kpStateDerived<number>();
    }
    concreteGroups[chainKey(chainIndex)] = kpStateGroup(concreteMembers);
    derivedGroups[chainKey(chainIndex)] = kpStateGroup(derivedMembers);
  }

  const schema = kpStateGroup({
    concrete: kpStateGroup(concreteGroups),
    derived: kpStateGroup(derivedGroups)
  });
  const compiled = compileKpSemanticStateSchema(
    "probe.semantic-state.scale",
    schema
  );
  const handles = createKpSemanticStateHandleSet(compiled);
  const definitions: KpSemanticStateDerivationDefinitionSource[] = [];
  const terminals: KpDerivedSemanticStateLeafHandle<number>[] = [];
  const computeCalls = Array.from({ length: CHAIN_COUNT }, () => 0);

  for (let chainIndex = 0; chainIndex < CHAIN_COUNT; chainIndex += 1) {
    const key = chainKey(chainIndex);
    const concrete = requireEntry(handles.refs.concrete[key], key);
    const derived = requireEntry(handles.refs.derived[key], key);
    const rootDependencies: KpSemanticStateLeafHandle<number>[] = [];
    for (let leafIndex = 0; leafIndex < CONCRETE_PER_CHAIN; leafIndex += 1) {
      rootDependencies.push(requireEntry(
        concrete[valueKey(leafIndex)],
        `${key}.${valueKey(leafIndex)}`
      ));
    }
    const rootTarget = requireEntry(derived[derivedKey(0)], `${key}.derived00`);
    const root = defineKpSemanticStateDerivation({
      compiled,
      target: rootTarget,
      dependencies: rootDependencies,
      compute: (values) => {
        computeCalls[chainIndex] = requireEntry(
          computeCalls[chainIndex],
          `computeCalls.${chainIndex}`
        ) + 1;
        return values.reduce((sum, value) => sum + value, 0);
      }
    });
    definitions.push(root);
    let previous: KpDerivedSemanticStateLeafHandle<number> = rootTarget;

    for (let depth = 1; depth < DERIVED_PER_CHAIN; depth += 1) {
      const target = requireEntry(
        derived[derivedKey(depth)],
        `${key}.${derivedKey(depth)}`
      );
      const definition = defineKpSemanticStateDerivation({
        compiled,
        target,
        dependencies: [previous],
        compute: ([value]) => {
          computeCalls[chainIndex] = requireEntry(
            computeCalls[chainIndex],
            `computeCalls.${chainIndex}`
          ) + 1;
          return value + depth;
        }
      });
      definitions.push(definition);
      previous = target;
    }
    terminals.push(previous);
  }

  const initial = materializeKpSemanticStateInitialSnapshot(compiled, {
    derivations: definitions
  });
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(compiled, definitions)
  );
  const snapshots: KpAggregateSemanticSnapshot[] = [initial];
  const sharedEntityStoresPerChange: number[] = [];
  const sharedBindingsPerChange: number[] = [];
  const sharedDerivedBindingsPerChange: number[] = [];
  let operationCount = 0;

  for (let changeIndex = 0; changeIndex < CHANGE_COUNT; changeIndex += 1) {
    const before = requireEntry(snapshots.at(-1), "latest snapshot");
    const changedChain = changeIndex % (CHAIN_COUNT - 1);
    const changedLeaf = Math.floor(changeIndex / (CHAIN_COUNT - 1));
    const key = chainKey(changedChain);
    const leaf = valueKey(changedLeaf);
    const revise = defineKpSemanticStateTransform({
      compiled,
      handles,
      id: `revise-${key}-${leaf}`,
      author(state) {
        const group = requireEntry(state.concrete[key], key);
        requireEntry(group[leaf], `${key}.${leaf}`)
          .update(previous => previous + 1);
      }
    });
    const commit = revise.apply(before, "first").commit;
    operationCount += commit.journal.length;
    sharedEntityStoresPerChange.push(sharedCount(
      before.entityStores,
      commit.after.entityStores
    ));
    sharedBindingsPerChange.push(sharedCount(
      before.bindings,
      commit.after.bindings
    ));
    sharedDerivedBindingsPerChange.push(sharedCount(
      before.derivedBindings,
      commit.after.derivedBindings
    ));
    snapshots.push(commit.after);
  }

  const cache = createKpSemanticDerivedValueCache();
  const initialTerminalValues = terminals.map(target => cache.evaluate({
    graph,
    snapshot: initial,
    target
  }));
  const finalSnapshot = requireEntry(snapshots.at(-1), "final snapshot");
  const finalTerminalValues = terminals.map(target => cache.evaluate({
    graph,
    snapshot: finalSnapshot,
    target
  }));
  const finishedMemory = clock.memoryBytes();
  const finishedAt = clock.now();

  return Object.freeze({
    counts: Object.freeze({
      concreteLeaves: compiled.leaves.filter(
        ({ descriptor }) => descriptor.kind === "required-value"
      ).length,
      derivedLeaves: compiled.leaves.filter(
        ({ descriptor }) => descriptor.kind === "derived-value"
      ).length,
      graphDefinitions: graph.input.definitions.length,
      graphEdges: graph.input.edges.length,
      changes: snapshots.length - 1,
      operations: operationCount,
      snapshots: snapshots.length
    }),
    sharing: Object.freeze({
      entityStoresPerChange: Object.freeze(sharedEntityStoresPerChange),
      bindingsPerChange: Object.freeze(sharedBindingsPerChange),
      derivedBindingsPerChange:
        Object.freeze(sharedDerivedBindingsPerChange)
    }),
    evaluation: Object.freeze({
      initialTerminalValues: Object.freeze(initialTerminalValues),
      finalTerminalValues: Object.freeze(finalTerminalValues),
      computeCallsByChain: Object.freeze(computeCalls),
      cache: cache.inspect()
    }),
    advisory: Object.freeze({
      elapsedMilliseconds: finishedAt - startedAt,
      memoryDeltaBytes: finishedMemory - startedMemory
    })
  });
}

function chainKey(index: number): string {
  return `chain${String(index).padStart(2, "0")}`;
}

function valueKey(index: number): string {
  return `value${String(index).padStart(2, "0")}`;
}

function derivedKey(index: number): string {
  return `derived${String(index).padStart(2, "0")}`;
}

function requireEntry<Value>(
  value: Value | undefined,
  path: string
): Value {
  if (value === undefined) throw new Error(`Missing scale entry ${path}.`);
  return value;
}

function sharedCount<Value>(
  before: readonly Value[],
  after: readonly Value[]
): number {
  const previous = new Set(before);
  return after.filter(value => previous.has(value)).length;
}
