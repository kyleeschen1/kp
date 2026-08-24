import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpTypeScriptRefactorPaintRoleContract,
  kpTypeScriptRefactorPaintRoleContract,
  kpTypeScriptRefactorPaintRoleFamilies
} from "../src/rendering/typescript-refactor-paint-role-contract.ts";
import { renderKpTypeScriptRefactorCodeHtml } from
  "../src/rendering/typescript-refactor-code-html.ts";
import { createKpTypeScriptFreeShippingAnimationAsset } from
  "../src/semantic/typescript-free-shipping-animation-asset.ts";
import { kpCodeSyntaxRoles } from
  "../src/semantic/code-source-token-protocol.ts";

test("TypeScript paint roles inventory every optical concern without palette values", () => {
  const contract = kpTypeScriptRefactorPaintRoleContract;

  assert.deepEqual(contract.families, kpTypeScriptRefactorPaintRoleFamilies);
  assert.deepEqual(Object.keys(contract.syntaxSlots), [...kpCodeSyntaxRoles]);
  assert.equal(contract.themeAuthority, "explicit-host");
  assert.equal(contract.profileId, "kp.code-source-dom-optical-profile.v1");
  assert.equal(new Set(contract.slots.map(({ id }) => id)).size,
    contract.slots.length);
  assert.equal(new Set(contract.slots.map(({ cssProperty }) => cssProperty)).size,
    contract.slots.length);
  assert.ok(contract.slots.every(({ cssProperty }) =>
    cssProperty.startsWith("--kp-typescript-paint-")));
  assert.doesNotMatch(JSON.stringify(contract), /#[0-9a-f]{3,8}|rgb\(/iu);
});

test("syntax paint remains exhaustive and separate from semantic identity", () => {
  for (const role of kpCodeSyntaxRoles) {
    const paintSlot = kpTypeScriptRefactorPaintRoleContract.syntaxSlots[role];
    assert.equal(paintSlot.id, `syntax.${role}`);
    assert.equal(paintSlot.family, "syntax");
    assert.equal(paintSlot.channel, "color");
  }

  const artifact = createKpTypeScriptFreeShippingAnimationAsset();
  const html = renderKpTypeScriptRefactorCodeHtml({
    semantics: artifact.semantics,
    stageId: artifact.score.stages[0]!.id,
    narration: artifact.score.stages[0]!.narration,
    activeProjectionId: "projection.typescript.before",
    focusSelectorIds: [],
    accessibleDescription: artifact.accessibility.description
  });
  assert.match(html,
    /data-kp-typescript-paint-contract="kp\.typescript-refactor-paint-roles\.v1"/u);
  assert.match(html,
    /data-kp-code-optical-profile="kp\.code-source-dom-optical-profile\.v1"/u);
  assert.match(html, /data-kp-semantic-entity-id=/u);
  assert.match(html, /data-kp-typescript-focus="false"/u);
});

test("paint-role validation fails closed on incomplete family coverage", () => {
  const contract = kpTypeScriptRefactorPaintRoleContract;
  assert.throws(() => createKpTypeScriptRefactorPaintRoleContract({
    ...contract,
    families: contract.families.slice(1)
  }), /paint-role families must have exact coverage/u);
});
