import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpPythonRefactorPaintRoleContract,
  kpPythonRefactorPaintRoleContract,
  kpPythonRefactorPaintRoleFamilies,
  kpPythonRefactorSyntaxRoles
} from "../src/rendering/python-refactor-paint-role-contract.ts";
import { renderKpPythonRefactorCodeHtml } from
  "../src/rendering/python-refactor-code-html.ts";
import { createKpPythonFreeShippingAnimationAsset } from
  "../src/semantic/python-free-shipping-animation-asset.ts";
import { kpCodeSyntaxRoles } from
  "../src/semantic/code-source-token-protocol.ts";

test("Python inventories the approved paint families with one language exception", () => {
  const contract = kpPythonRefactorPaintRoleContract;

  assert.deepEqual(contract.families, kpPythonRefactorPaintRoleFamilies);
  assert.deepEqual(Object.keys(contract.syntaxSlots),
    [...kpPythonRefactorSyntaxRoles]);
  assert.deepEqual(
    kpCodeSyntaxRoles.filter((role) => !(role in contract.syntaxSlots)),
    ["property"]
  );
  assert.equal(contract.themeAuthority, "explicit-host");
  assert.equal(new Set(contract.slots.map(({ id }) => id)).size,
    contract.slots.length);
  assert.equal(new Set(contract.slots.map(({ cssProperty }) => cssProperty)).size,
    contract.slots.length);
  assert.ok(contract.slots.every(({ cssProperty }) =>
    cssProperty.startsWith("--kp-python-paint-")));
  assert.doesNotMatch(JSON.stringify(contract), /#[0-9a-f]{3,8}|rgb\(/iu);
});

test("Python syntax paint stays exhaustive and separate from semantic identity", () => {
  for (const role of kpPythonRefactorSyntaxRoles) {
    const paintSlot = kpPythonRefactorPaintRoleContract.syntaxSlots[role];
    assert.equal(paintSlot.id, `syntax.${role}`);
    assert.equal(paintSlot.family, "syntax");
    assert.equal(paintSlot.channel, "color");
  }

  const artifact = createKpPythonFreeShippingAnimationAsset();
  const html = renderKpPythonRefactorCodeHtml({
    semantics: artifact.semantics,
    stageId: artifact.score.stages[0]!.id,
    narration: artifact.score.stages[0]!.narration,
    activeProjectionId: "projection.python.before",
    focusSelectorIds: [],
    accessibleDescription: artifact.accessibility.description
  });
  assert.match(html,
    /data-kp-python-paint-contract="kp\.python-refactor-paint-roles\.v1"/u);
  assert.match(html, /data-kp-semantic-entity-id=/u);
  assert.match(html, /data-kp-python-focus="false"/u);
});

test("Python paint-role validation fails closed on incomplete family coverage", () => {
  const contract = kpPythonRefactorPaintRoleContract;
  assert.throws(() => createKpPythonRefactorPaintRoleContract({
    ...contract,
    families: contract.families.slice(1)
  }), /paint-role families must have exact coverage/u);
});
