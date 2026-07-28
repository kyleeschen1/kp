import { createKpOpaqueFractionFanOutFixture } from "./fraction-fan-out-fixture.ts";
import { bindKpStructuredExpressionRoles } from "./structured-expression-role-binding.ts";
import {
  kpDistributionRewriteRoleIds,
  kpDistributionRewriteRoleSpecs,
  verifyKpDistributionRewrite,
  type KpStructuredExpressionRewriteDiagnostic
} from "./structured-expression-rewrite.ts";
import type { KpStructuredExpression } from "./structured-expression.ts";

const verifiedFractionFactoringRewriteAuthority = Symbol(
  "kp.verified-fraction-factoring-rewrite"
);

export interface KpVerifiedFractionFactoringRewrite {
  readonly schemaVersion: "kp.verified-fraction-factoring-rewrite.v1";
  readonly lawId: "kp.algebra.factor.v1";
  readonly reverseLawId: "kp.algebra.distribute.v1";
  readonly sourceRootId: string;
  readonly targetRootId: string;
  readonly lineage: readonly {
    readonly relation: "fan-in" | "preserve";
    readonly sourceSubtreeIds: readonly string[];
    readonly targetSubtreeIds: readonly string[];
  }[];
  // Inverse authority is minted only after the forward distribution verifier succeeds.
  readonly [verifiedFractionFactoringRewriteAuthority]: true;
}

export type KpFractionFactoringVerificationResult =
  | {
      readonly ok: true;
      readonly verification: KpVerifiedFractionFactoringRewrite;
      readonly diagnostics: readonly [];
    }
  | {
      readonly ok: false;
      readonly diagnostics: readonly KpStructuredExpressionRewriteDiagnostic[];
    };

export function verifyKpFractionReverseFactoring(input: {
  readonly distributed: KpStructuredExpression;
  readonly factored: KpStructuredExpression;
}): KpFractionFactoringVerificationResult {
  const bindings = bindKpStructuredExpressionRoles({
    contractId: "kp.fraction.reverse-factoring.v1",
    // The existing distribution verifier is the authority for the inverse:
    // a factoring step is lawful only when redistributing its target exactly
    // reconstructs the authored source, including every opaque descendant.
    expressions: { source: input.factored, target: input.distributed },
    roles: kpDistributionRewriteRoleSpecs,
    bindings: {
      [kpDistributionRewriteRoleIds.sourceRoot]: input.factored.root.id,
      [kpDistributionRewriteRoleIds.commonFactor]: "fraction-fan-out.source.factor",
      [kpDistributionRewriteRoleIds.sourceGroupedSum]: "fraction-fan-out.source.grouped-sum",
      [kpDistributionRewriteRoleIds.sourceAddends]: [
        "fraction-fan-out.source.addend.x",
        "fraction-fan-out.source.addend.6"
      ],
      [kpDistributionRewriteRoleIds.targetRoot]: input.distributed.root.id,
      [kpDistributionRewriteRoleIds.distributedTerms]: [
        "fraction-fan-out.target.term.x",
        "fraction-fan-out.target.term.6"
      ],
      [kpDistributionRewriteRoleIds.factorCopies]: [
        "fraction-fan-out.target.factor.x",
        "fraction-fan-out.target.factor.6"
      ],
      [kpDistributionRewriteRoleIds.distributedAddends]: [
        "fraction-fan-out.target.addend.x",
        "fraction-fan-out.target.addend.6"
      ]
    }
  });
  const forward = verifyKpDistributionRewrite(bindings);
  if (!forward.ok) {
    return Object.freeze({
      ok: false as const,
      diagnostics: Object.freeze(forward.diagnostics.map((diagnostic) => Object.freeze({
        ...diagnostic,
        path: `reverse.${diagnostic.path}`
      })))
    });
  }

  return Object.freeze({
    ok: true as const,
    diagnostics: Object.freeze([]) as readonly [],
    verification: Object.freeze({
      schemaVersion: "kp.verified-fraction-factoring-rewrite.v1" as const,
      lawId: "kp.algebra.factor.v1" as const,
      reverseLawId: forward.verification.lawId,
      sourceRootId: forward.verification.targetRootId,
      targetRootId: forward.verification.sourceRootId,
      lineage: Object.freeze(forward.verification.lineage.map((entry) => Object.freeze({
        relation: entry.relation === "fan-out" ? "fan-in" as const : "preserve" as const,
        sourceSubtreeIds: Object.freeze([...entry.targetSubtreeIds]),
        targetSubtreeIds: Object.freeze([...entry.sourceSubtreeIds])
      }))),
      [verifiedFractionFactoringRewriteAuthority]: true as const
    })
  });
}

export function createKpVerifiedFractionFactoringFixture(): {
  readonly distributed: KpStructuredExpression;
  readonly factored: KpStructuredExpression;
  readonly verification: KpVerifiedFractionFactoringRewrite;
} {
  const fanOut = createKpOpaqueFractionFanOutFixture();
  const result = verifyKpFractionReverseFactoring({
    distributed: fanOut.target,
    factored: fanOut.source
  });
  if (!result.ok) {
    throw new Error(result.diagnostics.map(({ path, message }) => `${path}: ${message}`).join("\n"));
  }
  return Object.freeze({
    distributed: fanOut.target,
    factored: fanOut.source,
    verification: result.verification
  });
}
