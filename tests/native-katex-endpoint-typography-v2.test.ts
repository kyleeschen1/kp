import assert from "node:assert/strict";
import test from "node:test";
import {
  compileKpEquationGrammarV2,
  type KpEquationGrammarV2Input
} from "../src/domain-ir/equation-grammar-v2.ts";
import {
  resolveKpEquationTypographyV2,
  type KpResolvedEquationTypographyV2
} from "../src/domain-ir/equation-typography-policy-v2.ts";
import {
  assertKpNativeKatexEndpointHydrationV2,
  compileKpNativeKatexEndpointParametersV2,
  renderKpNativeKatexEndpointV2
} from "../src/rendering/native-katex-endpoint-typography-v2.ts";

test("native KaTeX endpoints derive rendering only from resolved typography", () => {
  const inline = compileKpNativeKatexEndpointParametersV2({
    typography: resolved("typography.equation.inline.v2")
  });
  const stage = compileKpNativeKatexEndpointParametersV2({
    typography: resolved("typography.equation.stage.v2")
  });
  assert.equal(inline.displayMode, false);
  assert.equal(inline.mathStyle, "text");
  assert.equal(stage.displayMode, true);
  assert.equal(stage.mathStyle, "display");
  assert.notEqual(
    inline.typographyCacheIdentity.key,
    stage.typographyCacheIdentity.key
  );

  const renderedInline = renderKpNativeKatexEndpointV2({
    latex: "x+1",
    parameters: inline
  });
  const renderedStage = renderKpNativeKatexEndpointV2({
    latex: "x+1",
    parameters: stage
  });
  assert.match(renderedInline.renderedLatex, /\\textstyle/);
  assert.match(renderedStage.renderedLatex, /\\displaystyle/);
  assert.match(renderedInline.html, /^<span/);
  assert.match(renderedStage.html, /^<span class="katex-display"/);
  assert.notEqual(renderedInline.cacheKey, renderedStage.cacheKey);
});

test("SSR and client hydration share an exact typography-aware identity", () => {
  const parameters = compileKpNativeKatexEndpointParametersV2({
    typography: resolved("typography.equation.stage.v2")
  });
  const server = renderKpNativeKatexEndpointV2({ latex: "x^2", parameters });
  const client = renderKpNativeKatexEndpointV2({ latex: "x^2", parameters });
  assert.equal(server.hydrationKey, client.hydrationKey);
  assert.strictEqual(assertKpNativeKatexEndpointHydrationV2({
    server,
    client
  }), client);

  const inline = renderKpNativeKatexEndpointV2({
    latex: "x^2",
    parameters: compileKpNativeKatexEndpointParametersV2({
      typography: resolved("typography.equation.inline.v2")
    })
  });
  assert.throws(() => assertKpNativeKatexEndpointHydrationV2({
    server,
    client: inline
  }), /incompatible typography or LaTeX/);
});

function resolved(
  policyId: `typography.equation.${string}`
): KpResolvedEquationTypographyV2 {
  const compiled = compileKpEquationGrammarV2(fixture(policyId));
  assert.equal(compiled.status, "compiled");
  if (compiled.status !== "compiled") throw new Error("Fixture failed.");
  const result = resolveKpEquationTypographyV2({ grammar: compiled.grammar });
  assert.equal(result.status, "resolved");
  if (result.status !== "resolved") throw new Error("Fixture failed.");
  return result.typography[0]!;
}

function fixture(
  typographyPolicyId: `typography.equation.${string}`
): KpEquationGrammarV2Input {
  return {
    schemaVersion: "kp.equation-grammar.v2",
    id: "grammar.equation.endpoint-typography",
    assetId: "animation.equation.endpoint-typography",
    policyEpochId: "policy.animation.governance-v2.preview.1",
    semanticSource: {
      sourceId: "source.endpoint-typography",
      revisionId: "revision.1",
      operationPacks: [{ packId: "kp.core", version: "1.0.0" }]
    },
    clock: { authority: "kp.shared-normalized-clock.v1" },
    states: [{
      id: "state.0",
      objectIds: ["object.0"],
      entityIds: ["entity.x"]
    }, {
      id: "state.1",
      objectIds: ["object.1"],
      entityIds: ["entity.x"]
    }],
    transitions: [{
      id: "transition.0",
      transformationId: "transformation.0",
      sourceStateId: "state.0",
      targetStateId: "state.1",
      operation: {
        operationId: "kp.core.persist",
        semanticClass: "transformation",
        roleBindings: { before: ["entity.x"], after: ["entity.x"] },
        correspondenceMap: {
          id: "correspondence.0",
          records: [{
            id: "record.0",
            relation: "identity",
            sourceSelectorIds: ["entity.x"],
            targetSelectorIds: ["entity.x"],
            summary: "Persist x."
          }]
        },
        semanticAuthorityIds: ["law.fixture.persistence"]
      },
      projection: { intent: "replacement" },
      typographyPolicyId,
      typographyRequirements: { largeOperators: [] },
      teachingIntent: {
        kind: "notice",
        primaryEntityIds: ["entity.x"],
        secondaryEntityIds: [],
        summary: "Render x."
      }
    }]
  };
}
