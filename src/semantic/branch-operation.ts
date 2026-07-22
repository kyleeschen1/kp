export interface KpSemanticBranch<TId extends string = string> {
  readonly id: TId;
  readonly entityIds: readonly string[];
  readonly dependsOnBranchIds: readonly TId[];
}

export interface KpSemanticBranchOperation<TId extends string = string> {
  readonly id: string;
  readonly kind: "semantic-branch-operation";
  readonly authorityId: string;
  readonly branches: readonly KpSemanticBranch<TId>[];
}

export function createKpSemanticBranchOperation<
  const TBranches extends readonly [KpSemanticBranch, ...KpSemanticBranch[]]
>(input: {
  readonly id: string;
  readonly authorityId: string;
  readonly branches: TBranches;
}): KpSemanticBranchOperation<TBranches[number]["id"]> {
  requireText(input.id, "Semantic branch operation id");
  requireText(input.authorityId, `Semantic branch operation ${input.id} authority`);
  const branchIds = new Set<string>();
  const entityIds = new Set<string>();
  for (const [index, branch] of input.branches.entries()) {
    requireText(branch.id, `Semantic branch operation ${input.id} branch ${index} id`);
    if (branchIds.has(branch.id)) {
      throw new Error(`Semantic branch operation ${input.id} duplicates branch ${branch.id}.`);
    }
    branchIds.add(branch.id);
    if (branch.entityIds.length === 0) {
      throw new Error(`Semantic branch ${branch.id} requires at least one entity.`);
    }
    for (const entityId of branch.entityIds) {
      requireText(entityId, `Semantic branch ${branch.id} entity id`);
      if (entityIds.has(entityId)) {
        throw new Error(
          `Semantic branch operation ${input.id} assigns entity ${entityId} more than once.`
        );
      }
      entityIds.add(entityId);
    }
  }
  for (const branch of input.branches) {
    const dependencies = new Set<string>();
    for (const dependencyId of branch.dependsOnBranchIds) {
      if (!branchIds.has(dependencyId)) {
        throw new Error(`Semantic branch ${branch.id} depends on unknown branch ${dependencyId}.`);
      }
      if (dependencyId === branch.id) {
        throw new Error(`Semantic branch ${branch.id} cannot depend on itself.`);
      }
      if (dependencies.has(dependencyId)) {
        throw new Error(`Semantic branch ${branch.id} duplicates dependency ${dependencyId}.`);
      }
      dependencies.add(dependencyId);
    }
  }
  const operation: KpSemanticBranchOperation<TBranches[number]["id"]> = {
    id: input.id,
    kind: "semantic-branch-operation",
    authorityId: input.authorityId,
    branches: input.branches.map((branch) => ({
      id: branch.id,
      entityIds: [...branch.entityIds],
      dependsOnBranchIds: [...branch.dependsOnBranchIds]
    }))
  };
  // Topological ordering is also the cycle check used by every presentation compiler.
  orderedKpSemanticBranches(operation);
  return operation;
}

export function orderedKpSemanticBranches<TId extends string>(
  operation: KpSemanticBranchOperation<TId>
): readonly KpSemanticBranch<TId>[] {
  const pending = new Map(operation.branches.map((branch) => [branch.id, branch]));
  const completed = new Set<TId>();
  const ordered: KpSemanticBranch<TId>[] = [];
  while (pending.size > 0) {
    const ready = operation.branches.filter((branch) =>
      pending.has(branch.id) &&
      branch.dependsOnBranchIds.every((dependencyId) => completed.has(dependencyId))
    );
    if (ready.length === 0) {
      throw new Error(`Semantic branch operation ${operation.id} contains a dependency cycle.`);
    }
    for (const branch of ready) {
      pending.delete(branch.id);
      completed.add(branch.id);
      ordered.push(branch);
    }
  }
  return ordered;
}

function requireText(value: string, label: string): void {
  if (value.trim().length === 0) throw new Error(`${label} must not be empty.`);
}
