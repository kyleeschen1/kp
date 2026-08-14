import { kpEigenvectorAttentionalFixture } from "./eigenvector-math.ts";
import type { KpEigenvectorEquationForm } from "./eigenvector-endpoints.ts";

export interface KpEigenvectorEquationToken {
  readonly id: string;
  readonly latex: string;
  readonly role: "operator" | "vector" | "relation" | "scale" | "space";
  readonly semanticObjectId: string;
}

export interface KpEigenvectorEquationEndpoint {
  readonly form: KpEigenvectorEquationForm;
  readonly latex: string;
  readonly tokens: readonly KpEigenvectorEquationToken[];
}

export interface KpEigenvectorGeometryEquationHandoff {
  readonly semanticObjectId: string;
  readonly sourceRepresentationId: "diagram.vector.v";
  readonly targetRepresentationIds: readonly [
    "equation.Av3v.v-input",
    "equation.Av3v.v-output"
  ];
  readonly sourceCoordinates: readonly [number, number];
  readonly destination: "equation.Av3v";
}

export interface KpEigenvectorDefinitionHandoff {
  readonly semanticObjectId: string;
  readonly sourceTokenId: "equation.Av3v.3";
  readonly targetTokenId: "equation.Avlambdav.lambda";
  readonly retainedSemanticObjectIds: readonly [string, string, string];
  readonly meaning: "replace-observed-scale-with-general-eigenvalue";
}

const fixture = kpEigenvectorAttentionalFixture;
const relationId = "eigenvector-demo/relation/Av-lambda-v";
const eigenvalueId = "eigenvector-demo/eigenvalue/lambda-3";

export function projectKpEigenvectorEquation(
  form: KpEigenvectorEquationForm
): KpEigenvectorEquationEndpoint {
  if (form === "none") {
    return { form, latex: "", tokens: [] };
  }
  if (form === "Av=3v") {
    return {
      form,
      latex: String.raw`A\mathbf{v}=3\mathbf{v}`,
      tokens: [
        token("equation.Av3v.A", "A", "operator", fixture.transformation.id),
        token("equation.Av3v.v-input", String.raw`\mathbf{v}`, "vector", fixture.persistentVector.id),
        token("equation.Av3v.equals", "=", "relation", relationId),
        token("equation.Av3v.3", "3", "scale", eigenvalueId),
        token("equation.Av3v.v-output", String.raw`\mathbf{v}`, "vector", fixture.persistentVector.id)
      ]
    };
  }
  if (form === "Av=lambda-v") {
    return {
      form,
      latex: String.raw`A\mathbf{v}=\lambda\mathbf{v}`,
      tokens: [
        token("equation.Avlambdav.A", "A", "operator", fixture.transformation.id),
        token("equation.Avlambdav.v-input", String.raw`\mathbf{v}`, "vector", fixture.persistentVector.id),
        token("equation.Avlambdav.equals", "=", "relation", relationId),
        token("equation.Avlambdav.lambda", String.raw`\lambda`, "scale", eigenvalueId),
        token("equation.Avlambdav.v-output", String.raw`\mathbf{v}`, "vector", fixture.persistentVector.id)
      ]
    };
  }
  throw new Error(`Equation form ${form} is not available yet.`);
}

export function projectKpEigenvectorGeometryEquationHandoff():
KpEigenvectorGeometryEquationHandoff {
  return {
    semanticObjectId: fixture.persistentVector.id,
    sourceRepresentationId: "diagram.vector.v",
    targetRepresentationIds: [
      "equation.Av3v.v-input",
      "equation.Av3v.v-output"
    ],
    sourceCoordinates: fixture.persistentVector.image,
    destination: "equation.Av3v"
  };
}

export function projectKpEigenvectorDefinitionHandoff():
KpEigenvectorDefinitionHandoff {
  return {
    semanticObjectId: eigenvalueId,
    sourceTokenId: "equation.Av3v.3",
    targetTokenId: "equation.Avlambdav.lambda",
    retainedSemanticObjectIds: [
      fixture.transformation.id,
      fixture.persistentVector.id,
      relationId
    ],
    meaning: "replace-observed-scale-with-general-eigenvalue"
  };
}

function token(
  id: string,
  latex: string,
  role: KpEigenvectorEquationToken["role"],
  semanticObjectId: string
): KpEigenvectorEquationToken {
  return { id, latex, role, semanticObjectId };
}
