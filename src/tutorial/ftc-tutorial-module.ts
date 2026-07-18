import type { KpArtifactPromotionFacet } from "../animation/artifact-promotion.ts";
import { compileKpTutorialAccessibilityFamily } from "./accessibility-projection.ts";
import type { KpClaimSceneGraphBundle } from "./claim-scene-graphs.ts";
import { compileKpTutorialClaimPacedTimeline } from "./claim-paced-timeline.ts";
import { compileKpCrossViewAttentionPlan } from "./cross-view-attention.ts";
import type { KpCrossViewCorrespondenceMap } from "./cross-view-correspondence.ts";
import type { KpTutorialEpistemicNarration } from "./epistemic-narration.ts";
import {
  createKpHermeneuticTutorialModule,
  type KpHermeneuticTutorialModule
} from "./hermeneutic-module.ts";
import type { KpInterpretiveCycle } from "./interpretive-cycle.ts";

export const kpFtcTutorialModuleId = "tutorial.ftc.accumulator-derivative";
export const kpFtcTutorialClockId = "clock.ftc.accumulator-derivative.shared";

export interface KpFtcTutorialDefinition {
  readonly module: KpHermeneuticTutorialModule;
  readonly graphs: KpClaimSceneGraphBundle;
  readonly cycles: readonly KpInterpretiveCycle[];
  readonly correspondence: KpCrossViewCorrespondenceMap;
  readonly attention: ReturnType<typeof compileKpCrossViewAttentionPlan>;
  readonly narrations: readonly KpTutorialEpistemicNarration[];
  readonly timeline: ReturnType<typeof compileKpTutorialClaimPacedTimeline>;
  readonly accessibility: ReturnType<typeof compileKpTutorialAccessibilityFamily>;
  readonly promotion: KpArtifactPromotionFacet;
}

export interface KpFtcReintegrationFrame {
  readonly id: string;
  readonly stage: "finite-ratio" | "limit" | "identity";
  readonly latex: string;
  readonly persistentSelectorIds: readonly string[];
  readonly activeCorrespondenceIds: readonly string[];
  readonly proofStatus: "computation" | "proof-sketch";
}

const checkpoints = [
  ["checkpoint.ftc.whole", 0, "See accumulation as a whole"],
  ["checkpoint.ftc.accumulated-area", 0.14, "Move the upper bound"],
  ["checkpoint.ftc.finite-strip", 0.32, "Isolate the added strip"],
  ["checkpoint.ftc.convergence", 0.52, "Narrow the strip"],
  ["checkpoint.ftc.quotient", 0.72, "Relate area change to width"],
  ["checkpoint.ftc.reintegrate", 0.9, "Return to the theorem identity"]
] as const;

export function createKpFtcTutorialDefinition(): KpFtcTutorialDefinition {
  const module = createKpHermeneuticTutorialModule({
    id: kpFtcTutorialModuleId,
    version: 1,
    title: "When accumulated area becomes local change",
    clockId: kpFtcTutorialClockId,
    canonicalSceneIds: ["scene.ftc.accumulator-derivative"],
    views: [
      {
        id: "view.ftc.graph",
        kind: "graph",
        semanticObjectIds: ["graph.ftc.integrand", "region.ftc.area", "region.ftc.strip"],
        label: "Accumulation graph",
        primary: true,
        quietContext: false
      },
      {
        id: "view.ftc.equation",
        kind: "equation",
        semanticObjectIds: ["equation.ftc.accumulator", "equation.ftc.identity"],
        label: "Symbolic relation",
        primary: true,
        quietContext: false
      },
      {
        id: "view.ftc.narration",
        kind: "narration",
        semanticObjectIds: [],
        label: "Claim rail",
        primary: false,
        quietContext: true
      },
      {
        id: "view.ftc.controls",
        kind: "controls",
        semanticObjectIds: [],
        label: "Exploration controls",
        primary: false,
        quietContext: true
      }
    ],
    scenes: [
      {
        id: "scene.ftc.accumulator-derivative",
        title: "FTC Part I: accumulator derivative",
        viewIds: [
          "view.ftc.graph",
          "view.ftc.equation",
          "view.ftc.narration",
          "view.ftc.controls"
        ],
        checkpointIds: checkpoints.map(([id]) => id)
      }
    ],
    checkpoints: checkpoints.map(([id, progress, label]) => ({
      id,
      sceneId: "scene.ftc.accumulator-derivative",
      progress,
      viewIds: ["view.ftc.graph", "view.ftc.equation", "view.ftc.narration"],
      label
    }))
  });
  const graphs = createGraphs();
  const correspondence = createCorrespondence();
  const cycles = [createCycle()];
  const narrations = createNarrations();
  const timeline = compileKpTutorialClaimPacedTimeline({
    id: "timeline.ftc.claim-paced",
    clockId: kpFtcTutorialClockId,
    millisecondsPerUnit: 760,
    beatsPerUnit: 10,
    paces: [
      pace("whole", "claim.ftc.whole", "checkpoint.ftc.whole", 2),
      pace("area", "claim.ftc.accumulated-area", "checkpoint.ftc.accumulated-area", 2),
      pace("strip", "claim.ftc.finite-strip", "checkpoint.ftc.finite-strip", 3),
      pace("convergence", "claim.ftc.convergence", "checkpoint.ftc.convergence", 4),
      pace("quotient", "claim.ftc.quotient", "checkpoint.ftc.quotient", 3),
      pace("identity", "claim.ftc.identity", "checkpoint.ftc.reintegrate", 3)
    ]
  });
  const attention = compileKpCrossViewAttentionPlan({
    id: "attention.ftc.reintegration",
    map: correspondence,
    correspondenceIds: [
      "correspondence.ftc.strip-to-delta-area",
      "correspondence.ftc.height-to-integrand",
      "correspondence.ftc.graph-x-to-equation-x"
    ]
  });

  return {
    module,
    graphs,
    cycles,
    correspondence,
    attention,
    narrations,
    timeline,
    accessibility: compileKpTutorialAccessibilityFamily({
      id: "accessibility.ftc.accumulator-derivative",
      claimIds: graphs.claimGraph.nodes.map(({ id }) => id),
      checkpointIds: module.checkpoints.map(({ id }) => id),
      semanticIdentityIds: correspondence.identities.map(({ id }) => id),
      evidenceIds: graphs.claimGraph.nodes.flatMap(({ evidenceIds }) => evidenceIds),
      narrationIds: narrations.map(({ id }) => id)
    }),
    promotion: {
      maturity: "draft",
      novelty: "new-combination",
      humanReviewRequired: true,
      goldCohort: false
    }
  };
}

export function createKpFtcReintegrationFrames(): readonly KpFtcReintegrationFrame[] {
  const persistentSelectorIds = [
    "ftc.symbol.accumulator-A",
    "ftc.symbol.evaluation-x",
    "ftc.symbol.integrand-f-x"
  ];
  return [
    {
      id: "frame.ftc.reintegrate.finite-ratio",
      stage: "finite-ratio",
      latex: "\\frac{A(x+\\Delta x)-A(x)}{\\Delta x}",
      persistentSelectorIds,
      activeCorrespondenceIds: ["correspondence.ftc.strip-to-delta-area"],
      proofStatus: "computation"
    },
    {
      id: "frame.ftc.reintegrate.limit",
      stage: "limit",
      latex:
        "\\lim_{\\Delta x\\to 0}\\frac{A(x+\\Delta x)-A(x)}{\\Delta x}=f(x)",
      persistentSelectorIds,
      activeCorrespondenceIds: ["correspondence.ftc.height-to-integrand"],
      proofStatus: "proof-sketch"
    },
    {
      id: "frame.ftc.reintegrate.identity",
      stage: "identity",
      latex: "A'(x)=f(x)",
      persistentSelectorIds,
      activeCorrespondenceIds: ["correspondence.ftc.graph-x-to-equation-x"],
      proofStatus: "proof-sketch"
    }
  ];
}

function createGraphs(): KpClaimSceneGraphBundle {
  const claimIds = ["whole", "accumulated-area", "finite-strip", "convergence", "quotient", "identity"];
  return {
    claimGraph: {
      id: "claims.ftc.accumulator-derivative",
      nodes: [
        claim("whole", "A(x) records all accumulated area up to x."),
        claim("accumulated-area", "Moving x changes the accumulated region."),
        claim("finite-strip", "A finite added strip is bounded by rectangles.", ["evidence.ftc.strip-bounds"]),
        claim("convergence", "As Δx shrinks, the quotient bounds converge to f(x).", ["evidence.ftc.continuity-squeeze"]),
        claim("quotient", "The strip area divided by its width is the finite difference quotient."),
        claim("identity", "Under continuity, the accumulator's local rate is f(x).", ["evidence.ftc.limit"])
      ],
      edges: [
        claimEdge("area-from-whole", "accumulated-area", "whole", "depends-on"),
        claimEdge("strip-from-area", "finite-strip", "accumulated-area", "depends-on"),
        claimEdge("convergence-from-strip", "convergence", "finite-strip", "evidenced-by"),
        claimEdge("quotient-from-strip", "quotient", "finite-strip", "depends-on"),
        claimEdge("identity-reintegrates", "identity", "whole", "reintegrates")
      ]
    },
    sceneGraph: {
      id: "scene-graph.ftc.accumulator-derivative",
      nodes: [
        { id: "scene-node.ftc.graph", kind: "view" },
        { id: "scene-node.ftc.area", kind: "semantic-object", semanticObjectId: "region.ftc.area" },
        { id: "scene-node.ftc.strip", kind: "semantic-object", semanticObjectId: "region.ftc.strip" },
        { id: "scene-node.ftc.quotient", kind: "semantic-object", semanticObjectId: "equation.ftc.quotient" },
        { id: "scene-node.ftc.identity", kind: "semantic-object", semanticObjectId: "equation.ftc.identity" }
      ],
      edges: [
        sceneEdge("area", "scene-node.ftc.graph", "scene-node.ftc.area"),
        sceneEdge("strip", "scene-node.ftc.graph", "scene-node.ftc.strip")
      ]
    },
    bindings: claimIds.map((id) => ({
      id: `binding.ftc.${id}`,
      claimId: `claim.ftc.${id}`,
      sceneNodeIds: [
        id === "quotient"
          ? "scene-node.ftc.quotient"
          : id === "identity"
            ? "scene-node.ftc.identity"
            : id === "finite-strip" || id === "convergence"
              ? "scene-node.ftc.strip"
              : "scene-node.ftc.area"
      ],
      role: id === "finite-strip" || id === "convergence" ? "evidence" : "subject"
    }))
  };
}

function createCorrespondence(): KpCrossViewCorrespondenceMap {
  return {
    id: "cross-view.ftc.accumulator-derivative",
    members: [
      member("graph-x", "view.ftc.graph", "ftc.graph.upper-bound", "moving boundary x"),
      member("equation-x", "view.ftc.equation", "ftc.symbol.evaluation-x", "symbolic x"),
      member("strip", "view.ftc.graph", "ftc.graph.added-strip", "finite added area"),
      member("delta-area", "view.ftc.equation", "ftc.symbol.delta-area", "finite area change"),
      member("height", "view.ftc.graph", "ftc.graph.height-at-x", "graph height"),
      member("integrand", "view.ftc.equation", "ftc.symbol.integrand-f-x", "integrand value")
    ],
    identities: [
      { id: "identity.ftc.upper-bound-x", meaning: "The same chosen x in graph and symbols.", memberIds: ["member.ftc.graph-x", "member.ftc.equation-x"] },
      { id: "identity.ftc.finite-area-change", meaning: "The same finite added area in graph and numerator.", memberIds: ["member.ftc.strip", "member.ftc.delta-area"] },
      { id: "identity.ftc.local-height", meaning: "The graph height and symbolic f(x) name one value.", memberIds: ["member.ftc.height", "member.ftc.integrand"] }
    ],
    correspondences: [
      correspondence("graph-x-to-equation-x", "graph-x", "equation-x", "representation-to-representation", true, "Carry the moving graph boundary into every symbolic x."),
      correspondence("strip-to-delta-area", "strip", "delta-area", "evidence-to-claim", false, "Carry the persistent strip area into ΔA."),
      correspondence("height-to-integrand", "height", "integrand", "evidence-to-claim", false, "Carry the converged graph height into f(x).")
    ]
  };
}

function createCycle(): KpInterpretiveCycle {
  return {
    id: "cycle.ftc.accumulator-derivative",
    title: "Read accumulation through a local strip and back",
    phases: [
      phase("establish-whole", "whole", "whole"),
      phase("isolate-part", "finite-strip", "finite-strip"),
      phase("relate", "quotient", "quotient"),
      phase("reintegrate", "identity", "reintegrate")
    ]
  };
}

function createNarrations(): readonly KpTutorialEpistemicNarration[] {
  return [
    narration("whole", "Read A(x) first as a whole: every sliver from 0 through x contributes to the filled region.", "intuition", "generic", "none", "This is the defining accumulation interpretation."),
    narration("accumulated-area", "Moving x grows the same region rather than replacing it with a new picture.", "example", "exact-example", "none", "The selected lens makes the area exact."),
    narration("finite-strip", "For a finite Δx, the added strip lies between honest lower and upper rectangles.", "proof-sketch", "generic", "bounded", "These are finite bounds, not yet the derivative."),
    narration("convergence", "Continuity makes those height bounds close around f(x) as the strip narrows.", "proof-sketch", "generic", "qualitative", "The display illustrates the squeeze; it does not replace a formal ε–δ proof."),
    narration("quotient", "Dividing the same strip area by its same width produces a finite average rate.", "computation", "generic", "bounded", "Δx remains nonzero in this frame."),
    narration("identity", "At the limiting step, the local rate of accumulated area is the graph height f(x).", "proof-sketch", "generic", "none", "Continuity is the stated theorem assumption.")
  ];
}

function claim(id: string, statement: string, evidenceIds: readonly string[] = []) {
  return { id: `claim.ftc.${id}`, statement, evidenceIds };
}

function claimEdge(id: string, source: string, target: string, relation: "depends-on" | "evidenced-by" | "reintegrates") {
  return { id: `claim-edge.ftc.${id}`, sourceClaimId: `claim.ftc.${source}`, targetClaimId: `claim.ftc.${target}`, relation } as const;
}

function sceneEdge(id: string, parentNodeId: string, childNodeId: string) {
  return { id: `scene-edge.ftc.${id}`, parentNodeId, childNodeId };
}

function member(id: string, viewId: string, selectorId: string, role: string) {
  return { id: `member.ftc.${id}`, viewId, selectorId, role };
}

function correspondence(id: string, source: string, target: string, kind: "evidence-to-claim" | "representation-to-representation", reversible: boolean, summary: string) {
  return { id: `correspondence.ftc.${id}`, sourceMemberId: `member.ftc.${source}`, targetMemberId: `member.ftc.${target}`, kind, reversible, summary } as const;
}

function phase(kind: "establish-whole" | "isolate-part" | "relate" | "reintegrate", claimId: string, checkpointId: string) {
  return { id: `phase.ftc.${kind}`, kind, claimIds: [`claim.ftc.${claimId}`], checkpointIds: [`checkpoint.ftc.${checkpointId}`], focusBindingIds: [`binding.ftc.${claimId}`] };
}

function pace(id: string, claimId: string, checkpointId: string, units: number) {
  return { id: `pace.ftc.${id}`, claimId, checkpointId, units };
}

function narration(id: string, text: string, proofStatus: KpTutorialEpistemicNarration["proofStatus"], generality: KpTutorialEpistemicNarration["scope"]["generality"], uncertaintyKind: KpTutorialEpistemicNarration["uncertainty"]["kind"], uncertaintyStatement: string): KpTutorialEpistemicNarration {
  return {
    id: `narration.ftc.${id}`,
    claimId: `claim.ftc.${id}`,
    text,
    proofStatus,
    scope: { generality, domain: "continuous real-valued functions on a closed interval", assumptions: ["f is continuous near x"] },
    validity: { status: "valid", explanation: "Valid within the displayed continuity-qualified model." },
    provenance: [{ id: `provenance.ftc.${id}`, kind: proofStatus === "computation" ? "computation" : "derivation", label: `FTC ${id} authored evidence` }],
    uncertainty: { kind: uncertaintyKind, statement: uncertaintyStatement }
  };
}
