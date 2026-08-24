import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpCodeSourceDomOpticalProfile,
  kpCodePaintRoleDefinitions,
  kpCodePaintRoleFamilies,
  kpCodeSourceDomOpticalProfile,
  projectKpCodeDomOpticalEndpoint,
  selectKpCodePaintRoleDefinitions
} from "../src/rendering/code-source-dom-optical-profile.ts";
import { kpPythonRefactorPaintRoleContract } from
  "../src/rendering/python-refactor-paint-role-contract.ts";
import { kpTypeScriptRefactorPaintRoleContract } from
  "../src/rendering/typescript-refactor-paint-role-contract.ts";

test("the promoted DOM profile owns exact roles and independent theme endpoints", () => {
  const profile = kpCodeSourceDomOpticalProfile;
  assert.equal(profile.rendererKind, "dom-source");
  assert.equal(profile.themeAuthority, "explicit-host");
  assert.deepEqual(
    [...new Set(profile.roleDefinitions.map(({ family }) => family))].sort(),
    [...kpCodePaintRoleFamilies].sort()
  );
  assert.deepEqual(
    Object.keys(profile.endpoints.dark.values).sort(),
    kpCodePaintRoleDefinitions.map(({ id }) => id).sort()
  );
  assert.notDeepEqual(
    profile.endpoints.dark.values,
    profile.endpoints.light.values
  );
  assert.equal(profile.endpoints.light.values["surface.panel"], "#fbfaf7");
  assert.equal(
    profile.endpoints.light.values["withdrawal.filter"],
    "grayscale(0.32) opacity(0.72)"
  );
});

test("language contracts project one profile through explicit capabilities", () => {
  assert.equal(
    kpTypeScriptRefactorPaintRoleContract.profileId,
    kpCodeSourceDomOpticalProfile.id
  );
  assert.equal(
    kpPythonRefactorPaintRoleContract.profileId,
    kpCodeSourceDomOpticalProfile.id
  );
  assert.equal(
    kpTypeScriptRefactorPaintRoleContract.slots.length,
    kpPythonRefactorPaintRoleContract.slots.length + 1
  );
  assert.equal(
    kpTypeScriptRefactorPaintRoleContract.syntaxSlots.property.id,
    "syntax.property"
  );
  assert.equal("property" in kpPythonRefactorPaintRoleContract.syntaxSlots,
    false);
});

test("endpoint projection preserves caller namespaces and focus inputs", () => {
  const projected = projectKpCodeDomOpticalEndpoint({
    endpoint: kpCodeSourceDomOpticalProfile.endpoints.light,
    slots: kpPythonRefactorPaintRoleContract.slots,
    focusShadowAlphaProperty: "--kp-python-focus-shadow-alpha"
  });
  assert.equal(projected["--kp-python-paint-surface-panel"], "#fbfaf7");
  assert.match(
    projected["--kp-python-paint-focus-halo"] ?? "",
    /var\(--kp-python-focus-shadow-alpha, 0\)/u
  );
  assert.doesNotMatch(JSON.stringify(projected), /--kp-code-focus-shadow-alpha/u);
  assert.ok(Object.keys(projected).every((property) =>
    property.startsWith("--kp-python-paint-")));
});

test("profile and language capability validation fail closed", () => {
  assert.throws(() => selectKpCodePaintRoleDefinitions([
    "keyword",
    "keyword"
  ]), /unique supported subset/u);

  const profile = kpCodeSourceDomOpticalProfile;
  const darkValues = { ...profile.endpoints.dark.values };
  Reflect.deleteProperty(darkValues, "focus.wash");
  assert.throws(() => createKpCodeSourceDomOpticalProfile({
    ...profile,
    endpoints: {
      ...profile.endpoints,
      dark: { ...profile.endpoints.dark, values: darkValues }
    }
  }), /dark endpoint roles must have exact coverage/u);
});
