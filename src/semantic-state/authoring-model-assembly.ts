import {
  defineKpSemanticStateDerivation,
  type KpSemanticStateDependencyTuple,
  type KpSemanticStateDependencyValues,
  type KpSemanticStateDerivationDefinition,
  type KpSemanticStateDerivationDefinitionSource
} from "./authoring-derived-definition.ts";
import {
  compileKpSemanticStateSchema,
  type KpCompiledSemanticStateSchema
} from "./authoring-schema-compiler.ts";
import type {
  KpSemanticStateGroupDescriptor,
  KpSemanticStateMemberMap
} from "./authoring-schema.ts";
import {
  createKpSemanticStateHandleSet,
  type KpDerivedSemanticStateLeafHandle,
  type KpSemanticStateHandleSet,
  type KpSemanticStateHandleTree
} from "./authoring-state-handles.ts";
import { materializeKpSemanticStateInitialSnapshot } from
  "./authoring-state-materializer.ts";
import type { KpAggregateSemanticSnapshot } from "./aggregate-snapshot.ts";
import {
  compileKpSemanticDerivedGraph,
  normalizeKpSemanticDerivedGraphInput,
  type KpSemanticDerivedGraph
} from "./derived-graph.ts";

export interface KpSemanticStateModelDefinitionContext<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
> {
  readonly refs: KpSemanticStateHandleTree<Root>;
  derive<Result, const Dependencies extends KpSemanticStateDependencyTuple>(
    input: {
      readonly target: KpDerivedSemanticStateLeafHandle<Result>;
      readonly dependencies: Dependencies;
      readonly compute: (
        values: KpSemanticStateDependencyValues<Dependencies>
      ) => NoInfer<Result>;
    }
  ): KpSemanticStateDerivationDefinition<Result, Dependencies>;
}

export interface KpSemanticStateModelAssembly<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
> {
  readonly compiled: KpCompiledSemanticStateSchema<Root>;
  readonly handles: KpSemanticStateHandleSet<Root>;
  readonly derivations: readonly KpSemanticStateDerivationDefinitionSource[];
  readonly graph: KpSemanticDerivedGraph;
  readonly initial: KpAggregateSemanticSnapshot;
}

/** Internal orchestration only: the existing aggregate and graph own truth. */
export function assembleKpSemanticStateModel<
  const Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
>(input: {
  readonly namespace: string;
  readonly schema: Root;
  readonly derive?: (
    context: KpSemanticStateModelDefinitionContext<Root>
  ) => readonly KpSemanticStateDerivationDefinitionSource[];
}): KpSemanticStateModelAssembly<Root> {
  const compiled = compileKpSemanticStateSchema(input.namespace, input.schema);
  const handles = createKpSemanticStateHandleSet(compiled);
  const context = Object.freeze<KpSemanticStateModelDefinitionContext<Root>>({
    refs: handles.refs,
    derive: definition => defineKpSemanticStateDerivation({
      ...definition, compiled
    })
  });
  const derivations = Object.freeze([...(input.derive?.(context) ?? [])]);
  // Validate the complete graph before materialization or any compute call;
  // the graph's path-bearing diagnostics remain the authority for bad edges.
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(compiled, derivations)
  );
  const initial = materializeKpSemanticStateInitialSnapshot(compiled, {
    derivations
  });
  return Object.freeze({ compiled, handles, derivations, graph, initial });
}
