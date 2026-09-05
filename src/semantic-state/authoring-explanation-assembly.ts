import type { KpSemanticStateModelAssembly } from "./authoring-model-assembly.ts";
import type { KpAggregateSemanticSnapshot } from "./aggregate-snapshot.ts";
import type {
  KpSemanticStateGroupDescriptor, KpSemanticStateMemberMap
} from "./authoring-schema.ts";
import {
  defineKpSemanticStateFamily,
  type KpSemanticStateFamilyApplicationRecord,
  type KpSemanticStateFamilyDefinition,
  type KpSemanticStateFamilyDefinitionDeclaration,
  type KpSemanticStateTransitionCapabilitySource
} from "./state-family-definition.ts";
import {
  declareKpSemanticStateComposition,
  declareKpSemanticStateCompositionMember,
  type KpSemanticStateCompositionMemberDeclaration,
  type KpSemanticStateCompositionNodeDeclaration
} from "./state-family-composition-declaration.ts";
import { validateKpSemanticStateComposition } from
  "./state-family-composition-validation.ts";
import { bindKpSemanticStateCompositionGraph, preflightKpSemanticStateComposition } from
  "./state-family-composition-preflight.ts";
import { compileKpSemanticStateComposition } from
  "./state-family-composition-compiler.ts";
import {
  assembleKpSemanticStateCompositionEndpointChain,
  bindKpSemanticStateCompositionEndpoint,
  type KpSemanticStateCompositionAppliedMember,
  type KpSemanticStateCompositionEndpointBinding
} from "./state-family-composition-endpoints.ts";
import {
  createKpSemanticStateCompositionHandleSet,
  type KpSemanticStateCompositionMemberHandle
} from "./state-family-composition-handles.ts";
import {
  bindKpSemanticStateCompositionMemberEvaluator,
  type KpSemanticStateCompositionMemberEvaluatorBinding
} from "./state-family-composition-member-resolver.ts";

export function defineKpSemanticStateModelFamily<
  const Members extends KpSemanticStateMemberMap,
  FamilyParameters,
  const Transitions extends readonly KpSemanticStateTransitionCapabilitySource[]
>(
  model: KpSemanticStateModelAssembly<KpSemanticStateGroupDescriptor<Members>>,
  input: Omit<Parameters<typeof defineKpSemanticStateFamily<
    Members, FamilyParameters, Transitions
  >>[0], "compiled" | "handles">
) {
  return defineKpSemanticStateFamily({
    ...input, compiled: model.compiled, handles: model.handles
  });
}

export interface KpSemanticStateBoundExplanationMember<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>,
  FamilyParameters = unknown,
  Name extends string = string
> {
  readonly member: KpSemanticStateCompositionMemberDeclaration<FamilyParameters, Name>;
  readonly definition: KpSemanticStateFamilyDefinitionDeclaration;
  readonly endpoint: KpSemanticStateCompositionEndpointBinding<Root>;
  bindEvaluator(
    handle: KpSemanticStateCompositionMemberHandle<FamilyParameters>,
    applied: KpSemanticStateCompositionAppliedMember<Root>
  ): KpSemanticStateCompositionMemberEvaluatorBinding<Root>;
}

export function bindKpSemanticStateExplanationMember<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>,
  FamilyParameters,
  Transitions extends readonly KpSemanticStateTransitionCapabilitySource[],
  const Name extends string
>(input: {
  readonly name: Name;
  readonly sourceId: string;
  readonly definition: KpSemanticStateFamilyDefinition<Root, FamilyParameters, Transitions>;
  readonly application: KpSemanticStateFamilyApplicationRecord<NoInfer<FamilyParameters>>;
}): KpSemanticStateBoundExplanationMember<Root, FamilyParameters, Name> {
  return Object.freeze<KpSemanticStateBoundExplanationMember<Root, FamilyParameters, Name>>({
    member: declareKpSemanticStateCompositionMember(input),
    definition: input.definition.declaration,
    endpoint: bindKpSemanticStateCompositionEndpoint(input),
    bindEvaluator(handle, applied) {
      return bindKpSemanticStateCompositionMemberEvaluator({
        definition: input.definition, handle, applied
      });
    }
  });
}

/** Named author structure is retained; no generic update or inferred motion. */
export function assembleKpSemanticStateExplanation<
  const Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>,
  const Node extends KpSemanticStateCompositionNodeDeclaration
>(input: {
  readonly model: KpSemanticStateModelAssembly<Root>;
  readonly localId: string;
  readonly sourceId: string;
  readonly root: Node;
  readonly members: readonly KpSemanticStateBoundExplanationMember<Root>[];
  readonly base?: KpAggregateSemanticSnapshot;
}) {
  const { model } = input;
  const base = input.base ?? model.initial;
  const members = Object.freeze([...input.members]);
  // A family may have several applications. Only identical declaration objects
  // deduplicate; conflicting definitions with the same ID still fail validation.
  const definitions = [...new Set(members.map(member => member.definition))];
  const declaration = declareKpSemanticStateComposition({
    namespace: model.compiled.namespace, localId: input.localId,
    sourceId: input.sourceId, root: input.root
  });
  const validated = validateKpSemanticStateComposition({
    identities: model.compiled.identityScope, declaration, definitions
  });
  const preflight = preflightKpSemanticStateComposition({
    composition: validated, base,
    graphBindings: definitions.map(definition => bindKpSemanticStateCompositionGraph({
      definitionId: definition.id, graph: model.graph
    }))
  });
  const composition = compileKpSemanticStateComposition({
    identities: model.compiled.identityScope, preflight
  });
  const endpointBindings = Object.freeze(members.map(member => member.endpoint));
  // Endpoint binding validation and all preflight diagnostics precede author
  // callbacks; graph authority is required even for the retained independent pair.
  const chain = assembleKpSemanticStateCompositionEndpointChain({
    composition, base, bindings: endpointBindings, graph: model.graph
  });
  const handles = createKpSemanticStateCompositionHandleSet(composition);
  return Object.freeze({
    model, members, declaration, validated, preflight, composition,
    endpointBindings, chain, handles
  });
}
