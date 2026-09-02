import assert from "node:assert/strict";
import test from "node:test";

import { kpJacobianConstructDescriptor } from "../src/math/authoring/construct-descriptor.ts";
import {
  assessKpElaboratedFunctionCapabilities
} from "../src/math/authoring/elaboration-capabilities.ts";
import { elaborateKpTypedLatexFunction } from "../src/math/typed-latex-elaborator.ts";
import { createKpScalarParameter } from "../src/math/typed-semantic-math.ts";

test("parsed affine functions retain values and spans without invented authority", () => {
  const x = createKpScalarParameter({ id: "kp.elaboration.x", name: "x" });
  const y = createKpScalarParameter({ id: "kp.elaboration.y", name: "y" });
  const elaboration = elaborateKpTypedLatexFunction({
    id: "kp.elaboration.affine",
    sourceId: "lesson://affine/source",
    revisionId: "revision-7",
    latex: String.raw`f(x,y)=\begin{bmatrix}2*x+y\\x-3*y\end{bmatrix}`,
    parameters: [x, y] as const
  });

  assert.equal(elaboration.status, "elaborated");
  if (elaboration.status !== "elaborated") return;
  const result = assessKpElaboratedFunctionCapabilities({
    elaboration,
    descriptor: kpJacobianConstructDescriptor,
    form: "expanded",
    requireUnits: true
  });

  assert.equal(result.status, "repair-required");
  assert.equal(result.value, elaboration.value);
  assert.equal(result.sourceSpans, elaboration.sourceSpans);
  assert.deepEqual(result.gaps.map(({ code }) => code), [
    "kp.elaboration.domain-space-required",
    "kp.elaboration.codomain-space-required",
    "kp.elaboration.domain-basis-required",
    "kp.elaboration.codomain-basis-required",
    "kp.elaboration.domain-unit-required",
    "kp.elaboration.codomain-unit-required",
    "kp.elaboration.static-shape-required"
  ]);
  assert.equal(result.gaps.every(
    ({ sourceSpan }) => sourceSpan?.sourceId === "lesson://affine/source"
  ), true);
  assert.equal(result.gaps.every(
    ({ sourceSpan }) => sourceSpan === elaboration.sourceSpans[0]
  ), true);
  assert.deepEqual(result.authorityIds, []);
});

test("explicit authority references close only the gaps they actually cover", () => {
  const x = createKpScalarParameter({ id: "kp.elaboration.ready.x", name: "x" });
  const elaboration = elaborateKpTypedLatexFunction({
    id: "kp.elaboration.ready",
    sourceId: "lesson://ready/source",
    latex: String.raw`f(x)=\begin{bmatrix}2*x\end{bmatrix}`,
    parameters: [x] as const
  });
  assert.equal(elaboration.status, "elaborated");
  if (elaboration.status !== "elaborated") return;
  const result = assessKpElaboratedFunctionCapabilities({
    elaboration,
    descriptor: kpJacobianConstructDescriptor,
    form: "expanded",
    requireUnits: true,
    authority: {
      domainSpace: { id: "kp.space.explicit.domain" },
      codomainSpace: { id: "kp.space.explicit.codomain" },
      domainBasis: { id: "kp.basis.explicit.domain" },
      codomainBasis: { id: "kp.basis.explicit.codomain" },
      domainUnit: { id: "kp.unit.explicit.domain" },
      codomainUnit: { id: "kp.unit.explicit.codomain" },
      staticShape: { id: "kp.shape.explicit.1x1" }
    }
  });

  assert.equal(result.status, "ready");
  assert.deepEqual(result.gaps, []);
  assert.deepEqual(result.authorityIds, [
    "kp.basis.explicit.codomain",
    "kp.basis.explicit.domain",
    "kp.shape.explicit.1x1",
    "kp.space.explicit.codomain",
    "kp.space.explicit.domain",
    "kp.unit.explicit.codomain",
    "kp.unit.explicit.domain"
  ]);
});
