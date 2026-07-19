import {
  createConceptDraft,
  defineCapability,
  defineConceptScope,
  defineProviderRef
} from "../../../../src/authoring/public-api.ts";

const equationCapability = defineCapability({
  id: "kp.equation",
  major: 1
});
const exactLinearProblems = defineProviderRef({
  id: "linear-problems.exact-rational",
  protocol: "linear-problem.v1",
  version: "1.0.0"
});
const scope = defineConceptScope({
  capabilities: [equationCapability],
  providers: [exactLinearProblems]
});

export const solveWithBalanceConcept = createConceptDraft({
  schemaVersion: "kp.concept-manifest.v1",
  conceptId: "mathematics.linear-equations.solve-with-balance",
  version: "1.0.0",
  title: "Solve a linear equation",
  modes: ["watch", "touch", "ask", "review"],
  projections: ["symbolic", "balance"],
  semanticRefs: [
    { id: "equation.initial", kind: "equation" },
    { id: "term.two-x", kind: "term" },
    { id: "term.add-three", kind: "term" },
    { id: "term.eight", kind: "term" },
    { id: "operation.subtract-three", kind: "operation" },
    { id: "equation.after-subtract", kind: "equation" },
    { id: "operation.divide-two", kind: "operation" },
    { id: "equation.solved", kind: "equation" },
    { id: "diagram.balance", kind: "diagram" }
  ],
  checkpoints: [
    {
      id: "start",
      title: "Keep both sides equal",
      explanation: "Start with 2x + 3 = 8. Whatever changes on one side must also change on the other.",
      progressPermille: 0,
      semanticRefs: ["equation.initial", "term.two-x", "term.add-three", "term.eight", "diagram.balance"]
    },
    {
      id: "subtract-three",
      title: "Remove the added three",
      explanation: "Subtract 3 from both sides. The +3 and -3 cancel, while equality stays balanced.",
      progressPermille: 400,
      semanticRefs: ["operation.subtract-three", "equation.after-subtract", "diagram.balance"]
    },
    {
      id: "divide-two",
      title: "Reveal one x",
      explanation: "Divide both sides by 2. Two copies of x become one, and 5 becomes 5/2.",
      progressPermille: 750,
      semanticRefs: ["operation.divide-two", "equation.solved", "diagram.balance"]
    },
    {
      id: "solved",
      title: "Read the solution",
      explanation: "The equation now says x = 5/2. Substitution confirms that 2(5/2) + 3 = 8.",
      progressPermille: 1000,
      semanticRefs: ["equation.solved"]
    }
  ],
  capabilities: [scope.capability(equationCapability)],
  providers: [scope.provider(exactLinearProblems)],
  route: {
    canonicalPath: "/concepts/mathematics/linear-equations/solve-with-balance",
    legacyAliases: []
  },
  review: {
    title: "Solve 2x + 3 = 8",
    summary: "Preserve equality as you subtract three and divide by two.",
    searchableText: "solve 2x + 3 = 8 subtract 3 from both sides divide both sides by 2 x = 5/2 linear equation balance",
    checkpointAnchors: true
  },
  provenance: {
    sourcePath: "content/mathematics/linear-equations/solve-with-balance/concept.ts",
    authoredBy: "human",
    authoredAt: "2026-07-19T00:00:00.000Z",
    compilerVersion: "1.0.0"
  },
  publicationStatus: "draft"
});
