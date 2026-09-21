import ts from "typescript";
import { createCentroidMotion } from "../src/animation/centroid-extraction-motion.ts";
import { renderCentroidNativeCode } from "../src/rendering/centroid-native-code-html.ts";
import { encodeKpHtmlAttribute as attribute } from "../src/rendering/html-output-encoding.ts";

/** Project the checked exemplar's call/declaration roles into native source.
 * Parsing locates their spans; it does not issue new refactoring authority. */
export function renderCentroidRelationPublication() {
  const generated = createCentroidMotion().artifact;
  const state = generated.states[2]!;
  const file = ts.createSourceFile("centroid.ts", state.source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const helper = file.statements[0], caller = file.statements[1];
  if (!helper || !ts.isFunctionDeclaration(helper) || !helper.name || !caller || !ts.isVariableStatement(caller)) throw new Error("Centroid relation needs repair: missing checked helper/caller");
  const call = caller.declarationList.declarations[0]?.initializer;
  if (!call || !ts.isCallExpression(call) || !ts.isIdentifier(call.expression) || call.expression.text !== helper.name.text) throw new Error("Centroid relation needs repair: call does not name its helper");
  const contract = generated.causalContract;
  const callRole = contract.contributors.find(role => role.sourceContributorRoleId === "role.centroid.x.calculation")?.targetCallRoleId;
  if (!callRole) throw new Error("Centroid relation needs repair: missing contributor role");
  const fragment = (start: number, end: number) => renderCentroidNativeCode({ source: state.source.slice(start, end), tokens: state.tokens.filter(token => token.startOffset >= start && token.endOffset <= end).map(token => ({ ...token, startOffset: token.startOffset - start, endOffset: token.endOffset - start })) });
  const native = fragment(0, helper.getStart()) + `<span data-centroid-relation-helper data-relation-role="${attribute(contract.introducedHelper.declarationRoleId)}">${fragment(helper.getStart(), helper.end)}</span>` + fragment(helper.end, call.getStart()) + `<button type="button" data-centroid-relation-call data-relation-role="${attribute(callRole)}" aria-label="Inspect how mean(xs) uses the helper" aria-pressed="false" aria-controls="centroid-caller-explanation" disabled>${fragment(call.getStart(), call.end)}</button>` + fragment(call.end, state.source.length);
  return `<section class="centroid-relation" data-centroid-relation data-centroid-source-pin="${generated.sourcePin}" hidden aria-label="Inspect caller and helper">
    <h3>One procedure, used here</h3>
    <div class="centroid-relation-note" id="centroid-caller-explanation" aria-live="polite">
      <p data-relation-note="idle">The helper takes an array and returns its average. Select <code>mean(xs)</code> in the code to inspect how this caller uses it.</p>
      <p data-relation-note="selected" aria-hidden="true">This call supplies <code>xs</code> to the helper. The helper owns the sum, loop and division; its returned average becomes the caller’s <code>cx</code>. The procedure is reusable, while this caller gives the answer its meaning.</p>
      <p data-relation-note="before" aria-hidden="true">Before extraction, the sum, loop and division all sit in the caller. They produce the same <code>cx</code>. Return to the helper to recover the relationship you were inspecting.</p>
    </div>
    <div class="centroid-relation-source">
      <pre class="kp-typescript-refactor__revision" data-relation-source="after"><code>${native}</code></pre>
      <pre class="kp-typescript-refactor__revision" data-relation-source="before" aria-hidden="true" inert><code>${renderCentroidNativeCode(generated.states[0]!)}</code></pre>
    </div>
    <div class="code-controls"><button type="button" data-centroid-relation-before aria-pressed="false">Show before extraction</button><button type="button" data-centroid-relation-clear disabled>Clear selection</button></div>
    <p data-centroid-relation-status class="centroid-attention-description" role="status"></p>
  </section>`;
}
